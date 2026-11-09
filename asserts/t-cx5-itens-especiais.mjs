/**
 * CX5: LAÇO DA VIDA, CHAVEIRO ABSORSOR, VENENO NO ALVO E TETO DO FERREIRO (Livro p.143, 145, 148 e 149), nos DOIS sistemas.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const US = await import(R + "ficha/ficha-uso-estado.js");
const IT = await import(R + "ficha/ficha-itens.js");
const ES = await import(R + "ficha/ficha-itens-especiais.js");
const EXTRAS = await import(R + "afty-extras-nativos.js");
const USO = await import(R + "afty-itens-uso.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const op = () => `cx5-es-${++contador}`;
const entrada = (uid, refId, extra = {}) => ({ uid, tipo: "item", refId, qtd: 1, equipado: false, ...extra });
const fichaCom = (sistema, itens, nd = 10) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "combatente", nivel: nd }];
  f.equipamentos = { itens };
  return f;
};
const mesa = (f, ajuste = {}) => {
  const d = deriveAfty(f);
  return { d, s: { ...SE.sessaoEmBranco(d), rodada: 1, ...ajuste } };
};
const morto = (s, causa = "falhas") => ({ ...s, hpAtual: 0, vital: { ...s.vital, estado: "morto", causa, falhas: 3, saldo: 12 } });

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;

  /* ------------------------------------------------------------ A. Laço da Vida */
  {
    const f = fichaCom(sistema, [entrada("l1", "it_laco_da_vida", { equipado: true }), entrada("l2", "it_laco_da_vida")]);
    const { d, s } = mesa(f);
    const morreu = morto(s);
    const a = ES.usaLacoDaVida(f, morreu, d, { uid: "l1", opId: op() });
    t(tag("o Laço desfaz a morte"), [a.aplicado, a.sessao.vital.estado, a.sessao.vital.falhas, a.sessao.vital.saldo], [true, "vivo", 0, 0]);
    t(tag("cura metade do PV máximo"), [a.sessao.hpAtual, Math.floor(d.hp / 2)], [Math.floor(d.hp / 2), Math.floor(d.hp / 2)]);
    t(tag("e dá 1 nível de Exaustão"), a.sessao.exaustao, 1);
    t(tag("o laço se desgasta, sumindo"), IT.unidadesRestantes(f, a.sessao, "l1"), 0);
    t(tag("o corpo volta a poder receber cura"), SE.aplicaCura(a.sessao, 5, d.hp).hpAtual, Math.floor(d.hp / 2) + 5);

    const guardado = ES.usaLacoDaVida(f, morreu, d, { uid: "l2", opId: op() });
    t(tag("o laço guardado não salva"), [guardado.aplicado, guardado.erro, guardado.sessao === morreu], [false, "Item Guardado", true]);
    const cansado = ES.usaLacoDaVida(f, { ...morreu, exaustao: 5 }, d, { uid: "l1", opId: op() });
    t(tag("com 5 níveis de Exaustão o Laço não funciona e NÃO é gasto"), [cansado.aplicado, cansado.erro, IT.unidadesRestantes(f, cansado.sessao, "l1")], [false, "Exaustão 5 Impede o Laço", 1]);
    const quatro = ES.usaLacoDaVida(f, { ...morreu, exaustao: 4 }, d, { uid: "l1", opId: op() });
    t(tag("com 4 ainda funciona e chega a 5"), [quatro.aplicado, quatro.sessao.exaustao], [true, 5]);
    const vivo = ES.usaLacoDaVida(f, s, d, { uid: "l1", opId: op() });
    t(tag("quem está vivo não gasta o Laço"), [vivo.aplicado, vivo.erro], [false, "Ninguém Vai Morrer"]);
    const massivo = ES.usaLacoDaVida(f, { ...s, hpAtual: 0, vital: { ...s.vital, estado: "morrendo", massivoPendente: true, saldo: 99 } }, d, { uid: "l1", opId: op() });
    t(tag("a morte massiva pendente também é evitada"), [massivo.aplicado, massivo.sessao.vital.estado, massivo.sessao.vital.massivoPendente, massivo.sessao.vital.saldo], [true, "vivo", false, 0]);
    const id = op();
    const x1 = ES.usaLacoDaVida(f, morreu, d, { uid: "l1", opId: id });
    const x2 = ES.usaLacoDaVida(f, x1.sessao, d, { uid: "l1", opId: id });
    t(tag("o mesmo opId não gasta outro laço nem outra Exaustão"), [x2.repetida, x2.sessao === x1.sessao, x1.sessao.exaustao], [true, true, 1]);
    t(tag("o Laço não é um item de uso comum"), IT.usaItem(f, morreu, d, { uid: "l1", opId: op() }).erro, "Uso Próprio do Item");
    t(tag("uid que não é Laço"), ES.usaLacoDaVida(fichaCom(sistema, [entrada("p", "it_perola_carregada")]), morreu, d, { uid: "p", opId: op() }).erro, "Laço da Vida Não Encontrado");
    t(tag("sem opId"), ES.usaLacoDaVida(f, morreu, d, { uid: "l1" }).codigo, "sem-opid");
    const descansou = SE.descansar(a.sessao, d);
    t(tag("o laço gasto não volta no descanso"), IT.unidadesRestantes(f, descansou, "l1"), 0);
  }

  /* ------------------------------------------------------------ B. Chaveiro Absorsor */
  {
    const f = fichaCom(sistema, [entrada("c1", "it_chaveiro_absorsor", { equipado: true }), entrada("c2", "it_chaveiro_absorsor")]);
    const { d, s } = mesa(f);
    const gasto = { ...s, peAtual: d.pe - 5 };
    const a = ES.eliminouInimigoComChaveiro(f, gasto, d, { uid: "c1", opId: op(), parametros: { energia: true } });
    t(tag("eliminar inimigo elegível recupera 2 PE"), [a.aplicado, a.ganho, a.sessao.peAtual], [true, 2, d.pe - 3]);
    t(tag("o chaveiro não se gasta"), IT.unidadesRestantes(f, a.sessao, "c1"), 1);
    const b = ES.eliminouInimigoComChaveiro(f, a.sessao, d, { uid: "c1", opId: op(), parametros: { energia: true } });
    t(tag("cada eliminação recupera de novo"), b.sessao.peAtual, d.pe - 1);
    const cheio = ES.eliminouInimigoComChaveiro(f, { ...s, peAtual: d.pe - 1 }, d, { uid: "c1", opId: op(), parametros: { energia: true } });
    t(tag("não passa do PE máximo"), [cheio.ganho, cheio.sessao.peAtual], [1, d.pe]);
    const sem = ES.eliminouInimigoComChaveiro(f, gasto, d, { uid: "c1", opId: op() });
    t(tag("a mesa confirma que o inimigo tem energia"), [sem.aplicado, sem.erro, sem.sessao === gasto], [false, "Inimigo com Energia ou Feito de Energia", true]);
    t(tag("guardado não absorve"), ES.eliminouInimigoComChaveiro(f, gasto, d, { uid: "c2", opId: op(), parametros: { energia: true } }).erro, "Item Guardado");
    const id = op();
    const r1 = ES.eliminouInimigoComChaveiro(f, gasto, d, { uid: "c1", opId: id, parametros: { energia: true } });
    t(tag("o mesmo opId não recupera duas vezes"), ES.eliminouInimigoComChaveiro(f, r1.sessao, d, { uid: "c1", opId: id, parametros: { energia: true } }).repetida, true);
  }

  /* ------------------------------------------------------------ C. Veneno no alvo */
  {
    const f = fichaCom(sistema, []);
    const { d, s } = mesa(f);
    const cd = (id, o) => ES.cdDoVenenoDoItem(id, o);
    t(tag("CD por custo: Intenso 15, Desnorteante 25, Maldito 35, Lágrima 45"), [cd("it_veneno_intenso"), cd("it_veneno_desnorteante"), cd("it_veneno_maldito"), cd("it_lagrima_de_shinigami")], [15, 25, 35, 45]);
    t(tag("o Dardo soma 2"), cd("it_veneno_intenso", { dardo: true }), 17);
    t(tag("item que não é veneno"), cd("it_perola_carregada"), null);

    const falha = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_intenso", tr: { sucesso: false }, opId: op() });
    t(tag("Intenso: quem falha fica Envenenado por uma rodada"), [falha.aplicado, falha.sessao.condicoes], [true, [{ nome: "Envenenado", rodadas: 1 }]]);
    const passou = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_intenso", tr: { sucesso: true }, opId: op() });
    t(tag("Intenso: quem passa no TR não sofre nada"), [passou.aplicado, passou.sessao.condicoes], [true, []]);
    const desn = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_desnorteante", tr: { sucesso: false }, opId: op() });
    t(tag("Desnorteante deixa Desprevenido"), desn.sessao.condicoes.map((c) => c.nome), ["Desprevenido"]);

    // Maldito: Exposto só na falha, Envenenado (entre parênteses) mesmo passando, por três rodadas.
    const mf = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_maldito", tr: { sucesso: false }, opId: op() });
    const mp = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_maldito", tr: { sucesso: true }, opId: op() });
    t(tag("Maldito na falha: Exposto e Envenenado, três rodadas"), mf.sessao.condicoes.map((c) => [c.nome, c.rodadas]).sort(), [["Envenenado", 3], ["Exposto", 3]]);
    t(tag("Maldito no sucesso: só o que está entre parênteses (Envenenado)"), mp.sessao.condicoes.map((c) => [c.nome, c.rodadas]), [["Envenenado", 3]]);

    // Debilitante: deslocamento pela metade, que é a definição da condição Lento.
    const deb = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_debilitante", tr: { sucesso: false }, opId: op() });
    t(tag("Debilitante deixa o alvo Lento e marca o veneno como uso ativo"), [deb.sessao.condicoes, Object.keys(US.usoDe(deb.sessao).ativos)], [[{ nome: "Lento" }], ["veneno:it_veneno_debilitante"]]);
    const movAntes = deriveAfty(f).movimento;
    const movDepois = deriveAfty(f, { condicoes: deb.sessao.condicoes }).movimento;
    t(tag("e o derive corta o movimento pela metade"), [movAntes, movDepois], [9, 4.5]);
    // Prazo MANUAL (decisão do autor, 2026-11-06): o Debilitante não tem prazo escrito, então nada o derruba no fim do combate.
    const fimDoCombate = US.fechaCombateNoUso(deb.sessao);
    t(tag("o fim do combate NÃO tira o Lento nem o marcador do Debilitante"), [fimDoCombate.condicoes, Object.keys(US.usoDe(fimDoCombate).ativos)], [[{ nome: "Lento" }], ["veneno:it_veneno_debilitante"]]);
    t(tag("o marcador sai no descanso (e o Lento, que é condição, a mesa tira)"), Object.keys(US.usoDe(SE.descansar(deb.sessao, d)).ativos), []);
    t(tag("Debilitante passando no TR não faz nada"), ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_debilitante", tr: { sucesso: true }, opId: op() }).sessao.condicoes, []);

    // Lágrima: 2d10 de vida nos dois casos, Defesa -4 e 2 PE adicionais só na falha, por cena.
    const rng = () => 0.5;
    const lf = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_lagrima_de_shinigami", tr: { sucesso: false }, opId: op(), rng });
    t(tag("Lágrima na falha: perde 2d10, Defesa -4, 2 PE a mais, Amedrontado e Exposto"), [lf.aplicou.perdaDeVida > 0, lf.sessao.hpAtual, lf.sessao.buffs.map((b) => [b.canal, b.expr]).sort(), lf.sessao.condicoes.map((c) => c.nome).sort()], [true, d.hp - lf.aplicou.perdaDeVida, [["custoPE", "-2"], ["defesa", "-4"]], ["Amedrontado", "Exposto"]]);
    const lp = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_lagrima_de_shinigami", tr: { sucesso: true }, opId: op(), rng });
    t(tag("Lágrima no sucesso: só o que está entre parênteses, a perda de vida e as condições"), [lp.aplicou.perdaDeVida > 0, lp.sessao.buffs.length, lp.sessao.condicoes.map((c) => [c.nome, c.rodadas]).sort()], [true, 0, [["Amedrontado", 2], ["Exposto", 2]]]);
    t(tag("a perda de vida não é dobrada pelo texto repetido nos parênteses"), lf.aplicou.perdaDeVida >= 2 && lf.aplicou.perdaDeVida <= 20, true);
    t(tag("os efeitos da cena caem no fim da cena"), [US.fechaCombateNoUso(lf.sessao).buffs.length, Object.keys(US.usoDe(US.fechaCombateNoUso(lf.sessao)).ativos)], [0, []]);

    // O Antídoto encerra o veneno pelo custo.
    const fAnt = fichaCom(sistema, [entrada("a1", "it_antidoto_superior"), entrada("a0", "it_antidoto_simples")]);
    const mAnt = mesa(fAnt);
    const comLagrima = ES.aplicaVenenoNoAlvo(mAnt.s, mAnt.d, { itemId: "it_lagrima_de_shinigami", tr: { sucesso: false }, opId: op(), rng });
    const superior = IT.usaItem(fAnt, comLagrima.sessao, mAnt.d, { uid: "a1", opId: op() });
    t(tag("o Antídoto Superior (custo 3) NÃO cura a Lágrima (custo 4), mas cura o Envenenado se houver"), [superior.aplicado, Object.keys(US.usoDe(superior.sessao).ativos).includes("veneno:it_lagrima_de_shinigami")], [false, true]);
    const comIntenso = ES.aplicaVenenoNoAlvo(mAnt.s, mAnt.d, { itemId: "it_veneno_debilitante", tr: { sucesso: false }, opId: op() });
    const simples = IT.usaItem(fAnt, comIntenso.sessao, mAnt.d, { uid: "a0", opId: op() });
    t(tag("o Antídoto Simples (custo 1) cura o Debilitante (custo 1): o uso ativo e a condição Lento saem"), [simples.aplicado, simples.sessao.condicoes, Object.keys(US.usoDe(simples.sessao).ativos)], [true, [], []]);

    // O Envenenado que um veneno MAIOR pôs não sai com antídoto menor: Maldito (custo 3) põe Envenenado até no sucesso do TR.
    const fMal = fichaCom(sistema, [entrada("s1", "it_antidoto_simples"), entrada("s3", "it_antidoto_superior")]);
    const mMal = mesa(fMal);
    const maldito = ES.aplicaVenenoNoAlvo(mMal.s, mMal.d, { itemId: "it_veneno_maldito", tr: { sucesso: true }, opId: op() });
    const simplesNoMaldito = IT.usaItem(fMal, maldito.sessao, mMal.d, { uid: "s1", opId: op() });
    t(tag("o Antídoto Simples NÃO tira o Envenenado do Veneno Maldito (custo 3)"), [simplesNoMaldito.aplicado, simplesNoMaldito.erro, simplesNoMaldito.sessao === maldito.sessao, IT.unidadesRestantes(fMal, simplesNoMaldito.sessao, "s1")], [false, "Veneno Acima do Antídoto", true, 1]);
    const superiorNoMaldito = IT.usaItem(fMal, maldito.sessao, mMal.d, { uid: "s3", opId: op() });
    t(tag("o Antídoto Superior (custo 3) tira o Envenenado e encerra o veneno"), [superiorNoMaldito.aplicado, superiorNoMaldito.sessao.condicoes, Object.keys(US.usoDe(superiorNoMaldito.sessao).ativos)], [true, [], []]);
    // Dois venenos: o de custo 1 sai, o Envenenado do de custo 3 fica.
    const doisVenenos = ES.aplicaVenenoNoAlvo(maldito.sessao, mMal.d, { itemId: "it_veneno_intenso", tr: { sucesso: false }, opId: op() });
    const soOMenor = IT.usaItem(fMal, doisVenenos.sessao, mMal.d, { uid: "s1", opId: op() });
    t(tag("com dois venenos, o antídoto menor encerra só o dele e deixa o Envenenado do maior"), [soOMenor.aplicado, soOMenor.sessao.condicoes.map((c) => c.nome), Object.keys(US.usoDe(soOMenor.sessao).ativos)], [true, ["Envenenado"], ["veneno:it_veneno_maldito"]]);

    // Recusas.
    t(tag("Corpo Amaldiçoado é imune"), ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_intenso", tr: { sucesso: false }, opId: op(), imune: true }).erro, "Alvo Imune a Veneno");
    t(tag("sem o resultado do TR"), ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_intenso", opId: op() }).erro, "Informe o Resultado do Teste de Resistência");
    t(tag("item que não é veneno"), ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_perola_carregada", tr: { sucesso: false }, opId: op() }).erro, "Item Não É Veneno");
    const id = op();
    const v1 = ES.aplicaVenenoNoAlvo(s, d, { itemId: "it_veneno_debilitante", tr: { sucesso: false }, opId: id });
    const v2 = ES.aplicaVenenoNoAlvo(v1.sessao, d, { itemId: "it_veneno_debilitante", tr: { sucesso: false }, opId: id });
    t(tag("o mesmo opId não aplica duas vezes"), [v2.repetida, v2.sessao === v1.sessao], [true, true]);
  }
}

/* ------------------------------------------------------------ D. Teto de melhorias do Ferreiro */
{
  const L = EXTRAS.limiteDeMelhoriasDoFerreiro;
  t("descanso curto: metade do BT, para baixo", [L(2, "curto"), L(3, "curto"), L(4, "curto"), L(6, "curto")], [1, 1, 2, 3]);
  t("descanso longo: o BT inteiro", [L(2, "longo"), L(5, "longo"), L(6)], [2, 5, 6]);
  t("BT inválido vira zero", [L(-3), L("x", "curto"), L(null)], [0, 0, 0]);
  t("duas melhorias com BT 2 no descanso longo cabem", EXTRAS.avaliaMelhoriasDoFerreiro({ armeiro_melhorias: ["arma", "escudo"] }, 2, "longo"), { ativas: 2, limite: 2, excede: false });
  t("duas melhorias com BT 2 no descanso curto passam do teto", EXTRAS.avaliaMelhoriasDoFerreiro({ armeiro_melhorias: ["arma", "escudo"] }, 2, "curto"), { ativas: 2, limite: 1, excede: true });
  t("sem melhorias não excede", EXTRAS.avaliaMelhoriasDoFerreiro({}, 2, "curto"), { ativas: 0, limite: 1, excede: false });
  t("o catálogo dos venenos usa as CDs do livro", [1, 2, 3, 4].map((c) => USO.CD_DO_VENENO[c]), [15, 25, 35, 45]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
