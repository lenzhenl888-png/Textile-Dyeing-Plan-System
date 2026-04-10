import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, Edit2, Trash2, FileText, Calendar, Package, User, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';
import { storage, DyeingPlan } from '../services/storage';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import DyeingPlanPrint from './DyeingPlanPrint';

export default function DyeingPlanList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DyeingPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<DyeingPlan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const data = await storage.getPlans();
    setPlans(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  const confirmDelete = async (id: string) => {
    await storage.deletePlan(id);
    loadPlans();
    setDeleteConfirmId(null);
    setSelectedPlan(null);
  };

  // Get unique months from plans for the filter
  const availableMonths = (Array.from(new Set(plans.map(plan => {
    if (!plan.date) return null;
    const date = new Date(plan.date);
    if (isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }).filter(Boolean))) as string[]).sort((a, b) => b.localeCompare(a));

  const filteredPlans = plans.filter(plan => {
    const search = searchTerm.toLowerCase();
    const contractSearch = contractSearchTerm.toLowerCase();
    
    const matchesSearch = !search || 
      (plan.customer?.toLowerCase().includes(search)) ||
      (plan.styleNumber?.toLowerCase().includes(search));
    
    const matchesContract = !contractSearch || 
      (plan.contractNumber?.toLowerCase().includes(contractSearch));
    
    let matchesMonth = true;
    if (selectedMonth !== 'all' && plan.date) {
      const planDate = new Date(plan.date);
      if (!isNaN(planDate.getTime())) {
        const planMonth = `${planDate.getFullYear()}-${String(planDate.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = planMonth === selectedMonth;
      } else {
        matchesMonth = false;
      }
    } else if (selectedMonth !== 'all') {
      matchesMonth = false;
    }

    return matchesSearch && matchesContract && matchesMonth;
  });

  const groupedPlans = filteredPlans.reduce((acc, plan) => {
    const customer = plan.customer || '未命名客户';
    if (!acc[customer]) acc[customer] = [];
    acc[customer].push(plan);
    return acc;
  }, {} as Record<string, DyeingPlan[]>);

  const calculateRowTotal = (plan: DyeingPlan, qIndex: number) => {
    return plan.rows.reduce((sum, row) => {
      const val = parseFloat(row.quantities[qIndex] as string) || 0;
      return sum + val;
    }, 0);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500 italic">正在加载计划...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">臻林面料计划单</h2>
          <p className="text-sm text-gray-500 mt-1">管理您的生产计划和导出 PDF。</p>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full max-w-4xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户或款号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索合同号..."
              value={contractSearchTerm}
              onChange={(e) => setContractSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative w-full lg:w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">所有月份</option>
              {availableMonths.map(month => {
                const [year, m] = month.split('-');
                return (
                  <option key={month} value={month}>
                    {year}年{parseInt(m)}月
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {Object.keys(groupedPlans).length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-300"
            >
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">未找到匹配的计划单。</p>
            </motion.div>
          ) : (
            Object.entries(groupedPlans).map(([customer, customerPlans]: [string, DyeingPlan[]], groupIndex) => (
              <motion.div 
                key={customer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">{customer}</h3>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {customerPlans.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customerPlans.map((plan, index) => {
                    const isCompleted = !!plan.progress?.['完成'];
                    let isWarning = false;
                    let daysLeft: number | null = null;
                    
                    if (!isCompleted && plan.deliveryDate) {
                      try {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const delivery = parseISO(plan.deliveryDate);
                        delivery.setHours(0, 0, 0, 0);
                        daysLeft = differenceInDays(delivery, today);
                        if (daysLeft <= 5) {
                          isWarning = true;
                        }
                      } catch (e) {
                        // ignore invalid dates
                      }
                    }

                    return (
                      <motion.div 
                        key={plan.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedPlan(plan)}
                        className={cn(
                          "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer",
                          isCompleted 
                            ? "border-emerald-200 hover:border-emerald-400" 
                            : isWarning
                              ? "border-amber-200 hover:border-amber-400"
                              : "border-gray-200 hover:border-indigo-300"
                        )}
                      >
                        {isCompleted && (
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />
                        )}
                        {isWarning && (
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                        )}
                        <div className="p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                                {plan.contractNumber ? `${plan.contractNumber} / ` : ''}{plan.styleNumber || '无款号'}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium tracking-wider">{plan.date}</p>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {isCompleted && (
                                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold mr-1 border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  已完成
                                </div>
                              )}
                              {isWarning && (
                                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold mr-1 border border-amber-100">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {daysLeft! < 0 ? '已逾期' : `剩 ${daysLeft} 天`}
                                </div>
                              )}
                              <button
                                onClick={() => navigate(`/edit-plan/${plan.id}`)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <DyeingPlanPrint plan={plan} />
                              <button
                                onClick={() => setDeleteConfirmId(plan.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-50">
                          <div className="grid grid-cols-2 gap-2">
                            {plan.fabrics.slice(0, 2).map((f, i) => f.itemNumber && (
                              <div key={i} className="text-[10px] bg-gray-50 p-1.5 rounded border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase">面料 {i+1}</p>
                                <p className="font-bold truncate">{f.itemNumber}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            交期: {plan.deliveryDate || '未设置'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {plan.rows.length} 种颜色
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedPlan(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  计划单概览
                </h3>
                <button onClick={() => setSelectedPlan(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">客户</div>
                  <div className="text-base font-bold text-gray-900">{selectedPlan.customer || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">合同号</div>
                    <div className="text-sm font-medium text-gray-900">{selectedPlan.contractNumber || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">款号</div>
                    <div className="text-sm font-medium text-gray-900">{selectedPlan.styleNumber || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">制单日期</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {selectedPlan.date || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">交期</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {selectedPlan.deliveryDate || '-'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2">面料信息</div>
                  <div className="space-y-2">
                    {selectedPlan.fabrics.map((f, i) => f.itemNumber && (
                      <div key={i} className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-sm">
                        <span className="font-bold text-gray-700 mr-2">面料 {i+1}:</span>
                        {f.itemNumber}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-2">颜色及数量 ({selectedPlan.rows.length} 行)</div>
                  <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                    <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                      {selectedPlan.rows.map((row, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                          <span className="text-gray-700">{row.colorName || '未命名颜色'}</span>
                          <span className="font-medium text-gray-900">
                            {row.quantities.reduce((sum, q) => sum + (parseFloat(q as string) || 0), 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/view-plan/${selectedPlan.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  查看完整计划单
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/edit-plan/${selectedPlan.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <div className="flex-1">
                    <DyeingPlanPrint plan={selectedPlan} variant="button" className="w-full justify-center" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">删除计划单</h3>
                    <p className="text-sm text-gray-500 mt-1">您确定要删除此臻林面料计划单吗？此操作无法撤销。</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-8">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => confirmDelete(deleteConfirmId)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                  >
                    确定删除
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
