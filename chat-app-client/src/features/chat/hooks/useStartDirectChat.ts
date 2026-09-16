import { useNavigate } from 'react-router-dom';
import { useCreateDirectChat } from './useChats';

export const useStartDirectChat = () => {
  const navigate = useNavigate();
  const mutation = useCreateDirectChat();

  const startDirectChat = (userId: number) => {
    mutation.reset();
    mutation.mutate(userId, {
      onSuccess: (chat) => navigate(`/chat?chat=${chat.id}`),
    });
  };

  return {
    ...mutation,
    startDirectChat,
  };
};
