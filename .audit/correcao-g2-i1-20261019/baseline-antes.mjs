/* Evidência ANTES da correção do G2-I1 (código de 2026-10-19 sem alteração).
   Mesma ficha e mesma sessão: o derive da clássica (deriveAfty direto, como em AftyFichaClassica.jsx) contra o do G2 (prepararCalculo). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");
const B = await import(R + "ficha/ficha-buffs.js");

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 30, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }];
const d0 = deriveAfty({ ...ficha, combate: { ativo: true } });
const reg = { id: "r1", rec: true, tipoFonte: "feitico", origemId: null, origemNome: "Proteção de teste independente", aplicadoPor: null, beneficios: [{ canal: "defesa", valor: 7 }], rodadas: null };
const sessao = { ...S.sessaoEmBranco(d0), combate: { ativo: true }, buffs: [reg] };

const classica = deriveAfty({ ...ficha, combate: sessao.combate, buffsSessao: sessao.buffs }, opcoesDeriveDaSessao(sessao));
const g2 = prepararCalculo(ficha, sessao).derived;
const semRegistro = deriveAfty({ ...ficha, combate: sessao.combate, buffsSessao: [] }, opcoesDeriveDaSessao(sessao));
console.log(JSON.stringify({ defesaSemRegistro: semRegistro.defesa, defesaClassicaAntes: classica.defesa, defesaG2: g2.defesa }));
