import React, { useState, useMemo } from 'react';
import { Calculator as CalcIcon, ArrowRight, RefreshCw, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const WEAVING_OPTIONS = [
  { label: '无损耗', value: 0 },
  { label: '普梳棉/人棉 (3%)', value: 3 },
  { label: 'CVC、精梳棉/人棉 (2.5%)', value: 2.5 },
  { label: '色纱 (4-6%)', value: 5 },
  { label: '长纤 (1%)', value: 1 },
];

const DYEING_OPTIONS = [
  { label: '无损耗', value: 0 },
  { label: '下水定型 (3-4%)', value: 3.5 },
  { label: '长纤类 (2-3%)', value: 2.5 },
  { label: '短涤 (4-5%)', value: 4.5 },
  { label: 'T/C (5%)', value: 5 },
  { label: 'CVC - 深色 (6%)', value: 6 },
  { label: 'CVC - 中色 (7%)', value: 7 },
  { label: 'CVC - 漂白和浅色 (8%)', value: 8 },
  { label: '全棉/人棉 - 深色 (6-7%)', value: 6.5 },
  { label: '全棉/人棉 - 中色 (7-8%)', value: 7.5 },
  { label: '全棉/人棉 - 漂白和浅色 (8-10%)', value: 9 },
];

const FINISHING_OPTIONS = [
  { label: '食毛 (3-5%)', value: 4 },
  { label: '磨毛 (1-2.5%)', value: 1.75 },
  { label: '抓毛 (2-3%)', value: 2.5 },
  { label: '吸毛 (1%)', value: 1 },
  { label: '浆切边 (3%)', value: 3 },
  { label: '调线彩条布/剪须 (3%)', value: 3 },
  { label: '剪毛 (1-3%)', value: 2 },
];

export default function Calculator() {
  const [orderQuantity, setOrderQuantity] = useState<number | ''>(1000);
  
  const [weavingLoss, setWeavingLoss] = useState<number>(0);
  const [dyeingLoss, setDyeingLoss] = useState<number>(0);
  const [selectedFinishing, setSelectedFinishing] = useState<number[]>([]);
  
  const [customWeaving, setCustomWeaving] = useState<string>('');
  const [customDyeing, setCustomDyeing] = useState<string>('');

  const handleFinishingToggle = (val: number) => {
    setSelectedFinishing(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const activeWeavingLoss = customWeaving !== '' ? parseFloat(customWeaving) || 0 : weavingLoss;
  const activeDyeingLoss = customDyeing !== '' ? parseFloat(customDyeing) || 0 : dyeingLoss;
  const totalFinishingLoss = selectedFinishing.reduce((sum, val) => sum + val, 0);

  const results = useMemo(() => {
    const qty = Number(orderQuantity) || 0;
    if (qty <= 0) return { greige: 0, yarn: 0, totalLoss: 0 };

    // Sequential loss calculation
    // Finished = Yarn * (1 - WeavingLoss) * (1 - DyeingLoss) * (1 - FinishingLoss)
    // Therefore: 
    // Greige = Finished / ((1 - DyeingLoss) * (1 - FinishingLoss))
    // Yarn = Greige / (1 - WeavingLoss)
    
    const dLoss = activeDyeingLoss / 100;
    const fLoss = totalFinishingLoss / 100;
    const wLoss = activeWeavingLoss / 100;

    // Prevent division by zero or negative if loss >= 100%
    if (dLoss >= 1 || fLoss >= 1 || wLoss >= 1 || (dLoss + fLoss) >= 1) {
      return { greige: 0, yarn: 0, totalLoss: 100 };
    }

    const greige = qty / ((1 - dLoss) * (1 - fLoss));
    const yarn = greige / (1 - wLoss);
    
    const totalLossPct = ((yarn - qty) / yarn) * 100;

    return {
      greige: Math.ceil(greige),
      yarn: Math.ceil(yarn),
      totalLoss: totalLossPct.toFixed(2)
    };
  }, [orderQuantity, activeWeavingLoss, activeDyeingLoss, totalFinishingLoss]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">投坯量计算器</h1>
          <p className="text-gray-500 mt-1">根据织造、染色和后整理损耗，自动计算所需的纱线和坯布数量</p>
        </div>
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <CalcIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Quantity */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2">客户下单数量 (成品 kg)</label>
            <input
              type="number"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value ? Number(e.target.value) : '')}
              className="w-full text-2xl font-bold text-indigo-600 bg-indigo-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500"
              placeholder="输入成品重量..."
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            {/* Weaving Loss */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-700">织造损耗</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">自定义:</span>
                  <input 
                    type="number" 
                    value={customWeaving}
                    onChange={(e) => {
                      setCustomWeaving(e.target.value);
                      if (e.target.value) setWeavingLoss(0);
                    }}
                    placeholder="%"
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WEAVING_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setWeavingLoss(opt.value);
                      setCustomWeaving('');
                    }}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left",
                      weavingLoss === opt.value && customWeaving === ''
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dyeing Loss */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-700">染色损耗</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">自定义:</span>
                  <input 
                    type="number" 
                    value={customDyeing}
                    onChange={(e) => {
                      setCustomDyeing(e.target.value);
                      if (e.target.value) setDyeingLoss(0);
                    }}
                    placeholder="%"
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DYEING_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setDyeingLoss(opt.value);
                      setCustomDyeing('');
                    }}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left",
                      dyeingLoss === opt.value && customDyeing === ''
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Finishing Loss */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">后整理损耗 (可多选)</label>
              <div className="flex flex-wrap gap-2">
                {FINISHING_OPTIONS.map(opt => {
                  const isSelected = selectedFinishing.includes(opt.value);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleFinishingToggle(opt.value)}
                      className={cn(
                        "px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                        isSelected
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl sticky top-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              计算结果
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">客户成品订单</p>
                <p className="text-3xl font-bold">{orderQuantity || 0} <span className="text-lg text-gray-500 font-normal">kg</span></p>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
              </div>

              <motion.div 
                key={`greige-${results.greige}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 p-4 rounded-xl border border-gray-700"
              >
                <p className="text-gray-400 text-sm mb-1">需要投染坯布</p>
                <p className="text-3xl font-bold text-emerald-400">{results.greige} <span className="text-lg text-gray-500 font-normal">kg</span></p>
                <p className="text-xs text-gray-500 mt-2">包含染色与后整理损耗</p>
              </motion.div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-600 rotate-90" />
              </div>

              <motion.div 
                key={`yarn-${results.yarn}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-indigo-600 p-4 rounded-xl shadow-inner"
              >
                <p className="text-indigo-200 text-sm mb-1">需要采购纱线</p>
                <p className="text-4xl font-bold text-white">{results.yarn} <span className="text-xl text-indigo-300 font-normal">kg</span></p>
                <p className="text-xs text-indigo-200 mt-2">包含织造、染色与后整理总损耗</p>
              </motion.div>

              <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-sm text-gray-400">综合损耗率</span>
                <span className="font-bold text-amber-400">{results.totalLoss}%</span>
              </div>
            </div>

            <div className="mt-6 bg-gray-800/50 rounded-lg p-3 flex gap-2 items-start">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-400 leading-relaxed">
                计算公式采用连乘法：<br/>
                坯布 = 成品 / ((1-染损) × (1-后整损耗))<br/>
                纱线 = 坯布 / (1-织损)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
