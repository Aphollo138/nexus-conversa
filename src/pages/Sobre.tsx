import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Sobre() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium uppercase tracking-wide">Voltar</span>
      </button>

      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">Sobre o Papo.net.br</h1>
        
        <section className="space-y-6">
          <p className="text-zinc-300 text-lg leading-relaxed">
            O Papo.net.br nasceu de uma necessidade simples, mas fundamental no mundo digital moderno: a conexão humana autêntica. Em uma era dominada por mensagens de texto assíncronas e interações superficiais em redes sociais, acreditamos que a voz continua sendo o instrumento mais poderoso para construir relacionamentos reais.
          </p>
          
          <p className="text-zinc-300 text-lg leading-relaxed">
            Nossa missão é clara: conectar pessoas de forma segura e instantânea através da voz. Queremos quebrar as barreiras geográficas e sociais, permitindo que brasileiros de todos os cantos do país (e do mundo) se encontrem, conversem e compartilhem experiências em tempo real, sem a frieza do teclado.
          </p>

          <h2 className="text-2xl font-semibold mt-8">Tecnologia de Ponta para Conexões Reais</h2>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Para garantir que cada "alô" seja ouvido com clareza cristalina, o Papo.net.br foi construído sobre uma arquitetura robusta e moderna. Utilizamos a <strong>Tecnologia WebRTC para baixa latência</strong>, o que significa que o áudio viaja diretamente entre os usuários (peer-to-peer) na velocidade da luz. O resultado? Conversas fluidas, sem os atrasos frustrantes comuns em outras plataformas de chamadas.
          </p>

          <p className="text-zinc-300 text-lg leading-relaxed">
            Nossa infraestrutura de backend é impulsionada pelo Firebase, garantindo escalabilidade, segurança de dados e matchmaking ultrarrápido. Quando você clica para encontrar alguém, nossos algoritmos trabalham em milissegundos para conectar você à pessoa certa.
          </p>

          <h2 className="text-2xl font-semibold mt-8">Design Centrado no Usuário</h2>
          <p className="text-zinc-300 text-lg leading-relaxed">
            Acreditamos que a tecnologia deve ser invisível. Por isso, desenvolvemos uma <strong>Interface minimalista focada na experiência do usuário</strong>. Sem menus confusos, sem distrações visuais desnecessárias. O design escuro (dark mode) nativo reduz o cansaço visual e coloca o foco onde realmente importa: na sua voz e na voz de quem está do outro lado da linha.
          </p>

          <p className="text-zinc-300 text-lg leading-relaxed">
            O Papo.net.br não é apenas um site de chat; é uma plataforma de comunicação projetada por engenheiros e designers apaixonados por aproximar pessoas. Seja para fazer novos amigos, praticar um idioma ou simplesmente ter uma boa conversa no fim do dia, estamos aqui para garantir que sua voz seja ouvida.
          </p>
        </section>
      </div>
    </div>
  );
}
