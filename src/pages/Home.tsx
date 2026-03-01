import { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { motion, useScroll, useTransform } from 'framer-motion';
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
              <button onClick={() => scrollToSection('simulation')} className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide uppercase">Demo</button>
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
            <button onClick={() => scrollToSection('simulation')} className="text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left">Demo</button>
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
    <section id="home" className="relative w-full min-h-[100dvh] flex items-center z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center text-center lg:text-left pt-20 lg:pt-0"
          >
            <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-8xl leading-[0.9] mb-6 sm:mb-8 tracking-tighter">
              <span className="block text-white">A NOVA ERA</span>
              <span className="block text-white/50">DA CONVERSA</span>
              <span className="block text-white">DIGITAL.</span>
            </h1>

            <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
              Transforme a interação digital. Inteligência artificial e design imersivo unificados para experiências inesquecíveis.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start w-full">
              <button 
                onClick={() => navigate('/signup')}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-black font-medium text-base sm:text-lg transition-all duration-300 hover:bg-gray-200 w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button 
                onClick={() => navigate('/login')}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/30 text-white font-medium text-base sm:text-lg hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
              >
                Fazer Login
              </button>
            </div>

            <div className="mt-16 flex items-center justify-center lg:justify-start gap-8 text-gray-500 text-xs font-mono tracking-widest uppercase">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                System Online
              </div>
              <div>v2.4.0 Stable</div>
            </div>
          </motion.div>
          
          {/* Empty column to allow space for 3D object interaction on desktop */}
          <div className="hidden lg:block pointer-events-none" />
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

function VideoSimulation() {
  return (
    <section id="simulation" className="relative w-full min-h-screen bg-black flex items-center justify-center py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl sm:text-6xl text-white mb-6 tracking-tight">
            EXPERIÊNCIA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">IMERSIVA</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Sinta-se presente. Nossa tecnologia de simulação cria ambientes virtuais onde a conversa flui naturalmente.
          </p>
        </motion.div>

        {/* Video Simulation Container */}
        <div className="relative w-full max-w-5xl mx-auto aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(100,100,255,0.1)] bg-zinc-900">
           {/* Placeholder for Video - Using a high quality tech/connection video background */}
           <video 
             autoPlay 
             loop 
             muted 
             playsInline
             className="w-full h-full object-cover opacity-80"
           >
             <source src="https://cdn.coverr.co/videos/coverr-online-conference-call-5227/1080p.mp4" type="video/mp4" />
             Your browser does not support the video tag.
           </video>
           
           {/* Overlay UI Elements to make it look like the app */}
           <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                 <div className="p-3 rounded-full bg-white/10 text-white"><Mic className="w-5 h-5" /></div>
                 <div className="p-3 rounded-full bg-white/10 text-white"><VideoIcon className="w-5 h-5" /></div>
                 <div className="p-3 rounded-full bg-red-500 text-white"><Phone className="w-5 h-5 rotate-[135deg]" /></div>
              </div>
              
              {/* Floating User Bubbles Simulation */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-10 left-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3"
              >
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                 <div>
                    <div className="h-2 w-20 bg-white/20 rounded mb-1"></div>
                    <div className="h-2 w-12 bg-white/10 rounded"></div>
                 </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute top-20 right-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3"
              >
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600"></div>
                 <div>
                    <div className="h-2 w-24 bg-white/20 rounded mb-1"></div>
                    <div className="h-2 w-16 bg-white/10 rounded"></div>
                 </div>
              </motion.div>
           </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div className="bg-black min-h-[100dvh] text-white overflow-x-hidden relative">
      {/* Hero 3D Background Layer */}
      <div className="fixed inset-0 z-0 grayscale opacity-80 pointer-events-none lg:pointer-events-auto">
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
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />
      </div>

      <Navbar />
      <Hero />
      <div className="relative z-10 bg-black">
        <Features />
        <VideoSimulation />
      </div>
    </div>
  );
}
