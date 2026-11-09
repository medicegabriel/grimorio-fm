/**
 * ============================================================
 * ERA DE OURO: a mesa da Guilda
 * ============================================================
 * A rota `/EraDeOuro` abre o MESMO livro do `/Afty` e do `/Player` com um
 * armazenamento só dela. Numa lista só moram os dois tipos de ficha: a criatura
 * (`rulesVersion: "afty"`) e o personagem (`rulesVersion: "player"`). Cada ficha
 * segue sendo de um dos dois sistemas, e quem decide qual é o `rulesVersion`
 * dela, como em qualquer outra rota. Ver src/systems/afty/afty-sistema.js.
 *
 * ⚠ "ERADEOURO" NÃO É UM SISTEMA, e é de propósito. `SISTEMAS` e `rulesVersion`
 * só aceitam "afty" e "player": qualquer outro valor falha em `sistemaGravado`,
 * a porta do importador recusa a ficha, o clique no card não abre a Ficha, e o
 * `normalizaSistema` derivaria todo personagem da Guilda como criatura, calado.
 * A Guilda é uma MESA, e a mesa é um campo à parte na ficha: `mesa`.
 *
 * ⚠ A MESA VEM DA FICHA, E NÃO DA ROTA. É a mesma lei do sistema. A rota só
 * carimba a ficha NOVA (o criador grava `mesa` no nascimento, e não só ao
 * salvar). Daí em diante quem responde é o campo, então uma ficha da Guilda
 * exportada e importada no `/Afty` continua sendo da Guilda.
 *
 * ------------------------------------------------------------
 * AS REGRAS PRÓPRIAS DA GUILDA
 * ------------------------------------------------------------
 * Moram em REGRAS_DA_MESA, uma tabela SEPARADA de `DIVERGENCIAS`. O assert
 * `t-sistema.mjs` exige que as divergências de criatura e personagem sejam
 * exatamente as ligadas, e uma regra da Guilda ali dentro o quebraria sem ser
 * defeito. Hoje a tabela está VAZIA: a rota se comporta igual ao Afty e ao
 * Player até o autor passar as regras uma a uma.
 *
 * Cada entrada, quando existir:
 *   id       chave lida por `regraDaMesa`
 *   tipo     "regra" muda NÚMERO, "tela" muda só layout
 *   fonte    o texto da regra, verbatim
 *   base     o que vale fora da Guilda
 *   eradeouro  o que vale na Guilda
 *   ativa    se o código JÁ desvia
 *
 * O módulo que passar a desviar lê `regraDaMesa(ficha, id)` e nunca um `if`
 * solto, senão a regra some do mapa. É o mesmo molde de `regraDo`.
 * ============================================================
 */

export const MESA_ERA_DE_OURO = "eradeouro";

/** O namespace do localStorage da rota: `fm_creatures_eradeouro_v1` e as irmãs. */
export const NAMESPACE_ERA_DE_OURO = "eradeouro";

/** Os encontros da Guilda, fora de `afty_encontros_v1`, que o Afty e o Player dividem. */
export const CHAVE_ENCONTROS_ERA_DE_OURO = "afty_encontros_eradeouro_v1";

export const ERA_DE_OURO = {
  id: MESA_ERA_DE_OURO,
  label: "Era de Ouro",
  rota: "/EraDeOuro",
};

/** A rota, sem diferenciar maiúscula de minúscula, como as outras duas. */
export const ehRotaEraDeOuro = (pathname) => /^\/eradeouro\/?$/i.test(pathname ?? "");

/** A mesa da ficha: "eradeouro" ou null. Lê a FICHA, nunca a rota. */
export const mesaDaFicha = (ficha) => (ficha?.mesa === MESA_ERA_DE_OURO ? MESA_ERA_DE_OURO : null);

/** Devolve a ficha carimbada com a mesa. Não muda o `rulesVersion`. */
export const comMesa = (ficha, mesa) => (mesa === MESA_ERA_DE_OURO ? { ...ficha, mesa } : ficha);

/**
 * Os addons que são as regras oficiais da Guilda (autor, 2026-11-09). Toda ficha
 * NOVA da Guilda nasce com eles ligados, e a Guilda não os desliga. Os pacotes
 * vêm de `addons/` e são carregados por `pacotes-oficiais.js`.
 *
 * ⚠ É A MESA QUE TRAVA, e não a rota: o trava vale para a ficha com `mesa`,
 * onde quer que ela seja aberta. Ficha antiga e ficha importada sem a marca não
 * ganham os addons nem a trava.
 */
export const ADDONS_OFICIAIS_IDS = [
  "regras-grimorio",
  "cofre-de-feiticos",
  "carteira-da-guilda",
  "alma-livre",
  "atencao-so-percepcao",
  "pericias-era-de-ouro",
];

/**
 * "Atenção Só Pela Percepção" mora AQUI, e não em `addons/`: é a regra `atencaoSoPercepcao` do motor
 * (pública), pedida sozinha para a Guilda. Um JSON novo em `addons/` entraria no inventário de revisão e
 * no teste de reconciliação, que pedem a árvore livre. Mesmo molde do `PACOTE_ALMA_DO_AFTY`.
 */
export const PACOTE_ATENCAO_SO_PERCEPCAO = Object.freeze({
  id: "atencao-so-percepcao",
  nome: "Atenção Só Pela Percepção",
  versao: "1.0.0",
  autor: "Afty",
  paraRaw: "afty",
  descricao: "O poder que dá Percepção e Atenção ao mesmo tempo passa a dar só a Percepção. A Atenção da ficha segue vindo da Percepção.",
  resumo: "O bônus de Percepção não soma de novo na Atenção",
  categoria: "regras",
  regrasAfty: Object.freeze({ atencaoSoPercepcao: true }),
});

/**
 * "Perícias da Era de Ouro": cria Guerra (Inteligência) e Nobreza (Inteligência ou Presença). Inline pelo mesmo
 * motivo do pacote acima. O campo `pericias` do pacote é o verbo público do motor. As descrições das duas ainda
 * não foram enviadas, e a ficha mostra só o nome e o atributo.
 */
export const PACOTE_PERICIAS_ERA_DE_OURO = Object.freeze({
  id: "pericias-era-de-ouro",
  nome: "Perícias da Era de Ouro",
  versao: "1.0.0",
  autor: "Afty",
  paraRaw: "afty",
  descricao: "Cria as perícias Guerra e Nobreza. Guerra usa Inteligência. Nobreza usa Inteligência ou Presença, à escolha de quem a treina.",
  resumo: "Cria as perícias Guerra e Nobreza",
  categoria: "regras",
  pericias: Object.freeze([
    Object.freeze({ id: "guerra", nome: "Guerra", atributo: "inteligencia" }),
    Object.freeze({ id: "nobreza", nome: "Nobreza", atributo: "inteligencia", atributos: Object.freeze(["inteligencia", "presenca"]) }),
  ]),
});

/** Este addon está travado nesta ficha? */
export const addonTravado = (ficha, idAddon) =>
  mesaDaFicha(ficha) !== null && ADDONS_OFICIAIS_IDS.includes(idAddon);

/** Ainda sem nenhuma regra própria. Ver o cabeçalho. */
export const REGRAS_DA_MESA = [];

const POR_ID = new Map(REGRAS_DA_MESA.map((r) => [r.id, r]));

/**
 * Qual ramo vale para esta ficha: "eradeouro" ou "base". Id desconhecido ou
 * regra desligada devolve "base", pelo mesmo motivo de `regraDo`: um id errado
 * não pode derrubar o criador no meio da mesa.
 */
export const regraDaMesa = (ficha, idRegra) => {
  const r = POR_ID.get(idRegra);
  if (!r || !r.ativa) return "base";
  return mesaDaFicha(ficha) ?? "base";
};

/** Os textos da lista de fichas (o Dashboard) na língua da Guilda. */
export function vocabularioDeFichas() {
  const quantos = (n) => `${n} ${n === 1 ? "ficha" : "fichas"}`;
  return {
    todas: "Todas as Fichas",
    contagem: quantos,
    itens: "fichas",
    nova: "Nova Ficha",
    criarNova: "Criar nova ficha",
    criar: "Criar ficha",
    exportarVista: "Exportar fichas da visualização atual",
    exportarTitulo: "Exportar Fichas",
    importarTitulo: "Importar Fichas",
    arquivo: "fichas_exportadas",
    selecionadas: (sel, total) => `${sel} de ${total} selecionada(s)`,
    importadas: (n) => `${quantos(n)} ${n === 1 ? "importada" : "importadas"} com sucesso.`,
    buscar: "Buscar fichas",
    nenhumaBusca: "Nenhuma ficha combina com sua busca.",
    removida: "será removida permanentemente.",
    removidas: (n) => `${quantos(n)} ${n === 1 ? "será removida" : "serão removidas"} permanentemente.`,
  };
}

/** Sanidade da tabela acima, no molde de `validarSistemas`. */
export function validarRegrasDaMesa() {
  const erros = [];
  const vistos = new Set();
  for (const r of REGRAS_DA_MESA) {
    if (!r.id) erros.push("Regra da mesa sem id.");
    else if (vistos.has(r.id)) erros.push(`Regra da mesa duplicada: ${r.id}`);
    else vistos.add(r.id);
    if (r.tipo !== "regra" && r.tipo !== "tela") erros.push(`Regra da mesa ${r.id || "?"} com tipo inválido.`);
    if (!r.fonte) erros.push(`Regra da mesa ${r.id || "?"} sem fonte.`);
  }
  return erros;
}
