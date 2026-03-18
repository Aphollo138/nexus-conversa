import { useState, FormEvent, useEffect } from 'react';
import OptimizedSpline from '../components/OptimizedSpline';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';
import OnboardingWizard from '../components/OnboardingWizard';

export default function SignUp() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const checkUsernameUnique = async (usernameToCheck: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', usernameToCheck));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Por favor, escolha um nome de usuário.');
      return;
    }

    try {
      // 1. Check if username is unique (Best effort)
      try {
        const isUnique = await checkUsernameUnique(cleanUsername);
        if (!isUnique) {
          setError('Esse nome de usuário já está em uso. Escolha outro.');
          return;
        }
      } catch (checkErr: any) {
        // If permission error (likely because we are not logged in yet and rules are strict),
        // we proceed and let the auth creation happen. 
        // Ideally, we should have a public 'usernames' collection or a Cloud Function, 
        // but for this client-side only demo, we'll proceed.
        console.warn("Skipping pre-auth username check due to error:", checkErr);
      }

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Create User Document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: cleanUsername,
        name: name,
        email: email,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false // Will be set to true by OnboardingWizard
      });

      // Show onboarding instead of redirecting immediately
      setShowOnboarding(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        // If email already exists, try to sign in instead
        try {
          await signInWithEmailAndPassword(auth, email, password);
          // If sign in successful, redirect to home (or onboarding if needed)
          navigate('/dashboard');
        } catch (signInErr: any) {
             setError('Email já cadastrado. Erro ao fazer login: ' + signInErr.message);
        }
      } else {
        setError(err.message || 'Erro ao criar conta');
      }
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-black overflow-hidden text-white relative">
      {/* Onboarding Wizard Overlay */}
      {showOnboarding && (
        <OnboardingWizard initialUsername={username} onComplete={() => navigate('/dashboard')} />
      )}

      {/* Left Panel - Form */}
      <div className="w-full md:w-[500px] h-full flex flex-col justify-center px-8 sm:px-12 bg-black border-r border-white/10 z-20 relative">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
        >
          <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium tracking-wide uppercase">Voltar</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="flex flex-col items-start mb-10">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/20 mb-6 overflow-hidden">
                <img 
                  src="https://i.postimg.cc/jDfHpdjL/Chat_GPT_Image_14_de_mar_de_2026_10_15_19_removebg_preview.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
            <h2 className="font-display text-3xl text-white font-bold tracking-tight">Criar Conta</h2>
            <p className="text-zinc-400 mt-2 text-sm">Acesse o futuro da conversação.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-8">
            <div className="space-y-6">
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="peer w-full bg-transparent border-b border-zinc-800 py-3 text-white focus:outline-none focus:border-white transition-all placeholder-transparent"
                  placeholder="Name"
                  id="name"
                  required
                />
                <label 
                  htmlFor="name"
                  className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-white peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-zinc-400 cursor-text"
                >
                  Nome Completo
                </label>
              </div>

              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`peer w-full bg-transparent border-b py-3 text-white focus:outline-none transition-all placeholder-transparent ${error.includes('usuário') ? 'border-red-500' : 'border-zinc-800 focus:border-white'}`}
                  placeholder="Username"
                  id="username"
                  required
                />
                <label 
                  htmlFor="username"
                  className={`absolute left-0 top-3 text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs cursor-text ${error.includes('usuário') ? 'text-red-500' : 'text-zinc-500 peer-focus:text-white peer-not-placeholder-shown:text-zinc-400'}`}
                >
                  Nome de Usuário
                </label>
                {error.includes('usuário') && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>

              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full bg-transparent border-b border-zinc-800 py-3 text-white focus:outline-none focus:border-white transition-all placeholder-transparent"
                  placeholder="Email"
                  id="email"
                  required
                />
                <label 
                  htmlFor="email"
                  className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-white peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-zinc-400 cursor-text"
                >
                  Endereço de Email
                </label>
              </div>

              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full bg-transparent border-b border-zinc-800 py-3 text-white focus:outline-none focus:border-white transition-all placeholder-transparent"
                  placeholder="Password"
                  id="password"
                  required
                />
                <label 
                  htmlFor="password"
                  className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-5 peer-focus:text-xs peer-focus:text-white peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-not-placeholder-shown:-top-5 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-zinc-400 cursor-text"
                >
                  Sua Senha
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wider text-sm"
            >
              Criar Conta
            </button>
          </form>

          <div className="mt-10">
            <p className="text-zinc-500 text-sm">
              Já é membro?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-white hover:text-zinc-300 transition-colors font-medium ml-1"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - 3D Scene */}
      {!isMobile && (
        <div className="hidden md:block flex-1 relative bg-black h-full">
          <div className="absolute inset-0 z-0">
             <OptimizedSpline scene="https://prod.spline.design/leRYPQ9l8BH5V2or/scene.splinecode" className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
