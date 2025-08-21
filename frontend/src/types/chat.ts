export interface Message {
  id?: number;
  clientMessageId?: number;
  content: string;
  timestamp?: string;
  isSent: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
}

export interface FriendDetails {
  id: number;
  name: string;
  userName: string;
  avatar?: string;
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
  avatar?: string;
}

// Group Chat Types
export interface GroupMember {
  id: number;
  name: string;
  userName: string;
  avatar?: string;
}

export interface Group {
  id: number;
  name: string;
  users: GroupMember[];
  chats?: GroupMessage[];
}

export interface GroupMessage {
  id: number;
  content: string;
  timeStamp: string;
  read: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  from: GroupMember;
  group: {
    id: number;
    name: string;
  };
}

export interface GroupChat {
  group: Group;
  messages: GroupMessage[];
  unreadCount?: number;
}

