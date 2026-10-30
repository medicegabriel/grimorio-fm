/* PA-I3 em função, com a API que existe ANTES e DEPOIS da correção, para rodar nas duas árvores: o resolvedor real, o arquivo, a leitura, a instância,
   a virada (`proximaRodada`) e o derive com a tradução compartilhada. O caso é o do Codex: Múltiplos Efeitos Imediato de Reação, Defesa (por um golpe)
   e TR (uma rodada), e um receptor sem outra fonte.
   Uso: node prova-pai3.mjs <raiz da árvore com src/> <arquivo de saída> */
import fs from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const [raiz, saida] = process.argv.slice(2);
const R = pathToFileURL(`${raiz}/src/systems/afty/`).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const PA = await import(R + "ficha/pacotes-aliados.js");
const FAM = await import(R + "ficha/pacotes-familias.js");
const { calcularRecebidos } = await import(R + "ficha/ficha-recebidos.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");

const sup = createBlankAfty();
sup.id = "sup"; sup.name = "Yuki"; sup.rulesVersion = "player";
sup.core = { ...sup.core, nd: 14, patamar: "comum", origem: { id: "inato" } };
sup.especializacoes = [{ id: "suporte", nivel: 10 }];
sup.feiticos = [{ id: "g4", nome: "Guarda e Firmeza", tipo: "auxiliar", nivel: 1, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "reacao", efeitosMult: [{ id: "m3", efeito: "defesa" }, { id: "m4", efeito: "tr" }] }];
const { porChave } = FAM.fontesParaAliados(sup, deriveAfty(sup), { emissorId: "emi" });
const r = FAM.resolverItem({ fonte: "feitico|g4", escolhas: {} }, porChave);
const { arquivo } = PA.montarArquivo({ pacote: { ...PA.novoPacoteDoEmissor("Prova"), id: "pac" }, emissorId: "emi", emissor: { nome: "Yuki", sistema: "player" }, opcoes: [FAM.paraArquivo("o1", r)], agora: "2026-10-20T12:00:00Z" });
const lido = PA.lerArquivoDePacote(JSON.stringify(arquivo), { conhecidos: FAM.conhecidosDaFicha() });
const bib = PA.gravarNaBiblioteca([], lido.pacote, lido.recusadas, "2026-10-20T12:00:00Z").biblioteca;
const inst = PA.instanciaDaOpcao(bib[0], bib[0].opcoes[0], { id: "i1" });

const kai = createBlankAfty();
kai.id = "kai"; kai.name = "Kai"; kai.rulesVersion = "player";
kai.core = { ...kai.core, nd: 10, patamar: "comum", origem: { id: "inato" } };
kai.attributes = { ...kai.attributes, forca: 16, destreza: 14, constituicao: 14 };
kai.especializacoes = [{ id: "combatente", nivel: 10 }];
const d0 = deriveAfty({ ...kai, combate: { ativo: true } });
const base = { ...S.sessaoEmBranco(d0), combate: { ativo: true }, rodada: 1 };
const der = (s) => calcularRecebidos(kai, s, (f, x) => deriveAfty({ ...f, combate: x.combate, buffsSessao: x.buffs }, opcoesDeriveDaSessao(x))).derived;
const nums = (s) => { const d = der(s); return { defesa: d.defesa, reflexos: d.testes.resistencias.find((x) => x.value === "reflexos").bonus }; };

const out = { raiz, arquivoOpcao: arquivo.opcoes[0], instancia: inst, passos: [] };
let s = { ...base, buffs: [inst] };
out.base = nums(base);
out.passos.push({ momento: "ligada", ...nums(s), beneficios: s.buffs.map((b) => b.beneficios.map((x) => x.canal)) });
for (let i = 1; i <= 3; i++) {
  s = S.proximaRodada(s, d0).sessao;
  out.passos.push({ momento: `virada ${i}`, ...nums(s), beneficios: s.buffs.map((b) => b.beneficios.map((x) => x.canal)) });
}
const v1 = out.passos[1];
out.criterios = {
  "ligada: Defesa +3 e Reflexos +2": out.passos[0].defesa === out.base.defesa + 3 && out.passos[0].reflexos === out.base.reflexos + 2,
  "virada 1: Reflexos volta à base": v1.reflexos === out.base.reflexos,
  "virada 1: a Defesa de um ataque continua": v1.defesa === out.base.defesa + 3,
  "virada 3: a Defesa continua sem ataque": out.passos[3].defesa === out.base.defesa + 3,
};
fs.writeFileSync(saida, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ base: out.base, passos: out.passos.map((p) => `${p.momento}: Defesa ${p.defesa}, Reflexos ${p.reflexos}`), criterios: out.criterios }, null, 2));
