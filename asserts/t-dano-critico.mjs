/* O CRÍTICO, O RAIO NEGRO E O HOVER DE DANO (autor, 2026-09-15).
   Regras que este arquivo prende, todas ditas pelo autor na análise do Flugel:
     • Critável é o que DOBRA no crítico. O Dano Fixo não é critável.
     • O Raio Negro multiplica por 1,5 só os dados critáveis. O fixo soma uma vez.
     • Golpe Especial Atroz, Canalizar em Golpe e Canalizar Energia Reversa são
       critáveis. O Canalizar em Golpe não é Após Ataque.
     • Crítico Potente dá 1 dado no crítico, e esse dado dobra: rola 2. Destruidora,
       Mortal e o dado extra do Fatal seguem a mesma regra.
     • A Canalização Máxima compra 1 dado com o PE adicional.
     • Os dois Canalizar são exclusivos: ligar um desliga o outro.
     • A Sintonizada chega na linha, com 1d8 critável do tipo escolhido.
     • O hover separa Critável, Não Critável e Fixo.
   Vale nos dois sistemas. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { formulaModoDano, grupoMultiplicavel, grupoNoRaioNegro, hoverDoDano, textoDosDados } = await import(R + "afty-dano.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { alteraEstadoCombate } = await import(R + "ficha/ficha-sessao.js");
const { tipoDaSintonizada } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Um dado sai com o valor da fila, em ordem. `umDado` é 1 + piso(rng × faces). */
const fila = (...valores) => {
  let i = 0;
  return () => valores[i++ % valores.length];
};

/* ============================================================ */
/* 1. A CONTA PURA                                               */
/* ============================================================ */

const golpe = { nome: "Ataque", dados: 2, faces: 8, fixo: 4, momento: "durante", multiplica: true };
const apos = { nome: "Após", dados: 1, faces: 6, fixo: 1, momento: "apos", multiplica: false };
const soCritico = { nome: "Destruidora", dados: 1, faces: 8, fixo: 0, momento: "durante", multiplica: true, apenasCritico: true };

t("o Raio Negro e o crítico olham o mesmo conjunto",
  [golpe, apos, soCritico].map(grupoNoRaioNegro), [golpe, apos, soCritico].map(grupoMultiplicavel));
/* ⚠ OS DADOS DE MESMA FACE SOMAM NUM TERMO SÓ (autor, 2026-09-15): *"Some os
   danos como 20d12 + 2d12 + 2d12 em 24d12."* O fixo de todos também vira um
   número só, no fim. Quem separa por fonte é o hover. */
t("o crítico dobra os dados, soma as faces iguais e deixa o fixo",
  formulaModoDano([golpe, apos, soCritico], "critico"), "6d8 + 1d6 + 5");
t("o Raio Negro multiplica só os dados critáveis, com o fixo por fora",
  formulaModoDano([golpe, apos, soCritico], "raio_negro"), "(6d8) × 1,5 + 1d6 + 5");
t("a rolagem normal não mostra o dado de crítico",
  formulaModoDano([golpe, apos, soCritico], "normal"), "2d8 + 1d6 + 5");
/* Faces diferentes seguem separadas, e a não critável fica fora do parêntese. */
const d12 = { nome: "A", dados: 2, faces: 12, fixo: 0, momento: "durante", multiplica: true };
const d12b = { nome: "B", dados: 1, faces: 12, fixo: 0, momento: "durante", multiplica: true };
const d12apos = { nome: "C", dados: 1, faces: 12, fixo: 0, momento: "apos", multiplica: false };
t("faces iguais somam, e o que não é critável soma fora",
  [formulaModoDano([d12, d12b, d12apos], "normal"),
    formulaModoDano([d12, d12b, d12apos], "raio_negro")],
  ["4d12", "(6d12) × 1,5 + 1d12"]);

/* 4d8 critáveis saindo 1, 2, 3 e 1 somam 7, que é ímpar: 7 + piso(7 / 2) = 10.
   O `piso(7 / 2) × 3` antigo dava 9. O fixo (4) e o Após (1d6 = 1, fixo 1) somam
   uma vez: 10 + 4 + 1 + 1 = 16. */
const r = rolarDano({ rotulo: "x", grupos: [golpe, apos], modoDano: "raio_negro" },
  fila(0, 0.13, 0.26, 0, 0));
t("Raio Negro: a metade do ímpar tem piso, e o fixo não sobe", r.total, 16);
const rc = rolarDano({ rotulo: "x", grupos: [golpe, apos], modoDano: "critico" }, fila(0));
t("crítico: 4 dados + fixo 4, mais 1d6 + 1", rc.total, 4 + 4 + 1 + 1);

t("dados somados por tamanho, do maior para o menor",
  textoDosDados([{ dados: 2, faces: 8 }, { dados: 1, faces: 12 }, { dados: 3, faces: 8 }]), "1d12 + 5d8");

/* O hover de uma linha montada à mão: o grupo com parcela não se repete. */
const hover = hoverDoDano({
  partes: [
    { label: "Dano da Arma", texto: "2d8", categoria: "critavel" },
    { label: "Destreza", valor: 4, categoria: "fixo" },
  ],
  gruposDano: [{ ...golpe, naPartes: true }, apos, soCritico],
});
t("hover: as três pilhas, na ordem",
  hover.partes.filter((p) => p.secao).map((p) => [p.secao, p.texto]),
  [["Critável", "2d8"], ["Não Critável", "1d6"], ["Fixo", "+5"]]);
t("hover: o grupo sem parcela vira linha, marcado quando é só do crítico",
  hover.partes.filter((p) => !p.secao).map((p) => p.label),
  ["Dano da Arma", "Destruidora (Só no Crítico)", "Após", "Destreza", "Após"]);
t("hover: o rodapé é a rolagem normal inteira", hover.total, "2d8 + 1d6 + 5");

/* ============================================================ */
/* 2. NA FICHA                                                   */
/* ============================================================ */

let seq = 0;
const it = (refId, fa = null) => {
  seq += 1;
  return { uid: `eq${seq}`, tipo: "arma", refId, qtd: 1, equipado: true, ...(fa ? { fa } : {}) };
};

const cria = (sistema, { combate = {}, itens = [], aptidoes = [] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 20;
  c.core.tipo = "combatente";
  c.core.patamar = "comum";
  c.especializacoes = [{ id: "combatente", nivel: 20 }];
  // Na criatura a Base não é automática: o Golpe Especial entra à mão.
  c.habilidades = ["cmb_golpe_especial", "cmb_critico_potente"];
  c.attrMethod = "fixos";
  c.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.aptidoes = { au: 3, cl: 4, bar: 0, dom: 0, er: 3 };
  c.aptidoesAmaldicoadas = aptidoes;
  c.equipamentos = { itens };
  c.combate = { ativo: true, ...combate };
  return c;
};
const basico = (c) => deriveAfty(c).dano.entradas.find((e) => e.id === "basico");
const grupo = (linha, nome) => (linha.gruposDano ?? []).find((g) => g.nome === nome) ?? null;

for (const sistema of ["player", "afty"]) {
  const l = basico(cria(sistema, { combate: { golpeAtroz: true } }));
  const potente = grupo(l, "Crítico Potente");
  t(`${sistema}: Crítico Potente é 1 dado só no crítico, e dobra`,
    potente && [potente.dados, potente.apenasCritico, potente.multiplica], [1, true, true]);
  t(`${sistema}: e não muda a rolagem normal`,
    formulaModoDano(l.gruposDano.filter((g) => g.nome !== "Crítico Potente"), "normal"), l.formulaNormal);
  t(`${sistema}: e rola 2 dados no crítico`,
    [formulaModoDano([potente], "critico"),
      formulaModoDano(l.gruposDano.filter((g) => g.nome !== "Crítico Potente"), "critico") === l.formulaCritico],
    [`2d${potente?.faces}`, false]);
  t(`${sistema}: o Atroz é critável`, grupo(l, "Golpe Especial")?.multiplica, true);

  const h = l.hoverDano;
  t(`${sistema}: o hover abre com pilha`, !!h?.partes?.[0]?.secao, true);
  t(`${sistema}: o hover marca o Crítico Potente`,
    h.partes.some((p) => p.label === "Crítico Potente (Só no Crítico)"), true);
  const fixoGrupos = l.gruposDano.filter((g) => !g.apenasCritico).reduce((s, g) => s + (g.fixo || 0), 0);
  const fixoSecao = h.partes.find((p) => p.secao === "Fixo")?.texto;
  t(`${sistema}: o subtotal do Fixo é o fixo da rolagem`, fixoSecao, `${fixoGrupos < 0 ? "−" : "+"}${Math.abs(fixoGrupos)}`);
}

/* No jogador as parcelas do Fixo SOMAM o subtotal. Na criatura quem soma é a
   pilha do Dano Total, e o Fixo é o que sobrou dela. */
{
  const l = basico(cria("player"));
  const partes = l.hoverDano.partes;
  const inicio = partes.findIndex((p) => p.secao === "Fixo");
  const soma = partes.slice(inicio + 1).filter((p) => !p.secao && !p.suplantado).reduce((s, p) => s + (p.valor ?? 0), 0);
  t("jogador: as parcelas do Fixo somam o subtotal", `+${soma}`, partes[inicio].texto);
  const lc = basico(cria("afty"));
  const pc = lc.hoverDano.partes;
  const ini = pc.findIndex((p) => p.secao === "Dano Total");
  const fim = pc.findIndex((p, i) => i > ini && p.secao);
  t("criatura: as parcelas do Dano Total somam o total",
    pc.slice(ini + 1, fim).reduce((s, p) => s + (p.suplantado ? 0 : (p.valor ?? 0)), 0), lc.total);
}

/* ============================================================ */
/* 3. OS DOIS CANALIZAR                                          */
/* ============================================================ */

const aptidoesCanalizar = [
  "energia_reversa", "liberacao_de_energia_reversa",
  "canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima", "canalizar_energia_reversa",
];
const comCanalizar = (combate) => cria("player", { aptidoes: aptidoesCanalizar, combate });
const dCanaliza = deriveAfty(comCanalizar({ canalizarEmGolpe: true, canalizacaoMaxima: true }));
const cl = dCanaliza.aptidao.efetivo.cl;
const maxima = grupo(dCanaliza.dano.entradas.find((e) => e.id === "basico"), "Canalização Máxima");
t("Canalização Máxima rola com o golpe, e é critável",
  maxima && [maxima.momento, maxima.multiplica], ["durante", true]);
t("e o PE adicional compra um dado", maxima?.dados, cl + 1);
t("e o fixo dela é o Nível em Aura", maxima?.fixo, dCanaliza.aptidao.efetivo.au);

const dER = deriveAfty(comCanalizar({ canalizarEnergiaReversa: true }));
const er = grupo(dER.dano.entradas.find((e) => e.id === "basico"), "Canalizar Energia Reversa");
t("Canalizar Energia Reversa: 2d6 por ponto, pontos iguais ao BT",
  er && [er.dados, er.faces, er.multiplica, er.tipoDano], [2 * dER.maestria, 6, true, "energia_reversa"]);
t("com os dois gravados ligados, só o Canalizar em Golpe vale",
  grupo(deriveAfty(comCanalizar({ canalizarEmGolpe: true, canalizarEnergiaReversa: true }))
    .dano.entradas.find((e) => e.id === "basico"), "Canalizar Energia Reversa"), null);

const estados = dER.combate.estadosExtras.filter((e) => /^canalizar/.test(e.id));
t("os dois interruptores se declaram exclusivos",
  estados.map((e) => [e.id, e.exclusivoCom]),
  [["canalizarEmGolpe", ["canalizarEnergiaReversa"]], ["canalizarEnergiaReversa", ["canalizarEmGolpe"]]]);
const erDef = estados.find((e) => e.id === "canalizarEnergiaReversa");
const sessao = alteraEstadoCombate({ combate: { ativo: true, canalizarEmGolpe: true } }, erDef, true);
t("na Ficha, ligar um desliga o outro",
  [sessao.combate.canalizarEmGolpe, sessao.combate.canalizarEnergiaReversa], [false, true]);
const desliga = alteraEstadoCombate({ combate: { ativo: true, canalizarEmGolpe: true, canalizarEnergiaReversa: true } }, erDef, false);
t("e desligar não mexe no outro", desliga.combate.canalizarEmGolpe, true);

/* ============================================================ */
/* 4. SINTONIZADA                                                */
/* ============================================================ */

const faixas = (tipo) => it("arm_faixas", {
  grau: "especial", encantamentos: ["enc_arma_sintonizada"], habilidadeUnica: "", sintonizadaTipo: tipo,
});
const dSint = deriveAfty(cria("player", { itens: [faixas("chocante")], combate: { sintonizada: true } }));
const sint = grupo(dSint.dano.entradas.find((e) => e.id === "basico"), "Sintonizada (Chocante)");
t("Sintonizada: 1d8 critável do tipo escolhido",
  sint && [sint.dados, sint.faces, sint.multiplica, sint.tipoDano], [1, 8, true, "chocante"]);
t("e o interruptor existe com a arma equipada",
  dSint.combate.estadosExtras.some((e) => e.id === "sintonizada"), true);
t("desligada não soma",
  grupo(deriveAfty(cria("player", { itens: [faixas("chocante")] })).dano.entradas
    .find((e) => e.id === "basico"), "Sintonizada (Chocante)"), null);
t("sem a arma não há interruptor",
  deriveAfty(cria("player")).combate.estadosExtras.some((e) => e.id === "sintonizada"), false);
t("Físico e Alma não são tipo da Sintonizada",
  ["ct", "alma", "chocante", "energia_reversa"].map(tipoDaSintonizada), [null, null, "chocante", "energia_reversa"]);

/* ============================================================ */
/* 5. ABENÇOADO PELAS FAÍSCAS NEGRAS                             */
/* ============================================================ */

/* Autor, 2026-09-15: *"Metade do seu nivel de Controle e Leitura arredondado pra
   cima como Acerto e Nivel de Controle e Leitura como Dano Fixo."* O acerto é a
   única conta do Afty que arredonda para CIMA. */
const comFaiscas = (cl, combate) => {
  const c = cria("player", { aptidoes: ["raio_negro", "abencoado_pelas_faiscas_negras"], combate });
  c.aptidoes = { ...c.aptidoes, cl };
  return deriveAfty(c);
};
const faiscasDe = (d) => {
  const l = d.dano.entradas.find((e) => e.id === "basico");
  const nome = /Fa.scas/;
  return [
    l.partesAcerto.find((p) => nome.test(p.label))?.valor ?? 0,
    l.partes.find((p) => nome.test(p.label))?.valor ?? 0,
  ];
};
t("Faíscas Negras desligado não soma nada", faiscasDe(comFaiscas(5, {})), [0, 0]);
for (const [cl, acerto] of [[5, 3], [4, 2], [3, 2]]) {
  t(`Faíscas Negras com CL ${cl}: acerto ${acerto} (metade para cima) e dano ${cl}`,
    faiscasDe(comFaiscas(cl, { faiscasNegras: true })), [acerto, cl]);
}
t("e o interruptor existe com a Aptidão",
  comFaiscas(5, {}).combate.estadosExtras.filter((e) => e.id === "faiscasNegras")
    .map((e) => [e.tipo, e.label]),
  [["bool", "Abençoado pelas Faíscas Negras"]]);
t("sem a Aptidão não há interruptor",
  cria("player") && deriveAfty(cria("player")).combate.estadosExtras.some((e) => e.id === "faiscasNegras"), false);

/* ============================================================ */
/* 6. O DADO DE EMPOLGAÇÃO É ROLADO                              */
/* ============================================================ */

/* Autor, 2026-09-15: *"Empolgação Ajuste não é bônus fixo. É rolagem do dado de
   empolgação."* Ajuste soma o dado no acerto E no dano, e o Desarme no dano. A
   MÉDIA fica onde não há rolagem: a Defesa do Trabalho de Pés. */
const lutador = (combate, manobras) => {
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core.nd = 10;
  c.core.tipo = "lutador";
  c.core.patamar = "comum";
  c.especializacoes = [{ id: "lutador", nivel: 10 }];
  c.escolhasHabilidade = { lut_empolgacao: manobras };
  c.attrMethod = "fixos";
  c.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.combate = { ativo: true, ...combate };
  return deriveAfty(c);
};
const AJUSTE = ["lut_manobra_ajuste", "lut_manobra_desarme"];
const semManobra = lutador({ empolgacao: 3 }, AJUSTE);
const basicoDe = (d) => d.dano.entradas.find((e) => e.id === "basico");
const corpoDe = (d) => d.testes.ataques.find((a) => a.id === "corpo");
t("sem manobra o acerto é número puro",
  [corpoDe(semManobra).textoBonus, basicoDe(semManobra).acertoTexto], [null, null]);
for (const [nivel, dado] of [[2, "1d4"], [3, "1d6"], [4, "2d4"], [5, "2d6"]]) {
  const d = lutador({ empolgacao: nivel, manobraAjuste: true }, AJUSTE);
  t(`Ajuste na Empolgação ${nivel} soma ${dado} no acerto`,
    [corpoDe(d).textoBonus, basicoDe(d).acertoTexto],
    [`+${corpoDe(semManobra).bonus} + ${dado}`, `+${basicoDe(semManobra).acerto} + ${dado}`]);
  t(`e ${dado} no dano`, basicoDe(d).texto, `${basicoDe(semManobra).texto} + ${dado}`);
  t("e o dado da jogada vai para a rolagem",
    basicoDe(d).acertoDados, [{ faces: Number(dado.split("d")[1]), qtd: Number(dado.split("d")[0]) }]);
}
/* ⚠ DUAS FONTES DO MESMO TAMANHO DE DADO recebem uma parcela CADA no hover. O
   grupo tem uma vaga de nome só, e as duas viravam "Dano Adicional 4d6": o
   número certo com o detalhamento apagado. */
const duasFontes = lutador({ empolgacao: 5, manobraAjuste: true, manobraDesarme: true }, AJUSTE);
const partesD6 = basicoDe(duasFontes).partes.filter((p) => /d6$/.test(p.texto ?? ""));
t("Ajuste e Desarme aparecem separados no hover, e não como Dano Adicional",
  partesD6.map((p) => [p.label, p.texto]).sort(),
  [["Empolgação (Ajuste)", "2d6"], ["Empolgação (Desarme)", "2d6"]]);
t("e o grupo que rola continua somado",
  basicoDe(duasFontes).gruposDano.filter((g) => g.faces === 6).map((g) => g.dados), [4]);

const desarme = lutador({ empolgacao: 5, manobraDesarme: true }, AJUSTE);
t("Desarme soma o dado só no dano",
  [basicoDe(desarme).texto, basicoDe(desarme).acertoTexto],
  [`${basicoDe(semManobra).texto} + 2d6`, null]);
const comTP = ["lut_manobra_trabalho_de_pes"];
t("Trabalho de Pés segue na média, porque Defesa não rola",
  lutador({ empolgacao: 3, manobraTrabalhoDePes: true }, comTP).defesa - lutador({ empolgacao: 3 }, comTP).defesa, 3);

/* ============================================================ */
/* A FATAL NO EMPATE (autor, 2026-09-18)                         */
/* ============================================================ */
/* *"se o Dano for maior ou igual ao Dano do Fatal. Você recebe 1 Dado Extra igual
   em Mortal ou Crítico Potente. Logo 1d12 c/ Fatal 1d8 sendo critico. Viraria
   2d12 + 2d8. 1d12 c/ Fatal 1d12 sendo critico. Viraria 4d12."*

   ⚠ O EMPATE FICAVA FORA DOS DOIS RAMOS ate esta data. O livro so fala em "maior
   que o dado listado", e subir o dado para o tamanho que ele ja tem nao da nada,
   entao a Fatal do tamanho do dado da arma nao fazia coisa alguma. Doia calado
   justo em quem pagou mais: o dado empaca no d12 (topo da escada) e a bancada
   cobra 3 Niveis pela Fatal d12.

   As duas contas do autor sao medidas na FORMULA, e nao no grupo, porque e a
   formula que soma as faces iguais: o 4d12 do segundo exemplo so aparece depois
   de o dado extra dobrar e se juntar ao dado da arma dobrado. */
const armaFatal = (fatalDado) => {
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd: 1, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel: 1 }];
  c.attrMethod = "fixos";
  c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.armasCustom = [{
    id: "armc_fatal", nome: "Arma de Teste", classe: "simples", categoria: "corpo",
    dano: { dado: "1d12", tipo: "ct" }, critico: 20, custo: 1, grupo: "espada",
    props: { fatal: fatalDado },
  }];
  c.equipamentos = { itens: [{ uid: "f1", tipo: "arma", refId: "armc_fatal", qtd: 1, equipado: true }] };
  return deriveAfty(c).dano.entradas.find((e) => e.id === "armc_fatal");
};
t("1d12 com Fatal 1d8 crita em 2d12 + 2d8", armaFatal("1d8").formulaCritico, "2d12 + 2d8");
t("1d12 com Fatal 1d12 crita em 4d12", armaFatal("1d12").formulaCritico, "4d12");
t("e nenhuma das duas mexe na rolagem normal",
  [armaFatal("1d8").formulaNormal, armaFatal("1d12").formulaNormal], ["1d12", "1d12"]);
/* O ramo antigo continua: dado MENOR que a Fatal sobe, e não ganha dado extra. */
const sobe = armaFatal("1d12");
t("o dado extra do empate e critavel, como a Mortal",
  (sobe.gruposDano ?? []).filter((g) => g.nome === "Fatal")
    .map((g) => [g.dados, g.faces, g.apenasCritico, g.multiplica]), [[1, 12, true, true]]);

/* ⚠ Toda face da tabela de Empolgação precisa de linha no catálogo de efeitos:
   uma face nova sem linha não somaria nada, calado. */
const { EMPOLGACAO_DADOS } = await import(R + "afty-habilidades.js");
const { ESCOLHA_EFEITOS } = await import(R + "afty-efeitos-conteudo.js");
const facesDaTabela = [...new Set(Object.values(EMPOLGACAO_DADOS)
  .flatMap((t2) => Object.values(t2))
  .map((n) => Number(n.split("d")[1])))];
const facesCobertas = new Set(ESCOLHA_EFEITOS.lut_manobra_ajuste.map((e) => Number(String(e.alvo).slice(1))));
t("toda face da tabela de Empolgação tem linha no Ajuste",
  facesDaTabela.filter((f) => !facesCobertas.has(f)), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
