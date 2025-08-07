import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { cn } from '@/lib/utils';

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

interface ChatAreaProps {
    messages: Message[];
    className?: string;
}

export function ChatArea({ messages, className }: ChatAreaProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollElement) {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }
        }
    }, [messages]);

    const shouldShowAvatar = (currentMessage: Message, index: number) => {
        if (currentMessage.isSent) return false;
        if (index === 0) return true;

        const previousMessage = messages[index - 1];
        return previousMessage.sender.id !== currentMessage.sender.id || previousMessage.isSent;
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
            </div>
        </ScrollArea>
    );
}