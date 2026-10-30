/* ============================================================
   REPERTÓRIO, TESTES, BUSCA E POSSE DE ESTADOS
   ============================================================
   Monta, a partir do derive REAL, a lista única que o protótipo mostra.
   Nenhum número é calculado aqui: o que tem valor vem do motor, o que tem
   texto vem do catálogo, verbatim.

   Regras de contagem (pedidas na revisão):
   - cada entrada aparece UMA vez no Repertório;
   - Fixados são REFERÊNCIAS às mesmas entradas e não somam ao total;
   - Feitiços passivos moram na seção Feitiços e em nenhum outro lugar.
   ============================================================ */
import { conteudoDaFicha, equipamentosDaFicha, funcionamentosDaFicha, linhasDeEstado, familiaEParte } from "./ponte";
import { semAcento, termosDe, trechoLiteral } from "./util";

const TIPO_FEITICO = {
  dano: "Dano", curativo: "Curativo", auxiliar: "Auxiliar", especial: "Especial",
  passivo: "Passivo", personalizado: "Personalizado",
};

const ROTULOS_SECAO = {
  ataques: "Ataques e Manobras",
  feiticos: "Feitiços",
  tecnica: "Técnica e Domínio",
  estilo: "Técnicas de Estilo",
  talento: "Talentos",
  geral: "Habilidades Gerais",
  aptidao: "Aptidões Amaldiçoadas",
  altoNivel: "Níveis Lendários",
  origem: "Origem",
  itens: "Itens",
};

const buscaDe = (partes) => semAcento(partes.filter(Boolean).join(" \n "));

/** O Repertório inteiro, em seções, na ordem de uso na mesa. */
export function montarRepertorio(ficha, derived) {
  const secoes = [];
  const pushSecao = (id, rotulo, itens) => { if (itens.length) secoes.push({ id, rotulo, itens }); };

  /* ---------- Ataques e Manobras ---------- */
  const ataques = [
    ...(derived.dano?.entradas ?? []).map((e) => ({
      chave: `dano:${e.id}`, tipo: "ataque", id: e.id, nome: e.nome, texto: "",
      marcas: [e.margemCritico != null ? `Crít. ${e.margemCritico}` : null, e.alcance?.texto, e.tipoDanoLabel].filter(Boolean),
      ref: e,
    })),
    ...(derived.cura?.linhas ?? []).map((l) => ({
      chave: `cura:${l.id}`, tipo: "cura", id: l.id, nome: l.nome, texto: "",
      marcas: ["Cura", typeof l.alcance === "string" ? l.alcance : null].filter(Boolean),
      ref: l,
    })),
    ...(derived.testes?.manobras ?? []).map((m) => ({
      chave: `manobra:${m.id}`, tipo: "manobra", id: m.id, nome: m.nome, texto: "",
      marcas: [m.periciaUsada].filter(Boolean), ref: m,
    })),
  ];
  pushSecao("ataques", ROTULOS_SECAO.ataques, ataques);

  /* ---------- Conteúdo escolhido (os catálogos) ---------- */
  const conteudo = conteudoDaFicha(ficha, derived);
  const passivos = conteudo.filter((i) => i.grupo === "passivo");

  /* ---------- Feitiços: ativos da lista do motor, passivos do conteúdo ---------- */
  const feiticos = [
    ...(derived.feiticos?.lista ?? []).filter((f) => f.tipo !== "passivo").map((f) => ({
      chave: `feitico:${f.id}`, tipo: "feitico", id: f.id, nome: f.nome || "Feitiço Sem Nome",
      texto: [f.conjuracaoTexto, f.descricao].filter(Boolean).join("\n\n"),
      marcas: [TIPO_FEITICO[f.tipo] ?? f.tipo, f.nivelLabel, f.variacao ? "Variação" : null].filter(Boolean),
      custoPE: f.custoPE ?? null, ref: f,
    })),
    ...passivos.map((i) => ({
      ...i, tipo: "habilidade", secao: "feiticos",
      marcas: ["Passivo", ...i.tags.map((t) => t.label)],
    })),
  ];
  pushSecao("feiticos", ROTULOS_SECAO.feiticos, feiticos);

  /* ---------- Técnica: Funcionamentos Básicos e Domínios ---------- */
  const tecnica = [
    ...funcionamentosDaFicha(ficha).filter((f) => String(f.descricao ?? "").trim()).map((f) => ({
      chave: `funcionamento:${f.id}`, tipo: "funcionamento", id: f.id, nome: f.nome || "Funcionamento Básico",
      texto: f.descricao, rico: true, marcas: ["Técnica"], ref: f,
    })),
    ...(derived.dominios?.lista ?? []).map((d) => ({
      chave: `dominio:${d.id}`, tipo: "dominio", id: d.id, nome: d.nome || "Domínio Sem Nome",
      texto: d.texto ?? "", marcas: ["Expansão de Domínio", d.area, d.custo ? `${d.custo} PE` : null].filter(Boolean),
      custoPE: null, ref: d,
    })),
  ];
  pushSecao("tecnica", ROTULOS_SECAO.tecnica, tecnica);

  /* ---------- Especializações, uma seção por Classe ---------- */
  const porClasse = new Map();
  for (const i of conteudo.filter((x) => x.grupo === "especializacao")) {
    const id = i.sub?.id ?? "esp";
    if (!porClasse.has(id)) porClasse.set(id, { rotulo: i.sub?.label ?? "Especialização", itens: [] });
    porClasse.get(id).itens.push({
      ...i, tipo: "habilidade", secao: `esp:${id}`,
      marcas: i.tags.map((t) => t.label).filter((l) => l !== i.sub?.label),
    });
  }
  for (const [id, g] of porClasse) pushSecao(`esp:${id}`, g.rotulo, g.itens);

  for (const grupo of ["estilo", "talento", "geral", "aptidao", "altoNivel", "origem"]) {
    const itens = conteudo.filter((x) => x.grupo === grupo).map((i) => ({
      ...i, tipo: "habilidade", secao: grupo,
      marcas: [grupo === "altoNivel" ? i.sub?.label : null, ...i.tags.map((t) => t.label)].filter(Boolean),
    }));
    pushSecao(grupo, ROTULOS_SECAO[grupo], itens);
  }

  const itensEquip = equipamentosDaFicha(derived).map((i) => ({
    ...i, tipo: "item", secao: "itens",
    marcas: [i.sub?.label, ...i.tags.map((t) => t.label)].filter(Boolean),
  }));
  pushSecao("itens", ROTULOS_SECAO.itens, itensEquip);

  // Cada entrada sabe a seção dela e tem o índice de busca pronto.
  for (const s of secoes) {
    for (const e of s.itens) {
      e.secao = s.id;
      e.secaoRotulo = s.rotulo;
      e.opcoes = e.opcoes ?? [];
      e.busca = buscaDe([e.nome, e.texto, ...e.opcoes.map((o) => `${o.nome} ${o.descricao ?? ""}`)]);
      e.buscaNome = semAcento(e.nome);
    }
  }
  const todas = secoes.flatMap((s) => s.itens);
  return { secoes, todas, porChave: new Map(todas.map((e) => [e.chave, e])), total: todas.length };
}

/* ============================================================
   ESTADOS: quem é dono de quem
   ============================================================ */

/** As linhas de estado desta ficha (mesma regra de posse da aba Buffs). */
export function estadosDaFicha(derived) {
  return linhasDeEstado(derived);
}

/* A entrada do Repertório que é dona do estado. Só relação estruturada:
   `requerHabilidade`, `requerTalento`, `requerAptidao`, `requerEscolha` (a
   opção aninhada de uma Habilidade) e `requerApice`. */
export function donoNoRepertorio(estado, rep) {
  const lista = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const ids = [...lista(estado.requerHabilidade), ...lista(estado.requerTalento), ...lista(estado.requerAptidao), ...lista(estado.requerApice)];
  for (const e of rep.todas) {
    if (e.tipo !== "habilidade") continue;
    if (ids.includes(e.id)) return e;
    if (estado.requerEscolha && e.opcoes.some((o) => o.id === estado.requerEscolha)) return e;
  }
  return null;
}

/* ============================================================
   EM JOGO: controles frequentes agrupados
   ============================================================
   Bool irmãos de uma mesma família ("Golpe Especial · Atroz", "· Letal"...)
   viram UM controle com várias partes. O resto é um controle por estado. */
export function controlesEmJogo(estados, rep) {
  const grupos = [];
  const porFamilia = new Map();
  for (const e of estados) {
    if (e.requerEstado) continue;
    const { familia, parte } = familiaEParte(e.label);
    const dono = donoNoRepertorio(e, rep);
    if (e.tipo === "bool" && familia) {
      const id = `fam:${familia}`;
      if (!porFamilia.has(id)) {
        const g = { id, rotulo: familia, estados: [], partes: [], dono };
        porFamilia.set(id, g);
        grupos.push(g);
      }
      porFamilia.get(id).estados.push(e);
      porFamilia.get(id).partes.push(parte);
    } else {
      grupos.push({ id: e.id, rotulo: e.label, estados: [e], dono });
    }
  }
  return grupos;
}

/* ============================================================
   BUSCA com trecho literal
   ============================================================ */
export function buscar(indice, termo) {
  const termos = termosDe(termo);
  if (!termos.length) return [];
  const casa = (e) => termos.every((t) => e.busca.includes(t));
  const out = [];
  for (const e of indice) {
    if (!casa(e)) continue;
    const nomeTudo = termos.every((t) => e.buscaNome.includes(t));
    const nomeComeca = e.buscaNome.startsWith(termos[0]);
    const opcao = (e.opcoes ?? []).find((o) => termos.some((t) => semAcento(o.nome).includes(t)));
    const onde = nomeTudo ? "nome" : opcao ? "opção" : "texto";
    const rank = nomeComeca ? 0 : nomeTudo ? 1 : opcao ? 2 : 3;
    const trecho = onde === "texto" ? trechoLiteral(e.texto ?? "", termos)
      : onde === "opção" ? trechoLiteral(`${opcao.nome}: ${opcao.descricao ?? ""}`, termos)
      : trechoLiteral(e.nome, termos);
    out.push({ e, onde, rank, trecho, contexto: onde === "nome" ? inicioLiteral(e.texto) : null });
  }
  return out.sort((a, b) => a.rank - b.rank);
}

/* O começo do texto, literal, para dar contexto a quem casou só no nome. */
function inicioLiteral(texto, n = 150) {
  const t = String(texto ?? "").trim();
  if (!t) return null;
  const corte = t.length > n ? t.lastIndexOf(" ", n) : t.length;
  return { partes: [{ t: t.slice(0, corte > 0 ? corte : n), marca: false }], cortadoAntes: false, cortadoDepois: t.length > n };
}
