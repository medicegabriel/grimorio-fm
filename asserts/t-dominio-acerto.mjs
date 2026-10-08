/* ACERTO GARANTIDO ESTRUTURADO E MOTOR DO EFEITO ESPECIAL (Etapa 8, 2026-10-08).

   Livro, Guia de Criação, "Acerto Garantido": um efeito só, escolhido antes
   (grupo de Feitiços, ataques armados ou desarmados, condições sem
   Desmembramento, informação, voto). O não letal ganha a Abertura de 0,2
   Segundos. DA-20: a modalidade livre leva AVISO de aprovação, e o Efeito
   Especial pode escrever no Motor só em canal conhecido e fora de Orçamentos,
   de Barreira e Domínio e do nível de Aptidão.

   ⚠ O FORMATO ANTERIOR `{ ativo, escopo }` fica no modo anterior: o texto da
   Ficha é o mesmo de antes, e o JSON não muda. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const DOM = await import(R + "afty-dominios.js");
const EFE = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A LEITURA                                                  */
/* ============================================================ */
const antigo = DOM.normalizaAcertoGarantido({ ativo: true, escopo: "o soco" });
t("formato anterior: tipo nulo, frase na descrição, escopo intocado",
  [antigo.tipo, antigo.descricao, antigo.escopo, antigo.letalidade, antigo.referencias], [null, "o soco", "o soco", "letal", []]);
t("tipo desconhecido gravado vira Outro", DOM.normalizaAcertoGarantido({ tipo: "xyz" }).tipo, "outro");
t("o tipo novo não herda o escopo como descrição", DOM.normalizaAcertoGarantido({ tipo: "feiticos", escopo: "Nível 5" }).descricao, "");
t("Expansão nova nasce com Grupo de Feitiços", DOM.novoDominio("completa").acertoGarantido.tipo, "feiticos");

const trocaInfo = DOM.patchTipoAcerto({ tipo: "feiticos", referencias: ["f1"], letalidade: "letal" }, "informacao");
t("trocar para Informação sugere Não Letal e limpa as referências", [trocaInfo.letalidade, trocaInfo.referencias], ["nao_letal", []]);
const mesmoTipo = DOM.patchTipoAcerto({ tipo: "condicao", referencias: ["Cego"] }, "condicao");
t("o mesmo tipo mantém as referências", mesmoTipo.referencias, ["Cego"]);
const doAntigo = DOM.patchTipoAcerto({ ativo: true, escopo: "o soco" }, "ataque_desarmado");
t("escolher um tipo tira do modo anterior e mantém a frase", [doAntigo.tipo, doAntigo.descricao], ["ataque_desarmado", "o soco"]);

/* ============================================================ */
/* 2. QUANDO VALE                                                */
/* ============================================================ */
const ligado = { acertoGarantido: { ativo: true, tipo: "ataque_armado" } };
t("sem Aptidão não vale", DOM.resumoAcertoGarantido(ligado, "completa", false), null);
t("na Incompleta não vale", DOM.resumoAcertoGarantido(ligado, "incompleta", true), null);
t("na Completa desligado não vale", DOM.resumoAcertoGarantido({ acertoGarantido: { ativo: false } }, "completa", true), null);
t("na Sem Barreiras vale mesmo desligado", DOM.resumoAcertoGarantido({ acertoGarantido: { ativo: false } }, "sem_barreiras", true)?.letal, true);
const comNomes = DOM.resumoAcertoGarantido(
  { acertoGarantido: { ativo: true, tipo: "feiticos", referencias: ["f1", "sumiu"] } }, "completa", true, { nomesFeiticos: { f1: "Partir" } },
);
t("as referências de Feitiço saem com o nome da ficha", comNomes.referencias, [{ id: "f1", nome: "Partir" }, { id: "sumiu", nome: null }]);

/* ============================================================ */
/* 3. O CORPO E A VALIDAÇÃO, PELO DERIVE, NOS DOIS SISTEMAS      */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = ({ ag, efeitos = [], noAr = false, aptidao = true, feiticos = [] } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 15;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "treinado" };
    c.aptidoes = { dom: 4, bar: 4 };
    c.aptidoesAmaldicoadas = [
      "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa",
      ...(aptidao ? ["acerto_garantido"] : []),
    ];
    c.feiticos = feiticos;
    c.dominios = [{ id: "d1", nome: "Jardim", versao: "completa", regra: "oficial", efeitos, ...(ag ? { acertoGarantido: ag } : {}) }];
    if (noAr) c.combate = { ativo: true, dominioAtivo: "d1", dominioFase: "ativa" };
    return c;
  };
  const linha = (c) => deriveAfty(c).dominios.lista[0];
  const proprio = (l, id) => l.corpo.proprios.find((p) => p.id === id);
  const codigos = (l) => l.validacao.map((v) => `${v.nivel}:${v.codigo}`);

  // O formato anterior escreve o mesmo texto de antes, e o JSON fica igual.
  const cruAntigo = ficha({ ag: { ativo: true, escopo: "o soco" } });
  const lAntigo = linha(cruAntigo);
  t(`${sistema}: modo anterior, mesmo texto`, proprio(lAntigo, "acerto_garantido").texto.startsWith(
    "Enquanto dentro do seu domínio, o soco se torna garantido: ele é aplicado no início de cada turno"), true);
  t(`${sistema}: modo anterior, mesma categoria`, proprio(lAntigo, "acerto_garantido").categoria, "o soco");
  t(`${sistema}: o JSON gravado não muda`, cruAntigo.dominios[0].acertoGarantido, { ativo: true, escopo: "o soco" });
  t(`${sistema}: modo anterior sem aviso novo`, codigos(lAntigo), []);

  // Grupo de Feitiços com os nomes.
  const lFeit = linha(ficha({
    ag: { ativo: true, tipo: "feiticos", escopo: "Apenas Feitiços Nível 5", referencias: ["f1"] },
    feiticos: [{ id: "f1", nome: "Partir", tipo: "dano", nivel: 5 }],
  }));
  const agFeit = proprio(lFeit, "acerto_garantido");
  t(`${sistema}: Feitiços, categoria e texto`,
    [agFeit.categoria, agFeit.texto.startsWith("Garantido dentro do seu domínio: Apenas Feitiços Nível 5: Partir. Ele é aplicado")],
    ["Grupo de Feitiços", true]);
  t(`${sistema}: Feitiços, ataque acerta e TR falha`, agFeit.texto.includes("Jogadas de ataque sempre acertam"), true);
  t(`${sistema}: letal não ganha a Abertura`, proprio(lFeit, "abertura_02"), undefined);
  t(`${sistema}: Feitiços completo sem aviso`, codigos(lFeit), []);
  t(`${sistema}: o resumo vai para a Ficha`, lFeit.acertoGarantidoResumo.referencias, [{ id: "f1", nome: "Partir" }]);

  const lSumiu = linha(ficha({ ag: { ativo: true, tipo: "feiticos", referencias: ["fx"] } }));
  t(`${sistema}: Feitiço apagado avisa`, codigos(lSumiu), ["aviso:acertoFeiticoSumiu"]);
  t(`${sistema}: Feitiços sem grupo avisa`, codigos(linha(ficha({ ag: { ativo: true, tipo: "feiticos" } }))), ["aviso:acertoFeiticos"]);

  // Condições: Paralisia sim, Desmembramento nunca.
  const lCond = linha(ficha({ ag: { ativo: true, tipo: "condicao", referencias: ["Paralisado", "Atordoado"] } }));
  const agCond = proprio(lCond, "acerto_garantido");
  t(`${sistema}: condição Extrema garantida vale`, [lCond.valida, agCond.texto.includes("Paralisado, Atordoado")], [true, true]);
  t(`${sistema}: condição dura 1 rodada`, agCond.texto.includes("duram 1 rodada"), true);
  const lDesm = linha(ficha({ ag: { ativo: true, tipo: "condicao", referencias: ["Desmembramento"] } }));
  t(`${sistema}: Desmembramento é ERRO e trava a abertura`, [codigos(lDesm), lDesm.valida], [["erro:acertoDesmembramento"], false]);
  t(`${sistema}: condição vazia avisa`, codigos(linha(ficha({ ag: { ativo: true, tipo: "condicao" } }))), ["aviso:acertoCondicao"]);

  // Não letal: a Abertura de 0,2 Segundos.
  const lVoto = linha(ficha({ ag: { ativo: true, tipo: "voto", letalidade: "nao_letal", descricao: "Ninguém ataca dentro do domínio" } }));
  t(`${sistema}: não letal ganha a Abertura`,
    [proprio(lVoto, "abertura_02")?.titulo, proprio(lVoto, "acerto_garantido").categoria], ["Abertura de 0,2 Segundos", "Voto · Não Letal"]);
  t(`${sistema}: o voto não diz que o ataque acerta`, proprio(lVoto, "acerto_garantido").texto.includes("Jogadas de ataque"), false);
  t(`${sistema}: voto descrito, sem aviso`, codigos(lVoto), []);
  t(`${sistema}: voto sem descrição avisa`, codigos(linha(ficha({ ag: { ativo: true, tipo: "voto" } }))), ["aviso:acertoDescricao"]);
  t(`${sistema}: Outro pede o Narrador`,
    codigos(linha(ficha({ ag: { ativo: true, tipo: "outro", descricao: "Peixes" } }))), ["aviso:acertoLivre"]);

  // Sem a Aptidão nada disso pesa: o AG não vale.
  t(`${sistema}: Desmembramento sem a Aptidão não trava`,
    linha(ficha({ aptidao: false, ag: { ativo: true, tipo: "condicao", referencias: ["Desmembramento"] } })).valida, true);

  /* ---------- O Motor do Efeito Especial (DA-20) ---------- */
  const especial = (motor) => [{ id: "e1", categoria: "especial", nome: "Flores", descricao: "x", motor }];
  const detalhes = (c) => deriveAfty(c).efeitos.detalhes.filter((x) => x.nome === "Jardim: Flores").map((x) => [x.canal, x.valor]);
  t(`${sistema}: a linha de Defesa entra com a Expansão no ar`,
    detalhes(ficha({ noAr: true, efeitos: especial([{ canal: "defesa", expr: "2" }]) })), [["defesa", 2]]);
  t(`${sistema}: e não entra fora dela`, detalhes(ficha({ efeitos: especial([{ canal: "defesa", expr: "2" }]) })), []);
  const vaga = ficha({ noAr: true, efeitos: especial([{ canal: "vagasFeitico", expr: "1" }]) });
  t(`${sistema}: canal de Orçamento não entra`, detalhes(vaga), []);
  t(`${sistema}: e avisa`, codigos(linha(vaga)), ["aviso:especial", "aviso:motorCanal"]);
  t(`${sistema}: canal desconhecido avisa`,
    codigos(linha(ficha({ efeitos: especial([{ canal: "inventado", expr: "1" }]) }))), ["aviso:especial", "aviso:motorCanal"]);
  t(`${sistema}: linha sem expressão avisa e não entra`,
    [codigos(linha(ficha({ efeitos: especial([{ canal: "defesa", expr: "" }]) }))),
      detalhes(ficha({ noAr: true, efeitos: especial([{ canal: "defesa", expr: "" }]) }))],
    [["aviso:especial", "aviso:motorExpr"], []]);
}

/* ============================================================ */
/* 4. O FILTRO DE CANAIS                                         */
/* ============================================================ */
t("canais permitidos no Efeito Especial",
  ["defesa", "bonusAcerto", "rdTipo", "custoPE", "movimento"].map(EFE.canalPermitidoEmExpansao), [true, true, true, true, true]);
t("canais fora do Efeito Especial",
  ["vagasFeitico", "vagasTecnicaMaxima", "efeitosDominio", "areaDominio", "nivelAptidao", "limiteAptidao", "inventado", ""].map(EFE.canalPermitidoEmExpansao),
  [false, false, false, false, false, false, false, false]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
