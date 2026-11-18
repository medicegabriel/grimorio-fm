/* O QUE O BANCO NÃO ESCONDE DENTRO DA SESSÃO (Encontro Unificado, etapa 7b, 2026-11-18).
   FOLHA, zero imports.

   A sessão de um personagem é JSON opaco para o banco, e o dono a lê inteira. Quando o Mestre grava nela o que uma
   criatura OCULTA fez (um Efeito com `aplicadorId`, a entrada do histórico com o `autor.combatente`), o id da criatura
   iria para a rede do jogador. Decisão do autor (2026-11-18, "Apelido Opaco"): na sessão que sobe, o id de toda criatura
   Oculta vira um APELIDO sem significado, igual para a mesma criatura, e o aparelho do Mestre traduz de volta na leitura.
   A duração continua descendo no fim do turno dela (etapa 5), porque o Mestre lê o id de verdade.

   O apelido é um hash do id com o SEGREDO da Sala, que só o aparelho do Mestre que a criou conhece (`encontro.sala.segredo`).
   Sem o segredo, o apelido não diz qual criatura é, nem que ela existe fora daquela sessão.

   Também mora aqui o id do personagem na Sala (`pj:<id da ficha>`): ele carrega o id da ficha do jogador para o
   ausente no fechamento achar a ficha dele sem a linha da ficha, que o banco apaga ao fechar. */

export const PREFIXO_APELIDO = "oculto:";
export const PREFIXO_PERSONAGEM = "pj:";

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/* FNV-1a de 32 bits com semente. Dois deles dão 64 bits, o bastante para dois ids não colidirem numa Sala. */
function fnv(texto, semente) {
  let h = semente >>> 0;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** O apelido de um combatente nesta Sala. */
export function apelidoDe(segredo, id) {
  const t = `${segredo ?? ""}|${id ?? ""}`;
  return `${PREFIXO_APELIDO}${fnv(t, 0x811c9dc5).toString(36)}${fnv(t, 0x01234567).toString(36)}`;
}

export const ehApelido = (v) => typeof v === "string" && v.startsWith(PREFIXO_APELIDO);

/* O id também aparece DENTRO de outro texto: o Provocar marca o uso no alvo como `"provocar:" + id de quem provocou`. Os ids
   dos combatentes são longos e aleatórios (`cmb_<hora>_<n>_<sorteio>`), então trocar o pedaço não pega texto por acaso. */
function trocarNoTexto(texto, mapa) {
  if (mapa.has(texto)) return mapa.get(texto);
  let out = texto;
  for (const [de, para] of mapa) if (de && out.includes(de)) out = out.split(de).join(para);
  return out;
}

/** Troca, em profundidade, todo id de `mapa` pelo valor, em valores e chaves, inteiro ou dentro de um texto. Devolve o
 * MESMO objeto quando nada muda. */
export function trocarIds(valor, mapa) {
  if (!mapa || !mapa.size) return valor;
  if (typeof valor === "string") return trocarNoTexto(valor, mapa);
  if (Array.isArray(valor)) {
    let mudou = false;
    const out = valor.map((x) => {
      const y = trocarIds(x, mapa);
      if (y !== x) mudou = true;
      return y;
    });
    return mudou ? out : valor;
  }
  if (ehObjeto(valor)) {
    let mudou = false;
    const out = {};
    // A chave também: há mapas por combatente (a fonte de uma casca, quem provocou).
    for (const [k, v] of Object.entries(valor)) {
      const y = trocarIds(v, mapa);
      const chave = trocarNoTexto(k, mapa);
      if (y !== v || chave !== k) mudou = true;
      out[chave] = y;
    }
    return mudou ? out : valor;
  }
  return valor;
}

/**
 * A sessão como o DONO pode ler: o id de cada Oculta vira apelido, e a entrada do histórico que uma Oculta fez perde o
 * detalhe da rolagem (o rótulo diria o nome do ataque dela). O valor rolado fica, como no Registro público.
 * `ocultos` é a lista dos ids das criaturas (e marcadores) Ocultas agora.
 */
export function sessaoParaODono(sessao, { segredo, ocultos = [] } = {}) {
  if (!ehObjeto(sessao) || !ocultos.length) return sessao;
  const mapa = new Map(ocultos.map((id) => [id, apelidoDe(segredo, id)]));
  let out = trocarIds(sessao, mapa);
  if (Array.isArray(out.historico)) {
    let mudou = false;
    const historico = out.historico.map((e) => {
      if (!ehApelido(e?.autor?.combatente) || !ehObjeto(e.entrada) || !("rolagem" in e.entrada)) return e;
      mudou = true;
      const { rolagem: _fora, ...entrada } = e.entrada;
      return { ...e, entrada };
    });
    if (mudou) out = { ...out, historico };
  }
  return out;
}

/** A sessão lida pelo aparelho do Mestre: cada apelido volta a ser o id de verdade. `ids` são todos os combatentes. */
export function sessaoDoMestre(sessao, { segredo, ids = [] } = {}) {
  if (!ehObjeto(sessao) || !ids.length) return sessao;
  return trocarIds(sessao, new Map(ids.map((id) => [apelidoDe(segredo, id), id])));
}

/* ---------- o id do personagem na Sala ---------- */

const ID_VALIDO = /^[A-Za-z0-9_:.-]{1,100}$/;

/** O id do personagem na Sala a partir do id da ficha. `sufixo` só quando o primeiro colidiu (a mesma ficha importada por dois). */
export function idDoPersonagem(fichaId, sufixo = "") {
  const base = `${PREFIXO_PERSONAGEM}${String(fichaId ?? "")}`;
  const id = sufixo ? `${base}:${sufixo}` : base;
  return ID_VALIDO.test(id) ? id : null;
}

/**
 * A ficha de um personagem da Sala entre as fichas do aparelho: `pj:<id>` ou `pj:<id>:<sufixo>`. Confere contra os ids que
 * o aparelho tem, porque o id da ficha pode ter dois-pontos.
 */
export function fichaIdDoCombatente(combatente, idsDoAparelho = []) {
  if (typeof combatente !== "string" || !combatente.startsWith(PREFIXO_PERSONAGEM)) return null;
  const resto = combatente.slice(PREFIXO_PERSONAGEM.length);
  const ids = [...idsDoAparelho].map(String).sort((a, b) => b.length - a.length);
  return ids.find((id) => resto === id || resto.startsWith(`${id}:`)) ?? null;
}
