/**
 * ============================================================
 * DEFESAS POR TIPO DE DANO — Imunidade, Resistência, RD, Vulnerabilidade
 * ============================================================
 * Pedido do autor em 2026-09-02: *"faça uma aba para colocar Imunidades,
 * Resistências, RDs e Vulnerabilidade aos tipos de dano do sistema"*.
 *
 * Fecha a pendência que estava em docs/a-fazer.md desde 2026-08-31 ("Falta um
 * canal de RD por TIPO DE DANO"), e ela tinha DUAS metades: o motor não sabia
 * mirar um tipo, e a ficha não tinha onde MOSTRAR "RD 6 contra Queimante". A
 * segunda metade é esta aba, e é ela que destrava os três encantamentos
 * (Isolante de escudo, Isolante de uniforme, Resiliente).
 *
 * ------------------------------------------------------------
 * AS DUAS ENTRADAS
 * ------------------------------------------------------------
 * Uma defesa por tipo chega por dois caminhos, e os dois somam:
 *
 *   MANUAL — a aba. `creature.defesasDano[tipo]`, que é o que a criatura É por
 *            natureza (uma maldição de fogo é imune a Queimante e ponto). Um
 *            estado só por tipo, porque o seletor é excludente.
 *   MOTOR  — os quatro canais novos, com o tipo no ALVO. É por onde entram as
 *            habilidades e os encantamentos.
 *
 * ------------------------------------------------------------
 * ⚠ O CONFLITO NÃO É RESOLVIDO AQUI, E ISSO É DE PROPÓSITO
 * ------------------------------------------------------------
 * Se um tipo receber Imunidade de um lado e Vulnerabilidade de outro, este
 * módulo NÃO escolhe um vencedor: ele devolve os dois e levanta um aviso.
 *
 * A razão é que a regra de desempate é do LIVRO, e o autor não a escreveu ainda.
 * Inventar aqui um "imunidade ganha" ou um "resistência e vulnerabilidade se
 * cancelam" (que é a convenção de OUTROS sistemas, e não deste) esconderia a
 * pergunta dentro de um número que parece certo. Um aviso na tela devolve a
 * decisão para quem pode tomá-la. Ver a seção 24 de docs/afty-ficha-final.md.
 *
 * O que o módulo faz saber é que conflito é RARO por construção: a Composição
 * Elemental, que é a única aptidão que dá os dois, dá Imunidade a um tipo e
 * Vulnerabilidade ao tipo OPOSTO, que são tipos diferentes.
 *
 * ------------------------------------------------------------
 * ⚠ A RD EFETIVA JUNTA QUATRO CANAIS, E NÃO SÓ O NOVO
 * ------------------------------------------------------------
 * "Quanto de RD eu tenho contra Queimante" não é `rdTipo` sozinho. A RD Geral
 * vale para todo tipo MENOS alma, a RD Física soma nos três físicos, e a RD a
 * Alma só existe para o dano na alma. Mostrar só o canal novo daria um número
 * menor que o verdadeiro, justo na tela feita para consultá-lo.
 *
 * Por isso `rd` é a soma das parcelas que ALCANÇAM aquele tipo, e `partes`
 * guarda de onde cada uma veio, para o hover de fontes.
 * ============================================================
 */

/* ⚠ MÓDULO FOLHA: ZERO IMPORTS, e isso é a razão de ele existir separado.
   O catálogo de tipos de dano mora em `afty-equipamentos.js`, e importá-lo daqui
   quebrou o app em 2026-09-02, com "Cannot access 'ARMA_GRUPOS' before
   initialization".

   O ciclo é antigo e não é meu:

     afty-equipamentos -> afty-efeitos -> afty-combate -> afty-habilidades
                       -> afty-equipamentos (ARMA_GRUPOS, na linha 50)

   Ele só nunca estourou porque `afty-habilidades` SEMPRE entrava primeiro, e aí
   o `afty-equipamentos` terminava de avaliar antes do corpo dele rodar. Este
   módulo, importado pela aba lá no topo do AftyCreatureBuilder.jsx, passou a
   entrar no `afty-equipamentos` ANTES, invertendo a ordem: o corpo do
   `afty-habilidades` rodava com o `afty-equipamentos` no meio da avaliação, e
   `ARMA_GRUPOS` ainda na zona morta.

   ⚠ E NÃO ADIANTA DEIXAR A LEITURA PREGUIÇOSA lá no outro lado: o
   `OPCAO_ESCOLHA_NOME` é um IIFE de escopo de módulo que varre TODAS as opções
   de escolha, então um getter seria disparado na mesma hora.

   Por isso o catálogo CHEGA POR PARÂMETRO. Quem chama já o tem em mãos e já está
   depois do `afty-habilidades` no grafo. Mesma disciplina do
   `afty-pericias-catalogo.js` e do `afty-schema.js`. */

/** O dano na alma, que é o único que a RD Geral NÃO cobre. */
export const TIPO_ALMA = "alma";

/** A categoria cujos tipos a RD Física alcança. */
export const CATEGORIA_FISICA = "fisico";

/**
 * Os três estados excludentes de uma defesa. A RD fica FORA da lista de
 * propósito: ela é um número e convive com qualquer um dos três (dá para ser
 * resistente a Queimante E ter 5 de RD contra Queimante), enquanto os três
 * abaixo se excluem entre si.
 */
export const ESTADOS_DEFESA = [
  { id: "imune",      label: "Imunidade",      curto: "IMU", canal: "imunidadeDano" },
  { id: "resistente", label: "Resistência",    curto: "RES", canal: "resistenciaDano" },
  { id: "vulneravel", label: "Vulnerabilidade", curto: "VUL", canal: "vulnerabilidadeDano" },
];

const ESTADO_IDS = new Set(ESTADOS_DEFESA.map((e) => e.id));
export const rotuloEstado = (id) => ESTADOS_DEFESA.find((e) => e.id === id)?.label ?? null;

/**
 * Sanitiza o campo da ficha. Aceita a forma curta (`{ ct: "imune" }`) e a longa
 * (`{ ct: { estado: "imune", rd: 5 } }`), e devolve sempre a longa.
 *
 * ⚠ Descarta tipo que não existe MAIS, e não só o que nunca existiu: um Addon
 * pode ter trazido o tipo, e a ficha sobrevive ao Addon ser desligado. Sem esta
 * poda, a aba desenharia uma linha sem rótulo.
 *
 * `tipos` é o TIPOS_DANO, que chega por parâmetro (ver a nota do módulo folha).
 * Sem ele nada é podado, que é o certo: quem não passou o catálogo não sabe o
 * que é inválido, e apagar por ignorância perderia escolha do jogador.
 */
export function sanearDefesasDano(bruto, tipos = null) {
  const out = {};
  if (!bruto || typeof bruto !== "object") return out;
  for (const [tipo, valor] of Object.entries(bruto)) {
    if (tipos && tipos[tipo] == null) continue;
    const estadoBruto = typeof valor === "string" ? valor : valor?.estado;
    const estado = ESTADO_IDS.has(estadoBruto) ? estadoBruto : null;
    const rd = Math.max(0, Math.trunc(Number(typeof valor === "object" ? valor?.rd : 0) || 0));
    if (!estado && !rd) continue;
    out[tipo] = { estado, rd };
  }
  return out;
}

/**
 * Resolve as defesas de TODOS os tipos de dano.
 *
 * ctx = {
 *   manual,      // creature.defesasDano já saneado
 *   canalTipo,   // (canal, tipo) => número, lendo o alvo do Motor
 *   fontesTipo,  // (canal, tipo) => [{ label, valor }], para o hover
 *   rdGeral, rdFisico, rdAlma,   // os três que já existiam
 *   categorias,       // CATEGORIAS_DANO
 *   tiposDaCategoria, // tiposDeDanoDaCategoria, que já traz o rótulo VIVO
 * }
 *
 * Devolve uma linha por tipo, na ordem das categorias do livro.
 */
export function resolveDefesasDano({
  manual = {}, canalTipo = () => 0, fontesTipo = () => [],
  rdGeral = 0, rdFisico = 0, rdAlma = 0,
  categorias = [], tiposDaCategoria = () => [],
} = {}) {
  const linhas = [];
  /* Os tipos que a RD Física alcança saem da CATEGORIA, e não de uma lista
     escrita à mão: um Addon pode acrescentar um tipo físico. */
  const fisicos = new Set((tiposDaCategoria(CATEGORIA_FISICA) ?? []).map((x) => x.id));

  for (const categoria of categorias) {
    for (const { id: tipo, label } of tiposDaCategoria(categoria.id)) {
      const doManual = manual[tipo] ?? { estado: null, rd: 0 };

      // ---- Os três estados: manual mais o que o Motor concedeu ----
      const estados = [];
      const fontesEstado = {};
      for (const e of ESTADOS_DEFESA) {
        const doMotor = canalTipo(e.canal, tipo) > 0;
        const manualLigou = doManual.estado === e.id;
        if (!doMotor && !manualLigou) continue;
        estados.push(e.id);
        fontesEstado[e.id] = [
          ...(manualLigou ? [{ label: "Ficha", valor: 1 }] : []),
          ...fontesTipo(e.canal, tipo),
        ];
      }

      /* ⚠ A RD EFETIVA. Cada parcela entra só se alcança este tipo. A RD Geral
         é a mais larga e sai fora só na alma, que tem canal próprio justamente
         porque a Geral não a cobre (autor, 2026-07-29). */
      const ehFisico = fisicos.has(tipo);
      const ehAlma = tipo === TIPO_ALMA;
      const doTipo = Math.max(0, Math.trunc(canalTipo("rdTipo", tipo)));
      const partes = [
        ...(doManual.rd ? [{ label: "Ficha", valor: doManual.rd }] : []),
        ...(doTipo ? fontesTipo("rdTipo", tipo) : []),
        ...(!ehAlma && rdGeral ? [{ label: "RD Geral", valor: rdGeral }] : []),
        ...(ehFisico && rdFisico ? [{ label: "RD Física", valor: rdFisico }] : []),
        ...(ehAlma && rdAlma ? [{ label: "RD a Alma", valor: rdAlma }] : []),
      ];
      const rd = doManual.rd + doTipo
        + (ehAlma ? rdAlma : rdGeral)
        + (ehFisico ? rdFisico : 0);

      linhas.push({
        tipo,
        label,
        categoriaId: categoria.id,
        categoria: categoria.nome,
        estados,
        fontesEstado,
        // O que veio SÓ da aba, para a UI saber o que ela pode desmarcar.
        manual: doManual,
        rd,
        rdProprio: doManual.rd + doTipo,
        partes,
        // Dois estados no mesmo tipo é contradição de regra, e quem decide o
        // desempate é o autor. A UI mostra o aviso e não escolhe.
        conflito: estados.length > 1,
      });
    }
  }

  const comConflito = linhas.filter((l) => l.conflito);
  return {
    linhas,
    porTipo: Object.fromEntries(linhas.map((l) => [l.tipo, l])),
    // Só o que TEM alguma coisa, que é o que a Ficha e o Preview mostram: uma
    // lista de 15 linhas em branco não é resultado.
    ativas: linhas.filter((l) => l.estados.length > 0 || l.rdProprio > 0),
    conflitos: comConflito,
    avisos: comConflito.map((l) => ({
      tipo: l.tipo,
      texto: `${l.label}: ${l.estados.map(rotuloEstado).join(" e ")} ao mesmo tempo`,
    })),
  };
}
