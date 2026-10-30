/* ============================================================
   FONTES EXTERNAS NO CÁLCULO
   ============================================================
   Um efeito recebido é um REGISTRO de sessão (em `sessao.buffs`, com
   `rec: true`), nunca ficha:
     tipoFonte    feitico | catalogo | outro
     origemId     identificação estável do catálogo ("aptidao:aura_do_bastiao")
     origemNome   o nome como o jogador informou, preservado
     aplicadoPor  quem aplicou. NÃO muda a identidade nem o acúmulo
     beneficios   [{ canal, valor }]
     rodadas      duração em rodadas, ou null

   ⚠ A LACUNA DO APP: `efeitosDaSessao` (afty-efeitos.js) transforma todo
   Buff de Mesa em bônus genérico, sem `exclusivo`. Um Feitiço recebido
   somava por cima dos Feitiços do personagem, e a mesma habilidade de dois
   aliados somava duas vezes. O registro aqui não tem `canal` no topo, então
   o motor o IGNORA, e quem o põe na conta é `prepararCalculo`:

   1. Feitiço recebido vira um Feitiço Passivo gerado na hora do derive
      (`efeitosDosPassivos` carimba `feiticoAuxiliarPassivo`, grupo
      `feiticos` no jogador). A disputa com os Feitiços do personagem é a do
      próprio `resolverExclusivos`, por valor, e o perdedor sai `suplantado`.
   2. Conteúdo do catálogo repetido (Aura do Bastião de dois aliados) passa
      pelo MESMO `resolverExclusivos`, com um grupo por origem: vale o maior
      em cada valor. Se o personagem já recebe o mesmo efeito da própria
      ficha, esse valor entra como `jaAplicado` e só o que PASSA dele soma.
      Origens diferentes somam entre si.
   3. Origem sem regra conhecida ("outro") com número só entra se o
      jogador escolheu somar mesmo assim (`somaPresumida`).

   Nada disso muda o motor. O que a integração vai exigir dele está na
   entrega: ler `exclusivo` e a origem no Buff de Mesa, e um conceito de
   "repetição do mesmo efeito" ao lado das famílias exclusivas.
   ============================================================ */
import { derivar, ehPlayer } from "./ponte";
import { aplicarEfeitos, resolverExclusivos, chaveExclusiva, grupoExclusivo } from "../../afty-efeitos";
import { AFTY_APTIDOES } from "../../afty-aptidoes";
import { AFTY_HABILIDADES } from "../../afty-habilidades";
import { AFTY_TALENTOS } from "../../afty-talentos";
import { MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS, HABILIDADES_APICE } from "../../afty-alto-nivel";
import { semAcento } from "./util";

export const TIPOS_FONTE = [
  { id: "feitico", rotulo: "Feitiço" },
  { id: "catalogo", rotulo: "Habilidade, Aptidão ou Talento" },
  { id: "outro", rotulo: "Outra Origem" },
];

/* Os valores que um registro pode mexer: canais do motor que valem sem alvo. */
export const CANAIS_EXTERNOS = [
  { id: "defesa", rotulo: "Defesa" },
  { id: "bonusAcerto", rotulo: "Acerto" },
  { id: "danoBonus", rotulo: "Dano" },
  { id: "rdGeral", rotulo: "RD Geral" },
  { id: "movimento", rotulo: "Movimento" },
  { id: "iniciativa", rotulo: "Iniciativa" },
  { id: "atencao", rotulo: "Atenção" },
];
export const rotuloCanal = (id) => CANAIS_EXTERNOS.find((c) => c.id === id)?.rotulo ?? id;

/* ---------------- o catálogo, para identificar a origem ---------------- */
/* Tudo o que existe, e não só o que o receptor possui. */
const FONTES_CATALOGO = [
  ["aptidao", "Aptidão", AFTY_APTIDOES],
  ["habilidade", "Habilidade", AFTY_HABILIDADES],
  ["talento", "Talento", AFTY_TALENTOS],
  ["melhoria", "Melhoria Superior", MELHORIAS_SUPERIORES],
  ["lendaria", "Habilidade Lendária", HABILIDADES_LENDARIAS],
  ["apice", "Habilidade Ápice", HABILIDADES_APICE],
];
let INDICE = null;
export function catalogoDeOrigens() {
  if (INDICE) return INDICE;
  const vistos = new Set();
  INDICE = [];
  for (const [tipo, rotulo, lista] of FONTES_CATALOGO) {
    for (const x of lista ?? []) {
      if (!x?.id || !x?.nome) continue;
      const id = `${tipo}:${x.id}`;
      if (vistos.has(id)) continue;
      vistos.add(id);
      INDICE.push({ id, nome: x.nome, tipo, rotuloTipo: rotulo, busca: semAcento(x.nome) });
    }
  }
  return INDICE;
}
export function buscarOrigem(termo, limite = 8) {
  const t = semAcento(termo).trim();
  if (t.length < 2) return [];
  const todos = catalogoDeOrigens();
  const comeca = todos.filter((x) => x.busca.startsWith(t));
  const contem = todos.filter((x) => !x.busca.startsWith(t) && x.busca.includes(t));
  return [...comeca, ...contem].slice(0, limite);
}
export const origemPorId = (id) => catalogoDeOrigens().find((x) => x.id === id) ?? null;

/* ---------------- registros ---------------- */
export const ehRegistro = (b) => !!b?.rec;
const beneficiosValidos = (r) => (r.beneficios ?? []).filter((b) => b.canal && Number.isFinite(Number(b.valor)) && Number(b.valor) !== 0);
export const nomeNaConta = (r) => `${r.origemNome}${r.aplicadoPor ? ` · ${r.aplicadoPor}` : ""}`;
/* A regra de acúmulo é conhecida? Sem ela, o número espera o jogador decidir. */
export const regraConhecida = (r) => r.tipoFonte === "feitico" || (r.tipoFonte === "catalogo" && !!r.origemId);
export const entraNaConta = (r) => beneficiosValidos(r).length > 0 && (regraConhecida(r) || !!r.somaPresumida);

/* ⚠ `variacaoDe` NÃO É ENFEITE. Sem ele o Passivo gerado contava como Feitiço
   do personagem: `feiticos.gastos` 12 → 13 e `orcamentoHabilidades.restante`
   47 → 46 no Player 30. É o campo que o motor já usa para isentar a Variação
   de Liberação do orçamento (afty-derive.js, `feiticosGastos`) e do PE Máximo
   das Passivas (`peMaximoDasPassivas`). Os efeitos continuam entrando:
   `efeitosDosPassivos` não olha esse campo. */
function passivoDoRecebido(r) {
  return {
    id: `rec_${r.id}`, nome: nomeNaConta(r), tipo: "passivo", nivel: 0, variacaoDe: "recebido-externo",
    efeitosPassivo: beneficiosValidos(r).map((b) => ({ canal: b.canal, expr: String(Number(b.valor)), duracao: "temporaria" })),
  };
}

/* QUEM DISPUTA COM QUEM segue a versão de regras da FICHA: no jogador o pool se
   parte em grupos (divergência `poolExclusivo`), na criatura é um pool só. A
   resposta é a do próprio motor (`grupoExclusivo`), e não uma lista escrita aqui. */
const mesmoGrupo = (famA, famB, emGrupos) => !!famA && !!famB && grupoExclusivo(famA, emGrupos) === grupoExclusivo(famB, emGrupos);
const FAMILIA_DO_RECEBIDO = "feiticoAuxiliarPassivo";

/* O que a própria ficha já dá do MESMO efeito, por valor: entra como `jaAplicado`.
   Pela IDENTIDADE: todo detalhe do motor traz `origem`, o id do catálogo
   (`aura_do_bastiao`), e o registro guarda `aptidao:aura_do_bastiao`. O nome
   não serve, porque o motor escreve "Assumir Postura (Postura do Sol)". */
const idCru = (origemId) => (origemId ? String(origemId).split(":").pop() : null);
function doProprio(derivedBase, origemId, canal, sinal) {
  const id = idCru(origemId);
  if (!derivedBase || !id) return 0;
  return (derivedBase.efeitos?.detalhes ?? [])
    .filter((d) => d.canal === canal && d.origem === id && !d.suplantado && Math.sign(d.valor) === sinal)
    .reduce((s, d) => s + d.valor, 0);
}

/** A ficha e a sessão que o motor vê, com os registros já traduzidos. */
export function prepararCalculo(ficha, sessao) {
  const buffs = sessao?.buffs ?? [];
  const recs = buffs.filter(ehRegistro);
  const legados = buffs.filter((b) => !ehRegistro(b));
  const emGrupos = ehPlayer(ficha);
  if (!recs.length) return { fichaCalc: ficha, sessaoCalc: sessao, derived: derivar(ficha, sessao), analise: {}, emGrupos };

  const feits = recs.filter((r) => r.tipoFonte === "feitico" && entraNaConta(r));
  const fichaCalc = feits.length ? { ...ficha, feiticos: [...(ficha.feiticos ?? []), ...feits.map(passivoDoRecebido)] } : ficha;

  const cats = recs.filter((r) => r.tipoFonte === "catalogo" && entraNaConta(r));
  const analise = {};
  const gerados = [];
  if (cats.length) {
    const derivedBase = derivar(fichaCalc, { ...sessao, buffs: legados });
    const efeitos = [];
    const jaAplicado = {};
    for (const r of cats) {
      const grupo = `rep:${r.origemId}`;
      for (const b of beneficiosValidos(r)) {
        const valor = Number(b.valor);
        efeitos.push({ canal: b.canal, expr: String(valor), nome: r.id, exclusivo: grupo, grupoExclusivo: grupo });
        const k = chaveExclusiva(b.canal, null, valor, grupo);
        if (!(k in jaAplicado)) jaAplicado[k] = doProprio(derivedBase, r.origemId, b.canal, Math.sign(valor));
      }
    }
    const res = resolverExclusivos(aplicarEfeitos(efeitos, {}), Object.fromEntries(Object.entries(jaAplicado).filter(([, v]) => v)));
    const porChave = new Map();
    for (const d of res.detalhes.filter((x) => x.exclusivo)) {
      const k = chaveExclusiva(d.canal, d.alvo, d.valor, d.exclusivo);
      if (!porChave.has(k)) porChave.set(k, []);
      porChave.get(k).push(d);
    }
    for (const [k, itens] of porChave) {
      const vencedor = itens.find((d) => !d.suplantado) ?? null;
      const proprio = jaAplicado[k] ?? 0;
      const topo = itens.reduce((a, b) => (Math.abs(b.valor) > Math.abs(a.valor) ? b : a));
      for (const d of itens) {
        const r = cats.find((x) => x.id === d.nome);
        const a = (analise[r.id] ??= {});
        if (d === vencedor) {
          const delta = d.valor - proprio;
          /* Quem perdeu para ele, o maior deles: é o que a prévia nomeia. */
          const perdeu = itens.filter((x) => x !== d).sort((x, y) => Math.abs(y.valor) - Math.abs(x.valor))[0];
          const rp = perdeu && cats.find((x) => x.id === perdeu.nome);
          a[d.canal] = proprio ? { status: "excede", valor: d.valor, delta, proprio }
            : perdeu ? (perdeu.valor === d.valor
              ? { status: "empata", valor: d.valor, vencedor: { nome: nomeNaConta(rp), valor: perdeu.valor } }
              : { status: "substitui", valor: d.valor, perdedor: { nome: nomeNaConta(rp), valor: perdeu.valor }, delta: d.valor - perdeu.valor })
              : { status: "soma", valor: d.valor, delta };
          gerados.push({ id: `gen_${r.id}_${d.canal}`, nome: nomeNaConta(r), canal: d.canal, expr: String(delta), gerado: true });
        } else if (proprio && Math.abs(proprio) >= Math.abs(topo.valor)) {
          a[d.canal] = { status: "coberto", valor: d.valor, proprio };
        } else if (vencedor && vencedor.valor === d.valor) {
          /* Empate: os dois valem o mesmo. Nenhum "cobre" o outro. */
          a[d.canal] = { status: "empata", valor: d.valor, vencedor: { nome: nomeNaConta(cats.find((x) => x.id === vencedor.nome)), valor: vencedor.valor } };
        } else {
          const outro = cats.find((x) => x.id === (vencedor ?? topo).nome);
          a[d.canal] = { status: "repete", valor: d.valor, vencedor: { nome: nomeNaConta(outro), valor: (vencedor ?? topo).valor } };
        }
      }
    }
  }
  const outros = recs.filter((r) => r.tipoFonte === "outro" && entraNaConta(r));
  for (const r of outros) {
    for (const b of beneficiosValidos(r)) {
      gerados.push({ id: `gen_${r.id}_${b.canal}`, nome: nomeNaConta(r), canal: b.canal, expr: String(Number(b.valor)), gerado: true });
      (analise[r.id] ??= {})[b.canal] = { status: "presumido", valor: Number(b.valor), delta: Number(b.valor) };
    }
  }
  const sessaoCalc = { ...sessao, buffs: [...legados, ...gerados] };
  const derived = derivar(fichaCalc, sessaoCalc);

  /* Feitiços: a disputa já foi do motor. Aqui só se LÊ quem venceu. */
  const detalhes = derived.efeitos?.detalhes ?? [];
  for (const r of feits) {
    const a = (analise[r.id] ??= {});
    for (const b of beneficiosValidos(r)) {
      /* O Passivo gerado volta do motor com `origem: "feitico:rec_<id>"`: dois
         registros de mesmo nome e mesmo aplicador não se confundem. */
      const meu = detalhes.find((d) => d.origem === `feitico:rec_${r.id}` && d.canal === b.canal);
      const rivais = detalhes.filter((d) => d !== meu && d.canal === b.canal && (d.alvo ?? null) === null && mesmoGrupo(d.exclusivo, FAMILIA_DO_RECEBIDO, emGrupos) && Math.sign(d.valor) === Math.sign(Number(b.valor)));
      if (!meu) { a[b.canal] = { status: "soma", valor: Number(b.valor) }; continue; }
      if (meu.suplantado) {
        const venc = rivais.find((d) => !d.suplantado);
        a[b.canal] = venc && venc.valor === meu.valor
          ? { status: "empata", valor: meu.valor, vencedor: { nome: venc.nome, valor: venc.valor } }
          : { status: "naoSoma", valor: meu.valor, vencedor: venc ? { nome: venc.nome, valor: venc.valor } : null };
      } else {
        const perdeu = rivais.filter((d) => d.suplantado).sort((x, y) => Math.abs(y.valor) - Math.abs(x.valor))[0];
        a[b.canal] = perdeu
          ? (perdeu.valor === meu.valor
            ? { status: "empata", valor: meu.valor, vencedor: { nome: perdeu.nome, valor: perdeu.valor } }
            : { status: "substitui", valor: meu.valor, perdedor: { nome: perdeu.nome, valor: perdeu.valor }, delta: meu.valor - perdeu.valor })
          : { status: "soma", valor: meu.valor, delta: meu.valor };
      }
    }
  }
  for (const r of recs) if (!entraNaConta(r) && beneficiosValidos(r).length) {
    const a = (analise[r.id] ??= {});
    for (const b of beneficiosValidos(r)) a[b.canal] = { status: "pendente", valor: Number(b.valor) };
  }
  return { fichaCalc, sessaoCalc, derived, analise, emGrupos };
}

/* ---------------- a disputa, lida do motor, para os efeitos PRÓPRIOS ---------------- */
/**
 * Por nome de fonte: como ela ficou em cada valor disputado.
 *   perde   outra do mesmo grupo vale MAIS
 *   empata  vale o MESMO que outra: o número entra uma vez, e ninguém cobre
 *           ninguém. O motor marca um dos dois como suplantado só para não
 *           somar duas vezes, e isso não é derrota.
 * O empate só existe NO TOPO. Com +6, +6 e +9, os dois +6 perdem para o +9 e
 * nenhum empata: igualdade abaixo do vencedor não conta. Encerrado o +9, o topo
 * passa a ser +6 e aí os dois empatam.
 * A disputa é a do motor, com a MESMA chave (`chaveExclusiva`): grupo da
 * família pela versão de regras da ficha, canal, alvo (o atributo, a perícia,
 * o TR) e sinal. Dois alvos diferentes do mesmo canal não disputam.
 * ⚠ A LIGAÇÃO É PELO NOME do detalhe (`d.nome`), que é o que o motor devolve.
 */
export function disputasPorFonte(derived, emGrupos = true) {
  const detalhes = (derived.efeitos?.detalhes ?? []).filter((d) => d.exclusivo);
  const grupos = new Map();
  for (const d of detalhes) {
    const k = chaveExclusiva(d.canal, d.alvo, d.valor, grupoExclusivo(d.exclusivo, emGrupos));
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(d);
  }
  const out = new Map();
  const poe = (nome, x) => { if (!out.has(nome)) out.set(nome, []); out.get(nome).push(x); };
  for (const itens of grupos.values()) {
    if (itens.length < 2) continue;
    /* Bônus fica com o maior, penalidade com a pior, como no `resolverExclusivos`. */
    const topo = itens[0].valor < 0 ? Math.min(...itens.map((d) => d.valor)) : Math.max(...itens.map((d) => d.valor));
    const noTopo = itens.filter((d) => d.valor === topo);
    const vencedor = noTopo.find((d) => !d.suplantado) ?? noTopo[0];
    for (const d of itens) {
      const base = { canal: d.canal, alvo: d.alvo ?? null, valor: d.valor };
      if (d.valor !== topo) poe(d.nome, { ...base, status: "perde", vencedor: { nome: vencedor.nome, valor: vencedor.valor } });
      else if (noTopo.length > 1) {
        const outro = noTopo.find((x) => x !== d);
        poe(d.nome, { ...base, status: "empata", com: { nome: outro.nome, valor: outro.valor } });
      }
    }
  }
  return out;
}

/* ---------------- a frase de cada benefício ---------------- */
const s = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
/** Uma frase curta, na língua da situação, para a prévia e o detalhe. */
export function fraseDoBeneficio(canal, a) {
  const nome = rotuloCanal(canal);
  switch (a?.status) {
    case "soma": return { tom: "ok", texto: `Vale ${s(a.valor)} de ${nome}.` };
    case "presumido": return { tom: "atencao", texto: `Soma ${s(a.valor)} de ${nome} por escolha sua. A regra de acúmulo desta origem não é conhecida.` };
    case "excede": return { tom: "ok", texto: `Vale ${s(a.delta)} de ${nome}: a sua própria já dá ${s(a.proprio)}, e só o que passa dela soma.` };
    case "coberto": return { tom: "neutro", texto: `Não soma na ${nome}: o mesmo efeito da sua ficha já dá ${s(a.proprio)}.` };
    case "repete": return { tom: "neutro", texto: `Não soma na ${nome}: repete ${a.vencedor.nome}, que dá ${s(a.vencedor.valor)}.` };
    case "naoSoma": return { tom: "neutro", texto: a.vencedor ? `Não soma na ${nome}: ${a.vencedor.nome} dá ${s(a.vencedor.valor)}, e Feitiços não somam entre si.` : `Não soma na ${nome}.` };
    case "empata": return { tom: "neutro", texto: `Empata com ${a.vencedor.nome} (${s(a.vencedor.valor)}): a ${nome} recebe ${s(a.valor)} uma vez só, e continua com ${s(a.valor)} se um dos dois terminar.` };
    case "substitui": return { tom: "ok", texto: `Vale ${s(a.valor)} de ${nome} no lugar de ${a.perdedor.nome} (${s(a.perdedor.valor)}), ${s(a.delta)} a mais.` };
    case "pendente": return { tom: "atencao", texto: `${s(a.valor)} de ${nome} ainda não entra: a regra de acúmulo desta origem não é conhecida.` };
    default: return null;
  }
}
