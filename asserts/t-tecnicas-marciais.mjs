/* TÉCNICAS MARCIAIS DO RESTRINGIDO (Livro, p. 124 e 247 a 251).

   Cada exemplo do livro entra como assert, e cada decisão do autor de
   2026-10-26 (docs/afty-tecnicas-marciais.md) tem o seu. Este arquivo cresce com
   as fases: o bloco 1 mede a folha, o 2 o motor do Feitiço, e os seguintes o
   derive, os dois sistemas e a Ficha. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const FE = await import(R + "afty-feiticos.js");
const TM = await import(R + "afty-tecnicas-marciais.js");
const EF = await import(R + "afty-efeitos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. AS TABELAS DO LIVRO                                        */
/* ============================================================ */
t("custo 2, 5, 8 e 12 de Estamina (p. 124)", TM.TM_NIVEIS.map((n) => TM.TM_CUSTO_PE[n]), [2, 5, 8, 12]);
t("o custo é o do Feitiço de Nível 1 a 4",
  TM.TM_NIVEIS.map((n) => FE.FEITICO_CUSTO_PE[n]), [2, 5, 8, 12]);
t("acesso 1, 5, 9 e 15", TM.TM_NIVEIS.map((n) => TM.TM_ACESSO[n]), [1, 5, 9, 15]);
t("ataques 1 a 4", TM.TM_NIVEIS.map((n) => TM.TM_ATAQUES[n]), [1, 2, 3, 4]);
t("acerto +1 a +4", TM.TM_NIVEIS.map((n) => TM.TM_ACERTO[n]), [1, 2, 3, 4]);
t("dano +4, +8, +12 e +16", TM.TM_NIVEIS.map((n) => TM.TM_DANO[n]), [4, 8, 12, 16]);
t("RD ignorada 8, 12, 16 e 20", TM.TM_NIVEIS.map((n) => TM.TM_RD[n]), [8, 12, 16, 20]);
t("cada ataque reduzido soma +2 no acerto e +3 na RD", [TM.TM_ACERTO_POR_REDUCAO, TM.TM_RD_POR_REDUCAO], [2, 3]);

/* ⚠ A ESCADA DE CONDIÇÃO DO LIVRO É A DOS FEITIÇOS (p. 209 e 251): a força que o
   número de acertos dá tem de existir na tabela de duração do mesmo nível. */
t("as quatro forças são as dos Feitiços", TM.TM_FORCAS, FE.CONDICAO_FORCAS.map((f) => f.value));

/* ============================================================ */
/* 2. ATAQUES POR AÇÃO (p. 250)                                  */
/* ============================================================ */
t("Comum dá o nível", [1, 2, 3, 4].map((n) => TM.ataquesNaAcao(n, "comum")), [1, 2, 3, 4]);
t("Completa soma 1", [1, 2, 3, 4].map((n) => TM.ataquesNaAcao(n, "completa")), [2, 3, 4, 5]);
t("Bônus é metade, para baixo", [2, 3, 4].map((n) => TM.ataquesNaAcao(n, "bonus")), [1, 1, 2]);
t("Nível 1 não pode ser Bônus", TM.ataquesNaAcao(1, "bonus"), 0);
t("a lista de ações marca o Bônus do Nível 1 como indisponível",
  TM.acoesDaTecnicaAtaque(1).map((a) => [a.value, a.indisponivel]),
  [["comum", false], ["completa", false], ["bonus", true]]);

/* ============================================================ */
/* 3. A TÉCNICA DE ATAQUE, CONTRA OS EXEMPLOS DO LIVRO           */
/* ============================================================ */
const COND = {
  fraca: "Abalado", media: "Amedrontado", forte: "Cego", extrema: "Atordoado",
};
const ataque = (extra = {}) => ({
  ...FE.createBlankTecnicaMarcial(),
  efeitosAtaque: ["acerto", "dano", "rd"],
  ...extra,
});
const calc = (f, ctx = {}) => FE.calcularTecnicaAtaque(f, { cdBase: 17, ...ctx });

/* Nível 3 reduzida para 1 ataque (p. 250 e 251): o livro dá 36 de dano. O acerto
   é +3 de base mais +2 por ataque reduzido, e a RD é 16 mais +3 por ataque. */
const n3 = calc(ataque({ nivel: 3, efeitosAtaque: ["acerto"], ataquesReduzidos: 2 }));
t("Nível 3 em 1 ataque: 1 ataque", n3.ataques, 1);
t("Nível 3 em 1 ataque: acerto +7 (o +4 do livro é o ganho)", n3.bonusAcerto, 7);
const n3d = calc(ataque({ nivel: 3, efeitosAtaque: ["dano"], ataquesReduzidos: 2 }));
t("Nível 3 em 1 ataque: 36 de dano (p. 251)", n3d.danoAdicional, 36);
const n3r = calc(ataque({ nivel: 3, efeitosAtaque: ["rd"], ataquesReduzidos: 2 }));
t("Nível 3 em 1 ataque: 22 de RD ignorada", n3r.rdIgnorada, 22);

/* Sem redução, em cada nível. */
t("Nível 1 com os três efeitos: só um cabe", calc(ataque({ nivel: 1 })).efeitos, ["acerto"]);
t("Nível 1 com 3 efeitos avisa", calc(ataque({ nivel: 1 })).avisos.length, 1);
const n4 = calc(ataque({ nivel: 4, efeitosAtaque: ["acerto"] }));
t("Nível 4 com 1 efeito: +4, 4 ataques", [n4.bonusAcerto, n4.ataques], [4, 4]);

/* Vários efeitos: TODOS descem juntos (decisão 7). */
const dois = calc(ataque({ nivel: 4, efeitosAtaque: ["acerto", "dano"] }));
t("Nível 4 com 2 efeitos: os dois no Nível 3", dois.nivelEfeito, 3);
t("Nível 4 com 2 efeitos: acerto +3 e dano +12", [dois.bonusAcerto, dois.danoAdicional], [3, 12]);
const quatro = calc(ataque({ nivel: 4, efeitosAtaque: ["acerto", "dano", "rd", "condicao"] }));
t("Nível 4 com 4 efeitos: todos no Nível 1", quatro.nivelEfeito, 1);
t("Nível 4 com 4 efeitos: +1 de acerto, +4 de dano e 8 de RD",
  [quatro.bonusAcerto, quatro.danoAdicional, quatro.rdIgnorada], [1, 4, 8]);
t("o exemplo do livro: Nível 2 com Acerto e Dano no Nível 1",
  (() => { const c = calc(ataque({ nivel: 2, efeitosAtaque: ["acerto", "dano"] })); return [c.nivelEfeito, c.bonusAcerto, c.danoAdicional]; })(),
  [1, 1, 4]);
t("a ordem do livro vale, e repetido some",
  calc(ataque({ nivel: 4, efeitosAtaque: ["dano", "acerto", "dano"] })).efeitos, ["acerto", "dano"]);

/* Reduzir ataques melhora TODOS os efeitos (decisão 8). */
const reduzidoDois = calc(ataque({ nivel: 4, efeitosAtaque: ["acerto", "dano"], ataquesReduzidos: 2 }));
t("Nível 4 reduzido em 2, com 2 efeitos: acerto +3+4, dano 12×3",
  [reduzidoDois.bonusAcerto, reduzidoDois.danoAdicional, reduzidoDois.ataques], [7, 36, 2]);
t("o teto da redução é ataques menos 1",
  calc(ataque({ nivel: 2, ataquesReduzidos: 9 })).ataquesReduzidos, 1);

/* A Ação muda o número de ataques e a redução parte dele (decisão: reduções combinam). */
const completa = calc(ataque({ nivel: 3, acaoAtaque: "completa", efeitosAtaque: ["acerto"], ataquesReduzidos: 1 }));
t("Completa Nível 3 reduzida em 1: 3 ataques", completa.ataques, 3);
t("Completa Nível 3 reduzida em 1: acerto +3+2", completa.bonusAcerto, 5);
const bonus = calc(ataque({ nivel: 4, acaoAtaque: "bonus", efeitosAtaque: [] }));
t("Bônus Nível 4: 2 ataques", bonus.ataques, 2);
t("Bônus Nível 1 vira Comum e avisa",
  (() => { const c = calc(ataque({ nivel: 1, acaoAtaque: "bonus", efeitosAtaque: [] })); return [c.acao, c.avisos.length]; })(),
  ["comum", 1]);

/* ============================================================ */
/* 4. A ESCADA DE CONDIÇÃO (p. 251)                              */
/* ============================================================ */
const comCond = (extra = {}) => calc(ataque({
  efeitosAtaque: ["condicao"], condicoesAtaque: COND, trCondicaoAtaque: "fortitude", ...extra,
}));
const forcas = (c) => c.condicao.escada.map((d) => d.forca);

t("Nível 3: 1, 2 e 3 acertos dão Fraca, Média e Forte",
  forcas(comCond({ nivel: 3 })), ["fraca", "media", "forte"]);
t("Nível 4: os quatro acertos chegam à Extrema",
  forcas(comCond({ nivel: 4 })), ["fraca", "media", "forte", "extrema"]);
t("Nível 2 em 1 ataque aplica a Média direto (p. 251)",
  forcas(comCond({ nivel: 2, ataquesReduzidos: 1 })), ["media"]);
t("Completa de Nível 3 NUNCA passa da Forte, mesmo com 4 ataques (p. 251)",
  forcas(comCond({ nivel: 3, acaoAtaque: "completa" })), ["fraca", "media", "forte", "forte"]);
t("a força máxima é a do nível dos efeitos", comCond({ nivel: 4 }).condicao.forcaMax, "extrema");
t("com outro efeito o teto cai 1 (Nível 4 com 2 efeitos: Forte)",
  comCond({ nivel: 4, efeitosAtaque: ["acerto", "condicao"] }).condicao.forcaMax, "forte");
t("a Condição de cada força vem da escolha da criação",
  comCond({ nivel: 3 }).condicao.escada.map((d) => d.nome), ["Abalado", "Amedrontado", "Cego"]);
t("a duração vem da tabela do nível da Técnica (Nível 2: Fraca 2, Média 1)",
  comCond({ nivel: 2 }).condicao.escada.map((d) => d.rodadas), [2, 1]);
t("o TR e a CD", [comCond().condicao.tr, comCond().condicao.cd], ["fortitude", 17]);
t("sem Condição escolhida avisa uma por força",
  comCond({ nivel: 3, condicoesAtaque: {} }).avisos.filter((a) => a.startsWith("Falta a Condição")).length, 3);
t("nome que não é da força avisa",
  comCond({ nivel: 1, condicoesAtaque: { fraca: "Atordoado" } }).avisos.some((a) => a.includes("não é uma Condição Fraca")), true);
t("sem TR avisa", comCond({ trCondicaoAtaque: "" }).avisos.includes("Escolha o Teste de Resistência do alvo."), true);
t("sem o efeito Aplicar Condições não há Condição", calc(ataque({ nivel: 3 })).condicao, null);
t("o texto da escada",
  TM.textoDaEscada(comCond({ nivel: 2 }).condicao.escada[1]), "2 Acertos: Amedrontado (Média, 1 rodada)");

/* ============================================================ */
/* 5. NÍVEL, CUSTO E AVISOS                                      */
/* ============================================================ */
t("custo da Técnica de Ataque por nível", [1, 2, 3, 4].map((n) => calc(ataque({ nivel: n })).custoPE), [2, 5, 8, 12]);
t("Nível 0 mantém o cálculo no 1 e avisa",
  (() => { const c = calc(ataque({ nivel: 0, efeitosAtaque: [] })); return [c.nivel, c.avisos.length]; })(), [1, 1]);
t("Nível 5 mantém o cálculo no 4 e avisa",
  (() => { const c = calc(ataque({ nivel: 5, efeitosAtaque: [] })); return [c.nivel, c.avisos.length]; })(), [4, 1]);
t("acima do acesso avisa",
  calc(ataque({ nivel: 3, efeitosAtaque: [] }), { acessoNivel: 2 }).avisos.some((a) => a.startsWith("Acima do acesso")), true);

/* O calculador entra pela porta única do Feitiço, como qualquer outro tipo. */
t("calcularFeitico despacha o tipo ataque",
  FE.calcularFeitico(ataque({ nivel: 2, efeitosAtaque: ["dano"] }), { cdBase: 17 }).danoAdicional, 8);

/* ============================================================ */
/* 6. ACESSO E QUANTIDADE                                        */
/* ============================================================ */
t("acesso por nível de personagem", [1, 4, 5, 8, 9, 14, 15, 30].map((n) => TM.nivelMaxTecnicaMarcial(n)), [1, 1, 2, 2, 3, 3, 4, 4]);
t("o teto da origem aparo o acesso (Não-Feiticeiro 2)", [1, 5, 9, 15].map((n) => TM.nivelMaxTecnicaMarcial(n, 2)), [1, 2, 2, 2]);
t("nível ausente conta como 1", TM.nivelMaxTecnicaMarcial(undefined), 1);

const prog = (n) => TM.tecnicasMarciaisDoJogador(n).total;
t("a progressão do jogador: 2 no 1, 3 no 3, 4 no 5", [1, 2, 3, 4, 5].map(prog), [2, 2, 3, 3, 4]);
t("e 11 no nível 19 (p. 248)", prog(19), 11);
t("continua nos ímpares depois do 19, sem teto", [20, 21, 23, 29, 30].map(prog), [11, 12, 13, 16, 16]);
t("as parcelas do hover somam o total",
  TM.tecnicasMarciaisDoJogador(9).partes.reduce((s, p) => s + p.valor, 0), prog(9));
t("as parcelas do hover têm nome",
  TM.tecnicasMarciaisDoJogador(9).partes.map((p) => p.label), ["Inicial", "Níveis Ímpares"]);

/* ============================================================ */
/* 7. A MARCA E A LEITURA PADRÃO                                 */
/* ============================================================ */
const lista = [
  { id: "a", tipo: "passivo" },
  { id: "b", tipo: "personalizado", marcial: false },
  { id: "c", tipo: "passivo", marcial: true },
  { id: "d", tipo: "passivo", variacaoDe: "a" },
];
const marcados = TM.marcarTecnicasMarciais(lista, true);
t("o padrão marca o que não tem marca", marcados.find((f) => f.id === "a").marcial, true);
t("a marca explícita falsa fica", marcados.find((f) => f.id === "b").marcial, false);
t("a marca explícita verdadeira fica", marcados.find((f) => f.id === "c").marcial, true);
t("a variação herda e não é marcada", marcados.find((f) => f.id === "d").marcial, undefined);
t("sem o padrão nada é marcado", TM.marcarTecnicasMarciais(lista, false) === lista, true);
t("a lista original não é tocada", lista.find((f) => f.id === "a").marcial, undefined);
t("sem mudança devolve a mesma lista (por referência)",
  (() => { const so = [{ id: "x", marcial: true }]; return TM.marcarTecnicasMarciais(so, true) === so; })(), true);
t("lista inválida passa direto", TM.marcarTecnicasMarciais(null, true), null);

/* ============================================================ */
/* 8. OS VETOS DO LIVRO (p. 249), PELO MOTOR                     */
/* ============================================================ */
const veto = { ...FE.VETOS_TECNICA_MARCIAL, nd: 15, cdBase: 17 };
/* Duradoura nos dois lados: o Aumento de Atributo não tem coluna Imediata. */
const aux = (efeito) => ({
  ...FE.createBlankTecnicaMarcial("auxiliar"), efeitoAux: efeito, nivel: 3, duracaoAux: "duradoura", rodadasDur: 3,
  alvoAuxAtributo: "forca",
});
t("Aumento de Atributo não existe em Técnica Marcial",
  FE.calcularFeitico(aux("atributo"), veto).disponivel, false);
t("e avisa", FE.calcularFeitico(aux("atributo"), veto).avisos.length > 0, true);
t("Bônus em Alcance Corpo a Corpo também não",
  FE.calcularFeitico(aux("alcanceCaC"), veto).disponivel, false);
t("o Feitiço comum segue com os dois",
  [FE.calcularFeitico(aux("atributo"), { nd: 15 }).disponivel, FE.calcularFeitico(aux("alcanceCaC"), { nd: 15 }).disponivel],
  [true, true]);
t("a Defesa segue valendo", FE.calcularFeitico(aux("defesa"), veto).disponivel, true);
t("a lista do Múltiplos Efeitos não oferece os dois",
  FE.efeitosDisponiveisMult([], null, false, veto).some((m) => ["atributo", "alcanceCaC"].includes(m.value)), false);
t("o seletor do efeito único idem",
  FE.efeitosAuxPermitidos(veto).some((m) => ["atributo", "alcanceCaC"].includes(m.value)), false);
t("fora da Técnica a lista é a inteira", FE.efeitosAuxPermitidos({}).length, 17);
t("um slot novo não nasce num efeito vetado",
  FE.primeiroEfeitoLivre([{ efeito: "defesa" }, { efeito: "rd" }], veto), "tr");

const passiva = (categoria, nivel = 3) => ({
  ...FE.createBlankTecnicaMarcial("passivo"), categoriaPassivo: categoria, nivel, alvoPassivoAtributo: "forca",
});
t("a Passiva marcial não aumenta atributo",
  [FE.calcularFeitico(passiva("atributo"), veto).disponivel, FE.calcularFeitico(passiva("atributo"), veto).efeitosGerados.length],
  [false, 0]);
t("e avisa", FE.calcularFeitico(passiva("atributo"), veto).avisos.length, 1);
t("a Passiva comum segue aumentando atributo",
  FE.calcularFeitico(passiva("atributo"), { nd: 15 }).disponivel, true);
t("a Regeneração por Rodada segue valendo na Passiva marcial (decisão 21)",
  FE.calcularFeitico(passiva("regeneracao", 1), veto).disponivel, true);
t("a Defesa passiva marcial segue valendo", FE.calcularFeitico(passiva("defesa", 2), veto).disponivel, true);
t("a lista de categorias da Passiva marcial não tem atributo",
  FE.categoriasPassivoPermitidas(veto).some((c) => c.value === "atributo"), false);

/* O nível fora de 1 a 4 mantém o valor e avisa (decisão 22). */
const niveis = { ...veto, niveisPermitidos: [1, 2, 3, 4] };
t("Nível 0 migrado avisa",
  FE.calcularFeitico({ ...passiva("defesa", 0) }, niveis).avisos.includes("Técnicas Marciais vão do Nível 1 ao 4."), true);
t("Nível 5 migrado avisa",
  FE.calcularFeitico({ ...passiva("defesa", 5) }, niveis).avisos.includes("Técnicas Marciais vão do Nível 1 ao 4."), true);
t("Nível 3 não avisa disso",
  FE.calcularFeitico({ ...passiva("defesa", 3) }, niveis).avisos.includes("Técnicas Marciais vão do Nível 1 ao 4."), false);

/* O Curativo marcial é PV Temporário sem Energia Reversa (decisão 5) e remove Condição (20). */
const cura = { ...FE.createBlankTecnicaMarcial("curativo"), nivel: 2 };
t("Curativo marcial é PV Temporário sem Energia Reversa",
  FE.calcularFeitico(cura, { ...veto, temEnergiaReversa: false }).ehTemporario, true);

/* ============================================================ */
/* 9. O DERIVE: PORTÃO, MIGRAÇÃO E ORÇAMENTO, NOS DOIS SISTEMAS  */
/* ============================================================ */
const ficha = ({ sistema = "afty", nd = 12, origem = "restringido", classe = "restringido", tipo = null,
  feiticos = [], extra = {} } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.tipo = tipo ?? (origem === "restringido" ? "restringido" : "combatente");
  c.core.origem = { id: origem };
  if (classe) c.especializacoes = [{ id: classe, nivel: nd }];
  c.feiticos = feiticos;
  Object.assign(c, extra);
  return c;
};
const tecnica = (tipo = "passivo", extra = {}) => ({
  ...FE.createBlankTecnicaMarcial(tipo), nome: "T", ...extra,
});
const passivoMarcial = (id, extra = {}) => tecnica("passivo", { id, categoriaPassivo: "", ...extra });

/* 9a. O portão e o leiaute. */
const rest = deriveAfty(ficha());
t("o Restringido com a classe abre as Técnicas", [rest.tecnicasMarciais.disponivel, rest.tecnicasMarciais.travado], [true, false]);
t("e monta o leiaute do Restringido", rest.ramoHabilidades, "restringido");
t("com os cinco tipos", rest.tecnicasMarciais.tiposPermitidos, ["ataque", "auxiliar", "curativo", "passivo", "personalizado"]);
t("e nenhum tipo de Feitiço", [rest.feiticos.tiposPermitidos, rest.feiticos.mostraCard], [[], false]);
t("o acesso do ND 12 é o Nível 3", rest.tecnicasMarciais.nivelMax, 3);

const semClasse = deriveAfty(ficha({ origem: "herdado", tipo: "restringido", classe: null }));
t("sem energia e sem a classe: o card existe TRANCADO",
  [semClasse.tecnicasMarciais.mostraCard, semClasse.tecnicasMarciais.travado, semClasse.tecnicasMarciais.motivoTrava],
  [true, true, "Requer a Especialização Restringido"]);
t("e não cria tipo nenhum", semClasse.tecnicasMarciais.tiposPermitidos, []);

const conjurador = deriveAfty(ficha({ origem: "herdado", tipo: "conjurador", classe: "conjurador" }));
t("quem conjura não vê o card das Técnicas", conjurador.tecnicasMarciais.mostraCard, false);
t("e segue com o leiaute padrão e os seis tipos", [conjurador.ramoHabilidades, conjurador.feiticos.tiposPermitidos.length], ["padrao", 6]);
const semTecnica = deriveAfty(ficha({ origem: "sem_tecnica", classe: null }));
t("o Sem Técnica segue com o leiaute dele", [semTecnica.ramoHabilidades, semTecnica.tecnicasMarciais.mostraCard], ["sem_tecnica", false]);

/* O Gêmeo Restringido (decisão 23): a aba do Restringido, sem Feitiços. */
const FISICO_ABENCOADO = "vo_restringido_fisico_abencoado";
const gemeoDe = (sistema, copiou) => {
  const c = ficha({
    sistema, origem: "gemeos", tipo: copiou ? "restringido" : "conjurador", classe: copiou ? "restringido" : "conjurador",
  });
  c.core.origem = { id: "gemeos", escolhas: copiou ? { verdadeiras_origens: [FISICO_ABENCOADO] } : {} };
  return c;
};
for (const sistema of ["afty", "player"]) {
  const g = deriveAfty(gemeoDe(sistema, true));
  t(`${sistema}: o Gêmeo que copiou o Físico Abençoado usa a aba do Restringido`,
    [g.ramoHabilidades, g.tecnicasMarciais.disponivel, g.feiticos.tiposPermitidos], ["restringido", true, []]);
}
t("o Gêmeo Feiticeiro do personagem segue com Feitiços e sem Técnicas",
  (() => { const g = deriveAfty(gemeoDe("player", false)); return [g.ramoHabilidades, g.tecnicasMarciais.mostraCard, g.feiticos.tiposPermitidos.length]; })(),
  ["padrao", false, 6]);

/* 9b. A leitura padrão migra sem gravar (decisões 9, 10 e 23). */
const antigo = { ...FE.createBlankFeitico(), id: "f1", tipo: "passivo", nome: "Corpo" };
const rMig = deriveAfty(ficha({ feiticos: [antigo] }));
t("o Feitiço gravado do Restringido vira Técnica Marcial", rMig.tecnicasMarciais.ids, ["f1"]);
t("e a linha da Ficha diz que é marcial", rMig.tecnicasMarciais.lista[0].marcial, true);
t("com o rótulo de tipo da Técnica", rMig.tecnicasMarciais.lista[0].tipoLabel, "Passiva");
t("fora da conta de Feitiço", [rMig.feiticos.gastos, rMig.orcamentoHabilidades.feiticos, rMig.orcamentoHabilidades.tecnicasMarciais], [0, 0, 1]);
t("a ficha gravada não é tocada", antigo.marcial, undefined);
t("o Sem Técnica mantém o Feitiço como Feitiço",
  deriveAfty(ficha({ origem: "sem_tecnica", classe: null, feiticos: [antigo] })).tecnicasMarciais.ids, []);
t("a marca explícita falsa manda mais que o padrão",
  deriveAfty(ficha({ feiticos: [{ ...antigo, marcial: false }] })).tecnicasMarciais.ids, []);
t("o Feitiço marcado numa ficha comum continua marcial",
  deriveAfty(ficha({ origem: "herdado", tipo: "conjurador", classe: "conjurador", feiticos: [{ ...antigo, marcial: true }] })).tecnicasMarciais.ids, ["f1"]);
t("a Técnica marcial não bloqueia pela Técnica Inata nem pela Exaustão",
  rMig.tecnicasMarciais.lista[0].bloqueado, undefined);

/* 9c. O orçamento. Criatura: contador comum. Personagem: a progressão do livro. */
const cinco = ["a", "b", "c", "d", "e"].map((id) => passivoMarcial(id));
const semNada = deriveAfty(ficha());
const criaturaCom5 = deriveAfty(ficha({ feiticos: cinco }));
t("criatura: as Técnicas gastam o contador comum",
  criaturaCom5.orcamentoHabilidades.gastosNoComum - semNada.orcamentoHabilidades.gastosNoComum, 5);
t("criatura: sem caixa próprio", [criaturaCom5.orcamentoHabilidades.proprioMarcialAtivo, criaturaCom5.orcamentoHabilidades.proprioMarcial], [false, 0]);
t("criatura: o total do contador sobe só pela vaga exclusiva (nenhuma)",
  criaturaCom5.orcamentoHabilidades.total, semNada.orcamentoHabilidades.total);

const jogador = (nd, n, extra = {}) => deriveAfty(ficha({ sistema: "player", nd, feiticos: cinco.slice(0, n), ...extra }));
t("jogador: o caixa é a progressão do livro (nível 5: 4)", jogador(5, 0).orcamentoHabilidades.proprioMarcial, 4);
t("jogador: nível 1 tem 2, nível 3 tem 3, nível 19 tem 11",
  [1, 3, 19].map((n) => jogador(n, 0).orcamentoHabilidades.proprioMarcial), [2, 3, 11]);
t("jogador: as parcelas do hover", jogador(5, 0).orcamentoHabilidades.proprioMarcialPartes.map((p) => p.label), ["Inicial", "Níveis Ímpares"]);
const j4 = jogador(5, 4);
t("jogador: 4 Técnicas cabem no nível 5", [j4.orcamentoHabilidades.proprioMarcialUsado, j4.orcamentoHabilidades.excedeuMarcial], [4, false]);
const j5 = jogador(5, 5);
t("jogador: a quinta estoura, e só avisa", j5.orcamentoHabilidades.excedeuMarcial, true);
t("jogador: o excesso NÃO transborda para o contador comum",
  j5.orcamentoHabilidades.gastosNoComum, jogador(5, 0).orcamentoHabilidades.gastosNoComum);
t("jogador: o personagem que não é Restringido não ganha o caixa",
  deriveAfty(ficha({ sistema: "player", nd: 5, origem: "herdado", tipo: "conjurador", classe: "conjurador" })).orcamentoHabilidades.proprioMarcial, 0);

/* Desenvolver Ideias: +2 vagas EXCLUSIVAS de Técnica Marcial, nos dois sistemas. */
const di = (sistema, nd) => deriveAfty(ficha({ sistema, nd, extra: { habilidades: nd >= 4 ? ["res_desenvolver_ideias"] : [] } }));
t("Desenvolver Ideias dá 2 vagas exclusivas a partir do nível 4",
  ["afty", "player"].map((s) => [di(s, 3).orcamentoHabilidades.exclusivasMarcial, di(s, 4).orcamentoHabilidades.exclusivasMarcial]),
  [[0, 2], [0, 2]]);
t("jogador no nível 5: 4 da progressão e 2 da habilidade seguram 6 Técnicas",
  (() => {
    const seis = ["a", "b", "c", "d", "e", "f"].map((id) => passivoMarcial(id));
    const d = deriveAfty(ficha({ sistema: "player", nd: 5, feiticos: seis, extra: { habilidades: ["res_desenvolver_ideias"] } }));
    return [d.orcamentoHabilidades.excedeuMarcial, d.orcamentoHabilidades.exclusivasMarcialUsadas];
  })(), [false, 2]);
t("a vaga marcial não serve para Feitiço",
  (() => {
    const c = ficha({ origem: "herdado", tipo: "conjurador", classe: "conjurador", nd: 12, feiticos: [] });
    return deriveAfty(c).orcamentoHabilidades.exclusivasMarcial;
  })(), 0);

/* 9d. A família do pool e a origem das linhas (decisão: fora da Técnica Inata e da Exaustão). */
t("a família tecnicaMarcial existe e cai no grupo dos Feitiços do jogador",
  [EF.getFamiliaExclusiva("tecnicaMarcial")?.grupoJogador, EF.getFamiliaExclusiva("tecnicaMarcial")?.modo], ["feiticos", "ambos"]);
const passivaComEfeito = (marcial, extra = {}) => ({
  ...FE.createBlankFeitico(), id: "p1", tipo: "passivo", nome: "Guarda", marcial,
  efeitosPassivo: [{ canal: "rdGeral", expr: "3" }], ...extra,
});
t("a Passiva marcial sai com origem e família próprias",
  EF.efeitosDosPassivos({ feiticos: [passivaComEfeito(true)] }).map((e) => [e.origem, e.exclusivo]),
  [["tecnicaMarcial:p1", "tecnicaMarcial"]]);
t("a Passiva de Feitiço segue como era",
  EF.efeitosDosPassivos({ feiticos: [passivaComEfeito(false)] }).map((e) => [e.origem, e.exclusivo]),
  [["feitico:p1", "feiticoAuxiliarPassivo"]]);
t("o Motor livre da Passiva marcial não escreve atributo",
  EF.efeitosDosPassivos({ feiticos: [passivaComEfeito(true, { efeitosPassivo: [
    { canal: "atributo", expr: "2", alvo: "forca" }, { canal: "limiteAtributo", expr: "2", alvo: "forca" }, { canal: "defesa", expr: "1" }] })] })
    .map((e) => e.canal), ["defesa"]);
t("e a Passiva de Feitiço escreve",
  EF.efeitosDosPassivos({ feiticos: [passivaComEfeito(false, { efeitosPassivo: [{ canal: "atributo", expr: "2", alvo: "forca" }] })] }).length, 1);
t("a Passiva marcial soma RD na ficha", deriveAfty(ficha({ feiticos: [passivaComEfeito(true)] })).rdGeral, semNada.rdGeral + 3);

/* 9e. O custo da Passiva em PE Máximo: o do Feitiço (decisão 13), 2 vezes o nível no jogador. */
const passiva2 = (marcial) => ({ ...passivaComEfeito(marcial, { efeitosPassivo: [], nivel: 2 }) });
const peDe = (sistema, feiticos) => deriveAfty(ficha({ sistema, nd: 12, feiticos })).pe;
t("jogador: a Passiva marcial de Nível 2 tira 4 do PE Máximo",
  peDe("player", []) - peDe("player", [passiva2(true)]), 4);
t("criatura: a Passiva marcial é de graça", peDe("afty", []) - peDe("afty", [passiva2(true)]), 0);

/* 9f. O Fundamento Marcial é o Funcionamento principal com outro nome. */
const comNome = ficha(); comNome.core.estiloMarcialNome = "Muay Thai";
t("o título do Fundamento", [rest.tecnicasMarciais.fundamento, deriveAfty(comNome).tecnicasMarciais.fundamento.titulo],
  [{ mostra: true, titulo: "Estilo Marcial" }, "Muay Thai"]);
t("quem não é Restringido não mostra Fundamento",
  conjurador.tecnicasMarciais.fundamento.mostra, false);
const comFundamento = ficha(); comFundamento.core.tecnicaEfeitos = [{ canal: "defesa", expr: "2" }];
t("o efeito do Fundamento aparece como Fundamento Marcial no hover",
  deriveAfty(comFundamento).efeitos.detalhes.some((d) => d.canal === "defesa" && d.nome === "Fundamento Marcial"), true);

/* 9g. A Técnica de Ataque na linha de arma. */
const armadoComKatana = (extra = {}) => ficha({
  feiticos: [tecnica("ataque", { id: "t1", nome: "Golpe", nivel: 3, efeitosAtaque: ["acerto"], ataquesReduzidos: 2, ...extra })],
  extra: { equipamentos: { itens: [{ uid: "e2", tipo: "arma", refId: "arm_katana", qtd: 1, equipado: true }] } },
});
const dArmado = deriveAfty(armadoComKatana());
const atq = dArmado.tecnicasMarciais.ataques.t1;
t("a Técnica de Ataque tem uma linha por arma e o Ataque Básico",
  atq.linhas.map((l) => l.linhaId), ["basico", "arm_katana"]);
const basicoBruto = dArmado.dano.entradas.find((e) => e.id === "basico");
t("o acerto da linha soma +7", atq.linhas[0].demais.acerto - basicoBruto.acerto, 7);
t("o nome da Técnica aparece no hover do acerto", atq.linhas[0].demais.partesAcerto.at(-1), { label: "Golpe", valor: 7 });
const comDano = deriveAfty(armadoComKatana({ efeitosAtaque: ["dano"] })).tecnicasMarciais.ataques.t1.linhas[0].demais;
t("o Dano Adicional (36) entra como grupo FIXO, que não dobra no crítico",
  comDano.gruposDano.at(-1), { nome: "Golpe", dados: 0, faces: 6, fixo: 36, momento: "durante", multiplica: false, naPartes: true });
/* O fixo sobe 36 na fórmula normal e na crítica, e o dado dobra: o fixo nunca dobra. */
const fixoFinal = (f) => Number(String(f).match(/(\d+)$/)?.[1] ?? 0);
t("o fixo soma 36 na normal e na crítica, e não dobra",
  [fixoFinal(comDano.formulaNormal) - fixoFinal(basicoBruto.formulaNormal),
    fixoFinal(comDano.formulaCritico) - fixoFinal(basicoBruto.formulaCritico)], [36, 36]);
t("na criatura o total e o fixo da linha sobem junto, e o hover lista a Técnica uma vez",
  [comDano.total - basicoBruto.total, comDano.fixo - basicoBruto.fixo,
    comDano.hoverDano.partes.filter((p) => p.label === "Golpe").length], [36, 36, 1]);
t("no personagem o grupo é listado pelo hover, uma vez",
  (() => {
    const c = armadoComKatana({ efeitosAtaque: ["dano"] }); c.rulesVersion = "player";
    const l = deriveAfty(c).tecnicasMarciais.ataques.t1.linhas[0].demais;
    return l.hoverDano.partes.filter((p) => p.label === "Golpe").length;
  })(), 1);
const comRd = deriveAfty(armadoComKatana({ efeitosAtaque: ["rd"] })).tecnicasMarciais.ataques.t1.linhas[0].demais;
t("a RD ignorada soma", comRd.ignoraRD - (basicoBruto.ignoraRD ?? 0), 22);
t("a linha original do Ataque Básico não muda", dArmado.dano.entradas.find((e) => e.id === "basico").acerto, basicoBruto.acerto);
t("a Técnica de Ataque tem o contador de ataques na linha", dArmado.tecnicasMarciais.lista[0].ataque.ataques, 1);
t("e as propriedades da linha trazem a Condição quando há",
  (() => {
    const d = deriveAfty(ficha({ feiticos: [tecnica("ataque", { id: "t2", nivel: 2, efeitosAtaque: ["condicao"],
      condicoesAtaque: { fraca: "Abalado", media: "Amedrontado" }, trCondicaoAtaque: "fortitude" })] }));
    return d.tecnicasMarciais.lista[0].propriedades.find((p) => p.id === "condicaoEscada")?.valor;
  })(), "1 Acerto: Abalado (Fraca, 2 rodadas) · 2 Acertos: Amedrontado (Média, 1 rodada)");

/* ============================================================ */
/* 10. ELEMENTALISTA E AMPLIFICADORA NO PRIMEIRO ATAQUE          */
/* ============================================================ */
/* Livro, p. 156 e 348: "um Feitiço ou técnica marcial", só no primeiro ataque, Após
   Ataque. O dado do Elementalista saiu das linhas de arma (t-extras-nativos). */
const comAliado = (grad, extra = {}) => ficha({
  nd: 13,
  feiticos: [tecnica("ataque", { id: "t1", nome: "Golpe", nivel: 2, efeitosAtaque: ["acerto"] })],
  extra: { combate: { ativo: true, aliados_escolhidos: ["elementalista"], aliados_elementalista: grad,
    aliados_golpe_elementalista: true, ...(extra.combate ?? {}) }, ...(extra.resto ?? {}) },
});
const elem = deriveAfty(comAliado("mestre")).tecnicasMarciais.ataques.t1.linhas[0];
t("o Elementalista entra no PRIMEIRO ataque da Técnica, Após Ataque",
  elem.primeiro.gruposDano.filter((g) => g.nome === "Aliado Elementalista"),
  [{ nome: "Aliado Elementalista", dados: 5, faces: 12, fixo: 0, momento: "apos", multiplica: false }]);
t("e não entra nos ataques seguintes",
  elem.demais.gruposDano.some((g) => g.nome === "Aliado Elementalista"), false);
t("a linha do Ataque Básico da Ficha também não o leva",
  deriveAfty(comAliado("mestre")).dano.entradas.find((e) => e.id === "basico").gruposDano.some((g) => g.nome === "Aliado Elementalista"), false);
t("sem o interruptor do golpe da rodada não há dado",
  deriveAfty(comAliado("mestre", { combate: { aliados_golpe_elementalista: false } }))
    .tecnicasMarciais.ataques.t1.linhas[0].primeiro.gruposDano.some((g) => g.nome === "Aliado Elementalista"), false);
t("o dado do Após Ataque não dobra no crítico nem entra na fórmula do crítico dobrada",
  elem.primeiro.formulaCritico.includes("5d12") && !elem.primeiro.formulaCritico.includes("10d12"), true);

/* O Feitiço de Dano ganha a rolagem à parte, na primeira rolagem. */
const feiticoDano = { ...FE.createBlankFeitico(), id: "fd1", nome: "Rajada", tipo: "dano", nivel: 2 };
const conjurador13 = (extraCombate) => {
  const c = ficha({
    nd: 13, origem: "herdado", tipo: "conjurador", classe: "conjurador", feiticos: [feiticoDano],
    extra: { combate: { ativo: true, aliados_escolhidos: ["elementalista"], aliados_elementalista: "veterano",
      aliados_golpe_elementalista: true, ...extraCombate } },
  });
  return c;
};
const linhaFd = deriveAfty(conjurador13({})).feiticos.lista.find((f) => f.id === "fd1");
t("o Feitiço de Dano ganha a rolagem do Elementalista, à parte",
  linhaFd.rolagens.filter((r) => r.rotulo === "Elementalista (Após Ataque)").map((r) => [r.dados, r.faces, r.aposAtaque]),
  [[3, 10, true]]);
t("e a rolagem do Feitiço em si segue como era", linhaFd.rolagens[0].rotulo !== "Elementalista (Após Ataque)", true);
t("sem o interruptor o Feitiço não ganha rolagem extra",
  deriveAfty(conjurador13({ aliados_golpe_elementalista: false })).feiticos.lista.find((f) => f.id === "fd1").rolagens
    .some((r) => r.rotulo === "Elementalista (Após Ataque)"), false);
t("o Feitiço que não é de Dano não ganha",
  (() => {
    const c = conjurador13({}); c.feiticos = [{ ...FE.createBlankFeitico(), id: "fa", tipo: "auxiliar", nivel: 1 }];
    return deriveAfty(c).feiticos.lista[0].rolagens.some((r) => r.aposAtaque);
  })(), false);

/* A Amplificadora: metade do BT em dados, no dado da linha, só no primeiro ataque. */
const comFaixas = (ligada) => ficha({
  nd: 13,
  feiticos: [tecnica("ataque", { id: "t1", nome: "Golpe", nivel: 2, efeitosAtaque: [] })],
  extra: {
    equipamentos: { itens: [{ uid: "f1", tipo: "arma", refId: "arm_faixas", qtd: 1, equipado: true,
      fa: { grau: "especial", encantamentos: ["enc_arma_amplificadora"], habilidadeUnica: "" } }] },
    combate: { ativo: true, ...(ligada ? { amplificadora: true } : {}) },
  },
});
const dAmp = deriveAfty(comFaixas(true));
const bt13 = dAmp.maestria;
const ampPrimeiro = dAmp.tecnicasMarciais.ataques.t1.linhas[0].primeiro.gruposDano.find((g) => g.nome === "Amplificadora");
t("a Amplificadora soma metade do BT em dados, Após Ataque, no primeiro ataque",
  ampPrimeiro && [ampPrimeiro.dados, ampPrimeiro.momento, ampPrimeiro.multiplica], [Math.floor(bt13 / 2), "apos", false]);
t("o interruptor existe só com a arma equipada",
  [dAmp.combate.estadosExtras.some((e) => e.id === "amplificadora"), deriveAfty(ficha()).combate.estadosExtras.some((e) => e.id === "amplificadora")],
  [true, false]);
t("desligada não soma", deriveAfty(comFaixas(false)).tecnicasMarciais.ataques.t1.linhas[0].primeiro.gruposDano.some((g) => g.nome === "Amplificadora"), false);
t("os ataques seguintes não a levam",
  dAmp.tecnicasMarciais.ataques.t1.linhas[0].demais.gruposDano.some((g) => g.nome === "Amplificadora"), false);
t("a Ficha sabe qual interruptor desligar depois do primeiro ataque", dAmp.tecnicasMarciais.consomeEstadoNoPrimeiro, "amplificadora");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
