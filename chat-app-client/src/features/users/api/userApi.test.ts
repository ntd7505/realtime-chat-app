import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/http/apiClient';
import { userApi } from './userApi';

vi.mock('@/lib/http/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(apiClient.get).mockReset();
});

it('splits presence requests into API-safe batches', async () => {
  vi.mocked(apiClient.get)
    .mockResolvedValueOnce({
      data: { data: [{ userId: 1, online: true }] },
    })
    .mockResolvedValueOnce({
      data: { data: [{ userId: 101, online: false }] },
    });

  const result = await userApi.getPresence(
    Array.from({ length: 101 }, (_, index) => index + 1)
  );

  expect(apiClient.get).toHaveBeenCalledTimes(2);
  const firstParams = vi.mocked(apiClient.get).mock.calls[0][1]?.params as URLSearchParams;
  const secondParams = vi.mocked(apiClient.get).mock.calls[1][1]?.params as URLSearchParams;
  expect(firstParams.getAll('userIds')).toHaveLength(100);
  expect(secondParams.getAll('userIds')).toEqual(['101']);
  expect(result).toEqual([
    { userId: 1, online: true },
    { userId: 101, online: false },
  ]);
});
