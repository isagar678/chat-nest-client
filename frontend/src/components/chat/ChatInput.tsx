import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  className?: string;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  className, 
  placeholder = "Type a message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("p-4 border-t border-border bg-background", className)}>
      <div className="flex items-end gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[44px] max-h-32 resize-none pr-20 py-3"
            rows={1}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSend}
          disabled={!message.trim()}
          className="h-10 w-10 p-0 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}