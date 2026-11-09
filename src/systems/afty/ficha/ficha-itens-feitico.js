/**
 * ============================================================
 * FEITIÇO DE CRIAÇÃO DE ITENS DE CUSTO: MATERIALIZAR E LIMITAR (CX5, 2026-11-06)
 * ============================================================
 * Livro p.229. O cálculo da quantidade e do custo já existia (`calcularFeiticoItens`, em
 * `afty-feiticos.js`) e a ficha mostrava o resumo. Faltava o que o texto manda cumprir:
 *
 *   - *"Um Feitiço de Criação de Itens cria apenas uma unidade do item"*, e o de nível maior pode criar
 *     mais itens de custo anterior (a conta é a do calculador, que este módulo CONSOME);
 *   - *"É necessário especificar os itens criados pelo Feitiço previamente"*: o Feitiço precisa ter a
 *     especificação preenchida e os itens criados saem do catálogo;
 *   - *"Itens de Custo consumíveis só podem ser criados uma vez por descanso longo"*: a chave de uso
 *     `criacao:<feitiço>` em `sessao.usos` (o contador que o descanso zera) conta isso;
 *   - *"Armas, revestimentos e afins podem ser criados múltiplas vezes, mas só permitem que uma quantidade
 *     igual a criação padrão do Feitiço existam ao mesmo tempo"*: a conta é feita sobre os itens criados que
 *     ainda existem;
 *   - *"Uma quantidade de vezes igual ao nível do Feitiço, você pode reduzir a quantidade de equipamentos
 *     recebidos até o mínimo de um item para aumentar o grau de um dos equipamentos"* (`grauBonus`);
 *   - *"Itens de custo criados por um Feitiço não entram no seu limite de custo e duram até serem destruídos
 *     ou desfeitos como uma Ação Livre"*.
 *
 * O item criado mora em `sessao.uso.itens.criados` e entra na ficha que a mesa enxerga por
 * `fichaComItensDaSessao` (ficha-itens.js). A ficha da criatura não é alterada, então reabrir a ficha não
 * duplica nada, e o `uid` sai do `opId`: repetir a operação devolve `repetida`.
 *
 * ⚠ O "GRAU" DOS ITENS CRIADOS é leitura minha: *"aumentar o grau de um dos equipamentos"* vira um grau de
 * Ferramenta Amaldiçoada (+1 = Quarto, +2 = Terceiro e assim por diante) e só vale para arma, escudo e
 * uniforme. A pergunta está na fila.
 * ============================================================
 */
import { aparaSessao } from "./ficha-sessao";
import { usa } from "./ficha-uso";
import { usoDe, comUso, jaAplicada, comOperacao, TETO_ITENS_CRIADOS } from "./ficha-uso-estado";
import { gastaAcao } from "./ficha-acoes";
import { calcularFeiticoEspecial } from "../afty-feiticos";
import { getEquipamento, custoDoEquipamento } from "../afty-equipamentos";

const lista = (v) => (Array.isArray(v) ? v : []);
const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });

export const chaveDaCriacao = (feiticoId) => `criacao:${feiticoId}`;
export const TIPOS_QUE_O_FEITICO_CRIA = ["arma", "escudo", "uniforme", "item"];
const TIPOS_COM_GRAU = ["arma", "escudo", "uniforme"];
/** Categorias de Item Especial que se gastam ao usar (p.129 e p.144). Acessório é permanente. */
const CATEGORIAS_CONSUMIVEIS = ["farmaco", "mistura", "espiritual", "talisma"];

const ehConsumivel = (tipo, def) => tipo === "item" && CATEGORIAS_CONSUMIVEIS.includes(def?.categoria);

export const feiticoDeCriacao = (ficha, feiticoId) => lista(ficha?.feiticos)
  .find((f) => f?.id === feiticoId && f.tipo === "especial" && f.especialSubtipo === "itens") ?? null;

/**
 * O cálculo do livro para este Feitiço, no contexto da ficha.
 * ⚠ O ACESSO É O DO DERIVE (`derived.feiticos.nivelMax`), e não o recalculado só pelo ND: o Conjurador antecipa o acesso pelo nível de
 * classe e a origem pode limitar o teto. Recalcular aqui recusaria como "acima do acesso" o Feitiço que o derive já libera.
 */
export function calculoDaCriacao(feitico, derived) {
  return calcularFeiticoEspecial(feitico, {
    nd: derived?.nd, sistema: derived?.sistema,
    ...(derived?.feiticos?.nivelMax != null ? { acessoNivel: derived.feiticos.nivelMax } : {}),
  });
}

/** Os itens deste Feitiço que ainda existem, na sessão. */
export const criadosDoFeitico = (sessao, feiticoId) => usoDe(sessao).itens.criados.filter((c) => c.feitico === feiticoId);

/**
 * O resumo da criação para a tela: o que o Feitiço cria, quantos itens cabem, e se o consumível já foi criado no descanso.
 * Puro, nada é escrito.
 */
export function resumoDaCriacao(ficha, sessao, derived, feiticoId) {
  const feitico = feiticoDeCriacao(ficha, feiticoId);
  if (!feitico) return null;
  const calc = calculoDaCriacao(feitico, derived);
  const existentes = criadosDoFeitico(sessao, feiticoId);
  const consumivel = calc.natureza === "consumivel";
  return {
    feiticoId, nome: feitico.nome, ...calc,
    existentes: existentes.length,
    cabem: consumivel ? calc.quantidade : Math.max(0, calc.qtdBase - existentes.length),
    jaCriouNoDescanso: consumivel && inteiro(sessao?.usos?.[chaveDaCriacao(feiticoId)]) >= 1,
    especificado: String(feitico.itemDescricao ?? "").trim() !== "",
  };
}

/**
 * CRIA os itens do Feitiço. Tudo ou nada: qualquer recusa devolve a MESMA sessão, sem PE marcado, uso gasto nem item criado.
 *
 *   pedido { feiticoId, itens: [{ tipo, refId }], opId, registraAcao?, grauEm? }
 *     itens   o que sai desta criação, entre 1 e a quantidade do cálculo do livro. Cada um precisa ser do Custo do Feitiço
 *     grauEm  índice (0 = o primeiro) do item que recebe o `+Grau` das trocas, quando o Feitiço trocou quantidade por grau
 *
 * Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, criados?, custo?, calculo? }`.
 */
export function criaItensDoFeitico(ficha, sessao, derived, pedido = {}) {
  const { feiticoId, opId } = pedido;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const feitico = feiticoDeCriacao(ficha, feiticoId);
  if (!feitico) return recusa(sessao, "Feitiço de Criação Não Encontrado", "feitico-ausente");
  if (!String(feitico.itemDescricao ?? "").trim()) return recusa(sessao, "Especifique os Itens do Feitiço", "sem-especificacao");

  const calc = calculoDaCriacao(feitico, derived);
  if (!calc?.quantidade) return recusa(sessao, "Feitiço Fora do Nível de Criação", "nivel", { calculo: calc });
  if (lista(calc.avisos).some((a) => a.includes("inacessível"))) return recusa(sessao, "Nível Acima do Acesso", "acesso", { calculo: calc });

  const pedidos = lista(pedido.itens).filter((x) => x && typeof x === "object");
  if (!pedidos.length) return recusa(sessao, "Escolha os Itens", "sem-itens", { calculo: calc });
  if (pedidos.length > calc.quantidade) return recusa(sessao, `No Máximo ${calc.quantidade} Itens`, "itens-demais", { calculo: calc });

  const defs = [];
  for (const p of pedidos) {
    if (!TIPOS_QUE_O_FEITICO_CRIA.includes(p.tipo)) return recusa(sessao, "Tipo de Item Não Criável", "tipo");
    const def = getEquipamento(p.tipo, p.refId, ficha);
    if (!def || def.evento) return recusa(sessao, "Item Não Encontrado", "item-ausente");
    if (custoDoEquipamento(p.tipo, def) !== calc.custo) return recusa(sessao, `O Feitiço Cria Itens de Custo ${calc.custo}`, "custo", { detalhe: { item: def.nome } });
    const consumivel = ehConsumivel(p.tipo, def);
    if (consumivel !== (calc.natureza === "consumivel")) {
      return recusa(sessao, calc.natureza === "consumivel" ? "O Feitiço Cria Consumíveis" : "O Feitiço Cria Itens Permanentes", "natureza", { detalhe: { item: def.nome } });
    }
    defs.push({ ...p, def, consumivel });
  }

  const grauEm = inteiro(pedido.grauEm, 0);
  if (calc.grauBonus > 0 && !TIPOS_COM_GRAU.includes(defs[grauEm]?.tipo)) {
    return recusa(sessao, "O Grau Só Vale em Arma, Escudo ou Uniforme", "grau", { calculo: calc });
  }

  const permanente = calc.natureza !== "consumivel";
  if (permanente) {
    const existentes = criadosDoFeitico(sessao, feiticoId).length;
    if (existentes + defs.length > calc.qtdBase) {
      return recusa(sessao, `Só ${calc.qtdBase} Podem Existir ao Mesmo Tempo`, "limite-simultaneo", { detalhe: { existentes, limite: calc.qtdBase } });
    }
  }
  if (usoDe(sessao).itens.criados.length + defs.length > TETO_ITENS_CRIADOS) return recusa(sessao, "Itens Criados Demais", "teto");

  const linha = lista(derived?.feiticos?.lista).find((f) => f.id === feiticoId);
  const descritor = {
    id: `feitico:${feiticoId}:itens`, nome: feitico.nome || "Criação de Itens", origem: `feitico:${feiticoId}`,
    acao: "bonus", cobranca: "manual",
    ...(linha?.custoPE != null ? { custo: { pe: Math.max(0, inteiro(linha.custoPE)) } } : {}),
    ...(permanente ? {} : { usos: { chave: chaveDaCriacao(feiticoId), max: 1 } }),
  };
  const r = usa(sessao, derived, descritor, { opId, registraAcao: !!pedido.registraAcao });
  if (!r.aplicado) {
    const jaCriou = r.codigo === "sem-usos";
    return recusa(sessao, jaCriou ? "Já Criou Neste Descanso" : r.erro ?? "Uso Recusado", jaCriou ? "uma-vez-por-descanso" : r.codigo ?? "uso", { recusas: r.recusas, custo: r.custo });
  }

  const rodada = Math.max(0, inteiro(sessao.rodada));
  const criados = defs.map((x, i) => ({
    uid: `feit_${opId}_${i + 1}`, tipo: x.tipo, refId: x.refId, feitico: feiticoId, consumivel: x.consumivel,
    equipado: false, grauBonus: i === grauEm ? calc.grauBonus : 0, desde: rodada,
  }));
  let s = comUso(r.sessao, (u) => ({ ...u, itens: { ...u.itens, criados: [...u.itens.criados, ...criados] } }));
  if (derived) s = aparaSessao(s, derived);
  return {
    sessao: s, aplicado: true, criados: criados.map((c) => c.uid), custo: r.custo, calculo: calc,
    ...(r.acao ? { acao: r.acao } : {}),
    evento: { tipo: "criacao-de-itens", nome: descritor.nome, quantidade: criados.length },
  };
}

/**
 * DESFAZ um item criado por Feitiço (Ação Livre). Libera a vaga dos permanentes que podem existir ao mesmo tempo. O consumível
 * desfeito NÃO devolve a criação do descanso: o livro conta a criação, e não a permanência.
 */
export function desfazItemCriado(sessao, derived, { uid, opId, registraAcao = false } = {}) {
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const item = usoDe(sessao).itens.criados.find((c) => c.uid === uid);
  if (!item) return recusa(sessao, "Item Criado Não Encontrado", "item-ausente");
  let s = sessao;
  if (registraAcao) {
    const a = gastaAcao(s, derived, "livre", { id: `desfaz:${uid}` });
    if (a.erro) return recusa(sessao, a.erro, a.codigo);
    s = a.sessao;
  }
  s = comUso(s, (u) => ({ ...u, itens: { ...u.itens, criados: u.itens.criados.filter((c) => c.uid !== uid) } }));
  return { sessao: comOperacao(s, { id: opId, tipo: "item-desfeito" }), aplicado: true, removido: uid };
}

/** Veste ou guarda um item criado por Feitiço. Ele não tem entrada na ficha, então o interruptor mora na sessão. */
export function equipaItemCriado(sessao, uid, equipado) {
  const itens = usoDe(sessao).itens;
  if (!itens.criados.some((c) => c.uid === uid)) return sessao;
  return comUso(sessao, (u) => ({ ...u, itens: { ...u.itens, criados: u.itens.criados.map((c) => (c.uid === uid ? { ...c, equipado: !!equipado } : c)) } }));
}
