import { useState } from 'react';
import Spline from '@splinetool/react-spline';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Menu, X, User, DoorOpen, Zap, Shield, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 bg-transparent pt-6 mix-blend-difference">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Bot className="w-8 h-8 text-white" />
            <span className="font-display font-bold text-2xl tracking-widest text-white">NEXUS</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-12">
              {['Home', 'Features', 'Community', 'Blog'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium tracking-wide uppercase"
                >
                  {item}
                </a>
              ))}
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
            {['Home', 'Features', 'Community', 'Blog'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-white block px-3 py-2 rounded-md text-base font-medium"
              >
                {item}
              </a>
            ))}
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
    <section className="relative w-full min-h-[100dvh] flex items-center z-10">
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
              
              <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-white/30 text-white font-medium text-base sm:text-lg hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto">
                Ver Demo
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
  const features = [
    {
      icon: <User className="w-8 h-8" />,
      title: "Crie seu Perfil",
      description: "Identidade digital única com avatares personalizáveis e presença marcante."
    },
    {
      icon: <DoorOpen className="w-8 h-8" />,
      title: "Entre em uma Sala",
      description: "Ambientes virtuais imersivos projetados para colaboração e conexão profunda."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Conversa em Tempo Real",
      description: "Latência zero. Comunicação instantânea potencializada por IA generativa."
    }
  ];

  return (
    <section className="relative w-full min-h-screen bg-black flex items-center py-20 overflow-hidden">
      {/* 3D Boat Background */}
      <div className="absolute right-0 bottom-0 w-full lg:w-2/3 h-full pointer-events-none z-0">
        <Spline 
          scene="https://prod.spline.design/zusB8LVg-Dz5VwZa/scene.splinecode"
          className="w-full h-full opacity-60 grayscale"
        />
        {/* Gradient Masks for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

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
                FUNCIONALIDADES <br />
                <span className="text-white/40">ESSENCIAIS.</span>
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
                  className="group p-6 sm:p-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500"
                >
                  <div className="mb-4 text-white/80 group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mb-2 tracking-wide uppercase">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 font-light leading-relaxed group-hover:text-gray-400 transition-colors">
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

function ConversationModes() {
  return (
    <section className="relative w-full min-h-screen bg-black flex items-center py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: 3D Drone */}
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-[50vh] lg:h-screen w-full relative order-1 lg:order-1"
          >
            <div className="absolute inset-0 z-0 grayscale opacity-80">
              <Spline scene="https://prod.spline.design/KDRrp0nO3eFlfaKY/scene.splinecode" />
            </div>
            {/* Gradient Masks */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />
          </motion.div>

          {/* Right Side: Content */}
          <div className="flex flex-col gap-8 order-2 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-12 tracking-tight text-right">
                MODOS DE <br />
                <span className="text-white/40">CONVERSA.</span>
              </h2>
            </motion.div>

            <div className="flex flex-col gap-6">
              {/* Card A: Private Chat */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="group p-6 sm:p-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm hover:border-white/30 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500"
              >
                <div className="flex items-start gap-6">
                  <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white mb-2 tracking-wide uppercase">
                      Chat Privado
                    </h3>
                    <p className="text-gray-500 font-light leading-relaxed group-hover:text-gray-400 transition-colors">
                      Privacidade Total. Criptografia de ponta a ponta para suas conversas secretas.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card B: Public Rooms */}
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="group p-6 sm:p-8 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-100 mix-blend-overlay" />
                <div className="flex items-start gap-6 relative z-10">
                  <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white mb-2 tracking-wide uppercase">
                      Salas Públicas
                    </h3>
                    <p className="text-gray-500 font-light leading-relaxed group-hover:text-gray-400 transition-colors">
                      Conecte-se com o Mundo. Salas temáticas 3D com voz e vídeo.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden relative">
      {/* Hero 3D Background Layer */}
      <div className="fixed inset-0 z-0 grayscale opacity-80 pointer-events-none lg:pointer-events-auto">
        <Spline 
          scene="https://prod.spline.design/dnN6ZvuJBbyN2Va1/scene.splinecode"
          className="w-full h-full lg:translate-x-1/4"
        />
        {/* Overlay gradient to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none" />
      </div>

      <Navbar />
      <Hero />
      <div className="relative z-10 bg-black">
        <Features />
        <ConversationModes />
      </div>
    </div>
  );
}
