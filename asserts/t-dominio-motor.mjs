/* EXPANSÃO DE DOMÍNIO NO MOTOR (2026-10-08).

   O que a Expansão no ar faz na ficha de quem expandiu, e só enquanto ela VALE:
   fase `ativa`, ou sessão antiga sem fase. Em Confronto, Confronto Estendido e
   Contestação nada vale (DA-15). Os efeitos base (+2 em AU, CL e ER, movimento
   ×2, Feitiço −DOM, Ritual), a CD só dos Feitiços (DA-13), a Amplificação de
   Técnica nos Especiais de dano (E-10, o Dano na Alma pela metade), o Ritual
   dos Especiais (E-11) e o +2 de Confronto (E-13). */
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
const FEITICOS = [
  { ...base, id: "dano", nome: "Dano", nivel: 3 },
  { ...base, id: "golpe", nome: "Golpe", tipo: "especial", especialSubtipo: "golpeador", nivel: 3 },
  { ...base, id: "alma", nome: "Alma", tipo: "especial", especialSubtipo: "danoAlma", nivel: 3 },
  { ...base, id: "aux", nome: "Aux", tipo: "auxiliar", nivel: 3, efeitoAux: "defesa", duracaoAux: "imediata" },
];

for (const sistema of ["afty", "player"]) {
  const ficha = ({ combate = null, efeitos = [], ritual = {} } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 13;
    c.core.origem = { id: "inato" };
    c.aptidoes = { au: 1, cl: 0, er: 0, dom: 3, bar: 3 };
    c.aptidoesAmaldicoadas = ["tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa"];
    c.dominios = [{ id: "d1", nome: "Teste", versao: "completa", efeitos, beneficiosRitual: ritual }];
    c.feiticos = FEITICOS;
    if (combate) c.combate = combate;
    return c;
  };
  const no = (fase) => ({ ativo: true, dominioAtivo: "d1", ...(fase ? { dominioFase: fase } : {}) });
  const fora = deriveAfty(ficha());
  const ativa = deriveAfty(ficha({ combate: no("ativa") }));
  const linha = (d, id) => d.feiticos.lista.find((l) => l.id === id);

  /* ============================================================ */
  /* O PORTÃO DAS FASES                                            */
  /* ============================================================ */
  t(`${sistema}: movimento dobra com a Expansão ativa`, ativa.movimento, fora.movimento * 2);
  t(`${sistema}: sessão antiga sem fase vale ativa`, deriveAfty(ficha({ combate: no(null) })).movimento, fora.movimento * 2);
  for (const fase of ["confronto", "estendido", "contestando"]) {
    const d = deriveAfty(ficha({ combate: no(fase) }));
    t(`${sistema}: em ${fase} nada vale (movimento, AU, custo)`,
      [d.movimento, d.aptidao.efetivo.au, linha(d, "dano").custoPE], [fora.movimento, fora.aptidao.efetivo.au, linha(fora, "dano").custoPE]);
  }
  t(`${sistema}: fora de combate nada vale`, deriveAfty(ficha({ combate: { ativo: false, dominioAtivo: "d1" } })).movimento, fora.movimento);

  /* ============================================================ */
  /* EFEITOS BASE                                                  */
  /* ============================================================ */
  t(`${sistema}: +2 em AU (que tem nível), nada em CL e ER (zerados)`,
    [ativa.aptidao.efetivo.au - fora.aptidao.efetivo.au, ativa.aptidao.efetivo.cl, ativa.aptidao.efetivo.er], [2, 0, 0]);
  t(`${sistema}: BAR e DOM não sobem`, [ativa.aptidao.efetivo.bar, ativa.aptidao.efetivo.dom], [fora.aptidao.efetivo.bar, fora.aptidao.efetivo.dom]);
  t(`${sistema}: Feitiço custa DOM a menos`, linha(fora, "dano").custoPE - linha(ativa, "dano").custoPE, 3);
  t(`${sistema}: a própria Expansão não fica mais barata`, ativa.dominios.lista[0].custo, fora.dominios.lista[0].custo);
  t(`${sistema}: +2 de Confronto com a Expansão ativa`, ativa.dominios.conflito.bonus - fora.dominios.conflito.bonus, 2);
  t(`${sistema}: e o +2 tem nome no hover`, ativa.dominios.conflito.partes.at(-1), { label: "Expansão Ativa", valor: 2 });
  t(`${sistema}: em Confronto o +2 não entra`,
    deriveAfty(ficha({ combate: no("confronto") })).dominios.conflito.bonus, fora.dominios.conflito.bonus);

  /* ============================================================ */
  /* AMPLIFICAÇÃO DE TÉCNICA                                       */
  /* ============================================================ */
  const amp = (efeitos, fase = "ativa") => deriveAfty(ficha({ combate: no(fase), efeitos }));
  const cd = amp([{ id: "e1", categoria: "amp_tecnica", tipo: "cd" }]);
  t(`${sistema}: a CD dos Feitiços sobe 6 no DOM 3`, linha(cd, "alma").propriedades.find((p) => p.id === "cd")?.valor - linha(fora, "alma").propriedades.find((p) => p.id === "cd")?.valor, 6);
  t(`${sistema}: a CD de Aptidão não sobe (DA-13)`, cd.cd, fora.cd);

  const dano = amp([{ id: "e1", categoria: "amp_tecnica", tipo: "dano" }]);
  t(`${sistema}: Golpeador ganha 3 dados e 10 fixo (E-10)`,
    [linha(dano, "golpe").rolagens[0].dados - linha(fora, "golpe").rolagens[0].dados, linha(dano, "golpe").rolagens[0].fixo], [3, 10]);
  t(`${sistema}: Dano na Alma ganha a metade, com piso (1 dado e 5 fixo)`,
    [linha(dano, "alma").rolagens[0].dados - linha(fora, "alma").rolagens[0].dados, linha(dano, "alma").rolagens[0].fixo], [1, 5]);
  t(`${sistema}: o Dano comum continua pelo Motor, como sempre`,
    linha(dano, "dano").rolagens[0].dados - linha(fora, "dano").rolagens[0].dados, 3);
  t(`${sistema}: em Confronto nada disso vale`,
    linha(amp([{ id: "e1", categoria: "amp_tecnica", tipo: "dano" }], "confronto"), "golpe").rolagens[0].fixo, 0);

  /* ============================================================ */
  /* O RITUAL DA EXPANSÃO NOS ESPECIAIS E AUXILIARES (E-11)        */
  /* ============================================================ */
  const ritual = deriveAfty(ficha({ combate: no("ativa"), ritual: { especial: "aumentoDano", auxiliar: "potencializacaoEfeito" } }));
  t(`${sistema}: Aumento de Dano no Golpeador (+4 × nível)`, linha(ritual, "golpe").rolagens[0].fixo, 12);
  t(`${sistema}: e no Dano na Alma pela metade`, linha(ritual, "alma").rolagens[0].fixo, 6);
  t(`${sistema}: o Auxiliar mostra o Ritual na linha`,
    linha(ritual, "aux").propriedades.find((p) => p.id === "ritualDominio")?.valor, "Potencialização de Efeito");
  t(`${sistema}: sem a Expansão no ar, nenhum Ritual`,
    linha(deriveAfty(ficha({ ritual: { auxiliar: "potencializacaoEfeito" } })), "aux").propriedades.some((p) => p.id === "ritualDominio"), false);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
