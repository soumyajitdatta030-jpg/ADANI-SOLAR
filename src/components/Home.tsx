import React, { useState } from 'react';
import { HeadphonesIcon, Send, ArrowRight, Wallet, Users, FileText, TrendingUp, Megaphone, X } from 'lucide-react';
import { Logo } from './Logo';
import { User, Tab } from '../types';

// Use the generated images
import heroBanner from '../assets/images/hero_banner_1784035507057.jpg';
import secondaryBanner from '../assets/images/secondary_banner_1784035591689.jpg';

interface HomeProps {
  user: User;
  onNavigateTab: (tab: Tab) => void;
  customHeroBanner?: string;
  customSecondaryBanner?: string;
  appSettings?: any;
}

export function Home({ user, onNavigateTab, customHeroBanner, customSecondaryBanner, appSettings }: HomeProps) {
  const [showModal, setShowModal] = useState(true);

  // Dynamic official links from admin panel settings
  const telegramChannel = appSettings?.telegram_channel || appSettings?.telegramChannel || 'https://t.me/adani_solar0';
  const telegramService = appSettings?.telegram_service || appSettings?.telegramService || 'https://t.me/Adani_service';
  const welcomeTitle = appSettings?.welcome_title || appSettings?.welcomeTitle || 'Welcome to Adani Solar';
  const welcomeText = appSettings?.welcome_text || appSettings?.welcomeText || 'Start your investment journey today and be a part of the green energy revolution.';

  // Calculate dynamic stats from real user profile
  const totalBalance = user.balance;
  const totalEarnings = (user.financialRecords || [])
    .filter(rec => rec.type === 'earnings')
    .reduce((sum, rec) => sum + rec.amount, 0);
  const totalInvested = (user.investments || [])
    .reduce((sum, inv) => sum + inv.price, 0);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Telegram Join Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="bg-gradient-to-br from-[#0080B5] to-[#513687] p-6 text-center text-white">
              <div className="bg-white/20 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join Official Channel</h3>
              <p className="text-white/80 text-sm">Get the latest updates, event news, and exclusive benefits.</p>
            </div>
            
            <div className="p-6 text-center">
              <p className="text-gray-600 text-sm mb-6 font-medium">
                Join our Telegram channel now and start your journey towards a sustainable future!
              </p>
              
              <button 
                onClick={() => {
                  window.open(telegramChannel, '_blank');
                  setShowModal(false);
                }}
                className="w-full bg-[#0051C3] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#0041a3] transition-all flex items-center justify-center space-x-2 animate-pulse"
              >
                <Send className="w-5 h-5" />
                <span>Join Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white flex justify-between items-center px-4 py-3 sticky top-0 z-20">
        <Logo className="scale-75 origin-left" />
        <div className="flex space-x-4">
          <button className="flex flex-col items-center" onClick={() => window.open(telegramService, '_blank')}>
            <div className="bg-gray-100 p-2.5 rounded-2xl mb-1">
              <HeadphonesIcon className="w-5 h-5 text-gray-800" />
            </div>
            <span className="text-[10px] font-medium text-gray-600">Support</span>
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div className="relative w-full h-[240px]">
        <img src={customHeroBanner || heroBanner} alt="Solar Panels" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent p-6 flex flex-col justify-center">
          <h1 className="text-[26px] font-bold leading-tight mb-2">
            <span className="text-gray-900 block">Powering</span>
            <span className="text-[#0051C3] block">a Sustainable</span>
            <span className="text-[#0051C3] block">Future</span>
          </h1>
          <div className="w-6 h-0.5 bg-gray-400 mb-2"></div>
          <p className="text-sm text-gray-800 font-medium max-w-[200px] mb-4">
            Invest in Adani Solar and grow your future
          </p>
          <button 
            onClick={() => onNavigateTab('invest')}
            className="bg-[#0051C3] hover:bg-[#0041a3] text-white px-5 py-2 rounded-xl w-fit flex items-center space-x-2 text-sm font-semibold shadow-md active:scale-95 transition-all"
          >
            <span>Invest Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
        <ActionBtn 
          icon={<div className="text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"></rect><path d="M9 9v12"></path><path d="M15 9v12"></path><path d="M3 15h18"></path><circle cx="17" cy="4" r="2" fill="currentColor"></circle></svg></div>} 
          label="Invest" 
          bgColor="bg-[#0051C3]" 
          onClick={() => onNavigateTab('invest')}
        />
        <ActionBtn 
          icon={<Wallet className="w-6 h-6 text-white" />} 
          label="Wallet" 
          bgColor="bg-[#22C55E]" 
          onClick={() => onNavigateTab('profile')}
        />
        <ActionBtn 
          icon={<FileText className="w-6 h-6 text-white" />} 
          label="Earnings" 
          bgColor="bg-[#F97316]" 
          onClick={() => onNavigateTab('earnings')}
        />
        <ActionBtn 
          icon={<Users className="w-6 h-6 text-white" />} 
          label="Team" 
          bgColor="bg-[#8B5CF6]" 
          onClick={() => onNavigateTab('team')}
        />
        <ActionBtn 
          icon={<Send className="w-6 h-6 text-white" />} 
          label="Customer Service" 
          bgColor="bg-[#0EA5E9]" 
          onClick={() => window.open(telegramService, '_blank')}
        />
      </div>

      {/* Stats */}
      <div className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between">
        <StatItem title="Total Balance" value={`₹${totalBalance.toFixed(2)}`} icon={<Wallet className="w-5 h-5 text-[#0051C3]" />} />
        <div className="w-px bg-gray-100"></div>
        <StatItem title="Total Earnings" value={`₹${totalEarnings.toFixed(2)}`} icon={<TrendingUp className="w-5 h-5 text-[#22C55E]" />} valueColor="text-[#22C55E]" />
        <div className="w-px bg-gray-100"></div>
        <StatItem title="Total Invested" value={`₹${totalInvested.toFixed(2)}`} icon={<Wallet className="w-5 h-5 text-[#F97316]" />} valueColor="text-[#F97316]" />
      </div>

      {/* Secondary Banner */}
      <div className="relative mx-4 mt-4 h-[140px] rounded-2xl overflow-hidden shadow-sm">
        <img src={customSecondaryBanner || secondaryBanner} alt="Clean Energy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent p-5 flex flex-col justify-center">
          <h2 className="text-xl font-bold leading-tight mb-2">
            <span className="text-[#0051C3] block">Clean Energy</span>
            <span className="text-gray-900 block">Bright Future</span>
          </h2>
          <div className="w-6 h-0.5 bg-gray-400 mb-2"></div>
          <p className="text-xs text-gray-800 font-medium max-w-[160px]">
            Together, let's build a better tomorrow.
          </p>
        </div>
      </div>

      {/* Announcement */}
      <div className="bg-white mx-4 mt-4 mb-4 rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-start space-x-3">
          <Megaphone className="w-6 h-6 text-[#0051C3] shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-sm text-gray-900">{welcomeTitle}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {welcomeText}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, bgColor, onClick }: { icon: React.ReactNode, label: string, bgColor: string, onClick?: () => void }) {
  return (
    <button className="flex flex-col items-center justify-center" onClick={onClick}>
      <div className={`mb-1.5 ${bgColor} w-12 h-12 flex items-center justify-center rounded-[1rem] shadow-sm`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium text-gray-600 text-center line-clamp-1 w-[60px]">{label}</span>
    </button>
  );
}

function StatItem({ title, value, icon, valueColor = "text-gray-800" }: { title: string, value: string, icon: React.ReactNode, valueColor?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center text-center">
      <div className="mb-1 text-gray-400">
        {icon}
      </div>
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{title}</span>
      <span className={`text-sm font-black ${valueColor}`}>{value}</span>
    </div>
  );
}
