import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Sparkles,
  Shield,
  Brain,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

interface Plan {
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  features: string[];
  notIncluded?: string[];
  icon: React.ElementType;
  gradient: string;
}

const plans: Plan[] = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Conta digital básica para começar sua jornada financeira',
    priceMonthly: 0,
    priceYearly: 0,
    icon: Zap,
    gradient: 'from-slate-500 to-slate-600',
    features: [
      'Conta digital gratuita',
      'Dashboard financeiro básico',
      '5 consultas à IA por dia',
      'PIX ilimitado',
      'Até 3 chaves PIX',
      '1 cartão virtual',
    ],
    notIncluded: [
      'Insights ilimitados',
      'Metas avançadas',
      'Automação financeira',
      'IA preditiva',
      'Open Finance completo',
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Para quem quer controle total das suas finanças',
    priceMonthly: 29.90,
    priceYearly: 299.00,
    popular: true,
    icon: Star,
    gradient: 'from-cyan-500 to-blue-500',
    features: [
      'Tudo do Free, mais:',
      'AI Copilot ilimitado',
      'Insights personalizados ilimitados',
      'Metas avançadas com IA',
      'Automação financeira',
      'Suporte prioritário',
      'Relatórios personalizados',
      'Até 5 contas Open Finance',
      'Exportação ilimitada',
    ],
    notIncluded: [
      'IA preditiva',
      'Crédito inteligente',
      'Benefícios exclusivos',
    ],
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    description: 'Experiência financeira completa com IA preditiva',
    priceMonthly: 79.90,
    priceYearly: 799.00,
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    features: [
      'Tudo do Pro, mais:',
      'IA preditiva avançada',
      'Análise comportamental',
      'Crédito inteligente',
      'Open Finance completo',
      'Benefícios exclusivos',
      'Concierge financeiro',
      'Cashback premium',
      'Acesso antecipado a novidades',
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentPlan] = useState('FREE');

  const handleSelectPlan = (planCode: string) => {
    setSelectedPlan(planCode);
  };

  const handleSubscribe = (planCode: string) => {
    console.log('Subscribe to:', planCode, isYearly ? 'yearly' : 'monthly');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Desbloqueie todo o potencial da sua vida financeira com a FragTech
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm ${!isYearly ? 'text-white' : 'text-gray-500'}`}>
              Mensal
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? 'bg-cyan-500' : 'bg-slate-600'
              }`}
            >
              <motion.div
                animate={{ x: isYearly ? 28 : 4 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full"
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-white' : 'text-gray-500'}`}>
              Anual
            </span>
            {isYearly && (
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                Economize até 17%
              </span>
            )}
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.code;
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;

            return (
              <motion.div
                key={plan.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}

                <GlassCard
                  className={`h-full p-6 ${
                    plan.popular
                      ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                      : 'border-slate-700/50'
                  } ${selectedPlan === plan.code ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-gray-400">R$</span>
                      <span className="text-4xl font-bold text-white">
                        {price === 0 ? '0' : price.toFixed(2).replace('.', ',')}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-400">/{isYearly ? 'ano' : 'mês'}</span>
                      )}
                    </div>
                    {isYearly && plan.priceMonthly > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        equivalente a R$ {(plan.priceYearly / 12).toFixed(2).replace('.', ',')}/mês
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded?.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 opacity-50">
                        <X className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                        <span className="text-gray-500 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handleSubscribe(plan.code)}
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full"
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Plano Atual'
                    ) : plan.priceMonthly === 0 ? (
                      'Começar Grátis'
                    ) : (
                      <>
                        Assinar {plan.name}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {plan.code === 'PRO' && !isCurrentPlan && (
                    <p className="text-center text-xs text-gray-500 mt-3">
                      14 dias de teste grátis
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Compare os planos
          </h2>

          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-gray-400 font-medium">Recurso</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Free</th>
                    <th className="text-center p-4 text-cyan-400 font-medium">Pro</th>
                    <th className="text-center p-4 text-amber-400 font-medium">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'AI Copilot', free: '5/dia', pro: 'Ilimitado', premium: 'Ilimitado' },
                    { feature: 'Insights financeiros', free: 'Básico', pro: 'Avançado', premium: 'Preditivo' },
                    { feature: 'Metas financeiras', free: '3', pro: 'Ilimitadas', premium: 'Ilimitadas' },
                    { feature: 'Contas Open Finance', free: '1', pro: '5', premium: 'Ilimitadas' },
                    { feature: 'Automação', free: false, pro: true, premium: true },
                    { feature: 'Relatórios', free: 'Básico', pro: 'Personalizado', premium: 'Avançado' },
                    { feature: 'Suporte', free: 'Email', pro: 'Prioritário', premium: 'Concierge' },
                    { feature: 'Crédito inteligente', free: false, pro: false, premium: true },
                    { feature: 'Cashback', free: false, pro: '0.5%', premium: '2%' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="p-4 text-gray-300">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />
                        ) : (
                          <span className="text-gray-400">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />
                        ) : (
                          <span className="text-cyan-400">{row.pro}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-600 mx-auto" />
                        ) : (
                          <span className="text-amber-400">{row.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Dúvidas frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-4xl mx-auto">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim! Você pode cancelar sua assinatura quando quiser, sem multas ou taxas.',
              },
              {
                q: 'O trial do Pro é realmente grátis?',
                a: 'Sim! 14 dias completos para testar todas as funcionalidades Pro sem cobrança.',
              },
              {
                q: 'Como funciona o upgrade/downgrade?',
                a: 'Você pode mudar de plano a qualquer momento. O valor é calculado proporcionalmente.',
              },
              {
                q: 'Meus dados estão seguros?',
                a: 'Absolutamente. Usamos criptografia de ponta e somos compliance com LGPD.',
              },
            ].map((faq, i) => (
              <GlassCard key={i} className="p-4">
                <h3 className="font-medium text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
