import { LucideIcon } from 'lucide-react';

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
}

export function AnimatedIcon({ icon: Icon, className = '' }: AnimatedIconProps) {
  return (
    <div className={`animate-pulse-slow ${className}`}>
      <Icon className="w-full h-full" />
    </div>
  );
}
