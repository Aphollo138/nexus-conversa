import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacidade() {
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
        <h1 className="text-4xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="text-zinc-400">Última atualização: 15 de Março de 2026</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Informações que Coletamos</h2>
          <p className="text-zinc-300 leading-relaxed">
            O Papo.net.br coleta e processa os seguintes dados:
          </p>
          <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
            <li>Informações de conta (nome de usuário, e-mail).</li>
            <li>Dados de perfil e preferências.</li>
            <li>Metadados de conexão (horário, duração, endereço IP).</li>
            <li>Dados de uso e interação com a plataforma.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Uso do Microfone (WebRTC)</h2>
          <p className="text-zinc-300 leading-relaxed">
            Para fornecer o serviço de chat de voz, solicitamos acesso ao seu microfone. O áudio é transmitido em tempo real usando a tecnologia WebRTC. Nós não gravamos, armazenamos ou transcrevemos o conteúdo das suas conversas de voz. O acesso ao microfone é utilizado exclusivamente durante as sessões ativas e você pode revogar essa permissão a qualquer momento nas configurações do seu navegador.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Armazenamento no Firebase</h2>
          <p className="text-zinc-300 leading-relaxed">
            Os dados do seu perfil, autenticação e metadados de uso são armazenados de forma segura utilizando a infraestrutura do Firebase (Google Cloud). O Firebase emprega medidas de segurança robustas para proteger suas informações contra acesso não autorizado.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Cookies e Google AdSense</h2>
          <p className="text-zinc-300 leading-relaxed">
            Utilizamos cookies para melhorar sua experiência e para fins de monetização. O Papo.net.br utiliza o Google AdSense para exibir anúncios. O Google e seus parceiros usam cookies para veicular anúncios com base em suas visitas anteriores ao nosso site ou a outros sites na Internet.
          </p>
          <p className="text-zinc-300 leading-relaxed mt-4">
            Os usuários podem desativar a publicidade personalizada acessando as Configurações de anúncios do Google. Você também pode desativar o uso de cookies de publicidade personalizada de terceiros acessando www.aboutads.info.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Compartilhamento de Dados</h2>
          <p className="text-zinc-300 leading-relaxed">
            Não vendemos suas informações pessoais a terceiros. Podemos compartilhar dados anonimizados e agregados para fins de análise ou com parceiros de publicidade (como o Google AdSense) conforme descrito acima.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Seus Direitos</h2>
          <p className="text-zinc-300 leading-relaxed">
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através das configurações da sua conta ou entrando em contato com nosso suporte.
          </p>
        </section>
      </div>
    </div>
  );
}
