import { readFileSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath } from "node:url";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
await import("../src/systems/afty/afty-derive.js");
const EQ = await import("../src/systems/afty/afty-equipamentos.js");
const AD = await import("../src/systems/afty/afty-addons.js");

// Fonte do autor, acrescida das respostas da sessão. Não agrega anotações de
// talentos, Armeiro ou Treinamentos à base dos equipamentos.
const textos = {
  murasama: {
    unica: "Lâmina Carniceira\n\nA Murasama é uma espada guiada pelo sangue, permitindo que sua própria vontade influencie ainda mais seu portador.\n\nFuncionamento:\n- Quando o portador consegue um acerto crítico contra um alvo que já esteja sangrando, aumenta o sangramento desse alvo em um nível.\n- Caso o alvo já esteja em Sangramento Extremo, não aumenta mais o nível.\n- Em vez disso, o alvo sofre metade dos dados de dano correspondentes ao Sangramento Extremo.",
    narrativa: "Uma das melhores criações de Sengo Muramasa.\n\nO povo dizia que as espadas forjadas por Muramasa eram yōtō, espadas demoníacas que possuíam uma sede de sangue incontrolável.\n\nAcreditava-se que essas espadas precisavam provar sangue para não trazer azar ou enlouquecer seus portadores.\n\nApós provar inúmeras vezes o sangue de seus inimigos, principalmente de feiticeiros, essa espada carniceira se tornou amaldiçoada, assim como seu portador.",
    mecanica: "Sede de Sangue\n\nEnquanto empunha a Murasama, o portador consegue perceber sensações relacionadas a:\n- Sede de sangue.\n- Agressividade.\n- Intenções hostis.\n- Outras sensações relacionadas às anteriores.\n\nO portador recebe um bônus igual ao seu BT em testes de Percepção relacionados a essas sensações.\n\nO bônus deve ser aplicado somente aos testes apropriados, conforme as regras existentes.",
  },
  dragon_bone: {
    unica: "Armazenar e Liberar\n\nA Dragon Bone absorve e armazena parte da energia amaldiçoada de ataques recebidos, permitindo que seu portador libere a energia acumulada em ataques posteriores.\n\nAbsorção\nAo receber um ataque envolvendo energia amaldiçoada, o portador pode utilizar sua Reação para ativar a absorção.\n- Armazena metade da energia amaldiçoada gasta no ataque recebido.\n- Caso o ataque não tenha gasto de energia, recebe 2 acúmulos.\n- O limite máximo é de 20 acúmulos.\n\nRedução de dano\nAo absorver a energia do impacto, o portador reduz o dano proveniente de energia amaldiçoada daquele ataque.\nRedução de dano = BT × 3\nEssa redução se aplica ao ataque que desencadeou a reação.\n\nLiberação de energia\nO portador pode gastar uma Ação Bônus durante um ataque para liberar a energia armazenada.\n- A cada 2 acúmulos, recebe 1 dado adicional de dano.\n- O máximo de dados adicionais em um único ataque é igual à metade do Treinamento + 1.\n- Os acúmulos utilizados devem ser consumidos na liberação.\n\nA quantidade de acúmulos consumidos deve corresponder aos dados liberados, respeitando as regras que forem confirmadas.\n\nDestruição de armas\nAlternativamente, ao liberar a energia acumulada, o portador pode direcioná-la contra a arma de seu oponente para destruí-la.\nNesse caso:\n- Os acúmulos são gastos.\n- O ataque não causa dano adicional por essa liberação.\n- O efeito é direcionado à arma inimiga.",
  },
  uniforme: {
    unica: "Impulso\n\nUm traje que acompanhou toda a evolução de um feiticeiro de Grau Especial.\n\nO uniforme aprimora os reflexos do portador e sua capacidade de reagir às manifestações de energia amaldiçoada.\n\nQuando se torna alvo de uma fonte de energia amaldiçoada, o portador pode gastar uma carga para utilizar a habilidade Perceber o Ar.\n\nAo utilizar a habilidade, recebe metade de seu BT em Acrobacia, conforme a mecânica original.\n\nO uniforme não pode ser rastreado por meio de energia amaldiçoada.",
    narrativa: "O uniforme foi confeccionado especialmente para seu portador, encaixando-se perfeitamente em seu corpo e favorecendo movimentos ágeis e precisos.",
    mecanica: "Uniforme Sob Medida\n\nEnquanto utiliza o uniforme, o portador recebe:\n- +2 em testes de Acrobacia.\n- +2 em testes de Furtividade.\n\nEsses bônus devem ser removidos quando o uniforme deixar de ser utilizado, conforme as regras de equipamentos do sistema.",
  },
  totsuka: {
    unica: "Queimação Superior\n\nA Totsuka-No-Tsurugi possui uma manifestação superior de sua energia queimante.\n\nEfeito principal\nAo causar dano Queimante, o portador ignora a resistência do alvo a esse dano.\n\nEfeito alternativo\nO portador pode gastar uma Ação Bônus para abdicar da capacidade de ignorar resistências e, em troca, causar dano Radiante.",
  },
  yagen: {
    unica: "Bloqueador\n\nYagen é uma lâmina curta que clama por batalhas para saciar sua fome, mas está condenada a funcionar como uma lâmina de aparo.\n\n- A RD base do escudo aumenta em uma quantidade igual ao Bônus de Treinamento do portador.\n- A habilidade Ler Intenções aumenta em um nível.",
    narrativa: "Yagen é uma espada criada por Sengo Muramasa, assim como suas irmãs.\n\nDiferentemente das demais, foi criada para aparar ataques e proteger outras pessoas.\n\nTal propósito é revoltante para uma espada amaldiçoada que clama constantemente por batalhas.\n\nSua vontade está sempre direcionando o portador ao combate direto, incentivando confrontos e dificultando sua concentração em outras atividades.",
    mecanica: "Espírito Confrontador\n\nOrientação Instintiva\nO portador sempre sabe onde fica o Norte.\n\nLeitura de Intenções\nAo utilizar a ação Ler Intenções, recebe +2 no bônus fornecido pela ação.",
  },
  esmaga_mata: {
    unica: "Leve Caminhada Matinal\n\nA arma reduz a dissipação da força utilizada nos passos do portador, permitindo impulsos muito mais eficientes.\n\nEnquanto empunha Esmaga Mata, o portador recebe:\n+13,5 metros no deslocamento de pulo.",
  },
  presa: {
    unica: "Predar\n\nUma adaga feita sob medida para Ryuma auxiliar contra as maldições de GE na Raid de Yamato.\nPropriedade GE: Seu portador tem sua margem de crítico reduzida em 3 enquanto a empunha.",
  },
};
const fa = (encantamentos, unica = "", grau = "especial") => ({
  grau, encantamentos, habilidadeUnica: unica, habilidadeEfeitos: [],
});
const descricao = (key, propriedades, manejo = null) => [
  propriedades ? `Propriedades: ${propriedades}` : null,
  manejo ? `Manejo de Arma: ${manejo}` : null,
  textos[key]?.unica, textos[key]?.narrativa, textos[key]?.mecanica,
].filter(Boolean).join("\n\n");
const arma = (id, nome, grupo, dado, elemento, custo, props, encantamentos, key, extras = {}) => ({
  id, nome, classe: "complexa", categoria: "corpo", grupo, custo, espacos: 1, critico: 20,
  dano: { dado, tipo: elemento,
    ...(encantamentos.includes("enc_arma_potente") ? { encantamentosIncluidos: ["enc_arma_potente"] } : {}) },
  props, faFixa: true, faPadrao: fa(encantamentos, textos[key]?.unica),
  narrativa: textos[key]?.narrativa ?? "", propriedadeEspecial: textos[key]?.mecanica ?? "",
  ...extras,
});
const faca = { apunhaladora: true, arremessavel: [6, 18], fineza: true, leve: true, marcial: true, modular: "ct" };
const colossalBase = EQ.ARMAS.find((a) => a.id === "arm_espada_colossal");
const pacote = {
  id: "arsenal-de-ryuma", nome: "Arsenal de Ryuma", versao: "1.0.0", paraRaw: "afty",
  descricao: "Equipamentos de Ryuma.",
  acrescenta: {
    armas: [
      arma("murasama", "Murasama", "espada", "2d10", "congelante", 4,
        { fineza: true, energica: true, leve: true },
        ["enc_arma_certeira", "enc_arma_complementar", "enc_arma_potente", "enc_arma_elemental"], "murasama",
        { descricao: descricao("murasama", "Fineza, Fatal, Energética, Mortal, Leve e Especial.", "Precisa"),
          camposPendentes: ["fatal", "mortal", "nivel", "manejoEspecial", "tipoFisico"],
          dadosOriginais: { dano: 5, alcance: 1.5 }, alcanceCorpo: 1.5, manejoInformado: "Precisa" }),
      arma("dragon_bone", "Dragon Bone (Versão Odachi)", "espada", "2d12", "queimante", 4,
        { fineza: true, versatil: true, energica: true },
        ["enc_arma_penetrante", "enc_arma_amplificadora", "enc_arma_elemental", "enc_arma_potente", "enc_arma_destruidora"], "dragon_bone",
        { descricao: descricao("dragon_bone", "Versátil, Fineza, Fatal, Energética e Mortal.", "Precisa"),
          camposPendentes: ["fatal", "mortal", "duasMaos", "alcance", "manejoEspecial", "tipoFisico"],
          dadosOriginais: { dano: 5, nivel: "Padrão" }, manejoInformado: "Precisa" }),
      arma("totsuka", "Totsuka-No-Tsurugi", "espada", "1d8", "queimante", 1,
        { versatil: true, fatal: "d10", fineza: true },
        ["enc_arma_defensora", "enc_arma_elemental", "enc_arma_certeira", "enc_arma_sintonizada"], "totsuka",
        { descricao: descricao("totsuka", "Versátil, Fatal d10 e Fineza.", "Precisa"),
          faPadrao: { ...fa(["enc_arma_defensora", "enc_arma_elemental", "enc_arma_certeira", "enc_arma_sintonizada"], textos.totsuka.unica), sintonizadaTipo: "queimante" },
          camposPendentes: ["duasMaos", "alcance", "manejoEspecial", "tipoFisico"],
          dadosOriginais: { dano: 5, nivel: "Padrão" }, manejoInformado: "Precisa" }),
      arma("esmaga_mata", "Esmaga Mata", "faca", "1d6", "acido", 4, faca,
        ["enc_arma_certeira", "enc_arma_precisa", "enc_arma_potente", "enc_arma_elemental"], "esmaga_mata",
        { descricao: descricao("esmaga_mata", "Apunhaladora, Arremessável [6/18m], Fineza, Leve, Marcial e Modular Ct.", "Penetrante"),
          dadosOriginais: { dano: 5, nivel: "Padrão", alcance: 1.5 }, alcanceCorpo: 1.5, manejoInformado: "Penetrante",
          camposPendentes: ["manejoEspecial", "tipoFisico"] }),
      { ...structuredClone(colossalBase), id: "espada_colossal", nome: "Espada colossal",
        dano: { dado: "2d8", tipo: "chocante", encantamentosIncluidos: ["enc_arma_potente"] },
        faFixa: true, faPadrao: fa(["enc_arma_penetrante", "enc_arma_elemental", "enc_arma_potente"], "", "primeiro"),
        dadosOriginais: { dano: 4, nivel: "Padrão" },
        descricao: EQ.ARMA_ESPECIAIS.find((e) => e.id === colossalBase.especial)?.descricao ?? "" },
      arma("presa_desgarrado", "Presa do Desgarrado", "faca", "1d6", "sonico", 1, faca,
        ["enc_arma_certeira", "enc_arma_harmonizada", "enc_arma_potente", "enc_arma_elemental"], "presa",
        { descricao: descricao("presa", "Apunhaladora, arremessável [6/18m], fineza, leve, marcial, modular Ct", "Precisa"),
          efeito: { aplicado: true, motor: [{ canal: "margemCritico", expr: "3" }] },
          dadosOriginais: { dano: 5, nivel: "Padrão", alcance: 7.5 }, alcanceCorpo: 7.5, manejoInformado: "Precisa",
          camposPendentes: ["manejoEspecial", "tipoFisico"] }),
    ],
    escudos: [{ id: "yagen", nome: "Yagen Tōshirō", rdEscudo: 8, rdEscudoAdicionalExpr: "bt",
      penalidade: 0, custo: 4, espacos: 2, ocupaMao: true, dano: null, faFixa: true,
      faPadrao: fa(["enc_esc_reforcado", "enc_esc_intangivel", "enc_esc_expansao"], textos.yagen.unica),
      descricao: descricao("yagen"), narrativa: textos.yagen.narrativa, propriedadeEspecial: textos.yagen.mecanica,
      dadosOriginais: { rdFisica: 31, rdGrau: 5, nivel: "Padrão", alcance: 1.5 },
    }],
    uniformes: [{ id: "lobo_saltitante", nome: "Uniforme do Lobo Saltitante", defesa: 8,
      penalidade: -6, custo: 4, espacos: 6, faFixa: true,
      faPadrao: fa(["enc_unif_blindado", "enc_unif_propulsor", "enc_unif_furtivo", "enc_unif_material_pesado"], textos.uniforme.unica),
      descricao: descricao("uniforme"), narrativa: textos.uniforme.narrativa, propriedadeEspecial: textos.uniforme.mecanica,
      efeito: { aplicado: true, pericia: { acrobacia: 2, furtividade: 2 } },
      dadosOriginais: { defesa: 10, penalidade: 6 },
    }],
  },
};
export { pacote };

// Proveniência por grau, independente da configuração fixa que o resolvedor
// consome. Destruidora foi confirmada depois, sem indicação de grau.
for (const def of [...pacote.acrescenta.armas, ...pacote.acrescenta.escudos, ...pacote.acrescenta.uniformes]) {
  // Autor confirmou que não há Manejo Especial. Não é um dado ausente nem
  // uma autorização para conceder habilidade, encantamento ou treino.
  def.manejoEspecialInformado = null;
  if (def.camposPendentes) def.camposPendentes = def.camposPendentes.filter((campo) => campo !== "manejoEspecial");
  const ids = def.faPadrao.encantamentos;
  def.encantamentosPorGrau = def.id === "lobo_saltitante"
    ? { quarto: [ids[0]], terceiro: [ids[1]], segundo: [ids[2]], primeiro: [ids[3]] }
    : { quarto: [], terceiro: [ids[0]], segundo: [ids[1]], primeiro: ids.slice(2, def.id === "dragon_bone" ? 4 : undefined) };
  def.encantamentosPorGrau.especial = def.faPadrao.grau === "especial"
    ? [def.faPadrao.habilidadeUnica.split("\n")[0]] : [];
  if (def.id === "dragon_bone") def.encantamentosSemGrauInformado = ["enc_arma_destruidora"];
}

/** Atualiza somente o addon do arsenal e suas entradas, preservando estado e
 * escolhas anteriores de itens já existentes. Nunca duplica UID ou refId. */
export function integrarArsenal(exportado) {
  const copia = structuredClone(exportado);
  const alvo = copia.creatures?.filter((c) => c.name === "Ryuma") ?? [];
  if (alvo.length !== 1) throw new Error("O export deve conter exatamente uma ficha Ryuma");
  const c = alvo[0];
  const normalizado = AD.normalizarPacote(pacote);
  const problemas = AD.validarPacote(normalizado);
  if (problemas.length) throw new Error(problemas.join("\n"));
  c.addons = [...(c.addons ?? []).filter((a) => a.id !== pacote.id), normalizado];
  c.equipamentos ??= { itens: [] };
  c.equipamentos.itens ??= [];
  for (const [familia, tipo] of [["armas", "arma"], ["escudos", "escudo"], ["uniformes", "uniforme"]]) {
    for (const def of normalizado.acrescenta[familia]) {
      const refId = `${pacote.id}:${def.id}`;
      if (c.equipamentos.itens.some((e) => e.tipo === tipo && e.refId === refId)) continue;
      c.equipamentos.itens.push({ uid: `eq_ryuma_${def.id.split(":").at(-1)}`, tipo,
        refId, qtd: 1, equipado: false, fa: structuredClone(def.faPadrao) });
    }
  }
  return copia;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) throw new Error("Informe o export de entrada e o caminho de saída");
  if (entrada === saida) throw new Error("Use uma cópia de saída, preserve o arquivo original");
  writeFileSync(new URL("../addons/arsenal-de-ryuma.json", import.meta.url), `${JSON.stringify(pacote, null, 2)}\n`);
  writeFileSync(saida, `${JSON.stringify(integrarArsenal(JSON.parse(readFileSync(entrada, "utf8"))), null, 2)}\n`);
  console.log("Arsenal criado: oito itens guardados, sem alterações nos demais dados da ficha");
}
