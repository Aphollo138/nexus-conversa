import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Hash, Phone, Video, Search, MessageSquare, Trash2, UserMinus, Ban, Flag, ArrowLeft, MoreVertical } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, where, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface User {
  uid: string;
  username?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerPosition?: number;
  about?: string;
  status?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  otherUser?: User; // Populated after fetch
}

interface PrivateChatProps {
  initialTargetUser?: User | null;
  onStartCall?: (targetUser: User) => void;
}

export default function PrivateChat({ initialTargetUser, onStartCall }: PrivateChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Popover State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number, y: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [amIBlocked, setAmIBlocked] = useState(false);
  
  // Context Menu State (Messages)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
    user: User;
  } | null>(null);

  // Context Menu State (Sidebar Conversations)
  const [sidebarContextMenu, setSidebarContextMenu] = useState<{
    x: number;
    y: number;
    conversationId: string;
  } | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => {
        setContextMenu(null);
        setSidebarContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Check Friendship and Block Status
  useEffect(() => {
    if (!auth.currentUser || !activeUser) return;
    
    const friendRef = doc(db, 'users', auth.currentUser.uid, 'friends', activeUser.uid);
    const blockedRef = doc(db, 'users', auth.currentUser.uid, 'blocked', activeUser.uid);
    const amIBlockedRef = doc(db, 'users', activeUser.uid, 'blocked', auth.currentUser.uid);

    const unsubscribeFriend = onSnapshot(friendRef, (docSnap) => setIsFriend(docSnap.exists()));
    const unsubscribeBlocked = onSnapshot(blockedRef, (docSnap) => setIsBlocked(docSnap.exists()));
    const unsubscribeAmIBlocked = onSnapshot(amIBlockedRef, (docSnap) => setAmIBlocked(docSnap.exists()));
    
    return () => {
        unsubscribeFriend();
        unsubscribeBlocked();
        unsubscribeAmIBlocked();
    };
  }, [activeUser]);

  // Actions
  const handleRemoveFriend = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!auth.currentUser || !contextMenu) return;
    const targetUid = contextMenu.user.uid;
    
    // Removed confirm for smoother UX/debugging
    try {
      // 1. Remove from my friends (Priority)
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'friends', targetUid));
      
      // 2. Try to remove me from their friends (Best effort)
      try {
          await deleteDoc(doc(db, 'users', targetUid, 'friends', auth.currentUser.uid));
      } catch (err) {
          console.warn("Could not remove from target's friend list (likely permission issue):", err);
      }
      
      setContextMenu(null);
    } catch (error: any) {
      console.error("Error removing friend:", error);
      alert(`Erro ao remover amigo: ${error.message}`);
    }
  };

  const handleDeleteMessage = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!activeConversationId || !contextMenu) return;
    
    // Removed confirm for smoother UX/debugging
    try {
      console.log("Deleting message:", contextMenu.message.id, "from chat:", activeConversationId);
      await deleteDoc(doc(db, 'conversations', activeConversationId, 'messages', contextMenu.message.id));
      setContextMenu(null);
    } catch (error: any) {
      console.error("Error deleting message:", error);
      alert(`Erro ao excluir mensagem: ${error.message}`);
    }
  };

  const handleBlockUser = async (e?: React.MouseEvent) => {
     e?.preventDefault();
     e?.stopPropagation();
     
     if (!auth.currentUser || !contextMenu) return;
     const targetUser = contextMenu.user;

     // Removed confirm for smoother UX/debugging
     try {
         console.log("Blocking user:", targetUser.uid);
         
         // 1. Add to my blocked list (Priority)
         await setDoc(doc(db, 'users', auth.currentUser.uid, 'blocked', targetUser.uid), {
             username: targetUser.username || 'Unknown User',
             blockedAt: serverTimestamp()
         });

         // 2. Remove from my friends list
         await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'friends', targetUser.uid));

         // 3. Try to remove me from their friends list (Best effort)
         try {
            await deleteDoc(doc(db, 'users', targetUser.uid, 'friends', auth.currentUser.uid));
         } catch (err) {
             console.warn("Could not remove from target's friend list (likely permission issue):", err);
         }

         setContextMenu(null);
         console.log("User blocked successfully");
     } catch (error: any) {
         console.error("Error blocking user:", error);
         alert(`Erro ao bloquear usuário: ${error.message}`);
     }
  };

  const handleCloseConversation = async (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!auth.currentUser || !sidebarContextMenu) return;
      
      try {
          const convRef = doc(db, 'conversations', sidebarContextMenu.conversationId);
          const convSnap = await getDoc(convRef);
          
          if (convSnap.exists()) {
              const data = convSnap.data();
              const hiddenFor = data.hiddenFor || [];
              if (!hiddenFor.includes(auth.currentUser.uid)) {
                  await updateDoc(convRef, {
                      hiddenFor: [...hiddenFor, auth.currentUser.uid]
                  });
              }
          }
          
          if (activeConversationId === sidebarContextMenu.conversationId) {
              setActiveConversationId(null);
              setActiveUser(null);
          }
          setSidebarContextMenu(null);
      } catch (error: any) {
          console.error("Error closing conversation:", error);
          alert(`Erro ao apagar conversa: ${error.message}`);
      }
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectedUser(null);
      }
    };
    if (selectedUser) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedUser]);

  // Fetch current user profile
  useEffect(() => {
    if (auth.currentUser) {
      const fetchProfile = async () => {
        const docRef = doc(db, 'users', auth.currentUser!.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCurrentUserProfile({ uid: auth.currentUser!.uid, ...docSnap.data() } as User);
        } else {
          setCurrentUserProfile({
            uid: auth.currentUser!.uid,
            username: auth.currentUser!.displayName || 'User',
            avatarUrl: auth.currentUser!.photoURL || ''
          });
        }
      };
      fetchProfile();
    }
  }, []);

  // 1. Initialize or Load Conversation with initialTargetUser
  useEffect(() => {
    const initChat = async () => {
      if (initialTargetUser && auth.currentUser) {
        const myUid = auth.currentUser.uid;
        const otherUid = initialTargetUser.uid;
        
        // Set active user immediately to show UI
        setActiveUser(initialTargetUser);
        
        // Generate consistent conversation ID (e.g., sort UIDs)
        const chatId = [myUid, otherUid].sort().join('_');
        setActiveConversationId(chatId);
        
        // Check if conversation exists, if not create it
        try {
          const chatRef = doc(db, 'conversations', chatId);
          const chatSnap = await getDoc(chatRef);
          
          if (!chatSnap.exists()) {
            await setDoc(chatRef, {
              participants: [myUid, otherUid],
              createdAt: serverTimestamp(),
              lastMessage: '',
              lastMessageAt: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error initializing chat:", error);
        }
      }
    };
    
    initChat();
  }, [initialTargetUser]);

  // 2. Listen for Conversations List
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    const q = query(
      collection(db, 'conversations'), 
      where('participants', 'array-contains', uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs: Conversation[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Skip if hidden for current user
        if (data.hiddenFor && data.hiddenFor.includes(uid)) continue;

        const otherUid = data.participants.find((p: string) => p !== uid);
        
        let otherUser: User | undefined;
        if (otherUid) {
            // Fetch other user details
            // Optimization: Cache this or use a listener if real-time user updates needed
            const userSnap = await getDoc(doc(db, 'users', otherUid));
            if (userSnap.exists()) {
                otherUser = { uid: otherUid, ...userSnap.data() } as User;
            } else {
                otherUser = { uid: otherUid, username: 'Unknown User', avatarUrl: '' };
            }
        }

        convs.push({
          id: docSnap.id,
          participants: data.participants,
          lastMessage: data.lastMessage,
          lastMessageAt: data.lastMessageAt,
          otherUser
        });
      }
      setConversations(convs);
    });

    return () => unsubscribe();
  }, []);

  // 3. Listen for Messages in Active Conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const q = query(
      collection(db, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversationId || !auth.currentUser) return;

    try {
      // Add message to subcollection
      await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
        senderId: auth.currentUser.uid,
        content: inputValue,
        createdAt: serverTimestamp()
      });

      // Update conversation last message AND remove from hiddenFor for both participants
      await updateDoc(doc(db, 'conversations', activeConversationId), {
        lastMessage: inputValue,
        lastMessageAt: serverTimestamp(),
        hiddenFor: [] // Unhide for everyone when a new message is sent
      });

      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = (emojiObject: any) => {
    setInputValue((prev) => prev + emojiObject.emoji);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (timestamp: any) => {
     if (!timestamp) return '';
     const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
     return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(msg => {
      const dateKey = formatDateHeader(msg.createdAt);
      if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
      groupedMessages[dateKey].push(msg);
  });

  return (
    <div className="flex h-full w-full bg-[#313338] overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`
        w-full md:w-60 bg-[#2B2D31] flex flex-col border-r border-[#1e1f22] shrink-0
        ${activeConversationId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="h-14 flex items-center px-4 shadow-sm shrink-0 border-b border-[#1e1f22] pl-14 md:pl-4">
           <button className="w-full text-left bg-[#1e1f22] text-zinc-400 text-sm py-1.5 px-2 rounded hover:text-zinc-200 transition-colors truncate">
             Encontre ou comece uma conversa
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
           <span className="text-xs font-bold text-zinc-400 uppercase px-2 mt-2 mb-1">Mensagens Diretas</span>
           {conversations.map(conv => (
             <div 
               key={conv.id}
               onClick={() => {
                   setActiveConversationId(conv.id);
                   setActiveUser(conv.otherUser || null);
               }}
               onContextMenu={(e) => {
                   e.preventDefault();
                   setSidebarContextMenu({
                       x: e.clientX,
                       y: e.clientY,
                       conversationId: conv.id
                   });
               }}
               className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-[#404249] text-white' : 'text-zinc-400 hover:bg-[#35373C] hover:text-zinc-200'}`}
             >
               <div className="relative shrink-0">
                 {conv.otherUser?.avatarUrl ? (
                   <img src={conv.otherUser.avatarUrl} className="w-8 h-8 rounded-full object-cover bg-zinc-700" />
                 ) : (
                   <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                     {conv.otherUser?.username?.slice(0, 2).toUpperCase()}
                   </div>
                 )}
                 {/* Online Status (Mock) */}
                 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-zinc-500 rounded-full border-2 border-[#2B2D31] group-hover:border-[#35373C]"></div>
               </div>
               <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-medium truncate">{conv.otherUser?.username || 'Usuário Desconhecido'}</span>
                 <span className="text-xs text-zinc-500 truncate">{conv.lastMessage || 'Inicie uma conversa'}</span>
               </div>
             </div>
           ))}
        </div>
        
        {/* Sidebar Context Menu */}
        <AnimatePresence>
            {sidebarContextMenu && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="fixed z-[100] w-56 bg-[#111214] rounded-md shadow-xl border border-[#1e1f22] overflow-hidden py-1.5"
                    style={{ top: sidebarContextMenu.y, left: sidebarContextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        onClick={handleCloseConversation}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Apagar mensagem direta
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col min-w-0 bg-[#313338] relative
        ${!activeConversationId ? 'hidden md:flex' : 'flex'}
      `}>
        {activeConversationId && activeUser ? (
          <>
            {/* Header */}
            <div className="h-14 border-b border-[#26272D] flex items-center justify-between px-2 sm:px-4 shadow-sm shrink-0 bg-[#313338]">
              <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
                <button 
                  onClick={() => {
                    setActiveConversationId(null);
                    setActiveUser(null);
                  }}
                  className="md:hidden p-2 text-zinc-400 hover:text-white shrink-0"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                
                <div className="relative shrink-0">
                   {activeUser.avatarUrl && !isBlocked && !amIBlocked ? (
                     <img src={activeUser.avatarUrl} className="w-8 h-8 rounded-full object-cover bg-zinc-700" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                       {activeUser.username?.slice(0, 2).toUpperCase()}
                     </div>
                   )}
                   <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#313338] ${isBlocked || amIBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                <h2 className="font-bold text-white text-base truncate">{activeUser.username}</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-zinc-400 shrink-0">
                 <button onClick={() => onStartCall && onStartCall(activeUser)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                   <Phone className="w-5 h-5 hover:text-green-400 cursor-pointer transition-colors" />
                 </button>
                 <Video className="w-5 h-5 hover:text-zinc-200 cursor-pointer block md:hidden" />
                 <Search className="w-5 h-5 hover:text-zinc-200 cursor-pointer hidden sm:block" />
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     // Use a dummy message for context menu to allow blocking user
                     const dummyMsg = { id: 'header-action', content: '', senderId: activeUser.uid, createdAt: new Date() } as any;
                     setContextMenu({
                       x: e.clientX,
                       y: e.clientY + 20,
                       message: dummyMsg,
                       user: activeUser
                     });
                   }}
                   className="p-2 hover:bg-white/5 rounded-full transition-colors"
                 >
                   <MoreVertical className="w-5 h-5 hover:text-zinc-200 cursor-pointer" />
                 </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
              {/* Welcome Message */}
              <div className="mt-4 mb-8">
                 <div className="w-20 h-20 rounded-full bg-zinc-700 mb-4 overflow-hidden flex items-center justify-center">
                    {activeUser.avatarUrl && !isBlocked && !amIBlocked ? (
                      <img src={activeUser.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{activeUser.username?.slice(0, 2).toUpperCase()}</span>
                    )}
                 </div>
                 <h1 className="text-3xl font-bold text-white mb-2">{activeUser.username}</h1>
                 <p className="text-zinc-400 text-sm">Este é o começo da sua história de mensagens diretas com <span className="font-bold">{activeUser.username}</span>.</p>
                 {(isBlocked || amIBlocked) && (
                     <p className="text-red-400 text-sm mt-2 font-bold uppercase">
                         {isBlocked ? "Você bloqueou este usuário." : "Você foi bloqueado por este usuário."}
                     </p>
                 )}
              </div>

              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center gap-4 my-4">
                     <div className="h-px bg-[#3F4147] flex-1"></div>
                     <span className="text-xs font-bold text-zinc-500">{date}</span>
                     <div className="h-px bg-[#3F4147] flex-1"></div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {msgs.map((msg, index) => {
                      const isMe = msg.senderId === auth.currentUser?.uid;
                      const showHeader = index === 0 || msgs[index - 1].senderId !== msg.senderId;
                      
                      return (
                        <div 
                          key={msg.id} 
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              message: msg,
                              user: isMe ? (currentUserProfile || { uid: auth.currentUser?.uid || '', username: 'Me' } as User) : activeUser!
                            });
                          }}
                          // Mobile Long Press Handlers
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            const timer = setTimeout(() => {
                                setContextMenu({
                                    x: touch.clientX,
                                    y: touch.clientY,
                                    message: msg,
                                    user: isMe ? (currentUserProfile || { uid: auth.currentUser?.uid || '', username: 'Me' } as User) : activeUser!
                                });
                            }, 500);
                            // Store timer in a data attribute or ref if possible, but for now we rely on closure if component doesn't re-render too fast
                            // Better to use a ref for the timer ID
                            (window as any).longPressTimer = timer;
                          }}
                          onTouchEnd={() => {
                            if ((window as any).longPressTimer) {
                                clearTimeout((window as any).longPressTimer);
                                (window as any).longPressTimer = null;
                            }
                          }}
                          onTouchMove={() => {
                             if ((window as any).longPressTimer) {
                                clearTimeout((window as any).longPressTimer);
                                (window as any).longPressTimer = null;
                            }
                          }}
                          className={`group flex gap-4 px-2 py-1 hover:bg-[#2e3035] rounded transition-colors ${!showHeader ? 'py-0.5' : 'mt-2'}`}
                        >
                          {showHeader ? (
                             <div 
                               className="shrink-0 cursor-pointer mt-0.5"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setPopoverPos({ x: e.clientX, y: e.clientY });
                                 if (isMe) {
                                   setSelectedUser(currentUserProfile);
                                 } else {
                                   setSelectedUser(activeUser);
                                 }
                               }}
                             >
                               {isMe ? (
                                  <div className="w-10 h-10 rounded-full bg-indigo-500 overflow-hidden">
                                     {currentUserProfile?.avatarUrl ? (
                                       <img src={currentUserProfile.avatarUrl} className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                         {currentUserProfile?.username?.slice(0, 2).toUpperCase() || 'EU'}
                                       </div>
                                     )}
                                  </div>
                               ) : (
                                  <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                    {activeUser.avatarUrl ? (
                                      <img src={activeUser.avatarUrl} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                        {activeUser.username?.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                               )}
                             </div>
                          ) : (
                             <div className="w-10 shrink-0 text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 text-right self-center select-none block">
                                {formatTime(msg.createdAt)}
                             </div>
                          )}

                          <div className="flex flex-col w-full min-w-0">
                             {showHeader && (
                               <div className="flex items-baseline gap-2 flex-wrap">
                                 <span className="font-medium text-white hover:underline cursor-pointer text-sm">
                                   {isMe ? (currentUserProfile?.username || 'Você') : activeUser.username}
                                 </span>
                                 <span className="text-[10px] text-zinc-500 font-medium">
                                   {formatTime(msg.createdAt)}
                                 </span>
                               </div>
                             )}
                             <div className="relative group/msg">
                               <p className={`text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words ${!showHeader ? 'ml-0' : ''}`}>
                                 {msg.content}
                               </p>
                               {/* Mobile Context Menu Button */}
                               <button 
                                 className="md:hidden absolute -top-6 right-0 p-1 text-zinc-500 hover:text-white bg-[#2B2D31] rounded shadow-sm opacity-0 group-hover/msg:opacity-100 transition-opacity"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setContextMenu({
                                     x: e.clientX,
                                     y: e.clientY,
                                     message: msg,
                                     user: isMe ? (currentUserProfile || { uid: auth.currentUser?.uid || '', username: 'Me' } as User) : activeUser!
                                   });
                                 }}
                               >
                                 <MoreVertical className="w-3 h-3" />
                               </button>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 shrink-0 relative pb-[calc(1rem+env(safe-area-inset-bottom))]">
               {!isFriend || isBlocked || amIBlocked ? (
                 <div className="bg-[#383A40] rounded-lg px-4 py-4 flex items-center justify-center text-zinc-400 gap-2 cursor-not-allowed opacity-80">
                   {isBlocked || amIBlocked ? <Ban className="w-5 h-5" /> : <UserMinus className="w-5 h-5" />}
                   <span className="font-medium text-sm text-center">
                       {isBlocked ? "Você bloqueou este usuário." : amIBlocked ? "Você foi bloqueado." : "Você precisa ser amigo para enviar mensagens."}
                   </span>
                 </div>
               ) : (
                 <>
                   {showEmojiPicker && (
                     <div className="absolute bottom-20 right-8 z-50 shadow-2xl border border-white/10 rounded-xl overflow-hidden max-w-[90vw]">
                       <EmojiPicker 
                         onEmojiClick={handleEmojiClick} 
                         theme={Theme.DARK} 
                         width="100%"
                       />
                     </div>
                   )}
                   <form 
                     onSubmit={handleSendMessage}
                     className="bg-[#383A40] rounded-lg px-4 py-2.5 flex items-center gap-3"
                   >
                 <button 
                   type="button"
                   className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-white/5 hidden sm:block"
                 >
                   <div className="w-6 h-6 rounded-full bg-zinc-500 flex items-center justify-center">
                       <span className="text-xs font-bold text-[#383A40]">+</span>
                   </div>
                 </button>
                 
                 <input
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   placeholder={`Conversar com @${activeUser.username}`}
                   className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none text-base md:text-sm font-medium min-w-0"
                 />
                 
                 <div className="flex items-center gap-2 shrink-0">
                   <button 
                     type="button"
                     onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                     className={`text-zinc-400 hover:text-zinc-200 transition-colors p-1 ${showEmojiPicker ? 'text-indigo-400' : ''}`}
                   >
                     <Smile className="w-6 h-6" />
                   </button>
                   {inputValue.trim() && (
                       <button 
                       type="submit"
                       className="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                       >
                       <Send className="w-5 h-5" />
                       </button>
                   )}
                 </div>
               </form>
               </>
             )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4 text-center">
             <div className="w-24 h-24 bg-[#2B2D31] rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-12 h-12" />
             </div>
             <h3 className="text-white font-bold text-lg mb-2">Nenhuma conversa selecionada</h3>
             <p className="text-sm">Selecione uma conversa ou inicie uma nova.</p>
          </div>
        )}
        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[100] w-56 bg-[#111214] rounded-md shadow-xl border border-[#1e1f22] overflow-hidden py-1.5"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onClick={(e) => e.stopPropagation()}
            >
               {contextMenu.user.uid !== auth.currentUser?.uid && (
                 <>
                   <button 
                     onClick={handleRemoveFriend}
                     className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                   >
                     <UserMinus className="w-4 h-4" />
                     Desfazer Amizade
                   </button>
                   <button 
                     onClick={handleBlockUser}
                     className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 flex items-center gap-2 transition-colors"
                   >
                     <Ban className="w-4 h-4" />
                     Bloquear
                   </button>
                   <button 
                     className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-200 flex items-center gap-2 transition-colors"
                   >
                     <Flag className="w-4 h-4" />
                     Denunciar Mensagem
                   </button>
                   <div className="h-px bg-[#1e1f22] my-1 mx-2"></div>
                 </>
               )}
               
               {(contextMenu.message.senderId === auth.currentUser?.uid) && (
                 <button 
                   onClick={handleDeleteMessage}
                   className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                   Excluir Mensagem
                 </button>
               )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Popover */}
        <AnimatePresence>
          {selectedUser && popoverPos && (
            <motion.div 
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 w-80 bg-[#111214] rounded-xl shadow-2xl border border-[#1e1f22] overflow-hidden"
              style={{ 
                top: Math.min(popoverPos.y, window.innerHeight - 400), 
                left: Math.min(popoverPos.x + 20, window.innerWidth - 340) 
              }}
            >
              {/* Banner */}
              <div className="h-24 bg-[#1e1f22] relative">
                {selectedUser.bannerUrl ? (
                  <img 
                    src={selectedUser.bannerUrl} 
                    alt="Banner" 
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `center ${selectedUser.bannerPosition || 50}%` }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                )}
              </div>

              {/* Avatar & Badges */}
              <div className="px-4 pb-4 relative">
                 <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                        {selectedUser.username?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#111214]"></div>
                 </div>

                 {/* User Info */}
                 <div className="mt-12 bg-[#1e1f22] rounded-lg p-3 border border-[#2e3035]">
                    <h3 className="text-white font-bold text-lg">{selectedUser.username}</h3>
                    <p className="text-zinc-400 text-xs">@{selectedUser.username?.toLowerCase().replace(/\s/g, '')}</p>
                    
                    <div className="h-px bg-[#2e3035] my-3"></div>
                    
                    <h4 className="text-xs font-bold text-zinc-300 uppercase mb-1">Sobre Mim</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {selectedUser.about || "Membro do Nexus."}
                    </p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
