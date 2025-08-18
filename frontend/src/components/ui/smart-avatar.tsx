import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { refreshAvatarUrl } from '@/lib/avatarUtils';

interface SmartAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onAvatarRefresh?: (newUrl: string) => void;
}

export function SmartAvatar({ 
  src, 
  alt, 
  fallback, 
  className, 
  size = 'md',
  onAvatarRefresh 
}: SmartAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep internal src in sync with prop updates (e.g., after async data loads)
  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);


  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const handleImageError = async () => {
    if (!src || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const newUrl = await refreshAvatarUrl(src);
      if (newUrl) {
        setCurrentSrc(newUrl);
        onAvatarRefresh?.(newUrl);
      }
    } catch (error) {
      console.error('Failed to refresh avatar URL:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      <AvatarImage 
        src={currentSrc} 
        alt={alt || 'Avatar'} 
        onError={handleImageError}
      />
      <AvatarFallback className="text-sm font-semibold">
        {fallback ? getInitials(fallback) : 'U'}
      </AvatarFallback>
    </Avatar>
  );
}
