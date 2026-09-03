import { useState, useRef, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUpdateAvatar } from '../hooks/useUpdateAvatar';
import { Camera, WarningCircle, CheckCircle, SignOut, CircleNotch, User as UserIcon, EnvelopeSimple, CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  // Avatar upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate: uploadAvatar, isPending: isUploading, error: uploadError } = useUpdateAvatar();

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (isLoading) {
    return <LoadingSpinner fullCenter label="Loading your profile..." />;
  }

  if (isError) {
    return (
      <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <ErrorState
            title="Failed to load profile"
            message={(error as any)?.response?.data?.message || 'An unexpected error occurred'}
            onRetry={() => refetch()}
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);
    setSuccessMessage(null);

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setValidationError('Avatar must be less than 2 MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Only JPG, PNG or WebP images are allowed.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelAvatar = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setValidationError(null);
    setSuccessMessage(null);
  };

  const handleSaveAvatar = () => {
    if (!selectedFile) return;

    setSuccessMessage(null);
    uploadAvatar(selectedFile, {
      onSuccess: () => {
        setSuccessMessage('Avatar updated successfully!');
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      },
    });
  };

  return (
    <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8" aria-label="Your Profile">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your Profile</h1>
            <p className="text-sm text-zinc-500">Manage your personal information and avatar.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none disabled:opacity-50"
          >
            {isLoggingOut ? (
              <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden="true" />
            ) : (
              <SignOut size={16} weight="bold" aria-hidden="true" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </header>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
          {/* Avatar Section */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-zinc-100">
            <div className="relative group rounded-full overflow-hidden w-20 h-20 shrink-0">
              <Avatar
                name={user.displayName}
                url={previewUrl || user.avatarUrl}
                size="xl"
                className={cn('w-full h-full', isUploading && 'opacity-50')}
              />

              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  'absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                  isUploading && 'cursor-not-allowed'
                )}
                aria-label="Change profile photo"
              >
                <Camera size={24} weight="fill" aria-hidden="true" />
                <span className="text-[10px] font-medium mt-0.5">Change</span>
              </button>

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40" role="status" aria-label="Uploading avatar">
                  <CircleNotch size={24} weight="bold" className="animate-spin text-white" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{user.displayName}</h2>
                <p className="text-xs text-zinc-500">JPG, PNG or WebP, up to 2MB.</p>
              </div>

              {/* Upload Controls */}
              {previewUrl && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    disabled={isUploading}
                    className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-zinc-900 hover:bg-black transition-colors disabled:opacity-50 shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
                  >
                    {isUploading ? 'Saving...' : 'Save avatar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAvatar}
                    disabled={isUploading}
                    className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Status messages */}
              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1" role="alert">
                  <WarningCircle size={15} weight="fill" className="shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}
              {uploadError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1" role="alert">
                  <WarningCircle size={15} weight="fill" className="shrink-0" aria-hidden="true" />
                  <span>{uploadError.message || 'Failed to update avatar. Please try again.'}</span>
                </div>
              )}
              {successMessage && !previewUrl && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1" role="status">
                  <CheckCircle size={15} weight="fill" className="shrink-0" aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          {/* Details Form / View */}
          <div className="p-6 sm:p-8 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Account Details</h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <UserIcon size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Display name</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{user.displayName}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <EnvelopeSimple size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Email address</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">{user.email}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 sm:col-span-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-center text-zinc-600 shrink-0">
                  <CalendarBlank size={18} weight="bold" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-zinc-500 font-medium">Account created</dt>
                  <dd className="text-sm font-semibold text-zinc-900 truncate mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
