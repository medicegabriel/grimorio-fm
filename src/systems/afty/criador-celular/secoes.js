/* ============================================================
   AS SEÇÕES DO CRIADOR NO CELULAR (app Era de Ouro, etapa E6, 2026-11-20)
   ============================================================
   No telefone a faixa de abas do criador sai (cabiam 2,5 de 9 numa largura de 375 px), e a navegação vira o botão da seção
   atual, que abre a lista inteira numa folha, mais o Anterior e o Próxima da faixa de resumo. Este arquivo é a regra pura dessa
   navegação, sem React e sem import, para o assert carregar sozinho.

   A lista vem do criador já filtrada (a Aptidões some no Restringido, as abas de addon e da mesa aparecem só quando valem), então
   aqui só se ordena e se acha o vizinho. Anterior e Próxima andam DENTRO do grupo da seção atual: nas principais, que são o
   caminho de criar a ficha, e no Outros, que é consulta e configuração. Do fim das principais não se cai no Outros sem querer.
   ============================================================ */

/** As seções em ordem, cada uma com o grupo: as principais primeiro, depois o Outros. */
export function listaDeSecoes(principais = [], outros = []) {
  return [
    ...principais.map((s) => ({ id: s.id, label: s.label, grupo: "principais" })),
    ...outros.map((s) => ({ id: s.id, label: s.label, grupo: "outros" })),
  ];
}

/** A seção de um id, ou `null`. */
export function secaoDe(lista, id) {
  return lista.find((s) => s.id === id) ?? null;
}

/** A anterior e a próxima da seção atual, dentro do grupo dela. `null` na ponta, e as duas `null` se a atual não está na lista. */
export function vizinhas(lista, atual) {
  const aqui = secaoDe(lista, atual);
  if (!aqui) return { anterior: null, proxima: null };
  const grupo = lista.filter((s) => s.grupo === aqui.grupo);
  const i = grupo.findIndex((s) => s.id === atual);
  return { anterior: grupo[i - 1] ?? null, proxima: grupo[i + 1] ?? null };
}

/** Os números da faixa de resumo, na ordem: Vida, o recurso (Energia ou Estamina), Defesa e CD. `p` é a chave em `derived.partes`. */
export function numerosDoResumo(derived = {}) {
  return [
    { k: "Vida", v: derived.hp, p: "hp", tom: "vida" },
    { k: derived.recursoLabel || "Energia", v: derived.pe, p: "pe", tom: "energia" },
    { k: "Defesa", v: derived.defesa, p: "defesa", tom: null },
    { k: "CD", v: derived.cd, p: "cd", tom: null },
  ];
}
