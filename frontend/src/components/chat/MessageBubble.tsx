import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isSent: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({ message, showAvatar = true, className }: MessageBubbleProps) {
  const { content, timestamp, sender, isSent, isRead, isDelivered } = message;

  return (
    <div className={cn(
      "flex gap-3 max-w-[70%]",
      isSent ? "ml-auto flex-row-reverse" : "",
      className
    )}>
      {showAvatar && !isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            {sender.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col gap-1",
        isSent ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl max-w-full break-words",
          isSent 
            ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md" 
            : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md"
        )}>
          <p className="text-sm leading-relaxed">{content}</p>
        </div>

        <div className={cn(
          "flex items-center gap-1 px-2",
          isSent ? "flex-row-reverse" : ""
        )}>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isSent && (
            <div className="flex items-center">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : isDelivered ? (
                <CheckCheck className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}