/**
 * AS VAGAS DE ESCOLHA FECHAM NO AGREGADO FINAL — 2026-10-02
 *
 * Relato do autor, com a captura de um Feitiço Passivo com "Vagas de Talento 1,
 * sempre, Permanente" e o "+1" aceso: *"Vagas de Talento em Feitiço não está
 * funcionando"*.
 *
 * `vagasHabilidade`, `vagasTalento`, `vagasMelhoria` e `vagasLendaria` eram
 * lidos só do MONTANTE, porque o orçamento fecha antes dos efeitos. Feitiço
 * Passivo, Funcionamento Básico, Buff de Mesa e Habilidade Única entram depois,
 * no bolo comum: o efeito aparecia ativo e o contador não mexia. O derive passou
 * a refechar os quatro no fim, com o agregado inteiro.
 *
 * O que este arquivo prende:
 *   • a vaga de cada uma dessas fontes chega no contador, nos dois sistemas;
 *   • o contador É o agregado, e não uma soma ao lado dele (nada conta duas vezes);
 *   • vaga de Alto Nível continua sem destravar a trilha.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const FE = await import(R + "afty-feiticos.js");
const { valorCanal } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Nível 22, para as duas trilhas de Alto Nível existirem no jogador. */
const ficha = (sistema, o = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 22, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel: 22 }];
  if (o.passivos) {
    c.feiticos = o.passivos.map((efeitos, i) => ({
      ...FE.createBlankFeitico(), id: `fp${i}`, nome: `Passiva ${i + 1}`, tipo: "passivo", nivel: 1, efeitosPassivo: efeitos,
    }));
  }
  if (o.funcionamento) {
    c.core.funcionamentosAdicionais = [{ id: "fb_teste", nome: "Regra de Mesa", efeitos: o.funcionamento }];
  }
  return c;
};
const um = (canal) => [{ canal, expr: "1" }];

for (const sistema of ["afty", "player"]) {
  const base = deriveAfty(ficha(sistema));

  /* ============================================================ */
  /* 1. A VAGA DO FEITIÇO PASSIVO CHEGA NO CONTADOR                */
  /* ============================================================ */
  const talento = deriveAfty(ficha(sistema, { passivos: [um("vagasTalento")] }));
  t(`${sistema}: Vagas de Talento no Passivo sobem a pilha de Talento`,
    talento.habilidades.exclusivasTalento - base.habilidades.exclusivasTalento, 1);
  t(`${sistema}: e o total junto`, talento.habilidades.total - base.habilidades.total, 1);
  /* A pilha de Talento NÃO serve para Habilidade de Especialização. */
  t(`${sistema}: sem mexer na pilha comum`, talento.habilidades.comum, base.habilidades.comum);

  const habilidade = deriveAfty(ficha(sistema, { passivos: [um("vagasHabilidade")] }));
  t(`${sistema}: Vagas de Habilidade no Passivo sobem a pilha comum`,
    habilidade.habilidades.comum - base.habilidades.comum, 1);

  /* O Funcionamento Básico é a outra fonte de texto livre, e tinha o mesmo
     defeito. */
  const fb = deriveAfty(ficha(sistema, { funcionamento: um("vagasTalento") }));
  t(`${sistema}: Vagas de Talento no Funcionamento Básico também`,
    fb.habilidades.exclusivasTalento - base.habilidades.exclusivasTalento, 1);

  /* ============================================================ */
  /* 2. O CONTADOR É O AGREGADO                                    */
  /* ============================================================ */
  /* ⚠ O valor final SUBSTITUI o de cima, e não soma nele. A ficha base já tem
     vaga de Talento pela origem (montante), e um erro de soma contaria essa
     vaga duas vezes. Dois Passivos testam o pool exclusivo: o contador tem de
     dizer o que o agregado disse, seja lá o que a disputa decidiu. */
  for (const [nome, der] of [
    ["base", base], ["um Passivo", talento], ["Funcionamento", fb],
    ["dois Passivos", deriveAfty(ficha(sistema, { passivos: [um("vagasTalento"), um("vagasTalento")] }))],
  ]) {
    t(`${sistema}: ${nome}: a pilha de Talento é o agregado`,
      der.habilidades.exclusivasTalento, valorCanal(der.efeitos, "vagasTalento"));
  }
}

/* ============================================================ */
/* 3. ALTO NÍVEL                                                 */
/* ============================================================ */
{
  const base = deriveAfty(ficha("player"));
  const mel = deriveAfty(ficha("player", { passivos: [um("vagasMelhoria")] }));
  const len = deriveAfty(ficha("player", { passivos: [um("vagasLendaria")] }));
  t("player: Vagas de Melhoria no Passivo sobem o total da trilha",
    mel.altoNivel.melhorias.total - base.altoNivel.melhorias.total, 1);
  t("player: e o hover sabe que veio de fora do nível", mel.altoNivel.melhorias.vagasCanal, 1);
  t("player: o restante acompanha", mel.altoNivel.melhorias.restante - base.altoNivel.melhorias.restante, 1);
  t("player: Vagas de Lendária no Passivo sobem o total da trilha",
    len.altoNivel.lendarias.total - base.altoNivel.lendarias.total, 1);
}
{
  /* ⚠ VAGA NÃO DESTRAVA. A criatura sem a Habilidade Geral tem a trilha
     fechada, e a vaga do Passivo não a abre: quantidade e portão são perguntas
     diferentes (ver `comVagasDeCanal`). */
  const mel = deriveAfty(ficha("afty", { passivos: [um("vagasMelhoria")] }));
  t("criatura sem a Geral: a trilha segue fechada", [mel.altoNivel.melhorias.destravado, mel.altoNivel.melhorias.total], [false, 0]);
  t("e a vaga fica registrada para quando abrir", mel.altoNivel.melhorias.vagasCanal, 1);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
