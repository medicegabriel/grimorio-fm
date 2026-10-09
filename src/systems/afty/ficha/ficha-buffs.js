import { deriveAfty } from "../afty-derive";
import { COMBATE_ESTADOS, estadoVisivel } from "../afty-combate";
import { expandeHerdadas } from "../afty-habilidades";
import { sinalDe, numeroBr } from "../ui/formato";
import { OUTROS } from "./ficha-estados";

/**
 * ============================================================
 * DELTA DOS BUFFS — o que ligar aquilo está fazendo por você
 * ============================================================
 * Uma bancada que liga interruptores sem dizer o que mudou obriga o jogador a
 * decorar a ficha antes e depois. Aqui o número aparece na própria linha.
 *
 * ⚠ O MECANISMO NÃO PEDE NADA DO MOTOR: roda o `deriveAfty` de novo com aquele
 * estado desligado e compara. É exato por construção, porque quem calcula a
 * diferença é o mesmo código que calcula a ficha, e não uma segunda
 * implementação que envelheceria à parte.
 *
 * ⚠ E É EXATO SÓ ENQUANTO AS DUAS DERIVAÇÕES RECEBEREM A MESMA ENTRADA. Mesmo
 * código com opções diferentes mente igual a código diferente, e mente pior,
 * porque parece certo: a diferença que vem da opção esquecida sai carimbada
 * como bônus do estado medido, em TODA linha ligada de uma vez. Foi assim que a
 * Guarda Inabalável virou "+5 de Defesa" da Postura da Devastação. Por isso as
 * opções chegam prontas da Ficha, num objeto só, e ninguém aqui escolhe o que
 * repassar.
 *
 * ⚠ Só os estados LIGADOS entram na conta, e isso não é economia: a pergunta
 * útil é "o que a Brutalidade está me dando AGORA", e não "o que ela daria".
 * De quebra o custo cai de um derive por linha visível para um por linha ligada,
 * que na prática são três ou quatro. O derive de uma ficha de ND 40 com tudo
 * que na prática são três ou quatro.
 *
 * ⚠ O NÚMERO ANTIGO DESTE COMENTÁRIO ENVELHECEU. Ele dizia 1,75ms por derive
 * de ND 40 (medido em 2026-08-05). Em 2026-09-22 medi 6,34ms na mesma bancada:
 * as condições, as auras, as invocações em sessão e o Ápice encareceram o
 * derive. O cache de AST e de variável da DSL o trouxe de volta para 3,36ms.
 * ============================================================
 */

/** Os stats que valem virar chip. Mais que isto vira poluição na linha. */
const OBSERVADOS = [
  { chave: "hp", rotulo: "PV" },
  { chave: "pvTemporario", rotulo: "PV Temp" },
  { chave: "pe", rotulo: "PE" },
  { chave: "defesa", rotulo: "Defesa" },
  { chave: "cd", rotulo: "CD" },
  { chave: "rdGeral", rotulo: "RD" },
  { chave: "movimento", rotulo: "Mov", metros: true },
  { chave: "iniciativa", rotulo: "Inic" },
  { chave: "atencao", rotulo: "Atenção" },
];

/** O valor "desligado" de cada tipo de estado. Exportado para o × dos
    ladrilhos de "Ligados Agora", que desliga pelo mesmo valor que o delta mede. */
export const padraoDe = (e) =>
  (e.tipo === "bool" ? false
    : ["opcao", "dominio"].includes(e.tipo) ? null
    // ⚠ O `multi` desliga com LISTA VAZIA, e não com zero. Ele chegou em
    // 2026-08-28 com o Concentrar Aura, e um zero aqui é o mesmo que vazio só
    // porque quem lê o campo passa por `Array.isArray`. Deixar o tipo errado é
    // esperar que o próximo leitor tenha a mesma gentileza.
    : e.tipo === "multi" ? []
    : (e.min ?? 0));

/** Está ligado? Faixa conta a partir do mínimo, que é o piso dela.
 *
 * ⚠ EXPORTADO desde 2026-08-28, e é de propósito que a aba Buffs importe DAQUI
 * em vez de reimplementar: a seção "Ligados Agora" mostra exatamente as linhas
 * para as quais este arquivo calcula um delta. Duas definições de "ligado" e a
 * seção listaria uma linha sem chip, ou esconderia uma que tem. */
export const estaLigado = (e, v) =>
  (e.tipo === "faixa" ? (v ?? 0) > (e.min ?? 0)
    // `!![]` é verdadeiro, então sem esta linha um `multi` sem nada escolhido
    // pagaria um derive inteiro para descobrir que não mudou coisa nenhuma.
    : e.tipo === "multi" ? Array.isArray(v) && v.length > 0
    : !!v);

/**
 * Compara duas fichas derivadas e devolve as diferenças em formato de chip.
 * Além dos stats simples, olha a PRIMEIRA linha de dano (o Ataque Básico), que
 * é onde a maioria dos estados de combate mexe.
 */
function comparar(comEle, semEle) {
  const chips = [];
  for (const o of OBSERVADOS) {
    const d = (comEle[o.chave] ?? 0) - (semEle[o.chave] ?? 0);
    if (!d) continue;
    chips.push({ rotulo: o.rotulo, texto: o.metros ? `${d > 0 ? "+" : "−"}${numeroBr(Math.abs(d))}m` : sinalDe(d) });
  }

  const danoCom = comEle.dano?.entradas?.[0];
  const danoSem = semEle.dano?.entradas?.[0];
  if (danoCom && danoSem) {
    const dTotal = (danoCom.total ?? 0) - (danoSem.total ?? 0);
    if (dTotal) chips.push({ rotulo: "Dano", texto: sinalDe(dTotal) });
    const dAcerto = (danoCom.acerto ?? 0) - (danoSem.acerto ?? 0);
    if (dAcerto) chips.push({ rotulo: "Acerto", texto: sinalDe(dAcerto) });
    const dDados = (danoCom.dados ?? 0) - (danoSem.dados ?? 0);
    if (dDados) chips.push({ rotulo: "Dados", texto: `${sinalDe(dDados)}${danoCom.dado}` });
  }
  return chips;
}

/* ============================================================ */
/* AS LINHAS DE ESTADO QUE ESTA FICHA DE FATO TEM                */
/* ============================================================ */
/*
 * A lista de estados de bancada que a ficha POSSUI, com as opções já filtradas.
 * Mora aqui, e não na AbaBuffs, porque dois lados precisam da MESMA resposta: a
 * aba, que desenha as linhas, e o `deltaDosEstados` logo abaixo, que paga um
 * `deriveAfty` inteiro por linha ligada.
 *
 * ⚠ ATÉ 2026-09-22 O DELTA NÃO FILTRAVA NADA. Ele montava a lista do catálogo
 * CRU, sem posse e sem visibilidade, enquanto a aba filtrava as duas coisas. O
 * resultado era derive jogado no lixo: um contador esquecido de uma luta
 * anterior, ou o estado de uma Habilidade que a ficha não tem mais, pagava um
 * derive cujo chip nunca era desenhado. Medido com 83 estados marcados, eram 83
 * derives para produzir 8 linhas.
 *
 * ⚠ OS DOIS FILTROS SÃO INVERSOS, e é de propósito. No catálogo, quem não
 * declara dono NÃO aparece. No extra, quem não declara dono APARECE, porque a
 * existência do interruptor já depende do item estar equipado ou da Técnica
 * estar conhecida. O de Addon é a exceção da exceção: existe só por o pacote
 * estar instalado, então ele declara `requer*` e é conferido.
 */
export function linhasDeEstado(derived) {
  /* ⚠ COM AS HERDADAS. O conteúdo do livro cita o id do LIVRO
     (`requerHabilidade: "cnj_conhecimento_aplicado"`), e quem pegou a
     habilidade por uma Especialização que HERDA do Conjurador a tem sob o id
     clonado. Sem expandir, a herdeira recebe o texto e nunca o controle. */
  const escolhidas = expandeHerdadas(
    derived.habilidades?.efetivas ?? derived.habilidades?.escolhidas ?? [],
  );
  const talentos = derived.talentos?.escolhidas ?? [];
  const aptidoes = derived.aptidoesEscolhidas ?? [];
  /* ⚠ E AS OPÇÕES DOS TALENTOS (2026-10-02). O Adepto de Combate empresta o pool
     de Estilos do Combatente com o MESMO id de opção, e o "Duelando" do Estilo
     do Duelista sumia para quem o pegou pelo Talento: o Motor somava o bônus com
     o interruptor ligado, e a tela não tinha o interruptor. */
  const opcoesDeHabilidade = Object.values(derived.habilidades?.escolhas?.mapa ?? {}).flat();
  const opcoesDeTalento = Object.values(derived.talentos?.escolhas?.mapa ?? {}).flat();
  const opcoesEscolhidas = [...opcoesDeHabilidade, ...opcoesDeTalento];
  /* Quem tem a opção só pelo Talento mora em Outros, com os outros estados de
     Talento, e não na sub-aba de uma Especialização que a ficha não tem. */
  const soPeloTalento = (e) => !!e.requerEscolha
    && !opcoesDeHabilidade.includes(e.requerEscolha)
    && opcoesDeTalento.includes(e.requerEscolha);
  const comLista = (req) => (Array.isArray(req) ? req : [req]);
  const temHabilidade = (req) => comLista(req).some((id) => escolhidas.includes(id));
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
      const temDono = e.requerEscolha
        ? opcoesEscolhidas.includes(e.requerEscolha)
          || (!!e.ouRequerApice && derived.altoNivel?.apiceId === e.ouRequerApice)
        : e.requerApice ? derived.altoNivel?.apiceId === e.requerApice
        : e.requerTalento ? talentos.includes(e.requerTalento)
        : e.requerAptidao ? aptidoes.includes(e.requerAptidao)
        : temHabilidade(e.requerHabilidade);
      return temDono && (!["opcao", "dominio"].includes(e.tipo) || opcoesDe(e).length > 0);
    }).map((e) => (soPeloTalento(e) ? { ...e, dono: OUTROS } : e)),
    /* Estados que vêm da FICHA, e não do catálogo: as Habilidades Únicas de item
       marcadas como ativas, a IMBUIÇÃO das Técnicas de Estilo e os de ADDON.

       ⚠ O `tipo` vem antes do espalhamento: a imbuição é `faixa`, e o extra que
       não declara nada continua caindo em `bool`. */
    ...(derived.combate?.estadosExtras ?? [])
      .filter((e) => !e.ocultarEmBuffs
        && (!e.requerTalento || comLista(e.requerTalento).some((id) => talentos.includes(id)))
        && (!e.requerAptidao || comLista(e.requerAptidao).some((id) => aptidoes.includes(id)))
        && (!e.requerHabilidade || temHabilidade(e.requerHabilidade))
        // A quarta porta do Addon (2026-09-28), a opção escolhida. Ver `comDono`.
        && (!e.requerEscolha || comLista(e.requerEscolha).some((id) => opcoesEscolhidas.includes(id))))
      .map((e) => ({ tipo: "bool", ...e })),
  ].map((e) => ({ ...e, opcoesVisiveis: opcoesDe(e) }));
}
/**
 * O delta de cada estado LIGADO, como `{ [estadoId]: [chip, ...] }`.
 *
 * ⚠ AS `opcoes` SÃO AS DA FICHA INTEIRAS, e o `buffs` é o único campo daqui que
 * não é opção do derive: ele entra NA CRIATURA, como `buffsSessao`. Todo o
 * resto é repassado ao `deriveAfty` sem ninguém escolher o que passa.
 *
 * Isso não é frescura de assinatura, é o conserto de 2026-08-28. Antes daqui só
 * saía `{ almaAtual }`, então cada derive de comparação rodava SEM a Guarda
 * Inabalável, SEM o que o mestre concedeu e SEM os três campos de Ritual — e a
 * diferença entre as duas listas de opção era creditada por inteiro ao estado
 * que estava sendo medido. Numa criatura de patamar Calamidade toda linha ligada
 * exibia "Defesa +5" (a Guarda), e a Postura da Devastação, que não dá Defesa
 * nenhuma, aparecia dando +5. Quem escolhe o que passa é a Ficha, num objeto só,
 * e a diferença cancela sozinha.
 *
 * @param ficha     a criatura já mesclada
 * @param combate   o estado da bancada da SESSÃO
 * @param opcoes    as opções do derive da Ficha, mais `buffs`
 * @param atual     a ficha derivada AGORA, para não derivar duas vezes o mesmo
 */
export function deltaDosEstados(ficha, combate, opcoes = {}, atual = null) {
  const out = {};
  if (!combate?.ativo) return out;

  const { buffs, ...opcoesDerive } = opcoes;
  const base = { ...ficha, combate, buffsSessao: buffs ?? [] };
  const comTudo = atual ?? deriveAfty(base, opcoesDerive);

  /* ⚠ A MESMA LISTA QUE A ABA DESENHA, e não o catálogo cru: só entra na conta
     estado que a ficha POSSUI e que está VISÍVEL. Cada linha aqui custa um
     `deriveAfty` inteiro, então derivar o que a aba nunca mostraria era gasto
     puro. Ver o comentário de `linhasDeEstado` acima.

     O `estadoVisivel` é o mesmo portão que a aba usa no estado FILHO: o valor de
     um filho não é zerado quando o pai desliga, então sem ele um contador
     esquecido de uma luta anterior continuava pagando derive. */
  const daFicha = linhasDeEstado(comTudo);
  /* Um por id: se um extra repetir um id do catálogo, vale a definição de quem
     chegou depois, que é a viva. */
  const todos = [...new Map(daFicha.map((e) => [e.id, e])).values()];

  const ligados = todos.filter((e) => estaLigado(e, combate[e.id])
    && estadoVisivel(e, combate));
  for (const e of ligados) {
    const semEle = deriveAfty(
      { ...base, combate: { ...combate, [e.id]: padraoDe(e) } },
      opcoesDerive,
    );
    const chips = comparar(comTudo, semEle);
    if (chips.length) out[e.id] = chips;
  }
  return out;
}

/* ============================================================ */
/* O SALDO: tudo que está ligado, somado (2026-09-22)            */
/* ============================================================ */
/*
 * O autor, com captura de vinte linhas ligadas: *"o Ligado Agora fica MUITO
 * poluído"*. Cada linha dizia o que ELA dava, e a pergunta da mesa é outra:
 * "quanto está a minha Defesa agora, com tudo isto em cima". O jogador somava
 * vinte chips de cabeça.
 *
 * O saldo responde com UM derive a mais: a ficha como está contra a mesma ficha
 * com a bancada vazia, sem buff de mesa e sem condição. É a mesma técnica do
 * delta por estado, e pelo mesmo motivo é exato: quem calcula a diferença é o
 * código que calcula a ficha.
 *
 * ⚠ O SALDO NÃO É A SOMA DOS DELTAS DE CADA LINHA, e não tem de ser. O delta de
 * uma linha é "com ela contra sem ela, com todo o resto ligado", e as regras
 * interagem (condições não acumulam, pool exclusivo fica com o maior). Somar os
 * chips daria número errado, e é por isso que o saldo tem conta própria.
 *
 * ⚠ AS MESMAS OPÇÕES DO DERIVE PRINCIPAL, menos as três coisas que a aba liga:
 * a bancada (`combate`), os buffs de mesa e as condições. A Guarda, a concessão
 * e o resto entram nos dois lados e se cancelam, que é o certo: eles não são
 * desta aba.
 */

/** Os stats do saldo, na ordem da mesa: primeiro o que se rola, depois o que se sofre. */
const SALDO_STATS = [
  { chave: "defesa", rotulo: "Defesa", final: true },
  { chave: "pvTemporario", rotulo: "PV Temp" },
  { chave: "rdGeral", rotulo: "RD Geral", final: true },
  { chave: "rdEspecifico", rotulo: "RD Específica", final: true },
  { chave: "rdFisico", rotulo: "RD Física", final: true },
  { chave: "rdAlma", rotulo: "RD a Alma", final: true },
  { chave: "movimento", rotulo: "Movimento", metros: true, final: true },
  { chave: "voo", rotulo: "Voo", metros: true, final: true },
  { chave: "iniciativa", rotulo: "Iniciativa" },
  { chave: "atencao", rotulo: "Atenção", final: true },
  { chave: "ataquesExtras", rotulo: "Ataques Extras" },
  { chave: "cd", rotulo: "CD", final: true },
  { chave: "hp", rotulo: "PV Máximo" },
  { chave: "pe", rotulo: "PE Máximo" },
];

/* Mais que isto numa lista de itens (perícias, TRs) vira uma marca só com a
   contagem, senão o saldo volta a ser a lista comprida que ele veio substituir. */
const MAX_ITENS_SOLTOS = 4;

/**
 * Uma lista de itens (TRs, perícias) vira marca de grupo quando a maioria mudou
 * igual: "Perícias -2" e, ao lado, só as que fugiram ("Percepção -5"). É o que
 * a regra das condições produz (Envenenado em tudo, Cego só na Percepção).
 */
function saldoDeLista(itens, rotuloGrupo, chave) {
  const mudaram = itens.filter((i) => i.d);
  if (!mudaram.length) return [];
  const contagem = new Map();
  for (const i of mudaram) contagem.set(i.d, (contagem.get(i.d) ?? 0) + 1);
  const [moda, vezes] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
  const marca = (rotulo, d, sufixo) => ({ chave: `${chave}:${sufixo}`, rotulo, valor: d, texto: sinalDe(d) });
  if (vezes * 2 > itens.length) {
    const fora = mudaram.filter((i) => i.d !== moda);
    if (fora.length > MAX_ITENS_SOLTOS) {
      return [marca(rotuloGrupo, moda, "grupo"), { chave: `${chave}:varios`, rotulo: rotuloGrupo, valor: 0, texto: `${fora.length} Diferentes` }];
    }
    return [marca(rotuloGrupo, moda, "grupo"), ...fora.map((i) => marca(i.nome, i.d, i.id))];
  }
  if (mudaram.length > MAX_ITENS_SOLTOS) {
    return [{ chave: `${chave}:varios`, rotulo: rotuloGrupo, valor: 0, texto: `${mudaram.length} Alteradas` }];
  }
  return mudaram.map((i) => marca(i.nome, i.d, i.id));
}

/** O saldo entre duas fichas derivadas, como marcas `{ chave, rotulo, texto, valor, final? }`. */
export function compararSaldo(com, sem) {
  const out = [];
  const poe = (chave, rotulo, d, { metros = false, final = null } = {}) => {
    if (!d) return;
    out.push({
      chave, rotulo, valor: d, final,
      texto: metros ? `${d > 0 ? "+" : "−"}${numeroBr(Math.abs(d))}m` : sinalDe(d),
    });
  };

  // O que se rola: a linha do Ataque Básico, a mesma que o delta de cada estado lê.
  const aCom = com.dano?.entradas?.[0];
  const aSem = sem.dano?.entradas?.[0];
  if (aCom && aSem) {
    poe("acerto", "Acerto", (aCom.acerto ?? 0) - (aSem.acerto ?? 0), { final: sinalDe(aCom.acerto ?? 0) });
    poe("dano", "Dano", (aCom.total ?? 0) - (aSem.total ?? 0));
    const dd = (aCom.dados ?? 0) - (aSem.dados ?? 0);
    if (dd) out.push({ chave: "dados", rotulo: "Dados", valor: dd, texto: `${sinalDe(dd)}${aCom.dado}` });
  }

  const trSem = new Map((sem.testes?.resistencias ?? []).map((r) => [r.value, r.bonus]));
  out.push(...saldoDeLista(
    (com.testes?.resistencias ?? []).map((r) => ({ id: r.value, nome: r.label, d: r.bonus - (trSem.get(r.value) ?? r.bonus) })),
    "TRs", "tr",
  ));
  const perSem = new Map((sem.testes?.pericias ?? []).map((p) => [p.id, p.bonus]));
  out.push(...saldoDeLista(
    (com.testes?.pericias ?? []).map((p) => ({ id: p.id, nome: p.nome, d: p.bonus - (perSem.get(p.id) ?? p.bonus) })),
    "Perícias", "pericia",
  ));

  for (const s of SALDO_STATS) {
    const v = com[s.chave] ?? 0;
    poe(s.chave, s.rotulo, v - (sem[s.chave] ?? 0), {
      metros: s.metros,
      final: s.final ? (s.metros ? `${numeroBr(v)}m` : String(v)) : null,
    });
  }

  // A falha automática não é número, mas é o que mais pesa num TR.
  const nomeTr = new Map((com.testes?.resistencias ?? []).map((r) => [r.value, r.label]));
  for (const [tr, fontes] of Object.entries(com.condicoes?.falhas ?? {})) {
    out.push({ chave: `falha:${tr}`, rotulo: nomeTr.get(tr) ?? tr, valor: -1, texto: "Falha", fontes });
  }
  return out;
}

/**
 * O saldo do que a aba liga, pronto para a faixa "Agora". Vazio quando nada
 * está ligado, sem pagar o derive.
 *
 * @param ficha   a criatura já mesclada
 * @param combate o estado da bancada da SESSÃO
 * @param opcoes  as opções do derive da Ficha, mais `buffs`
 * @param atual   a ficha derivada AGORA, para não derivar duas vezes o mesmo
 */
export function saldoDoAgora(ficha, combate, opcoes = {}, atual = null) {
  const { buffs, ...opcoesDerive } = opcoes;
  const temBancada = Object.values(combate ?? {}).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));
  if (!temBancada && !(buffs?.length) && !(opcoesDerive.condicoes?.length)) return [];
  const comTudo = atual ?? deriveAfty({ ...ficha, combate, buffsSessao: buffs ?? [] }, opcoesDerive);
  const semNada = deriveAfty({ ...ficha, combate: {}, buffsSessao: [] }, { ...opcoesDerive, condicoes: [] });
  return compararSaldo(comTudo, semNada);
}

export { OBSERVADOS };
