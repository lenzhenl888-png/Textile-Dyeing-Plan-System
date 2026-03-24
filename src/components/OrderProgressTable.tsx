import React, { useState, useEffect } from 'react';
import { storage, DyeingPlan } from '../services/storage';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

const PROGRESS_STEPS = [
  '购纱',
  '棉纱运输',
  '织造',
  '毛坯运输',
  '染色',
  '成品完成',
  '发货',
  '返修',
  '完成'
];

export default function OrderProgressTable() {
  const [plans, setPlans] = useState<DyeingPlan[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const loadedPlans = storage.getPlans();
    // Sort by created date descending
    loadedPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPlans(loadedPlans);
  };

  const toggleProgress = (planId: string, step: string) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex === -1) return;

    const plan = plans[planIndex];
    const currentProgress = plan.progress || {};
    const isCompleted = !!currentProgress[step];

    const updatedPlan = {
      ...plan,
      progress: {
        ...currentProgress,
        [step]: !isCompleted
      }
    };

    storage.savePlan(updatedPlan);
    
    // Update local state
    const newPlans = [...plans];
    newPlans[planIndex] = updatedPlan;
    setPlans(newPlans);
  };

  const activePlans = plans.filter(p => !p.progress?.['完成']);
  const completedPlans = plans.filter(p => p.progress?.['完成']);

  const renderTable = (data: DyeingPlan[], title: string, isEmptyMessage: string) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      
      {data.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {isEmptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-center min-w-[1000px]">
            <thead>
              <tr>
                <th colSpan={3} className="border-b border-r border-gray-200 bg-indigo-50/50 p-3 font-semibold text-gray-700">订单信息</th>
                <th colSpan={PROGRESS_STEPS.length} className="border-b border-gray-200 bg-emerald-50/50 p-3 font-semibold text-gray-700">进度</th>
              </tr>
              <tr>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[12%]">合同号</th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[12%]">款号</th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[12%]">客户</th>
                {PROGRESS_STEPS.map((step, index) => (
                  <th 
                    key={step} 
                    className={cn(
                      "border-b border-gray-200 bg-gray-50 p-3 font-medium text-gray-600",
                      index !== PROGRESS_STEPS.length - 1 && "border-r"
                    )}
                  >
                    {step}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((plan, rowIndex) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border-b border-r border-gray-200 p-3 text-gray-900">{plan.contractNumber || '-'}</td>
                  <td className="border-b border-r border-gray-200 p-3 text-gray-900">{plan.styleNumber || '-'}</td>
                  <td className="border-b border-r border-gray-200 p-3 text-gray-900">{plan.customer || '-'}</td>
                  
                  {PROGRESS_STEPS.map((step, index) => {
                    const isChecked = !!plan.progress?.[step];
                    return (
                      <td 
                        key={step} 
                        className={cn(
                          "border-b border-gray-200 p-3 cursor-pointer transition-colors hover:bg-gray-100",
                          index !== PROGRESS_STEPS.length - 1 && "border-r"
                        )}
                        onClick={() => toggleProgress(plan.id, step)}
                      >
                        <div className="flex justify-center items-center">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center animate-in zoom-in duration-200">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-400 transition-colors" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">订单进度表</h2>
          <p className="text-sm text-gray-500 mt-1">跟踪和管理所有面料计划单的生产进度。</p>
        </div>
      </div>

      {renderTable(activePlans, "进行中订单", "当前没有进行中的订单。")}
      {renderTable(completedPlans, "已完成订单", "暂无已完成的订单。")}
    </div>
  );
}
