/**
 * CARTEIRA: o livro-caixa das sessões da Guilda.
 *
 * Pedido do autor em 2026-09-08. O pacote é `addons/carteira-da-guilda.json`, e
 * ele não traz dado nenhum: a Carteira inteira é verbo do motor, e o que o
 * addon acrescenta é o `permite` (a aba) mais o `libera` (os Focos).
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. A SEPARAÇÃO ENTRE OS DOIS CAMPOS. `permite` é tela e não pode mexer em
 *    número nenhum, `libera` é regra e muda o orçamento de Focos. É a promessa
 *    inteira do sistema de Addons, e aqui ela é medida nos dois sentidos: com o
 *    pacote só de `permite` a ficha tem de sair IDÊNTICA à raw.
 * 2. A CARTEIRA SUBSTITUI A BASE DOS FOCOS, e não soma nela. Somar cobraria o
 *    mesmo Interlúdio duas vezes, uma pelo ND e outra pela anotação.
 * 3. O canal `focos` continua entrando POR CIMA nos três casos (ND, campo do
 *    jogador e Carteira), senão uma habilidade que concede Foco viraria letra
 *    morta para quem instalasse o addon.
 * 4. A VÍRGULA DO TECLADO BRASILEIRO É LIDA. O autor digita "1.050,00", e um
 *    parser que só entende ponto zeraria a linha calado.
 * 5. Os centavos não viram dízima de ponto flutuante no total.
 * 6. Linha com tipo desconhecido NÃO morre: o tipo é etiqueta e não decide
 *    conta nenhuma, ao contrário da família da Loja de Catarse.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { normalizarPacote, validarPacote, PRIMITIVAS, LIBERACOES, primitivasDaCriatura, liberacoesDaCriatura } = await import(R + "afty-addons.js");
const C = await import(R + "afty-carteira.js");
/* A Maestria e o Grau que o SISTEMA já calculava antes deste addon. O bloco 7.1
   os compara com as duas colunas que o autor mandou junto da tabela de XP. */
const { maestria } = await import(R + "afty-derive.js");
const { grauFeiticeiro } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = normalizarPacote(
  JSON.parse(readFileSync(new URL("../addons/carteira-da-guilda.json", import.meta.url), "utf8")),
);
/* O mesmo pacote SEM a liberação. Ele é a prova do item 1: instalar a aba não
   pode mover um número da ficha. */
const soAba = { ...pacote, libera: [] };

/* ============================================================ */
/* 1. O PACOTE, A PRIMITIVA E A LIBERAÇÃO                        */
/* ============================================================ */
t("o pacote valida sem problema nenhum", validarPacote(pacote), []);
t("ele pede a primitiva da aba", pacote.permite, ["carteira"]);
t("e as duas liberações", pacote.libera, ["carteiraFocos", "carteiraNivel"]);
t("a primitiva existe no registro", PRIMITIVAS.some((p) => p.id === "carteira"), true);
t("as duas liberações existem no registro",
  ["carteiraFocos", "carteiraNivel"].every((id) => LIBERACOES.some((l) => l.id === id)), true);
t("o pacote não traz catálogo nenhum", Object.keys(pacote.acrescenta), []);
t("nem remendo nenhum", Object.keys(pacote.substitui), []);
t("o catálogo de tipos não tem erro", C.validarCatalogoCarteira(), []);

/* ============================================================ */
/* 2. AS DUAS LISTAS SOMANDO                                     */
/* ============================================================ */
/* As linhas são as da planilha do autor, com os números dele. */
const SESSOES = [
  { id: "e1", nome: "Carga Explosiva pt. 2", xp: 10.5, dinheiro: 1050, interludios: 3, tipo: "jogada" },
  { id: "e2", nome: "Valley Ywa", xp: 20.25, dinheiro: 1350, interludios: 3, tipo: "jogada" },
  { id: "e3", nome: "Salário", xp: 5, dinheiro: 1000, interludios: 2, tipo: "" },
  { id: "e4", nome: "Mesa que eu mestrei", xp: 4.5, dinheiro: 300, interludios: 1, tipo: "mestrado" },
];
const GASTOS = [
  { id: "g1", nome: "Mansão", fonte: "Residência", tipo: "compra", valor: 3000 },
  { id: "g2", nome: "Doação para Shaula", fonte: "Minha", tipo: "transacao", valor: 250 },
];

const extrato = C.resolveCarteira({ carteira: { entradas: SESSOES, gastos: GASTOS } });
t("XP total", extrato.xpTotal, 40.25);
t("Interlúdios totais", extrato.interludios, 9);
t("dinheiro recebido", extrato.ganho, 3700);
t("dinheiro retirado", extrato.retirado, 3250);
t("dinheiro atual e o recebido menos o retirado", extrato.atual, 450);
t("sem aviso nenhum quando está tudo certo", extrato.avisos, []);

/* ⚠ OS CENTAVOS NÃO VIRAM DÍZIMA. Sem o arredondamento em duas casas isto sai
   como 0.30000000000000004 e chega assim à tela. */
t("os centavos fecham",
  C.resolveCarteira({ carteira: { entradas: [{ dinheiro: 0.1 }, { dinheiro: 0.2 }] } }).ganho, 0.3);

t("carteira ausente devolve extrato zerado, e não quebra",
  [C.resolveCarteira(null).ganho, C.resolveCarteira({}).interludios, C.resolveCarteira({ carteira: 7 }).xpTotal],
  [0, 0, 0]);
t("lixo no lugar da linha é ignorado, e o resto continua somando",
  C.resolveCarteira({ carteira: { entradas: [null, "x", { dinheiro: 5 }] } }).ganho, 5);

/* ============================================================ */
/* 3. A VÍRGULA DO TECLADO BRASILEIRO                            */
/* ============================================================ */
/* O autor digita dinheiro como "1.050,00". Um parser que só entende ponto lê
   isso como NaN e zera a linha sem dizer nada, que é o defeito mais caro que
   esta aba poderia ter: some dinheiro do extrato e ninguém vê. */
const lido = (v) => C.normalizaEntradaCarteira({ dinheiro: v }).dinheiro;
t("vírgula é decimal", lido("10,5"), 10.5);
t("ponto de milhar com vírgula de decimal", lido("1.050,00"), 1050);
t("mais de um ponto de milhar", lido("51.117,25"), 51117.25);
t("sem vírgula, o ponto é decimal como em JS", lido("1.5"), 1.5);
t("número puro continua número", [lido(1050), lido("1050")], [1050, 1050]);
t("campo vazio vale zero", [lido(""), lido(" "), lido(null), lido(undefined)], [0, 0, 0, 0]);
t("texto que não é número vale zero", lido("abc"), 0);
t("o XP lê a vírgula pelo mesmo caminho",
  C.normalizaEntradaCarteira({ xp: "20,25" }).xp, 20.25);

/* ============================================================ */
/* 4. NEGATIVO: A ENTRADA ACEITA, O GASTO NÃO                    */
/* ============================================================ */
/* A entrada é o único lugar onde cabe correção de XP e de Interlúdio, porque
   não existe lista de gasto para os dois. Já um gasto negativo seria uma
   entrada de dinheiro, e a lista de entradas está logo acima: aceitar os dois
   caminhos abriria uma segunda porta calada para a mesma regra. */
t("entrada aceita correção negativa",
  [C.normalizaEntradaCarteira({ xp: -1 }).xp,
    C.normalizaEntradaCarteira({ interludios: -2 }).interludios,
    C.normalizaEntradaCarteira({ dinheiro: -50 }).dinheiro],
  [-1, -2, -50]);
t("gasto negativo é aparado em zero", C.normalizaGastoCarteira({ valor: -5 }).valor, 0);

/* Gastar mais do que entrou é erro de anotação do jogador, e o extrato REPORTA
   em vez de corrigir: apagar o gasto mais caro por conta própria seria escolher
   por ele. É a convenção de todo orçamento do projeto. */
const estourado = C.resolveCarteira({ carteira: { entradas: [{ dinheiro: 10 }], gastos: [{ valor: 40 }] } });
t("o atual fica negativo", estourado.atual, -30);
t("o gasto continua na lista", estourado.gastos.length, 1);
t("e o extrato avisa", estourado.avisos.length, 1);

/* ============================================================ */
/* 5. TIPO DESCONHECIDO NÃO MATA A LINHA                         */
/* ============================================================ */
/* ⚠ É O CONTRÁRIO DA LOJA DE CATARSE, e de propósito. Lá a família decide o
   CANAL em que a compra vira vaga, então uma família desconhecida não tem para
   onde ir e a linha morre marcada. Aqui o tipo é etiqueta: os três números da
   linha valem igual em qualquer tipo, e apagar a linha por causa dele jogaria
   dinheiro fora por um rótulo. */
const comTipoEstranho = C.resolveCarteira({
  carteira: { entradas: [{ nome: "x", dinheiro: 100, interludios: 2, tipo: "torneio" }] },
});
t("a linha continua na lista", comTipoEstranho.entradas.length, 1);
t("e os números dela continuam valendo",
  [comTipoEstranho.ganho, comTipoEstranho.interludios], [100, 2]);
t("o tipo cai no neutro", comTipoEstranho.entradas[0].tipo, "");
t("mas o que estava gravado é preservado para a tela mostrar",
  comTipoEstranho.entradas[0].tipoCru, "torneio");
t("e o extrato avisa", comTipoEstranho.avisos.length, 1);
t("tipo conhecido não deixa resto nenhum",
  "tipoCru" in C.normalizaEntradaCarteira({ tipo: "jogada" }), false);
/* A entrada neutra tem de existir na lista, senão o `<select>` da tela abriria
   sem opção marcada para toda linha nova. */
t("o id vazio está nas duas listas de tipo",
  [C.CARTEIRA_TIPOS.some((x) => x.id === ""), C.CARTEIRA_GASTO_TIPOS.some((x) => x.id === "")],
  [true, true]);

/* ⚠ A LISTA DE TIPOS É FECHADA, e o autor a mudou em 2026-09-08: entraram
   Domingo, Transferência e Staff, e SAIU Bônus Externos. A lista está aqui
   inteira porque tipo novo tem de passar por uma decisão, e não entrar de
   carona. */
t("os tipos de sessão são os do autor", C.CARTEIRA_TIPOS.map((x) => x.id),
  ["", "jogada", "mestrado", "domingo", "transferencia", "staff", "outros"]);
t("Bônus Externos saiu", C.CARTEIRA_TIPOS.some((x) => x.id === "externo"), false);

/* ⚠ E A FICHA QUE JÁ TINHA `externo` GRAVADO NÃO PERDE NADA. É o caso real de
   quem lançou sessões antes da mudança, e é a razão de o tipo desconhecido cair
   no neutro em vez de matar a linha. */
const comExterno = C.resolveCarteira({
  carteira: { entradas: [{ nome: "antiga", xp: 5, dinheiro: 900, interludios: 2, tipo: "externo" }] },
});
t("a linha de Bônus Externos continua valendo",
  [comExterno.xpTotal, comExterno.ganho, comExterno.interludios], [5, 900, 2]);
t("e o tipo antigo fica guardado", comExterno.entradas[0].tipoCru, "externo");

/* ============================================================ */
/* 5.1. ORDEM: ARRASTAR É POR ID                                 */
/* ============================================================ */
/* ⚠ POR ID, E NÃO POR ÍNDICE, e é o que faz o arrastar continuar certo com o
   filtro ligado: com a lista filtrada o índice da tela não é o índice da ficha.
   O `+ (de <= para ? 1 : 0)` é o mesmo do `reordenarPericia`: descendo entra
   DEPOIS do alvo, subindo entra ANTES. */
const L = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
const ordem = (l) => l.map((x) => x.id).join("");
t("descendo, entra depois do alvo", ordem(C.moverNaCarteira(L, "a", "c")), "bcad");
t("subindo, entra antes do alvo", ordem(C.moverNaCarteira(L, "d", "b")), "adbc");
t("mover para si mesmo não faz nada", ordem(C.moverNaCarteira(L, "a", "a")), "abcd");
t("id que não existe não faz nada", ordem(C.moverNaCarteira(L, "z", "b")), "abcd");
t("alvo que não existe não faz nada", ordem(C.moverNaCarteira(L, "a", "z")), "abcd");
t("lista que não é lista não quebra", C.moverNaCarteira(null, "a", "b"), []);
/* ⚠ SALTANDO UMA LINHA ESCONDIDA. Com o filtro ligado só "a" e "d" aparecem, e
   arrastar "d" para cima de "a" tem de pôr "d" antes de "a" na ficha INTEIRA,
   sem embaralhar "b" e "c". */
t("a linha escondida guarda a posição relativa dela",
  ordem(C.moverNaCarteira(L, "d", "a")), "dabc");

/* ============================================================ */
/* 5.2. FILTRO                                                   */
/* ============================================================ */
const LINHAS = [
  { id: "a", nome: "Sessão Gal", tipo: "jogada" },
  { id: "b", nome: "Domingo 06/09", tipo: "domingo" },
  { id: "c", nome: "Antiga", tipo: "externo" },
  { id: "d", nome: "Staff Semana 8", tipo: "staff" },
  { id: "e", nome: "Sem nada" },
];
const filtrou = (opcoes) => C.filtraLinhasCarteira(LINHAS, opcoes).map((x) => x.id);
t("sem filtro, tudo passa", filtrou({}), ["a", "b", "c", "d", "e"]);
t("por tipo", filtrou({ tipo: "staff" }), ["d"]);
/* ⚠ O NEUTRO CASA COM O QUE A TELA MOSTRA. A linha de tipo `externo` aparece no
   `<select>` como "Sem Tipo", então filtrar por "Sem Tipo" tem de trazê-la:
   filtrar pelo valor CRU deixaria de fora exatamente a linha que a pessoa está
   procurando para arrumar. */
t("o neutro pega a linha de tipo desconhecido também", filtrou({ tipo: "" }), ["c", "e"]);
t("busca sem acento dos dois lados", filtrou({ termo: "sessao" }), ["a"]);
t("busca não diferencia maiúscula", filtrou({ termo: "STAFF" }), ["d"]);
t("busca olha a fonte do gasto também",
  C.filtraLinhasCarteira([{ id: "g", nome: "Mansão", fonte: "Residência" }], { termo: "residencia" }).length, 1);
t("tipo e termo somam", filtrou({ tipo: "jogada", termo: "gal" }), ["a"]);
t("termo que não casa com nada devolve lista vazia", filtrou({ termo: "zzz" }), []);

/* ⚠ O FILTRO NÃO ENCOSTA EM TOTAL NENHUM. Os cinco números da faixa respondem
   "quanto eu tenho", e não "quanto aparece agora": um total que mudasse junto
   com o filtro seria a forma mais fácil de alguém ler o saldo errado. */
const cheia = { carteira: { entradas: SESSOES, gastos: GASTOS } };
t("o extrato não recebe filtro nenhum",
  [C.resolveCarteira(cheia).xpTotal, C.resolveCarteira(cheia).interludios],
  [40.25, 9]);

/* ============================================================ */
/* 6. `permite` É TELA, E NÃO MOVE NÚMERO                        */
/* ============================================================ */
const base = () => {
  const f = createBlankAfty();
  f.core.nd = 20;
  f.core.tipo = "combatente";
  f.carteira = { entradas: SESSOES, gastos: GASTOS };
  return f;
};

const crua = base();
const comAba = { ...base(), addons: [soAba] };
const comTudo = { ...base(), addons: [pacote] };

t("sem addon a criatura não vê a aba", primitivasDaCriatura(crua), []);
t("com o addon ela vê", primitivasDaCriatura(comTudo), ["carteira"]);
t("e as liberações vêm juntas", liberacoesDaCriatura(comTudo), ["carteiraFocos", "carteiraNivel"]);
t("o pacote só de aba não libera nada", liberacoesDaCriatura(comAba), []);

const dCrua = deriveAfty(crua);
const dAba = deriveAfty(comAba);
const dTudo = deriveAfty(comTudo);

/* ⚠ ESTA É A PROMESSA DO `permite`, e ela vale mesmo com a Carteira CHEIA: o
   pacote sem `libera` não pode mover um número da ficha. */
for (const k of ["hp", "pe", "defesa", "cd", "rdGeral", "movimento", "iniciativa", "nd", "focosTotais"]) {
  t(`só a aba não mexe em ${k}`, dAba[k], dCrua[k]);
}

/* ⚠ E O EXTRATO É CALCULADO MESMO SEM O ADDON. O portão é de TELA: uma ficha
   que perdeu o addon não pode devolver zero e deixar a pessoa achar que as
   linhas dela sumiram. Mesma regra da concessão, que continua valendo sem a
   primitiva permitida. */
t("o extrato existe sem addon nenhum", dCrua.carteira.ganho, 3700);
t("e ele diz que NÃO alimenta os Focos", dCrua.carteira.alimentaFocos, false);
t("com a liberação, ele diz que alimenta", dTudo.carteira.alimentaFocos, true);

/* ============================================================ */
/* 7. `libera` É REGRA: OS FOCOS                                 */
/* ============================================================ */
t("sem a liberação, o total de Focos é o ND", dCrua.focosTotais, 20);
/* ⚠ SUBSTITUI, E NÃO SOMA. Com 9 Interlúdios anotados numa criatura de ND 20 a
   resposta é 9. Se algum dia isto virar 29, alguém trocou o `?:` por um `+` e
   cada Interlúdio passou a valer duas vezes. */
t("com a liberação, o total passa a ser o da Carteira", dTudo.focosTotais, 9);

/* O canal continua entrando POR CIMA nos dois casos, que é como uma habilidade
   ou outro addon ainda concede Foco. */
const comCanal = (ficha) => {
  const f = { ...ficha, focosBonus: 4 };
  return deriveAfty(f).focosTotais;
};
t("o canal soma por cima do ND", comCanal(crua), 24);
t("e por cima da Carteira", comCanal(comTudo), 13);

/* Carteira vazia com a liberação ligada dá orçamento zero, e isso é o certo:
   quem não anotou Interlúdio nenhum não ganhou Interlúdio nenhum. */
const vazia = { ...base(), carteira: { entradas: [], gastos: [] }, addons: [pacote] };
t("Carteira vazia com a liberação dá zero Foco", deriveAfty(vazia).focosTotais, 0);

/* ============================================================ */
/* 7.1. A TABELA DE PROGRESSÃO: O XP VIRA NÍVEL                  */
/* ============================================================ */
/* A tabela do autor, copiada da mensagem dele em 2026-09-08. Ela está aqui
   inteira e escrita à mão de propósito: é a fonte, e o módulo é a cópia. Um
   assert que lesse a tabela do módulo para conferir a tabela do módulo não
   provaria nada. */
const TABELA_DO_AUTOR = [
  [4, 10, 2], [5, 15, 3], [6, 20, 3], [7, 30, 3], [8, 40, 3],
  [9, 50, 4], [10, 60, 4], [11, 75, 4], [12, 90, 4],
  [13, 110, 5], [14, 125, 5], [15, 140, 5], [16, 160, 5],
  [17, 180, 6], [18, 200, 6], [19, 220, 6], [20, 240, 6],
  [21, 270, 7], [22, 300, 7], [23, 330, 7], [24, 360, 7], [25, 390, 7],
  [26, 430, 8], [27, 470, 8], [28, 510, 8], [29, 550, 8], [30, 600, 8],
];

t("a tabela tem as 27 linhas do autor", C.CARTEIRA_XP_POR_NIVEL.length, TABELA_DO_AUTOR.length);
t("e o XP de cada nível bate",
  C.CARTEIRA_XP_POR_NIVEL.map((l) => [l.nivel, l.xp]),
  TABELA_DO_AUTOR.map(([nivel, xp]) => [nivel, xp]));
/* Escada estritamente crescente: uma linha fora de ordem faria o `nivelPorXp`
   parar cedo e travar o personagem num nível para sempre. */
t("o XP só sobe", C.CARTEIRA_XP_POR_NIVEL.every((l, i, a) => i === 0 || l.xp > a[i - 1].xp), true);

/* ⚠ ZERO DE XP É O NÍVEL 3 (autor: *"Sempre começamos com 0 de XP no Nível
   3"*), e não o 1. */
t("zero de XP é o Nível 3", [C.CARTEIRA_NIVEL_BASE, C.nivelPorXp(0)], [3, 3]);
t("o XP da linha JÁ dá o nível dela", [C.nivelPorXp(9), C.nivelPorXp(10)], [3, 4]);
t("e o de baixo não vaza para cima", [C.nivelPorXp(14), C.nivelPorXp(15)], [4, 5]);
/* ⚠ XP QUEBRADO NÃO ARREDONDA PARA CIMA: meio ponto não é o ponto que falta. */
t("XP quebrado não sobe de nível", C.nivelPorXp(9.5), 3);
t("acima do fim da tabela o nível para em 30",
  [C.nivelPorXp(600), C.nivelPorXp(5000)], [30, 30]);
t("XP negativo não desce do piso", C.nivelPorXp(-50), 3);
t("cada degrau da tabela devolve o nível dele",
  TABELA_DO_AUTOR.map(([, xp]) => C.nivelPorXp(xp)),
  TABELA_DO_AUTOR.map(([nivel]) => nivel));

t("o próximo nível diz quanto falta", C.proximoNivelCarteira(12), { nivel: 5, xp: 15, falta: 3 });
t("e no fim da tabela não há próximo", C.proximoNivelCarteira(600), null);

/* ⚠ AS OUTRAS DUAS COLUNAS DA TABELA DO AUTOR NÃO FORAM COPIADAS PARA O ADDON,
   e este bloco é o que garante que não precisavam ser. A Maestria e o Grau já
   existiam no sistema desde antes, e o que se mede aqui é que eles CONCORDAM
   com o que ele mandou. No dia em que divergirem, é aqui que aparece, em vez de
   aparecer numa ficha. */
t("a Maestria do sistema bate com a coluna + da tabela",
  TABELA_DO_AUTOR.map(([nivel]) => maestria(nivel)),
  TABELA_DO_AUTOR.map(([, , bonus]) => bonus));
t("e os quatro degraus de Grau caem nos níveis que ele marcou",
  [5, 9, 13, 17].map((n) => grauFeiticeiro(n).label),
  ["Terceiro Grau", "Segundo Grau", "Primeiro Grau", "Semi-Grau Especial"]);

/* ============================================================ */
/* 7.2. O NÍVEL NO DERIVE                                        */
/* ============================================================ */
/* As quatro sessões de prova somam 40,25 de XP, que a tabela paga como Nível 8
   (40 de XP), e a ficha de prova está gravada com ND 20. */
t("o extrato já traz o nível do XP", dCrua.carteira.nivel, 8);
t("sem a liberação, o ND é o campo da ficha", dCrua.nd, 20);
t("e o pacote só de aba também não encosta nele", dAba.nd, 20);
/* ⚠ SUBSTITUI, E NÃO SOMA, como nos Focos. Se algum dia isto virar 28, alguém
   trocou o `?:` por um `+`. */
t("com a liberação, o ND passa a ser o da tabela", dTudo.nd, 8);
/* ⚠ E O CAMPO DA FICHA CONTINUA INTACTO. Derivar não escreve na criatura, e é o
   que faz desinstalar o addon devolver o nível que a pessoa tinha digitado. */
t("o core.nd gravado não é tocado", comTudo.core.nd, 20);

/* O Nível é a entrada de quase toda fórmula do sistema, então mudá-lo tem de
   arrastar o resto junto. Estes três provam que o caminho é o normal, e não um
   atalho que só mexe no número da tela. */
t("a Maestria acompanha o nível novo", [dCrua.maestria, dTudo.maestria], [6, 3]);
t("o Grau acompanha",
  [dCrua.grauFeiticeiro.label, dTudo.grauFeiticeiro.label], ["Semi-Grau Especial", "Terceiro Grau"]);
t("e o PV muda junto", dTudo.hp !== dCrua.hp, true);

/* Carteira vazia com a liberação ligada dá o Nível 3, que é o piso da tabela e
   o mesmo piso do campo de Nível da ficha de criatura. */
t("Carteira vazia com a liberação dá Nível 3", deriveAfty(vazia).nd, 3);

/* ============================================================ */
/* 8. NO JOGADOR, A CARTEIRA VENCE O CAMPO DIGITADO              */
/* ============================================================ */
/* Na Ficha de Jogador o total de Focos é digitado pelo mestre. Com a Carteira
   ligada ele passa a sair da anotação, e a tela tira o campo: deixá-lo aceso
   mostraria um número que a próxima derivação joga fora. */
const jogador = (addons) => {
  const f = base();
  f.rulesVersion = "player";
  f.focosLivres = 30;
  if (addons) f.addons = addons;
  return deriveAfty(f);
};
t("no jogador sem addon vale o campo digitado", jogador(null).focosTotais, 30);
t("no jogador com a Carteira vale a anotação", jogador([pacote]).focosTotais, 9);
t("e o pacote só de aba não encosta no campo", jogador([soAba]).focosTotais, 30);

/* ============================================================ */
/* 9. O CAMINHO DE EDIÇÃO NÃO SANEIA                             */
/* ============================================================ */
/* Mesma prova do `patchCatarse`: cortar o número a cada tecla come o estado
   intermediário que digitar é. Aqui isso é pior, porque "10," é um passo
   obrigatório para chegar em "10,5". */
const builder = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url)),
  "utf8",
);
const corpoPatch = builder.slice(
  builder.indexOf("const patchCarteira"),
  builder.indexOf("const patchTecnicasCombate"),
);
t("o patchCarteira existe no builder", corpoPatch.length > 0, true);
t("e ele não corta número no caminho de edição",
  /Math\.trunc|Math\.max|Number\(/.test(corpoPatch), false);

/* Contraprova: o lixo que o caminho de edição deixa passar morre no resolvedor. */
t("o resolvedor sanea o que o caminho deixou passar",
  [C.normalizaEntradaCarteira({ interludios: "3a" }).interludios,
    C.normalizaEntradaCarteira({ interludios: "" }).interludios,
    C.normalizaEntradaCarteira({ interludios: "2.9" }).interludios,
    C.normalizaEntradaCarteira({ interludios: "3" }).interludios],
  [0, 0, 2, 3]);

/* ============================================================ */
/* 10. A ABA ESTÁ PRESA À PRIMITIVA                              */
/* ============================================================ */
/* A tela filtra por `primitiva`, então o assert prende o par id/primitiva. Sem
   isto, renomear um dos dois deixa a aba invisível para sempre, ou pior, visível
   para quem nunca instalou nada. */
t("a aba declara a primitiva certa",
  /\{ id: "carteira",\s+label: "Carteira", primitiva: "carteira" \}/.test(builder), true);
t("e a tela é renderizada pelo id dela",
  builder.includes('tabAtiva === "carteira" && <TabCarteira'), true);

/* ⚠ AS DUAS LISTAS TÊM AS DUAS COISAS. Filtro e arraste nasceram juntos em
   2026-09-08, e o jeito mais fácil de perdê-los é meia edição que arruma a
   lista de cima e esquece a de baixo. O `2` aqui é o número de listas. */
const aba = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyTabCarteira.jsx", import.meta.url)),
  "utf8",
);
t("as duas listas reordenam", (aba.match(/moverNaCarteira\(/g) ?? []).length, 2);
t("as duas listas filtram", (aba.match(/<BarraDeFiltro/g) ?? []).length, 2);
t("e as duas montam o contexto de arraste", (aba.match(/<DndContext/g) ?? []).length, 2);
/* A pega mora numa coluna PRÓPRIA da grade, e o cabeçalho tem de ter a célula
   vazia dela: sem a célula, todo rótulo anda uma coluna para a esquerda e o
   alinhamento ao centro que o autor pediu se perde. */
t("as duas grades abrem com a coluna da pega",
  (aba.match(/grid-cols-\[1\.25rem_/g) ?? []).length, 2);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
