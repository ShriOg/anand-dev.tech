import React from 'react';

interface AvatarProps {
  avatar: string | null | undefined;
  name: string;
  size: number;
  className?: string;
  onClick?: () => void;
}

export function Avatar({ avatar, name, size, className = '', onClick }: AvatarProps) {
  if (avatar) {
    return (
      <img 
        src={avatar} 
        width={size} 
        height={size} 
        className={className}
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          objectFit: 'cover',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0
        }}
        onClick={onClick}
        alt={name}
      />
    );
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div 
      className={className}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--gradient, linear-gradient(135deg, #E91E8C 0%, #7C3AED 100%))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700,
        fontSize: size * 0.4,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0
      }}
    >
      {initial}
    </div>
  );
}
