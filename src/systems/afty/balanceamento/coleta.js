export const coletaLigada = import.meta.env?.VITE_BALANCEAMENTO_ATIVO === "1";
export const CHAVE_PREFERENCIA = "balanceamento_preferencia_aparelho_v1";
const EVENTO_PREFERENCIA = "balanceamento-preferencia";
const chaveDaFicha = (id) => `balanceamento_ficha_${id}_aparelho_v1`;

export function lerPreferencia(armazenamento) {
  try {
    return (armazenamento ?? localStorage).getItem(CHAVE_PREFERENCIA);
  } catch {
    return null;
  }
}

export function definirPreferencia(valor) {
  try {
    localStorage.setItem(CHAVE_PREFERENCIA, valor);
    window.dispatchEvent(new Event(EVENTO_PREFERENCIA));
  } catch { /* Sem uma preferência persistente, a coleta não ocorre. */ }
}

export function ouvirPreferencia(fn) {
  const aoArmazenar = (event) => {
    if (event.key === CHAVE_PREFERENCIA || event.key === null) fn();
  };
  window.addEventListener("storage", aoArmazenar);
  window.addEventListener(EVENTO_PREFERENCIA, fn);
  return () => {
    window.removeEventListener("storage", aoArmazenar);
    window.removeEventListener(EVENTO_PREFERENCIA, fn);
  };
}

function identificarFicha(armazenamento, local, resumo, gerarChave) {
  if (lerPreferencia(armazenamento) !== "ativa") return null;
  const existente = armazenamento.getItem(local);
  if (existente || !resumo) return existente;
  const nova = gerarChave();
  armazenamento.setItem(local, nova);
  return nova;
}

export async function enviarResumoDaFicha(ficha, salvoEm, {
  ativo = coletaLigada,
  obterArmazenamento = () => localStorage,
  enviar = fetch,
  gerarChave = () => crypto.randomUUID(),
} = {}) {
  if (!ativo || !ficha?.id || ficha.rulesVersion !== "player") return;
  try {
    const armazenamento = obterArmazenamento();
    if (lerPreferencia(armazenamento) !== "ativa") return;
    const { resumirFicha, ehJogadorDoBalanceamento, VERSAO_RESUMO } = await import("./resumo.js");
    if (!ehJogadorDoBalanceamento(ficha) || lerPreferencia(armazenamento) !== "ativa") return;
    const resumo = resumirFicha(ficha);
    const local = chaveDaFicha(ficha.id);
    const identificar = () => identificarFicha(armazenamento, local, resumo, gerarChave);
    const locks = globalThis.navigator?.locks;
    const chave = locks ? await locks.request(local, identificar) : identificar();
    if (!chave || lerPreferencia(armazenamento) !== "ativa") return;
    await enviar("/api/balanceamento/contribuicao", {
      method: "POST", credentials: "omit", keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versao: VERSAO_RESUMO, chave, salvoEm, resumo }),
    });
  } catch { /* O navegador continua sendo a cópia de trabalho, inclusive offline. */ }
}
