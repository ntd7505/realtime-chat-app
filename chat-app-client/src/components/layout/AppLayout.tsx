import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useStomp } from '@/lib/websocket/stompContext';
import { CircleNotch, WifiSlash } from '@phosphor-icons/react';

export function AppLayout() {
  const { status } = useStomp();
  const isDisconnected = status === 'disconnected' || status === 'reconnecting';
  const isConnecting = status === 'connecting';

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-[#d8eee2] text-zinc-900 font-sans md:p-6 lg:p-8">
      {/* Realtime Connection Status Banner */}
      {(isDisconnected || isConnecting) && (
        <div
          role="status"
          aria-live="polite"
          className="w-full bg-amber-600 text-white text-xs font-medium px-4 py-2 text-center fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 shadow-xs"
        >
          {isConnecting ? (
            <>
              <CircleNotch size={14} weight="bold" className="animate-spin" aria-hidden="true" />
              <span>Connecting to realtime services...</span>
            </>
          ) : (
            <>
              <WifiSlash size={14} weight="bold" aria-hidden="true" />
              <span>Realtime disconnected. Reconnecting...</span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row w-full h-[100dvh] md:h-[calc(100dvh-3.5rem)] md:max-h-[880px] md:max-w-[1240px] md:rounded-[32px] overflow-hidden bg-[#fdfbf7] md:shadow-[0_24px_50px_rgba(0,0,0,0.06)] md:border md:border-white/80 relative">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/60 relative overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
