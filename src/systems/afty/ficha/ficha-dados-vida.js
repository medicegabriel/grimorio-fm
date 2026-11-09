/**
 * ============================================================
 * DADOS DE VIDA: A PILHA POR ESPECIALIZAÇÃO, O GASTO, A ROLAGEM E A RECUPERAÇÃO (CL2, 2026-10-30)
 * ============================================================
 * Livro p.20, 46, 335, e os itens da p.130 a 160 que os gastam. Vale para o Player e para o Afty sem divergência (autor,
 * 2026-10-30): a pilha sai das Especializações da ficha, e uma ficha sem nenhuma tem a pilha vazia.
 *
 *   • "Um personagem recebe um Dado de Vida por nível, cujo tamanho depende da Especialização na qual o nível foi colocado."
 *     O dado é o `pvDado` da Especialização (Lutador e Especialista em Combate 1d10, Especialista em Técnica, Controlador e
 *     Suporte 1d8, Restringido 1d12), e a pilha é UMA ENTRADA POR ESPECIALIZAÇÃO, com tantos dados quantos níveis nela.
 *   • "Pode gastar seus dados de vida para se curar. Ao se curar com dados de vida, em cada um deles é somado o seu
 *     modificador de constituição" (descanso curto). "Recupera todos os seus dados de vida gastos" (descanso longo).
 *   • Os itens e as habilidades que gastam dados mudam a conta, e a operação aceita isso na ENTRADA: `limite` (o Remédio
 *     Simples, Intermediário e Complexo limitam em 4, 8 e 12 dados), `multiplicadorCon` (o Elixir da Vida soma o DOBRO do
 *     modificador em cada dado) e `todos` (o Elixir usa todos os dados).
 *
 * ⚠ ISTO NÃO É O PV ROLADO. Rolar o dado para aumentar o PV ao subir de nível é outra decisão do autor, em aberto (PV fixo
 * ou rolado), e nada aqui a toma. A pilha só alimenta a cura. A cura entra pelo `aplicaCura`, então ela quita o saldo
 * negativo antes de subir o PV (p.313) e nunca passa do máximo.
 *
 * ⚠ O Treino de Resistência (2ª etapa) soma 2 dados ("Sua quantidade de dados de vida disponíveis por descanso aumenta em 2").
 * O texto não diz de que tamanho. Adotado: o do MAIOR dado da pilha, a mesma leitura do addon Stark para o texto dele.
 * Como o derive não publica a etapa do treino, quem chama passa `treinamentos` (a `creature.treinamentos`) ou `extras`.
 *
 * ⚠ O BOTÃO DE DESCANSO É UM SÓ (D3, 2026-09-23) e devolve tudo, então `descansar` zera os gastos. Descanso curto e longo
 * separados seguem uma decisão do autor, e a operação `recuperaDadosDeVida` já aceita uma quantidade para o dia em que vier.
 * ============================================================
 */
import { rolarDano } from "./ficha-rolagem";
import { aplicaCura, registraRolagem, normalizaDadosVida } from "./ficha-sessao";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import { getEspecializacao } from "../afty-especializacoes";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });
const facesDe = (pvDado) => {
  const m = /^1d(\d+)$/.exec(String(pvDado ?? ""));
  return m ? Number(m[1]) : 0;
};

export const ID_DADOS_DO_TREINO_DE_RESISTENCIA = "treino:resistencia";
export const DADOS_EXTRAS_RESISTENCIA_2 = 2;

/** Os dados extras que um Treino concede, a partir do `creature.treinamentos`. */
export function dadosExtrasDeTreinamento(treinamentos) {
  const etapa = inteiro(treinamentos?.resistencia, 0);
  return etapa >= 2 ? [{ id: ID_DADOS_DO_TREINO_DE_RESISTENCIA, nome: "Treino de Resistência", quantidade: DADOS_EXTRAS_RESISTENCIA_2 }] : [];
}

/**
 * A pilha de Dados de Vida de uma ficha, uma entrada por Especialização (e por fonte extra), com o que sobrou depois do gasto.
 *   derived  o `deriveAfty` da ficha
 *   opcoes   { treinamentos?, extras? , gastos? }   `gastos` é o `sessao.dadosVida.gastos`
 * Cada entrada: `{ id, nome, faces, total, gastos, restantes }`.
 */
export function pilhaDeDadosDeVida(derived, { treinamentos = null, extras = [], gastos = {} } = {}) {
  const classes = (derived?.especializacoes?.escolhidas ?? [])
    .map((e) => {
      const faces = facesDe(getEspecializacao(e.id)?.caracteristicas?.pvDado);
      return faces ? { id: e.id, nome: getEspecializacao(e.id)?.nome ?? e.id, faces, total: Math.max(0, inteiro(e.nivel)) } : null;
    })
    .filter((c) => c && c.total > 0);
  const maior = classes.reduce((m, c) => Math.max(m, c.faces), 0);
  const adicionais = [...dadosExtrasDeTreinamento(treinamentos), ...(Array.isArray(extras) ? extras : [])]
    .filter((x) => x?.id && inteiro(x.quantidade) > 0 && !classes.some((c) => c.id === x.id))
    /* Extra sem pilha de onde tirar o tamanho (nenhuma Especialização com dado) não existe. */
    .filter(() => maior > 0)
    .map((x) => ({ id: x.id, nome: x.nome ?? x.id, faces: inteiro(x.faces) || maior, total: inteiro(x.quantidade) }));
  return [...classes, ...adicionais].map((c) => {
    const gasto = Math.min(c.total, Math.max(0, inteiro(gastos?.[c.id], 0)));
    return { ...c, gastos: gasto, restantes: c.total - gasto };
  });
}

const pilhaDaSessao = (sessao, derived, entrada = {}) => pilhaDeDadosDeVida(derived, {
  treinamentos: entrada.treinamentos ?? null, extras: entrada.extras ?? [], gastos: normalizaDadosVida(sessao.dadosVida).gastos,
});

/** O modificador de Constituição somado a cada dado. */
export const modConParaDadosDeVida = (derived) => inteiro(derived?.mods?.constituicao, 0);

/**
 * Gasta Dados de Vida para se curar (p.335).
 *   entrada  { classeId, quantidade } ou { todos: true }, mais
 *            limite?            teto de dados nesta cura (Remédios: 4, 8, 12). Passar do teto recusa
 *            multiplicadorCon?  quantas vezes o modificador entra em cada dado (padrão 1, Elixir da Vida 2)
 *            treinamentos?/extras?  as fontes extras da pilha (ver o cabeçalho)
 *            rng?
 * Recusas: sem opId, corpo morto, corpo nas Portas da Morte (não consegue gastar o que exige estar de pé), pilha vazia,
 * especialização desconhecida, quantidade acima do que resta e acima do limite.
 * Retorno: `{ sessao, aplicado, cura, modCon, dados: [{ id, quantidade, faces, soma }], restantes }`.
 */
export function gastaDadosDeVida(sessao, derived, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const estado = sessao.vital?.estado;
  if (estado === "morto") return recusa(sessao, "Corpo Morto", "morto");
  if (estado === "morrendo") return recusa(sessao, "Morrendo Não Gasta Dados de Vida", "morrendo");
  const pilha = pilhaDaSessao(sessao, derived, entrada);
  if (!pilha.length) return recusa(sessao, "Sem Dados de Vida", "sem-pilha");

  let pedidos;
  if (entrada.todos === true) {
    pedidos = pilha.filter((c) => c.restantes > 0).map((c) => ({ c, quantidade: c.restantes }));
  } else {
    const c = pilha.find((x) => x.id === entrada.classeId);
    if (!c) return recusa(sessao, "Especialização Sem Dados de Vida", "classe-desconhecida");
    const quantidade = inteiro(entrada.quantidade, 0);
    if (quantidade < 1) return recusa(sessao, "Informe Quantos Dados", "quantidade-invalida");
    if (quantidade > c.restantes) return recusa(sessao, "Passa dos Dados Restantes", "sem-dados", { restantes: c.restantes });
    pedidos = [{ c, quantidade }];
  }
  const total = pedidos.reduce((n, p) => n + p.quantidade, 0);
  if (!total) return recusa(sessao, "Sem Dados de Vida Restantes", "sem-dados");
  if (entrada.limite != null && total > inteiro(entrada.limite, 0)) {
    return recusa(sessao, `Passa do Limite de ${inteiro(entrada.limite, 0)} Dados`, "limite", { limite: inteiro(entrada.limite, 0) });
  }

  const modCon = modConParaDadosDeVida(derived);
  const mult = Math.max(0, inteiro(entrada.multiplicadorCon, 1));
  const rng = entrada.rng ?? Math.random;
  let s = sessao;
  let cura = 0;
  const dados = [];
  for (const { c, quantidade } of pedidos) {
    const r = rolarDano({ rotulo: "Dados de Vida", detalhe: c.nome, dados: quantidade, faces: c.faces, fixo: modCon * mult * quantidade, tom: "cura" }, rng);
    s = registraRolagem(s, r);
    cura += r.total;
    dados.push({ id: c.id, quantidade, faces: c.faces, soma: r.total });
  }
  /* Modificador negativo não tira vida: a cura de um gasto de dados nunca é menor que zero. */
  cura = Math.max(0, cura);
  const gastos = { ...normalizaDadosVida(sessao.dadosVida).gastos };
  for (const { c, quantidade } of pedidos) gastos[c.id] = (gastos[c.id] ?? 0) + quantidade;
  s = aplicaCura({ ...s, dadosVida: { gastos } }, cura, derived?.hp);
  return {
    sessao: comOperacao(s, { id: opId, tipo: "dados-de-vida:gasta" }), aplicado: true, cura, modCon: modCon * mult, dados,
    restantes: pilha.reduce((n, c) => n + c.restantes, 0) - total,
  };
}

/**
 * Recupera Dados de Vida gastos (p.335). Sem argumentos recupera TODOS ("Recupera todos os seus dados de vida gastos", o
 * descanso longo). `entrada` { classeId?, quantidade? }: com `quantidade`, recupera só esse tanto (da especialização, ou dos
 * mais gastos primeiro), que é o gancho do descanso parcial e da recuperação reduzida à metade para criar um item.
 */
export function recuperaDadosDeVida(sessao, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const gastos = { ...normalizaDadosVida(sessao.dadosVida).gastos };
  const gastoTotal = Object.values(gastos).reduce((n, v) => n + v, 0);
  if (!gastoTotal) return recusa(sessao, "Nenhum Dado Gasto", "nada-a-recuperar");
  let recupera = entrada.quantidade == null ? gastoTotal : Math.max(0, inteiro(entrada.quantidade, 0));
  if (!recupera) return recusa(sessao, "Informe Quantos Dados", "quantidade-invalida");
  const ids = entrada.classeId ? [entrada.classeId] : Object.keys(gastos).sort((a, b) => gastos[b] - gastos[a]);
  let devolvidos = 0;
  for (const id of ids) {
    if (!gastos[id] || recupera <= 0) continue;
    const t = Math.min(gastos[id], recupera);
    gastos[id] -= t;
    if (!gastos[id]) delete gastos[id];
    recupera -= t;
    devolvidos += t;
  }
  if (!devolvidos) return recusa(sessao, "Nenhum Dado Gasto", "nada-a-recuperar");
  return { sessao: comOperacao({ ...sessao, dadosVida: { gastos } }, { id: opId, tipo: "dados-de-vida:recupera" }), aplicado: true, devolvidos };
}

/** A leitura para a tela: a pilha com o que sobrou, o modificador de Constituição e o total que resta. */
export function resumoDadosDeVida(sessao, derived, entrada = {}) {
  const pilha = pilhaDaSessao(sessao, derived, entrada);
  return {
    pilha, modCon: modConParaDadosDeVida(derived),
    total: pilha.reduce((n, c) => n + c.total, 0), restantes: pilha.reduce((n, c) => n + c.restantes, 0),
  };
}
