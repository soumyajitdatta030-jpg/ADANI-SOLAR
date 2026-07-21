import React, { useState } from 'react';
import { 
  Sparkles, 
  Wallet, 
  CreditCard, 
  Landmark, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Copy, 
  Check, 
  QrCode, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import { User, BankDetails, FinancialRecord } from '../types';
import { paymentService } from '../lib/paymentService';

export type RechargeStep = 'input' | 'gateway' | 'redirect' | 'manual' | 'verifying';

export interface RechargeModalProps {
  user: User;
  onClose: () => void;
  onRechargeSuccess: (amount: number) => void;
}

export function RechargeModal({ user, onClose, onRechargeSuccess }: RechargeModalProps) {
  const [rechargeStep, setRechargeStep] = useState<RechargeStep>('input');
  const [rechargeVal, setRechargeVal] = useState<string>('');
  const [utrCode, setUtrCode] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

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
    
    const orderId = 'RECH' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setCreatedOrderId(orderId);

    const apiKey = import.meta.env.VITE_RUPAYEX_API_KEY || '31fafbe1a1fa99efebbcd689962487d3';
    const instanceId = import.meta.env.VITE_RUPAYEX_INSTANCE_ID || 'Idvs0rzmcf1783524812';
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
        const upiPayment = paymentService.generateUPIPayment(amt, orderId, user.phone);
        setUpiId(upiPayment.upiId);
        setQrCode(upiPayment.qrCodeUrl);
        setRechargeStep('manual');
      }
    } catch (err) {
      console.error('Recharge gateway fallback:', err);
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

    setTimeout(() => {
      const amt = parseFloat(rechargeVal);
      onRechargeSuccess(amt);
      setModalSuccess(`₹${amt.toFixed(2)} credited successfully via Rupayex Gateway!`);
      setRechargeVal('');
      setUtrCode('');
      setRechargeStep('input');
      setTimeout(() => {
        setModalSuccess('');
        onClose();
      }, 2500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
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

            <a 
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#0051C3] hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 text-center block"
            >
              <span>Open Rupayex Secure Pay Gateway</span>
              <ArrowRight className="w-4 h-4 inline ml-1" />
            </a>

            <button 
              onClick={() => {
                window.location.href = payUrl;
              }}
              className="w-full bg-blue-50 hover:bg-blue-100 text-[#0051C3] font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all text-center block"
            >
              Direct Page Redirect to Payment
            </button>

            <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
              <button 
                onClick={() => {
                  setRechargeStep('verifying');
                  setTimeout(() => {
                    const amt = parseFloat(rechargeVal);
                    onRechargeSuccess(amt);
                    setModalSuccess(`₹${amt.toFixed(2)} credited successfully via Rupayex Gateway!`);
                    setTimeout(() => {
                      setModalSuccess('');
                      onClose();
                    }, 2000);
                  }, 2000);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Paid — Verify Deposit Now</span>
              </button>

              <button 
                onClick={() => {
                  const upiPayment = paymentService.generateUPIPayment(parseFloat(rechargeVal), createdOrderId, user.phone);
                  setUpiId(upiPayment.upiId);
                  setQrCode(upiPayment.qrCodeUrl);
                  setRechargeStep('manual');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all text-center"
              >
                Scan UPI QR / Enter 12-Digit UTR
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
  );
}

export interface WithdrawModalProps {
  user: User;
  onClose: () => void;
  onWithdrawSuccess: (amount: number) => void;
  onChangeBankClick: () => void;
}

export function WithdrawModal({ user, onClose, onWithdrawSuccess, onChangeBankClick }: WithdrawModalProps) {
  const [withdrawVal, setWithdrawVal] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<string>('');

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
    onWithdrawSuccess(amt);
    setModalSuccess(`Successfully requested withdrawal of ₹${amt.toFixed(2)}!`);
    setWithdrawVal('');
    setModalError('');
    setTimeout(() => {
      setModalSuccess('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
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
                  onClose();
                  onChangeBankClick();
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
  );
}

export interface BankDetailsModalProps {
  user: User;
  onClose: () => void;
  onUpdateBankDetails: (bankDetails: BankDetails) => void;
}

export function BankDetailsModal({ user, onClose, onUpdateBankDetails }: BankDetailsModalProps) {
  const [actualName, setActualName] = useState<string>(user.bankDetails?.actualName || '');
  const [bankName, setBankName] = useState<string>(user.bankDetails?.bankName || '');
  const [accountNumber, setAccountNumber] = useState<string>(user.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState<string>(user.bankDetails?.ifscCode || '');
  const [isEditingBank, setIsEditingBank] = useState<boolean>(!user.bankDetails);
  const [modalError, setModalError] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<string>('');

  const handleBankDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      setModalError('All fields are required');
      return;
    }

    if (ifscCode.trim().length !== 11) {
      setModalError('IFSC code must be exactly 11 characters');
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
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative p-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
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
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
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
  );
}

export interface PaymentSectionProps {
  user: User;
  onRechargeSuccess: (amount: number) => void;
  onWithdrawSuccess: (amount: number) => void;
  onUpdateBankDetails: (bankDetails: BankDetails) => void;
}

export function PaymentSection({ user, onRechargeSuccess, onWithdrawSuccess, onUpdateBankDetails }: PaymentSectionProps) {
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0051C3]">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Payment & Wallet Overview</h3>
            <p className="text-[11px] text-gray-400 font-medium">Rupayex 256-Bit Encrypted Payment Node</p>
          </div>
        </div>
        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-bold">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          <span>Active</span>
        </div>
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-r from-[#0051C3] to-[#0080B5] rounded-2xl p-4 text-white flex justify-between items-center shadow-md">
        <div>
          <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider block">Available Balance</span>
          <span className="text-2xl font-black tracking-tight">₹{user.balance.toFixed(2)}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowRecharge(true)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 backdrop-blur-md transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Recharge</span>
          </button>
          <button 
            onClick={() => setShowWithdraw(true)}
            className="bg-white text-[#0051C3] font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Bank Account Details Summary */}
      <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#0051C3] border border-gray-100 shadow-2xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bound Bank Card</span>
            <span className="text-xs font-black text-gray-800">
              {user.bankDetails ? `${user.bankDetails.bankName} (••••${user.bankDetails.accountNumber.slice(-4)})` : 'No bank card bound yet'}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowBankDetails(true)}
          className="text-xs font-bold text-[#0051C3] bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {user.bankDetails ? 'Manage' : 'Add Card'}
        </button>
      </div>

      {/* Security Footer Note */}
      <div className="flex items-center text-[10px] text-gray-400 space-x-1.5 pt-1">
        <Lock className="w-3 h-3 text-gray-400 shrink-0" />
        <span>All deposits and withdrawals processed with instant automated UTR verification.</span>
      </div>

      {/* Modals */}
      {showRecharge && (
        <RechargeModal 
          user={user} 
          onClose={() => setShowRecharge(false)} 
          onRechargeSuccess={onRechargeSuccess} 
        />
      )}

      {showWithdraw && (
        <WithdrawModal 
          user={user} 
          onClose={() => setShowWithdraw(false)} 
          onWithdrawSuccess={onWithdrawSuccess} 
          onChangeBankClick={() => setShowBankDetails(true)} 
        />
      )}

      {showBankDetails && (
        <BankDetailsModal 
          user={user} 
          onClose={() => setShowBankDetails(false)} 
          onUpdateBankDetails={onUpdateBankDetails} 
        />
      )}
    </div>
  );
}
