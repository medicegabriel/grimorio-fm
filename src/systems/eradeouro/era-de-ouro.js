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
