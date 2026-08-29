import { LoginForm } from '../components/LoginForm';
import { Link, useLocation } from 'react-router-dom';

export function LoginPage() {
  const location = useLocation();
  const message = location.state?.message;

  return (
    <div className="min-h-screen bg-[#F0F7F4] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-md">
              {message}
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
