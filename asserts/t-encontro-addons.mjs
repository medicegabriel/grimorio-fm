import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const H = await import(R + "afty-habilidades.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const hab = (id, extra = {}) => ({
  id, nome: id, especializacaoId: "lutador", tipo: "base", nivel: 1,
  descricao: "x", requisitos: [], ...extra,
});
const A = { id: "mesa-a", nome: "Mesa A", versao: "1.0.0",
  acrescenta: { habilidades: [hab("so_da_a")] } };
const B = { id: "mesa-b", nome: "Mesa B", versao: "1.0.0",
  acrescenta: { habilidades: [hab("so_da_b")] } };
const A2 = { ...A, versao: "2.0.0" };

const ficha = (addons, habs) => {
  const c = createBlankAfty();
  c.core.nd = 12; c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.addons = addons; c.habilidades = habs;
  return c;
};

/* ---- ENCONTRO MISTO: a uniao poe os dois mundos no ar ao mesmo tempo ---- */
const fA = ficha([A], ["mesa-a:so_da_a"]);
const fB = ficha([B], ["mesa-b:so_da_b"]);
const { pacotes, divergencias } = AD.unirAddons([fA, fB]);
t("a uniao junta os dois", pacotes.length, 2);
t("sem divergencia", divergencias, []);

AD.aplicarAddons(pacotes);
t("os DOIS ids resolvem ao mesmo tempo",
  [!!H.getHabilidade("mesa-a:so_da_a"), !!H.getHabilidade("mesa-b:so_da_b")], [true, true]);

const dA = deriveAfty(fA);
const dB = deriveAfty(fB);
t("A deriva sem linha morta", dA.addonProblemas, []);
t("B deriva sem linha morta", dB.addonProblemas, []);
t("e nenhum dos dois enxerga a habilidade do outro como problema",
  [dA.addonProblemas.length, dB.addonProblemas.length], [0, 0]);

/* ⚠ O QUE O BUG DE ONTEM FAZIA: aplicar por combatente deixava o mundo com o
   ultimo. Aqui o mundo depois do laço é a UNIÃO, e continua servindo os dois. */
t("depois de derivar os dois, o mundo ainda tem A",
  !!H.getHabilidade("mesa-a:so_da_a"), true);
t("e ainda tem B", !!H.getHabilidade("mesa-b:so_da_b"), true);
t("dois addons ativos", AD.addonsAtivos().length, 2);

/* ---- versoes divergentes do MESMO pacote ---- */
const fA2 = ficha([A2], []);
const u2 = AD.unirAddons([fA, fA2]);
t("mesmo pacote em duas versoes e relatado", u2.divergencias.length, 1);
t("e o relato nomeia as duas versoes", u2.divergencias[0].versoes, ["1.0.0", "2.0.0"]);
t("vale a PRIMEIRA", u2.pacotes[0].versao, "1.0.0");
t("e nao duplica o pacote", u2.pacotes.length, 1);

/* ---- a epoca sobe a cada troca de conjunto, que e o que invalida o cache ---- */
const e1 = AD.epocaAddons();
AD.aplicarAddons([A]);
const e2 = AD.epocaAddons();
AD.aplicarAddons([A, B]);
const e3 = AD.epocaAddons();
t("a epoca sobe sempre", [e2 > e1, e3 > e2], [true, true]);

/* ---- ficha de jogador (sem addons) no meio nao atrapalha ---- */
const semNada = createBlankAfty();
t("ficha sem addon nao entra na uniao", AD.unirAddons([semNada, fA]).pacotes.length, 1);
t("lista vazia", AD.unirAddons([]).pacotes, []);
t("lixo na lista nao derruba", AD.unirAddons([null, undefined, fA]).pacotes.length, 1);

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
