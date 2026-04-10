import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DyeingPlanList from './components/DyeingPlanList';
import DyeingPlanForm from './components/DyeingPlanForm';
import FabricManager from './components/FabricManager';
import OrderProgressTable from './components/OrderProgressTable';
import Calculator from './components/Calculator';
import ReminderList from './components/ReminderList';
import ReminderForm from './components/ReminderForm';
import ContactManager from './components/ContactManager';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppRoutes() {
  const { currentUser, loading } = useAuth();

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

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Router>
      <Layout user={currentUser}>
        <Routes>
          <Route path="/" element={<DyeingPlanList />} />
          <Route path="/new-plan" element={<DyeingPlanForm />} />
          <Route path="/edit-plan/:id" element={<DyeingPlanForm />} />
          <Route path="/view-plan/:id" element={<DyeingPlanForm readOnly />} />
          <Route path="/progress" element={<OrderProgressTable />} />
          <Route path="/fabrics" element={<FabricManager />} />
          <Route path="/contacts" element={<ContactManager />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/reminders" element={<ReminderList />} />
          <Route path="/reminders/new" element={<ReminderForm />} />
          <Route path="/reminders/edit/:id" element={<ReminderForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
