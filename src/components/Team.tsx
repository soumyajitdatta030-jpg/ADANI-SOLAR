import React from 'react';
import { Users, Copy, CheckCircle, Share2, Award, Zap } from 'lucide-react';
import teamBanner from '../assets/images/team_solar_panels_1784180686417.jpg';

export function Team() {
  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <div className="relative pt-12 pb-16 px-5 rounded-b-[2.5rem] shadow-lg overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={teamBanner} alt="Solar Team" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0051C3]/80 to-black/80"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <Users className="w-12 h-12 text-white/90 mb-3" />
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Refer & Earn</h2>
          <p className="text-white/80 text-sm max-w-[280px]">Build your network and earn lucrative commissions on every successful referral.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-8 relative z-20 space-y-4">
        {/* Referral Link Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Your Invitation Link</h3>
            <Share2 className="w-5 h-5 text-[#0051C3]" />
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500 font-mono truncate mr-3">https://adani-solar.app/ref/82910</span>
            <button 
              className="bg-[#0051C3] text-white p-2 rounded-lg hover:bg-[#0041a3] transition-colors"
              onClick={() => alert('Link copied to clipboard!')}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <div className="text-xs text-blue-600 font-semibold mb-1 uppercase">Total Team</div>
              <div className="text-2xl font-black text-[#0051C3]">0</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <div className="text-xs text-green-600 font-semibold mb-1 uppercase">Commission</div>
              <div className="text-2xl font-black text-green-600">₹0.00</div>
            </div>
          </div>
        </div>

        {/* Features & Benefits */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center">
            <Award className="w-5 h-5 text-yellow-500 mr-2" />
            Commission Benefits
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mt-1 bg-green-100 p-1 rounded-full mr-3 shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Level 1: 10% Commission</h4>
                <p className="text-xs text-gray-500 mt-0.5">Earn 10% when your direct referrals purchase any solar equipment.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mt-1 bg-blue-100 p-1 rounded-full mr-3 shrink-0">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Level 2: 5% Commission</h4>
                <p className="text-xs text-gray-500 mt-0.5">Earn 5% when users referred by your level 1 team make a purchase.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mt-1 bg-purple-100 p-1 rounded-full mr-3 shrink-0">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Level 3: 2% Commission</h4>
                <p className="text-xs text-gray-500 mt-0.5">Earn 2% when users referred by your level 2 team make a purchase.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-6 shadow-md text-white">
          <div className="flex items-center mb-3">
            <Zap className="w-6 h-6 mr-2 text-white" />
            <h3 className="font-bold text-lg">Special Bonus</h3>
          </div>
          <p className="text-sm text-white/90 leading-relaxed font-medium">
            Invite 5 active users to invest in any solar plan and receive an instant bonus of <span className="font-bold text-lg">₹500</span> directly in your wallet!
          </p>
        </div>
      </div>
    </div>
  );
}
