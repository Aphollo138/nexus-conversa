import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Image as ImageIcon, Check, Loader2, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete?: () => void;
  initialUsername?: string;
}

export default function OnboardingWizard({ onComplete, initialUsername = '' }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(initialUsername);
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const navigate = useNavigate();

  // Simulated city search (to avoid CORS/API complexity for this demo)
  // In a real app, you would fetch from an API like BrasilAPI
  useEffect(() => {
    if (location.length > 2) {
      // Mock data for demonstration
      const mockCities = [
        'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG',
        'Curitiba, PR', 'Porto Alegre, RS', 'Salvador, BA',
        'Brasília, DF', 'Fortaleza, CE', 'Recife, PE', 'Manaus, AM'
      ].filter(city => city.toLowerCase().includes(location.toLowerCase()));
      setCities(mockCities);
      setShowCityDropdown(true);
    } else {
      setCities([]);
      setShowCityDropdown(false);
    }
  }, [location]);

  const handleNext = () => {
    if (step === 1 && !username.trim()) return;
    if (step === 2 && !location.trim()) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        username,
        location,
        avatarUrl: avatarUrl || 'https://picsum.photos/200', // Default avatar
        onboardingCompleted: true,
        // Don't overwrite createdAt if it exists, but we can't easily check here without a read.
        // Since we are merging, if we don't include createdAt, it won't be overwritten if it exists.
        // But if it doesn't exist (legacy), we might want to set it.
        // For now, let's assume SignUp created it, or we add updated_at.
      }, { merge: true });
      
      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 rounded-full overflow-hidden -mt-8">
          <motion.div 
            className="h-full bg-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <AnimatePresence mode='wait' custom={step}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-zinc-900/90 border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <User className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Identidade</h2>
              <p className="text-zinc-400 text-center mb-8">Como devemos te chamar neste universo?</p>
              
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 px-6 text-xl text-center text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-zinc-600"
                placeholder="Seu Username"
                autoFocus
              />

              <button
                onClick={handleNext}
                disabled={!username.trim()}
                className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-zinc-900/90 border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <MapPin className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Localização</h2>
              <p className="text-zinc-400 text-center mb-8">De onde você está se conectando?</p>
              
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 px-6 text-xl text-center text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-zinc-600"
                  placeholder="Cidade, Estado"
                  autoFocus
                />
                
                {showCityDropdown && cities.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-10">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city);
                          setShowCityDropdown(false);
                        }}
                        className="w-full text-left px-6 py-3 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border-b border-zinc-700/50 last:border-0"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!location.trim()}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-zinc-900/90 border border-purple-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)]"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <ImageIcon className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Avatar</h2>
              <p className="text-zinc-400 text-center mb-8">Cole a URL de uma imagem para seu perfil.</p>
              
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 rounded-full bg-black border-2 border-purple-500 overflow-hidden relative shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <img 
                    src={avatarUrl || 'https://picsum.photos/200'} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/200';
                    }}
                  />
                  {!avatarUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-xs text-zinc-400">Preview</span>
                    </div>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 px-6 text-sm text-center text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-zinc-600"
                placeholder="https://exemplo.com/sua-foto.jpg"
                autoFocus
              />

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  Pular / Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={1}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-black/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-0 overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]"
            >
              {/* Holographic Header */}
              <div className="h-32 bg-gradient-to-r from-purple-900 to-blue-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
              </div>

              <div className="px-8 pb-8 relative -mt-16 text-center">
                {/* Avatar with Glow */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 rounded-full"></div>
                  <div className="w-32 h-32 rounded-full border-4 border-black bg-zinc-900 relative z-10 overflow-hidden">
                    <img 
                      src={avatarUrl || 'https://picsum.photos/200'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-black z-20"></div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                  {username}
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </h2>
                <p className="text-purple-400 font-medium mb-6 flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" /> {location}
                </p>

                <div className="bg-zinc-900/50 rounded-xl p-4 mb-8 border border-white/5">
                  <div className="flex justify-between text-sm text-zinc-400 mb-2">
                    <span>Status</span>
                    <span className="text-green-400">Online</span>
                  </div>
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>Nível</span>
                    <span className="text-purple-400">Iniciado</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
