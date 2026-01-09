import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Send,
  Download,
  Key,
  History,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Mail,
  User,
  Shuffle,
  Trash2,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard as Card } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

type PixKeyType = 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
type TabType = 'send' | 'receive' | 'keys' | 'history';

interface PixKey {
  id: string;
  type: PixKeyType;
  key: string;
  isPrimary: boolean;
  createdAt: string;
}

interface PixTransaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  description: string;
  counterparty: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

const mockKeys: PixKey[] = [
  { id: '1', type: 'CPF', key: '***.***.789-00', isPrimary: true, createdAt: '2024-01-10' },
  { id: '2', type: 'EMAIL', key: 'us***@email.com', isPrimary: false, createdAt: '2024-01-15' },
  { id: '3', type: 'RANDOM', key: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', isPrimary: false, createdAt: '2024-02-01' },
];

const mockTransactions: PixTransaction[] = [
  { id: '1', type: 'sent', amount: 150.00, description: 'Almoço', counterparty: 'João Silva', status: 'completed', date: '2024-01-15T14:30:00' },
  { id: '2', type: 'received', amount: 500.00, description: 'Freelance', counterparty: 'Empresa XYZ', status: 'completed', date: '2024-01-14T10:00:00' },
  { id: '3', type: 'sent', amount: 89.90, description: 'Internet', counterparty: 'Provedor Net', status: 'completed', date: '2024-01-13T08:00:00' },
  { id: '4', type: 'received', amount: 1200.00, description: 'Salário', counterparty: 'Empresa ABC', status: 'pending', date: '2024-01-12T16:00:00' },
  { id: '5', type: 'sent', amount: 45.00, description: 'Uber', counterparty: 'Uber Brasil', status: 'failed', date: '2024-01-11T22:30:00' },
];

export default function Pix() {
  const [activeTab, setActiveTab] = useState<TabType>('send');
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyType, setNewKeyType] = useState<PixKeyType>('CPF');
  const [newKeyValue, setNewKeyValue] = useState('');

  const tabs = [
    { id: 'send' as TabType, label: 'Enviar', icon: Send },
    { id: 'receive' as TabType, label: 'Receber', icon: Download },
    { id: 'keys' as TabType, label: 'Minhas Chaves', icon: Key },
    { id: 'history' as TabType, label: 'Histórico', icon: History },
  ];

  const keyTypeIcons = {
    CPF: User,
    EMAIL: Mail,
    PHONE: Smartphone,
    RANDOM: Shuffle,
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendPix = () => {
    console.log('Sending PIX:', { pixKey, amount, description });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">PIX</h1>
              <p className="text-slate-400">Transferências instantâneas 24/7</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={`flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Send PIX */}
          {activeTab === 'send' && (
            <motion.div
              key="send"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-cyan-400" />
                  Enviar PIX
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Chave PIX do destinatário
                    </label>
                    <Input
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="bg-slate-900/50 border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Valor
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        R$
                      </span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-slate-900/50 border-slate-600 pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Descrição (opcional)
                    </label>
                    <Input
                      placeholder="Ex: Almoço, Aluguel..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-slate-900/50 border-slate-600"
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    onClick={handleSendPix}
                    disabled={!pixKey || !amount}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar PIX
                  </Button>
                </div>
              </Card>

              {/* Limits Card */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  Seus Limites
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Limite por transação</span>
                      <span className="font-semibold">R$ 2.000,00</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Limite diário</span>
                      <span className="font-semibold">R$ 5.000,00</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">R$ 1.500,00 utilizados hoje</p>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Limite noturno (20h-6h)</span>
                      <span className="font-semibold">R$ 1.000,00</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <Clock className="w-3 h-3" />
                      Limite reduzido para sua segurança
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                    Solicitar aumento de limite
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Receive PIX */}
          {activeTab === 'receive' && (
            <motion.div
              key="receive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-cyan-400" />
                  QR Code PIX
                </h2>

                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 bg-white rounded-xl p-4 mb-4">
                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 rounded flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-slate-600" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    Escaneie o QR Code para receber PIX
                  </p>

                  <div className="w-full space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Valor (opcional)
                      </label>
                      <Input
                        type="number"
                        placeholder="0,00"
                        className="bg-slate-900/50 border-slate-600"
                      />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500">
                      Gerar QR Code com valor
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  Compartilhar Chave
                </h2>

                <div className="space-y-3">
                  {mockKeys.map((key) => {
                    const Icon = keyTypeIcons[key.type];
                    return (
                      <div
                        key={key.id}
                        className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-800 rounded-lg">
                            <Icon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="font-medium">{key.type}</p>
                            <p className="text-sm text-slate-400">{key.key}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(key.key)}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {/* PIX Keys */}
          {activeTab === 'keys' && (
            <motion.div
              key="keys"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    Minhas Chaves PIX
                  </h2>
                  <Button
                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
                    onClick={() => setShowNewKeyModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Chave
                  </Button>
                </div>

                <div className="space-y-3">
                  {mockKeys.map((key) => {
                    const Icon = keyTypeIcons[key.type];
                    return (
                      <div
                        key={key.id}
                        className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-800 rounded-xl">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{key.type}</p>
                              {key.isPrimary && (
                                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                                  Principal
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{key.key}</p>
                            <p className="text-xs text-slate-500">
                              Cadastrada em {new Date(key.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-medium">Limite de chaves</p>
                      <p className="text-sm text-slate-400">
                        Você pode cadastrar até 5 chaves PIX por conta. Atualmente você tem {mockKeys.length} chave(s) cadastrada(s).
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Transaction History */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  Histórico de Transações PIX
                </h2>

                <div className="space-y-3">
                  {mockTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between hover:bg-slate-900/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${
                            tx.type === 'received'
                              ? 'bg-green-500/20'
                              : 'bg-red-500/20'
                          }`}
                        >
                          {tx.type === 'received' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.counterparty}</p>
                          <p className="text-sm text-slate-400">{tx.description}</p>
                          <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.type === 'received' ? 'text-green-400' : 'text-white'
                          }`}
                        >
                          {tx.type === 'received' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            tx.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.status === 'completed'
                            ? 'Concluído'
                            : tx.status === 'pending'
                            ? 'Pendente'
                            : 'Falhou'}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4 border-slate-600">
                  Ver todas as transações
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Key Modal */}
        <AnimatePresence>
          {showNewKeyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNewKeyModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-4">Cadastrar Nova Chave PIX</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Tipo de Chave
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['CPF', 'EMAIL', 'PHONE', 'RANDOM'] as PixKeyType[]).map((type) => {
                        const Icon = keyTypeIcons[type];
                        return (
                          <button
                            key={type}
                            className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${
                              newKeyType === type
                                ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            onClick={() => setNewKeyType(type)}
                          >
                            <Icon className="w-4 h-4" />
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {newKeyType !== 'RANDOM' && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        {newKeyType === 'CPF'
                          ? 'CPF'
                          : newKeyType === 'EMAIL'
                          ? 'E-mail'
                          : 'Telefone'}
                      </label>
                      <Input
                        placeholder={
                          newKeyType === 'CPF'
                            ? '000.000.000-00'
                            : newKeyType === 'EMAIL'
                            ? 'seu@email.com'
                            : '+55 11 99999-9999'
                        }
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        className="bg-slate-900/50 border-slate-600"
                      />
                    </div>
                  )}

                  {newKeyType === 'RANDOM' && (
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-sm text-slate-400">
                        Uma chave aleatória será gerada automaticamente. Essa chave é útil para manter seus dados pessoais privados.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600"
                      onClick={() => setShowNewKeyModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500">
                      Cadastrar Chave
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
