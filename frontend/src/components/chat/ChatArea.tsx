import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

interface Message {
    id: number;
    content: string;
    timestamp: string;
    isSent: boolean;
}

interface ChatAreaProps {
    messages: Message[];
    isTyping?: boolean;
    className?: string;
}

export function ChatArea({ messages, isTyping, className }: ChatAreaProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages, isTyping]);

    const shouldShowAvatar = (currentMessage: Message, index: number) => {
        if (currentMessage.isSent) return false;
        if (index === 0) return true;

        const previousMessage = messages[index - 1];
        return !previousMessage.isSent || previousMessage.isSent !== currentMessage.isSent;
    };

    return (
        <ScrollArea
            ref={scrollAreaRef}
            className={cn("flex-1 p-4", className)}
        >
            <div className="space-y-4">
                {messages.map((message, index) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        showAvatar={shouldShowAvatar(message, index)}
                    />
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span>typing...</span>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}