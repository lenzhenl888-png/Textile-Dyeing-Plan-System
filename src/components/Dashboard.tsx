import React, { useState, useEffect } from 'react';
import { storage, DyeingPlan } from '../services/storage';
import { Layers, CheckCircle2, Factory, TrendingUp, Package, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [plans, setPlans] = useState<DyeingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await storage.getPlans();
      setPlans(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        正在加载统计数据...
      </div>
    );
  }

  // Calculate statistics
  const completedPlans = plans.filter(p => p.progress?.['完成']);
  const inProgressPlans = plans.filter(p => !p.progress?.['完成']);

  let totalPendingKg = 0;
  let totalPendingMeters = 0;

  inProgressPlans.forEach(plan => {
    plan.rows.forEach((row, rIdx) => {
      row.quantities.forEach((q, cIdx) => {
        const val = parseFloat(String(q));
        if (!isNaN(val)) {
          // 如果该明细项被单独标记完成，则不再统计入未完成数量中
          const isCellCompleted = !!plan.progress?.[`cell_completed_${rIdx}_${cIdx}`];
          if (isCellCompleted) return;

          // 只统计主面料（剔除辅料），同时自动识别“带”和“绳”结尾的（强制排除在外，因为这些也不算通常的布料主面料）
          const fabric = plan.fabrics?.[cIdx];
          const isMainFabric = fabric?.type === 'main';
          const productName = fabric?.productName || '';
          const isAccessoryItem = productName.trim().endsWith('带') || productName.trim().endsWith('绳');

          if (isMainFabric && !isAccessoryItem) {
            const unit = fabric?.unit || plan.unit || '公斤';
            if (unit === '公斤') {
              totalPendingKg += val;
            } else if (unit === '米') {
              totalPendingMeters += val;
            }
          }
        }
      });
    });
  });

  const pendingTons = (totalPendingKg / 1000).toFixed(2);

  const stats = [
    {
      title: '未完成面料总量',
      value: `${pendingTons} 吨`,
      subtitle: totalPendingMeters > 0 ? `(另有 ${totalPendingMeters.toLocaleString()} 米未完成)` : '仅计算单位为"公斤"的数据',
      icon: Factory,
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      trend: '需排产'
    },
    {
      title: '进行中订单',
      value: inProgressPlans.length.toString(),
      subtitle: '正在生产/排期中的计划单',
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      trend: '待跟进'
    },
    {
      title: '已完成订单',
      value: completedPlans.length.toString(),
      subtitle: '历史累计已完成的计划单',
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      trend: '已归档'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">数据统计</h2>
        <p className="text-sm text-gray-500 mt-1">全局生产计划与订单状态纵览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden relative group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", stat.lightColor, stat.textColor)}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", stat.lightColor, stat.textColor)}>
                  {stat.trend}
                </span>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
                <div className="text-3xl font-black text-gray-900 mb-2">{stat.value}</div>
                <p className="text-gray-400 text-xs">{stat.subtitle}</p>
              </div>

              {/* Decorative background shape */}
              <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500", stat.color)} />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/new-plan" className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 font-medium group">
              <Package className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
              <span>新建面料计划</span>
            </Link>
            <Link to="/progress" className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 font-medium group">
              <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
              <span>查看进度表</span>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
           <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">最新活跃订单</h3>
          </div>
          <div className="space-y-4">
            {inProgressPlans.slice(0, 3).map((plan) => (
              <Link key={plan.id} to={`/view-plan/${plan.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <div className="text-sm font-bold text-gray-900">{plan.customer || '未命名客户'}</div>
                    <div className="text-xs text-gray-500">{plan.styleNumber || '暂无款号'} {plan.contractNumber ? `· ${plan.contractNumber}` : ''}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{plan.date}</div>
              </Link>
            ))}
            {inProgressPlans.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">
                暂无正在进行的订单
              </div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
