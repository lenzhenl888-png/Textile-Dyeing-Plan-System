import { v4 as uuidv4 } from 'uuid';

export interface Fabric {
  id: string;
  name: string;
  code: string; // 编号
  width: string; // 门幅
  weight: string; // 克重
  field1: string; // 自定义栏1
  field2: string; // 自定义栏2
}

export interface FabricDetail {
  type: 'main' | 'accessory';
  itemNumber: string;
  width: string;
  weight: string;
  productName: string;
}

export interface ColorRow {
  id: string;
  colorName: string;
  colorCode?: string;
  notes?: string;
  quantities: (number | string)[]; // Array of 6 quantities corresponding to the 6 fabric columns
}

export interface DyeingPlan {
  id: string;
  customer: string;
  styleNumber: string;
  contractNumber: string;
  date: string;
  deliveryDate: string;
  process?: string;
  fabrics: FabricDetail[]; // Exactly 5 items: 3 main, 2 accessory
  gridLabels: string[]; // Custom labels for the 4 fabric detail rows
  gridNotes: string[]; // Custom notes for the 4 fabric detail rows
  rows: ColorRow[]; // Array of 5 quantities corresponding to the 5 fabric columns
  unit: '米' | '公斤';
  notes: string;
  progress?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

const FABRICS_KEY = 'dyeing_plan_pro_fabrics';
const PLANS_KEY = 'dyeing_plan_pro_plans';

export const storage = {
  // Fabrics
  getFabrics: (): Fabric[] => {
    const data = localStorage.getItem(FABRICS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveFabric: (fabric: Omit<Fabric, 'id'> & { id?: string }): Fabric => {
    const fabrics = storage.getFabrics();
    const newFabric = {
      ...fabric,
      id: fabric.id || uuidv4(),
    } as Fabric;

    if (fabric.id) {
      const index = fabrics.findIndex(f => f.id === fabric.id);
      if (index !== -1) fabrics[index] = newFabric;
    } else {
      fabrics.push(newFabric);
    }

    localStorage.setItem(FABRICS_KEY, JSON.stringify(fabrics));
    return newFabric;
  },
  deleteFabric: (id: string) => {
    const fabrics = storage.getFabrics().filter(f => f.id !== id);
    localStorage.setItem(FABRICS_KEY, JSON.stringify(fabrics));
  },

  // Dyeing Plans
  getPlans: (): DyeingPlan[] => {
    const data = localStorage.getItem(PLANS_KEY);
    return data ? JSON.parse(data) : [];
  },
  getPlan: (id: string): DyeingPlan | undefined => {
    return storage.getPlans().find(p => p.id === id);
  },
  savePlan: (plan: any): DyeingPlan => {
    const plans = storage.getPlans();
    const isUpdate = !!plan.id;
    
    const newPlan = {
      ...plan,
      id: plan.id || uuidv4(),
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DyeingPlan;

    if (isUpdate) {
      const index = plans.findIndex(p => p.id === plan.id);
      if (index !== -1) plans[index] = newPlan;
    } else {
      plans.push(newPlan);
    }

    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return newPlan;
  },
  deletePlan: (id: string) => {
    const plans = storage.getPlans().filter(p => p.id !== id);
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }
};
