import { useState } from 'react';
import { Zap } from 'lucide-react';
import { User, Plan } from '../types';

type PlanType = 'steady' | 'benefits' | 'event';

interface InvestProps {
  user: User;
  plans: Plan[];
  onInvest: (plan: Plan) => void;
}

export function Invest({ user, plans, onInvest }: InvestProps) {
  const [activeTab, setActiveTab] = useState<PlanType>('steady');

  const filteredPlans = plans.filter(p => p.type === activeTab);

  return (
    <div className="pb-24 pt-6 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black text-gray-800 mb-6 text-center tracking-tight">Investment Plans</h1>
      
      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm p-1.5 mb-6 border border-gray-100 relative">
        <TabButton active={activeTab === 'steady'} onClick={() => setActiveTab('steady')} label="Steady" />
        <TabButton active={activeTab === 'benefits'} onClick={() => setActiveTab('benefits')} label="Benefits" />
        <TabButton active={activeTab === 'event'} onClick={() => setActiveTab('event')} label="Event" />
      </div>

      {/* Plan List */}
      <div className="space-y-5">
        {filteredPlans.map(plan => {
          const isVipLocked = user.vipLevel < plan.vipLevel;

          return (
            <div key={plan.id} className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
              {/* Banner/Header */}
              <div className={`px-5 py-4 flex justify-between items-center text-white ${
                plan.type === 'steady' ? 'bg-gradient-to-r from-[#0080B5] to-[#2F5397]' :
                plan.type === 'benefits' ? 'bg-gradient-to-r from-[#2F5397] to-[#513687]' :
                'bg-gradient-to-r from-[#513687] to-[#AE2067]'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg tracking-wide">{plan.name}</h3>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="bg-[#FFD700] text-gray-900 px-2.5 py-0.5 rounded-md text-xs font-black shadow-sm">
                    VIP {plan.vipLevel}
                  </div>
                  <div className="bg-white/20 px-2.5 py-0.5 rounded-md text-xs font-bold backdrop-blur-sm shadow-sm border border-white/10">
                    Cycle: {plan.cycle} Days
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-5">
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Price</div>
                    <div className="text-xl font-black text-gray-800">₹{plan.price}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Daily Income</div>
                    <div className="text-xl font-black text-green-500">₹{plan.dailyIncome}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Income</div>
                    <div className="text-xl font-black text-[#842A81]">₹{plan.totalIncome}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Return Rate</div>
                    <div className="text-xl font-black text-[#0080B5]">
                      {Math.round((plan.totalIncome / plan.price) * 100)}%
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => onInvest(plan)}
                  className="w-full font-bold py-3.5 rounded-xl transition-colors shadow-md text-sm uppercase tracking-wider bg-gray-900 hover:bg-black text-white"
                >
                  Invest Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
        active 
          ? 'bg-gray-900 text-white shadow-md' 
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}
