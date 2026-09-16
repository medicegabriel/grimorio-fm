/* O QUE O JOGADOR ESCREVE CHEGANDO NA INVOCAÇÃO, 2026-09-15.

   O autor:

     *"a parte de shikigami é muito pouco acessível pelas demais partes do
     site [...] desta forma sua técnica poderia adicionar coisas em
     Shikigames, [...] acerto, TR, Pericia, numero de ações, custo de PE
     atributo limite de atributo e etc."*

   O espaço de canais da invocação já existia. O que não existia era a PORTA:
   até aqui só catálogo chegava num shikigami (Habilidade de Controlador,
   Talento, Característica de Origem, Linha de Treinamento), e nada do que o
   jogador escreve na própria ficha tinha caminho.

   A marca é `escopo: "invocacao"` na própria linha do Motor, e não um campo
   separado por fonte, para valer em qualquer lista de efeitos escrita à mão,
   inclusive a de um Addon futuro.

   ⚠ O BLOCO 3 É O QUE IMPORTA MAIS. Os dois espaços de canal repetem nomes
   (`pv` da criatura contra `pv` do shikigami), então uma linha de invocação que
   vazasse para o coletor da criatura engordaria o personagem calada. Os asserts
   de não vazamento valem mais que os de funcionamento: o vazamento é silencioso
   e o funcionamento quebrado aparece na tela.

   ⚠ Número, e não aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Uma ficha com duas invocações de ids estáveis, para o alvo ter o que mirar. */
const comInvocacoes = () => {
  const c = createBlankAfty();
  c.core.nd = 10;
  const a = INV.createBlankInvocacao("terceiro");
  a.id = "inv-a";
  a.nome = "Kon";
  const b = INV.createBlankInvocacao("terceiro");
  b.id = "inv-b";
  b.nome = "Nue";
  c.invocacoes = [a, b];
  return c;
};
/* A mesma ficha com uma linha de Motor na Técnica. `escopo` fica de fora quando
   é `null`, que é como uma linha de criatura de sempre se escreve. */
const comTecnica = (efeito) => {
  const c = comInvocacoes();
  c.core.tecnicaEfeitos = [efeito];
  return c;
};
const invDe = (d, id) => d.invocacoes.lista.find((i) => i.id === id);
const base = deriveAfty(comInvocacoes());
const baseA = invDe(base, "inv-a");

/* ============================================================ */
/* 1. O CANAL NOVO, E OS QUE O AUTOR LISTOU                      */
/* ============================================================ */
/* "limite de atributo" era o único da lista do autor sem canal. Os outros já
   existiam e só não tinham quem escrevesse neles. */
t("o canal `limiteAtributo` entrou no catálogo",
  INV.EFEITO_CANAIS.includes("limiteAtributo"), true);
t("e os outros pedidos já estavam lá",
  ["pv", "defesa", "acerto", "bonusTR", "bonusPericia", "orcamentoLivre", "orcamentoPago",
    "custoReducao", "atributo"].filter((id) => !INV.EFEITO_CANAIS.includes(id)),
  []);
t("todo canal continua num grupo do seletor",
  INV.INV_EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).length, INV.EFEITO_CANAIS.length);

/* ============================================================ */
/* 2. A TÉCNICA MEXE NO SHIKIGAMI                                */
/* ============================================================ */
const dDefesa = deriveAfty(comTecnica({ canal: "defesa", expr: "5", escopo: "invocacao" }));
t("a Técnica sobe a Defesa da invocação", invDe(dDefesa, "inv-a").defesa - baseA.defesa, 5);
t("as parcelas da Defesa fecham com o número",
  invDe(dDefesa, "inv-a").fontes.defesa.reduce((n, p) => n + (Number(p.valor) || 0), 0),
  invDe(dDefesa, "inv-a").defesa);
t("e a parcela leva o nome da fonte",
  invDe(dDefesa, "inv-a").fontes.defesa.some((p) => p.label === "Técnica"), true);

const dPv = deriveAfty(comTecnica({ canal: "pv", expr: "12", escopo: "invocacao" }));
t("a Técnica sobe o PV da invocação", invDe(dPv, "inv-a").pv - baseA.pv, 12);

const dAcerto = deriveAfty(comTecnica({ canal: "acerto", expr: "2", escopo: "invocacao" }));
t("Acerto chega na Jogada de Ataque da invocação",
  invDe(dAcerto, "inv-a").testes.acerto.corpo.bonus - baseA.testes.acerto.corpo.bonus, 2);

const trDe = (inv, id) => inv.testes.resistencias.find((r) => r.value === id)?.bonus;
const dTR = deriveAfty(comTecnica({ canal: "bonusTR", expr: "3", escopo: "invocacao" }));
t("TR chega na invocação",
  trDe(invDe(dTR, "inv-a"), "reflexos") - trDe(baseA, "reflexos"), 3);

/* ============================================================ */
/* 3. O QUE NÃO PODE VAZAR                                       */
/* ============================================================ */
/* ⚠ ESTE É O BLOCO CRÍTICO. `pv` e `defesa` existem nos DOIS espaços de canal
   com sentidos diferentes, e é por isso que a linha marcada tem de sumir do
   coletor da criatura. */
t("o PV do personagem NÃO se mexe com uma linha de invocação", dPv.pv, base.pv);
t("a Defesa do personagem NÃO se mexe com uma linha de invocação", dDefesa.defesa, base.defesa);

/* E o contrário: sem a marca, a linha continua sendo da criatura como sempre
   foi, e não encosta na invocação. */
const dCriatura = deriveAfty(comTecnica({ canal: "defesa", expr: "5" }));
t("sem `escopo`, a Defesa do personagem sobe", dCriatura.defesa - base.defesa, 5);
t("e a da invocação fica igual", invDe(dCriatura, "inv-a").defesa, baseA.defesa);

/* ============================================================ */
/* 4. MIRAR UMA INVOCAÇÃO SÓ                                     */
/* ============================================================ */
t("sem alvo, as duas invocações recebem",
  [invDe(dDefesa, "inv-a").defesa - baseA.defesa, invDe(dDefesa, "inv-b").defesa - baseA.defesa],
  [5, 5]);
const dMirado = deriveAfty(comTecnica({
  canal: "defesa", expr: "5", escopo: "invocacao", invocacaoAlvo: "inv-b",
}));
t("com `invocacaoAlvo`, só a escolhida recebe",
  [invDe(dMirado, "inv-a").defesa - baseA.defesa, invDe(dMirado, "inv-b").defesa - baseA.defesa],
  [0, 5]);

/* ============================================================ */
/* 5. AS OUTRAS FONTES ESCRITAS PELO JOGADOR                     */
/* ============================================================ */
/* O autor pediu as quatro na mesma resposta: Técnica, Funcionamentos
   adicionais, Feitiço Passivo e buff de mesa. */
const comAdicional = comInvocacoes();
comAdicional.core.funcionamentosAdicionais = [
  { id: "fb2", nome: "Segundo", descricao: "", efeitos: [{ canal: "defesa", expr: "4", escopo: "invocacao" }] },
];
t("um Funcionamento adicional alcança a invocação",
  invDe(deriveAfty(comAdicional), "inv-a").defesa - baseA.defesa, 4);

const comPassiva = comInvocacoes();
comPassiva.feiticos = [{
  id: "f1", nome: "Elo", tipo: "passivo", nivel: 1,
  efeitosPassivo: [{ canal: "defesa", expr: "3", escopo: "invocacao" }],
}];
const dPassiva = deriveAfty(comPassiva);
t("um Feitiço Passivo alcança a invocação", invDe(dPassiva, "inv-a").defesa - baseA.defesa, 3);
t("e o Passivo mirado na invocação não mexe na Defesa do personagem", dPassiva.defesa, base.defesa);

const comBuff = comInvocacoes();
comBuff.buffsSessao = [{ nome: "Bênção", canal: "defesa", expr: "2", escopo: "invocacao" }];
t("um buff de mesa alcança a invocação",
  invDe(deriveAfty(comBuff), "inv-a").defesa - baseA.defesa, 2);

/* ============================================================ */
/* 6. LIMITE DE ATRIBUTO                                         */
/* ============================================================ */
/* O Terceiro Grau para em 20 por atributo. Um bônus que passe disso é aparado,
   e o que sobra vira `perdas`, que é aviso e parcela negativa no hover. O canal
   novo sobe o teto, então o mesmo bônus passa a caber. */
const attrAlto = () => {
  const c = comInvocacoes();
  c.invocacoes[0].atributos.forca = 20;
  return c;
};
const semLimite = attrAlto();
semLimite.core.tecnicaEfeitos = [{ canal: "atributo", alvo: "forca", expr: "4", escopo: "invocacao" }];
t("sem o canal, o bônus de atributo para no máximo do grau",
  invDe(deriveAfty(semLimite), "inv-a").atributos.valores.forca, 20);

const comLimite = attrAlto();
comLimite.core.tecnicaEfeitos = [
  { canal: "atributo", alvo: "forca", expr: "4", escopo: "invocacao" },
  { canal: "limiteAtributo", expr: "4", escopo: "invocacao" },
];
t("com `limiteAtributo`, o teto sobe e o bônus cabe",
  invDe(deriveAfty(comLimite), "inv-a").atributos.valores.forca, 24);

const limiteMirado = attrAlto();
limiteMirado.core.tecnicaEfeitos = [
  { canal: "atributo", alvo: "forca", expr: "4", escopo: "invocacao" },
  { canal: "limiteAtributo", alvo: "destreza", expr: "4", escopo: "invocacao" },
];
t("um limite mirado em outro atributo não solta a Força",
  invDe(deriveAfty(limiteMirado), "inv-a").atributos.valores.forca, 20);

/* ============================================================ */
/* 7. ORÇAMENTO E CUSTO                                          */
/* ============================================================ */
/* "numero de ações" e "custo de PE" da lista do autor. */
const comVagas = comTecnica({ canal: "orcamentoLivre", expr: "2", escopo: "invocacao" });
t("a Técnica dá vagas de Ação que não entram no custo",
  invDe(deriveAfty(comVagas), "inv-a").orcamento.total - baseA.orcamento.total, 2);

const comAbate = comTecnica({ canal: "custoReducao", expr: "2", escopo: "invocacao" });
t("a Técnica abate o custo em PE para invocar",
  baseA.custo - invDe(deriveAfty(comAbate), "inv-a").custo, 2);

/* ============================================================ */
/* 8. A MIRA EM AÇÃO, E ONDE ELA NÃO VALE                        */
/* ============================================================ */
/* A segunda camada da mira, a mesma das Linhas de Treinamento: `acaoAlvo`
   escolhe UMA Ação dentro da invocação. Ela só entrega nos canais que o
   `resolveAcao` vai buscar no balde (`CANAIS_POR_ACAO`): num canal de fora o
   balde nunca é lido e o efeito sumiria calado, que é o mesmo buraco que o
   `soInvocacao` tapa do lado do Treinamento. Por isso o coletor DESCARTA a
   mira nesses canais, e a linha passa a valer para a invocação inteira. */
t("os sete canais que a Ação lê estão declarados",
  [...INV.CANAIS_POR_ACAO].sort(),
  ["acerto", "ataqueDanoAdicional", "cd", "curaBonus", "curaNivel", "danoBonus", "danoNivel"]);

const comAcoes = () => {
  const c = comInvocacoes();
  c.invocacoes[0].acoes = [
    { id: "acao-1", nome: "Garras", classe: "simples", familia: "ataque", ataque: { tipo: "corpo" } },
    { id: "acao-2", nome: "Cuspe", classe: "simples", familia: "ataque", ataque: { tipo: "distancia" } },
  ];
  return c;
};
const acertoDaAcao = (d, acaoId) => invDe(d, "inv-a").acoes.find((a) => a.id === acaoId)?.bonusAtaque;
const baseAcoes = deriveAfty(comAcoes());

const miraNaAcao = comAcoes();
miraNaAcao.core.tecnicaEfeitos = [{
  canal: "acerto", expr: "3", escopo: "invocacao", invocacaoAlvo: "inv-a", acaoAlvo: "acao-1",
}];
const dMiraAcao = deriveAfty(miraNaAcao);
t("a mira em Ação sobe o Acerto só daquela Ação",
  acertoDaAcao(dMiraAcao, "acao-1") - acertoDaAcao(baseAcoes, "acao-1"), 3);
t("e a Ação irmã fica intocada",
  acertoDaAcao(dMiraAcao, "acao-2"), acertoDaAcao(baseAcoes, "acao-2"));

/* ⚠ O ASSERT QUE IMPORTA NESTE BLOCO. `defesa` não é lido por Ação nenhuma,
   então a mira é jogada fora e o efeito vale para a invocação toda, em vez de
   virar um balde que ninguém abre. */
const miraImpossivel = comAcoes();
miraImpossivel.core.tecnicaEfeitos = [{
  canal: "defesa", expr: "5", escopo: "invocacao", invocacaoAlvo: "inv-a", acaoAlvo: "acao-1",
}];
t("mira em Ação num canal que a Ação não lê não some: vale para a invocação",
  invDe(deriveAfty(miraImpossivel), "inv-a").defesa - baseA.defesa, 5);

/* ============================================================ */
/* 9. O `quando` CONTINUA VALENDO                                */
/* ============================================================ */
const desligado = comTecnica({ canal: "defesa", expr: "5", quando: "nunca", escopo: "invocacao" });
t("uma linha com `quando: nunca` não entra",
  invDe(deriveAfty(desligado), "inv-a").defesa, baseA.defesa);

/* Linha inválida é descartada calada, como em todo coletor do Motor: a
   validação é da UI. */
const canalLixo = comTecnica({ canal: "canal_que_nao_existe", expr: "5", escopo: "invocacao" });
t("canal desconhecido não quebra o derive",
  invDe(deriveAfty(canalLixo), "inv-a").defesa, baseA.defesa);
const semExpr = comTecnica({ canal: "defesa", expr: "", escopo: "invocacao" });
t("expressão vazia não quebra o derive",
  invDe(deriveAfty(semExpr), "inv-a").defesa, baseA.defesa);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
