/* Gera os arquivos de pacote das variantes do PA-I4, do resultado do resolvedor e do exportador REAIS (Múltiplos Efeitos Imediato de Reação com Defesa
   por um golpe e TR de uma rodada), com a duração comum na opção e o prazo escrito só onde ele é uma exceção. Grava `variantes.json` aqui, ANTES de
   qualquer servidor ser exercitado (gravar arquivo no projeto durante um roteiro no dev recarrega a página).
   Uso: node .audit/pacotes-aliados-pai4-20261020/gerar-variantes.mjs */
import fs from "node:fs";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const PA = await import(R + "ficha/pacotes-aliados.js");
const FAM = await import(R + "ficha/pacotes-familias.js");
const { fichas } = JSON.parse(fs.readFileSync(new URL("./fichas.json", import.meta.url), "utf8"));
const sup = structuredClone(fichas.suporteA);
sup.feiticos = [{ id: "pai4-misto", nome: "Guarda e Firmeza", tipo: "auxiliar", nivel: 1, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "reacao", efeitosMult: [{ id: "m3", efeito: "defesa" }, { id: "m4", efeito: "tr" }] }];
const { porChave } = FAM.fontesParaAliados(sup, deriveAfty(sup), { emissorId: "emi-pai4" });
const resolvido = FAM.resolverItem({ fonte: "feitico|pai4-misto", escolhas: {} }, porChave);
const UM_ATQ = { tipo: "proximo", texto: "Por Um Ataque" };
const arquivoDe = (id, ajusta) => {
  const opcao = JSON.parse(JSON.stringify(FAM.paraArquivo("o1", resolvido)));
  ajusta(opcao, (c) => opcao.beneficios.find((b) => b.canal === c));
  return PA.montarArquivo({ pacote: { ...PA.novoPacoteDoEmissor(`Pacote ${id}`), id: `pac-${id}` }, emissorId: "emi-pai4", emissor: { nome: sup.name, sistema: "player" }, opcoes: [opcao], agora: "2026-10-20T12:00:00Z" }).arquivo;
};
const saida = {
  /* o caso do Codex: o prazo comum de uma rodada na opção, a Defesa com a exceção de um ataque, o TR herdando */
  A: arquivoDe("herdado-a", (o, ben) => { o.duracao = { tipo: "rodadas", rodadas: 1 }; ben("defesa").duracao = UM_ATQ; delete ben("bonusTR").duracao; }),
  /* a Defesa com 1 rodada própria, o TR herdando as 2 da opção */
  D: arquivoDe("herdado-d", (o, ben) => { o.duracao = { tipo: "rodadas", rodadas: 2 }; ben("defesa").duracao = { tipo: "rodadas", rodadas: 1 }; delete ben("bonusTR").duracao; }),
};
fs.writeFileSync(new URL("./variantes.json", import.meta.url), JSON.stringify(saida, null, 2));
console.log(Object.entries(saida).map(([k, a]) => `${k}: opção ${JSON.stringify(a.opcoes[0].duracao)}, benefícios ${JSON.stringify(a.opcoes[0].beneficios.map((b) => [b.canal, b.duracao ?? "herda"]))}`).join("\n"));
