import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Brain,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';

interface DashboardData {
  timestamp: string;
  userMetrics: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    dau: number;
    wau: number;
    mau: number;
    dauWauRatio: string;
    byPlan: Record<string, number>;
  };
  revenueMetrics: {
    mrr: string;
    arr: string;
    arpu: string;
    revenueThisMonth: string;
    revenueGrowth: string;
    churnRate: string;
    payingUsers: number;
    subscribersByPlan: Record<string, number>;
    ltv: string;
  };
  growthMetrics: {
    signups: number;
    activated: number;
    converted: number;
    activationRate: string;
    conversionRate: string;
    referrals: { total: number; converted: number; conversionRate: string };
  };
  aiMetrics: {
    totalQueriesLast30Days: number;
    weeklyQueries: number;
    uniqueAIUsers: number;
    avgQueriesPerUser: string;
    segments: { powerUsers: number; regularUsers: number; lightUsers: number; nonUsers: number };
  };
  alerts: Array<{ type: string; severity: string; message: string; value?: any }>;
}

const mockData: DashboardData = {
  timestamp: new Date().toISOString(),
  userMetrics: {
    total: 12847,
    active: 8921,
    newToday: 127,
    newThisWeek: 843,
    dau: 2341,
    wau: 5672,
    mau: 8921,
    dauWauRatio: '41.3',
    byPlan: { FREE: 10234, PRO: 2156, PREMIUM: 457 },
  },
  revenueMetrics: {
    mrr: '89450.00',
    arr: '1073400.00',
    arpu: '34.25',
    revenueThisMonth: '92340.00',
    revenueGrowth: '12.4%',
    churnRate: '3.2%',
    payingUsers: 2613,
    subscribersByPlan: { PRO: 2156, PREMIUM: 457 },
    ltv: '1070.31',
  },
  growthMetrics: {
    signups: 843,
    activated: 521,
    converted: 89,
    activationRate: '61.8',
    conversionRate: '10.6',
    referrals: { total: 234, converted: 89, conversionRate: '38.0' },
  },
  aiMetrics: {
    totalQueriesLast30Days: 45672,
    weeklyQueries: 12340,
    uniqueAIUsers: 6234,
    avgQueriesPerUser: '7.3',
    segments: { powerUsers: 456, regularUsers: 2341, lightUsers: 3437, nonUsers: 6613 },
  },
  alerts: [
    { type: 'churn', severity: 'warning', message: 'Churn rate aumentou 0.5% esta semana', value: '3.2%' },
  ],
};

function MetricCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${
              changeType === 'positive' ? 'text-green-400' : 
              changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {changeType === 'positive' ? <ArrowUpRight className="w-4 h-4" /> : 
               changeType === 'negative' ? <ArrowDownRight className="w-4 h-4" /> : null}
              {change}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </GlassCard>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(mockData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refresh = async () => {
    setIsLoading(true);
    // In production, fetch from API
    await new Promise(r => setTimeout(r, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Executivo</h1>
            <p className="text-gray-400 text-sm">
              Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <Button onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </motion.div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium">Alertas Críticos</p>
                  <ul className="mt-1 space-y-1">
                    {data.alerts.map((alert, i) => (
                      <li key={i} className="text-gray-300 text-sm">{alert.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <MetricCard
            title="MRR"
            value={`R$ ${Number(data.revenueMetrics.mrr).toLocaleString('pt-BR')}`}
            change={data.revenueMetrics.revenueGrowth}
            changeType="positive"
            icon={DollarSign}
            color="bg-green-500"
          />
          <MetricCard
            title="Usuários Ativos (MAU)"
            value={data.userMetrics.mau.toLocaleString('pt-BR')}
            change={`+${data.userMetrics.newThisWeek} esta semana`}
            changeType="positive"
            icon={Users}
            color="bg-blue-500"
          />
          <MetricCard
            title="Churn Rate"
            value={data.revenueMetrics.churnRate}
            changeType="neutral"
            icon={TrendingUp}
            color="bg-amber-500"
          />
          <MetricCard
            title="Conversão Free→Pago"
            value={`${data.growthMetrics.conversionRate}%`}
            icon={Target}
            color="bg-purple-500"
          />
        </motion.div>

        {/* Revenue & Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Revenue */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Métricas de Receita
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">ARR</p>
                <p className="text-xl font-bold text-white">
                  R$ {Number(data.revenueMetrics.arr).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">ARPU</p>
                <p className="text-xl font-bold text-white">
                  R$ {Number(data.revenueMetrics.arpu).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">LTV Estimado</p>
                <p className="text-xl font-bold text-cyan-400">
                  R$ {data.revenueMetrics.ltv}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Usuários Pagantes</p>
                <p className="text-xl font-bold text-white">
                  {data.revenueMetrics.payingUsers.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Subscribers by Plan */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm mb-3">Assinantes por Plano</p>
              <div className="space-y-2">
                {Object.entries(data.revenueMetrics.subscribersByPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className={`text-sm ${
                      plan === 'PREMIUM' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>{plan}</span>
                    <span className="text-white font-medium">{count.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Growth Funnel */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Funil de Crescimento (30d)
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Signups', value: data.growthMetrics.signups, percent: 100 },
                { label: 'Ativados', value: data.growthMetrics.activated, percent: Number(data.growthMetrics.activationRate) },
                { label: 'Convertidos', value: data.growthMetrics.converted, percent: Number(data.growthMetrics.conversionRate) },
              ].map((step, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{step.label}</span>
                    <span className="text-white font-medium">{step.value.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${step.percent}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    />
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">{step.percent.toFixed(1)}%</p>
                </div>
              ))}
            </div>

            {/* Referrals */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm mb-2">Programa de Indicação</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Indicações: {data.growthMetrics.referrals.total}</span>
                <span className="text-green-400">
                  {data.growthMetrics.referrals.conversionRate}% conversão
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* User Engagement & AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* User Engagement */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Engajamento de Usuários
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{data.userMetrics.dau.toLocaleString('pt-BR')}</p>
                <p className="text-gray-500 text-xs">DAU</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{data.userMetrics.wau.toLocaleString('pt-BR')}</p>
                <p className="text-gray-500 text-xs">WAU</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{data.userMetrics.mau.toLocaleString('pt-BR')}</p>
                <p className="text-gray-500 text-xs">MAU</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">DAU/WAU Ratio</span>
                <span className="text-2xl font-bold text-cyan-400">{data.userMetrics.dauWauRatio}%</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Benchmark: 40%+ é considerado excelente
              </p>
            </div>

            {/* By Plan */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm mb-2">Distribuição por Plano</p>
              <div className="flex gap-2">
                {Object.entries(data.userMetrics.byPlan).map(([plan, count]) => (
                  <div 
                    key={plan} 
                    className={`flex-1 p-2 rounded-lg text-center ${
                      plan === 'FREE' ? 'bg-slate-800' :
                      plan === 'PRO' ? 'bg-cyan-500/20' : 'bg-amber-500/20'
                    }`}
                  >
                    <p className="text-white font-bold">{count.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-gray-400">{plan}</p>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* AI Usage */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Uso da IA
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-500 text-xs">Consultas (30d)</p>
                <p className="text-2xl font-bold text-white">
                  {data.aiMetrics.totalQueriesLast30Days.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Usuários Únicos</p>
                <p className="text-2xl font-bold text-white">
                  {data.aiMetrics.uniqueAIUsers.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Média por Usuário</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {data.aiMetrics.avgQueriesPerUser}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Esta Semana</p>
                <p className="text-2xl font-bold text-white">
                  {data.aiMetrics.weeklyQueries.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Segments */}
            <div className="pt-4 border-t border-slate-700">
              <p className="text-gray-400 text-sm mb-3">Segmentação por Uso</p>
              <div className="space-y-2">
                {[
                  { label: 'Power Users (50+)', value: data.aiMetrics.segments.powerUsers, color: 'bg-purple-500' },
                  { label: 'Regular (10-49)', value: data.aiMetrics.segments.regularUsers, color: 'bg-cyan-500' },
                  { label: 'Light (1-9)', value: data.aiMetrics.segments.lightUsers, color: 'bg-blue-500' },
                  { label: 'Nunca usou', value: data.aiMetrics.segments.nonUsers, color: 'bg-slate-600' },
                ].map((seg, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${seg.color}`} />
                      <span className="text-gray-300 text-sm">{seg.label}</span>
                    </div>
                    <span className="text-white font-medium">{seg.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Investor Metrics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Métricas para Investidores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <p className="text-3xl font-bold text-green-400">
                  R$ {(Number(data.revenueMetrics.mrr) / 1000).toFixed(0)}k
                </p>
                <p className="text-gray-400 text-sm">MRR</p>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <p className="text-3xl font-bold text-cyan-400">
                  {data.userMetrics.mau.toLocaleString('pt-BR')}
                </p>
                <p className="text-gray-400 text-sm">MAU</p>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <p className="text-3xl font-bold text-purple-400">
                  {data.growthMetrics.conversionRate}%
                </p>
                <p className="text-gray-400 text-sm">Conversão</p>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <p className="text-3xl font-bold text-amber-400">
                  {data.revenueMetrics.churnRate}
                </p>
                <p className="text-gray-400 text-sm">Churn</p>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <p className="text-3xl font-bold text-blue-400">
                  {data.userMetrics.dauWauRatio}%
                </p>
                <p className="text-gray-400 text-sm">DAU/WAU</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
