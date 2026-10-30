/* ============================================================
   FONTES EXTERNAS NO CÁLCULO (a interpretação compartilhada)
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
   aliados somava duas vezes. O registro não tem `canal` no topo, então o
   motor o IGNORA, e quem o põe na conta é `calcularRecebidos`:

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

   Nada disso muda o motor.

   ⚠ ESTE MÓDULO É A INTERPRETAÇÃO DE TODOS OS CONSUMIDORES DA SESSÃO (2026-10-19,
   G2-I1). A ficha clássica, o G2, o Encontro e os derives de comparação do
   `ficha-buffs.js` chamam `calcularRecebidos` com a função de derive de cada um.
   Antes, só o G2 traduzia: o registro feito na prévia contava lá e sumia da
   ficha clássica, que derivava a mesma sessão sem a tradução.

   É FOLHA de propósito, como `ficha-opcoes-derive.js`: não importa o derive, o
   `ponte.js` nem nada visual. A função de derive vem de quem chama, e é ela que
   decide os addons e as opções (a do Encontro não aplica addons por combatente).
   ============================================================ */
import { aplicarEfeitos, resolverExclusivos, chaveExclusiva, grupoExclusivo } from "../afty-efeitos";
import { ehPlayer } from "../afty-sistema";

/* ---------------- registros ---------------- */
export const ehRegistro = (b) => !!b?.rec;
export const beneficiosValidos = (r) => (r.beneficios ?? []).filter((b) => b.canal && Number.isFinite(Number(b.valor)) && Number(b.valor) !== 0);
export const nomeNaConta = (r) => `${r.origemNome}${r.aplicadoPor ? ` · ${r.aplicadoPor}` : ""}`;
/* A regra de acúmulo é conhecida? Sem ela, o número espera o jogador decidir. */
const regraConhecida = (r) => r.tipoFonte === "feitico" || (r.tipoFonte === "catalogo" && !!r.origemId);
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

/* A ficha com os Passivos gerados, UMA cópia por (ficha, conjunto de Feitiços recebidos). Quem deriva guarda a conta pela IDENTIDADE da ficha (`ponte.js`,
   `derivar`), e uma cópia nova a cada chamada fazia essa guarda errar sempre: com um Feitiço recebido registrado, cada derive de uma interação era refeito.
   Também é idempotente: um Passivo que a ficha já carrega (uma ficha já traduzida que volta aqui) não entra duas vezes. */
const FICHAS_TRADUZIDAS = new WeakMap();
const TETO_DE_FICHAS = 8;
function fichaComPassivos(ficha, feits) {
  const jaTem = new Set((ficha.feiticos ?? []).map((f) => f?.id));
  const novos = feits.filter((r) => !jaTem.has(`rec_${r.id}`));
  if (!novos.length) return ficha;
  const passivos = novos.map(passivoDoRecebido);
  const chave = JSON.stringify(passivos);
  let porChave = FICHAS_TRADUZIDAS.get(ficha);
  if (!porChave) { porChave = new Map(); FICHAS_TRADUZIDAS.set(ficha, porChave); }
  if (!porChave.has(chave)) {
    porChave.set(chave, { ...ficha, feiticos: [...(ficha.feiticos ?? []), ...passivos] });
    if (porChave.size > TETO_DE_FICHAS) porChave.delete(porChave.keys().next().value);
  }
  return porChave.get(chave);
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

/** A ficha e a sessão que o motor vê, com os registros já traduzidos, e a leitura da disputa dos Catálogo e Outra Origem. Sem derive final. */
function traduzir(ficha, sessao, derivarFn) {
  const buffs = sessao?.buffs ?? [];
  const recs = buffs.filter(ehRegistro);
  const emGrupos = ehPlayer(ficha);
  if (!recs.length) return { recs, emGrupos };
  const legados = buffs.filter((b) => !ehRegistro(b));

  const feits = recs.filter((r) => r.tipoFonte === "feitico" && entraNaConta(r));
  const fichaCalc = fichaComPassivos(ficha, feits);

  const cats = recs.filter((r) => r.tipoFonte === "catalogo" && entraNaConta(r));
  const analise = {};
  const gerados = [];
  if (cats.length) {
    const derivedBase = derivarFn(fichaCalc, { ...sessao, buffs: legados });
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
  return { recs, emGrupos, feits, fichaCalc, sessaoCalc: { ...sessao, buffs: [...legados, ...gerados] }, analise };
}

/**
 * Faz SÓ o derive de base que a tradução de um registro de Catálogo pede (o da ficha sem os registros, para saber o que a própria ficha já dá). Não devolve nada: o
 * derive de QUEM CHAMA é guardado, então a conta de verdade (`calcularRecebidos`) acha essa resposta pronta. Existe para quem roda a conta em fatias separar os dois
 * derives de uma Fonte de Catálogo em dois passos (um passo com os dois passava de 50 ms), sem mudar o resultado. Devolve se havia o que aquecer.
 */
export function aquecerTraducao(ficha, sessao, derivarFn) {
  if (!(sessao?.buffs ?? []).some((r) => ehRegistro(r) && r.tipoFonte === "catalogo" && entraNaConta(r))) return false;
  traduzir(ficha, sessao, derivarFn);
  return true;
}

/**
 * O derive da ficha com a sessão, com a Fonte Externa traduzida, e a leitura de como cada registro ficou.
 *
 * `derivarFn(ficha, sessao)` é o derive de QUEM CHAMA (os addons, as opções e o cache são dele). Sem registro nenhum devolve EXATAMENTE `derivarFn(ficha, sessao)`,
 * com a mesma ficha e a mesma sessão por identidade.
 *
 * Idempotente: a `sessaoCalc` que volta não tem mais registro (só os buffs antigos e os gerados), e a `fichaCalc` não carrega duas vezes o mesmo Passivo, então
 * reaplicar a tradução sobre o resultado não conta nada em dobro.
 */
export function calcularRecebidos(ficha, sessao, derivarFn) {
  const t = traduzir(ficha, sessao, derivarFn);
  if (!t.recs.length) return { fichaCalc: ficha, sessaoCalc: sessao, derived: derivarFn(ficha, sessao), analise: {}, emGrupos: t.emGrupos };
  const { recs, feits, fichaCalc, sessaoCalc, analise, emGrupos } = t;
  const derived = derivarFn(fichaCalc, sessaoCalc);

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
