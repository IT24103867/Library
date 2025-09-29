import React from 'react';
import { FiUsers } from 'react-icons/fi';

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={`flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img
          className={`${sizeClasses[size]} rounded-full object-cover`}
          src={src}
          alt={name}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center`}>
          <FiUsers className={`${iconSizeClasses[size]} text-gray-600`} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;