import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Brain,
  CreditCard,
  Shield,
  TrendingUp,
  Smartphone,
  ArrowRight,
  Check,
  Sparkles,
  PieChart,
  Target,
  Bell,
  ChevronRight,
  Star,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
  onGetStarted: () => void;
}

export function Landing({ onGetStarted }: LandingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { t, translations } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: t('landing.features.aiInsights.title'),
      description: t('landing.features.aiInsights.description'),
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: CreditCard,
      title: t('landing.features.cards.title'),
      description: t('landing.features.cards.description'),
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: t('landing.features.security.title'),
      description: t('landing.features.security.description'),
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: TrendingUp,
      title: t('landing.features.investments.title'),
      description: t('landing.features.investments.description'),
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Smartphone,
      title: t('landing.features.mobile.title'),
      description: t('landing.features.mobile.description'),
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      icon: PieChart,
      title: t('landing.features.categorization.title'),
      description: t('landing.features.categorization.description'),
      gradient: 'from-teal-500 to-cyan-500',
    },
  ];

  const plans = [
    {
      name: t('landing.pricing.plans.basic.name'),
      price: billingCycle === 'monthly' ? 0 : 0,
      description: t('landing.pricing.plans.basic.description'),
      features: translations.landing.pricing.plans.basic.features,
      cta: t('landing.pricing.plans.basic.cta'),
      popular: false,
    },
    {
      name: t('landing.pricing.plans.pro.name'),
      price: billingCycle === 'monthly' ? 29.90 : 299,
      description: t('landing.pricing.plans.pro.description'),
      features: translations.landing.pricing.plans.pro.features,
      cta: t('landing.pricing.plans.pro.cta'),
      popular: true,
      popularLabel: t('landing.pricing.plans.pro.popular'),
    },
    {
      name: t('landing.pricing.plans.premium.name'),
      price: billingCycle === 'monthly' ? 59.90 : 599,
      description: t('landing.pricing.plans.premium.description'),
      features: translations.landing.pricing.plans.premium.features,
      cta: t('landing.pricing.plans.premium.cta'),
      popular: false,
    },
  ];

  const testimonials = translations.landing.testimonials.items.map((item) => ({
    ...item,
    avatar: item.name.split(' ').map(n => n[0]).join(''),
  }));

  const stats = [
    { value: '500K+', label: t('landing.stats.users') },
    { value: 'R$2B+', label: t('landing.stats.transactions') },
    { value: '4.9', label: t('landing.stats.rating') },
    { value: '99.9%', label: t('landing.stats.uptime') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">FragTech</h1>
              </div>
              
              <nav className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-400 hover:text-white transition-colors">{t('nav.features')}</a>
                <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">{t('nav.pricing')}</a>
                <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">{t('nav.testimonials')}</a>
              </nav>

              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <button 
                  onClick={onGetStarted}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('common.signIn')}
                </button>
                <Button onClick={onGetStarted}>
                  {t('common.getStarted')} <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm font-medium">{t('landing.badge')}</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              >
                {t('landing.heroTitle')}{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {t('landing.heroTitleHighlight')}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
              >
                {t('landing.heroDescription')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button size="lg" onClick={onGetStarted}>
                  {t('common.startForFree')} <ArrowRight size={20} />
                </Button>
                <Button size="lg" variant="secondary">
                  {t('common.watchDemo')}
                </Button>
              </motion.div>
            </div>

            {/* Hero Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-20 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none" />
              <GlassCard className="p-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{t('dashboard.availableBalance')}</p>
                    <h2 className="text-4xl font-bold text-white font-mono">R$ 12,847.50</h2>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">+15.3% {t('dashboard.thisMonth').toLowerCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: Zap, label: t('dashboard.quickActions.pix'), color: 'from-cyan-500 to-blue-500' },
                    { icon: CreditCard, label: t('dashboard.quickActions.pay'), color: 'from-purple-500 to-pink-500' },
                    { icon: Target, label: t('dashboard.quickActions.cards'), color: 'from-orange-500 to-red-500' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className={`p-4 rounded-xl bg-gradient-to-r ${action.color} flex flex-col items-center gap-2 text-white font-medium hover:opacity-90 transition-opacity`}
                    >
                      <action.icon size={24} />
                      <span className="text-sm">{action.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{t('landing.aiCopilot.insight')}</p>
                    <p className="text-gray-400 text-sm">{t('landing.aiCopilot.sampleInsight')}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('landing.features.title')}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                {t('landing.features.description')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="p-6 h-full hover:border-cyan-500/50 transition-colors group">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Copilot Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm font-medium">{t('landing.aiCopilot.badge')}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  {t('landing.aiCopilot.title')}
                </h2>
                <p className="text-xl text-gray-400 mb-8">
                  {t('landing.aiCopilot.description')}
                </p>
                <ul className="space-y-4">
                  {translations.landing.aiCopilot.features.map((item: string) => (
                    <li key={item} className="flex items-center gap-3 text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{t('landing.aiCopilot.badge')}</h3>
                      <div className="flex items-center gap-2 text-xs text-cyan-400">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        {t('landing.aiCopilot.active')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-cyan-400 font-medium">{t('landing.aiCopilot.insight')}</span>
                      </div>
                      <p className="text-white text-sm">
                        {t('landing.aiCopilot.sampleInsight')}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-2xl ml-8">
                      <p className="text-white text-sm">{t('landing.aiCopilot.sampleQuestion')}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-cyan-400 font-medium">{t('landing.aiCopilot.insight')}</span>
                      </div>
                      <p className="text-white text-sm mb-3">
                        {t('landing.aiCopilot.sampleResponse')}
                      </p>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-400" />
                          {t('landing.aiCopilot.opportunity1')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-purple-400" />
                          {t('landing.aiCopilot.opportunity2')}
                        </li>
                        <li className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-pink-400" />
                          {t('landing.aiCopilot.opportunity3')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('landing.pricing.title')}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                {t('landing.pricing.description')}
              </p>

              <div className="inline-flex items-center p-1 bg-white/5 rounded-lg border border-white/10">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('landing.pricing.monthly')}
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('landing.pricing.yearly')} <span className="text-xs text-cyan-400 ml-1">{t('landing.pricing.yearlyDiscount')}</span>
                </button>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className={`p-8 h-full relative ${plan.popular ? 'border-cyan-500' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-xs font-medium text-white">
                        {(plan as any).popularLabel || t('landing.pricing.plans.pro.popular')}
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-white">
                        {plan.price === 0 ? t('landing.pricing.free') : `R$ ${plan.price.toFixed(2)}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-400 text-sm">{billingCycle === 'monthly' ? t('landing.pricing.perMonth') : t('landing.pricing.perYear')}</span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-gray-300 text-sm">
                          <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'primary' : 'secondary'}
                      onClick={onGetStarted}
                    >
                      {plan.cta}
                    </Button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 md:py-32 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {t('landing.testimonials.title')}
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                {t('landing.testimonials.description')}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6">{testimonial.content}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="text-white font-medium">{testimonial.name}</div>
                        <div className="text-gray-400 text-sm">{testimonial.role}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-12 md:p-20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {t('landing.cta.title')}
                  </h2>
                  <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                    {t('landing.cta.description')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={onGetStarted}>
                      {t('common.startForFree')} <ArrowRight size={20} />
                    </Button>
                    <Button size="lg" variant="secondary">
                      {t('common.contactSales')}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">FragTech</span>
              </div>
              <div className="text-gray-400 text-sm">
                {t('landing.footer.copyright')}
              </div>
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">{t('nav.privacy')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('nav.terms')}</a>
                <a href="#" className="hover:text-white transition-colors">{t('nav.security')}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
