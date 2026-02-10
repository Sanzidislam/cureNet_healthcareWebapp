import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../utils/constants';

interface LoginForm {
  emailOrPhone: string;
  password: string;
  remember?: boolean;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect');
  const from = redirectUrl || (location.state as { from?: { pathname: string } })?.from?.pathname || '/app';

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.emailOrPhone, data.password);
      toast.success('Signed in successfully');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : 'Invalid email/phone or password';
      toast.error(message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500 mb-6 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to {APP_NAME}</h1>
          <p className="text-gray-600 mb-8">Enter your email or phone and password.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Phone
              </label>
              <input
                id="emailOrPhone"
                type="text"
                autoComplete="username"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                {...registerField('emailOrPhone', {
                  required: 'Email or phone is required',
                })}
              />
              {errors.emailOrPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.emailOrPhone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  {...registerField('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  {...registerField('remember')}
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:block flex-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-12 flex flex-col justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Welcome to {APP_NAME}</h2>
        <ul className="space-y-3 text-indigo-100">
          <li>• Book appointments with verified doctors</li>
          <li>• Access medical records and lab reports</li>
          <li>• Secure and private healthcare platform</li>
        </ul>
      </div>
    </div>
  );
}
