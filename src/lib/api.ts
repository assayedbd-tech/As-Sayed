import { Batch, DailyLog, Expense, Sale, UserProfile, FeedRecord, MedicineGuideline, SalaryPayment } from '../types';

const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
};

const fetchApi = async (path: string, options?: RequestInit) => {
  const token = getAuthToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      setAuthToken(null);
      // Optional: trigger redirect to login
    }
    const error = await res.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(JSON.stringify(error));
  }
  return res.json();
};

export const api = {
  // Auth
  async register(data: any): Promise<{ user: UserProfile, token: string }> {
    return await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: any): Promise<{ user: UserProfile, token: string }> {
    return await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<UserProfile | null> {
    try {
      if (!getAuthToken()) return null;
      return await fetchApi('/api/auth/me');
    } catch (error) {
      return null;
    }
  },

  // Users
  async getUser(id: string): Promise<UserProfile | null> {
    try {
      return await fetchApi(`/api/users/${id}`);
    } catch (error) {
      return null;
    }
  },

  async saveUser(user: UserProfile): Promise<UserProfile> {
    return await fetchApi('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  // Batches
  async getBatches(): Promise<Batch[]> {
    try {
      return await fetchApi('/api/batches');
    } catch (error) {
      return [];
    }
  },

  async getBatch(id: string): Promise<Batch | null> {
    try {
      return await fetchApi(`/api/batches/${id}`);
    } catch (error) {
      return null;
    }
  },

  async createBatch(batch: Omit<Batch, 'id'>): Promise<Batch> {
    return await fetchApi('/api/batches', {
      method: 'POST',
      body: JSON.stringify(batch),
    });
  },

  // Logs
  async getBatchLogs(batchId: string): Promise<DailyLog[]> {
    try {
      return await fetchApi(`/api/batches/${batchId}/logs`);
    } catch (error) {
      return [];
    }
  },

  async createLog(log: Omit<DailyLog, 'id'>): Promise<DailyLog> {
    return await fetchApi('/api/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  async updateLog(id: string, log: Partial<DailyLog>): Promise<void> {
    await fetchApi(`/api/logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(log),
    });
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    try {
      return await fetchApi('/api/expenses');
    } catch (error) {
      return [];
    }
  },

  async getBatchExpenses(batchId: string): Promise<Expense[]> {
    try {
      return await fetchApi(`/api/batches/${batchId}/expenses`);
    } catch (error) {
      return [];
    }
  },

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    return await fetchApi('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<void> {
    await fetchApi(`/api/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(expense),
    });
  },

  // Sales
  async getBatchSales(batchId: string): Promise<Sale[]> {
    try {
      return await fetchApi(`/api/batches/${batchId}/sales`);
    } catch (error) {
      return [];
    }
  },

  async createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    return await fetchApi('/api/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },

  async updateSale(id: string, sale: Partial<Sale>): Promise<void> {
    await fetchApi(`/api/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(sale),
    });
  },

  // Feed
  async getBatchFeed(batchId: string): Promise<FeedRecord[]> {
    try {
      return await fetchApi(`/api/batches/${batchId}/feed`);
    } catch (error) {
      return [];
    }
  },

  async createFeedRecord(data: Omit<FeedRecord, 'id'>): Promise<FeedRecord> {
    return await fetchApi('/api/feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFeedRecord(id: string, data: Partial<FeedRecord>): Promise<void> {
    await fetchApi(`/api/feed/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Medicine Guidelines
  async getMedicineGuidelines(): Promise<MedicineGuideline[]> {
    try {
      return await fetchApi('/api/medicine-guidelines');
    } catch (error) {
      return [];
    }
  },

  async createMedicineGuideline(data: { title: string; description: string; prescriptionImageUrl?: string }): Promise<MedicineGuideline> {
    return await fetchApi('/api/medicine-guidelines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteMedicineGuideline(id: string): Promise<void> {
    await fetchApi(`/api/medicine-guidelines/${id}`, {
      method: 'DELETE',
    });
  },

  // Workers & Salaries
  async getWorkers(): Promise<UserProfile[]> {
    try {
      return await fetchApi('/api/workers');
    } catch (error) {
      return [];
    }
  },

  async createWorker(data: any): Promise<UserProfile> {
    return await fetchApi('/api/admin/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPendingUsers(): Promise<UserProfile[]> {
    try {
      return await fetchApi('/api/admin/pending-users');
    } catch (error) {
      return [];
    }
  },

  async approveUser(id: string): Promise<void> {
    await fetchApi(`/api/admin/approve-user/${id}`, {
      method: 'POST',
    });
  },

  async rejectUser(id: string): Promise<void> {
    await fetchApi(`/api/admin/reject-user/${id}`, {
      method: 'POST',
    });
  },

  async updateWorkerSalary(id: string, monthlySalary: number): Promise<void> {
    await fetchApi(`/api/users/${id}/salary`, {
      method: 'PATCH',
      body: JSON.stringify({ monthlySalary }),
    });
  },

  async getSalaryPayments(workerId: string): Promise<SalaryPayment[]> {
    try {
      return await fetchApi(`/api/salary-payments/${workerId}`);
    } catch (error) {
      return [];
    }
  },

  async createSalaryPayment(data: Omit<SalaryPayment, 'id'>): Promise<SalaryPayment> {
    return await fetchApi('/api/salary-payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Status
  async updateBatchStatus(id: string, status: 'active' | 'closed'): Promise<void> {
    await fetchApi(`/api/batches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
};
