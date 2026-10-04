/* OS FEITIÇOS PERMUTATIVOS, 2026-10-02.

   A antiga Fase C2 ("Enfraquecedores"), parada desde 2026-07-23 à espera do
   texto. Verbatim e as dez decisões do autor em docs/afty-feiticos-permutativos.md.

   O Feitiço Auxiliar enfraquece um aspecto para melhorar o próprio efeito, uma
   troca por efeito:
     Rolagem numa perícia perde outra perícia   -2 = +1   até o bônus original
     Redução de Dano perde Defesa               -2 = +1   até 2 x nível
     Aumento de Defesa perde RD Geral           -2 = +1   até 2 x nível
     Margem de Crítico perde Acerto             -3 = +1   até 3 x nível
     Bônus em Ataque perde Margem               -1 = +3   até nível

   As decisões que este arquivo prende, porque são as que o resto do sistema
   faria diferente sozinho:
     - a troca entra NO FIM e com taxa fixa: não dobra no evento único nem divide
       por rodadas ou alvos;
     - ganho E prejuízo ficam FORA do pool de Feitiços ("Permutativo sempre soma");
     - quem recebe paga, e "não pode ser usado" trava o interruptor ao ligar;
     - a Margem por troca vale só nas armas com margem a perder.

   ⚠ Número, e não aparência. Render não se testa aqui. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const temAviso = (calc, trecho) => (calc.avisos || []).some((a) => a.includes(trecho));

const aux = (extra) => ({
  tipo: "auxiliar", nivel: 1, efeitoAux: "defesa", duracaoAux: "imediata", acaoAux: "padrao", ...extra,
});
const calc = (f) => F.calcularFeiticoAuxiliar(f, { nd: 20 });
const perde = (reducao, pericia) => ({ reducao, ...(pericia ? { pericia } : {}) });

/* ============================================================ */
/* 1. TAXAS E TETOS, com os números do texto                     */
/* ============================================================ */
const rolagem = (reducao, extra = {}) => aux({
  efeitoAux: "rolagem", nivel: 1, alvoAuxPericia: "acrobacia", permuta: perde(reducao, "atletismo"), ...extra,
});
{
  const c = calc(rolagem(2));
  t("Rolagem Nível 1 Imediata dá +2 da tabela", c.valorSemPermuta, 2);
  t("perder 2 de Atletismo dá +1 em Acrobacia (total +3)", [c.valor, c.permuta.ganho], [3, 1]);
  t("a troca diz o que perde", [c.permuta.perde, c.permuta.pericia, c.permuta.reducao], ["pericia", "atletismo", 2]);
  t("o texto da troca é o da Ficha", F.textoDasPermutas(c), "2 Atletismo");
}
{
  /* O exemplo do livro (-4 Atletismo num +2) passa do teto: decisão de
     2026-07-23, mantida em 2026-10-02. Sai -2 e +1, e não -4 e +2. */
  const c = calc(rolagem(4));
  t("o exemplo do livro apara no teto do bônus original", [c.valor, c.permuta.reducao, c.permuta.teto], [3, 2, 2]);
  t("e avisa", temAviso(c, "A Permuta pede -4 Atletismo e o teto é -2."), true);
}
{
  const c = calc(rolagem(3));
  t("perda fora do passo desce ao múltiplo, calada", [c.valor, c.permuta.reducao, c.avisos.length], [3, 2, 0]);
}
{
  const c = calc(rolagem(2, { alvoAuxPericia: null }));
  t("Toda Rolagem não troca perícia", [c.valor, c.permuta.bloqueio], [2, "Escolha a perícia do Feitiço"]);
  t("e avisa que a troca não vale", temAviso(c, "Permuta sem efeito. Escolha a perícia do Feitiço."), true);
}
{
  const c = calc(rolagem(2, { permuta: perde(2, "acrobacia") }));
  t("a perícia perdida não pode ser a do Feitiço", [c.valor, c.permuta.bloqueio], [2, "A perícia perdida é a do próprio Feitiço"]);
}
{
  const c = calc(rolagem(2, { permuta: perde(2) }));
  t("sem perícia perdida, nada muda", [c.valor, temAviso(c, "Falta a perícia perdida")], [2, true]);
}
{
  const c = calc(aux({ efeitoAux: "rolagem", nivel: 0, alvoAuxPericia: "acrobacia", permuta: perde(2, "atletismo") }));
  t("Rolagem Nível 0 (+1) não tem passo inteiro para trocar", [c.valor, c.permuta.teto], [1, 0]);
}

{
  const c = calc(aux({ efeitoAux: "rd", nivel: 2, permuta: perde(4) }));
  t("RD Nível 2 Imediata (+10) perdendo 4 Defesa dá 12", [c.valorSemPermuta, c.valor, c.permuta.perde], [10, 12, "defesa"]);
  const c6 = calc(aux({ efeitoAux: "rd", nivel: 2, permuta: perde(6) }));
  t("o teto da RD é 2 x nível", [c6.valor, c6.permuta.teto, temAviso(c6, "o teto é -4")], [12, 4, true]);
}
{
  const c = calc(aux({ efeitoAux: "defesa", nivel: 2, permuta: perde(4) }));
  t("Defesa Nível 2 Imediata (+4) perdendo 4 RD dá 6", [c.valorSemPermuta, c.valor, c.permuta.perde], [4, 6, "rd"]);
  t("e o texto diz RD Geral", F.textoDasPermutas(c), "4 RD Geral");
}
{
  /* "Cada troca no seu teto" (autor): Defesa Nível 5 Sustentada (+7) perde até
     10, e não até 7, porque o teto geral do bônus original vale só na Perícia. */
  const c = calc(aux({ efeitoAux: "defesa", nivel: 5, duracaoAux: "sustentada", permuta: perde(10) }));
  t("Defesa perde até 2 x nível mesmo acima do bônus original", [c.valorSemPermuta, c.permuta.reducao, c.valor], [7, 10, 12]);
}

const margem = (nivel, reducao, extra = {}) => aux({
  efeitoAux: "margemCritico", nivel, permuta: perde(reducao), ...extra,
});
{
  const c = calc(margem(1, 3));
  t("Margem Nível 1 existe só pela troca: -3 Acerto dá +1", [c.disponivel, c.valor, c.permuta.perde], [true, 1, "acerto"]);
  const c6 = calc(margem(1, 6));
  t("e não chega a -6 para +2 (o exemplo do texto)", [c6.valor, c6.permuta.teto, temAviso(c6, "o teto é -3")], [1, 3, true]);
  const c0 = calc(margem(1, 0));
  t("sem a troca ela não existe", [c0.disponivel, c0.valor, temAviso(c0, "só existe pela Permuta")], [false, null, true]);
}
{
  const sem = calc(margem(0, 3));
  t("Margem Nível 0 pede Um Único Evento", [sem.disponivel, temAviso(sem, "com Um Único Evento")], [false, true]);
  const com = calc(margem(0, 3, { umGolpe: true }));
  t("com o evento conta como Nível 1 no teto", [com.disponivel, com.valor, com.permuta.teto], [true, 1, 3]);
  t("e a troca não dobra no evento único", com.permuta.ganho, 1);
}
{
  const c = calc(margem(1, 3, { duracaoAux: "duradoura" }));
  t("a célula aberta é só a Imediata", c.disponivel, false);
  t("duracoesDoEfeitoAux conta a célula aberta", [
    F.duracoesDoEfeitoAux("margemCritico", 1), F.duracoesDoEfeitoAux("margemCritico", 0),
    F.duracoesDoEfeitoAux("defesa", 1), F.duracoesDoEfeitoAux("margemCritico", 4),
  ], [["imediata"], ["imediata"], ["imediata", "duradoura"], ["imediata", "sustentada"]]);
  t("temColunaAux também", [
    F.temColunaAux("margemCritico", 1, "imediata"), F.temColunaAux("margemCritico", 1, "sustentada"),
  ], [true, false]);
}
{
  const c = calc(margem(2, 6));
  t("Margem Nível 2 (+1) perdendo 6 Acerto dá +3", [c.valorSemPermuta, c.valor], [1, 3]);
}
{
  const ataque = (reducao) => aux({ efeitoAux: "ataque", nivel: 3, duracaoAux: "duradoura", rodadasDur: 3, permuta: perde(reducao) });
  const c = calc(ataque(2));
  t("Bônus em Ataque Nível 3 Duradouro (+4) perdendo 2 Margem dá +10", [c.valorSemPermuta, c.valor, c.permuta.perde], [4, 10, "margem"]);
  const c4 = calc(ataque(4));
  t("o teto da Margem perdida é o nível", [c4.valor, c4.permuta.teto, temAviso(c4, "-4 Margem e o teto é -3")], [13, 3, true]);
}

/* ============================================================ */
/* 2. A TROCA ENTRA NO FIM, COM TAXA FIXA                        */
/* ============================================================ */
{
  const c = calc(aux({ efeitoAux: "rd", nivel: 2, umGolpe: true, permuta: perde(4) }));
  t("RD com Um Único Evento: (10 x 2) + 2 = 22", [c.valorSemPermuta, c.valor], [20, 22]);
}
{
  const c = calc(aux({ efeitoAux: "rd", nivel: 2, alvosAux: 2, permuta: perde(4) }));
  t("com 2 alvos cada um recebe +5 da tabela e +2 da troca", [c.valorSemPermuta, c.valor, c.alvos], [5, 7, 2]);
}
{
  /* O teto da Perícia lê o bônus JÁ DIVIDIDO: Rolagem Nível 3 (+6) entre 2 alvos
     dá +3 a cada um, e cada um perde até 2 (o múltiplo do passo abaixo de 3). */
  const c = calc(aux({
    efeitoAux: "rolagem", nivel: 3, alvosAux: 2, alvoAuxPericia: "acrobacia", permuta: perde(4, "atletismo"),
  }));
  t("o teto da Perícia lê o bônus já dividido entre alvos", [c.valorSemPermuta, c.permuta.teto, c.valor], [3, 2, 4]);
}
{
  const c = calc(aux({ efeitoAux: "defesa", nivel: 4, duracaoAux: "duradoura", rodadasDur: 4, permuta: perde(8) }));
  t("a Duradoura divide a tabela e não a troca: 6 / 2 + 4 = 7", [c.valorSemPermuta, c.valor], [3, 7]);
}

/* ============================================================ */
/* 3. MÚLTIPLOS EFEITOS                                          */
/* ============================================================ */
const mult = (nivel, efeitosMult, extra = {}) => ({
  tipo: "auxiliar", nivel, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "padrao",
  alvosMult: 1, efeitosMult, ...extra,
});
const ef = (id, efeito, nivel, extra = {}) => ({ id, efeito, nivel, ...extra });
const doEfeito = (c, id) => c.efeitos.find((e) => e.id === id);
{
  const c = calc(mult(4, [ef("rd", "rd", 3, { permuta: perde(6) }), ef("mov", "movimento", 2)]));
  t("no Múltiplos o teto é pelo nível do EFEITO (2 x 3 = 6)", [doEfeito(c, "rd").valor, doEfeito(c, "rd").permuta.teto], [17, 6]);
  const c8 = calc(mult(4, [ef("rd", "rd", 3, { permuta: perde(8) }), ef("mov", "movimento", 2)]));
  t("e não pelo do Feitiço (2 x 4 = 8)", [doEfeito(c8, "rd").valor, doEfeito(c8, "rd").permuta.reducao], [17, 6]);
  t("o texto junta os efeitos com troca", F.textoDasPermutas(c), "6 Defesa");
}
{
  const c = calc(mult(3, [ef("rd", "rd", 3, { permuta: perde(4) }), ef("def", "defesa", 2)]));
  t("RD não perde Defesa ao lado de Aumento de Defesa", [doEfeito(c, "rd").valor, doEfeito(c, "rd").permuta.bloqueio],
    [14, "Defesa já sobe em outro efeito deste Feitiço"]);
  t("e a Defesa não perde RD ao lado da RD", doEfeito(c, "def").permuta.bloqueio, "RD Geral já sobe em outro efeito deste Feitiço");
}
{
  const c = calc(mult(3, [ef("mg", "margemCritico", 2, { permuta: perde(3) }), ef("at", "ataque", 2, { permuta: perde(1) })]));
  t("Margem não perde Acerto ao lado de Bônus em Ataque", doEfeito(c, "mg").permuta.bloqueio, "Acerto já sobe em outro efeito deste Feitiço");
  t("e o Ataque não perde Margem ao lado da Margem", doEfeito(c, "at").permuta.bloqueio, "Margem de Crítico já sobe em outro efeito deste Feitiço");
  t("as duas travadas não mudam número", [doEfeito(c, "mg").valor, doEfeito(c, "at").valor], [1, 4]);
}
{
  const toda = calc(mult(3, [ef("mg", "margemCritico", 2, { permuta: perde(3) }), ef("rl", "rolagem", 2)]));
  t("Rolagem de Toda Rolagem também sobe o Acerto", doEfeito(toda, "mg").permuta.bloqueio, "Acerto já sobe em outro efeito deste Feitiço");
  const pericia = calc(mult(3, [ef("mg", "margemCritico", 2, { permuta: perde(3) }), ef("rl", "rolagem", 2, { alvoAuxPericia: "furtividade" })]));
  t("Rolagem numa perícia não", [doEfeito(pericia, "mg").permuta.bloqueio, doEfeito(pericia, "mg").valor], [null, 2]);
  t("permutaBloqueadaMult é a mesma regra para a tela", F.permutaBloqueadaMult(
    [ef("mg", "margemCritico", 2), ef("rl", "rolagem", 2)], { id: "mg", efeito: "margemCritico", nivel: 2 },
  ), "Acerto já sobe em outro efeito deste Feitiço");
}
{
  const c = calc(mult(2, [ef("mg", "margemCritico", 1, { permuta: perde(3) }), ef("mov", "movimento", 1)]));
  t("Margem Nível 1 pela troca entra no Múltiplos Imediato", [doEfeito(c, "mg").disponivel, doEfeito(c, "mg").valor], [true, 1]);
  t("e o seletor do Múltiplos a oferece", F.efeitosDisponiveisMult([ef("mov", "movimento", 1)], null, false, { nivel: 1, duracao: "imediata" })
    .some((m) => m.value === "margemCritico"), true);
}

/* ============================================================ */
/* 4. CÉLULA ESPECIAL NÃO TEM NÚMERO PARA A TROCA                 */
/* ============================================================ */
for (const [efeitoAux, especial] of [["defesa", "Esquiva Garantida"], ["ataque", "Garantido"], ["margemCritico", "Crítico Garantido"]]) {
  const c = calc(aux({ efeitoAux, nivel: 5, umGolpe: true, permuta: perde(3) }));
  t(`${especial} não troca`, [c.especial, c.permuta.bloqueio, c.permuta.reducao], [especial, "Resultado especial não tem número", 0]);
  t(`${especial} avisa`, temAviso(c, "Permuta sem efeito. Resultado especial não tem número."), true);
}

/* ============================================================ */
/* 5. EFEITO SEM TROCA                                            */
/* ============================================================ */
for (const efeitoAux of ["atributo", "tr", "movimento", "danoFixo", "niveisDano", "negacaoRd", "cd", "prejuizoRolagem", "alcanceCaC"]) {
  const c = calc(aux({ efeitoAux, nivel: 3, duracaoAux: "sustentada", permuta: perde(4) }));
  t(`${efeitoAux} não tem troca`, [c.permuta, c.valorSemPermuta], [undefined, undefined]);
}

/* ============================================================ */
/* 6. NA FICHA: DECLARADO CONTRA EMITIDO                          */
/* ============================================================ */
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const CC = await import(R + "afty-combate-conjurador.js");
const LIG = CC.estadoLigadoDoFeitico;

let seq = 0;
const ficha = (feiticos, { sistema = "player", nivel = 10, destreza = 10, combate = null, itens = [] } = {}) => {
  const c = createBlankAfty();
  c.name = "Permutativa";
  c.rulesVersion = sistema;
  c.core.nd = nivel; c.core.nivel = nivel;
  c.especializacoes = [{ id: "conjurador", nivel }];
  c.attrMethod = "fixos";
  c.attributes = { forca: 10, destreza, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.feiticos = feiticos;
  c.equipamentos = { itens };
  if (combate) c.combate = combate;
  return c;
};
const ligados = (...ids) => ({ ativo: true, ...Object.fromEntries(ids.map((id) => [LIG(id), true])) });
const arma = (refId) => { seq += 1; return { uid: `eq${seq}`, tipo: "arma", refId, qtd: 1, equipado: true }; };
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
const tr = (d, id) => d.testes.resistencias.find((r) => (r.id ?? r.value) === id)?.bonus;
const ataqueDe = (d, id) => d.testes.ataques.find((a) => a.id === id)?.bonus;
const linha = (d, id) => d.dano.entradas.find((e) => e.id === id);
const somaDasPartes = (partes) => (partes || [])
  .filter((p) => !p.suplantado && typeof p.valor === "number").reduce((s, p) => s + p.valor, 0);
const estado = (d, id) => d.combate?.estadosExtras?.find((e) => e.id === id);

const passoLeve = {
  id: "passo", nome: "Passo Leve", tipo: "auxiliar", nivel: 1, efeitoAux: "rolagem", duracaoAux: "imediata",
  alvoAuxPericia: "acrobacia", permuta: perde(2, "atletismo"),
};
{
  const d0 = deriveAfty(ficha([passoLeve]));
  const d1 = deriveAfty(ficha([passoLeve], { combate: ligados("passo") }));
  t("Acrobacia sobe o bônus mais o ganho (+2 +1)", pericia(d1, "acrobacia").bonus - pericia(d0, "acrobacia").bonus, 3);
  t("Atletismo cai a redução exata", pericia(d1, "atletismo").bonus - pericia(d0, "atletismo").bonus, -2);
  t("Rolagem numa perícia não sobe TR", tr(d1, "reflexos") - tr(d0, "reflexos"), 0);
  t("nem ataque", ataqueDe(d1, "corpo") - ataqueDe(d0, "corpo"), 0);
  t("nem outra perícia", pericia(d1, "furtividade").bonus - pericia(d0, "furtividade").bonus, 0);
  t("as parcelas da Acrobacia somam o total", somaDasPartes(pericia(d1, "acrobacia").partes), pericia(d1, "acrobacia").bonus);
  t("as da Atletismo também", somaDasPartes(pericia(d1, "atletismo").partes), pericia(d1, "atletismo").bonus);
  t("o hover nomeia a troca", pericia(d1, "atletismo").partes.filter((p) => p.label === "Passo Leve (Permuta)").map((p) => p.valor), [-2]);
  t("e separa o bônus da tabela", pericia(d1, "acrobacia").partes
    .filter((p) => String(p.label).startsWith("Passo Leve")).map((p) => [p.label, p.valor])
    .sort((x, y) => x[0].localeCompare(y[0])),
  [["Passo Leve", 2], ["Passo Leve (Permuta)", 1]]);
}
{
  /* Regressão: sem perícia, a Rolagem segue sendo Toda Rolagem. */
  const toda = { ...passoLeve, alvoAuxPericia: null, permuta: null };
  const d0 = deriveAfty(ficha([toda]));
  const d1 = deriveAfty(ficha([toda], { combate: ligados("passo") }));
  t("Toda Rolagem segue em perícia, TR e ataque", [
    pericia(d1, "furtividade").bonus - pericia(d0, "furtividade").bonus,
    tr(d1, "reflexos") - tr(d0, "reflexos"),
    ataqueDe(d1, "corpo") - ataqueDe(d0, "corpo"),
  ], [2, 2, 2]);
}

/* ============================================================ */
/* 7. A TROCA FICA FORA DO POOL ("Permutativo sempre soma")       */
/* ============================================================ */
{
  const rolagemEm = (id, alvo) => ({
    id, nome: `Rolagem ${alvo}`, tipo: "auxiliar", nivel: 3, efeitoAux: "rolagem", duracaoAux: "imediata",
    alvoAuxPericia: alvo, permuta: perde(4, "atletismo"),
  });
  const a = rolagemEm("a", "acrobacia");
  const b = rolagemEm("b", "furtividade");
  const d0 = deriveAfty(ficha([a, b], { nivel: 20 }));
  const d1 = deriveAfty(ficha([a, b], { nivel: 20, combate: ligados("a", "b") }));
  t("dois Permutativos em Atletismo somam: -8", pericia(d1, "atletismo").bonus - pericia(d0, "atletismo").bonus, -8);
}
{
  /* O exemplo do autor: "-3 de Acerto Permutativo" com "+7 de Acerto" de outro
     efeito ativo: "eu somo ambas". A Rolagem Nível 5 Sustentada de Toda Rolagem
     dá +7 no ataque. */
  const mira = { id: "mira", nome: "Mira Larga", tipo: "auxiliar", nivel: 1, efeitoAux: "margemCritico", duracaoAux: "imediata", permuta: perde(3) };
  const sete = { id: "sete", nome: "Sete", tipo: "auxiliar", nivel: 5, efeitoAux: "rolagem", duracaoAux: "sustentada" };
  const combate = { ativo: true, [LIG("mira")]: true, sustentacaoFeitico1: "sete" };
  const d0 = deriveAfty(ficha([mira, sete], { nivel: 20 }));
  const d1 = deriveAfty(ficha([mira, sete], { nivel: 20, combate }));
  t("-3 da troca com +7 de outro Feitiço dá +4", ataqueDe(d1, "corpo") - ataqueDe(d0, "corpo"), 4);
  const mira2 = { ...mira, id: "mira2", nome: "Mira Estreita" };
  const d2 = deriveAfty(ficha([mira, mira2], { nivel: 20, combate: ligados("mira", "mira2") }));
  const dBase = deriveAfty(ficha([mira, mira2], { nivel: 20 }));
  t("duas penalidades de troca somam (o pool ficaria com a pior)", ataqueDe(d2, "corpo") - ataqueDe(dBase, "corpo"), -6);
}
{
  /* O GANHO também fura o pool: a RD +14 vence a +10 da tabela, e o +2 da troca
     soma por cima. */
  const couraca = { id: "cou", nome: "Couraça", tipo: "auxiliar", nivel: 2, efeitoAux: "rd", duracaoAux: "imediata", permuta: perde(4) };
  const muralha = { id: "mur", nome: "Muralha", tipo: "auxiliar", nivel: 3, efeitoAux: "rd", duracaoAux: "imediata" };
  const d0 = deriveAfty(ficha([couraca, muralha], { nivel: 20 }));
  const d1 = deriveAfty(ficha([couraca, muralha], { nivel: 20, combate: ligados("cou", "mur") }));
  t("RD 14 do vencedor do pool mais 2 da troca dá 16", d1.rdGeral - d0.rdGeral, 16);
  t("a tabela de 10 aparece riscada", d1.partes.rdGeral.filter((p) => p.label === "Couraça").map((p) => !!p.suplantado), [true]);
  t("e a Defesa paga 4", d1.defesa - d0.defesa, -4);
  t("as parcelas da RD somam o total", somaDasPartes(d1.partes.rdGeral), d1.rdGeral);
}

/* ============================================================ */
/* 8. "NÃO PODE SER USADO" TRAVA AO LIGAR                         */
/* ============================================================ */
{
  const couraca = { id: "cou", nome: "Couraça", tipo: "auxiliar", nivel: 2, efeitoAux: "rd", duracaoAux: "imediata", permuta: perde(4) };
  /* Jogador de Nível 1 com Destreza 10: Defesa 10, a própria base. */
  const raso = deriveAfty(ficha([couraca], { nivel: 1 }));
  t("Defesa base é 10 + o atributo da Defesa", [raso.defesa, raso.defesaBase], [10, 10]);
  t("perder 4 Defesa abaixo da base trava ao ligar", estado(raso, LIG("cou"))?.bloqueio?.(raso, false), "Defesa Abaixo da Base");
  const fundo = deriveAfty(ficha([couraca], { nivel: 10 }));
  t("com Defesa de sobra não trava", estado(fundo, LIG("cou"))?.bloqueio?.(fundo, false), null);
  /* Ligado, e a Defesa caiu depois (Desprevenido, -3): segue ligado, com aviso. */
  const ligada = ficha([couraca], { nivel: 10, combate: ligados("cou") });
  const caiu = deriveAfty(ligada, { condicoes: [{ id: "c_desprevenido", nome: "Desprevenido" }] });
  t("ligado e caiu depois: o motivo vira aviso", estado(caiu, LIG("cou"))?.bloqueio?.(caiu, true), "Defesa Abaixo da Base");
  t("e a ficha segue com o Feitiço ligado", caiu.rdGeral, 12);
}
{
  const escudo = { id: "esc", nome: "Escudo Fino", tipo: "auxiliar", nivel: 2, efeitoAux: "defesa", duracaoAux: "imediata", permuta: perde(4) };
  const jogador = deriveAfty(ficha([escudo], { nivel: 10 }));
  t("jogador nasce com RD Geral 0", jogador.rdGeral, 0);
  t("e não tem RD a perder", estado(jogador, LIG("esc"))?.bloqueio?.(jogador, false), "Sem RD Geral a Perder");
  const criatura = deriveAfty(ficha([escudo], { nivel: 10, sistema: "afty" }));
  t("a criatura com RD Geral pode", estado(criatura, LIG("esc"))?.bloqueio?.(criatura, false), null);
}
{
  const sem = { id: "sem", nome: "Sem Troca", tipo: "auxiliar", nivel: 2, efeitoAux: "rd", duracaoAux: "imediata" };
  const d = deriveAfty(ficha([sem], { nivel: 1 }));
  t("Feitiço sem troca não ganha trava", estado(d, LIG("sem"))?.bloqueio, undefined);
}
{
  /* A opção da vaga de Sustentação trava igual. */
  const rdSus = { id: "rds", nome: "Couraça Lenta", tipo: "auxiliar", nivel: 2, efeitoAux: "rd", duracaoAux: "sustentada", permuta: perde(4) };
  const d = deriveAfty(ficha([rdSus], { nivel: 1 }));
  const opcao = estado(d, "sustentacaoFeitico1")?.opcoes?.find((o) => o.id === "rds");
  t("a opção da Sustentação trava igual", opcao?.bloqueio?.(d, false), "Defesa Abaixo da Base");
}

/* ============================================================ */
/* 9. MARGEM POR ARMA                                             */
/* ============================================================ */
{
  /* Bastão crita em 19 (uma de margem). O golpe desarmado crita em 20. */
  const golpe = { id: "gol", nome: "Golpe Certo", tipo: "auxiliar", nivel: 3, efeitoAux: "ataque", duracaoAux: "duradoura", rodadasDur: 3, permuta: perde(1) };
  const itens = [arma("arm_bastao")];
  const d0 = deriveAfty(ficha([golpe], { nivel: 10, itens }));
  const d1 = deriveAfty(ficha([golpe], { nivel: 10, itens, combate: ligados("gol") }));
  const bastao0 = linha(d0, "arm_bastao");
  const bastao1 = linha(d1, "arm_bastao");
  t("o Bastão crita em 19", bastao0.margemCritico, 19);
  t("com a troca o Bastão perde a margem", bastao1.margemCritico, 20);
  t("e ganha a tabela mais 3 de Acerto", bastao1.acerto - bastao0.acerto, 4 + 3);
  t("o desarmado, sem margem, só ganha a tabela", [linha(d1, "basico").margemCritico, linha(d1, "basico").acerto - linha(d0, "basico").acerto], [20, 4]);
  t("o hover do Bastão nomeia a troca", bastao1.partesAcerto.filter((p) => p.label === "Golpe Certo (Permuta)").map((p) => p.valor), [3]);
  t("com uma arma de margem, não trava", estado(d0, LIG("gol"))?.bloqueio?.(d0, false), null);
  t("ligado, a trava sabe que pegou", estado(d1, LIG("gol"))?.bloqueio?.(d1, true), null);
  const nu = deriveAfty(ficha([golpe], { nivel: 10 }));
  t("sem arma de margem, trava", estado(nu, LIG("gol"))?.bloqueio?.(nu, false), "Sem Margem a Perder");
  const dois = { ...golpe, permuta: perde(2) };
  const d2 = deriveAfty(ficha([dois], { nivel: 10, itens, combate: ligados("gol") }));
  t("perder 2 numa arma de 1 não entra", [linha(d2, "arm_bastao").margemCritico, linha(d2, "arm_bastao").acerto - bastao0.acerto], [19, 4]);
  t("e a trava avisa", estado(d2, LIG("gol"))?.bloqueio?.(d2, true), "Sem Margem a Perder");
}

/* ============================================================ */
/* 10. OS DOIS SISTEMAS                                           */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const d0 = deriveAfty(ficha([passoLeve], { sistema }));
  const d1 = deriveAfty(ficha([passoLeve], { sistema, combate: ligados("passo") }));
  t(`${sistema}: a mesma troca de perícia`, [
    pericia(d1, "acrobacia").bonus - pericia(d0, "acrobacia").bonus,
    pericia(d1, "atletismo").bonus - pericia(d0, "atletismo").bonus,
  ], [3, -2]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
