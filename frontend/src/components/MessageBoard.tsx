import { SocketContext } from '@/context/WebSocketContext';
import { useSocketEvents } from '@/lib/useSocketEvents';
import { eventHandlers } from '@/lib/eventHandlers';

import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput
} from '@chatscope/chat-ui-kit-react';
import type { MessageModel } from '@chatscope/chat-ui-kit-react';
import { useContext, useState } from 'react';


function Chats({
  className
}: any) {
  
  const socket = useContext(SocketContext);

  useSocketEvents(socket, eventHandlers);

  const [messages, setMessages] = useState<MessageModel[]>([
    {
      message: 'Hi there!',
      sentTime: 'just now',
      sender: 'Friend',
      direction: 'incoming',
      position: 'single'
    }
  ]);

  const handleSend = (innerText: string) => {

    if (socket && innerText.trim()!='') {
      socket.emit('privateMessage', {
        recipientId: 2, // Replace with a valid recipient user ID
        message: innerText
      });
  
      const newMessage: MessageModel = {
        message: innerText,
        sentTime: 'now',
        sender: 'You',
        direction: 'outgoing',
        position: 'single'
      };
      setMessages([...messages, newMessage]);
    }
  };

  return (
    <div className={(className)} style={{ position: 'relative', height: '100vh' }}>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            {messages.map((m, i) => (
              <Message key={i} model={m} />
            ))}
          </MessageList>
          <MessageInput placeholder="Type message..." onSend={handleSend} />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default Chats;
