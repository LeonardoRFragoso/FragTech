import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Brain, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../contexts/AuthContext';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [financialProfile, setFinancialProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [aiPreference, setAiPreference] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useAuth();

  const goalOptions = [
    { id: 'save', label: 'Economizar Dinheiro', icon: TrendingUp },
    { id: 'invest', label: 'Começar a Investir', icon: Target },
    { id: 'organize', label: 'Organizar Finanças', icon: Brain },
  ];

  const handleGoalToggle = (goalId: string) => {
    setGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await updateProfile({
        financial_profile: financialProfile,
        monthly_income: parseFloat(monthlyIncome) || 0,
        onboarding_completed: true,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return financialProfile && monthlyIncome;
    if (step === 2) return goals.length > 0;
    if (step === 3) return aiPreference;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: step >= i ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm text-center">Passo {step} de 3</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-3xl font-bold text-white mb-2">Perfil Financeiro</h2>
                <p className="text-gray-400 mb-8">Nos ajude a entender sua situação financeira</p>

                <div className="space-y-6">
                  <Input
                    type="number"
                    label="Renda Mensal (R$)"
                    placeholder="5000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Perfil de Investimento
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['conservative', 'moderate', 'aggressive'] as const).map((profile) => (
                        <button
                          key={profile}
                          onClick={() => setFinancialProfile(profile)}
                          className={`
                            p-4 rounded-lg border transition-all duration-200
                            ${financialProfile === profile
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                            }
                          `}
                        >
                          <div className="text-white font-medium capitalize">
                          {profile === 'conservative' ? 'Conservador' : profile === 'moderate' ? 'Moderado' : 'Agressivo'}
                        </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="w-full mt-8"
                >
                  Continuar <ChevronRight size={20} />
                </Button>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-3xl font-bold text-white mb-2">Seus Objetivos</h2>
                <p className="text-gray-400 mb-8">O que você quer alcançar?</p>

                <div className="grid gap-4 mb-8">
                  {goalOptions.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = goals.includes(goal.id);
                    return (
                      <motion.button
                        key={goal.id}
                        onClick={() => handleGoalToggle(goal.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          p-6 rounded-xl border flex items-center gap-4 transition-all duration-200
                          ${isSelected
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                          }
                        `}
                      >
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center
                          ${isSelected ? 'bg-cyan-500' : 'bg-white/10'}
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-medium flex-1 text-left">{goal.label}</span>
                        {isSelected && <Check className="w-5 h-5 text-cyan-400" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canProceed()} className="flex-1">
                    Continuar <ChevronRight size={20} />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-3xl font-bold text-white mb-2">Preferências da IA</h2>
                <p className="text-gray-400 mb-8">Como seu copiloto de IA deve te ajudar?</p>

                <div className="space-y-4 mb-8">
                  {[
                    { id: 'proactive', label: 'Proativo', desc: 'Enviar alertas e sugestões automaticamente' },
                    { id: 'balanced', label: 'Equilibrado', desc: 'Insights inteligentes quando necessário' },
                    { id: 'minimal', label: 'Mínimo', desc: 'Apenas notificações críticas' },
                  ].map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => setAiPreference(pref.id)}
                      className={`
                        w-full p-6 rounded-xl border text-left transition-all duration-200
                        ${aiPreference === pref.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-white font-medium mb-1">{pref.label}</div>
                          <div className="text-gray-400 text-sm">{pref.desc}</div>
                        </div>
                        {aiPreference === pref.id && <Check className="w-5 h-5 text-cyan-400" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={handleComplete} disabled={loading} className="flex-1">
                    {loading ? 'Configurando...' : 'Finalizar Configuração'}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
