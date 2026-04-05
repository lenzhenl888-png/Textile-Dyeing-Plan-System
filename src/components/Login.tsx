import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message === '您没有访问臻林纺织内部系统的权限') {
        setError(err.message);
      } else {
        setError('登录失败，请重试。' + (err.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <span className="text-white font-bold text-2xl transform rotate-6">臻林</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          面料计划单系统
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          请登录以访问系统
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? '登录中...' : '使用 Google 账号登录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
