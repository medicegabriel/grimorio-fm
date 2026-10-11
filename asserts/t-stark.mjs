/* PACOTE STARK (addon, 2026-10-11).

   "Estilo das Sombras: Arte do Herói", homebrew de Kami/shadowz664, lida de
   `addons/stark.json`. Cinco partes e os verbos que elas pediram:
     • a origem Legado do Guerreiro, variação do Sem Técnica: `estiloNdMinimo`
       (o Estilo no Nível 1), `aptidoesVetadas` (o Domínio Simples não se
       escolhe) e `concedeAptidoes` numa OPÇÃO de escolha (o marcador "Aprendeu o
       Domínio Simples");
     • o Voto O Covarde (`votoAutomatico`) e o canal `peMult`, ligado pelo
       estado de combate do pacote: PE Máximo ×0,6 com medo e ×1,4 depois;
     • as cinco Técnicas de Estilo, À ESCOLHA (`escolhivel`, gravadas em
       `estilosDoPacote`), com pré-requisito de verdade (`requer`) e contador
       (`usos`);
     • o Voto pronto Maldição - Instinto Corrompido (`pactoPadrao`);
     • três treinos: a variável `escudo_equipado`, o canal `rdEscudo`, a vaga
       `vagaEncantamentoEscudo` e o `quando` que agora atravessa a etapa. */
import { readFileSync } from "node:fs";
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
const V = await import(R + "afty-votos.js");
const T = await import(R + "afty-treinamentos.js");
const AP = await import(R + "afty-aptidoes.js");
const { conteudoDaFicha } = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const STARK = JSON.parse(readFileSync(new URL("../addons/stark.json", import.meta.url), "utf8"));
t("o pacote valida", A.validarPacote(STARK), []);
t("autor, sistema-alvo e versão", [STARK.autor, STARK.paraRaw, STARK.versao], ["Templas", "afty", "1.2.0"]);
const pacote = A.normalizarPacote(STARK);
t("aplicar não relata problema", A.aplicarAddons([pacote]).problemas, []);
const ORIGEM = "stark:legado_do_guerreiro";
t("a origem é variação do Sem Técnica", [O.getOrigem(ORIGEM)?.nome, O.origemMae(ORIGEM)], ["Legado do Guerreiro", "sem_tecnica"]);
t("os três treinos", ["treino_de_escudo", "treino_de_firmeza", "treinamento_corporal"].map((id) => T.getTreinamento(`stark:${id}`)?.etapas?.map((e) => e.focos)),
  [[1, 1, 2, 2], [1, 1, 1, 2], [1, 1, 1, 2]]);
t("as cinco Técnicas, todas à escolha", STARK.estilos.map((e) => [e.regra, e.escolhivel]), Array(5).fill(["expansao", true]));

const fonteDe = (d, canal) => (d.efeitos?.detalhes ?? []).filter((l) => l.canal === canal && !l.suplantado);
const resistencia = (d, id) => d.testes.resistencias.find((r) => (r.id ?? r.value) === id)?.bonus;

for (const sistema of ["player", "afty"]) {
  const tag = (s) => `${sistema}: ${s}`;
  const ficha = ({
    nd = 5, escolhas = {}, combate, estilos = [], aptidoes = [], aptNiveis, votos, treinamentos, habilidades,
    especializacoes, equipamentos,
  } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: ORIGEM, escolhas } };
    c.especializacoes = especializacoes ?? [{ id: sistema === "player" ? "lutador" : "combatente", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 14, destreza: 12, constituicao: 14, inteligencia: 14, sabedoria: 14, presenca: 10 };
    c.addons = [pacote];
    c.estilosDoPacote = estilos;
    c.aptidoesAmaldicoadas = aptidoes;
    if (aptNiveis) c.aptidoes = aptNiveis;
    if (votos) c.votos = votos;
    if (treinamentos) c.treinamentos = treinamentos;
    if (habilidades) c.habilidades = habilidades;
    if (equipamentos) c.equipamentos = equipamentos;
    if (combate) c.combate = combate;
    return c;
  };

  /* ---------- 2. O Legado do Guerreiro ---------- */
  t(tag("o Estilo destrava no Nível 1, com 2 Técnicas"),
    [1, 3, 4, 7].map((nd) => { const d = deriveAfty(ficha({ nd })); return [d.estilo.disponivel, d.estilo.progressao.total]; }),
    [[true, 2], [true, 2], [true, 3], [true, 4]]);
  const n4 = deriveAfty(ficha({ nd: 4 }));
  t(tag("o Domínio Simples não vem no Nível 4"), n4.aptidoesConcedidasOrigem.includes("dominio_simples"), false);
  t(tag("marcado à mão ele não conta, e a aba o trava"),
    [deriveAfty(ficha({ nd: 4, aptidoes: ["dominio_simples"] })).aptidoesEscolhidas.includes("dominio_simples"), n4.aptidoesVetadas],
    [false, ["dominio_simples"]]);
  const aprendeu = deriveAfty(ficha({ nd: 4, escolhas: { legado_dominio_simples: ["legado_aprendeu_dominio"] } }));
  t(tag("o marcador Aprendeu o Domínio Simples o concede"),
    [aprendeu.aptidoesEscolhidas.includes("dominio_simples"), aprendeu.aptidoesConcedidasOrigem], [true, ["dominio_simples"]]);
  t(tag("Corpo Treinado: Força até 26"),
    deriveAfty(ficha({ escolhas: { legado_corpo_treinado: ["legado_corpo_forca"] } })).attrLimiteEfetivo.forca, 26);
  t(tag("ou duas até 24"),
    (() => { const d = deriveAfty(ficha({ escolhas: { legado_corpo_treinado: ["legado_corpo_destreza_constituicao"] } })); return [d.attrLimiteEfetivo.forca, d.attrLimiteEfetivo.destreza, d.attrLimiteEfetivo.constituicao]; })(),
    [20, 24, 24]);
  t(tag("Compensar Covardia: Talento no Nível 1"),
    fonteDe(deriveAfty(ficha({ nd: 1, escolhas: { legado_n1: ["legado_n1_talento"] } })), "vagasTalento").map((l) => l.nome),
    ["Compensar Covardia (Talento)"]);
  t(tag("e Habilidade no 6, 15 e 19"),
    [5, 6, 15, 19].map((nd) => fonteDe(deriveAfty(ficha({ nd })), "vagasHabilidade").filter((l) => l.nome === "Compensar Covardia").reduce((s, l) => s + l.valor, 0)),
    [0, 1, 2, 3]);

  /* ---------- 3. O Voto O Covarde ---------- */
  t(tag("o Covarde entra sozinho na vaga de Voto"), V.votosDaFicha(ficha()).mecanicos.map((v) => v.nome), ["O Covarde"]);
  const pe = (estado) => deriveAfty(ficha({ combate: { ativo: true, ...(estado ? { "stark:covarde": estado } : {}) } })).pe;
  const pe0 = pe(null);
  t(tag("Apavorado: PE Máximo ×0,6"), pe("apavorado"), Math.floor(pe0 * 0.6));
  t(tag("Superou o Medo: PE Máximo ×1,4"), pe("superou"), Math.floor(pe0 * 1.4));
  t(tag("fora de combate nada muda"), deriveAfty(ficha({ combate: { ativo: false, "stark:covarde": "apavorado" } })).pe, pe0);
  t(tag("o hover do PE diz o multiplicador"),
    (deriveAfty(ficha({ combate: { ativo: true, "stark:covarde": "apavorado" } })).partes?.pe ?? []).some((p) => p.texto === "×0,6" && /O Covarde/.test(p.label)), true);

  /* ---------- 4. As Técnicas de Estilo ---------- */
  const catalogo = deriveAfty(ficha()).estilo.catalogoDoPacote ?? [];
  t(tag("o catálogo oferece as cinco, nenhuma marcada"), [catalogo.length, catalogo.some((x) => x.marcada)], [5, false]);
  t(tag("sem marcar, nenhuma entra nem gasta a progressão"), deriveAfty(ficha()).estilo.progressao.usadas, 0);
  const reforco = "stark:reforco_corporal";
  const semAura = deriveAfty(ficha({ estilos: [reforco] }));
  t(tag("marcada sem o pré-requisito, fica inválida"),
    [semAura.estilo.progressao.usadas, semAura.estilo.tecnicas[0].mecanicamenteValida,
      semAura.estilo.tecnicas[0].validacao.find((v) => v.codigo === "requer")?.texto],
    [1, false, "Requer Aura Reforçada."]);
  const comAura = (combate, extra = {}) => deriveAfty(ficha({
    estilos: [reforco], aptidoes: ["aura_reforcada", "aura_excessiva"], aptNiveis: { au: 3 }, combate, ...extra,
  }));
  const ligada = comAura({ ativo: true, estilo_ativo: true, estilo_tecnica: [reforco] });
  const desligada = comAura({ ativo: true, estilo_ativo: true });
  t(tag("Reforço Corporal válida com a Aura Reforçada"), ligada.estilo.tecnicas[0].mecanicamenteValida, true);
  /* 1.2.0 (autor, 2026-10-11, pela planilha do Stark): a RD da Aura Reforçada sai
     da Física e vira RD Geral, 2 + o dobro da Aura. */
  t(tag("ligada, a RD da Aura vai da Física para a Geral (2 + o dobro)"),
    [ligada.rdFisico - desligada.rdFisico, ligada.rdGeral - desligada.rdGeral], [-6, 8]);
  const excessiva = comAura({ ativo: true, estilo_ativo: true, estilo_tecnica: [reforco], auraExcessiva: true });
  const excessivaSem = comAura({ ativo: true, estilo_ativo: true, auraExcessiva: true });
  t(tag("Aura 3 com a Aura Excessiva: + BT junto"), excessiva.rdGeral - excessivaSem.rdGeral, 2 + 6 + excessiva.maestria);

  const mente = "stark:mente_inabalavel";
  const comMente = deriveAfty(ficha({ estilos: [mente], aptidoes: ["aura_anuladora"] }));
  t(tag("Mente Inabalável conta usos igual ao BT"), comMente.mesa[`estilo:${mente}`]?.usos?.max, comMente.maestria);
  const fichaMente = ficha({ estilos: [mente], aptidoes: ["aura_anuladora"] });
  t(tag("e a linha da Ficha tem o contador"),
    !!conteudoDaFicha(fichaMente, deriveAfty(fichaMente)).find((i) => i.id === mente)?.usos, true);
  t(tag("a marcada à toa passa da progressão e invalida todas"),
    deriveAfty(ficha({ nd: 1, estilos: [reforco, mente, "stark:cobertura_da_vanguarda"] })).estilo.progressao.excedeu, true);

  /* ---------- 5. O Voto pronto Maldição - Instinto Corrompido ---------- */
  const molde = V.votoPadraoDeAddon(ficha());
  /* O relato "Só tem um pacto" (2026-10-11): o Covarde automático ocupa a lista, e
     o molde do Instinto Corrompido tem de continuar oferecido até ser copiado. */
  t(tag("o Voto pronto é oferecido com o Covarde já na lista"),
    V.votosProntosDisponiveis(ficha({ votos: V.sincronizarVotosAutomaticos(ficha()).votos })).map((m) => m.voto.nome),
    ["Maldição - Instinto Corrompido"]);
  t(tag("e some depois de copiado"),
    V.votosProntosDisponiveis(ficha({ votos: { contratuais: [], mecanicos: [V.votoPadraoDeAddon(ficha()).voto] } })).length, 0);
  t(tag("o Voto pronto é o Instinto Corrompido"), molde?.voto?.nome, "Maldição - Instinto Corrompido");
  const instinto = (extra = {}) => deriveAfty(ficha({ votos: { contratuais: [], mecanicos: [molde.voto] }, ...extra }));
  const sem = deriveAfty(ficha());
  const com = instinto();
  /* O PE cai MAIS que 10 na criatura: a Inteligência em 6 tira o Mod. da
     Técnica do PE. Por isso a parcela do Voto é lida no hover. */
  t(tag("-2 PE e +6 PV por nível"),
    [(com.partes?.pe ?? []).find((p) => /Instinto Corrompido/.test(p.label))?.valor, com.hp - sem.hp], [-10, 30]);
  t(tag("Inteligência limitada a 6"), [com.attrLimiteEfetivo.inteligencia, com.attrEff.inteligencia], [6, 6]);
  t(tag("sem Controle e Leitura"), com.aptidao.limite.cl, 0);
  /* E o CL deixa de ser requisito nas Aptidões de OUTRA trilha (autor, 2026-10-11:
     "retire o requisito de CL nas coisas", só com o Instinto). A da trilha CL segue
     pedindo, porque o Instinto proíbe Aptidão de CL. */
  // Só o requisito de CL: o Revestimento de Domínio também pede DOM 1.
  const trilhasOk = (d, aptId) => {
    const a = AP.getAptidao(aptId);
    const ctx = { niveis: d.aptidao.efetivo, nd: d.nd, requisitoTrilhaDispensado: d.requisitoTrilhaDispensado,
      trilhaDaAptidao: AP.getCategoriaAptidao(a.categoria)?.trilha ?? null };
    return a.requisitos.filter((r) => r.tipo === "trilha" && r.trilha === "cl").every((r) => AP.avaliarRequisitoAptidao(r, ctx).ok);
  };
  t(tag("com o Instinto, a Energia Reversa não pede CL 3"), [trilhasOk(com, "energia_reversa"), trilhasOk(sem, "energia_reversa")], [true, false]);
  t(tag("nem o Revestimento de Domínio"), trilhasOk(com, "revestimento_de_dominio"), true);
  t(tag("e a Aptidão da trilha CL continua pedindo"), trilhasOk(com, "cobertura_avancada"), false);
  t(tag("o requisito dispensado diz de onde"), [com.requisitoTrilhaDispensado, sem.requisitoTrilhaDispensado],
    [{ cl: ["Voto Maldição - Instinto Corrompido (Malefício)"] }, {}]);
  // O interruptor do Domínio Simples só existe com a Aptidão (o marcador) ou com Técnica.
  const auraDobra = (ligado) => instinto({ aptidoes: ["aura_reforcada"], aptNiveis: { au: 2 },
    escolhas: { legado_dominio_simples: ["legado_aprendeu_dominio"] },
    combate: { ativo: true, ...(ligado ? { estilo_ativo: true } : {}) } });
  t(tag("com o Domínio Simples no ar, a Aura Reforçada dobra"), auraDobra(true).rdFisico - auraDobra(false).rdFisico, 4);

  /* ---------- 5b. O bloco da Aura da planilha do autor (2026-10-11) ----------
     Aura 5 e BT 5, Aura Reforçada, Excessiva e Impenetrável, o Reforço Corporal e
     o Instinto: (2 + BT + 2×AU) × 2 + 2×AU = 44 na RD Geral, e a Física da Aura sai.
     Com Aura 4 e a Impenetrável, a Excessiva liga sozinha com o Domínio. */
  {
    const planilha = (combate, extra = {}) => deriveAfty(ficha({
      nd: 14, estilos: [reforco], aptidoes: ["aura_reforcada", "aura_excessiva", "aura_impenetravel"], aptNiveis: { au: 5 },
      escolhas: { legado_dominio_simples: ["legado_aprendeu_dominio"] },
      votos: { contratuais: [], mecanicos: [molde.voto] }, combate, ...extra,
    }));
    const fora = planilha({ ativo: true });
    const no = planilha({ ativo: true, estilo_ativo: true, estilo_tecnica: [reforco] });
    const naMao = planilha({ ativo: true, estilo_ativo: true, estilo_tecnica: [reforco], auraExcessiva: true });
    t(tag("planilha: BT 5"), no.maestria, 5);
    t(tag("planilha: 44 na RD Geral, e a Física da Aura sai"), [no.rdGeral - fora.rdGeral, no.rdFisico - fora.rdFisico], [44, -10]);
    t(tag("planilha: a Excessiva ligada à mão dá o mesmo"), [naMao.rdGeral, naMao.rdFisico], [no.rdGeral, no.rdFisico]);
  }

  /* ---------- 5c. Mestre Defensivo na pilha do escudo (2026-10-11) ---------- */
  {
    const escudoLeve = { itens: [{ uid: "e1", refId: "esc_leve", tipo: "escudo", qtd: 1, equipado: true }] };
    const md = deriveAfty({ ...ficha({ equipamentos: escudoLeve }), talentos: ["tal_mestre_defensivo"] });
    const pilha = sistema === "player" ? "rdFisico" : "rdGeral";
    const outra = sistema === "player" ? "rdGeral" : "rdFisico";
    t(tag("Mestre Defensivo na pilha do escudo"),
      [(md.partes?.[pilha] ?? []).some((p) => p.label === "Mestre Defensivo"), (md.partes?.[outra] ?? []).some((p) => p.label === "Mestre Defensivo")],
      [true, false]);
  }

  /* ---------- 6. Os treinos ---------- */
  const escudo = { itens: [{ uid: "e1", refId: "esc_medio", tipo: "escudo", qtd: 1, equipado: true, fa: { grau: "quarto", encantamentos: [] } }] };
  const treinoEscudo = (prog, equipamentos = escudo) => deriveAfty(ficha({ treinamentos: prog ? { "stark:treino_de_escudo": prog } : {}, equipamentos }));
  const e0 = treinoEscudo(0);
  t(tag("Escudo 1: +1 de Defesa com escudo"), treinoEscudo(1).defesa - e0.defesa, 1);
  t(tag("e nada sem escudo"), treinoEscudo(1, { itens: [] }).defesa - treinoEscudo(0, { itens: [] }).defesa, 0);
  t(tag("Escudo 2: +1 de Fortitude"), resistencia(treinoEscudo(2), "fortitude") - resistencia(e0, "fortitude"), 1);
  const pilha = sistema === "player" ? "rdFisico" : "rdGeral";
  t(tag("Escudo 3: +5 na RD do escudo, na pilha do sistema"), treinoEscudo(3)[pilha] - treinoEscudo(2)[pilha], 5);
  t(tag("e nada sem escudo na mão"),
    treinoEscudo(3, { itens: [{ ...escudo.itens[0], equipado: false }] })[pilha] - treinoEscudo(2, { itens: [{ ...escudo.itens[0], equipado: false }] })[pilha], 0);
  const faDe = (d) => d.equip.entradas.find((x) => x.uid === "e1")?.fa?.vagasLivres;
  t(tag("Escudo 4: +1 vaga livre de encantamento no escudo"), [faDe(treinoEscudo(3)), faDe(treinoEscudo(4))], [0, 1]);

  const firmeza = (prog, combate) => deriveAfty(ficha({ treinamentos: prog ? { "stark:treino_de_firmeza": prog } : {}, combate }));
  const naTerra = { ativo: true, postura: "terra" };
  t(tag("Firmeza 1 e 3: +2 e +3 de PV Temporário na Postura da Terra"),
    [firmeza(1, naTerra).pvTemporario - firmeza(0, naTerra).pvTemporario, firmeza(3, naTerra).pvTemporario - firmeza(0, naTerra).pvTemporario],
    [2, 5]);
  t(tag("fora da postura, nada"), firmeza(3, { ativo: true }).pvTemporario - firmeza(0, { ativo: true }).pvTemporario, 0);
  t(tag("Firmeza 2: +1 de Fortitude só na postura"),
    [resistencia(firmeza(2, naTerra), "fortitude") - resistencia(firmeza(1, naTerra), "fortitude"),
      resistencia(firmeza(2, { ativo: true }), "fortitude") - resistencia(firmeza(1, { ativo: true }), "fortitude")],
    [1, 0]);

  const corporal = (prog) => deriveAfty(ficha({ treinamentos: prog ? { "stark:treinamento_corporal": prog } : {} }));
  t(tag("Corporal 4: + 1 + metade do BT no Teste de Morte"),
    fonteDe(corporal(4), "bonusManobra").map((l) => [l.alvo, l.valor]), [["morte", 1 + Math.floor(corporal(4).maestria / 2)]]);
  t(tag("Corporal completo: +1 PV por nível e o maior mod físico"), corporal(4).hp - corporal(3).hp, 5 + 2);
}

/* ---------- 7. Requisito de Habilidade (criatura) ---------- */
{
  const c = createBlankAfty();
  c.rulesVersion = "afty";
  c.core = { ...c.core, nd: 5, tipo: "combatente", patamar: "comum", origem: { id: ORIGEM } };
  c.especializacoes = [{ id: "combatente", nivel: 5 }];
  c.attributes = { forca: 14, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 14, presenca: 10 };
  c.addons = [pacote];
  c.aptidoes = { au: 2 };
  c.estilosDoPacote = ["stark:impacto_trovejante"];
  const sem = deriveAfty(c);
  // A Combatente já traz as Artes do Combate. Sem classe nenhuma, a Técnica pede.
  t("criatura: Impacto Trovejante pede Artes do Combate",
    [deriveAfty({ ...c, especializacoes: [] }).estilo.tecnicas[0].validacao.find((v) => v.codigo === "requer")?.texto,
      sem.estilo.tecnicas[0].validacao.some((v) => v.codigo === "requer")],
    ["Requer Artes do Combate.", false]);
  const golpe = (tecnica) => deriveAfty({ ...c, combate: { ativo: true, estilo_ativo: true, arteGolpeDescendente: true, ...(tecnica ? { estilo_tecnica: ["stark:impacto_trovejante"] } : {}) } });
  const com = golpe(true);
  const so = golpe(false);
  t("criatura: com o Golpe, RD igual à Aura mais o BT", com.rdGeral - so.rdGeral, 2 + com.maestria);
  t("criatura: e a Defesa do Golpe sai", com.defesa - so.defesa, -Math.max(1, Math.floor(2 / 2)));
  /* O Estilo do Interceptador é OPÇÃO do Repertório do Especialista, e não
     Habilidade (relato do autor, 2026-10-11: a Cobertura saía inválida). */
  const cobertura = (escolhas) => deriveAfty({ ...c, habilidades: ["cmb_artes_do_combate", "cmb_repertorio_do_especialista"],
    estilosDoPacote: ["stark:cobertura_da_vanguarda"], escolhasHabilidade: escolhas })
    .estilo.tecnicas[0].validacao.find((v) => v.codigo === "requer")?.texto ?? null;
  t("criatura: a Cobertura enxerga o Estilo do Interceptador escolhido",
    [cobertura({}), cobertura({ cmb_repertorio_do_especialista: ["cmb_estilo_do_interceptador"] })],
    ["Requer Estilo do Interceptador.", null]);
}

/* ---------- 8. Validadores dos verbos ---------- */
{
  const ruim = JSON.parse(JSON.stringify(STARK));
  ruim.id = "stark-ruim";
  const o = ruim.acrescenta.origens[0];
  o.estiloNdMinimo = 0;
  o.aptidoesVetadas = "dominio_simples";
  A.aplicarAddons([A.normalizarPacote(ruim)]);
  const p = O.validarCatalogoOrigens();
  t("estiloNdMinimo e aptidoesVetadas inválidos são relatados",
    [p.some((x) => x.includes("estiloNdMinimo")), p.some((x) => x.includes("aptidoesVetadas"))], [true, true]);
}

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
