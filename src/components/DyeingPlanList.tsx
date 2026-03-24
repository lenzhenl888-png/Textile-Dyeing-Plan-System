import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, Edit2, Trash2, FileText, Calendar, Package, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { storage, DyeingPlan } from '../services/storage';
import { format, differenceInDays, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function DyeingPlanList() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DyeingPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activePdfPlan, setActivePdfPlan] = useState<DyeingPlan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    setPlans(storage.getPlans().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  };

  const confirmDelete = (id: string) => {
    storage.deletePlan(id);
    loadPlans();
    setDeleteConfirmId(null);
  };

  const filteredPlans = plans.filter(plan =>
    plan.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.styleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const exportToPDF = async (plan: DyeingPlan) => {
    setActivePdfPlan(plan);
    setTimeout(async () => {
      if (!pdfRef.current) return;
      try {
        const canvas = await html2canvas(pdfRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${plan.customer}_${plan.styleNumber}_计划单.pdf`);
      } catch (error) {
        console.error("PDF Export failed:", error);
      } finally {
        setActivePdfPlan(null);
      }
    }, 100);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500 italic">正在加载计划...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">臻林面料计划单</h2>
          <p className="text-sm text-gray-500 mt-1">管理您的生产计划和导出 PDF。</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索客户或款号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
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
                        onClick={() => navigate(`/view-plan/${plan.id}`)}
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
                            <button
                              onClick={() => exportToPDF(plan)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(plan.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* PDF Template - Matching the image layout */}
      <div className="fixed -left-[2000px] top-0">
        <div ref={pdfRef} className="w-[210mm] bg-white p-10 text-black font-sans leading-tight">
          {activePdfPlan && (
            <div className="border-[1.5px] border-black">
              <h1 className="text-2xl font-bold text-center py-4 tracking-[0.2em]">臻林面料染色计划单</h1>
              
              <table className="w-full border-collapse text-xs text-center border-t-[1.5px] border-black table-fixed">
                <colgroup>
                  <col className="w-[10%]" /> {/* 工艺/颜色 */}
                  <col className="w-[10%]" /> {/* 编辑区/色号 */}
                  <col className="w-[12%]" /> {/* 面料货号/备注区 */}
                  <col className="w-[13.6%]" /> {/* 主面料1 */}
                  <col className="w-[13.6%]" /> {/* 主面料2 */}
                  <col className="w-[13.6%]" /> {/* 主面料3 */}
                  <col className="w-[13.6%]" /> {/* 辅料1 */}
                  <col className="w-[13.6%]" /> {/* 辅料2 */}
                </colgroup>
                <tbody>
                  {/* Row 1: Header Info */}
                  <tr className="border-b-[1.5px] border-black">
                    <td colSpan={2} className="p-2 border-r-[1.5px] border-black">
                      客户：{activePdfPlan.customer}
                    </td>
                    <td colSpan={2} className="p-2 border-r-[1.5px] border-black">
                      款号：{activePdfPlan.styleNumber}
                    </td>
                    <td colSpan={2} className="p-2 border-r-[1.5px] border-black">
                      日期：{activePdfPlan.date}
                    </td>
                    <td colSpan={2} className="p-2">
                      预计交期：{activePdfPlan.deliveryDate}
                    </td>
                  </tr>

                  {/* Row 2: 合同号 & 主面料/辅料 */}
                  <tr className="border-b-[1.5px] border-black">
                    <td className="p-2 border-r-[1.5px] border-black font-medium">合同号</td>
                    <td colSpan={2} className="p-2 border-r-[1.5px] border-black">
                      {activePdfPlan.contractNumber}
                    </td>
                    <td colSpan={3} className="p-2 border-r-[1.5px] border-black font-medium">主面料</td>
                    <td colSpan={2} className="p-2 font-medium">辅料</td>
                  </tr>

                  {/* Row 3: 工艺, 面料货号 */}
                  <tr className="border-b-[1.5px] border-black">
                    <td rowSpan={3} className="p-2 border-r-[1.5px] border-black font-medium align-middle">工艺</td>
                    <td rowSpan={3} className="p-2 border-r-[1.5px] border-black align-middle whitespace-pre-wrap">
                      {activePdfPlan.process}
                    </td>
                    <td className="p-2 border-r-[1.5px] border-black font-medium">面料货号</td>
                    {activePdfPlan.fabrics.map((f, i) => (
                      <td key={i} className="p-2 border-r-[1.5px] border-black last:border-r-0">
                        {f.itemNumber || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: 门幅cm */}
                  <tr className="border-b-[1.5px] border-black">
                    <td className="p-2 border-r-[1.5px] border-black font-medium">门幅cm</td>
                    {activePdfPlan.fabrics.map((f, i) => (
                      <td key={i} className="p-2 border-r-[1.5px] border-black last:border-r-0">
                        {f.width || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: 克重g/m² */}
                  <tr className="border-b-[1.5px] border-black">
                    <td className="p-2 border-r-[1.5px] border-black font-medium">克重g/m²</td>
                    {activePdfPlan.fabrics.map((f, i) => (
                      <td key={i} className="p-2 border-r-[1.5px] border-black last:border-r-0">
                        {f.weight || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Row 6: 颜色, 色号, 品名 */}
                  <tr className="border-b-[1.5px] border-black">
                    <td className="p-2 border-r-[1.5px] border-black font-medium">颜色</td>
                    <td className="p-2 border-r-[1.5px] border-black font-medium">色号</td>
                    <td className="p-2 border-r-[1.5px] border-black font-medium">品名</td>
                    {activePdfPlan.fabrics.map((f, i) => (
                      <td key={i} className="p-2 border-r-[1.5px] border-black last:border-r-0">
                        {f.productName || '-'}
                      </td>
                    ))}
                  </tr>

                  {/* Data Rows */}
                  {activePdfPlan.rows.map((row) => (
                    <tr key={row.id} className="border-b-[1.5px] border-black">
                      <td className="p-2 border-r-[1.5px] border-black">{row.colorName}</td>
                      <td className="p-2 border-r-[1.5px] border-black">{row.colorCode}</td>
                      <td className="p-2 border-r-[1.5px] border-black">{row.notes}</td>
                      {row.quantities.map((q, idx) => (
                        <td key={idx} className="p-2 border-r-[1.5px] border-black last:border-r-0">{q}</td>
                      ))}
                    </tr>
                  ))}

                  {/* Empty rows to fill space if needed */}
                  {[...Array(Math.max(0, 10 - activePdfPlan.rows.length))].map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b-[1.5px] border-black">
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 border-r-[1.5px] border-black h-8"></td>
                      <td className="p-2 h-8"></td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="border-b-[1.5px] border-black font-bold">
                    <td colSpan={2} className="p-2 border-r-[1.5px] border-black">合计数量</td>
                    <td className="p-2 border-r-[1.5px] border-black"></td>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <td key={i} className="p-2 border-r-[1.5px] border-black last:border-r-0">
                        {calculateRowTotal(activePdfPlan, i)}
                      </td>
                    ))}
                  </tr>

                  {/* Notes Row */}
                  <tr>
                    <td colSpan={8} className="p-2 text-left align-top min-h-[60px]">
                      <div className="flex">
                        <span className="whitespace-nowrap font-medium">备注：</span>
                        <div className="whitespace-pre-wrap">{activePdfPlan.notes}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
