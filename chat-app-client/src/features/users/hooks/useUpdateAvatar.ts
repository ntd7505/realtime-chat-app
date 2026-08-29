import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { chatKeys } from '@/features/chat/chat.keys';
import { useAuthStore } from '@/features/auth/authStore';

export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => userApi.uploadAvatar(file),

        onSuccess: (updatedUser) => {
            // Update auth store
            useAuthStore.getState().updateUser(updatedUser);

            queryClient.setQueryData(
                ['users', 'me'],
                updatedUser
            );

            queryClient.invalidateQueries({
                queryKey: ['users'],
            });

            queryClient.invalidateQueries({
                queryKey: chatKeys.root,
            });
        },
    });
}