import axios from 'axios';
import type { ApiResponse } from '@/types/api.types';

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return fallback;
  }

  return error.response?.data?.message || fallback;
};

export const getHttpStatus = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  return error.response?.status;
};
