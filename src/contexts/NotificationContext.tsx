import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useDiscordTabNotification } from '../hooks/useDiscordTabNotification';
import { notificationService } from '../services/NotificationService';

interface NotificationContextProps {
  unreadCount: number;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  unreadCount: 0,
  activeChatId: null,
  setActiveChatId: () => {},
  clearUnreadCount: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const setActiveChatId = (id: string | null) => {
    setActiveChatIdState(id);
    activeChatIdRef.current = id;
  };

  useDiscordTabNotification(unreadCount);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let isInitialConversationsLoad = true;
    let isInitialCallsLoad = true;

    // Listen to Private Conversations
    const qConversations = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribeConversations = onSnapshot(qConversations, (snapshot) => {
      if (isInitialConversationsLoad) {
        isInitialConversationsLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          // Check if it's a new message from someone else
          if (
            data.lastMessageSenderId &&
            data.lastMessageSenderId !== userId &&
            data.lastMessageAt
          ) {
            // If the user is not actively looking at this chat OR the tab is hidden
            if (activeChatIdRef.current !== change.doc.id || document.hidden) {
              handleNewMessage(data.lastMessage, 'Nova mensagem privada', change.doc.id);
            }
          }
        }
      });
    });

    // Listen to Voice Matches (Calls)
    const qCalls = query(
      collection(db, 'calls'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribeCalls = onSnapshot(qCalls, (snapshot) => {
      if (isInitialCallsLoad) {
        isInitialCallsLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          if (
            data.lastMessageSenderId &&
            data.lastMessageSenderId !== userId &&
            data.lastMessageAt
          ) {
            if (activeChatIdRef.current !== change.doc.id || document.hidden) {
              handleNewMessage(data.lastMessage, 'Nova mensagem no Match', change.doc.id);
            }
          }
        }
      });
    });

    return () => {
      unsubscribeConversations();
      unsubscribeCalls();
    };
  }, [userId]);

  const handleNewMessage = (message: string, title: string, chatId: string) => {
    setUnreadCount((prev) => prev + 1);
    notificationService.playMessageSound();

    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico', // Update with your actual icon path if needed
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // You can also trigger a custom event or state change to navigate to the specific chat
        // For example, dispatching a custom event that Dashboard listens to
        window.dispatchEvent(new CustomEvent('openChat', { detail: { chatId } }));
      };
    }
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  // Reset unread count when tab is focused
  useEffect(() => {
    const handleFocus = () => {
      clearUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, activeChatId, setActiveChatId, clearUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
