import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Smartphone,
  Key,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Monitor,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Bell,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard as Card } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  lastUsed: string;
  location: string;
  trustLevel: 'trusted' | 'unknown' | 'suspicious';
  isCurrent: boolean;
}

interface SecurityAlert {
  id: string;
  type: 'login' | 'transaction' | 'device' | 'password';
  message: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    type: 'mobile',
    browser: 'Safari',
    lastUsed: '2024-01-15T14:30:00',
    location: 'São Paulo, BR',
    trustLevel: 'trusted',
    isCurrent: true,
  },
  {
    id: '2',
    name: 'MacBook Pro',
    type: 'desktop',
    browser: 'Chrome',
    lastUsed: '2024-01-15T10:00:00',
    location: 'São Paulo, BR',
    trustLevel: 'trusted',
    isCurrent: false,
  },
  {
    id: '3',
    name: 'Windows PC',
    type: 'desktop',
    browser: 'Firefox',
    lastUsed: '2024-01-10T18:00:00',
    location: 'Rio de Janeiro, BR',
    trustLevel: 'unknown',
    isCurrent: false,
  },
];

const mockAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'login',
    message: 'Novo login detectado em São Paulo',
    date: '2024-01-15T14:30:00',
    severity: 'low',
    resolved: true,
  },
  {
    id: '2',
    type: 'transaction',
    message: 'Transação PIX de alto valor (R$ 2.500)',
    date: '2024-01-14T16:00:00',
    severity: 'medium',
    resolved: true,
  },
  {
    id: '3',
    type: 'device',
    message: 'Novo dispositivo conectado à sua conta',
    date: '2024-01-10T18:00:00',
    severity: 'medium',
    resolved: false,
  },
];

type TabType = 'overview' | 'mfa' | 'devices' | 'alerts' | 'privacy';

export default function Security() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const backupCodes = [
    'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 'Q7R8S9T0',
    'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2', 'G3H4I5J6', 'K7L8M9N0',
  ];

  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: Shield },
    { id: 'mfa' as TabType, label: 'Autenticação 2FA', icon: Key },
    { id: 'devices' as TabType, label: 'Dispositivos', icon: Smartphone },
    { id: 'alerts' as TabType, label: 'Alertas', icon: Bell },
    { id: 'privacy' as TabType, label: 'Privacidade', icon: FileText },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'desktop': return Monitor;
      case 'tablet': return Monitor;
    }
  };

  const getTrustBadge = (level: Device['trustLevel']) => {
    switch (level) {
      case 'trusted':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Confiável
          </span>
        );
      case 'unknown':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            <Clock className="w-3 h-3" />
            Desconhecido
          </span>
        );
      case 'suspicious':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Suspeito
          </span>
        );
    }
  };

  const securityScore = 75;

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
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Segurança</h1>
              <p className="text-slate-400">Gerencie a segurança da sua conta</p>
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
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Overview */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Security Score */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Score de Segurança</h2>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-slate-700"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${securityScore * 4.4} 440`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold">{securityScore}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Autenticação 2FA</span>
                    <span className={mfaEnabled ? 'text-green-400' : 'text-amber-400'}>
                      {mfaEnabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Dispositivos confiáveis</span>
                    <span className="text-green-400">2 dispositivos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400">Última verificação</span>
                    <span className="text-slate-300">Hoje</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6">Ações Rápidas</h2>
                <div className="space-y-3">
                  <button
                    className="w-full p-4 bg-slate-900/50 rounded-lg flex items-center justify-between hover:bg-slate-900/70 transition-colors"
                    onClick={() => setActiveTab('mfa')}
                  >
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="font-medium">Configurar 2FA</p>
                        <p className="text-sm text-slate-400">
                          {mfaEnabled ? 'Gerenciar autenticação' : 'Adicione uma camada extra de segurança'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>

                  <button
                    className="w-full p-4 bg-slate-900/50 rounded-lg flex items-center justify-between hover:bg-slate-900/70 transition-colors"
                    onClick={() => setActiveTab('devices')}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="font-medium">Gerenciar Dispositivos</p>
                        <p className="text-sm text-slate-400">
                          {mockDevices.length} dispositivos conectados
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>

                  <button className="w-full p-4 bg-slate-900/50 rounded-lg flex items-center justify-between hover:bg-slate-900/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="font-medium">Alterar Senha</p>
                        <p className="text-sm text-slate-400">Última alteração há 30 dias</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>

                  <button
                    className="w-full p-4 bg-slate-900/50 rounded-lg flex items-center justify-between hover:bg-slate-900/70 transition-colors"
                    onClick={() => setActiveTab('alerts')}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-purple-400" />
                      <div className="text-left">
                        <p className="font-medium">Alertas de Segurança</p>
                        <p className="text-sm text-slate-400">
                          {mockAlerts.filter(a => !a.resolved).length} alertas pendentes
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-slate-800/50 border-slate-700 p-6 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
                <div className="space-y-3">
                  {mockAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            alert.severity === 'high'
                              ? 'bg-red-500/20'
                              : alert.severity === 'medium'
                              ? 'bg-amber-500/20'
                              : 'bg-green-500/20'
                          }`}
                        >
                          <AlertTriangle
                            className={`w-4 h-4 ${
                              alert.severity === 'high'
                                ? 'text-red-400'
                                : alert.severity === 'medium'
                                ? 'text-amber-400'
                                : 'text-green-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-slate-400">{formatDate(alert.date)}</p>
                        </div>
                      </div>
                      {alert.resolved ? (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          Resolvido
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" className="border-slate-600">
                          Verificar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* MFA Setup */}
          {activeTab === 'mfa' && (
            <motion.div
              key="mfa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Autenticação em Dois Fatores (2FA)
                </h2>

                {!mfaEnabled ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-400 font-medium">2FA não está ativo</p>
                          <p className="text-sm text-slate-400">
                            Ative a autenticação em dois fatores para proteger sua conta contra acessos não autorizados.
                          </p>
                        </div>
                      </div>
                    </div>

                    {!showMfaSetup ? (
                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                        onClick={() => setShowMfaSetup(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Configurar 2FA
                      </Button>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center">
                          <p className="text-slate-400 mb-4">
                            Escaneie o QR Code com seu app autenticador
                          </p>
                          <div className="w-48 h-48 bg-white rounded-xl p-4 mx-auto mb-4">
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 rounded flex items-center justify-center">
                              <Key className="w-16 h-16 text-slate-600" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500">
                            Ou insira o código manualmente: XXXX-XXXX-XXXX-XXXX
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-400 mb-2">
                            Código de verificação
                          </label>
                          <Input
                            placeholder="000000"
                            value={mfaCode}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMfaCode(e.target.value)}
                            className="bg-slate-900/50 border-slate-600 text-center text-2xl tracking-widest"
                            maxLength={6}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-slate-600"
                            onClick={() => setShowMfaSetup(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                            onClick={() => {
                              setMfaEnabled(true);
                              setShowMfaSetup(false);
                              setShowBackupCodes(true);
                            }}
                            disabled={mfaCode.length !== 6}
                          >
                            Ativar 2FA
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-400 font-medium">2FA está ativo</p>
                          <p className="text-sm text-slate-400">
                            Sua conta está protegida com autenticação em dois fatores.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full border-slate-600"
                        onClick={() => setShowBackupCodes(!showBackupCodes)}
                      >
                        {showBackupCodes ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showBackupCodes ? 'Ocultar' : 'Ver'} Códigos de Backup
                      </Button>

                      <AnimatePresence>
                        {showBackupCodes && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-slate-900/50 rounded-lg"
                          >
                            <p className="text-sm text-slate-400 mb-3">
                              Guarde esses códigos em um lugar seguro. Cada código só pode ser usado uma vez.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {backupCodes.map((code, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-slate-800 rounded font-mono text-sm text-center"
                                >
                                  {code}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 border-slate-600">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Gerar novos
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setMfaEnabled(false)}
                      >
                        Desativar 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Devices */}
          {activeTab === 'devices' && (
            <motion.div
              key="devices"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  Dispositivos Conectados
                </h2>

                <div className="space-y-4">
                  {mockDevices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <div
                        key={device.id}
                        className={`p-4 rounded-xl ${
                          device.isCurrent
                            ? 'bg-purple-500/10 border border-purple-500/30'
                            : 'bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-800 rounded-xl">
                              <DeviceIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{device.name}</p>
                                {device.isCurrent && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                                    Este dispositivo
                                  </span>
                                )}
                                {getTrustBadge(device.trustLevel)}
                              </div>
                              <p className="text-sm text-slate-400">
                                {device.browser} • {device.location}
                              </p>
                              <p className="text-xs text-slate-500">
                                Último acesso: {formatDate(device.lastUsed)}
                              </p>
                            </div>
                          </div>
                          {!device.isCurrent && (
                            <div className="flex items-center gap-2">
                              {device.trustLevel !== 'trusted' && (
                                <Button size="sm" variant="outline" className="border-slate-600">
                                  Confiar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Desconectar todos os outros dispositivos
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Alerts */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Alertas de Segurança
                </h2>

                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-slate-900/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              alert.severity === 'high'
                                ? 'bg-red-500/20'
                                : alert.severity === 'medium'
                                ? 'bg-amber-500/20'
                                : 'bg-green-500/20'
                            }`}
                          >
                            <AlertTriangle
                              className={`w-4 h-4 ${
                                alert.severity === 'high'
                                  ? 'text-red-400'
                                  : alert.severity === 'medium'
                                  ? 'text-amber-400'
                                  : 'text-green-400'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-slate-400">{formatDate(alert.date)}</p>
                          </div>
                        </div>
                        {alert.resolved ? (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            Resolvido
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-purple-500">
                              Verificar
                            </Button>
                            <Button size="sm" variant="ghost">
                              Ignorar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Privacy */}
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Privacidade e Consentimentos
                </h2>

                <div className="space-y-4">
                  {[
                    { id: 'data', label: 'Processamento de Dados', desc: 'Necessário para uso da plataforma', required: true, enabled: true },
                    { id: 'marketing', label: 'Comunicações de Marketing', desc: 'Receba novidades e ofertas', required: false, enabled: true },
                    { id: 'analytics', label: 'Análise de Uso', desc: 'Ajude-nos a melhorar a plataforma', required: false, enabled: true },
                    { id: 'ai', label: 'Personalização por IA', desc: 'Insights personalizados com IA', required: false, enabled: false },
                    { id: 'sharing', label: 'Compartilhamento com Terceiros', desc: 'Parceiros selecionados', required: false, enabled: false },
                  ].map((consent) => (
                    <div
                      key={consent.id}
                      className="p-4 bg-slate-900/50 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{consent.label}</p>
                          {consent.required && (
                            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{consent.desc}</p>
                      </div>
                      <button
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          consent.enabled ? 'bg-purple-500' : 'bg-slate-600'
                        } ${consent.required ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={consent.required}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                            consent.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <Button variant="outline" className="w-full border-slate-600">
                    Exportar meus dados
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Solicitar exclusão de dados
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
