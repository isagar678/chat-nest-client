import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

import type { Message } from '@/types/chat';

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
                    <div className="flex items-center gap-3 max-w-[70%]">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                U
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-chat-bubble-received text-chat-bubble-received-foreground px-4 py-3 rounded-2xl rounded-bl-md">
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60"></div>
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                                <span className="text-xs opacity-60">typing</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}