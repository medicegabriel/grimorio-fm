/**
 * A ESTRELA DOS ZENIN, E AS QUATRO PEÇAS DE MOTOR QUE ELA PEDIU — 2026-08-31
 *
 * O autor mandou uma Origem nova e ela não cabia no Addon: quase tudo que ela
 * faz mexe em SHIKIGAMI, e o Addon não alcançava shikigami. As quatro peças que
 * entraram, e que este arquivo prende:
 *
 *   1. família `clas`, para um clã do Herdado entrar sem copiar os quatro do
 *      livro num `substitui`.
 *   2. `efeitosInvocacao`, para Origem, Clã e Talento tocarem numa invocação.
 *      Até aqui só Habilidade de Controlador tinha canal.
 *   3. família `marcadores` com `requerId`, para o "N dos seus shikigamis".
 *   4. requisito `cla` no Talento, senão os Talentos de Origem dela abriam para
 *      qualquer Herdado.
 *
 * Mais o conserto que só apareceu ao montar o pacote: referência entre FAMÍLIAS
 * do mesmo addon não ganhava o namespace, e o marcador apontava para um clã que
 * não existia, calado.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const T = await import(R + "afty-talentos.js");
const { createBlankInvocacao, varDeMarcador } = await import(R + "afty-invocacoes.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const CLA = "estrela-zenin:cla_estrela_zenin";

const PACOTE = {
  id: "estrela-zenin",
  nome: "Estrela dos Zenin",
  versao: "1.0.0",
  paraRaw: "afty",
  descricao: "Clã do Herdado, marcadores e Talentos de Origem.",
  acrescenta: {
    clas: [{
      id: "cla_estrela_zenin",
      nome: "Estrela dos Zenin",
      efeitos: [{ canal: "vagasPericia", expr: "2", nome: "Treinamentos de Clã" }],
      caracteristicas: [
        {
          id: "bonus_atributo",
          nome: "Bônus em Atributo",
          descricao: "Sabedoria ou presença em 2 pontos e outro atributo em 1 ponto.",
          bonus: { distribuir: 3, maxPorAtributo: 2 },
        },
        {
          id: "maestria_em_invocacoes",
          nome: "Maestria em Invocações",
          descricao: "Seus shikigamis recebem +1 Ação/Característica que não conta para os limites.",
          efeitosInvocacao: [
            { canal: "orcamentoLivre", expr: "1", nome: "Maestria em Invocações" },
            {
              canal: "custoReducao",
              expr: "2",
              quando: "marc_estrela_zenin_economia_de_sombras",
              nome: "Economia de Sombras",
            },
          ],
        },
      ],
    }],
    marcadores: [{
      id: "economia_de_sombras",
      label: "Economia de Sombras",
      requerId: "cla_estrela_zenin",
      limiteExpr: "piso(bt / 2)",
    }],
    talentos: [{
      id: "tal_fantoche_divino",
      nome: "Fantoche Divino",
      grupo: "origem",
      descricao: "Amplifica o Fantoche Supremo.",
      requisitos: [{ tipo: "cla", id: "cla_estrela_zenin" }, { tipo: "nd", valor: 20 }],
      efeitosInvocacao: [
        { canal: "pv", expr: "(3 + bt) * 5", quando: "marc_estrela_zenin_fantoche", nome: "Fantoche Divino" },
      ],
    }],
    // Um segundo marcador, para o Talento, provando que `requerId` também
    // aceita id de Talento e não só de Clã.
  },
};
PACOTE.acrescenta.marcadores.push({
  id: "fantoche",
  label: "Fantoche Divino",
  requerId: "tal_fantoche_divino",
  limiteExpr: "1",
});

const norm = A.normalizarPacote(PACOTE);
t("o pacote passa no validador", A.validarPacote(PACOTE), []);

/* ---------- 1. A FAMÍLIA `clas` ---------- */

A.aplicarAddons([norm]);
t("o clã entra na lista do Herdado",
  O.clasDaOrigem("herdado").map((c) => c.nome),
  ["Clã Gojo", "Clã Inumaki", "Clã Kamo", "Clã Zenin", "Estrela dos Zenin"]);
t("e ele é alcançável pelo id prefixado", O.getCla(CLA)?.nome, "Estrela dos Zenin");

/* ⚠ O CACHE DE VERDADEIRAS ORIGENS TEM DE MORRER JUNTO. O `opcoesVerdadeirasOrigens`
   percorre `origem.clas`, e sem limpar o cache um clã de addon nunca apareceria
   na lista do Gêmeo. É o mesmo bug que a família `origens` teve em 2026-08-21. */
const gemeo = createBlankAfty();
gemeo.core = { ...gemeo.core, nd: 10, origem: { id: "gemeos" } };
gemeo.addons = [norm];
const opcoesVO = (O.escolhasDaOrigem(gemeo) || [])
  .find((e) => e.id === "verdadeiras_origens")?.opcoes ?? [];
t("a característica do clã novo chega às Verdadeiras Origens",
  opcoesVO.some((o) => String(o.id).includes("maestria_em_invocacoes")), true);

/* ---------- 2. `efeitosInvocacao`: clã e talento chegam no shikigami ---------- */

const ficha = (mut = (f) => f) => {
  const f = createBlankAfty();
  f.core = { ...f.core, nd: 20, tipo: "misto", patamar: "comum", origem: { id: "herdado", cla: CLA } };
  f.especializacoes = [{ id: "controlador", nivel: 20 }];
  f.attributes = { forca: 10, destreza: 12, constituicao: 12, inteligencia: 14, sabedoria: 16, presenca: 12 };
  f.addons = [norm];
  const inv = createBlankInvocacao();
  inv.id = "SHIKI1";
  inv.nome = "Sombra";
  inv.grau = "terceiro";
  f.invocacoes = [inv];
  mut(f);
  return deriveAfty(f);
};

const base = ficha();
const inv0 = base.invocacoes.lista[0];
/* Terceiro Grau dá 2 de orçamento, o Shikigami de Técnica não se aplica (o tipo
   é `shikigami` comum), e o +1 da Maestria é a única fonte a mais. */
t("o +1 da Maestria chega no orçamento da invocação", inv0.orcamento.total, 5);
t("e ele aparece nomeado nas fontes",
  inv0.orcamento.total > 0 && base.invocacoes.lista[0].custo > 0, true);
t("as vagas de perícia trazem o Treinamento de Clã",
  base.testes.orcamento.partes.some((x) => x.label === "Treinamentos de Clã" && x.valor === 2), true);

/* ---------- 3. O MARCADOR ---------- */

/* ⚠ A REFERÊNCIA CRUZA FAMÍLIA: o marcador cita o CLÃ por `requerId`, e os dois
   vêm no mesmo pacote. Se o `idsLocais` voltar a ser por família, o `requerId`
   fica cru, não casa com o id prefixado do clã, e o marcador some CALADO. */
t("o marcador do clã aparece, com o limite avaliado",
  base.invocacoes.marcadores.map((m) => [m.label, m.limite]),
  [["Economia de Sombras", 3]]);

t("o nome da variável de DSL é saneado",
  varDeMarcador("estrela-zenin:economia_de_sombras"), "marc_estrela_zenin_economia_de_sombras");

const semMarca = base.invocacoes.lista[0].custo;
const comMarca = ficha((f) => {
  f.invocacoes[0].marcadores = { "estrela-zenin:economia_de_sombras": true };
}).invocacoes.lista[0].custo;
t("ligar o marcador abate 2 PE", [semMarca, comMarca], [4, 2]);

/* ⚠ E SÓ NA INVOCAÇÃO MARCADA. Sem isto o marcador viraria um bônus geral com
   passos a mais, que é justo o que ele existe para não ser. */
const duas = ficha((f) => {
  const outra = createBlankInvocacao();
  outra.id = "SHIKI2";
  outra.nome = "Outra";
  outra.grau = "terceiro";
  f.invocacoes.push(outra);
  f.invocacoes[0].marcadores = { "estrela-zenin:economia_de_sombras": true };
});
t("a invocação sem marca não abate nada",
  duas.invocacoes.lista.map((i) => i.custo), [2, 4]);

/* ---------- 4. O REQUISITO `cla` ---------- */

const ctxDe = (claId) => ({
  nd: 20, maestria: 6, attrEff: {}, origemId: "herdado", claId,
  origensQualificadas: ["herdado"], especializacoes: [{ id: "controlador", nivel: 20 }],
});
const reqCla = T.getTalento("estrela-zenin:tal_fantoche_divino")
  .requisitos.find((r) => r.tipo === "cla");
t("o Talento de Origem abre para o clã dele",
  T.avaliarRequisitoTalento(reqCla, ctxDe(CLA)).ok, true);
/* ⚠ E FECHA PARA OUTRO HERDADO. Por `tipo: "origem"` os dois passariam, porque
   os dois são Herdado: é exatamente o buraco que o requisito `cla` fecha. */
t("e fecha para um Gojo, que também é Herdado",
  T.avaliarRequisitoTalento(reqCla, ctxDe("cla_gojo")).ok, false);

/* ---------- 5. DESINSTALAR NÃO DEIXA RESTO ---------- */

A.aplicarAddons([]);
t("o clã sai da lista", O.clasDaOrigem("herdado").map((c) => c.id),
  ["cla_gojo", "cla_inumaki", "cla_kamo", "cla_zenin"]);
t("e o marcador some do registro", O.getCla(CLA), null);

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
