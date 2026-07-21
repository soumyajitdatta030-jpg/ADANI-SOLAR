/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, Compass, User as UserIcon, Users, Crown, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Auth } from './components/Auth';
import { Home as HomeView } from './components/Home';
import { Invest } from './components/Invest';
import { Account } from './components/Account';
import { Team } from './components/Team';
import { Earnings } from './components/Earnings';
import { User, Tab, Plan, BankDetails, calculateVipLevel, VIP_REQUIREMENTS } from './types';
import { dbService } from './lib/dbService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [banners, setBanners] = useState<{ hero: string; secondary: string } | null>(null);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [vipNoticePlan, setVipNoticePlan] = useState<Plan | null>(null);
  const [customAlert, setCustomAlert] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // Load app data on mount
  useEffect(() => {
    const fetchAppData = async () => {
      try {
        const loadedPlans = await dbService.loadPlans();
        setPlans(loadedPlans);

        const loadedBanners = await dbService.loadBanners();
        setBanners(loadedBanners);

        const loadedSettings = await dbService.loadAppSettings();
        setAppSettings(loadedSettings);
      } catch (err) {
        console.error('Failed to load initial app data:', err);
      }
    };
    fetchAppData();
  }, []);

  // Listen for real-time user row modifications made in the Admin Panel
  useEffect(() => {
    if (!user) return;
    const unsubscribe = dbService.subscribeToUserChanges(user.phone, (updated) => {
      setUser(updated);
    });
    return () => {
      unsubscribe();
    };
  }, [user?.phone]);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // Save user changes to database
  const saveUserUpdate = async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await dbService.updateUser(updatedUser.phone, updatedUser);
    } catch (err) {
      console.error('Failed to sync user changes:', err);
    }
  };

  const handleUpdateBankDetails = (bankDetails: BankDetails) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      bankDetails
    };
    saveUserUpdate(updatedUser);
  };

  const handleRecharge = async (amount: number) => {
    if (!user) return;
    const newAccumulated = user.accumulatedDeposit + amount;
    const newVip = calculateVipLevel(newAccumulated);
    
    const recordId = Math.random().toString(36).substring(7).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newRecord = {
      id: recordId,
      type: 'deposit' as const,
      amount: amount,
      date: dateStr,
      status: 'success' as const
    };

    const updatedUser: User = {
      ...user,
      balance: user.balance + amount,
      accumulatedDeposit: newAccumulated,
      vipLevel: newVip,
      financialRecords: [newRecord, ...(user.financialRecords || [])]
    };

    // Save to local state immediately
    setUser(updatedUser);

    // Save to local tables asynchronously
    try {
      await Promise.all([
        dbService.updateUser(user.phone, updatedUser),
        dbService.saveDeposit({ id: recordId, phone: user.phone, userId: user.id, amount, status: 'success' }),
        dbService.saveTransaction({ id: recordId, phone: user.phone, userId: user.id, type: 'deposit', amount, status: 'success', date: dateStr })
      ]);
    } catch (err) {
      console.error('Failed to save deposit details to database:', err);
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!user) return;
    if (user.balance < amount) return;

    const recordId = Math.random().toString(36).substring(7).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newRecord = {
      id: recordId,
      type: 'withdraw' as const,
      amount: amount,
      date: dateStr,
      status: 'success' as const
    };

    const updatedUser: User = {
      ...user,
      balance: user.balance - amount,
      financialRecords: [newRecord, ...(user.financialRecords || [])]
    };

    // Save to local state immediately
    setUser(updatedUser);

    // Save to local tables asynchronously
    try {
      await Promise.all([
        dbService.updateUser(user.phone, updatedUser),
        dbService.saveWithdrawal({ id: recordId, phone: user.phone, userId: user.id, amount, status: 'success' }),
        dbService.saveTransaction({ id: recordId, phone: user.phone, userId: user.id, type: 'withdraw', amount, status: 'success', date: dateStr })
      ]);
    } catch (err) {
      console.error('Failed to save withdrawal details to database:', err);
    }
  };

  const handleInvest = async (plan: Plan) => {
    if (!user) return;
    if (user.balance < plan.price) {
      setCustomAlert({
        title: 'Insufficient Balance',
        message: `Your current balance is ₹${user.balance.toFixed(2)}, which is less than the required ₹${plan.price.toLocaleString('en-IN')} for the "${plan.name}" solar investment plan. Please recharge first.`,
        type: 'error',
        actionText: 'Recharge Now',
        onAction: () => {
          setCustomAlert(null);
          setCurrentTab('profile');
        }
      });
      return;
    }
    if (user.vipLevel < plan.vipLevel) {
      setVipNoticePlan(plan);
      return;
    }

    const recordId = Math.random().toString(36).substring(7).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newInvestment = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      dailyIncome: plan.dailyIncome,
      totalIncome: plan.totalIncome,
      cycle: plan.cycle,
      daysPassed: 0,
      purchaseDate: dateStr,
      status: 'active' as const
    };

    const newRecord = {
      id: recordId,
      type: 'invest' as const,
      amount: plan.price,
      date: dateStr,
      status: 'success' as const
    };

    const updatedUser: User = {
      ...user,
      balance: user.balance - plan.price,
      investments: [newInvestment, ...(user.investments || [])],
      financialRecords: [newRecord, ...(user.financialRecords || [])]
    };

    // Save to local state immediately
    setUser(updatedUser);

    try {
      await Promise.all([
        dbService.updateUser(user.phone, updatedUser),
        dbService.saveTransaction({ id: recordId, phone: user.phone, userId: user.id, type: 'invest', amount: plan.price, status: 'success', date: dateStr })
      ]);
      setCustomAlert({
        title: 'Purchase Successful!',
        message: `You have successfully purchased the ${plan.name} solar investment plan. Your daily revenue of ₹${plan.dailyIncome} starts now!`,
        type: 'success',
        actionText: 'View Earnings',
        onAction: () => {
          setCustomAlert(null);
          setCurrentTab('earnings');
        }
      });
    } catch (err) {
      console.error('Failed to save investment transaction to database:', err);
    }
  };

  const handleClaim = async (investmentId: string) => {
    if (!user) return;
    const todayStr = new Date().toDateString();

    const updatedInvestments = (user.investments || []).map(inv => {
      if (inv.id === investmentId) {
        return {
          ...inv,
          daysPassed: Math.min(inv.cycle, inv.daysPassed + 1),
          lastClaimedDate: todayStr,
          status: inv.daysPassed + 1 >= inv.cycle ? ('completed' as const) : ('active' as const)
        };
      }
      return inv;
    });

    const targetInv = (user.investments || []).find(inv => inv.id === investmentId);
    if (!targetInv) return;

    const recordId = Math.random().toString(36).substring(7).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const newRecord = {
      id: recordId,
      type: 'earnings' as const,
      amount: targetInv.dailyIncome,
      date: dateStr,
      status: 'success' as const
    };

    const updatedUser: User = {
      ...user,
      balance: user.balance + targetInv.dailyIncome,
      investments: updatedInvestments,
      financialRecords: [newRecord, ...(user.financialRecords || [])]
    };

    // Save to local state immediately
    setUser(updatedUser);

    try {
      await Promise.all([
        dbService.updateUser(user.phone, updatedUser),
        dbService.saveTransaction({ id: recordId, phone: user.phone, userId: user.id, type: 'earnings', amount: targetInv.dailyIncome, status: 'success', date: dateStr })
      ]);
      setCustomAlert({
        title: 'Yield Collected!',
        message: `Successfully collected ₹${targetInv.dailyIncome.toFixed(2)} from your ${targetInv.planName} solar investment.`,
        type: 'success',
        actionText: 'Excellent',
        onAction: () => setCustomAlert(null)
      });
    } catch (err) {
      console.error('Failed to save earnings claim to database:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative shadow-2xl overflow-hidden flex flex-col">
      {/* Views */}
      <div className="flex-1 overflow-y-auto">
        {currentTab === 'home' && (
          <HomeView 
            user={user} 
            onNavigateTab={setCurrentTab} 
            customHeroBanner={banners?.hero} 
            customSecondaryBanner={banners?.secondary} 
            appSettings={appSettings} 
          />
        )}
        {currentTab === 'invest' && <Invest user={user} plans={plans} onInvest={handleInvest} />}
        {currentTab === 'earnings' && <Earnings user={user} onClaim={handleClaim} />}
        {currentTab === 'team' && <Team />}
        {currentTab === 'profile' && (
          <Account 
            user={user} 
            onLogout={() => setUser(null)} 
            onRecharge={handleRecharge} 
            onWithdraw={handleWithdraw} 
            onUpdateBankDetails={handleUpdateBankDetails}
            onShowAlert={(alert) => setCustomAlert(alert)}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-3 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <NavItem 
          active={currentTab === 'home'} 
          onClick={() => setCurrentTab('home')} 
          icon={<Home className="w-6 h-6" />} 
          label="Home" 
          activeColor="text-[#0051C3]"
        />
        <NavItem 
          active={currentTab === 'invest'} 
          onClick={() => setCurrentTab('invest')} 
          icon={<Compass className="w-6 h-6" />} 
          label="Invest" 
          activeColor="text-[#0051C3]"
        />
        <NavItem 
          active={currentTab === 'earnings'} 
          onClick={() => setCurrentTab('earnings')} 
          icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>} 
          label="Earnings" 
          activeColor="text-[#0051C3]"
        />
        <NavItem 
          active={currentTab === 'team'} 
          onClick={() => setCurrentTab('team')} 
          icon={<Users className="w-6 h-6" />} 
          label="Team" 
          activeColor="text-[#0051C3]"
        />
        <NavItem 
          active={currentTab === 'profile'} 
          onClick={() => setCurrentTab('profile')} 
          icon={<UserIcon className="w-6 h-6" />} 
          label="Profile" 
          activeColor="text-[#0051C3]"
        />
      </div>

      {/* VIP Level Restriction Notice Modal */}
      {vipNoticePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 relative p-6 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setVipNoticePlan(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Icon / Header */}
            <div className="text-center mt-2 mb-4">
              <div className="bg-amber-50 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm mb-4">
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">VIP Level Notice</h3>
              <p className="text-xs text-gray-500 mt-1">Upgrade your VIP tier to invest in this plan</p>
            </div>

            {/* Details Card */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3 mb-5 text-left">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Selected Plan</span>
                <span className="font-bold text-gray-800">{vipNoticePlan.name}</span>
              </div>
              <div className="h-px bg-gray-200/50"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Required Tier</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-md font-black">
                  VIP {vipNoticePlan.vipLevel}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Your Tier</span>
                <span className="bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-md font-bold">
                  VIP {user.vipLevel}
                </span>
              </div>
              <div className="h-px bg-gray-200/50"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Required Deposit</span>
                <span className="font-black text-gray-800">₹{(VIP_REQUIREMENTS[vipNoticePlan.vipLevel] || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Your Deposit</span>
                <span className="font-bold text-gray-700">₹{(user.accumulatedDeposit || 0).toLocaleString('en-IN')}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase mb-1">
                  <span>Recharge Progress</span>
                  <span>{Math.round(Math.min(100, ((user.accumulatedDeposit || 0) / (VIP_REQUIREMENTS[vipNoticePlan.vipLevel] || 1)) * 100))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, ((user.accumulatedDeposit || 0) / (VIP_REQUIREMENTS[vipNoticePlan.vipLevel] || 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-center mt-2.5 text-xs text-amber-600 font-semibold">
                  Need ₹{(Math.max(0, (VIP_REQUIREMENTS[vipNoticePlan.vipLevel] || 0) - (user.accumulatedDeposit || 0))).toLocaleString('en-IN')} more to unlock!
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button 
                onClick={() => {
                  setVipNoticePlan(null);
                  setCurrentTab('profile');
                }}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl shadow-md transition-colors text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Recharge & Level Up</span>
              </button>
              <button 
                onClick={() => setVipNoticePlan(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Notification Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 relative p-6 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setCustomAlert(null)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Icon / Header based on Alert Type */}
            <div className="text-center mt-2 mb-4">
              <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border shadow-sm mb-4 ${
                customAlert.type === 'success' ? 'bg-green-50 border-green-100 text-green-500' :
                customAlert.type === 'error' ? 'bg-red-50 border-red-100 text-red-500' :
                'bg-blue-50 border-blue-100 text-blue-500'
              }`}>
                {customAlert.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                {customAlert.type === 'error' && <AlertCircle className="w-8 h-8" />}
                {customAlert.type === 'info' && <Info className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{customAlert.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed px-2">{customAlert.message}</p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button 
                onClick={() => {
                  if (customAlert.onAction) {
                    customAlert.onAction();
                  } else {
                    setCustomAlert(null);
                  }
                }}
                className={`w-full font-bold py-3.5 rounded-xl shadow-md transition-colors text-sm uppercase tracking-wider ${
                  customAlert.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                  customAlert.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {customAlert.actionText || 'OK'}
              </button>
              {customAlert.actionText && (
                <button 
                  onClick={() => setCustomAlert(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label, activeColor }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, activeColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 w-1/5 ${
        active ? activeColor : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <div className={active ? 'font-bold' : ''}>
        {icon}
      </div>
      <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}
