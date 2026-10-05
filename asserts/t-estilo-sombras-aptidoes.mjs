/* NOVO ESTILO DAS SOMBRAS: as modificações de Aptidão da Expansão (2026-10-04).

   A Técnica guarda a REFERÊNCIA (`aptidaoId` + `modId`), nunca uma cópia: o
   número sai da Aptidão do dia. Cada modificação ocupa 1 vaga. O "metade do AU"
   e o "metade do CL" arredondam PARA CIMA (decisão do autor: o texto manda). */
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
const APT = await import(R + "afty-aptidoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const mod = (modId, aptidaoId) => ({ uid: `m${++seq}`, modId, aptidaoId });
const tecnica = (id, aptidoes, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, aptidoes, ...extra });
const ficha = (sistema, { aptidoes = [], niveis = {}, estilos = [], ativa = null, combate = {} } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 9;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom: 3, ...niveis };
  c.aptidoesAmaldicoadas = aptidoes;
  c.estilosSombra = estilos;
  c.combate = { ativo: true, estilo_ativo: true, ...(ativa ? { estilo_tecnica: ativa } : {}), ...combate };
  return c;
};
const da = (sistema, o) => deriveAfty(ficha(sistema, o));
const codigos = (r, nivel = "erro") => r.validacao.filter((v) => v.nivel === nivel).map((v) => v.codigo);

/* Toda Aptidão citada pelo catálogo existe no catálogo de Aptidões. */
const citadas = [...new Set(CAT.MODIFICACOES_APTIDAO.flatMap((m) => m.aptidoes ?? []))];
t("toda Aptidao citada existe", citadas.filter((id) => !APT.getAptidao(id)), []);
t("as categorias citadas existem",
  [...new Set(CAT.MODIFICACOES_APTIDAO.map((m) => m.categoria).filter(Boolean))]
    .filter((c) => !APT.AFTY_APTIDOES.some((a) => a.categoria === c)), []);

for (const sistema of ["afty", "player"]) {
  /* Aura: Bônus Numérico na Aura Reforçada (RD Física = dobro do AU). */
  const reforco = tecnica("ref", [mod("au_bonus_numerico", "aura_reforcada")]);
  const rdCom = (au, estilos = [reforco]) => {
    const o = { aptidoes: ["aura_reforcada"], niveis: { au }, estilos };
    return da(sistema, { ...o, ativa: "ref" }).rdFisico - da(sistema, o).rdFisico;
  };
  t(`${sistema}: metade do AU arredondada para cima (AU 1 a 5)`, [1, 2, 3, 4, 5].map((au) => rdCom(au)), [1, 1, 2, 2, 3]);
  const r = da(sistema, { aptidoes: ["aura_reforcada"], niveis: { au: 3 }, estilos: [reforco] }).estilo.tecnicas[0];
  t(`${sistema}: a modificacao ocupa 1 vaga`, [r.usados, codigos(r)], [1, []]);
  const dobrada = tecnica("ref", [mod("au_bonus_numerico", "aura_reforcada"), mod("au_bonus_numerico", "aura_reforcada")]);
  t(`${sistema}: a 2a compra vai aos aliados e nao soma no usuario`,
    [rdCom(3, [dobrada]),
      da(sistema, { aptidoes: ["aura_reforcada"], niveis: { au: 3 }, estilos: [dobrada] }).estilo.tecnicas[0].aliadosCalculados],
    [2, [{ efeitoId: "au_bonus_numerico", rotulo: "Bônus dos Aliados no Domínio (Aura Reforçada)", valor: 2 }]]);

  /* Controle e Leitura: Cobrir-se só ganha o extra quando é usado. */
  const cobrir = tecnica("cob", [mod("cl_bonus_numerico", "cobrir_se")]);
  const pvTemp = (pe, ativa) => da(sistema, {
    aptidoes: ["cobrir_se"], niveis: { cl: 3 }, estilos: [cobrir], ativa, combate: { cobrirSePE: pe },
  }).pvTemporario ?? 0;
  t(`${sistema}: Cobrir-se usado ganha metade do CL para cima`, pvTemp(2, "cob") - pvTemp(2, null), 2);
  t(`${sistema}: Cobrir-se sem uso nao ganha nada`, pvTemp(0, "cob") - pvTemp(0, null), 0);

  /* Validações. */
  const semAptidao = da(sistema, { estilos: [reforco] }).estilo.tecnicas[0];
  t(`${sistema}: Aptidao que a ficha nao tem e erro`, [codigos(semAptidao), semAptidao.mecanicamenteValida], [["aptidao_ausente"], false]);
  const dominio = da(sistema, { aptidoes: ["revestimento_de_dominio"], estilos: [tecnica("d", [mod("au_area", "revestimento_de_dominio")])] }).estilo.tecnicas[0];
  t(`${sistema}: Aptidao de Dominio e recusada`, codigos(dominio), ["aptidao_dominio"]);
  const errada = da(sistema, { aptidoes: ["cortina"], estilos: [tecnica("e", [mod("aura_embacada", "cortina")])] }).estilo.tecnicas[0];
  t(`${sistema}: modificacao de outra Aptidao e erro`, codigos(errada), ["aptidao_invalida"]);
  const semNumero = da(sistema, { aptidoes: ["aura_anuladora"], estilos: [tecnica("n", [mod("au_bonus_numerico", "aura_anuladora")])] }).estilo.tecnicas[0];
  t(`${sistema}: bonus numerico em Aptidao sem numero e erro`, codigos(semNumero), ["aptidao_sem_numero"]);

  /* Energia Reversa ofensiva: pede Projetar (ou Canalizar) E Energia Reversa. */
  const ofensiva = [tecnica("o", [mod("er_ofensiva", "projetar_energia")])];
  t(`${sistema}: sem Energia Reversa e erro`,
    codigos(da(sistema, { aptidoes: ["projetar_energia"], estilos: ofensiva }).estilo.tecnicas[0]), ["requisito"]);
  t(`${sistema}: com ER 1 vale`,
    codigos(da(sistema, { aptidoes: ["projetar_energia"], niveis: { er: 1 }, estilos: ofensiva }).estilo.tecnicas[0]), []);

  /* Cortina: não muda o raio do Domínio. Punho Divergente: CD + CL só na
     Técnica, e a CD da ficha não muda. */
  const cortina = [tecnica("c", [mod("cortina", "cortina")])];
  const area = (ativa) => da(sistema, { aptidoes: ["cortina"], estilos: cortina, ativa }).dominioSimples.area;
  t(`${sistema}: a Cortina nao muda o raio`, area("c"), area(null));
  const punho = [tecnica("p", [mod("punho_divergente", "punho_divergente")])];
  const dp = da(sistema, { aptidoes: ["punho_divergente"], niveis: { cl: 3 }, estilos: punho, ativa: "p" });
  t(`${sistema}: Punho Divergente com a CD + CL na Tecnica`, dp.estilo.tecnicas[0].mesaCalculada,
    [{ efeitoId: "punho_divergente", rotulo: "CD do Punho Divergente", valor: 3 }]);
  t(`${sistema}: e a CD da ficha nao muda`,
    dp.cd, da(sistema, { aptidoes: ["punho_divergente"], niveis: { cl: 3 }, estilos: punho }).cd);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
