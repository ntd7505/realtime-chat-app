export interface AvatarUploadSignature {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    publicId: string;
    overwrite: boolean;
    invalidate: boolean;
}

export interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
    version: number;
    signature: string;
}