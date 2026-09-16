export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: unknown;
  };
  timestamp: string;
}
