import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StompProvider } from '@/lib/websocket/StompProvider';
import { queryClient } from './queryClient';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StompProvider>{children}</StompProvider>
    </QueryClientProvider>
  );
}
