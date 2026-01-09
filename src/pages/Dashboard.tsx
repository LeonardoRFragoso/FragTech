import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  CreditCard,
  Send,
  QrCode,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  LogOut,
  Eye,
  EyeOff,
  Wallet,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { TransactionItem } from '../components/dashboard/TransactionItem';
import { AICopilot } from '../components/dashboard/AICopilot';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Dashboard() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const [showBalance, setShowBalance] = useState(true);
  const [showCopilot, setShowCopilot] = useState(false);
  const [transactions] = useState<any[]>([]);
  const [insights] = useState<any[]>([]);

  // Estado inicial limpo - valores zerados para novo usuário
  const balance = profile?.balance || 0;
  const monthlySpending = 0;
  const monthlyIncome = profile?.monthly_income || 0;
  const savingsGoal = 0;
  const currentSavings = 0;

  // Em produção, buscar transações e insights do backend via useEffect

  const quickActions = [
    { icon: Send, label: t('dashboard.quickActions.pix'), color: 'from-cyan-500 to-blue-500' },
    { icon: QrCode, label: t('dashboard.quickActions.pay'), color: 'from-purple-500 to-pink-500' },
    { icon: CreditCard, label: t('dashboard.quickActions.cards'), color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      <div className="relative z-10">
        <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">FragTech</h1>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCopilot(!showCopilot)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={20} />
                  AI Copilot
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-white font-medium">{profile?.full_name}</div>
                    <div className="text-gray-400 text-xs">Score: {profile?.credit_score || 0}</div>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">{t('dashboard.availableBalance')}</p>
                      <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-bold text-white font-mono">
                          {showBalance ? `R$ ${balance.toFixed(2)}` : 'R$ •••••'}
                        </h2>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-4 rounded-xl bg-gradient-to-r ${action.color} flex flex-col items-center gap-2 text-white font-medium`}
                        >
                          <Icon size={24} />
                          <span className="text-sm">{action.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <TrendingUp size={16} />
                        <span className="text-xs font-medium">{t('dashboard.income')}</span>
                      </div>
                      <div className="text-white font-mono font-semibold">
                        R$ {monthlyIncome.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{t('dashboard.thisMonth')}</div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-red-400 mb-2">
                        <TrendingDown size={16} />
                        <span className="text-xs font-medium">{t('dashboard.expenses')}</span>
                      </div>
                      <div className="text-white font-mono font-semibold">
                        R$ {monthlySpending.toFixed(2)}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{t('dashboard.thisMonth')}</div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">{t('dashboard.recentTransactions')}</h3>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                      {t('dashboard.viewAll')}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {transactions.length > 0 ? (
                      transactions.slice(0, 6).map((transaction: any, index: number) => (
                        <TransactionItem key={transaction.id} transaction={transaction} index={index} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">{t('dashboard.noTransactions') || 'No transactions yet'}</p>
                        <p className="text-gray-500 text-sm">{t('dashboard.transactionsWillAppear') || 'Your transactions will appear here'}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">{t('dashboard.savingsGoal')}</h3>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{t('dashboard.progress')}</span>
                      <span className="text-white font-mono">
                        {((currentSavings / savingsGoal) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentSavings / savingsGoal) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-gray-400 text-xs">{t('dashboard.current')}</div>
                      <div className="text-white font-mono font-semibold">
                        R$ {currentSavings.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{t('dashboard.goal')}</div>
                      <div className="text-white font-mono font-semibold">
                        R$ {savingsGoal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">{t('dashboard.aiInsights')}</h3>
                  </div>
                  <div className="space-y-3">
                    {insights.length > 0 ? (
                      insights.slice(0, 3).map((insight: any, index: number) => (
                        <motion.div
                          key={insight.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors cursor-pointer"
                        >
                          <div className="text-white font-medium text-sm mb-1">
                            {insight.title}
                          </div>
                          <div className="text-gray-400 text-xs line-clamp-2">
                            {insight.message}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">{t('dashboard.useAppForInsights') || 'Use the app to receive personalized insights'}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {showCopilot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCopilot(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AICopilot />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
