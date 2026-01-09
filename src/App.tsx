import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LanguageSwitcher } from './components/ui/LanguageSwitcher';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import Pix from './pages/Pix';
import OpenFinance from './pages/OpenFinance';
import Security from './pages/Security';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Transactions from './pages/Transactions';
import Goals from './pages/Goals';
import Cards from './pages/Cards';
import AIAssistant from './pages/AIAssistant';
import AdminDashboard from './pages/AdminDashboard';

type AppView = 'landing' | 'login' | 'signup' | 'app';
type AppPage = 'dashboard' | 'pix' | 'open-finance' | 'security' | 'pricing' | 'profile' | 'transactions' | 'goals' | 'cards' | 'ai' | 'admin';

function AppContent() {
  const [view, setView] = useState<AppView>('landing');
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (!profile?.onboarding_completed) {
      return <Onboarding />;
    }
    
    // Render app with navigation
    const renderPage = () => {
      switch (currentPage) {
        case 'pix':
          return <Pix />;
        case 'open-finance':
          return <OpenFinance />;
        case 'security':
          return <Security />;
        case 'pricing':
          return <Pricing />;
        case 'profile':
          return <Profile />;
        case 'transactions':
          return <Transactions />;
        case 'goals':
          return <Goals />;
        case 'cards':
          return <Cards />;
        case 'ai':
          return <AIAssistant />;
        case 'admin':
          return <AdminDashboard />;
        default:
          return <Dashboard />;
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-around md:justify-between py-2 md:py-3">
              {/* Logo - visible on desktop */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xl font-bold text-white">FragTech</span>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex items-center justify-around md:justify-center md:gap-4 flex-1">
              <NavButton 
                active={currentPage === 'dashboard'} 
                onClick={() => setCurrentPage('dashboard')}
                icon="🏠"
                label="Home"
              />
              <NavButton 
                active={currentPage === 'transactions'} 
                onClick={() => setCurrentPage('transactions')}
                icon="📊"
                label="Transações"
              />
              <NavButton 
                active={currentPage === 'pix'} 
                onClick={() => setCurrentPage('pix')}
                icon="⚡"
                label="PIX"
              />
              <NavButton 
                active={currentPage === 'ai'} 
                onClick={() => setCurrentPage('ai')}
                icon="🤖"
                label="IA"
              />
              <NavButton 
                active={currentPage === 'cards'} 
                onClick={() => setCurrentPage('cards')}
                icon="💳"
                label="Cartões"
              />
              <NavButton 
                active={currentPage === 'goals'} 
                onClick={() => setCurrentPage('goals')}
                icon="🎯"
                label="Metas"
              />
              <NavButton 
                active={currentPage === 'profile'} 
                onClick={() => setCurrentPage('profile')}
                icon="👤"
                label="Perfil"
              />
              </div>
              
              {/* Language Switcher - visible on desktop */}
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </nav>
        
        {/* Page Content */}
        <div className="pb-20 md:pb-0 md:pt-16">
          {renderPage()}
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return <Landing onGetStarted={() => setView('signup')} />;
  }

  if (view === 'login') {
    return <Login onSwitchToSignup={() => setView('signup')} />;
  }

  return <SignUp onSwitchToLogin={() => setView('login')} />;
}

function NavButton({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
        active 
          ? 'text-cyan-400 bg-cyan-500/10' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-medium hidden md:block">{label}</span>
    </button>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
