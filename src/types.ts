import { Timestamp } from 'firebase/firestore';

export interface Fabric {
  id: string;
  name: string;
  itemNumber: string;
  availableColors?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DyeingPlan {
  id: string;
  contractNumber: string;
  fabricId: string;
  fabricName?: string;
  fabricItemNumber?: string;
  color: string;
  colorRequirements?: string;
  quantity?: number;
  width?: string;
  weight?: string;
  time?: string;
  productNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}
