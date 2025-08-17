import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

import type { Message } from '@/types/chat';

interface ChatAreaProps {
    messages: Message[];
    isTyping?: boolean;
    className?: string;
    currentFriend?: {
        friendDetails: {
            id: number;
            name: string;
            userName: string;
            avatar?: string;
        };
    };
}

export function ChatArea({ messages, isTyping, className, currentFriend }: ChatAreaProps) {
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
        return previousMessage.isSent !== currentMessage.isSent;
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
                        senderAvatar={!message.isSent ? currentFriend?.friendDetails.avatar : undefined}
                        senderName={!message.isSent ? currentFriend?.friendDetails.name : undefined}
                    />
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex items-center gap-3 max-w-[70%]">
                        <SmartAvatar 
                            src={currentFriend?.friendDetails.avatar} 
                            alt={currentFriend?.friendDetails.name} 
                            fallback={currentFriend?.friendDetails.name}
                            size="sm"
                            className="flex-shrink-0 bg-secondary text-secondary-foreground"
                        />
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