import { useLocation, useSearchParams, NavLink } from 'react-router-dom';
import {
  Users,
  ChatCircleDots,
  AddressBook,
  ChatTeardropDots,
} from '@phosphor-icons/react';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

export const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Hide mobile bottom navigation when actively in a chat on mobile
  const isMobileChatActive = location.pathname === '/chat' && searchParams.has('chat');

  const navItems = [
    {
      to: '/chat',
      label: 'Messages',
      icon: ChatCircleDots,
      size: 22,
    },
    {
      to: '/users',
      label: 'Discover Users',
      icon: Users,
      size: 22,
    },
    {
      to: '/connections',
      label: 'Connections',
      icon: AddressBook,
      size: 22,
    },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        "w-full md:w-[84px] shrink-0 flex flex-row md:flex-col items-center justify-around md:justify-between py-2 md:py-6 border-t md:border-t-0 md:border-r border-zinc-200/70 bg-white/70 backdrop-blur-md order-last md:order-none z-40 transition-all duration-200",
        isMobileChatActive && "hidden md:flex"
      )}
    >
      {/* Brand Logo - Desktop */}
      <div className="hidden md:flex flex-col items-center gap-1 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
          <ChatTeardropDots size={24} weight="fill" />
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex flex-row md:flex-col gap-1 md:gap-4 flex-1 w-full items-center justify-around md:justify-start px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/80'
                )
              }
            >
              {({ isActive }) => <Icon size={item.size} weight={isActive ? 'fill' : 'bold'} aria-hidden="true" />}
            </NavLink>
          );
        })}
      </div>

      {/* Profile Link */}
      <div className="flex flex-row md:flex-col items-center md:w-full md:mt-auto px-2">
        <NavLink
          to="/profile"
          aria-label="Your Profile"
          title="Your Profile"
          className={({ isActive }) =>
            cn(
              'min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none',
              isActive
                ? 'ring-2 ring-zinc-900 ring-offset-2'
                : 'hover:opacity-80'
            )
          }
        >
          <Avatar name={user?.displayName || 'User'} url={user?.avatarUrl} size="sm" className="w-9 h-9" />
        </NavLink>
      </div>
    </nav>
  );
};
