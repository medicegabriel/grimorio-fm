/* O dano da arma que acerta pelo Ataque Amaldiçoado (autor, 2026-10-02):
   "Isso é somente na Ficha de Criatura. Quando uma arma usa o Acerto
   Amaldiçoado, ela também usa o Atributo de Técnica para o Dano."

   É a divergência `danoDoAcertoAmaldicoado` (afty-sistema.js). Na criatura o
   dano segue o atributo do acerto, e no jogador segue o atributo da arma. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");

const { normalizaSessao, sessaoEmBranco } = await import(R + "ficha/ficha-sessao.js");
const { derivarComCache, opcoesDoCombatente } = await import(R + "encontros/usar-encontro-afty.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Força 12 e Presença 18: os dois modificadores diferem (+1 e +4), então a
   troca muda o número, e não só o rótulo. */
const ficha = ({ sistema = "afty", ataqueId, tecnicaAttr = "presenca", extra } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 10;
  c.core.tecnicaAttr = tecnicaAttr;
  c.attributes = { forca: 12, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 18 };
  c.equipamentos = {
    itens: [{ id: "e0", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true, ...(ataqueId ? { ataqueId } : {}) }],
  };
  if (extra) extra(c);
  return deriveAfty(c);
};
const adaga = (d) => (d.dano?.entradas ?? []).find((e) => e.fonte === "arma");
const parteDoAtributo = (linha) => (linha?.partes ?? []).find((p) => /×/.test(p.label) && !/Nível/.test(p.label));

/* ============================================================ */
/* 1. NA CRIATURA, O AMALDIÇOADO LEVA A TÉCNICA AO DANO          */
/* ============================================================ */
const amal = adaga(ficha({ ataqueId: "amaldicoado" }));
t("a adaga no Acerto Amaldiçoado acerta pelo Amaldiçoado", amal?.acertoAtaque, "Amaldiçoado");
t("e o dano usa o Atributo de Técnica", amal?.atributo, "presenca");
t("com o modificador dele no número", parteDoAtributo(amal), {
  label: "Presença × 1", valor: 4, categoria: "total",
});
/* O acerto e o dano lêem o MESMO atributo: um dono só para a escolha. */
t("o acerto da mesma linha usa o mesmo atributo",
  amal?.partesAcerto?.[0]?.label, "Presença");
t("trocar o Atributo de Técnica troca o dano junto",
  adaga(ficha({ ataqueId: "amaldicoado", tecnicaAttr: "sabedoria" }))?.atributo, "sabedoria");

/* ============================================================ */
/* 2. SÓ O AMALDIÇOADO: O ATAQUE FÍSICO NÃO MUDA                 */
/* ============================================================ */
const fisico = adaga(ficha());
t("a mesma adaga no ataque físico segue com Força no dano", fisico?.atributo, "forca");
t("e acerta pelo Corpo a Corpo", fisico?.acertoAtaque, "Corpo a Corpo");

/* ============================================================ */
/* 3. NO JOGADOR NADA MUDA                                       */
/* ============================================================ */
const jogador = adaga(ficha({ sistema: "player", ataqueId: "amaldicoado" }));
t("no jogador o Amaldiçoado ainda acerta pela Técnica",
  jogador?.partesAcerto?.[0]?.label, "Presença");
t("mas o dano segue o atributo da arma", jogador?.atributo, "forca");

/* ============================================================ */
/* 4. AS TÉCNICAS DE COMBATE VÊM ANTES                           */
/* ============================================================ */
/* As Técnicas já trocam o acerto por cima do Ataque Amaldiçoado, e o dano segue
   a mesma ordem, para os dois lados da linha usarem o mesmo atributo. */
const comTecnicas = adaga(ficha({
  ataqueId: "amaldicoado",
  extra: (c) => {
    c.core.nivel = 8;
    c.especializacoes = [{ id: "conjurador", nivel: 8 }];
    c.habilidades = ["cnj_tecnicas_de_combate"];
    c.tecnicasCombate = { armas: ["arm_adaga"], atributo: "inteligencia" };
  },
}));
t("arma das Técnicas de Combate no Amaldiçoado usa o atributo das Técnicas no dano",
  comTecnicas?.atributo, "inteligencia");
t("e no acerto", comTecnicas?.partesAcerto?.[0]?.label, "Inteligência");


/* O Básico escolhe a jogada na própria linha (autor, 2026-10-04). */
const golpe = (c, opcoes = {}) => deriveAfty(c, opcoes).dano.entradas.find((e) => e.id === "basico");
const fichaBasica = (sistema = "afty", refId = null) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 10;
  c.core.tecnicaAttr = "presenca";
  c.attributes = { forca: 12, destreza: 20, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 18 };
  c.ataqueBasicoId = "amaldicoado";
  c.equipamentos = { itens: refId ? [{ uid: "punho", tipo: "arma", refId, qtd: 1, equipado: true }] : [] };
  return c;
};
for (const sistema of ["afty", "player"]) {
  for (const item of [null, "arm_faixas", "arm_manoplas", "arm_soco_ingles"]) {
    const c = fichaBasica(sistema, item);
    const b = golpe(c);
    const atq = deriveAfty(c).testes.ataques.find((a) => a.id === "amaldicoado");
    t(sistema + ": Básico Amaldiçoado com " + item, [b.ataqueId, b.acertoAtaque, b.treinada], ["amaldicoado", "Amaldiçoado", true]);
    t(sistema + ": acerto usa Técnica sem BT duplicado com " + item, b.acerto, atq.bonus);
    t(sistema + ": atributo do dano com " + item, b.atributo,
      sistema === "afty" ? "presenca" : item === "arm_soco_ingles" ? "destreza" : "forca");
    t(sistema + ": fontes fecham o acerto com " + item,
      b.partesAcerto.reduce((n, p) => n + (p.valor ?? 0), 0), b.acerto);
  }
}
for (const sistema of ["afty", "player"]) {
  const criada = fichaBasica(sistema, "armc_punhos");
  criada.armasCustom = [{ id: "armc_punhos", nome: "Punhos Criados", categoria: "corpo", grupo: "pugilato",
    classe: "simples", custo: 1, dano: { tipo: "im" }, niveis: { desarmado: true }, props: { aparar: true } }];
  const linha = golpe(criada);
  t(sistema + ": Pugilato criado usa o Básico Amaldiçoado", [linha.ataqueId, linha.chaveArma], ["amaldicoado", "punho"]);
  const d = deriveAfty(criada);
  const aparando = deriveAfty(criada, { propriedadesArmas: { porArma: { punho: { aparando: true } } } });
  t(sistema + ": treino Amaldiçoado permite Aparar no Básico", aparando.defesa - d.defesa, 2);
}
const natural = fichaBasica();
natural.ataqueFineza = true;
natural.ataqueAtributoManual = { corpo: "destreza", amaldicoado: "sabedoria" };
t("troca manual do Amaldiçoado chega ao acerto e ao dano da criatura",
  [golpe(natural).partesAcerto[0].label, golpe(natural).atributo], ["Sabedoria", "sabedoria"]);
const equipada = fichaBasica("afty", "arm_faixas");
equipada.equipamentos.itens[0].fa = { grau: "primeiro", encantamentos: ["enc_arma_precisa", "enc_arma_potente"] };
const encantada = golpe(equipada);
t("Precisa chega ao acerto Amaldiçoado do Básico", encantada.partesAcerto.find((p) => p.label === "Precisa")?.valor, 2);
equipada.ataqueBasicoId = "corpo";
equipada.ataquesProf.corpo = true;
const encantadaFisica = golpe(equipada);
t("trocar a jogada preserva o grau e os encantamentos",
  [encantada.grauArma, encantada.partesAcerto.filter((p) => /Ferramenta|Precisa/.test(p.label)), encantada.gruposDano.filter((g) => g.nome === "Potente")],
  [encantadaFisica.grauArma, encantadaFisica.partesAcerto.filter((p) => /Ferramenta|Precisa/.test(p.label)), encantadaFisica.gruposDano.filter((g) => g.nome === "Potente")]);
const escopada = fichaBasica();
escopada.core.tecnicaEfeitos = [{ canal: "danoBonus", expr: "7", alvo: "atq:amaldicoado" }];
const semEfeito = fichaBasica();
t("efeito de Ataque Amaldiçoado alcança o Básico", golpe(escopada).total - golpe(semEfeito).total, 7);
escopada.ataqueBasicoId = "corpo";
semEfeito.ataqueBasicoId = "corpo";
t("efeito de Ataque Amaldiçoado não vaza ao Corpo a Corpo", golpe(escopada).total, golpe(semEfeito).total);
const salva = fichaBasica();
t("ficha antiga conserva Corpo a Corpo", golpe(createBlankAfty()).ataqueId, "corpo");
t("campo inválido volta ao ataque físico", golpe({ ...salva, ataqueBasicoId: "distancia" }).ataqueId, "corpo");
t("importação conserva a escolha", mesclaFichaAfty(JSON.parse(JSON.stringify(salva))).ataqueBasicoId, "amaldicoado");
t("importação normaliza campo inválido", mesclaFichaAfty({ ...salva, ataqueBasicoId: "distancia" }).ataqueBasicoId, "corpo");
t("sessão nova herda a escolha da ficha", golpe(salva, opcoesDoCombatente(sessaoEmBranco())).ataqueId, "amaldicoado");
const sessao = normalizaSessao({ ataqueBasicoId: "corpo" });
t("escolha na mesa prevalece sobre a ficha", golpe(salva, opcoesDoCombatente(sessao)).ataqueId, "corpo");
t("escolha na mesa não altera a ficha", salva.ataqueBasicoId, "amaldicoado");
t("sessão gravada conserva a escolha", normalizaSessao(JSON.parse(JSON.stringify(sessao))).ataqueBasicoId, "corpo");
t("sessão inválida herda a ficha", normalizaSessao({ ataqueBasicoId: "distancia" }).ataqueBasicoId, null);
const combatente = { ficha: salva, sessao };
t("cache do Encontro usa a escolha da sessão", derivarComCache(combatente, 0).dano.entradas[0].ataqueId, "corpo");
combatente.sessao = { ...sessao, ataqueBasicoId: "amaldicoado" };
t("troca no Encontro invalida o cache", derivarComCache(combatente, 0).dano.entradas[0].ataqueId, "amaldicoado");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
