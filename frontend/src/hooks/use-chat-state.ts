import { useState, useCallback } from 'react';
import type { Message, Friend, AllChats } from '@/types/chat';

export function useChatState(initialChats: AllChats) {
  const [allChats, setAllChats] = useState(initialChats);

  const markMessagesAsRead = useCallback((friendId: number) => {
    setAllChats(prev => ({
      ...prev,
      friends: prev.friends.map(friend =>
        friend.friendDetails.id === friendId
          ? {
              ...friend,
              messages: friend.messages.map(msg => ({
                ...msg,
                isRead: true
              }))
            }
          : friend
      )
    }));
  }, []);

  const addMessage = useCallback((friendId: number, message: Message) => {
    setAllChats(prev => {
      const friendIndex = prev.friends.findIndex(
        friend => friend.friendDetails.id === friendId
      );

      if (friendIndex !== -1) {
        const updatedFriends = [...prev.friends];
        updatedFriends[friendIndex] = {
          ...updatedFriends[friendIndex],
          messages: [...updatedFriends[friendIndex].messages, message]
        };

        return {
          ...prev,
          friends: updatedFriends
        };
      }

      return prev;
    });
  }, []);

  const addNewFriend = useCallback((friend: Friend) => {
    setAllChats(prev => ({
      ...prev,
      friends: [friend, ...prev.friends]
    }));
  }, []);

  const getUnreadCount = useCallback((friendId: number) => {
    const friend = allChats.friends.find(f => f.friendDetails.id === friendId);
    if (!friend) return 0;
    
    return friend.messages.filter(msg => !msg.isSent && !msg.isRead).length;
  }, [allChats.friends]);

  return {
    allChats,
    setAllChats,
    markMessagesAsRead,
    addMessage,
    addNewFriend,
    getUnreadCount
  };
}
