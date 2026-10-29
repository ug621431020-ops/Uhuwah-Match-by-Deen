import React from 'react';
import { Shield, Trophy, Flame, Zap, Award, Star } from 'lucide-react';

interface TeamCrestProps {
  teamName?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export const TeamCrest: React.FC<TeamCrestProps> = ({
  teamName = 'TEAM',
  color = 'red',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-14 h-14 text-base',
  };

  const iconSizeMap = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  // Color theme config
  const colorThemes: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    red: {
      bg: 'from-rose-600 via-red-600 to-rose-800',
      border: 'border-rose-400/40',
      glow: 'shadow-rose-500/20',
      text: 'text-rose-100',
    },
    blue: {
      bg: 'from-blue-500 via-indigo-600 to-blue-800',
      border: 'border-blue-400/40',
      glow: 'shadow-blue-500/20',
      text: 'text-blue-100',
    },
    green: {
      bg: 'from-emerald-500 via-teal-600 to-emerald-800',
      border: 'border-emerald-400/40',
      glow: 'shadow-emerald-500/20',
      text: 'text-emerald-100',
    },
    black: {
      bg: 'from-slate-800 via-slate-900 to-black',
      border: 'border-slate-600/50',
      glow: 'shadow-slate-900/30',
      text: 'text-slate-100',
    },
    yellow: {
      bg: 'from-amber-400 via-orange-500 to-amber-600',
      border: 'border-amber-300/60',
      glow: 'shadow-amber-500/25',
      text: 'text-slate-950 font-black',
    },
    purple: {
      bg: 'from-purple-600 via-fuchsia-600 to-indigo-800',
      border: 'border-purple-400/40',
      glow: 'shadow-purple-500/20',
      text: 'text-purple-100',
    },
    orange: {
      bg: 'from-orange-500 via-amber-600 to-orange-700',
      border: 'border-orange-400/40',
      glow: 'shadow-orange-500/20',
      text: 'text-white font-bold',
    },
  };

  const theme = colorThemes[color.toLowerCase()] || colorThemes.red;
  const initials = teamName.slice(0, 3).toUpperCase();

  // Pick team specific badge icon
  const renderTeamIcon = () => {
    const lower = teamName.toLowerCase();
    const iconClass = `${iconSizeMap[size]} text-white/90 drop-shadow-xs`;
    if (lower.includes('tea')) return <Flame className={iconClass} />;
    if (lower.includes('kopi')) return <Zap className={iconClass} />;
    if (lower.includes('agsa')) return <Star className={iconClass} />;
    if (lower.includes('bloom')) return <Award className={iconClass} />;
    return <Shield className={iconClass} />;
  };

  return (
    <div
      className={`relative rounded-full bg-gradient-to-br ${theme.bg} p-[1.5px] shadow-sm ${theme.glow} shrink-0 ${sizeMap[size]} ${className}`}
      title={teamName}
    >
      {/* Inner circular crest container with sport shield finish */}
      <div className="w-full h-full rounded-full bg-black/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-0.5 border border-white/20 select-none overflow-hidden">
        {size === 'xs' ? (
          <span className={`font-black font-mono leading-none ${theme.text}`}>
            {initials.slice(0, 2)}
          </span>
        ) : size === 'sm' ? (
          <span className={`font-black font-mono text-[9px] tracking-tight leading-none ${theme.text}`}>
            {initials}
          </span>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {renderTeamIcon()}
            <span className={`font-black font-mono text-[8px] sm:text-[9px] tracking-tight leading-none mt-0.5 ${theme.text}`}>
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
