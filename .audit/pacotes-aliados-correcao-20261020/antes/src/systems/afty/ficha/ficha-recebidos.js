/* ============================================================
   FONTES EXTERNAS NO CÁLCULO (a interpretação compartilhada)
   ============================================================
   Um efeito recebido é um REGISTRO de sessão (em `sessao.buffs`, com
   `rec: true`), nunca ficha:
     tipoFonte    a regra de acúmulo do registro (ver a tabela abaixo)
     origemId     identificação estável do catálogo ("aptidao:aura_do_bastiao")
     origemNome   o nome como o jogador informou, preservado
     aplicadoPor  quem aplicou. NÃO muda a identidade nem o acúmulo
     beneficios   [{ canal, valor, alvo?, quando? }]
     rodadas      duração em rodadas, ou null
     acumulo      { chave, forca } das regras que disputam por chave própria
     pacote       a proveniência de um registro que veio de um Pacote para
                  Aliados (`pacotes-aliados.js`). A tradução NÃO lê este campo:
                  ele é da tela (emissor, revisão, prazo, condições)

   ⚠ A LACUNA DO APP: `efeitosDaSessao` (afty-efeitos.js) transforma todo
   Buff de Mesa em bônus genérico, sem `exclusivo`. Um Feitiço recebido
   somava por cima dos Feitiços do personagem, e a mesma habilidade de dois
   aliados somava duas vezes. O registro não tem `canal` no topo, então o
   motor o IGNORA, e quem o põe na conta é `calcularRecebidos`:

     tipoFonte         a regra
     feitico           vira um Feitiço Passivo gerado na hora do derive
                       (`efeitosDosPassivos` carimba `feiticoAuxiliarPassivo`,
                       grupo `feiticos` no jogador). A disputa com os Feitiços
                       do personagem é a do próprio `resolverExclusivos`, por
                       valor, e o perdedor sai `suplantado`.
     estilo            o Novo Estilo das Sombras estendido aos aliados. Mesmo
                       caminho do Feitiço: a família `estiloSombra` disputa no
                       MESMO grupo dos Feitiços (`grupoJogador: "feiticos"` no
                       jogador, pool único na criatura), então a chave da
                       disputa é idêntica nos dois sistemas.
     catalogo          conteúdo do catálogo repetido (Aura do Bastião de dois
                       aliados) passa pelo MESMO `resolverExclusivos`, com um
                       grupo por origem: vale o maior em cada valor. Se o
                       personagem já recebe o mesmo efeito da própria ficha, esse
                       valor entra como `jaAplicado` e só o que PASSA dele soma.
                       Origens diferentes somam entre si.
     auxilioInvocacao  o auxílio de Aliados de uma invocação. No dono ele soma
                       com tudo (`efeitosDeInvocacao`), então aqui também: só a
                       MESMA origem (o mesmo auxílio do mesmo emissor, `acumulo.
                       chave`) não soma duas vezes.
     auraInvocacao     "Duas auras iguais não acumulam (vale a maior)" (autor,
                       docs/afty-invocacoes.md): disputa por tipo e alvo
                       (`acumulo.chave`), entre emissores e contra a aura que a
                       própria ficha já recebe de uma invocação dela. Pela
                       `acumulo.forca` (o valor, ou as faces da Aura de Dano).
     outro             origem sem regra conhecida: só entra se o jogador escolheu
                       somar mesmo assim (`somaPresumida`).

   Nada disso muda o motor.

   ⚠ ESTE MÓDULO É A INTERPRETAÇÃO DE TODOS OS CONSUMIDORES DA SESSÃO (2026-10-19,
   G2-I1). A ficha clássica, o G2, o Encontro e os derives de comparação do
   `ficha-buffs.js` chamam `calcularRecebidos` com a função de derive de cada um.
   Antes, só o G2 traduzia: o registro feito na prévia contava lá e sumia da
   ficha clássica, que derivava a mesma sessão sem a tradução.

   É FOLHA de propósito, como `ficha-opcoes-derive.js`: não importa o derive, o
   `ponte.js` nem nada visual. A função de derive vem de quem chama, e é ela que
   decide os addons e as opções (a do Encontro não aplica addons por combatente).

   ALVO E CONDIÇÃO (Pacotes para Aliados, 2026-10-19). Um benefício pode mirar um
   alvo do canal (a perícia, o TR, o tipo de dano, o dado) e ter `quando`. O alvo
   entra na chave da disputa e da análise (`chaveDoBeneficio`); a condição viaja
   até a linha que o motor avalia, e nunca entra na disputa feita aqui fora (lá o
   contexto é vazio e ela apagaria a linha). Registro antigo, sem os dois, segue
   igual.
   ============================================================ */
import { aplicarEfeitos, resolverExclusivos, chaveExclusiva, grupoExclusivo } from "../afty-efeitos";
import { ehPlayer } from "../afty-sistema";

/* ---------------- registros ---------------- */
export const ehRegistro = (b) => !!b?.rec;
const alvoDe = (b) => {
  const a = String(b?.alvo ?? "").trim();
  return a && a.toLowerCase() !== "todos" ? a : null;
};
const quandoDe = (b) => {
  const q = String(b?.quando ?? "").trim();
  return q || null;
};
/** A chave de um benefício na análise: o canal, e o alvo quando há ("bonusPericia@atletismo"). */
export const chaveDoBeneficio = (b) => (alvoDe(b) ? `${b.canal}@${alvoDe(b)}` : b.canal);
export const beneficiosValidos = (r) => (r.beneficios ?? []).filter((b) => b.canal && Number.isFinite(Number(b.valor)) && Number(b.valor) !== 0);
export const nomeNaConta = (r) => `${r.origemNome}${r.aplicadoPor ? ` · ${r.aplicadoPor}` : ""}`;
/* As regras que viram Feitiço Passivo gerado (a disputa é a do pool do motor). */
const PELO_POOL = new Set(["feitico", "estilo"]);
/** A regra de acúmulo é conhecida? Sem ela, o número espera o jogador decidir. */
export const regraConhecida = (r) => PELO_POOL.has(r.tipoFonte)
  || (r.tipoFonte === "catalogo" && !!r.origemId)
  || ((r.tipoFonte === "auxilioInvocacao" || r.tipoFonte === "auraInvocacao") && !!r.acumulo?.chave);
export const entraNaConta = (r) => beneficiosValidos(r).length > 0 && (regraConhecida(r) || !!r.somaPresumida);

/* As linhas que vão à conta, com o alvo e a condição quando há. */
const linhaDe = (b, valor) => ({
  canal: b.canal,
  ...(alvoDe(b) ? { alvo: alvoDe(b) } : {}),
  ...(quandoDe(b) ? { quando: quandoDe(b) } : {}),
  expr: String(valor),
});

/* ⚠ `variacaoDe` NÃO É ENFEITE. Sem ele o Passivo gerado contava como Feitiço
   do personagem: `feiticos.gastos` 12 → 13 e `orcamentoHabilidades.restante`
   47 → 46 no Player 30. É o campo que o motor já usa para isentar a Variação
   de Liberação do orçamento (afty-derive.js, `feiticosGastos`) e do PE Máximo
   das Passivas (`peMaximoDasPassivas`). Os efeitos continuam entrando:
   `efeitosDosPassivos` não olha esse campo. */
function passivoDoRecebido(r) {
  return {
    id: `rec_${r.id}`, nome: nomeNaConta(r), tipo: "passivo", nivel: 0, variacaoDe: "recebido-externo",
    efeitosPassivo: beneficiosValidos(r).map((b) => ({ ...linhaDe(b, Number(b.valor)), duracao: "temporaria" })),
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
   não serve, porque o motor escreve "Assumir Postura (Postura do Sol)".
   A aura de uma invocação da própria ficha chega com `origem` igual a
   `invocacao:<chave da aura>` (`efeitosDeInvocacao`). */
const idCru = (origemId) => (origemId ? String(origemId).split(":").pop() : null);
function doProprio(derivedBase, origem, canal, alvo, sinal) {
  if (!derivedBase || !origem) return 0;
  return (derivedBase.efeitos?.detalhes ?? [])
    .filter((d) => d.canal === canal && d.origem === origem && (d.alvo ?? null) === (alvo ?? null) && !d.suplantado && Math.sign(d.valor) === sinal)
    .reduce((s, d) => s + d.valor, 0);
}
const origemPropria = (r) => (r.tipoFonte === "catalogo" ? idCru(r.origemId) : r.tipoFonte === "auraInvocacao" ? `invocacao:${r.acumulo?.chave}` : null);
const grupoDoMaior = (r) => (r.tipoFonte === "catalogo" ? `rep:${r.origemId}` : r.tipoFonte === "auxilioInvocacao" ? `aux:${r.acumulo?.chave}` : `aura:${r.acumulo?.chave}`);
/* Precisa saber o que a própria ficha já dá: um derive de base a mais. */
const pedeBase = (r) => r.tipoFonte === "catalogo" || r.tipoFonte === "auraInvocacao";

/* ---------------- a Aura de Dano: um dado nomeado ----------------
   A Aura de Dano Durante o Ataque é um DADO (1d4, 1d6, 1d8) no canal `dadosNomeados`, com o tamanho no alvo. Duas iguais não acumulam e vale a maior,
   mas os tamanhos diferentes ficam em alvos diferentes, e a disputa do motor (por canal e alvo) somaria os dois. Por isso a vencedora é escolhida pela
   `forca` (as faces), e quando a própria ficha já tem uma menor, a menor sai da conta com o mesmo dado negativo (é o que o hover mostra). */
const ehDado = (r) => beneficiosValidos(r).some((b) => b.canal === "dadosNomeados");
const facesDoAlvo = (a) => Number(/^d(\d+)$/i.exec(String(a ?? ""))?.[1] ?? 0);
function dadoProprio(derivedBase, chave) {
  const d = (derivedBase?.efeitos?.detalhes ?? []).find((x) => x.canal === "dadosNomeados" && x.origem === `invocacao:${chave}` && !x.suplantado && x.valor > 0);
  return d ? { alvo: d.alvo, faces: facesDoAlvo(d.alvo), nome: d.nome } : null;
}

/** A ficha e a sessão que o motor vê, com os registros já traduzidos, e a leitura da disputa dos que não são do pool. Sem derive final. */
function traduzir(ficha, sessao, derivarFn) {
  const buffs = sessao?.buffs ?? [];
  const recs = buffs.filter(ehRegistro);
  const emGrupos = ehPlayer(ficha);
  if (!recs.length) return { recs, emGrupos };
  const legados = buffs.filter((b) => !ehRegistro(b));

  const feits = recs.filter((r) => PELO_POOL.has(r.tipoFonte) && entraNaConta(r));
  const fichaCalc = fichaComPassivos(ficha, feits);

  const analise = {};
  const gerados = [];
  const maiores = recs.filter((r) => ["catalogo", "auxilioInvocacao", "auraInvocacao"].includes(r.tipoFonte) && entraNaConta(r));
  let derivedBase = null;
  const base = () => (derivedBase ??= derivarFn(fichaCalc, { ...sessao, buffs: legados }));
  if (maiores.some(pedeBase)) base();

  /* ---------- as Auras de Dano, pela força ---------- */
  const dados = maiores.filter((r) => r.tipoFonte === "auraInvocacao" && ehDado(r));
  const porChaveDado = new Map();
  for (const r of dados) {
    if (!porChaveDado.has(r.acumulo.chave)) porChaveDado.set(r.acumulo.chave, []);
    porChaveDado.get(r.acumulo.chave).push(r);
  }
  for (const [chave, lista] of porChaveDado) {
    const forca = (r) => Number(r.acumulo?.forca) || facesDoAlvo(beneficiosValidos(r)[0]?.alvo);
    const ordem = [...lista].sort((a, b) => forca(b) - forca(a));
    const topo = ordem[0];
    const proprio = dadoProprio(base(), chave);
    const ben = beneficiosValidos(topo)[0];
    const k = chaveDoBeneficio(ben);
    for (const r of ordem) {
      const a = (analise[r.id] ??= {});
      const b = beneficiosValidos(r)[0];
      const kk = chaveDoBeneficio(b);
      const meta = { canal: b.canal, alvo: alvoDe(b) };
      if (proprio && proprio.faces >= forca(topo)) {
        a[kk] = { ...meta, status: "coberto", valor: Number(b.valor), proprio: 1 };
      } else if (r === topo) {
        a[kk] = proprio
          ? { ...meta, status: "substitui", valor: Number(b.valor), perdedor: { nome: proprio.nome, valor: 1 }, delta: Number(b.valor) }
          : { ...meta, status: "soma", valor: Number(b.valor), delta: Number(b.valor) };
        gerados.push({ id: `gen_${r.id}_${k}`, nome: nomeNaConta(r), gerado: true, ...linhaDe(ben, Number(ben.valor)) });
        if (proprio) gerados.push({ id: `gen_${r.id}_${k}_sai`, nome: proprio.nome, gerado: true, canal: "dadosNomeados", alvo: proprio.alvo, expr: "-1" });
      } else if (forca(r) === forca(topo)) {
        a[kk] = { ...meta, status: "empata", valor: Number(b.valor), vencedor: { nome: nomeNaConta(topo), valor: Number(ben.valor) } };
      } else {
        a[kk] = { ...meta, status: "repete", valor: Number(b.valor), vencedor: { nome: nomeNaConta(topo), valor: Number(ben.valor) } };
      }
    }
  }

  /* ---------- o resto dos "vale o maior": catálogo, auxílio e aura numérica ---------- */
  const numericos = maiores.filter((r) => !(r.tipoFonte === "auraInvocacao" && ehDado(r)));
  if (numericos.length) {
    const efeitos = [];
    for (const r of numericos) {
      const grupo = grupoDoMaior(r);
      for (const b of beneficiosValidos(r)) {
        /* ⚠ Sem `quando`: a disputa aqui roda com contexto vazio, e a condição apagaria a linha. Ela vai na linha gerada. */
        efeitos.push({ canal: b.canal, ...(alvoDe(b) ? { alvo: alvoDe(b) } : {}), expr: String(Number(b.valor)), nome: r.id, exclusivo: grupo, grupoExclusivo: grupo });
      }
    }
    const bruto = aplicarEfeitos(efeitos, {});
    const jaAplicado = {};
    for (const e of bruto.exclusivos) {
      const k = chaveExclusiva(e.canal, e.alvo, e.valor, e.grupo);
      if (k in jaAplicado) continue;
      const r = numericos.find((x) => x.id === e.nome);
      jaAplicado[k] = pedeBase(r) ? doProprio(base(), origemPropria(r), e.canal, e.alvo, Math.sign(e.valor)) : 0;
    }
    const res = resolverExclusivos(bruto, Object.fromEntries(Object.entries(jaAplicado).filter(([, v]) => v)));
    const porChave = new Map();
    for (const d of res.detalhes.filter((x) => x.exclusivo)) {
      const k = chaveExclusiva(d.canal, d.alvo, d.declarado ?? d.valor, d.exclusivo);
      if (!porChave.has(k)) porChave.set(k, []);
      porChave.get(k).push(d);
    }
    /* O valor INTEIRO da fonte: o vencedor de uma disputa com `jaAplicado` sai do motor com o `valor` igual ao que passou da própria ficha, e o
       inteiro fica em `declarado`. Somar o `valor` dele ao que a ficha já dava contaria o excedente duas vezes, e subtrair o próprio dele, de novo,
       tiraria o que é da ficha. */
    const inteiro = (d) => d.declarado ?? d.valor;
    for (const [k, itens] of porChave) {
      const vencedor = itens.find((d) => !d.suplantado) ?? null;
      const proprio = jaAplicado[k] ?? 0;
      const topo = itens.reduce((a, b) => (Math.abs(inteiro(b)) > Math.abs(inteiro(a)) ? b : a));
      for (const d of itens) {
        const r = numericos.find((x) => x.id === d.nome);
        const b = beneficiosValidos(r).find((x) => x.canal === d.canal && (alvoDe(x) ?? null) === (d.alvo ?? null)) ?? { canal: d.canal, alvo: d.alvo };
        const kk = chaveDoBeneficio(b);
        const meta = { canal: d.canal, alvo: d.alvo ?? null };
        const a = (analise[r.id] ??= {});
        const v = inteiro(d);
        if (d === vencedor) {
          const delta = v - proprio;
          /* Quem perdeu para ele, o maior deles: é o que a prévia nomeia. */
          const perdeu = itens.filter((x) => x !== d).sort((x, y) => Math.abs(inteiro(y)) - Math.abs(inteiro(x)))[0];
          const rp = perdeu && numericos.find((x) => x.id === perdeu.nome);
          a[kk] = proprio ? { ...meta, status: "excede", valor: v, delta, proprio }
            : perdeu ? (inteiro(perdeu) === v
              ? { ...meta, status: "empata", valor: v, vencedor: { nome: nomeNaConta(rp), valor: inteiro(perdeu) } }
              : { ...meta, status: "substitui", valor: v, perdedor: { nome: nomeNaConta(rp), valor: inteiro(perdeu) }, delta: v - inteiro(perdeu) })
              : { ...meta, status: "soma", valor: v, delta };
          gerados.push({ id: `gen_${r.id}_${kk}`, nome: nomeNaConta(r), gerado: true, ...linhaDe(b, delta) });
        } else if (proprio && Math.abs(proprio) >= Math.abs(inteiro(topo))) {
          a[kk] = { ...meta, status: "coberto", valor: v, proprio };
        } else if (vencedor && inteiro(vencedor) === v) {
          /* Empate: os dois valem o mesmo. Nenhum "cobre" o outro. */
          a[kk] = { ...meta, status: "empata", valor: v, vencedor: { nome: nomeNaConta(numericos.find((x) => x.id === vencedor.nome)), valor: inteiro(vencedor) } };
        } else {
          const outro = numericos.find((x) => x.id === (vencedor ?? topo).nome);
          a[kk] = { ...meta, status: "repete", valor: v, vencedor: { nome: nomeNaConta(outro), valor: inteiro(vencedor ?? topo) } };
        }
      }
    }
  }
  const outros = recs.filter((r) => r.tipoFonte === "outro" && entraNaConta(r));
  for (const r of outros) {
    for (const b of beneficiosValidos(r)) {
      gerados.push({ id: `gen_${r.id}_${chaveDoBeneficio(b)}`, nome: nomeNaConta(r), gerado: true, ...linhaDe(b, Number(b.valor)) });
      (analise[r.id] ??= {})[chaveDoBeneficio(b)] = { canal: b.canal, alvo: alvoDe(b), status: "presumido", valor: Number(b.valor), delta: Number(b.valor) };
    }
  }
  return { recs, emGrupos, feits, fichaCalc, sessaoCalc: { ...sessao, buffs: [...legados, ...gerados] }, analise };
}

/**
 * Faz SÓ o derive de base que a tradução de um registro de Catálogo (ou de uma Aura de invocação) pede (o da ficha sem os registros, para saber o que a
 * própria ficha já dá). Não devolve nada: o derive de QUEM CHAMA é guardado, então a conta de verdade (`calcularRecebidos`) acha essa resposta pronta. Existe
 * para quem roda a conta em fatias separar os dois derives em dois passos (um passo com os dois passava de 50 ms), sem mudar o resultado. Devolve se havia o
 * que aquecer.
 */
export function aquecerTraducao(ficha, sessao, derivarFn) {
  if (!(sessao?.buffs ?? []).some((r) => ehRegistro(r) && pedeBase(r) && entraNaConta(r))) return false;
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
 *
 * A análise é por registro e por benefício: `analise[id][chaveDoBeneficio]` = { canal, alvo, status, valor, ... }.
 */
export function calcularRecebidos(ficha, sessao, derivarFn) {
  const t = traduzir(ficha, sessao, derivarFn);
  if (!t.recs.length) return { fichaCalc: ficha, sessaoCalc: sessao, derived: derivarFn(ficha, sessao), analise: {}, emGrupos: t.emGrupos };
  const { recs, feits, fichaCalc, sessaoCalc, analise, emGrupos } = t;
  const derived = derivarFn(fichaCalc, sessaoCalc);

  /* Feitiços e Estilo: a disputa já foi do motor. Aqui só se LÊ quem venceu. */
  const detalhes = derived.efeitos?.detalhes ?? [];
  for (const r of feits) {
    const a = (analise[r.id] ??= {});
    for (const b of beneficiosValidos(r)) {
      const kk = chaveDoBeneficio(b);
      const alvo = alvoDe(b);
      const meta = { canal: b.canal, alvo, familia: r.tipoFonte };
      /* O Passivo gerado volta do motor com `origem: "feitico:rec_<id>"`: dois
         registros de mesmo nome e mesmo aplicador não se confundem. */
      const meu = detalhes.find((d) => d.origem === `feitico:rec_${r.id}` && d.canal === b.canal && (d.alvo ?? null) === alvo);
      const rivais = detalhes.filter((d) => d !== meu && d.canal === b.canal && (d.alvo ?? null) === alvo && mesmoGrupo(d.exclusivo, FAMILIA_DO_RECEBIDO, emGrupos) && Math.sign(d.valor) === Math.sign(Number(b.valor)));
      /* Sem linha do motor: a condição (`quando`) não vale agora, e o benefício está fora da conta. */
      if (!meu) { a[kk] = quandoDe(b) ? { ...meta, status: "condicao", valor: Number(b.valor), quando: quandoDe(b) } : { ...meta, status: "soma", valor: Number(b.valor) }; continue; }
      if (meu.suplantado) {
        const venc = rivais.find((d) => !d.suplantado);
        a[kk] = venc && venc.valor === meu.valor
          ? { ...meta, status: "empata", valor: meu.valor, vencedor: { nome: venc.nome, valor: venc.valor } }
          : { ...meta, status: "naoSoma", valor: meu.valor, vencedor: venc ? { nome: venc.nome, valor: venc.valor } : null };
      } else {
        const perdeu = rivais.filter((d) => d.suplantado).sort((x, y) => Math.abs(y.valor) - Math.abs(x.valor))[0];
        a[kk] = perdeu
          ? (perdeu.valor === meu.valor
            ? { ...meta, status: "empata", valor: meu.valor, vencedor: { nome: perdeu.nome, valor: perdeu.valor } }
            : { ...meta, status: "substitui", valor: meu.valor, perdedor: { nome: perdeu.nome, valor: perdeu.valor }, delta: meu.valor - perdeu.valor })
          : { ...meta, status: "soma", valor: meu.valor, delta: meu.valor };
      }
    }
  }
  /* A condição (`quando`) da linha gerada vale agora? Sem a linha no motor (`origem: "sessao"`, com o nome da conta), o benefício está fora da
     conta neste momento, e a análise diz isso em vez de prometer o valor. Só os estados que geram a própria linha. */
  const naConta = (r, b) => detalhes.some((d) => d.origem === "sessao" && d.nome === nomeNaConta(r) && d.canal === b.canal && (d.alvo ?? null) === alvoDe(b));
  for (const r of recs) {
    if (PELO_POOL.has(r.tipoFonte) || !entraNaConta(r)) continue;
    for (const b of beneficiosValidos(r)) {
      if (!quandoDe(b)) continue;
      const kk = chaveDoBeneficio(b);
      const x = analise[r.id]?.[kk];
      if (x && ["soma", "excede", "substitui", "presumido"].includes(x.status) && !naConta(r, b)) {
        analise[r.id][kk] = { canal: b.canal, alvo: alvoDe(b), status: "condicao", valor: Number(b.valor), quando: quandoDe(b) };
      }
    }
  }
  for (const r of recs) if (!entraNaConta(r) && beneficiosValidos(r).length) {
    const a = (analise[r.id] ??= {});
    for (const b of beneficiosValidos(r)) a[chaveDoBeneficio(b)] = { canal: b.canal, alvo: alvoDe(b), status: "pendente", valor: Number(b.valor) };
  }
  return { fichaCalc, sessaoCalc, derived, analise, emGrupos };
}
