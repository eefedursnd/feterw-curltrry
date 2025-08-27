import { Link } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showIcon?: boolean;
}

export default function Logo({ className = '', size = 'xl', showIcon = true }: LogoProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <Link 
          size={iconSizes[size]} 
          className="text-white flex-shrink-0" 
        />
      )}
      <span className={`font-bold text-white ${sizeClasses[size]}`}>
        cutz.lol
      </span>
    </div>
  );
}
