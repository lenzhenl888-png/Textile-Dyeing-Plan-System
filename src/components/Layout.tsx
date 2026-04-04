import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, PlusCircle, LogOut, User, ListTodo, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: '仪表板', path: '/', icon: LayoutDashboard },
    { name: '新建计划', path: '/new-plan', icon: PlusCircle },
    { name: '订单进度表', path: '/progress', icon: ListTodo },
    { name: '面料数据库', path: '/fabrics', icon: Database },
    { name: '投坯量计算器', path: '/calculator', icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">DyeingPlan Pro</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 pl-4 border-l border-gray-100">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{user?.displayName || user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors flex items-center gap-2"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">退出</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col sm:flex-row w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-full sm:w-64 bg-white border-r border-gray-200 p-4 sm:min-h-[calc(100vh-64px)]">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
