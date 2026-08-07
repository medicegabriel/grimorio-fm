/**
 * ============================================================
 * CONTEÚDO DA FICHA — tudo que a criatura escolheu, numa lista só
 * ============================================================
 * Puro, sem React. Junta os SEIS catálogos onde as escolhas de uma criatura se
 * espalham e devolve um formato único, que a aba Habilidades exibe e a busca
 * global varre. Sem isto, cada consumidor reimplementaria a mesma travessia e
 * eles divergiriam no dia em que um catálogo novo entrasse.
 *
 * ⚠ O TEXTO É VERBATIM DO LIVRO e sai daqui sem uma vírgula mexida. É a regra
 * mais antiga do projeto, e vale mais ainda na Ficha: o jogador lê ISTO na mesa
 * para saber o que a habilidade dele faz. Nada de resumo, nada de paráfrase.
 *
 * ⚠ Nenhum catálogo tem metadado de AÇÃO (se é ação, ação bônus ou reação),
 * CUSTO ou USOS. É por isso que estes itens não entram na aba Ações: montar
 * aquela lista a partir daqui exigiria inventar a classificação. Ver a pergunta
 * D7 em `docs/afty-ficha-final.md`.
 * ============================================================
 */

import { getHabilidade } from "../afty-habilidades";
import { getTalento } from "../afty-talentos";
import { getAptidao, getCategoriaAptidao } from "../afty-aptidoes";
import { getHabilidadeGeral } from "../afty-gerais";
import { getMelhoriaSuperior, getHabilidadeLendaria, getHabilidadeApice } from "../afty-alto-nivel";
import { getEspecializacao } from "../afty-especializacoes";
import { caracteristicasEfetivas, getOrigem, getCla } from "../afty-origens";
import { NIVEL_LABEL } from "../afty-feiticos";

/**
 * O rótulo de cada tipo de equipamento. Tipo que não estiver aqui vira uma
 * sub-aba "Outros" em vez de sumir da tela: o inventário nunca esconde item.
 */
export const ROTULO_EQUIPAMENTO = {
  arma: "Armas",
  uniforme: "Uniformes",
  escudo: "Escudos",
  kit: "Kits",
  item: "Itens",
};

/** Os grupos, na ordem em que aparecem na aba. */
export const GRUPOS = [
  { id: "origem", label: "Origem" },
  { id: "especializacao", label: "Habilidades de Especialização" },
  { id: "passivo", label: "Passivos e Características" },
  { id: "talento", label: "Talentos" },
  { id: "geral", label: "Habilidades Gerais" },
  { id: "aptidao", label: "Aptidões Amaldiçoadas" },
  { id: "altoNivel", label: "Níveis Lendários" },
];

/** Sem acento e em minúsculas, que é como a busca compara. */
export const semAcento = (s) => String(s ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * As opções aninhadas ESCOLHIDAS de um item, já com nome e descrição.
 *
 * O mapa da ficha guarda só ids, e o nome de cada opção mora no próprio item do
 * catálogo (`item.escolha.opcoes`). Uma opção que não existe mais no catálogo é
 * descartada em silêncio, que é o que o resolver já faz.
 */
function opcoesEscolhidas(item, mapa) {
  const ids = mapa?.[item?.id];
  if (!Array.isArray(ids) || !ids.length || !item?.escolha?.opcoes) return [];
  return ids
    .map((id) => item.escolha.opcoes.find((o) => o.id === id))
    .filter(Boolean)
    .map((o) => ({ id: o.id, nome: o.nome, descricao: o.descricao ?? null }));
}

/**
 * As divisões de dentro de um grupo, e a ordem delas.
 *
 * ⚠ Só existem porque a lista fica GRANDE em ficha de nível alto (autor,
 * 2026-08-06). Um multiclasse ND 40 empilha as Habilidades das duas
 * Especializações numa coluna só, e achar a do Lutador no meio das do Conjurador
 * é rolar até topar. As Especializações viram sub-aba pelo id da própria
 * Especialização, então uma classe nova não precisa de nada aqui.
 *
 * Nos Níveis Lendários a divisão é fixa, porque são três coisas de natureza
 * diferente que nunca foram uma lista só de verdade.
 */
export const SUBS_ALTO_NIVEL = [
  { id: "melhoria", label: "Melhorias Superiores" },
  { id: "lendaria", label: "Habilidades Lendárias" },
  { id: "apice", label: "Habilidade Ápice" },
];

/**
 * Uma marca de linha, normalizada para `{ label, tipo }`.
 *
 * ⚠ O `tipo` existe por causa da LARGURA. "Nível 1" e "Nível 20" são textos de
 * tamanhos diferentes, e como marca eles serrilhavam a coluna da direita: a
 * fileira virava uma serra, que é o mesmo problema que a grade de defesas teve
 * no cabeçalho (autor, 2026-08-06). Com o tipo, o CSS dá largura fixa e número
 * tabular só às marcas que são NÚMERO, sem mexer nas que são palavra.
 *
 * Aceita string, porque a maioria das marcas não precisa de tipo nenhum.
 */
const marca = (t) => (typeof t === "string" ? { label: t, tipo: null } : { label: t.label, tipo: t.tipo ?? null });

const item = ({ id, chave, nome, texto, grupo, sub = null, tags = [], opcoes = [], aviso = null }) => ({
  // `chave` é única na Ficha inteira. O `id` sozinho não serve: uma Melhoria
  // repetível aparece mais de uma vez, e duas listas diferentes podem trazer o
  // mesmo id (o Ataque Inconsequente existe no Lutador e no Restringido).
  chave: chave ?? `${grupo}:${id}`,
  id, nome, texto, grupo, sub, tags: tags.filter(Boolean).map(marca), opcoes, aviso,
  busca: semAcento(`${nome} ${texto} ${opcoes.map((o) => o.nome).join(" ")}`),
});

/**
 * Monta a lista inteira.
 *
 * @param creature a ficha já mesclada com os defaults
 * @param derived  o resultado do deriveAfty
 */
export function conteudoDaFicha(creature, derived) {
  const itens = [];

  /* ---------- Origem ---------- */
  const origem = getOrigem(creature?.core?.origem?.id);
  const cla = getCla(creature?.core?.origem?.cla);
  const mapaOrigem = derived?.origem?.mapa ?? {};
  for (const c of caracteristicasEfetivas(creature)) {
    itens.push(item({
      id: c.id,
      chave: `origem:${c.id}`,
      nome: c.nome,
      texto: c.descricao ?? "",
      grupo: "origem",
      tags: [origem?.nome, cla?.nome].filter(Boolean),
      opcoes: opcoesEscolhidas(c, mapaOrigem),
      // ⚠ `mesa` e `parcial` são do catálogo e dizem que o Motor NÃO cobre
      // aquilo. Some na Ficha seria esconder do jogador justo o que ele
      // precisa resolver na mão.
      aviso: c.mesa ? "Resolve na mesa" : (c.parcial ?? null),
    }));
  }

  /* ---------- Habilidades de Especialização ---------- */
  const mapaHab = derived?.habilidades?.escolhas?.mapa ?? {};
  const inacessiveisHab = new Set(derived?.habilidades?.inacessiveis ?? []);
  for (const id of derived?.habilidades?.escolhidas ?? []) {
    const h = getHabilidade(id);
    if (!h) continue;
    const espec = getEspecializacao(h.especializacaoId);
    itens.push(item({
      id,
      nome: h.nome,
      texto: h.descricao ?? "",
      grupo: "especializacao",
      // ⚠ A sub-aba sai da PRÓPRIA Especialização, e não de uma lista escrita à
      // mão: classe nova entra sozinha. Sem `especializacaoId` (não deveria
      // acontecer) o item cai numa aba "Outras" em vez de sumir da tela.
      sub: { id: h.especializacaoId ?? "outras", label: espec?.nome ?? "Outras" },
      tags: [espec?.nome, h.nivel ? { label: `Nível ${h.nivel}`, tipo: "nivel" } : null],
      opcoes: opcoesEscolhidas(h, mapaHab),
      aviso: inacessiveisHab.has(id) ? "Pré-requisito não atendido" : null,
    }));
  }

  /* ---------- Passivos e Características ---------- */
  for (const f of Array.isArray(creature?.feiticos) ? creature.feiticos : []) {
    if (f?.tipo !== "passivo") continue;
    itens.push(item({
      id: f.id,
      chave: `passivo:${f.id}`,
      nome: f.nome || "Passivo Sem Nome",
      texto: f.descricao ?? "",
      grupo: "passivo",
      tags: [NIVEL_LABEL[f.nivel] ?? String(f.nivel)],
    }));
  }

  /* ---------- Talentos ---------- */
  const mapaTal = derived?.talentos?.escolhas?.mapa ?? {};
  const inacessiveisTal = new Set(derived?.talentos?.inacessiveis ?? []);
  for (const id of derived?.talentos?.escolhidas ?? []) {
    const t = getTalento(id);
    if (!t) continue;
    itens.push(item({
      id,
      nome: t.nome,
      texto: t.descricao ?? "",
      grupo: "talento",
      tags: t.nivel ? [{ label: `Nível ${t.nivel}`, tipo: "nivel" }] : [],
      opcoes: opcoesEscolhidas(t, mapaTal),
      aviso: inacessiveisTal.has(id) ? "Pré-requisito não atendido" : null,
    }));
  }

  /* ---------- Habilidades Gerais ---------- */
  // Lista COM repetição: cada pega é uma entrada, e o contador mostra quantas.
  const contagemGeral = new Map();
  for (const id of derived?.gerais?.escolhidas ?? []) {
    contagemGeral.set(id, (contagemGeral.get(id) ?? 0) + 1);
  }
  const inacessiveisGer = new Set(derived?.gerais?.inacessiveis ?? []);
  for (const [id, vezes] of contagemGeral) {
    const g = getHabilidadeGeral(id);
    if (!g) continue;
    itens.push(item({
      id,
      nome: g.nome,
      texto: g.descricao ?? "",
      grupo: "geral",
      tags: vezes > 1 ? [{ label: `${vezes}×`, tipo: "vezes" }] : [],
      aviso: inacessiveisGer.has(id) ? "Pré-requisito não atendido" : null,
    }));
  }

  /* ---------- Aptidões Amaldiçoadas ---------- */
  const opcoesAptidao = creature?.aptidaoOpcoes ?? {};
  for (const id of derived?.aptidoesEscolhidas ?? []) {
    const a = getAptidao(id);
    if (!a) continue;
    // A Aptidão não usa escolha aninhada: ela tem `opcoes` no catálogo e a
    // escolha vira uma booleana do DSL. Ver a Superioridade Física.
    const escolhida = a.opcoes?.valores?.find((v) => v.id === opcoesAptidao[id]);
    itens.push(item({
      id,
      nome: a.nome,
      texto: a.descricao ?? "",
      grupo: "aptidao",
      tags: [getCategoriaAptidao(a.categoria)?.nome].filter(Boolean),
      opcoes: escolhida ? [{ id: escolhida.id, nome: escolhida.nome ?? escolhida.label, descricao: null }] : [],
    }));
  }

  /* ---------- Níveis Lendários ---------- */
  const mapaAlto = derived?.altoNivel?.escolhas?.mapa ?? {};
  for (const m of derived?.altoNivel?.melhorias?.escolhidas ?? []) {
    const def = getMelhoriaSuperior(m.id);
    if (!def) continue;
    itens.push(item({
      id: m.id,
      chave: `altoNivel:mel:${m.id}`,
      nome: def.nome,
      texto: def.descricao ?? "",
      grupo: "altoNivel",
      sub: SUBS_ALTO_NIVEL[0],
      tags: m.vezes > 1 ? [{ label: `${m.vezes}×`, tipo: "vezes" }] : [],
      opcoes: opcoesEscolhidas(def, mapaAlto),
    }));
  }
  const inacessiveisLen = new Set(derived?.altoNivel?.lendarias?.inacessiveis ?? []);
  for (const id of derived?.altoNivel?.lendarias?.escolhidas ?? []) {
    const def = getHabilidadeLendaria(id);
    if (!def) continue;
    itens.push(item({
      id,
      chave: `altoNivel:len:${id}`,
      nome: def.nome,
      texto: def.descricao ?? "",
      grupo: "altoNivel",
      sub: SUBS_ALTO_NIVEL[1],
      tags: [],
      opcoes: opcoesEscolhidas(def, mapaAlto),
      aviso: inacessiveisLen.has(id) ? "Pré-requisito não atendido" : null,
    }));
  }
  const apice = getHabilidadeApice(derived?.altoNivel?.apiceId);
  if (apice) {
    itens.push(item({
      id: apice.id,
      chave: `altoNivel:api:${apice.id}`,
      nome: apice.nome,
      texto: apice.descricao ?? "",
      grupo: "altoNivel",
      sub: SUBS_ALTO_NIVEL[2],
      tags: [],
    }));
  }

  return itens;
}

/**
 * O INVENTÁRIO, no mesmo formato dos outros itens.
 *
 * ⚠ Ele mora numa lista SEPARADA do `conteudoDaFicha`, e não junto, porque o
 * critério é outro: aquela lista é "o que a criatura ESCOLHEU e sabe fazer", e
 * esta é "o que ela está CARREGANDO". Misturar as duas faria a aba Habilidades
 * mostrar espada no meio de Habilidade, e o contador de "193 itens" contaria
 * bandagem.
 *
 * O formato, porém, é o mesmo de propósito: assim o inventário ganha de graça o
 * texto verbatim, o Rápido, o destaque da busca e o filtro.
 *
 * ⚠ NADA aqui é editável. Comprar, equipar e encantar são escolhas de ficha, e
 * escolha mora no criador. A Ficha carrega e consulta.
 */
export function equipamentosDaFicha(derived) {
  const entradas = derived?.equip?.entradas ?? [];
  return entradas.map((e, i) => {
    const def = e.def ?? {};
    const tipo = e.tipo ?? "item";
    const tags = [];
    // ⚠ "Equipado" só aparece no que PODE ser equipado. Num talismã, a ausência
    // da marca seria lida como "não está usando", e talismã não se equipa.
    if (e.equipado) tags.push("Equipado");
    if (e.qtd > 1) tags.push({ label: `${e.qtd}×`, tipo: "vezes" });
    if (e.fa?.grauLabel) tags.push(e.fa.grauLabel);
    if (e.espacos) tags.push({ label: `${e.espacos} Esp.`, tipo: "espacos" });
    return item({
      id: e.uid ?? `${tipo}:${e.refId}:${i}`,
      // O `uid` é único por entrada, e é ele que separa duas Katanas iguais com
      // encantamentos diferentes.
      chave: `equipamento:${e.uid ?? `${tipo}-${e.refId}-${i}`}`,
      nome: def.nome ?? e.refId ?? "Item",
      texto: def.descricao ?? "",
      grupo: "equipamento",
      sub: { id: tipo, label: ROTULO_EQUIPAMENTO[tipo] ?? "Outros" },
      tags,
      // Os encantamentos da Ferramenta Amaldiçoada aparecem como as opções
      // aninhadas de uma Habilidade: é a mesma coisa, uma escolha dentro do item.
      opcoes: (e.fa?.encantamentos ?? [])
        .map((x) => ({
          id: x.id,
          nome: x.enc?.nome ?? x.id,
          descricao: x.enc?.descricao ?? null,
        })),
    });
  });
}

/**
 * Filtra por texto. Termos separados por espaço, e TODOS precisam bater (é o
 * que deixa "postura sol" achar a Postura do Sol sem trazer as outras sete).
 */
export function filtraConteudo(itens, termo) {
  const partes = semAcento(termo).split(/\s+/).filter(Boolean);
  if (!partes.length) return itens;
  return itens.filter((i) => partes.every((p) => i.busca.includes(p)));
}

/**
 * O que a busca global varre além do conteúdo: os números que já estão
 * resolvidos em outras abas. Devolvidos no mesmo formato, com `aba` dizendo
 * para onde ir.
 */
export function alvosDeBusca(derived) {
  const fora = [];
  const add = (aba, grupo, id, nome, detalhe) => fora.push({
    chave: `${grupo}:${id}`, id, nome, aba, grupo,
    detalhe: detalhe ?? null,
    busca: semAcento(`${nome} ${detalhe ?? ""}`),
  });

  for (const e of derived?.dano?.entradas ?? []) add("acoes", "dano", e.id, e.nome, e.texto);
  for (const l of derived?.cura?.linhas ?? []) add("acoes", "cura", l.id, l.nome, l.texto);
  for (const f of derived?.feiticos?.lista ?? []) {
    if (f.tipo !== "passivo") add("acoes", "feitico", f.id, f.nome || "Feitiço Sem Nome", f.nivelLabel);
  }
  for (const m of derived?.testes?.manobras ?? []) add("acoes", "manobra", m.id, m.nome, m.periciaUsada);
  for (const a of derived?.testes?.ataques ?? []) add("pericias", "ataque", a.id, a.nome, null);
  for (const r of derived?.testes?.resistencias ?? []) add("pericias", "tr", r.value, r.label, null);
  for (const p of derived?.testes?.pericias ?? []) add("pericias", "pericia", p.id, p.nome, null);
  return fora;
}

/** Rótulo do grupo, para a busca mostrar de onde o resultado veio. */
export const ROTULO_GRUPO = {
  ...Object.fromEntries(GRUPOS.map((g) => [g.id, g.label])),
  equipamento: "Equipamentos",
  dano: "Dano",
  cura: "Cura",
  feitico: "Feitiços",
  manobra: "Manobras",
  ataque: "Jogadas de Ataque",
  tr: "Testes de Resistência",
  pericia: "Perícias",
};
