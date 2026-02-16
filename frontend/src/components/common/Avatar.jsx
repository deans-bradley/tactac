import { User } from 'lucide-react';

export default function Avatar({ 
  src, 
  alt = 'User', 
  size = 'md',
  className = '' 
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} 
        rounded-full bg-gray-200 
        flex items-center justify-center
        ${className}
      `}
    >
      <User className={`${iconSizes[size]} text-gray-400`} />
    </div>
  );
}
