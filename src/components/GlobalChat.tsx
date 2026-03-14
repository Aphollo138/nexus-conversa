import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function GlobalChat(props: any) {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] text-white overflow-hidden relative p-4 md:p-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col h-full gap-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col items-center text-center mt-4 md:mt-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <MessageSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Chat Global de Espera
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
            Troque uma ideia com a comunidade enquanto aguarda seu Match por Voz.
          </p>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 w-full min-h-[70vh] bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative mb-8">
          <iframe
            src="https://chat.vipchat.com.br/?nick=Nexus_??#NexusVoz"
            allow="camera; microphone; display-capture; fullscreen"
            style={{ border: 0, width: '100%', height: '100%' }}
            title="Global Chat"
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
