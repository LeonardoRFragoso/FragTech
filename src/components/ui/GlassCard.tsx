import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', hoverable = false, onClick }: GlassCardProps) {
  const Component = hoverable ? motion.div : 'div';

  const hoverProps = hoverable
    ? {
        whileHover: { scale: 1.02, y: -4 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-md border border-white/10 rounded-xl
        shadow-lg shadow-black/20
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...hoverProps}
    >
      {children}
    </Component>
  );
}
