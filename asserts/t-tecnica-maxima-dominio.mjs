/* TÉCNICA MÁXIMA DENTRO DA EXPANSÃO DE DOMÍNIO (2026-10-08).

   Sem exceção nova só por ser `max` (pedido do autor): a Técnica Máxima é um
   Feitiço da natureza dela, então a Expansão no ar a trata como qualquer outro.
   25 − DOM no custo, o Ritual da categoria da natureza, a Amplificação de
   Técnica no dano e na CD, e a recarga intacta. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const base = F.createBlankFeitico();
const tmDano = { ...base, id: "tm", nome: "TM", nivel: "max", regraTecnicaMaxima: "oficial" };
const tmGolpe = { ...base, id: "tmg", nome: "TMG", nivel: "max", regraTecnicaMaxima: "oficial", tipo: "especial", especialSubtipo: "golpeador" };

for (const sistema of ["afty", "player"]) {
  const ficha = ({ noAr = false, efeitos = [], ritual = {}, feiticos = [tmDano] } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 13;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoes = { dom: 3, bar: 3 };
    c.aptidoesAmaldicoadas = ["tecnica_maxima", "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa"];
    c.dominios = [{ id: "d1", nome: "Teste", versao: "completa", efeitos, beneficiosRitual: ritual }];
    c.feiticos = feiticos;
    if (noAr) c.combate = { ativo: true, dominioAtivo: "d1", dominioFase: "ativa" };
    return c;
  };
  const linha = (d, id = "tm") => d.feiticos.lista.find((l) => l.id === id);
  const fora = deriveAfty(ficha());
  const dentro = deriveAfty(ficha({ noAr: true }));

  t(`${sistema}: 25 − DOM dentro da Expansão`, [linha(fora).custoPE, linha(dentro).custoPE], [25, 22]);
  t(`${sistema}: a redução tem o nome da Expansão`, linha(dentro).reducoesCustoPE.map((r) => r.fonte), ["Teste: Efeito básico"]);
  t(`${sistema}: a escala não muda dentro da Expansão`, linha(dentro).tecnicaMaxima.escala, 5);
  t(`${sistema}: a recarga não muda dentro da Expansão`, linha(dentro).tecnicaMaxima.recarga, linha(fora).tecnicaMaxima.recarga);

  const amp = deriveAfty(ficha({ noAr: true, efeitos: [
    { id: "e1", categoria: "amp_tecnica", tipo: "dano" }, { id: "e2", categoria: "amp_tecnica", tipo: "cd" },
  ] }));
  t(`${sistema}: Amplificação de dano na TM de Dano (+3 dados)`, linha(amp).rolagens[0].dados - linha(dentro).rolagens[0].dados, 3);
  const cdDe = (d) => linha(d).propriedades.find((p) => p.id === "cd")?.valor;
  t(`${sistema}: Amplificação de CD na TM (+6)`, cdDe(amp) - cdDe(dentro), 6);

  const ritual = deriveAfty(ficha({ noAr: true, ritual: { dano: "aumentoDano" } }));
  t(`${sistema}: o Ritual da categoria Dano vale na TM de Dano`,
    linha(ritual).ritual?.melhoriasGratuitas?.aumentoDano, 1);

  const golpe = deriveAfty(ficha({ noAr: true, feiticos: [tmGolpe], efeitos: [{ id: "e1", categoria: "amp_tecnica", tipo: "dano" }] }));
  const golpeFora = deriveAfty(ficha({ feiticos: [tmGolpe] }));
  t(`${sistema}: TM Golpeador recebe a Amplificação`,
    [linha(golpe, "tmg").rolagens[0].dados - linha(golpeFora, "tmg").rolagens[0].dados, linha(golpe, "tmg").rolagens[0].fixo], [3, 10]);
  t(`${sistema}: e paga 25 − DOM`, linha(golpe, "tmg").custoPE, 22);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
