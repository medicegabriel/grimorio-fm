/* MIGRAÇÃO E COMPATIBILIDADE DA TÉCNICA MÁXIMA E DA EXPANSÃO (Etapa 11, 2026-10-08).

   Nenhuma migração escrita: tudo é leitura. O que esta suíte prende:
     • a Expansão gravada antes fica byte a byte igual depois de derivar, e é
       lida no regime de antes (LEGACY);
     • o Fortalecer booleano vira um fortalecimento, o texto livre de tipos de RD
       fica guardado (sem virar número), o Acerto Garantido `{ ativo, escopo }`
       fica no modo anterior;
     • a sessão antiga (sem fase, ou com `dominioAtivo: true`) continua valendo;
     • DA-02: o modelo de Técnica Máxima de Addon só aparece com vaga livre e
       nasce oficial, e a cópia de antes fica LEGACY na atualização. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const DOM = await import(R + "afty-dominios.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Uma Expansão como a ficha gravava até 2026-10-07. */
const ANTIGA = {
  id: "d1",
  nome: "Jardim Antigo",
  versao: "completa",
  aparencia: "Flores",
  efeitos: [
    { id: "e1", categoria: "amp_corporal", tipo: "defesa", fortalecido: true },
    { id: "e2", categoria: "amp_corporal", tipo: "rd", rdTipos: "fogo e gelo" },
  ],
  beneficiosRitual: { dano: "aumentoDano" },
  acertoGarantido: { ativo: true, escopo: "o soco" },
};
const SEM_BARREIRAS_ANTIGA = { id: "sb", nome: "Céu", versao: "sem_barreiras", efeitos: [] };

for (const sistema of ["afty", "player"]) {
  const ficha = (dominios) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 20;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoes = { dom: 5, bar: 5 };
    c.aptidoesAmaldicoadas = [
      "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa",
      "acerto_garantido", "expansao_de_dominio_sem_barreiras",
    ];
    c.dominios = JSON.parse(JSON.stringify(dominios));
    return c;
  };

  /* ---------- A EXPANSÃO GRAVADA ---------- */
  const c = ficha([ANTIGA, SEM_BARREIRAS_ANTIGA]);
  const antes = JSON.stringify(c);
  const d = deriveAfty(c);
  t(`${sistema}: derivar não muda a ficha`, JSON.stringify(c), antes);
  const L = d.dominios.lista.find((x) => x.id === "d1");
  t(`${sistema}: sem regra gravada é LEGACY`, L.legacy, true);
  t(`${sistema}: o Fortalecer booleano vira um fortalecimento`, L.efeitos[0].fortalecimentos, 1);
  t(`${sistema}: e o valor do Livro (Defesa DOM 5, 12 vira 18)`, DOM.valorDoEfeito(L.efeitos[0], 5, "completa"), "+18 de Defesa");
  t(`${sistema}: o texto de tipos de RD fica guardado`, [L.efeitos[1].rdTipos, L.efeitos[1].rdTiposTexto], [[], "fogo e gelo"]);
  t(`${sistema}: e a RD não sai sem a lista`, L.validacao.map((v) => v.codigo).includes("rdTipos"), true);
  t(`${sistema}: o Acerto Garantido fica no modo anterior`, [L.acertoGarantido.tipo, L.acertoGarantido.descricao], [null, "o soco"]);
  t(`${sistema}: o Ritual gravado continua`, L.beneficiosRitual.dano, "aumentoDano");
  const SB = d.dominios.lista.find((x) => x.id === "sb");
  t(`${sistema}: a Sem Barreiras de antes segue com o Totem e o 9 × BT`, [SB.temDomo, SB.area.endsWith("metros")], [true, true]);
  t(`${sistema}: e custa 25, como a oficial`, SB.custo, 25);
  const oficial = deriveAfty(ficha([{ ...SEM_BARREIRAS_ANTIGA, regra: "oficial" }])).dominios.lista[0];
  t(`${sistema}: a convertida perde o Totem e o número de área`, [oficial.temDomo, oficial.area], [false, "Definida pela Mesa"]);

  /* ---------- A SESSÃO GRAVADA ---------- */
  const semFase = deriveAfty({ ...c, combate: { ativo: true, dominioAtivo: "d1" } });
  t(`${sistema}: sessão sem fase liga os efeitos`, semFase.dominios.aberta, { id: "d1", fase: "ativa" });
  const booleana = deriveAfty({ ...ficha([ANTIGA]), combate: { ativo: true, dominioAtivo: true } });
  t(`${sistema}: o dominioAtivo booleano de antes ainda vale`, booleana.dominios.aberta, { id: "d1", fase: "ativa" });
  t(`${sistema}: a sessão antiga normaliza sem perder o combate`,
    S.normalizaSessao({ combate: { ativo: true, dominioAtivo: "d1" } }, d).combate, { ativo: true, dominioAtivo: "d1" });
}

/* ============================================================ */
/* O MODELO DE TÉCNICA MÁXIMA DE ADDON (DA-02)                   */
/* ============================================================ */
const PACOTE = {
  id: "pacote-tm", nome: "Pacote", versao: "2.0.0",
  feiticos: [
    { id: "fim", nome: "Fim", tipo: "dano", nivel: "max" },
    { id: "corte", nome: "Corte", tipo: "dano", nivel: 3 },
  ],
};
const criatura = createBlankAfty();
criatura.addons = [PACOTE];
const nomes = (lista) => lista.map((m) => m.nome);
t("sem saber das vagas, o modelo aparece como antes",
  AD.modelosPendentesDeAddon(criatura, 5, []).map((m) => [m.nome, m.regraTecnicaMaxima ?? null]), [["Fim", null], ["Corte", null]]);
t("sem vaga livre, a Técnica Máxima não aparece", nomes(AD.modelosPendentesDeAddon(criatura, 5, [], { tecnicasMaximasLivres: 0 })), ["Corte"]);
const comVaga = AD.modelosPendentesDeAddon(criatura, 5, [], { tecnicasMaximasLivres: 1 });
t("com vaga, ela aparece e nasce oficial", comVaga.map((m) => [m.nome, m.regraTecnicaMaxima ?? null]), [["Fim", "oficial"], ["Corte", null]]);

const copiaAntiga = { ...AD.feiticosDeAddon(criatura, 5)[0], addonVersao: "1.0.0" };
const atualizaAntiga = AD.modelosPendentesDeAddon(criatura, 5, [copiaAntiga], { tecnicasMaximasLivres: 0 })
  .find((m) => m.nome === "Fim");
t("a cópia LEGACY desatualizada aparece mesmo sem vaga", atualizaAntiga?.situacaoModelo, "desatualizado");
t("e a atualização não a converte", "regraTecnicaMaxima" in (atualizaAntiga ?? {}), false);
const copiaOficial = { ...copiaAntiga, regraTecnicaMaxima: "oficial" };
const atualizaOficial = AD.modelosPendentesDeAddon(criatura, 5, [copiaOficial], { tecnicasMaximasLivres: 0 })
  .find((m) => m.nome === "Fim");
t("a cópia oficial continua oficial na atualização", atualizaOficial?.regraTecnicaMaxima, "oficial");
const pacoteComRegime = { ...PACOTE, feiticos: [{ ...PACOTE.feiticos[0], regraTecnicaMaxima: "oficial" }] };
const criaturaRegime = createBlankAfty();
criaturaRegime.addons = [pacoteComRegime];
const doPacote = AD.modelosPendentesDeAddon(criaturaRegime, 5, [copiaAntiga], { tecnicasMaximasLivres: 1 })
  .find((m) => m.nome === "Fim");
t("o regime escrito no pacote não converte a cópia LEGACY", "regraTecnicaMaxima" in (doPacote ?? {}), false);

/* A cópia oficial de Addon segue a regra nova, pelo derive: sem a Aptidão, fica
   indisponível e fora do orçamento comum. A LEGACY segue valendo e gastando. */
for (const sistema of ["afty", "player"]) {
  const ficha = (feiticos, aptidao) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 17;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoesAmaldicoadas = aptidao ? ["tecnica_maxima"] : [];
    c.addons = [PACOTE];
    c.feiticos = feiticos;
    return c;
  };
  const tm = (d) => d.feiticos.lista.find((l) => l.nome === "Fim")?.tecnicaMaxima;
  const legado = deriveAfty(ficha([copiaAntiga], false));
  t(`${sistema}: a cópia LEGACY de Addon vale sem a Aptidão`, [tm(legado).legacy, tm(legado).valida], [true, true]);
  const oficialSem = deriveAfty(ficha([copiaOficial], false));
  t(`${sistema}: a cópia oficial sem a Aptidão fica indisponível`, [tm(oficialSem).legacy, tm(oficialSem).valida], [false, false]);
  const oficialCom = deriveAfty(ficha([copiaOficial], true));
  t(`${sistema}: e com a Aptidão vale`, tm(oficialCom).valida, true);
  const vazio = deriveAfty(ficha([], true));
  t(`${sistema}: a oficial não gasta o orçamento comum`, oficialCom.feiticos.gastos, vazio.feiticos.gastos);
  t(`${sistema}: a LEGACY gasta, como sempre`, legado.feiticos.gastos, deriveAfty(ficha([], false)).feiticos.gastos + 1);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
