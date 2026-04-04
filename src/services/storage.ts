import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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

export const storage = {
  // Fabrics
  getFabrics: async (): Promise<Fabric[]> => {
    const snapshot = await getDocs(collection(db, 'fabrics'));
    return snapshot.docs.map(doc => doc.data() as Fabric);
  },
  saveFabric: async (fabric: Omit<Fabric, 'id'> & { id?: string }): Promise<Fabric> => {
    const newFabric = {
      ...fabric,
      id: fabric.id || uuidv4(),
    } as Fabric;
    await setDoc(doc(db, 'fabrics', newFabric.id), newFabric);
    return newFabric;
  },
  deleteFabric: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'fabrics', id));
  },

  // Dyeing Plans
  getPlans: async (): Promise<DyeingPlan[]> => {
    const snapshot = await getDocs(collection(db, 'plans'));
    return snapshot.docs.map(doc => doc.data() as DyeingPlan);
  },
  getPlan: async (id: string): Promise<DyeingPlan | undefined> => {
    const docRef = doc(db, 'plans', id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as DyeingPlan;
    }
    return undefined;
  },
  savePlan: async (plan: any): Promise<DyeingPlan> => {
    const newPlan = {
      ...plan,
      id: plan.id || uuidv4(),
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as DyeingPlan;
    await setDoc(doc(db, 'plans', newPlan.id), newPlan);
    return newPlan;
  },
  deletePlan: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'plans', id));
  }
};
