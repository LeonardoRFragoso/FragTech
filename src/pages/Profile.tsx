import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Camera,
  Shield,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Usar dados do usuário autenticado
  const user = {
    name: profile?.full_name || 'Usuário',
    email: (profile as any)?.email || '',
    phone: (profile as any)?.phone || '',
    cpf: '***.***.***-**',
    birthDate: '',
    address: '',
    avatar: null,
    plan: (profile as any)?.plan || 'FREE',
    memberSince: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '',
    stats: {
      transactions: 0,
      savedMoney: 0,
      goalsCompleted: 0,
      aiQueries: 0,
    },
  };

  const menuItems = [
    { icon: Shield, label: 'Segurança', description: 'Senha, MFA, dispositivos', href: 'security' },
    { icon: Bell, label: 'Notificações', description: 'Preferências de alertas', href: 'notifications' },
    { icon: CreditCard, label: 'Assinatura', description: `Plano ${user.plan}`, href: 'subscription' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <Camera className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{user.name}</h1>
                  {user.plan !== 'FREE' && (
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {user.plan}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{user.email}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Membro desde {user.memberSince}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{user.stats.transactions}</p>
                <p className="text-xs text-gray-500">Transações</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  R$ {user.stats.savedMoney.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500">Economizado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{user.stats.goalsCompleted}</p>
                <p className="text-xs text-gray-500">Metas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{user.stats.aiQueries}</p>
                <p className="text-xs text-gray-500">Consultas IA</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dados pessoais</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Nome completo</p>
                  <p className="text-white">{user.name || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">E-mail</p>
                  <p className="text-white">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="text-white">{user.phone || 'Não informado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Data de nascimento</p>
                  <p className="text-white">{user.birthDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Localização</p>
                  <p className="text-white">{user.address}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => setIsEditing(false)} className="flex-1">
                  Salvar
                </Button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="divide-y divide-slate-700">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-gray-500 text-sm">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
              );
            })}
          </GlassCard>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button variant="outline" className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
