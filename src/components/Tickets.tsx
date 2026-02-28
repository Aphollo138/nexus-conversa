import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, Send, CheckCircle, Clock, MessageSquare, AlertCircle, 
  Search, Filter, ArrowLeft, Star, Trash2, Play, CheckSquare, 
  MoreHorizontal, User, Shield, Calendar, X, Hash, LayoutDashboard,
  FileText, ThumbsUp, History, ChevronRight, Plus, Flame, Briefcase,
  ChevronDown, Paperclip, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { 
  collection, addDoc, query, where, orderBy, onSnapshot, 
  serverTimestamp, updateDoc, doc, arrayUnion, Timestamp, getDoc, deleteDoc 
} from 'firebase/firestore';

const ADMIN_UID = 'wh59n1VtHcXhNfKqYLYA10aNrBD2';

// --- Types ---
interface Interaction {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'message' | 'resolution' | 'system';
  createdAt: any;
}

interface TicketMetrics {
  createdAt: any;
  startedAt?: any;
  closedAt?: any;
}

interface TicketData {
  id: string;
  displayId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhoto: string;
  subject: string;
  category?: string;
  priority?: 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
  status: 'open' | 'pending' | 'waiting_customer' | 'closed';
  interactions: Interaction[];
  metrics: TicketMetrics;
  rating?: { score: number; comment: string } | null;
}

// --- Helpers ---
const formatDate = (timestamp: any) => {
  if (!timestamp) return '-';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
  }).format(date);
};

const getStatusBadge = (status: string) => {
  const styles = {
    open: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    waiting_customer: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    closed: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };
  
  const labels = {
    open: "Novo Chamado",
    pending: "Em Andamento",
    waiting_customer: "Aguardando Cliente",
    closed: "Encerrado",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status as keyof typeof styles] || styles.closed}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

const getPriorityBadge = (priority: string = 'Normal') => {
  const styles = {
    Baixa: "bg-zinc-500/20 text-zinc-400",
    Normal: "bg-blue-500/20 text-blue-400",
    Alta: "bg-orange-500/20 text-orange-400",
    Urgente: "bg-red-500/20 text-red-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[priority as keyof typeof styles]}`}>
      {priority}
    </span>
  );
};

// --- Components ---

const StatCard = ({ title, count, icon: Icon, colorClass }: { title: string, count: number, icon: any, colorClass: string }) => (
  <div className="bg-[#1e1e24] border border-white/5 rounded-xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-white/10 transition-colors">
    <div className={`absolute right-2 top-2 p-2 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">{title}</span>
    <span className="text-3xl font-bold text-white">{count}</span>
  </div>
);

export default function Tickets() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Dúvida',
    priority: 'Normal',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail/Chat State
  const [replyText, setReplyText] = useState('');
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [ticketUser, setTicketUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (auth.currentUser) {
      setIsAdmin(auth.currentUser.uid === ADMIN_UID);
    }
  }, []);

  useEffect(() => {
    if (selectedTicket?.userId) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', selectedTicket.userId));
          if (userDoc.exists()) {
            setTicketUser(userDoc.data());
          } else {
            setTicketUser(null);
          }
        } catch (error) {
          console.error("Error fetching ticket user:", error);
          setTicketUser(null);
        }
      };
      fetchUser();
    } else {
      setTicketUser(null);
    }
  }, [selectedTicket]);

  // ... (existing useEffect for fetching tickets) ...

  // Sync selectedTicket with real-time updates from tickets list
  useEffect(() => {
    if (selectedTicket) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket && JSON.stringify(updatedTicket) !== JSON.stringify(selectedTicket)) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (selectedTicket?.interactions) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.interactions]);

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        status: 'closed',
        'metrics.closedAt': serverTimestamp()
      });
      // Optimistic update
      setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
    } catch (error) {
      console.error("Error closing ticket:", error);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      await deleteDoc(doc(db, 'tickets', ticketToDelete));
      if (selectedTicket?.id === ticketToDelete) setSelectedTicket(null);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = isAdmin 
      ? query(collection(db, 'tickets'))
      : query(collection(db, 'tickets'), where('userId', '==', uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketData));
      docs.sort((a, b) => {
        const dateA = a.metrics?.createdAt?.toDate ? a.metrics.createdAt.toDate().getTime() : 0;
        const dateB = b.metrics?.createdAt?.toDate ? b.metrics.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setTickets(docs);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      let userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Usuário';
      let userPhoto = auth.currentUser.photoURL || '';

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.username) userName = userData.username;
          if (userData.avatarUrl) userPhoto = userData.avatarUrl;
        }
      } catch (err) {
        console.error("Error fetching user profile for ticket:", err);
      }

      const displayId = 'CH-' + Math.floor(1000 + Math.random() * 9000);
      const initialInteraction: Interaction = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: auth.currentUser.uid,
        senderName: userName,
        text: formData.message,
        type: 'message',
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'tickets'), {
        displayId,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: userName,
        userPhoto: userPhoto,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        status: 'open',
        interactions: [initialInteraction],
        metrics: { createdAt: serverTimestamp() }
      });

      setShowModal(false);
      setFormData({ subject: '', category: 'Dúvida', priority: 'Normal', message: '' });
    } catch (error) {
      console.error("Error creating ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!auth.currentUser || !selectedTicket || !replyText.trim()) return;

    let senderName = auth.currentUser.displayName || (isAdmin ? 'Suporte' : 'Usuário');
    
    // Fetch user data for accurate name
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.username) senderName = userData.username;
      } else if (!isAdmin) {
         // If regular user and no profile doc, try to use email username
         senderName = auth.currentUser.email?.split('@')[0] || 'Usuário';
      }
    } catch (err) {
      console.error("Error fetching user profile for reply:", err);
    }

    const interaction: Interaction = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: auth.currentUser.uid,
      senderName: senderName,
      text: replyText,
      type: 'message',
      createdAt: Timestamp.now()
    };

    const updates: any = {
      interactions: arrayUnion(interaction),
      status: isAdmin ? 'waiting_customer' : 'pending'
    };

    await updateDoc(doc(db, 'tickets', selectedTicket.id), updates);
    setReplyText('');
  };

  // Metrics Calculation
  const metrics = {
    new: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    waiting: tickets.filter(t => t.status === 'waiting_customer').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    delayed: tickets.filter(t => t.status !== 'closed' && (new Date().getTime() - (t.metrics?.createdAt?.toDate?.()?.getTime() || 0)) > 86400000 * 2).length
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111116] text-zinc-300 font-sans overflow-hidden">
      
      {/* Header / Toolbar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#16161c] shrink-0">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-5 h-5 text-indigo-500" />
          <h1 className="text-white font-semibold tracking-tight">Gestão de Chamados</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="bg-[#1e1e24] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500/50 w-32 md:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Chamado</span><span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* KPI Cards */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard title="Novas Tarefas" count={metrics.new} icon={FileText} colorClass="text-emerald-500 bg-emerald-500" />
            <StatCard title="Em Andamento" count={metrics.pending} icon={Play} colorClass="text-blue-500 bg-blue-500" />
            <StatCard title="Aguardando" count={metrics.waiting} icon={Clock} colorClass="text-amber-500 bg-amber-500" />
            <StatCard title="Para Hoje" count={0} icon={Calendar} colorClass="text-purple-500 bg-purple-500" />
            <StatCard title="Para Esta Semana" count={0} icon={Briefcase} colorClass="text-indigo-500 bg-indigo-500" />
            <StatCard title="Em Atraso" count={metrics.delayed} icon={Flame} colorClass="text-red-500 bg-red-500" />
          </div>
        )}

        {/* Ticket List Table */}
        <div className="bg-[#16161c] border border-white/5 rounded-xl overflow-hidden shadow-xl">
          {/* Table Header - Hidden on Mobile */}
          <div className="hidden md:grid grid-cols-[80px_140px_100px_1fr_200px_120px] gap-4 px-6 py-3 border-b border-white/5 bg-[#1e1e24] text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div>ID</div>
            <div>Situação</div>
            <div>Prioridade</div>
            <div>Tarefa</div>
            <div>Responsável</div>
            <div className="text-right">Criada em</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {tickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="flex flex-col md:grid md:grid-cols-[80px_140px_100px_1fr_200px_120px] gap-2 md:gap-4 px-4 md:px-6 py-4 items-start md:items-center hover:bg-white/[0.02] cursor-pointer transition-colors group"
              >
                {/* Mobile Header: ID, Status, Priority */}
                <div className="flex items-center justify-between w-full md:hidden mb-2">
                   <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500">#{ticket.displayId}</span>
                      {getStatusBadge(ticket.status)}
                   </div>
                   {getPriorityBadge(ticket.priority)}
                </div>

                {/* Desktop Columns */}
                <div className="hidden md:block font-mono text-xs text-zinc-500">#{ticket.displayId}</div>
                <div className="hidden md:block">{getStatusBadge(ticket.status)}</div>
                <div className="hidden md:block">{getPriorityBadge(ticket.priority)}</div>
                
                {/* Subject & Last Message */}
                <div className="min-w-0 w-full">
                  <div className="font-medium text-white text-sm truncate">{ticket.subject}</div>
                  <div className="text-zinc-500 text-xs truncate mt-0.5">{ticket.interactions?.[0]?.text}</div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                    <img src={ticket.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ticket.userId}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-zinc-300 truncate max-w-[140px]">{ticket.userName || ticket.userEmail?.split('@')[0] || 'Usuário'}</span>
                    <span className="text-[10px] text-zinc-600">Solicitante</span>
                  </div>
                </div>

                {/* Date */}
                <div className="text-right text-xs text-zinc-500 w-full md:w-auto mt-1 md:mt-0">
                  {formatDate(ticket.metrics?.createdAt)}
                </div>
              </div>
            ))}
            
            {tickets.length === 0 && (
              <div className="p-12 flex flex-col items-center justify-center text-zinc-600">
                <Ticket className="w-12 h-12 mb-4 opacity-20" />
                <p>Nenhum chamado encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#16161c] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#1e1e24]">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  Novo Chamado
                </h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Contato *</label>
                    <div className="bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-300 flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500" />
                      {auth.currentUser?.displayName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Cliente *</label>
                    <div className="bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-zinc-500" />
                      Nexus Corp
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Assunto *</label>
                  <input 
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="Resumo da solicitação"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Categoria</label>
                    <div className="relative">
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option>Dúvida</option>
                        <option>Problema Técnico</option>
                        <option>Financeiro</option>
                        <option>Sugestão</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Prioridade</label>
                    <div className="relative">
                      <select 
                        value={formData.priority}
                        onChange={e => setFormData({...formData, priority: e.target.value})}
                        className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option>Baixa</option>
                        <option>Normal</option>
                        <option>Alta</option>
                        <option>Urgente</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Descrição Detalhada *</label>
                  <textarea 
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none min-h-[120px] resize-none"
                    placeholder="Descreva o problema..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/5 bg-[#1e1e24] flex justify-end gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateTicket}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Chamado'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Detail View (Full Screen) */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#0f1014] flex flex-col font-sans"
          >
            
            {/* 1. Top Navigation Bar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-[#16161c] shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-white/10"></div>
                <span className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tarefas | {selectedTicket.category || 'Geral'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                 {isAdmin && (
                  <button 
                    onClick={() => setTicketToDelete(selectedTicket.id)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Ticket Header Info (Gray Bar) */}
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 bg-[#16161c] shadow-sm shrink-0">
              {/* Row 1: Title & ID */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                  <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">#{selectedTicket.displayId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Público</span>
                </div>
                <h1 className="text-xl font-bold text-white leading-tight">{selectedTicket.subject}</h1>
              </div>

              {/* Row 2: Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                
                {/* Status */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Situação</span>
                  <div>{getStatusBadge(selectedTicket.status)}</div>
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Prioridade</span>
                  <div>{getPriorityBadge(selectedTicket.priority)}</div>
                </div>

                {/* Abertura */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Abertura</span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{formatDate(selectedTicket.metrics?.createdAt)}</span>
                  </div>
                </div>

                {/* Iniciar até (Mock +2h) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Iniciar até</span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{selectedTicket.metrics?.createdAt ? formatDate(new Timestamp(selectedTicket.metrics.createdAt.seconds + 7200, 0)) : '-'}</span>
                  </div>
                </div>

                {/* Encerrar até (Mock +2d) */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Encerrar até</span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 mt-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    <span>{selectedTicket.metrics?.createdAt ? formatDate(new Timestamp(selectedTicket.metrics.createdAt.seconds + 172800, 0)) : '-'}</span>
                  </div>
                </div>

                {/* Responsible */}
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Responsável</span>
                   <div className="flex items-center gap-2 mt-0.5">
                     <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                       <img src={isAdmin ? (auth.currentUser?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin") : "https://api.dicebear.com/7.x/avataaars/svg?seed=Support"} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs font-medium text-white">{isAdmin ? 'Você' : 'Suporte'}</span>
                       <span className="text-[10px] text-zinc-500">{isAdmin ? 'Admin' : 'Atendimento'}</span>
                     </div>
                   </div>
                </div>

              </div>
            </div>

            {/* 3. Action Bar (Reativar, Encerrar) */}
            <div className="px-4 md:px-8 py-2 border-b border-white/5 bg-[#16161c] flex gap-3 shrink-0 overflow-x-auto">
              <button className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors">
                <History className="w-3.5 h-3.5" /> Histórico
              </button>
              {isAdmin && selectedTicket.status !== 'closed' && (
                <button 
                  onClick={handleCloseTicket}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Encerrar
                </button>
              )}
            </div>

            {/* 4. Main Workspace (Sidebar + Content) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Sidebar - Collapsible on Mobile */}
              <details className="group md:hidden border-b border-white/5 bg-[#131318] shrink-0">
                <summary className="px-4 py-3 flex items-center justify-between cursor-pointer list-none text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Informações do Chamado</span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="p-4 space-y-4 border-t border-white/5 bg-[#131318]">
                   {/* Client Info */}
                   <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Solicitante</span>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                        <img src={ticketUser?.avatarUrl || selectedTicket.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTicket.userId}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{ticketUser?.username || selectedTicket.userName || selectedTicket.userEmail?.split('@')[0] || 'Usuário'}</h4>
                        <p className="text-xs text-zinc-500 truncate">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Fields */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-500">Origem</span>
                        <span className="text-zinc-500">Tipo</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-zinc-300">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Via agente</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Solicitação</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Categoria</span>
                      <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {selectedTicket.category?.substring(0, 2).toUpperCase() || 'CH'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{selectedTicket.category || 'Geral'}</span>
                          <span className="text-[10px] text-zinc-500">Suporte</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              {/* Desktop Sidebar (Always visible) */}
              <div className="hidden md:flex w-80 border-r border-white/5 bg-[#131318] flex-col shrink-0 h-full overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">
                  
                  {/* Client Info */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Solicitante</span>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0">
                        <img src={ticketUser?.avatarUrl || selectedTicket.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTicket.userId}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{ticketUser?.username || selectedTicket.userName || selectedTicket.userEmail?.split('@')[0] || 'Usuário'}</h4>
                        <p className="text-xs text-zinc-500 truncate">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Followers */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Seguidores</span>
                    <div className="flex -space-x-2 overflow-hidden py-1">
                      <button className="h-8 w-8 rounded-full bg-zinc-800 ring-2 ring-[#131318] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors border border-white/5">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Fields */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-500">Origem</span>
                        <span className="text-zinc-500">Tipo</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-zinc-300">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> Via agente</span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Solicitação</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Categoria</span>
                      <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                        <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {selectedTicket.category?.substring(0, 2).toUpperCase() || 'CH'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{selectedTicket.category || 'Geral'}</span>
                          <span className="text-[10px] text-zinc-500">Suporte</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-medium">
                      <ArrowLeft className="w-3 h-3" /> Voltar para lista
                    </button>
                  </div>

                </div>
              </div>

              {/* Center Content (Timeline) */}
              <div className="flex-1 flex flex-col bg-[#0f1014] min-w-0">
                
                {/* Tabs */}
                <div className="flex items-center gap-4 md:gap-8 px-4 md:px-8 border-b border-white/5 bg-[#16161c] shrink-0 overflow-x-auto">
                  {['Comentários', 'Anexos', 'Atividades', 'Histórico'].map((tab, i) => (
                    <button 
                      key={tab}
                      className={`py-3 md:py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${i === 0 ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {i === 0 && <MessageSquare className="w-4 h-4" />}
                      {i === 1 && <Paperclip className="w-4 h-4" />}
                      {i === 2 && <Play className="w-4 h-4" />}
                      {i === 3 && <History className="w-4 h-4" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                  
                  <div className="flex justify-center">
                    <button className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full transition-colors">
                      <History className="w-3 h-3" /> Mostrar anteriores
                    </button>
                  </div>

                  {selectedTicket.interactions?.map((msg, idx) => {
                    const isMe = msg.senderId === auth.currentUser?.uid;
                    const isAdminMsg = msg.senderId === ADMIN_UID;
                    
                    return (
                      <div key={idx} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shrink-0 mt-1">
                          {isAdminMsg ? (
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className="w-full h-full object-cover" />
                          ) : (
                            <img src={ticketUser?.avatarUrl || selectedTicket.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTicket.userId}`} className="w-full h-full object-cover" />
                          )}
                        </div>
                        
                        <div className="flex-1 max-w-4xl">
                          {/* Interaction Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{msg.senderName || (isMe ? (auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]) : 'Usuário')}</span>
                            <span className="text-xs text-zinc-500">{formatDate(msg.createdAt)}</span>
                            <span className="text-[10px] text-zinc-600 flex items-center gap-1 bg-white/5 px-1.5 rounded">
                              <Shield className="w-2.5 h-2.5" /> Público
                            </span>
                            {isAdminMsg && (
                              <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" /> Via agente
                              </span>
                            )}
                          </div>

                          {/* Interaction Body */}
                          <div className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap ${isAdminMsg ? 'bg-[#1e1e24]/50 -mx-4 p-4 rounded-xl border border-white/5' : ''}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Reply Area */}
                <div className="bg-[#16161c] border-t border-white/5 p-6 shrink-0 z-10">
                  <div className="max-w-5xl mx-auto">
                    {/* Reply Type Tabs */}
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="replyType" defaultChecked className="accent-indigo-500" />
                        <span className="text-sm font-medium text-white">Responder</span>
                      </label>
                      {isAdmin && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="replyType" className="accent-zinc-500" />
                          <span className="text-sm font-medium text-zinc-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Registro interno</span>
                        </label>
                      )}
                    </div>

                    {/* Text Area */}
                    <div className="bg-[#0f1014] border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors shadow-sm">
                      <textarea 
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        className="w-full bg-transparent p-4 text-sm text-white focus:outline-none resize-none min-h-[100px]"
                      />
                      {/* Toolbar */}
                      <div className="bg-[#1e1e24] px-4 py-2 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-white/5"><Paperclip className="w-4 h-4" /></button>
                          <div className="w-px h-4 bg-white/10 mx-1"></div>
                          <button className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-white/5 font-bold serif">B</button>
                          <button className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-white/5 italic serif">I</button>
                        </div>
                        <div className="flex items-center gap-3">
                          {isAdmin && (
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-white">
                              <input type="checkbox" className="rounded border-zinc-700 bg-zinc-800" />
                              Responder e encerrar
                            </label>
                          )}
                          <button 
                            onClick={handleReply}
                            disabled={!replyText.trim()}
                            className="px-6 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Enviar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {ticketToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#16161c] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Excluir Chamado?</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Tem certeza que deseja excluir este chamado permanentemente? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setTicketToDelete(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteTicket}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
