/* A EXPANSÃO DE DOMÍNIO NA SESSÃO (Etapa 9, 2026-10-08).

   Abrir paga o PE (Ação Comum, DA-10) e só com a Expansão válida (DA-17). As
   fases (DA-15): na `confronto` e na `estendido` nada vale, e a `ativa` liga
   tudo. A duração conta na virada da rodada e fecha sozinha. O domo a zero
   fecha. A Exaustão de Técnica (Livro: 1, 2, 4 e 5 rodadas, "só aplicada após o
   domínio ser desmanchado") começa no fechamento, menos na interrupção por Golpe
   de Oportunidade (PE fica gasto) e no descanso (que zera tudo). Ela é TRAVA
   (DA-16): os Feitiços saem indisponíveis e os efeitos deles saem do Motor.

   ⚠ Sessão antiga, sem fase, vale `ativa`. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const DOM = await import(R + "afty-dominios.js");
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A CONTESTAÇÃO EM NÚMEROS                                   */
/* ============================================================ */
t("Contestação Incompleta, DOM 3", DOM.contestacaoDoDominio("incompleta", { dom: 3, bt: 4 }).danoPorRodada, 75);
t("Contestação Completa, DOM 3", DOM.contestacaoDoDominio("completa", { dom: 3 }).danoPorRodada, 150);
t("a área é metade (Completa 9 m vira 4,5)", DOM.contestacaoDoDominio("completa", { dom: 3 }).area, "4,5 metros");
t("a Sem Barreiras não contesta", DOM.contestacaoDoDominio("sem_barreiras", { dom: 5 }), null);

/* ============================================================ */
/* 2. A SESSÃO, NOS DOIS SISTEMAS                                */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = ({ ag = false, efeitos = [], feiticos = [] } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 15;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoes = { dom: 4, bar: 4 };
    c.aptidoesAmaldicoadas = [
      "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa",
      ...(ag ? ["acerto_garantido"] : []),
    ];
    c.feiticos = feiticos;
    c.dominios = [{
      id: "d1", nome: "Jardim", versao: "completa", regra: "oficial", efeitos,
      ...(ag ? { acertoGarantido: { ativo: true, tipo: "ataque_armado" } } : {}),
    }];
    return c;
  };
  // A Ficha em jogo: a ficha crua mais o `combate` e as opções da sessão.
  const jogo = (c, s) => deriveAfty({ ...c, combate: s.combate }, { exaustaoTecnica: s.exaustaoTecnica });
  const linha = (d) => d.dominios.lista[0];
  const c = ficha();
  const d0 = deriveAfty(c);
  const L = linha(d0);
  const emCombate = (s) => S.aplicaPatchCombate(s, { ativo: true });
  // PE de sobra: o jogador no ND 15 tem menos que os 20 da Completa.
  const base = { ...emCombate(S.sessaoEmBranco(d0)), peAtual: 100 };

  t(`${sistema}: sessão nova sem Exaustão de Técnica`, S.sessaoEmBranco(d0).exaustaoTecnica, null);
  t(`${sistema}: sessão antiga sem o campo lê nulo`, S.normalizaSessao({ hpAtual: 3 }, d0).exaustaoTecnica, null);
  t(`${sistema}: sessão antiga sem fase vale ativa`,
    S.expansaoNaSessao({ combate: { ativo: true, dominioAtivo: "d1" } }).fase, "ativa");
  t(`${sistema}: os números da linha`, [L.custo, L.duracao, L.temDomo, L.exaustaoTecnica], [20, 7, true, 2]);

  // A situação antes de abrir.
  t(`${sistema}: fora de combate não abre`, S.situacaoDaExpansao(S.sessaoEmBranco(d0), L).motivo, "Fora de Combate");
  t(`${sistema}: sem PE não abre`, S.situacaoDaExpansao({ ...base, peAtual: 19 }, L).motivo, "PE Insuficiente");
  t(`${sistema}: inválida não abre (DA-17)`, S.situacaoDaExpansao(base, { ...L, valida: false }).motivo, "Expansão Inválida");
  t(`${sistema}: em combate com PE abre`, S.situacaoDaExpansao(base, L).podeAbrir, true);

  // ABRIR paga o PE e liga os efeitos.
  const aberta = S.abreExpansao(base, L);
  t(`${sistema}: abrir paga ${L.custo} PE`, base.peAtual - aberta.peAtual, 20);
  t(`${sistema}: e guarda o estado`, S.expansaoNaSessao(aberta),
    { id: "d1", fase: "ativa", rodadas: 7, pvDomo: L.pvBarreira, pvDomoMax: L.pvBarreira, exaustao: 2, nome: "Jardim" });
  const dAberta = jogo(c, aberta);
  const movimento = (d) => d.efeitos.detalhes.some((x) => x.canal === "movimentoMult" && x.nome?.startsWith("Jardim"));
  t(`${sistema}: com ela aberta os efeitos valem`, [movimento(dAberta), dAberta.dominios.ativoId], [true, "d1"]);
  t(`${sistema}: abrir de novo não paga de novo`, S.abreExpansao(aberta, L), aberta);
  t(`${sistema}: e diz por quê`, S.situacaoDaExpansao(aberta, L).motivo, "Expansão Aberta");

  // AS FASES (DA-15).
  for (const fase of ["confronto", "estendido", "contestando"]) {
    const s = S.defineFaseDaExpansao(aberta, fase);
    t(`${sistema}: na fase ${fase} nada vale`, movimento(jogo(c, s)), false);
  }
  const conflitoNoAr = jogo(c, aberta).dominios.conflito.bonus;
  const conflitoConfronto = jogo(c, S.defineFaseDaExpansao(aberta, "confronto")).dominios.conflito.bonus;
  t(`${sistema}: o +2 do Confronto só com ela valendo`, conflitoNoAr - conflitoConfronto, 2);
  t(`${sistema}: vencer o confronto volta a ativa`, movimento(jogo(c, S.defineFaseDaExpansao(S.defineFaseDaExpansao(aberta, "confronto"), "ativa"))), true);
  t(`${sistema}: fase desconhecida não muda nada`, S.defineFaseDaExpansao(aberta, "xyz"), aberta);
  // A Ficha lê a aberta e a fase pelo derive (Etapa 10), separadas da escolhida.
  t(`${sistema}: o derive diz qual está aberta`, jogo(c, aberta).dominios.aberta, { id: "d1", fase: "ativa" });
  t(`${sistema}: e em que fase`, jogo(c, S.defineFaseDaExpansao(aberta, "estendido")).dominios.aberta, { id: "d1", fase: "estendido" });
  t(`${sistema}: fechada, nenhuma aberta, mas segue a escolhida`, [jogo(c, base).dominios.aberta, jogo(c, base).dominios.ativoId], [null, "d1"]);

  // A DURAÇÃO fecha sozinha, e a Exaustão começa cheia.
  let s = aberta;
  for (let i = 0; i < 6; i++) s = S.proximaRodada(s, d0).sessao;
  t(`${sistema}: na sexta virada falta 1`, S.expansaoNaSessao(s)?.rodadas, 1);
  s = S.proximaRodada(s, d0).sessao;
  t(`${sistema}: na sétima ela fecha`, [S.expansaoNaSessao(s), s.combate.dominioUltimoFechamento.motivo], [null, "duracao"]);
  t(`${sistema}: e a Exaustão de Técnica começa com 2`, S.exaustaoTecnicaDe(s), { restantes: 2, total: 2, fonte: "Jardim" });
  s = S.proximaRodada(s, d0).sessao;
  t(`${sistema}: uma virada depois, 1`, S.exaustaoTecnicaDe(s)?.restantes, 1);
  s = S.proximaRodada(s, d0).sessao;
  t(`${sistema}: e some`, S.exaustaoTecnicaDe(s), null);

  // O DOMO a zero fecha.
  const meio = S.danoNoDomo(aberta, 10);
  t(`${sistema}: o domo perde PV`, S.expansaoNaSessao(meio).pvDomo, L.pvBarreira - 10);
  t(`${sistema}: e não passa do máximo`, S.expansaoNaSessao(S.danoNoDomo(meio, -999)).pvDomo, L.pvBarreira);
  const caiu = S.danoNoDomo(aberta, 99999);
  t(`${sistema}: domo a zero fecha com Exaustão`, [S.expansaoNaSessao(caiu), caiu.combate.dominioUltimoFechamento.motivo, S.exaustaoTecnicaDe(caiu)?.restantes], [null, "domo", 2]);

  // PERDER, INTERROMPER, DESCANSAR, ACABAR O COMBATE.
  t(`${sistema}: perder o confronto cobra a Exaustão`, S.exaustaoTecnicaDe(S.encerraExpansao(aberta, "perdeu"))?.restantes, 2);
  const interrompida = S.encerraExpansao(aberta, "interrompida");
  t(`${sistema}: interrompida não cobra a Exaustão e o PE fica gasto`,
    [S.exaustaoTecnicaDe(interrompida), interrompida.peAtual, S.expansaoNaSessao(interrompida)], [null, aberta.peAtual, null]);
  const descanso = S.descansar(S.encerraExpansao(aberta, "perdeu"), d0);
  t(`${sistema}: o descanso zera a Exaustão`, S.exaustaoTecnicaDe(descanso), null);
  const descansoAberta = S.descansar(aberta, d0);
  t(`${sistema}: e fecha a aberta sem cobrar`, [S.expansaoNaSessao(descansoAberta), S.exaustaoTecnicaDe(descansoAberta)], [null, null]);
  const fim = S.aplicaPatchCombate(aberta, { ativo: false });
  t(`${sistema}: o fim do combate desmancha e cobra`, [S.expansaoNaSessao(fim), S.exaustaoTecnicaDe(fim)?.restantes], [null, 2]);
  const maior = S.encerraExpansao({ ...aberta, exaustaoTecnica: { restantes: 5, total: 5, fonte: "x" } }, "encerrada");
  t(`${sistema}: a Exaustão nova não soma, fica a maior`, S.exaustaoTecnicaDe(maior)?.restantes, 5);

  // AJUSTE À MÃO e CURA.
  const ajustada = S.ajustaExaustaoTecnica(fim, 2);
  t(`${sistema}: ajuste à mão`, S.exaustaoTecnicaDe(ajustada)?.restantes, 4);
  t(`${sistema}: ajuste não passa de zero`, S.exaustaoTecnicaDe(S.ajustaExaustaoTecnica(fim, -9)), null);
  t(`${sistema}: curar zera`, S.exaustaoTecnicaDe(S.curaExaustaoTecnica(fim)), null);
  t(`${sistema}: rodadas da Expansão à mão`, S.expansaoNaSessao(S.ajustaRodadasDaExpansao(aberta, -2)).rodadas, 5);
  t(`${sistema}: rodadas a zero fecham`, S.expansaoNaSessao(S.ajustaRodadasDaExpansao(aberta, -7)), null);

  // Com Acerto Garantido, 4 rodadas e +5 PE.
  const cAG = ficha({ ag: true });
  const LAG = linha(deriveAfty(cAG));
  const abertaAG = S.abreExpansao(base, LAG);
  t(`${sistema}: com Acerto Garantido paga 25`, base.peAtual - abertaAG.peAtual, 25);
  t(`${sistema}: e a Exaustão é 4`, S.exaustaoTecnicaDe(S.encerraExpansao(abertaAG))?.restantes, 4);

  /* ---------- A TRAVA DA EXAUSTÃO (DA-16) ---------- */
  const passivo = { ...F.createBlankFeitico(), id: "p1", nome: "Pele", tipo: "passivo", nivel: 1, efeitosPassivo: [{ canal: "defesa", expr: "1" }] };
  const dano = { ...F.createBlankFeitico(), id: "f1", nome: "Corte", nivel: 1 };
  const cF = ficha({ feiticos: [passivo, dano] });
  cF.core.tecnicaEfeitos = [{ canal: "atencao", expr: "1" }];
  const livre = deriveAfty(cF);
  const exausta = deriveAfty(cF, { exaustaoTecnica: { restantes: 2, total: 2, fonte: "Jardim" } });
  const linhaF = (d) => d.feiticos.lista.find((x) => x.id === "f1");
  const temPassivo = (d) => d.efeitos.detalhes.some((x) => x.canal === "defesa" && x.nome === "Pele");
  const temFuncionamento = (d) => d.efeitos.detalhes.some((x) => x.canal === "atencao");
  t(`${sistema}: sem Exaustão o Feitiço está livre`, [linhaF(livre).bloqueado ?? null, temPassivo(livre), livre.exaustaoTecnica], [null, true, null]);
  t(`${sistema}: com Exaustão o Feitiço trava`, linhaF(exausta).bloqueado, "Técnica Inutilizável · 2 Rodadas");
  t(`${sistema}: o Passivo sai do Motor`, temPassivo(exausta), false);
  t(`${sistema}: o Funcionamento Básico fica (NOVA DECISÃO)`, temFuncionamento(exausta), true);
  t(`${sistema}: o derive expõe a Exaustão`, exausta.exaustaoTecnica?.restantes, 2);
  t(`${sistema}: a Exaustão não trava a abertura (DA-16, Aptidão)`,
    S.situacaoDaExpansao({ ...base, exaustaoTecnica: { restantes: 3, total: 3, fonte: "x" } }, L).podeAbrir, true);

  /* ---------- O SELETOR DA ABA BUFFS ---------- */
  const estado = { id: "dominioAtivo", tipo: "dominio" };
  const peloSeletor = S.alteraEstadoCombate(base, estado, "d1", d0);
  t(`${sistema}: o seletor abre pagando o PE`, [S.expansaoNaSessao(peloSeletor)?.rodadas, base.peAtual - peloSeletor.peAtual], [7, 20]);
  const fechadoSeletor = S.alteraEstadoCombate(peloSeletor, estado, null, d0);
  t(`${sistema}: e fecha cobrando a Exaustão`, [S.expansaoNaSessao(fechadoSeletor), S.exaustaoTecnicaDe(fechadoSeletor)?.restantes], [null, 2]);
  t(`${sistema}: sem PE o seletor não abre`, S.expansaoNaSessao(S.alteraEstadoCombate({ ...base, peAtual: 0 }, estado, "d1", d0)), null);
  t(`${sistema}: sem o derive fica o jeito antigo`, S.alteraEstadoCombate(base, estado, "d1").combate.dominioAtivo, "d1");
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
