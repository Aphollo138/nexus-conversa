import { useState, useEffect } from 'react';
import Spline from '@splinetool/react-spline';
import { Globe, MessageSquare, Users, LogOut, ChevronRight, Settings, Ticket, Star, Menu, X, Phone, PhoneOff } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalChat from '../components/GlobalChat';
import Friends from '../components/Friends';
import Tickets from '../components/Tickets';
import SettingsModal from '../components/SettingsModal';
import PrivateChat from '../components/PrivateChat';
import Reviews from '../components/Reviews';
import VoiceCall from '../components/VoiceCall';
import VoiceMatch from '../components/VoiceMatch';
import WelcomeModal from '../components/WelcomeModal';

interface UserProfile {
  username?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerPosition?: number;
  location?: string;
  about?: string;
  uid?: string; // Added uid to interface for consistency
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('global');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home' | 'global' | 'private' | 'friends' | 'tickets' | 'reviews' | 'voice-match'
  const [privateChatTarget, setPrivateChatTarget] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Call State
  const [activeCall, setActiveCall] = useState<{
    id: string;
    isCaller: boolean;
    targetUser: { uid: string; username: string; avatarUrl: string };
  } | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    callerUser: { uid: string; username: string; avatarUrl: string };
  } | null>(null);

  const navigate = useNavigate();

  // Listen for Incoming Calls
  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', userProfile.uid),
      where('status', '==', 'ringing')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          setIncomingCall({
            id: change.doc.id,
            callerUser: {
              uid: data.callerId,
              username: data.callerName,
              avatarUrl: data.callerAvatar
            }
          });
        }
        if (change.type === 'removed' || (change.type === 'modified' && change.doc.data().status !== 'ringing')) {
             // If call is cancelled or answered elsewhere
             if (incomingCall?.id === change.doc.id) {
                 setIncomingCall(null);
             }
        }
      });
    });

    return () => unsubscribe();
  }, [userProfile?.uid, incomingCall]);

  // Online Status Tracking
  useEffect(() => {
    if (!userProfile?.uid) return;

    const userRef = doc(db, 'users', userProfile.uid);

    // 1. Set online immediately
    const setOnline = async () => {
      try {
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      } catch (err) {
        console.error("Error setting online status:", err);
      }
    };

    setOnline();

    // 2. Heartbeat every 30s
    const interval = setInterval(() => {
      setOnline();
    }, 30000);

    // 3. Set offline on disconnect/unload
    const handleDisconnect = () => {
       if (userProfile?.uid) {
           const userRef = doc(db, 'users', userProfile.uid);
           updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(console.error);
       }
    };

    window.addEventListener('beforeunload', handleDisconnect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleDisconnect);
      
      // Try to set offline on unmount (e.g. logout)
      if (userProfile?.uid) {
          const userRef = doc(db, 'users', userProfile.uid);
          updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(console.error);
      }
    };
  }, [userProfile?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
          } else {
             setUserProfile({ 
               uid: user.uid,
               username: user.displayName || 'User', 
               avatarUrl: user.photoURL || '',
               location: 'Unknown',
               about: 'Membro do Nexus desde 2024.',
               bannerPosition: 50
             });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsLoadingAuth(false);
        }
      } else {
        navigate('/');
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (isLoadingAuth) {
    return (
      <div className="bg-black h-[100dvh] w-full flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm tracking-widest uppercase animate-pulse">Carregando Nexus...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : 'US';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'global') {
      setActiveView('global');
    } else if (tab === 'private') {
      setActiveView('private');
    } else if (tab === 'friends') {
      setActiveView('friends');
    } else if (tab === 'tickets') {
      setActiveView('tickets');
    } else if (tab === 'reviews') {
      setActiveView('reviews');
    } else if (tab === 'voice-match') {
      setActiveView('voice-match');
    } else {
      setActiveView('home');
    }
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleStartPrivateChat = (targetUser: UserProfile) => {
    setPrivateChatTarget(targetUser);
    setActiveTab('private');
    setActiveView('private');
    setIsSidebarOpen(false);
  };

  const handleStartCall = async (targetUser: UserProfile) => {
    if (!userProfile || !targetUser.uid) return;
    
    try {
      const callDocRef = await addDoc(collection(db, 'calls'), {
        callerId: userProfile.uid,
        callerName: userProfile.username || 'Unknown',
        callerAvatar: userProfile.avatarUrl || '',
        calleeId: targetUser.uid,
        calleeName: targetUser.username || 'Unknown',
        calleeAvatar: targetUser.avatarUrl || '',
        status: 'ringing',
        createdAt: serverTimestamp()
      });

      setActiveCall({
        id: callDocRef.id,
        isCaller: true,
        targetUser: {
          uid: targetUser.uid,
          username: targetUser.username || 'Unknown',
          avatarUrl: targetUser.avatarUrl || ''
        }
      });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      id: incomingCall.id,
      isCaller: false,
      targetUser: incomingCall.callerUser
    });
    setIncomingCall(null);
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    try {
      await updateDoc(doc(db, 'calls', incomingCall.id), {
        status: 'rejected'
      });
      setIncomingCall(null);
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  return (
    <div className="bg-black h-[100dvh] w-full flex overflow-hidden text-white font-sans relative">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentUserProfile={userProfile}
        onUpdateProfile={setUserProfile}
      />

      {/* Mobile Header / Hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-lg"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Responsive */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-80 h-full bg-black border-r border-white/10 flex flex-col py-8 px-4 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        backdrop-blur-sm bg-opacity-95 md:bg-opacity-80
      `}>
        
        {/* Logo / Header Area */}
        <div className="px-6 mb-10 flex items-center gap-3 pl-12 md:pl-6">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)] overflow-hidden">
             <img 
               src="https://i.postimg.cc/Nyv42tvK/Chat-GPT-Image-1-de-mar-de-2026-15-17-54.png" 
               alt="Nexus Logo" 
               className="w-full h-full object-cover"
             />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Nexus</span>
        </div>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 w-full">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('global')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'global' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <Globe className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'global' ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-cyan-400'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'global' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Chat Global</span>
            {activeTab === 'global' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('private')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'private' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <MessageSquare className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'private' ? 'text-purple-400' : 'text-zinc-500 group-hover:text-purple-400'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'private' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Chat Privado</span>
            {activeTab === 'private' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            )}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('friends')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'friends' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <Users className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'friends' ? 'text-green-400' : 'text-zinc-500 group-hover:text-green-400'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'friends' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Amigos</span>
            {activeTab === 'friends' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            )}
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('voice-match')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'voice-match' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <Phone className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'voice-match' ? 'text-pink-500' : 'text-zinc-500 group-hover:text-pink-500'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'voice-match' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Call</span>
            {activeTab === 'voice-match' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
            )}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('tickets')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'tickets' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <Ticket className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'tickets' ? 'text-yellow-400' : 'text-zinc-500 group-hover:text-yellow-400'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'tickets' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Chamados</span>
            {activeTab === 'tickets' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            )}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => handleTabChange('reviews')}
            className={`w-full rounded-full px-6 py-4 flex items-center gap-4 transition-all duration-300 group relative ${activeTab === 'reviews' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'hover:bg-white/5'}`}
          >
            <Star className={`w-6 h-6 transition-colors duration-300 ${activeTab === 'reviews' ? 'text-orange-400' : 'text-zinc-500 group-hover:text-orange-400'}`} />
            <span className={`text-base font-medium transition-colors duration-300 ${activeTab === 'reviews' ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>Avaliações</span>
            {activeTab === 'reviews' && (
              <motion.div layoutId="active-pill" className="absolute right-4 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
            )}
          </motion.button>
        </div>

        {/* User Profile Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-full rounded-full p-3 flex items-center gap-4 transition-all duration-300 border border-transparent ${isProfileMenuOpen ? 'bg-white/10 border-white/5' : 'hover:bg-white/5 hover:border-white/5'}`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 flex items-center justify-center border border-white/10 shadow-lg shadow-black/50 overflow-hidden shrink-0">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{getInitials(userProfile?.username || '')}</span>
              )}
            </div>
            
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-bold text-white truncate w-full text-left">
                {userProfile?.username || 'User'}
              </span>
              <span className="text-xs text-zinc-500 truncate w-full text-left">
                @{userProfile?.username?.toLowerCase().replace(/\s+/g, '') || 'user'}
              </span>
            </div>

            <ChevronRight className={`w-4 h-4 text-zinc-600 ml-auto transition-transform duration-300 ${isProfileMenuOpen ? '-rotate-90' : ''}`} />
          </motion.button>
        </div>

        {/* Profile Popover */}
        <AnimatePresence>
          {isProfileMenuOpen && (
            <>
              {/* Backdrop to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsProfileMenuOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute bottom-28 left-4 right-4 z-50 bg-[#111214] border border-white/10 rounded-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Banner */}
                <div className="h-24 bg-[#1e1f22] w-full relative">
                  {userProfile?.bannerUrl && (
                    <img 
                      src={userProfile.bannerUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover" 
                      style={{ objectPosition: `center ${userProfile.bannerPosition || 50}%` }}
                    />
                  )}
                </div>

                <div className="px-4 pb-4 relative">
                  {/* Avatar */}
                  <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden group cursor-pointer">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-2xl font-bold text-zinc-500">{getInitials(userProfile?.username || '')}</span>
                      </div>
                    )}
                    {/* Online Status */}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#111214]"></div>
                  </div>
                  
                  <div className="pt-12 mb-4">
                    <h3 className="text-white font-bold text-xl tracking-tight leading-tight">{userProfile?.username || 'User'}</h3>
                    <p className="text-sm text-zinc-400">@{userProfile?.username?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                  </div>

                  <div className="w-full h-px bg-[#2e3035] mb-4"></div>

                  <div className="w-full space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider block">Sobre Mim</span>
                      <p className="text-sm text-zinc-300 leading-relaxed">{userProfile?.about || 'Membro do Nexus desde 2024.'}</p>
                    </div>

                    <button 
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all flex items-center justify-between group border border-white/5 hover:border-white/10 px-3 mt-4"
                    >
                      <span className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        Configurações
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full py-2 rounded hover:bg-red-500/10 text-red-500/80 hover:text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20 px-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden">
        {activeView === 'global' ? (
          <GlobalChat onStartPrivateChat={handleStartPrivateChat} />
        ) : activeView === 'private' ? (
          <PrivateChat initialTargetUser={privateChatTarget} onStartCall={handleStartCall} />
        ) : activeView === 'friends' ? (
          <Friends onStartPrivateChat={handleStartPrivateChat} />
        ) : activeView === 'tickets' ? (
          <Tickets onStartCall={handleStartCall} />
        ) : activeView === 'reviews' ? (
          <Reviews />
        ) : activeView === 'voice-match' ? (
          <VoiceMatch userProfile={userProfile} />
        ) : (
          /* Empty State / Home View */
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div className="w-full h-full absolute inset-0 opacity-60">
               <Spline scene="https://prod.spline.design/leRYPQ9l8BH5V2or/scene.splinecode" className="w-full h-full" />
            </div>
            
            <div className="z-20 mt-[40vh] text-center px-4">
              <p className="text-zinc-500 text-sm uppercase tracking-[0.2em] font-medium animate-pulse">
                Selecione uma frequência para iniciar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Voice Call Overlay */}
      <AnimatePresence>
        {activeCall && (
          <VoiceCall 
            callId={activeCall.id}
            isCaller={activeCall.isCaller}
            targetUser={activeCall.targetUser}
            onEndCall={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* Incoming Call Alert */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
           <motion.div 
             initial={{ y: -100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: -100, opacity: 0 }}
             className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-[#111214] border border-white/10 rounded-xl p-4 shadow-2xl flex items-center gap-6 min-w-[320px]"
           >
              <div className="relative">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700">
                    {incomingCall.callerUser.avatarUrl ? (
                      <img src={incomingCall.callerUser.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                        {incomingCall.callerUser.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#111214] animate-pulse"></div>
              </div>
              
              <div className="flex-1">
                 <h3 className="text-white font-bold text-sm">Recebendo chamada...</h3>
                 <p className="text-zinc-400 text-xs">{incomingCall.callerUser.username}</p>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={handleRejectCall}
                   className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all"
                 >
                   <PhoneOff className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={handleAcceptCall}
                   className="p-3 bg-green-500 text-white hover:bg-green-400 rounded-full transition-all shadow-lg shadow-green-500/20 animate-bounce"
                 >
                   <Phone className="w-5 h-5" />
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
      
      {/* Welcome Modal */}
      <WelcomeModal />
    </div>
  );
}
