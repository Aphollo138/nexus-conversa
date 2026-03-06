import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mic, MicOff, PhoneOff, Send, User, Search, X } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp, 
  setDoc, 
  getDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';

// WebRTC Configuration
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

interface VoiceMatchProps {
  userProfile: any;
}

export default function VoiceMatch({ userProfile }: VoiceMatchProps) {
  const [matchState, setMatchState] = useState<'setup' | 'searching' | 'matched'>('setup');
  const [myGender, setMyGender] = useState('male');
  const [preferredGender, setPreferredGender] = useState('any');
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  
  // Call State
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Refs
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const unsubscribeMatchRef = useRef<(() => void) | null>(null);
  const unsubscribeCallRef = useRef<(() => void) | null>(null);

  // --- MATCHMAKING LOGIC ---

  const startMatchmaking = async () => {
    if (!userProfile?.uid) return;
    setMatchState('searching');

    try {
      // 1. Search for a waiting user in the queue
      const queueRef = collection(db, 'match_queue');
      
      // Query for users waiting with matching preferences
      // Note: Firestore queries are limited. We need to find someone who:
      // - status == 'waiting'
      // - preferredGender == 'any' OR preferredGender == myGender
      // - myGender == 'any' OR myGender == theirGender
      // - uid != myUid
      
      // Simplified query strategy: Get waiting users and filter client-side for complex matching logic
      // In production, this should be a Cloud Function or more specific queries.
      const q = query(
        queueRef, 
        where('status', '==', 'waiting'),
        limit(10) // Get a batch to check
      );

      const snapshot = await getDocs(q);
      let foundMatch = null;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.uid === userProfile.uid) continue; // Skip self

        // Check compatibility
        const isTheyCompatible = data.preferredGender === 'any' || data.preferredGender === myGender;
        const amICompatible = preferredGender === 'any' || preferredGender === data.myGender;

        if (isTheyCompatible && amICompatible) {
          foundMatch = { id: docSnap.id, ...data };
          break;
        }
      }

      if (foundMatch) {
        // --- MATCH FOUND! ---
        // 1. Generate Call ID
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCallId(newCallId);
        setPartnerProfile({
          uid: foundMatch.uid,
          username: foundMatch.username,
          avatarUrl: foundMatch.avatarUrl
        });

        // 2. Update their request to 'matched' with callId
        await updateDoc(doc(db, 'match_queue', foundMatch.id), {
          status: 'matched',
          callId: newCallId,
          matchedWith: userProfile.uid
        });

        // 3. Create the call document immediately
        await setDoc(doc(db, 'calls', newCallId), {
          participants: [userProfile.uid, foundMatch.uid],
          createdAt: serverTimestamp(),
          status: 'active'
        });

        // 4. Start Call as Initiator (Caller)
        setMatchState('matched');
        initializeCall(newCallId, true);

      } else {
        // --- NO MATCH FOUND, WAIT IN QUEUE ---
        const docRef = await addDoc(collection(db, 'match_queue'), {
          uid: userProfile.uid,
          username: userProfile.username || 'User',
          avatarUrl: userProfile.avatarUrl || '',
          myGender,
          preferredGender,
          status: 'waiting',
          createdAt: serverTimestamp()
        });
        
        setMatchRequestId(docRef.id);

        // Listen for updates to my request
        unsubscribeMatchRef.current = onSnapshot(doc(db, 'match_queue', docRef.id), async (snapshot) => {
          const data = snapshot.data();
          if (data && data.status === 'matched' && data.callId) {
            // Someone matched with me!
            setCallId(data.callId);
            
            // Fetch partner info (we need to know who matched us)
            // In a real app, the matcher should write their info to my doc, or I fetch the call doc
            // Let's fetch the call doc to find the other participant
            const callDoc = await getDoc(doc(db, 'calls', data.callId));
            if (callDoc.exists()) {
               // This part is tricky without partner info in the match doc. 
               // Ideally the matcher writes their info to the match doc.
               // For now, let's assume we can get it from the call participants or similar.
               // Let's update the matcher logic to write 'matchedWith' uid.
               if (data.matchedWith) {
                 const userDoc = await getDoc(doc(db, 'users', data.matchedWith));
                 if (userDoc.exists()) {
                   setPartnerProfile(userDoc.data());
                 }
               }
            }

            setMatchState('matched');
            initializeCall(data.callId, false); // I am the Callee
          }
        });
      }

    } catch (error) {
      console.error("Error in matchmaking:", error);
      setMatchState('setup');
    }
  };

  const cancelSearch = async () => {
    if (matchRequestId) {
      if (unsubscribeMatchRef.current) unsubscribeMatchRef.current();
      await deleteDoc(doc(db, 'match_queue', matchRequestId));
      setMatchRequestId(null);
    }
    setMatchState('setup');
  };

  // --- WEBRTC LOGIC ---

  const initializeCall = async (currentCallId: string, isCaller: boolean) => {
    try {
      pc.current = new RTCPeerConnection(servers);

      // Get Local Stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStream.current = stream;
      stream.getTracks().forEach((track) => {
        pc.current?.addTrack(track, stream);
      });

      // Handle Remote Stream
      pc.current.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          if (remoteStream.current) {
            remoteStream.current.addTrack(track);
          } else {
            remoteStream.current = new MediaStream([track]);
          }
        });
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream.current;
        }
        setCallStatus('connected');
      };

      // Signaling
      const callDocRef = doc(db, 'calls', currentCallId);
      const offerCandidates = collection(callDocRef, 'offerCandidates');
      const answerCandidates = collection(callDocRef, 'answerCandidates');

      if (isCaller) {
        // Caller Logic
        pc.current.onicecandidate = (event) => {
          if (event.candidate) addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);
        
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await updateDoc(callDocRef, { offer });

        onSnapshot(callDocRef, (snapshot) => {
          const data = snapshot.data();
          if (!pc.current?.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current.setRemoteDescription(answerDescription);
          }
        });

        onSnapshot(answerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.current?.addIceCandidate(candidate);
            }
          });
        });

      } else {
        // Callee Logic
        pc.current.onicecandidate = (event) => {
          if (event.candidate) addDoc(answerCandidates, event.candidate.toJSON());
        };

        const callDoc = await getDoc(callDocRef);
        const callData = callDoc.data();

        if (callData?.offer) {
          await pc.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
          const answerDescription = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answerDescription);
          
          const answer = { sdp: answerDescription.sdp, type: answerDescription.type };
          await updateDoc(callDocRef, { answer });
        }

        onSnapshot(offerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.current?.addIceCandidate(candidate);
            }
          });
        });
      }

      // Chat Listener
      const messagesRef = collection(db, 'calls', currentCallId, 'messages');
      const q = query(messagesRef); // Order by createdAt if needed
      unsubscribeCallRef.current = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort manually if needed or use orderBy in query
        msgs.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setMessages(msgs);
      });

    } catch (error) {
      console.error("Error initializing call:", error);
    }
  };

  const endCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    if (pc.current) {
      pc.current.close();
    }
    if (unsubscribeCallRef.current) unsubscribeCallRef.current();
    if (unsubscribeMatchRef.current) unsubscribeMatchRef.current();
    
    // Cleanup Firestore if needed (optional)
    
    setMatchState('setup');
    setCallId(null);
    setPartnerProfile(null);
    setMessages([]);
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !callId || !userProfile) return;

    try {
      await addDoc(collection(db, 'calls', callId, 'messages'), {
        text: newMessage,
        senderId: userProfile.uid,
        senderName: userProfile.username,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // --- RENDER ---

  return (
    <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden relative">
      
      {/* SETUP STATE */}
      {matchState === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Phone className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Voice Match</h2>
            <p className="text-zinc-400 text-center mb-8 text-sm">Encontre alguém para conversar agora mesmo.</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Eu sou</label>
                <div className="relative">
                  <select 
                    value={myGender}
                    onChange={(e) => setMyGender(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Procurando por</label>
                <div className="relative">
                  <select 
                    value={preferredGender}
                    onChange={(e) => setPreferredGender(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="any">Qualquer pessoa</option>
                    <option value="male">Homem</option>
                    <option value="female">Mulher</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={startMatchmaking}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mt-4"
              >
                Buscar Conexão
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SEARCHING STATE */}
      {matchState === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="relative flex items-center justify-center">
            {/* Radar Rings */}
            <div className="absolute w-64 h-64 border border-indigo-500/30 rounded-full animate-ping opacity-20 duration-[3000ms]" />
            <div className="absolute w-48 h-48 border border-indigo-500/40 rounded-full animate-ping opacity-40 delay-700 duration-[3000ms]" />
            <div className="absolute w-32 h-32 bg-indigo-500/10 rounded-full animate-pulse" />
            
            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)]">
              <Search className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>

          <h3 className="mt-12 text-xl font-bold text-white tracking-tight">Procurando alguém especial...</h3>
          <p className="text-zinc-500 text-sm mt-2">Isso não deve demorar muito.</p>

          <button 
            onClick={cancelSearch}
            className="mt-12 px-8 py-3 rounded-full border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancelar Busca
          </button>
        </div>
      )}

      {/* MATCHED STATE */}
      {matchState === 'matched' && (
        <div className="flex-1 flex h-full w-full p-4 gap-4 overflow-hidden">
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
          
          {/* Left Area: Voice Call */}
          <div className="flex-1 bg-[#111214] border border-white/5 rounded-2xl flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-6 left-0 right-0 text-center z-10">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
                 <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                 <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                   {callStatus === 'connected' ? 'Conectado' : 'Conectando...'}
                 </span>
               </div>
            </div>

            {/* Avatars Container */}
            <div className="flex-1 flex items-center justify-center gap-8 md:gap-16 px-4">
              
              {/* Me */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                   <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden shadow-2xl">
                     {userProfile?.avatarUrl ? (
                       <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-zinc-600" /></div>
                     )}
                   </div>
                   {isMuted && (
                     <div className="absolute bottom-0 right-0 bg-red-500 p-2 rounded-full border-4 border-[#111214]">
                       <MicOff className="w-4 h-4 text-white" />
                     </div>
                   )}
                </div>
                <span className="font-bold text-zinc-300">Você</span>
              </div>

              {/* Partner */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                   {/* Speaking Indicator */}
                   <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                   
                   <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-zinc-800 border-4 border-zinc-700 overflow-hidden shadow-2xl">
                     {partnerProfile?.avatarUrl ? (
                       <img src={partnerProfile.avatarUrl} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-zinc-600" /></div>
                     )}
                   </div>
                </div>
                <span className="font-bold text-zinc-300">{partnerProfile?.username || 'Parceiro'}</span>
              </div>

            </div>

            {/* Controls */}
            <div className="h-24 flex items-center justify-center gap-6 pb-6">
               <button 
                 onClick={toggleMute}
                 className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
               >
                 {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </button>
               
               <button 
                 onClick={endCall}
                 className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-105 transition-all shadow-lg shadow-red-500/20"
               >
                 <PhoneOff className="w-7 h-7" />
               </button>
            </div>
          </div>

          {/* Right Area: Mini Chat */}
          <div className="w-80 bg-[#111214] border border-white/5 rounded-2xl flex flex-col overflow-hidden hidden md:flex">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="font-bold text-sm text-white">Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === userProfile?.uid;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-white/5 bg-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite algo..."
                  className="w-full bg-black/50 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
