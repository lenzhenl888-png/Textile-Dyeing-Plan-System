import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, X, Upload, FileSpreadsheet } from 'lucide-react';
import { storage, Fabric } from '../services/storage';
import * as XLSX from 'xlsx';

export default function FabricManager() {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    width: '', 
    weight: '', 
    field1: '', 
    field2: '' 
  });

  useEffect(() => {
    loadFabrics();
  }, []);

  const loadFabrics = () => {
    setFabrics(storage.getFabrics());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    storage.saveFabric({
      id: editingId || undefined,
      name: formData.name,
      code: formData.code,
      width: formData.width,
      weight: formData.weight,
      field1: formData.field1,
      field2: formData.field2,
    });

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', code: '', width: '', weight: '', field1: '', field2: '' });
    loadFabrics();
  };

  const handleEdit = (fabric: Fabric) => {
    setEditingId(fabric.id);
    setFormData({
      name: fabric.name,
      code: fabric.code,
      width: fabric.width || '',
      weight: fabric.weight || '',
      field1: fabric.field1 || '',
      field2: fabric.field2 || '',
    });
    setIsAdding(true);
  };

  const confirmDelete = (id: string) => {
    storage.deleteFabric(id);
    loadFabrics();
    setDeleteConfirmId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const existingFabrics = storage.getFabrics();
        let importedCount = 0;
        let updatedCount = 0;

        data.forEach((row: any) => {
          // Map Excel columns to Fabric properties
          const name = row['面料名称'] || row['品名'] || row['Name'] || row['name'];
          const code = row['编号'] || row['货号'] || row['Code'] || row['code'] || row['itemNumber'];
          
          if (name && code) {
            const existingFabric = existingFabrics.find(f => f.code === String(code));
            
            storage.saveFabric({
              id: existingFabric?.id, // If it exists, this will update it instead of creating a new one
              name: String(name),
              code: String(code),
              width: String(row['门幅'] || row['幅宽'] || row['门幅(cm)'] || row['门幅cm'] || row['Width'] || row['width'] || ''),
              weight: String(row['克重'] || row['克重(g/m2)'] || row['克重g/m2'] || row['Weight'] || row['weight'] || ''),
              field1: String(row['备注1'] || row['备注'] || row['Field1'] || ''),
              field2: String(row['备注2'] || row['Field2'] || ''),
            });
            
            if (existingFabric) {
              updatedCount++;
            } else {
              importedCount++;
            }
          }
        });
        
        if (importedCount > 0 || updatedCount > 0) {
          loadFabrics();
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          console.warn("No valid fabric data found in Excel file.");
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">面料数据库</h2>
          <p className="text-sm text-gray-500 mt-1">管理您的面料主列表和规格。</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            导入 Excel
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ name: '', code: '', width: '', weight: '', field1: '', field2: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            添加面料
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? '编辑面料' : '添加新面料'}
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">面料名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="例如：棉斜纹"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">编号</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="例如：CT-2024-01"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">门幅</label>
              <input
                type="text"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="例如：150cm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">克重</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="例如：200gsm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">备注栏1</label>
              <input
                type="text"
                value={formData.field1}
                onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="自定义内容..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">备注栏2</label>
              <input
                type="text"
                value={formData.field2}
                onChange={(e) => setFormData({ ...formData, field2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="自定义内容..."
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                {editingId ? '更新面料' : '保存面料'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">面料名称</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">编号</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">门幅</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">克重</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">备注1</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">备注2</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fabrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                    未找到面料。请添加您的第一个面料以开始。
                  </td>
                </tr>
              ) : (
                fabrics.map((fabric) => (
                  <tr key={fabric.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{fabric.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{fabric.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fabric.width || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fabric.weight || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fabric.field1 || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fabric.field2 || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      {deleteConfirmId === fabric.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600 font-medium mr-1">确定删除?</span>
                          <button
                            onClick={() => confirmDelete(fabric.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            确认
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(fabric)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(fabric.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
