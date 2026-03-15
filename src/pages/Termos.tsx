import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Termos() {
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
        <h1 className="text-4xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="text-zinc-400">Última atualização: 15 de Março de 2026</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Aceitação dos Termos</h2>
          <p className="text-zinc-300 leading-relaxed">
            Ao acessar e utilizar o Papo.net.br, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossa plataforma.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Uso do Microfone e Tecnologia WebRTC</h2>
          <p className="text-zinc-300 leading-relaxed">
            O Papo.net.br é uma plataforma de comunicação por voz em tempo real. Para o funcionamento adequado dos serviços, utilizamos a tecnologia WebRTC, que requer acesso ao microfone do seu dispositivo. Ao utilizar nossos serviços de chat de voz, você concede permissão explícita para a captura e transmissão de áudio durante as sessões ativas. O áudio é transmitido ponto a ponto (peer-to-peer) ou através de nossos servidores de retransmissão para garantir baixa latência, mas não é gravado ou armazenado por nós.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Conduta do Usuário</h2>
          <p className="text-zinc-300 leading-relaxed">
            Para manter um ambiente seguro e acolhedor para todos, você concorda em NÃO:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
            <li>Assediar, intimidar, ameaçar ou discriminar outros usuários.</li>
            <li>Transmitir conteúdo ilegal, difamatório, obsceno ou ofensivo.</li>
            <li>Utilizar a plataforma para spam, phishing ou qualquer forma de fraude.</li>
            <li>Fingir ser outra pessoa ou entidade.</li>
            <li>Violar direitos autorais ou de propriedade intelectual de terceiros.</li>
          </ul>
          <p className="text-zinc-300 leading-relaxed mt-4">
            A violação destas regras de conduta resultará no banimento imediato e permanente da plataforma. O Papo.net.br é ativamente moderado para garantir a segurança da comunidade.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Armazenamento de Dados</h2>
          <p className="text-zinc-300 leading-relaxed">
            Utilizamos o Firebase (Google) para o armazenamento seguro de dados de perfil, preferências e histórico de conexões (metadados). O conteúdo das conversas de voz não é armazenado.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Modificações dos Termos</h2>
          <p className="text-zinc-300 leading-relaxed">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão notificadas aos usuários. O uso contínuo da plataforma após as alterações constitui aceitação dos novos termos.
          </p>
        </section>
      </div>
    </div>
  );
}
