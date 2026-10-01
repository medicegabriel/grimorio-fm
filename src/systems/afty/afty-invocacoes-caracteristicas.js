/**
 * ============================================================
 * CATÁLOGO DE CARACTERÍSTICAS DE INVOCAÇÃO (FOLHA: zero imports)
 * ============================================================
 * Etapa 5 da atualização de 2026-09-30. Fontes: o Livro 2.5.2 (as tabelas de
 * Característica do capítulo de Invocações) e o *Adicionais para Invocações*
 * (Características Intrínsecas, Modificadoras e de Aura).
 *
 * ⚠ O `id` É O `subtipo` GRAVADO NA FICHA. Os seis de antes (`vida`, `teste`,
 * `resistencia`, `rd`, `tamanho`, `livre`) estão aqui com o mesmo id, e por isso
 * nenhuma ficha salva precisa migrar: o catálogo descreve o que elas já eram.
 *
 * ⚠ O VALOR SAI DO GRAU ATUAL (`escala`), e a ficha guarda só a escolha. Ao
 * evoluir o grau, a Característica evolui junto. Ordem da escala: Quarto,
 * Terceiro, Segundo, Primeiro e Especial.
 *
 * Campos:
 *   nome, categoria   "modificadora" | "intrinseca" | "livre"
 *   fonte             "livro" | "adicionais" | "casa"
 *   escala            valor por grau, ou null
 *   canal             canal da invocação onde o valor cai (as numéricas), ou null
 *   grupoEfeito       o "mesmo efeito" que não acumula. Nível de Dano e Dado de
 *                     Dano dividem o grupo `dano` ("Características que aumentem
 *                     Nível de Dano e dão Dados de Dano" não se acumulam)
 *   parametros        as escolhas que a ficha guarda em `parametros`
 *   dadoExtra         a Característica dá DADO extra. Só as autorizadas por fonte
 *                     podem (decisão do autor, 2026-09-30). A Livre não pode
 *   descricao         o texto da fonte, para o hover do catálogo
 */
const GRAUS = ["quarto", "terceiro", "segundo", "primeiro", "especial"];
const porGrau = (q, t, s, p, e) => ({ quarto: q, terceiro: t, segundo: s, primeiro: p, especial: e });

export const CARACTERISTICAS_INVOCACAO = [
  /* ------- As seis de antes (Livro, e a Livre da casa) ------- */
  {
    id: "vida", nome: "Vida Extra", categoria: "modificadora", fonte: "livro",
    escala: porGrau(5, 10, 15, 20, 30), canal: "pv", grupoEfeito: "vida", parametros: [],
    descricao: "Recebe +5 em seu PV máximo, aumentando em +10, +15, +20 e +30 no grau especial.",
  },
  {
    /* Perícia: o valor cheio. Ataque e TR: a metade (Livro), que é o +1 a +5 do
       Adicionais. O gatilho do Livro saiu em 2026-09-04 (autor). */
    id: "teste", nome: "Bônus em Teste", categoria: "modificadora", fonte: "livro",
    escala: porGrau(2, 4, 6, 8, 10), canal: null, grupoEfeito: "teste", parametros: ["alvoTeste", "pericia", "tr"],
    descricao: "Perícia (Especificar): +2, aumentando em +4, +6, +8 e +10. Acerto e TR (Especificar): +1, aumentando em +2, +3, +4 e +5.",
  },
  {
    /* TR Treinada e TR Mestre (Adicionais, decisão do autor em 2026-09-30): a
       Treinada não tem trava de grau, e a Mestre só vale num TR em que a
       invocação já é treinada. */
    id: "resistencia", nome: "TR Treinada ou Mestre", categoria: "modificadora", fonte: "adicionais",
    escala: null, canal: null, grupoEfeito: "trProf", parametros: ["tr", "prof"],
    descricao: "TR Treinada: torna a invocação treinada em um TR. TR Mestre: torna a invocação mestre em um TR em que ela é Treinada.",
  },
  {
    id: "rd", nome: "RD", categoria: "modificadora", fonte: "livro",
    escala: porGrau(2, 4, 6, 8, 12), canal: null, grupoEfeito: "rd", parametros: ["tipoDano"],
    descricao: "Recebe +2 em RD (Especificar), aumentando em +4, +6, +8 e +12 no grau especial.",
  },
  {
    id: "tamanho", nome: "Mudança de Tamanho", categoria: "intrinseca", fonte: "livro",
    escala: null, canal: null, grupoEfeito: "tamanho", parametros: ["tamanho"],
    descricao: "Tem seu tamanho alterado, dentro da faixa do grau.",
  },
  {
    id: "livre", nome: "Livre", categoria: "livre", fonte: "casa",
    escala: null, canal: null, grupoEfeito: null, parametros: [],
    descricao: "Efeitos escritos no Motor, nos canais da invocação.",
  },

  /* ------- As novas do Adicionais (Modificadoras) ------- */
  {
    id: "defesa", nome: "Defesa", categoria: "modificadora", fonte: "adicionais",
    escala: porGrau(1, 2, 3, 4, 5), canal: "defesa", grupoEfeito: "defesa", parametros: [],
    descricao: "Recebe +1 em Defesa, aumentando em +2, +3, +4 e +5 no grau especial.",
  },
  {
    id: "nivelDano", nome: "Aumento de Nível de Dano", categoria: "modificadora", fonte: "adicionais",
    escala: porGrau(1, 2, 3, 4, 5), canal: "danoNivel", grupoEfeito: "dano", parametros: [],
    descricao: "Recebe +1 nível de dano, aumentando em +2, +3, +4 e +5 no grau especial.",
  },
  {
    /* O canal trafega o MÁXIMO do dado: 4 é 1d4, 12 é 1d12. */
    id: "danoDurante", nome: "Dano Durante o Ataque", categoria: "modificadora", fonte: "adicionais",
    escala: porGrau(4, 6, 8, 10, 12), canal: "ataqueDanoAdicional", grupoEfeito: "dano", parametros: [],
    dadoExtra: true,
    descricao: "Recebe 1d4 em dano durante o ataque, aumentando para 1d6, 1d8, 1d10 e 1d12 no grau especial.",
  },
  {
    id: "curaBonus", nome: "Aumento de Cura", categoria: "modificadora", fonte: "adicionais",
    escala: porGrau(2, 4, 6, 8, 10), canal: "curaBonus", grupoEfeito: "cura", parametros: [],
    descricao: "Recebe +2 de cura, aumentando em +4, +6, +8 e +10 no grau especial.",
  },
  {
    id: "arsenal", nome: "Arsenal", categoria: "modificadora", fonte: "adicionais",
    escala: porGrau(2, 4, 6, 8, 10), canal: null, grupoEfeito: "arsenal", parametros: [],
    descricao: "Recebe a capacidade de armazenar 2 itens com ela, aumentando em +4, +6, +8 e +10 no grau especial.",
  },
  {
    id: "estiloCombate", nome: "Estilo de Combate", categoria: "modificadora", fonte: "adicionais",
    escala: null, canal: null, grupoEfeito: "estiloCombate", parametros: ["atributo"],
    descricao: "Permite que sua invocação utilize outro Atributo para Jogadas de Ataque, CD e Defesa.",
  },
  {
    id: "resilienciaAlternativa", nome: "Resiliência Alternativa", categoria: "modificadora", fonte: "adicionais",
    escala: null, canal: null, grupoEfeito: "resiliencia", parametros: ["atributo"],
    descricao: "O atributo usado para definir os pontos de vida da invocação é trocado para o escolhido.",
  },
  {
    id: "resistenciaDano", nome: "Resistência", categoria: "modificadora", fonte: "adicionais",
    escala: null, canal: null, grupoEfeito: "resistenciaDano", parametros: ["tipoDano"],
    descricao: "A invocação recebe resistência ao tipo de dano escolhido. Requer um Feitiço Passivo do dono que garanta a mesma resistência.",
  },

  /* ------- As Intrínsecas do Adicionais (Etapa 6) -------
     A maioria é regra de mesa: o catálogo guarda o texto e a escolha, e a ficha
     mostra. As que viram número ou estado estão marcadas no `efeito`:
       voo, nado        deslocamento novo, igual ao de caminhada
       alcanceAuxiliar  o auxílio deixa de usar o alcance reduzido
       emTarefa         a mesa ganha o interruptor "Em Tarefa" (fora da contagem)
       formaArma, formaArmadura  a mesa ganha a Forma
       laceracao        número: grau × 5, mínimo 1
       corridaPerfurante número: o teto de dados
       percebeAlma      a invocação vê, cura e fere a alma
     `requisitos`: tamanhoMin (resolvido), requer (outra Característica da
     invocação), tipos (tipos de invocação), armaTreinada (o dono é treinado na
     arma), confirmacao (marca manual na Característica). */
  ...[
    ["inteligente", "Inteligente", null, {}, [],
      "Possui inteligência para falar e se comunicar de forma clara, assim como expressar emoções. As informações que as Invocações com esta Característica recebem são automaticamente repassadas ao Invocador caso ele esteja em até 18m dela."],
    ["bemTreinada", "Bem Treinada", "emTarefa", {}, [],
      "Ela pode obedecer comandos simples como \"Proteja um Local\" ou \"Deixe um objeto ou uma pessoa em um local, desde que saiba o caminho\". Enquanto ela obedece esse comando e não está em um combate no qual você participa, ela não é considerada como uma Invocação em Campo. Se ela for dissipada ou exorcizada, você sente seu desaparecimento."],
    ["invocacaoRapida", "Invocação Rápida", null, {}, [],
      "Você consegue invocar ela durante a iniciativa."],
    ["polegaresOpositores", "Polegares Opositores", null, {}, [],
      "Sua invocação tem a capacidade de segurar e pode usar itens, desde que não seja: Escudos, Uniformes e Armas. Eles não recebem benefícios de itens, mas como uma ação Complexa pode utilizar o item em um personagem."],
    ["alado", "Alado", "voo", {}, [], "A invocação recebe deslocamento de voo."],
    ["nadador", "Nadador", "nado", {}, [], "A invocação recebe deslocamento de nado."],
    ["imparavel", "Imparável", null, {}, [],
      "A invocação ignora terreno difícil (Terrestre) ao se mover e não pode ter o seu movimento reduzido."],
    ["montaria", "Montaria", null, { tamanhoMin: "medio" }, [],
      "A invocação pode servir como uma montaria. Montar-se na invocação é uma ação de movimento, mas o permite se mover utilizando a ação e valor de movimento da invocação. Uma invocação deve ser pelo menos média em tamanho para receber essa característica."],
    ["escalador", "Escalador", null, {}, [],
      "A invocação ignora terreno difícil (Escalada) ao se mover e não pode ter o seu movimento reduzido."],
    ["bolaDemolicao", "Bola de Demolição", null, {}, [],
      "A invocação tem uma capacidade maior de causar dano a estruturas e objetos às considerando vulneráveis."],
    ["alcanceAuxiliar", "Alcance Auxiliar", "alcanceAuxiliar", {}, [],
      "Suas ações de auxílio usam o alcance normal sem precisar seguir a regra de redução."],
    ["formaArma", "Forma de Arma", "formaArma", { armaTreinada: true }, ["arma"],
      "Como Ação Simples, a invocação pode se transformar em uma arma a escolha, seguindo a descrição exata da arma escolhida. O custo da Arma segue o Grau da Invocação. Você usa suas ações para atacar, com o tipo de dano e o dado de dano da ação complexa da invocação. Ela ainda conta como Invocação em Campo e pode ser alvo de ataques. O portador pode gastar sua Reação para levar o dano completo de um ataque de alvo único que mire na Arma, ignorando suas RDs. As Características dela não se aplicam ao portador, a não ser que afetem aliados."],
    ["formaArmadura", "Forma de Armadura", "formaArmadura", { tipos: ["marionete"] }, ["armadura"],
      "A invocação se transforma em uma armadura ou uniforme à escolha, seguindo o grau da invocação. Caso você receba o dano de um ataque, sua armadura recebe a metade do dano. Caso receba um ataque crítico, ambos recebem o dano completo. Você recebe apenas os efeitos de suas Características não numéricas, com exceção das que afetem aliados."],
    ["encantada", "Encantada", null, { requer: ["formaArma", "formaArmadura"] }, ["encantamento"],
      "Ela possui um encantamento."],
    ["liderHorda", "Líder de Horda", null, { requer: ["inteligente"] }, [],
      "Escolha uma invocação que esteja na horda: você recebe uma característica desse shikigami a sua escolha enquanto ele se mantiver na horda. Essa característica não pode ser trocada até o término da missão."],
    ["pincaPotente", "Pinça Potente", null, {}, [],
      "Caso o oponente esteja contra a parede, a estrutura também sofre dano, porém Fragilizada."],
    ["amorfo", "Amorfo", null, {}, [],
      "A invocação é amorfa, capaz de modificar a aparência e seus atributos físicos a bel prazer. Em um descanso curto ou longo, ela pode trocar os Valores de seus Atributos Físicos de lugar e mudar sua aparência."],
    ["qualidade", "Qualidade", null, {}, [],
      "Sempre que for realizar uma ação complexa que requer um acerto ou force uma TR do alvo, pode escolher consumir +1 ação complexa adicional, para receber vantagem no acerto ou conceder desvantagem na TR do alvo."],
    ["laceracaoConstante", "Laceração Constante", "laceracao", {}, [],
      "Ao agarrar uma Criatura, a Invocação enfraquece a cura dela. Enquanto estiver agarrada toda a Cura da Criatura é reduzida em Grau da Invocação × 5, com o mínimo de 1. Não se acumula com o efeito que reduz a cura do alvo: fica a maior redução."],
    ["presencaIrritante", "Presença Irritante", null, {}, [],
      "Jogadas de Ataque e TRs feitos a um único Aliado adjacente à Invocação, à escolha do Controlador, têm Vantagem e Desvantagem respectivamente. Enquanto a Invocação prover esse benefício, Jogadas de Ataque e TRs feitos à Invocação têm Vantagem e Desvantagem, respectivamente."],
    ["bioluminescencia", "Bioluminescência", null, {}, [],
      "A Invocação produz sua própria luz. Ao ser invocada, ela reduz a escuridão em uma área de 9m em volta de si em um grau (Escuridão Total, Escuridão Leve, Sem Escuridão)."],
    ["autotomia", "Autotomia", null, {}, [],
      "Quando for Agarrada, pode desprender a parte do corpo segurada, encerrando imediatamente o Agarramento (uma vez por cena). O membro removido é recuperado em um Descanso Longo."],
    ["sentidoCegas", "Sentido às Cegas", null, {}, ["percepcao"],
      "Ignora a escuridão parcial e total, possuindo olhos especiais ou outros sentidos aguçados, com um dos tipos de percepção especial do Livro de Regras, à escolha."],
    ["tracadoAlma", "Perceber o Traçado da Alma", "percebeAlma", { confirmacao: "donoVeAlma" }, [],
      "Tem a capacidade de ver, entender, curar e causar dano na alma. Requer que o invocador veja, compreenda e seja capaz de dar dano na alma."],
    ["corridaPerfurante", "Corrida Perfurante", "corridaPerfurante", {}, [],
      "Para cada 6m percorridos em linha reta, a Invocação recebe 1d6 de dano durante o ataque, limitado ao seu Modificador de atributo de dano."],
  ].map(([id, nome, efeito, requisitos, parametros, descricao]) => ({
    id, nome, categoria: "intrinseca", fonte: "adicionais",
    escala: null, canal: null, grupoEfeito: id, parametros, requisitos, efeito, descricao,
    ...(id === "corridaPerfurante" ? { dadoExtra: true } : {}),
  })),

  /* ------- As Auras do Adicionais (Etapa 6) -------
     "Características usadas para beneficiar criaturas que estejam a 4,5m das
     invocações. Uma invocação só pode conceder auras a partir do 2° Grau. Auras
     não podem causar prejuízos à criaturas."
     ⚠ O app não tem posição, então a aura NÃO vale sozinha em ninguém: a mesa
     liga "Na Aura" para o dono, e o efeito vai pelo `canalDono`. Duas auras iguais
     não acumulam (vale a maior), e a aura não vale na própria invocação. */
  ...[
    ["auraAcerto", "Aura de Acerto", porGrau(0, 0, 1, 2, 3), "bonusAcerto", "ataque",
      "Recebe +1 em Jogada de Ataque (Especificar), aumentando em +2 e +3 no Primeiro Grau e Grau Especial."],
    ["auraDefesa", "Aura de Defesa", porGrau(0, 0, 1, 2, 3), "defesa", null,
      "Recebe +1 em Defesa, aumentando em +2 e +3 no Primeiro Grau e Grau Especial."],
    ["auraTR", "Aura de TR", porGrau(0, 0, 1, 2, 3), "bonusTR", "tr",
      "Recebe +1 em TR (Especificar), aumentando em +2 e +3 no Primeiro Grau e Grau Especial."],
    ["auraPericia", "Aura de Perícia", porGrau(0, 0, 2, 4, 6), "bonusPericia", "pericia",
      "Recebe +2 em Perícia (Especificar), aumentando em +4 e +6 no Primeiro Grau e Grau Especial."],
    ["auraRD", "Aura de RD", porGrau(0, 0, 2, 4, 6), "rdTipo", "tipoDano",
      "Recebe +2 em RD (Especificar), aumentando em +4 e +6 no Primeiro Grau e Grau Especial."],
    ["auraDano", "Aura de Dano Durante o Ataque", porGrau(0, 0, 4, 6, 8), "dadosNomeados", null,
      "Recebe 1d4 em dano durante o ataque, aumentando para 1d6 e 1d8 no Primeiro Grau e Grau Especial."],
  ].map(([id, nome, escala, canalDono, alvoParam, descricao]) => ({
    id, nome, categoria: "aura", fonte: "adicionais",
    escala, canal: null, canalDono, alvoParam, grauMin: "segundo", alcance: 4.5,
    grupoEfeito: id, parametros: alvoParam ? [alvoParam] : [], descricao,
    ...(id === "auraDano" ? { dadoExtra: true } : {}),
  })),
];

/** As Características que podem dar dado extra: só as autorizadas por fonte. */
export const CARACTERISTICAS_COM_DADO_EXTRA = new Set(
  CARACTERISTICAS_INVOCACAO.filter((c) => c.dadoExtra).map((c) => c.id),
);

/** A entrada do catálogo daquele id, ou `null`. */
export const caracteristicaDoCatalogo = (id) => CARACTERISTICAS_INVOCACAO.find((c) => c.id === id) ?? null;

/** O valor da escala no grau, ou `null` quando a Característica não tem escala. */
export function valorPorGrau(entrada, grau) {
  if (!entrada?.escala) return null;
  const v = entrada.escala[grau];
  return Number.isFinite(v) ? v : null;
}

/**
 * Confere o catálogo: ids únicos, escala cobrindo os cinco graus, e canal só em
 * quem tem escala. O nome do canal é conferido pelo `validarCatalogoInvocacoes`,
 * que conhece a lista de canais (este arquivo não importa nada).
 */
export function validarCatalogoCaracteristicasInvocacao() {
  const erros = [];
  const ids = new Set();
  for (const c of CARACTERISTICAS_INVOCACAO) {
    if (!c.id) { erros.push("característica sem id"); continue; }
    if (ids.has(c.id)) erros.push(`${c.id}: id duplicado`);
    ids.add(c.id);
    if (!c.nome) erros.push(`${c.id}: sem nome`);
    if (c.escala) {
      for (const g of GRAUS) if (!Number.isFinite(c.escala[g])) erros.push(`${c.id}: escala sem o grau "${g}"`);
    }
    if (c.canal && !c.escala) erros.push(`${c.id}: canal sem escala`);
  }
  return erros;
}
