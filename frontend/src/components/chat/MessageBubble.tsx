
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import type { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({ message, showAvatar = true, className }: MessageBubbleProps) {
  const { content, timestamp, isSent } = message;

  return (
    <div className={cn(
      "flex gap-3 max-w-[70%]",
      isSent ? "ml-auto flex-row-reverse" : "",
      className
    )}>
      {showAvatar && !isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            U
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
          <span className="text-xs text-muted-foreground">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}