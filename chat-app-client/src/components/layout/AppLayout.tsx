import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useStomp } from '@/lib/websocket/stompContext';
import { CircleNotch, WifiSlash } from '@phosphor-icons/react';

export function AppLayout() {
  const { status } = useStomp();
  const isDisconnected = status === 'disconnected' || status === 'reconnecting';
  const isConnecting = status === 'connecting';

  return (
    <div className="flex flex-col items-center justify-center w-full h-[100dvh] bg-[var(--background-color)] text-zinc-900 font-sans md:p-6 lg:p-8">
      <div className="flex min-h-0 flex-col w-full h-full md:max-h-[880px] md:max-w-[1240px] md:rounded-[32px] overflow-hidden bg-[var(--shell-color)] md:shadow-[0_24px_50px_rgba(0,0,0,0.06)] relative">
      {/* Realtime Connection Status Banner */}
      {(isDisconnected || isConnecting) && (
        <div
          role="status"
          aria-live="polite"
          className="w-full shrink-0 bg-amber-100 text-amber-900 text-sm font-medium px-4 py-2 text-center flex items-center justify-center gap-2"
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

      <div className="flex min-h-0 flex-1 flex-col md:flex-row w-full overflow-hidden">
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white/60 relative overflow-hidden">
          <Outlet />
        </div>
      </div>
      </div>
    </div>
  );
}
