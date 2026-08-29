import {
  House,
  Users,
  ChatCircleDots,
} from '@phosphor-icons/react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/authStore';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

export const Sidebar = () => {
  const { user } = useAuthStore();

  return (
    <nav className="w-[80px] md:w-[88px] flex-shrink-0 flex flex-col items-center py-8 justify-between border-r border-zinc-200/50 bg-white/40">
      {/* Top Logo */}
      <div className="w-12 h-12 flex items-center justify-center mb-8 text-zinc-900 cursor-pointer">
        <svg
          className="w-10 h-10 fill-current"
          viewBox="0 0 40 40"
          aria-label="Logo"
        >
          <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 32c-6.627 0-12-5.373-12-12S13.373 8 20 8s12 5.373 12 12-5.373 12-12 12zm-3-17a3 3 0 100-6 3 3 0 000 6zm6 0a3 3 0 100-6 3 3 0 000 6zm-3 10a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      </div>

      {/* Main Navigation Icons */}
      <div className="flex flex-col gap-6 flex-1 w-full items-center">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white'
            )
          }
          title="Home"
        >
          {({ isActive }) => <House size={20} weight={isActive ? 'fill' : 'regular'} />}
        </NavLink>
        
        <NavLink
          to="/users"
          className={({ isActive }) =>
            cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white'
            )
          }
          title="Users"
        >
          {({ isActive }) => <Users size={20} weight={isActive ? 'fill' : 'regular'} />}
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-all relative',
              isActive ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-900 hover:bg-white'
            )
          }
          title="Chat"
        >
          {({ isActive }) => <ChatCircleDots size={24} weight={isActive ? 'fill' : 'regular'} />}
        </NavLink>
      </div>

      {/* Bottom Navigation Icons */}
      <div className="flex flex-col gap-6 w-full items-center mt-auto">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'w-10 h-10 rounded-full flex items-center justify-center mt-2 transition-all',
              isActive ? 'ring-2 ring-zinc-900 ring-offset-2' : ''
            )
          }
          title="Profile"
        >
          <Avatar name={user?.displayName || 'User'} url={user?.avatarUrl} size="md" />
        </NavLink>
      </div>
    </nav>
  );
};
