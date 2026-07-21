import { Plan } from '../types';

export const plans: Plan[] = [
  { id: 's1', name: 'ADANI Steady 1', price: 490, dailyIncome: 180, totalIncome: 8100, cycle: 45, type: 'steady', vipLevel: 0 },
  { id: 's2', name: 'ADANI Steady 2', price: 1750, dailyIncome: 650, totalIncome: 29250, cycle: 45, type: 'steady', vipLevel: 1 },
  { id: 's3', name: 'ADANI Steady 3', price: 4790, dailyIncome: 1800, totalIncome: 81000, cycle: 45, type: 'steady', vipLevel: 2 },
  { id: 's4', name: 'ADANI Steady 4', price: 12500, dailyIncome: 4800, totalIncome: 216000, cycle: 45, type: 'steady', vipLevel: 3 },
  { id: 'b1', name: 'ADANI Benefits 1', price: 1000, dailyIncome: 500, totalIncome: 1500, cycle: 3, type: 'benefits', vipLevel: 1 },
  { id: 'b2', name: 'ADANI Benefits 2', price: 2500, dailyIncome: 1500, totalIncome: 4500, cycle: 3, type: 'benefits', vipLevel: 2 },
  { id: 'b3', name: 'ADANI Benefits 3', price: 5000, dailyIncome: 2500, totalIncome: 5000, cycle: 2, type: 'benefits', vipLevel: 3 },
  { id: 'e1', name: 'ADANI Event 1', price: 3500, dailyIncome: 1500, totalIncome: 15000, cycle: 10, type: 'event', vipLevel: 0 },
];
