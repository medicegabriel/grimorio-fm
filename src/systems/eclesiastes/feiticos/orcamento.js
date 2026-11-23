/**
 * ============================================================
 * O EXTRATO DO FEITIÇO DE ECLESIASTES (2026-11-23)
 * ============================================================
 * `calcularFeiticoEcl(f, ctx)` responde quanto o Feitiço tem para gastar, onde
 * gastou, o que sobra ou falta, quanto custa em PE e o que ele entrega.
 *
 * O ORÇAMENTO NÃO É UM NÚMERO SÓ. Cada crédito entra numa FONTE, e algumas
 * fontes só pagam certos gastos (texto, "Criando Feitiços"):
 *   geral        ND + 2×BT (4×BT na Técnica Máxima), Ação, Requisitos, Fadiga, Exaustão
 *   permuta:<id> ⌊contrapartidas / 2⌋, só o efeito que a troca financia
 *   condicional  Requisitos do Passivo Condicional, só os efeitos que dependem dele
 *   semiativo    ⌊1,5×BT⌋ − BT, usos, recarga, Fadiga e Exaustão, só os efeitos ativados
 *   liberacao    ⌊ND/2⌋ + 4, só a camada da Liberação Máxima
 * O gasto restrito paga primeiro na fonte dele e o resto cai na geral. O que
 * sobra numa fonte restrita NÃO vaza para as outras.
 *
 * Todo número sai com `partes` no formato do `PainelDeFontes` (`ui/fontes.jsx`).
 * Puro e síncrono: importa só as duas folhas ao lado.
 * ============================================================
 */
import {
  ACOES_ECL, REQUISITOS_ECL, PONTOS_POR_FADIGA, PONTOS_POR_EXAUSTAO, facesDoDadoEcl,
  METROS_POR_PONTO_ALCANCE, FORMATOS_AREA_ECL, METROS_FAIXA_ADICIONAL, AUX_POR_ID_ECL,
  CONDICAO_POR_ID_ECL, TIPOS_FEITICO_ECL, TECNICA_MAXIMA_ECL, LIBERACAO_BT_MIN,
  LIBERACAO_PONTOS_FIXOS, MORTE_DIRETA_ND_MIN, MORTE_DIRETA_CUSTO, USOS_SEMIATIVO,
  RECARGAS_SEMIATIVO, manutencaoSustentado,
} from "./tabelas";
import { normalizarFeiticoEcl, aplicarLiberacaoEcl, liberacaoTemCompraEcl } from "./modelo";

const PONTOS_REQ = Object.fromEntries(REQUISITOS_ECL.map((r) => [r.value, r.pontos]));
const ROTULO_REQ = Object.fromEntries(REQUISITOS_ECL.map((r) => [r.value, r.label]));
const metrosTxt = (m) => `${String(Math.round(m * 10) / 10).replace(".", ",")} m`;

/** Teto de unidades de um efeito. Com permuta sobe para ⌊1,5 × teto⌋. */
export function tetoDoEfeitoEcl(efeitoId, bt, { permuta = false } = {}) {
  const def = AUX_POR_ID_ECL[efeitoId];
  if (!def) return 0;
  const base = def.teto(Math.max(0, bt));
  return permuta ? Math.floor(base * 1.5) : base;
}

/** Valor que o efeito entrega (unidades × valor, ×1,5 arredondado para baixo na Reação). */
export function valorDoEfeitoEcl(efeitoId, unidades, { reacao = false } = {}) {
  const def = AUX_POR_ID_ECL[efeitoId];
  if (!def) return 0;
  const bruto = unidades * def.valor;
  if (!reacao) return bruto;
  // Metros arredondam para baixo no passo do próprio efeito (1,5 m ou 3 m).
  const passo = def.unidade === "m" ? def.valor : 1;
  return Math.floor((bruto * 1.5) / passo) * passo;
}

export const precoContrapartidas = (contrapartidas) => (contrapartidas ?? [])
  .reduce((s, c) => s + (AUX_POR_ID_ECL[c.efeito]?.custo ?? 0) * (c.unidades || 0), 0);

/** As rodadas de duração usadas pelo Feitiço, olhando todo efeito que tem duração. */
function duracoesUsadas(f) {
  const usadas = new Set();
  for (const a of f.auxiliares) usadas.add(a.duracao);
  for (const c of f.condicoes) usadas.add(c.duracao);
  if (f.dano.continuo && f.dano.dados > 0) usadas.add(f.dano.duracaoContinuo);
  if (f.cura.continuo && f.cura.dados > 0) usadas.add(f.cura.duracaoContinuo);
  return usadas;
}

export function calcularFeiticoEcl(fCru, ctx = {}) {
  const f = normalizarFeiticoEcl(fCru);
  const bt = Math.max(0, Math.trunc(Number(ctx.bt) || 0));
  const ndMax = Number.isFinite(Number(ctx.ndMax)) ? Math.trunc(Number(ctx.ndMax)) : Infinity;
  const passivo = f.natureza === "passivo";
  const reacao = !passivo && f.acao === "reacao";
  const avisos = [];
  const bloqueios = [];

  /* ---------- fontes ---------- */
  const fontes = new Map();
  const fonte = (id, rotulo) => {
    if (!fontes.has(id)) fontes.set(id, { id, rotulo, total: 0, gasto: 0, partes: [] });
    return fontes.get(id);
  };
  const credito = (id, rotulo, label, valor) => {
    const fo = fonte(id, rotulo);
    if (!valor) return;
    fo.total += valor;
    fo.partes.push({ label, valor });
  };
  fonte("geral", "Pontos");

  /* ---------- gastos ---------- */
  const gastos = [];
  const gasto = (aba, id, rotulo, custo, { fontes: deOnde = ["geral"], partes = null, camada = "base", abaOrigem = aba } = {}) => {
    if (!(custo > 0)) return;
    gastos.push({ aba, abaOrigem, id, rotulo, custo, fontes: deOnde, partes: partes ?? [{ label: rotulo, valor: custo }], camada });
  };

  const tipoDef = TIPOS_FEITICO_ECL.find((t) => t.value === f.tipo) ?? TIPOS_FEITICO_ECL[0];
  const destrutivo = !passivo && f.tipo === "destrutivo";
  const catacl = !passivo && f.tipo === "cataclismico";
  const ritualEstendido = destrutivo || catacl;
  const tm = !passivo && f.tecnicaMaxima;

  /* ---------- créditos ---------- */
  if (passivo) {
    credito("geral", "Pontos", "BT", bt);
    const porAprimoramento = Math.floor(bt / 2);
    credito("geral", "Pontos", `Aprimoramentos (${f.passivo.aprimoramentos})`, f.passivo.aprimoramentos * porAprimoramento);
    if (f.passivo.modo === "condicional") {
      fonte("condicional", "Condição");
      for (const r of f.passivo.requisitos) {
        credito("condicional", "Condição", `Requisito ${ROTULO_REQ[r.dificuldade]}`, PONTOS_REQ[r.dificuldade]);
      }
    }
    if (f.passivo.modo === "semiativo") {
      fonte("semiativo", "Ativação");
      credito("semiativo", "Ativação", "Semiativo (1,5× BT)", Math.floor(bt * 1.5) - bt);
      const usos = USOS_SEMIATIVO.find((u) => u.value === f.passivo.usos);
      const reduz = f.passivo.usos !== "um" || Math.floor(bt / 2) > 1;
      credito("semiativo", "Ativação", `Usos: ${usos.label}`, reduz ? usos.ajuste : 0);
      const rec = RECARGAS_SEMIATIVO.find((r) => r.value === f.passivo.recarga);
      credito("semiativo", "Ativação", `Recarga: ${rec.label}`, rec.ajuste);
      credito("semiativo", "Ativação", `Fadiga (${f.passivo.fadiga})`, f.passivo.fadiga * PONTOS_POR_FADIGA);
      credito("semiativo", "Ativação", `Exaustão (${f.passivo.exaustao})`, f.passivo.exaustao * PONTOS_POR_EXAUSTAO);
    }
  } else {
    credito("geral", "Pontos", `ND ${f.nd}`, f.nd);
    credito("geral", "Pontos", tm ? "4× BT (Técnica Máxima)" : "2× BT", (tm ? 4 : 2) * bt);
    if (ritualEstendido) {
      credito("geral", "Pontos", "Ritual Estendido", bt);
    } else {
      const acao = ACOES_ECL.find((a) => a.value === f.acao);
      credito("geral", "Pontos", acao.label, acao.multBt * bt);
    }
    for (const r of f.requisitos) credito("geral", "Pontos", `Requisito ${ROTULO_REQ[r.dificuldade]}`, PONTOS_REQ[r.dificuldade]);
    credito("geral", "Pontos", `Fadiga (${f.fadiga})`, f.fadiga * PONTOS_POR_FADIGA);
    credito("geral", "Pontos", `Exaustão (${f.exaustao})`, f.exaustao * PONTOS_POR_EXAUSTAO);
  }

  /* ---------- Alcance, Área e Alvos ---------- */
  const entrega = { alcance: null, area: null, multiplos: null };
  let areaAtiva = false;
  let dimensaoMetros = 0;
  let qtdAreas = 1;
  if (!passivo) {
    if (catacl) {
      gasto("alcance", "cataclismico", "Cataclísmico (3× BT)", 3 * bt);
      entrega.alcance = { texto: "Mapa Inteiro" };
      entrega.area = { texto: "Mapa Inteiro", formato: "mapa" };
      areaAtiva = true;
    } else {
      if (f.alcance.modo === "distancia") {
        gasto("alcance", "alcance", `Alcance ${metrosTxt(f.alcance.pontos * METROS_POR_PONTO_ALCANCE)}`, f.alcance.pontos);
        entrega.alcance = { metros: f.alcance.pontos * METROS_POR_PONTO_ALCANCE, texto: metrosTxt(f.alcance.pontos * METROS_POR_PONTO_ALCANCE) };
      } else {
        entrega.alcance = { texto: f.alcance.modo === "proprio" ? "Próprio" : "Toque" };
      }
      areaAtiva = destrutivo || f.area.ativa || (f.multiplos.ativo && f.multiplos.areas > 0);
      if (areaAtiva) {
        gasto("alcance", "areaHabilitar", "Habilitar Área (BT)", bt);
        const formato = FORMATOS_AREA_ECL.find((x) => x.value === f.area.formato);
        qtdAreas = f.multiplos.ativo && f.multiplos.areas > 0 ? f.multiplos.areas : 1;
        /* Destrutivo: metade dos pontos comprados para as dimensões volta como
           dimensão a mais, sem recursão (leitura registrada em docs/a-fazer.md). */
        const bonusDestr = destrutivo ? Math.floor(f.area.pontos / 2) : 0;
        dimensaoMetros = (f.area.pontos + bonusDestr) * formato.metros;
        let custoDim = f.area.pontos;
        const partesDim = [{ label: `${formato.dimensao} ${metrosTxt(f.area.pontos * formato.metros)}`, valor: f.area.pontos }];
        let somaFaixas = 0;
        if (f.area.formato === "linha") {
          somaFaixas = f.area.faixas.reduce((s, x) => s + x.metros, 0);
          const custoFaixas = Math.ceil(somaFaixas / METROS_FAIXA_ADICIONAL);
          custoDim += custoFaixas;
          if (custoFaixas) partesDim.push({ label: `Faixas Adicionais ${metrosTxt(somaFaixas)}`, valor: custoFaixas });
          if (f.area.faixas.some((x) => x.metros > dimensaoMetros)) {
            avisos.push("Faixa Adicional mais longa que a Principal");
          }
        }
        if (qtdAreas > 1) partesDim.push({ label: `× ${qtdAreas} Áreas`, texto: `× ${qtdAreas}` });
        gasto("alcance", "areaDimensoes", `${formato.label} ${metrosTxt(dimensaoMetros)}`, custoDim * qtdAreas, { partes: partesDim });
        entrega.area = {
          formato: f.area.formato,
          metros: dimensaoMetros,
          faixasMetros: somaFaixas,
          texto: `${formato.label} ${formato.value === "esfera" ? "de Raio " : ""}${metrosTxt(dimensaoMetros)}`,
          bonusDestrutivo: bonusDestr * formato.metros,
        };
      }
    }
    if (f.multiplos.ativo) {
      gasto("alcance", "multiplos", "Múltiplos Alvos (BT)", bt);
      const n = f.multiplos.alvos + f.multiplos.disparos + f.multiplos.areas;
      entrega.multiplos = { ...f.multiplos, total: n };
      if (n > bt) avisos.push(`Alvos, Disparos e Áreas passam do BT (${n} de ${bt})`);
      if (n < 1) avisos.push("Múltiplos Alvos sem nenhum alvo, disparo ou área");
    }
    const auxEmArea = f.auxiliares.some((a) => a.alvo === "area") || f.condicoes.some((c) => c.alvo === "area");
    if (auxEmArea) gasto("alcance", "auxEmArea", "Efeitos Auxiliares em Área (BT)", bt);
  }

  /* ---------- Dano e Cura ---------- */
  const faces = facesDoDadoEcl(bt);
  const extraDados = destrutivo ? bt : catacl ? Math.floor(bt * 1.5) : 0;
  if (!passivo && !reacao) {
    gasto("efeitos", "danoDados", `Dados de Dano (${f.dano.dados})`, f.dano.dados);
    gasto("efeitos", "curaDados", `Dados de Cura (${f.cura.dados})`, f.cura.dados);
    if (f.dano.vampirico) gasto("efeitos", "vampirico", "Vampírico (BT)", bt);
    if (destrutivo && f.dano.ignorarResistencias) gasto("efeitos", "ignorarResistencias", "Ignorar Resistências (BT)", bt);
    if (destrutivo && f.dano.morteDireta) gasto("efeitos", "morteDireta", "Morte Direta", MORTE_DIRETA_CUSTO);
  }

  /* ---------- Efeitos Auxiliares ---------- */
  const efeitos = [];
  const vistos = new Set();
  for (const a of f.auxiliares) {
    const def = AUX_POR_ID_ECL[a.efeito];
    if (!def) continue;
    const chave = `${a.efeito}:${a.sentido}`;
    if (vistos.has(chave)) avisos.push(`${def.label} repetido como ${a.sentido === "bonus" ? "Bônus" : "Debuff"}`);
    vistos.add(chave);
    if (def.indisponivel) bloqueios.push(`${def.label}: ${def.indisponivel}`);
    if (a.sentido === "debuff" && def.soBonus) bloqueios.push(`${def.label} não existe como Debuff`);
    const precoTroca = reacao ? 0 : precoContrapartidas(a.permuta.contrapartidas);
    const temPermuta = precoTroca > 0;
    if (reacao && a.permuta.contrapartidas.length) bloqueios.push("Reação não pode ser Permutativa");
    const tetoNormal = tetoDoEfeitoEcl(a.efeito, bt);
    const teto = tetoDoEfeitoEcl(a.efeito, bt, { permuta: temPermuta });
    const custo = a.unidades * def.custo;
    const deOnde = ["geral"];
    if (temPermuta) {
      const id = `permuta:${a.id}`;
      fonte(id, `Permuta de ${def.label}`);
      credito(id, `Permuta de ${def.label}`, "Contrapartidas ÷ 2", Math.floor(precoTroca / 2));
      deOnde.unshift(id);
      const excesso = Math.max(0, a.unidades - tetoNormal) * def.custo;
      if (excesso > Math.floor(precoTroca / 2)) avisos.push(`${def.label} acima do BT sem Permuta que pague`);
    }
    if (passivo && f.passivo.modo === "condicional" && a.condicional) deOnde.unshift("condicional");
    if (passivo && f.passivo.modo === "semiativo" && a.ativado) deOnde.unshift("semiativo");
    if (a.unidades > teto) avisos.push(`${def.label} passa do teto (${a.unidades} de ${teto})`);
    gasto("efeitos", `aux:${a.id}`, `${def.label} ${a.sentido === "debuff" ? "−" : "+"}${valorDoEfeitoEcl(a.efeito, a.unidades)}${def.unidade ? ` ${def.unidade}` : ""}`, custo, {
      fontes: deOnde,
      partes: [{ label: `${a.unidades} × ${def.custo}`, valor: custo }],
    });
    efeitos.push({
      id: a.id, efeito: a.efeito, rotulo: def.label, sentido: a.sentido, alvo: a.alvo, escolha: a.escolha,
      duracao: reacao ? "gatilho" : a.duracao, unidades: a.unidades, teto, custo,
      valor: valorDoEfeitoEcl(a.efeito, a.unidades, { reacao }),
      unidade: def.unidade, canal: def.canal, ativado: a.ativado, condicional: a.condicional,
      permuta: temPermuta ? { preco: precoTroca, pontos: Math.floor(precoTroca / 2) } : null,
    });
  }

  /* ---------- Condições ---------- */
  const condicoes = [];
  if (!passivo && !reacao) {
    for (const c of f.condicoes) {
      const def = CONDICAO_POR_ID_ECL[c.condicao];
      if (!def) continue;
      if (def.custo == null) {
        bloqueios.push(`${def.label} está Em Revisão`);
        condicoes.push({ ...c, rotulo: def.label, custo: null });
        continue;
      }
      const custo = Math.max(0, def.custo - c.ajusteRemocao);
      gasto("efeitos", `cond:${c.id}`, def.label, custo, {
        partes: [{ label: def.label, valor: def.custo }, ...(c.ajusteRemocao ? [{ label: c.notaRemocao || "Remoção", valor: -c.ajusteRemocao }] : [])],
      });
      condicoes.push({ ...c, rotulo: def.label, custo });
    }
  }

  /* ---------- Duração ---------- */
  const usadas = passivo || reacao ? new Set() : duracoesUsadas(f);
  const duracao = { duradouro: null, sustentado: null };
  if (usadas.has("duradouro")) {
    const extra = Math.max(0, f.duracao.rodadas - 1);
    const gratis = f.duracao.concentracaoDuradoura ? Math.min(2, extra) : 0;
    const porRodada = Math.ceil(bt / 2);
    const custo = (extra - gratis) * porRodada;
    gasto("efeitos", "duradouro", `Duradouro ${f.duracao.rodadas} Rodadas`, custo, {
      partes: [
        { label: `${extra} Rodadas além da primeira`, texto: String(extra) },
        ...(gratis ? [{ label: "Grátis pela Concentração", texto: `−${gratis}` }] : []),
        { label: `× ⌈BT/2⌉`, texto: `× ${porRodada}` },
      ],
    });
    duracao.duradouro = { rodadas: f.duracao.rodadas, concentracao: f.duracao.concentracaoDuradoura };
  }
  if (usadas.has("sustentado")) {
    if (!f.duracao.concentracaoSustentada) gasto("efeitos", "sustentado", "Sustentado (BT)", bt);
    const mantidos = gastos
      .filter((g) => {
        if (g.id.startsWith("aux:")) return f.auxiliares.find((a) => `aux:${a.id}` === g.id)?.duracao === "sustentado";
        if (g.id.startsWith("cond:")) return f.condicoes.find((c) => `cond:${c.id}` === g.id)?.duracao === "sustentado";
        if (g.id === "danoDados") return f.dano.continuo && f.dano.duracaoContinuo === "sustentado";
        if (g.id === "curaDados") return f.cura.continuo && f.cura.duracaoContinuo === "sustentado";
        return false;
      })
      .reduce((s, g) => s + g.custo, 0);
    duracao.sustentado = {
      concentracao: f.duracao.concentracaoSustentada,
      pontosMantidos: mantidos,
      manutencao: manutencaoSustentado(mantidos),
    };
  }

  /* ---------- Liberação Máxima (camada) ----------
     O Feitiço liberado (base + camada, `aplicarLiberacaoEcl`) passa pelo MESMO
     cálculo, e cada compra que custa mais nele do que no base vira um gasto da
     fonte da Liberação, com a aba de origem ao lado. Assim qualquer compra da
     tabela serve à Liberação, e todo teto e trava vale no Feitiço liberado. */
  let liberacao = null;
  const temCamada = !passivo && !reacao && !ctx.semLiberacao;
  if (temCamada) {
    const algoNaCamada = liberacaoTemCompraEcl(f.liberacao);
    if (bt >= LIBERACAO_BT_MIN) {
      const peExtra = Math.floor(f.nd / 2);
      fonte("liberacao", "Liberação Máxima");
      credito("liberacao", "Liberação Máxima", `PE Adicionais (⌊ND/2⌋)`, peExtra);
      credito("liberacao", "Liberação Máxima", "Liberação Máxima", LIBERACAO_PONTOS_FIXOS);
      const calcL = calcularFeiticoEcl(aplicarLiberacaoEcl(f), { ...ctx, semLiberacao: true });
      const doBase = new Map(gastos.map((g) => [g.id, g.custo]));
      for (const g of calcL.gastos) {
        const delta = g.custo - (doBase.get(g.id) ?? 0);
        if (delta > 0) {
          gasto("liberacao", `lib:${g.id}`, g.rotulo, delta, {
            fontes: ["liberacao"], camada: "liberacao", abaOrigem: g.aba,
            partes: doBase.has(g.id)
              ? [{ label: `${g.rotulo} Liberado`, valor: g.custo }, { label: "Já Pago no Base", valor: -doBase.get(g.id) }]
              : [{ label: g.rotulo, valor: delta }],
          });
        }
      }
      // Permuta comprada só na Liberação ajuda a pagar a própria camada.
      const permutas = (c) => c.fontes.filter((x) => x.id.startsWith("permuta:")).reduce((s, x) => s + x.total, 0);
      const permutaNova = permutas(calcL) - [...fontes.values()].filter((x) => x.id.startsWith("permuta:")).reduce((s, x) => s + x.total, 0);
      if (permutaNova > 0) credito("liberacao", "Liberação Máxima", "Permuta na Liberação", permutaNova);
      // Aviso e trava que só o Feitiço liberado tem.
      const jaTem = new Set([...avisos, ...bloqueios]);
      const novos = (l) => l.filter((a) => !a.startsWith("Faltam ") && !jaTem.has(a)).map((a) => `Na Liberação: ${a}`);
      avisos.push(...novos(calcL.avisos));
      bloqueios.push(...novos(calcL.bloqueios));
      const meioBt = Math.floor(bt / 2);
      const peBase = f.nd + (tm ? bt : 0);
      liberacao = {
        peExtra,
        pe: {
          total: peBase + peExtra,
          partes: [
            { label: `ND ${f.nd}`, valor: f.nd },
            ...(tm ? [{ label: "BT (Técnica Máxima)", valor: bt }] : []),
            { label: "Liberação Máxima (⌊ND/2⌋)", valor: peExtra },
          ],
        },
        fadiga: meioBt > 0 ? Math.floor(peExtra / meioBt) : 0,
        calc: calcL,
        dadosDano: calcL.dano?.dados ?? 0,
        dadosCura: calcL.cura?.dados ?? 0,
        alcanceMetros: calcL.entrega.alcance?.metros ?? null,
        areaMetros: calcL.entrega.area?.metros ?? null,
        auxiliares: Object.fromEntries(calcL.efeitos.map((e) => [e.id, { unidades: e.unidades, valor: e.valor }])),
        temCompra: algoNaCamada,
      };
    } else if (algoNaCamada) {
      avisos.push(`Liberação Máxima pede BT ${LIBERACAO_BT_MIN}`);
    }
  }

  /* ---------- Acerto das contas ---------- */
  const ordenados = [...gastos].sort((a, b) => b.fontes.length - a.fontes.length);
  for (const g of ordenados) {
    let resto = g.custo;
    g.pagoPor = [];
    for (let i = 0; i < g.fontes.length && resto > 0; i++) {
      const fo = fonte(g.fontes[i]);
      const ultima = i === g.fontes.length - 1;
      const livre = Math.max(0, fo.total - fo.gasto);
      const usa = ultima ? resto : Math.min(livre, resto);
      if (usa <= 0) continue;
      fo.gasto += usa;
      resto -= usa;
      g.pagoPor.push({ fonte: fo.id, pontos: usa });
    }
  }
  const lista = [...fontes.values()].map((fo) => ({ ...fo, sobra: Math.max(0, fo.total - fo.gasto), falta: Math.max(0, fo.gasto - fo.total) }));
  const geral = lista.find((x) => x.id === "geral");
  const porAba = { base: geral.total, alcance: 0, efeitos: 0, liberacao: 0 };
  for (const g of gastos) porAba[g.aba] = (porAba[g.aba] ?? 0) + g.custo;
  for (const fo of lista) {
    if (fo.falta > 0) avisos.push(fo.id === "geral" ? `Faltam ${fo.falta} Pontos` : `Faltam ${fo.falta} Pontos em ${fo.rotulo}`);
  }

  /* ---------- Travas de tipo e de acesso ---------- */
  if (!passivo) {
    if (f.nd > ndMax) avisos.push(`ND acima do ${ctx.rotuloNivel ?? "nível"} (${ndMax})`);
    if (tipoDef.btMin && bt < tipoDef.btMin) avisos.push(`${tipoDef.label} pede BT ${tipoDef.btMin}`);
    if (tipoDef.ndMin && f.nd < tipoDef.ndMin) avisos.push(`${tipoDef.label} pede ND ${tipoDef.ndMin}`);
    if (catacl && !f.requisitos.some((r) => r.dificuldade === "dificil" || r.dificuldade === "impossivel")) {
      avisos.push("Cataclísmico pede um Requisito Difícil ou Impossível");
    }
    if (destrutivo && f.dano.morteDireta && f.nd < MORTE_DIRETA_ND_MIN) avisos.push(`Morte Direta pede ND ${MORTE_DIRETA_ND_MIN}`);
    if (tm) {
      if (!ctx.temTecnicaMaxima) avisos.push("Técnica Máxima pede a Aptidão");
      if (bt < TECNICA_MAXIMA_ECL.btMin) avisos.push(`Técnica Máxima pede BT ${TECNICA_MAXIMA_ECL.btMin}`);
      if (f.nd < TECNICA_MAXIMA_ECL.ndMin) avisos.push(`Técnica Máxima pede ND ${TECNICA_MAXIMA_ECL.ndMin}`);
    }
    if (f.dano.vampirico && reacao) bloqueios.push("Vampírico não pode ser Reação");
    if (f.dano.continuo && f.dano.dados > 0 && f.dano.dados < 2) avisos.push("Dano Contínuo pede pelo menos 2 dados");
    if (f.cura.continuo && f.cura.dados > 0 && f.cura.dados < 2) avisos.push("Cura Contínua pede pelo menos 2 dados");
    if (f.multiplos.ativo && f.multiplos.disparos > f.dano.dados + extraDados) avisos.push("Cada Disparo precisa de pelo menos um dado");
  }

  /* ---------- O que ele entrega ---------- */
  const dadosDano = passivo || reacao ? 0 : f.dano.dados + extraDados;
  const dadosCura = passivo || reacao ? 0 : f.cura.dados;
  const divisor = f.multiplos.ativo ? Math.max(1, f.multiplos.alvos + f.multiplos.disparos + f.multiplos.areas) : 1;
  const dano = dadosDano > 0 ? {
    dados: dadosDano, faces, tipo: f.dano.tipo, resolucao: f.dano.resolucao, tr: f.dano.tr,
    porParte: divisor > 1 ? Math.floor(dadosDano / divisor) : null,
    resto: divisor > 1 ? dadosDano % divisor : 0,
    partes: divisor,
    porRodada: f.dano.continuo ? Math.floor(dadosDano / 2) : null,
    vampirico: f.dano.vampirico,
    ignorarResistencias: catacl || (destrutivo && f.dano.ignorarResistencias),
    morteDireta: catacl || (destrutivo && f.dano.morteDireta),
    desvantagemTR: ritualEstendido,
    partesDados: [
      { label: "Comprados", valor: f.dano.dados },
      ...(extraDados ? [{ label: destrutivo ? "Destrutivo (BT)" : "Cataclísmico (1,5× BT)", valor: extraDados }] : []),
    ],
  } : null;
  const cura = dadosCura > 0 ? {
    dados: dadosCura, faces,
    porRodada: f.cura.continuo ? Math.floor(dadosCura / 2) : null,
    temporaria: !ctx.temEnergiaReversa,
  } : null;

  const pePartes = [{ label: `ND ${f.nd}`, valor: f.nd }];
  if (tm) pePartes.push({ label: "BT (Técnica Máxima)", valor: bt });
  const pe = passivo ? null : { total: f.nd + (tm ? bt : 0), partes: pePartes };
  const recarga = tm ? Math.max(2, 6 - Math.floor(bt / 2)) : null;

  const usosSemiativo = passivo && f.passivo.modo === "semiativo"
    ? (f.passivo.usos === "um" ? 1 : f.passivo.usos === "bt" ? bt : Math.floor(bt / 2))
    : null;

  return {
    feitico: f,
    bt,
    fontes: lista,
    geral,
    gastos,
    porAba,
    sobra: geral.sobra,
    falta: geral.falta,
    pe,
    recarga,
    acao: passivo ? null : ritualEstendido ? "ritualEstendido" : f.acao,
    entrega,
    dano,
    cura,
    efeitos,
    condicoes,
    duracao,
    liberacao,
    usosSemiativo,
    avisos,
    bloqueios,
    valido: avisos.length === 0 && bloqueios.length === 0,
  };
}
