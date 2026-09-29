/* Pacote Yna (2026-09-29): Origem Kitsune, Linhagem Clã Getsurin, Treino de
   Cônjuge e Treino de Desenvolvimento Amaldiçoado.

   Três decisões do autor que este arquivo prende:
   • as Caudas são CONTADAS pela ficha (1 + nível 3 + cada subida do BT + nível
     20, mais os Marcos do Narrador, até 10), e o segundo efeito da Linhagem liga
     sozinho em 5;
   • a Forma de Raposa é INTERRUPTOR DE SESSÃO, o mesmo `gatilhoSessao` do
     Cônjuge, agora aceito em característica de origem. Ela vale fora de combate;
   • o pacote vale nos DOIS sistemas.

   ⚠ O PACOTE VEM DO JSON em `addons/`, o mesmo texto que se cola no Instalar. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const TR = await import(R + "afty-treinamentos.js");
const { valorCanal } = await import(R + "afty-efeitos.js");
const { anatomiaTotal } = await import(R + "afty-anatomias.js");
const CO = await import(R + "afty-contadores-origem.js");
const FC = await import(R + "ficha/ficha-conteudo.js");

const YNA = JSON.parse(readFileSync(new URL("../addons/yna.json", import.meta.url), "utf8"));

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const pacote = A.normalizarPacote(YNA);
t("o pacote valida sem problema nenhum", A.validarPacote(YNA), []);
t("não pede primitiva nem liberação: tudo é conteúdo", [pacote.permite ?? [], pacote.libera ?? []], [[], []]);
t("o contador sobrevive à normalização (campo novo some calado se faltar lá)",
  pacote.contadoresOrigem?.map((c) => c.id), ["caudas_por_marco"]);
A.aplicarAddons([pacote]);

const NS = "yna:";
const KITSUNE = `${NS}kitsune`;
const GETSURIN = `${NS}linhagem_getsurin`;
const CONJUGE = `${NS}treino_de_conjuge`;
const DESENV = `${NS}treino_de_desenvolvimento_amaldicoado`;

const origem = O.getOrigem(KITSUNE);
t("a origem Kitsune existe, com o namespace", !!origem, true);
t("a origem se divide em Linhagem, e não em Clã", [origem?.clasRotulo, origem?.clasArtigo], ["Linhagem", "uma"]);
t("a única Linhagem é o Clã Getsurin", O.clasDaOrigem(KITSUNE)?.map((c) => c.id), [GETSURIN]);
t("getCla acha o Getsurin inteiro, com as duas características",
  O.getCla(GETSURIN)?.caracteristicas?.map((c) => c.id), ["salto_gravitacional", "lapidacao_prateada"]);
t("não é variação de nada: Kitsune é origem própria", origem?.variacaoDe ?? null, null);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const ficha = ({
  nd = 5, sistema = "afty", cla = GETSURIN, marcos = 0, pericias = {}, tipo = "conjurador",
  origemId = KITSUNE, treinamentos = {}, alvos = {}, escolhas = {}, anatomias = [], addons = [pacote],
} = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd, tipo, patamar: "comum" };
  c.core.origem = { id: origemId, ...(cla ? { cla } : {}), ...(anatomias.length ? { anatomias } : {}) };
  c.addons = addons;
  c.origemContadores = { [`${NS}caudas_por_marco`]: marcos };
  c.pericias = { ...(c.pericias || {}), ...pericias };
  c.treinamentos = treinamentos;
  c.treinamentoAlvos = alvos;
  c.treinamentoEscolhas = escolhas;
  return c;
};
const caudas = (d) => d.mesa?.["origem:caudas_de_uma_raposa"]?.resultados?.find((r) => r.label === "Caudas")?.valor;
const detalhes = (d, filtro) => (d.efeitos?.detalhes || []).filter(filtro);
const pericia = (d, id) => d.testes?.pericias?.find((p) => p.id === id);
const esperadoCaudas = (nd, m) => Math.min(10, 1 + (nd >= 3) + (maestria(nd) - 2) + m + (nd >= 20));

for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;

  /* ---------- Caudas ---------- */
  for (const [nd, m] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [9, 0], [13, 0], [17, 0], [19, 0], [20, 0], [20, 3], [3, 3], [26, 3]]) {
    t(`${S} Caudas no nível ${nd} com ${m} Marco(s)`, caudas(deriveAfty(ficha({ nd, marcos: m, sistema }))), esperadoCaudas(nd, m));
  }
  t(`${S} Caudas na escada do texto: 1, 2 no nível 3, uma por subida do BT, uma no 20`,
    [1, 3, 5, 9, 13, 17, 20].map((nd) => caudas(deriveAfty(ficha({ nd, sistema })))), [1, 2, 3, 4, 5, 6, 7]);
  t(`${S} o teto é 10, mesmo com três Marcos no nível 20`, caudas(deriveAfty(ficha({ nd: 20, marcos: 3, sistema }))), 10);

  /* ---------- Lapidação Prateada: o 2º efeito, em 5 Caudas ---------- */
  const aptidaoSemCla = (nd, marcos = 0) => deriveAfty(ficha({ nd, marcos, sistema, cla: null })).totalAptidao;
  const aptidao = (nd, marcos = 0) => deriveAfty(ficha({ nd, marcos, sistema })).totalAptidao;
  t(`${S} 4 Caudas (nível 9): a Lapidação ainda não dá o Nível de Aptidão`, aptidao(9) - aptidaoSemCla(9), 0);
  t(`${S} 5 Caudas (nível 9 com um Marco): +1 Nível de Aptidão à escolha`, aptidao(9, 1) - aptidaoSemCla(9, 1), 1);
  t(`${S} 5 Caudas (nível 13): +1 Nível de Aptidão`, aptidao(13) - aptidaoSemCla(13), 1);
  t(`${S} 5 Caudas cedo (nível 5 com três Marcos): +1 Nível de Aptidão`, aptidao(5, 3) - aptidaoSemCla(5, 3), 1);
  t(`${S} o +1 vem com o nome da Lapidação no hover`,
    detalhes(deriveAfty(ficha({ nd: 13, sistema })), (x) => x.canal === "pontosAptidao" && x.nome === "Lapidação Prateada").map((x) => x.valor), [1]);

  /* ---------- Salto Gravitacional: Atletismo treinado, ou mestre se já era ---------- */
  const dSemEscolha = deriveAfty(ficha({ nd: 5, sistema }));
  t(`${S} sem escolher Atletismo, a Linhagem o dá Treinado`, pericia(dSemEscolha, "atletismo")?.prof, "treinado");
  const dJaTreinado = deriveAfty(ficha({ nd: 5, sistema, pericias: { atletismo: "treinado" } }));
  t(`${S} já treinado em Atletismo, vira Mestre`, pericia(dJaTreinado, "atletismo")?.prof, "mestre");
  t(`${S} sem a Linhagem escolhida, Atletismo segue sem treino`,
    pericia(deriveAfty(ficha({ nd: 5, sistema, cla: null })), "atletismo")?.prof ?? null,
    pericia(deriveAfty(ficha({ nd: 5, sistema, origemId: "inato", cla: null })), "atletismo")?.prof ?? null);

  /* ---------- Herança de Inari: o pool do Feto ---------- */
  t(`${S} a Herança de Inari abre o pool de Anatomia`,
    O.caracteristicasEfetivas(ficha({ sistema })).some((c) => c.poolAnatomia), true);
  t(`${S} uma Anatomia no 1º nível e mais uma a cada 5`, [1, 4, 5, 10, 20].map(anatomiaTotal), [1, 1, 2, 3, 5]);
  const dInstinto = deriveAfty(ficha({ nd: 5, sistema, anatomias: ["instinto_sanguinario"] }));
  t(`${S} a Anatomia escolhida soma de verdade (Instinto Sanguinário na Iniciativa)`,
    detalhes(dInstinto, (x) => x.canal === "iniciativa" && x.nome === "Instinto Sanguinário").map((x) => x.valor), [maestria(5)]);

  /* ---------- Forma de Raposa: interruptor de sessão ---------- */
  const dForaSessao = deriveAfty(ficha({ nd: 5, sistema }));
  const dRaposa = deriveAfty(ficha({ nd: 5, sistema }), { treinosAtivos: { forma_de_raposa: true } });
  t(`${S} o interruptor aparece, desligado`, dForaSessao.gatilhosTreino, [{ id: "forma_de_raposa", label: "Forma de Raposa", ativo: false }]);
  t(`${S} ligado, ele diz que está ligado`, dRaposa.gatilhosTreino.map((g) => g.ativo), [true]);
  t(`${S} desligado, nada da Forma entra na conta`, detalhes(dForaSessao, (x) => String(x.nome).startsWith("Forma de Raposa")), []);
  t(`${S} ligado, o tamanho vira Pequeno`, [dForaSessao.tamanho, dRaposa.tamanho], ["medio", "pequeno"]);
  t(`${S} ligado, +2 em Percepção`, pericia(dRaposa, "percepcao")?.bonus - pericia(dForaSessao, "percepcao")?.bonus, 2);
  t(`${S} e a régua do Pequeno vem junto (Atletismo -2, Furtividade +2)`,
    [pericia(dRaposa, "atletismo")?.bonus - pericia(dForaSessao, "atletismo")?.bonus,
      pericia(dRaposa, "furtividade")?.bonus - pericia(dForaSessao, "furtividade")?.bonus], [-2, 2]);
  t(`${S} as duas linhas são temporárias (aba Buffs lista, pré-requisito não conta)`,
    detalhes(dRaposa, (x) => String(x.nome).startsWith("Forma de Raposa")).map((x) => x.duracao), ["temporaria", "temporaria"]);
  t(`${S} vale FORA de combate: a bancada desligada não apaga a Forma`, dRaposa.combate?.ativo ?? false, false);

  /* ---------- Contador de Marcos ---------- */
  const [contador] = CO.contadoresOrigemDeAddon(ficha({ sistema }));
  t(`${S} o contador de Marcos aparece para a Kitsune`, [contador?.id, contador?.label, contador?.min, contador?.max],
    [`${NS}caudas_por_marco`, "Caudas por Marco", 0, 3]);
  t(`${S} o contador apara em 3`, CO.clampContadorOrigem(contador, 5), 3);
  t(`${S} outra origem com o pacote não vê o contador`, CO.contadoresOrigemDeAddon(ficha({ sistema, origemId: "inato", cla: null })), []);

  /* ---------- Treino de Cônjuge ---------- */
  const conjuge = (treinosAtivos) => deriveAfty(ficha({
    nd: 8, sistema,
    treinamentos: { [CONJUGE]: 4 },
    alvos: { [CONJUGE]: { pericia: "intuicao", bonusConjuge: 30 } },
    escolhas: { [CONJUGE]: { heranca_conjuge: "feitico" } },
  }), { treinosAtivos });
  const dCSem = conjuge({});
  const dCCom = conjuge({ conjuge: true });
  const daLinha = (d) => detalhes(d, (x) => x.origem === CONJUGE).map((x) => `${x.canal}:${x.alvo ?? ""}:${x.valor}`).sort();
  t(`${S} Cônjuge fora da sessão: só a vaga da Herança`, daLinha(dCSem), ["vagasFeitico::1"]);
  t(`${S} Cônjuge na sessão: Perícia fixa, +2 de dano, +2 de Acerto e metade do BT na Iniciativa`, daLinha(dCCom),
    [`bonusAcerto::2`, `danoBonus::2`, `iniciativa::${Math.floor(maestria(8) / 2)}`, `periciaFixa:intuicao:30`, "vagasFeitico::1"].sort());
  t(`${S} os dois interruptores juntos, o do treino e o da origem`, dCCom.gatilhosTreino.map((g) => g.id), ["conjuge", "forma_de_raposa"]);
  t(`${S} a Intuição usa o bônus do Cônjuge`, pericia(dCCom, "intuicao")?.bonus, 30);

  /* ---------- Treino de Desenvolvimento Amaldiçoado ---------- */
  const desenv = (p, tipo = "conjurador") => deriveAfty(ficha({ nd: 8, sistema, tipo, treinamentos: { [DESENV]: p } }));
  const d0 = desenv(0);
  t(`${S} Desenvolvimento, etapa 1: +2 PE`, desenv(1).pe - d0.pe, 2);
  t(`${S} Desenvolvimento, etapa 2: +2 em Feitiçaria`, pericia(desenv(2), "feiticaria")?.bonus - pericia(d0, "feiticaria")?.bonus, 2);
  t(`${S} Desenvolvimento, etapa 3: +3 PE (5 no total)`, desenv(3).pe - d0.pe, 5);
  t(`${S} Desenvolvimento completo: +1 Nível de Aptidão da etapa 4 e +1 do Completo`, desenv(4).totalAptidao - d0.totalAptidao, 2);
}

/* ============================================================ */
/* 3. CATÁLOGO DOS TREINOS                                       */
/* ============================================================ */
const linha = (id) => TR.AFTY_TREINAMENTOS.find((l) => l.id === id);
t("Cônjuge custa 1, 1, 1 e 2 Focos", linha(CONJUGE)?.etapas.map((e) => e.focos), [1, 1, 1, 2]);
t("Desenvolvimento custa 1, 1, 1 e 2 Focos (só a etapa 4 diz o número)", linha(DESENV)?.etapas.map((e) => e.focos), [1, 1, 1, 2]);
t("as duas linhas aparecem para a Kitsune",
  [CONJUGE, DESENV].map((id) => TR.treinamentosDaOrigem(KITSUNE, null, ficha()).some((l) => l.id === id)), [true, true]);
t("o Desenvolvimento fica fora do Restringido, como toda linha de energia",
  TR.treinamentosDaOrigem("restringido", null, null).some((l) => l.id === DESENV), false);
t("o interruptor do Cônjuge do treino continua com id cru, igual ao do Flugel", linha(CONJUGE)?.gatilhoSessao?.id, "conjuge");

/* ============================================================ */
/* 4. A FICHA FINAL MOSTRA AS CAUDAS                             */
/* ============================================================ */
const fichaFinal = ficha({ nd: 13, marcos: 1 });
const itemCaudas = FC.conteudoDaFicha(fichaFinal, deriveAfty(fichaFinal)).find((i) => i.chave === "origem:caudas_de_uma_raposa");
t("a linha das Caudas mostra o número pronto", itemCaudas?.numeros, ["Caudas: 6"]);

/* ============================================================ */
/* 5. QUEM NÃO TEM O PACOTE NÃO VÊ NADA                          */
/* ============================================================ */
const raw = deriveAfty(ficha({ origemId: "inato", cla: null, addons: [] }));
t("ficha sem o pacote: nenhum interruptor", raw.gatilhosTreino, []);
t("ficha sem o pacote: nenhum contador", CO.contadoresOrigemDeAddon(ficha({ origemId: "inato", cla: null, addons: [] })), []);
t("sem a Forma declarada, o efeito com gatilho da origem nem existe no raw",
  valorCanal(raw.efeitos, "tamanho"), 0);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` ✗ ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
