/* REMENDO de entrada do raw: o campo `substitui` do pacote de Addon.

   É a metade da fase 3 que o autor destravou em 2026-08-22, quando mandou um
   Addon que REESCREVE o Domínio Simples e dois Talentos de Origem em vez de
   criar linhas novas. A outra metade (desligar entrada do raw) continua fora.

   O que este arquivo prende é o MECANISMO. O conteúdo daquele Addon está em
   t-estilo-conteudo.mjs. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const TAL = await import(R + "afty-talentos.js");
const APT = await import(R + "afty-aptidoes.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ALVO = "tal_nocao_e_preparacao";
const TEXTO_RAW = TAL.getTalento(ALVO).descricao;
const REQ_RAW = JSON.stringify(TAL.getTalento(ALVO).requisitos);
const QUANTOS_RAW = TAL.AFTY_TALENTOS.length;

const pacote = (extra) => ({ id: "rem", nome: "Remendo", paraRaw: "afty", ...extra });

/* ============================================================ */
/* 1. `remendarLista`, a funcao sozinha                          */
/* ============================================================ */

const BASE = [{ id: "a", nome: "A", n: 1 }, { id: "b", nome: "B", n: 2 }];
t("sem remendo devolve a MESMA lista", AD.remendarLista(BASE, null) === BASE, true);
t("map vazio tambem", AD.remendarLista(BASE, new Map()) === BASE, true);

const um = AD.remendarLista(BASE, new Map([["a", { campos: { n: 9 }, por: [{ id: "p", nome: "P" }] }]]));
t("remenda o campo", um[0].n, 9);
t("mantem os outros campos", um[0].nome, "A");
t("nao encosta em quem nao foi citado", um[1] === BASE[1], true);
t("nao muta a base", BASE[0].n, 1);
t("anota de quem veio", um[0].remendadoPor, [{ id: "p", nome: "P" }]);

/* ⚠ O ID É INTOCÁVEL: ele é a âncora do remendo e a chave do que já está
   gravado nas fichas. Trocá-lo seria apagar a entrada e criar outra. */
const idNovo = AD.remendarLista(BASE, new Map([["a", { campos: { id: "z" }, por: [] }]]));
t("o id resiste ao remendo", idNovo[0].id, "a");

/* ⚠ A SUBSTITUIÇÃO É RASA: uma lista trocada é trocada INTEIRA, e não casada
   item a item. Sem isso ninguém conseguiria APAGAR um item. */
const listas = AD.remendarLista(
  [{ id: "a", reqs: [1, 2, 3] }],
  new Map([["a", { campos: { reqs: [7] }, por: [] }]]),
);
t("lista troca inteira", listas[0].reqs, [7]);

/* ============================================================ */
/* 2. O pacote: normalizar e validar                             */
/* ============================================================ */

t("pacote sem substitui vira objeto vazio", AD.normalizarPacote(pacote({})).substitui, {});
t("substitui lixo vira objeto vazio",
  AD.normalizarPacote(pacote({ substitui: "talentos" })).substitui, {});
t("lista de nao-objeto e filtrada",
  AD.normalizarPacote(pacote({ substitui: { talentos: ["x", 3, null] } })).substitui.talentos, []);

const p = (lista, familia = "talentos") =>
  AD.validarPacote(pacote({ substitui: { [familia]: lista } }));

t("remendo bom passa", p([{ id: ALVO, descricao: "x" }]), []);
t("familia desconhecida e reprovada", p([{ id: "x" }], "bichos").length, 1);
t("sem id e reprovado", p([{ descricao: "x" }]).length, 1);
t("id que o livro nao tem e reprovado", p([{ id: "tal_inventado", descricao: "x" }]).length, 1);
t("e a mensagem nomeia o id",
  p([{ id: "tal_inventado", descricao: "x" }])[0].includes("tal_inventado"), true);
t("id de addon e reprovado", p([{ id: "outro:tal_x", descricao: "x" }]).length, 1);
t("remendo que nao troca nada e reprovado", p([{ id: ALVO }]).length, 1);
t("o mesmo id duas vezes no pacote e reprovado",
  p([{ id: ALVO, descricao: "a" }, { id: ALVO, descricao: "b" }]).length, 1);
t("esvaziar campo obrigatorio e reprovado", p([{ id: ALVO, nome: "" }]).length, 1);
t("trocar campo obrigatorio por valor bom passa", p([{ id: ALVO, nome: "Outro" }]), []);

/* ⚠ Família cujo catálogo NÃO é feito de entradas com campos recusa remendo em
   vez de aceitar calada e não fazer nada. Tipo de Dano é um mapa. */
const tiposDano = p([{ value: "ct", label: "X" }], "tiposDano");
t("familia nao remendavel e reprovada", tiposDano.length, 1);
t("e a mensagem diz por que", tiposDano[0].includes("aceita remendo"), true);
t("Tipo de Dano continua intacto", EQ.TIPOS_DANO.ct, "Cortante");

/* Um pacote que SÓ remenda é legítimo: não acrescenta, não libera, não permite. */
t("pacote so-remendo passa", p([{ id: ALVO, descricao: "x" }]), []);
t("pacote que nao faz nada continua reprovado", AD.validarPacote(pacote({})).length, 1);

/* ============================================================ */
/* 3. Aplicar e desaplicar                                       */
/* ============================================================ */

const r = AD.aplicarAddons([pacote({
  substitui: { talentos: [{ id: ALVO, descricao: "TEXTO NOVO", requisitos: [] }] },
})]);
t("aplicou sem problema", r.problemas, []);
t("o texto trocou", TAL.getTalento(ALVO).descricao, "TEXTO NOVO");
t("os requisitos trocaram", TAL.getTalento(ALVO).requisitos, []);
t("o grupo (campo nao citado) ficou", TAL.getTalento(ALVO).grupo, "origem");
t("o remendo NAO cria entrada nova", TAL.AFTY_TALENTOS.length, QUANTOS_RAW);
t("a entrada sabe quem a remendou", TAL.getTalento(ALVO).remendadoPor, [{ id: "rem", nome: "Remendo" }]);

AD.limparAddons();
t("desinstalar devolve o texto do livro", TAL.getTalento(ALVO).descricao, TEXTO_RAW);
t("e os requisitos", JSON.stringify(TAL.getTalento(ALVO).requisitos), REQ_RAW);
t("e some a marca", TAL.getTalento(ALVO).remendadoPor, undefined);
t("e o tamanho da lista nao mudou", TAL.AFTY_TALENTOS.length, QUANTOS_RAW);

/* ⚠ SEMPRE DO ZERO: aplicar A e depois B tem de dar o mesmo que aplicar os dois
   de uma vez. Um remendo que sobrevivesse à troca de addons seria resto. */
AD.aplicarAddons([pacote({ substitui: { talentos: [{ id: ALVO, descricao: "A" }] } })]);
AD.aplicarAddons([{
  id: "outro", nome: "O", paraRaw: "afty",
  substitui: { talentos: [{ id: ALVO, nome: "Nome Novo" }] },
}]);
t("o remendo do addon que saiu nao ficou", TAL.getTalento(ALVO).descricao, TEXTO_RAW);
t("e o do que entrou vale", TAL.getTalento(ALVO).nome, "Nome Novo");
AD.limparAddons();

/* Dois pacotes na mesma entrada: o ULTIMO vence, e os dois ficam anotados. */
AD.aplicarAddons([
  pacote({ substitui: { talentos: [{ id: ALVO, descricao: "PRIMEIRO", nome: "Do Primeiro" }] } }),
  {
    id: "seg", nome: "Segundo", paraRaw: "afty",
    substitui: { talentos: [{ id: ALVO, descricao: "SEGUNDO" }] },
  },
]);
t("o ultimo vence no campo disputado", TAL.getTalento(ALVO).descricao, "SEGUNDO");
t("o campo que so o primeiro tocou fica", TAL.getTalento(ALVO).nome, "Do Primeiro");
t("os dois ficam anotados", TAL.getTalento(ALVO).remendadoPor.map((x) => x.id), ["rem", "seg"]);
AD.limparAddons();

/* ============================================================ */
/* 4. Remendo e acrescimo na mesma familia                       */
/* ============================================================ */

AD.aplicarAddons([pacote({
  acrescenta: { talentos: [{ id: "novo", nome: "Novo", descricao: "d", grupo: "geral" }] },
  substitui: { talentos: [{ id: ALVO, descricao: "REMENDADO" }] },
})]);
t("o acrescimo entrou prefixado", TAL.getTalento("rem:novo")?.nome, "Novo");
t("o remendo tambem valeu", TAL.getTalento(ALVO).descricao, "REMENDADO");
t("a lista cresceu UMA", TAL.AFTY_TALENTOS.length, QUANTOS_RAW + 1);
AD.limparAddons();

/* Outra familia, para provar que o caminho nao e um caso especial do Talento. */
const TEXTO_APT = APT.getAptidao("dominio_simples").descricao;
AD.aplicarAddons([pacote({ substitui: { aptidoes: [{ id: "dominio_simples", descricao: "APT" }] } })]);
t("Aptidao tambem remenda", APT.getAptidao("dominio_simples").descricao, "APT");
AD.limparAddons();
t("e volta", APT.getAptidao("dominio_simples").descricao, TEXTO_APT);

/* ============================================================ */
/* 5. Validacao do raw roda EM CIMA do remendo                   */
/* ============================================================ */
/* O portao de aceitacao do raw ja existia e le o mesmo array, entao ele pega o
   remendo de graca. Aqui: um remendo que quebra a entrada e RELATADO. */
const quebrado = AD.aplicarAddons([pacote({
  substitui: { aptidoes: [{ id: "dominio_simples", categoria: "categoria_que_nao_existe" }] },
})]);
t("o validador do raw reprova o remendo quebrado", quebrado.problemas.length > 0, true);
AD.limparAddons();

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
