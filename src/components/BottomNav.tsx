import React from 'react';
import { Home, Trophy, Wallet, BarChart3, Users, Calendar } from 'lucide-react';

export type NavTab = 'schedule' | 'standings' | 'finance' | 'monthly' | 'players';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unpaidCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, unpaidCount = 0 }) => {
  const tabs = [
    { id: 'schedule', label: 'แข่งสด', icon: Home },
    { id: 'standings', label: 'อันดับ', icon: Trophy },
    { id: 'finance', label: 'การเงิน', icon: Wallet, badge: unpaidCount > 0 ? unpaidCount : undefined },
    { id: 'monthly', label: 'สถิติ', icon: BarChart3 },
    { id: 'players', label: 'สมาชิก', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] py-2">
      <div className="max-w-md mx-auto flex items-center justify-around px-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id as NavTab)}
              id={`nav-tab-${tab.id}`}
              className="relative flex flex-col items-center justify-center py-1 px-3 group transition-all duration-200 cursor-pointer"
            >
              <div className="relative flex flex-col items-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#ff2a6d] stroke-[2.5] scale-110'
                      : 'text-slate-400 group-hover:text-slate-600 stroke-2'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#ff2a6d] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
                {/* Active Indicator Dot */}
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-all duration-200 ${
                    isActive ? 'bg-[#ff2a6d] scale-100 opacity-100' : 'scale-0 opacity-0'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight font-medium transition-colors duration-200 mt-0.5 ${
                  isActive ? 'text-[#ff2a6d] font-bold' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

