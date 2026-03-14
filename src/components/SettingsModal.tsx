import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Save, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface UserProfile {
  username?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerPosition?: number;
  location?: string;
  about?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export default function SettingsModal({ isOpen, onClose, currentUserProfile, onUpdateProfile }: SettingsModalProps) {
  const [displayName, setDisplayName] = useState(currentUserProfile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUserProfile?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(currentUserProfile?.bannerUrl || '');
  const [bannerPosition, setBannerPosition] = useState(currentUserProfile?.bannerPosition || 50);
  const [about, setAbout] = useState(currentUserProfile?.about || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Banner Positioning Modal State
  const [isPositioningBanner, setIsPositioningBanner] = useState(false);
  const [tempBannerPosition, setTempBannerPosition] = useState(50);

  useEffect(() => {
    if (currentUserProfile) {
      setDisplayName(currentUserProfile.username || '');
      setAvatarUrl(currentUserProfile.avatarUrl || '');
      setBannerUrl(currentUserProfile.bannerUrl || '');
      setBannerPosition(currentUserProfile.bannerPosition || 50);
      setAbout(currentUserProfile.about || '');
    }
  }, [currentUserProfile]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updates = {
        username: displayName,
        avatarUrl,
        bannerUrl,
        bannerPosition,
        about
      };
      await updateDoc(userRef, updates);
      onUpdateProfile({ ...currentUserProfile, ...updates });
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const openBannerPositioning = () => {
    if (bannerUrl) {
      setTempBannerPosition(bannerPosition);
      setIsPositioningBanner(true);
    }
  };

  const saveBannerPosition = () => {
    setBannerPosition(tempBannerPosition);
    setIsPositioningBanner(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Banner Positioning Modal */}
      <AnimatePresence>
        {isPositioningBanner && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#313338] w-full max-w-lg rounded-xl p-4 md:p-6 shadow-2xl border border-[#1e1f22]"
             >
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h3 className="text-white font-bold text-lg">Ajustar Posição</h3>
                    <p className="text-zinc-400 text-xs mt-1">Como seu banner aparecerá no perfil.</p>
                  </div>
                  <button onClick={() => setIsPositioningBanner(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Live Preview Context */}
                <div className="w-full bg-[#111214] rounded-xl overflow-hidden shadow-lg border border-[#1e1f22] relative mb-8">
                   <div className="h-32 bg-[#1e1f22] w-full relative overflow-hidden">
                       <img 
                         src={bannerUrl} 
                         alt="Banner Preview" 
                         className="w-full h-full object-cover select-none"
                         style={{ 
                           objectPosition: `center ${tempBannerPosition}%`,
                           // Ensure crisp rendering
                           imageRendering: 'auto' 
                         }}
                         draggable={false}
                       />
                       {/* Overlay Guide Lines (Subtle) */}
                       <div className="absolute inset-0 border-y border-white/10 pointer-events-none opacity-50"></div>
                   </div>
                   
                   {/* Avatar Context Overlay */}
                   <div className="px-4 pb-4 relative">
                      <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden shadow-sm">
                         {avatarUrl ? (
                           <img src={avatarUrl} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                             {displayName.slice(0, 2).toUpperCase()}
                           </div>
                         )}
                         <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#111214]"></div>
                      </div>
                      
                      <div className="pt-12 mb-2 opacity-50 blur-[1px] select-none pointer-events-none">
                         <div className="h-5 w-32 bg-zinc-700 rounded mb-2"></div>
                         <div className="h-3 w-20 bg-zinc-800 rounded"></div>
                      </div>
                   </div>
                </div>

                {/* Slider Control */}
                <div className="bg-[#1e1f22] p-4 rounded-lg mb-6">
                  <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase mb-3">
                    <span>Topo</span>
                    <span>{tempBannerPosition}%</span>
                    <span>Base</span>
                  </div>
                  <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     step="1"
                     value={tempBannerPosition} 
                     onChange={(e) => setTempBannerPosition(Number(e.target.value))}
                     className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3">
                   <button 
                     onClick={() => setIsPositioningBanner(false)}
                     className="px-4 py-2 text-zinc-300 hover:text-white font-medium text-sm transition-colors hover:underline"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={saveBannerPosition}
                     className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm rounded shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95"
                   >
                     Salvar Posição
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#313338] w-full md:max-w-4xl h-full md:h-[85vh] md:rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden text-zinc-200 font-sans"
      >
        {/* Sidebar */}
        <div className="w-full md:w-60 bg-[#2B2D31] flex flex-row md:flex-col p-4 shrink-0 overflow-x-auto md:overflow-visible gap-2 md:gap-0 border-b md:border-b-0 md:border-r border-[#1e1f22]">
          <h2 className="text-xs font-bold text-zinc-400 uppercase mb-0 md:mb-4 px-2 hidden md:block">Configurações de Usuário</h2>
          <button className="whitespace-nowrap text-left px-3 py-1.5 md:px-2 rounded bg-[#3f4147] text-white font-medium text-sm md:mb-1">
            Meu Perfil
          </button>
          <button className="whitespace-nowrap text-left px-3 py-1.5 md:px-2 rounded hover:bg-[#3f4147]/50 text-zinc-400 hover:text-zinc-200 font-medium text-sm md:mb-1 transition-colors">
            Privacidade
          </button>
          <button className="whitespace-nowrap text-left px-3 py-1.5 md:px-2 rounded hover:bg-[#3f4147]/50 text-zinc-400 hover:text-zinc-200 font-medium text-sm md:mb-1 transition-colors">
            Aparência
          </button>
          
          <div className="ml-auto md:ml-0 md:mt-auto md:border-t border-zinc-700 md:pt-4 flex items-center">
             <button onClick={onClose} className="text-left px-2 py-1.5 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-400 font-medium text-sm transition-colors flex items-center gap-2">
               <X className="w-4 h-4" /> <span className="hidden md:inline">Sair</span>
             </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#313338] overflow-y-auto custom-scrollbar relative">
          <div className="p-4 md:p-10 max-w-3xl mx-auto w-full pb-24">
            <h1 className="text-xl font-bold text-white mb-6 md:mb-8">Meu Perfil</h1>

            <div className="flex gap-8 flex-col lg:flex-row">
              {/* Form Section */}
              <div className="flex-1 space-y-6">
                
                {/* Banner & Avatar Inputs */}
                <div className="bg-[#111214] rounded-xl overflow-hidden border border-[#1e1f22]">
                   <div className="h-32 bg-[#1e1f22] relative group">
                      {bannerUrl ? (
                        <img 
                          src={bannerUrl} 
                          alt="Banner" 
                          className="w-full h-full object-cover" 
                          style={{ objectPosition: `center ${bannerPosition}%` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1e1f22]" />
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                         {bannerUrl && (
                           <button 
                             onClick={openBannerPositioning}
                             className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors tooltip"
                             title="Ajustar Posição"
                           >
                              <Move className="w-4 h-4 text-white" />
                           </button>
                         )}
                         <button className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                            <ImageIcon className="w-4 h-4 text-white" />
                         </button>
                      </div>
                   </div>
                   <div className="px-4 pb-4 relative">
                      <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden group cursor-pointer">
                         {avatarUrl ? (
                           <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xl">
                             {displayName.slice(0, 2).toUpperCase()}
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                         </div>
                      </div>
                      <div className="pt-12">
                         <h3 className="text-lg font-bold text-white">{displayName || 'Usuário'}</h3>
                         <p className="text-xs text-zinc-400">@{displayName?.toLowerCase().replace(/\s+/g, '') || 'usuario'}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Nome Exibido</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-[#1e1f22] border-none rounded p-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Sobre Mim</label>
                    <textarea 
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full bg-[#1e1f22] border-none rounded p-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#3f4147]">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Avatar URL</label>
                      <input 
                        type="text" 
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#1e1f22] border-none rounded p-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Banner URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-[#1e1f22] border-none rounded p-2.5 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                      />
                      {bannerUrl && (
                        <button 
                          onClick={openBannerPositioning}
                          className="px-3 bg-[#1e1f22] hover:bg-[#2b2d31] rounded text-zinc-300 transition-colors"
                          title="Ajustar Posição"
                        >
                          <Move className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Preview Section */}
              <div className="w-80 shrink-0 hidden lg:block">
                <h3 className="text-xs font-bold text-zinc-400 uppercase mb-4">Prévia</h3>
                
                <div className="w-full bg-[#111214] rounded-xl overflow-hidden shadow-xl border border-[#1e1f22] relative">
                   {/* Banner Preview */}
                   <div className="h-32 bg-[#1e1f22] w-full">
                      {bannerUrl && (
                        <img 
                          src={bannerUrl} 
                          className="w-full h-full object-cover" 
                          style={{ objectPosition: `center ${bannerPosition}%` }}
                        />
                      )}
                   </div>
                   
                   <div className="px-4 pb-4 relative">
                      {/* Avatar Preview */}
                      <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-[6px] border-[#111214] bg-[#1e1f22] overflow-hidden">
                         {avatarUrl ? (
                           <img src={avatarUrl} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-xl">
                             {displayName.slice(0, 2).toUpperCase()}
                           </div>
                         )}
                         <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-[#111214]"></div>
                      </div>

                      <div className="pt-12 mb-4">
                         <h3 className="text-lg font-bold text-white leading-tight">{displayName || 'Usuário'}</h3>
                         <p className="text-sm text-zinc-400">@{displayName?.toLowerCase().replace(/\s+/g, '') || 'usuario'}</p>
                      </div>

                      <div className="w-full h-px bg-[#2e3035] mb-4"></div>

                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase">Sobre Mim</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {about || 'Membro do Papos desde 2024.'}
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-0 left-0 md:left-60 right-0 bg-[#111214] p-4 flex justify-end gap-4 border-t border-[#1e1f22] z-10">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:underline">Cancelar</button>
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 flex items-center gap-2"
           >
             {isSaving ? 'Salvando...' : 'Salvar Alterações'}
           </button>
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 md:block hidden">
           <div className="w-8 h-8 rounded-full border-2 border-zinc-500 flex items-center justify-center">
             <X className="w-4 h-4" />
           </div>
           <span className="text-xs font-bold mt-1 block text-center">ESC</span>
        </button>

      </motion.div>
    </div>
  );
}
