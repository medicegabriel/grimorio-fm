import React, { useMemo, useState } from "react";
import { Plus, X, AlertTriangle, Search, ChevronDown, ChevronRight } from "lucide-react";

import { COMBATE_ESTADOS } from "../../afty-combate";
import { condicoesPorForca, fichaDaCondicao } from "../../afty-condicoes";
import { getCanal } from "../../afty-efeitos";
import { sinalDe } from "../../ui/formato";
import CanalPicker from "../CanalPicker";
import PainelDeConcessao from "../PainelDeConcessao";
import SubAbas from "../SubAbas";
import { usePrimitiva } from "../../ui/usar-primitiva";
import { estadoUsadoNestaRodada } from "../ficha-sessao";
import { estaLigado } from "../ficha-buffs";
import { organizaEstados } from "../ficha-estados";

/**
 * ============================================================
 * ABA BUFFS — o que está ligado agora
 * ============================================================
 * Três camadas, na mesma tela e nesta ordem:
 *
 *   1. CATALOGADOS  os estados que o sistema já conhece (`COMBATE_ESTADOS`).
 *      Nada disso precisou ser construído: cada estado já é variável do DSL e o
 *      `quando` de cada habilidade liga e desliga sozinho desde 2026-07-28.
 *   2. AD-HOC       "+2 de Defesa por 3 rodadas", escrito na hora. É uma linha
 *      do Motor com duração, no mesmo shape do Funcionamento Básico.
 *   3. TEMPORÁRIOS  o que a própria criatura concede com `duracao: "temporaria"`
 *      (Feitiço Auxiliar, Habilidade Única, linha do Funcionamento Básico). Só
 *      LISTA, e não liga nem desliga: ver o aviso abaixo.
 *   4. CONDIÇÕES    marcadores com duração.
 *
 * ⚠ OS TEMPORÁRIOS SÃO SÓ LEITURA, e isso segue a assunção do Motor (ver
 * `afty-efeitos.js`): efeito temporário fica sempre ligado na ficha. Eles já
 * estavam entrando na conta desde sempre, o que faltava era APARECER — sem a
 * lista, um +4 de Força temporário e um permanente eram o mesmo número, e o
 * jogador não tinha como saber qual dos dois ele perde no fim da cena.
 *
 * ⚠ AS CONDIÇÕES SÃO SÓ MARCADORES, e isso é honestidade e não preguiça: o
 * `CONDICOES_CATALOGO` tem as 26 condições em quatro forças, e NENHUMA tem
 * efeito mecânico modelado no Afty. Marcar "Cego" e inventar um -4 seria número
 * saído do nada. Qualquer número que a condição imponha entra como buff ad-hoc,
 * que é onde ele fica visível e rastreável. Ver a pergunta D6.
 * ============================================================
 */

/* Acima de quantas opções a linha de escolha nasce fechada. Três é o ponto em
   que a fileira ainda cabe ao lado do rótulo numa tela de celular: a Manobra
   Finalizadora tem três e continua aberta, a Postura tem oito e fecha. */
const MAX_OPCOES_ABERTAS = 3;

function Secao({ titulo, children, direita }) {
  return (
    <section className="afty-card p-3">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1">{titulo}</h2>
        {direita}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

/* Uma linha do catálogo de estados. `delta` é o que ligar este estado muda na
   ficha, calculado por fora (ver `deltaDosEstados`).

   Ela NÃO desenha a própria caixa: quem desenha é o `GrupoDeEstados`, para o
   estado e os que dependem dele lerem como uma coisa só. A classe
   `afty-estado-linha` é o gancho estável do CSS do usuário e da densidade
   compacta, que antes apertava a `.afty-linha` de cada estado. */
function LinhaEstado({ estado, valor, delta, opcoes, onValor, derived, bloqueado }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  /* ⚠ A LISTA DE OPÇÕES LONGA NASCE FECHADA (2026-08-28). A Postura tem oito, e
     oito botões numa linha que as vizinhas resolvem com um só faziam três
     coisas ruins de uma vez: quebravam em três fileiras no celular (onde o
     `pointer: coarse` põe todo botão em 44px), deixavam a linha quatro vezes
     mais alta que a de cima, e empurravam a coluna de controle para um x
     diferente do resto da lista.

     Fechada, ela mostra a ESCOLHA ATUAL, que é a informação que se procura no
     meio do turno, e abre as outras ao toque. Abaixo do teto continua tudo à
     mostra, porque duas ou três opções nunca foram o problema. */
  const [opcoesAbertas, setOpcoesAbertas] = useState(false);
  const escolhaEmLista = ["opcao", "dominio"].includes(estado.tipo);
  const fecha = escolhaEmLista && opcoes.length > MAX_OPCOES_ABERTAS;
  const escolhida = escolhaEmLista ? opcoes.find((o) => o.id === valor) : null;
  /* O rótulo pode vir encurtado pelo cabeçalho de família ("Manobra · Ajuste"
     embaixo de "Manobra" é só "Ajuste"). O `title` guarda o do catálogo, que é
     o inteiro: sem ele um rótulo aparado no `truncate` não teria como ser lido.
     Ver `organizaEstados`. */
  const rotulo = estado.rotulo ?? estado.label;
  return (
    <div className="afty-estado-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={estado.title || estado.label}>
        {rotulo}
        {/* A escolha corrente ao lado do nome, e não dentro do controle: com a
            lista fechada, ela é o que a linha está fazendo. */}
        {fecha && escolhida && (
          <span className="afty-estado-escolha">{escolhida.label}</span>
        )}
      </span>

      {/* ⚠ O DELTA É TEXTO, E NÃO PÍLULA (autor, 2026-08-28). Era um `afty-chip`
          com borda, fundo e canto de 9999px, e numa lista de quarenta linhas
          aquilo virava quarenta cápsulas disputando a atenção com os botões que
          estão logo ao lado e que são o que se CLICA. O delta é leitura, não
          alvo. Mesmo desenho dos pré-requisitos do criador: texto miúdo em roxo,
          separados por um ponto médio. */}
      {delta.length > 0 && (
        <span className="afty-estado-delta">
          {delta.map((d) => (
            <span key={d.rotulo} className="afty-delta">{d.rotulo} {d.texto}</span>
          ))}
        </span>
      )}
      {estado.custoPE != null && valor && (
        <span className="afty-valor text-[11px]" data-afty-tom="custo">{estado.custoPE} PE</span>
      )}

      {/* ⚠ A COLUNA DE CONTROLE TEM LARGURA RESERVADA, e é o que tira o
          serrilhado da direita: um `bool` entrega um botão, uma `faixa` entrega
          três células e uma `opcao` entrega de duas a oito, então sem piso a
          borda esquerda do controle caía num lugar por linha ao longo de
          quarenta delas. Mesma resposta que os chips numerados receberam em
          2026-08-06, ver o `data-afty-tag` no ficha.css. */}
      <span className="afty-estado-controle">
        {estado.tipo === "bool" ? (
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={valor ? "destaque" : undefined}
            aria-pressed={!!valor}
            disabled={bloqueado && !valor}
            title={bloqueado && !valor ? "Já usada nesta rodada" : undefined}
            onClick={() => onValor(estado, !valor)}
          >
            {valor ? "Ativa" : bloqueado ? "Usada" : "Inativa"}
          </button>
        ) : estado.tipo === "multi" ? (
          <span className="flex items-center gap-1 flex-wrap justify-end">
            {opcoes.map((o) => {
              const atuais = Array.isArray(valor) ? valor : [];
              const ativo = atuais.includes(o.id);
              const cheio = atuais.length >= (estado.maxSelecionados ?? 0);
              return (
                <button
                  key={o.id}
                  type="button"
                  className="afty-botao"
                  data-afty-tom={ativo ? "destaque" : undefined}
                  aria-pressed={ativo}
                  title={o.title}
                  onClick={() => onValor(
                    estado,
                    ativo ? atuais.filter((id) => id !== o.id) : cheio ? atuais : [...atuais, o.id],
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </span>
        ) : escolhaEmLista && fecha ? (
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={escolhida ? "destaque" : undefined}
            aria-expanded={opcoesAbertas}
            onClick={() => setOpcoesAbertas((a) => !a)}
          >
            {escolhida ? "Trocar" : "Escolher"}
          </button>
        ) : escolhaEmLista ? (
          <span className="flex items-center gap-1 flex-wrap justify-end">
            {opcoes.map((o) => (
              <button
                key={o.id}
                type="button"
                className="afty-botao"
                data-afty-tom={valor === o.id ? "destaque" : undefined}
                aria-pressed={valor === o.id}
                title={o.title}
                onClick={() => onValor(estado, valor === o.id ? null : o.id)}
              >
                {o.label}
              </button>
            ))}
          </span>
        ) : (
          <span className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.max(estado.min ?? 0, (valor || 0) - 1))}
              aria-label={`${estado.label} menos 1`}
            >
              −
            </button>
            <span className="afty-valor text-[13px] w-8 text-center">{valor || 0}</span>
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.min(teto ?? 0, (valor || 0) + 1))}
              aria-label={`${estado.label} mais 1`}
            >
              +
            </button>
          </span>
        )}
      </span>

      {/* As opções, quando a lista longa está aberta. Fileira PRÓPRIA, embaixo,
          e não ao lado: é o que deixa a linha fechada ter a mesma altura das
          vizinhas e a aberta crescer sem desalinhar ninguém. */}
      {fecha && opcoesAbertas && (
        <div className="afty-estado-opcoes">
          {opcoes.map((o) => (
            <button
              key={o.id}
              type="button"
              className="afty-botao"
              data-afty-tom={valor === o.id ? "destaque" : undefined}
              aria-pressed={valor === o.id}
              title={o.title}
              onClick={() => {
                onValor(estado, valor === o.id ? null : o.id);
                setOpcoesAbertas(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Uma condição em cima da criatura.

   ⚠ ELA ABRE (autor, 2026-08-28: "não consigo ver visualmente as condições,
   saber seus efeitos, nível da condição"). Antes era uma fileira com o nome, a
   CHAVE CRUA da força ("media", em minúscula) numa pílula e mais nada. Agora o
   degrau aparece como degrau, e a linha abre no texto.

   ⚠ O TEXTO AINDA NÃO EXISTE, e isso está dito na tela em vez de escondido: o
   `CONDICAO_TEXTOS` nasceu vazio porque inventar o que faz "Fragilizado" seria
   número saído do nada. Quando o autor mandar, a linha já sabe abrir. Ver
   `afty-condicoes.js`. */
function LinhaCondicao({ condicao, aberta, onAbrir, onRemover }) {
  const { nome, nivel, forcaLabel, resumo, descricao, travada } = condicao;
  return (
    <div className="afty-linha" data-afty-condicao={nome}>
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
          onClick={onAbrir}
          aria-expanded={aberta}
        >
          {aberta
            ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
          <span className="text-[12px] font-semibold truncate">{nome}</span>
          {resumo && (
            <span className="afty-rotulo text-[10px] truncate hidden sm:block">{resumo}</span>
          )}
        </button>

        {/* O degrau. Quatro traços, os cheios até o nível da condição: a força é
            uma ESCALA de quatro, e uma palavra sozinha não diz que "Forte" é a
            terceira. A palavra fica ao lado, para quem lê e não olha. */}
        {nivel > 0 && (
          <span className="afty-forca" data-afty-forca={nivel} title={`Força ${nivel} de 4: ${forcaLabel}`}>
            <span className="afty-forca-degraus" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} data-afty-cheio={n <= nivel ? "sim" : undefined} />
              ))}
            </span>
            <span className="afty-forca-nome">{forcaLabel}</span>
          </span>
        )}
        {condicao.rodadas != null && (
          <span className="afty-chip" data-afty-tag="vezes" title="Rodadas restantes">{condicao.rodadas}</span>
        )}
        <button
          type="button" className="afty-passo"
          disabled={travada}
          title={travada ? "Imposta pelo Ritual Estendido" : undefined}
          onClick={onRemover}
          aria-label={`Remover ${nome}`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {aberta && (
        <div className="px-2.5 pb-2 pl-8">
          {descricao
            ? <p className="afty-texto">{descricao}</p>
            : <p className="afty-vazio text-[11px]">Efeito ainda não transcrito. Use um buff para o número.</p>}
        </div>
      )}
    </div>
  );
}

/* O interruptor de entrar em combate. Ele mora no canto do PRIMEIRO cartão de
   estados que aparecer, e por isso virou componente: com os Ligados Agora na
   tela, o cartão de cima é aquele, e sem eles é o "Estados". Dois botões iguais
   em dois cartões seria duas verdades para o mesmo bit. */
function BotaoEmCombate({ combate, onPatchCombate }) {
  return (
    <button
      type="button"
      className="afty-botao"
      data-afty-tom={combate.ativo ? "destaque" : undefined}
      aria-pressed={!!combate.ativo}
      onClick={() => onPatchCombate({ ativo: !combate.ativo })}
    >
      Em Combate
    </button>
  );
}

/* Um estado e os que DEPENDEM dele, numa caixa só.

   `requerEstado` sempre significou "esta linha só existe com aquela ligada", mas
   a lista era achatada e as duas liam como assuntos separados: o autor apontou
   isso na imbuição das Técnicas de Estilo, que apareciam soltas embaixo do
   interruptor do Novo Estilo das Sombras (2026-08-10). Vale igual para as pilhas
   da Brutalidade e para o PE Extra dela, que declaram a mesma dependência.

   O pai desenha a caixa, os filhos entram dentro dela recuados e com um fio
   correndo ao lado. Nenhum estado precisou de campo novo. */
function GrupoDeEstados({ pai, filhos, children }) {
  return (
    <div className="afty-linha afty-estado-caixa" data-afty-estado={pai.id}>
      {children}
      {filhos.length > 0 && <div className="afty-estado-filhos">{filhos}</div>}
    </div>
  );
}

/* O formulário do buff ad-hoc. Reusa o vocabulário do Motor: canal, alvo
   opcional e uma expressão do DSL (que na prática costuma ser só um número). */
function NovoBuff({ onCriar }) {
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("defesa");
  const [expr, setExpr] = useState("");
  const [rodadas, setRodadas] = useState("");

  const def = getCanal(canal);
  const cria = () => {
    const valor = expr.trim();
    if (!valor) return;
    onCriar({
      id: `buff_${Date.now().toString(36)}`,
      nome: nome.trim() || def?.label || "Buff",
      canal,
      expr: valor,
      rodadas: rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null,
    });
    setNome(""); setExpr(""); setRodadas("");
  };

  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5 flex-wrap">
      <input
        type="text" value={nome} onChange={(e) => setNome(e.target.value)}
        placeholder="Nome" aria-label="Nome do buff"
        className="afty-campo bg-transparent outline-none flex-1 min-w-[6rem]"
      />
      {/* ⚠ Era um `<select>` com os canais numa lista corrida, e o autor pediu o
          do Motor em 2026-08-06: são dezenas de canais, e o nativo os despeja
          num tubo sem grupo nenhum. Ver `CanalPicker`. */}
      <CanalPicker value={canal} onChange={setCanal} />
      <input
        type="text" value={expr} onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="+2" aria-label="Valor ou expressão"
        className="afty-campo bg-transparent outline-none w-16 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <input
        type="text" inputMode="numeric" value={rodadas} onChange={(e) => setRodadas(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="∞" aria-label="Duração em rodadas"
        className="afty-campo bg-transparent outline-none w-12 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <button type="button" className="afty-botao" onClick={cria} aria-label="Adicionar o buff">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AbaBuffs({
  derived, sessao, onPatchCombate, onEstado, onBuffs, onCondicoes, deltaPorEstado,
  onConceder, onRemoverConcessao,
}) {
  const combate = derived.combate ?? {};
  const [novaCondicao, setNovaCondicao] = useState("");

  /* ⚠ A CONCESSÃO É RECURSO DE ADDON, e não do raw (autor, 2026-08-20, vendo o
     card aparecer na tela de quem não usa addon nenhum). Só enxerga quem
     instalou um pacote com `permite: ["concessao"]`.

     O `|| já tem alguma coisa` não é folga: sem ele, desinstalar o addon
     deixaria a linha morta presa na sessão sem botão de tirar. */
  const concedido = derived.concedido ?? [];
  const mostraConcessao = usePrimitiva("concessao") || concedido.length > 0;

  /* Os estados que ESTA criatura alcança. Mesma filtragem da bancada do
     criador: quem não pegou a habilidade não vê a linha.

     ⚠ As listas são lidas DENTRO do memo, e não fora: `derived.x ?? []` cria um
     array novo a cada render, e como dependência ele invalidaria o memo sempre.
     Depender do `derived` inteiro é o certo, porque é ele que muda de verdade. */
  const linhas = useMemo(() => {
    const escolhidas = derived.habilidades?.escolhidas ?? [];
    const talentos = derived.talentos?.escolhidas ?? [];
    const aptidoes = derived.aptidoesEscolhidas ?? [];
    const opcoesEscolhidas = Object.values(derived.habilidades?.escolhas?.mapa ?? {}).flat();
    const temHabilidade = (req) =>
      (Array.isArray(req) ? req : [req]).some((id) => escolhidas.includes(id));
    const opcoesDe = (e) => {
      if (e.tipo === "dominio") {
        return (derived.dominios?.lista ?? []).map((d) => ({
          id: d.id,
          label: d.nome || "Domínio Sem Nome",
        }));
      }
      return (e.opcoes ?? [])
        .filter((o) => !o.requerEscolha || opcoesEscolhidas.includes(o.requerEscolha));
    };
    return [
      ...COMBATE_ESTADOS.filter((e) => {
        const temDono = e.requerEscolha ? opcoesEscolhidas.includes(e.requerEscolha)
          : e.requerTalento ? talentos.includes(e.requerTalento)
          : e.requerAptidao ? aptidoes.includes(e.requerAptidao)
          : temHabilidade(e.requerHabilidade);
        return temDono && (!["opcao", "dominio"].includes(e.tipo) || opcoesDe(e).length > 0);
      }),
      // ⚠ O `tipo` vem antes do espalhamento: a imbuição de Técnica de Estilo é
      // `faixa`, e o extra que não declara nada continua caindo em `bool`.
      ...(derived.combate?.estadosExtras ?? []).map((e) => ({ tipo: "bool", ...e })),
    ].map((e) => ({ ...e, opcoesVisiveis: opcoesDe(e) }));
  }, [derived]);

  /* O filtro local, gêmeo do das abas Habilidades e Equipamentos: some com Esc
     e não é gravado na sessão, porque é estado de TELA. */
  const [termo, setTermo] = useState("");
  /* A sub-aba escolhida. Guarda só a escolha, e quem a conserta quando o filtro
     esvazia a divisão aberta é a conta de leitura logo abaixo, e não um efeito:
     efeito que chama setState é cascata, e o eslint do projeto barra. */
  const [subEscolhida, setSubEscolhida] = useState(null);

  /* As linhas em ÁRVORE, por sub-aba e por família. Quem faz a conta é o
     `organizaEstados`, que é puro e testado à parte: o parentesco do
     `requerEstado`, o dono de cada estado e o cabeçalho de família saem todos de
     lá. Ver `ficha-estados.js`. */
  const { subs, blocosDaSub } = useMemo(
    () => organizaEstados(linhas, termo),
    [linhas, termo],
  );
  const subAtiva = subs.some((x) => x.id === subEscolhida)
    ? subEscolhida
    : (subs[0]?.id ?? null);
  const blocos = blocosDaSub[subAtiva] ?? [];

  /* ⚠ OS LIGADOS SAEM DA MESMA `estaLigado` QUE O DELTA USA, e não de um teste
     escrito aqui: esta seção mostra exatamente as linhas para as quais o
     `deltaDosEstados` calculou um chip. Com duas definições de "ligado", a
     seção listaria uma linha sem chip nenhum, ou esconderia uma que tem.

     A lista é PLANA e com o rótulo INTEIRO, ao contrário da de baixo: aqui não
     se procura nada, se lê o que está valendo, e "Brutalidade · Pilhas" sem a
     caixa do pai ao redor precisa dizer de quem é.

     Fora de combate ela não aparece, porque `ativo: false` zera tudo. */
  const ligados = useMemo(
    () => {
      // ⚠ O `combate` é lido DENTRO, pela mesma razão anotada no memo das
      // linhas: `derived.combate ?? {}` cria objeto novo a cada render, e como
      // dependência ele invalidaria este memo sempre. Depender do `derived`
      // inteiro é o certo, porque é ele que muda de verdade.
      const c = derived.combate ?? {};
      if (!c.ativo) return [];
      /* ⚠ O `requerEstado` vale AQUI TAMBÉM. O valor de um filho não é zerado
         quando o pai desliga, então um "Pilhas 3" esquecido de uma luta anterior
         continua ligado no papel: sem esta guarda ele subiria para o topo da aba
         enquanto a lista de baixo, que aplica o mesmo teste, o esconde. */
      return linhas.filter((e) => estaLigado(e, c[e.id]) && (!e.requerEstado || c[e.requerEstado]));
    },
    [linhas, derived],
  );

  /* Os efeitos TEMPORÁRIOS que a criatura carrega, tirados dos `detalhes` do
     Motor (é lá que cada efeito aplicado deixa rastro, com origem e valor).

     ⚠ Desduplica por (nome, canal, alvo, valor): o `ef` é a mescla de vários
     estágios, e um efeito que apareça em dois deles viraria duas linhas iguais
     na tela sem estar contando duas vezes na ficha. */
  const temporarios = useMemo(() => {
    const vistos = new Set();
    /* ⚠ UMA LINHA POR FONTE, e não por canal (autor, 2026-08-28, com captura de
       "Assumir Postura (Postura da Terra)" ocupando duas fileiras seguidas).
       Uma Postura que dá bônus em TR e PV Temporário é UMA coisa que a criatura
       está fazendo, e ela some inteira quando a Postura sai. Lida como duas
       linhas de nome idêntico, parecia efeito duplicado. */
    const porFonte = new Map();
    for (const d of derived.efeitos?.detalhes ?? []) {
      if (d.duracao !== "temporaria" || !d.valor) continue;
      // ⚠ Buff ad-hoc da SESSÃO fica de fora (2026-08-10). O `efeitosDaSessao`
      // carimba `duracao: "temporaria"` em tudo que o jogador cria na seção de
      // cima desta mesma aba, então o mesmo +2 saía duas vezes: uma editável,
      // com botão de apagar, e outra aqui em só leitura. Lido de cima a baixo
      // aquilo são dois bônus, e o segundo parece não ser dele para desligar.
      if (d.origem === "sessao") continue;
      const chave = `${d.nome}|${d.canal}|${d.alvo ?? ""}|${d.valor}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const def = getCanal(d.canal);
      /* ⚠ A ORIGEM SAIU DA TELA. Ela vinha como id cru do catálogo
         (`cmb_postura_da_terra` ao lado de "Assumir Postura (Postura da
         Terra)"), e id na Ficha é vazamento de implementação: o nome já diz de
         onde veio, e quando não diz, o id também não ajuda quem joga. */
      const nome = d.nome || d.origem || "Efeito";
      if (!porFonte.has(nome)) porFonte.set(nome, { chave: nome, nome, partes: [] });
      porFonte.get(nome).partes.push({
        chave,
        canalLabel: (def?.label ?? d.canal) + (d.alvo ? ` (${d.alvo})` : ""),
        valor: d.valor,
        suplantado: !!d.suplantado,
      });
    }
    return [...porFonte.values()];
  }, [derived]);

  const visivel = (e) => !e.requerEstado || combate[e.requerEstado];
  const buffs = sessao.buffs ?? [];
  const condicoes = sessao.condicoes ?? [];

  /* As condições da sessão, cada uma com a força e o texto resolvidos, e
     ordenadas pela GRAVIDADE. Com três em cima da criatura, a que mais dói tem
     de estar no topo, e a ordem de quem clicou primeiro não diz nada.

     ⚠ A ordenação é ESTÁVEL: `sort` comparando só o nível preserva a ordem de
     chegada dentro da mesma força, então marcar duas Fracas não faz uma pular
     por cima da outra a cada render. */
  const condicoesNaCriatura = useMemo(
    () => (sessao.condicoes ?? [])
      .map((c) => ({
        ...fichaDaCondicao(c.nome, c.forca),
        id: c.id,
        rodadas: c.rodadas,
        // A do Ritual Estendido não sai pelo X: quem a tirou foi o ritual.
        travada: c.id === "ritual:desprevenido",
      }))
      .sort((a, b) => b.nivel - a.nivel),
    [sessao.condicoes],
  );
  const porForca = useMemo(() => condicoesPorForca(), []);
  const [condicaoAberta, setCondicaoAberta] = useState(null);

  return (
    <div className="space-y-3">
      {/* ---------- concedido pelo mestre (Addons 8.3) ----------
          Primeiro da aba quando aparece, e de propósito: é o único bloco daqui
          em que a criatura na mesa passa a ser diferente da criatura no papel.

          Some inteiro para quem só usa o raw. Ver `mostraConcessao`. */}
      {mostraConcessao && (
        <PainelDeConcessao
          concedido={concedido}
          onConceder={onConceder}
          onRemover={onRemoverConcessao}
        />
      )}

      {/* ---------- o que está ligado agora ----------
          Primeiro da lista de estados, e é a pergunta que se faz no meio do
          turno. Antes dela, as três ou quatro linhas ligadas ficavam espalhadas
          entre quarenta apagadas, na ordem do arquivo de catálogo. */}
      {ligados.length > 0 && (
        <Secao titulo="Ligados Agora" direita={<BotaoEmCombate combate={combate} onPatchCombate={onPatchCombate} />}>
          <div className="space-y-1" data-afty-estados="ligados">
            {ligados.map((e) => (
              <div key={e.id} className="afty-linha afty-estado-caixa" data-afty-estado={e.id}>
                <LinhaEstado
                  estado={e}
                  valor={combate[e.id]}
                  opcoes={e.opcoesVisiveis}
                  delta={deltaPorEstado[e.id] ?? []}
                  onValor={onEstado}
                  derived={derived}
                  bloqueado={e.umaVezPorRodada && estadoUsadoNestaRodada(sessao, e.id)}
                />
              </div>
            ))}
          </div>
        </Secao>
      )}

      {/* ---------- catalogados ---------- */}
      {linhas.length > 0 && (
        <Secao
          titulo="Estados"
          direita={ligados.length > 0 ? null : <BotaoEmCombate combate={combate} onPatchCombate={onPatchCombate} />}
        >
          {/* O filtro local, gêmeo do das Habilidades: casa contra o rótulo do
              catálogo, com a família na frente, então procurar "manobra" acha as
              quatro Manobras mesmo depois que o cabeçalho tirou a palavra dos
              rótulos delas. */}
          <div className="afty-linha px-2.5 py-1.5 flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setTermo(""); }}
              placeholder="Filtrar"
              aria-label="Filtrar os estados"
              className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
            />
            {termo && (
              <button type="button" className="afty-passo" onClick={() => setTermo("")} aria-label="Limpar o filtro">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <SubAbas subs={subs} ativa={subAtiva} rotulo="Estados" onAtiva={setSubEscolhida} />

          {/* ⚠ Fora de combate TUDO zera, e é por isso que a lista fica apagada
              em vez de sumir: o jogador precisa ver o que existe para saber que
              tem de entrar em combate primeiro. */}
          <div className={combate.ativo ? "space-y-1" : "space-y-1 opacity-40 pointer-events-none"}>
            {blocos.length === 0 && <p className="afty-vazio px-1 py-2">Nada com esse filtro</p>}
            {blocos.map((bloco, i) => {
              const visiveis = bloco.grupos.filter(({ pai }) => visivel(pai));
              if (!visiveis.length) return null;
              return (
                /* A chave leva o índice porque uma família pode voltar a
                   aparecer depois de um trecho sem cabeçalho, e o bloco sem
                   cabeçalho não tem nome nenhum para dar. */
                <div key={`${bloco.familia ?? ""}#${i}`} className="space-y-1">
                  {bloco.familia && <p className="afty-estado-familia">{bloco.familia}</p>}
                  {visiveis.map(({ pai, filhos }) => {
                    const linha = (e) => (
                      <LinhaEstado
                        key={e.id}
                        estado={e}
                        valor={combate[e.id]}
                        opcoes={e.opcoesVisiveis}
                        delta={deltaPorEstado[e.id] ?? []}
                        onValor={onEstado}
                        derived={derived}
                        bloqueado={e.umaVezPorRodada && estadoUsadoNestaRodada(sessao, e.id)}
                      />
                    );
                    return (
                      <GrupoDeEstados key={pai.id} pai={pai} filhos={filhos.filter(visivel).map(linha)}>
                        {linha(pai)}
                      </GrupoDeEstados>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Secao>
      )}

      {/* ---------- ad-hoc ---------- */}
      <Secao titulo="Buffs">
        {buffs.map((b) => (
          <div key={b.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{b.nome}</span>
            <span className="afty-rotulo text-[10px] truncate">{getCanal(b.canal)?.label ?? b.canal}</span>
            <span className="afty-valor text-[12px]">{b.expr}</span>
            {b.rodadas != null && (
              <span className="afty-chip" title="Rodadas restantes">{b.rodadas}</span>
            )}
            <button
              type="button" className="afty-passo"
              onClick={() => onBuffs(buffs.filter((x) => x.id !== b.id))}
              aria-label={`Remover ${b.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <NovoBuff onCriar={(b) => onBuffs([...buffs, b])} />
      </Secao>

      {/* ---------- temporários da própria criatura ---------- */}
      {temporarios.length > 0 && (
        <Secao titulo="Temporários">
          {temporarios.map((t) => (
            <div key={t.chave} className="afty-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
              <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={t.nome}>{t.nome}</span>
              {/* Os canais como texto na mesma régua do delta dos estados: nas
                  duas seções a pergunta é "quanto isto está me dando", e duas
                  respostas com desenhos diferentes seriam duas linguagens. */}
              <span className="afty-estado-delta">
                {t.partes.map((p) => (
                  <span
                    key={p.chave}
                    className="afty-delta"
                    data-afty-suplantado={p.suplantado ? "sim" : undefined}
                    title={p.suplantado ? "Perdeu o pool exclusivo para uma fonte maior: não está somando" : undefined}
                  >
                    {p.canalLabel} {sinalDe(p.valor)}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Já estão somados. Duram até o fim do efeito que os concedeu
          </div>
        </Secao>
      )}

      {/* ---------- condições ---------- */}
      <Secao titulo="Condições">
        {condicoesNaCriatura.map((c) => (
          <LinhaCondicao
            key={c.id}
            condicao={c}
            aberta={condicaoAberta === c.id}
            onAbrir={() => setCondicaoAberta((a) => (a === c.id ? null : c.id))}
            onRemover={() => onCondicoes(condicoes.filter((x) => x.id !== c.id))}
          />
        ))}
        <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5">
          {/* ⚠ AGRUPADO POR FORÇA, com `optgroup`. Eram 26 nomes num tubo em
              ordem de escrita do catálogo, então escolher exigia saber de cor
              qual era fraca e qual era extrema. O grupo põe o degrau na frente
              da escolha, que é onde ele serve. */}
          <select
            value={novaCondicao}
            onChange={(e) => setNovaCondicao(e.target.value)}
            aria-label="Condição"
            className="afty-campo bg-transparent outline-none flex-1 min-w-0"
            style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "2px 4px" }}
          >
            <option value="" style={{ background: "var(--afty-card)" }}>Escolher</option>
            {porForca.map((g) => (
              <optgroup key={g.id} label={`${g.nivel}. ${g.label}`} style={{ background: "var(--afty-card)" }}>
                {g.condicoes.map((c) => (
                  <option key={c.nome} value={c.nome} style={{ background: "var(--afty-card)" }}>{c.nome}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            className="afty-botao"
            disabled={!novaCondicao}
            onClick={() => {
              const def = fichaDaCondicao(novaCondicao);
              if (!def.forcaId) return;
              onCondicoes([...condicoes, {
                id: `cond_${Date.now().toString(36)}`, nome: def.nome, forca: def.forcaId, rodadas: null,
              }]);
              setNovaCondicao("");
            }}
            aria-label="Adicionar a condição"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* ⚠ O aviso some para quem tem Guarda Inabalável, e some porque
            PASSOU A SER MENTIRA em 2026-08-26: oito condições derrubam a Guarda
            do Calamidade e do Beyond, e derrubar a Guarda muda a Defesa e os
            cinco TRs. Para todo o resto ele continua valendo. */}
        {condicoes.length > 0 && !derived.guarda?.ativa && (
          <div className="afty-chip mt-1" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Condição não muda número, resolve na mesa
          </div>
        )}
      </Secao>
    </div>
  );
}
