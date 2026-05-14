export type Role = 'admin' | 'worker';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  role: Role;
  isApproved: boolean;
  farmName?: string;
  monthlySalary?: number;
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  workerId: string;
  amount: number;
  date: string;
  month: string;
  year: number;
  description?: string;
}

export interface Batch {
  id: string;
  name: string;
  startDate: string;
  initialChicks: number;
  costPerChick: number;
  breed: string;
  status: 'active' | 'closed';
  closedDate?: string | null;
}

export interface DailyLog {
  id: string;
  batchId: string;
  date: string;
  mortalityCount: number;
  mortalityReason?: string;
  mortalityImageUrl?: string;
  feedUsedKg?: number;
  medicineDetails?: string;
  workerId: string;
  workerName: string;
}

export interface FeedRecord {
  id: string;
  batchId: string;
  date: string;
  bagCount: number;
  pricePerBag: number;
  totalAmount: number;
  slipImageUrl?: string;
}

export interface MedicineGuideline {
  id: string;
  title: string;
  description: string;
  prescriptionImageUrl?: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  batchId?: string;
  category: 'feed' | 'medicine' | 'equipment' | 'electricity' | 'other';
  amount: number;
  date: string;
  description: string;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  batchId: string;
  date: string;
  quantity: number;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  receiptImageUrl?: string;
}
