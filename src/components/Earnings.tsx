import React from 'react';
import { Investment, User } from '../types';
import { Award, ShieldCheck, Zap, Coins, ChevronRight, Calendar, Sparkles } from 'lucide-react';

interface EarningsProps {
  user: User;
  onClaim: (investmentId: string) => void;
}

export function Earnings({ user, onClaim }: EarningsProps) {
  const activeInvestments = user.investments || [];
  
  // Calculate stats
  const totalInvested = activeInvestments.reduce((acc, inv) => acc + inv.price, 0);
  const totalDailyIncome = activeInvestments.reduce((acc, inv) => acc + (inv.status === 'active' ? inv.dailyIncome : 0), 0);
  
  const claimableCount = activeInvestments.filter(inv => {
    if (inv.status !== 'active') return false;
    // For simplicity and interactivity, allow claiming if lastClaimedDate is not today
    const todayStr = new Date().toDateString();
    return inv.lastClaimedDate !== todayStr;
  }).length;

  return (
    <div className="pb-24 pt-6 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-black text-gray-800 mb-2 text-center tracking-tight">Earnings Center</h1>
      <p className="text-xs text-gray-500 text-center mb-6 font-medium">Track your real-time green energy yield and daily revenues.</p>

      {/* Overview Card */}
      <div className="bg-gradient-to-br from-[#0051C3] to-[#0080B5] rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
          <Sparkles className="w-48 h-48" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <div className="text-[10px] text-white/75 font-bold uppercase tracking-wider mb-1">Total Invested</div>
            <div className="text-2xl font-black">₹{totalInvested.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/75 font-bold uppercase tracking-wider mb-1">Daily Yield</div>
            <div className="text-2xl font-black text-green-300">+₹{totalDailyIncome.toFixed(2)}</div>
          </div>
        </div>

        <div className="border-t border-white/10 my-4 pt-4 flex justify-between items-center relative z-10">
          <div>
            <div className="text-[10px] text-white/75 font-bold uppercase tracking-wider">Claimable Tasks</div>
            <div className="text-sm font-bold">{claimableCount} ready to collect</div>
          </div>
          {claimableCount > 0 && (
            <div className="bg-green-400 text-gray-950 font-black text-[10px] px-2 py-1 rounded-full animate-pulse uppercase tracking-wider">
              Yield Ready
            </div>
          )}
        </div>
      </div>

      {/* Investments List */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 text-sm px-1 uppercase tracking-wider flex items-center justify-between">
          <span>Active Operations ({activeInvestments.length})</span>
          <span className="text-xs text-gray-400 normal-case font-medium">Auto-renewing daily</span>
        </h3>

        {activeInvestments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm flex flex-col items-center">
            <Coins className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-bold text-sm mb-1">No Active Investments</p>
            <p className="text-gray-400 text-xs max-w-[240px] leading-relaxed">
              Explore our premium solar plans and make your first investment to start generating daily yield!
            </p>
          </div>
        ) : (
          activeInvestments.map(inv => {
            const todayStr = new Date().toDateString();
            const hasClaimedToday = inv.lastClaimedDate === todayStr;
            const progressPercent = Math.min(100, Math.round((inv.daysPassed / inv.cycle) * 100));

            return (
              <div key={inv.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{inv.planName}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] bg-blue-50 text-[#0051C3] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        ₹{inv.price} Plan
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold flex items-center">
                        <Calendar className="w-3 h-3 mr-0.5" />
                        Day {inv.daysPassed}/{inv.cycle}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Daily Yield</div>
                    <div className="text-base font-black text-green-500">+₹{inv.dailyIncome}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                  <div className="bg-[#0080B5] h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>

                {/* Claim trigger button */}
                {hasClaimedToday ? (
                  <button 
                    disabled 
                    className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center space-x-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Collected Today</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => onClaim(inv.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
                  >
                    <Coins className="w-4 h-4 text-white" />
                    <span>Collect Daily Income (₹{inv.dailyIncome})</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Energy Tip */}
      <div className="mt-6 bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-start space-x-3">
        <Zap className="w-5 h-5 text-[#0080B5] shrink-0 mt-0.5" />
        <div className="text-xs text-[#0051C3]/80 leading-relaxed font-medium">
          <span className="font-bold block text-blue-900 mb-0.5">Green Power Tip</span>
          Daily yield is generated every 24 hours. Don't forget to visit the app daily to claim and transfer your energy revenues straight to your balance.
        </div>
      </div>
    </div>
  );
}
