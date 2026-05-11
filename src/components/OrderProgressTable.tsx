import React, { useState, useEffect } from 'react';
import { storage, DyeingPlan } from '../services/storage';
import { CheckCircle2, ChevronDown, ChevronRight, Printer } from 'lucide-react';
import { cn } from '../lib/utils';
import DyeingPlanPrint from './DyeingPlanPrint';

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
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const loadedPlans = await storage.getPlans();
    // Sort by created date descending
    loadedPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPlans(loadedPlans);
  };

  const toggleProgress = async (planId: string, step: string) => {
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

    await storage.savePlan(updatedPlan);
    
    // Update local state
    const newPlans = [...plans];
    newPlans[planIndex] = updatedPlan;
    setPlans(newPlans);
  };

  const toggleExpanded = (planId: string) => {
    const newExpanded = new Set(expandedPlanIds);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlanIds(newExpanded);
  };

  const toggleCellCompleted = async (planId: string, rowIndex: number, colIndex: number) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex === -1) return;

    const plan = plans[planIndex];
    const progressKey = `cell_completed_${rowIndex}_${colIndex}`;
    const currentProgress = plan.progress || {};
    const isCompleted = !!currentProgress[progressKey];

    const updatedPlan = {
      ...plan,
      progress: {
        ...currentProgress,
        [progressKey]: !isCompleted
      }
    };

    await storage.savePlan(updatedPlan);
    
    const newPlans = [...plans];
    newPlans[planIndex] = updatedPlan;
    setPlans(newPlans);
  };

  const activePlans = plans.filter(p => !p.progress?.['完成']);
  const completedPlans = plans.filter(p => p.progress?.['完成']);

  const completedMonths = Array.from(new Set(completedPlans.map(p => {
    if (!p.date) return '未知月份';
    const parts = p.date.split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return '未知月份';
  }))).sort((a, b) => b.localeCompare(a));

  const [selectedCompletedMonth, setSelectedCompletedMonth] = useState<string>('');
  const currentCompletedMonth = selectedCompletedMonth || completedMonths[0] || '';

  const filteredCompletedPlans = completedPlans.filter(p => {
    if (!currentCompletedMonth || currentCompletedMonth === '全部') return true;
    if (currentCompletedMonth === '未知月份') return !p.date || p.date.split('-').length < 2;
    return p.date && p.date.startsWith(currentCompletedMonth);
  });

  const renderTable = (data: DyeingPlan[], title: string, isEmptyMessage: string, headerRight?: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {headerRight && <div>{headerRight}</div>}
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
                <th colSpan={4} className="border-b border-r border-gray-200 bg-indigo-50/50 p-3 font-semibold text-gray-700">订单信息</th>
                <th colSpan={PROGRESS_STEPS.length} className="border-b border-gray-200 bg-emerald-50/50 p-3 font-semibold text-gray-700">整体进度</th>
              </tr>
              <tr>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[10%]">合同号</th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[10%]">款号</th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[10%]">客户</th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 font-medium text-gray-600 w-[8%]">操作</th>
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
              {data.map((plan, planIndex) => {
                const isExpanded = expandedPlanIds.has(plan.id);
                return (
                  <React.Fragment key={plan.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="border-b border-r border-gray-200 p-3 text-gray-900">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => toggleExpanded(plan.id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                            title="查看面料明细进度"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          {plan.contractNumber || '-'}
                          {plan.orderType === '式样' && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-bold">式样</span>}
                          {plan.orderType === '大货' && <span className="ml-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs font-bold">大货</span>}
                        </div>
                      </td>
                      <td className="border-b border-r border-gray-200 p-3 text-gray-900">{plan.styleNumber || '-'}</td>
                      <td className="border-b border-r border-gray-200 p-3 text-gray-900">{plan.customer || '-'}</td>
                      <td className="border-b border-r border-gray-200 p-3 text-gray-900">
                        <DyeingPlanPrint plan={plan} />
                      </td>
                      
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
                    {isExpanded && (
                      <tr>
                        <td colSpan={4 + PROGRESS_STEPS.length} className="border-b border-gray-200 bg-gray-50/80 p-4">
                          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-4 max-w-5xl mx-auto">
                            <h4 className="font-bold text-gray-800 mb-4 text-left">面料明细进度 (点击复选框标记完成)</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse text-left">
                                <thead>
                                  <tr>
                                    <th className="border border-gray-200 p-2 bg-gray-50">颜色</th>
                                    {plan.fabrics?.map((f, i) => (
                                      <th key={i} className="border border-gray-200 p-2 bg-gray-50">
                                        <div className="font-medium text-gray-900">{f.productName || `面料 ${i + 1}`}</div>
                                        {f.type === 'accessory' && <div className="text-xs text-gray-500">辅料</div>}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {plan.rows?.map((row, rIdx) => (
                                    <tr key={row.id || rIdx}>
                                      <td className="border border-gray-200 p-2 font-medium">
                                        {row.colorName || '-'} {row.colorCode ? `(${row.colorCode})` : ''}
                                      </td>
                                      {plan.fabrics?.map((f, cIdx) => {
                                        const qty = row.quantities[cIdx];
                                        const val = parseFloat(String(qty));
                                        const hasQty = !isNaN(val) && val > 0;
                                        const cellCompleted = !!plan.progress?.[`cell_completed_${rIdx}_${cIdx}`];
                                        
                                        return (
                                          <td key={cIdx} className={cn("border border-gray-200 p-2", cellCompleted ? "bg-emerald-50/30" : "")}>
                                            {hasQty ? (
                                              <label className="flex items-center gap-2 cursor-pointer group">
                                                <input 
                                                  type="checkbox" 
                                                  checked={cellCompleted}
                                                  onChange={() => toggleCellCompleted(plan.id, rIdx, cIdx)}
                                                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-600"
                                                />
                                                <span className={cn(
                                                  "font-medium", 
                                                  cellCompleted ? "text-gray-400 line-through" : "text-gray-900"
                                                )}>
                                                  {qty} {plan.unit}
                                                </span>
                                              </label>
                                            ) : (
                                              <span className="text-gray-300">-</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
          <p className="text-sm text-gray-500 mt-1">跟踪和管理所有面料计划单的生产进度。可展开特定订单标记具体面料子项完成状态。</p>
        </div>
      </div>

      {renderTable(activePlans, "进行中订单", "当前没有进行中的订单。")}
      {renderTable(
        filteredCompletedPlans, 
        "已完成订单", 
        "暂无已完成的订单。",
        completedMonths.length > 0 ? (
          <select
            value={currentCompletedMonth}
            onChange={(e) => setSelectedCompletedMonth(e.target.value)}
            className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="全部">全部月份</option>
            {completedMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        ) : null
      )}
    </div>
  );
}

