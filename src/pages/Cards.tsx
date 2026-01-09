import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Settings,
  Smartphone,
  Globe,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

interface Card {
  id: string;
  type: 'virtual' | 'physical';
  lastFour: string;
  brand: string;
  status: 'active' | 'blocked';
  limit: number;
  used: number;
  expiresAt: string;
  isContactless: boolean;
  isInternational: boolean;
}

// Estado vazio - em produção, buscar do backend
const mockCards: Card[] = [];

export default function Cards() {
  const [cards] = useState<Card[]>(mockCards);
  const [selectedCard, setSelectedCard] = useState<Card | null>(mockCards[0]);
  const [showNumber, setShowNumber] = useState(false);
  const [showNewCard, setShowNewCard] = useState(false);

  const toggleCardStatus = (cardId: string) => {
    console.log('Toggle card status:', cardId);
  };

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
            <h1 className="text-2xl font-bold text-white">Meus Cartões</h1>
            <p className="text-gray-400 text-sm">Gerencie seus cartões virtuais e físicos</p>
          </div>
          <Button onClick={() => setShowNewCard(true)}>
            <Plus className="w-4 h-4" />
            Novo Cartão
          </Button>
        </motion.div>

        {/* Cards Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => setSelectedCard(card)}
              className={`shrink-0 cursor-pointer transition-transform ${
                selectedCard?.id === card.id ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              <div
                className={`w-80 h-48 rounded-2xl p-6 relative overflow-hidden ${
                  card.type === 'virtual'
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800'
                } ${selectedCard?.id === card.id ? 'ring-2 ring-cyan-400' : ''}`}
              >
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Card Content */}
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/70 text-xs uppercase">
                        {card.type === 'virtual' ? 'Cartão Virtual' : 'Cartão Físico'}
                      </p>
                      <p className="text-white font-bold text-lg">FragTech</p>
                    </div>
                    {card.status === 'blocked' && (
                      <span className="bg-red-500/30 text-red-300 text-xs px-2 py-1 rounded-full">
                        Bloqueado
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-white/70 text-xs mb-1">Número do cartão</p>
                    <p className="text-white font-mono text-lg tracking-wider">
                      •••• •••• •••• {card.lastFour}
                    </p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/70 text-xs">Validade</p>
                      <p className="text-white font-medium">{card.expiresAt}</p>
                    </div>
                    <img
                      src={`https://raw.githubusercontent.com/aaronfagan/svg-credit-card-payment-icons/main/flat/${card.brand.toLowerCase()}.svg`}
                      alt={card.brand}
                      className="h-8 opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Selected Card Details */}
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Limit Usage */}
            <GlassCard className="p-5">
              <h3 className="text-gray-400 text-sm mb-4">Limite utilizado</h3>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-white">
                    R$ {selectedCard.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-gray-500 text-sm">
                    de R$ {selectedCard.limit.toLocaleString('pt-BR')}
                  </p>
                </div>
                <p className="text-cyan-400 font-bold">
                  {((selectedCard.used / selectedCard.limit) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(selectedCard.used / selectedCard.limit) * 100}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Disponível: R$ {(selectedCard.limit - selectedCard.used).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </GlassCard>

            {/* Card Actions */}
            <GlassCard className="p-5">
              <h3 className="text-gray-400 text-sm mb-4">Ações rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowNumber(!showNumber)}
                  className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {showNumber ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white text-sm">
                    {showNumber ? 'Ocultar' : 'Ver dados'}
                  </span>
                </button>

                <button
                  onClick={() => toggleCardStatus(selectedCard.id)}
                  className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {selectedCard.status === 'active' ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Unlock className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-white text-sm">
                    {selectedCard.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                  </span>
                </button>

                <button className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <Copy className="w-5 h-5 text-gray-400" />
                  <span className="text-white text-sm">Copiar</span>
                </button>

                <button className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-white text-sm">Configurar</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Card Settings */}
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-5">
              <h3 className="text-white font-semibold mb-4">Configurações do cartão</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Pagamento por aproximação</p>
                      <p className="text-gray-500 text-sm">Contactless (NFC)</p>
                    </div>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors ${
                      selectedCard.isContactless ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: selectedCard.isContactless ? 24 : 4 }}
                      className="w-5 h-5 bg-white rounded-full"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Compras internacionais</p>
                      <p className="text-gray-500 text-sm">Permitir uso no exterior</p>
                    </div>
                  </div>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors ${
                      selectedCard.isInternational ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <motion.div
                      animate={{ x: selectedCard.isInternational ? 24 : 4 }}
                      className="w-5 h-5 bg-white rounded-full"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Compras online</p>
                      <p className="text-gray-500 text-sm">E-commerce e apps</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-cyan-500 transition-colors">
                    <motion.div
                      animate={{ x: 24 }}
                      className="w-5 h-5 bg-white rounded-full"
                    />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* New Card Modal */}
        {showNewCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Novo Cartão Virtual</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Crie um cartão virtual para compras online com mais segurança.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white font-medium">Cartão Virtual Instantâneo</p>
                        <p className="text-gray-400 text-sm">
                          Seu novo cartão estará disponível imediatamente após a criação.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-800 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Limite disponível</p>
                    <p className="text-2xl font-bold text-white">R$ 5.000,00</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" onClick={() => setShowNewCard(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button className="flex-1">
                    <CreditCard className="w-4 h-4" />
                    Criar Cartão
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
