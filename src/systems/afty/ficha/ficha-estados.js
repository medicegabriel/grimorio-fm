import { getEspecializacao } from "../afty-especializacoes";
import { AFTY_HABILIDADES } from "../afty-habilidades";
import { semAcento } from "./ficha-conteudo";

/**
 * ============================================================
 * ORGANIZAÇÃO DOS ESTADOS DE COMBATE — o dono, a família, a busca
 * ============================================================
 * A aba Buffs desenhava os estados numa lista só, na ordem do catálogo. Numa
 * criatura de ND 40 isso são 46 linhas e 40 caixas de primeiro nível, todas do
 * mesmo peso, com as três ou quatro LIGADAS espalhadas no meio das apagadas.
 *
 * Este módulo é a resposta, e ele não inventa nada: as duas dimensões que
 * organizam a aba já estavam escritas nos dados e eram jogadas fora na hora de
 * desenhar.
 *
 *   O DONO      sai do mesmo `requer*` que a aba já usa para decidir se a linha
 *               aparece. Quem sabe que a criatura pode ligar a Brutalidade sabe,
 *               pelo mesmo campo, que ela é do Lutador.
 *
 *   A FAMÍLIA   sai do RÓTULO. 33 dos 54 estados se chamam `Família · Parte`,
 *               que é a mesma convenção dos canais de rolagem (ver
 *               `afty-cura.js`). "Manobra · Ajuste" embaixo de um cabeçalho
 *               "Manobra" volta a ser "Ajuste", que é como se chama na mesa.
 *
 * ⚠ NADA AQUI É LIDO NO CARREGAMENTO DO MÓDULO. Os dois catálogos que este
 * arquivo consulta são remendáveis por Addon, e um mapa montado no topo
 * congelaria o estado ANTERIOR à instalação. Toda leitura acontece dentro de
 * função, na hora da chamada. Ver docs/afty-addons.md.
 *
 * ⚠ Este módulo é PURO e não sabe o que é React, de propósito: é ele que os
 * asserts testam, e não a aba.
 * ============================================================
 */

/** O separador que o catálogo usa entre a família e a parte. */
const SEP = " · ";

/** O balde de quem não tem dono achável. Mesmo nome do que a aba Habilidades
    já usa para uma habilidade sem `especializacaoId`. */
const OUTRAS = { id: "outras", label: "Outras" };

/**
 * Quebra `Família · Parte`. Rótulo sem separador não tem família, e a parte
 * dele é o rótulo inteiro.
 */
export function familiaEParte(label) {
  const texto = String(label ?? "");
  const i = texto.indexOf(SEP);
  if (i < 0) return { familia: null, parte: texto };
  return { familia: texto.slice(0, i), parte: texto.slice(i + SEP.length) };
}

/** A Especialização como sub-aba, ou nada se o id não resolver. */
const subDaEspecializacao = (id) => {
  if (!id) return null;
  const espec = getEspecializacao(id);
  return espec ? { id, label: espec.nome } : null;
};

/** Quem é o dono de uma OPÇÃO aninhada (uma Manobra, uma Postura): a
    Especialização da habilidade que oferece aquela escolha. */
const donoDaEscolha = (opcaoId) => {
  const dona = AFTY_HABILIDADES.find(
    (h) => (h.escolha?.opcoes ?? []).some((o) => o.id === opcaoId),
  );
  return subDaEspecializacao(dona?.especializacaoId);
};

/**
 * A sub-aba de um estado.
 *
 * ⚠ A ORDEM DOS TESTES É A MESMA DA ABA, e tem de continuar sendo: quem decide
 * se a linha aparece e quem decide onde ela mora precisam ler o mesmo campo, ou
 * um estado apareceria numa divisão que não é a dele.
 *
 * Um estado pode declarar `dono` e passar por cima de tudo. É a porta dos
 * `estadosExtras`, que nascem no derive e não têm `requer*` nenhum.
 */
export function donoDoEstado(estado) {
  if (estado?.dono?.id) return estado.dono;
  if (estado?.requerEscolha) return donoDaEscolha(estado.requerEscolha) ?? OUTRAS;
  if (estado?.requerTalento) return { id: "talento", label: "Talentos" };
  if (estado?.requerAptidao) return { id: "aptidao", label: "Aptidões" };
  for (const id of [].concat(estado?.requerHabilidade ?? [])) {
    const hab = AFTY_HABILIDADES.find((h) => h.id === id);
    const sub = subDaEspecializacao(hab?.especializacaoId);
    if (sub) return sub;
  }
  return OUTRAS;
}

/**
 * O rótulo de um FILHO dentro da caixa do pai.
 *
 * O pai já é o cabeçalho dos filhos dele, então repetir o nome dele em cada um
 * é a mesma redundância que o cabeçalho de família resolve na lista de fora:
 * dentro da caixa "Brutalidade", "Brutalidade · Pilhas" é só "Pilhas".
 *
 * ⚠ SÓ ENCURTA COM IGUALDADE EXATA. "Surto de Adrenalina" tem filhos chamados
 * "Surto · Absoluto", e cortar por prefixo parecido acabaria escondendo que são
 * duas palavras diferentes. Na dúvida, a linha fica inteira.
 */
function rotuloDoFilho(filho, pai) {
  const { familia, parte } = familiaEParte(filho.label);
  return familia === pai.label ? parte : filho.label;
}

/**
 * O filtro local, por rótulo.
 *
 * ⚠ CASA CONTRA O RÓTULO INTEIRO, com a família na frente, e não contra a parte
 * que vai aparecer na tela: procurar "manobra" tem de achar as quatro Manobras
 * mesmo depois que o cabeçalho tirou a palavra "Manobra" das linhas delas.
 */
const casaComTermo = (estado, partes) => {
  if (!partes.length) return true;
  const alvo = semAcento(estado.label);
  return partes.every((p) => alvo.includes(p));
};

/**
 * Monta a árvore inteira que a aba desenha: sub-abas, blocos de família dentro
 * de cada uma, e o par pai/filho preservado dentro dos blocos.
 *
 * @param linhas os estados que a criatura alcança, já com `opcoesVisiveis`
 * @param termo  o filtro local, cru
 * @returns `{ subs, blocosDaSub }`, com `blocosDaSub` chaveado por id de sub-aba
 */
export function organizaEstados(linhas, termo = "") {
  const partes = semAcento(termo).split(/\s+/).filter(Boolean);

  /* O filtro roda ANTES do parentesco, e depois o parentesco é remendado: um
     filho que casa sozinho ("pilhas") precisa do pai na tela, senão ele
     apareceria solto e sem a caixa que diz de quem ele é. E um pai que casa
     leva os filhos junto, porque escondê-los mudaria o que a linha faz. */
  const diretos = new Set(linhas.filter((e) => casaComTermo(e, partes)).map((e) => e.id));
  const manter = new Set(diretos);
  if (partes.length) {
    for (const e of linhas) {
      if (diretos.has(e.id) && e.requerEstado) manter.add(e.requerEstado);
    }
    /* ⚠ Os dois laços leem o `diretos`, e não o `manter`: um pai puxado para a
       tela POR UM FILHO não pode puxar os irmãos dele de volta. Procurar
       "pilhas" e receber o "PE Extra" junto é o filtro devolvendo o que não foi
       pedido. */
    for (const e of linhas) {
      if (e.requerEstado && diretos.has(e.requerEstado)) manter.add(e.id);
    }
  }
  const filtradas = linhas.filter((e) => manter.has(e.id));

  // Pai e filho, exatamente como a aba já fazia: `requerEstado` apontando para
  // alguém desta mesma lista é filho, e o resto é raiz.
  const existe = new Set(filtradas.map((e) => e.id));
  const filhosDe = new Map();
  const raizes = [];
  for (const e of filtradas) {
    if (e.requerEstado && existe.has(e.requerEstado)) {
      filhosDe.set(e.requerEstado, [...(filhosDe.get(e.requerEstado) ?? []), e]);
    } else {
      raizes.push(e);
    }
  }

  // As sub-abas, na ordem em que aparecem no catálogo.
  const subs = [];
  const vistas = new Map();
  const donoDe = new Map();
  for (const e of raizes) {
    const dono = donoDoEstado(e);
    donoDe.set(e.id, dono.id);
    if (!vistas.has(dono.id)) {
      vistas.set(dono.id, { ...dono, quantos: 0 });
      subs.push(vistas.get(dono.id));
    }
    vistas.get(dono.id).quantos += 1;
  }

  /* Uma família só vira cabeçalho com DOIS ou mais na mesma sub-aba. Com um
     só, o cabeçalho não agruparia nada e ainda roubaria a palavra do rótulo:
     "Duelando" em cima de "Uma Arma, Mão Livre" é pior que a linha inteira. */
  const quantosNaFamilia = new Map();
  for (const e of raizes) {
    const { familia } = familiaEParte(e.label);
    if (!familia) continue;
    const chave = `${donoDe.get(e.id)}|${familia}`;
    quantosNaFamilia.set(chave, (quantosNaFamilia.get(chave) ?? 0) + 1);
  }

  /* Os blocos, em corrida: raízes seguidas da mesma família entram no mesmo
     bloco, e as sem família entram todas no bloco sem cabeçalho ao lado delas.
     A ordem do catálogo é preservada inteira, que é o que deixa a tela parecer
     a mesma de antes com um cabeçalho a mais. */
  const blocosDaSub = {};
  for (const e of raizes) {
    const subId = donoDe.get(e.id);
    const { familia, parte } = familiaEParte(e.label);
    const agrupa = familia && quantosNaFamilia.get(`${subId}|${familia}`) > 1;
    const lista = (blocosDaSub[subId] ??= []);
    const ultimo = lista[lista.length - 1];
    if (!ultimo || ultimo.familia !== (agrupa ? familia : null)) {
      lista.push({ familia: agrupa ? familia : null, grupos: [] });
    }
    lista[lista.length - 1].grupos.push({
      // `rotulo` é o que a linha mostra, e `label` continua sendo o do catálogo:
      // o `title` da linha usa o inteiro, e a busca também.
      pai: { ...e, rotulo: agrupa ? parte : e.label },
      filhos: (filhosDe.get(e.id) ?? []).map((f) => ({ ...f, rotulo: rotuloDoFilho(f, e) })),
    });
  }

  return { subs, blocosDaSub };
}
