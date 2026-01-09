import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight, Crown, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';

interface PaywallProps {
  feature: string;
  requiredPlan: 'PRO' | 'PREMIUM';
  currentPlan: 'FREE' | 'PRO' | 'PREMIUM';
  onUpgrade: () => void;
  onClose?: () => void;
}

const planBenefits = {
  PRO: [
    'AI Copilot ilimitado',
    'Insights personalizados',
    'Metas avançadas com IA',
    'Automação financeira',
    'Suporte prioritário',
  ],
  PREMIUM: [
    'Tudo do Pro, mais:',
    'IA preditiva avançada',
    'Crédito inteligente',
    'Open Finance completo',
    'Benefícios exclusivos',
  ],
};

export function Paywall({ feature, requiredPlan, currentPlan, onUpgrade, onClose }: PaywallProps) {
  const isPremiumRequired = requiredPlan === 'PREMIUM';
  const Icon = isPremiumRequired ? Crown : Star;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6 text-center">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">
            Recurso exclusivo do plano {requiredPlan}
          </h2>
          <p className="text-gray-400 mb-6">
            <span className="text-cyan-400 font-medium">{feature}</span> está disponível 
            apenas para assinantes do plano {requiredPlan}.
          </p>

          {/* Plan Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
            isPremiumRequired 
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400' 
              : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400'
          }`}>
            <Icon className="w-5 h-5" />
            <span className="font-semibold">Plano {requiredPlan}</span>
          </div>

          {/* Benefits */}
          <div className="text-left mb-6">
            <p className="text-gray-400 text-sm mb-3">O que você ganha:</p>
            <ul className="space-y-2">
              {planBenefits[requiredPlan].map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <p className="text-gray-400 text-sm">A partir de</p>
            <p className="text-3xl font-bold text-white">
              R$ {requiredPlan === 'PRO' ? '29,90' : '79,90'}
              <span className="text-lg text-gray-400">/mês</span>
            </p>
            {requiredPlan === 'PRO' && (
              <p className="text-green-400 text-sm mt-1">14 dias grátis para testar</p>
            )}
          </div>

          {/* CTA */}
          <Button onClick={onUpgrade} className="w-full mb-3">
            Fazer upgrade para {requiredPlan}
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              Continuar com plano {currentPlan}
            </button>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// Hook for feature gating
export function useFeatureAccess(requiredPlan: 'FREE' | 'PRO' | 'PREMIUM', currentPlan: 'FREE' | 'PRO' | 'PREMIUM') {
  const planHierarchy = { FREE: 0, PRO: 1, PREMIUM: 2 };
  return planHierarchy[currentPlan] >= planHierarchy[requiredPlan];
}

// HOC for protecting components
export function withPaywall<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPlan: 'PRO' | 'PREMIUM',
  featureName: string
) {
  return function PaywalledComponent(props: P & { currentPlan: 'FREE' | 'PRO' | 'PREMIUM'; onUpgrade: () => void }) {
    const hasAccess = useFeatureAccess(requiredPlan, props.currentPlan);

    if (!hasAccess) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center p-6">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300 font-medium">{featureName}</p>
              <p className="text-gray-500 text-sm mb-3">Disponível no plano {requiredPlan}</p>
              <Button size="sm" onClick={props.onUpgrade}>
                Fazer upgrade
              </Button>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">
            <WrappedComponent {...props} />
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Inline paywall message component
export function FeatureLockedMessage({ 
  feature, 
  plan, 
  onUpgrade 
}: { 
  feature: string; 
  plan: 'PRO' | 'PREMIUM'; 
  onUpgrade: () => void;
}) {
  return (
    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-cyan-400 font-medium">{feature}</p>
          <p className="text-gray-400 text-sm mt-1">
            Este recurso está disponível no plano {plan}.
          </p>
          <button 
            onClick={onUpgrade}
            className="text-cyan-400 text-sm font-medium hover:underline mt-2 inline-flex items-center gap-1"
          >
            Fazer upgrade <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
