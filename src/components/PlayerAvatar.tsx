import React, { useState } from 'react';

interface PlayerAvatarProps {
  nickname: string;
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  nickname,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
    xl: 'w-16 h-16 text-xl rounded-2xl',
    '2xl': 'w-20 h-20 text-2xl rounded-3xl',
  }[size];

  const initials = (nickname || 'P').slice(0, 2).toUpperCase();

  // Pick a subtle deterministic gradient background based on nickname string length / character code
  const gradients = [
    'from-emerald-500 to-teal-700 text-white',
    'from-blue-500 to-indigo-700 text-white',
    'from-amber-500 to-orange-700 text-white',
    'from-purple-500 to-indigo-700 text-white',
    'from-rose-500 to-pink-700 text-white',
    'from-cyan-500 to-blue-700 text-white',
  ];
  const charSum = nickname.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bgGradient = gradients[charSum % gradients.length];

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={nickname}
        onError={() => setImageError(true)}
        className={`${sizeClasses} object-cover border border-slate-200/80 shadow-2xs shrink-0 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br ${bgGradient} font-black flex items-center justify-center shrink-0 shadow-2xs border border-white/20 select-none ${className}`}
    >
      {initials}
    </div>
  );
};
