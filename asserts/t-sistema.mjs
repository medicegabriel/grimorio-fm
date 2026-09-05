/* A ROTA /Player nasceu em 2026-08-30, e ela é o Grimório Afty lido pelo lado do
   jogador. Decisão do autor no mesmo dia: nada de cópia dos 71 arquivos, os dois
   sistemas rodam o MESMO código com uma chave de sistema.

   O que este arquivo mede é justamente o que a decisão custa. Compartilhar
   código significa que uma mudança pega os dois, então a pergunta que importa
   não é "o Player funciona", é:

     1. HOJE ELE É CLONE EXATO? Nenhuma divergência está ativa, então as duas
        fichas têm de derivar número por número igual. É o assert que dá sentido
        à palavra "clone" do pedido, e é o que vai FALHAR de propósito no dia em
        que a primeira divergência entrar, dizendo quais números se mexeram.

     2. AS CHAVES DE STORAGE SE VEEM? O autor escolheu fichas isoladas. Três
        chaves colidiam, e duas foram consertadas: o rascunho de ficha nova (o
        alvo literal "new" existe nos dois) e o tema global. A terceira, a
        biblioteca de Addons, é decisão de regra e segue compartilhada.

     3. O SISTEMA VEM DA FICHA, E NÃO DA ROTA? É a regra que faz o encontro
        misto funcionar, já que o combatente guarda a ficha inteira e a mesma
        tela renderiza os dois sistemas lado a lado.

   Ver src/systems/afty/afty-sistema.js. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "afty-sistema.js");
const H = await import(R + "afty-habilidades.js");
const E = await import(R + "afty-especializacoes.js");
const P = await import(R + "afty-pericias.js");
const SCH = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O catálogo de sistemas                                     */
/* ============================================================ */

t("o validador do catalogo passa limpo", S.validarSistemas(), []);
t("sao exatamente dois sistemas", S.SISTEMA_IDS, ["afty", "player"]);
t("o padrao e o Afty", S.SISTEMA_PADRAO, "afty");

/* Lixo cai no padrão em vez de quebrar, que é a convenção do resto do sistema
   (a DSL cai no fallback, o tema cai no branco, o rascunho ilegível some). */
for (const lixo of [null, undefined, "", "2.5.2", "PLAYERR", 7, {}, []]) {
  t(`entrada suja ${JSON.stringify(lixo)} cai no padrao`, S.normalizaSistema(lixo), "afty");
}
t("mas o nome certo passa, sem ligar para a caixa", S.normalizaSistema("PLAYER"), "player");

/* ============================================================ */
/* 2. O sistema vem da FICHA                                     */
/* ============================================================ */

t("ficha de player se declara player", S.sistemaDaFicha({ rulesVersion: "player" }), "player");
t("ficha de criatura se declara afty", S.sistemaDaFicha({ rulesVersion: "afty" }), "afty");
t("ficha sem marca cai no afty", S.sistemaDaFicha({}), "afty");
t("ficha inexistente nao quebra", S.sistemaDaFicha(null), "afty");
/* ⚠ Ficha da 2.5.2 não abre neste builder, mas se chegar não pode explodir. */
t("ficha da 2.5.2 cai no afty", S.sistemaDaFicha({ rulesVersion: "2.5.2" }), "afty");
t("ehPlayer le a ficha inteira", S.ehPlayer(S.sistemaDaFicha({ rulesVersion: "player" })), true);

/* ============================================================ */
/* 3. AS CHAVES DE STORAGE NÃO SE VEEM                           */
/* ============================================================ */

t("o sufixo do afty e o que as chaves ja gravadas usam", S.sufixoDeChave("afty"), "_afty");
t("e o do player e proprio", S.sufixoDeChave("player"), "_player");
t("os dois sufixos sao diferentes",
  S.sufixoDeChave("afty") !== S.sufixoDeChave("player"), true);

/* ⚠ A COLISÃO REAL do rascunho: ficha existente tem id único e nunca colidiria,
   mas a ficha NOVA usa o alvo literal "new" nos DOIS sistemas. Sem sufixo,
   começar uma criatura e depois começar um personagem jogaria um rascunho por
   cima do outro, calado e sem desfazer. */
const { chaveDoRascunho } = await import(R + "afty-rascunho.js");
t("o rascunho de ficha nova NAO colide entre os sistemas",
  chaveDoRascunho(null, "afty") !== chaveDoRascunho(null, "player"), true);
t("e a chave do afty continua a que ja esta gravada desde 2026-07-15",
  chaveDoRascunho(null, "afty"), "fm_builder_draft_afty_v1:new");
t("a do player e propria", chaveDoRascunho(null, "player"), "fm_builder_draft_player_v1:new");
/* Sem sistema declarado a chave é a do Afty, e é o que preserva o rascunho de
   quem já usava o app antes desta data. */
t("sem sistema, a chave e a historica", chaveDoRascunho(null), "fm_builder_draft_afty_v1:new");
t("ficha existente carrega o id no lugar do new",
  chaveDoRascunho("abc123", "player"), "fm_builder_draft_player_v1:abc123");

/* ============================================================ */
/* 4. O CLONE: com zero divergências ativas, os dois derivam IGUAL */
/* ============================================================ */

/* ⚠ ESTE É O ASSERT QUE DÁ SENTIDO À PALAVRA "CLONE" DO PEDIDO, e ele é
   deliberadamente frágil: no dia em que a primeira divergência ligar, ele
   FALHA e lista exatamente quais números se mexeram. Isso é a feature, e não o
   defeito. Quem ligar a divergência atualiza a expectativa de propósito. */

/* ⚠ ESTE BLOCO É O CORAÇÃO DO ARQUIVO. Ele não pergunta mais "os dois são
   iguais", porque desde 2026-08-30 eles não são. Ele pergunta a coisa mais
   forte: **os dois diferem EXATAMENTE nos campos que as divergências ligadas
   tocam, e em nenhum outro.**

   É essa a versão que pega o erro que interessa. Uma divergência que vaza para
   um campo vizinho (a Guarda somando na Defesa, a RD mexendo no PV) sai daqui
   nomeada, em vez de virar um número plausível que ninguém confere. */

t("as divergencias de REGRA ligadas",
  S.DIVERGENCIAS.filter((d) => d.ativa && d.tipo === "regra").map((d) => d.id).sort(),
  ["altoNivelSemGeral", "basesAutomaticas", "escalaDosTestes", "focosLivres",
   "danoPorArma", "defesaUniforme", "danoFixoPorGrau", "reducaoDeGrau",
   "conteudoSoPorAddon", "guardaEresistenciaParcial", "habilidadesGerais",
   "pacoteDaClasseInicial", "patamarDoJogador",
   "proficienciaPorArma", "progressaoDeFeiticos",
   "pvPePorEspecializacao", "quantidadeDePE", "rdBase", "rdEscudoFisico", "tetoDeNivel",
   "trForaDoOrcamento", "vagasPorNivelDeClasse", "valoresAdicionais"].sort());
t("e a de TELA ligada e a das abas",
  S.DIVERGENCIAS.filter((d) => d.ativa && d.tipo === "tela").map((d) => d.id), ["abasIdentidade"]);

/* Divergência desligada devolve o ramo do Afty para os DOIS lados, e é o que faz
   o PV e a Alma do jogador ainda saírem iguais aos da criatura. A ligada devolve
   o ramo de cada um. */
for (const d of S.DIVERGENCIAS) {
  if (d.ativa) {
    t(`${d.id} ligada separa os dois ramos`,
      [S.regraDo("afty", d.id), S.regraDo("player", d.id)], ["afty", "player"]);
  } else {
    t(`${d.id} desligada devolve o ramo afty no player`, S.regraDo("player", d.id), "afty");
    t(`${d.id} desligada devolve o ramo afty no afty`, S.regraDo("afty", d.id), "afty");
  }
}

/* As duas fichas, idênticas em tudo menos no `rulesVersion`. Uma criatura com
   corpo de verdade, e não a em branco: a em branco passaria por acidente, já que
   quase todo número dela é zero. Calamidade e Qnt.PE Grande de propósito, para
   a Guarda, a Resistência Parcial e o ajuste de PE terem valor não nulo do lado
   do Afty, senão a comparação não mediria nada. */
const corpo = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = { ...f.core, nd: 14, tipo: "misto", patamar: "calamidade", tecnicaAttr: "presenca" };
  f.qntPE = "grande";
  /* ⚠ COM CLASSE DE VERDADE, e somando exatamente o ND: sem Especialização o PV
     do jogador sairia zero e a comparação mediria o vazio em vez da regra. A
     multiclasse entra de propósito, porque é ela que exercita a classe inicial. */
  f.especializacoes = [{ id: "combatente", nivel: 8 }, { id: "conjurador", nivel: 6 }];
  f.attributes = { forca: 16, destreza: 18, constituicao: 15, inteligencia: 12, sabedoria: 14, presenca: 17 };
  return f;
};

const dAfty = deriveAfty(corpo("afty"));
const dPlayer = deriveAfty(corpo("player"));

/* Cada campo derivado que PODE diferir, e por causa de qual divergência. Um
   campo fora desta lista que diferir é vazamento, e um campo daqui que NÃO
   diferir é divergência que não chegou ao número. */
const DIFERENCAS_ESPERADAS = {
  hp: "pvPePorEspecializacao",
  almaMax: "pvPePorEspecializacao",
  pe: "pvPePorEspecializacao e quantidadeDePE",
  defesa: "valoresAdicionais",
  cd: "valoresAdicionais",
  iniciativa: "valoresAdicionais",
  movimento: "valoresAdicionais",
  rdGeral: "rdBase",
  rdEspecifico: "rdBase",
  /* ⚠ CONSEQUÊNCIA, e não regra própria: a aba de Defesas mostra a RD EFETIVA
     contra cada tipo, e a RD Geral entra nela. Divergindo a Geral, divergem as
     quinze linhas. Se um dia a Imunidade ou a Vulnerabilidade divergirem POR
     REGRA, é aqui que a nota tem de mudar. */
  defesasDano: "consequência da rdBase",
  resParcial: "guardaEresistenciaParcial",
  guarda: "guardaEresistenciaParcial",
  // A CD move a CD dos Feitiços, que é a CD de Feitiçaria da ficha.
  feiticos: "consequência da CD",
  habilidades: "basesAutomaticas e vagasPorNivelDeClasse",
  totalAptidoesAmaldicoadas: "vagasPorNivelDeClasse",
  altoNivel: "altoNivelSemGeral",
  focosTotais: "focosLivres",
  /* ⚠ O `patamar` derivado ENTRA NA LISTA, e é a divergência em pessoa: a ficha
     de teste é Calamidade dos dois lados, e o jogador deriva "comum" porque
     Patamar não existe para ele. Ver `patamarDoJogador`. */
  patamar: "patamarDoJogador",
  /* O caixa dos Feitiços. No Afty é o contador único, e no jogador é a
     progressão do livro em orçamento próprio. O `comum` também cai, porque ele
     somava o bônus de Calamidade que o jogador deixou de ter. */
  orcamentoHabilidades: "progressaoDeFeiticos e patamarDoJogador",
  testes: "escalaDosTestes e trForaDoOrcamento",
  /* ⚠ O DANO DEIXOU DE DIVERGIR POR CONSEQUÊNCIA e passou a divergir por regra
     em 2026-08-31: o jogador rola o dado da arma mais o modificador, e a fórmula
     por Nível e Patamar da criatura não vale lá. Ver `danoPorArma`. */
  dano: "danoPorArma",
  /* ⚠ As Bases concedidas no jogador TRAZEM EFEITO junto, então a lista de
     efeitos ativos e o contexto do DSL divergem também. Não é vazamento: é a
     consequência direta de conceder 28 habilidades a mais, e é justamente o que
     esta lista existe para tornar visível em vez de surpreendente. */
  efeitos: "consequência das Bases concedidas",
  contextoDsl: "consequência das Bases concedidas",
  motorLinhaDano: "consequência das Bases concedidas",
  // `calc` é o pacote dos stats sobrescrevíveis, então ele carrega os de cima.
  calc: "consequência dos de cima",
  // `partes` é o hover de fontes, e ele diverge nas mesmas linhas.
  partes: "consequência dos de cima",
};

const diferem = Object.keys(dAfty)
  .filter((k) => JSON.stringify(dAfty[k]) !== JSON.stringify(dPlayer[k]))
  .sort();

t("os dois derives diferem EXATAMENTE nos campos previstos",
  diferem, Object.keys(DIFERENCAS_ESPERADAS).sort());

t("e expoem exatamente as mesmas chaves",
  Object.keys(dAfty).sort(), Object.keys(dPlayer).sort());

/* O hover diverge só nas linhas dos stats que divergem. É o que impede uma
   divergência de mudar o número e esquecer o detalhamento, que foi o bug real
   que este assert pegou no dia em que nasceu: o PE do jogador mostrava a parcela
   "Quantidade de PE +7" numa ficha sem o campo, e as parcelas somavam 80 contra
   um total de 73. */
const partesDiferem = Object.keys(dAfty.partes)
  .filter((k) => JSON.stringify(dAfty.partes[k]) !== JSON.stringify(dPlayer.partes[k]))
  .sort();
/* ⚠ `guardaBonus` e `guardaVida` ENTRARAM EM 2026-08-31, e a entrada delas é o
   conserto de um hover mentiroso. As duas montavam a linha "Patamar (...)" para
   explicar um número que no jogador é `null`, e ninguém viu porque o rótulo
   citava o MESMO patamar dos dois lados. Com o Patamar neutralizado no jogador
   os rótulos passaram a divergir, este assert apontou, e as duas passaram a
   ficar VAZIAS no jogador, como o `guardaAtual` já ficava. */
t("e o hover diverge so nas linhas dos stats que divergem",
  partesDiferem,
  ["cd", "defesa", "guardaAtual", "guardaBonus", "guardaVida", "hp", "iniciativa",
   "movimento", "pe", "rdEspecifico", "rdGeral", "resParcial"]);

/* E as três da Guarda ficam VAZIAS no jogador, e não com uma linha de valor
   nulo: hover de stat que não existe não é hover, é ruído. */
for (const campo of ["guardaAtual", "guardaBonus", "guardaVida", "resParcial"]) {
  t(`o hover de ${campo} e vazio no jogador`, dPlayer.partes[campo], []);
  t(`e tem conteudo na criatura de Calamidade`, dAfty.partes[campo].length > 0, true);
}

/* ⚠ AS PARCELAS TÊM DE FECHAR COM O TOTAL nos DOIS sistemas. Número certo com
   detalhamento errado é bug (regra do autor, do `defesaAtributo`). */
/* ⚠ TODO stat que diverge, e não só o PE. Foi assim que este arquivo achou os
   três detalhamentos mentirosos do dia: a Quantidade de PE numa ficha sem o
   campo, o Mod. da Técnica numa Classe que não o soma, e a Maestria na Defesa do
   jogador. Os três davam número certo e hover errado. */
for (const [rot, d] of [["afty", dAfty], ["player", dPlayer]]) {
  for (const campo of ["hp", "pe", "defesa", "cd", "iniciativa", "movimento"]) {
    const linhas = d.partes[campo];
    /* ⚠ SÓ ONDE A CONTA É SOMA. O PV da criatura tem parcelas MULTIPLICATIVAS
       (o Patamar em "×3", a Alma em "×1,1"), que o hover mostra como `texto` e
       não como `valor`. Somar `valor` ali daria 103 contra um total de 309, e o
       assert estaria medindo a própria ignorância em vez de um bug. A presença
       de um `texto` é o sinal de que a linha não é somável. */
    if (linhas.some((linha) => linha.texto != null)) continue;
    const soma = linhas.reduce((x, linha) => x + (linha.valor || 0), 0);
    t(`as parcelas de ${campo} fecham com o total no ${rot}`, soma, d[campo]);
  }
}

/* Os números, um a um, com o valor esperado escrito. A comparação de cima diz
   QUE diferem, esta diz QUANTO, e é ela que pega uma troca de sinal. */
/* Criatura Misto ND 14: PE 5×14 = 70, +7 da Quantidade Grande, +3 do Mod. da
   Técnica = 80. Jogador Combatente 8 + Conjurador 6: 4×8 + 6×6 = 68, sem
   ajuste de Quantidade, +3 do Mod. da Técnica UMA VEZ (o Conjurador o dá) = 71. */
t("o PE do afty tem o ajuste de Quantidade Grande (+ND/2)", dAfty.pe, 80);
t("e o do jogador vem das duas Classes, com o Mod. da Tecnica uma vez", dPlayer.pe, 71);
t("a RD Geral do afty vem do Tipo Misto", dAfty.rdGeral, 14);
t("e a do jogador comeca em zero", dPlayer.rdGeral, 0);
t("a RD Especifica do afty vem do Tipo Misto", dAfty.rdEspecifico, 6);
t("e a do jogador comeca em zero", dPlayer.rdEspecifico, 0);
t("a Resistencia Parcial do afty vem do Patamar", dAfty.resParcial, 1);
/* ⚠ `null`, e NÃO zero. O autor pediu que ela não apareça "nem como zero", e um
   zero seria uma linha na tela. */
t("e a do jogador nao existe, nem como zero", dPlayer.resParcial, null);
t("a Guarda do afty existe", dAfty.guarda?.ativa, true);
t("e a do jogador e nula", dPlayer.guarda, null);

/* ⚠ O QUE **NÃO** PODE TER MUDADO. O PV e a Alma ainda saem iguais porque a
   divergência da Especialização está desligada, esperando a tabela do autor.
   No dia em que ela ligar, estas quatro linhas falham, e é o aviso de que a
   maior mudança do sistema chegou. */
/* ⚠ Sobrou pouco: a Maestria (que é o ND puro) e a Atenção, que o livro do
   jogador define exatamente como a criatura já calculava ("10 + bônus na perícia
   Percepção"). É a única dos cinco "valores adicionais" que NÃO diverge. */
for (const campo of ["maestria", "atencao", "grau", "rdAlma"]) {
  t(`o ${campo} ainda bate nos dois`, dAfty[campo], dPlayer[campo]);
}

/* Os números do jogador, um a um. Combatente 8 (inicial) + Conjurador 6, ND 14,
   Constituição 15 (+2) e Presença 17 (+3), Destreza 18 (+4). */
t("PV = 12 + 6x7 do Combatente, 5x6 do Conjurador, e 14 x ModCon",
  dPlayer.hp, 12 + 6 * 7 + 5 * 6 + 14 * 2);
t("e a Alma do jogador e o PV", dPlayer.almaMax, dPlayer.hp);
t("a Alma da criatura continua sendo 100", dAfty.almaMax, 100);
t("Defesa = 10 + metade do nivel + Destreza, sem Maestria", dPlayer.defesa, 10 + 7 + 4);
/* ⚠ A CD do jogador NÃO é mais a fórmula pura, e isso é correto: as Bases
   concedidas trazem efeito junto, e algumas somam CD. Por isso o que se mede
   aqui são as PARCELAS da fórmula, e não o total. Medir o total amarraria este
   assert ao conteúdo do catálogo, e ele quebraria a cada Base nova. */
const parcelaCD = (rot) => dPlayer.partes.cd.find((l) => l.label === rot)?.valor;
t("a CD do jogador tem Base 10", parcelaCD("Base"), 10);
t("e a Metade do Nivel no lugar da escala por Tipo", parcelaCD("Metade do Nível"), 7);
t("e mantem a Maestria, ao contrario da Defesa", parcelaCD("Maestria"), dPlayer.maestria);
t("a Defesa do jogador NAO tem linha de Maestria",
  dPlayer.partes.defesa.some((l) => l.label === "Maestria"), false);
t("Iniciativa = so o Mod. de Destreza", dPlayer.iniciativa, 4);
t("Deslocamento = 9, sem o maior modificador fisico", dPlayer.movimento, 9);

/* ⚠ A ORDEM DA LISTA MUDA O PV, e é a régua da classe inicial que o autor
   escolheu (2026-08-30), contra uma marca própria na ficha. Este assert existe
   para a consequência ficar medida, e não só anotada.

   ⚠ E A DIFERENÇA NÃO É `pvPrimeiro − pvPrimeiro`. A intuição diz 2 (12 do
   Combatente contra 10 do Conjurador) e o número é 1. A classe inicial troca UM
   `pvPorNivel` pelo `pvPrimeiro`, então o que ela ganha é `primeiro − porNivel`:

     Combatente inicial   12 − 6 = 6
     Conjurador inicial   10 − 5 = 5

   e a diferença entre começar por um ou por outro é 6 − 5 = 1. Uma classe de
   dado maior tem base maior E por-nível maior, e as duas quase se cancelam. */
const trocado = corpo("player");
trocado.especializacoes = [{ id: "conjurador", nivel: 6 }, { id: "combatente", nivel: 8 }];
t("comecar pelo Conjurador da 1 PV a menos", deriveAfty(trocado).hp, dPlayer.hp - 1);
t("e a diferenca e primeiro menos porNivel, e nao primeiro menos primeiro",
  (12 - 6) - (10 - 5), 1);

/* ⚠ E a ficha continua sabendo quem é depois de passar pelo derive: o sistema
   não pode ser algo que só existe enquanto a rota está aberta. */
t("a ficha de player continua player depois de derivada",
  S.sistemaDaFicha(corpo("player")), "player");

/* ============================================================ */
/* 5. As divergências conhecidas estão TABELADAS, e não soltas   */
/* ============================================================ */

/* As quatro já estavam anotadas em comentário no código antes de existir rota de
   Player. Comentário envelhece calado (é o mesmo problema do requisito `nota`),
   e a lista existe para que ligar uma seja um passo com nome. */
t("as divergencias conhecidas estao na lista",
  S.DIVERGENCIAS.map((d) => d.id).sort(),
  ["abasIdentidade", "altoNivelSemGeral", "basesAutomaticas", "danoPorArma",
   "defesaUniforme", "escalaDosTestes", "focosLivres", "guardaEresistenciaParcial",
   "conteudoSoPorAddon", "habilidadesGerais", "inventarioSimplificado", "pacoteDaClasseInicial",
   "patamarDoJogador", "proficienciaPorArma", "progressaoDeFeiticos",
   "pvPePorEspecializacao", "quantidadeDePE", "rdBase", "rdEscudoFisico",
   "reducaoDeGrau", "danoFixoPorGrau",
   "tetoDeNivel", "trForaDoOrcamento", "vagasPorNivelDeClasse",
   "valoresAdicionais"].sort());

for (const d of S.DIVERGENCIAS) {
  t(`${d.id} cita de onde a regra saiu`, d.onde.length > 0 && d.fonte.length > 0, true);
  t(`${d.id} diz o que vale nos dois lados`, d.afty !== d.player, true);
  t(`${d.id} se declara regra ou tela`, ["regra", "tela"].includes(d.tipo), true);
}


/* ============================================================ */
/* 6. O QUE O NÍVEL DE CLASSE PASSOU A PAGAR                     */
/* ============================================================ */

/* As cinco regras que o autor mandou em 2026-08-30 depois da tabela de Classes.
   Todas removem uma peça do Afty e devolvem a regra do livro do jogador. */

const jogador = (nd, esp) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.especializacoes = esp;
  f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
  return deriveAfty(f);
};

/* ---------- Bases automáticas ---------- */

/* ⚠ O Afty é que divergia do livro: "No livro as Bases são de graça; no Afty
   elas são escolhidas". A marca `automatica` era o autor liberando isso uma a
   uma, e no jogador vale para todas. */
const bases = H.AFTY_HABILIDADES.filter((h) => h.tipo === "base");
const auto = H.AFTY_HABILIDADES.filter((h) => h.automatica);
t("toda habilidade marcada automatica e uma Base", auto.every((h) => h.tipo === "base"), true);
t("as nove automaticas continuam sendo nove no afty", auto.length, 9);

const espDoExemplo = [{ id: "lutador", nivel: 2 }, { id: "conjurador", nivel: 2 }];
const concedidasAfty = H.habilidadesConcedidasPelasEspecializacoes(espDoExemplo, "afty");
const concedidasPlayer = H.habilidadesConcedidasPelasEspecializacoes(espDoExemplo, "player");
t("no afty so as automaticas sao concedidas", concedidasAfty.length, 2);
t("e no jogador toda Base ate o nivel da Classe", concedidasPlayer.length, 5);
t("o que o afty concede o jogador tambem concede",
  concedidasAfty.every((id) => concedidasPlayer.includes(id)), true);
/* Nenhuma Base de nível acima do que a ficha tem entra: o filtro de nível
   continua valendo, e é ele que faz "ao chegar no Nível da Especialização". */
t("nenhuma Base acima do nivel da Classe entra",
  concedidasPlayer.every((id) => {
    const h = bases.find((x) => x.id === id);
    return h.nivel <= (espDoExemplo.find((e) => e.id === h.especializacaoId)?.nivel ?? 0);
  }), true);
/* Sem sistema declarado a resposta é a do Afty, que é o que preserva a criatura. */
t("sem sistema, so as automaticas",
  H.habilidadesConcedidasPelasEspecializacoes(espDoExemplo).length, 2);

/* ---------- Vagas de Habilidade: 1 por nível a partir do segundo ---------- */

/* ⚠ `comum` é a pilha da regra, e não `total`: o `total` soma a pilha EXCLUSIVA
   de Talento, que vem de Bases que concedem vaga de Talento e que no jogador
   passaram a ser concedidas sozinhas. Ler `total` aqui daria 4 no exemplo do
   autor e faria parecer que a regra está errada. */
t("o exemplo do autor: Lutador 2 com Conjurador 2 da 2 vagas",
  jogador(4, espDoExemplo).habilidades.comum, 2);

/* ⚠ O DESCONTO É POR CLASSE. Um Lutador 4 sozinho dá 3, e Lutador 2 com
   Conjurador 2 dá 2: cada classe perde o primeiro nível dela. É a diferença
   entre esta regra e um `nível − 1` do personagem. */
t("uma classe so no nivel 4 da 3", jogador(4, [{ id: "lutador", nivel: 4 }]).habilidades.comum, 3);
t("e duas classes de 2 dao 2, e nao 3",
  jogador(4, espDoExemplo).habilidades.comum, 2);
for (const [n, esperado] of [[1, 0], [2, 1], [3, 2], [20, 19]]) {
  t(`Lutador ${n} da ${esperado} vagas`, jogador(n, [{ id: "lutador", nivel: n }]).habilidades.comum, esperado);
}
t("o resolvedor puro concorda com o derive",
  E.vagasDeHabilidadePorClasse(espDoExemplo), 2);
t("nivel zero ou lixo nao vira vaga negativa",
  E.vagasDeHabilidadePorClasse([{ id: "lutador", nivel: 0 }, { id: "conjurador" }]), 0);

/* ---------- Aptidões Amaldiçoadas: 1 por nível a partir do 2 ---------- */

/* ⚠ AQUI O DESCONTO É UM SÓ, e não por classe: "Independente de qual
   Especialização". É a diferença de propósito para a vaga de Habilidade. */
t("nivel 20 da 19 Aptidoes", jogador(20, [{ id: "lutador", nivel: 20 }]).totalAptidoesAmaldicoadas, 19);
t("nivel 1 da nenhuma", jogador(1, [{ id: "lutador", nivel: 1 }]).totalAptidoesAmaldicoadas, 0);
t("e duas classes NAO descontam duas vezes",
  jogador(4, espDoExemplo).totalAptidoesAmaldicoadas, 3);

/* A exceção que o autor nomeou. O Restringido não tem energia amaldiçoada, e no
   jogador quem diz isso é a Especialização, já que não há Tipo. */
const restr = createBlankAfty();
restr.rulesVersion = "player";
restr.core = { ...restr.core, nd: 20, tipo: "misto", patamar: "comum", origem: { id: "restringido" } };
restr.especializacoes = [{ id: "restringido", nivel: 20 }];
restr.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
t("o Restringido jogador nao recebe Aptidao nenhuma",
  deriveAfty(restr).totalAptidoesAmaldicoadas, 0);

/* ---------- Habilidades Gerais ---------- */

/* ⚠ Não basta esconder a aba: as Gerais CONCEDEM. Uma ficha que guardou Gerais
   antes da regra não pode continuar recebendo o que elas dão. */
const comGerais = createBlankAfty();
comGerais.rulesVersion = "player";
comGerais.core = { ...comGerais.core, nd: 20, tipo: "misto", patamar: "comum" };
comGerais.especializacoes = [{ id: "lutador", nivel: 20 }];
comGerais.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
comGerais.habilidadesGerais = ["ger_especializacao", "ger_especializacao", "ger_aptidao"];
const semGeraisEfeito = deriveAfty(comGerais);
t("Gerais gravadas na ficha nao concedem nada no jogador",
  semGeraisEfeito.habilidades.comum, 19);
t("e nem vaga de Aptidao", semGeraisEfeito.totalAptidoesAmaldicoadas, 19);

/* ---------- Alto Nível sem a Geral ---------- */

/* No Afty as duas trilhas exigem a Geral correspondente ALÉM do ND, e sem ela o
   orçamento é zero mesmo no ND 30. No jogador sobra só o ND. */
const alto = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 30, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "lutador", nivel: 30 }];
  f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
  return deriveAfty(f).altoNivel;
};
t("no afty, sem a Geral, o Alto Nivel fica travado no ND 30",
  [alto("afty").melhorias.total, alto("afty").lendarias.total], [0, 0]);
t("e no jogador o ND 21 e 22 destravam sozinhos",
  [alto("player").melhorias.total > 0, alto("player").lendarias.total > 0], [true, true]);

/* ---------- Focos livres ---------- */

/* ⚠ A única divergência em que o jogador tem MENOS automação, e é de propósito:
   "É o mestre que decide quando um Personagem de Jogador ganha Focos". */
const comFocos = (n) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "lutador", nivel: 10 }];
  f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
  f.focosLivres = n;
  return deriveAfty(f).focosTotais;
};
t("o jogador comeca com zero Foco, e nao com o ND", comFocos(0), 0);
t("e recebe o que o mestre digitar", comFocos(7), 7);
t("lixo no campo nao vira Foco", comFocos("abc"), 0);
t("nem numero negativo", comFocos(-5), 0);
/* A criatura ignora o campo e continua com o ND. */
const criaturaComCampo = createBlankAfty();
criaturaComCampo.rulesVersion = "afty";
criaturaComCampo.core = { ...criaturaComCampo.core, nd: 10, tipo: "misto", patamar: "comum" };
criaturaComCampo.focosLivres = 99;
t("a criatura ignora o campo e segue com o ND", deriveAfty(criaturaComCampo).focosTotais, 10);


/* ============================================================ */
/* 7. PERÍCIAS, ATAQUES E TESTES DE RESISTÊNCIA                  */
/* ============================================================ */

/* ⚠ NO JOGADOR OS TRÊS TESTES USAM A MESMA ESCALA, e na criatura são três. É a
   diferença mais fácil de errar do sistema inteiro, porque as três fórmulas se
   parecem e só o divisor muda. */

const testesDe = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  f.attributes = { forca: 16, destreza: 18, constituicao: 14, inteligencia: 12, sabedoria: 14, presenca: 12 };
  return deriveAfty(f).testes;
};
const tAfty = testesDe("afty");
const tPlayer = testesDe("player");

/* A Perícia já usava a metade do nível nos dois: era a fórmula do jogador que
   estava lá desde o começo, com um comentário dizendo que provavelmente estava
   errada para a criatura. Segue como está até o autor decidir. */
const parte = (linha, rot) => linha.partes.find((x) => x.label === rot)?.valor;
/* ⚠ O NÚMERO É O MESMO e o RÓTULO NÃO ERA: a criatura diz "Metade do ND" e o
   jogador não tem ND, tem Nível. Os TR e os Ataques do jogador já diziam "Metade
   do Nível", então a Perícia era a única falando outra língua na mesma tela. */
t("a Pericia usa metade do nivel nos DOIS",
  [parte(tAfty.pericias.find((p) => p.id === "atletismo"), "Metade do ND"),
    parte(tPlayer.pericias.find((p) => p.id === "atletismo"), "Metade do Nível")],
  [5, 5]);
t("e a criatura nao usa o rotulo do jogador",
  parte(tAfty.pericias.find((p) => p.id === "atletismo"), "Metade do Nível"), undefined);

/* O Ataque muda de régua. Criatura: Nível ÷ 1,5 = 6 no ND 10. Jogador: 5. */
const atqAfty = tAfty.ataques.find((a) => a.id === "corpo");
const atqPlayer = tPlayer.ataques.find((a) => a.id === "corpo");
t("o Ataque da criatura usa Nivel / 1,5", parte(atqAfty, "Nível ÷ 1,5"), 6);
t("e o do jogador usa metade do nivel", parte(atqPlayer, "Metade do Nível"), 5);
t("a criatura nao tem linha de metade do nivel no Ataque",
  parte(atqAfty, "Metade do Nível"), undefined);

/* O TR muda de régua e de rótulo. Reflexos usa a escala da Defesa na criatura
   (Misto: Nível ÷ 1,5 = 6) e metade do nível no jogador (5). */
const refAfty = tAfty.resistencias.find((r) => r.value === "reflexos");
const refPlayer = tPlayer.resistencias.find((r) => r.value === "reflexos");
t("o TR da criatura usa a escala por Tipo", parte(refAfty, "Nível ÷ 1,5"), 6);
t("e o do jogador usa metade do nivel", parte(refPlayer, "Metade do Nível"), 5);

/* ⚠ A Integridade era o TR de escala FIXA (Nível ÷ 1,5 em todo Tipo), e no
   jogador ela cai na mesma régua das outras quatro. Sem isso ela ficaria como o
   único TR de escala diferente numa ficha onde tudo é metade do nível. */
t("a Integridade do jogador tambem cai na metade do nivel",
  parte(tPlayer.resistencias.find((r) => r.value === "integridade"), "Metade do Nível"), 5);

/* ---------- O TR fora do orçamento ---------- */

/* ⚠ Verbatim, e em caixa alta no livro: "TESTES DE RESISTÊNCIA [...] não contam
   para o Limite de Pericias." Na criatura eles contam, e é regra do autor de
   2026-07-27. */
const comTR = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  f.attributes = { forca: 16, destreza: 18, constituicao: 14, inteligencia: 12, sabedoria: 14, presenca: 12 };
  /* ⚠ O TR guarda proficiência em `resistenciasProf`, e NÃO em `pericias`. São
     duas listas separadas desde sempre, e escrever o TR na de perícias não
     quebra nada: só não faz efeito, calado. */
  f.pericias = { atletismo: "treinado" };
  f.resistenciasProf = { reflexos: "treinado", fortitude: "mestre" };
  return deriveAfty(f).testes.orcamento;
};
const orcAfty = comTR("afty");
const orcPlayer = comTR("player");
t("os dois contam o gasto de TR", [orcAfty.resistencias > 0, orcPlayer.resistencias > 0], [true, true]);
t("mas so a criatura o soma no total gasto", orcAfty.gastos, orcAfty.pericias + orcAfty.resistencias);
t("e o jogador gasta so o das pericias", orcPlayer.gastos, orcPlayer.pericias);
/* ⚠ O gasto de TR continua CALCULADO no jogador, e só não entra na soma. Zerar a
   variável esconderia um TR marcado à mão numa ficha onde marcar não devia ser
   possível. */
t("o gasto de TR do jogador nao e zerado, so ignorado", orcPlayer.resistencias, orcAfty.resistencias);
t("e a ficha diz qual dos dois modos esta valendo",
  [orcAfty.orcamento === undefined, orcAfty.trNoOrcamento, orcPlayer.trNoOrcamento],
  [true, true, false]);

/* ---------- Os pacotes de Classe ---------- */

/* Os ids dos pacotes têm de existir nos catálogos. O validador do próprio módulo
   confere só a FORMA, porque importar Perícias e Resistências de lá fecharia
   ciclo. A checagem cruzada mora aqui. */
const idsPericia = new Set(P.AFTY_PERICIAS.map((x) => x.id));
const idsTR = new Set(SCH.AFTY_RESISTENCIAS.map((x) => x.value));
for (const e of E.AFTY_ESPECIALIZACOES) {
  const c = e.caracteristicas;
  if (!c) continue;
  for (const id of [...(c.pericias?.entre ?? []), ...(c.pericias?.vetadas ?? [])]) {
    t(`${e.nome}: a pericia ${id} existe no catalogo`, idsPericia.has(id), true);
  }
  for (const id of [...(c.resistencias?.entre ?? []), ...(c.resistencias?.fixas ?? [])]) {
    t(`${e.nome}: o TR ${id} existe no catalogo`, idsTR.has(id), true);
  }
}

/* As seis do livro declaram os dois pacotes. */
t("as seis Classes declaram pacote de pericia e de TR",
  E.AFTY_ESPECIALIZACOES.filter((e) => e.caracteristicas?.pericias && e.caracteristicas?.resistencias).length, 6);

/* ⚠ O RESTRINGIDO É O ÚNICO QUE NÃO ESCOLHE TR: o livro dá os dois com "e", e
   não com "entre ... ou". `fixas` guarda essa diferença, que `escolhe: 2` sobre
   uma lista de 2 apagaria: o número sairia igual e a tela pediria uma escolha
   que não existe. */
const restrC = E.caracteristicasDaClasse("restringido");
t("o Restringido recebe os dois TR fixos", restrC.resistencias.fixas, ["fortitude", "reflexos"]);
t("e nao tem escolha de TR", restrC.resistencias.escolhe, undefined);
t("as outras cinco escolhem um TR",
  E.AFTY_ESPECIALIZACOES.filter((e) => e.caracteristicas?.resistencias?.escolhe === 1).length, 5);

/* ⚠ E é o único com VETO: "outras quatro perícias quaisquer, exceto Feitiçaria". */
t("o Restringido veta Feiticaria", restrC.pericias.vetadas, ["feiticaria"]);
t("e e o unico com veto",
  E.AFTY_ESPECIALIZACOES.filter((e) => e.caracteristicas?.pericias?.vetadas?.length).length, 1);

/* O pacote de cada Classe, um a um, contra o texto do livro.

   ⚠ A FRASE TEM TRÊS PARTES, e até 2026-08-31 ela era lida como UMA lista. Autor:
   *"Especialista em Combate (Combatente) fornece 2 Ofícios, Atletismo ou
   Acrobacia e 3 a Escolha. Totalizando 6 Perícias. Porém, o site só está me
   fornecendo 5 no lugar."*

   O que separa a segunda parte da terceira é a PONTUAÇÃO, e é a mesma distinção
   que os TR do Restringido já faziam: **"ou" é escolha, VÍRGULA é as duas**. Por
   isso o Combatente escolhe uma entre Atletismo ou Acrobacia (`escolhe`/`entre`)
   e o Conjurador recebe Feitiçaria E Ocultismo (`fixas`).

   As colunas são: Ofícios, fixas, escolhe, entre, livres, e o TOTAL do livro. */
for (const [id, oficios, fixas, escolhe, entre, livres, total] of [
  ["lutador",     1, [],                                 1, ["atletismo", "acrobacia"], 3, 5],
  ["combatente",  2, [],                                 1, ["atletismo", "acrobacia"], 3, 6],
  ["conjurador",  2, ["feiticaria", "ocultismo"],        0, [],                         2, 6],
  ["suporte",     2, ["medicina", "prestidigitacao"],    0, [],                         3, 7],
  ["controlador", 1, ["percepcao", "persuasao"],         0, [],                         2, 5],
  ["restringido", 1, [],                                 0, [],                         4, 5],
]) {
  const c = E.caracteristicasDaClasse(id).pericias;
  t(`${id}: o pacote de pericias bate com o livro`,
    [c.oficios ?? 0, c.fixas ?? [], c.escolhe ?? 0, c.entre ?? [], c.livres],
    [oficios, fixas, escolhe, entre, livres]);
  /* ⚠ E O TOTAL FECHA. É o número que aparece na tela, e é o que estava errado:
     sem a soma das quatro partes, mudar o dado de uma Classe e esquecer o total
     não teria sintoma nenhum. */
  t(`${id}: e o total do pacote e a soma das quatro partes`,
    E.vagasDoPacote(E.pacoteInicialDaFicha([{ id, nivel: 10 }])), total);
}

/* Nenhuma Classe declara a MESMA perícia nas duas metades: `fixas` é concessão e
   `entre` é escolha, e a mesma perícia nas duas cobraria a vaga duas vezes. */
for (const e of E.AFTY_ESPECIALIZACOES) {
  const c = e.caracteristicas?.pericias;
  if (!c) continue;
  t(`${e.nome}: fixas e entre nao se cruzam`,
    (c.fixas ?? []).filter((x) => (c.entre ?? []).includes(x)), []);
  /* ⚠ E OFÍCIO SAIU DAS LISTAS. Ele é `oficios: N` agora, e deixá-lo também em
     `entre` faria o jogador poder gastar uma segunda vaga numa linha que já é
     dele. */
  t(`${e.nome}: Oficio nao aparece mais nas listas`,
    [...(c.fixas ?? []), ...(c.entre ?? [])].filter((x) => x === "oficio"), []);
}



/* ---------- Teto de nível, e o Bônus de Treinamento que não diverge ---------- */

/* ⚠ O teto de 30 é o que faz o BT do jogador parar em +8 SEM escada própria: os
   dois degraus que só a criatura tem (9 no ND 31, 10 no ND 36) ficam acima dele.
   Se alguém subir o teto um dia, o BT diverge sozinho e este assert avisa. */
const nivelDe = (sistema, nd) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "lutador", nivel: Math.min(nd, 30) }];
  f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14 };
  const d = deriveAfty(f);
  return [d.nd, d.maestria];
};
t("o jogador para no nivel 30", nivelDe("player", 40), [30, 8]);
t("e a criatura nao para", nivelDe("afty", 40), [40, 10]);
t("abaixo do teto os dois batem, degrau a degrau",
  [1, 5, 9, 13, 17, 21, 26, 30].every((n) => nivelDe("player", n)[1] === nivelDe("afty", n)[1]), true);
t("o BT do jogador segue a escada do livro",
  [1, 5, 9, 13, 17, 21, 26].map((n) => nivelDe("player", n)[1]), [2, 3, 4, 5, 6, 7, 8]);

/* ---------- O pacote da Classe inicial ---------- */

const orcDe = (esp, attr) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = esp;
  f.periciaAtributo = attr;
  f.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 16, sabedoria: 12, presenca: 12 };
  return deriveAfty(f).testes.orcamento.total;
};
/* Lutador: 1 Ofício + 1 entre Atletismo ou Acrobacia + 3 livres = 5, mais o
   MAIOR mod entre INT e SAB. */
t("o pacote do Lutador mais INT +3", orcDe([{ id: "lutador", nivel: 10 }], "inteligencia"), 8);
/* ⚠ O ATRIBUTO É O MAIOR DOS DOIS desde 2026-08-31, igual à criatura. O campo
   `periciaAtributo` ficou parado, então pedir Sabedoria não muda mais nada:
   esta ficha tem INT 16 e SAB 12, e o orçamento segue a Inteligência. */
t("pedir SAB nao derruba mais o orcamento", orcDe([{ id: "lutador", nivel: 10 }], "sabedoria"), 8);

/* ⚠ SÓ A CLASSE INICIAL DÁ PACOTE. As duas fichas abaixo têm as mesmas Classes e
   orçamentos diferentes conforme a ORDEM, e é a régua que o autor escolheu. */
t("Lutador primeiro da o pacote do Lutador (1+1+3)",
  orcDe([{ id: "lutador", nivel: 5 }, { id: "conjurador", nivel: 5 }], "inteligencia"), 8);
t("Conjurador primeiro da o pacote do Conjurador (2+2+2)",
  orcDe([{ id: "conjurador", nivel: 5 }, { id: "lutador", nivel: 5 }], "inteligencia"), 9);
/* Com o Suporte (2+2+3=7) a ordem muda o número, e é o que prova que a segunda
   Classe não soma nada. */
t("Suporte primeiro da 7 mais o modificador",
  orcDe([{ id: "suporte", nivel: 5 }, { id: "lutador", nivel: 5 }], "inteligencia"), 10);
t("Lutador primeiro da 5, mesmo com o Suporte junto",
  orcDe([{ id: "lutador", nivel: 5 }, { id: "suporte", nivel: 5 }], "inteligencia"), 8);
/* Ficha sem Classe nenhuma tem só o modificador, e não quebra. */
t("sem Classe sobra so o modificador", orcDe([], "inteligencia"), 3);

const pac = E.pacoteInicialDaFicha([{ id: "conjurador", nivel: 5 }, { id: "lutador", nivel: 5 }]);
t("o pacote nomeia a Classe inicial", pac.classeId, "conjurador");
t("e traz o TR dela", [pac.trEscolhe, pac.trEntre], [1, ["astucia", "vontade"]]);
t("ficha sem Classe nao tem pacote", E.pacoteInicialDaFicha([]), null);


/* ---------- Proficiência por arma ---------- */

/* ⚠ AS TRÊS PALAVRAS DE TREINAMENTO FALAM DE EIXOS DIFERENTES do catálogo, e foi
   isso que segurou esta ligação: `simples` é a CLASSE, `marciais` é a
   PROPRIEDADE e `distancia` é a CATEGORIA. */
const semMarcial = EQ.ARMAS.find((a) => a.classe === "simples" && !a.props?.marcial);
const complexaSemMarcial = EQ.ARMAS.find((a) => a.classe === "complexa" && !a.props?.marcial);
const complexaMarcial = EQ.ARMAS.find((a) => a.classe === "complexa" && a.props?.marcial);

t("marciais e a PROPRIEDADE, e nao a classe complexa",
  [EQ.armaTreinadaPor(complexaMarcial, ["marciais"]),
    EQ.armaTreinadaPor(complexaSemMarcial, ["marciais"])],
  [true, false]);

/* ⚠ A LEITURA ERRADA TORNARIA LUTADOR E COMBATENTE IGUAIS. Se "marciais" fosse a
   classe complexa, "Simples + Marciais" cobriria as 52 armas, que é exatamente o
   que o livro dá ao Combatente ("Todas as armas"). Duas Classes escritas
   diferente não podem recortar igual, e é esse o assert. */
const alcance = (toks) => EQ.ARMAS.filter((a) => EQ.armaTreinadaPor(a, toks)).length;
t("o Lutador NAO alcanca todas as armas", alcance(["simples", "marciais"]) < EQ.ARMAS.length, true);
t("e o Combatente alcanca", alcance(["todas"]), EQ.ARMAS.length);
t("os dois recortes sao diferentes",
  alcance(["simples", "marciais"]) !== alcance(["todas"]), true);

/* "A Distância" inclui arremesso (autor, 2026-08-30): o recorte é "toda arma que
   não seja corpo a corpo". */
t("a distancia inclui arremesso",
  EQ.ARMAS.filter((a) => EQ.armaTreinadaPor(a, ["distancia"]))
    .every((a) => a.categoria === "distancia" || a.categoria === "arremesso"), true);
t("e alcanca as duas categorias",
  new Set(EQ.ARMAS.filter((a) => EQ.armaTreinadaPor(a, ["distancia"])).map((a) => a.categoria)).size, 2);

/* Token que ninguém reconhece não treina nada, e não quebra: um Addon que
   invente um recorte tira o bônus em vez de derrubar o criador. */
t("token desconhecido nao treina", EQ.armaTreinadaPor(semMarcial, ["inventado"]), false);
t("lista vazia nao treina", EQ.armaTreinadaPor(semMarcial, []), false);

/* De ponta a ponta: a mesma ficha, as mesmas duas armas, e só o BT muda. */
const comArmas = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "lutador", nivel: 10 }];
  f.attributes = { forca: 16, destreza: 12, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.equipamentos = {
    itens: [
      { tipo: "arma", refId: semMarcial.id, equipado: true },
      { tipo: "arma", refId: complexaSemMarcial.id, equipado: true },
    ],
  };
  const d = deriveAfty(f);
  const linha = (id) => d.dano.entradas.find((e) => e.id === id);
  return { bt: d.maestria, treinada: linha(semMarcial.id), fora: linha(complexaSemMarcial.id) };
};
const armasPlayer = comArmas("player");
const armasAfty = comArmas("afty");

t("no jogador a arma treinada soma o BT e a de fora nao",
  armasPlayer.treinada.acerto - armasPlayer.fora.acerto, armasPlayer.bt);
t("e a parcela aparece com nome proprio no hover",
  armasPlayer.treinada.partesAcerto.some((p) => p.label === "Maestria (Treinado na Arma)"), true);
t("a arma fora do treino nao tem a parcela",
  armasPlayer.fora.partesAcerto.some((p) => p.label === "Maestria (Treinado na Arma)"), false);

/* ⚠ ARMA FORA DO TREINO CONTINUA UTILIZÁVEL (autor): ela perde o BT e mais nada.
   Sem este assert, alguém poderia "consertar" isso somando uma penalidade. */
t("a arma fora do treino ainda tem acerto, e nao penalidade",
  armasPlayer.fora.acerto > 0, true);
t("e ela e igual a treinada menos exatamente o BT",
  armasPlayer.fora.acerto + armasPlayer.bt, armasPlayer.treinada.acerto);

/* A criatura não mudou: as duas armas continuam iguais entre si, porque lá quem
   decide é a marca por TIPO de ataque, que esta ficha não tem. */
t("na criatura as duas armas continuam iguais",
  armasAfty.treinada.acerto, armasAfty.fora.acerto);
t("e nenhuma delas ganhou a parcela nova",
  armasAfty.treinada.partesAcerto.some((p) => p.label === "Maestria (Treinado na Arma)"), false);

/* ⚠ O Amaldiçoado é sempre treinado pela fórmula do livro ("você é sempre
   treinado"), então ele NÃO pode ganhar o BT duas vezes numa arma de técnica. */
const ataquesDoConjurador = deriveAfty((() => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  f.attributes = { forca: 12, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 12, presenca: 12 };
  return f;
})()).testes.ataques;
t("o Ataque Amaldicoado continua sempre treinado no jogador",
  ataquesDoConjurador.find((a) => a.id === "amaldicoado").treinado, true);
t("e os fisicos deixam de ser decididos pela marca por tipo",
  ataquesDoConjurador.filter((a) => a.id !== "amaldicoado").every((a) => a.treinado === false), true);

/* ============================================================ */
/* 8. A PROGRESSÃO DE FEITIÇOS DO LIVRO, E O PATAMAR QUE SUMIU   */
/* ============================================================ */

/* Autor, 2026-08-31, ao mandar a regra: "Volta para a progressão do livro a de
   Feitiços e Estilos. Que são separadas." e "Não existe PATAMAR para Jogadores".

   ⚠ ATÉ AQUI O CONTADOR DO JOGADOR ERA O DA CRIATURA, sem uma linha de
   divergência. Ele saía de `contadorHabilidades(Maestria, Patamar)`, e dos três
   termos DOIS estavam mortos no jogador: o Patamar não existe e as Habilidades
   Gerais também não, então o "contador único dividido com as Gerais" tinha
   virado `2 × Maestria` puro, para um caixa que ninguém mais dividia. */

const fichaF = (sistema, nivel, classe) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "conjurador", patamar: "comum", tecnicaAttr: "presenca" };
  f.especializacoes = [{ id: classe, nivel }];
  return f;
};
const orcF = (sistema, nivel, classe) =>
  deriveAfty(fichaF(sistema, nivel, classe)).orcamentoHabilidades;

/* A fórmula do livro escrita à mão, para a tabela abaixo não ser só o motor
   concordando consigo mesmo. */
const livroFeitico = (n, todoNivel) =>
  2 + (todoNivel ? n - 1 : Math.floor(n / 2)) + (n >= 10 ? 1 : 0) + (n >= 20 ? 1 : 0);

/* ⚠ O COMBATENTE É O CASO PADRÃO, e não o Conjurador: a Conjuração Aprimorada é
   Base de Conjurador e `automatica`, então TODO Conjurador do jogador a tem
   desde o 1° nível e nunca cai na cadência dos níveis pares. */
for (const [n, esperado] of [[1, 2], [2, 3], [3, 3], [4, 4], [9, 6], [10, 8], [19, 12], [20, 14], [30, 19]]) {
  t(`Combatente ${n}: 2 + niveis pares + marcos`, orcF("player", n, "combatente").proprioFeitico, esperado);
  t(`e bate com a formula do livro`, esperado, livroFeitico(n, false));
}

/* A Conjuração Aprimorada: "você passa a receber novos Feitiços em todo nível,
   ao invés de apenas nos níveis pares". */
for (const [n, esperado] of [[1, 2], [2, 3], [3, 4], [4, 5], [9, 10], [10, 12], [19, 21], [20, 23], [30, 33]]) {
  t(`Conjurador ${n}: 2 + todo nivel + marcos`, orcF("player", n, "conjurador").proprioFeitico, esperado);
  t(`e bate com a formula do livro`, esperado, livroFeitico(n, true));
}

/* ⚠ O 1° e o 2° NÍVEL SÃO IGUAIS NAS DUAS CADÊNCIAS, e é o que prende a leitura
   escolhida: quem concede é o nível que se SOBE, então o 1° nunca concede e o
   único par até o 2° é o próprio 2. As duas só se separam no 3°. */
t("as duas cadencias empatam no nivel 1", orcF("player", 1, "conjurador").proprioFeitico, orcF("player", 1, "combatente").proprioFeitico);
t("e no nivel 2", orcF("player", 2, "conjurador").proprioFeitico, orcF("player", 2, "combatente").proprioFeitico);
t("e so divergem a partir do 3", orcF("player", 3, "conjurador").proprioFeitico > orcF("player", 3, "combatente").proprioFeitico, true);
t("no 1 nivel sao os DOIS Feiticos iniciais, e nao tres",
  orcF("player", 1, "conjurador").proprioFeitico, 2);

/* ⚠ A CRIATURA NÃO GANHOU CAIXA PRÓPRIO NENHUM. O zero é o que mantém o Afty
   byte a byte como estava, e é também o sinal que a UI lê para saber qual
   medidor desenhar no card. */
for (const n of [1, 10, 20, 30]) {
  t(`a criatura de ND ${n} nao tem orcamento proprio`, orcF("afty", n, "conjurador").proprioFeitico, 0);
}

/* ⚠ O PORTÃO ESTÁ NA PRIMEIRA FRASE DA REGRA: "Todo usuário de energia
   amaldiçoada começa com uma certa quantidade de Feitiços". O Restringido não é
   um, e a mesma trava que zera as Aptidões dele zera isto. */
t("o Restringido do jogador nao recebe Feitico nenhum",
  orcF("player", 20, "restringido").proprioFeitico, 0);

/* O caixa próprio NÃO transborda para o contador comum, e é o ponto da palavra
   "separadas" do autor. Um Conjurador de nível 2 tem 3 de orçamento próprio mais
   1 vaga exclusiva, ou seja capacidade 4.

   ⚠ AS VAGAS EXCLUSIVAS AINDA VALEM, e a checagem do 4° Feitiço é o que prova.
   Elas são a sobra do orçamento próprio, e não morreram com o contador único: os
   sete concessores do livro (Afinidade com Técnica, Clã Gojo, Nova Habilidade,
   Dominância em Técnica, Inato, Reversão de Técnica e Extração de Potencial)
   seguem entregando vaga no jogador. */
const capacidade = fichaF("player", 2, "conjurador");
capacidade.feiticos = [1, 2, 3, 4].map((i) => ({ id: `f${i}`, nome: `F${i}`, nivel: 1, tipo: "dano" }));
const dCap = deriveAfty(capacidade).orcamentoHabilidades;
t("o 4o Feitico cai na vaga exclusiva, e nao no comum", dCap.exclusivasUsadas, 1);
t("e ainda nao ha excesso", dCap.excedeuFeitico, false);
t("e o comum segue intocado", dCap.gastosNoComum, 0);

const demais = fichaF("player", 2, "conjurador");
demais.feiticos = [1, 2, 3, 4, 5, 6].map((i) => ({ id: `f${i}`, nome: `F${i}`, nivel: 1, tipo: "dano" }));
const dDemais = deriveAfty(demais).orcamentoHabilidades;
t("seis Feiticos numa capacidade de quatro estouram o proprio", dDemais.excedeuFeitico, true);
t("e o proprio conta so o que coube", dDemais.proprioFeiticoUsado, 3);
/* ⚠ ESTE É O ASSERT QUE IMPORTA. Se o excesso caísse no contador comum, o
   Conjurador ganharia um segundo orçamento escondido de `2 × Maestria`, porque
   no jogador o comum não tem outro dono: não há Habilidade Geral, e o Estilo é
   de outra origem. */
t("e o contador COMUM segue intocado, sem segundo orcamento escondido", dDemais.gastosNoComum, 0);
t("e o `excedeu` do comum continua falso", dDemais.excedeu, false);

/* Na criatura o transbordo CONTINUA, que é o comportamento de sempre: lá o
   contador único é justamente o caixa de todos. */
const demaisAfty = fichaF("afty", 5, "conjurador");
demaisAfty.feiticos = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ id: `f${i}`, nome: `F${i}`, nivel: 1, tipo: "dano" }));
t("na criatura o Feitico continua caindo no contador comum",
  deriveAfty(demaisAfty).orcamentoHabilidades.gastosNoComum > 0, true);

/* ⚠ O PATAMAR DEIXOU DE SER LIDO NO JOGADOR. Antes deste dia o campo tinha
   sumido só da TELA, e dois pontos que produzem número seguiam lendo o valor
   gravado: o contador da aba e o coeficiente do dano. Um JSON importado traz o
   campo junto (useCreatureStorage grava `c.rulesVersion ?? defaultRulesVersion`
   e preserva o resto), então a ficha existia. */
const comPatamar = (sistema, p) => {
  const f = fichaF(sistema, 20, "conjurador");
  f.core.patamar = p;
  const d = deriveAfty(f);
  return { patamar: d.patamar, comum: d.orcamentoHabilidades.comum, dado: d.dano.entradas[0].dado };
};
const basePlayer = comPatamar("player", "comum");
for (const p of ["desafio", "calamidade", "beyond"]) {
  const v = comPatamar("player", p);
  t(`no jogador o patamar ${p} deriva como comum`, v.patamar, "comum");
  t(`e nao mexe no contador`, v.comum, basePlayer.comum);
  t(`e nao mexe no dado do dano`, v.dado, basePlayer.dado);
}
/* Na criatura ele continua valendo, que é a outra metade da divergência. A
   Maestria no ND 20 é 6 (a faixa 17 a 20), e o Beyond a triplica. */
t("na criatura o Beyond ainda triplica a Maestria", comPatamar("afty", "beyond").comum, 3 * 6);
t("e ainda sobe o dado do dano", comPatamar("afty", "beyond").dado !== comPatamar("afty", "comum").dado, true);

/* ============================================================ */

/* ============================================================ */
/* 12. CONTEÚDO QUE SAIU DA FICHA DE JOGADOR — 2026-09-01        */
/* ============================================================ */

/* Quatro pedidos do autor em sequência, todos com a mesma forma: *"Remova [X] da
   Ficha de Player e deixe somente por Addon."*

   ⚠ NENHUM VIROU ADDON DE VERDADE, e a decisão é medida e não gosto: o Gêmeos
   tem NOVE ganchos no motor presos ao id CRU `"gemeos"`, e id de addon nasce com
   o namespace do pacote. Virar `pacote:gemeos` quebraria os nove CALADOS. Por
   isso o que muda é a LISTA, e o id fica em paz.

   ⚠ E É UM MECANISMO SÓ para os quatro (`foraDoJogador` no catálogo, mais a
   divergência `conteudoSoPorAddon`), porque a regra é a mesma: o que muda de uma
   entrada para outra é só QUAL entrada. */

const O = await import(R + "afty-origens.js");
const TRE = await import(R + "afty-treinamentos.js");
const HAB = await import(R + "afty-habilidades.js");
const TAL = await import(R + "afty-talentos.js");
const ADD = await import(R + "afty-addons.js");

const fichaDe = (sistema, patch = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  return { ...f, ...patch };
};
const liberaSo = (id) => ({
  id: "casa", nome: "Casa", versao: "1.0.0", acrescenta: {},
  libera: [ADD.liberacaoSoPorAddon(id)],
});
const OUTRA = { id: "outra", nome: "Outra", versao: "1.0.0", acrescenta: {}, libera: ["estiloSombras"] };

/* Cada linha: como se pergunta se a entrada aparece, o id da liberação, e como
   uma ficha registra que JÁ a escolheu. */
const REMOVIDAS = [
  ["origem Gêmeos", "gemeos",
    (f) => O.origensDoSistema(f).some((o) => o.value === "gemeos"),
    (f) => { f.core.origem = { id: "gemeos" }; }],
  ["Treino de Atributo", "atributo",
    (f) => TRE.treinamentosDaOrigem("inato", null, f).some((l) => l.id === "atributo"),
    (f) => { f.treinamentos = { atributo: [{ alvo: "forca", progresso: 2 }] }; }],
  ["[2.0] Agilidade no Campo de Batalha", "cnj_agilidade_no_campo_de_batalha",
    (f) => HAB.gruposDeHabilidade("conjurador", f)
      .some((g) => g.habilidades.some((h) => h.id === "cnj_agilidade_no_campo_de_batalha")),
    (f) => { f.habilidades = ["cnj_agilidade_no_campo_de_batalha"]; }],
  ["Talento Alma Livre", "tal_alma_livre",
    (f) => TAL.gruposDeTalento(f).some((g) => g.talentos.some((t) => t.id === "tal_alma_livre")),
    (f) => { f.talentos = ["tal_alma_livre"]; }],
];

for (const [nome, libId, aparece, marcaFicha] of REMOVIDAS) {
  t(`na criatura, ${nome} continua na lista`, aparece(fichaDe("afty")), true);
  t(`e no jogador ${nome} sai`, aparece(fichaDe("player")), false);
  t(`um Addon que libera ${nome} a traz de volta`,
    aparece(fichaDe("player", { addons: [liberaSo(libId)] })), true);
  /* Liberação é NOMEADA: um addon que abre outra coisa não abre esta. */
  t(`e um Addon que libera outra coisa não abre ${nome}`,
    aparece(fichaDe("player", { addons: [OUTRA] })), false);
  /* ⚠ A PORTA QUE PROTEGE FICHA SALVA (decisão do autor). Sem ela a lista abriria
     sem a opção gravada, e a próxima edição trocaria a escolha do personagem. */
  const salvo = fichaDe("player");
  marcaFicha(salvo);
  t(`a ficha que JÁ tem ${nome} continua vendo a opção`, aparece(salvo), true);
}

/* Liberar UMA não pode abrir as outras três de brinde: é o motivo de o id da
   liberação carregar o id da entrada em vez de ser uma chave geral. */
const soOGemeos = fichaDe("player", { addons: [liberaSo("gemeos")] });
t("liberar o Gêmeos não devolve o Alma Livre", REMOVIDAS[3][2](soOGemeos), false);
t("e devolve o Gêmeos", REMOVIDAS[0][2](soOGemeos), true);

/* ⚠ DECLARADO vs REGISTRADO. A marca no catálogo e a liberação são dois lados, e
   se um deles faltar o sintoma é mudo: entrada marcada sem liberação é entrada
   que NINGUÉM consegue devolver, e liberação sem entrada é letra morta. */
const marcadas = [...O.AFTY_ORIGENS_CATALOG, ...TRE.AFTY_TREINAMENTOS,
  ...HAB.AFTY_HABILIDADES, ...TAL.AFTY_TALENTOS]
  .filter((e) => e?.foraDoJogador).map((e) => e.id).sort();
const registradas = ADD.LIBERACOES.map((l) => l.id)
  .filter((id) => id.startsWith("soPorAddon:"))
  .map((id) => id.slice("soPorAddon:".length)).sort();
t("toda entrada marcada tem liberação, e vice-versa", marcadas, registradas);
t("e são as quatro que o autor nomeou", marcadas,
  ["atributo", "cnj_agilidade_no_campo_de_batalha", "gemeos", "tal_alma_livre"]);

/* A lista some UMA entrada por vez, e não leva vizinho junto. */
t("o filtro tira exatamente uma origem",
  O.origensDoSistema(fichaDe("afty")).length - O.origensDoSistema(fichaDe("player")).length, 1);

/* ⚠ E O MOTOR NÃO SENTE NADA: o filtro é de LISTA, então uma ficha que tem a
   entrada deriva igual nos dois sistemas. É o que separa este mecanismo de uma
   divergência de número. */
const comGemeos = (sistema) => {
  const f = fichaDe(sistema);
  f.core.origem = { id: "gemeos", iniciativaIrmao: "7" };
  return deriveAfty(f).iniciativa;
};
const semGemeos = (sistema) => {
  const f = fichaDe(sistema);
  f.core.origem = { id: "inato" };
  return deriveAfty(f).iniciativa;
};
t("a Dupla Empenhada soma o irmão na criatura", comGemeos("afty") - semGemeos("afty"), 7);
t("e soma igual no jogador, porque o filtro é de lista", comGemeos("player") - semGemeos("player"), 7);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
