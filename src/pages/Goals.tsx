import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  TrendingUp,
  Plane,
  Car,
  Home,
  GraduationCap,
  Smartphone,
  PiggyBank,
  Edit2,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  icon: React.ElementType;
  color: string;
  monthlyContribution: number;
}

// Estado vazio - em produção, buscar do backend
const mockGoals: Goal[] = [];

const categoryIcons = [
  { name: 'Viagem', icon: Plane },
  { name: 'Emergência', icon: PiggyBank },
  { name: 'Veículo', icon: Car },
  { name: 'Moradia', icon: Home },
  { name: 'Educação', icon: GraduationCap },
  { name: 'Eletrônicos', icon: Smartphone },
];

export default function Goals() {
  const [goals] = useState<Goal[]>(mockGoals);
  const [showNewGoal, setShowNewGoal] = useState(false);

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = (totalSaved / totalTarget) * 100;

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
            <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
            <p className="text-gray-400 text-sm">Acompanhe seus objetivos</p>
          </div>
          <Button onClick={() => setShowNewGoal(true)}>
            <Plus className="w-4 h-4" />
            Nova Meta
          </Button>
        </motion.div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Progresso Total</p>
                <p className="text-3xl font-bold text-white">
                  R$ {totalSaved.toLocaleString('pt-BR')}
                  <span className="text-lg text-gray-500">
                    {' '}/ R$ {totalTarget.toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-cyan-400">{overallProgress.toFixed(0)}%</p>
                <p className="text-gray-500 text-sm">{goals.length} metas ativas</p>
              </div>
            </div>
            
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              />
            </div>

            {/* AI Insight */}
            <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-cyan-400 text-sm font-medium">Dica da IA</p>
                  <p className="text-gray-300 text-sm">
                    Aumentando sua contribuição mensal em R$ 200, você pode atingir a meta "Viagem para Europa" 2 meses antes!
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsLeft = Math.ceil(remaining / goal.monthlyContribution);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <GlassCard className="p-5 hover:border-cyan-500/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${goal.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{goal.name}</h3>
                        <p className="text-gray-500 text-xs">{goal.category}</p>
                      </div>
                    </div>
                    <button className="text-gray-500 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        R$ {goal.currentAmount.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-white font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                        className={`h-full bg-gradient-to-r ${goal.color} rounded-full`}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1 text-right">
                      Meta: R$ {goal.targetAmount.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-700/50">
                    <div>
                      <p className="text-gray-500 text-xs">Contribuição mensal</p>
                      <p className="text-white font-medium">
                        R$ {goal.monthlyContribution.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Previsão</p>
                      <p className="text-cyan-400 font-medium">{monthsLeft} meses</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* New Goal Modal Placeholder */}
        {showNewGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewGoal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Nova Meta</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Nome da meta</label>
                    <Input placeholder="Ex: Viagem para Europa" />
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Valor alvo</label>
                    <Input placeholder="R$ 0,00" type="number" />
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Data limite</label>
                    <Input type="date" />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {categoryIcons.map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors flex flex-col items-center gap-1"
                          >
                            <CatIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-xs text-gray-400">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" onClick={() => setShowNewGoal(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button className="flex-1">Criar Meta</Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
