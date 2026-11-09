/**
 * ============================================================
 * OS DESCRITORES DE USO QUE JÁ EXISTEM (CL1, 2026-10-29)
 * ============================================================
 * O contrato de `ficha-uso.js` consome um DESCRITOR (dado). Aqui moram os descritores dos clientes reais, para a
 * tela (e o Codex, nos lotes de conteúdo) importarem em vez de reescrever custo, parâmetro e duração. Acrescentar
 * um cliente é escrever um objeto: nenhuma linha do `ficha-sessao.js` muda. O formato está em
 * `docs/afty-motor-uso-combate.md`.
 *
 * ⚠ SÓ ENTRA AQUI O QUE O LIVRO ESCREVE. Número que depende de ficha (um custo escalado, um dado) vem do `derived` e
 * chega ao descritor por função, e quem monta o descritor é a tela, que já tem o `derived` na mão.
 * ============================================================
 */

const temHabilidade = (id) => (_sessao, derived) => (
  (derived?.habilidades?.efetivas ?? derived?.habilidades?.escolhidas ?? []).includes(id) || "Habilidade Não Escolhida"
);

/**
 * ARMAS ABSOLUTAS (Lutador 12, Livro p.61): "Enquanto estiver empunhando uma Arma Dedicada, você pode gastar 2PE
 * para receber os seguintes bônus por uma rodada: você escolhe aumentar sua Defesa em 3 ou receber +3 em Jogadas de
 * Ataque [...]. Para cada rodada após a primeira, você deve gastar mais 2PE para manter, ou os bônus se encerram."
 *
 *   custo        2 PE, política `manual`: a ficha confere a Energia e devolve "PE Não Descontado". A pergunta do autor
 *                (M03 n.3, em docs/a-fazer.md) sobre cobrar e expirar sozinho está ABERTA, e a regra vigente é que o
 *                custo de estado só é exibido.
 *   manutenção   2 PE por rodada seguinte. A virada a marca como DEVIDA (`registro.manutencaoDevida`) e não desliga:
 *                quem desliga é `encerraUso`, ou o descanso e o fim do combate.
 *   empunhar     fato que a ficha não enxerga: é uma confirmação da mesa (`armaDedicada`).
 *   o estado     `armasAbsolutas` ("defesa" ou "acerto") já liga os efeitos de `afty-efeitos-conteudo.js`. A segunda
 *                parte do texto (rolar de novo o ataque que errou, uma vez por ataque) é do ataque: ver
 *                `melhorRolagem` em `ficha-ataque.js`.
 */
export const USO_ARMAS_ABSOLUTAS = {
  id: "lut_armas_absolutas",
  nome: "Armas Absolutas",
  origem: "habilidade:lut_armas_absolutas",
  emCombate: true,
  acesso: temHabilidade("lut_armas_absolutas"),
  parametros: [
    { id: "escolha", tipo: "opcao", opcoes: ["defesa", "acerto"], rotulo: "Escolha do Bônus" },
    { id: "armaDedicada", tipo: "bool", exige: true, rotulo: "Empunhando Arma Dedicada" },
  ],
  custo: { pe: 2 },
  cobranca: "manual",
  duracao: { manutencao: { pe: 2 } },
  efeitos: [{ tipo: "estado", id: "armasAbsolutas", valor: { parametro: "escolha" }, desliga: null }],
};

/** Os descritores prontos, por id. */
export const USOS_PRONTOS = { [USO_ARMAS_ABSOLUTAS.id]: USO_ARMAS_ABSOLUTAS };

/**
 * A PONTE DOS ESTADOS DE COMBATE (M03-D01): qualquer estado de `COMBATE_ESTADOS`, de `estadosExtras` ou de Addon vira
 * descritor de uso sem mexer no catálogo. O `custoPE` que hoje só é exibido passa a ser conferido ("Faltam N PE") e
 * devolvido como "PE Não Descontado"; `umaVezPorRodada` vira o limite da rodada com o motivo; `max`, `min` e `opcoes`
 * viram o parâmetro validado; e o estado é ligado pelo MESMO verbo de sempre (`alteraEstadoCombate`), então o
 * `exclusivoCom` (os dois Canalizar) continua sendo respeitado por ele. Sem `duracao` nos `extras` o estado fica ligado como hoje, e a
 * pessoa o desliga pelo seletor. Com `duracao` ele vira um uso ativo, que `encerraUso` e a virada sabem desfazer.
 *
 *   estado    a linha do catálogo (`{ id, label, tipo, custoPE?, min?, max?, opcoes?, umaVezPorRodada? }`)
 *   derived   para o `max` que é função da ficha
 *   extras    campos do descritor para sobrescrever (`cobranca: "confirmada"`, `duracao`, `acao`, `acesso`)
 */
export function usoDoEstado(estado, derived = null, extras = {}) {
  const tipo = estado.tipo ?? "bool";
  const max = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  const parametros = tipo === "faixa"
    ? [{ id: "valor", tipo: "faixa", min: estado.min ?? 0, ...(max != null ? { max } : {}), rotulo: estado.label }]
    : tipo === "opcao" ? [{ id: "valor", tipo: "opcao", opcoes: (estado.opcoes ?? []).map((o) => o.id), rotulo: estado.label }] : [];
  const custo = estado.custoPE;
  return {
    id: estado.id,
    nome: estado.label,
    origem: `estado:${estado.id}`,
    emCombate: true,
    cobranca: "manual",
    ...(parametros.length ? { parametros } : {}),
    ...(custo != null ? { custo: { pe: (v) => (typeof custo === "function" ? custo(tipo === "bool" ? 1 : v.valor) : custo) } } : {}),
    ...(estado.umaVezPorRodada ? { limite: { por: "rodada" } } : {}),
    efeitos: [{
      tipo: "estado",
      id: estado.id,
      valor: tipo === "bool" ? true : { parametro: "valor" },
      estado,
      desliga: tipo === "opcao" ? null : tipo === "faixa" ? (estado.min ?? 0) : false,
    }],
    ...extras,
  };
}
