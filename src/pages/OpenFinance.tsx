import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Link2,
  RefreshCw,
  Plus,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Wallet,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Trash2,
  Settings,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard as Card } from '../components/ui/GlassCard';

interface ConnectedInstitution {
  id: string;
  name: string;
  logo: string;
  status: 'active' | 'syncing' | 'error';
  lastSync: string;
  accounts: number;
  totalBalance: number;
  consentExpires: string;
}

interface AggregatedAccount {
  id: string;
  institution: string;
  type: string;
  name: string;
  balance: number;
  currency: string;
}

const mockInstitutions: ConnectedInstitution[] = [
  {
    id: '1',
    name: 'Nubank',
    logo: '🟣',
    status: 'active',
    lastSync: '2024-01-15T14:30:00',
    accounts: 2,
    totalBalance: 5420.50,
    consentExpires: '2025-01-15',
  },
  {
    id: '2',
    name: 'Itaú',
    logo: '🟠',
    status: 'active',
    lastSync: '2024-01-15T13:00:00',
    accounts: 3,
    totalBalance: 12350.00,
    consentExpires: '2025-01-10',
  },
  {
    id: '3',
    name: 'Bradesco',
    logo: '🔴',
    status: 'syncing',
    lastSync: '2024-01-14T10:00:00',
    accounts: 1,
    totalBalance: 3200.00,
    consentExpires: '2024-12-20',
  },
];

const mockAccounts: AggregatedAccount[] = [
  { id: '1', institution: 'Nubank', type: 'Conta Corrente', name: 'Conta Principal', balance: 4520.50, currency: 'BRL' },
  { id: '2', institution: 'Nubank', type: 'Poupança', name: 'Reserva', balance: 900.00, currency: 'BRL' },
  { id: '3', institution: 'Itaú', type: 'Conta Corrente', name: 'Conta Salário', balance: 8350.00, currency: 'BRL' },
  { id: '4', institution: 'Itaú', type: 'Investimentos', name: 'CDB', balance: 3000.00, currency: 'BRL' },
  { id: '5', institution: 'Itaú', type: 'Investimentos', name: 'Tesouro Direto', balance: 1000.00, currency: 'BRL' },
  { id: '6', institution: 'Bradesco', type: 'Conta Corrente', name: 'Conta PJ', balance: 3200.00, currency: 'BRL' },
];

const availableInstitutions = [
  { code: 'ITAU', name: 'Itaú Unibanco', logo: '🟠' },
  { code: 'BRADESCO', name: 'Bradesco', logo: '🔴' },
  { code: 'NUBANK', name: 'Nubank', logo: '🟣' },
  { code: 'INTER', name: 'Banco Inter', logo: '🟧' },
  { code: 'BB', name: 'Banco do Brasil', logo: '🟡' },
  { code: 'SANTANDER', name: 'Santander', logo: '🔴' },
  { code: 'CAIXA', name: 'Caixa Econômica', logo: '🔵' },
  { code: 'C6', name: 'C6 Bank', logo: '⚫' },
];

export default function OpenFinance() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'connections' | 'overview'>('overview');

  const totalBalance = mockInstitutions.reduce((sum, inst) => sum + inst.totalBalance, 0);
  const totalAccounts = mockInstitutions.reduce((sum, inst) => sum + inst.accounts, 0);

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

  const getStatusBadge = (status: ConnectedInstitution['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Ativo
          </span>
        );
      case 'syncing':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Sincronizando
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Erro
          </span>
        );
    }
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Open Finance</h1>
                <p className="text-slate-400">Suas finanças em um só lugar</p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              onClick={() => setShowConnectModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Conectar Banco
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-400">Saldo Total</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              <p className="text-xs text-slate-500 mt-1">
                {mockInstitutions.length} instituições conectadas
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400">Contas</span>
              </div>
              <p className="text-2xl font-bold">{totalAccounts}</p>
              <p className="text-xs text-slate-500 mt-1">
                Contas sincronizadas
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400">Consentimentos</span>
              </div>
              <p className="text-2xl font-bold">{mockInstitutions.length}</p>
              <p className="text-xs text-slate-500 mt-1">
                Ativos e válidos
              </p>
            </Card>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeView === 'overview' ? 'default' : 'ghost'}
            className={activeView === 'overview' ? 'bg-emerald-500' : ''}
            onClick={() => setActiveView('overview')}
          >
            <PieChart className="w-4 h-4 mr-2" />
            Visão Geral
          </Button>
          <Button
            variant={activeView === 'connections' ? 'default' : 'ghost'}
            className={activeView === 'connections' ? 'bg-emerald-500' : ''}
            onClick={() => setActiveView('connections')}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Conexões
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {/* Overview View */}
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Accounts by Institution */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Saldo por Instituição
                </h2>
                <div className="space-y-4">
                  {mockInstitutions.map((inst) => (
                    <div key={inst.id} className="p-4 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{inst.logo}</span>
                          <div>
                            <p className="font-medium">{inst.name}</p>
                            <p className="text-xs text-slate-400">{inst.accounts} contas</p>
                          </div>
                        </div>
                        <p className="font-semibold">{formatCurrency(inst.totalBalance)}</p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                          style={{ width: `${(inst.totalBalance / totalBalance) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* All Accounts */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Todas as Contas
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {mockAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-slate-400">
                          {account.institution} • {account.type}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(account.balance)}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-slate-800/50 border-slate-700 p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    Transações Recentes (Todas as contas)
                  </h2>
                  <Button variant="ghost" size="sm">
                    Ver todas <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { id: '1', desc: 'Salário', amount: 5000, type: 'credit', date: '15 Jan', institution: 'Itaú' },
                    { id: '2', desc: 'Supermercado', amount: -450.50, type: 'debit', date: '14 Jan', institution: 'Nubank' },
                    { id: '3', desc: 'Netflix', amount: -55.90, type: 'debit', date: '13 Jan', institution: 'Nubank' },
                    { id: '4', desc: 'Freelance', amount: 1200, type: 'credit', date: '12 Jan', institution: 'Bradesco' },
                    { id: '5', desc: 'Uber', amount: -32.00, type: 'debit', date: '11 Jan', institution: 'Nubank' },
                  ].map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-900/50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            tx.type === 'credit' ? 'bg-green-500/20' : 'bg-slate-700'
                          }`}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.desc}</p>
                          <p className="text-xs text-slate-400">
                            {tx.date} • {tx.institution}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-semibold ${
                          tx.type === 'credit' ? 'text-green-400' : ''
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Connections View */}
          {activeView === 'connections' && (
            <motion.div
              key="connections"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-400" />
                  Instituições Conectadas
                </h2>

                <div className="space-y-4">
                  {mockInstitutions.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-4 bg-slate-900/50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{inst.logo}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-lg">{inst.name}</p>
                              {getStatusBadge(inst.status)}
                            </div>
                            <p className="text-sm text-slate-400">
                              {inst.accounts} contas • {formatCurrency(inst.totalBalance)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-slate-400">Última sincronização</p>
                          <p className="font-medium">{formatDate(inst.lastSync)}</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-slate-400">Consentimento expira</p>
                          <p className="font-medium">
                            {new Date(inst.consentExpires).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="text-slate-400">Dados compartilhados</p>
                          <p className="font-medium">Saldos, Transações</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-400 font-medium">Seus dados estão seguros</p>
                      <p className="text-sm text-slate-400">
                        Utilizamos o padrão Open Finance Brasil, regulamentado pelo Banco Central.
                        Você pode revogar o acesso a qualquer momento.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect Institution Modal */}
        <AnimatePresence>
          {showConnectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              onClick={() => setShowConnectModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold mb-2">Conectar Instituição</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Selecione um banco para conectar via Open Finance
                </p>

                <div className="space-y-2">
                  {availableInstitutions.map((inst) => (
                    <button
                      key={inst.code}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                        selectedInstitution === inst.code
                          ? 'bg-emerald-500/20 border border-emerald-500'
                          : 'bg-slate-900/50 hover:bg-slate-700'
                      }`}
                      onClick={() => setSelectedInstitution(inst.code)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{inst.logo}</span>
                        <span className="font-medium">{inst.name}</span>
                      </div>
                      {selectedInstitution === inst.code && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-2">
                    Ao continuar, você será redirecionado para o site da instituição
                    para autorizar o compartilhamento de dados.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-4 h-4" />
                    Conexão segura via Open Finance Brasil
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600"
                    onClick={() => setShowConnectModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                    disabled={!selectedInstitution}
                  >
                    Conectar
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
