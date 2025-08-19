import { useEffect, useRef, useState } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Message = { role: 'user' | 'model'; content: string };

export function BotChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hi! I am your Gemini assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { messages: [...messages, userMsg] });
      const text = (res.data?.text ?? '').toString();
      const botMsg: Message = { role: 'model', content: text || "I'm here!" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const botMsg: Message = { role: 'model', content: 'Sorry, I had trouble responding. Please try again.' };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-[480px] m-3 rounded-2xl border border-pink-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-500 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">Gemini Assistant</span>
          </div>
          <button className="opacity-90 hover:opacity-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-pink-50/40">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`px-3 py-2 rounded-2xl max-w-[80%] shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-secondary-foreground rounded-bl-md'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              disabled={loading}
            />
            <Button onClick={send} disabled={loading} className="bg-pink-600 hover:bg-pink-600/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


