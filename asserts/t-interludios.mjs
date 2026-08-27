/* A VARREDURA DOS INTERLÚDIOS, 2026-08-26. O autor notou que o Treino de
   Domínios não estava automatizado e que "alguns pré-requisitos não estão sendo
   considerados", e mandou revisar as 12 linhas do livro uma a uma.

   O que a varredura achou, e o que este arquivo amarra:

     1. os 13 requisitos que ainda eram `nota` (só exibiam) viraram `aptidao` e
        `trilha` de verdade, e agora BLOQUEIAM. Eles nasceram `nota` porque as
        Aptidões Amaldiçoadas não existiam na transcrição, e os dois tipos que os
        substituem só nasceram em 2026-08-22;
     2. o Treino de Potencial Físico é SÓ DO RESTRINGIDO, e a trava não existia,
        apesar de o `resumo` dizê-lo desde sempre;
     3. ⚠ o efeito da 2ª etapa do Potencial Físico era DESCARTADO CALADO: o tipo
        `atributo` exige alvo de instância e a linha não é repetível. O assert
        estrutural da seção 4 é o que impede a classe inteira de voltar, em
        qualquer linha, do livro ou de Addon.

   O que continua SEM CANAL (Domínios inteiro, `peTemporario`, e mais sete) não
   está aqui, porque assert não cobre o que não existe. A lista mora no
   cabeçalho de afty-treinamentos.js e em docs/a-fazer.md. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const TRE = await import(R + "afty-treinamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (nd, origem, tipo = "misto") => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.tipo = tipo;
  c.core.patamar = "comum";
  c.core.origem = { id: origem };
  return c;
};
const etapa = (id, n) => TRE.getTreinamento(id).etapas[n - 1];

/* ============================================================ */
/* 1. Nenhuma linha do livro usa `nota`                          */
/* ============================================================ */

const LIVRO = TRE.AFTY_TREINAMENTOS.filter((l) => !String(l.id).includes(":"));
t("as 12 linhas do livro estao la", LIVRO.length, 12);

const notas = [];
for (const l of LIVRO) {
  for (const et of l.etapas) if (et.requisito?.tipo === "nota") notas.push(`${l.id} ${et.n}a`);
}
t("nenhuma etapa do livro requer por nota", notas, []);

/* ⚠ Mas o tipo FICA no avaliador, para o Addon que cite sistema que o Afty
   ainda não tem. Tirá-lo do avaliador quebraria pacote de mesa. */
const semSistema = TRE.avaliarRequisito({ tipo: "nota", label: "Sistema Futuro" }, {});
t("o tipo nota continua vivo", semSistema.label, "Sistema Futuro");
t("e continua nao bloqueando", [semSistema.ok, semSistema.verificavel], [true, false]);

/* ============================================================ */
/* 2. Os 13 requisitos convertidos, um a um                      */
/* ============================================================ */

t("Barreiras 1a pede Tecnicas de Barreira",
  etapa("barreiras", 1).requisito, { tipo: "aptidao", id: "tecnicas_de_barreira" });
t("Barreiras 3a pede BAR 2", etapa("barreiras", 3).requisito, { tipo: "trilha", trilha: "bar", valor: 2 });
t("Barreiras 4a pede BAR 3", etapa("barreiras", 4).requisito, { tipo: "trilha", trilha: "bar", valor: 3 });

t("Compreensao 3a pede AU 2", etapa("compreensao", 3).requisito, { tipo: "trilha", trilha: "au", valor: 2 });
t("Compreensao 4a pede AU 3", etapa("compreensao", 4).requisito, { tipo: "trilha", trilha: "au", valor: 3 });

t("Controle de Energia 3a pede CL 2",
  etapa("controle_energia", 3).requisito, { tipo: "trilha", trilha: "cl", valor: 2 });
t("Controle de Energia 4a pede CL 3",
  etapa("controle_energia", 4).requisito, { tipo: "trilha", trilha: "cl", valor: 3 });

t("Dominios 1a pede a Expansao Incompleta",
  etapa("dominios", 1).requisito, { tipo: "aptidao", id: "expansao_de_dominio_incompleta" });
t("Dominios 3a pede a Expansao Completa",
  etapa("dominios", 3).requisito, { tipo: "aptidao", id: "expansao_de_dominio_completa" });
t("Dominios 4a pede DOM 5", etapa("dominios", 4).requisito, { tipo: "trilha", trilha: "dom", valor: 5 });

t("Energia Reversa 1a pede a aptidao Energia Reversa",
  etapa("energia_reversa", 1).requisito, { tipo: "aptidao", id: "energia_reversa" });
t("Energia Reversa 3a pede ER 4", etapa("energia_reversa", 3).requisito, { tipo: "trilha", trilha: "er", valor: 4 });
t("Energia Reversa 4a pede ER 5", etapa("energia_reversa", 4).requisito, { tipo: "trilha", trilha: "er", valor: 5 });

/* Eles BLOQUEIAM, que é o ponto todo da conversão. */
const semNada = { aptidoes: [], niveisAptidao: { bar: 0, au: 0, cl: 0, dom: 0, er: 0 } };
for (const [id, n] of [["barreiras", 1], ["barreiras", 3], ["compreensao", 3], ["dominios", 1], ["energia_reversa", 4]]) {
  t(`${id} ${n}a trava sem nada`, TRE.avaliarRequisito(etapa(id, n).requisito, semNada).ok, false);
}
t("e todos sao verificaveis agora",
  TRE.avaliarRequisito(etapa("dominios", 4).requisito, semNada).verificavel, true);

/* Com o nível na trilha, abre. O rótulo sai do catálogo de trilhas, e por isso
   diz "Barreira" no singular: o livro define "Aptidão em Barreira (BAR)", e o
   plural do texto do treino é transcrição, não rótulo gerado. */
const comBar2 = TRE.avaliarRequisito(etapa("barreiras", 3).requisito, { niveisAptidao: { bar: 2 } });
t("BAR 2 abre a 3a de Barreiras", comBar2.ok, true);
t("e o rotulo e o do catalogo de trilhas", comBar2.label, "Nível de Aptidão em Barreira 2");

const comApt = TRE.avaliarRequisito(etapa("dominios", 3).requisito, { aptidoes: ["expansao_de_dominio_completa"] });
t("a aptidao abre a 3a de Dominios", comApt.ok, true);
t("e o rotulo e o nome dela", comApt.label, "Expansão de Domínio Completa");

/* ============================================================ */
/* 3. Potencial Físico é só do Restringido                       */
/* ============================================================ */

t("o Restringido ve a linha",
  TRE.treinamentosDaOrigem("restringido").some((l) => l.id === "potencial_fisico"), true);
for (const o of ["inato", "derivado", "herdado", "sem_tecnica", "maldicao", "feto_amaldicoado_hibrido"]) {
  t(`${o} NAO ve a linha`,
    TRE.treinamentosDaOrigem(o).some((l) => l.id === "potencial_fisico"), false);
}
t("e a trava e a positiva, nao a negativa",
  [TRE.getTreinamento("potencial_fisico").soDaOrigem, TRE.getTreinamento("potencial_fisico").foraDaOrigem ?? null],
  [["restringido"], null]);

/* ⚠ O Foco preso nela por quem não é Restringido VOLTA, porque `focosGastos`
   descarta linha indisponível. É o mesmo caminho do corte da Energia Reversa
   para a Maldição, e por isso não há migração de ficha. */
const gasto = { potencial_fisico: 4 };
t("o Restringido paga os 5 Focos", TRE.focosGastos(gasto, "restringido"), 5);
t("e o Inato nao paga nada", TRE.focosGastos(gasto, "inato"), 0);

/* E o efeito também para de valer, mesmo gravado. */
const inatoComPF = ficha(12, "inato");
inatoComPF.treinamentos = gasto;
t("nem os efeitos dela chegam no motor",
  TRE.efeitosDeTreino(inatoComPF).filter((e) => e.origem === "potencial_fisico").length, 0);

const resComPF = ficha(12, "restringido", "restringido");
resComPF.treinamentos = gasto;
/* Três: os dois de PE das etapas 1ª e 3ª, mais a casca de PE do Completo. */
t("e chegam para o Restringido",
  TRE.efeitosDeTreino(resComPF).filter((e) => e.origem === "potencial_fisico").length, 3);

/* ============================================================ */
/* 4. ⚠ O assert que impede o efeito morto de voltar             */
/* ============================================================ */
/* Toda linha, com as 4 etapas mais o Completo: quantos efeitos o catálogo
   DECLARA contra quantos o `efeitosDeTreino` EMITE. Divergir quer dizer que o
   `paraCanal` descartou algum calado, que foi exatamente o bug da 2ª etapa do
   Potencial Físico. A linha repetível recebe um alvo válido do tipo dela, senão
   o descarte seria legítimo. */
const ALVO = { atributo: "forca", pericia: "acrobacia", arma: "adaga" };

const divergentes = [];
for (const l of TRE.AFTY_TREINAMENTOS) {
  const declarados = l.etapas.reduce((n, e) => n + (e.efeitos?.length ?? 0), 0)
    + (l.completo?.efeitos?.length ?? 0);
  /* A origem tem de alcançar a linha, senão `efeitosDeTreino` corta antes de o
     `paraCanal` ser chamado, e o teste mediria a trava em vez do descarte. */
  const origem = l.soDaOrigem?.[0] ?? (l.foraDaOrigem?.includes("inato") ? null : "inato");
  if (!origem) continue;
  const c = ficha(20, origem, origem === "restringido" ? "restringido" : "misto");
  c.treinamentos = {
    [l.id]: l.repetivel ? [{ alvo: ALVO[l.alvoTipo], progresso: 4 }] : 4,
  };
  const emitidos = TRE.efeitosDeTreino(c).filter((e) => e.origem === l.id).length;
  if (declarados !== emitidos) divergentes.push(`${l.id}: declarou ${declarados}, emitiu ${emitidos}`);
}
t("nenhuma linha declara efeito que o motor descarta", divergentes, []);

/* A prova de que o assert acima mede algo: era o `atributo` sem alvo que
   devolvia null, e a etapa parou de declarar o que o motor não sabe entregar. */
t("Potencial Fisico 2a nao declara mais efeito", etapa("potencial_fisico", 2).efeitos ?? null, null);
t("mas o beneficio dela continua verbatim",
  etapa("potencial_fisico", 2).beneficio,
  "Você recebe 2 pontos de atributo para distribuir entre seus atributos físicos.");

/* ============================================================ */
/* 5. O que JÁ estava automatizado continua                      */
/* ============================================================ */

const base = deriveAfty(ficha(12, "inato"));
const comLinha = (treinamentos) => {
  const c = ficha(12, "inato");
  c.treinamentos = treinamentos;
  return deriveAfty(c);
};

t("Agilidade completa soma 6m de movimento",
  comLinha({ agilidade: 4 }).movimento - base.movimento, 6);

/* 4 + 6 + 10 na base, e o Comum multiplica por 1. */
t("Resistencia completa soma 20 de PV",
  comLinha({ resistencia: 4 }).hp - base.hp, 20);

const comAtributo = comLinha({ atributo: [{ alvo: "forca", progresso: 4 }] });
t("Treino de Atributo sobe a Forca em 4", comAtributo.attrEff.forca - base.attrEff.forca, 4);
t("e o Completo sobe o limite dela em 2",
  comAtributo.attrLimiteEfetivo.forca - base.attrLimiteEfetivo.forca, 2);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
