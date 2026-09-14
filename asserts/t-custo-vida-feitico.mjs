import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const {
  calcularFeiticoDano,
  custoVidaDaAtivacao,
  preparaAtivacaoComCustoVida,
  resumoDeUmFeitico,
} = await import(R + "afty-feiticos.js");
const { pagaCustoVida } = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok += 1;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const honnoji = {
  id: "feitico_teste_custo_vida",
  nome: "Feitiço de teste",
  tipo: "dano",
  nivel: "max",
  resolucao: "tr",
  alvo: "area",
  formaArea: "cone",
  acao: "completa",
  subtipo: "nenhum",
  trocas: { dados: 0, acerto: 0, cd: 0, alcance: 0, area: 0, empurraoDados: 0 },
  condicoes: [],
  custoVidaAtivacao: {
    modo: "percentualAtual",
    percentual: 50,
    minimo: 1,
    somaAoDano: true,
  },
};

const custoPar = custoVidaDaAtivacao(honnoji.custoVidaAtivacao, 100);
const custoImpar = custoVidaDaAtivacao(honnoji.custoVidaAtivacao, 101);
const custoUltimo = custoVidaDaAtivacao(honnoji.custoVidaAtivacao, 1);
const custoSemVida = custoVidaDaAtivacao(honnoji.custoVidaAtivacao, 0);
t("100 PV pagam 50", [custoPar.pago, custoPar.bonusDano], [50, 50]);
t("101 PV arredondam o custo para baixo", [custoImpar.pago, custoImpar.bonusDano], [50, 50]);
t("o minimo permite chegar a zero", [custoUltimo.pago, custoUltimo.disponivel], [1, true]);
t("sem Vida nao ativa", [custoSemVida.pago, custoSemVida.disponivel], [0, false]);

const preparada = preparaAtivacaoComCustoVida({
  tipo: "dano",
  tom: "dano",
  fixo: 7,
  detalhe: "Técnica Máxima",
  custoVidaAtivacao: honnoji.custoVidaAtivacao,
}, 100);
t("a Vida desta ativacao entra no fixo", preparada.desc.fixo, 57);
t("o resultado registra a Vida paga", preparada.desc.detalhe, "Técnica Máxima · 50 PV pagos");

const sessao = { hpAtual: 80, pvTempFontes: { Guarda: 20 } };
const pagamento = pagaCustoVida(sessao, 40);
t("o custo reduz a Vida real", [pagamento.pago, pagamento.sessao.hpAtual], [40, 40]);
t("o custo nao consome PV temporario", pagamento.sessao.pvTempFontes, { Guarda: 20 });
t("o custo nunca paga Vida inexistente", pagaCustoVida({ hpAtual: 3 }, 20).pago, 3);

const calc = calcularFeiticoDano(honnoji, { nd: 24, cdBase: 30, modTecnica: 0 });
t("Tecnica Maxima custa 25 PE", calc.custoPE, 25);
t("Honnoji recebe dano da tabela", calc.dados > 0, true);

const resumo = resumoDeUmFeitico({ feiticos: [honnoji] }, honnoji.id, {
  nd: 24,
  cdBase: 30,
  modTecnica: 0,
  vidaAtual: 100,
});
t("a Ficha recebe o custo de Vida", resumo.custoVidaAtivacao, {
  modo: "percentualAtual",
  percentual: 50,
  minimo: 1,
  somaAoDano: true,
});
t("a Ficha recebe o custo corrente", [resumo.custoVidaAtual, resumo.custoVidaDisponivel], [50, true]);
t("a Ficha recebe a rolagem de dano", resumo.rolagens.length > 0, true);

console.log(bad.length
  ? `FALHAS (${bad.length}):\n${bad.join("\n")}`
  : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
