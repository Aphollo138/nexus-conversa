import { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, Menu, X, User, DoorOpen, Zap, Shield, Globe, Mic, MessageSquare, Video as VideoIcon, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hook to check for mobile/tablet
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent pt-6 mix-blend-difference">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://i.postimg.cc/Nyv42tvK/Chat-GPT-Image-1-de-mar-de-2026-15-17-54.png" 
              alt="Nexus Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-bold text-2xl tracking-widest text-white">NEXUS</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-12">
              <button onClick={() => scrollToSection('home')} className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide uppercase">Home</button>
              <button onClick={() => scrollToSection('features')} className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide uppercase">Funcionalidades</button>
              <button onClick={() => scrollToSection('demo')} className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide uppercase">Demo</button>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate('/login')}
              className="text-white hover:text-white/70 text-sm font-medium transition-colors tracking-wide uppercase"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-2 rounded-full border border-white text-white text-sm font-medium hover:bg-white hover:text-black transition-all duration-300 tracking-wide uppercase"
            >
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-black border-b border-white/10"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <button onClick={() => scrollToSection('home')} className="text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Home</button>
            <button onClick={() => scrollToSection('features')} className="text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Funcionalidades</button>
            <button onClick={() => scrollToSection('demo')} className="text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Demo</button>
            <div className="pt-4 flex flex-col gap-2">
              <button 
                onClick={() => navigate('/login')}
                className="w-full text-left text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full border border-white text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();
  
  return (
    <section id="home" className="relative w-full min-h-screen flex flex-col items-center justify-center z-10 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-8xl leading-[0.9] mb-8 tracking-tighter">
            <span className="block text-white">A NOVA ERA</span>
            <span className="block text-white/50">DA CONVERSA</span>
            <span className="block text-white">DIGITAL.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Transforme a interação digital. Inteligência artificial e design imersivo unificados para experiências inesquecíveis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full mb-16">
            <button 
              onClick={() => navigate('/signup')}
              className="group relative px-8 py-4 rounded-full bg-white text-black font-medium text-lg transition-all duration-300 hover:bg-gray-200 w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-full border border-white/30 text-white font-medium text-lg hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
            >
              Fazer Login
            </button>
          </div>
        </motion.div>

        {/* Robot Mascot */}
        <div className="flex justify-center mt-16 md:mt-24 relative">
          {/* Efeito de luz atrás do robô */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full"></div>
          
          {/* O Robô */}
          <img 
            src="https://cdn-icons-png.flaticon.com/512/8133/8133391.png" 
            alt="Mascote Robô" 
            className="relative w-64 h-64 md:w-80 md:h-80 object-contain animate-[bounce_3s_ease-in-out_infinite] drop-shadow-[0_0_30px_rgba(79,70,229,0.3)] z-10"
          />
        </div>

        {/* System Status */}
        <div className="mt-16 flex items-center justify-center gap-8 text-gray-500 text-xs font-mono tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </div>
          <div>v2.4.0 Stable</div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const isMobile = useIsMobile();
  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Ligação por Áudio",
      description: "Qualidade cristalina. Converse com amigos e grupos com latência ultra-baixa e supressão de ruído por IA."
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Mensagens Privadas",
      description: "Segurança total. Suas conversas são criptografadas e entregues instantaneamente."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Chat Global",
      description: "Conecte-se com o mundo. Participe de comunidades vibrantes e descubra novas conexões."
    }
  ];

  return (
    <section id="features" className="relative w-full min-h-screen bg-black flex items-center py-20 overflow-hidden">
      {/* 3D Boat Background - Desktop Only */}
      <div className="absolute right-0 bottom-0 w-full lg:w-2/3 h-full pointer-events-none z-0">
        <Spline 
          scene="https://prod.spline.design/phdEYajKh5P-P9Kx/scene.splinecode"
          className="w-full h-full opacity-80 hidden lg:block"
        />
        {/* Gradient Masks for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Mobile Background - Clean Dark/White */}
      {isMobile && (
         <div className="absolute inset-0 z-0 bg-black">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
         </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-12 tracking-tight">
                CONEXÃO <br />
                <span className="text-white/40">SEM LIMITES.</span>
              </h2>
            </motion.div>

            <div className="flex flex-col gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className={`group p-6 sm:p-8 rounded-2xl border transition-all duration-500 ${isMobile ? 'bg-white/5 border-white/10 hover:bg-white hover:border-white' : 'bg-black/50 backdrop-blur-sm border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]'}`}
                >
                  <div className={`mb-4 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] ${isMobile ? 'text-white group-hover:text-black' : 'text-white group-hover:text-white'}`}>
                    {feature.icon}
                  </div>
                  <h3 className={`font-display font-bold text-xl mb-2 tracking-wide uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] ${isMobile ? 'text-white group-hover:text-black' : 'text-white'}`}>
                    {feature.title}
                  </h3>
                  <p className={`font-medium leading-relaxed transition-colors drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] ${isMobile ? 'text-zinc-400 group-hover:text-zinc-800' : 'text-zinc-300 group-hover:text-white'}`}>
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="relative w-full min-h-screen bg-black flex items-center justify-center py-24 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-white">
          Veja o Chat em <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Ação</span>
        </h2>

        {/* Premium Hero Video (Moved Here) */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative w-full max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.15)] border border-white/10 aspect-video group"
        >
          {/* Vídeo de fundo em loop */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[2s]"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-young-woman-texting-on-her-smartphone-4340-large.mp4" type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>

          {/* Gradiente Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Floating UI Elements (Glassmorphism) */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left Bubble */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-12 left-8 md:bottom-20 md:left-16 bg-white/10 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-3xl rounded-bl-none max-w-[200px] md:max-w-xs shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">JD</div>
                <span className="text-xs text-white/60 font-medium">John Doe</span>
              </div>
              <p className="text-sm md:text-base text-white font-medium leading-snug">
                A interface desse app é de outro mundo! 🚀
              </p>
            </motion.div>

            {/* Right Bubble */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 2.5, duration: 0.8 }}
              className="absolute top-12 right-8 md:top-20 md:right-16 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 p-4 md:p-6 rounded-3xl rounded-tr-none max-w-[200px] md:max-w-xs shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2 justify-end">
                <span className="text-xs text-white/60 font-medium">Você</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-xs font-bold">EU</div>
              </div>
              <p className="text-sm md:text-base text-white font-medium leading-snug text-right">
                Sim! E a qualidade do vídeo é absurda. 🎥✨
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-950 text-white flex flex-col relative">
      {/* Hero 3D Background Layer */}
      <div className="fixed inset-0 z-0 grayscale opacity-40 pointer-events-none">
        {/* Mobile: Cube Scene */}
        <div className="lg:hidden w-full h-full">
           <Spline 
             scene="https://prod.spline.design/hd0VqQkFQpvwQJXy/scene.splinecode"
             className="w-full h-full scale-125"
           />
        </div>
        
        {/* Desktop: Robot Scene (Original) */}
        <div className="hidden lg:block w-full h-full">
           <Spline 
             scene="https://prod.spline.design/dnN6ZvuJBbyN2Va1/scene.splinecode"
             className="w-full h-full translate-x-1/4"
           />
        </div>

        {/* Overlay gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950 pointer-events-none" />
      </div>

      <Navbar />
      <Hero />
      <div className="relative z-10 bg-zinc-950">
        <Features />
        <DemoSection />
      </div>
    </div>
  );
}
