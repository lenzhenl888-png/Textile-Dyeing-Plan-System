import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DyeingPlanList from './components/DyeingPlanList';
import DyeingPlanForm from './components/DyeingPlanForm';
import FabricManager from './components/FabricManager';
import OrderProgressTable from './components/OrderProgressTable';
import Calculator from './components/Calculator';
import { Database, ShieldCheck, AlertCircle, LogIn } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // For local mode, we'll bypass Firebase authentication
  useEffect(() => {
    // Simulate a local user
    setUser({ email: '本地用户', uid: 'local_user_id' });
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    // No-op for local mode
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">正在初始化 DyeingPlan Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">DyeingPlan Pro</h1>
            <p className="text-gray-500 font-medium">纺织生产管理系统</p>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 text-indigo-700">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">
                需要安全访问。请使用授权的 Google 账号登录，以管理染色计划和面料数据库。
              </p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col gap-2 text-red-700 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{loginError}</p>
                </div>
                {loginError.includes("网络请求失败") && (
                  <p className="text-xs opacity-80 pl-8">
                    提示：如果您在某些地区访问受限，请尝试开启 VPN 或更换网络环境。
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loggingIn}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]",
                loggingIn ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700"
              )}
            >
              {loggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loggingIn ? '正在登录...' : '使用 Google 账号登录'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            &copy; 2024 纺织工业解决方案
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<DyeingPlanList />} />
          <Route path="/new-plan" element={<DyeingPlanForm />} />
          <Route path="/edit-plan/:id" element={<DyeingPlanForm />} />
          <Route path="/view-plan/:id" element={<DyeingPlanForm readOnly />} />
          <Route path="/progress" element={<OrderProgressTable />} />
          <Route path="/fabrics" element={<FabricManager />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
