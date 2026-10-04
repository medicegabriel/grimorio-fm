/* OS TIPOS ESPECIAIS DE INVOCAÇÃO (Etapa 8 da atualização de 2026-09-30).

   O que este arquivo garante, pelas decisões do autor (DA-03, DA-04, DA-07, PV-01,
   PV-10, PV-11, PV-15 e PV-20) e pelo *Mecânicas para Invocações 2.5.2*:

   1. MARIONETE: sem alma (Integridade zero, escrita bloqueada), imune a dano na
      alma, Envenenado e venenos comuns, Vontade e Astúcia pelo invocador, sem cura
      nenhuma, o reparo pelo Ofício do material (Custo pelo grau, CD pela tabela de
      Criação de Itens do Livro) e o Grau Especial pedindo nível 17 de Controlador.
   2. CORPO: dura CL rodadas (o CL do Controlador), a manutenção de 1 ou 2 PE por
      rodada, a saída de campo sem ela, o boneco imune a Envenenado e o biológico
      com uma refeição de Cozinheiro permanente (a tabela do Livro, sem Energética).
   3. MALDIÇÃO: sem as vagas a mais de Visionário, a ficha adaptada (sem os avisos
      do point-buy e da cota de perícias), o Nível de Aptidão pela metade do mod de
      Presença do Controlador, sem cura por Energia Reversa, e a Autonomia paga no
      início do combate.
   4. TÉCNICA: o Fundamento, a Técnica Inata bloqueada de verdade quando ele morre
      (e só os Feitiços quando ele está fora de campo), e a Iniciativa própria.
   5. O ENCONTRO: o cache do derive do combatente enxerga o estado das invocações
      (E-13), e a morte do Fundamento vai para a ficha do combatente. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const D = await import(R + "afty-derive.js");
const S = await import(R + "afty-schema.js");
const I = await import(R + "afty-invocacoes.js");
const TIPOS = await import(R + "afty-invocacoes-tipos.js");
const SES = await import(R + "ficha/ficha-sessao.js");
const ENC = await import(R + "encontros/usar-encontro-afty.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const regras = (tipo) => TIPOS.regrasDoTipoValor(tipo);
const nova = (tipo, grau = "quarto", extra = {}) => ({ ...I.createBlankInvocacao(grau, tipo), id: "X", ...extra });
const DONO = { nd: 1, bt: 2, nivelControlador: 1, nivelControladorReal: 1, grauRankDono: 1 };
const res = (inv, dono = DONO) => I.resolveInvocacao(inv, dono);
const sessao = (linha = {}, extra = {}) => ({
  ...SES.sessaoEmBranco(), invocacoes: { X: linha }, peAtual: 20, peTempFontes: {}, rodada: 0, ...extra,
});
const linha = (s) => SES.estadoDaInvocacao(s, "X");

/* ============================================================ */
/* 1. MARIONETE                                                  */
/* ============================================================ */
const mar = res(nova("marionete", "segundo", { oficio: "Ferreiro" }));
t("Marionete sem alma: Integridade zero e a marca de tela",
  [mar.almaMax, mar.temAlma], [0, false]);
t("os outros tipos seguem com a Integridade igual ao PV",
  ["shikigami", "tecnica", "maldicao", "corpo"].map((tp) => {
    const r = res(nova(tp));
    return r.temAlma && r.almaMax === r.pv;
  }), [true, true, true, true]);
t("Marionete imune a dano na alma, Envenenado e venenos nao amaldicoados",
  mar.imunidades, ["Dano na Alma", "Envenenado", "Venenos Não Amaldiçoados"]);
t("e o Dano Psiquico vai ao invocador", mar.psiquicoNoInvocador, true);
const marDono = res(nova("marionete"), { ...DONO, trsDoDono: { vontade: { bonus: 7, prof: "treinado" }, astucia: { bonus: 3, prof: null } } });
t("Vontade e Astucia pelo numero do invocador, marcadas",
  marDono.testes.resistencias.filter((r) => r.doInvocador).map((r) => [r.value, r.bonus, r.treinado]),
  [["vontade", 7, true], ["astucia", 3, false]]);
t("e as outras tres seguem da propria Marionete",
  marDono.testes.resistencias.filter((r) => !r.doInvocador).map((r) => r.value), ["reflexos", "fortitude", "integridade"]);
t("o Shikigami nao manda TR nenhum ao invocador",
  res(nova("shikigami"), { ...DONO, trsDoDono: { vontade: { bonus: 7 } } }).testes.resistencias.some((r) => r.doInvocador), false);
t("Marionete nao se cura de forma nenhuma",
  [SES.curaPermitida(regras("marionete"), "comum"), SES.curaPermitida(regras("marionete"), "er")], [false, false]);
const ferida = sessao({ estado: "ativa", pvAtual: 5 });
t("e a cura na mesa nao muda nada", SES.aplicaCuraInvocacao(ferida, "X", 10, 30, regras("marionete")), ferida);
t("nem a escrita da Integridade", SES.defineVitalInvocacao(ferida, "X", "alma", 3, 30, regras("marionete")), ferida);
t("o reparo da Marionete: Oficio do material, Custo 3 no Segundo Grau, CD 25 do Ferreiro",
  [mar.reparo.vias, mar.reparo.custo, mar.reparo.cd, mar.reparo.quando], [["Ofício (Ferreiro)"], 3, 25, "Ação Comum"]);
t("a coluna do Entalhador no Primeiro Grau e CD 35",
  res(nova("marionete", "primeiro", { oficio: "Entalhador" })).reparo.cd, 35);
t("sem Oficio escolhido, o reparo fica em falta e sem CD",
  (({ falta, cd }) => [falta, cd])(res(nova("marionete")).reparo), [true, null]);
t("o Custo pelo grau: 1, 2, 3, 4 e 4",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) => res(nova("marionete", g, { oficio: "Alfaiate" })).reparo.custo),
  [1, 2, 3, 4, 4]);
t("e a CD do Alfaiate pela coluna dele",
  ["quarto", "terceiro", "segundo", "primeiro"].map((g) => res(nova("marionete", g, { oficio: "Alfaiate" })).reparo.cd),
  [15, 20, 30, 40]);
const especialBaixo = res(nova("marionete", "especial"), { ...DONO, nivelControladorReal: 16 });
const especialOk = res(nova("marionete", "especial"), { ...DONO, nivelControladorReal: 17 });
t("Marionete de Grau Especial pede nivel 17 de Controlador (o real)",
  [especialBaixo.warnings.some((w) => w.includes("nível 17")), especialOk.warnings.some((w) => w.includes("nível 17"))],
  [true, false]);
t("o Shikigami de Grau Especial nao pede nada",
  res(nova("shikigami", "especial"), { ...DONO, nivelControladorReal: 1 }).warnings.some((w) => w.includes("nível 17")), false);

/* ============================================================ */
/* 2. CORPO AMALDIÇOADO                                          */
/* ============================================================ */
const corpo = (grau = "quarto", extra = {}, dono = {}) => res(nova("corpo", grau, extra), { ...DONO, clControlador: 3, ...dono });
t("a duracao do Corpo e o CL do Controlador, em rodadas e em horas",
  (({ rodadas, horas }) => [rodadas, horas])(corpo().duracao), [3, 3]);
t("CL zero e zero rodadas (sem minimo, PV-01)", corpo("quarto", {}, { clControlador: 0 }).duracao.rodadas, 0);
t("a manutencao: 1 PE do Quarto ao Segundo, 2 PE no Primeiro e no Especial",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) => corpo(g).duracao.manutencao), [1, 1, 1, 2, 2]);
t("so o Corpo tem duracao", ["shikigami", "tecnica", "maldicao", "marionete"].map((tp) => res(nova(tp)).duracao), [null, null, null, null]);
const boneco = corpo("segundo", { natureza: "boneco" });
t("o boneco e imune a Envenenado e a venenos nao amaldicoados",
  boneco.imunidades, ["Envenenado", "Venenos Não Amaldiçoados"]);
t("e se repara pelo Alfaiate, em descanso longo, CD 30 no Segundo",
  [boneco.reparo.vias, boneco.reparo.cd, boneco.reparo.quando], [["Ofício (Alfaiate)"], 30, "Descanso Longo"]);
const bio = (refeicao, extra = {}, dono = {}) => corpo("quarto", { natureza: "biologico", refeicao, ...extra }, dono);
t("o biologico se repara por Cura Aprimorada ou Medicina, sem Oficio como via",
  (({ vias, oficio }) => [vias, oficio])(bio("").reparo), [["Cura Aprimorada", "Medicina"], ""]);
/* A CD do biologico pela coluna do Farmaceutico (decisao do autor, 2026-10-03):
   o Mecanicas manda seguir a tabela "em ambos os casos", e Medicina nao e
   Oficio. Custo 4 da 35, e nao os 30 do Canalizador do Shikigami. */
t("e a CD pela coluna do Farmaceutico, do Quarto ao Especial",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) => corpo(g, { natureza: "biologico" }).reparo.cd),
  [15, 20, 25, 35, 35]);
const reparoBio = corpo("segundo", { natureza: "biologico" }).reparo;
t("o hover da CD diz a coluna e o Custo",
  reparoBio.partesCd.map((p) => [p.label, p.valor]), [["Criação de Itens · Farmacêutico (Custo 3)", 25]]);
t("e a parcela fecha com a CD", reparoBio.partesCd.reduce((n, p) => n + p.valor, 0), reparoBio.cd);
t("o boneco tambem leva a parcela, pela coluna do Alfaiate",
  boneco.reparo.partesCd.map((p) => p.label), ["Criação de Itens · Alfaiate (Custo 3)"]);
t("sem natureza, sem CD e sem parcela",
  (({ cd, partesCd, falta }) => [cd, partesCd, falta])(corpo("quarto", { natureza: "" }).reparo), [null, [], true]);
t("as refeicoes sao as do Livro, sem a Energetica",
  I.REFEICOES_DE_CORPO.map((r) => r.value), ["leve", "nutritiva", "picante", "reforcada", "refrescante", "revigorante"]);
const semRefeicao = bio("");
t("Leve: +3 m por grau do Criador (o dono)",
  [bio("leve").deslocamento - semRefeicao.deslocamento, bio("leve", {}, { grauRankDono: 3 }).deslocamento - semRefeicao.deslocamento],
  [3, 9]);
t("e a parcela leva o nome da refeicao", bio("leve").fontes.deslocamento.some((p) => p.label === "Refeição Leve"), true);
t("Picante: +2 nas Jogadas de Ataque",
  bio("picante").testes.acerto.corpo.bonus - semRefeicao.testes.acerto.corpo.bonus, 2);
t("Reforcada: +2 na Defesa", bio("reforcada").defesa - semRefeicao.defesa, 2);
const nutri = bio("nutritiva", { refeicaoTrs: ["fortitude", "vontade", "reflexos"] }, { bt: 4 });
t("Nutritiva: +2 em metade da BT do Criador em TRs, nos escolhidos e na ordem",
  [nutri.refeicao.limiteTrs, nutri.refeicao.trs], [2, ["fortitude", "vontade"]]);
const semNutri = bio("", {}, { bt: 4 });
t("e o +2 cai so neles",
  nutri.testes.resistencias.map((r) => r.bonus - semNutri.testes.resistencias.find((x) => x.value === r.value).bonus),
  [0, 2, 2, 0, 0]);
t("Refrescante e Revigorante sao de uso, com o numero no texto",
  [bio("refrescante").refeicao.efeitos.length, bio("revigorante", {}, { grauRankDono: 2 }).refeicao.pvTemp], [0, 10]);
t("o boneco nao tem refeicao, mesmo gravada", corpo("quarto", { natureza: "boneco", refeicao: "leve" }).refeicao, null);
t("e o Shikigami com o campo esquecido tambem nao", res(nova("shikigami", "quarto", { natureza: "biologico", refeicao: "leve" })).refeicao, null);

/* A duração na mesa: as rodadas contam, a manutenção vence, e sem ela o Corpo sai. */
const cX = { ...corpo("primeiro"), id: "X" };
const derivedCorpo = { invocacoes: { lista: [cX] } };
const entrou = SES.entraEmCampo(sessao({}, { rodada: 1, combate: { ativo: true } }), "X",
  { permitida: true, via: "ativar", custo: { total: 0 }, pvInicial: cX.pv });
const vira = (s) => SES.proximaRodada(s, derivedCorpo).sessao;
const r2 = vira(entrou);
const r3 = vira(vira(entrou));
const r4 = vira(r3);
t("cada rodada conta, e a manutencao vence no CL",
  [linha(entrou).rodadasAtiva, linha(r2).rodadasAtiva, linha(r3).rodadasAtiva, linha(r3).manutencaoPendente],
  [0, 1, 2, false]);
t("na rodada do CL a manutencao fica pendente", [linha(r4).rodadasAtiva, linha(r4).manutencaoPendente], [3, true]);
const pago = SES.pagaManutencaoCorpo(r4, "X", 2);
t("pagar gasta o PE e limpa a pendencia", [pago.peAtual, linha(pago).manutencaoPendente], [r4.peAtual - 2, false]);
t("e ele segue em campo, pedindo de novo na rodada seguinte",
  [linha(vira(pago)).estado, linha(vira(pago)).manutencaoPendente], ["ativa", true]);
const naoPagou = vira(r4);
t("sem pagar, a rodada seguinte o tira de campo com o PV que tinha",
  [linha(naoPagou).estado, linha(naoPagou).pvAtual, linha(naoPagou).rodadasAtiva], ["fora", cX.pv, 0]);
t("sem PE, pagar nao muda nada", SES.pagaManutencaoCorpo({ ...r4, peAtual: 1 }, "X", 2), { ...r4, peAtual: 1 });
t("o inicio do combate zera a contagem de quem ja estava ativo",
  [linha(SES.iniciaCombate(r4, derivedCorpo)).rodadasAtiva, linha(SES.iniciaCombate(r4, derivedCorpo)).manutencaoPendente],
  [0, false]);
/* Com CL 0 ele "dura" zero rodadas: a manutenção vale desde a primeira. */
const c0 = { ...corpo("quarto", {}, { clControlador: 0 }), id: "X" };
t("CL 0: o inicio do combate ja pede a manutencao",
  linha(SES.iniciaCombate(sessao({ estado: "ativa" }), { invocacoes: { lista: [c0] } })).manutencaoPendente, true);
t("CL 0: ativado com o combate correndo, tambem",
  [SES.entradaDaInvocacao(sessao({}, { rodada: 2 }), c0).manutencaoImediata,
    SES.entradaDaInvocacao(sessao({}), c0).manutencaoImediata],
  [true, false]);

/* ============================================================ */
/* 3. MALDIÇÃO DOMADA                                            */
/* ============================================================ */
const VISIONARIO = { canal: "orcamentoPago", expr: "1", nome: "Visionário" };
const comVis = (tp) => res(nova(tp), { ...DONO, efeitos: [VISIONARIO] });
t("Visionario da a vaga ao Shikigami e nao a Maldicao",
  [comVis("shikigami").orcamento.total - res(nova("shikigami")).orcamento.total,
    comVis("maldicao").orcamento.total - res(nova("maldicao")).orcamento.total],
  [1, 0]);
t("e o hover do orcamento diz que nao se aplica",
  comVis("maldicao").fontes.orcamento.some((p) => p.label === "Visionário (Não se Aplica)" && p.valor === 0), true);
t("a Maldicao tambem nao recebe vaga gratis de outra fonte (Apice do Controle)",
  res(nova("maldicao"), { ...DONO, efeitos: [{ canal: "orcamentoLivre", expr: "2", nome: "Ápice" }] }).orcamento.total,
  res(nova("maldicao")).orcamento.total);
const forte = { forca: 22, destreza: 20, constituicao: 22, inteligencia: 12, sabedoria: 12, presenca: 14 };
t("ficha adaptada: atributos acima do point-buy nao avisam na Maldicao",
  res(nova("maldicao", "quarto", { atributos: forte })).warnings.some((w) => w.startsWith("Atributos")), false);
t("e avisam no Shikigami",
  res(nova("shikigami", "quarto", { atributos: forte })).warnings.some((w) => w.startsWith("Atributos")), true);
const muitasPericias = { atletismo: "mestre", furtividade: "mestre", percepcao: "mestre" };
t("as pericias da maldicao ficam fora da cota",
  [res(nova("maldicao", "quarto", { periciasProf: muitasPericias })).warnings.some((w) => w.startsWith("Perícias")),
    res(nova("shikigami", "quarto", { periciasProf: muitasPericias })).warnings.some((w) => w.startsWith("Perícias"))],
  [false, true]);
t("Nivel de Aptidao: metade do mod de Presenca do Controlador, para baixo, minimo 0",
  [3, 5, 1, 0, -1].map((m) => res(nova("maldicao"), { ...DONO, modPresenca: m }).nivelAptidao.valor), [1, 2, 0, 0, 0]);
t("so a Maldicao tem Nivel de Aptidao", res(nova("shikigami"), { ...DONO, modPresenca: 4 }).nivelAptidao, null);
const maldFerida = sessao({ estado: "ativa", pvAtual: 5 });
t("a Maldicao se cura pela cura comum",
  linha(SES.aplicaCuraInvocacao(maldFerida, "X", 4, 30, regras("maldicao"), "comum")).pvAtual, 9);
t("e nao pela Energia Reversa",
  SES.aplicaCuraInvocacao(maldFerida, "X", 4, 30, regras("maldicao"), "er"), maldFerida);
t("o Corpo se cura pela Energia Reversa",
  linha(SES.aplicaCuraInvocacao(maldFerida, "X", 4, 30, regras("corpo"), "er")).pvAtual, 9);

/* A Autonomia da Maldição: paga no início do combate (Mecânicas), e na entrada
   quando o combate já corre (PV-10). */
const maldAuto = { ...res(nova("maldicao", "segundo"), { ...DONO, autonomia: true }), id: "X" };
t("a Autonomia da Maldicao e paga no inicio do combate",
  maldAuto.opcoesDeUso.find((o) => o.id === "autonomia").quando, "inicioCombate");
const foraDeCombate = sessao({ opcoesDeEntrada: { autonomia: true } });
const entradaFora = SES.entradaDaInvocacao(foraDeCombate, maldAuto);
t("ativada fora de combate, a Autonomia nao entra no custo",
  [entradaFora.custo.total, entradaFora.autonomia], [maldAuto.custo, false]);
const entradaDentro = SES.entradaDaInvocacao({ ...foraDeCombate, rodada: 2 }, maldAuto);
t("ativada com o combate correndo, a Autonomia vem junto",
  [entradaDentro.custo.total, entradaDentro.autonomia], [maldAuto.custo + 6, true]);
const ativaComMarca = sessao({ estado: "ativa", opcoesDeEntrada: { autonomia: true } });
const comecou = SES.iniciaCombate(ativaComMarca, { invocacoes: { lista: [maldAuto] } });
t("o inicio do combate cobra a Autonomia marcada de quem ja esta em campo",
  [comecou.peAtual, linha(comecou).autonomia, linha(comecou).ultimaEntrada.via, linha(comecou).opcoesDeEntrada],
  [20 - 6, true, "inicioCombate", {}]);
t("e nao cobra de novo se ja estava paga",
  SES.iniciaCombate({ ...comecou }, { invocacoes: { lista: [maldAuto] } }).peAtual, 14);
t("sem PE, o inicio do combate nao cobra nem liga",
  [SES.iniciaCombate({ ...ativaComMarca, peAtual: 2 }, { invocacoes: { lista: [maldAuto] } }).peAtual,
    linha(SES.iniciaCombate({ ...ativaComMarca, peAtual: 2 }, { invocacoes: { lista: [maldAuto] } })).autonomia],
  [2, false]);
t("na Ficha, sair da rodada 0 e o inicio do combate",
  linha(SES.proximaRodada(ativaComMarca, { invocacoes: { lista: [maldAuto] } }).sessao).autonomia, true);

/* ============================================================ */
/* 4. SHIKIGAMI DE TÉCNICA E O FUNDAMENTO                        */
/* ============================================================ */
t("o Fundamento so existe na Tecnica",
  [res(nova("tecnica", "quarto", { fundamento: true })).fundamento, res(nova("shikigami", "quarto", { fundamento: true })).fundamento],
  [true, false]);
const tec = res(nova("tecnica", "terceiro", { atributos: { forca: 10, destreza: 14, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 } }));
t("a Tecnica tem Iniciativa: Destreza e os bonus de todos os testes (o grau dela)",
  [tec.iniciativa.bonus, tec.iniciativa.partes.map((p) => p.label)], [2 + 2, ["Destreza", "Invocação de Técnica"]]);
t("quem nao tem turno proprio nao rola Iniciativa", res(nova("shikigami")).iniciativa, null);

const tecnicaInata = (fichaInv, mesa, registros = []) => I.estadoDaTecnicaInata(
  { invocacoes: fichaInv, fundamentosPerdidos: registros }, mesa,
);
const FUND = { ...nova("tecnica", "quarto", { fundamento: true }), id: "F", nome: "Divino" };
t("sem Fundamento, nada se bloqueia", tecnicaInata([nova("tecnica")], { X: { estado: "morta" } }).bloqueada, false);
t("no criador (sem mesa), nada se bloqueia", tecnicaInata([FUND], null).bloqueada, false);
const fora = tecnicaInata([FUND], {});
t("na mesa, com o Fundamento fora de campo, so a mesa bloqueia",
  [fora.perdida, fora.foraDeCampo, fora.motivo], [false, true, "Fundamento Fora de Campo"]);
t("com ele em campo, a Tecnica Inata funciona", tecnicaInata([FUND], { F: { estado: "ativa" } }).bloqueada, false);
const morto = tecnicaInata([FUND], { F: { estado: "morta" } });
t("morto, a Tecnica Inata e perdida, e a perda pede gravacao",
  [morto.perdida, morto.motivo, morto.aRegistrar], [true, "Fundamento Perdido", { invocacaoId: "F", nome: "Divino" }]);
const gravado = tecnicaInata([FUND], {}, [{ invocacaoId: "F", nome: "Divino", em: "2026-10-01" }]);
t("gravada na ficha, a perda vale sem mesa e sem pedir de novo",
  [gravado.perdida, gravado.aRegistrar, tecnicaInata([FUND], null, [{ invocacaoId: "F" }]).perdida], [true, null, true]);
t("e vale mesmo com a ficha do Fundamento removida da lista",
  tecnicaInata([], null, [{ invocacaoId: "F" }]).perdida, true);
t("dois Fundamentos avisam",
  res(FUND, { ...DONO, fundamentos: 2 }).warnings.some((w) => w.includes("Fundamento")), true);

/* De ponta a ponta: a Técnica Inata bloqueada mexe nos números da ficha. */
const PASSIVO = { id: "p1", tipo: "passivo", nome: "Corpo Rígido", nivel: 1, efeitosPassivo: [{ canal: "rdGeral", expr: "3" }] };
const ATIVO = { id: "a1", tipo: "dano", nome: "Raio", nivel: 1, alvo: "unico", acao: "comum" };
const fichaTec = (extra = {}) => {
  const c = S.createBlankAfty();
  c.core.tecnicaEfeitos = [{ canal: "defesa", expr: "2" }];
  c.feiticos = [PASSIVO, ATIVO];
  c.invocacoes = [FUND];
  return { ...c, ...extra };
};
const viva = D.deriveAfty(fichaTec());
const morta = D.deriveAfty(fichaTec(), { invocacoes: { F: { estado: "morta" } } });
const perdida = D.deriveAfty(fichaTec({ fundamentosPerdidos: [{ invocacaoId: "F", nome: "Divino", em: "x" }] }));
const semMesa = D.deriveAfty(fichaTec(), { invocacoes: {} });
t("morto, o Funcionamento e a Passiva saem do Motor",
  [viva.defesa - morta.defesa, viva.rdGeral - morta.rdGeral], [2, 3]);
t("e a perda gravada faz o mesmo sem mesa",
  [viva.defesa - perdida.defesa, viva.rdGeral - perdida.rdGeral], [2, 3]);
t("nada e apagado: os Feiticos seguem na lista, marcados",
  perdida.feiticos.lista.map((f) => [f.id, f.bloqueado]), [["p1", "Fundamento Perdido"], ["a1", "Fundamento Perdido"]]);
t("fora de campo, os Feiticos ficam marcados e os numeros nao mudam",
  [semMesa.feiticos.lista.map((f) => f.bloqueado), semMesa.defesa === viva.defesa, semMesa.rdGeral === viva.rdGeral],
  [["Fundamento Fora de Campo", "Fundamento Fora de Campo"], true, true]);
t("com o Fundamento em campo, nada e marcado",
  D.deriveAfty(fichaTec(), { invocacoes: { F: { estado: "ativa" } } }).feiticos.lista.some((f) => f.bloqueado), false);
t("o derive expoe o estado, com a perda a gravar", morta.tecnicaInata.aRegistrar, { invocacaoId: "F", nome: "Divino" });
t("a ficha em branco nasce sem perda", S.createBlankAfty().fundamentosPerdidos, []);

/* ============================================================ */
/* 5. O ENCONTRO                                                 */
/* ============================================================ */
/* E-13: o cache do derive do combatente ignorava o estado das invocações, então
   pôr uma invocação em campo no Encontro não mexia em número nenhum. */
const fichaCtr = fichaTec();
const sessaoBase = SES.sessaoEmBranco(viva);
const comb = { id: "c1", ficha: fichaCtr, sessao: sessaoBase };
const antes = ENC.derivarComCache(comb, 0);
const depois = ENC.derivarComCache({ ...comb, sessao: { ...sessaoBase, invocacoes: { F: { estado: "morta" } } } }, 0);
t("E-13: mudar o estado das invocacoes deriva de novo",
  [antes === depois, antes.feiticos.lista[0].bloqueado ?? null, depois.feiticos.lista[0].bloqueado], [false, "Fundamento Fora de Campo", "Fundamento Perdido"]);
t("e a mesma sessao reaproveita o derive", ENC.derivarComCache(comb, 0) === ENC.derivarComCache(comb, 0), true);
const condicao = ENC.derivarComCache({ ...comb, sessao: { ...sessaoBase, condicoes: [{ id: "paralisado", nome: "Paralisado" }] } }, 0);
t("E-13: as condicoes tambem entram na chave", condicao === ENC.derivarComCache(comb, 0), false);

const encontro = { combatentes: [{ id: "c1", ficha: fichaCtr, sessao: sessaoBase }], log: [] };
const registro = { invocacaoId: "F", nome: "Divino", em: "2026-10-01" };
const gravou = ENC.redutorDeEncontro(encontro, { tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id: "c1", registro });
t("a morte do Fundamento vai para a ficha do combatente",
  gravou.combatentes[0].ficha.fundamentosPerdidos, [registro]);
t("e o registro repetido e ignorado",
  ENC.redutorDeEncontro(gravou, { tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id: "c1", registro }), gravou);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
