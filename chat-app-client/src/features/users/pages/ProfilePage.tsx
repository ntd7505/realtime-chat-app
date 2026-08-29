import { useState, useRef, useEffect } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUpdateAvatar } from '../hooks/useUpdateAvatar';
import { Camera, WarningCircle, CheckCircle } from '@phosphor-icons/react';
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
    return <LoadingSpinner fullCenter />;
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <ErrorState 
          title="Failed to load profile" 
          message={(error as any)?.response?.data?.message || 'An unexpected error occurred'} 
          onRetry={() => refetch()} 
        />
      </div>
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

    // Validate size (2MB) and type
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
    // Reset file input value so selecting same file triggers onChange again if needed
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
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
        
        <div className="px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">Avatar</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-6">
                    <div className="relative group rounded-full overflow-hidden w-16 h-16 flex-shrink-0">
                      <Avatar 
                        name={user.displayName} 
                        url={previewUrl || user.avatarUrl} 
                        size="lg" 
                        className={cn("w-full h-full", isUploading && "opacity-50")}
                      />
                      
                      {/* Hover Overlay */}
                      <button
                        type="button"
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={cn(
                          "absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 focus-within:opacity-100 focus:opacity-100 transition-opacity",
                          !isUploading && "group-hover:opacity-100 cursor-pointer"
                        )}
                        aria-label="Change avatar"
                      >
                        <Camera size={24} weight="fill" />
                      </button>
                      
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20" aria-live="polite">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    {previewUrl && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-zinc-600 font-medium">Previewing new avatar</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveAvatar}
                            disabled={isUploading}
                            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-zinc-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50"
                          >
                            Save avatar
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAvatar}
                            disabled={isUploading}
                            className="px-3 py-1.5 text-sm font-medium rounded-md text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Messages */}
                  {validationError && (
                    <div className="flex items-center gap-1.5 text-sm text-rose-600" aria-live="polite">
                      <WarningCircle size={16} weight="fill" />
                      <span>{validationError}</span>
                    </div>
                  )}
                  {uploadError && (
                    <div className="flex items-center gap-1.5 text-sm text-rose-600" aria-live="polite">
                      <WarningCircle size={16} weight="fill" />
                      <span>{uploadError.message || 'Failed to update avatar. Please try again.'}</span>
                    </div>
                  )}
                  {successMessage && !previewUrl && (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600" aria-live="polite">
                      <CheckCircle size={16} weight="fill" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Display name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.displayName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Account created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
