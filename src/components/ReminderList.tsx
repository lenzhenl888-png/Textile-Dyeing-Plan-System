import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Calendar as CalendarIcon, Clock, Phone, Factory, User, CheckCircle2, AlertCircle, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { storage, Reminder } from '../services/storage';
import { cn } from '../lib/utils';
import { format, isPast, isToday, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function ReminderList() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(startOfToday()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    setLoading(true);
    const data = await storage.getReminders();
    // Sort by confirmDate ascending (closest first)
    setReminders(data.sort((a, b) => new Date(a.confirmDate).getTime() - new Date(b.confirmDate).getTime()));
    setLoading(false);
  };

  const confirmDelete = async (id: string) => {
    await storage.deleteReminder(id);
    loadReminders();
    setDeleteConfirmId(null);
    setSelectedReminder(null);
  };

  const toggleComplete = async (reminder: Reminder) => {
    const updated = { ...reminder, isCompleted: !reminder.isCompleted };
    await storage.saveReminder(updated);
    if (selectedReminder?.id === reminder.id) {
      setSelectedReminder(updated);
    }
    loadReminders();
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const remindersByDate = useMemo(() => {
    return reminders.reduce((acc, reminder) => {
      // Collect dates that have reminders
      const dates = [reminder.expectedDate, reminder.confirmDate, reminder.futureDate].filter(Boolean) as string[];
      dates.forEach(d => {
        if (!acc[d]) acc[d] = [];
        // Avoid duplicates in the same date
        if (!acc[d].find(r => r.id === reminder.id)) {
          acc[d].push(reminder);
        }
      });
      return acc;
    }, {} as Record<string, Reminder[]>);
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    if (!selectedCalendarDate) return reminders;
    const selectedStr = format(selectedCalendarDate, 'yyyy-MM-dd');
    return remindersByDate[selectedStr] || [];
  }, [reminders, selectedCalendarDate, remindersByDate]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500 italic">正在加载提醒事项...</div>;

  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            提醒事项
          </h2>
          <p className="text-sm text-gray-500 mt-1">管理订单跟进和待办任务</p>
        </div>
        <button
          onClick={() => navigate(selectedCalendarDate ? `/reminders/new?date=${format(selectedCalendarDate, 'yyyy-MM-dd')}` : '/reminders/new')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新建提醒
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">
                {format(currentMonth, 'yyyy年 MM月')}
              </h3>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, dayIdx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasReminders = !!remindersByDate[dateStr]?.length;
                const hasUncompleted = remindersByDate[dateStr]?.some(r => !r.isCompleted);
                const isSelected = selectedCalendarDate ? isSameDay(day, selectedCalendarDate) : false;
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedCalendarDate(isSelected ? null : day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center p-1 rounded-lg text-sm relative transition-all duration-200",
                      !isCurrentMonth && "text-gray-300",
                      isCurrentMonth && !isSelected && "hover:bg-indigo-50 text-gray-700",
                      isSelected && "bg-indigo-600 text-white font-bold shadow-md",
                      hasReminders && !isSelected && "font-bold text-indigo-900 bg-indigo-50/50"
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {hasReminders && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-0.5",
                        hasUncompleted ? (isSelected ? "bg-amber-300" : "bg-red-500") : (isSelected ? "bg-indigo-300" : "bg-emerald-500")
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-red-500" /> 有未完成提醒
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> 全已完成
              </div>
            </div>
            
            <button
              onClick={() => navigate(selectedCalendarDate ? `/reminders/new?date=${format(selectedCalendarDate, 'yyyy-MM-dd')}` : '/reminders/new')}
              className="mt-6 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors border border-indigo-100 border-dashed"
            >
              <Plus className="w-4 h-4" />
              {selectedCalendarDate ? `新建 ${format(selectedCalendarDate, 'MM-dd')} 提醒` : '新建提醒事项'}
            </button>
          </div>
        </div>

        {/* Reminders List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              {selectedCalendarDate ? (
                <>
                  <CalendarIcon className="w-5 h-5 text-indigo-500" />
                  {format(selectedCalendarDate, 'yyyy年MM月dd日')} 的提醒
                  <button 
                    onClick={() => setSelectedCalendarDate(null)}
                    className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
                  >
                    查看全部
                  </button>
                </>
              ) : (
                "全部提醒"
              )}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredReminders.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-300"
                >
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {selectedCalendarDate 
                      ? `${format(selectedCalendarDate, 'MM月dd日')} 没有提醒事项`
                      : "暂无提醒事项"
                    }
                  </p>
                  {selectedCalendarDate && (
                    <button
                      onClick={() => navigate(`/reminders/new?date=${format(selectedCalendarDate, 'yyyy-MM-dd')}`)}
                      className="mt-4 px-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                    >
                      立即添加
                    </button>
                  )}
                </motion.div>
              ) : (
                filteredReminders.map((reminder, index) => {
              const isOverdue = !reminder.isCompleted && isPast(parseISO(reminder.confirmDate)) && !isToday(parseISO(reminder.confirmDate));
              const isDueToday = !reminder.isCompleted && isToday(parseISO(reminder.confirmDate));
              
              // Determine which date to show
              let displayDate = reminder.expectedDate;
              let dateLabel = "预计";
              if (isOverdue && reminder.futureDate) {
                displayDate = reminder.futureDate;
                dateLabel = "延期至";
              } else if (reminder.confirmDate) {
                displayDate = reminder.confirmDate;
                dateLabel = "确认";
              }

              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedReminder(reminder)}
                  className={cn(
                    "bg-white rounded-lg border shadow-sm overflow-hidden relative transition-all cursor-pointer hover:shadow-md hover:border-indigo-300",
                    reminder.isCompleted ? "border-emerald-200 opacity-75 bg-gray-50" : 
                    isOverdue ? "border-red-300 shadow-red-100" : 
                    isDueToday ? "border-amber-300 shadow-amber-100" : "border-gray-200"
                  )}
                >
                  {/* Status Indicator Bar */}
                  <div className={cn(
                    "absolute top-0 left-0 bottom-0 w-1",
                    reminder.isCompleted ? "bg-emerald-500" : 
                    isOverdue ? "bg-red-500" : 
                    isDueToday ? "bg-amber-500" : "bg-indigo-500"
                  )} />

                  <div className="p-3 pl-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={cn(
                        "text-base font-bold text-gray-900 leading-tight truncate flex-1",
                        reminder.isCompleted && "line-through text-gray-500"
                      )}>
                        {reminder.event}
                      </h3>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                        reminder.isCompleted ? "bg-emerald-100 text-emerald-700" :
                        isOverdue ? "bg-red-100 text-red-700" :
                        isDueToday ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                      )}>
                        {reminder.isCompleted ? '已完成' : isOverdue ? '已逾期' : isDueToday ? '今日待办' : '待跟进'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                      <div className={cn(
                        "flex items-center gap-1",
                        isOverdue && !reminder.isCompleted ? "text-red-600 font-medium" : ""
                      )}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{dateLabel}: {displayDate}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate max-w-[50%]">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{reminder.contact || '无联系人'}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(reminder);
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                          reminder.isCompleted 
                            ? "bg-gray-200 text-gray-600 hover:bg-gray-300" 
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {reminder.isCompleted ? '取消完成' : '确认完成'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate(selectedCalendarDate ? `/reminders/new?date=${format(selectedCalendarDate, 'yyyy-MM-dd')}` : '/reminders/new')}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReminder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  提醒详情
                </h3>
                <button onClick={() => setSelectedReminder(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">事件名称</div>
                  <div className="text-base font-bold text-gray-900">{selectedReminder.event}</div>
                </div>

                {selectedReminder.planLabel && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">关联计划单</div>
                    <div className="text-sm font-medium text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                      {selectedReminder.planLabel}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">预计完成时间</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {selectedReminder.expectedDate || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">确认时间</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {selectedReminder.confirmDate || '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">联系人</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      {selectedReminder.contact || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">工厂</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-gray-400" />
                      {selectedReminder.factory || '-'}
                    </div>
                  </div>
                </div>

                {selectedReminder.phone && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">电话</div>
                    <div className="text-sm text-gray-900 flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedReminder.phone}`} className="text-indigo-600 hover:underline font-medium">
                        {selectedReminder.phone}
                      </a>
                    </div>
                  </div>
                )}

                {!selectedReminder.isCompleted && selectedReminder.futureDate && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="flex items-center gap-1.5 text-red-700 font-bold mb-1">
                      <AlertCircle className="w-4 h-4" />
                      延期信息
                    </div>
                    <div className="text-sm text-red-800 mb-1">预计延期至: {selectedReminder.futureDate}</div>
                    {selectedReminder.notes && (
                      <div className="text-xs text-red-700/80 mt-2 border-t border-red-200/50 pt-2">
                        备注: {selectedReminder.notes}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedReminder.isCompleted && selectedReminder.notes && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">备注</div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                      {selectedReminder.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/reminders/edit/${selectedReminder.id}`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmId(selectedReminder.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
                <button
                  onClick={() => toggleComplete(selectedReminder)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm",
                    selectedReminder.isCompleted 
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300" 
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedReminder.isCompleted ? '标记为未完成' : '确认已完成'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">删除提醒</h3>
                    <p className="text-sm text-gray-500 mt-1">确定要删除此提醒吗？</p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
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
                    删除
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
