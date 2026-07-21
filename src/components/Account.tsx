import React, { useState } from 'react';
import { User as UserType, BankDetails, VIP_REQUIREMENTS } from '../types';
import { User, Wallet, History, Settings, LogOut, ChevronRight, Share2, HeadphonesIcon, Award, X, Sparkles, AlertCircle, CheckCircle2, CreditCard, Landmark, Send, Loader2 } from 'lucide-react';
import { dbService } from '../lib/dbService';
import profileBg from '../assets/images/login_background_1784043505295.jpg';
import { PaymentSection, RechargeModal, WithdrawModal, BankDetailsModal } from './PaymentSection';

interface AccountProps {
  user: UserType;
  onLogout: () => void;
  onRecharge: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onUpdateBankDetails: (bankDetails: BankDetails) => void;
  onShowAlert?: (alert: { title: string; message: string; type: 'success' | 'error' | 'info' }) => void;
}

export function Account({ user, onLogout, onRecharge, onWithdraw, onUpdateBankDetails, onShowAlert }: AccountProps) {
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showInvestments, setShowInvestments] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  
  // Support Tickets State
  const [showSupportTickets, setShowSupportTickets] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const openSupportTickets = async () => {
    setShowSupportTickets(true);
    setLoadingTickets(true);
    try {
      const tickets = await dbService.loadSupportTickets(user.phone);
      setTicketsList(tickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setSubmittingTicket(true);
    try {
      await dbService.saveSupportTicket({
        phone: user.phone,
        name: user.name,
        subject: ticketSubject,
        message: ticketMessage
      });
      setTicketSubject('');
      setTicketMessage('');
      // Reload tickets
      const tickets = await dbService.loadSupportTickets(user.phone);
      setTicketsList(tickets);
      alert('Support ticket submitted successfully! Our help desk will review it soon.');
    } catch (err: any) {
      alert(`Error submitting ticket: ${err.message}`);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const openBankDetails = () => {
    setShowBankDetails(true);
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="relative pt-12 pb-8 px-5 rounded-b-[2.5rem] shadow-lg overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={profileBg} alt="Profile Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-[#0051C3]/80"></div>
        </div>

        <div className="flex items-center space-x-4 mb-8 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-white/80 font-semibold mb-1 uppercase tracking-wider">Account ID: {user.id}</div>
                <div className="text-xl font-bold tracking-wide text-white">{user.name || `+91 ${user.phone}`}</div>
                {user.name && <div className="text-sm text-white/90 mt-1">+91 {user.phone}</div>}
              </div>
              <div className="bg-[#FFD700] text-gray-900 px-3 py-1 rounded-lg text-sm font-black shadow-sm animate-bounce">
                VIP {user.vipLevel || 0}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 relative z-10 shadow-xl">
          <div className="text-xs text-white/90 mb-2 font-semibold uppercase tracking-wider">Total Balance (₹)</div>
          <div className="text-5xl font-black mb-6 tracking-tight text-white">₹{user.balance.toFixed(2)}</div>
          
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowRecharge(true)}
              className="flex-1 bg-white text-[#0051C3] font-black py-3.5 rounded-xl shadow-md hover:bg-gray-50 transition-colors uppercase tracking-wider text-sm active:scale-95"
            >
              Recharge
            </button>
            <button 
              onClick={() => {
                if (!user.bankDetails) {
                  openBankDetails();
                } else {
                  setShowWithdraw(true);
                }
              }}
              className="flex-1 bg-black/30 border border-white/30 text-white font-black py-3.5 rounded-xl shadow-md hover:bg-black/40 transition-colors uppercase tracking-wider text-sm backdrop-blur-sm active:scale-95"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* VIP Section */}
      <div className="px-4 relative z-20 mt-6 mb-4">
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 rounded-3xl p-5 shadow-lg text-white">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-6 h-6 text-yellow-100" />
              <h3 className="font-black text-lg">VIP Privileges</h3>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold backdrop-blur-sm border border-white/30 shadow-sm">
              Level {user.vipLevel || 0}
            </div>
          </div>
          <p className="text-sm font-medium text-amber-50 mb-4 leading-relaxed">
            Recharge your account to unlock higher VIP levels and exclusive higher-yield investment plans.
          </p>
          
          <div className="bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 mb-4">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>Current: VIP {user.vipLevel || 0}</span>
              <span>{(user.vipLevel || 0) >= 10 ? 'MAX LEVEL' : `Next: VIP ${(user.vipLevel || 0) + 1}`}</span>
            </div>
            {(user.vipLevel || 0) < 10 ? (
              <>
                <div className="w-full bg-black/20 rounded-full h-2.5 mb-2.5 overflow-hidden">
                  <div 
                    className="bg-white h-2.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((user.accumulatedDeposit - VIP_REQUIREMENTS[user.vipLevel || 0]) / ((VIP_REQUIREMENTS[(user.vipLevel || 0) + 1] || VIP_REQUIREMENTS[user.vipLevel || 0]) - VIP_REQUIREMENTS[user.vipLevel || 0])) * 100))}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-center text-amber-50 font-medium">
                  Recharge <span className="font-bold">₹{(VIP_REQUIREMENTS[(user.vipLevel || 0) + 1] || 0) - user.accumulatedDeposit}</span> more to reach VIP {(user.vipLevel || 0) + 1}
                </div>
              </>
            ) : (
               <div className="text-xs text-center text-amber-50 font-medium">
                 You have reached the maximum VIP level!
               </div>
            )}
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
              const currentLevel = user.vipLevel || 0;
              const isCurrent = currentLevel === level;
              const isLocked = currentLevel < level;
              
              return (
                <div key={level} className={`flex-none w-24 p-3 rounded-xl border ${isCurrent ? 'bg-white border-white text-amber-500 shadow-md' : (isLocked ? 'bg-black/5 border-transparent text-amber-100' : 'bg-white/20 border-transparent text-white')} text-center backdrop-blur-sm transition-all`}>
                  <div className="font-black text-lg mb-1">VIP {level}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                    {level === 0 ? 'Free' : `₹${VIP_REQUIREMENTS[level]}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Section Overview */}
      <div className="px-4 relative z-20 mb-4">
        <PaymentSection 
          user={user}
          onRechargeSuccess={onRecharge}
          onWithdrawSuccess={onWithdraw}
          onUpdateBankDetails={onUpdateBankDetails}
        />
      </div>

      {/* Menu List */}
      <div className="px-4 space-y-2.5 relative z-20">
        <MenuItem icon={<Wallet className="text-[#0080B5]" />} label="My Investments" onClick={() => setShowInvestments(true)} />
        <MenuItem icon={<History className="text-[#2F5397]" />} label="Financial Records" onClick={() => setShowRecords(true)} />
        <MenuItem icon={<CreditCard className="text-[#0051C3]" />} label="My Bank Card" onClick={openBankDetails} />
        <MenuItem 
          icon={<Share2 className="text-[#513687]" />} 
          label="Invite Friends" 
          onClick={() => {
            navigator.clipboard.writeText('https://adani-solar.app/ref/' + user.id).catch(() => {});
            if (onShowAlert) {
              onShowAlert({
                title: 'Link Copied!',
                message: `Referral Link copied: https://adani-solar.app/ref/${user.id}`,
                type: 'success'
              });
            } else {
              alert('Referral link copied to clipboard!');
            }
          }} 
        />
        <MenuItem 
          icon={<HeadphonesIcon className="text-[#842A81]" />} 
          label="Customer Service" 
          onClick={() => window.open('https://t.me/Adani_service', '_blank')}
        />
        <MenuItem 
          icon={<Send className="text-[#AE2067]" />} 
          label="Submit Support Request" 
          onClick={openSupportTickets} 
        />
        <MenuItem 
          icon={<Settings className="text-gray-500" />} 
          label="Password Management" 
          onClick={() => {
            if (onShowAlert) {
              onShowAlert({
                title: 'Security Active',
                message: 'Password Management is fully secured by Adani Cloud Security.',
                type: 'info'
              });
            } else {
              alert('Password Management is secured by Adani Cloud Security.');
            }
          }} 
        />
        
        <div className="pt-6 pb-4">
          <button 
            onClick={onLogout}
            className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 1. Recharge Modal */}
      {showRecharge && (
        <RechargeModal 
          user={user} 
          onClose={() => setShowRecharge(false)} 
          onRechargeSuccess={onRecharge} 
        />
      )}

      {/* 2. Withdraw Modal */}
      {showWithdraw && (
        <WithdrawModal 
          user={user} 
          onClose={() => setShowWithdraw(false)} 
          onWithdrawSuccess={onWithdraw} 
          onChangeBankClick={openBankDetails} 
        />
      )}

      {/* 3. My Investments Modal */}
      {showInvestments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowInvestments(false)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <Award className="w-5 h-5 text-[#0051C3]" />
              <h3 className="font-bold text-lg text-gray-800">My Investments</h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {(user.investments || []).length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No investments active. Buy a solar plan to get started!
                </div>
              ) : (
                (user.investments || []).map(inv => (
                  <div key={inv.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex justify-between font-bold text-sm text-gray-800 mb-1">
                      <span>{inv.planName}</span>
                      <span className="text-green-500">+₹{inv.dailyIncome}/day</span>
                    </div>
                    <div className="text-xs text-gray-400 font-semibold mb-2 flex justify-between">
                      <span>Investment: ₹{inv.price}</span>
                      <span>Day {inv.daysPassed}/{inv.cycle}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                      <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min(100, (inv.daysPassed / inv.cycle) * 100)}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Financial Records Modal */}
      {showRecords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowRecords(false)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <History className="w-5 h-5 text-[#0051C3]" />
              <h3 className="font-bold text-lg text-gray-800">Financial History</h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {(user.financialRecords || []).length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  <History className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No transactions on record.
                </div>
              ) : (
                [...(user.financialRecords || [])].reverse().map(rec => (
                  <div key={rec.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide block">{rec.type}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{rec.date}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-sm block ${
                        rec.type === 'deposit' || rec.type === 'earnings' || rec.type === 'bonus'
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {rec.type === 'deposit' || rec.type === 'earnings' || rec.type === 'bonus' ? '+' : '-'}₹{rec.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bank Details Modal */}
      {showBankDetails && (
        <BankDetailsModal 
          user={user} 
          onClose={() => setShowBankDetails(false)} 
          onUpdateBankDetails={onUpdateBankDetails} 
        />
      )}

      {/* 6. Support Tickets Modal */}
      {showSupportTickets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSupportTickets(false)} 
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <Send className="w-5 h-5 text-[#AE2067]" />
              <h3 className="font-bold text-lg text-gray-800">Support Tickets</h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-6">
              {/* Submission Form */}
              <form onSubmit={handleTicketSubmit} className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Create New Ticket</h4>
                
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Deposit Help, Withdrawal Delay" 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#AE2067] font-semibold text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Message</label>
                  <textarea 
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe your issue in detail..." 
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#AE2067] font-semibold text-sm resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submittingTicket}
                  className="w-full bg-[#AE2067] hover:bg-[#8e1953] text-white font-bold py-2.5 rounded-xl shadow-md uppercase tracking-wider text-xs flex items-center justify-center space-x-1"
                >
                  {submittingTicket ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Ticket</span>
                  )}
                </button>
              </form>

              {/* Previous Tickets History */}
              <div>
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Ticket History</h4>
                {loadingTickets ? (
                  <div className="flex justify-center py-6 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#AE2067]" />
                  </div>
                ) : ticketsList.length === 0 ? (
                  <p className="text-xs text-gray-400 font-medium text-center py-4 bg-gray-50/50 rounded-2xl">
                    You have not submitted any tickets yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ticketsList.map((ticket, i) => (
                      <div key={ticket.id || i} className="bg-white border border-gray-100 p-3.5 rounded-2xl shadow-sm text-left">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-sm font-bold text-gray-800">{ticket.subject}</span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            ticket.status === 'resolved' ? 'bg-green-50 text-green-600 border border-green-100' :
                            ticket.status === 'reply' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium whitespace-pre-line leading-relaxed">{ticket.message}</p>
                        
                        {ticket.reply && (
                          <div className="mt-2.5 pt-2 border-t border-gray-50 bg-purple-50/30 p-2 rounded-xl">
                            <span className="text-[9px] uppercase font-black text-[#513687] block mb-0.5">Admin Reply:</span>
                            <p className="text-xs text-purple-900 font-semibold leading-relaxed">{ticket.reply}</p>
                          </div>
                        )}
                        
                        <span className="text-[9px] text-gray-400 font-bold block mt-2 text-right">
                          {new Date(ticket.created_at || ticket.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-[0.99]">
      <div className="flex items-center space-x-4">
        <div className="p-2.5 bg-gray-50 rounded-xl">
          {icon}
        </div>
        <span className="font-bold text-gray-700">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}
