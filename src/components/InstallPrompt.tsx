import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Handle beforeinstallprompt for Android/Desktop
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // The prompt can only be used once, so clear it
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;

  // Don't show anything if not iOS and no install prompt available yet
  if (!isIOS && !deferredPrompt) return null;

  return (
    <>
      <AnimatePresence>
        {/* Floating Install Button */}
        {(!showIOSPrompt) && (
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={handleInstallClick}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-colors duration-300 font-medium"
          >
            <Download className="w-5 h-5" />
            <span>Instalar App</span>
          </motion.button>
        )}

        {/* iOS Instructions Modal */}
        {showIOSPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIOSPrompt(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowIOSPrompt(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-4">Instalar no iOS</h3>
              
              <div className="space-y-4 text-zinc-300">
                <p>Para instalar este aplicativo no seu iPhone ou iPad:</p>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Share className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">1. Toque em Compartilhar</p>
                    <p className="text-xs text-zinc-500">Na barra inferior do Safari</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <div className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center">
                      <span className="text-lg leading-none font-bold">+</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">2. Adicionar à Tela de Início</p>
                    <p className="text-xs text-zinc-500">Role para baixo nas opções</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSPrompt(false)}
                className="w-full mt-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
