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

export interface Reminder {
  id: string;
  event: string; // 事件
  planId: string; // 关联的染色计划单 ID
  planLabel: string; // 关联的染色计划单显示名称 (冗余存储方便展示)
  expectedDate: string; // 预计完成时间
  confirmDate: string; // 什么时间应该确认完没完成
  contact: string; // 联系人
  factory: string; // 工厂
  phone: string; // 电话
  isCompleted: boolean; // 确认是否完成
  futureDate?: string; // 备注未来什么时候会完成
  notes?: string; // 备注
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  factory: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const storage = {
  // Contacts
  getContacts: async (): Promise<Contact[]> => {
    const snapshot = await getDocs(collection(db, 'contacts'));
    return snapshot.docs.map(doc => doc.data() as Contact);
  },
  saveContact: async (contact: any): Promise<Contact> => {
    const newContact = {
      ...contact,
      id: contact.id || uuidv4(),
      createdAt: contact.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Contact;
    await setDoc(doc(db, 'contacts', newContact.id), newContact);
    return newContact;
  },
  deleteContact: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'contacts', id));
  },

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
  },

  // Reminders
  getReminders: async (): Promise<Reminder[]> => {
    const snapshot = await getDocs(collection(db, 'reminders'));
    return snapshot.docs.map(doc => doc.data() as Reminder);
  },
  getReminder: async (id: string): Promise<Reminder | undefined> => {
    const docRef = doc(db, 'reminders', id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Reminder;
    }
    return undefined;
  },
  saveReminder: async (reminder: any): Promise<Reminder> => {
    const newReminder = {
      ...reminder,
      id: reminder.id || uuidv4(),
      createdAt: reminder.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Reminder;
    await setDoc(doc(db, 'reminders', newReminder.id), newReminder);
    return newReminder;
  },
  deleteReminder: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'reminders', id));
  }
};
