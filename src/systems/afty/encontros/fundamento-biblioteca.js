import { sistemaGravado } from "../afty-sistema";

/** Une perdas por invocação sem substituir registros existentes. */
export function juntarFundamentosPerdidos(atuais, novos) {
  const antes = Array.isArray(atuais) ? atuais : [];
  const ids = new Set(antes.map((r) => r?.invocacaoId).filter(Boolean));
  const adicionais = [];
  for (const r of Array.isArray(novos) ? novos : []) {
    if (typeof r?.invocacaoId !== "string" || !r.invocacaoId || ids.has(r.invocacaoId)) continue;
    ids.add(r.invocacaoId);
    adicionais.push({ ...r });
  }
  return adicionais.length ? [...antes, ...adicionais] : antes;
}

/**
 * A biblioteca é relida no momento da gravação. Só a perda e o carimbo mudam,
 * nunca a ficha congelada do Encontro por cima de uma edição posterior.
 * Sem vínculo, com JSON inválido ou sem espaço, a cópia do Encontro permanece
 * válida e a tela recebe a falha para permitir nova tentativa.
 */
export function sincronizarFundamentosNaBiblioteca(combatentes, armazenamento) {
  const gravadas = [];
  const falhas = [];
  const grupos = new Map();
  for (const c of Array.isArray(combatentes) ? combatentes : []) {
    const perdas = juntarFundamentosPerdidos([], c?.ficha?.fundamentosPerdidos);
    if (!perdas.length) continue;
    const sistema = sistemaGravado(c.ficha);
    const criaturaId = c.criaturaId;
    const nome = c.nome || c.ficha.name || "Sem nome";
    if (!sistema || !criaturaId || c.ficha.id !== criaturaId) {
      falhas.push({ nome, motivo: "Ficha sem Vínculo com a Biblioteca" });
      continue;
    }
    const chave = sistema + ":" + criaturaId;
    const grupo = grupos.get(chave) || { sistema, criaturaId, nome, perdas: [] };
    grupo.perdas = juntarFundamentosPerdidos(grupo.perdas, perdas);
    grupos.set(chave, grupo);
  }
  for (const { sistema, criaturaId, nome, perdas } of grupos.values()) {
    try {
      const storage = armazenamento ?? globalThis.localStorage;
      const chave = "fm_creatures_" + sistema + "_v1";
      const lista = JSON.parse(storage.getItem(chave) ?? "[]");
      if (!Array.isArray(lista) || lista.some((c) => !c || typeof c !== "object" || Array.isArray(c) || typeof c.id !== "string" || !c.id)) {
        falhas.push({ nome, motivo: "Biblioteca Inválida" });
        continue;
      }
      if (new Set(lista.map((c) => c.id)).size !== lista.length) {
        falhas.push({ nome, motivo: "Identificador Duplicado na Biblioteca" });
        continue;
      }
      const indices = lista.flatMap((c, i) => c.id === criaturaId ? [i] : []);
      if (indices.length !== 1) {
        falhas.push({ nome, motivo: indices.length ? "Identificador Duplicado na Biblioteca" : "Ficha não Encontrada na Biblioteca" });
        continue;
      }
      const i = indices[0];
      const atual = lista[i];
      // Ficha antiga sem versão herda o espaço da biblioteca, como no hook.
      if (atual.rulesVersion != null && sistemaGravado(atual) !== sistema) {
        falhas.push({ nome, motivo: "Sistema da Ficha Diferente da Biblioteca" });
        continue;
      }
      const fundamentosPerdidos = juntarFundamentosPerdidos(atual.fundamentosPerdidos, perdas);
      if (fundamentosPerdidos === atual.fundamentosPerdidos) continue;
      const ficha = { ...atual, fundamentosPerdidos, updatedAt: new Date().toISOString() };
      const proxima = lista.map((c, n) => n === i ? ficha : c);
      storage.setItem(chave, JSON.stringify(proxima));
      gravadas.push({ sistema, ficha, biblioteca: proxima });
    } catch {
      falhas.push({ nome, motivo: "Não Foi Possível Gravar na Biblioteca" });
    }
  }
  return { gravadas, falhas };
}
