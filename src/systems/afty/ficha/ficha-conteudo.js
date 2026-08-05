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

/** Os grupos, na ordem em que aparecem na aba. */
export const GRUPOS = [
  { id: "origem", label: "Origem" },
  { id: "especializacao", label: "Habilidades de Especialização" },
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

const item = ({ id, chave, nome, texto, grupo, tags = [], opcoes = [], aviso = null }) => ({
  // `chave` é única na Ficha inteira. O `id` sozinho não serve: uma Melhoria
  // repetível aparece mais de uma vez, e duas listas diferentes podem trazer o
  // mesmo id (o Ataque Inconsequente existe no Lutador e no Restringido).
  chave: chave ?? `${grupo}:${id}`,
  id, nome, texto, grupo, tags, opcoes, aviso,
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
      tags: [espec?.nome, h.nivel ? `Nível ${h.nivel}` : null].filter(Boolean),
      opcoes: opcoesEscolhidas(h, mapaHab),
      aviso: inacessiveisHab.has(id) ? "Pré-requisito não atendido" : null,
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
      tags: t.nivel ? [`Nível ${t.nivel}`] : [],
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
      tags: vezes > 1 ? [`${vezes}×`] : [],
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
      tags: ["Melhoria Superior", ...(m.vezes > 1 ? [`${m.vezes}×`] : [])],
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
      tags: ["Habilidade Lendária"],
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
      tags: ["Habilidade Ápice"],
    }));
  }

  return itens;
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
  for (const f of derived?.feiticos?.lista ?? []) add("acoes", "feitico", f.id, f.nome || "Feitiço Sem Nome", f.nivelLabel);
  for (const m of derived?.testes?.manobras ?? []) add("acoes", "manobra", m.id, m.nome, m.periciaUsada);
  for (const a of derived?.testes?.ataques ?? []) add("pericias", "ataque", a.id, a.nome, null);
  for (const r of derived?.testes?.resistencias ?? []) add("pericias", "tr", r.value, r.label, null);
  for (const p of derived?.testes?.pericias ?? []) add("pericias", "pericia", p.id, p.nome, null);
  return fora;
}

/** Rótulo do grupo, para a busca mostrar de onde o resultado veio. */
export const ROTULO_GRUPO = {
  ...Object.fromEntries(GRUPOS.map((g) => [g.id, g.label])),
  dano: "Dano",
  cura: "Cura",
  feitico: "Feitiços",
  manobra: "Manobras",
  ataque: "Jogadas de Ataque",
  tr: "Testes de Resistência",
  pericia: "Perícias",
};
