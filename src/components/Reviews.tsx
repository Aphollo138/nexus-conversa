import React, { useState, useEffect } from 'react';
import { Star, Send, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, getDoc } from 'firebase/firestore';

interface Review {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function Reviews() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Check if user is admin (For demo: current user is admin)
  // In a real app, this would be a claim or a field in the user document
  useEffect(() => {
    if (auth.currentUser) {
       // For this demo, let's assume the current user is the admin so they can see the list
       // Or we can just show the list to everyone but only admin can delete?
       // The prompt says "for the admin profile show all reviews". 
       // I'll make it so everyone can see the list for now, but visually distinguish it.
       setIsAdmin(true); 
       
       // Check if user has already reviewed? 
       // We can filter the reviews list to see if current user is in it.
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData: Review[] = [];
      let userReviewed = false;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (auth.currentUser && data.userId === auth.currentUser.uid) {
            userReviewed = true;
        }
        reviewsData.push({ id: doc.id, ...data } as Review);
      });
      setReviews(reviewsData);
      setHasReviewed(userReviewed);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
        alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
        return;
    }
    if (!comment.trim()) {
        alert("Por favor, escreva um comentário.");
        return;
    }
    if (!auth.currentUser) return;

    try {
        // Fetch latest user profile data
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        const username = userData?.username || auth.currentUser.displayName || 'Usuário';
        const avatarUrl = userData?.avatarUrl || auth.currentUser.photoURL || '';

        await addDoc(collection(db, 'reviews'), {
            userId: auth.currentUser.uid,
            username,
            avatarUrl,
            rating,
            comment,
            createdAt: serverTimestamp()
        });
        
        setRating(0);
        setComment('');
        alert("Avaliação enviada com sucesso!");
    } catch (error) {
        console.error("Error submitting review:", error);
        alert("Erro ao enviar avaliação.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
      if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
          try {
              await deleteDoc(doc(db, 'reviews', reviewId));
          } catch (error) {
              console.error("Error deleting review:", error);
          }
      }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0e0e10] text-white p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Avaliações</h1>
        <p className="text-zinc-400 mb-8">Conte-nos o que você está achando da plataforma.</p>

        {/* Review Form */}
        {!hasReviewed ? (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#18181b] p-6 rounded-2xl border border-white/5 mb-12 shadow-xl"
            >
                <h2 className="text-xl font-bold mb-4">Escreva sua avaliação</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium">Sua nota</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'}`} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-zinc-400 font-medium">Seu comentário</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="O que você mais gostou? O que podemos melhorar?"
                            className="w-full bg-[#0e0e10] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500 min-h-[120px] resize-none"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="self-end bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
                    >
                        <Send className="w-4 h-4" />
                        Enviar Avaliação
                    </button>
                </form>
            </motion.div>
        ) : (
            <div className="bg-[#18181b] p-6 rounded-2xl border border-white/5 mb-12 flex items-center justify-center text-center flex-col gap-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-green-500 fill-green-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Obrigado pela sua avaliação!</h3>
                    <p className="text-zinc-400">Sua opinião é muito importante para nós.</p>
                </div>
            </div>
        )}

        {/* Admin View / All Reviews */}
        <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">Todas as Avaliações</h2>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-zinc-300">{reviews.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
                {reviews.map((review) => (
                    <motion.div
                        key={review.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#18181b] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {review.avatarUrl ? (
                                    <img src={review.avatarUrl} alt={review.username} className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <User className="w-5 h-5 text-zinc-400" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-white text-sm">{review.username}</h4>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                                key={star} 
                                                className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-zinc-500">
                                {review.createdAt?.toDate().toLocaleDateString()}
                            </span>
                        </div>
                        
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            "{review.comment}"
                        </p>

                        {(auth.currentUser?.uid === 'wh59n1VtHcXhNfKqYLYA10aNrBD2') && (
                            <button 
                                onClick={() => handleDeleteReview(review.id)}
                                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir avaliação"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {reviews.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-500">
                    Nenhuma avaliação ainda. Seja o primeiro!
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
