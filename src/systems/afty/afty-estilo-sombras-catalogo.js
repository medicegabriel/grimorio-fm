/**
 * ============================================================
 * CATÁLOGO DO NOVO ESTILO DAS SOMBRAS (Expansão, F&M 2.5)
 * ============================================================
 * ⚠ FOLHA: zero imports. O `afty-estilo-sombras.js` o importa, e o criador
 * importa os dois. Ver `asserts/t-ordem-modulos.mjs`.
 *
 * É DADO, e não regra escrita em `if`: a progressão, os efeitos, as
 * modificações de Aptidão e os degraus vivem aqui, e o resolvedor só lê.
 * Decisões do autor em `docs/afty-estilo-sombras.md` (2026-10-04).
 * ============================================================
 */

/* ============================================================ */
/* REGRA DA TÉCNICA                                              */
/* ============================================================ */
/**
 * Toda Técnica de Estilo declara a regra pela qual é calculada (DA-05, DA-06).
 *
 *   legacy   o modelo de 2026-08-10: cada efeito era uma Técnica, a combinação
 *            se montava na mesa por imbuição, e a Técnica gastava o contador de
 *            Habilidades. É a regra de TODA Técnica gravada antes de 2026-10-04 e
 *            de toda Técnica de Addon que não declare outra.
 *   expansao o modelo da Expansão: a Técnica é um PACOTE com os efeitos dentro,
 *            e as Técnicas têm progressão própria.
 *
 * ⚠ A ausência do campo é `legacy`. Nenhuma Técnica antiga é reescrita: a regra
 * só muda pelo botão de conversão, à mão.
 */
export const REGRA_LEGACY = "legacy";
export const REGRA_EXPANSAO = "expansao";

/** A regra de uma Técnica gravada. Só `expansao` escrito por extenso vale. */
export const regraDaTecnica = (t) => (t?.regra === REGRA_EXPANSAO ? REGRA_EXPANSAO : REGRA_LEGACY);

/** Os dois tipos de Técnica da Expansão (DA-02). */
export const TIPO_MODIFICACAO = "modificacao";
export const TIPO_ESPECIAL = "especial";

/* ============================================================ */
/* PROGRESSÃO (DA-03)                                            */
/* ============================================================ */
/**
 * "No 4° nível, ao receber o Domínio Simples, você recebe também duas Técnicas
 * de Estilo. Nos níveis 7, 10, 13, 16 e 19 você recebe uma Técnica de Estilo
 * adicional." Igual no Livro (seção do Estilo) e na Expansão.
 *
 * ⚠ O texto da ORIGEM Sem Técnica no Livro diz outra coisa ("uma Técnica de
 * Estilo... nos níveis 8, 12, 16 e 20"). O autor escolheu esta (DA-03), e a
 * outra fica registrada como divergência de fonte no guia da área.
 *
 * ⚠ Para no 19, porque o texto para no 19.
 */
export const PROGRESSAO_TECNICAS = Object.freeze({
  inicio: 4,
  base: 2,
  extras: Object.freeze([7, 10, 13, 16, 19]),
});

/**
 * Quantas Técnicas a progressão dá no nível, com as parcelas para o hover.
 * `{ total, partes: [{ label, valor }] }`. Abaixo do 4 é zero e sem parcela.
 */
export function tecnicasDaProgressao(nd) {
  const n = Math.trunc(Number(nd) || 0);
  if (n < PROGRESSAO_TECNICAS.inicio) return { total: 0, partes: [] };
  const partes = [{ label: `Nível ${PROGRESSAO_TECNICAS.inicio}`, valor: PROGRESSAO_TECNICAS.base }];
  for (const nivel of PROGRESSAO_TECNICAS.extras) {
    if (n >= nivel) partes.push({ label: `Nível ${nivel}`, valor: 1 });
  }
  return { total: partes.reduce((s, p) => s + p.valor, 0), partes };
}

/* ============================================================ */
/* ESCOLHAS DOS EFEITOS "(ESPECIFICAR)"                          */
/* ============================================================ */
/* Os ids são os do motor: `AFTY_ATAQUES` (afty-pericias-catalogo.js) e
   `AFTY_RESISTENCIAS` (afty-schema.js). Repetidos aqui porque esta folha não
   importa nada. A Perícia vem do catálogo de perícias, pela tela. */

/** ⚠ PROVISÓRIO: o que o "(ESPECIFICAR)" do Bônus de Acerto especifica é
    NOVA DECISÃO NECESSÁRIA (`a-fazer.md`). O tipo de ataque é a única forma que o
    canal `bonusAcerto` já sabe. */
export const ESCOLHA_ATAQUE = Object.freeze([
  { id: "corpo", nome: "Corpo a Corpo" },
  { id: "distancia", nome: "A Distância" },
  { id: "amaldicoado", nome: "Amaldiçoado" },
]);

export const ESCOLHA_TR = Object.freeze([
  { id: "fortitude", nome: "Fortitude" },
  { id: "reflexos", nome: "Reflexos" },
  { id: "vontade", nome: "Vontade" },
  { id: "astucia", nome: "Astúcia" },
  { id: "integridade", nome: "Integridade" },
]);

/* ============================================================ */
/* EFEITOS DA MODIFICAÇÃO DO DOMÍNIO SIMPLES                     */
/* ============================================================ */
/* Texto VERBATIM da Expansão. Cada compra de efeito ocupa `custo` vagas.

     repeticao   o que a compra repetida faz, POR EFEITO (decisão do autor: não
                 assumir que repetir dobra):
                   "soma"     cada compra soma o valor de novo
                   "aliados"  a 2ª compra estende o mesmo valor aos aliados
                              dentro do Domínio, e NÃO soma no usuário
                   "unica"    uma compra só
     max         teto de compras (por escolha, quando o efeito tem escolha).
                 `null` = sem teto: quem limita é a vaga da Técnica.
     escolha     "tr" | "pericia" | "ataque" | null. O teto e a soma contam POR
                 escolha: TR de Reflexos e TR de Vontade são compras separadas.
     canal/expr  o que o efeito escreve no Motor do usuário. `expr(n)` recebe
                 quantas compras há no grupo. Sem canal = número de mesa.
     leAptidao   a trilha que o efeito lê, para o Pré-Requisito. `null` = o
                 efeito escala por BT ou é fixo, e o Pré-Requisito não tem o
                 que aumentar nele.
     aceitaBonusPreRequisito  `false` onde o autor proibiu (Ataque com Gatilho).
     aliados     o rótulo do número de mesa dos aliados (só "aliados").
     automacao   "A" automático, "M" manual, "P" parcial. */

const METADE_BT = "piso(bt / 2)";

export const EFEITOS_ESTILO = [
  {
    id: "defesa",
    nome: "Aumento de Defesa",
    descricao:
      "O usuário do Domínio Simples recebe um aumento em sua Defesa igual a metade do seu BT, " +
      "enquanto ele estiver ativo. Este efeito pode ser colocado mais uma vez, passando a conceder " +
      "o Aumento de Defesa também para aliados dentro do Domínio Simples.",
    custo: 1, repeticao: "aliados", max: 2, escolha: null,
    canal: "defesa", expr: () => METADE_BT,
    leAptidao: null, aceitaBonusPreRequisito: true,
    aliados: "Defesa dos Aliados no Domínio", automacao: "A",
  },
  {
    id: "tr",
    nome: "Aumento de TR",
    descricao:
      "O usuário do Domínio Simples recebe um aumento em sua TR igual a metade do seu BT, enquanto " +
      "ele estiver ativo. Este efeito pode ser colocado mais uma vez, passando a conceder o Aumento " +
      "de TR também para aliados dentro do Domínio Simples.",
    custo: 1, repeticao: "aliados", max: 2, escolha: "tr",
    canal: "bonusTR", expr: () => METADE_BT,
    leAptidao: null, aceitaBonusPreRequisito: true,
    aliados: "TR dos Aliados no Domínio", automacao: "A",
  },
  {
    id: "acerto",
    nome: "Bônus de Acerto",
    descricao:
      "O usuário do Domínio Simples recebe um bônus igual a metade do seu BT em jogadas de ataque " +
      "que realizar enquanto o Domínio Simples estiver ativo. Este efeito pode ser colocado mais " +
      "vezes, aumentando o bônus.",
    // Cada compra soma outra metade do BT, a mesma leitura que o autor deu à
    // imbuição repetida em 2026-08-07.
    custo: 1, repeticao: "soma", max: null, escolha: "ataque",
    canal: "bonusAcerto", expr: (n) => `${METADE_BT} * ${n}`,
    leAptidao: null, aceitaBonusPreRequisito: true, automacao: "A",
  },
  {
    id: "margem",
    nome: "Bônus de Margem Crítica",
    descricao:
      "O usuário do Domínio Simples recebe um bônus igual a -1 na margem crítica no nível 5, no nível " +
      "13 sua margem crítica é reduzida em -2. Caso coloque este efeito novamente ele é aplicado a " +
      "todos os aliados dentro do Domínio Simples.",
    // ⚠ Antes do Nível 5 o texto não dá número: NOVA DECISÃO NECESSÁRIA
    // (`a-fazer.md`). Até a resposta, nada no Nível 4. O canal `margemCritico`
    // guarda quanto a margem DIMINUI.
    custo: 1, repeticao: "aliados", max: 2, escolha: null,
    canal: "margemCritico", expr: () => "(nd >= 5) + (nd >= 13)",
    leAptidao: null, aceitaBonusPreRequisito: true,
    aliados: "Margem Crítica dos Aliados no Domínio", automacao: "A",
  },
  {
    id: "pericia",
    nome: "Aumento de Perícia",
    descricao:
      "O usuário do Domínio Simples recebe um aumento em sua Perícia igual a metade do seu BT, " +
      "enquanto ele estiver ativo. Este efeito pode ser colocado mais uma vez, passando a conceder " +
      "o Aumento na perícia também para aliados dentro do Domínio Simples.",
    custo: 1, repeticao: "aliados", max: 2, escolha: "pericia",
    canal: "bonusPericia", expr: () => METADE_BT,
    leAptidao: null, aceitaBonusPreRequisito: true,
    aliados: "Perícia dos Aliados no Domínio", automacao: "A",
  },
  {
    id: "dano",
    nome: "Dano Adicional",
    descricao:
      "Os ataques do usuário do Domínio Simples tem seu dano aumentado em 2 níveis enquanto ele " +
      "estiver ativo. Este dano é considerado Durante Ataque e o efeito pode ser colocado mais de " +
      "uma vez, aumentando +2 níveis para cada outra vez.",
    custo: 1, repeticao: "soma", max: null, escolha: null,
    canal: "nivelDano", expr: (n) => `2 * ${n}`,
    leAptidao: null, aceitaBonusPreRequisito: true, automacao: "A",
  },
  {
    id: "alcance",
    nome: "Alcance Adicional",
    descricao:
      "O alcance das Jogadas de Ataque do usuário do Domínio Simples aumentado em 3 metros ao ser ativo.",
    // Sem cláusula de repetição no texto.
    custo: 1, repeticao: "unica", max: 1, escolha: null,
    canal: "alcanceArma", expr: () => "3",
    leAptidao: null, aceitaBonusPreRequisito: true, automacao: "A",
  },
  {
    id: "deslocamento",
    nome: "Deslocamento Adicional",
    descricao:
      "O deslocamento do usuário do Domínio Simples aumentado em 4,5 metros ao ser ativo. Este efeito " +
      "pode ser colocado mais uma vez, passando a conceder o Aumento de deslocamento também para " +
      "aliados dentro do Domínio Simples.",
    custo: 1, repeticao: "aliados", max: 2, escolha: null,
    canal: "movimento", expr: () => "4.5",
    leAptidao: null, aceitaBonusPreRequisito: true,
    aliados: "Deslocamento dos Aliados no Domínio", automacao: "A",
  },
  {
    id: "gatilho",
    nome: "Ataque com Gatilho",
    descricao:
      "O Domínio Simples pode realizar um ataque por rodada como Ação Livre, ao atender um gatilho " +
      "específico, como uma criatura inimigo adentrar na área do seu Domínio Simples. Este efeito " +
      "pode ser colocado mais de uma vez, aumentando a quantidade de ataques.",
    // Número de mesa (ataques por rodada). O canal `ataquesExtras` é a ação
    // comum, e somaria no número errado. Pré-Requisito proibido (autor).
    custo: 1, repeticao: "soma", max: null, escolha: null,
    canal: null, contagem: "ataquesComGatilho",
    leAptidao: null, aceitaBonusPreRequisito: false, automacao: "M",
  },
  {
    id: "cd",
    nome: "Bônus de CD",
    descricao:
      "O usuário do Domínio Simples recebe um bônus igual a metade do seu BT em jogadas de ataque " +
      "que realizar enquanto o Domínio Simples estiver ativo. Este efeito pode ser colocado mais " +
      "vezes, aumentando o bônus.",
    notaAutor:
      "Soma na CD. A frase \"em jogadas de ataque\" é erro de cópia do Bônus de Acerto (decisão do " +
      "autor, 2026-10-04).",
    custo: 1, repeticao: "soma", max: null, escolha: null,
    canal: "cd", expr: (n) => `${METADE_BT} * ${n}`,
    leAptidao: null, aceitaBonusPreRequisito: true, automacao: "A",
  },
  {
    id: "especial",
    nome: "Efeito Especial",
    descricao:
      "O Domínio Simples possui um efeito único, desenvolvido pelo Jogador e aprovado pelo Narrador. " +
      "Além da modificação do seu Domínio Simples, é possível criar Técnicas de Estilo que fujam " +
      "disso, envolvendo o uso de Aptidões Amaldiçoadas ou efeitos únicos, como a Lua Nebulosa, que " +
      "permite formar uma lâmina de energia completa a partir de uma quebrada utilizando a Aptidão " +
      "Projetar Energia, a qual também passaria a causar dano energético. Entretanto, há certas " +
      "limitações: Efeitos especiais não podem criar shikigami. Efeitos especiais não podem criar " +
      "consumíveis. Efeitos especiais não podem conceder Transformação. Efeitos especiais não podem " +
      "utilizar Feitiços Golpeadores como base. Além disso, respeite também a seção \"Feitiços " +
      "Inviáveis\", encontrada na página 238.",
    // O conteúdo mora em `tecnica.especial` (texto e linhas de Motor), e a
    // aprovação do Narrador é AVISO, nunca bloqueio.
    custo: 1, repeticao: "unica", max: 1, escolha: null,
    canal: null, especial: true,
    leAptidao: null, aceitaBonusPreRequisito: true, automacao: "P",
  },
];

/* ============================================================ */
/* MODIFICAÇÕES DE APTIDÃO                                       */
/* ============================================================ */
/* "Ao criar um Estilo da Sombra você também pode modificar e ativar Aptidões
   durante a duração do Domínio Simples... Cada um desses efeitos conta como um
   efeito adicionado ao Domínio Simples." Texto VERBATIM da Expansão.

   A Técnica guarda só a REFERÊNCIA (`{ aptidaoId, modId }`), nunca uma cópia da
   Aptidão: quando a Aptidão mudar, a Técnica acompanha.

     aptidoes     a modificação é DE uma Aptidão certa (qualquer uma da lista)
     categoria    a modificação vale para qualquer Aptidão da categoria, e a
                  pessoa escolhe qual (o `aptidaoId` gravado)
     exigeNumerico  a Aptidão escolhida precisa ter bônus numérico no Motor
     requerUmaDe  além da Aptidão, a ficha precisa de UMA destas
     requerTrilha a ficha precisa deste Nível de Aptidão
     bonus        "au" | "cl": soma `teto(trilha / 2)` em cada canal numérico da
                  Aptidão, e a 2ª compra dá o mesmo aos aliados. O texto manda
                  "arredondado para cima" (decisão do autor: não usar piso)
     numero       um número de mesa pronto ({ rotulo, expr })
     leAptidao    a trilha que a modificação lê, para o Pré-Requisito */

export const MODIFICACOES_APTIDAO = [
  {
    id: "au_bonus_numerico",
    nome: "Aura: Bônus Numérico",
    trilha: "au",
    descricao:
      "Aptidões que concedem bônus numérico recebem um aumento igual a metade do seu AU arredondado " +
      "para cima como bônus a mais, caso seja adicionado novamente você pode conceder metade do seu AU " +
      "para seus aliados dentro do Domínio Simples.",
    categoria: "aura", exigeNumerico: true, bonus: "au",
    repeticao: "aliados", max: 2, leAptidao: "au", automacao: "A",
  },
  {
    id: "au_area",
    nome: "Aura: Área do Domínio",
    trilha: "au",
    descricao:
      "Aptidões que possuem uma área limitada, tem suas áreas atualizadas para a área total do Domínio " +
      "Simples. Caso seja uma aptidão que possua bônus numérico em área, você apenas aumenta a área que " +
      "pode conceder o bônus, mas o bônus não é aumentado.",
    categoria: "aura", repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "aura_anuladora",
    nome: "Aura Anuladora no Domínio",
    trilha: "au",
    descricao:
      "Aura Anuladora pode ser usada em toda área do Domínio e pode ser usada para proteger aliados, mas " +
      "deve seguir todas as regras de gasto e uso da aptidão.",
    aptidoes: ["aura_anuladora"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "aura_embacada",
    nome: "Aura Embaçada por Movimento",
    trilha: "au",
    descricao: "Aura Embaçada pode ser usada como uma ação de Movimento ao invés de uma ação Bônus.",
    aptidoes: ["aura_embacada"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "aura_elemental",
    nome: "Aura Elemental no Domínio",
    trilha: "au",
    descricao:
      "Aura Elemental pode causar o dado de dano da aptidão + Modificador de Atributo Chave na área do " +
      "Domínio Simples no início da rodada da criatura.",
    aptidoes: ["aura_elemental"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "au_vantagem",
    nome: "Aura: Vantagem por PE",
    trilha: "au",
    descricao:
      "Auras que envolvem testes competidos ou de contra CD você pode gastar 2PE para conceder Vantagem, " +
      "caso já possa gastar PE para conceder vantagem, você acumula a vantagem podendo rolar 3d20 ou " +
      "invés de 2d20.",
    categoria: "aura", repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "transferencia_de_aura",
    nome: "Transferência de Aura para Outro Alvo",
    trilha: "au",
    descricao:
      "Transferência de Aura pode selecionar outro alvo, mas reduzindo os valores concedidos pela " +
      "metade, arredondado para cima.",
    aptidoes: ["transferencia_de_aura"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "canalizar_vantagem",
    nome: "Canalizar em Golpe com Vantagem",
    trilha: "cl",
    descricao:
      "Canalizar em Golpe concede Vantagem no seu Ataque, Errar um ataque não consome esse uso. " +
      "Exemplo: Saque Bato, que utiliza 1 nível para ativar o Canalizar em Golpe e 1 nível utilizando " +
      "ataque com gatilho.",
    aptidoes: ["canalizar_em_golpe"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "cobrir_se",
    nome: "Cobrir-se no Domínio e em Aliado",
    trilha: "cl",
    descricao: "Cobrir-se pode ser usado na área do Domínio Simples e pode ser usado em seu aliado.",
    aptidoes: ["cobrir_se"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "cl_bonus_numerico",
    nome: "Controle e Leitura: Bônus Numérico",
    trilha: "cl",
    descricao:
      "Aptidões que concedem bônus numérico recebem um aumento igual a metade do seu CL arredondado " +
      "para cima como bônus a mais, caso seja adicionado novamente você pode conceder metade do seu CL " +
      "para seus aliados dentro do Domínio Simples.",
    categoria: "controle_leitura", exigeNumerico: true, bonus: "cl",
    repeticao: "aliados", max: 2, leAptidao: "cl", automacao: "A",
  },
  {
    id: "rastreio_leitura",
    nome: "Rastreio e Leitura no Domínio",
    trilha: "cl",
    descricao:
      "Aptidões de Rastreio ou Leitura conseguem localizar os alvos dentro do Domínio Simples no ato de " +
      "sua ativação.",
    aptidoes: ["leitura_de_aura", "leitura_rapida_de_energia", "rastreio_avancado"],
    repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "armas_de_fogo",
    nome: "Munição Imbuída",
    trilha: "cl",
    descricao:
      "Por padrão você pode utilizar armas de fogo dentro do Domínio Simples e elas recebem seus " +
      "benefícios, ao ativar junto ao projetar energia, você pode imbuir a munição com os benefícios do " +
      "Domínio Simples, fazendo com que o projétil não necessite estar dentro do Domínio Simples.",
    aptidoes: ["projetar_energia"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "punho_divergente",
    nome: "Punho Divergente no Domínio",
    trilha: "cl",
    descricao:
      "Punho Divergente tem sua CD aumentada igual o seu nível de CL e ao invés de realizar o teste de " +
      "resistência na rodada seguinte, ele é aplicado na mesma rodada em que o dano foi causado.",
    // Só dentro desta Técnica: a Aptidão Punho Divergente global não muda.
    aptidoes: ["punho_divergente"], repeticao: "unica", max: 1, leAptidao: "cl",
    numero: { rotulo: "CD do Punho Divergente", expr: "cl" }, automacao: "M",
  },
  {
    id: "er_cura_area",
    nome: "Cura em Área no Domínio",
    trilha: "er",
    descricao:
      "Efeitos de cura podem ser usados em toda área do Domínio Simples, podendo curar todas as criaturas " +
      "dentro da área, contanto que você possua Liberação de Energia Reversa.",
    aptidoes: ["liberacao_de_energia_reversa"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "er_ofensiva",
    nome: "Energia Reversa Ofensiva",
    trilha: "er",
    descricao:
      "Caso queira utilizar de forma ofensiva sua aptidão de Energia reversa deve ser usada junto a outra " +
      "aptidão como Projetar Energia e Canalizar em Golpe, fazendo com que o dano do Projetar ou Canalizar " +
      "se torne Dano de Energia Reversa em vez do comum.",
    // A Aptidão referenciada é a que leva o dano (Projetar ou Canalizar), e a
    // ficha precisa ter Energia Reversa: sem as duas, não há dano reverso.
    aptidoes: ["projetar_energia", "canalizar_em_golpe"], requerTrilha: { trilha: "er", min: 1 },
    repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
  {
    id: "cortina",
    nome: "Cortina no Domínio",
    trilha: "bar",
    descricao:
      "A cortina pode ser misturada com seu Domínio Simples podendo ganhar o efeito de não poder ser " +
      "visto caso esteja dentro do Domínio Simples, não podendo aumentar o tamanho do Domínio Simples.",
    // Não escreve canal de área: o raio do Domínio não muda por construção.
    aptidoes: ["cortina"], repeticao: "unica", max: 1, leAptidao: null, automacao: "M",
  },
];

const MOD_BY_ID = Object.fromEntries(MODIFICACOES_APTIDAO.map((m) => [m.id, m]));
export const getModificacaoAptidao = (id) => MOD_BY_ID[id] ?? null;

/** "Aptidões de Domínio, como Revestimento de Domínio, não podem ser aplicadas
    em um Domínio Simples." A categoria inteira fica fora do seletor. */
export const CATEGORIA_PROIBIDA_NO_ESTILO = "dominio";

/* ============================================================ */
/* PRÉ-REQUISITOS                                                */
/* ============================================================ */
/* "Os Pré-requisitos, em vez de darem dados ou efeitos adicionais, consideram
   que sua Aptidão para um dos efeitos é aumentada em 1, 2, 3 ou 4 nos
   Pré-Requisitos Fáceis, Médios, Difíceis e Impossíveis, respectivamente. Este
   efeito não pode aumentar a quantidade de Ataques ou Contra-Ataques realizados
   por um Domínio Simples."

   Os rótulos são os do `REQUISITO_DIFICULDADE` dos Feitiços (afty-feiticos.js),
   repetidos aqui porque esta folha não importa nada. O bônus é outro: nada de
   PE nem de dado, só o Nível de Aptidão considerado para UM efeito (decisão do
   autor: não mexe na Aptidão real, não é global, não dá vaga). */
export const DIFICULDADES_PREREQ = Object.freeze([
  { value: "facil", label: "Fácil", bonus: 1 },
  { value: "medio", label: "Médio", bonus: 2 },
  { value: "dificil", label: "Difícil", bonus: 3 },
  { value: "impossivel", label: "Impossível", bonus: 4 },
]);
export const bonusDoPrerequisito = (dificuldade) =>
  DIFICULDADES_PREREQ.find((d) => d.value === dificuldade)?.bonus ?? 0;

/* Os alvos de Pré-Requisito que não são compra de efeito nem modificação de
   Aptidão têm `uid` fixo, porque são campos da Técnica. */
export const ALVO_CONTRA_ATAQUE = "contra";
export const alvoDoCritico = (id) => `critico:${id}`;

/* ============================================================ */
/* CONTRA-ATAQUE (Aptidões de Barreira)                          */
/* ============================================================ */
/* "Durante a criação do estilo, você deve definir a quantidade de contra ataques
   que serão usados, mediante ao gatilho de ter um Aliado ou si mesmo como alvo
   de um Ataque dentro da Área do Domínio Simples, utilizando seu nível de BAR,
   esses contra ataques consomem a quantidade máxima de modificações que você pode
   fazer com seu estilo (Igual ao seu Nível de BAR) e podem ser utilizados mesmo
   que o Atacante não esteja em seu Alcance de Ataque."

   Decisão do autor: cada Contra-Ataque ocupa 1 vaga, a quantidade não passa do
   Nível de BAR nem das vagas, e o Pré-Requisito não a aumenta. */
export const TEXTO_CONTRA_ATAQUE =
  "Um Efeito Especial para Barreiras é o Contra Ataque, o qual é modificado conforme seu nível de " +
  "barreira. Durante a criação do estilo, você deve definir a quantidade de contra ataques que serão " +
  "usados, mediante ao gatilho de ter um Aliado ou si mesmo como alvo de um Ataque dentro da Área do " +
  "Domínio Simples, utilizando seu nível de BAR, esses contra ataques consomem a quantidade máxima de " +
  "modificações que você pode fazer com seu estilo (Igual ao seu Nível de BAR) e podem ser utilizados " +
  "mesmo que o Atacante não esteja em seu Alcance de Ataque.";

/** Os degraus pelo Nível de BAR, verbatim. */
export const CONTRA_ATAQUE_DEGRAUS = Object.freeze([
  {
    barMin: 1, barMax: 2, resultado: "metade",
    texto:
      "Nos níveis 1 e 2 de BAR você consegue realizar uma Jogada de Ataque corpo a corpo contra a " +
      "Jogada de Ataque da criatura, em um sucesso você reduz o dano à metade.",
  },
  {
    barMin: 3, barMax: 4, resultado: "anula",
    texto:
      "Nos níveis 3 e 4 em BAR você consegue realizar uma Jogada de Ataque contra corpo a corpo a " +
      "Jogada de Ataque da criatura, em um sucesso você anula o Dano.",
  },
  {
    barMin: 5, barMax: 99, resultado: "anulaRebate",
    texto:
      "No nível 5 em BAR você consegue realizar uma Jogada de Ataque corpo a corpo contra a Jogada de " +
      "Ataque da criatura, em um sucesso você anula o Dano, e como uma ação livre uma vez por rodada você " +
      "pode rebater o dano da criatura de volta para ela, desde que você ainda não tenha visto o " +
      "resultado do dano.",
  },
]);
export const degrauDoContraAtaque = (bar) =>
  CONTRA_ATAQUE_DEGRAUS.find((d) => bar >= d.barMin && bar <= d.barMax) ?? null;

/** ⚠ Se isto vem junto do Contra-Ataque ou ocupa vaga própria é NOVA DECISÃO
    NECESSÁRIA (`a-fazer.md`). Até lá é texto, sem custo. */
export const TEXTO_BAR5_REFLEXOS =
  "Você também no nível 5 de BAR, caso seja alvo de uma TR (Fortitude ou Reflexos) de alvo único, você " +
  "pode utilizar sua rolagem de Reflexos contra a CD do ataque, em um sucesso você anular o dano.";

export const TEXTO_REACAO_REMOVIDA =
  "Utilizar um Domínio Simples que possua o efeito especial de Contra Ataque remove sua Reação " +
  "enquanto este Domínio Simples durar.";

/* ============================================================ */
/* APLICANDO CONDIÇÕES (crítico da arma)                         */
/* ============================================================ */
/* "Diferentemente das Técnicas Inatas e Marciais, o Novo Estilo da Sombra
   depende dos efeitos Críticos da sua Arma para aplicar quaisquer condições."

   ⚠ A tabela de efeitos de crítico das armas nunca foi enviada (`a-fazer.md`),
   então o requisito "possuir o efeito Crítico" e a aplicação ficam com a mesa
   (decisão do autor: manual ou parcial). Cada modificação ocupa 1 vaga. */
export const TEXTO_CONDICOES =
  "Diferentemente das Técnicas Inatas e Marciais, o Novo Estilo da Sombra depende dos efeitos Críticos " +
  "da sua Arma para aplicar quaisquer condições. Abaixo, você verá vários efeitos que podem ser " +
  "escolhidos como um dos efeitos de seu domínio simples ao possuir o efeito Crítico e realizar um " +
  "Crítico dentro da Área do Domínio Simples:";

export const CRITICO_MODS = Object.freeze([
  {
    id: "aumentarCD", nome: "Aumentar a CD do Crítico",
    descricao: "Aumentar a CD em um valor igual a sua Barreira.",
    leAptidao: "bar", numero: { rotulo: "CD do Efeito Crítico", trilha: "bar" },
  },
  {
    id: "alvoExtra", nome: "Crítico em Mais um Alvo",
    descricao: "Aplicar o efeito crítico em mais um alvo.",
    leAptidao: null,
  },
  {
    id: "condicao", nome: "Aumentar ou Mudar a Condição",
    descricao:
      "Aumentar o nível de uma condição em 1 ou mudar a condição, contanto que não aumente para " +
      "Extremo (Fraca > Média > Fortes) e que faça sentido dentro da utilização da Arma.",
    leAptidao: null,
  },
]);

const EFEITO_BY_ID = Object.fromEntries(EFEITOS_ESTILO.map((e) => [e.id, e]));
export const getEfeitoEstilo = (id) => EFEITO_BY_ID[id] ?? null;

/** A chave de grupo de uma compra: o efeito, mais a escolha quando há. */
export const chaveDaCompra = (compra) => {
  const def = getEfeitoEstilo(compra?.efeitoId);
  const alvo = def?.escolha ? compra?.escolha?.[def.escolha] : null;
  return alvo ? `${compra.efeitoId}:${alvo}` : String(compra?.efeitoId ?? "");
};
