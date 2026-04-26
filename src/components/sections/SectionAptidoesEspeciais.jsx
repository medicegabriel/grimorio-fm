import React, { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { TextInput, TextArea, SmallButton } from "../builder-controls";

export const APTIDOES_CATEGORIAS = [
  {
    categoria: "Aptidões de Aura",
    aptidoes: [
      {
        nome: "Aura de Restrição",
        descricao:
          "Focada inteiramente em conter oponentes, esta aptidão gera uma aura pesada e densa. Sempre que tentar agarrar um alvo, você pode adicionar seu Nível de Aptidão em Aura diretamente nas rolagens de Atletismo e nos testes para evitar que a criatura escape. Além disso, um número limitado de vezes por cena, é possível gastar energia amaldiçoada para garantir vantagem na tentativa de agarrar ou forçar desvantagem na fuga do inimigo.",
      },
      {
        nome: "Aura de Rompimento",
        descricao:
          "Manifestando uma aura afiada, você causa danos pelo simples contato físico. Você pode ativar essa aura como uma ação livre durante uma rodada, forçando qualquer criatura em um raio de 3 metros que inicie o turno ali a realizar um teste de resistência de Fortitude. Uma falha resulta em dano elementar à sua escolha que ignora resistências e reduções, escalando em poder conforme seu Nível de Aptidão aumenta. Exige ND 8.",
      },
      {
        nome: "Aura do General",
        descricao:
          "Refletindo uma forte presença, sua aura atua como uma grande fonte de motivação para seus aliados. Como uma Ação Bônus, você pode expandir essa aura por 9 metros, concedendo um bônus constante em rolagens de dano e perícia para os aliados dentro da área. Manter essa inspiração ativa consome 2 pontos de energia amaldiçoada por turno. Exige ser Líder da Horda.",
      },
      {
        nome: "Aura Nefasta",
        descricao:
          "Exalando uma presença vil e macabra, essa aura perturba a mente de seus inimigos. Criaturas hostis que iniciarem o turno perto de você devem realizar um teste de vontade ou ficarão aterrorizadas. Você pode investir 1 ponto de energia para dobrar o raio de alcance dessa perturbação temporariamente.",
      },
    ],
  },
  {
    categoria: "Aptidões de Controle e Leitura",
    aptidoes: [
      {
        nome: "Detecção Amaldiçoada",
        descricao:
          "Através de treinamento, você lê auras rapidamente para prever as ações dos usuários de energia, favorecendo tanto sua ofensiva quanto defensiva. Utilizando uma Ação de Movimento, você realiza um teste de Percepção contra a dificuldade amaldiçoada da criatura; um sucesso impede que você sofra desvantagens para acertá-la e permite ignorar os bônus de Defesa que o alvo receba por habilidades durante o turno.",
      },
      {
        nome: "Estímulo Amaldiçoado",
        descricao:
          "Você domina a arte de usar energia para reforçar o próprio corpo, apurando sua força e agilidade. Durante seu turno, ao se movimentar, você pode gastar energia para aumentar drasticamente sua distância percorrida. Caso esteja realizando testes de Acrobacia ou Atletismo, a energia pode ser gasta para fornecer bônus numéricos imediatos que duram até o próximo turno.",
      },
      {
        nome: "Rastreio de Energia",
        descricao:
          "Ampliando suas capacidades investigativas, você rastreia o uso de energia amaldiçoada com precisão. Ao entrar em uma cena onde técnicas foram utilizadas, você detecta vestígios imediatamente e pode realizar testes contra a dificuldade do alvo para ignorar invisibilidades e facilitar sua localização.",
      },
    ],
  },
  {
    categoria: "Aptidões de Domínio",
    aptidoes: [
      {
        nome: "Acerto Garantido",
        descricao:
          "Alcançando o ápice das técnicas de domínio, você consegue embutir o efeito letal de acerto garantido em sua expansão de barreira. O funcionamento específico é definido pelas regras de criação de domínio, mas sua aplicação exige um custo adicional de 5 pontos de energia. Exige Expansão de Domínio Completa, nível 14 e níveis altos de aptidão.",
      },
      {
        nome: "Modificação Completa",
        descricao:
          "Seu refinamento é tão grande que você consegue alterar as condições da sua expansão no exato instante em que ela é ativada. É possível inverter as defesas estruturais da barreira para protegê-la de ataques externos ou modificar as dimensões de espaço do domínio, sacrificando área de efeito para fortificar a saúde estrutural da barreira ou vice-versa. Expansões divinas sem barreiras podem usar esta aptidão para dobrar sua área de efeito livremente.",
      },
    ],
  },
  {
    categoria: "Aptidões de Barreira",
    aptidoes: [
      {
        nome: "Barreira Rápida",
        descricao:
          "O excesso de treino e repetição torna a estruturação de suas barreiras ágil a ponto de se tornar uma Ação Livre.",
      },
      {
        nome: "Cesta Oca de Vime",
        descricao:
          "Esta é uma técnica esotérica antiga voltada para a defesa contra expansões. Usando uma ação bônus ou reação, você tece um trançado protetor ao seu redor que o imuniza do acerto garantido de um domínio inimigo. A técnica usa concentração e tem uma durabilidade que se desgasta caso seja atacada ou caso a concentração falhe; no entanto, usar ambas as mãos para manter o selo impede o desgaste passivo da estrutura. Exige nível 5.",
      },
      {
        nome: "Cortina",
        descricao:
          "Você cria um vasto campo de força negro focado no ocultamento de uma área contra espectadores externos. O feitiço possui um custo de energia flexível baseado na área abrangida, sem necessitar de custos de manutenção, permitindo ainda embutir condições específicas na barreira.",
      },
      {
        nome: "Técnicas de Barreira",
        descricao:
          "Capacita você a erguer diversas paredes de energia simultaneamente, funcionando como escudos ou jaulas. Estas estruturas físicas possuem reservas de vida atreladas ao seu poder de feitiçaria e podem ser manipuladas taticamente através do campo de batalha.",
      },
    ],
  },
  {
    categoria: "Aptidões Especiais",
    aptidoes: [
      {
        nome: "Raio Negro",
        descricao:
          "O Kokusen é um fenômeno devastador engatilhado por uma distorção espacial no momento do impacto. Ocorre passivamente em acertos críticos perfeitos corporais, aplicando um brutal multiplicador no dano final que não pode ser defendido ou reduzido pelas defesas do alvo. Realizar esse feito coloca o feiticeiro em estado de foco absoluto, otimizando sua força e diminuindo a margem de acerto necessária para reproduzir os raios negros em golpes subsequentes.",
      },
      {
        nome: "Abençoado pelas Faíscas Negras",
        descricao:
          "Você consegue influenciar ativamente a natureza imprevisível do Kokusen, conseguindo engatilhá-lo em margens de acerto ligeiramente menores.",
      },
      {
        nome: "Técnica Máxima",
        descricao:
          "Elevando a sua técnica base ao extremo, você forma um feitiço definitivo e indefensável. Embora requeira um grande investimento de energia e exija tempo de recarga de quatro rodadas, ela sobrepuja resistências e anexa quantias massivas de dados de dano extras.",
      },
      {
        nome: "Reversão de Técnica",
        descricao:
          "Empregando energia reversa diretamente no conceito originário da sua técnica amaldiçoada, você produz um novo feitiço que opera sob uma lógica completamente invertida ao seu poder padrão.",
      },
      {
        nome: "Energia Reversa",
        descricao:
          "Ao dominar a energia positiva, você ganha a capacidade primária de restaurar seus pontos de vida gastando pontos de energia como ações ativas, além de curar feridas internas severas e regenerar membros amputados por custos mais elevados.",
      },
      {
        nome: "Cura de Exaustão",
        descricao:
          "Permite queimar energia reversa diretamente para forçar a recuperação da exaustão originada por feitiços exaustivos.",
      },
      {
        nome: "Fluxo Imparável",
        descricao:
          "Seu corpo alcança um cume regenerativo, curando-se no exato instante em que é ferido através de reações automáticas ou de forma fluida no início de seus turnos.",
      },
    ],
  },
  {
    categoria: "Aptidões de Anatomia",
    aptidoes: [
      {
        nome: "Absorção Elemental",
        descricao:
          "Vinculado fisicamente a um elemento, você adquire a capacidade de absorver ataques equivalentes contra você, revertendo a força destrutiva deles em pontos de vida temporários em formato de reação.",
      },
      {
        nome: "Arma Natural",
        descricao:
          "O seu físico atípico gerou ferramentas de assassinato naturais em forma de dentes, garras ou caudas. Estes contam como ataques desarmados versáteis e ágeis que substituem ou elevam o padrão de seus golpes marciais contundentes.",
      },
      {
        nome: "Articulações Extensas",
        descricao:
          "Mutações nas suas juntas anatômicas expandem consideravelmente a zona de alcance ameaçada pelos seus ataques corporais.",
      },
      {
        nome: "Braços Extras",
        descricao:
          "Você desenvolve um par sobressalente de braços que elevam dramaticamente suas aptidões atléticas e destreza manual. Em combate, isso permite portar múltiplos equipamentos pesados, engajar diversos oponentes em agarrões simultâneos e gerenciar o campo de batalha de forma vantajosa.",
      },
      {
        nome: "Composição Elemental",
        descricao:
          "Você descarta parte de sua fisicalidade biológica para ser composto por um elemento puro, adquirindo tanto imunidade quanto capacidade bélica associada àquela manifestação.",
      },
      {
        nome: "Corpo Especializado",
        descricao:
          "A estrutura anatômica se moldou em torno de uma capacidade fundamental da sua existência, fornecendo ganhos sensíveis e diretos atrelados a uma perícia de sua escolha.",
      },
      {
        nome: "Desenvolvimento Exagerado",
        descricao:
          "Através do acúmulo genético exacerbado, sua fisionomia aumenta de categoria em escala, garantindo uma robustez extrema com ganhos passivos contínuos na capacidade vital máxima.",
      },
      {
        nome: "Olhos Adicionais",
        descricao:
          "A brotação de múltiplos órgãos visuais em sua superfície apura seus instintos observacionais de forma profunda, impactando seu grau de atenção permanente e percepção ativa de armadilhas.",
      },
      {
        nome: "Pernas Extras",
        descricao:
          "Integrando um balanço de locomoção superior, você ganha velocidade contínua em formato de deslocamento expandido, desconsiderando terrenos acidentados ou difíceis pelo caminho.",
      },
    ],
  },
];

const CUSTOM_KEY = "__custom__";

// Mapa plano nome → aptidão para busca rápida
const APTIDAO_BY_NOME = Object.fromEntries(
  APTIDOES_CATEGORIAS.flatMap((cat) =>
    cat.aptidoes.map((a) => [a.nome, { ...a, categoria: cat.categoria }])
  )
);

export default function SectionAptidoesEspeciais({ draft, actions }) {
  const aptidoes = draft.aptidoesEspeciais || [];
  const addedNomes = new Set(aptidoes.map((a) => a.nome));

  const [selecao, setSelecao] = useState("");
  const [nomeCustom, setNomeCustom] = useState("");
  const [descCustom, setDescCustom] = useState("");

  const oficialSelecionada = APTIDAO_BY_NOME[selecao];

  const handleAdd = () => {
    if (selecao === CUSTOM_KEY) {
      if (!nomeCustom.trim()) return;
      actions.addAptidaoEspecial({
        tipo: "custom",
        categoria: "Customizada",
        nome: nomeCustom.trim(),
        descricao: descCustom.trim(),
      });
    } else if (oficialSelecionada) {
      actions.addAptidaoEspecial({
        tipo: "oficial",
        categoria: oficialSelecionada.categoria,
        nome: oficialSelecionada.nome,
        descricao: oficialSelecionada.descricao,
      });
    }
    setSelecao("");
    setNomeCustom("");
    setDescCustom("");
  };

  const podeAdicionar =
    selecao === CUSTOM_KEY ? !!nomeCustom.trim() : !!oficialSelecionada;

  return (
    <div className="space-y-4">
      {/* Lista de aptidões adicionadas */}
      {aptidoes.length === 0 ? (
        <div className="text-center py-5 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
          Nenhuma aptidão amaldiçoada adicionada
        </div>
      ) : (
        <div className="space-y-2">
          {aptidoes.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800 rounded p-3"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-white">{a.nome}</span>
                  <span className="text-[9px] uppercase tracking-wide text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                    {a.categoria}
                  </span>
                  {a.tipo === "custom" && (
                    <span className="text-[9px] uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-1 py-0.5">
                      Custom
                    </span>
                  )}
                </div>
                {a.descricao && (
                  <p className="text-xs text-slate-400 leading-relaxed">{a.descricao}</p>
                )}
              </div>
              <SmallButton
                onClick={() => actions.removeAptidaoEspecial(a.id)}
                variant="danger"
                title="Remover aptidão"
              >
                <Trash2 className="w-3 h-3" />
              </SmallButton>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adição */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Adicionar Aptidão Amaldiçoada
        </h3>

        {/* Select nativo com optgroup por categoria */}
        <select
          value={selecao}
          onChange={(e) => setSelecao(e.target.value)}
          className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Escolha uma aptidão...</option>
          {APTIDOES_CATEGORIAS.map((cat) => {
            const disponiveis = cat.aptidoes.filter((a) => !addedNomes.has(a.nome));
            if (disponiveis.length === 0) return null;
            return (
              <optgroup key={cat.categoria} label={cat.categoria}>
                {disponiveis.map((a) => (
                  <option key={a.nome} value={a.nome}>
                    {a.nome}
                  </option>
                ))}
              </optgroup>
            );
          })}
          <option value={CUSTOM_KEY}>✦ Aptidão Customizada</option>
        </select>

        {/* Preview da descrição oficial */}
        {oficialSelecionada && (
          <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">
              {oficialSelecionada.categoria}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{oficialSelecionada.descricao}</p>
          </div>
        )}

        {/* Campos para aptidão customizada */}
        {selecao === CUSTOM_KEY && (
          <div className="space-y-2">
            <TextInput
              value={nomeCustom}
              onChange={setNomeCustom}
              placeholder="Nome da Aptidão"
            />
            <TextArea
              value={descCustom}
              onChange={setDescCustom}
              rows={3}
              placeholder="Descreva os efeitos desta aptidão..."
            />
          </div>
        )}

        <SmallButton onClick={handleAdd} variant="primary" disabled={!podeAdicionar}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
