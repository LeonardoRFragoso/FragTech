import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Sparkles, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { mockInsights } from '../../lib/mockData';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI financial copilot. I've analyzed your spending patterns and found some opportunities to optimize your finances. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { icon: TrendingUp, label: 'Analyze spending', action: 'analyze' },
    { icon: Target, label: 'Set goal', action: 'goal' },
    { icon: AlertCircle, label: 'View alerts', action: 'alerts' },
  ];

  const handleQuickAction = (action: string) => {
    const responses: Record<string, string> = {
      analyze: "Based on your last 30 days, you spent R$ 1,245 on essentials and R$ 680 on non-essentials. Your top spending category is food (R$ 450). I recommend setting a monthly budget of R$ 400 for dining out to save R$ 50/month.",
      goal: "Great! Let's create a financial goal. Based on your income and current spending, you could save R$ 500/month comfortably. Would you like to save for an emergency fund, a vacation, or start investing?",
      alerts: "You have 3 active insights: 1) You can save R$ 420/month by optimizing spending. 2) Your spending decreased 15% this month - great job! 3) You have R$ 500 available for low-risk investments.",
    };

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: quickActions.find(a => a.action === action)?.label || '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responses[action],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I understand you're interested in that. Based on your financial profile and current data, I can help you make an informed decision. Would you like me to provide a detailed analysis?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <GlassCard className="flex flex-col h-[600px]">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Copilot</h3>
            <div className="flex items-center gap-2 text-xs text-cyan-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Active
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] p-4 rounded-2xl
                  ${message.type === 'ai'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }
                `}
              >
                {message.type === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">AI Insight</span>
                  </div>
                )}
                <p className="text-white text-sm leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/10 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.action}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickAction(action.action)}
                className="whitespace-nowrap"
              >
                <Icon size={16} />
                {action.label}
              </Button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything about your finances..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send size={20} />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
