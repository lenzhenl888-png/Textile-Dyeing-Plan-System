import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Edit2 } from 'lucide-react';
import { Customer, storage } from '../services/storage';
import { cn } from '../lib/utils';

interface CustomerManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onCustomersChange: (customers: Customer[]) => void;
  onSelectCustomer?: (customerName: string) => void;
}

export function CustomerManagerDialog({
  isOpen,
  onClose,
  customers,
  onCustomersChange,
  onSelectCustomer
}: CustomerManagerDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({ name: '', code: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer.name?.trim()) return;
    
    setSavingCustomer(true);
    try {
      const saved = await storage.saveCustomer({
        ...editingCustomer,
        name: editingCustomer.name.trim(),
        code: editingCustomer.code?.trim() || ''
      });
      
      let updatedCustomers;
      if (editingCustomer.id) {
        updatedCustomers = customers.map(c => c.id === saved.id ? saved : c);
      } else {
        updatedCustomers = [...customers, saved];
      }
      
      onCustomersChange(updatedCustomers);
      setEditingCustomer({ name: '', code: '' });
      
      if (!editingCustomer.id && onSelectCustomer) {
        onSelectCustomer(saved.name);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save customer', err);
      alert('保存失败，请重试');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!id) {
      alert("该数据缺少ID，可能由于旧版数据未正确同步。为确保数据一致性，请尝试刷新页面。");
      return;
    }
    
    setDeletingId(id);
    try {
      await storage.deleteCustomer(id);
      const updatedCustomers = customers.filter(c => c.id !== id);
      onCustomersChange(updatedCustomers);
      if (editingCustomer.id === id) {
        setEditingCustomer({ name: '', code: '' });
      }
    } catch (err) {
      console.error('Failed to delete customer', err);
      // alert deleted so we don't throw blocking alert (user handled error upstream mostly, maybe not permissions)
      alert("错误：无法删除。这可能是因为无网络连接或是受保护的数据。");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleCancelEdit = () => {
    setEditingCustomer({ name: '', code: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h3 className="text-xl font-bold text-gray-900">客户管理</h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left panel: Add/Edit customer */}
          <div className="w-full md:w-1/3 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-100 shrink-0 flex flex-col">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              {editingCustomer.id ? '编辑客户' : '新增客户'}
            </h4>
            <form onSubmit={handleSaveCustomer} className="space-y-4 flex flex-col flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="例如: 某某制衣厂"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户编号 / 备注 (选填)</label>
                <textarea
                  value={editingCustomer.code || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 transition-shadow"
                  placeholder="客户的内部编号或其他信息..."
                />
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-2">
                {editingCustomer.id && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all shadow-sm"
                  >
                    取消编辑
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingCustomer || !editingCustomer.name?.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm",
                    (savingCustomer || !editingCustomer.name?.trim()) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {savingCustomer ? '保存中...' : (
                    <>
                      {editingCustomer.id ? null : <Plus className="w-4 h-4" />}
                      {editingCustomer.id ? '保存更改' : '确认添加'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right panel: Customer list */}
          <div className="w-full md:w-2/3 flex flex-col p-6 bg-white overflow-hidden">
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 shrink-0 flex justify-between items-center">
              <span>客户列表 ({filteredCustomers.length})</span>
            </h4>
            
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索客户名称或编号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border border-gray-200 rounded-lg bg-gray-50/30">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-100/80 sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">客户名称</th>
                    <th className="px-4 py-3 font-medium text-gray-600">编号/备注</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <tr key={c.id || c.name} className={cn("hover:bg-indigo-50/50 transition-colors group", editingCustomer.id === c.id && c.id && "bg-indigo-50")}>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={c.code}>{c.code || '-'}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1">
                          {confirmDeleteId === c.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                              <span className="text-xs text-red-600 font-medium">确认删除?</span>
                              <button
                                onClick={() => handleDeleteCustomer(c.id)}
                                disabled={deletingId === c.id}
                                className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                              >
                                {deletingId === c.id ? '删除中...' : '确定'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === c.id}
                                className="px-2 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditClick(c)}
                                disabled={!c.id}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title={c.id ? "编辑该客户" : "缺少ID，无法编辑"}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(c.id)}
                                disabled={!c.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title={c.id ? "删除该客户" : "缺少ID，无法删除"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-gray-400">
                        {searchTerm ? '未找到匹配的客户' : '暂无客户数据'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
