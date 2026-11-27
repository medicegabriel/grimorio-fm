export const coletaLigada = import.meta.env?.VITE_BALANCEAMENTO_ATIVO === "1";
export const CHAVE_PREFERENCIA = "balanceamento_preferencia_aparelho_v1";
export const ID_PREFERENCIAS_BALANCEAMENTO = "preferencias-de-privacidade";
export const LINK_PREFERENCIAS_BALANCEAMENTO = `/Jogador#${ID_PREFERENCIAS_BALANCEAMENTO}`;
const EVENTO_PREFERENCIA = "balanceamento-preferencia";
const chaveDaFicha = (id) => `balanceamento_ficha_${id}_aparelho_v1`;
const chaveDeInclusao = (id) => `balanceamento_inclusao_${id}_aparelho_v1`;

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

export function fichasParaIncluir(fichas, armazenamento) {
  try {
    const local = armazenamento ?? localStorage;
    return fichas.filter((ficha) => ficha?.id && ficha.rulesVersion === "player"
      && ficha.edicaoDeRegras == null && ficha.mesa == null && !ficha.isBuiltIn
      && Array.isArray(ficha.especializacoes) && ficha.especializacoes.length > 0
      && !local.getItem(chaveDeInclusao(ficha.id)));
  } catch {
    return [];
  }
}

function identificarFicha(armazenamento, local, resumo, gerarChave) {
  const existente = armazenamento.getItem(local);
  if (existente || !resumo) return existente;
  const nova = gerarChave();
  armazenamento.setItem(local, nova);
  return nova;
}

async function enviarProjecao(ficha, salvoEm, {
  armazenamento, permitido, enviar, gerarChave, signal, aceiteLote = false,
}) {
  if (!permitido()) return "interrompida";
  const { resumirFicha, ehJogadorDoBalanceamento, VERSAO_RESUMO, VERSAO_ACEITE_LOTE } = await import("./resumo.js");
  const resumo = resumirFicha(ficha);
  if (!ehJogadorDoBalanceamento(ficha) || (aceiteLote && !resumo)) return "ignorada";
  const local = chaveDaFicha(ficha.id);
  const identificar = () => permitido() ? identificarFicha(armazenamento, local, resumo, gerarChave) : null;
  const locks = globalThis.navigator?.locks;
  const chave = locks ? await locks.request(local, identificar) : identificar();
  if (!permitido()) return "interrompida";
  if (!chave) return "ignorada";

  const corpo = { versao: VERSAO_RESUMO, chave, salvoEm, resumo };
  if (aceiteLote) corpo.aceiteLote = VERSAO_ACEITE_LOTE;
  const resposta = await enviar("/api/balanceamento/contribuicao", {
    method: "POST", credentials: "omit", keepalive: !aceiteLote, signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (resposta?.status === 429) return "limite";
  if (!resposta?.ok) return "incompleta";
  if (resumo) armazenamento.setItem(chaveDeInclusao(ficha.id), "enviada");
  return "enviada";
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
    await enviarProjecao(ficha, salvoEm, {
      armazenamento, permitido: () => lerPreferencia(armazenamento) === "ativa", enviar, gerarChave,
    });
  } catch { /* O navegador continua sendo a cópia de trabalho, inclusive offline. */ }
}

// Só a ação explícita do convite chama este fluxo. O aceite vale para este
// lote e a preferência dos próximos salvamentos continua independente.
export async function incluirFichasJaSalvas(fichas, {
  ativo = coletaLigada,
  obterArmazenamento = () => localStorage,
  enviar = fetch,
  gerarChave = () => crypto.randomUUID(),
  signal,
  onProgresso,
} = {}) {
  let enviadas = 0;
  let conferidas = 0;
  try {
    const armazenamento = obterArmazenamento();
    const permitido = () => ativo && !signal?.aborted && lerPreferencia(armazenamento) !== "desativada";
    if (!permitido()) return { estado: "interrompida", enviadas };
    const pendentes = fichasParaIncluir(fichas, armazenamento);
    const salvoEm = new Date().toISOString();
    onProgresso?.({ conferidas, total: pendentes.length });
    for (const ficha of pendentes) {
      const resultado = await enviarProjecao(ficha, salvoEm, {
        armazenamento, permitido, enviar, gerarChave, signal, aceiteLote: true,
      });
      if (resultado === "enviada") enviadas += 1;
      else if (resultado === "ignorada") armazenamento.setItem(chaveDeInclusao(ficha.id), "sem_resumo");
      else return { estado: resultado, enviadas };
      conferidas += 1;
      onProgresso?.({ conferidas, total: pendentes.length });
    }
    return { estado: "concluida", enviadas };
  } catch {
    return { estado: signal?.aborted ? "interrompida" : "incompleta", enviadas };
  }
}
