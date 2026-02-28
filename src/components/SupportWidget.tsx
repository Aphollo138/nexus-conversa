import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, MessageSquare, X, Send, Ticket, 
  LifeBuoy, ToggleLeft, ToggleRight, User, CheckCircle, 
  Clock, AlertCircle, ChevronRight, Minimize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { 
  collection, doc, getDoc, setDoc, addDoc, updateDoc, 
  onSnapshot, query, where, orderBy, serverTimestamp, 
  limit, Timestamp 
} from 'firebase/firestore';

const ADMIN_UID = 'wh59n1VtHcXhNfKqYLYA10aNrBD2';

// --- Types ---
interface TicketData {
  id: string;
  userId: string;
  userEmail?: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  adminReply?: string;
  createdAt: any;
}

interface SupportChat {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  status: 'waiting' | 'active' | 'closed';
  startedAt: any;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

// --- Sub-Components ---

// 1. Chat Interface (Shared)
const ChatInterface = ({ chatId, isUser, onClose, queueCount }: { chatId: string, isUser: boolean, onClose: () => void, queueCount?: number }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'support_chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      
      // Reset inactivity timer on new message
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Update lastActivity
      updateDoc(doc(db, 'support_chats', chatId), { lastActivity: serverTimestamp() });

      // Start new 5-minute timer
      timeoutRef.current = setTimeout(async () => {
          await addDoc(collection(db, 'support_chats', chatId, 'messages'), {
              text: 'Atendimento encerrado automaticamente após 5 minutos de inatividade.',
              senderId: 'system',
              createdAt: serverTimestamp()
          });
          await updateDoc(doc(db, 'support_chats', chatId), { status: 'closed' });
          onClose();
      }, 300000); // 5 minutes
    });
    return () => {
        unsub();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addDoc(collection(db, 'support_chats', chatId, 'messages'), {
      text: input,
      senderId: auth.currentUser?.uid,
      createdAt: serverTimestamp()
    });
    setInput('');
  };

  const endChat = async () => {
    if (window.confirm('Tem certeza que deseja encerrar este atendimento?')) {
      await updateDoc(doc(db, 'support_chats', chatId), { status: 'closed' });
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1F22]">
      <div className="p-3 border-b border-white/10 flex justify-between items-center bg-[#2B2D31]">
        <div className="flex flex-col">
            <span className="font-bold text-white text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Atendimento ao Vivo
            </span>
            {!isUser && queueCount !== undefined && (
                <span className="text-[10px] text-zinc-400">Fila de Espera: {queueCount} usuários</span>
            )}
        </div>
        <div className="flex gap-2">
            {!isUser && (
                <button onClick={endChat} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">
                    Encerrar
                </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <Minimize2 className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          const isSystem = msg.senderId === 'system';
          
          if (isSystem) {
              return (
                  <div key={msg.id} className="flex justify-center my-2">
                      <span className="text-xs text-zinc-500 bg-black/20 px-3 py-1 rounded-full">{msg.text}</span>
                  </div>
              )
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-[#383A40] text-zinc-200'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 bg-[#2B2D31] flex gap-2">
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-[#1E1F22] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button type="submit" className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-500">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// --- Main Component ---
export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'ticket'>('live');
  const [supportOnline, setSupportOnline] = useState(false);
  
  // User State
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'none' | 'waiting' | 'active'>('none');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Admin State
  const [liveQueue, setLiveQueue] = useState<SupportChat[]>([]);
  const [openTickets, setOpenTickets] = useState<TicketData[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setIsAdmin(auth.currentUser.uid === ADMIN_UID);
    }

    // Listen to Support Status
    const unsubStatus = onSnapshot(doc(db, 'settings', 'support'), (doc) => {
      setSupportOnline(doc.data()?.online || false);
    });

    return () => unsubStatus();
  }, []);

  // --- User Logic ---
  useEffect(() => {
    if (isAdmin || !auth.currentUser) return;

    // Listen to my tickets
    const qTickets = query(collection(db, 'tickets'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    const unsubTickets = onSnapshot(qTickets, (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketData)));
    });

    // Check for active chat
    // Ideally we store activeChatId in local state or check DB for open chats for this user
    // For simplicity, we'll just check if there is a chat with status != closed
    const qChat = query(
        collection(db, 'support_chats'), 
        where('userId', '==', auth.currentUser.uid), 
        where('status', 'in', ['waiting', 'active']),
        limit(1)
    );
    const unsubChat = onSnapshot(qChat, (snap) => {
        if (!snap.empty) {
            const chatData = snap.docs[0].data() as SupportChat;
            setActiveChatId(snap.docs[0].id);
            setChatStatus(chatData.status);
        } else {
            setActiveChatId(null);
            setChatStatus('none');
        }
    });

    return () => {
        unsubTickets();
        unsubChat();
    };
  }, [isAdmin]);

  const handleStartChat = async () => {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, 'support_chats'), {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Usuário',
            userAvatar: auth.currentUser.photoURL || '',
            status: 'waiting',
            startedAt: serverTimestamp(),
            lastActivity: serverTimestamp()
        });
    } catch (error) {
        console.error("Error starting chat", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth.currentUser || !ticketSubject || !ticketMessage) return;
      try {
          await addDoc(collection(db, 'tickets'), {
              userId: auth.currentUser.uid,
              userEmail: auth.currentUser.email,
              subject: ticketSubject,
              message: ticketMessage,
              status: 'open',
              createdAt: serverTimestamp()
          });
          setTicketSubject('');
          setTicketMessage('');
          alert('Ticket criado com sucesso!');
      } catch (error) {
          console.error("Error creating ticket", error);
      }
  };

  // --- Admin Logic ---
  useEffect(() => {
      if (!isAdmin) return;

      // Listen to Live Queue
      const qQueue = query(collection(db, 'support_chats'), where('status', '==', 'waiting'), orderBy('startedAt', 'asc'));
      const unsubQueue = onSnapshot(qQueue, (snap) => {
          setLiveQueue(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportChat)));
      });

      // Listen to Open Tickets
      const qOpenTickets = query(collection(db, 'tickets'), where('status', '==', 'open'), orderBy('createdAt', 'asc'));
      const unsubOpenTickets = onSnapshot(qOpenTickets, (snap) => {
          setOpenTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as TicketData)));
      });

      return () => {
          unsubQueue();
          unsubOpenTickets();
      };
  }, [isAdmin]);

  const toggleSupportStatus = async () => {
      await setDoc(doc(db, 'settings', 'support'), { online: !supportOnline }, { merge: true });
  };

  const handleAdminAnswerChat = async (chatId: string) => {
      await updateDoc(doc(db, 'support_chats', chatId), { status: 'active', adminId: auth.currentUser?.uid });
      setActiveChatId(chatId);
      setChatStatus('active');
  };

  const handleAdminReplyTicket = async (ticketId: string) => {
      if (!adminReplyText) return;
      await updateDoc(doc(db, 'tickets', ticketId), {
          adminReply: adminReplyText,
          status: 'answered'
      });
      setAdminReplyText('');
      setSelectedTicketId(null);
  };

  // --- Render ---

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 w-[380px] h-[550px] bg-[#111214]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 bg-gradient-to-r from-indigo-900/50 to-[#111214] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-white">Suporte Nexus</span>
              </div>
              {isAdmin && (
                  <button onClick={toggleSupportStatus} className="flex items-center gap-2 text-xs font-bold bg-black/30 px-2 py-1 rounded-full border border-white/5">
                      {supportOnline ? <span className="text-green-400">ONLINE</span> : <span className="text-red-400">OFFLINE</span>}
                      {supportOnline ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-zinc-500" />}
                  </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#313338]">
                {/* Admin View */}
                {isAdmin ? (
                    <>
                        <div className="flex border-b border-white/5">
                            <button 
                                onClick={() => setActiveTab('live')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'live' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                Fila ao Vivo ({liveQueue.length})
                            </button>
                            <button 
                                onClick={() => setActiveTab('ticket')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'ticket' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-zinc-400 hover:text-zinc-200'}`}
                            >
                                Tickets ({openTickets.length})
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {activeChatId ? (
                                <ChatInterface chatId={activeChatId} isUser={false} onClose={() => setActiveChatId(null)} queueCount={liveQueue.length} />
                            ) : activeTab === 'live' ? (
                                <div className="space-y-2">
                                    {liveQueue.length === 0 && <p className="text-zinc-500 text-center text-sm mt-10">Fila vazia.</p>}
                                    {liveQueue.map(chat => (
                                        <div key={chat.id} className="bg-[#2B2D31] p-3 rounded-lg flex items-center justify-between border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                                                    {chat.userName?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{chat.userName}</p>
                                                    <p className="text-xs text-zinc-400">Aguardando...</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleAdminAnswerChat(chat.id)}
                                                className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-full font-bold"
                                            >
                                                Atender
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {openTickets.length === 0 && <p className="text-zinc-500 text-center text-sm mt-10">Nenhum ticket aberto.</p>}
                                    {openTickets.map(ticket => (
                                        <div key={ticket.id} className="bg-[#2B2D31] p-3 rounded-lg border border-white/5">
                                            <div 
                                                className="flex justify-between items-start cursor-pointer"
                                                onClick={() => setSelectedTicketId(selectedTicketId === ticket.id ? null : ticket.id)}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-white">{ticket.subject}</p>
                                                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{ticket.message}</p>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedTicketId === ticket.id ? 'rotate-90' : ''}`} />
                                            </div>
                                            
                                            {selectedTicketId === ticket.id && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-zinc-300 mb-2">{ticket.message}</p>
                                                    <textarea 
                                                        value={adminReplyText}
                                                        onChange={e => setAdminReplyText(e.target.value)}
                                                        placeholder="Escreva a resposta..."
                                                        className="w-full bg-[#1E1F22] text-white text-sm rounded p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        rows={3}
                                                    />
                                                    <button 
                                                        onClick={() => handleAdminReplyTicket(ticket.id)}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded"
                                                    >
                                                        Enviar Resposta
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* User View */
                    <>
                        {activeChatId && chatStatus === 'active' ? (
                            <ChatInterface chatId={activeChatId} isUser={true} onClose={() => {}} />
                        ) : activeChatId && chatStatus === 'waiting' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 animate-pulse">
                                    <Headphones className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Aguardando Atendimento</h3>
                                <p className="text-zinc-400 text-sm">Um administrador entrará no chat em breve. Por favor, aguarde.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex border-b border-white/5">
                                    <button 
                                        onClick={() => setActiveTab('live')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'live' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    >
                                        Suporte ao Vivo
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('ticket')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'ticket' ? 'text-white border-b-2 border-indigo-500 bg-white/5' : 'text-zinc-400 hover:text-zinc-200'}`}
                                    >
                                        Abrir Ticket
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4">
                                    {activeTab === 'live' ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                            {supportOnline ? (
                                                <>
                                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                                                        <Headphones className="w-10 h-10 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-xl">Estamos Online!</h3>
                                                        <p className="text-zinc-400 text-sm mt-2 max-w-[200px] mx-auto">Nossa equipe está pronta para te ajudar agora mesmo.</p>
                                                    </div>
                                                    <button 
                                                        onClick={handleStartChat}
                                                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-500/20 transition-all hover:scale-105"
                                                    >
                                                        Iniciar Chat
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center grayscale opacity-50">
                                                        <Clock className="w-10 h-10 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold text-xl">Suporte Offline</h3>
                                                        <p className="text-zinc-400 text-sm mt-2 max-w-[200px] mx-auto">No momento não há atendentes disponíveis. Por favor, abra um ticket.</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setActiveTab('ticket')}
                                                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-medium transition-all"
                                                    >
                                                        Ir para Tickets
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <form onSubmit={handleCreateTicket} className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-zinc-400 font-bold uppercase ml-1">Assunto</label>
                                                    <input 
                                                        value={ticketSubject}
                                                        onChange={e => setTicketSubject(e.target.value)}
                                                        className="w-full bg-[#1E1F22] border border-black/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-1"
                                                        placeholder="Ex: Problema com pagamento"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-zinc-400 font-bold uppercase ml-1">Mensagem</label>
                                                    <textarea 
                                                        value={ticketMessage}
                                                        onChange={e => setTicketMessage(e.target.value)}
                                                        className="w-full bg-[#1E1F22] border border-black/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mt-1"
                                                        placeholder="Descreva seu problema..."
                                                        rows={4}
                                                    />
                                                </div>
                                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold shadow-lg">
                                                    Enviar Ticket
                                                </button>
                                            </form>

                                            <div className="pt-6 border-t border-white/5">
                                                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-indigo-400" />
                                                    Seus Tickets
                                                </h4>
                                                <div className="space-y-2">
                                                    {tickets.length === 0 && <p className="text-zinc-500 text-xs italic">Nenhum histórico encontrado.</p>}
                                                    {tickets.map(ticket => (
                                                        <div key={ticket.id} className="bg-[#2B2D31] p-3 rounded-lg border border-white/5">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-bold text-white text-sm">{ticket.subject}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'answered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    {ticket.status === 'answered' ? 'Respondido' : 'Aberto'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-zinc-400 line-clamp-2">{ticket.message}</p>
                                                            {ticket.adminReply && (
                                                                <div className="mt-2 p-2 bg-indigo-500/10 rounded border border-indigo-500/20">
                                                                    <p className="text-xs text-indigo-300 font-bold mb-1">Resposta do Suporte:</p>
                                                                    <p className="text-xs text-zinc-300">{ticket.adminReply}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center transition-colors z-[100]"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
