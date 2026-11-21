/* As Posturas de Combate do Assumir Postura (Combatente), o catálogo puro.

   ⚠ MÓDULO FOLHA, ZERO IMPORTS (2026-11-21). Saiu do afty-habilidades porque o afty-combate monta as opções da bancada
   (`POSTURA_OPCOES`) com ele no escopo de módulo. Quando o navegador entra no ciclo pelo afty-habilidades (a Ficha G2, por
   ui/armas-transformaveis, ficha-sessao e afty-concessao), o corpo do afty-combate roda antes do corpo do habilidades, e o
   array lido de lá estava na zona morta: "Cannot access 'POSTURAS_DE_COMBATE' before initialization". Daqui ele já existe.
   O afty-habilidades o reexporta, então quem importava de lá segue igual. Lista e motivo em asserts/t-ordem-modulos.mjs. */

/**
 * Posturas de Combate do Assumir Postura (Combatente). Segunda escolha
 * ANINHADA do sistema (a 1ª são os Estilos): aprende 1 ao obter, mais um
 * nos níveis 8 e 16, e a habilidade Aprender Postura concede mais (4 e 10).
 *
 * ⚠ `nivelMin` são os pré-requisitos "Pré-Requisito: Nível N" das últimas
 * três posturas. Conferido desde 2026-09-23 contra o nível de ESCALONAMENTO do
 * Combatente (o nível nele mais a metade das outras classes), por decisão do
 * autor. Ver `resolveEscolhasHabilidade`.
 */
export const POSTURAS_DE_COMBATE = [
  {
    id: "cmb_postura_do_sol",
    nome: "Postura do Sol",
    descricao:
      "Uma postura que foca na ofensiva, sacrificando sua defesa. Enquanto na postura do sol, " +
      "todos seus ataques recebem +2 para acertar e causam um dado de dano a mais. Entretanto, " +
      "sua Defesa diminui em 4.",
  },
  {
    id: "cmb_postura_da_lua",
    nome: "Postura da Lua",
    descricao:
      "Uma postura que foca na defesa, sacrificando sua ofensiva. Enquanto na postura da lua, " +
      "você recebe +3 de Defesa, você pode usar Andar ou Desengajar como ação livre e pode, como " +
      "uma reação, reduzir um dano que você receber em um valor igual ao seu nível de personagem. " +
      "Entretanto, todos seus ataques recebem -4 para acertar e não recebem seu bônus de atributo " +
      "no dano.",
  },
  {
    id: "cmb_postura_da_terra",
    nome: "Postura da Terra",
    descricao:
      "Uma postura que foca na resistência e durabilidade. Enquanto na postura da terra você não " +
      "pode ser movido a força, soma seu bônus de treinamento em rolagens de Fortitude e, no " +
      "começo do seu turno, você recebe pontos de vida temporários igual ao seu nível de personagem.",
  },
  {
    id: "cmb_postura_do_dragao",
    nome: "Postura do Dragão",
    descricao:
      "Enquanto na postura do dragão, sempre que realizar um ataque, todo inimigo dentro de 1,5 " +
      "metros do alvo desse ataque deve realizar um TR de Fortitude ou recebe metade do dano que " +
      "o alvo recebeu.",
  },
  {
    id: "cmb_postura_da_fortuna",
    nome: "Postura da Fortuna",
    descricao:
      "Enquanto estiver na postura da fortuna, ao rodar um d20 e conseguir um resultado igual ou " +
      "menor ao seu bônus de treinamento, você pode escolher o rolar novamente, ficando com o " +
      "maior resultado. Você pode utilizar este efeito uma quantidade de vezes igual a metade do " +
      "seu bônus de treinamento por rodada e apenas uma vez no mesmo dado.",
  },
  {
    id: "cmb_postura_da_devastacao",
    nome: "Postura da Devastação",
    descricao:
      "Enquanto na postura da devastação, para cada golpe acertado contra o mesmo alvo, você " +
      "recebe +1 em acerto e ignora 2 de redução de dano, até um máximo igual ao seu bônus de " +
      "treinamento para o acerto e o dobro dele para a redução de dano. Se você trocar de alvo uma " +
      "vez, retorna ao zero.",
    nivelMin: 6,
  },
  {
    id: "cmb_postura_da_tempestade",
    nome: "Postura da Tempestade",
    descricao:
      "Enquanto na postura da tempestade, sempre que acertar um ataque o alvo realiza um TR de " +
      "Fortitude, sendo derrubado em uma falha. Caso acerte um ataque em um alvo já caído, ele " +
      "deve repetir o teste e, caso falhe, fica imóvel até o começo do seu turno.",
    nivelMin: 10,
  },
  {
    id: "cmb_postura_do_ceu",
    nome: "Postura do Céu",
    descricao:
      "Uma postura balanceada, que apenas acentua suas capacidades essenciais. Enquanto na " +
      "postura do céu, o alcance dos seus ataques é dobrado, você recebe 2 pontos de preparo " +
      "temporários no começo de todo turno e +2 em todas as suas rolagens de perícia.",
    nivelMin: 12,
  },
];
