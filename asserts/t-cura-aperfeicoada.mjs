import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const { getCanal, canaisSemGrupo } = await import(R + "afty-efeitos.js");
const { curaNoGasto, preparaRolagemCura, rerrolagemDeCura } = await import(R + "afty-cura.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { rolagensDoFeitico } = await import(R + "afty-feiticos.js");
const vaticano = JSON.parse(readFileSync(new URL("../addons/herdado-vaticano.json", import.meta.url), "utf8"));
let ok = 0;
const t = (nome, real, esperado) => { assert.deepEqual(real, esperado, nome); ok++; };
const MARCA = { ate: 2, fonte: "Cura Aperfeiçoada", melhor: true };
const ficha = (sistema, habilidades = ["sup_cura_aperfeicoada"]) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 8;
  c.especializacoes = [{ id: "suporte", nivel: 8 }];
  c.attributes.sabedoria = 16;
  c.habilidades = habilidades;
  c.aptidoesAmaldicoadas = ["energia_reversa"];
  c.aptidoes.er = 3;
  return c;
};
const viciado = (faces, ...valores) => {
  let usados = 0;
  const rng = () => {
    assert.ok(usados < valores.length, "não deve rerrolar uma segunda vez");
    return (valores[usados++] - 0.5) / faces;
  };
  rng.usados = () => usados;
  return rng;
};
t("canal disponível para autoria", getCanal("rerrolaCura")?.alvo, "fonteCura");
t("canal no grupo de Cura", canaisSemGrupo().includes("rerrolaCura"), false);
for (const sistema of ["afty", "player"]) {
  A.aplicarAddons([]);
  const c = ficha(sistema, ["sup_cura_aperfeicoada", "sup_criar_medicina", "cmb_revigorar", "lut_puxar_um_ar"]);
  const antes = JSON.stringify(c);
  const d = deriveAfty(c);
  t(sistema + ": regra ativa", rerrolagemDeCura(d.efeitos), MARCA);
  t(sistema + ": toda linha de cura recebe regra", d.cura.linhas.every((l) => l.rerrola?.melhor && l.rerrola.ate === 2), true);
  for (const valores of [[2, 1, 2], [1, 6, 6], [2, 2, 2], [1, 1, 1]]) {
    const rng = viciado(6, valores[0], valores[1]);
    const desc = preparaRolagemCura({ tipo: "dano", tom: "cura", dados: 1, faces: 6, fixo: 5 }, d.efeitos);
    const r = rolarDano(desc, rng);
    t(sistema + ": mantém o melhor " + valores.slice(0, 2), r.dados, [valores[2]]);
    t(sistema + ": total inclui fixo uma vez", r.total, valores[2] + 5);
    t(sistema + ": registra ambas as tentativas", r.rerrolados, [{ indice: 0, de: valores[0], para: valores[1], descartado: Math.min(valores[0], valores[1]) }]);
    t(sistema + ": duas tentativas, sem cadeia", rng.usados(), 2);
    t(sistema + ": fonte registrada", r.rerrolaFonte, "Cura Aperfeiçoada");
  }
  const rng = viciado(6, 1, 2, 3, 6, 2, 1);
  const muitos = rolarDano(preparaRolagemCura({ tipo: "dano", tom: "cura", dados: 2, faces: 6, blocos: 2 }, d.efeitos), rng);
  t(sistema + ": todos os dados por PER", muitos.dados, [2, 2, 3, 6]);
  t(sistema + ": só baixos rerrolam", muitos.rerrolados.length, 2);
  t(sistema + ": sem habilidade não há regra", rerrolagemDeCura(deriveAfty(ficha(sistema, [])).efeitos), null);
  const dano = { tipo: "dano", tom: "dano", dados: 1, faces: 6 };
  const invocacao = { ...dano, tom: "cura", curaDoUsuario: false };
  t(sistema + ": dano não recebe regra de cura", preparaRolagemCura(dano, d.efeitos), dano);
  t(sistema + ": cura de invocação não recebe regra do dono", preparaRolagemCura(invocacao, d.efeitos), invocacao);
  const pvt = rolagensDoFeitico({ tipo: "curativo" }, { dados: 2, tipoDado: 6, ehTemporario: true })[0];
  t(sistema + ": PV temporário não recebe rerrolagem de cura", preparaRolagemCura({ tipo: "dano", ...pvt }, d.efeitos).rerrola, undefined);
  const curativo = rolagensDoFeitico({ tipo: "curativo" }, { dados: 2, tipoDado: 6 })[0];
  t(sistema + ": Feitiço de cura recebe regra", preparaRolagemCura({ tipo: "dano", ...curativo }, d.efeitos).rerrola, MARCA);
  const custom = ficha(sistema, []);
  custom.core.tecnicaEfeitos = [
    { canal: "rerrolaCura", expr: "1", nome: "Geral" },
    { canal: "rerrolaCura", alvo: "cura_energia_reversa", expr: "3", nome: "Específica" },
  ];
  const dc = deriveAfty(custom);
  t(sistema + ": fonte específica vence sem somar", rerrolagemDeCura(dc.efeitos, "cura_energia_reversa"), { ate: 3, fonte: "Técnica", melhor: true });
  t(sistema + ": alvo específico não vaza", rerrolagemDeCura(dc.efeitos, "cura_suporte_em_combate"), { ate: 1, fonte: "Técnica", melhor: true });
  const danoAntigo = rolarDano({ ...dano, rerrola: { ate: 2, fonte: "Estilo Massivo" } }, viciado(6, 2, 1));
  t(sistema + ": dano mantém novo mesmo menor", danoAntigo.dados, [1]);
  t(sistema + ": registro antigo de dano preservado", danoAntigo.rerrolados, [{ indice: 0, de: 2, para: 1 }]);
  A.aplicarAddons([vaticano]);
  const vat = ficha(sistema);
  vat.addons = [vaticano];
  vat.core.origem = { id: "herdado", cla: "herdado-vaticano:cla_vaticano" };
  for (const perfeita of [false, true]) {
    vat.talentos = perfeita ? ["herdado-vaticano:tal_cura_perfeita"] : [];
    const dv = deriveAfty(vat);
    const l = dv.cura.linhas.find((l) => l.id === "cura_energia_reversa");
    const gasto = curaNoGasto(l, 2);
    const valores = [1, 2, 3, 4, 6, 1];
    const r = rolarDano(preparaRolagemCura({ tipo: "dano", tom: "cura", dados: l.dados, faces: 6, blocos: gasto.blocos, fixo: gasto.fixo }, dv.efeitos), viciado(6, ...valores));
    t(sistema + ": Vaticano com rerrolagem " + perfeita, r.dados, [6, 2, 3, 4]);
    t(sistema + ": bônus por dado entra uma vez " + perfeita, r.total, 15 + l.fixoBase + 4 * (perfeita ? 2 : 1));
  }
  t(sistema + ": não altera ficha salva", JSON.stringify(c), antes);
}
A.aplicarAddons([]);
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
