import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Share2, MessageSquare, Users } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome_v1');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcome_v1', 'true');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Conheça nossa Comunidade!',
          text: 'Estou usando este app incrível em fase beta. Venha conferir!',
          url: window.location.origin,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#16161c] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 pt-8 text-center relative z-0">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <Heart className="w-8 h-8 text-indigo-400 fill-indigo-400/20 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo à Fase Beta! 🚀</h2>
              
              <div className="space-y-4 text-zinc-300 text-sm leading-relaxed mb-8">
                <p>
                  Este projeto está sendo desenvolvido com muito carinho por um <span className="text-indigo-400 font-semibold">pequeno grupo de desenvolvedores</span> apaixonados.
                </p>
                <p>
                  Estamos em constante evolução e <strong>sempre ouvindo a comunidade</strong> para trazer melhorias. Se encontrar algum bug ou tiver sugestões, não hesite em nos avisar!
                </p>
              </div>

              <div className="bg-[#1e1e24] rounded-xl p-4 mb-8 border border-white/5">
                <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wider font-bold">Gostou do que viu?</p>
                <button 
                  onClick={handleShare}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all group"
                >
                  <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Compartilhar com amigos
                </button>
              </div>

              <button 
                onClick={handleClose}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98]"
              >
                Entendi, vamos lá!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
