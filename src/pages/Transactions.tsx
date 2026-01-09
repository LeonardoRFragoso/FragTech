import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Smartphone,
  CreditCard,
  Zap,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

type TransactionType = 'all' | 'income' | 'expense' | 'pix';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  icon: React.ElementType;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

// Estado vazio - em produção, buscar do backend
const mockTransactions: Transaction[] = [];

const categories = ['Todas', 'Alimentação', 'Transporte', 'Moradia', 'Streaming', 'PIX', 'Salário', 'Extra'];

export default function Transactions() {
  const [filter, setFilter] = useState<TransactionType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = mockTransactions.filter(t => {
    if (filter === 'income' && t.type !== 'income') return false;
    if (filter === 'expense' && t.type !== 'expense') return false;
    if (filter === 'pix' && t.category !== 'PIX') return false;
    if (selectedCategory !== 'Todas' && t.category !== selectedCategory) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalIncome = mockTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = mockTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Transações</h1>
            <p className="text-gray-400 text-sm">Histórico completo de movimentações</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Entradas</p>
                <p className="text-xl font-bold text-green-400">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Saídas</p>
                <p className="text-xl font-bold text-red-400">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'income', label: 'Entradas' },
              { key: 'expense', label: 'Saídas' },
              { key: 'pix', label: 'PIX' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as TransactionType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === item.key
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-2"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="divide-y divide-slate-700/50">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Nenhuma transação encontrada</p>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => {
                const Icon = transaction.icon;
                const isIncome = transaction.type === 'income';

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isIncome ? 'bg-green-500/20' : 'bg-slate-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{transaction.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">{transaction.category}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <p className={`font-semibold ${isIncome ? 'text-green-400' : 'text-white'}`}>
                      {isIncome ? '+' : ''} R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </motion.div>
                );
              })
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
