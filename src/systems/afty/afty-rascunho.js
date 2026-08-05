/**
 * ============================================================
 * RASCUNHO AUTOMÁTICO — Grimório Afty
 * ============================================================
 *
 * O criador de fichas do Afty não guardava NADA até o botão Salvar: recarregar
 * a página, fechar a aba ou um remount do Vite em desenvolvimento levavam a
 * ficha inteira junto (autor, 2026-08-03: "a ficha fica resetando o tempo
 * inteiro"). Este módulo é o autosave que faltava.
 *
 * ⚠ É uma REESCRITA do desenho da 2.5.2 (`CreatureBuilder.jsx`, o bloco
 * "Autosave do rascunho"), e não uma cópia: a 2.5.2 é somente-leitura e o
 * comportamento dela foi mudado de propósito em dois pontos, a pedido do autor
 * ("podemos refazer de maneira melhorada").
 *
 * | | 2.5.2 | Afty |
 * |---|---|---|
 * | Ao voltar | banner "Rascunho encontrado" + botão **Restaurar** | **restaura sozinho** |
 * | Ao recarregar | `beforeunload` pergunta se quer mesmo sair | não pergunta |
 *
 * **Por que restaurar sozinho.** O banner transforma "não perder a ficha" numa
 * ação que o usuário precisa lembrar de fazer, e quem recarrega a página no meio
 * de uma edição não está pedindo uma ficha em branco. O preço do automático é a
 * surpresa, e ela é paga pelo `descartar`: a restauração é desfazível, então o
 * caminho errado sempre tem volta. O banner faz o oposto, e cobra um clique do
 * caso comum para proteger o caso raro.
 *
 * **Por que NÃO avisar ao sair.** O aviso do navegador existe para o dado que
 * morre ao fechar a aba, e aqui ele não morre mais: o rascunho está no
 * localStorage e volta na próxima abertura. Com o autosave funcionando, o
 * `beforeunload` vira atrito puro em cima de quem recarrega para testar, que é
 * exatamente o fluxo do autor.
 *
 * ⚠ O rascunho NÃO é a ficha. Ele é trabalho em curso e vive numa chave
 * separada: quem entra no compêndio é só o que passou pelo botão Salvar, e é o
 * Salvar que apaga o rascunho. Um rascunho sobrando depois do Salvar faria a
 * próxima abertura restaurar por cima de uma ficha já gravada.
 */

import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Uma chave por ALVO: a ficha nova e cada ficha existente têm rascunho próprio,
 * senão editar uma criatura sobrescreveria o rascunho da outra.
 *
 * Sufixo `_afty_` pela convenção de isolamento do sistema (a mesma de
 * `fm_creatures_afty_v1`, em components/useCreatureStorage.js): as duas
 * versões de regra dividem o mesmo localStorage e não podem se ver.
 */
const CHAVE_PREFIXO = "fm_builder_draft_afty_v1:";
export const chaveDoRascunho = (id) => CHAVE_PREFIXO + (id ?? "new");

/** Intervalo de silêncio antes de gravar. Digitar não deve escrever por tecla. */
const DEBOUNCE_MS = 600;

/**
 * Lê o rascunho daquele alvo. Devolve `{ salvoEm, draft }` ou null.
 *
 * Nunca lança: localStorage não existe em modo privado de alguns navegadores,
 * e um JSON corrompido não pode derrubar o criador de fichas inteiro. Rascunho
 * ilegível é tratado como rascunho ausente.
 */
export function lerRascunho(id) {
  try {
    const raw = localStorage.getItem(chaveDoRascunho(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.draft !== "object" || parsed.draft === null) return null;
    return { salvoEm: Number(parsed.salvoEm) || null, draft: parsed.draft };
  } catch {
    return null;
  }
}

/** Grava o rascunho. Falha em silêncio (cota estourada, modo privado). */
export function gravarRascunho(id, draft) {
  try {
    localStorage.setItem(
      chaveDoRascunho(id),
      JSON.stringify({ salvoEm: Date.now(), draft }),
    );
    return true;
  } catch {
    return false;
  }
}

/** Apaga o rascunho daquele alvo. Chamado pelo Salvar e pelo Descartar. */
export function limparRascunho(id) {
  try {
    localStorage.removeItem(chaveDoRascunho(id));
  } catch { /* localStorage indisponível */ }
}

/** "14:03" hoje, "02/08 14:03" em outro dia. Só hora quando é hoje: a data */
/*  repetida em cada gravação vira ruído no cabeçalho. */
export function formatarSalvoEm(ts) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    const hoje = new Date();
    const mesmoDia = d.toDateString() === hoje.toDateString();
    return d.toLocaleString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      ...(mesmoDia ? {} : { day: "2-digit", month: "2-digit" }),
    });
  } catch {
    return "";
  }
}

/**
 * O estado inicial do criador, já com o rascunho aplicado quando existe.
 *
 * Roda UMA vez, no inicializador preguiçoso do `useState` do builder, e por
 * isso é função pura e separada do hook: o hook precisa saber se houve
 * restauração, e descobrir isso depois de montar chegaria tarde demais.
 *
 * ⚠ O rascunho só vence se for DIFERENTE do estado base. Um rascunho idêntico
 * à ficha gravada não é trabalho perdido, é lixo de uma sessão que terminou
 * limpa, e restaurá-lo acenderia o indicador de rascunho sem motivo.
 */
export function estadoInicialComRascunho(id, base) {
  const rascunho = lerRascunho(id);
  if (!rascunho) return { draft: base, restaurado: null };
  if (JSON.stringify(rascunho.draft) === JSON.stringify(base)) {
    limparRascunho(id);
    return { draft: base, restaurado: null };
  }
  return { draft: rascunho.draft, restaurado: rascunho.salvoEm };
}

/**
 * Liga o autosave a um draft já montado.
 *
 * - `id` é o alvo (id da criatura ou null para ficha nova).
 * - `draft` é o estado corrente do criador.
 * - `base` é a ficha COMO ELA ESTÁ GRAVADA (o `existingCreature` já mesclado,
 *   ou a ficha em branco). É a régua do "tem alteração pendente" e o destino do
 *   `descartar`.
 * - `restauradoEm` é o timestamp devolvido por `estadoInicialComRascunho`.
 *
 * Devolve `{ pendente, salvoEm, restaurado, descartar, aoSalvar }`.
 */
export function useRascunhoAfty({ id, draft, base, restauradoEm, onDescartar }) {
  // A régua é o JSON da ficha gravada. Fica num estado (e não num `useMemo`)
  // porque o Salvar a MOVE: depois de gravar, o que está na tela passa a ser o
  // novo "sem alterações", e um memo derivado de `base` continuaria apontando
  // para a versão antiga até o componente remontar.
  const [baseJson, setBaseJson] = useState(() => JSON.stringify(base));
  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);
  const pendente = draftJson !== baseJson;

  const [salvoEm, setSalvoEm] = useState(restauradoEm ?? null);
  // A marca de "veio de um rascunho" some assim que o usuário edita: a partir
  // daí o que está na tela é dele, e oferecer "descartar a restauração" seria
  // oferecer jogar fora o trabalho que ele acabou de fazer.
  const [restaurado, setRestaurado] = useState(!!restauradoEm);

  // ⚠ `id` entra nas dependências como qualquer outro valor, sem ref: ele não
  // muda enquanto o criador está aberto (trocar de ficha passa pelo Dashboard,
  // que desmonta este componente), então a lista nunca reexecuta por causa dele.
  // Um ref aqui só serviria para escondê-lo do lint, e escondê-lo é mentira.
  useEffect(() => {
    if (!pendente) return;
    const t = setTimeout(() => {
      if (gravarRascunho(id, draft)) setSalvoEm(Date.now());
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draftJson, pendente, draft, id]);

  /** Volta para a ficha gravada e apaga o rascunho. Desfaz a restauração. */
  const descartar = useCallback(() => {
    limparRascunho(id);
    setSalvoEm(null);
    setRestaurado(false);
    onDescartar?.();
  }, [id, onDescartar]);

  /**
   * Chamado DEPOIS do Salvar. Apaga o rascunho e move a régua para a ficha
   * recém-gravada, senão o indicador continuaria dizendo que há alteração
   * pendente sobre uma ficha que acabou de entrar no compêndio.
   */
  const aoSalvar = useCallback((salva) => {
    limparRascunho(id);
    setBaseJson(JSON.stringify(salva));
    setSalvoEm(null);
    setRestaurado(false);
  }, [id]);

  // Editar tira a marca de restaurado. Fica no corpo do hook, e não num efeito,
  // porque é derivação de estado durante a renderização: um `useEffect` daria
  // um render a mais com a marca já mentindo.
  const [jsonNaRestauracao] = useState(draftJson);
  const restauradoVisivel = restaurado && draftJson === jsonNaRestauracao;

  return { pendente, salvoEm, restaurado: restauradoVisivel, descartar, aoSalvar };
}
