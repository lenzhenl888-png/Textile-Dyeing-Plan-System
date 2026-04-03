import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle, Plus, Trash2, Eraser } from 'lucide-react';
import { storage, DyeingPlan, FabricDetail, ColorRow } from '../services/storage';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

const DRAFT_KEY = 'dyeing_plan_form_draft';

const INITIAL_FABRICS: FabricDetail[] = [
  { type: 'main', itemNumber: '', width: '', weight: '', productName: '' },
  { type: 'main', itemNumber: '', width: '', weight: '', productName: '' },
  { type: 'main', itemNumber: '', width: '', weight: '', productName: '' },
  { type: 'accessory', itemNumber: '', width: '', weight: '', productName: '' },
  { type: 'accessory', itemNumber: '', width: '', weight: '', productName: '' },
];

const INITIAL_ROW = (): ColorRow => ({
  id: uuidv4(),
  colorName: '',
  colorCode: '',
  notes: '',
  quantities: ['', '', '', '', ''],
});

export default function DyeingPlanForm({ readOnly = false }: { readOnly?: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [formData, setFormData] = useState<Partial<DyeingPlan>>({
    customer: '',
    styleNumber: '',
    contractNumber: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    process: '',
    fabrics: [...INITIAL_FABRICS],
    rows: [INITIAL_ROW()],
    unit: '公斤',
    notes: '颜色对样.色牢度4级.手感按样.成品后不能有细皱纹.直条纹.布面干净注意污渍.缩水率3%以内坯布因水洗可按水洗后门幅做 .一定不能有折横.手感同样.',
  });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const draftKey = id ? `${DRAFT_KEY}_${id}` : DRAFT_KEY;
      const draft = localStorage.getItem(draftKey);

      if (id) {
        const plan = storage.getPlan(id);
        if (plan) {
          if (draft) {
            try {
              setFormData(JSON.parse(draft));
            } catch (e) {
              setFormData(plan);
            }
          } else {
            setFormData(plan);
          }
        }
      } else {
        // Check for draft for new plans
        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            // Only use draft if it doesn't have an ID (it's a new plan draft)
            if (!parsedDraft.id) {
              setFormData(parsedDraft);
            }
          } catch (e) {
            console.error("Failed to parse draft", e);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  // Save draft whenever formData changes
  useEffect(() => {
    if (!loading && !readOnly) {
      const draftKey = id ? `${DRAFT_KEY}_${id}` : DRAFT_KEY;
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, id, loading, readOnly]);

  const handleClearAll = () => {
    const resetData = {
      customer: '',
      styleNumber: '',
      contractNumber: '',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      process: '',
      fabrics: INITIAL_FABRICS.map(f => ({ ...f })),
      rows: [INITIAL_ROW()],
      unit: '公斤' as const,
      notes: '颜色对样.色牢度4级.手感按样.成品后不能有细皱纹.直条纹.布面干净注意污渍.缩水率3%以内坯布因水洗可按水洗后门幅做 .一定不能有折横.手感同样.',
    };
    setFormData(resetData);
    
    // Clear draft
    const draftKey = id ? `${DRAFT_KEY}_${id}` : DRAFT_KEY;
    localStorage.removeItem(draftKey);
    
    setShowClearConfirm(false);
  };

  const handleFabricChange = (index: number, field: keyof FabricDetail, value: string) => {
    const newFabrics = [...(formData.fabrics || [])];
    const updatedFabric = { ...newFabrics[index], [field]: value };
    
    // Auto-fill from fabric database when itemNumber changes
    if (field === 'itemNumber') {
      if (value) {
        const dbFabrics = storage.getFabrics();
        const matchedFabric = dbFabrics.find(f => f.code === value);
        if (matchedFabric) {
          updatedFabric.productName = matchedFabric.name || updatedFabric.productName;
          updatedFabric.width = matchedFabric.width || updatedFabric.width;
          updatedFabric.weight = matchedFabric.weight || updatedFabric.weight;
        }
      } else {
        // Clear fields when itemNumber is deleted
        updatedFabric.productName = '';
        updatedFabric.width = '';
        updatedFabric.weight = '';
      }
    }
    
    newFabrics[index] = updatedFabric;
    setFormData({ ...formData, fabrics: newFabrics });
  };

  const handleRowChange = (rowIndex: number, field: keyof ColorRow, value: any, qIndex?: number) => {
    const newRows = [...(formData.rows || [])];
    if (field === 'quantities' && qIndex !== undefined) {
      const newQuantities = [...newRows[rowIndex].quantities];
      newQuantities[qIndex] = value;
      newRows[rowIndex].quantities = newQuantities;
    } else {
      newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
    }
    setFormData({ ...formData, rows: newRows });
  };

  const addRow = () => {
    setFormData({ ...formData, rows: [...(formData.rows || []), INITIAL_ROW()] });
  };

  const removeRow = (index: number) => {
    const newRows = (formData.rows || []).filter((_, i) => i !== index);
    setFormData({ ...formData, rows: newRows });
  };

  const calculateTotal = (qIndex: number) => {
    return (formData.rows || []).reduce((sum, row) => {
      const val = parseFloat(row.quantities[qIndex] as string) || 0;
      return sum + val;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer) {
      setError('请填写客户名称');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      storage.savePlan(formData);
      const draftKey = id ? `${DRAFT_KEY}_${id}` : DRAFT_KEY;
      localStorage.removeItem(draftKey);
      navigate('/');
    } catch (err) {
      console.error("Error saving plan:", err);
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500 italic">加载中...</div>;

  return (
    <div className="w-full mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{id ? (readOnly ? '查看臻林面料计划单' : '编辑臻林面料计划单') : '新建臻林面料计划单'}</h2>
            <p className="text-sm text-gray-500 mt-1">根据工厂生产需求填写详细信息。</p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs text-red-600 font-bold">确定清除所有内容？</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-sm"
                >
                  确认
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100"
              >
                <Eraser className="w-4 h-4" />
                一键清除
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={readOnly} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <h1 className="text-3xl font-bold text-center mb-6 tracking-widest">臻林面料染色计划单</h1>
          
          <table className="w-full border-collapse text-sm text-center border-t border-l border-black table-fixed min-w-[1000px]">
            <colgroup><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[12.4%]" /><col className="w-[12.4%]" /><col className="w-[12.4%]" /><col className="w-[12.4%]" /><col className="w-[12.4%]" /><col className="w-[8%]" /></colgroup>
            <tbody>
              {/* Row 1: Header Info */}
              <tr>
                <td colSpan={2} className="p-2 border-r border-b border-black align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap">客户：</span>
                    <input 
                      value={formData.customer}
                      onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                      className="w-full max-w-[120px] border-b border-gray-300 focus:border-black outline-none bg-transparent text-center" 
                      required
                    />
                  </div>
                </td>
                <td colSpan={2} className="p-2 border-r border-b border-black align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap">款号：</span>
                    <input 
                      value={formData.styleNumber}
                      onChange={(e) => setFormData({ ...formData, styleNumber: e.target.value })}
                      className="w-full max-w-[120px] border-b border-gray-300 focus:border-black outline-none bg-transparent text-center" 
                    />
                  </div>
                </td>
                <td colSpan={2} className="p-2 border-r border-b border-black align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap">日期：</span>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full max-w-[130px] border-b border-gray-300 focus:border-black outline-none bg-transparent text-center" 
                    />
                  </div>
                </td>
                <td colSpan={3} className="p-2 border-r border-b border-black align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap">预计交期：</span>
                    <input 
                      type="date" 
                      value={formData.deliveryDate}
                      onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                      className="w-full max-w-[130px] border-b border-gray-300 focus:border-black outline-none bg-transparent text-center" 
                    />
                  </div>
                </td>
              </tr>

              {/* Row 2: 合同号 & 主面料/辅料 */}
              <tr>
                <td className="p-2 border-r border-b border-black font-medium align-middle">合同号</td>
                <td colSpan={2} className="p-2 border-r border-b border-black align-middle">
                  <input 
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    className="w-full outline-none bg-transparent text-center" 
                  />
                </td>
                <td colSpan={3} className="p-2 border-r border-b border-black font-medium align-middle">主面料</td>
                <td colSpan={3} className="p-2 border-r border-b border-black font-medium align-middle">辅料</td>
              </tr>

              {/* Row 3: 工艺, 面料编号 */}
              <tr>
                <td rowSpan={3} className="p-2 border-r border-b border-black font-medium align-middle">工艺</td>
                <td rowSpan={3} className="p-2 border-r border-b border-black align-middle">
                  <textarea 
                    value={formData.process}
                    onChange={(e) => setFormData({ ...formData, process: e.target.value })}
                    className="w-full h-full min-h-[100px] outline-none bg-transparent resize-none text-center" 
                    placeholder="编辑区" 
                  />
                </td>
                <td className="p-2 border-r border-b border-black font-medium whitespace-nowrap align-middle">面料编号</td>
                {formData.fabrics?.map((fabric, i) => (
                  <td key={i} className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={fabric.itemNumber}
                      onChange={(e) => handleFabricChange(i, 'itemNumber', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder="编辑区"
                    />
                  </td>
                ))}
                <td className="p-2 border-r border-b border-black align-middle"></td>
              </tr>

              {/* Row 4: 门幅cm */}
              <tr>
                <td className="p-2 border-r border-b border-black font-medium whitespace-nowrap align-middle">门幅cm</td>
                {formData.fabrics?.map((fabric, i) => (
                  <td key={i} className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={fabric.width}
                      onChange={(e) => handleFabricChange(i, 'width', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder="编辑区"
                    />
                  </td>
                ))}
                <td className="p-2 border-r border-b border-black align-middle"></td>
              </tr>

              {/* Row 5: 克重g/m² */}
              <tr>
                <td className="p-2 border-r border-b border-black font-medium whitespace-nowrap align-middle">克重g/m²</td>
                {formData.fabrics?.map((fabric, i) => (
                  <td key={i} className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={fabric.weight}
                      onChange={(e) => handleFabricChange(i, 'weight', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder="编辑区"
                    />
                  </td>
                ))}
                <td className="p-2 border-r border-b border-black align-middle"></td>
              </tr>

              {/* Row 6: 颜色, 色号, 品名 */}
              <tr className="h-14">
                <td className="p-2 border-r border-b border-black font-medium align-middle">颜色</td>
                <td className="p-2 border-r border-b border-black font-medium align-middle">色号</td>
                <td className="p-2 border-r border-b border-black font-medium align-middle">品名</td>
                {formData.fabrics?.map((fabric, i) => (
                  <td key={i} className="p-2 border-r border-b border-black align-middle">
                    <textarea 
                      value={fabric.productName}
                      onChange={(e) => handleFabricChange(i, 'productName', e.target.value)}
                      className="w-full outline-none bg-transparent text-center resize-none leading-tight align-middle" 
                      rows={2}
                      placeholder="编辑区"
                    />
                  </td>
                ))}
                <td className="p-2 border-r border-b border-black align-middle">
                  <select 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as '米' | '公斤' })}
                    className="w-full outline-none bg-transparent text-center text-xs"
                  >
                    <option value="公斤">公斤</option>
                    <option value="米">米</option>
                  </select>
                </td>
              </tr>

              {/* Row 7+: Data Rows */}
              {formData.rows?.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={row.colorName}
                      onChange={(e) => handleRowChange(rowIndex, 'colorName', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder={`颜色${rowIndex + 1}`}
                    />
                  </td>
                  <td className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={row.colorCode}
                      onChange={(e) => handleRowChange(rowIndex, 'colorCode', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder={`色号${rowIndex + 1}`}
                    />
                  </td>
                  <td className="p-2 border-r border-b border-black align-middle">
                    <input 
                      value={row.notes}
                      onChange={(e) => handleRowChange(rowIndex, 'notes', e.target.value)}
                      className="w-full outline-none bg-transparent text-center" 
                      placeholder="备注区"
                    />
                  </td>
                  {row.quantities.map((q, qIndex) => (
                    <td key={qIndex} className="p-2 border-r border-b border-black align-middle">
                      <input 
                        type="number"
                        value={q}
                        onChange={(e) => handleRowChange(rowIndex, 'quantities', e.target.value, qIndex)}
                        className="w-full outline-none bg-transparent text-center" 
                        placeholder="数量"
                      />
                    </td>
                  ))}
                  <td className="p-2 border-r border-b border-black align-middle text-center">
                    {!readOnly && (
                      <button 
                        type="button"
                        onClick={() => removeRow(rowIndex)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="font-bold">
                <td colSpan={2} className="p-2 border-r border-b border-black align-middle text-center">合计数量</td>
                <td className="p-2 border-r border-b border-black align-middle"></td>
                {[0, 1, 2, 3, 4].map((i) => (
                  <td key={i} className="p-2 border-r border-b border-black align-middle text-center">
                    {calculateTotal(i)}
                  </td>
                ))}
                <td className="p-2 border-r border-b border-black align-middle"></td>
              </tr>

              {/* Notes Row */}
              <tr>
                <td colSpan={9} className="p-2 text-left align-top border-r border-b border-black">
                  <div className="flex">
                    <span className="whitespace-nowrap font-medium">备注：</span>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full outline-none bg-transparent resize-none min-h-[60px]" 
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 flex justify-start">
            {!readOnly && (
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-bold"
              >
                <Plus className="w-4 h-4" />
                添加颜色行
              </button>
            )}
          </div>
        </fieldset>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            {readOnly ? '返回' : '取消'}
          </button>
          {!readOnly && (
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              <Save className="w-4 h-4" />
              {saving ? '正在保存...' : (id ? '更新计划单' : '保存计划单')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

