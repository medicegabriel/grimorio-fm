/* PACOTES PARA ALIADOS: as fichas SINTÉTICAS de teste (2026-10-19). Nenhuma é ficha do autor: todas levam "(Teste Pacotes)" no nome e ids próprios,
   e só entram em contextos isolados do navegador. Uso: node .audit/pacotes-aliados-20261019/gerar-fichas.mjs  (escreve fichas.json ao lado). */
import fs from "node:fs";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const EST = await import(R + "afty-estilo-sombras.js");

const carac = (subtipo, extra = {}) => ({ ...INV.createBlankCaracteristica(), subtipo, nome: extra.nome ?? subtipo, ...extra });
export function suporteA() {
  const f = createBlankAfty();
  f.id = "teste-pacotes-yuki"; f.name = "Yuki (Teste Pacotes)"; f.rulesVersion = "player"; f.system = "afty";
  f.core = { ...f.core, nd: 14, patamar: "comum", origem: { id: "inato" } };
  f.attributes = { ...f.attributes, presenca: 18, sabedoria: 14, destreza: 12 };
  f.especializacoes = [{ id: "suporte", nivel: 10 }, { id: "controlador", nivel: 4 }];
  f.aptidoes = { ...f.aptidoes, au: 3 };
  f.aptidoesAmaldicoadas = ["aura_do_bastiao", "aura_do_comandante", "aura_do_comandante_evoluida"];
  f.habilidades = ["sup_presenca_inspiradora", "sup_pronto_para_agir", "sup_apoio_avancado", "sup_inimigo_comum", "sup_taticas_defensivas", "sup_comando_motivador"];
  f.escolhasHabilidade = { sup_apoio_avancado: ["sup_apoio_defensivo"], sup_taticas_defensivas: ["sup_taticas_acido"] };
  f.feiticos = [
    { id: "tp-f1", nome: "Escudo Dourado", tipo: "auxiliar", nivel: 2, efeitoAux: "defesa", duracaoAux: "duradoura", rodadasDur: 2 },
    { id: "tp-f2", nome: "Bênção Tripla", tipo: "auxiliar", nivel: 3, multiplosAtivo: true, duracaoMult: "imediata", efeitosMult: [{ id: "e1", efeito: "defesa", nivel: 1 }, { id: "e2", efeito: "rd", nivel: 1 }, { id: "e3", efeito: "tr", nivel: 0 }] },
    { id: "tp-f3", nome: "Foco Sustentado", tipo: "auxiliar", nivel: 2, efeitoAux: "rolagem", duracaoAux: "sustentada" },
    { id: "tp-f4", nome: "Só Meu", tipo: "auxiliar", nivel: 1, efeitoAux: "defesa", duracaoAux: "imediata", alcancePropria: true },
    { id: "tp-f5", nome: "Lâmina Viva", tipo: "auxiliar", nivel: 1, efeitoAux: "danoDurante", duracaoAux: "imediata" },
  ];
  f.invocacoes = [{
    ...INV.createBlankInvocacao("primeiro"), id: "tp-inv1", nome: "Nue",
    acoes: [
      { id: "tp-a1", nome: "Escudo de Raios", familia: "auxilio", auxilioSub: "defesa", alvoAuxilio: "aliados", classe: "simples", custoPE: 0 },
      { id: "tp-a2", nome: "Guarda Própria", familia: "auxilio", auxilioSub: "defesa", alvoAuxilio: "invocacao", classe: "simples", custoPE: 0 },
    ],
    caracteristicas: [carac("auraDefesa", { id: "tp-c1", nome: "Halo" }), carac("auraDano", { id: "tp-c2", nome: "Faíscas" }), carac("auraPericia", { id: "tp-c3", nome: "Clareza", parametros: { pericia: "percepcao" } })],
  }];
  return f;
}
let seq = 0;
const compra = (efeitoId, escolha = null, repeticao = null) => ({ uid: `tp-u${++seq}`, efeitoId, ...(escolha ? { escolha } : {}), ...(repeticao ? { repeticao } : {}) });
export function suporteB() {
  const b = createBlankAfty();
  b.id = "teste-pacotes-rin"; b.name = "Rin (Teste Pacotes)"; b.rulesVersion = "player"; b.system = "afty";
  b.core = { ...b.core, nd: 12, patamar: "comum", origem: { id: "sem_tecnica" } };
  b.attributes = { ...b.attributes, sabedoria: 16, destreza: 16 };
  b.especializacoes = [{ id: "suporte", nivel: 12 }];
  b.aptidoes = { ...b.aptidoes, dom: 4 };
  b.estilosSombra = [{ ...EST.createBlankTecnicaEstilo(), id: "tp-tec1", nome: "Véu da Sombra Comum",
    efeitos: [compra("defesa"), compra("defesa", null, "aliados"), compra("tr", { tr: "vontade" }), compra("tr", { tr: "vontade" }, "aliados")] }];
  return b;
}
export function receptor() {
  const g = createBlankAfty();
  g.id = "teste-pacotes-kai"; g.name = "Kai (Teste Pacotes)"; g.rulesVersion = "player"; g.system = "afty";
  g.core = { ...g.core, nd: 10, patamar: "comum", origem: { id: "inato" } };
  g.attributes = { ...g.attributes, forca: 16, destreza: 14, constituicao: 14 };
  g.especializacoes = [{ id: "combatente", nivel: 10 }];
  g.habilidades = ["cmb_assumir_postura", "cmb_ataque_concentrado"];
  return g;
}
if (String(process.argv[1] ?? "").endsWith("gerar-fichas.mjs")) {
  const out = { geradoEm: new Date().toISOString(), fichas: { suporteA: suporteA(), suporteB: suporteB(), receptor: receptor() } };
  fs.writeFileSync(new URL("./fichas.json", import.meta.url), JSON.stringify(out, null, 2));
  console.log("ok", Object.keys(out.fichas).join(" "));
}
