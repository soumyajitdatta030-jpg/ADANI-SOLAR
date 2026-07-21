import React, { useState } from 'react';
import { Logo } from './Logo';
import { User } from '../types';
import { dbService } from '../lib/dbService';
import { AlertCircle, Loader2 } from 'lucide-react';

import authBg from '../assets/images/auth_background_1784043376314.jpg';
import loginBg from '../assets/images/login_background_1784043505295.jpg';

interface AuthProps {
  onLogin: (user: User) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login directly with local db service
        const loggedInUser = await dbService.login(phone, password);
        onLogin(loggedInUser);
      } else {
        // Registration directly to local db service
        if (customerName.trim().length === 0) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const newUser = await dbService.register({
          phone,
          name: customerName,
          password,
          invitationCode: referralCode || undefined
        });

        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center relative shadow-2xl overflow-y-auto py-8">
      <div className="absolute inset-0 z-0">
        <img src={isLogin ? loginBg : authBg} alt="Background" className="w-full h-full object-cover fixed opacity-40" />
        <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-md fixed"></div>
      </div>
      
      <div className="w-full px-6 relative z-10">
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-xl border border-white/50">
          <Logo className="mb-6" />
          
          <div className="w-full h-40 rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={isLogin ? loginBg : authBg} alt="Clean Energy" className="w-full h-full object-cover" />
          </div>
          
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="flex bg-gray-50 rounded-xl border border-gray-200 focus-within:border-[#0051C3] focus-within:ring-1 focus-within:ring-[#0051C3] transition-all overflow-hidden">
                <span className="inline-flex items-center px-3 bg-gray-100 text-gray-500 font-bold border-r border-gray-200 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1 w-full px-3 py-3 outline-none text-sm bg-transparent"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 outline-none border border-gray-200 rounded-xl bg-gray-50 focus:border-[#0051C3] focus:ring-1 focus:ring-[#0051C3] transition-all text-sm"
                placeholder="Enter password"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-3 outline-none border border-gray-200 rounded-xl bg-gray-50 focus:border-[#0051C3] focus:ring-1 focus:ring-[#0051C3] transition-all text-sm"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-3 outline-none border border-gray-200 rounded-xl bg-gray-50 focus:border-[#0051C3] focus:ring-1 focus:ring-[#0051C3] transition-all text-sm"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full px-3 py-3 outline-none border border-gray-200 rounded-xl bg-gray-50 focus:border-[#0051C3] focus:ring-1 focus:ring-[#0051C3] transition-all text-sm"
                    placeholder="Enter referral code"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-md mt-6 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed opacity-80'
                  : 'bg-[#0051C3] hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-gray-600 font-medium hover:text-gray-900"
            >
              {isLogin ? (
                <span>Don't have an account? <span className="text-[#0051C3] font-bold">Register Now</span></span>
              ) : (
                <span>Already have an account? <span className="text-[#0051C3] font-bold">Sign In</span></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
