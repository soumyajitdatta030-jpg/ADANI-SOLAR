import { User, Plan, BankDetails, FinancialRecord, Investment } from '../types';
import { plans as staticPlans } from '../data/plans';

/**
 * SHA-256 Password Hashing using native Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Helper to ensure any ID string is converted to a valid, standard-compliant UUID
 */
export function toUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper to manage users in localStorage
const LOCAL_USER_PREFIX = 'adani_local_user_';
const REGISTERED_PHONES_KEY = 'adani_registered_phones';

function getRegisteredPhones(): string[] {
  try {
    const list = localStorage.getItem(REGISTERED_PHONES_KEY);
    return list ? JSON.parse(list) : [];
  } catch {
    return [];
  }
}

function saveRegisteredPhones(phones: string[]) {
  try {
    localStorage.setItem(REGISTERED_PHONES_KEY, JSON.stringify(phones));
  } catch (err) {
    console.error('Failed to save registered phones:', err);
  }
}

function getLocalUserRow(phone: string): any | null {
  try {
    const row = localStorage.getItem(`${LOCAL_USER_PREFIX}${phone}`);
    return row ? JSON.parse(row) : null;
  } catch {
    return null;
  }
}

function saveLocalUserRow(phone: string, row: any) {
  try {
    localStorage.setItem(`${LOCAL_USER_PREFIX}${phone}`, JSON.stringify(row));
  } catch (err) {
    console.error('Failed to save user row:', err);
  }
}

export const dbService = {
  /**
   * Login/Verify User credentials
   */
  async login(phone: string, inputPassword: string): Promise<User> {
    const hashedPassword = await hashPassword(inputPassword);
    const userRow = getLocalUserRow(phone);

    if (!userRow) {
      throw new Error('Phone number not registered. Please sign up.');
    }

    const storedHash = userRow.password_hash || userRow.password;
    if (storedHash !== hashedPassword && storedHash !== inputPassword && userRow.password !== inputPassword && userRow.password !== hashedPassword) {
      throw new Error('Incorrect password. Please try again.');
    }

    return {
      phone: userRow.phone,
      name: userRow.name || '',
      balance: Number(userRow.balance ?? 0),
      id: userRow.id || '',
      vipLevel: Number(userRow.vipLevel ?? 0),
      accumulatedDeposit: Number(userRow.accumulatedDeposit ?? 0),
      investments: userRow.investments || [],
      financialRecords: userRow.financialRecords || [],
      bankDetails: userRow.bankDetails
    };
  },

  /**
   * Register User
   */
  async register(params: {
    phone: string;
    name: string;
    password: string;
    invitationCode?: string;
  }): Promise<User> {
    const phones = getRegisteredPhones();
    if (phones.includes(params.phone) || getLocalUserRow(params.phone)) {
      throw new Error('An account with this phone number already exists.');
    }

    const hashedPassword = await hashPassword(params.password);
    const cleanId = toUUID(Math.random().toString());

    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const bonusRecord: FinancialRecord = {
      id: 'REG-BONUS-' + Math.random().toString(36).substring(7).toUpperCase(),
      type: 'bonus',
      amount: 50,
      status: 'success',
      date: dateStr
    };

    const newUserRow: any = {
      phone: params.phone,
      name: params.name,
      password: hashedPassword,
      password_hash: hashedPassword,
      invitationCode: params.invitationCode,
      referral_code: params.invitationCode,
      balance: 50, // bonus on signup
      accumulated_deposit: 0,
      accumulatedDeposit: 0,
      vip_level: 0,
      vipLevel: 0,
      id: cleanId,
      investments: [],
      financialRecords: [bonusRecord]
    };

    saveLocalUserRow(params.phone, newUserRow);
    if (!phones.includes(params.phone)) {
      saveRegisteredPhones([...phones, params.phone]);
    }

    return {
      phone: newUserRow.phone,
      name: newUserRow.name,
      balance: newUserRow.balance,
      id: newUserRow.id,
      vipLevel: newUserRow.vipLevel,
      accumulatedDeposit: newUserRow.accumulatedDeposit,
      investments: newUserRow.investments,
      financialRecords: newUserRow.financialRecords,
      bankDetails: newUserRow.bankDetails
    };
  },

  /**
   * Update User properties
   */
  async updateUser(phone: string, updates: Partial<User> & { bankDetails?: BankDetails }): Promise<User> {
    const existing = getLocalUserRow(phone);
    if (!existing) {
      throw new Error('User not found.');
    }

    const updatedRow = {
      ...existing,
      ...updates
    };

    saveLocalUserRow(phone, updatedRow);

    const user: User = {
      phone: updatedRow.phone,
      name: updatedRow.name || '',
      balance: Number(updatedRow.balance ?? 0),
      id: updatedRow.id || '',
      vipLevel: Number(updatedRow.vipLevel ?? 0),
      accumulatedDeposit: Number(updatedRow.accumulatedDeposit ?? 0),
      investments: updatedRow.investments || [],
      financialRecords: updatedRow.financialRecords || [],
      bankDetails: updatedRow.bankDetails
    };

    // Dispatch custom event for real-time changes
    const event = new CustomEvent('user-updated', { detail: user });
    window.dispatchEvent(event);

    return user;
  },

  /**
   * Load plans list
   */
  async loadPlans(): Promise<Plan[]> {
    return staticPlans;
  },

  /**
   * Fetch Active Banners
   */
  async loadBanners(): Promise<{ hero: string; secondary: string }> {
    return {
      hero: '/src/assets/images/hero_banner_1784035507057.jpg',
      secondary: '/src/assets/images/secondary_banner_1784035591689.jpg'
    };
  },

  /**
   * Fetch App settings
   */
  async loadAppSettings(): Promise<any> {
    return {
      minWithdrawal: 200,
      minRecharge: 500,
      telegramChannel: 'https://t.me/adani_green_power',
      officialSupport: 'https://wa.me/911234567890'
    };
  },

  /**
   * Save Deposit requests
   */
  async saveDeposit(params: {
    id: string;
    phone: string;
    userId: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
  }): Promise<void> {
    // Already stored in local user rows, keep this empty or stub for compatibility
    console.log('Deposit request logged locally:', params);
  },

  /**
   * Save Withdrawal requests
   */
  async saveWithdrawal(params: {
    id: string;
    phone: string;
    userId: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
  }): Promise<void> {
    // Already stored in local user rows, keep this empty or stub for compatibility
    console.log('Withdrawal request logged locally:', params);
  },

  /**
   * Save Financial transaction
   */
  async saveTransaction(params: {
    id: string;
    phone: string;
    userId: string;
    type: 'deposit' | 'withdraw' | 'invest' | 'earnings';
    amount: number;
    status: 'success' | 'pending' | 'failed';
    date: string;
  }): Promise<void> {
    // Already stored in local user rows, keep this empty or stub for compatibility
    console.log('Transaction logged locally:', params);
  },

  /**
   * Submit a new Support Ticket
   */
  async saveSupportTicket(params: {
    phone: string;
    name: string;
    subject: string;
    message: string;
  }): Promise<void> {
    try {
      const ticketsKey = `adani_tickets_${params.phone}`;
      const existingStr = localStorage.getItem(ticketsKey);
      const tickets = existingStr ? JSON.parse(existingStr) : [];
      
      const newTicket = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        phone: params.phone,
        name: params.name,
        subject: params.subject,
        message: params.message,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      tickets.unshift(newTicket);
      localStorage.setItem(ticketsKey, JSON.stringify(tickets));
    } catch (err) {
      console.error('Failed to save support ticket locally:', err);
    }
  },

  /**
   * Fetch all previous Support Tickets
   */
  async loadSupportTickets(phone: string): Promise<any[]> {
    try {
      const ticketsKey = `adani_tickets_${phone}`;
      const existingStr = localStorage.getItem(ticketsKey);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  },

  /**
   * Set up real-time listener on the user's row
   */
  subscribeToUserChanges(phone: string, callback: (updatedUser: User) => void) {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<User>;
      if (customEvent.detail && customEvent.detail.phone === phone) {
        callback(customEvent.detail);
      }
    };

    window.addEventListener('user-updated', handleUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUpdate);
    };
  }
};
