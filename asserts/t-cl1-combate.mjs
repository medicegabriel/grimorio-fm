/* O COMBATE DO CL1 (2026-10-29): ataque com alvo, TR, dano recebido na ordem do livro, eventos, sequência de ataques,
   ações e concentração. Arquivos: `ficha/ficha-ataque.js`, `ficha-dano-recebido.js`, `ficha-combate-eventos.js`,
   `ficha-acoes.js`, `ficha-concentracao.js`, `ficha-uso-estado.js`.

   Cada número vem do livro, com a página no nome do caso. A Sequência de Ataques, o dano e a concentração rodam com
   o `deriveAfty` e a sessão reais, nos DOIS sistemas (criatura e personagem). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const A = await import(R + "ficha/ficha-ataque.js");
const D = await import(R + "ficha/ficha-dano-recebido.js");
const EV = await import(R + "ficha/ficha-combate-eventos.js");
const AC = await import(R + "ficha/ficha-acoes.js");
const C = await import(R + "ficha/ficha-concentracao.js");
const U = await import(R + "ficha/ficha-uso.js");
const { usoDoEstado: usoDoEstadoParaTeste } = await import(R + "ficha/ficha-uso-clientes.js");
const E = await import(R + "ficha/ficha-uso-estado.js");
const Rol = await import(R + "ficha/ficha-rolagem.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* o d20 que cai: rng de 0 a 1 que dá `n` no dado de 20 faces */
const d20 = (n) => () => (n - 0.5) / 20;
const teste = (natural, bonus, extra = {}) => Rol.rolarTeste({ rotulo: "Ataque", bonus, tipoTeste: "ataque", ...extra }, d20(natural));

const ficha = (sistema, extra = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  // A criatura deste arquivo é a ANTIGA (Alma em porcentagem, com o Addon já ligado). A nova segue o livro, como o jogador.
  if (sistema === "afty") delete c.regimeAlma;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 };
  return Object.assign(c, extra);
};
const derivaDe = (f, s) => deriveAfty({ ...f, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const nova = (f) => { const d = deriveAfty({ ...f, combate: { ativo: true } }); return { d, s: { ...S.sessaoEmBranco(d), combate: { ativo: true }, rodada: 1 } }; };
const op = () => ({ opId: U.novaOperacao() });

/* ============================================================ */
/* A. ATAQUE COM ALVO DECLARADO                                  */
/* ============================================================ */
{
  const ata = (rolagem, alvo, o = {}) => A.resolveAtaque({ rolagem, alvo, ...o });
  const vistas = (r) => [r.acertou, r.critico, r.desastre, r.motivo];
  t("p.279: o total igual à Defesa acerta", vistas(ata(teste(10, 5), { defesa: 15 })), [true, false, false, "defesa"]);
  t("p.279: um abaixo da Defesa erra", vistas(ata(teste(9, 5), { defesa: 15 })), [false, false, false, "defesa"]);
  t("p.307: o 20 natural acerta e é crítico contra Defesa 100", vistas(ata(teste(20, 0), { defesa: 100 })), [true, true, false, "natural20"]);
  t("p.307: o 1 natural erra e é desastre contra Defesa 10, mesmo com +100", vistas(ata(teste(1, 100), { defesa: 10 })), [false, false, true, "natural1"]);
  t("p.307: o desastre abre o ataque de reação contra o atacante", ata(teste(1, 0), { defesa: 10 }, { atacante: { id: "a1", nome: "Atacante" } }).oportunidades, [{ tipo: "ataque-de-reacao", contra: "a1", nome: "Atacante" }]);
  t("p.307: margem 19 com o 19 que acerta pela Defesa é crítico", vistas(ata(teste(19, 5, { margem: 19 }), { defesa: 20 }, { margem: 19 })), [true, true, false, "defesa"]);
  t("p.307: margem 19 com o 19 que NÃO acerta pela Defesa erra e não é crítico", vistas(ata(teste(19, 0, { margem: 19 }), { defesa: 30 }, { margem: 19 })), [false, false, false, "defesa"]);
  t("sem a Defesa do alvo o resultado fica pendente, nunca chutado", (({ acertou, pendente }) => [acertou, pendente])(ata(teste(12, 3), {})), [null, "defesa"]);
  t("sem a rolagem recusa", ata(null, { defesa: 10 }).codigo, "sem-rolagem");
  t("categoria desconhecida recusa", ata(teste(10, 0), { defesa: 10 }, { categoria: "voo" }).codigo, "categoria-desconhecida");
  // cobertura e flanco (p.294 e p.295)
  t("p.294: meia cobertura soma 2 à Defesa", [ata(teste(10, 4), { defesa: 14, cobertura: "meia" }).acertou, ata(teste(10, 4), { defesa: 14, cobertura: "meia" }).defesa], [false, 16]);
  t("p.294: cobertura 3/4 soma 4", ata(teste(10, 4), { defesa: 10, cobertura: "tres_quartos" }).defesa, 14);
  t("p.294: cobertura total impede o ataque direto", ata(teste(10, 4), { defesa: 10, cobertura: "total" }).codigo, "cobertura-total");
  t("p.295: o flanco tira 2 da Defesa", [ata(teste(10, 2), { defesa: 14, flanqueado: true }).acertou, ata(teste(10, 2), { defesa: 14, flanqueado: true }).defesa], [true, 12]);
  t("cobertura e flanco aparecem como ajustes", ata(teste(10, 2), { defesa: 14, cobertura: "meia", flanqueado: true }).ajustes, [{ id: "cobertura:meia", valor: 2 }, { id: "flanco", valor: -2 }]);
  // camuflagem (p.294): o d10 vem da mesa e derruba até o 20 natural
  t("p.294: camuflagem sem o d10 deixa pendente", ata(teste(10, 9), { defesa: 10, camuflagem: "leve" }).pendente, "camuflagem");
  t("p.294: camuflagem leve com 1 ou 2 no d10 erra, mesmo no 20 natural", [ata(teste(20, 0), { defesa: 10, camuflagem: "leve" }, { camuflagemD10: 2 }).acertou, ata(teste(20, 0), { defesa: 10, camuflagem: "leve" }, { camuflagemD10: 2 }).motivo], [false, "camuflagem"]);
  t("p.294: camuflagem leve com 3 no d10 resolve como sempre", ata(teste(20, 0), { defesa: 10, camuflagem: "leve" }, { camuflagemD10: 3 }).acertou, true);
  t("p.294: camuflagem total erra até 5 e acerta a partir de 6", [ata(teste(15, 5), { defesa: 10, camuflagem: "total" }, { camuflagemD10: 5 }).acertou, ata(teste(15, 5), { defesa: 10, camuflagem: "total" }, { camuflagemD10: 6 }).acertou], [false, true]);
  t("camuflagem inventada recusa", ata(teste(10, 0), { defesa: 10, camuflagem: "densa" }).codigo, "camuflagem-desconhecida");
  // resultado informado pela mesa
  t("informado: sem Defesa a mesa decide o acerto", [ata(teste(12, 0), {}, { informado: "acerto" }).acertou, ata(teste(12, 0), {}, { informado: "acerto" }).motivo], [true, "informado"]);
  t("informado: não contradiz o 20 natural", ata(teste(20, 0), { defesa: 100 }, { informado: "erro" }).codigo, "informado-contradiz");
  t("informado: um crítico por margem exige acerto informado", ata(teste(19, 0), {}, { informado: "acerto", margem: 19 }).critico, true);
  t("criticoSeAcertar (Inconsciente, p.318) vem da mesa", ata(teste(5, 0), { defesa: 5 }, { criticoSeAcertar: true }).critico, true);
  // rerrolagem que fica com o melhor (Armas Absolutas)
  const m = A.melhorRolagem(teste(5, 3), teste(15, 3));
  t("melhor de duas: fica a maior e a menor é a descartada", [m.escolhida.natural, m.descartada.natural], [15, 5]);
  t("melhor de duas: empate fica a primeira", A.melhorRolagem({ total: 10, id: "a" }, { total: 10, id: "b" }).escolhida.id, "a");
  // o TR
  const tr = (cd, rol) => A.resolveTR({ cd, rolagem: rol });
  t("TR: igual à CD é sucesso", tr(15, { total: 15 }).resultado, "sucesso");
  t("TR: abaixo é falha", tr(15, { total: 14 }).resultado, "falha");
  t("TR: sucesso com 20 natural é sucesso crítico", tr(15, Rol.rolarTeste({ rotulo: "TR", bonus: 0, cd: 15 }, d20(20))).sucessoCritico, true);
  t("TR: falha com 1 natural é falha crítica", tr(15, Rol.rolarTeste({ rotulo: "TR", bonus: 0, cd: 15 }, d20(1))).falhaCritica, true);
  t("TR: sem CD recusa", A.resolveTR({ rolagem: { total: 1 } }).codigo, "sem-cd");
}

/* ============================================================ */
/* B. DANO RECEBIDO, A CONTA                                     */
/* ============================================================ */
{
  const def = (estados, rd = 0, conflito = false) => ({ estados, rd, conflito });
  const c = (o) => D.calculaDanoRecebido(o);
  t("p.309: vulnerável a 30 de dano recebe 45", c({ total: 30, defesa: def(["vulneravel"]) }).final, 45);
  t("p.365: RD 4, 20 de dano, falha no TR que reduziria à metade: 16", c({ total: 20, defesa: def([], 4), tr: { resultado: "falha", efeito: "metade" } }).final, 16);
  t("p.365: o mesmo com o TR passado: 6", c({ total: 20, defesa: def([], 4), tr: { resultado: "sucesso", efeito: "metade" } }).final, 6);
  t("p.365: 11 reduzidos à metade são 5 (piso)", c({ total: 11, defesa: def(["resistente"]) }).final, 5);
  t("p.309: imunidade anula tudo, RD incluída", c({ total: 50, defesa: def(["imune"], 9) }).final, 0);
  t("p.309: resistente com RD: a metade vem antes (20 vira 10, menos 3)", c({ total: 20, defesa: def(["resistente"], 3) }).final, 7);
  t("p.309: vulnerável com RD: 30 vira 45 e a RD ainda desconta (41)", c({ total: 30, defesa: def(["vulneravel"], 4) }).final, 41);
  t("a RD não deixa o dano negativo", c({ total: 3, defesa: def([], 10) }).final, 0);
  t("o TR que anula zera", c({ total: 30, tr: { resultado: "sucesso", efeito: "anula" } }).final, 0);
  t("o TR com efeito nenhum não mexe", c({ total: 30, tr: { resultado: "sucesso", efeito: "nenhum" } }).final, 30);
  t("TR e Resistência se compõem: 30, metade, metade, 7", c({ total: 30, defesa: def(["resistente"]), tr: { resultado: "sucesso", efeito: "metade" } }).final, 7);
  t("a RD que o ataque ignora (Penetrante) abate da RD", c({ total: 20, defesa: def([], 6), rdIgnorada: 4 }).final, 18);
  t("a RD ignorada não passa de zero", c({ total: 20, defesa: def([], 2), rdIgnorada: 9 }).final, 20);
  t("os passos dizem só o que mexeu, na ordem", c({ total: 30, defesa: def(["resistente"], 3), tr: { resultado: "sucesso", efeito: "metade" } }).passos.map((p) => [p.id, p.de, p.para]), [["tr", 30, 15], ["resistencia", 15, 7], ["reducao", 7, 4]]);
  const conf = c({ total: 20, defesa: def(["resistente", "vulneravel"], 0, true) });
  t("conflito sem desempate é recusado, e não escolhido", [conf.ok, conf.codigo], [false, "defesa-conflito"]);
  t("a mesa desempata pela resistência", c({ total: 20, defesa: def(["resistente", "vulneravel"], 0, true), desempate: "resistente" }).final, 10);
  t("a mesa desempata por nenhum", c({ total: 20, defesa: def(["resistente", "vulneravel"], 0, true), desempate: "nenhum" }).final, 20);
  t("desempate inventado recusa", c({ total: 20, desempate: "empate" }).codigo, "desempate-desconhecido");
  t("sem defesa nenhuma o dano passa inteiro", c({ total: 17 }).final, 17);
  t("dano negativo ou fracionário vira inteiro não negativo", [c({ total: -5 }).final, c({ total: 7.9 }).final], [0, 7]);
  // Dano na Alma (p.311)
  const al = (tr) => D.calculaDanoNaAlma({ total: 41, tr }).final;
  t("p.311: sem TR passado a Alma recebe tudo", al({ resultado: "falha" }), 41);
  t("p.311: TR de Integridade passado reduz à metade", al({ resultado: "sucesso" }), 20);
  t("p.311: sucesso crítico anula", al({ resultado: "sucesso", sucessoCritico: true }), 0);
  // A Alma passa pelas defesas do tipo alma (estados e RD a Alma) ANTES do TR de Integridade (p.311, "o total após qualquer resistência ou redução")
  t("Alma: sem defesa e sem TR passa inteira", D.calculaDanoNaAlma({ total: 41 }).final, 41);
  t("Alma: a RD a Alma desconta e depois o TR passado divide (41, RD 5, 36, 18)", D.calculaDanoNaAlma({ total: 41, defesa: def([], 5), tr: { resultado: "sucesso" } }).final, 18);
  t("Alma: sem o TR passado só a RD vale", D.calculaDanoNaAlma({ total: 41, defesa: def([], 5), tr: { resultado: "falha" } }).final, 36);
  t("Alma: resistente divide, a RD desconta, o TR divide (41, 20, 15, 7)", D.calculaDanoNaAlma({ total: 41, defesa: def(["resistente"], 5), tr: { resultado: "sucesso" } }).passos.map((p) => p.para), [20, 15, 7]);
  t("Alma: imunidade zera e o TR nem entra", D.calculaDanoNaAlma({ total: 41, defesa: def(["imune"], 5), tr: { resultado: "sucesso" } }).passos.map((p) => p.id), ["imunidade"]);
  t("Alma: vulnerável soma a metade antes da RD", D.calculaDanoNaAlma({ total: 30, defesa: def(["vulneravel"], 4) }).final, 41);
  t("Alma: o sucesso crítico anula depois das defesas", D.calculaDanoNaAlma({ total: 41, defesa: def([], 5), tr: { resultado: "sucesso", sucessoCritico: true } }).final, 0);
  t("Alma: conflito de estados é recusado como no dano comum", D.calculaDanoNaAlma({ total: 10, defesa: def(["resistente", "vulneravel"], 0, true) }).codigo, "defesa-conflito");
}

/* ============================================================ */
/* C. DANO RECEBIDO NA SESSÃO, NOS DOIS SISTEMAS                  */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema, { defesasDano: { queimante: { estado: "imune", rd: 0 }, ct: { estado: "resistente", rd: 3 }, im: { estado: "vulneravel", rd: 0 } } });
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: ${n}`;
  const hp0 = s.hpAtual;
  // A criatura (Afty) traz RD Geral própria: a RD de cada tipo vem do derive, e é ela que a conta tem de usar.
  const rdCt = d.defesasDano.porTipo.ct.rd;
  const rdIm = d.defesasDano.porTipo.im.rd;
  t(rot("o derive entrega as defesas por tipo, com a RD Geral dentro"), [d.defesasDano.porTipo.queimante.estados, rdCt >= 3, rdIm >= 0], [["imune"], true, true]);

  const imune = D.aplicaDanoRecebido(s, d, { tipo: "queimante", total: 30 }, op());
  t(rot("imunidade: 30 de queimante não tiram nada"), [imune.aplicado, imune.sessao.hpAtual, imune.calculo.final], [true, hp0, 0]);
  const corte = D.aplicaDanoRecebido(s, d, { tipo: "ct", total: 20 }, op());
  t(rot("cortante: 20, metade e a RD do tipo"), [corte.calculo.final, corte.sessao.hpAtual], [Math.max(0, 10 - rdCt), hp0 - Math.max(0, 10 - rdCt)]);
  const impacto = D.aplicaDanoRecebido(s, d, { tipo: "im", total: 30 }, op());
  t(rot("impacto vulnerável: 30 viram 45 e a RD do tipo desconta"), [impacto.calculo.final, impacto.sessao.hpAtual], [Math.max(0, 45 - rdIm), hp0 - Math.max(0, 45 - rdIm)]);
  t(rot("tipo inexistente recusa e a sessão é a mesma"), [D.aplicaDanoRecebido(s, d, { tipo: "gravidade", total: 5 }, op()).codigo, D.aplicaDanoRecebido(s, d, { tipo: "gravidade", total: 5 }, op()).sessao === s], ["tipo-desconhecido", true]);
  t(rot("sem opId recusa"), D.aplicaDanoRecebido(s, d, { tipo: "ct", total: 5 }, {}).codigo, "sem-opid");
  t(rot("modo desconhecido recusa"), D.aplicaDanoRecebido(s, d, { modo: "eco", total: 5 }, op()).codigo, "modo-desconhecido");

  // as TRÊS operações são distintas sobre a mesma sessão com 6 de casca
  const comCasca = { ...s, pvTempFontes: { Escudo: 6 } };
  const dano = D.aplicaDanoRecebido(comCasca, d, { modo: "dano", total: 10 }, op());
  t(rot("dano: a casca absorve primeiro (10: 6 na casca e 4 na vida)"), [dano.sessao.pvTempFontes, dano.sessao.hpAtual, dano.mudou.casca, dano.mudou.vida], [{}, hp0 - 4, -6, -4]);
  const perda = D.aplicaDanoRecebido(comCasca, d, { modo: "perdaDeVida", total: 10 }, op());
  t(rot("perda de vida: ignora a casca e as defesas"), [perda.sessao.pvTempFontes, perda.sessao.hpAtual], [{ Escudo: 6 }, hp0 - 10]);
  const perdaImune = D.aplicaDanoRecebido(comCasca, d, { modo: "perdaDeVida", tipo: "queimante", total: 10 }, op());
  t(rot("perda de vida: nem a imunidade do tipo a barra (p.316)"), perdaImune.sessao.hpAtual, hp0 - 10);
  const alma = D.aplicaDanoRecebido(comCasca, d, { modo: "alma", total: 10 }, op());
  t(rot("dano na alma: não toca a casca"), alma.sessao.pvTempFontes, { Escudo: 6 });
  t(rot("dano na alma: a Alma desce 10"), alma.sessao.almaAtual, s.almaAtual - 10);
  t(rot("dano na alma: a Vida só desce no regime de pilha (personagem)"), alma.sessao.hpAtual, sistema === "player" ? hp0 - 10 : hp0);
  const almaTipo = D.aplicaDanoRecebido(s, d, { tipo: "alma", total: 10, tr: { resultado: "sucesso" } }, op());
  t(rot("tipo alma vai para o dano na alma, com o TR de Integridade antes"), [almaTipo.calculo.final, almaTipo.sessao.almaAtual], [5, s.almaAtual - 5]);

  // identidade
  const id = op();
  const um = D.aplicaDanoRecebido(s, d, { tipo: "ct", total: 20 }, id);
  const dois = D.aplicaDanoRecebido(um.sessao, d, { tipo: "ct", total: 20 }, id);
  t(rot("o mesmo opId não aplica o dano de novo"), [dois.repetida, dois.sessao === um.sessao, um.sessao.hpAtual], [true, true, hp0 - Math.max(0, 10 - rdCt)]);

  // excesso sobre zero e abate (o saldo negativo é do CL2)
  const baixo = { ...s, hpAtual: 5 };
  const queda = D.aplicaDanoRecebido(baixo, d, { tipo: "ct", total: 400 }, op());
  t(rot("queda: abateu, a vida para em zero e o excesso fica à vista"), [queda.abateu, queda.sessao.hpAtual, queda.excessoSobreZero], [true, 0, 200 - rdCt - 5]);
  const comCascaQueda = D.aplicaDanoRecebido({ ...baixo, pvTempFontes: { Escudo: 10 } }, d, { modo: "perdaDeVida", total: 12 }, op());
  t(rot("perda de vida em zero: o excesso não conta a casca"), [comCascaQueda.excessoSobreZero, comCascaQueda.sessao.pvTempFontes], [7, { Escudo: 10 }]);
  t(rot("sem dano nada muda e conta como aplicado"), (({ aplicado, sessao }) => [aplicado, sessao.hpAtual])(D.aplicaDanoRecebido(s, d, { tipo: "ct", total: 0 }, op())), [true, hp0]);

  // dano recebido abre o teste de concentração (p.320), perda de vida e alma não
  const concentrada = { ...s, ...{ uso: { ...s.uso, concentracao: { id: "x", nome: "Efeito X", ritualFeiticoId: null, desde: 1 } } } };
  const t1 = D.aplicaDanoRecebido(concentrada, d, { tipo: "ct", total: 60 }, op());
  t(rot("dano: o teste pendente é o mesmo que o retorno informa"), [t1.teste?.cd, t1.sessao.uso.teste?.cd], [Math.max(10, Math.floor(t1.calculo.final / 2)), Math.max(10, Math.floor(t1.calculo.final / 2))]);
  for (const total of [8, 21, 60, 200]) {
    const r = D.aplicaDanoRecebido(concentrada, d, { tipo: "ct", total }, op());
    t(rot(`dano ${total}: a CD é 10 ou a metade do recebido, o que for maior`), r.teste?.cd, r.calculo.final > 0 ? Math.max(10, Math.floor(r.calculo.final / 2)) : undefined);
  }
  t(rot("dano zerado pela imunidade não abre teste"), D.aplicaDanoRecebido(concentrada, d, { tipo: "queimante", total: 60 }, op()).teste, undefined);
  t(rot("perda de vida não abre teste (não é dano)"), D.aplicaDanoRecebido(concentrada, d, { modo: "perdaDeVida", total: 60 }, op()).teste, undefined);
  t(rot("a opção concentracao false não abre teste"), D.aplicaDanoRecebido(concentrada, d, { tipo: "ct", total: 60, concentracao: false }, op()).teste, undefined);
  t(rot("sem concentração não há o que testar"), D.aplicaDanoRecebido(s, d, { tipo: "ct", total: 60 }, op()).teste, undefined);
}

/* ============================================================ */
/* D. PENDÊNCIAS DO PRÓXIMO ATAQUE E SEQUÊNCIA DE ATAQUES         */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: ${n}`;
  const acerto = (extra = {}) => ({ acertou: true, critico: false, desastre: false, categorias: ["arma", "corpo"], alvo: { id: "g1" }, ...extra });
  const erro = (extra = {}) => ({ ...acerto(extra), acertou: false });

  // Canalizar em Golpe (p.178): serve a qualquer ataque, menos Feitiço, e errar não consome
  const canalizar = { id: "canalizar", usoId: null, nome: "Canalizar em Golpe", elegivel: { exceto: ["feitico"] }, consome: "acerto", estado: "canalizarGolpe" };
  const a1 = EV.armaProximoAtaque({ ...s, combate: { ...s.combate, canalizarGolpe: true } }, canalizar, op());
  t(rot("arma o próximo ataque"), [a1.aplicado, a1.sessao.uso.pendencias.map((p) => p.id)], [true, ["canalizar"]]);
  t(rot("armar o mesmo id de novo recusa"), EV.armaProximoAtaque(a1.sessao, canalizar, op()).erro, "Já Armado");
  const idArma = op();
  const repArma = EV.armaProximoAtaque(s, canalizar, idArma);
  t(rot("o mesmo opId ao armar é repetida"), EV.armaProximoAtaque(repArma.sessao, canalizar, idArma).repetida, true);
  t(rot("a tela vê o que um ataque consumiria"), [EV.elegiveisParaAtaque(a1.sessao, acerto()).map((p) => p.id), EV.elegiveisParaAtaque(a1.sessao, acerto({ categorias: ["feitico"] }))], [["canalizar"], []]);
  const errou = EV.registraAtaqueRealizado(a1.sessao, d, erro(), op());
  t(rot("p.178: errar o ataque não consome"), [errou.consumidas, errou.sessao.uso.pendencias.length, errou.sessao.combate.canalizarGolpe], [[], 1, true]);
  t(rot("os eventos do erro"), errou.eventos.map((e) => e.tipo), ["ataque", "erro"]);
  const feitico = EV.registraAtaqueRealizado(a1.sessao, d, acerto({ categorias: ["feitico"] }), op());
  t(rot("p.178: Feitiço não consome"), feitico.consumidas, []);
  const idAtaque = op();
  const acertou = EV.registraAtaqueRealizado(a1.sessao, d, acerto({ critico: true }), idAtaque);
  t(rot("acertar consome e desliga o estado"), [acertou.consumidas, acertou.sessao.uso.pendencias.length, acertou.sessao.combate.canalizarGolpe], [["canalizar"], 0, false]);
  t(rot("os eventos do acerto crítico"), acertou.eventos.map((e) => e.tipo), ["ataque", "acerto", "critico"]);
  t(rot("repetir o opId do ataque não consome nem reaplica"), [EV.registraAtaqueRealizado(acertou.sessao, d, acerto(), idAtaque).repetida], [true]);
  t(rot("o desastre sai nos eventos"), EV.registraAtaqueRealizado(s, d, erro({ desastre: true }), op()).eventos.map((e) => e.tipo), ["ataque", "erro", "desastre"]);
  // consumo por declaração e contra um alvo (Mirar, p.302)
  const mirar = { id: "mirar", nome: "Mirar", elegivel: { qualquer: ["distancia"], contraAlvo: "g1" }, consome: "declaracao", expira: "inicioDoProximoTurno" };
  const m1 = EV.armaProximoAtaque(s, mirar, op()).sessao;
  t(rot("Mirar: ataque corpo a corpo não serve"), EV.registraAtaqueRealizado(m1, d, acerto(), op()).consumidas, []);
  t(rot("Mirar: ataque a distância contra OUTRO alvo não serve"), EV.registraAtaqueRealizado(m1, d, acerto({ categorias: ["arma", "distancia"], alvo: { id: "g2" } }), op()).consumidas, []);
  t(rot("Mirar: o ataque a distância contra o alvo consome, mesmo errando"), EV.registraAtaqueRealizado(m1, d, erro({ categorias: ["arma", "distancia"] }), op()).consumidas, ["mirar"]);
  t(rot("Mirar expira no início do próximo turno"), S.iniciaTurnoFicha(m1, d).uso.pendencias.length, 0);
  const fim = { id: "fim", nome: "Até o Fim do Turno", elegivel: {}, expira: "fimDoTurno" };
  t(rot("expira no fim do turno"), S.encerraTurnoFicha(EV.armaProximoAtaque(s, fim, op()).sessao, d).uso.pendencias.length, 0);
  const rodadaP = { id: "rod", nome: "Até a Rodada", elegivel: {}, expira: "rodada" };
  t(rot("expira na virada da rodada"), S.proximaRodada(EV.armaProximoAtaque(s, rodadaP, op()).sessao, d).sessao.uso.pendencias.length, 0);
  t(rot("o fim do combate limpa as pendências"), S.aplicaPatchCombate(a1.sessao, { ativo: false }).uso.pendencias.length, 0);
  // o uso ativo que originou a pendência é encerrado ao consumir
  const comUsoAtivo = U.usa(s, d, { id: "arma_u", nome: "Arma U", duracao: { ate: "inicioDoProximoTurno" }, efeitos: [{ tipo: "buff", canal: "defesa", expr: "1" }] }, op()).sessao;
  const pU = EV.armaProximoAtaque(comUsoAtivo, { id: "pu", usoId: "arma_u", nome: "PU", elegivel: {} }, op()).sessao;
  const consumiu = EV.registraAtaqueRealizado(pU, d, acerto(), op()).sessao;
  t(rot("consumir encerra o uso ligado e tira o buff dele"), [Object.keys(consumiu.uso.ativos), consumiu.buffs.length], [[], 0]);

  // A Sequência de Ataques (p.310), com o exemplo do livro
  const base = derivaDe(f, s).defesa;
  let alvo = s;
  const recebe = (n) => { for (let i = 0; i < n; i += 1) alvo = EV.registraAtaqueRecebido(alvo, d, acerto(), op()).sessao; };
  recebe(3);
  t(rot("p.310: três golpes de Itadori tiram 1 da Defesa"), [EV.sequenciaDe(alvo), derivaDe(f, alvo).defesa - base], [{ ataques: 3, penalidade: 1 }, -1]);
  recebe(1);
  t(rot("p.310: o quarto golpe (Nanami) leva a 2"), [EV.sequenciaDe(alvo).penalidade, derivaDe(f, alvo).defesa - base], [2, -2]);
  recebe(1);
  t(rot("p.310: o quinto golpe segue em 2 (a Defesa 'está em -2')"), [EV.sequenciaDe(alvo).ataques, derivaDe(f, alvo).defesa - base], [5, -2]);
  recebe(20);
  t(rot("p.310: o teto é 5, em 10 ataques"), [EV.sequenciaDe(alvo).penalidade, derivaDe(f, alvo).defesa - base], [5, -5]);
  t(rot("o buff é um só, de id fixo"), alvo.buffs.filter((b) => b.id === E.SEQUENCIA_BUFF_ID).length, 1);
  const iniciou = S.iniciaTurnoFicha(alvo, d);
  t(rot("p.310: o turno do alvo fecha a sequência e devolve a Defesa"), [EV.sequenciaDe(iniciou), derivaDe(f, iniciou).defesa - base, iniciou.buffs.length], [{ ataques: 0, penalidade: 0 }, 0, 0]);
  t(rot("o descanso também fecha"), [EV.sequenciaDe(S.descansar(alvo, d)).ataques, S.descansar(alvo, d).buffs.length], [0, 0]);
  const idRec = op();
  const r1 = EV.registraAtaqueRecebido(s, d, acerto(), idRec);
  t(rot("o mesmo opId recebido não conta duas vezes"), [EV.registraAtaqueRecebido(r1.sessao, d, acerto(), idRec).repetida, EV.sequenciaDe(r1.sessao).ataques], [true, 1]);
  t(rot("um ataque que errou também conta (ataques realizados)"), EV.sequenciaDe(EV.registraAtaqueRecebido(s, d, erro(), op()).sessao).ataques, 1);
  t(rot("sem opId recusa"), EV.registraAtaqueRecebido(s, d, acerto(), {}).codigo, "sem-opid");
  // na ficha individual a virada da rodada é o turno do alvo
  recebe(0);
  const viradas = S.proximaRodada(alvo, d).sessao;
  t(rot("na ficha individual a virada da rodada fecha a sequência"), EV.sequenciaDe(viradas).ataques, 0);
  // no Encontro a virada preserva o turno: quem fecha é o início do turno de cada um
  const noEncontro = S.proximaRodada(alvo, d, { preservarTurnoArmas: true }).sessao;
  t(rot("no Encontro a virada NÃO fecha a sequência de quem ainda não agiu"), EV.sequenciaDe(noEncontro).ataques > 0, true);
}

/* ============================================================ */
/* E. AÇÕES, REAÇÕES E HIERARQUIA                                */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: ${n}`;
  const usou = (r) => [r.usou, r.convertida, r.erro];
  const g = (sessao, tipo, o) => AC.gastaAcao(sessao, d, tipo, o);

  t(rot("o início tem uma ação de cada"), (({ comum, bonus, movimento, reacoes }) => [comum, bonus, movimento, reacoes])(AC.acoesDisponiveis(s, d)), [1, 1, 1, 1]);
  const c1 = g(s, "comum");
  t(rot("p.300: gasta a comum"), usou(c1), ["comum", false, undefined]);
  const c2 = g(c1.sessao, "comum");
  t(rot("p.300: a segunda comum não existe"), [usou(c2), c2.sessao === c1.sessao], [[null, false, "Sem Ação Comum"], true]);
  // hierarquia (p.301)
  const m1 = g(s, "movimento");
  const m2 = g(m1.sessao, "movimento");
  t(rot("p.301: a segunda de movimento converte a bônus"), usou(m2), ["bonus", true, undefined]);
  const m3 = g(m2.sessao, "movimento");
  t(rot("p.301: a terceira converte a comum (três movimentos no turno)"), usou(m3), ["comum", true, undefined]);
  t(rot("p.301: a quarta não existe"), g(m3.sessao, "movimento").erro, "Sem Ação de Movimento");
  const b1 = g(c1.sessao, "bonus");
  t(rot("p.301: a bônus usa a própria primeiro"), usou(b1), ["bonus", false, undefined]);
  t(rot("p.301: a segunda bônus converte a comum se ela está livre"), usou(g(b1.sessao, "bonus")), [null, false, "Sem Ação Bônus"]);
  t(rot("p.301: a segunda bônus converte a comum livre"), usou(g(g(s, "bonus").sessao, "bonus")), ["comum", true, undefined]);
  // completa (p.300)
  t(rot("p.300: a completa gasta comum e bônus"), (({ sessao }) => [sessao.uso.acoes.gastas.comum, sessao.uso.acoes.gastas.bonus])(g(s, "completa")), [1, 1]);
  t(rot("p.300: com a comum já gasta não há completa"), g(c1.sessao, "completa").erro, "Ação Completa Pede Comum e Bônus Livres");
  t(rot("p.300: com a bônus já gasta não há completa"), g(b1.sessao, "completa").codigo, "completa-indisponivel");
  // o turno devolve
  const novoTurno = S.iniciaTurnoFicha(m3.sessao, d);
  t(rot("o início do turno devolve as ações"), [novoTurno.uso.acoes.gastas, novoTurno.uso.acoes.turno], [{ comum: 0, bonus: 0, movimento: 0 }, 1]);
  t(rot("a virada da ficha individual também devolve"), S.proximaRodada(m3.sessao, d).sessao.uso.acoes.gastas.comum, 0);
  // condições (p.318)
  t(rot("p.318: Enjoado não converte"), g(g(s, "movimento").sessao, "movimento", {}).usou, "bonus");
  const enjoado = { ...s, condicoes: [{ nome: "Enjoado", rodadas: null }] };
  t(rot("p.318: Enjoado não converte (a segunda de movimento recusa)"), g(g(enjoado, "movimento").sessao, "movimento").erro, "Sem Ação de Movimento");
  for (const nome of ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"]) {
    t(rot(`p.318: ${nome} tira as ações`), g({ ...s, condicoes: [{ nome, rodadas: null }] }, "comum").codigo, "condicao-impede");
  }
  t(rot("a condição é lida sem acento nem caixa"), g({ ...s, condicoes: [{ nome: "atordoado" }] }, "reacao", { id: "r" }).codigo, "condicao-impede");
  // Surto de Ação: a comum extra sai do contador que o Surto abriu
  const comSurto = { ...c1.sessao, especializacaoSessao: { acoesComuns: 1 } };
  const extra = g(comSurto, "comum");
  t(rot("a comum extra do Surto de Ação é gasta do contador dele"), [usou(extra), extra.sessao.especializacaoSessao.acoesComuns], [["comum", false, undefined], 0]);
  // reação: o contador é o do Restringido, sem segundo contador
  const r1 = g(s, "reacao", { id: "aparar" });
  t(rot("p.300: gasta a reação pelo contador que já existe"), [usou(r1), r1.sessao.especializacaoSessao.reacoesGastas], [["reacao", false, undefined], 1]);
  t(rot("p.300: não há segunda reação até o início do turno"), g(r1.sessao, "reacao", { id: "outra" }).erro, "Sem Reação Disponível");
  t(rot("p.300: a MESMA reação serve uma vez por rodada"), g({ ...r1.sessao, especializacaoSessao: { ...r1.sessao.especializacaoSessao, reacoesExtras: 1 } }, "reacao", { id: "aparar" }).erro, "Reação Já Usada Nesta Rodada");
  t(rot("p.300: uma reação extra serve a outra reação"), g({ ...r1.sessao, especializacaoSessao: { ...r1.sessao.especializacaoSessao, reacoesExtras: 1 } }, "reacao", { id: "outra" }).usou, "reacao");
  t(rot("a reação pede identificação"), g(s, "reacao").codigo, "acao-sem-id");
  t(rot("a virada devolve a reação (contador do Restringido) e a mesma reação serve de novo na rodada seguinte"), g(S.proximaRodada(r1.sessao, d).sessao, "reacao", { id: "aparar" }).usou, "reacao");
  // livres (p.300)
  const l1 = g(s, "livre", { id: "abrir_porta" });
  t(rot("p.300: a mesma ação livre só uma vez por rodada"), [usou(l1), g(l1.sessao, "livre", { id: "abrir_porta" }).erro, g(l1.sessao, "livre", { id: "conversar" }).usou], [["livre", false, undefined], "Ação Livre Já Usada Nesta Rodada", "livre"]);
  t(rot("tipo de ação desconhecido recusa"), g(s, "voar").codigo, "acao-desconhecida");
  t(rot("bloqueioDeAcao devolve o motivo sem gastar"), [AC.bloqueioDeAcao(c1.sessao, d, "comum"), AC.bloqueioDeAcao(s, d, "comum")], ["Sem Ação Comum", null]);
}

/* ============================================================ */
/* F. CONCENTRAÇÃO LIGADA AO EFEITO                              */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: ${n}`;
  t(rot("p.320: CD do dano é 10 ou a metade, o maior"), [C.cdDaConcentracao("dano", { valor: 8 }), C.cdDaConcentracao("dano", { valor: 20 }), C.cdDaConcentracao("dano", { valor: 41 })], [10, 10, 20]);
  t(rot("p.320: movido é 5 mais a distância"), C.cdDaConcentracao("movido", { distancia: 6 }), 11);
  t(rot("p.320: empurrado e agarrado são 10 mais o Atletismo de quem fez"), [C.cdDaConcentracao("empurrado", { bonus: 7 }), C.cdDaConcentracao("agarrado", { bonus: 4 })], [17, 14]);
  t(rot("p.320: provocado é 10 mais a perícia de quem provocou"), C.cdDaConcentracao("provocado", { bonus: 9 }), 19);
  t(rot("causa desconhecida é recusada"), C.abreTesteDeConcentracao(s, "susto", {}).codigo, "causa-desconhecida");
  t(rot("sem concentração não há teste a abrir"), C.abreTesteDeConcentracao(s, "dano", { valor: 40 }).semConcentracao, true);

  // o cliente real: o Ritual Estendido (p.322)
  t(rot("o Ritual Estendido é livre para começar"), C.bloqueioRitualEstendido(s), null);
  const ritual = S.iniciaRitualEstendido(s, "fei_x");
  t(rot("p.322: o Ritual Estendido abre a concentração"), [C.concentracaoDe(ritual)?.id, C.concentracaoDe(ritual)?.ritualFeiticoId, C.bloqueioRitualEstendido(ritual)], ["ritual:fei_x", "fei_x", "Já Concentrado"]);
  t(rot("p.322: e a condição Desprevenido do ritual continua"), ritual.condicoes.some((c) => c.id === "ritual:desprevenido"), true);
  const apertado = C.abreTesteDeConcentracao(ritual, "dano", { valor: 30 });
  t(rot("o dano abre o teste com a CD, sem rolar"), [apertado.teste.cd, apertado.sessao.uso.teste.cd, apertado.sessao.log.length], [15, 15, 0]);
  const dois = C.abreTesteDeConcentracao(apertado.sessao, "empurrado", { bonus: 9 });
  t(rot("outro evento antes do teste mantém a MAIOR CD"), dois.sessao.uso.teste.cd, 19);
  const menor = C.abreTesteDeConcentracao(dois.sessao, "dano", { valor: 10 });
  t(rot("e uma CD menor depois não a baixa"), menor.sessao.uso.teste.cd, 19);

  // passar o teste mantém tudo; falhar perde e cancela o ritual
  const passa = C.rolaTesteDeConcentracao(apertado.sessao, d, { rng: d20(20), opId: U.novaOperacao() });
  t(rot("passar mantém a concentração e o ritual"), [passa.sucesso, passa.sessao.uso.teste, C.concentracaoDe(passa.sessao)?.id, passa.sessao.ritualAtual?.etapa], [true, null, "ritual:fei_x", "preparando"]);
  t(rot("a rolagem entra no log"), [passa.sessao.log.length, passa.sessao.log[0].rotulo, passa.rolagem.bonus], [1, "Concentração", d.testes.manobras.find((m) => m.id === "concentracao").executar]);
  const falha = C.rolaTesteDeConcentracao(apertado.sessao, d, { rng: d20(1), bonusExtra: 0, opId: U.novaOperacao() });
  t(rot("falhar perde a concentração"), [falha.sucesso, C.concentracaoDe(falha.sessao), falha.sessao.uso.teste], [false, null, null]);
  t(rot("falhar cancela o Ritual Estendido e tira o Desprevenido dele"), [falha.sessao.ritualAtual, falha.sessao.condicoes.some((c) => c.id === "ritual:desprevenido")], [null, false]);
  t(rot("o evento da falha diz a CD e o total"), [falha.evento.tipo, falha.evento.cd, falha.evento.causa], ["concentracao-perdida", 15, "dano"]);
  const informado = C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 14, opId: U.novaOperacao() });
  t(rot("resultado informado abaixo da CD perde"), [informado.sucesso, informado.cd, informado.total], [false, 15, 14]);
  t(rot("resultado informado igual à CD mantém"), C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 15, opId: U.novaOperacao() }).sucesso, true);
  t(rot("o bônus pago (Concentrar Aura) soma ao teste"), C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 12, bonusExtra: 3, opId: U.novaOperacao() }).sucesso, true);
  t(rot("a redução da CD abate da CD"), C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 11, reducaoCd: 4, opId: U.novaOperacao() }).sucesso, true);
  const idT = U.novaOperacao();
  const unico = C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 5, opId: idT });
  t(rot("o mesmo opId do teste não perde duas vezes"), [C.resolveTesteDeConcentracao(unico.sessao, d, { total: 5, opId: idT }).repetida], [true]);
  t(rot("sem teste pendente recusa"), C.resolveTesteDeConcentracao(ritual, d, { total: 20, opId: U.novaOperacao() }).codigo, "sem-teste");
  t(rot("sem resultado recusa"), C.resolveTesteDeConcentracao(apertado.sessao, d, { opId: U.novaOperacao() }).codigo, "sem-resultado");
  t(rot("sem opId recusa"), C.resolveTesteDeConcentracao(apertado.sessao, d, { total: 20 }).codigo, "sem-opid");

  // terminar o ritual pelo caminho normal fecha o espaço
  const pronto = S.concluiPreparacaoRitual(ritual, "fei_x");
  const resolvido = S.finalizaRitual(pronto, "fei_x");
  t(rot("finalizar o ritual fecha a concentração dele"), C.concentracaoDe(resolvido), null);
  t(rot("cancelar o ritual fecha a concentração dele"), C.concentracaoDe(S.cancelaRitual(ritual, "fei_x")), null);
  t(rot("o descanso fecha a concentração"), C.concentracaoDe(S.descansar(ritual, d)), null);
  t(rot("se o espaço já estava ocupado o ritual segue sem tomar o de outro"), C.concentracaoDe(S.iniciaRitualEstendido(C.concentracaoDe(ritual) ? ritual : s, "fei_y"))?.id, "ritual:fei_x");

  // um uso ativo com concentração: perder a concentração desfaz o que ele ligou
  const mantem = { id: "mantem", nome: "Mantém", concentracao: true, duracao: { rodadas: 9 }, efeitos: [{ tipo: "buff", canal: "defesa", expr: "2" }] };
  const u = U.usa(s, d, mantem, op());
  const antes = derivaDe(f, u.sessao).defesa;
  const apos = C.abreTesteDeConcentracao(u.sessao, "dano", { valor: 40 }).sessao;
  const caiu = C.resolveTesteDeConcentracao(apos, d, { total: 1, opId: U.novaOperacao() });
  t(rot("perder a concentração de um uso desfaz o buff dele"), [caiu.sucesso, Object.keys(caiu.sessao.uso.ativos), derivaDe(f, caiu.sessao).defesa - antes], [false, [], -2]);
  const volunt = C.perdeConcentracao(u.sessao, d, "voluntario", op());
  t(rot("encerrar a concentração à mão também desfaz"), [volunt.aplicado, Object.keys(volunt.sessao.uso.ativos)], [true, []]);
  t(rot("sem concentração não há o que perder"), C.perdeConcentracao(s, d, "falha", op()).codigo, "sem-concentracao");
  // condições que impedem concentrar: lista vazia no livro, mas o verbo funciona se a mesa a fornecer
  const surdo = { ...u.sessao, condicoes: [{ nome: "Atordoado", rodadas: null }] };
  t(rot("sem lista (o livro não enumera) nada acontece"), C.verificaCondicoesDeConcentracao(surdo, d).aplicado, false);
  t(rot("com a lista da mesa a condição encerra"), [C.verificaCondicoesDeConcentracao(surdo, d, { condicoes: ["Atordoado"] }).aplicado, C.concentracaoDe(C.verificaCondicoesDeConcentracao(surdo, d, { condicoes: ["Atordoado"] }).sessao)], [true, null]);
}

/* ============================================================ */
/* G. O EXEMPLO DO GUIA, COM O ESTADO REAL DO CATÁLOGO            */
/* ============================================================ */
/* Canalizar em Golpe (p.178): o estado e o custoPE (o Nível de Aptidão) vêm do derive de uma ficha que tem a aptidão. Usa
   (Ação de Movimento, custo marcado), arma o próximo ataque, e o ataque que ERRA não consome e o que ACERTA consome e desliga. */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  f.aptidoes = { au: 3, cl: 4, bar: 0, dom: 0, er: 3 };
  f.aptidoesAmaldicoadas = ["energia_reversa", "liberacao_de_energia_reversa", "canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima", "canalizar_energia_reversa"];
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: guia: ${n}`;
  const estado = d.combate.estadosExtras.find((e) => e.id === "canalizarEmGolpe");
  t(rot("o estado e o custo vêm do catálogo da ficha"), [!!estado, estado?.custoPE], [true, d.aptidao.efetivo.cl]);
  const uso = usoDoEstadoParaTeste(estado, d, { acao: "movimento", duracao: { ate: "inicioDoProximoTurno" } });
  const r = U.usa(s, d, uso, { opId: U.novaOperacao(), registraAcao: true });
  t(rot("usa: gasta a ação de movimento, liga o estado e marca o PE sem debitar"), [r.aplicado, r.acao, r.sessao.combate.canalizarEmGolpe, r.custo.pe.naoDescontado], [true, "movimento", true, d.aptidao.efetivo.cl]);
  const armado = EV.armaProximoAtaque(r.sessao, { id: "canalizar", usoId: "canalizarEmGolpe", nome: "Canalizar em Golpe", elegivel: { exceto: ["feitico"] }, consome: "acerto", estado: "canalizarEmGolpe" }, op());
  const errou = EV.registraAtaqueRealizado(armado.sessao, d, { acertou: false, categorias: ["arma", "corpo"] }, op());
  t(rot("errar não consome e o estado segue ligado"), [errou.consumidas, errou.sessao.combate.canalizarEmGolpe, Object.keys(errou.sessao.uso.ativos)], [[], true, ["canalizarEmGolpe"]]);
  const acertou = EV.registraAtaqueRealizado(errou.sessao, d, { acertou: true, categorias: ["arma", "corpo"] }, op());
  t(rot("acertar consome, desliga o estado e encerra o uso"), [acertou.consumidas, acertou.sessao.combate.canalizarEmGolpe, Object.keys(acertou.sessao.uso.ativos)], [["canalizar"], false, []]);
  const grupoCanalizar = (sess) => (derivaDe(f, sess).dano.entradas.find((e) => e.id === "basico").gruposDano ?? []).find((g) => g.nome === "Canalizar em Golpe") ?? null;
  t(rot("e o número continua vindo do Motor: o grupo de dano existe ligado e não existe desligado"), [!!grupoCanalizar(r.sessao), grupoCanalizar(s)], [true, null]);
}

/* ============================================================ */
/* H. DANO NA ALMA PELAS DEFESAS DO TIPO ALMA, NA SESSÃO          */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema, { defesasDano: { alma: { estado: "resistente", rd: 2 } } });
  const { d, s } = nova(f);
  const rot = (n) => `${sistema}: alma: ${n}`;
  const porAlma = d.defesasDano.porTipo.alma;
  t(rot("a RD Geral não cobre a Alma (a criatura tem RD Geral e a Alma só a própria)"), [porAlma.estados, porAlma.rd], [["resistente"], 2]);
  const r = D.aplicaDanoRecebido(s, d, { modo: "alma", total: 20, tr: { resultado: "sucesso" } }, op());
  t(rot("20: resistente 10, RD 2 = 8, TR passado = 4"), [r.calculo.passos.map((p) => p.para), r.calculo.final, r.sessao.almaAtual], [[10, 8, 4], 4, s.almaAtual - 4]);
  const r2 = D.aplicaDanoRecebido(s, d, { tipo: "alma", total: 20 }, op());
  t(rot("sem o TR só as defesas valem: 20, 10, 8"), [r2.calculo.final, r2.sessao.almaAtual], [8, s.almaAtual - 8]);
  const imune = nova(ficha(sistema, { defesasDano: { alma: { estado: "imune", rd: 0 } } }));
  t(rot("imune à Alma não perde Alma"), D.aplicaDanoRecebido(imune.s, imune.d, { modo: "alma", total: 50 }, op()).sessao.almaAtual, imune.s.almaAtual);
  const conflito = nova(ficha(sistema, { defesasDano: { alma: { estado: "vulneravel", rd: 0 } } }));
  t(rot("vulnerável à Alma: 20 viram 30"), D.aplicaDanoRecebido(conflito.s, conflito.d, { modo: "alma", total: 20 }, op()).calculo.final, 30);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
