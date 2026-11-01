/**
 * ============================================================
 * BIBLIOTECA DE ADDONS — a morada de instalação
 * ============================================================
 * O addon do Afty mora em DOIS lugares, com papéis separados (ver a seção 6 de
 * `docs/afty-addons.md`):
 *
 *   • BIBLIOTECA (este arquivo)     onde a pessoa instala, edita e atualiza.
 *   • `creature.addons`             cópia congelada no momento do uso, e é ELA
 *                                   que manda no cálculo.
 *
 * ⚠ A separação é o que faz o addon mudar SEM mexer sozinho nas fichas antigas.
 * A ficha carrega a própria cópia, a biblioteca carrega a versão nova, e a
 * ficha apenas AVISA que existe versão nova: atualizar é um botão, nunca
 * automático. É a mesma lição do rascunho automático, que restaura sozinho e
 * por isso precisou de aviso.
 *
 * ⚠ Nada aqui lança. `localStorage` não existe em modo privado de alguns
 * navegadores e a cota estoura, e biblioteca ilegível é tratada como biblioteca
 * vazia: o criador de fichas não pode morrer por causa de um addon.
 *
 * Chave `fm_addons_afty_v1`, na convenção de isolamento do sistema (a mesma de
 * `fm_creatures_afty_v1`): as duas versões de regra dividem o mesmo
 * `localStorage` e não podem se ver.
 *
 * ⚠ Um pacote COMPOSTO (com `ajustes`, `porSistema`, `absorve`...) entra por aqui
 * como qualquer JSON colado, mas NÃO fica nesta lista: a fonte vai para o
 * registro de `afty-addons-compostos.js`, que tem chave própria, porque o
 * normalizador do pacote comum apagaria os campos de composição. É o único tipo
 * de pacote que as fichas dessa máquina acompanham sozinhas.
 * ============================================================
 */

import { normalizarPacote, validarPacote, PACOTE_MAX } from "./afty-addons";
import {
  temComposicao, validarFonteComposta, compor, ehComposto, fonteComposta,
  registrarFonteComposta, removerFonteComposta,
} from "./afty-addons-compostos";

const CHAVE = "fm_addons_afty_v1";

/* ============================================================ */
/* LEITURA E ESCRITA                                             */
/* ============================================================ */

/** Todos os pacotes instalados. Lista vazia quando não há nada ou está ilegível. */
export function lerBiblioteca() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return [];
    const lista = JSON.parse(cru);
    return Array.isArray(lista) ? lista.map(normalizarPacote).filter((p) => p.id) : [];
  } catch {
    return [];
  }
}

/** Grava a lista inteira. Devolve false quando não deu (cota, modo privado). */
export function gravarBiblioteca(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(Array.isArray(lista) ? lista : []));
    return true;
  } catch {
    return false;
  }
}

/* ============================================================ */
/* INSTALAR, ATUALIZAR E REMOVER                                 */
/* ============================================================ */

/**
 * Instala um pacote novo.
 *
 * ⚠ NINGUÉM INSTALA ADDON QUEBRADO (decisão 4 do autor, 2026-08-20). Este é o
 * portão DURO. O outro portão, o da ficha já salva, é a linha morta e marcada,
 * e ele não impede nada: ficha salva sempre abre.
 *
 * Devolve `{ ok, problemas, biblioteca }`, e `composto: true` quando o pacote era
 * composto e foi para o registro de fontes em vez de para a lista.
 */
export function instalarPacote(cru, { substituir = false } = {}) {
  const atual = lerBiblioteca();
  /* ⚠ A CÓPIA QUE UMA FICHA CARREGA NÃO SE INSTALA. Ela já veio composta para o
     sistema da ficha e sem os campos que fazem o pacote ser composto: entrar na
     lista congelaria uma versão que ninguém atualiza. Quem quer o pacote precisa
     do JSON completo. */
  if (cru && typeof cru === "object" && cru.composicao) {
    return {
      ok: false,
      problemas: [`"${cru.nome || cru.id}" é a cópia que uma ficha carrega. Instale o JSON completo do pacote.`],
      biblioteca: atual,
    };
  }
  if (temComposicao(cru)) return instalarComposto(cru, atual, { substituir });
  const p = normalizarPacote(cru);
  const jaTem = atual.find((x) => x.id === p.id);

  // Só cobra unicidade quando NÃO é substituição declarada: atualizar um addon
  // é reinstalar por cima, e reclamar do próprio id seria absurdo.
  const idsEmUso = new Set(
    atual.filter((x) => !(substituir && x.id === p.id)).map((x) => x.id),
  );
  const problemas = validarPacote(p, { idsEmUso });
  if (problemas.length) return { ok: false, problemas, biblioteca: atual };

  const nova = jaTem
    ? atual.map((x) => (x.id === p.id ? p : x))
    : [...atual, p];

  if (!gravarBiblioteca(nova)) {
    return {
      ok: false,
      problemas: ["Não foi possível gravar. O armazenamento do navegador pode estar cheio."],
      biblioteca: atual,
    };
  }
  return { ok: true, problemas: [], biblioteca: nova };
}

const ROTULO_DA_VISAO = { player: "Ficha de Player", afty: "Ficha de criatura" };

/**
 * Instala um pacote composto: valida a fonte e CADA visão dela (a do Player e a da
 * criatura têm de ser pacotes válidos), guarda no registro de fontes e tira da
 * lista comum um pacote de mesmo id que estivesse lá, porque a fonte vale mais que
 * uma cópia solta. Reinstalar o mesmo id é atualizar: as fichas desta máquina que
 * já têm o pacote se refazem sozinhas na próxima leitura.
 */
function instalarComposto(cru, atual, { substituir }) {
  const falha = (problemas) => ({ ok: false, problemas, biblioteca: atual });
  const problemas = validarFonteComposta(cru);
  if (problemas.length) return falha(problemas);
  if (ehComposto(cru.id) && !substituir) return falha([`"${cru.nome || cru.id}" já está instalado.`]);
  for (const sistema of Object.keys(ROTULO_DA_VISAO)) {
    try {
      const visao = normalizarPacote(compor(cru, sistema, {}));
      for (const m of validarPacote(visao, { idsEmUso: new Set() })) problemas.push(`${ROTULO_DA_VISAO[sistema]}: ${m}`);
    } catch (e) {
      problemas.push(`${ROTULO_DA_VISAO[sistema]}: não foi possível montar o pacote (${e.message}).`);
    }
  }
  if (problemas.length) return falha(problemas);

  const anterior = fonteComposta(cru.id);
  if (!registrarFonteComposta(cru).gravou) {
    // Não deu para gravar: volta ao que havia, para a sessão não mostrar o que sumiria ao recarregar.
    if (anterior) registrarFonteComposta(anterior, { persistir: false });
    else removerFonteComposta(cru.id, { persistir: false });
    return falha(["Não foi possível gravar. O armazenamento do navegador pode estar cheio."]);
  }
  const semIgual = atual.filter((x) => x.id !== cru.id);
  if (semIgual.length !== atual.length) gravarBiblioteca(semIgual);
  return { ok: true, problemas: [], biblioteca: semIgual, composto: true };
}

/** Instala a partir do texto JSON colado. Erro de sintaxe vira problema legível. */
export function instalarDeTexto(texto, opcoes) {
  const t = String(texto ?? "").trim();
  if (!t) return { ok: false, problemas: ["Cole o JSON do addon."], biblioteca: lerBiblioteca() };
  if (t.length > PACOTE_MAX) {
    return {
      ok: false,
      problemas: [`O texto tem ${Math.round(t.length / 1024)}KB, acima do teto de ${PACOTE_MAX / 1024}KB.`],
      biblioteca: lerBiblioteca(),
    };
  }
  let cru;
  try {
    cru = JSON.parse(t);
  } catch (e) {
    return { ok: false, problemas: [`JSON inválido: ${e.message}`], biblioteca: lerBiblioteca() };
  }
  return instalarPacote(cru, opcoes);
}

/**
 * Remove pela id, da lista e do registro de fontes compostas. As fichas que já
 * carregam a cópia ficam com ela, mas deixam de se atualizar nesta máquina.
 * Devolve a biblioteca resultante.
 */
export function removerPacote(id) {
  removerFonteComposta(id);
  const nova = lerBiblioteca().filter((p) => p.id !== id);
  gravarBiblioteca(nova);
  return nova;
}

/* ============================================================ */
/* A CÓPIA DA FICHA CONTRA A DA BIBLIOTECA                       */
/* ============================================================ */

/**
 * Compara o que a criatura carrega com o que a biblioteca tem hoje.
 *
 * É o que alimenta o aviso "existe versão nova deste addon". Devolve uma linha
 * por pacote da criatura, e nunca decide nada sozinha: quem atualiza é a pessoa,
 * porque atualizar muda NÚMERO numa ficha que já foi jogada.
 *
 *   • `estado: "igual"`        mesma versão dos dois lados.
 *   • `estado: "desatualizado"` a biblioteca tem outra versão.
 *   • `estado: "só na ficha"`  a pessoa não tem esse addon instalado. Não é
 *                              erro: a ficha veio de fora e traz as regras dela,
 *                              que é justamente o desenho.
 */
export function compararComBiblioteca(addonsDaFicha = [], biblioteca = lerBiblioteca()) {
  const porId = new Map(biblioteca.map((p) => [p.id, p]));
  return addonsDaFicha.map((p) => {
    const dela = porId.get(p.id);
    if (!dela) return { id: p.id, nome: p.nome, versao: p.versao, estado: "só na ficha" };
    return {
      id: p.id,
      nome: p.nome,
      versao: p.versao,
      versaoBiblioteca: dela.versao,
      estado: dela.versao === p.versao ? "igual" : "desatualizado",
    };
  });
}
