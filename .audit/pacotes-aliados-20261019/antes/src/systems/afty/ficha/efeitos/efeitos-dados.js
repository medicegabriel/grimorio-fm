/* ============================================================
   EFEITOS: A CAMADA DE DADOS (a mesma para a visão completa e a compacta)
   ============================================================
   Nenhum número é escrito aqui. O que tem valor sai do motor, sempre por
   `prepararCalculo` (recebidos.js), que é o que põe as fontes externas na
   conta com as regras de acúmulo:
     - o que um efeito ativo dá é o derive COM ele contra o derive SEM ele;
     - o que uma opção daria ao ligar é o mesmo derive, simulado;
     - o que foi cobrado é a diferença de PE medida depois da operação.

   GRUPO é uma habilidade com os seus parâmetros:
     1. o filho (`requerEstado`) vai com o pai ("Espírito de Luta · 2 PE");
     2. "X · Parte" vai com o estado "X" (Postura e Postura · Segunda);
     3. o dono no Repertório: a Habilidade, a Aptidão com o mesmo nome
        quando o motor só declara a categoria, e o Feitiço do interruptor
        `feiticoLigado_<id>`;
     4. as vagas de Sustentação formam um grupo só, e cada vaga ocupada
        aparece nos ativos como o Feitiço que ela mantém.
   ============================================================ */
import { estaLigado, padraoDe, compararSaldo, fichaDaCondicao, donoDoEstado, GRUPOS, Sessao } from "./ponte";
import { donoNoRepertorio } from "./repertorio";
import { semAcento } from "./util";
import { PROPRIEDADES_GOLPE, marcasDoGolpe } from "../../afty-golpe-especial";
import { exemploDe, exemploDeEstado, RECEBIDOS, PV_TEMP, FONTE_TERRA_INVENCIVEL } from "./exemplos";
import { aquecerCalculo, prepararCalculo, ehRegistro, disputasPorFonte, TIPOS_FONTE } from "./recebidos";

const GRUPO_IDS = new Set(GRUPOS.map((g) => g.id));
const ORIGEM_CURTA = {
  origem: "Origem", especializacao: "Habilidade", passivo: "Passiva", estilo: "Estilo", talento: "Talento",
  geral: "Habilidade Geral", aptidao: "Aptidão", altoNivel: "Nível Lendário",
};
const COMO = {
  ligar: "Ligar e Desligar",
  modo: "Postura ou Modo",
  intensidade: "Intensidade ou Acúmulo",
  escolhas: "Escolhas",
  usar: "Usar",
  registrar: "Uso Instantâneo",
  sempre: "Sempre Valendo",
  consulta: "Sem Controle na Ficha",
};
const ORDEM_COMO = ["ligar", "modo", "intensidade", "escolhas", "usar", "registrar", "sempre", "consulta"];

export const rotuloOpcao = (l) => String(l ?? "").replace(/^Postura d[oae]s? /, "");
/* O nome da HABILIDADE de um estado filho, e não o custo no rótulo do motor ("Espírito de Luta · 2 PE"). O PE é
   informação de custo, e a escolha entre Espírito de Luta e Espírito Incansável é feita ao UTILIZAR (autor, 2026-10-16). */
export const NOME_DO_FILHO = { espiritoIncansavel: "Espírito Incansável" };
const idCurto = (chave) => String(chave ?? "").split(":").pop();
export const exemploDoItem = (item) => (item ? exemploDe(item.id) ?? exemploDe(idCurto(item.chave)) : null);
/* O texto do estudo de um grupo: o da habilidade dona, ou, sem dona (o estado de
   um encantamento da bancada), o do estado raiz. */
const exemploDoGrupo = (g) => exemploDoItem(g.item) ?? (g.item ? null : exemploDeEstado(g.raiz.id));
const ehVagaSustentacao = (e) => /^sustentacaoFeitico\d+$/.test(e?.id ?? "");
const derivarCom = (ficha, sessao) => prepararCalculo(ficha, sessao).derived;
/* O mesmo derive, num gerador: com uma Fonte de Catálogo a conta tem DOIS derives, e o de base vai num passo só dele (devolve o controle `parcial` antes do final). */
function* derivarEmPassos(ficha, sessao, parcial) {
  if (aquecerCalculo(ficha, sessao)) yield parcial;
  return derivarCom(ficha, sessao);
}

function origemDoItem(item) {
  if (!item) return null;
  if (item.tipo === "feitico") return { tipo: "feitico", rotulo: "Feitiço", curta: "Feitiço", detalhe: (item.marcas ?? []).join(" · ") };
  const tipo = item.grupo === "aptidao" ? "aptidao" : "habilidade";
  const detalhe = [item.sub?.label, ...(item.tags ?? []).map((t) => t.label).filter((l) => l !== item.sub?.label)].filter(Boolean).join(" · ");
  const rotulo = ORIGEM_CURTA[item.grupo] ?? "Habilidade";
  return { tipo, rotulo, detalhe, curta: item.grupo === "especializacao" ? item.sub?.label ?? rotulo : rotulo };
}

/* ---------------- o que muda: a comparação do motor, completa ---------------- */
/* `compararSaldo` olha o total e os dados da primeira linha de ataque. Canalizar
   em Golpe e afins somam um GRUPO de dados que ela não vê, e a Margem de Crítico
   também fica de fora. As duas leituras vêm do mesmo derive. */
function gruposDiferentes(com, sem, sinal) {
  const a = com.dano?.entradas?.[0]?.gruposDano ?? [];
  const nomesB = new Set((sem.dano?.entradas?.[0]?.gruposDano ?? []).map((x) => x.nome));
  return a.filter((x) => x.nome && !nomesB.has(x.nome)).map((x) => ({
    chave: `grupo:${x.nome}`, rotulo: x.nome, valor: sinal,
    texto: `${sinal > 0 ? "+" : "−"}${x.dados}d${x.faces}${x.fixo ? `+${x.fixo}` : ""}`,
  }));
}
function margemDiferente(com, sem) {
  const a = com.dano?.entradas?.[0]?.margemCritico;
  const b = sem.dano?.entradas?.[0]?.margemCritico;
  if (a == null || b == null || a === b) return [];
  const d = a - b;
  return [{ chave: "margemCritico", rotulo: "Margem de Crítico", valor: -d, texto: `${d > 0 ? "+" : "−"}${Math.abs(d)}` }];
}
/* E3 (2026-10-16): dois resultados que o motor JÁ calcula e o comparador do motor não olha.
   - os testes nomeados (Concentração, Fintar, Provocar e Teste de Morte), no total `executar` que o derive põe em
     `testes.manobras`. A Mente Plácida entra por aqui, com a escada do motor (+3 com 1 PE e +5 com 2 PE). As quatro
     Manobras ficam de fora: o total delas já muda com a perícia e o ataque, e entraria dobrado;
   - a distância do Empurrão (`distanciaEmpurrao`), somada dos detalhes de efeito que o motor aplicou.
   Nada é calculado aqui: é a diferença de dois derives, como o resto. */
const TESTES_NOMEADOS = new Set(["concentracao", "fintar", "provocar", "morte"]);
const fmtM = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
function testesNomeadosDiferentes(com, sem) {
  const bs = new Map((sem.testes?.manobras ?? []).map((m) => [m.id, m]));
  return (com.testes?.manobras ?? []).filter((m) => TESTES_NOMEADOS.has(m.id)).flatMap((m) => {
    const d = (m.executar ?? 0) - (bs.get(m.id)?.executar ?? 0);
    return d ? [{ chave: `teste:${m.id}`, rotulo: m.nome ?? m.id, valor: d, texto: `${d > 0 ? "+" : "−"}${Math.abs(d)}` }] : [];
  });
}
const empurrao = (d) => (d.efeitos?.detalhes ?? []).filter((x) => x.canal === "distanciaEmpurrao" && !x.suplantado).reduce((s, x) => s + (Number(x.valor) || 0), 0);
function empurraoDiferente(com, sem) {
  const d = empurrao(com) - empurrao(sem);
  return d ? [{ chave: "distanciaEmpurrao", rotulo: "Empurrão", valor: d, texto: `${d > 0 ? "+" : "−"}${fmtM(Math.abs(d))} m` }] : [];
}
export const compararTudo = (com, sem) => [...compararSaldo(com, sem), ...margemDiferente(com, sem), ...gruposDiferentes(com, sem, 1), ...gruposDiferentes(sem, com, -1),
  ...testesNomeadosDiferentes(com, sem), ...empurraoDiferente(com, sem)];
const COMPARADOS = "Ataque Básico (Acerto, Dano, Dados, Margem de Crítico e grupos de dados), Testes de Resistência, Perícias, Defesa, RD, PV Temporário, Movimento, Iniciativa, Atenção, CD, PV e PE Máximos, os testes nomeados (Concentração, Fintar, Provocar e Teste de Morte) e a distância do Empurrão";

/* A consequência principal de uma linha: a primeira nesta ordem, e o resto no detalhe. */
const PRIORIDADE = ["defesa", "acerto", "dano", "dados", "margemCritico", "rdGeral", "rdFisico", "rdEspecifico", "pvTemporario", "movimento", "iniciativa", "atencao", "cd", "hp", "pe"];
const peso = (c) => {
  const i = PRIORIDADE.indexOf(c.chave);
  if (i >= 0) return i;
  if (c.chave.startsWith("grupo:")) return 3.5;
  if (c.chave.startsWith("tr:")) return 20;
  if (c.chave.startsWith("pericia:")) return 21;
  return 30;
};
export const ordenarConsequencias = (chips) => [...chips].sort((a, b) => peso(a) - peso(b));

const maxDe = (e, derived) => (typeof e.max === "function" ? e.max(derived) : e.max);
const custoDe = (e, v) => (typeof e.custoPE === "function" ? e.custoPE(v) : e.custoPE);

/* ---------------- grupos ---------------- */
export function montarGrupos(pacote) {
  const { estados, controles, rep } = pacote;
  const porId = new Map(estados.map((e) => [e.id, e]));
  const porLabel = new Map(estados.map((e) => [e.label, e]));
  const aptPorNome = new Map(rep.todas.filter((i) => i.grupo === "aptidao").map((i) => [i.nome, i]));
  const raizDe = (e) => { let x = e; for (let i = 0; i < 8 && x.requerEstado && porId.has(x.requerEstado); i++) x = porId.get(x.requerEstado); return x; };
  const memo = new Map();
  const donoDe = (e0) => {
    if (memo.has(e0.id)) return memo.get(e0.id);
    const e = raizDe(e0);
    let r;
    if (ehVagaSustentacao(e)) r = { chave: "estado:sustentacao", item: null, raiz: e, sustentacao: true };
    else {
      const i = e.label.indexOf(" · ");
      const pai = i > 0 ? porLabel.get(e.label.slice(0, i)) : null;
      if (pai && pai !== e) r = donoDe(pai);
      else {
        const item = (e.feiticoId ? rep.porChave.get(`feitico:${e.feiticoId}`) : null) ?? donoNoRepertorio(e, rep) ?? aptPorNome.get(e.label) ?? null;
        r = item ? { chave: item.chave, item, raiz: e } : { chave: `estado:${e.id}`, item: null, raiz: e };
      }
    }
    memo.set(e0.id, r);
    return r;
  };
  const grupos = new Map();
  for (const e of estados) {
    const d = donoDe(e);
    if (!grupos.has(d.chave)) grupos.set(d.chave, { chave: d.chave, item: d.item, raiz: d.raiz, sustentacao: !!d.sustentacao, estados: [], controles: [] });
    grupos.get(d.chave).estados.push(e);
  }
  for (const c of controles) grupos.get(donoDe(c.estados[0]).chave)?.controles.push(c);
  const out = [];
  for (const g of grupos.values()) {
    if (!g.controles.length) continue;
    const e0 = g.controles[0].estados[0];
    g.nome = g.sustentacao ? "Sustentação" : g.item?.nome ?? g.raiz.label;
    g.filhos = g.estados.filter((e) => e.requerEstado);
    g.recebido = RECEBIDOS[g.raiz.id] ?? null;
    g.origem = g.sustentacao ? { tipo: "feitico", rotulo: "Feitiço", curta: "Feitiço", detalhe: "Vagas de Sustentação" }
      : g.item ? origemDoItem(g.item)
        : g.recebido ? { tipo: "recebido", rotulo: "Recebido", curta: "Recebido", detalhe: donoDoEstado(g.raiz)?.label ?? "" }
          : { tipo: "outros", rotulo: donoDoEstado(g.raiz)?.label ?? "Outros", curta: donoDoEstado(g.raiz)?.label ?? "Outros", detalhe: "" };
    g.como = g.controles[0].partes ? "ligar" : ({ bool: "ligar", opcao: "modo", faixa: "intensidade", multi: "escolhas" })[e0.tipo] ?? "ligar";
    g.porId = porId;
    out.push(g);
  }
  return out;
}

/* O GOLPE ESPECIAL (consolidação ampliada, 2026-10-16, corrigido na devolutiva da E6). As onze propriedades moram em DUAS casas do motor: seis
   são estados de bancada (`sessao.combate`) e cinco são marcas próprias (`sessao.golpeEspecial`: Amplo, Impactante, Sanguinário, Lento e
   Sacrifício). Um golpe só com marcas próprias está montado e pago, mas nenhum estado do grupo está ligado. O reconhecimento é pelo montador
   (`marcasDoGolpe`, módulo folha do motor), sem estado falso nem marca escondida. */
export const CHAVE_GOLPE = "especializacao:cmb_golpe_especial";
const golpeMarcado = (sessao) => !!sessao && Object.values(marcasDoGolpe(sessao)).some((n) => n > 0);
/** As propriedades do Golpe Especial que estão marcadas, nas duas casas: [{ id, nome, vezes, texto }]. Sem marca nenhuma, vazio. */
export function propriedadesDoGolpe(sessao) {
  const marcas = marcasDoGolpe(sessao);
  return PROPRIEDADES_GOLPE.filter((p) => marcas[p.id] > 0).map((p) => ({
    id: p.id, nome: p.nome, vezes: marcas[p.id],
    texto: p.max ? `${p.nome} ${p.niveis?.[marcas[p.id] - 1] ?? marcas[p.id]}` : p.nome,
  }));
}
/** O grupo está ligado? `sessao` só importa ao Golpe Especial, cujas marcas próprias não são estados. */
export const grupoLigado = (g, combate, sessao = null) => g.estados.some((e) => estaLigado(e, combate?.[e.id])) || (g.chave === CHAVE_GOLPE && golpeMarcado(sessao));

/* ---------------- opções: a ficha inteira, encontrável ---------------- */
export function montarOpcoes(pacote, grupos) {
  const porChave = new Map(grupos.map((g) => [g.chave, g]));
  const out = [];
  const indice = (o, extraNome = [], extraTexto = []) => ({
    ...o,
    texto: o.item?.texto ?? o.recebido ?? o.grupo?.raiz?.title ?? "",
    opcoes: o.item?.opcoes ?? [],
    buscaNome: semAcento([o.nome, ...extraNome].join(" \n ")),
    busca: semAcento([o.nome, ...extraNome, o.item?.texto, o.exemplo?.texto, o.recebido, ...(o.item?.opcoes ?? []).map((x) => `${x.nome} ${x.descricao ?? ""}`), ...extraTexto].filter(Boolean).join(" \n ")),
  });
  for (const g of grupos) {
    const nomesCtrl = g.estados.map((e) => e.label).filter((l) => l !== g.nome);
    const ops = g.estados.flatMap((e) => (e.opcoesVisiveis ?? e.opcoes ?? []).map((o) => o.label));
    const ex = exemploDoGrupo(g);
    const custoConj = g.item?.tipo === "feitico" ? Math.max(0, Math.trunc(Number(g.item.ref?.custoPE) || 0)) : null;
    out.push(indice({ chave: g.chave, nome: g.nome, item: g.item, grupo: g, origem: g.origem, como: g.como, exemplo: ex, recebido: g.recebido, custoConjuracao: custoConj }, nomesCtrl, [...ops, g.raiz.title]));
  }
  for (const i of pacote.rep.todas) {
    if (porChave.has(i.chave)) continue;
    if (String(i.id ?? "").startsWith("rec_")) continue; // Feitiço recebido gerado para a conta
    const ehFeitico = i.tipo === "feitico";
    if (!ehFeitico && !GRUPO_IDS.has(i.grupo)) continue;
    const ex = exemploDoItem(i);
    const passivo = ehFeitico && i.ref?.tipo === "passivo";
    /* Sempre Valendo só quando o DADO diz: o Feitiço Passivo (`grupo: "passivo"`, do tipo `passivo` do catálogo
       de Feitiços) é um benefício permanente, sem ação. O resto sem controle continua "Sem Controle" até um
       texto do estudo dizer `como: "sempre"`: número permanente no derive não prova passividade. */
    const feiticoPassivo = i.grupo === "passivo";
    const como = ehFeitico ? (passivo ? "sempre" : "usar") : feiticoPassivo ? "sempre" : ex?.como ?? "consulta";
    out.push(indice({ chave: i.chave, nome: i.nome, item: i, grupo: null, origem: origemDoItem(i), como, exemplo: ex, custoUsar: ehFeitico && !passivo ? Math.max(0, Math.trunc(Number(i.ref?.custoPE) || 0)) : null }));
  }
  return out;
}

/* ---------------- a finalidade ---------------- */
const PARA = [
  { id: "acerto", rotulo: "Acerto", calc: (c) => c.chave === "acerto", texto: "acerto" },
  { id: "dano", rotulo: "Dano", calc: (c) => c.chave === "dano" || c.chave === "dados" || c.chave.startsWith("grupo:"), texto: "dano" },
  { id: "defesa", rotulo: "Defesa", calc: (c) => c.chave === "defesa", texto: "defesa" },
  { id: "resistencia", rotulo: "Resistências", calc: (c) => c.chave.startsWith("tr:") },
  { id: "rd", rotulo: "Redução de Dano", calc: (c) => /^rd/.test(c.chave) },
  { id: "pvtemp", rotulo: "PV Temporário", calc: (c) => c.chave === "pvTemporario" },
  { id: "movimento", rotulo: "Movimento", calc: (c) => c.chave === "movimento" },
  { id: "pericia", rotulo: "Perícias", calc: (c) => c.chave.startsWith("pericia:") },
  { id: "furtividade", rotulo: "Furtividade", calc: (c) => c.chave === "pericia:furtividade", texto: "furtividade" },
  { id: "atencao", rotulo: "Atenção", calc: (c) => c.chave === "atencao", texto: "atencao" },
];

function casosDe(g, combate, derived) {
  const c = g.controles[0];
  if (c.partes) return c.estados.filter((e) => !estaLigado(e, combate?.[e.id])).map((e, i) => ({ rotulo: c.partes[c.estados.indexOf(e)] ?? String(i), patch: { [e.id]: e.tipo === "faixa" ? Math.max(1, e.min ?? 0) : true } }));
  const e = c.estados[0];
  const v = combate?.[e.id];
  const ops = e.opcoesVisiveis ?? e.opcoes ?? [];
  if (e.tipo === "bool") return v ? [] : [{ rotulo: null, patch: { [e.id]: true } }];
  if (e.tipo === "faixa") {
    const max = maxDe(e, derived) ?? 99;
    const n = Math.trunc(Number(v) || (e.min ?? 0));
    return n < max ? [{ rotulo: n > (e.min ?? 0) ? `Com ${n + 1}` : null, patch: { [e.id]: n + 1 } }] : [];
  }
  if (e.tipo === "multi") return ops.filter((o) => !(v ?? []).includes(o.id)).map((o) => ({ rotulo: `${(v ?? []).length ? "Somar " : ""}${rotuloOpcao(o.label)}`, patch: { [e.id]: [...(v ?? []), o.id] } }));
  return ops.filter((o) => o.id !== v).map((o) => ({ rotulo: `${v ? "Trocar para " : ""}${rotuloOpcao(o.label)}`, patch: { [e.id]: o.id } }));
}

/** O que cada grupo daria ao ligar, pelo derive (com os recebidos na conta). */
export function simularGrupos(ficha, sessao, grupos) {
  const combate = { ...(sessao.combate ?? {}), ativo: true };
  const base = { ...sessao, combate };
  const antes = derivarCom(ficha, base);
  const out = new Map();
  for (const g of grupos) {
    const casos = casosDe(g, combate, antes);
    out.set(g.chave, casos.map((k) => ({ rotulo: k.rotulo, chips: compararTudo(derivarCom(ficha, { ...base, combate: { ...combate, ...k.patch } }), antes) })));
  }
  return out;
}

/* ---------------- o que dá para verificar antes de usar ---------------- */
export function verificacoes(o, m) {
  const ok = [];
  const nao = [];
  const combate = m.sessao.combate ?? {};
  const disponivel = m.sessao.peAtual + Sessao.peTempTotal(m.sessao);
  if (o.como === "usar" && o.custoUsar != null && disponivel < o.custoUsar) nao.push(`Faltam ${o.custoUsar - disponivel} PE`);
  if (o.grupo) {
    if (!m.combate) nao.push("Pede Em Combate");
    for (const e of o.grupo.estados) {
      if (e.id === "invencivelSobOSol" && !combate.invencivelSobOSol && disponivel < 4) nao.push("Faltam PE");
      if (e.umaVezPorRodada && Sessao.estadoUsadoNestaRodada(m.sessao, e.id)) nao.push("Já Usado Nesta Rodada");
      /* A TRAVA DO FEITIÇO PERMUTATIVO (autor, 2026-10-02): "o Feitiço não pode ser usado". Desligado, ela impede de ligar,
         como na aba Buffs da aplicação principal (`bloqueio(derived, ligado)`). Ligado, vira aviso no cartão. */
      if (typeof e.bloqueio === "function" && !estaLigado(e, combate[e.id])) { const t = e.bloqueio(m.derived, false); if (t) nao.push(t); }
    }
  }
  return { ok, nao };
}

/**
 * As partes do custo À MÃO do estudo (`custoDoEstado` em exemplos.js), com o PE de cada uma pelos valores de
 * `combate`: [{ estado, valor, pe, rotulo, substitui, ligado, gasto }]. `gasto` é o PE da parte nestes valores. Uma parte
 * `substitui` outra: ligada, a outra deixa de custar (os 2 PE do Espírito Incansável no lugar do 1 PE do Espírito de Luta). Null quando o estudo
 * não tem custo por partes.
 */
export function partesDoCusto(gr, combate, exemplo) {
  const lista = exemplo?.custoDoEstado;
  if (!lista) return null;
  const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
  const partes = lista.map((p) => {
    const e = gr.estados.find((x) => x.id === p.estado);
    const ligado = !!e && estaLigado(e, combate?.[e.id]);
    return { ...p, ligado, gasto: !ligado ? 0 : p.valor ? inteiro(combate?.[e.id]) : inteiro(p.pe) };
  });
  for (const p of partes) {
    if (p.substitui && p.ligado) { const alvo = partes.find((x) => x.estado === p.substitui); if (alvo) alvo.gasto = 0; }
  }
  return partes;
}

/** O custo ANTES da ação, curto: { texto, cobra } ou null. `cobra` é da ficha. */
export function custoAntes(o) {
  const g = o.grupo;
  if (g?.estados.some((e) => e.id === "invencivelSobOSol")) return { texto: "4 PE por Rodada", cobra: true };
  if (o.como === "usar" && o.custoUsar) return { texto: `${o.custoUsar} PE`, cobra: true };
  if (g) {
    const e0 = g.controles[0].estados[0];
    const v = e0.tipo === "faixa" ? Math.max(1, (e0.min ?? 0) + 1) : true;
    const c = custoDe(e0, v);
    if (c != null) return { texto: `${c} PE`, cobra: false };
  }
  if (o.custoConjuracao) return { texto: `${o.custoConjuracao} PE`, cobra: false };
  if (o.exemplo?.custoCurto) return { texto: typeof o.exemplo.custoCurto === "string" ? o.exemplo.custoCurto : o.exemplo.custoCurto.padrao, cobra: false };
  return null;
}

/* ---------------- ativos ---------------- */
const ORDEM_ATIVO = { condicao: 0, recebido: 1, proprio: 2 };
const TIPO_ROTULO = Object.fromEntries(TIPOS_FONTE.map((t) => [t.id, t.rotulo]));

export function montarAtivos(m, grupos) {
  const { sessao } = m;
  const combate = sessao.combate ?? {};
  const out = [];
  for (const c of sessao.condicoes ?? []) {
    const f = fichaDaCondicao(c.nome, c.forca);
    out.push({ chave: `condicao:${c.id}`, tipo: "condicao", classe: "condicao", nome: c.nome, origem: { rotulo: "Condição", detalhe: f.forcaLabel ?? "", curta: f.forcaLabel ? `Condição ${f.forcaLabel}` : "Condição" }, rodadas: c.rodadas ?? null, cond: c, ficha: f, consulta: `condicao:${c.nome}` });
  }
  for (const b of sessao.buffs ?? []) {
    if (ehRegistro(b)) {
      out.push({
        chave: `rec:${b.id}`, tipo: "registro", classe: "recebido", nome: b.origemNome, reg: b,
        origem: { rotulo: TIPO_ROTULO[b.tipoFonte] ?? "Recebido", detalhe: b.aplicadoPor ?? "", curta: b.aplicadoPor ? `De ${b.aplicadoPor}` : "Registrado" },
        rodadas: b.rodadas ?? null, semNumero: !(b.beneficios ?? []).some((x) => x.canal && Number(x.valor)),
      });
    } else if (!b.gerado) {
      const semNumero = !b.canal || !String(b.expr ?? "").trim();
      out.push({ chave: `buff:${b.id}`, tipo: "buff", classe: "recebido", nome: b.nome, origem: { rotulo: b.aplicadoPor ? "Recebido" : "Registrado", detalhe: b.aplicadoPor ?? "", curta: b.aplicadoPor ? `De ${b.aplicadoPor}` : "Registrado" }, rodadas: b.rodadas ?? null, buff: b, semNumero });
    }
  }
  for (const g of grupos) {
    if (g.sustentacao) {
      for (const e of g.estados) {
        const v = combate[e.id];
        if (!v) continue;
        const nome = (e.opcoes ?? []).find((o) => o.id === v)?.label ?? "Feitiço";
        out.push({ chave: `sust:${e.id}`, tipo: "sustentado", classe: "proprio", nome, origem: { rotulo: "Feitiço", curta: `Sustentado · ${e.label.replace("Sustentação", "Vaga")}` }, estado: e, feiticoId: v, grupo: g, consulta: `feitico:${v}` });
      }
      continue;
    }
    if (!grupoLigado(g, combate, sessao)) continue;
    out.push({ chave: g.chave, tipo: "grupo", classe: g.recebido ? "recebido" : "proprio", nome: g.nome, origem: g.origem, grupo: g, exemplo: exemploDoGrupo(g), consulta: g.item?.chave ?? `estado:${g.raiz.id}` });
  }
  if ((sessao.exaustao ?? 0) > 0) out.push({ chave: "exaustao", tipo: "exaustao", classe: "condicao", nome: "Exaustão", origem: { rotulo: "Contador", curta: "Contador" }, nivel: sessao.exaustao });
  return out.sort((a, b) => ORDEM_ATIVO[a.classe] - ORDEM_ATIVO[b.classe] || a.nome.localeCompare(b.nome, "pt"));
}

/** A sessão SEM um ativo, para a conta "com ele contra sem ele". */
function sessaoSem(a, sessao) {
  if (a.tipo === "grupo") return { ...sessao, combate: { ...sessao.combate, ...Object.fromEntries(a.grupo.estados.map((e) => [e.id, padraoDe(e)])) } };
  if (a.tipo === "sustentado") return { ...sessao, combate: { ...sessao.combate, [a.estado.id]: null } };
  if (a.tipo === "condicao") return { ...sessao, condicoes: sessao.condicoes.filter((x) => x.id !== a.cond.id) };
  if (a.tipo === "buff") return { ...sessao, buffs: sessao.buffs.filter((x) => x.id !== a.buff.id) };
  if (a.tipo === "registro") return { ...sessao, buffs: sessao.buffs.filter((x) => x.id !== a.reg.id) };
  return null;
}

/**
 * O que cada ativo está dando, e quem cobre quem quando nada muda. É o trecho MAIS CARO da aba (um derive por ativo, e dois por par quando um ativo não muda nada),
 * então é um GERADOR: devolve o controle depois de cada conta, e quem o roda decide quando continuar (`useConsequencias` o fatia em pedaços curtos para o clique não
 * esperar). O resultado final é o mesmo de rodar tudo de uma vez. `antes` põe na frente os ativos que ainda não têm resposta (o que acabou de ligar).
 */
export function* consequenciasEmPassos(ficha, sessao, derived, ativos, antes = null) {
  const out = new Map();
  const sem = new Map();
  const ordem = antes ? [...ativos.filter((a) => !antes.has(a.chave)), ...ativos.filter((a) => antes.has(a.chave))] : ativos;
  for (const a of ordem) {
    const s = sessaoSem(a, sessao);
    if (!s) { out.set(a.chave, []); continue; }
    const d = yield* derivarEmPassos(ficha, s, { porAtivo: out, pronto: false });
    sem.set(a.chave, s);
    out.set(a.chave, compararTudo(derived, d));
    yield { porAtivo: out, pronto: false };
  }
  /* Nada muda sem ele? Procura quem já dá o mesmo: sem os dois, algo muda. */
  const cobertos = new Map();
  for (const a of ativos) {
    if (a.tipo !== "grupo" || (out.get(a.chave) ?? []).length) continue;
    for (const h of ativos) {
      if (h === a || h.tipo !== "grupo" || !sem.has(h.chave)) continue;
      const semH = sem.get(h.chave);
      const semAmbos = sessaoSem(a, semH);
      const dH = yield* derivarEmPassos(ficha, semH, { porAtivo: out, pronto: false });
      const dAmbos = yield* derivarEmPassos(ficha, semAmbos, { porAtivo: out, pronto: false });
      const muda = compararTudo(dH, dAmbos).length;
      yield { porAtivo: out, pronto: false };
      if (muda) { cobertos.set(a.chave, h.nome); break; }
    }
  }
  return { porAtivo: out, cobertos, pronto: true };
}

/** A mesma conta, de uma vez só (para quem não pode esperar: os asserts e as simulações). */
export function consequencias(ficha, sessao, derived, ativos) {
  const it = consequenciasEmPassos(ficha, sessao, derived, ativos);
  let r = it.next();
  while (!r.done) r = it.next();
  return { porAtivo: r.value.porAtivo, cobertos: r.value.cobertos };
}

/* O canal do motor e a marca da comparação têm nomes diferentes. */
const CANAL_PARA_MARCA = { defesa: "defesa", bonusAcerto: "acerto", danoBonus: "dano", rdGeral: "rdGeral", rdFisico: "rdFisico", movimento: "movimento", iniciativa: "iniciativa", atencao: "atencao" };
const ROTULO_MARCA = { defesa: "Defesa", acerto: "Acerto", dano: "Dano", rdGeral: "RD Geral", rdFisico: "RD Física", movimento: "Movimento", iniciativa: "Iniciativa", atencao: "Atenção" };
const txt = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;

/**
 * O que a FONTE vale, e não o que se perde sem ela. Numa disputa (Feitiços
 * entre si, a mesma habilidade repetida), "com contra sem" mostra a diferença
 * para o segundo colocado: o Véu Protetor de +6 aparecia como +5 porque, sem
 * ele, a Pele de Ferro daria +1. A linha diz +6, e o detalhe explica a troca.
 *   vale    { marca: { chave, rotulo, valor, texto } } que a fonte PÕE na conta
 *   coberto nome de quem vale no lugar, quando nada dela soma
 */
/* O recebido que a mesma habilidade da própria ficha já cobre. */
export const COBERTO_PELA_PROPRIA = "propria";
export function contribuicao(a, derived, analise, emGrupos = true) {
  const vale = new Map();
  const empates = [];
  let coberto = null;
  if (a.tipo === "registro") {
    const an = analise?.[a.reg.id] ?? {};
    for (const [canal, x] of Object.entries(an)) {
      const chave = CANAL_PARA_MARCA[canal] ?? canal;
      const v = x.status === "excede" ? x.delta : ["soma", "substitui", "presumido", "empata"].includes(x.status) ? x.valor : null;
      if (v != null) vale.set(chave, { chave, rotulo: ROTULO_MARCA[chave] ?? canal, valor: v, texto: txt(v) });
      if (x.status === "empata") empates.push({ canal, com: x.vencedor });
      else if (v == null && !coberto) coberto = x.vencedor?.nome ?? (x.status === "coberto" ? COBERTO_PELA_PROPRIA : null);
    }
    if (vale.size) coberto = null;
    return { vale, coberto, empates };
  }
  if (a.tipo === "grupo" || a.tipo === "sustentado") {
    const det = (derived.efeitos?.detalhes ?? []).filter((d) => d.nome === a.nome && d.exclusivo);
    const disputas = disputasPorFonte(derived, emGrupos).get(a.nome) ?? [];
    for (const d of det) {
      const chave = CANAL_PARA_MARCA[d.canal];
      if (!chave) continue;
      const empate = disputas.find((x) => x.canal === d.canal && x.alvo === (d.alvo ?? null) && x.status === "empata");
      /* No empate, os dois valem o mesmo: a linha mostra o valor dos dois. */
      if (!d.suplantado || empate) vale.set(chave, { chave, rotulo: ROTULO_MARCA[chave], valor: d.valor, texto: txt(d.valor) });
      if (empate) empates.push({ canal: d.canal, com: empate.com });
    }
    const perdas = disputas.filter((x) => x.status === "perde");
    if (det.length && !vale.size && perdas.length) coberto = perdas[0].vencedor?.nome ?? null;
  }
  return { vale, coberto, empates };
}

/** Por ativo próprio: os valores disputados, com `perde` e `empata` separados. */
export function disputasDosAtivos(ativos, derived, emGrupos = true) {
  const todas = disputasPorFonte(derived, emGrupos);
  const out = new Map();
  for (const a of ativos) {
    if (a.tipo !== "grupo" && a.tipo !== "sustentado") continue;
    const p = todas.get(a.nome);
    if (p?.length) out.set(a.chave, p);
  }
  return out;
}

/* ============================================================
   PV TEMPORÁRIO: concede, registrado, resta
   ============================================================
   Três números que a rodada 8 misturava:
     concede   o que a habilidade dá, CALCULADO pelo motor agora
     registro  se a concessão desta ativação (ou desta rodada) já foi para
               a Vida, guardado em `mesa.pvConcessoes`, e não no pote
     resta     o que sobra no pote da sessão (`pvTempFontes`) daquela fonte
   Consumir 18 de 30 deixa 12 e NÃO reabre a concessão. Uma concessão nova só
   segue a regra da habilidade (`PV_TEMP` em exemplos.js): por uso, depois de
   encerrar e ativar de novo, ou por rodada. O Invencível sob o Sol renova a
   Postura da Terra sozinho, e aí não existe botão: a reserva é da ficha.
   ⚠ A ORIGEM vem do detalhe do motor (`d.origem`, o id do catálogo). O
   Invencível que incorpora a Postura da Terra conta como o MESMO benefício,
   com UMA reserva só: ver `umaReserva` e `depoisDaVirada`, logo abaixo.
   ============================================================ */
export function beneficiosPvTemp(m) {
  const combate = m.sessao.combate ?? {};
  const pote = m.sessao.pvTempFontes ?? {};
  const concessoes = m.mesa.pvConcessoes ?? {};
  const invencivel = !!combate.invencivelSobOSol;
  const out = new Map();
  for (const d of m.derived.efeitos?.detalhes ?? []) {
    if (d.canal !== "pvTemporario" || d.suplantado || !d.valor) continue;
    const regra = PV_TEMP[d.origem] ?? { beneficio: d.origem ?? d.nome, fonte: d.nome, regra: "uso", texto: "Regra de concessão não revisada", naoRevisada: true };
    const chave = regra.beneficio;
    if (!out.has(chave)) {
      const pelaFicha = chave === "terra" && invencivel;
      const fonte = pelaFicha ? FONTE_TERRA_INVENCIVEL : regra.fonte;
      const reg = concessoes[chave] ?? null;
      const podeRegistrar = !pelaFicha && (regra.regra === "rodada" ? !reg || reg.rodada < m.sessao.rodada : !reg);
      /* O que resta é o do BENEFÍCIO, em qualquer das fontes dele. */
      const resta = (FONTES_DO_BENEFICIO[chave] ?? [fonte]).reduce((s, f) => s + (pote[f] ?? 0), 0);
      out.set(chave, {
        beneficio: chave, fonte, regra: pelaFicha ? "ficha" : regra.regra, textoRegra: pelaFicha ? "A ficha renova a cada rodada, pelo Invencível sob o Sol" : regra.texto,
        naoRevisada: !!regra.naoRevisada, concede: 0, origens: [], registro: reg, resta, podeRegistrar,
        dono: DONO_PV[d.origem] ?? null,
      });
    }
    const b = out.get(chave);
    b.concede += d.valor;
    b.origens.push(d.origem);
  }
  return out;
}
/* ---------------- uma reserva por benefício ----------------
   O pote da sessão SOMA as fontes (`pvTempTotal`). A Postura da Terra chega por
   dois nomes: "Postura da Terra", quando o jogador registra, e o que o motor
   escreve quando o Invencível sob o Sol a renova. Os dois são o MESMO
   benefício, e por isso nunca podem existir juntos no pote.
   Uma concessão nova (registrar, ou a renovação do Invencível na virada) fica
   com o MAIOR entre ela e o que resta, que é a regra do próprio motor para a
   mesma fonte (`Math.max` em `avancaInvencivelSobOSol`). O que foi consumido
   continua consumido até uma concessão nova. */
const FONTES_DO_BENEFICIO = { terra: ["Postura da Terra", FONTE_TERRA_INVENCIVEL] };

/** A sessão com uma reserva só do benefício, na `fonteAlvo`. `concessao` é o valor de uma concessão NOVA, ou 0. */
export function umaReserva(sessao, beneficio, fonteAlvo, concessao = 0) {
  const fontes = FONTES_DO_BENEFICIO[beneficio] ?? [fonteAlvo];
  const pote = { ...(sessao.pvTempFontes ?? {}) };
  const resta = Math.max(0, ...fontes.map((f) => pote[f] ?? 0));
  for (const f of fontes) delete pote[f];
  const valor = Math.max(resta, concessao);
  if (valor > 0) pote[fonteAlvo] = valor;
  return { ...sessao, pvTempFontes: pote };
}

/**
 * Depois da virada de rodada. Se o Invencível sob o Sol continuou, o motor
 * acabou de renovar a Postura da Terra na fonte dele: é uma concessão nova, a
 * da rodada. A reserva registrada à mão antes dele é o mesmo benefício e se
 * junta a ela, e a concessão fica anotada como da ficha, nesta rodada. Sem
 * essa anotação, encerrar o Invencível e assumir a Terra de novo na mesma
 * rodada ofereceria uma segunda concessão que a regra não dá.
 */
export function depoisDaVirada(mesa) {
  const s = mesa.sessao;
  const renovada = s.combate?.invencivelSobOSol ? s.pvTempFontes?.[FONTE_TERRA_INVENCIVEL] ?? 0 : 0;
  if (!renovada) return mesa;
  return {
    ...mesa,
    sessao: umaReserva(s, "terra", FONTE_TERRA_INVENCIVEL),
    pvConcessoes: { ...(mesa.pvConcessoes ?? {}), terra: { valor: renovada, fonte: FONTE_TERRA_INVENCIVEL, rodada: s.rodada, pelaFicha: true, ts: Date.now() } },
  };
}

/* Quem é a linha dona de cada origem de PV Temporário, pelo id do item. */
export const DONO_PV = {
  cmb_espirito_de_luta: "cmb_espirito_de_luta", cmb_espirito_incansavel: "cmb_espirito_de_luta",
  cmb_postura_da_terra: "cmb_assumir_postura", api_invencivel_sob_o_sol: "api_invencivel_sob_o_sol", cobrir_se: "cobrir_se",
};
/**
 * As concessões de PV Temporário POR USO de uma habilidade esquecidas, no registro `pvConcessoes` da mesa (a por rodada
 * continua anotada). Um uso novo (Encerrar e Reativar, ou Usar Novamente) é uma concessão nova. O que já está no pote
 * fica: quem junta é o `umaReserva`, com o MAIOR entre o saldo e a concessão nova, e nunca a soma.
 */
export function semConcessoesDeUso(pvConcessoes, itemId) {
  const beneficios = new Set(Object.entries(PV_TEMP).filter(([origem, x]) => DONO_PV[origem] === itemId && x.regra !== "rodada").map(([, x]) => x.beneficio));
  return Object.fromEntries(Object.entries(pvConcessoes ?? {}).filter(([k]) => !beneficios.has(k)));
}
/** O benefício de PV Temporário de um ativo, pela dona da origem. */
export function pvDoAtivo(a, beneficios) {
  const id = a.grupo?.item?.id;
  if (!id) return null;
  for (const b of beneficios.values()) if (b.dono === id) return b;
  return null;
}

/* A sessão depois da próxima virada, pelo MOTOR (`proximaRodada`), sobre uma
   cópia: nada é gravado. Uma vez por sessão (a mesma sessão é lida por vários
   cartões no mesmo desenho). */
const VIRADAS = new WeakMap();
function viradaDoMotor(m) {
  const s = m.mesa?.sessao ?? m.sessao;
  if (!s || !m.derived) return null;
  if (!VIRADAS.has(s)) VIRADAS.set(s, Sessao.proximaRodada(s, m.derived).sessao);
  return VIRADAS.get(s);
}

/* ---------------- custo, duração e atenção de um ativo ---------------- */
/* Âmbar só para o que pede decisão agora: cobrança automática que vem, Exaustão
   e regra pendente. Duração e custo rotineiro são texto neutro. */
export function detalhesDoAtivo(a, m) {
  const combate = m.sessao.combate ?? {};
  const out = { duracao: null, contador: null, custo: null, atencao: [], naMesa: [] };
  if (a.tipo === "condicao" || a.tipo === "buff" || a.tipo === "registro") {
    out.duracao = a.rodadas == null ? null : a.rodadas === 1 ? "Última Rodada" : `${a.rodadas} Rodadas`;
  }
  if (a.tipo === "sustentado") {
    const at = (m.derived.auxiliaresAtivos?.ativos ?? []).find((x) => x.id === a.feiticoId);
    if (at?.sustentacaoPE) out.custo = { texto: `${at.sustentacaoPE} PE por Rodada`, cobra: false };
    out.naMesa.push({ rotulo: "Termina", texto: "Quando a vaga é liberada ou a manutenção deixa de ser paga" });
    const op = (a.estado?.opcoes ?? []).find((x) => x.id === a.feiticoId);
    const trava = typeof op?.bloqueio === "function" ? op.bloqueio(m.derived, true) : null;
    if (trava) out.atencao.push(trava);
  }
  if (a.tipo === "grupo") {
    const ex = a.exemplo;
    for (const e of a.grupo.estados) {
      const v = combate[e.id];
      if (!estaLigado(e, v)) continue;
      /* Ligado, a trava do Feitiço Permutativo é só aviso: o número caiu depois (uma condição) e o Feitiço segue ligado. */
      if (typeof e.bloqueio === "function") { const t = e.bloqueio(m.derived, true); if (t && !out.atencao.includes(t)) out.atencao.push(t); }
      if (e.id === "invencivelSobOSol") {
        const r = Math.max(1, Math.trunc(Number(combate.invencivelRodadas) || 1));
        out.contador = `Rodada ${r} de 4`;
        out.custo = { texto: "4 PE por Rodada", cobra: true };
        /* ⚠ CORRIGIDO EM 2026-10-14: a previsão olhava o PE de AGORA. Na virada,
           a casca de PE do gatilho `rodada` volta ao teto ANTES da cobrança, e
           com zero PE o Invencível pode continuar. Quem decide é a virada do
           próprio motor, rodada sobre uma cópia (`viradaDoMotor`). */
        const prox = viradaDoMotor(m);
        if (prox?.combate?.invencivelSobOSol) out.atencao.push("Cobra 4 PE na Próxima Rodada");
        else out.atencao.push("Encerra na Próxima Rodada");
        if (combate.invencivelPendenteExaustao) out.atencao.push("Exaustão no Fim da Rodada");
        continue;
      }
      if (e.feiticoId) {
        const f = m.pacote.rep.porChave.get(`feitico:${e.feiticoId}`);
        const c = Math.trunc(Number(f?.ref?.custoPE) || 0);
        if (c && !out.custo) out.custo = { texto: `${c} PE`, cobra: false };
        continue;
      }
      const custo = custoDe(e, v);
      if (custo != null && !out.custo) out.custo = { texto: `${custo} PE`, cobra: false };
      if (e.umaVezPorRodada && Sessao.estadoUsadoNestaRodada(m.sessao, e.id)) out.atencao.push("Usado Nesta Rodada");
    }
    if (!out.custo && ex?.custoCurto) {
      const cc = ex.custoCurto;
      if (typeof cc === "string") out.custo = { texto: cc, cobra: false };
      else {
        const ligado = Object.keys(cc).filter((k) => k !== "padrao" && combate[k]).pop();
        out.custo = { texto: cc[ligado] ?? cc.padrao, cobra: false };
      }
    }
    if (!out.custo && ex?.custoDoValor) {
      const e = a.grupo.controles[0].estados[0];
      const n = Math.trunc(Number(combate[e.id]) || 0);
      if (n) out.custo = { texto: `${n} PE`, cobra: false };
    }
    if (!out.custo && ex?.custoDoEstado) {
      const partes = partesDoCusto(a.grupo, combate, ex);
      const n = (partes ?? []).reduce((s, p) => s + p.gasto, 0);
      if (n) out.custo = { texto: `${n} PE`, cobra: false };
    }
    if (ex?.quando) out.naMesa.push({ rotulo: "Quando", texto: ex.quando });
    if (ex?.duracao && !out.contador) out.naMesa.push({ rotulo: "Duração", texto: ex.duracao });
    if (ex?.usos) out.naMesa.push({ rotulo: "Usos", texto: ex.usos });
  }
  if (a.tipo === "registro" && (a.reg.beneficios ?? []).some((b) => b.canal && Number(b.valor)) && !(a.reg.tipoFonte === "feitico" || (a.reg.tipoFonte === "catalogo" && a.reg.origemId) || a.reg.somaPresumida)) {
    out.atencao.push("Regra de Acúmulo Pendente");
  }
  if (a.tipo === "exaustao") out.naMesa.push({ rotulo: "Efeito", texto: "A penalidade de cada nível ainda não tem fonte no Afty e é de mesa" });
  return out;
}

export { estaLigado, padraoDe, compararSaldo, maxDe, derivarCom };
