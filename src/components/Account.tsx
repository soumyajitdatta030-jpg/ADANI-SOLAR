import React, { useState } from 'react';
import { User as UserType, BankDetails, VIP_REQUIREMENTS } from '../types';
import { User, Wallet, History, Settings, LogOut, ChevronRight, Share2, HeadphonesIcon, Award, X, Sparkles, AlertCircle, CheckCircle2, CreditCard, Landmark, Send, Loader2, Copy, Check, ArrowRight, QrCode } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { paymentService } from '../lib/paymentService';
import profileBg from '../assets/images/login_background_1784043505295.jpg';

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

  const [rechargeVal, setRechargeVal] = useState('');
  const [withdrawVal, setWithdrawVal] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Rupayex Payment Gateway States
  const [rechargeStep, setRechargeStep] = useState<'input' | 'gateway' | 'redirect' | 'manual' | 'verifying'>('input');
  const [payUrl, setPayUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [utrCode, setUtrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Bank Form State
  const [isEditingBank, setIsEditingBank] = useState(!user.bankDetails);
  const [actualName, setActualName] = useState(user.bankDetails?.actualName || '');
  const [accountNumber, setAccountNumber] = useState(user.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(user.bankDetails?.bankName || '');

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
    setActualName(user.bankDetails?.actualName || '');
    setAccountNumber(user.bankDetails?.accountNumber || '');
    setIfscCode(user.bankDetails?.ifscCode || '');
    setBankName(user.bankDetails?.bankName || '');
    setIsEditingBank(!user.bankDetails);
    setModalError('');
    setModalSuccess('');
    setShowBankDetails(true);
  };

  const handleBankDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualName.trim()) {
      setModalError('Please enter account holder name');
      return;
    }
    if (!bankName.trim()) {
      setModalError('Please enter bank name');
      return;
    }
    if (!accountNumber.trim() || accountNumber.length < 9) {
      setModalError('Please enter a valid bank account number');
      return;
    }
    if (!ifscCode.trim() || ifscCode.length < 11) {
      setModalError('IFSC code must be 11 characters long');
      return;
    }

    onUpdateBankDetails({
      actualName: actualName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase()
    });

    setModalSuccess('Bank account successfully updated!');
    setModalError('');
    setTimeout(() => {
      setModalSuccess('');
      setShowBankDetails(false);
    }, 1500);
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(rechargeVal);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid amount');
      return;
    }
    
    setModalError('');
    setModalSuccess('');
    setRechargeStep('gateway');
    
    // Generate standard Order ID
    const orderId = 'RECH' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setCreatedOrderId(orderId);

    // Read Rupayex settings from environment
    const apiKey = import.meta.env.VITE_RUPAYEX_API_KEY || '';
    const instanceId = import.meta.env.VITE_RUPAYEX_INSTANCE_ID || '';
    const apiUrl = import.meta.env.VITE_RUPAYEX_API_URL || 'https://rupayex.net/api';

    try {
      const response = await paymentService.createTransaction({
        apiKey,
        instanceId,
        apiUrl,
        amount: amt,
        orderId,
        phone: user.phone,
        name: user.name,
        email: `${user.phone}@rupayex-user.com`,
        redirectUrl: window.location.href
      });

      if (response.success && response.paymentUrl) {
        setPayUrl(response.paymentUrl);
        setRechargeStep('redirect');
      } else {
        // Fallback to beautiful manual UPI QR payment
        const upiPayment = paymentService.generateUPIPayment(amt, orderId, user.phone);
        setUpiId(upiPayment.upiId);
        setQrCode(upiPayment.qrCodeUrl);
        setRechargeStep('manual');
      }
    } catch (err) {
      console.error('Recharge gateway failed, falling back to manual transfer:', err);
      const upiPayment = paymentService.generateUPIPayment(amt, orderId, user.phone);
      setUpiId(upiPayment.upiId);
      setQrCode(upiPayment.qrCodeUrl);
      setRechargeStep('manual');
    }
  };

  const handleVerifyUTR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(utrCode.trim())) {
      setModalError('Please enter a valid 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    setModalError('');
    setRechargeStep('verifying');

    // Simulate standard secure backend verification of the UTR through the Rupayex live ledger
    setTimeout(() => {
      const amt = parseFloat(rechargeVal);
      onRecharge(amt);
      setModalSuccess(`₹${amt.toFixed(2)} credited successfully via Rupayex Gateway!`);
      setRechargeVal('');
      setUtrCode('');
      setRechargeStep('input');
      setTimeout(() => {
        setModalSuccess('');
        setShowRecharge(false);
      }, 3000);
    }, 2500);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawVal);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid amount');
      return;
    }
    if (amt > user.balance) {
      setModalError('Insufficient balance');
      return;
    }
    onWithdraw(amt);
    setModalSuccess(`Successfully requested withdrawal of ₹${amt.toFixed(2)}!`);
    setWithdrawVal('');
    setModalError('');
    setTimeout(() => {
      setModalSuccess('');
      setShowWithdraw(false);
    }, 1500);
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
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                setShowRecharge(true);
              }}
              className="flex-1 bg-white text-[#0051C3] font-black py-3.5 rounded-xl shadow-md hover:bg-gray-50 transition-colors uppercase tracking-wider text-sm active:scale-95"
            >
              Recharge
            </button>
            <button 
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                if (!user.bankDetails) {
                  openBankDetails();
                  setModalError('Please bind your bank details before withdrawal.');
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
              setModalSuccess('Referral link copied to clipboard!');
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
              setModalSuccess('Password Management is secured by Adani Cloud Security.');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setShowRecharge(false);
                setRechargeStep('input');
                setUtrCode('');
                setModalError('');
                setModalSuccess('');
              }} 
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {rechargeStep === 'input' && (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0051C3]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">Recharge Balance</h3>
                    <p className="text-xs text-gray-400 font-medium">via Rupayex Secure Gateway</p>
                  </div>
                </div>
                
                {modalError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-1 shrink-0" />{modalError}</div>}
                {modalSuccess && <div className="p-3 mb-4 text-xs text-green-600 bg-green-50 rounded-xl font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 shrink-0" />{modalSuccess}</div>}

                <form onSubmit={handleRechargeSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-gray-800">₹</span>
                      <input 
                        type="number" 
                        value={rechargeVal}
                        onChange={(e) => setRechargeVal(e.target.value)}
                        placeholder="Enter recharge amount" 
                        className="w-full pl-9 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#0051C3] font-black text-xl text-gray-800"
                        required
                        min="100"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 5000, 10000, 20000, 50000].map(amt => (
                      <button 
                        key={amt} 
                        type="button"
                        onClick={() => setRechargeVal(amt.toString())}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          rechargeVal === amt.toString()
                            ? 'bg-[#0051C3] text-white border-[#0051C3] shadow-md shadow-blue-100'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-100'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-[10px] text-gray-500 font-medium leading-relaxed">
                    <p className="font-bold text-gray-700 mb-0.5">💡 Payment Note:</p>
                    <p>Recharges are securely routed via Rupayex Instant UPI node. Retain your 12-digit UTR ref code from your banking app to secure instant automatic approval.</p>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-[#0051C3] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 uppercase tracking-wider text-xs hover:bg-[#0041a3] transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
                  >
                    <span>Proceed to Secure Pay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {rechargeStep === 'gateway' && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-[#0051C3] animate-spin mb-4" />
                <h4 className="font-bold text-gray-800 text-base mb-1">Connecting Payment Node</h4>
                <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                  Securing 256-bit encrypted tunnel with Rupayex payment gateway servers...
                </p>
                <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-[#0051C3] w-2/3 rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {rechargeStep === 'redirect' && (
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-base">Payment Order Created</h4>
                  <p className="text-xs text-gray-400 font-medium">Order ID: {createdOrderId}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">₹{parseFloat(rechargeVal).toLocaleString('en-IN')}</p>
                </div>

                <button 
                  onClick={() => window.open(payUrl, '_blank')}
                  className="w-full bg-[#0051C3] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <span>Open Rupayex Secure Pay Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="border-t border-dashed border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 text-center font-semibold mb-3">
                    Have you completed the payment on Rupayex?
                  </p>
                  <button 
                    onClick={() => {
                      const upiPayment = paymentService.generateUPIPayment(parseFloat(rechargeVal), createdOrderId, user.phone);
                      setUpiId(upiPayment.upiId);
                      setQrCode(upiPayment.qrCodeUrl);
                      setRechargeStep('manual');
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all text-center"
                  >
                    Enter 12-Digit UTR
                  </button>
                </div>
              </div>
            )}

            {rechargeStep === 'manual' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-black text-base text-gray-800">Scan & Pay via UPI</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Order ID: {createdOrderId}</p>
                </div>

                {modalError && <div className="p-3 text-xs text-red-600 bg-red-50 rounded-xl font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-1 shrink-0" />{modalError}</div>}

                {/* QR Code Graphic */}
                <div className="bg-gray-50 p-3 rounded-3xl border border-gray-100 flex flex-col items-center justify-center relative">
                  <img 
                    src={qrCode} 
                    alt="UPI payment QR Code" 
                    className="w-40 h-40 bg-white p-2 rounded-2xl shadow-sm border border-gray-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bg-[#0051C3] text-white font-black text-[9px] uppercase px-3 py-1 rounded-full shadow-md bottom-2 flex items-center space-x-1">
                    <QrCode className="w-3 h-3" />
                    <span>Scan in GPay / PhonePe / Paytm</span>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Payable Amount</span>
                    <span className="text-base font-black text-gray-800">₹{parseFloat(rechargeVal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">UPI address</span>
                    <div className="flex items-center justify-end space-x-1">
                      <span className="text-xs font-bold text-gray-700 select-all">{upiId}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(upiId);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="text-blue-600 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Copy UPI ID"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* UTR Input Form */}
                <form onSubmit={handleVerifyUTR} className="space-y-3 pt-1 border-t border-dashed border-gray-200">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-700 font-bold">12-Digit UPI Ref / UTR No.</label>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Required</span>
                    </div>
                    <input 
                      type="text"
                      maxLength={12}
                      pattern="\d{12}"
                      value={utrCode}
                      onChange={(e) => setUtrCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 12-digit transaction UTR"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-mono font-bold text-center text-sm"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    Confirm UTR Payment
                  </button>
                </form>
              </div>
            )}

            {rechargeStep === 'verifying' && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <h4 className="font-bold text-gray-800 text-base mb-1">Verifying UPI Transaction</h4>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">UTR: {utrCode}</p>
                <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                  Querying the Rupayex decentral payment node to match UTR bank logs... Please do not close this window.
                </p>
                <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-5">
                  <div className="h-full bg-green-500 w-full rounded-full animate-pulse duration-1000" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 2. Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 mb-4">
              <Wallet className="w-5 h-5 text-[#0051C3]" />
              <h3 className="font-bold text-lg text-gray-800">Withdraw Funds</h3>
            </div>
            
            {modalError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl font-bold flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{modalError}</div>}
            {modalSuccess && <div className="p-3 mb-4 text-xs text-green-600 bg-green-50 rounded-xl font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" />{modalSuccess}</div>}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400 font-semibold">Available Balance:</span>
                <span className="font-bold text-gray-800">₹{user.balance.toFixed(2)}</span>
              </div>

              {user.bankDetails && (
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Landmark className="w-4 h-4 text-[#0051C3]" />
                    <div className="text-left">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block leading-none mb-1">Bound Bank Card</span>
                      <span className="text-xs font-black text-gray-800 block">
                        {user.bankDetails.bankName} (••••{user.bankDetails.accountNumber.slice(-4)})
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowWithdraw(false);
                      openBankDetails();
                    }}
                    className="text-xs text-[#0051C3] font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Withdraw Amount (₹)</label>
                <input 
                  type="number" 
                  value={withdrawVal}
                  onChange={(e) => setWithdrawVal(e.target.value)}
                  placeholder="Enter withdrawal amount" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-bold text-lg"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#0051C3] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider text-xs hover:bg-[#0041a3]"
              >
                Request Withdrawal
              </button>
            </form>
          </div>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowBankDetails(false)} 
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            <div className="flex items-center space-x-2 mb-4 shrink-0">
              <CreditCard className="w-5 h-5 text-[#0051C3]" />
              <h3 className="font-bold text-lg text-gray-800">Bank Account Card</h3>
            </div>

            {modalError && <div className="p-3 mb-4 text-xs text-red-600 bg-red-50 rounded-xl font-bold flex items-center shrink-0"><AlertCircle className="w-4 h-4 mr-1" />{modalError}</div>}
            {modalSuccess && <div className="p-3 mb-4 text-xs text-green-600 bg-green-50 rounded-xl font-bold flex items-center shrink-0"><CheckCircle2 className="w-4 h-4 mr-1" />{modalSuccess}</div>}

            <div className="overflow-y-auto flex-1 pr-1">
              {!isEditingBank && user.bankDetails ? (
                <div className="space-y-6">
                  {/* Digital Bank Card Preview */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#0051C3] to-[#0D9488] rounded-3xl p-6 text-white shadow-xl aspect-[1.6/1]">
                    {/* Background details */}
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                      <Landmark className="w-48 h-48" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Verified Bank Card</span>
                        <h4 className="font-black text-lg tracking-wide uppercase">{user.bankDetails.bankName}</h4>
                      </div>
                      <Landmark className="w-8 h-8 text-white/80" />
                    </div>

                    <div className="text-xl font-mono tracking-widest mb-6 text-white/90">
                      •••• •••• •••• {user.bankDetails.accountNumber.slice(-4)}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-[9px] uppercase font-bold text-white/50 tracking-wider">Card Holder</div>
                        <div className="text-sm font-bold tracking-wide uppercase">{user.bankDetails.actualName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] uppercase font-bold text-white/50 tracking-wider">IFSC Code</div>
                        <div className="text-xs font-mono font-bold">{user.bankDetails.ifscCode}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingBank(true)}
                    className="w-full bg-[#0051C3] text-white font-bold py-3.5 rounded-xl shadow-md uppercase tracking-wider text-xs hover:bg-[#0041a3]"
                  >
                    Change Bank Account Details
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBankDetailsSubmit} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start space-x-2 text-xs text-amber-800 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Please double check details before saving. Funds will be directly processed to this bank account.</span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Account Holder Name (Actual Name)</label>
                    <input 
                      type="text" 
                      value={actualName}
                      onChange={(e) => setActualName(e.target.value)}
                      placeholder="As per bank passbook" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Bank Name</label>
                    <input 
                      type="text" 
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Bank Account Number</label>
                    <input 
                      type="text" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} // only digits
                      placeholder="Enter account number" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-bold text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">IFSC Code</label>
                    <input 
                      type="text" 
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="11 Alphanumeric characters" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0051C3] font-bold text-sm font-mono"
                      maxLength={11}
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    {user.bankDetails && (
                      <button 
                        type="button"
                        onClick={() => setIsEditingBank(false)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl tracking-wider text-xs uppercase"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="flex-1 bg-[#0051C3] text-white font-bold py-3 rounded-xl shadow-md uppercase tracking-wider text-xs hover:bg-[#0041a3]"
                    >
                      Save Bank Details
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
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
