export type Tab = 'home' | 'invest' | 'earnings' | 'team' | 'profile';

export const VIP_REQUIREMENTS = [
  0,        // VIP 0: ₹0
  500,      // VIP 1: ₹500
  1500,     // VIP 2: ₹1,500
  5000,     // VIP 3: ₹5,000
  10000,    // VIP 4: ₹10,000
  30000,    // VIP 5: ₹30,000
  50000,    // VIP 6: ₹50,000
  100000,   // VIP 7: ₹100,000
  200000,   // VIP 8: ₹200,000
  500000,   // VIP 9: ₹500,000
  1000000   // VIP 10: ₹1,000,000
];

export function calculateVipLevel(accumulated: number): number {
  let level = 0;
  for (let i = 0; i < VIP_REQUIREMENTS.length; i++) {
    if (accumulated >= VIP_REQUIREMENTS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return Math.min(10, level);
}


export interface Plan {
  id: string;
  name: string;
  price: number;
  dailyIncome: number;
  totalIncome: number;
  cycle: number;
  type: 'steady' | 'benefits' | 'event';
  vipLevel: number;
}

export interface Investment {
  id: string;
  planId: string;
  planName: string;
  price: number;
  dailyIncome: number;
  totalIncome: number;
  cycle: number;
  daysPassed: number;
  purchaseDate: string;
  lastClaimedDate?: string;
  status: 'active' | 'completed';
}

export interface FinancialRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'invest' | 'earnings' | 'bonus';
  amount: number;
  date: string;
  status: 'success' | 'pending' | 'failed';
}

export interface BankDetails {
  actualName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface User {
  phone: string;
  name?: string;
  balance: number;
  id: string;
  vipLevel: number;
  accumulatedDeposit: number;
  investments: Investment[];
  financialRecords: FinancialRecord[];
  bankDetails?: BankDetails;
}

