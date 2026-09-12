/* O INTERRUPTOR POR FEITIÇO, 2026-09-10.

   O autor, com o retorno dos jogadores: o Feitiço Auxiliar "não está aparecendo"
   na aba Buffs, e a Transformação "nunca apareceu".

   Não era regressão, e isso foi MEDIDO: o motor de 05/09, o de 08/09 e o de hoje
   davam o mesmo resultado nas 85 combinações de efeito e nível. Desde o commit que
   criou a ativação (18/08) só havia dois caminhos, a Sustentação (só o
   Sustentado) e o Esgrimista Jujutsu (só o de ação bônus). O Imediato e o
   Duradouro, que são os buffs comuns, e a Transformação não tinham onde ligar.

   Decisões do autor na mesma conversa:
     1. "Interruptor por Feitiço": cada Auxiliar Imediato ou Duradouro, e cada
        Transformação, ganha a sua linha, e o Sustentado segue nas vagas;
     2. "Esconder e anotar": o Feitiço cujo efeito não existe no nível some da
        escolha.

   ⚠ Número, e não aparência. Render não se testa aqui. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const CC = await import(R + "afty-combate-conjurador.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (feiticos, combate = null, sistema = "afty") => {
  const f = createBlankAfty();
  f.name = "Conjuradora dos Buffs";
  f.rulesVersion = sistema;
  f.core.nd = 20; f.core.nivel = 20;
  f.especializacoes = [{ id: "conjurador", nivel: 20 }];
  f.feiticos = feiticos;
  if (combate) f.combate = combate;
  return f;
};
const aux = (id, duracao, nivel, extra = {}) => ({
  id, nome: `Aux ${id}`, tipo: "auxiliar", nivel, efeitoAux: "defesa", duracaoAux: duracao, ...extra,
});
/* O primeiro nível em que aquele efeito EXISTE naquela duração. A tabela é do
   livro e o assert não crava um número dela: ele pergunta ao próprio calculador. */
const nivelValido = (duracao, efeito = "defesa") => [1, 2, 3, 4, 5].find(
  (n) => F.calcularFeiticoAuxiliar({ tipo: "auxiliar", nivel: n, efeitoAux: efeito, duracaoAux: duracao }, { nd: 20 }).disponivel,
);
const valorDe = (fe) => F.calcularFeiticoAuxiliar(fe, { nd: 20 }).valor;
const extras = (d) => d.combate?.estadosExtras ?? [];
const estado = (d, id) => extras(d).find((e) => e.id === id);
const LIG = CC.estadoLigadoDoFeitico;

const nDur = nivelValido("duradoura");
const nIme = nivelValido("imediata");
const nSus = nivelValido("sustentada");
t("a tabela tem Defesa Duradoura, Imediata e Sustentada em algum nível", [!!nDur, !!nIme, !!nSus], [true, true, true]);

/* ============================================================ */
/* 1. QUEM GANHA INTERRUPTOR                                     */
/* ============================================================ */
const dur = aux("dur", "duradoura", nDur);
const ime = aux("ime", "imediata", nIme);
const sus = aux("sus", "sustentada", nSus);
const d0 = deriveAfty(ficha([dur, ime, sus]));
t("o Duradouro ganha interruptor", estado(d0, LIG("dur"))?.tipo, "bool");
t("o Imediato também", estado(d0, LIG("ime"))?.tipo, "bool");
t("o Sustentado NÃO: ele segue nas vagas de Sustentação", estado(d0, LIG("sus")), undefined);
t("e aparece na Sustentação", (estado(d0, "sustentacaoFeitico1")?.opcoes ?? []).map((o) => o.id), ["sus"]);
t("o interruptor mora na sub-aba Feitiços", estado(d0, LIG("dur"))?.dono?.id, "feiticos");
t("a Sustentação também, e sai de Outras", estado(d0, "sustentacaoFeitico1")?.dono?.id, "feiticos");
t("o rótulo é o nome do Feitiço", estado(d0, LIG("dur"))?.label, "Aux dur");

/* ============================================================ */
/* 2. LIGAR MUDA O NÚMERO, E SÓ EM COMBATE                       */
/* ============================================================ */
const base = deriveAfty(ficha([dur])).defesa;
const ligado = deriveAfty(ficha([dur], { ativo: true, [LIG("dur")]: true }));
t("ligar o Duradouro sobe a Defesa pelo valor dele", ligado.defesa - base, valorDe(dur));
t("ele entra como ativo", ligado.auxiliaresAtivos.ativos.map((a) => a.id), ["dur"]);
const desligado = deriveAfty(ficha([dur], { ativo: true, [LIG("dur")]: false }));
t("desligado não soma", desligado.defesa, base);
const foraDeCombate = deriveAfty(ficha([dur], { ativo: false, [LIG("dur")]: true }));
t("fora de combate não soma, como todo estado", foraDeCombate.defesa, base);
const doImediato = deriveAfty(ficha([ime], { ativo: true, [LIG("ime")]: true }));
t("o Imediato também liga", doImediato.defesa - deriveAfty(ficha([ime])).defesa, valorDe(ime));

// Dois Auxiliares não acumulam: é o pool das cinco fontes, e vale a maior.
const dur2 = aux("dur2", "duradoura", nDur + 1 <= 5 && nivelValido("duradoura") ? Math.min(5, nDur + 1) : nDur);
const dois = deriveAfty(ficha([dur, dur2], { ativo: true, [LIG("dur")]: true, [LIG("dur2")]: true }));
const semNenhum = deriveAfty(ficha([dur, dur2])).defesa;
t("dois Auxiliares de Defesa ligados valem o MAIOR, e não a soma",
  dois.defesa - semNenhum, Math.max(valorDe(dur), valorDe(dur2) ?? 0));

// Múltiplos Efeitos Duradouro.
const mult = {
  id: "mult", nome: "Mult", tipo: "auxiliar", nivel: 4, multiplosAtivo: true, duracaoMult: "duradoura",
  efeitosMult: [{ id: "e1", efeito: "defesa", nivel: 2 }, { id: "e2", efeito: "ataque", nivel: 2 }],
};
const dMult0 = deriveAfty(ficha([mult]));
if (estado(dMult0, LIG("mult"))) {
  const dMult = deriveAfty(ficha([mult], { ativo: true, [LIG("mult")]: true }));
  t("o Múltiplos Efeitos Duradouro liga e entrega efeito",
    dMult.auxiliaresAtivos.efeitos.length > 0, true);
} else {
  t("o Múltiplos Efeitos só some da escolha quando nenhum efeito existe", dMult0.auxiliaresAtivos.ativos, []);
}

/* ============================================================ */
/* 3. A TRANSFORMAÇÃO                                            */
/* ============================================================ */
const transf = (id, duracao, efeitos) => ({
  id, nome: `Transf ${id}`, tipo: "especial", especialSubtipo: "transformacao", nivel: 3,
  transfDuracao: duracao, transfEfeitos: efeitos,
});
const tDur = transf("tdur", "duradoura", ["defesa", "defesa", "defesa", "defesa"]);
const calcT = F.calcularFeiticoTransformacao(tDur, { nd: 20 });
const defesasT = calcT.efeitos.filter((e) => e.efeito === "defesa" && e.disponivel).map((e) => e.valor);
const dT0 = deriveAfty(ficha([tDur]));
if (defesasT.length) {
  t("a Transformação Duradoura ganha interruptor", estado(dT0, LIG("tdur"))?.tipo, "bool");
  const dT = deriveAfty(ficha([tDur], { ativo: true, [LIG("tdur")]: true }));
  t("ligada, ela entrega o maior dos espaços de Defesa (espaços iguais não somam)",
    dT.defesa - dT0.defesa, Math.max(...defesasT));
}
const tCena = transf("tcena", "cena", ["defesa"]);
t("a Transformação de Cena também", !!estado(deriveAfty(ficha([tCena])), LIG("tcena")) || !F.calcularFeiticoTransformacao(tCena, { nd: 20 }).efeitos.some((e) => e.disponivel), true);
const tSus = transf("tsus", "sustentada", ["defesa"]);
const dTSus = deriveAfty(ficha([tSus]));
if (F.calcularFeiticoTransformacao(tSus, { nd: 20 }).efeitos.some((e) => e.disponivel)) {
  t("a Transformação Sustentada vai para as vagas de Sustentação",
    (estado(dTSus, "sustentacaoFeitico1")?.opcoes ?? []).map((o) => o.id), ["tsus"]);
  t("e não ganha interruptor", estado(dTSus, LIG("tsus")), undefined);
  const dTSusL = deriveAfty(ficha([tSus], { ativo: true, sustentacaoFeitico1: "tsus" }));
  t("sustentada pela vaga, ela entra como ativa", dTSusL.auxiliaresAtivos.ativos.map((a) => a.id), ["tsus"]);
}

// Espaço de Atributo: a Transformação não escolhe qual, e ele fica fora do número.
const tAttr = transf("tattr", "duradoura", ["atributo", "atributo", "atributo", "atributo"]);
const dAttr0 = deriveAfty(ficha([tAttr]));
t("Transformação só de Atributo, sem alvo escolhido, não é oferecida", estado(dAttr0, LIG("tattr")), undefined);

/* ============================================================ */
/* 4. ESCONDER O INVÁLIDO                                        */
/* ============================================================ */
const nInvalido = [1, 2, 3, 4, 5].find(
  (n) => !F.calcularFeiticoAuxiliar({ tipo: "auxiliar", nivel: n, efeitoAux: "defesa", duracaoAux: "sustentada" }, { nd: 20 }).disponivel,
);
if (nInvalido) {
  const invalido = aux("inv", "sustentada", nInvalido);
  const dInv = deriveAfty(ficha([invalido]));
  t("o Sustentado cujo efeito não existe no nível some da Sustentação", estado(dInv, "sustentacaoFeitico1"), undefined);
  const dInvSus = deriveAfty(ficha([invalido, sus]));
  t("e com um válido ao lado, só o válido é oferecido",
    (estado(dInvSus, "sustentacaoFeitico1")?.opcoes ?? []).map((o) => o.id), ["sus"]);
}
const nDurInvalido = [1, 2, 3, 4, 5].find(
  (n) => !F.calcularFeiticoAuxiliar({ tipo: "auxiliar", nivel: n, efeitoAux: "defesa", duracaoAux: "duradoura" }, { nd: 20 }).disponivel,
);
if (nDurInvalido) {
  t("o Duradouro inválido também não ganha interruptor",
    estado(deriveAfty(ficha([aux("dinv", "duradoura", nDurInvalido)])), LIG("dinv")), undefined);
}

/* ============================================================ */
/* 5. OS DOIS SISTEMAS                                           */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const semLigar = deriveAfty(ficha([dur], null, sistema)).defesa;
  const comLigar = deriveAfty(ficha([dur], { ativo: true, [LIG("dur")]: true }, sistema)).defesa;
  t(`${sistema}: o interruptor liga o Duradouro`, comLigar - semLigar, valorDe(dur));
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
