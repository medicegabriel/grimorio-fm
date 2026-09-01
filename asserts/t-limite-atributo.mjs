/**
 * O LIMITE SOBE E O VALOR SOBE JUNTO — 2026-08-31
 *
 * Relato do autor: *"Feitiço que aumenta Limite de Atributo está aumentando o
 * limite, porém, quando você tenta subir o atributo ele é travado em 20 ainda."*
 *
 * A causa é de ORDEM, e não de fórmula. Os atributos são resolvidos em dois
 * momentos: no estágio 0 a ficha soma base, pontos de nível, Desenvolvimento e
 * bônus de Origem, e apara isso no único limite que existe ali (20, mais Origem
 * e Desenvolvimento); só DEPOIS os catálogos são resolvidos e o canal
 * `limiteAtributo` do Motor aparece. O estágio 1 apenas SOMA o canal `atributo`
 * por cima do que já foi cortado, então o ponto que o 20 comeu nunca voltava.
 *
 * O sintoma era o próprio código se contradizendo na tela: Limite 26, Efetivo
 * 20 e o aviso "pontos de bônus perdidos no limite 26", aparando por um número
 * diferente do que exibia.
 *
 * O que este arquivo prende:
 *   1. o valor alocado alcança o limite NOVO,
 *   2. a perda some quando o limite comporta, e continua existindo quando não,
 *   3. o TETO DO SISTEMA (30) e o ABSOLUTO (32) seguem valendo por cima,
 *   4. e o hover não passa a mentir: a soma das parcelas é o número.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Um Feitiço Passivo é a fonte mais limpa possível do canal: ele emite SÓ o
   limite, sem somar valor nenhum junto. É por isso que ele expõe o bug e o
   Incremento de Atributo não expunha, já que aquele sobe as duas metades e o
   valor extra dele cabia no limite novo por acidente. */
const ficha = (passivo, extra = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 20, tipo: "misto" };
  f.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 15, sabedoria: 10, presenca: 10 };
  f.attrNivel = { inteligencia: 6 };          // 15 + 6 = 21, um a mais que o 20
  f.especializacoes = [{ id: "conjurador", nivel: 20 }];
  if (passivo != null) {
    f.feiticos = [{
      id: "fp_limite", nome: "Quebra de Limite", tipo: "passivo",
      efeitosPassivo: [{ canal: "limiteAtributo", alvo: "inteligencia", expr: String(passivo) }],
    }];
  }
  return deriveAfty({ ...f, ...extra });
};

const soma = (partes) => (partes || []).reduce((s, p) => s + (Number(p.valor) || 0), 0);

/* ============================================================ */
/* 1. SEM O MOTOR NADA MUDA                                      */
/* ============================================================ */
const cru = ficha(null);
t("sem fonte, o limite é o padrão", cru.attrLimiteEfetivo.inteligencia, 20);
t("e o 21 alocado é aparado nele", cru.attrEff.inteligencia, 20);
t("com a perda avisada", cru.attrPerda.inteligencia, 1);

/* ============================================================ */
/* 2. O CANAL SOBE O LIMITE, E O VALOR ALCANÇA                   */
/* ============================================================ */
const seis = ficha(6);
t("o limite subiu", seis.attrLimiteEfetivo.inteligencia, 26);
t("e o valor alocado chegou nele", seis.attrEff.inteligencia, 21);
t("sem perda nenhuma", seis.attrPerda.inteligencia, 0);
t("o modificador acompanha", seis.mods.inteligencia, 5);

/* ⚠ O AVISO NÃO PODE MAIS APARECER SEM MOTIVO. Era ele o sintoma: "2 pontos de
   bônus perdidos no limite 26" num atributo que estava em 20. */
t("nenhuma parcela de perda no hover",
  (seis.partesAtributo.inteligencia || []).filter((p) => /Perdido/.test(p.label || "")), []);

/* ============================================================ */
/* 3. O LIMITE QUE NÃO CHEGA CONTINUA APARANDO                   */
/* ============================================================ */
/* Um limite de 21 comporta os 21 exatos; um de 20,5 não existe, então o degrau
   mais honesto é conferir que subir 0 não muda nada e subir 1 muda tudo. */
t("subir 0 é igual a não ter fonte", [ficha(0).attrEff.inteligencia, ficha(0).attrPerda.inteligencia], [20, 1]);
t("subir 1 já libera o ponto", [ficha(1).attrEff.inteligencia, ficha(1).attrPerda.inteligencia], [21, 0]);

/* ============================================================ */
/* 4. OS DOIS TETOS DE CIMA SEGUEM VALENDO                       */
/* ============================================================ */
/* O limite do atributo sobe até onde o TETO DO SISTEMA deixa, que é 30 (32 só
   com o Aperfeiçoamento de Atributo, a Lendária). Um canal de +50 não faz um
   atributo de 60. */
const absurdo = ficha(50, { attributes: { forca: 10, destreza: 12, constituicao: 14, inteligencia: 15, sabedoria: 10, presenca: 10 }, attrNivel: { inteligencia: 40 } });
t("o limite para no teto do sistema", absurdo.attrLimiteEfetivo.inteligencia, 30);
t("e o valor para junto", absurdo.attrEff.inteligencia, 30);
t("e o que sobrou é reportado como perda", absurdo.attrPerda.inteligencia, 25);

/* ============================================================ */
/* 5. O HOVER NÃO PASSOU A MENTIR                                */
/* ============================================================ */
/* Número certo com detalhamento errado é bug (a regra do `defesaAtributo`). O
   que foi cortado entra no hover como TEXTO, e não como parcela, então o que
   fecha a conta é "as parcelas menos o cortado". Sem a linha de corte, o hover
   somaria 21 com o número grande dizendo 20 e o leitor ficaria sem explicação:
   ela existe justamente para isso, dos DOIS lados. */
const cortado = (partes) => (partes || [])
  .filter((p) => p.texto)
  .reduce((s, p) => s + Math.abs(Number(String(p.texto).replace("−", "-")) || 0), 0);

for (const [nome, d] of [["sem fonte", cru], ["com fonte", seis], ["no teto", absurdo]]) {
  t(`o hover do valor fecha a conta (${nome})`,
    soma(d.partesAtributo.inteligencia) - cortado(d.partesAtributo.inteligencia),
    d.attrEff.inteligencia);
  t(`e o do limite também (${nome})`,
    soma(d.partesLimite.inteligencia) - cortado(d.partesLimite.inteligencia),
    d.attrLimiteEfetivo.inteligencia);
}
/* Sem corte nenhum, não pode sobrar linha de texto pendurada. */
t("com o limite comportando, o hover não tem linha de corte",
  [cortado(seis.partesAtributo.inteligencia), cortado(seis.partesLimite.inteligencia)], [0, 0]);

/* ============================================================ */
/* 6. NENHUM OUTRO ATRIBUTO SE MEXEU                             */
/* ============================================================ */
/* O canal nomeia o alvo. Um aparo refeito para todos os seis poderia soltar
   ponto onde ninguém pediu. */
t("os outros cinco ficam onde estavam",
  ["forca", "destreza", "constituicao", "sabedoria", "presenca"]
    .filter((k) => cru.attrEff[k] !== seis.attrEff[k]), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
