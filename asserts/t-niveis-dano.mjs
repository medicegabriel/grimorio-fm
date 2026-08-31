/* NÍVEIS DE DANO — a escada de dados da FICHA DE JOGADOR (autor, 2026-08-31).

   O que este arquivo mede, em ordem de importância:

     1. A ESCADA REPRODUZ A TABELA DO LIVRO. As seis primeiras linhas são geradas
        a partir da escada e comparadas célula por célula com o que está
        impresso. A sétima NÃO entra: o autor confirmou que ela está errada, e há
        assert medindo justamente que ela não é seguida.

     2. O EXEMPLO DO LIVRO FECHA. "se uma arma causar, por base, 6d6 de dano e
        tiver seu dano aumentado em 1 nível ela passaria a causar 3d12+1d4".

     3. A LINHA DE DANO DO JOGADOR É O DADO DA ARMA MAIS O MODIFICADOR, e a da
        criatura não mudou nada.

     4. AS ESCADAS DO DESARMADO NÃO CONTAM DUAS VEZES. Corpo Treinado e Armas
        Naturais emitem `nivelDano` para a criatura E têm dado absoluto no
        jogador. Contar os dois somaria o mesmo ganho duas vezes. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const N = await import(R + "afty-niveis-dano.js");
const EC = await import(R + "afty-efeitos-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A ESCADA REPRODUZ A TABELA DO LIVRO                        */
/* ============================================================ */

t("o validador da escada passa limpo", N.validarNiveisDano(), []);

const mover = (d, n) => N.moverNivel(d, n).texto;

/* As SEIS primeiras linhas da tabela, VERBATIM do livro, na ordem
   `-2 | -1 | PADRÃO | +1 | +2 | +3`. A célula "ou" foi resolvida pela forma de
   um dado só, que é a que a escada usa como nome do degrau. */
const TABELA_DO_LIVRO = [
  ["1", "1d2", "1d3", "1d4", "1d6", "1d8"],
  ["1d2", "1d3", "1d4", "1d6", "1d8", "1d10"],
  ["1d3", "1d4", "1d6", "1d8", "1d10", "1d12"],
  ["1d4", "1d6", "1d8", "1d10", "1d12", "1d12 + 1d4"],
  ["1d6", "1d8", "1d10", "1d12", "1d12 + 1d4", "1d12 + 1d6"],
  ["1d8", "1d10", "1d12", "1d12 + 1d4", "1d12 + 1d6", "1d12 + 1d8"],
];

for (const linha of TABELA_DO_LIVRO) {
  const padrao = linha[2];
  for (const [col, passo] of [[0, -2], [1, -1], [3, 1], [4, 2], [5, 3]]) {
    t(`${padrao} com ${passo > 0 ? "+" : ""}${passo} nivel`, mover(padrao, passo), linha[col]);
  }
  t(`${padrao} com 0 nivel nao se mexe`, mover(padrao, 0), padrao);
}

/* ⚠ A SÉTIMA LINHA DA TABELA ESTÁ ERRADA (autor, 2026-08-31), e este assert
   existe para que ninguém a "conserte" de volta. Ela dizia que 2d8 com +1 vira
   2d10, andando de 4 em 4 de resultado máximo enquanto a escada anda de 2 em 2. */
t("a Espada Colossal (2d8) com +1 nivel NAO vira 2d10", mover("2d8", 1), "1d12 + 1d6");
t("e o Rifle de Precisao (2d10) tambem segue a escada", mover("2d10", 1), "1d12 + 1d10");

/* As células com "ou" são o mesmo nível escrito de duas formas, e caem sozinhas
   pela regra do resultado máximo. */
t("2d4 e 1d8 sao o mesmo degrau", N.nivelDoDado("2d4"), N.nivelDoDado("1d8"));
t("2d6 e 1d12 sao o mesmo degrau", N.nivelDoDado("2d6"), N.nivelDoDado("1d12"));

/* O exemplo do livro, palavra por palavra. */
t("6d6 com +1 nivel vira 3d12 + 1d4", mover("6d6", 1), "3d12 + 1d4");
t("porque 6d6 e 3d12 tem o mesmo maximo", N.maximoDe(N.lerDado("6d6")), 36);

/* A descida fecha em "1 de dano", e não em zero nem em negativo. */
t("a descida para em 1 de dano", mover("1d4", -20), "1");
t("e o 1 nao desce mais", mover("1", -5), "1");

/* O dado adicional vale o MAIOR do nível, verbatim. */
t("o maior dado de 1d12 + 1d6 e o d12", N.maiorDadoDe(N.lerDado("1d12 + 1d6")), 12);
t("e o de 2d4 e o d4", N.maiorDadoDe(N.lerDado("2d4")), 4);

/* ============================================================ */
/* 2. AS ESCADAS DO DESARMADO ESTÃO DECLARADAS NO MOTOR          */
/* ============================================================ */

/* ⚠ ESTE É O ASSERT QUE IMPEDE UM BUG SILENCIOSO. O desconto das escadas do
   desarmado casa por `origem` MAIS `nome`, então renomear uma linha no catálogo
   faria o desconto parar de casar e o desarmado do jogador engordaria sozinho,
   sem uma linha de aviso. Aqui o nome é medido contra o catálogo de verdade. */
for (const esperado of N.ESCADAS_DESARMADO_NO_MOTOR) {
  const lista = EC.HABILIDADE_EFEITOS[esperado.origem]
    ?? EC.APTIDAO_EFEITOS[esperado.origem]
    ?? [];
  const achou = lista.some((l) => l.canal === "nivelDano" && l.nome === esperado.nome);
  t(`a linha "${esperado.nome}" existe no catalogo`, achou, true);
}

/* ============================================================ */
/* 3. A LINHA DE DANO DO JOGADOR                                 */
/* ============================================================ */

const ficha = (sistema, nivel, opcoes = {}) => {
  const {
    classe = "combatente", arma = "arm_espada_longa", grau = null,
    duasMaos = false, forca = 18, destreza = 12, aptidoes = [],
  } = opcoes;
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum", tecnicaAttr: "presenca" };
  f.especializacoes = [{ id: classe, nivel }];
  f.attributes = { forca, destreza, constituicao: 14, inteligencia: 10, sabedoria: 10, presenca: 10 };
  if (aptidoes.length) f.aptidoesAmaldicoadas = aptidoes;
  if (arma) {
    f.equipamentos = { itens: [{
      id: "e1", tipo: "arma", refId: arma, qtd: 1, equipado: true,
      ...(duasMaos ? { duasMaos: true } : {}),
      ...(grau ? { fa: { grau, encantamentos: [] } } : {}),
    }] };
  }
  return f;
};
const linha = (d, id) => d.dano.entradas.find((x) => x.id === id);
const texto = (d, id) => linha(d, id)?.texto ?? "(sem linha)";

/* O dado impresso na tabela de equipamentos, mais o modificador, e nada mais.
   Combatente 10 com Força 18 (+4). */
t("Espada Longa (1d8) e 1d8 + 4", texto(deriveAfty(ficha("player", 10)), "arm_espada_longa"), "1d8 + 4");
t("Espada Curta (1d6) e 1d6 + 4",
  texto(deriveAfty(ficha("player", 10, { arma: "arm_espada_curta" })), "arm_espada_curta"), "1d6 + 4");

/* ⚠ O MODIFICADOR ENTRA UMA VEZ SÓ, e não uma por dado. */
t("a Espada Colossal (2d8) e 2d8 + 4, e nao 2d8 + 8",
  texto(deriveAfty(ficha("player", 10, { arma: "arm_espada_colossal" })), "arm_espada_colossal"), "2d8 + 4");

/* ⚠ O DADO IMPRESSO É PRESERVADO enquanto nada o move. A Espada Colossal
   continua 2d8 na linha de dano, batendo com o que a aba de Equipamentos mostra,
   em vez de virar o 1d12 + 1d4 da escada. */
t("e o dado impresso nao e reescrito pela escada sem motivo",
  linha(deriveAfty(ficha("player", 10, { arma: "arm_espada_colossal" })), "arm_espada_colossal")
    .partes[0].texto, "2d8");

/* ⚠ A TABELA TEM TRÊS FORMAS DE DANO, e a terceira quase passou batido. O
   Chicote Espinhento e a Kusarigama trazem `dano.dados` em ARRAY (dois dados de
   TIPOS diferentes, o "1d6/1d6" da tabela que não é versátil) e não têm
   `dano.dado`. Elas caíam no `1d3` do desarmado, caladas: a linha dizia
   `1d3 + 4` numa arma de 2d6 de dano. */
for (const id of ["arm_chicote_espinhento", "arm_kusarigama"]) {
  t(`${id} soma os dois dados da tabela`,
    texto(deriveAfty(ficha("player", 10, { arma: id })), id), "1d6 + 1d6 + 4");
  t(`e nao cai no 1d3 do desarmado`,
    linha(deriveAfty(ficha("player", 10, { arma: id })), id).partes[0].texto, "1d6 + 1d6");
}

/* A arma a distância usa Destreza, como a jogada de ataque dela. */
t("a Bazuca usa Destreza, e nao Forca",
  texto(deriveAfty(ficha("player", 10, { arma: "arm_bazuca", destreza: 16 })), "arm_bazuca"), "3d12 + 3");

/* Versátil: o manejo escolhido na ficha decide o dado. */
t("Espada Longa numa mao e 1d8", texto(deriveAfty(ficha("player", 10)), "arm_espada_longa"), "1d8 + 4");
t("e nas duas maos e 1d10",
  texto(deriveAfty(ficha("player", 10, { duasMaos: true })), "arm_espada_longa"), "1d10 + 4");

/* ⚠ O GRAU DA FERRAMENTA NÃO DÁ DANO NEM ACERTO NO JOGADOR (autor). O
   encantamento continua valendo, e é por isso que a divergência mexe no grau e
   não na Ferramenta. */
const semGrau = deriveAfty(ficha("player", 10));
const comGrau = deriveAfty(ficha("player", 10, { grau: "especial" }));
t("o Grau Especial nao muda o dano do jogador",
  texto(comGrau, "arm_espada_longa"), texto(semGrau, "arm_espada_longa"));
t("nem o acerto dele",
  linha(comGrau, "arm_espada_longa").acerto, linha(semGrau, "arm_espada_longa").acerto);

/* Na criatura o grau continua valendo inteiro, que é a outra metade. */
const semGrauAfty = deriveAfty(ficha("afty", 10));
const comGrauAfty = deriveAfty(ficha("afty", 10, { grau: "especial" }));
t("na criatura o Grau Especial ainda soma 20 de dano",
  linha(comGrauAfty, "arm_espada_longa").total - linha(semGrauAfty, "arm_espada_longa").total, 20);
t("e ainda soma 5 de acerto",
  linha(comGrauAfty, "arm_espada_longa").acerto - linha(semGrauAfty, "arm_espada_longa").acerto, 5);

/* ============================================================ */
/* 4. O GOLPE DESARMADO                                          */
/* ============================================================ */

/* "Se não haver nenhum dos dois, é 1d3 + Mod. Força ou Mod. Dex." */
t("sem Lutador nem Arma Natural o desarmado e 1d3 + mod",
  texto(deriveAfty(ficha("player", 10, { arma: null })), "basico"), "1d3 + 4");

/* ⚠ O CORPO TREINADO DÁ O DADO ABSOLUTO DO TEXTO DELE, e não um degrau sobre o
   1d3. "O dano dos seus ataques desarmados se torna 1d8. Nos níveis 5, 9, 13 e
   17 seu dano desarmado aumenta para 1d10, 1d12, 2d8 e 2d12."

   Se as duas contas se somassem (o dado absoluto MAIS o `nivelDano` que a mesma
   habilidade emite para a criatura), o Lutador de 1° nível sairia com 1d10 em
   vez de 1d8. É o desconto de ESCADAS_DESARMADO_NO_MOTOR que impede isso. */
for (const [nivel, dado] of [[1, "1d8"], [5, "1d10"], [9, "1d12"], [13, "2d8"], [17, "2d12"]]) {
  const d = deriveAfty(ficha("player", nivel, { classe: "lutador", arma: null }));
  const l = linha(d, "basico");
  t(`Lutador ${nivel} rola ${dado} no desarmado`, l.partes[0].texto, dado);
  t(`e o Nivel de Dano liquido dele e zero`, l.niveisDano, 0);
}

/* A escala do Corpo Treinado é o nível de LUTADOR, e não o do personagem: um
   Combatente 17 com um nível de Lutador rola o 1d8 do 1° nível. */
const multi = ficha("player", 17, { arma: null });
multi.especializacoes = [{ id: "combatente", nivel: 16 }, { id: "lutador", nivel: 1 }];
t("o Corpo Treinado escala pelo nivel de LUTADOR, e nao pelo do personagem",
  linha(deriveAfty(multi), "basico").partes[0].texto, "1d8");

/* Armas Naturais: mesma ideia, e a escala é o nível do personagem. */
for (const [nivel, dado] of [[1, "1d8"], [5, "1d10"], [9, "1d12"], [13, "2d10"], [17, "2d12"]]) {
  const d = deriveAfty(ficha("player", nivel, { arma: null, aptidoes: ["mal_armas_naturais"] }));
  t(`Armas Naturais no nivel ${nivel} rolam ${dado}`, linha(d, "basico").partes[0].texto, dado);
}

/* ⚠ VALE O MAIOR, e não a soma: as três descrevem o MESMO golpe. Um Lutador 1
   (1d8) com Armas Naturais no nível 13 (2d10) rola o 2d10. */
const ambos = ficha("player", 13, { arma: null, aptidoes: ["mal_armas_naturais"] });
ambos.especializacoes = [{ id: "lutador", nivel: 13 }];
t("com as duas fontes vale a maior", linha(deriveAfty(ambos), "basico").partes[0].texto, "2d10");

/* ============================================================ */
/* 5. NÍVEL DE DANO COMO DEGRAU, E OS OUTROS CANAIS              */
/* ============================================================ */

/* Armas Escolhidas do Combatente: "seus ataques com armas dele tem o nível de
   dano aumentado em 3". Numa Espada Longa de 1d8, três degraus dão 1d12 + 1d4. */
const escolhidas = ficha("player", 10);
escolhidas.habilidades = ["cmb_armas_escolhidas"];
escolhidas.escolhasHabilidade = { cmb_armas_escolhidas: ["cmb_grupo_espada"] };
const dEsc = deriveAfty(escolhidas);
t("tres Niveis de Dano levam 1d8 a 1d12 + 1d4",
  texto(dEsc, "arm_espada_longa"), "1d12 + 1d4 + 4");
t("e o hover mostra o dado IMPRESSO na primeira linha",
  linha(dEsc, "arm_espada_longa").partes[0], { label: "Dano da Arma", texto: "1d8" });
t("e o degrau na segunda", linha(dEsc, "arm_espada_longa").partes[1].label, "Níveis de Dano (+3)");

/* ⚠ NA CRIATURA O MESMO CANAL SOMA NO ND, e não move dado nenhum. É o mesmo
   `nivelDano`, lido por duas réguas. */
const escAfty = { ...escolhidas, rulesVersion: "afty" };
t("na criatura os tres Niveis de Dano somam no ND",
  linha(deriveAfty(escAfty), "arm_espada_longa").total
  - linha(deriveAfty({ ...ficha("afty", 10) }), "arm_espada_longa").total, 6);

/* O crítico dobra só os DADOS. Com dois grupos (1d12 + 1d4) os dois multiplicam,
   e o fixo viaja num grupo só para não ser somado duas vezes. */
const grupos = linha(dEsc, "arm_espada_longa").gruposDano;
t("um degrau de dois dados vira dois grupos", grupos.length, 2);
t("e os dois multiplicam no critico", grupos.every((g) => g.multiplica), true);
t("e o fixo aparece uma vez so", grupos.filter((g) => g.fixo !== 0).length, 1);
t("e o fixo e o modificador", grupos.find((g) => g.fixo !== 0).fixo, 4);

/* ⚠ O SEGUNDO GRUPO É MARCADO COMO JÁ ESCRITO NO TEXTO. A aba Ações desenha um
   chip para cada grupo depois do primeiro, porque na criatura todo grupo extra é
   mesmo um extra (Fatal, Mortal, Destruidora, Golpe Especial). No jogador o
   segundo grupo é a segunda metade do degrau, e sem esta marca a Ficha mostrava
   `1d12 + 1d4 + 4` com um chip `+1d4` ao lado: o mesmo dado duas vezes. */
t("o segundo grupo do degrau nao vira chip na Ficha", grupos[1].incluidoNoTexto, true);

/* ⚠ O RODAPÉ DO HOVER MOSTRA A ROLAGEM, e não uma média. O painel de fontes
   fecha com uma linha "Total", e no jogador as parcelas são um dado e um
   modificador: um número ali leria como se `1d8` mais `4` desse aquele valor. */
t("o rodape do hover do jogador e a expressao",
  linha(deriveAfty(ficha("player", 10)), "arm_espada_longa").totalFontes, "1d8 + 4");
t("e a criatura nao ganhou o campo",
  linha(deriveAfty(ficha("afty", 10)), "arm_espada_longa").totalFontes, undefined);
t("e o primeiro nao carrega a marca", grupos[0].incluidoNoTexto, undefined);

/* Na criatura nada disso mudou: um grupo só, e sem a marca. */
const gruposAfty = linha(deriveAfty({ ...ficha("afty", 10) }), "arm_espada_longa").gruposDano;
t("a criatura segue com um grupo so", gruposAfty.length, 1);
t("e o fixo dela e o da formula", gruposAfty[0].fixo, linha(deriveAfty({ ...ficha("afty", 10) }), "arm_espada_longa").fixo);

/* ============================================================ */

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
