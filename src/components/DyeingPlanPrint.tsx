import React, { useState, useRef } from 'react';
import { FileDown, Printer, X, Eye, FileSpreadsheet } from 'lucide-react';
import { DyeingPlan } from '../services/storage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DyeingPlanPrintProps {
  plan: DyeingPlan;
  variant?: 'icon' | 'button';
}

export default function DyeingPlanPrint({ plan, variant = 'icon' }: DyeingPlanPrintProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const calculateRowTotal = (plan: DyeingPlan, qIndex: number) => {
    return plan.rows.reduce((sum, row) => {
      const val = parseFloat(row.quantities[qIndex] as string) || 0;
      return sum + val;
    }, 0);
  };

  const handlePrint = async () => {
    setIsExporting(true);
    // Give time for the hidden template to render if needed, 
    // but here we can just use the one in the preview modal if it's open,
    // or render it temporarily.
    
    const element = pdfRef.current;
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
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
      setIsExporting(false);
      setShowPreview(false);
    }
  };

  const handleExportExcel = () => {
    const wsData = [];
    
    // Row 0
    wsData.push(['臻林面料染色计划单', '', '', '', '', '', '', '']);
    
    // Row 1
    wsData.push([
      `客户：${plan.customer}`, '', 
      `款号：${plan.styleNumber}`, '', 
      `日期：${plan.date}`, '', 
      `预计交期：${plan.deliveryDate}`, ''
    ]);
    
    // Row 2
    wsData.push([
      '合同号', plan.contractNumber, '', 
      '主面料', '', '', 
      '辅料', ''
    ]);
    
    // Row 3
    wsData.push([
      '工艺', plan.process, '面料编号', 
      plan.fabrics[0]?.itemNumber || '', 
      plan.fabrics[1]?.itemNumber || '', 
      plan.fabrics[2]?.itemNumber || '', 
      plan.fabrics[3]?.itemNumber || '', 
      plan.fabrics[4]?.itemNumber || ''
    ]);
    
    // Row 4
    wsData.push([
      '', '', '门幅cm', 
      plan.fabrics[0]?.width || '', 
      plan.fabrics[1]?.width || '', 
      plan.fabrics[2]?.width || '', 
      plan.fabrics[3]?.width || '', 
      plan.fabrics[4]?.width || ''
    ]);
    
    // Row 5
    wsData.push([
      '', '', '克重g/m²', 
      plan.fabrics[0]?.weight || '', 
      plan.fabrics[1]?.weight || '', 
      plan.fabrics[2]?.weight || '', 
      plan.fabrics[3]?.weight || '', 
      plan.fabrics[4]?.weight || ''
    ]);
    
    // Row 6
    wsData.push([
      '颜色', '色号', '品名', 
      plan.fabrics[0]?.productName || '', 
      plan.fabrics[1]?.productName || '', 
      plan.fabrics[2]?.productName || '', 
      plan.fabrics[3]?.productName || '', 
      plan.fabrics[4]?.productName || ''
    ]);
    
    // Data Rows
    plan.rows.forEach(row => {
      wsData.push([
        row.colorName, 
        row.colorCode, 
        row.notes, 
        row.quantities[0] || '', 
        row.quantities[1] || '', 
        row.quantities[2] || '', 
        row.quantities[3] || '', 
        row.quantities[4] || ''
      ]);
    });
    
    // Total Row
    const totalRowIdx = wsData.length;
    wsData.push([
      '合计数量', '', '', 
      calculateRowTotal(plan, 0) || '', 
      calculateRowTotal(plan, 1) || '', 
      calculateRowTotal(plan, 2) || '', 
      calculateRowTotal(plan, 3) || '', 
      calculateRowTotal(plan, 4) || ''
    ]);
    
    // Notes Row
    const notesRowIdx = wsData.length;
    wsData.push([
      '备注：', plan.notes, '', '', '', '', '', ''
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Merges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Customer
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Style
      { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // Date
      { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } }, // Delivery
      { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // Contract
      { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } }, // Main Fabric
      { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, // Accessory
      { s: { r: 3, c: 0 }, e: { r: 5, c: 0 } }, // Process Label
      { s: { r: 3, c: 1 }, e: { r: 5, c: 1 } }, // Process Value
      { s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 2 } }, // Total Label
      { s: { r: notesRowIdx, c: 1 }, e: { r: notesRowIdx, c: 7 } }, // Notes Value
    ];
    
    // Column widths
    ws['!cols'] = [
      { wch: 15 }, // 颜色/工艺
      { wch: 15 }, // 色号/编辑区
      { wch: 15 }, // 品名/标签
      { wch: 12 }, // 面料1
      { wch: 12 }, // 面料2
      { wch: 12 }, // 面料3
      { wch: 12 }, // 辅料1
      { wch: 12 }, // 辅料2
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "计划单");
    XLSX.writeFile(wb, `${plan.customer}_${plan.styleNumber}_计划单.xlsx`);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          title="打印预览"
        >
          <Printer className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all text-xs font-bold"
        >
          <Printer className="w-4 h-4" />
          打印预览
        </button>
      )}

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] my-8 relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">打印预览</h3>
                    <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">
                      {plan.customer} / {plan.styleNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-bold"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    导出 Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold disabled:opacity-50"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    {isExporting ? '正在生成...' : '下载 PDF'}
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-8 bg-gray-100/50">
                <div className="mx-auto shadow-2xl origin-top scale-[0.85] sm:scale-100">
                  <div ref={pdfRef} className="w-[210mm] bg-white p-10 text-black font-sans leading-tight mx-auto">
                    <div className="border-[1.5px] border-black">
                      <h1 className="text-2xl font-bold text-center py-4 tracking-[0.2em]">臻林面料染色计划单</h1>
                      
                      <table className="w-full border-collapse text-[11px] text-center border-t-[1.5px] border-l-[1.5px] border-black table-fixed">
                        <colgroup><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /></colgroup>
                        <tbody>
                          <tr>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                              客户：{plan.customer}
                            </td>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                              款号：{plan.styleNumber}
                            </td>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                              日期：{plan.date}
                            </td>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                              预计交期：{plan.deliveryDate}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">合同号</td>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                              {plan.contractNumber}
                            </td>
                            <td colSpan={3} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">主面料</td>
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">辅料</td>
                          </tr>
                          <tr>
                            <td rowSpan={3} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">工艺</td>
                            <td rowSpan={3} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle whitespace-pre-wrap">
                              {plan.process}
                            </td>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium leading-tight whitespace-nowrap align-middle">面料编号</td>
                            {plan.fabrics.map((f, i) => (
                              <td key={i} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                                {f.itemNumber || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium leading-tight whitespace-nowrap align-middle">门幅cm</td>
                            {plan.fabrics.map((f, i) => (
                              <td key={i} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                                {f.width || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium leading-tight whitespace-nowrap align-middle">克重g/m²</td>
                            {plan.fabrics.map((f, i) => (
                              <td key={i} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                                {f.weight || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="h-14">
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">颜色</td>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">色号</td>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black font-medium align-middle">品名</td>
                            {plan.fabrics.map((f, i) => (
                              <td key={i} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle whitespace-pre-wrap">
                                {f.productName || '-'}
                              </td>
                            ))}
                          </tr>
                          {plan.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">{row.colorName}</td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">{row.colorCode}</td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">{row.notes}</td>
                              {row.quantities.map((q, idx) => (
                                <td key={idx} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">{q}</td>
                              ))}
                            </tr>
                          ))}
                          {[...Array(Math.max(0, 10 - plan.rows.length))].map((_, i) => (
                            <tr key={`empty-${i}`}>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                              <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black h-7 align-middle"></td>
                            </tr>
                          ))}
                          <tr className="font-bold">
                            <td colSpan={2} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">合计数量</td>
                            <td className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle"></td>
                            {[0, 1, 2, 3, 4].map((i) => (
                              <td key={i} className="p-1.5 border-r-[1.5px] border-b-[1.5px] border-black align-middle">
                                {calculateRowTotal(plan, i)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td colSpan={8} className="p-1.5 text-left align-top min-h-[60px] border-r-[1.5px] border-b-[1.5px] border-black">
                              <div className="flex">
                                <span className="whitespace-nowrap font-medium">备注：</span>
                                <div className="whitespace-pre-wrap">{plan.notes}</div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
