import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  addDoc, 
  getDoc, 
  deleteDoc 
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

interface VoiceCallProps {
  callId: string;
  isCaller: boolean;
  targetUser: {
    uid: string;
    username: string;
    avatarUrl: string;
  };
  onEndCall: () => void;
}

export default function VoiceCall({ callId, isCaller, targetUser, onEndCall }: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const startCall = async () => {
      try {
        // 0. Check Permissions/Support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Seu navegador não suporta chamadas de áudio ou o acesso ao microfone foi bloqueado. Verifique se está usando HTTPS.");
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (err) {
          console.error("Microphone permission denied:", err);
          throw new Error("Permissão de microfone negada. Por favor, permita o acesso ao microfone para usar o chat de voz.");
        }

        // 1. Initialize PeerConnection
        pc.current = new RTCPeerConnection(servers);

        // 2. Get Local Stream (Audio Only)
        localStream.current = stream;
        
        // Add tracks to PeerConnection
        stream.getTracks().forEach((track) => {
          pc.current?.addTrack(track, stream);
        });

        // 3. Handle Remote Stream
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
          setCallStatus('active');
        };

        // 4. Signaling Logic
        const callDocRef = doc(db, 'calls', callId);
        const offerCandidates = collection(callDocRef, 'offerCandidates');
        const answerCandidates = collection(callDocRef, 'answerCandidates');

        const pendingCandidates: RTCIceCandidateInit[] = [];

        if (isCaller) {
          // --- CALLER LOGIC ---
          setCallStatus('ringing');
          
          // Handle ICE Candidates
          pc.current.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(offerCandidates, event.candidate.toJSON());
            }
          };

          // Create Offer
          const offerDescription = await pc.current.createOffer();
          await pc.current.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };

          // Save Offer to Firestore
          await setDoc(callDocRef, { offer, status: 'ringing' }, { merge: true });

          // Listen for Answer
          unsubscribeRef.current = onSnapshot(callDocRef, async (snapshot) => {
            const data = snapshot.data();
            if (!pc.current?.currentRemoteDescription && data?.answer) {
              const answerDescription = new RTCSessionDescription(data.answer);
              await pc.current.setRemoteDescription(answerDescription);
              
              pendingCandidates.forEach(c => pc.current?.addIceCandidate(new RTCIceCandidate(c)));
              pendingCandidates.length = 0;
            }
            // Check if call ended remotely
            if (data?.status === 'ended' || data?.status === 'rejected') {
                handleEndCall();
            }
          });

          // Listen for Answer Candidates
          onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = change.doc.data() as RTCIceCandidateInit;
                if (pc.current?.remoteDescription) {
                  pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                  pendingCandidates.push(candidate);
                }
              }
            });
          });

        } else {
          // --- CALLEE LOGIC ---
          
          // Handle ICE Candidates
          pc.current.onicecandidate = (event) => {
            if (event.candidate) {
              addDoc(answerCandidates, event.candidate.toJSON());
            }
          };

          // Fetch Offer
          const callDoc = await getDoc(callDocRef);
          const callData = callDoc.data();
          
          if (callData?.offer) {
             const offerDescription = callData.offer;
             await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

             // Create Answer
             const answerDescription = await pc.current.createAnswer();
             await pc.current.setLocalDescription(answerDescription);

             const answer = {
               type: answerDescription.type,
               sdp: answerDescription.sdp,
             };

             // Save Answer to Firestore
             await updateDoc(callDocRef, { answer, status: 'active' });
             
             pendingCandidates.forEach(c => pc.current?.addIceCandidate(new RTCIceCandidate(c)));
             pendingCandidates.length = 0;
          }

          // Listen for Offer Candidates
          onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = change.doc.data() as RTCIceCandidateInit;
                if (pc.current?.remoteDescription) {
                  pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                  pendingCandidates.push(candidate);
                }
              }
            });
          });
          
          // Listen for call end
          unsubscribeRef.current = onSnapshot(callDocRef, (snapshot) => {
              const data = snapshot.data();
              if (data?.status === 'ended') {
                  handleEndCall();
              }
          });
        }

      } catch (error: any) {
        console.error("Error starting call:", error);
        setErrorMessage(error.message || "Erro ao iniciar chamada.");
      }
    };

    startCall();

    return () => {
      // Cleanup on unmount
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
        localStream.current = null;
      }
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
    };
  }, [callId, isCaller]); // Run once on mount (or if callId changes)

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = async () => {
    setCallStatus('ended');
    
    // Stop tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    
    // Close PeerConnection
    if (pc.current) {
      pc.current.close();
    }

    // Update/Delete Firestore Doc
    try {
        const callDocRef = doc(db, 'calls', callId);
        // Mark as ended first so other peer knows
        await updateDoc(callDocRef, { status: 'ended' });
    } catch (err) {
        console.error("Error ending call doc:", err);
    }

    onEndCall();
  };

  // --- UI RENDER ---
  if (errorMessage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl">
        <div className="bg-[#111214] border border-red-500/20 p-8 rounded-xl max-w-md text-center shadow-2xl">
           <PhoneOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
           <h3 className="text-white font-bold text-lg mb-2">Erro na Chamada</h3>
           <p className="text-zinc-400 text-sm mb-6">{errorMessage}</p>
           <button 
             onClick={onEndCall}
             className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
           >
             Fechar
           </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl"
    >
      {/* Invisible Audio Element for Remote Stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <div className="w-full max-w-4xl flex flex-col items-center justify-between h-full py-12 px-4 md:h-auto md:py-20">
        
        {/* Header / Status */}
        <div className="text-center mb-12">
           <h2 className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">
             {callStatus === 'connecting' ? 'Conectando...' : 
              callStatus === 'ringing' ? 'Chamando...' :
              callStatus === 'active' ? 'Chamada em Andamento' : 'Encerrando...'}
           </h2>
           <div className="flex items-center justify-center gap-2">
             <div className={`w-2 h-2 rounded-full ${callStatus === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
             <span className="text-white font-medium">
               {callStatus === 'active' ? 'Voz Conectada' : 'Aguardando...'}
             </span>
           </div>
        </div>

        {/* Avatars Area */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full">
          
          {/* Local User (Me) */}
          <div className="flex flex-col items-center gap-4 relative group">
             {/* Pulse Effect */}
             <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse group-hover:bg-indigo-500/30 transition-all duration-1000" />
             
             <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl z-10">
                {auth.currentUser?.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <User className="w-16 h-16 text-zinc-500" />
                  </div>
                )}
                {isMuted && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <MicOff className="w-10 h-10 text-red-500" />
                   </div>
                )}
             </div>
             <span className="text-white font-bold text-lg tracking-tight">Você</span>
          </div>

          {/* Connection Line (Desktop) */}
          <div className="hidden md:flex flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent max-w-[100px]" />

          {/* Remote User (Target) */}
          <div className="flex flex-col items-center gap-4 relative">
             {/* Pulse Effect (Active) */}
             {callStatus === 'active' && (
               <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse duration-[2000ms]" />
             )}
             
             <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl z-10">
                {targetUser.avatarUrl ? (
                  <img src={targetUser.avatarUrl} alt={targetUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <User className="w-16 h-16 text-zinc-500" />
                  </div>
                )}
             </div>
             <span className="text-white font-bold text-lg tracking-tight">{targetUser.username}</span>
          </div>

        </div>

        {/* Controls Footer */}
        <div className="mt-16 md:mt-24 flex items-center gap-6 bg-black/40 backdrop-blur-md px-8 py-4 rounded-full border border-white/5 shadow-xl">
           <button 
             onClick={toggleMute}
             className={`p-4 rounded-full transition-all duration-300 ${isMuted ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
           >
             {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
           </button>
           
           <button 
             onClick={handleEndCall}
             className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-105"
           >
             <PhoneOff className="w-6 h-6" />
           </button>
        </div>

      </div>
    </motion.div>
  );
}
