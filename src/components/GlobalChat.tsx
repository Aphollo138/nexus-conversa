import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Hash, X, UserPlus, Clock, MessageSquare, Users } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';

interface Message {
  id: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: any;
}

interface User {
  uid: string;
  username: string;
  avatarUrl: string;
  bannerUrl?: string;
  bannerPosition?: number;
  location?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: any;
}

interface GlobalChatProps {
  onStartPrivateChat?: (user: User) => void;
}

export default function GlobalChat({ onStartPrivateChat }: GlobalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [popoverPos, setPopoverPos] = useState<{x: number, y: number} | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'friend' | 'pending_sent' | 'pending_received'>('none');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false); // Mobile state
  
  const [systemMessages, setSystemMessages] = useState<Message[]>([]);
  const prevOnlineMembersRef = useRef<Set<string>>(new Set());

  // ... (existing useEffects)

  // Track online members and generate system messages
  useEffect(() => {
    const currentOnlineMembers = new Set(
      members
        .filter(m => m.isOnline && m.lastSeen && (Date.now() - (m.lastSeen.toMillis ? m.lastSeen.toMillis() : new Date(m.lastSeen).getTime()) < 70000))
        .map(m => m.uid)
    );

    // Check for disconnections
    prevOnlineMembersRef.current.forEach(uid => {
      if (!currentOnlineMembers.has(uid)) {
        const user = members.find(m => m.uid === uid);
        if (user) {
          const systemMsg: Message = {
            id: `system-${Date.now()}-${uid}`,
            userId: 'system',
            user: { name: 'System', avatar: '' },
            content: `${user.username} desconectou-se.`,
            createdAt: { toDate: () => new Date() } // Mock Timestamp
          };
          setSystemMessages(prev => [...prev, systemMsg]);
        }
      }
    });

    prevOnlineMembersRef.current = currentOnlineMembers;
  }, [members]);

  const displayedMessages = [...messages, ...systemMessages].sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
    return timeA - timeB;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for messages
    const q = query(
      collection(db, 'messages'),
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

    // Fetch members (users)
    const fetchMembers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const qUsers = query(usersCol, orderBy('lastSeen', 'desc'));
        const userSnapshot = await getDocs(qUsers);
        const userList: User[] = userSnapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          } as User))
          .filter(user => user.uid !== 'wh59n1VtHcXhNfKqYLYA10aNrBD2'); // Hide Admin from online list
          
        setMembers(userList);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    // Fetch current user data
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUserData(docSnap.data() as User);
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      }
    };

    const interval = setInterval(fetchMembers, 30000);
    fetchMembers();
    fetchCurrentUser();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check friendship status when selectedUser changes
  useEffect(() => {
    if (!selectedUser || !auth.currentUser) {
        setFriendshipStatus('none');
        return;
    }
    
    const checkStatus = async () => {
        const myUid = auth.currentUser!.uid;
        const targetUid = selectedUser.uid;

        if (myUid === targetUid) return; // Self

        // 1. Check if already friends
        const friendDoc = await getDoc(doc(db, 'users', myUid, 'friends', targetUid));
        if (friendDoc.exists()) {
            setFriendshipStatus('friend');
            return;
        }

        // 2. Check if request sent
        const sentQuery = query(
            collection(db, 'friendRequests'), 
            where('from', '==', myUid), 
            where('to', '==', targetUid),
            where('status', '==', 'pending')
        );
        const sentSnap = await getDocs(sentQuery);
        if (!sentSnap.empty) {
            setFriendshipStatus('pending_sent');
            return;
        }

        // 3. Check if request received
        const receivedQuery = query(
            collection(db, 'friendRequests'), 
            where('from', '==', targetUid), 
            where('to', '==', myUid),
            where('status', '==', 'pending')
        );
        const receivedSnap = await getDocs(receivedQuery);
        if (!receivedSnap.empty) {
            setFriendshipStatus('pending_received');
            return;
        }

        setFriendshipStatus('none');
    };

    checkStatus();
  }, [selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEmojiClick = (emojiObject: any) => {
    setInputValue((prev) => prev + emojiObject.emoji);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !auth.currentUser) return;

    const { uid, displayName, photoURL } = auth.currentUser;

    // Use currentUserData if available, otherwise fallback to auth data, then defaults
    const name = currentUserData?.username || displayName || 'Anônimo';
    const avatar = currentUserData?.avatarUrl || photoURL || '';

    try {
      await addDoc(collection(db, 'messages'), {
        userId: uid,
        user: {
          name: name,
          avatar: avatar,
        },
        content: inputValue,
        createdAt: serverTimestamp(),
      });
      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAddFriend = async () => {
      if (!auth.currentUser || !selectedUser) return;
      try {
          await addDoc(collection(db, 'friendRequests'), {
              from: auth.currentUser.uid,
              to: selectedUser.uid,
              senderName: currentUserData?.username || auth.currentUser.displayName,
              senderAvatar: currentUserData?.avatarUrl || auth.currentUser.photoURL,
              receiverName: selectedUser.username,
              receiverAvatar: selectedUser.avatarUrl,
              status: 'pending',
              createdAt: serverTimestamp()
          });
          setFriendshipStatus('pending_sent');
      } catch (error) {
          console.error("Error sending friend request:", error);
      }
  };

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'US';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onlineMembers = members.filter(member => 
    member.isOnline && member.lastSeen && (Date.now() - (member.lastSeen.toMillis ? member.lastSeen.toMillis() : new Date(member.lastSeen).getTime()) < 70000)
  );

  return (
    <div className="flex h-full w-full bg-[#313338] relative overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative">
        {/* Header */}
        <div className="h-14 border-b border-[#26272D] flex items-center justify-between px-4 shadow-sm shrink-0 pl-14 md:pl-4">
          <div className="flex items-center overflow-hidden">
            <Hash className="w-5 h-5 text-zinc-400 mr-2 shrink-0" />
            <h2 className="font-bold text-white text-base truncate">global-chat</h2>
            <div className="hidden sm:block w-px h-6 bg-white/10 mx-4"></div>
            <span className="hidden sm:block text-xs text-zinc-400 font-medium truncate">O canal oficial do Nexus.</span>
          </div>
          
          <button 
            onClick={() => setShowMembersSidebar(!showMembersSidebar)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {displayedMessages.map((msg) => (
            msg.userId === 'system' ? (
              <div key={msg.id} className="flex items-center justify-center py-2 opacity-50">
                 <div className="h-px bg-white/10 w-8 mr-2"></div>
                 <span className="text-xs text-zinc-500 italic">{msg.content}</span>
                 <div className="h-px bg-white/10 w-8 ml-2"></div>
              </div>
            ) : (
            <div 
              key={msg.id} 
              className="group flex flex-row gap-4 px-2 py-1 hover:bg-white/5 rounded transition-colors duration-200"
            >
              {/* Avatar */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverPos({ x: e.clientX, y: e.clientY });
                  
                  // Try to find full user data
                  const fullMember = onlineMembers.find(m => m.uid === msg.userId);
                  const isMe = auth.currentUser?.uid === msg.userId;
                  
                  if (isMe && currentUserData) {
                      setSelectedUser({ ...currentUserData, uid: auth.currentUser!.uid });
                  } else if (fullMember) {
                      setSelectedUser(fullMember);
                  } else {
                      setSelectedUser({ 
                        uid: msg.userId, 
                        username: msg.user.name, 
                        avatarUrl: msg.user.avatar 
                      });
                  }
                }}
                className="shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
              >
                  <img 
                    src={msg.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`}
                    alt={msg.user.name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`;
                    }}
                  />
              </div>

              {/* Content */}
              <div className="flex flex-col w-full min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-white hover:underline cursor-pointer text-sm">
                    {msg.user.name || 'Usuário Desconhecido'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
            </div>
            )
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 shrink-0 relative pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
              placeholder="Conversar em #global-chat"
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
        </div>
      </div>

      {/* Members Sidebar - Responsive */}
      <AnimatePresence>
        {(showMembersSidebar || window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className={`
              fixed inset-y-0 right-0 z-40 w-60 bg-[#2B2D31] border-l border-[#26272D] flex flex-col shadow-xl
              md:relative md:translate-x-0 md:shadow-none md:flex
              ${showMembersSidebar ? 'flex' : 'hidden md:flex'}
            `}
          >
            <div className="h-14 flex items-center px-4 shadow-sm shrink-0 justify-between">
              <h3 className="font-bold text-zinc-400 text-xs uppercase tracking-wide">Membros — {onlineMembers.length}</h3>
              <button onClick={() => setShowMembersSidebar(false)} className="md:hidden text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {onlineMembers.map((member) => (
                <div 
                  key={member.uid}
                  onClick={() => {
                    setSelectedUser(member);
                    setShowMembersSidebar(false); // Close on mobile after selection
                  }}
                  className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer transition-colors group opacity-90 hover:opacity-100"
                >
                  <div className="relative">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.username} className="w-8 h-8 rounded-full object-cover bg-zinc-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                        {getInitials(member.username)}
                      </div>
                    )}
                    {/* Online Status Indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2B2D31] ${
                      member.isOnline && member.lastSeen && (Date.now() - (member.lastSeen.toMillis ? member.lastSeen.toMillis() : new Date(member.lastSeen).getTime()) < 70000) 
                      ? 'bg-[#23A559]' 
                      : 'bg-zinc-500'
                    }`}></div>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-sm font-medium truncate ${selectedUser?.uid === member.uid ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      {member.username || 'User'}
                    </span>
                    {/* Status Message */}
                    <span className="text-[10px] text-zinc-500 truncate">
                      {member.isOnline && member.lastSeen && (Date.now() - (member.lastSeen.toMillis ? member.lastSeen.toMillis() : new Date(member.lastSeen).getTime()) < 70000) 
                        ? 'Online' 
                        : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay for Sidebar */}
      {showMembersSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowMembersSidebar(false)}
        />
      )}

      {/* User Profile Popover */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Invisible backdrop to close on click outside */}
            <div 
              className="fixed inset-0 z-50" 
              onClick={() => { setSelectedUser(null); setPopoverPos(null); }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={popoverPos && window.innerWidth > 768 ? { 
                position: 'fixed', 
                top: Math.min(popoverPos.y, window.innerHeight - 450), // Prevent overflow bottom
                left: Math.min(popoverPos.x + 20, window.innerWidth - 340)
              } : undefined}
              className={`
                ${popoverPos && window.innerWidth > 768 ? 'z-[60]' : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]'} 
                w-80 bg-[#111214] border border-white/10 rounded-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden
              `}
            >
               {/* Banner */}
               <div className="h-24 bg-zinc-800 w-full relative">
                  {selectedUser.bannerUrl && (
                    <img 
                      src={selectedUser.bannerUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover" 
                      style={{ objectPosition: `center ${selectedUser.bannerPosition || 50}%` }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
               </div>

               <div className="px-4 pb-4 relative">
                 {/* Avatar */}
                 <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden">
                   {selectedUser.avatarUrl ? (
                     <img src={selectedUser.avatarUrl} alt={selectedUser.username} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                       <span className="text-2xl font-bold text-zinc-500">{getInitials(selectedUser.username)}</span>
                     </div>
                   )}
                   {/* Online Status */}
                   <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#111214]"></div>
                 </div>

                 <div className="pt-12 mb-4">
                   <h3 className="text-white font-bold text-xl tracking-tight leading-tight">{selectedUser.username || 'User'}</h3>
                   <p className="text-sm text-zinc-400">@{selectedUser.username?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                 </div>

                 <div className="w-full h-px bg-[#2e3035] mb-4"></div>

                 <div className="w-full space-y-3">
                   <div className="space-y-1">
                     <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider block">Sobre Mim</span>
                     <p className="text-sm text-zinc-300 leading-relaxed">{selectedUser.about || 'Membro do Nexus desde 2024.'}</p>
                   </div>
                   
                   {/* Friend Action Button */}
                   {friendshipStatus === 'none' && auth.currentUser?.uid !== selectedUser.uid && (
                       <button 
                         onClick={handleAddFriend}
                         className="w-full py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                       >
                         <UserPlus className="w-4 h-4" />
                         Adicionar Amigo
                       </button>
                   )}

                   {friendshipStatus === 'pending_sent' && (
                       <button 
                         disabled
                         className="w-full py-2 rounded bg-zinc-700 text-zinc-400 text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed mt-4"
                       >
                         <Clock className="w-4 h-4" />
                         Pedido Enviado
                       </button>
                   )}

                   {friendshipStatus === 'friend' && (
                       <button 
                         onClick={() => onStartPrivateChat?.(selectedUser)}
                         className="w-full py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-4"
                       >
                         <MessageSquare className="w-4 h-4" />
                         Enviar Mensagem
                       </button>
                   )}
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
