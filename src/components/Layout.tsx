import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, PlusCircle, LogOut, User, ListTodo, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const location = useLocation();

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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">本地存储模式</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 pl-4 border-l border-gray-100">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="刷新"
            >
              <LogOut className="w-5 h-5" />
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
