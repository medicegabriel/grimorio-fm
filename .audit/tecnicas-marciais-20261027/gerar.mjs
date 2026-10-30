/* TÉCNICAS MARCIAIS NO G2 (2026-10-27): as fichas SINTÉTICAS da conferência no navegador. Nascem de `createBlankAfty()` aqui mesmo.
   Uso (na raiz do grimorio-tracker): node .audit/tecnicas-marciais-20261027/gerar.mjs */
import fs from "node:fs";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const F = await import(R + "afty-feiticos.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { getEquipamento, novaEntradaEquip } = await import(R + "afty-equipamentos.js");

const item = (tipo, refId, extra = {}) => ({ ...novaEntradaEquip(tipo, refId, getEquipamento(tipo, refId)), ...extra });
const ATTR = (o) => ({ forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10, ...o });
const nova = (id, nome, extra = {}) => {
  const f = createBlankAfty();
  return { ...f, id, name: nome, ...extra };
};
const tecnicas = () => [
  { ...F.createBlankTecnicaMarcial("ataque"), id: "tm-golpe", nome: "Golpe Partido", nivel: 3, acaoAtaque: "comum", ataquesReduzidos: 1, efeitosAtaque: ["acerto", "dano", "rd"] },
  {
    ...F.createBlankTecnicaMarcial("ataque"), id: "tm-quebra", nome: "Quebra de Postura", nivel: 3, acaoAtaque: "completa", ataquesReduzidos: 0,
    efeitosAtaque: ["condicao"], condicoesAtaque: { fraca: "Abalado", media: "Lento", forte: "Imóvel", extrema: "" }, trCondicaoAtaque: "fortitude",
  },
  { ...F.createBlankTecnicaMarcial("auxiliar"), id: "tm-aux", nome: "Passo Firme", nivel: 1 },
];
const fichas = {
  jogador: nova("tm-jogador", "Restringido (Teste TM)", {
    rulesVersion: "player",
    core: { ...createBlankAfty().core, nd: 9, tipo: "restringido", origem: { id: "restringido" } },
    attributes: ATTR({ forca: 16, destreza: 14, constituicao: 14 }),
    especializacoes: [{ id: "restringido", nivel: 9 }],
    feiticos: tecnicas(),
    equipamentos: { itens: [item("arma", "arm_katana", { uid: "tm-katana", equipado: true })] },
  }),
  criatura: nova("tm-criatura", "Restringido Criatura (Teste TM)", {
    core: { ...createBlankAfty().core, nd: 12, tipo: "restringido", origem: { id: "restringido" } },
    attributes: ATTR({ forca: 16, destreza: 14, constituicao: 14 }),
    feiticos: tecnicas(),
    equipamentos: { itens: [item("arma", "arm_katana", { uid: "tm-katana-c", equipado: true })] },
  }),
};
const sessoes = {};
for (const [k, f] of Object.entries(fichas)) {
  aplicarAddons(f.addons ?? []);
  const d = deriveAfty(f);
  let s = S.sessaoEmBranco(d);
  s = S.aplicaPatchCombate(s, { ativo: true });
  s = { ...s, peAtual: Math.max(s.peAtual, 60) };
  sessoes[f.id] = s;
  console.log(k, "marciais:", d.tecnicasMarciais?.ids, "ataques:", Object.keys(d.tecnicasMarciais?.ataques ?? {}));
}
fs.mkdirSync(new URL("./fichas/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./fichas/fichas.json", import.meta.url), JSON.stringify({ geradoEm: new Date().toISOString(), origem: "sintéticas, criadas do zero por gerar.mjs", fichas, sessoes }, null, 1));
