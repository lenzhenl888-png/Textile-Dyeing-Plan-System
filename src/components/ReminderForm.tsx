import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { storage, Reminder, DyeingPlan, Contact } from '../services/storage';
import { cn } from '../lib/utils';

export default function ReminderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<DyeingPlan[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [formData, setFormData] = useState<Partial<Reminder>>({
    event: '',
    planId: '',
    planLabel: '',
    expectedDate: new Date().toISOString().split('T')[0],
    confirmDate: new Date().toISOString().split('T')[0],
    contact: '',
    factory: '',
    phone: '',
    isCompleted: false,
    futureDate: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const [loadedPlans, loadedContacts] = await Promise.all([
        storage.getPlans(),
        storage.getContacts()
      ]);
      setPlans(loadedPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setContacts(loadedContacts.sort((a, b) => a.name.localeCompare(b.name)));

      if (id) {
        const reminder = await storage.getReminder(id);
        if (reminder) {
          setFormData(reminder);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'planId') {
      const selectedPlan = plans.find(p => p.id === value);
      setFormData(prev => ({ 
        ...prev, 
        planId: value,
        planLabel: selectedPlan ? `${selectedPlan.contractNumber || '无合同'} / ${selectedPlan.styleNumber || '无款号'}` : ''
      }));
    } else if (name === 'contactSelect') {
      const selectedContact = contacts.find(c => c.id === value);
      if (selectedContact) {
        setFormData(prev => ({
          ...prev,
          contact: selectedContact.name,
          phone: selectedContact.phone,
          factory: selectedContact.factory
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event) {
      setError('请填写事件名称');
      return;
    }
    if (!formData.confirmDate) {
      setError('请填写确认时间');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await storage.saveReminder(formData);
      navigate('/reminders');
    } catch (err) {
      console.error("Error saving reminder:", err);
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500 italic">加载中...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reminders')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{id ? '编辑提醒事项' : '新建提醒事项'}</h2>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">事件名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="event"
                value={formData.event}
                onChange={handleChange}
                placeholder="例如：确认面料是否到厂"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联计划单</label>
              <select
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option value="">-- 不关联 --</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.contractNumber ? `${plan.contractNumber} / ` : ''}{plan.styleNumber || '无款号'} ({plan.customer})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预计完成时间</label>
              <input
                type="date"
                name="expectedDate"
                value={formData.expectedDate}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认时间 <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="confirmDate"
                value={formData.confirmDate}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="mb-4">
              <label className="block text-sm font-medium text-indigo-700 mb-1">从联系人数据库快速选择</label>
              <select
                name="contactSelect"
                onChange={handleChange}
                className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-900"
              >
                <option value="">-- 选择联系人自动填充 --</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.factory ? `(${contact.factory})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="姓名"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="手机或座机号码"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">工厂</label>
                <input
                  type="text"
                  name="factory"
                  value={formData.factory}
                  onChange={handleChange}
                  placeholder="例如：某某印染厂"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                name="isCompleted"
                checked={formData.isCompleted}
                onChange={handleChange}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-bold text-gray-900">已确认完成</span>
            </label>
          </div>

          {!formData.isCompleted && (
            <div className="space-y-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <h4 className="font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                未完成跟进
              </h4>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">未来预计完成时间</label>
                <input
                  type="date"
                  name="futureDate"
                  value={formData.futureDate || ''}
                  onChange={handleChange}
                  className="w-full p-3 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-700 mb-1">未完成原因及备注</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
                  placeholder="记录为什么没有完成，以及下一步的计划..."
                />
              </div>
            </div>
          )}

        </div>

        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/reminders')}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-sm",
              saving ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700 hover:shadow"
            )}
          >
            <Save className="w-5 h-5" />
            {saving ? '保存中...' : '保存提醒'}
          </button>
        </div>
      </form>
    </div>
  );
}
