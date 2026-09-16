import { apiClient } from '@/lib/http/apiClient';
import type { User, UserPresence } from '../user.types';
import type { ApiResponse } from '@/types/api.types';
import type {
  AvatarUploadSignature,
  CloudinaryUploadResponse,
} from '../avatar.types';

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data;
  },

  searchUsers: async (keyword: string): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', {
      params: { keyword }
    });
    return response.data.data;
  },

  getPresence: async (userIds: number[]): Promise<UserPresence[]> => {
    const uniqueUserIds = [...new Set(userIds)].filter(
      (userId) => Number.isInteger(userId) && userId > 0
    );
    if (uniqueUserIds.length === 0) return [];

    const batches = Array.from(
      { length: Math.ceil(uniqueUserIds.length / 100) },
      (_, index) => uniqueUserIds.slice(index * 100, (index + 1) * 100)
    );
    const responses = await Promise.all(
      batches.map((batch) => {
        const params = new URLSearchParams();
        batch.forEach((userId) => params.append('userIds', String(userId)));
        return apiClient.get<ApiResponse<UserPresence[]>>('/users/presence', {
          params,
        });
      })
    );

    return responses.flatMap((response) => response.data.data);
  },


  createAvatarSignature: async (): Promise<AvatarUploadSignature> => {
    const response = await apiClient.post<
      ApiResponse<AvatarUploadSignature>
    >('/users/me/avatar/signature');

    return response.data.data;
  },

  completeAvatarUpload: async (
    upload: CloudinaryUploadResponse
  ): Promise<User> => {
    const response = await apiClient.patch<ApiResponse<User>>(
      '/users/me/avatar',
      {
        publicId: upload.public_id,
        version: upload.version,
        signature: upload.signature,
      }
    );

    return response.data.data;
  },

  uploadAvatar: async (file: File): Promise<User> => {
    validateAvatar(file);

    const signature = await userApi.createAvatarSignature();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('public_id', signature.publicId);
    formData.append('overwrite', String(signature.overwrite));
    formData.append('invalidate', String(signature.invalidate));

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Không thể tải avatar lên Cloudinary');
    }

    const uploaded =
      (await response.json()) as CloudinaryUploadResponse;

    return userApi.completeAvatarUpload(uploaded);
  },


};


const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function validateAvatar(file: File) {
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new TypeError('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
  }

  if (file.size > MAX_AVATAR_SIZE) {
    throw new TypeError('Avatar không được lớn hơn 2 MB');
  }
}
