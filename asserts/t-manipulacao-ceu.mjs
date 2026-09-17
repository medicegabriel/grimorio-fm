import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { calcularFeiticoPassivo, calcularFeiticoPersonalizado } = await import(R + "afty-feiticos.js");
const AD = await import(R + "afty-addons.js");
const CEU = await import(R + "afty-manipulacao-ceu.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("../addons/manipulacao-do-ceu.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

t("o pacote valida", AD.validarPacote(PACOTE), []);
t("o pacote instala", AD.aplicarAddons([PACOTE]).problemas, []);

const refletir = PACOTE.feiticos.find((f) => f.id === "refletir_imagem");
const duplicata = PACOTE.feiticos.find((f) => f.id === "duplicata_perfeita");
t("Refletir Imagem é de Nível 5", refletir.nivel, 5);
t("Refletir Imagem usa Ação Comum e alvo Pessoal",
  [refletir.acaoPersonalizada, refletir.alcanceTexto, refletir.alvoTexto],
  ["Comum", "Pessoal", "Próprio"]);
t("Refletir Imagem usa o custo padrão do Nível 5",
  calcularFeiticoPersonalizado(refletir).custoPE, 20);
t("Refletir Imagem é Sustentada", refletir.duracaoTexto, "Sustentado, Concentração");
t("Duplicata Perfeita é Passivo de Nível 5", [duplicata.tipo, duplicata.nivel], ["passivo", 5]);
const passivo = calcularFeiticoPassivo(duplicata);
t("Duplicata não inventa efeito numérico do Motor", passivo.efeitosGerados, []);
t("Duplicata conserva o custo de PE máximo da Característica", passivo.custoPeMaximo, 10);

const ficha = ({ copias = 0, aura = false, duplicataAtiva = true, combate = true } = {}) => {
  const c = createBlankAfty();
  c.core.nd = 20;
  c.core.tipo = "conjurador";
  c.especializacoes = [{ id: "conjurador", nivel: 20 }];
  c.aptidoesAmaldicoadas = ["aura_embacada"];
  c.addons = [PACOTE];
  c.feiticos = [
    { ...refletir, id: CEU.REFLETIR_IMAGEM_ID },
    ...(duplicataAtiva ? [{ ...duplicata, id: CEU.DUPLICATA_PERFEITA_ID }] : []),
  ];
  c.combate = {
    ativo: combate,
    auraEmbacada: aura,
    [CEU.COPIAS_REFLETIDAS_ID]: copias,
  };
  return c;
};

const ligado = (copias, duplicataAtiva = true) => deriveAfty(ficha({ copias, aura: true, duplicataAtiva }));
t("Aura Embaçada ganha interruptor em Buffs",
  ligado(0).combate.estadosExtras.some((e) => e.id === "auraEmbacada"), true);
const estadoCopias = ligado(0).combate.estadosExtras.find((e) => e.id === CEU.COPIAS_REFLETIDAS_ID);
t("o contador tem dois degraus", [estadoCopias.min, estadoCopias.max], [0, 2]);
t("o contador fica reservado ao painel principal",
  [estadoCopias.ocultarEmBuffs, estadoCopias.ocultarNoCriador], [true, true]);
t("cada cópia aumenta o limiar em um",
  [0, 1, 2].map((copias) => ligado(copias).manipulacaoCeu.limiar), [2, 3, 4]);
t("cada cópia aumenta dez pontos percentuais",
  [0, 1, 2].map((copias) => ligado(copias).manipulacaoCeu.percentual), [20, 30, 40]);
t("sem Duplicata Perfeita as cópias não alteram a Aura",
  ligado(2, false).manipulacaoCeu.percentual, 20);
t("com a Aura desligada o resultado fica inativo",
  deriveAfty(ficha({ copias: 2, aura: false })).manipulacaoCeu.percentual, 0);
t("fora de combate as cópias e a Aura zeram",
  deriveAfty(ficha({ copias: 2, aura: true, combate: false })).manipulacaoCeu,
  {
    disponivel: true,
    temDuplicata: true,
    temAura: true,
    auraAtiva: false,
    copias: 0,
    maxCopias: 2,
    limiar: 0,
    percentual: 0,
    estadoId: CEU.COPIAS_REFLETIDAS_ID,
  });

const fichaArgalia = ficha({ copias: 2, aura: true });
fichaArgalia.addons = [];
fichaArgalia.feiticos = [
  { ...refletir, id: "feit_mu4mq62a_4", nome: "Refletir Imagem" },
  { ...duplicata, id: "feit_mu4qjlpf_1", nome: "Duplicata perfeita" },
];
t("a ficha existente da Argalia é reconhecida pelos Feitiços que já possui",
  deriveAfty(fichaArgalia).manipulacaoCeu.percentual, 40);

if (bad.length) {
  console.error(`FALHOU ${bad.length} de ${ok + bad.length}:\n  - ${bad.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
