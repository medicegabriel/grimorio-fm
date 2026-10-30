/* Utilitários da camada dos Efeitos (nasceram no protótipo v2). Nada aqui calcula regra: só formata e procura. */

export const uid = () => Math.random().toString(36).slice(2, 10);

// Sinal de menos tipográfico (U+2212), o mesmo que a Ficha usa.
export const sinal = (n) => {
  const v = Math.trunc(Number(n) || 0);
  return v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0";
};
export const numeroBr = (n) => String(n ?? "").replace(".", ",");
export const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Quem está digitando não dispara atalho de uma tecla: campo, área de texto,
   seletor, conteúdo editável, ou composição de acento em andamento. */
export function estaDigitando(evento) {
  const alvo = evento?.target;
  if (evento?.isComposing) return true;
  if (!alvo) return false;
  return !!alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
}

/* Trecho LITERAL do texto em volta da primeira ocorrência de um dos termos.
   A comparação ignora acento e caixa, mas o que volta é o texto original,
   caractere por caractere: nada é resumido nem reescrito. */
export function trechoLiteral(texto, termos, { antes = 70, depois = 120 } = {}) {
  const original = [...String(texto ?? "")];
  if (!original.length || !termos.length) return null;
  const norm = original.map((c) => semAcento(c));
  const plano = norm.join("");
  // índice no texto normalizado -> índice no original
  const mapa = [];
  norm.forEach((n, i) => { for (let k = 0; k < n.length; k += 1) mapa.push(i); });

  let primeiro = -1;
  let tamanho = 0;
  for (const t of termos) {
    const i = plano.indexOf(t);
    if (i >= 0 && (primeiro < 0 || i < primeiro)) { primeiro = i; tamanho = t.length; }
  }
  if (primeiro < 0) return null;

  const oi = mapa[primeiro] ?? 0;
  let ini = Math.max(0, oi - antes);
  let fim = Math.min(original.length, oi + tamanho + depois);
  if (ini > 0) { const esp = original.indexOf(" ", ini); if (esp > 0 && esp < oi) ini = esp + 1; }
  if (fim < original.length) { const esp = original.lastIndexOf(" ", fim); if (esp > oi + tamanho) fim = esp; }

  const janela = original.slice(ini, fim);
  const janelaNorm = janela.map((c) => semAcento(c));
  const marcado = new Array(janela.length).fill(false);
  const planoJanela = janelaNorm.join("");
  const mapaJ = [];
  janelaNorm.forEach((n, i) => { for (let k = 0; k < n.length; k += 1) mapaJ.push(i); });
  for (const t of termos) {
    let desde = 0;
    for (;;) {
      const i = planoJanela.indexOf(t, desde);
      if (i < 0) break;
      for (let k = i; k < i + t.length; k += 1) marcado[mapaJ[k]] = true;
      desde = i + t.length;
    }
  }
  const partes = [];
  janela.forEach((c, i) => {
    const ultima = partes[partes.length - 1];
    if (ultima && ultima.marca === marcado[i]) ultima.t += c;
    else partes.push({ t: c, marca: marcado[i] });
  });
  return { partes, cortadoAntes: ini > 0, cortadoDepois: fim < original.length };
}

export const termosDe = (busca) => semAcento(busca).split(/\s+/).filter(Boolean);

/* Rótulo das partes de fonte: `label`, `valor`, `texto`, `suplantado`, `secao`. */
export const textoDaParte = (p) => p.texto ?? sinal(p.valor);
