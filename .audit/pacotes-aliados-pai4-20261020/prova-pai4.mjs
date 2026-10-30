/* PA-I4 em função, com a API que existe ANTES e DEPOIS da correção, para rodar nas duas árvores: o resolvedor real, o exportador, a leitura, a
   biblioteca, a instância, a virada (`proximaRodada`) e o derive com a tradução compartilhada. Cada variante é um arquivo VÁLIDO feito do resultado do
   resolvedor real (Múltiplos Efeitos Imediato de Reação, Defesa por um golpe e TR de uma rodada) com a duração comum na opção e o prazo escrito só onde
   ele é uma exceção.
   Uso: node prova-pai4.mjs <raiz da árvore com src/> <arquivo de saída> */
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
const resolvido = FAM.resolverItem({ fonte: "feitico|g4", escolhas: {} }, porChave);
const kai = createBlankAfty();
kai.id = "kai"; kai.name = "Kai"; kai.rulesVersion = "player";
kai.core = { ...kai.core, nd: 10, patamar: "comum", origem: { id: "inato" } };
kai.attributes = { ...kai.attributes, forca: 16, destreza: 14, constituicao: 14 };
kai.especializacoes = [{ id: "combatente", nivel: 10 }];
const d0 = deriveAfty({ ...kai, combate: { ativo: true } });
const base = { ...S.sessaoEmBranco(d0), combate: { ativo: true }, rodada: 1 };
const der = (s) => calcularRecebidos(kai, s, (f, x) => deriveAfty({ ...f, combate: x.combate, buffsSessao: x.buffs }, opcoesDeriveDaSessao(x))).derived;
const nums = (s) => { const d = der(s); return { defesa: d.defesa, reflexos: d.testes.resistencias.find((x) => x.value === "reflexos").bonus }; };
const b0 = nums(base);

const UM_ATQ = { tipo: "proximo", texto: "Por Um Ataque" };
function arquivoDe(id, ajusta) {
  const opcao = JSON.parse(JSON.stringify(FAM.paraArquivo("o1", resolvido)));
  const ben = (c) => opcao.beneficios.find((b) => b.canal === c);
  ajusta(opcao, ben);
  return PA.montarArquivo({ pacote: { ...PA.novoPacoteDoEmissor("Prova"), id }, emissorId: "emi", emissor: { nome: "Yuki", sistema: "player" }, opcoes: [opcao], agora: "2026-10-20T12:00:00Z" }).arquivo;
}
const variantes = {
  "A proprio/herdado (o caso do Codex)": arquivoDe("a", (o, ben) => { o.duracao = { tipo: "rodadas", rodadas: 1 }; ben("defesa").duracao = UM_ATQ; delete ben("bonusTR").duracao; }),
  "B herdado/proprio": arquivoDe("b", (o, ben) => { o.duracao = UM_ATQ; delete ben("defesa").duracao; ben("bonusTR").duracao = { tipo: "rodadas", rodadas: 1 }; }),
  "C explicito/explicito (o que o exportador escreve)": arquivoDe("c", () => {}),
  "D rodadas diferentes (Defesa 1 propria, TR herda 2)": arquivoDe("d", (o, ben) => { o.duracao = { tipo: "rodadas", rodadas: 2 }; ben("defesa").duracao = { tipo: "rodadas", rodadas: 1 }; delete ben("bonusTR").duracao; }),
};
const out = { raiz, base: b0, variantes: {} };
for (const [nome, arquivo] of Object.entries(variantes)) {
  const lido = PA.lerArquivoDePacote(JSON.stringify(arquivo), { conhecidos: FAM.conhecidosDaFicha() });
  if (!lido.pacote) { out.variantes[nome] = { recusado: lido }; continue; }
  const bib = PA.gravarNaBiblioteca([], lido.pacote, lido.recusadas, "2026-10-20T12:00:00Z").biblioteca;
  const inst = PA.instanciaDaOpcao(bib[0], bib[0].opcoes[0], { id: "i1" });
  let s = { ...base, buffs: [inst] };
  const passos = [{ momento: "ligada", ...nums(s), beneficios: s.buffs.map((b) => b.beneficios.map((x) => `${x.canal}:${x.rodadas ?? "-"}`)) }];
  for (let i = 1; i <= 3; i++) { s = S.proximaRodada(s, d0).sessao; passos.push({ momento: `virada ${i}`, ...nums(s), beneficios: s.buffs.map((b) => b.beneficios.map((x) => `${x.canal}:${x.rodadas ?? "-"}`)) }); }
  out.variantes[nome] = { passos: passos.map((p) => `${p.momento}: Defesa ${p.defesa}, Reflexos ${p.reflexos}, instância ${JSON.stringify(p.beneficios)}`) };
}
/* O resultado esperado, pela decisão do autor: o TR de uma rodada sai na primeira virada, e a Defesa de um ataque fica (variantes A, B e C). */
const v1 = (n) => out.variantes[n]?.passos?.[1] ?? "";
const reflexosBase = b0.reflexos;
out.criterios = Object.fromEntries(["A proprio/herdado (o caso do Codex)", "B herdado/proprio", "C explicito/explicito (o que o exportador escreve)"].map((n) => [n, v1(n).includes(`Reflexos ${reflexosBase},`)]));
fs.writeFileSync(saida, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ base: out.base, variantes: out.variantes, criterios: out.criterios }, null, 2));
