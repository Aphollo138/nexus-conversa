import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dicas() {
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

      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold tracking-tight">Dicas de Segurança e Etiqueta</h1>
        <p className="text-zinc-400 text-lg">Aprenda a aproveitar o Papo.net.br da melhor forma possível.</p>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Como fazer novos amigos em chats de voz de forma segura</h2>
          <p className="text-zinc-300 leading-relaxed text-lg">
            Conhecer pessoas novas online é incrível, mas a segurança deve vir sempre em primeiro lugar. Em chats de voz como o Papo.net.br, você tem a vantagem de ouvir o tom de voz da pessoa, o que ajuda a identificar intenções. No entanto, evite compartilhar informações pessoais sensíveis logo de cara, como seu endereço completo, local de trabalho ou senhas.
          </p>
          <p className="text-zinc-300 leading-relaxed text-lg">
            Mantenha a conversa em tópicos gerais, como hobbies, filmes ou música. Se a pessoa do outro lado fizer perguntas desconfortáveis ou insistir em dados privados, não hesite em encerrar a chamada e usar a ferramenta de denúncia da plataforma. Lembre-se: a amizade verdadeira leva tempo para ser construída, mesmo no ambiente digital.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Dicas para configurar seu microfone para uma call perfeita</h2>
          <p className="text-zinc-300 leading-relaxed text-lg">
            A qualidade do seu áudio é o seu "cartão de visitas" no Papo.net.br. Para garantir uma comunicação clara e sem ruídos, comece escolhendo um ambiente silencioso. Fones de ouvido com microfone embutido (headsets) são altamente recomendados, pois evitam o eco causado pelo som saindo dos alto-falantes e voltando para o microfone.
          </p>
          <p className="text-zinc-300 leading-relaxed text-lg">
            Ajuste a sensibilidade do microfone nas configurações do seu sistema operacional para que ele não capte sons de fundo, como o teclado ou o ventilador. Posicione o microfone a uma distância confortável da boca (cerca de dois dedos) para evitar estalos na respiração. Com essas dicas simples, suas conversas serão muito mais agradáveis para quem está ouvindo.
          </p>
        </article>

        <article className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Por que a comunicação por voz é mais humana que o texto</h2>
          <p className="text-zinc-300 leading-relaxed text-lg">
            Na era das mensagens instantâneas, o texto se tornou a norma. Mas você já percebeu como é fácil interpretar mal uma mensagem escrita? A comunicação por voz resgata a nuance que o texto perde. O tom, a velocidade, as pausas e as risadas carregam emoções que os emojis simplesmente não conseguem replicar.
          </p>
          <p className="text-zinc-300 leading-relaxed text-lg">
            Falar e ouvir ativam áreas diferentes do cérebro, promovendo empatia e conexão real. No Papo.net.br, acreditamos que ouvir a voz de alguém cria um vínculo instantâneo, quebrando o gelo de forma natural. É a diferença entre ler um roteiro e assistir a um filme: a voz traz a conversa à vida, tornando cada interação única e genuinamente humana.
          </p>
        </article>
      </div>
    </div>
  );
}
