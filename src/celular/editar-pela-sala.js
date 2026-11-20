/* ============================================================
   EDITAR A FICHA PELA SALA, NO MESMO APP (etapa E7, 2026-11-20)
   ============================================================
   Na Sala, o Editar da Ficha abria a rota do grupo numa JANELA NOVA. No computador é o certo (a Sala segue aberta ao lado), mas
   no celular, e sobretudo no app instalado, uma janela nova é outro navegador, sem a ficha e sem o Voltar. Lá o Editar troca de
   página: grava um pedido na `sessionStorage` (da aba, nunca na nuvem), vai para a rota do grupo, e o App abre o criador daquela
   ficha. Salvar e Cancelar voltam para a Sala.

   Puro e sem import, para o assert carregar. O pedido vale dois minutos e só aceita voltar para um endereço de Sala deste site:
   um pedido velho ou adulterado não abre criador nenhum nem manda a pessoa para fora.
   ============================================================ */

export const CHAVE_EDITAR = "fm_editar_ao_abrir";
export const VALIDADE_MS = 2 * 60 * 1000;
const VOLTA_DE_SALA = /^\/Sala\/[A-Za-z0-9]{4,12}\/?$/i;

const sessao = () => (typeof sessionStorage !== "undefined" ? sessionStorage : null);

/** Grava o pedido de abrir o criador de `id` e voltar para `volta` (o caminho da Sala). `true` se gravou. */
export function pedirEdicao({ id, volta }, armazem = sessao(), agora = Date.now()) {
  if (!armazem || id == null || !VOLTA_DE_SALA.test(String(volta ?? ""))) return false;
  try {
    armazem.setItem(CHAVE_EDITAR, JSON.stringify({ id: String(id), volta: String(volta), em: agora }));
    return true;
  } catch {
    return false;
  }
}

/** Lê e APAGA o pedido (vale uma vez). Devolve `{ id, volta }` ou `null` se não há, se venceu ou se a volta não é de Sala. */
export function lerPedidoDeEdicao(armazem = sessao(), agora = Date.now()) {
  if (!armazem) return null;
  let cru = null;
  try {
    cru = armazem.getItem(CHAVE_EDITAR);
    armazem.removeItem(CHAVE_EDITAR);
  } catch {
    return null;
  }
  if (!cru) return null;
  try {
    const p = JSON.parse(cru);
    if (!p || typeof p.id !== "string" || !p.id || !VOLTA_DE_SALA.test(String(p.volta ?? ""))) return null;
    if (!Number.isFinite(p.em) || agora - p.em > VALIDADE_MS || p.em > agora + 5000) return null;
    return { id: p.id, volta: p.volta };
  } catch {
    return null;
  }
}
