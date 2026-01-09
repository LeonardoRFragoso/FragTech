import { motion } from 'framer-motion';
import { Transaction } from '../../lib/supabase';
import { categoryColors, categoryIcons } from '../../lib/mockData';

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

export function TransactionItem({ transaction, index }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  const colorClass = categoryColors[transaction.category] || categoryColors.other;
  const icon = categoryIcons[transaction.category] || categoryIcons.other;

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{transaction.description}</div>
        <div className="text-gray-400 text-sm">{formatDate(transaction.created_at)}</div>
      </div>

      <div className="text-right">
        <div className={`font-mono font-semibold ${isPositive ? 'text-green-400' : 'text-white'}`}>
          {isPositive ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
        </div>
        <div className={`text-xs capitalize ${colorClass}`}>
          {transaction.category}
        </div>
      </div>
    </motion.div>
  );
}
