import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  PiggyBank,
  Target,
  ChevronRight,
  Mic,
  Paperclip,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: TrendingUp, text: 'Como posso economizar mais este mês?' },
  { icon: PiggyBank, text: 'Analise meus gastos da última semana' },
  { icon: Target, text: 'Crie um plano para atingir minha meta' },
  { icon: Lightbulb, text: 'Dicas para investir meu dinheiro' },
];

// Mensagem inicial sem dados mockados
const WELCOME_MESSAGE = 'Olá! Sou o FragCopilot, seu assistente financeiro pessoal. Quando você tiver transações e dados financeiros cadastrados, poderei analisar seus gastos, criar planos de economia e dar dicas personalizadas. Comece adicionando suas primeiras transações!';

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage: string): string => {
    // Em produção, enviar para o backend e receber resposta da IA
    // Por enquanto, retorna mensagem informativa
    return `Para responder sua pergunta sobre "${userMessage}", preciso acessar seus dados financeiros. Cadastre suas primeiras transações para que eu possa analisar seu perfil e dar recomendações personalizadas!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getResponse(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">FragCopilot</h1>
            <p className="text-gray-500 text-xs">Seu assistente financeiro com IA</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                    message.role === 'assistant'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-slate-700'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'assistant'
                      ? 'bg-slate-800/50 rounded-tl-sm'
                      : 'bg-cyan-500/20 rounded-tr-sm'
                  }`}
                >
                  <p className="text-gray-200 text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/50 rounded-2xl rounded-tl-sm p-4">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-slate-800">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-500 text-sm mb-3">Sugestões para começar:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedQuestions.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(q.text)}
                    className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{q.text}</span>
                    <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo sobre suas finanças..."
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-300 transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-xs mt-2 text-center">
            FragCopilot pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
