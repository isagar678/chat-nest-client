export interface Message {
  id?: number;
  content: string;
  timestamp?: string;
  isSent: boolean;
  isRead?: boolean;
}

export interface FriendDetails {
  id: number;
  name: string;
  userName: string;
}

export interface Friend {
  friendDetails: FriendDetails;
  messages: Message[];
  unreadCount?: number;
  isOnline?: boolean;
}

export interface AllChats {
  friends: Friend[];
}

export interface SearchedUser {
  id: number;
  name: string;
  userName: string;
}

