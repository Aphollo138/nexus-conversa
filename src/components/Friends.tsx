import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, MessageSquare, MoreVertical, Check, X, Ban, Unlock } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  uid: string;
  username: string;
  avatarUrl: string;
  status?: string;
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  senderName: string;
  senderAvatar: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

interface FriendsProps {
  onStartPrivateChat: (user: User) => void;
}

export default function Friends({ onStartPrivateChat }: FriendsProps) {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('online');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendQuery, setAddFriendQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]); // UIDs of users we sent requests to

  // Fetch Friends
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = collection(db, 'users', auth.currentUser.uid, 'friends');
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendsList: User[] = [];
      for (const docSnap of snapshot.docs) {
        // Fetch full user details for each friend
        const userRef = doc(db, 'users', docSnap.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            friendsList.push({ uid: docSnap.id, ...userSnap.data() } as User);
        } else {
             // Fallback if user doc missing
             friendsList.push({ uid: docSnap.id, username: 'Unknown', avatarUrl: '' });
        }
      }
      setFriends(friendsList);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Pending Requests (Received)
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      setPendingRequests(reqs);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Blocked Users
  useEffect(() => {
      if (!auth.currentUser) return;
      const q = collection(db, 'users', auth.currentUser.uid, 'blocked');
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const blocked: any[] = [];
          snapshot.forEach(doc => {
              blocked.push({ uid: doc.id, ...doc.data() });
          });
          setBlockedUsers(blocked);
      });
      return () => unsubscribe();
  }, []);

  // Fetch Sent Requests (to know who we already added)
  useEffect(() => {
      if (!auth.currentUser) return;
      const q = query(
          collection(db, 'friendRequests'),
          where('from', '==', auth.currentUser.uid),
          where('status', '==', 'pending')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const sent: string[] = [];
          snapshot.forEach(doc => {
              sent.push(doc.data().to);
          });
          setSentRequests(sent);
      });
      return () => unsubscribe();
  }, []);

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      // 1. Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), { status: 'accepted' });

      // 2. Add to my friends
      await setDoc(doc(db, 'users', auth.currentUser!.uid, 'friends', request.from), {
        createdAt: serverTimestamp()
      });

      // 3. Add me to sender's friends
      await setDoc(doc(db, 'users', request.from, 'friends', auth.currentUser!.uid), {
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const handleUnblockUser = async (blockedUid: string) => {
      if (!auth.currentUser) return;
      try {
          await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'blocked', blockedUid));
      } catch (error) {
          console.error("Error unblocking user:", error);
      }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!addFriendQuery.trim()) return;

      try {
          // Simple search by exact username match (Firestore doesn't support partial text search easily without external services like Algolia)
          // For a better UX, we might fetch all users and filter client-side if the user base is small, 
          // but for scalability, we'd need a proper search solution.
          // Here we'll try to find users where username >= query and username <= query + '\uf8ff'
          
          const usersRef = collection(db, 'users');
          const q = query(
              usersRef, 
              where('username', '>=', addFriendQuery),
              where('username', '<=', addFriendQuery + '\uf8ff')
          );
          
          const querySnapshot = await getDocs(q);
          const results: User[] = [];
          querySnapshot.forEach((doc) => {
              if (doc.id !== auth.currentUser?.uid) {
                  results.push({ uid: doc.id, ...doc.data() } as User);
              }
          });
          setSearchResults(results);
      } catch (error) {
          console.error("Error searching users:", error);
      }
  };

  const sendFriendRequest = async (targetUser: User) => {
      if (!auth.currentUser) return;
      try {
          // Get my details
          const myDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const myData = myDoc.data();

          await addDoc(collection(db, 'friendRequests'), {
              from: auth.currentUser.uid,
              to: targetUser.uid,
              senderName: myData?.username || auth.currentUser.displayName,
              senderAvatar: myData?.avatarUrl || auth.currentUser.photoURL,
              receiverName: targetUser.username,
              receiverAvatar: targetUser.avatarUrl,
              status: 'pending',
              createdAt: serverTimestamp()
          });
          // Update local state immediately for UI feedback
          setSentRequests(prev => [...prev, targetUser.uid]);
      } catch (error) {
          console.error("Error sending request:", error);
      }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#313338] w-full">
      {/* Header */}
      <div className="h-auto min-h-[3.5rem] border-b border-[#26272D] flex flex-col md:flex-row items-start md:items-center px-4 py-2 md:py-0 shadow-sm shrink-0 gap-2 md:gap-0 pl-14 md:pl-4">
        <div className="flex items-center mr-4 shrink-0">
          <Users className="w-5 h-5 text-zinc-400 mr-2" />
          <h2 className="font-bold text-white text-base">Amigos</h2>
          <div className="w-px h-6 bg-white/10 mx-4 hidden md:block"></div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('online')}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'online' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            Disponível
          </button>
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            Pendente
            {pendingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('blocked')}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'blocked' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            Bloqueados
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'add' ? 'bg-green-600 text-white' : 'bg-green-700 text-zinc-200'}`}
          >
            Adicionar Amigo
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {activeTab === 'add' ? (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-white font-bold text-xl mb-2">Adicionar Amigo</h3>
            <p className="text-zinc-400 text-sm mb-6">Você pode adicionar amigos com o nome de usuário deles.</p>
            
            <form onSubmit={handleSearchUsers} className="relative mb-8">
              <input 
                type="text" 
                value={addFriendQuery}
                onChange={(e) => setAddFriendQuery(e.target.value)}
                placeholder="Nome de usuário"
                className="w-full bg-[#1e1f22] border border-[#1e1f22] rounded-lg py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors sm:placeholder:text-zinc-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <span className="hidden sm:inline">Enviar Pedido de Amizade</span>
                <span className="sm:hidden">Enviar</span>
              </button>
            </form>

            {searchResults.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-zinc-400 text-xs font-bold uppercase mb-4">Resultados</h4>
                    {searchResults.map(user => {
                        const isFriend = friends.some(f => f.uid === user.uid);
                        const isPending = sentRequests.includes(user.uid);
                        const isBlocked = blockedUsers.some(b => b.uid === user.uid);

                        return (
                            <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg bg-[#2B2D31] hover:bg-[#35373C] transition-colors border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                                {user.username.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-white font-bold block">{user.username}</span>
                                        <span className="text-zinc-400 text-xs">@{user.username.toLowerCase().replace(/\s/g, '')}</span>
                                    </div>
                                </div>
                                
                                {isFriend ? (
                                    <span className="text-green-500 text-sm font-medium flex items-center gap-1"><Check className="w-4 h-4" /> Amigo</span>
                                ) : isPending ? (
                                    <span className="text-zinc-400 text-sm font-medium">Pedido Enviado</span>
                                ) : isBlocked ? (
                                     <span className="text-red-500 text-sm font-medium flex items-center gap-1"><Ban className="w-4 h-4" /> Bloqueado</span>
                                ) : (
                                    <button 
                                        onClick={() => sendFriendRequest(user)}
                                        className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors"
                                        title="Enviar Pedido"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div className="mt-12 flex flex-col items-center justify-center text-center">
                <div className="w-48 h-48 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                    <img src="https://discord.com/assets/a188414ce83f2454b9d71a47c3d95909.svg" alt="Wumpus" className="w-32 opacity-50" />
                </div>
                <p className="text-zinc-400 text-sm">Outras formas de adicionar amigos em breve.</p>
            </div>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="max-w-3xl mx-auto">
             <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4">Pendente — {pendingRequests.length}</h3>
             {pendingRequests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                     <img src="https://discord.com/assets/b669713872143c95563d.svg" alt="Empty" className="w-40 mb-4 opacity-50" />
                     <p>Não há pedidos pendentes. Tem certeza que você é popular?</p>
                 </div>
             ) : (
                 <div className="space-y-2">
                     {pendingRequests.map(req => (
                         <div key={req.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group border-t border-white/5">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                     {req.senderAvatar ? (
                                         <img src={req.senderAvatar} alt={req.senderName} className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                             {req.senderName?.slice(0, 2).toUpperCase()}
                                         </div>
                                     )}
                                 </div>
                                 <div>
                                     <span className="text-white font-bold block">{req.senderName}</span>
                                     <span className="text-zinc-400 text-xs">Pedido de Amizade Recebido</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <button 
                                   onClick={() => handleAcceptRequest(req)}
                                   className="w-9 h-9 rounded-full bg-[#2B2D31] hover:bg-green-600 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                 >
                                     <Check className="w-5 h-5" />
                                 </button>
                                 <button 
                                   onClick={() => handleRejectRequest(req.id)}
                                   className="w-9 h-9 rounded-full bg-[#2B2D31] hover:bg-red-500 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                 >
                                     <X className="w-5 h-5" />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        ) : activeTab === 'blocked' ? (
            <div className="max-w-3xl mx-auto">
                <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4">Bloqueados — {blockedUsers.length}</h3>
                {blockedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <Ban className="w-16 h-16 mb-4 opacity-50" />
                        <p>Você não bloqueou ninguém. Que alma pura!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {blockedUsers.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                                        {user.username?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="text-white font-bold block">{user.username}</span>
                                        <span className="text-red-400 text-xs">Bloqueado</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleUnblockUser(user.uid)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                    <Unlock className="w-4 h-4" />
                                    Desbloquear
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
          /* Online / All Friends List */
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full bg-[#1e1f22] rounded px-4 py-1.5 text-sm text-zinc-200 placeholder-zinc-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2" />
            </div>

            <h3 className="text-zinc-400 text-xs font-bold uppercase mb-4">
              {activeTab === 'online' ? 'Disponível' : 'Todos os Amigos'} — {filteredFriends.length}
            </h3>

            <div className="space-y-2">
              {filteredFriends.map(friend => (
                <div 
                  key={friend.uid}
                  onClick={() => onStartPrivateChat(friend)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 cursor-pointer group border-t border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.username} className="w-9 h-9 rounded-full object-cover bg-zinc-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                          {friend.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Online Status (Mock) */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#313338] ${activeTab === 'online' ? 'bg-green-500' : 'bg-zinc-500'}`}></div>
                    </div>
                    <div>
                      <span className="text-white font-bold block text-sm">{friend.username}</span>
                      <span className="text-zinc-400 text-xs">{friend.status || (activeTab === 'online' ? 'Online' : 'Offline')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-full bg-[#2B2D31] hover:bg-[#1e1f22] text-zinc-400 hover:text-zinc-200 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#2B2D31] hover:bg-[#1e1f22] text-zinc-400 hover:text-zinc-200 flex items-center justify-center">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
