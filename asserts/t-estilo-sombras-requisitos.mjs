/* NOVO ESTILO DAS SOMBRAS: Pré-Requisitos, Contra-Ataque, crítico e Exaustão
   (Expansão, autor 2026-10-04).

   Pré-Requisito: Fácil +1, Médio +2, Difícil +3, Impossível +4 no Nível de
   Aptidão considerado para UM efeito. Não mexe na Aptidão real, não é global, não
   dá vaga, e não aumenta Ataque com Gatilho nem Contra-Ataque.
   Contra-Ataque: cada um ocupa 1 vaga, até o Nível de BAR, com o degrau pelo BAR. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");
const CAT = await import(R + "afty-estilo-sombras-catalogo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const uid = () => `u${++seq}`;
const tecnica = (id, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, ...extra });
const ficha = (sistema, { niveis = {}, aptidoes = [], estilos = [], ativa = null } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 9;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom: 3, ...niveis };
  c.aptidoesAmaldicoadas = aptidoes;
  c.estilosSombra = estilos;
  c.combate = { ativo: true, estilo_ativo: true, ...(ativa ? { estilo_tecnica: ativa } : {}) };
  return c;
};
const da = (sistema, o) => deriveAfty(ficha(sistema, o));
const codigos = (r, nivel = "erro") => r.validacao.filter((v) => v.nivel === nivel).map((v) => v.codigo);

t("as quatro dificuldades", CAT.DIFICULDADES_PREREQ.map((d) => [d.value, d.bonus]),
  [["facil", 1], ["medio", 2], ["dificil", 3], ["impossivel", 4]]);

for (const sistema of ["afty", "player"]) {
  /* 1. O Pré-Requisito sobe a Aptidão SÓ do efeito apontado. AU 2 na Aura
     Reforçada: teto((2 + b) / 2). */
  const m1 = uid();
  const comPreReq = (dificuldade) => tecnica("t", {
    aptidoes: [{ uid: m1, aptidaoId: "aura_reforcada", modId: "au_bonus_numerico" }],
    requisitos: dificuldade ? [{ uid: uid(), dificuldade, alvoUid: m1, texto: "Só de olhos fechados" }] : [],
  });
  const rd = (dificuldade) => {
    const o = { aptidoes: ["aura_reforcada"], niveis: { au: 2 }, estilos: [comPreReq(dificuldade)] };
    return da(sistema, { ...o, ativa: "t" }).rdFisico - da(sistema, o).rdFisico;
  };
  t(`${sistema}: AU 2 sem e com Facil, Medio, Dificil e Impossivel`,
    [null, "facil", "medio", "dificil", "impossivel"].map(rd), [1, 2, 2, 3, 3]);
  const dImp = da(sistema, { aptidoes: ["aura_reforcada"], niveis: { au: 2 }, estilos: [comPreReq("impossivel")] });
  t(`${sistema}: a Aptidao real nao muda`, dImp.aptidao.efetivo.au, 2);
  t(`${sistema}: o Pre-Requisito nao da vaga`, [dImp.estilo.tecnicas[0].usados, dImp.estilo.tecnicas[0].limite.total], [1, 3]);

  /* Não é global: o Punho Divergente da mesma Técnica segue com o CL real. */
  const mPunho = uid();
  const mista = tecnica("m", {
    aptidoes: [
      { uid: m1, aptidaoId: "aura_reforcada", modId: "au_bonus_numerico" },
      { uid: mPunho, aptidaoId: "punho_divergente", modId: "punho_divergente" },
    ],
    requisitos: [{ uid: uid(), dificuldade: "dificil", alvoUid: m1 }],
  });
  t(`${sistema}: o Pre-Requisito nao vaza para o outro efeito`,
    da(sistema, { aptidoes: ["aura_reforcada", "punho_divergente"], niveis: { au: 2, cl: 2 }, estilos: [mista] })
      .estilo.tecnicas[0].mesaCalculada.map((m) => m.valor), [2]);
  const punhoMedio = tecnica("p", {
    aptidoes: [{ uid: mPunho, aptidaoId: "punho_divergente", modId: "punho_divergente" }],
    requisitos: [{ uid: uid(), dificuldade: "medio", alvoUid: mPunho }],
  });
  t(`${sistema}: e no Punho Divergente a CD vira CL + 2`,
    da(sistema, { aptidoes: ["punho_divergente"], niveis: { cl: 2 }, estilos: [punhoMedio] }).estilo.tecnicas[0].mesaCalculada[0].valor, 4);

  /* 2. Proibido no Ataque com Gatilho e no Contra-Ataque. */
  const g = uid();
  const noGatilho = tecnica("g", {
    efeitos: [{ uid: g, efeitoId: "gatilho" }],
    requisitos: [{ uid: uid(), dificuldade: "facil", alvoUid: g }],
  });
  const rg = da(sistema, { estilos: [noGatilho] }).estilo.tecnicas[0];
  t(`${sistema}: Pre-Requisito no Ataque com Gatilho e erro`, codigos(rg), ["prereq_proibido"]);
  t(`${sistema}: e o numero de ataques nao sobe`, rg.ataquesComGatilho, 1);
  const noContra = tecnica("c", {
    contraAtaque: { quantidade: 1 },
    requisitos: [{ uid: uid(), dificuldade: "facil", alvoUid: CAT.ALVO_CONTRA_ATAQUE }],
  });
  t(`${sistema}: Pre-Requisito no Contra-Ataque e erro`,
    codigos(da(sistema, { niveis: { bar: 2 }, estilos: [noContra] }).estilo.tecnicas[0]), ["prereq_proibido"]);

  /* 3. Num efeito que escala por BT ele não tem o que aumentar: aviso. */
  const d = uid();
  const naDefesa = tecnica("d", {
    efeitos: [{ uid: d, efeitoId: "defesa" }],
    requisitos: [{ uid: uid(), dificuldade: "facil", alvoUid: d }],
  });
  const rdef = da(sistema, { estilos: [naDefesa] }).estilo.tecnicas[0];
  t(`${sistema}: Pre-Requisito na Defesa e aviso`, [codigos(rdef), codigos(rdef, "aviso"), rdef.mecanicamenteValida], [[], ["prereq_sem_efeito"], true]);
  t(`${sistema}: Pre-Requisito sem alvo e erro`,
    codigos(da(sistema, { estilos: [tecnica("s", { requisitos: [{ uid: uid(), dificuldade: "facil", alvoUid: "nada" }] })] }).estilo.tecnicas[0]),
    ["prereq_alvo"]);

  /* 4. Contra-Ataque: 1 vaga cada, até o BAR, degrau pelo BAR, sem Reação. */
  const contra = (q) => tecnica("ca", { contraAtaque: { quantidade: q } });
  const rc = (bar, q) => da(sistema, { niveis: { bar }, estilos: [contra(q)] }).estilo.tecnicas[0];
  t(`${sistema}: dois Contra-Ataques com BAR 3`,
    (({ usados, contra: c, removeReacao }) => [usados, c.quantidade, c.degrau.resultado, removeReacao])(rc(3, 2)),
    [2, 2, "anula", true]);
  t(`${sistema}: os degraus 1-2, 3-4 e 5`,
    [1, 2, 3, 4, 5].map((bar) => rc(bar, 1).contra.degrau.resultado), ["metade", "metade", "anula", "anula", "anulaRebate"]);
  t(`${sistema}: o BAR 5 traz o texto da Reflexos`, [rc(4, 1).contra.bar5, rc(5, 1).contra.bar5], [false, true]);
  t(`${sistema}: acima do BAR e erro`, codigos(rc(3, 4)).includes("contra_teto"), true);
  t(`${sistema}: sem Barreira e erro`, codigos(rc(0, 1)), ["contra_bar"]);
  t(`${sistema}: o orcamento da Tecnica tambem limita (DOM 3, tres e mais um efeito)`,
    codigos(da(sistema, { niveis: { bar: 3 }, estilos: [tecnica("o", { contraAtaque: { quantidade: 3 }, efeitos: [{ uid: uid(), efeitoId: "dano" }] })] }).estilo.tecnicas[0]),
    ["limite"]);

  /* 5. Crítico: cada modificação 1 vaga, a CD sobe pelo BAR, e é aviso. */
  const crit = tecnica("cr", { critico: { aumentarCD: true, alvoExtra: true, condicao: { modo: "aumentar" } } });
  const rcr = da(sistema, { niveis: { bar: 3 }, estilos: [crit] }).estilo.tecnicas[0];
  t(`${sistema}: tres modificacoes de critico ocupam tres vagas`, rcr.usados, 3);
  t(`${sistema}: a CD do critico e o BAR`, rcr.mesaCalculada, [{ efeitoId: "critico:aumentarCD", rotulo: "CD do Efeito Crítico", valor: 3 }]);
  t(`${sistema}: e um aviso, sem erro`, [codigos(rcr), codigos(rcr, "aviso")], [[], ["critico_tabela"]]);
  t(`${sistema}: subir para Extrema e erro`,
    codigos(da(sistema, { niveis: { bar: 3 }, estilos: [tecnica("x", { critico: { condicao: { modo: "trocar", para: "extrema" } } })] }).estilo.tecnicas[0]),
    ["critico_extrema"]);

  /* 6. Exaustão: aumenta o limite e é o que a Técnica gera ao fechar. */
  const ex = da(sistema, { estilos: [tecnica("e", { exaustao: 2 })] }).estilo.tecnicas[0];
  t(`${sistema}: Exaustao 2 em DOM 3`, [ex.limite.total, ex.exaustaoGerada], [5, 2]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
