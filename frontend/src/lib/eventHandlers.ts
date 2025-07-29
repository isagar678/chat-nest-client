// eventHandlers.ts
export const eventHandlers = {
    initialFriendsStatus: (data: any) => {
      console.log('Initial friends status:', data);
    },
    userStatusChange: (data: any) => {
      console.log('User status change:', data);
    },
    privateMessageReceived: (data: any) => {
      console.log('Private message received:', data);
    },
    availabilityStatus: (data: any) => {
      console.log('Availability status:', data);
    },
    duplicateConnection: (data: any) => {
      console.log('Duplicate connection:', data);
    },
    unauthorized: (data: any) => {
      console.log('Unauthorized:', data);
    },
    connect_error: (err: any) => {
      console.error('Connection error:', err);
    }
  };
  