/* PV DOBRADO E PASSIVAS SEM CUSTO (2026-09-18).

   Os dois canais do Addon `vida-dobrada-passivas-gratis`, medidos no motor e no
   próprio pacote:

     • `hpMult` multiplica o PV FINAL (depois da Alma e do Patamar). Sem fonte
       nenhuma o PV não muda, e o Integridade da Alma do jogador (que É o PV)
       acompanha.
     • `passivaSemCusto` isenta TODA Passiva do PE Máximo. A regra do jogador
       cobra o dobro do nível de cada uma (`passivaCustaPeMaximo`), e o canal a
       zera sem tocar na criatura, onde ela já era de graça.

   ⚠ Os efeitos chegam por um Funcionamento do pacote, e não por um canal
   solto, porque é assim que um Addon dá efeito sempre ativo a qualquer ficha. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/vida-dobrada-passivas-gratis.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote pede a primitiva", pacote.permite, ["pvEPassivas"]);
AD.aplicarAddons([pacote]);

const passiva = (nome, nivel) => ({ ...F.createBlankFeitico(), nome, tipo: "passivo", nivel });
const ficha = (rulesVersion, comAddon) => {
  const c = createBlankAfty();
  c.rulesVersion = rulesVersion;
  c.core.nd = 10;
  c.feiticos = [passiva("A", 3), passiva("B", 2)];   // 6 + 4 = 10 de PE Máximo
  if (comAddon) c.addons = [pacote];
  return c;
};

/* ============================================================ */
/* 1. O PV                                                       */
/* ============================================================ */
for (const sis of ["player", "afty"]) {
  const sem = deriveAfty(ficha(sis, false));
  const com = deriveAfty(ficha(sis, true));
  t(`${sis}: o PV dobra`, com.hp, sem.hp * 2);
  t(`${sis}: o hover do PV mostra o multiplicador`,
    com.partes.hp.some((p) => p.texto === "× 2"), true);
  t(`${sis}: sem o Addon nao aparece multiplicador`,
    sem.partes.hp.some((p) => String(p.texto ?? "").startsWith("×")), false);
}

/* A Alma do jogador é o PV, então acompanha o dobro. */
{
  const sem = deriveAfty(ficha("player", false));
  const com = deriveAfty(ficha("player", true));
  t("player: a Integridade da Alma acompanha o PV dobrado", com.almaMax, com.hp);
  t("player: e ela era o PV de antes", sem.almaMax, sem.hp);
}

/* ============================================================ */
/* 2. AS PASSIVAS                                                */
/* ============================================================ */
{
  const sem = deriveAfty(ficha("player", false));
  const com = deriveAfty(ficha("player", true));
  t("player: sem o Addon as Passivas tiram 10 de PE Maximo",
    sem.partes.pe.filter((p) => p.label.endsWith("(Passiva)")).reduce((s, p) => s + p.valor, 0), -10);
  t("player: com o Addon o PE Maximo volta 10", com.pe - sem.pe, 10);
  t("player: com o Addon nao ha linha de Passiva no hover do PE",
    com.partes.pe.some((p) => p.label.endsWith("(Passiva)")), false);
  t("player: o derivado diz que as Passivas estao isentas", [sem.passivasIsentas, com.passivasIsentas], [false, true]);
}

/* Na criatura a Passiva já era de graça: o Addon não muda o PE. */
{
  const sem = deriveAfty(ficha("afty", false));
  const com = deriveAfty(ficha("afty", true));
  t("afty: o PE nao muda (a Passiva ja era de graca)", com.pe, sem.pe);
}

/* O custo por Passiva que a linha do Feitiço carrega também zera. */
{
  const sem = deriveAfty(ficha("player", false));
  const com = deriveAfty(ficha("player", true));
  const custoLinha = (d) => (d.feiticos.lista ?? []).filter((l) => l.tipo === "passivo").map((l) => l.custoPeMaximo ?? null);
  t("player: sem o Addon cada Passiva mostra o custo dela", custoLinha(sem), [6, 4]);
  t("player: com o Addon nenhuma mostra custo", custoLinha(com), [null, null]);
}

/* ============================================================ */
/* 3. O ISOLAMENTO                                               */
/* ============================================================ */
{
  const d = deriveAfty(ficha("player", false));
  t("sem o Addon nada isenta as Passivas", d.passivasIsentas, false);
  t("e a primitiva nao aparece", d.primitivas, []);
  t("com o Addon a primitiva aparece", deriveAfty(ficha("player", true)).primitivas, ["pvEPassivas"]);
}

const total = ok + bad.length;
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log(b);
  console.log(`--- ${bad.length} de ${total} com falha ---`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
