import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { normalizarPacote, validarPacote, aplicarAddons } = await import("../src/systems/afty/afty-addons.js");
const source = process.argv[2];
if (!source) throw Error("Informe o caminho do JSON original do Ciel");
const pacoteFicha = JSON.parse(readFileSync(source, "utf8"));
const c = pacoteFicha.creatures[0];
const sniperOriginal = c.armasCustom.find((a) => a.nome.trim() === "Sniper");
const armaId = "ciel-lucielus:sniper";
const maxima = c.feiticos.find((f) => f.nome.trim() === "Fio do Vazio");
const fome = "Fome de Guerra (Antiga: Espírito da Guerra): Ciel se transmuta conforme o caos aumenta. Para cada inimigo debilitado (petrificado ou sangrando), ele absorve o desespero ambiente, recebendo +1 em acerto e 1d+5 em dano físico, acumulando-se até o ápice de +5/5d+25.";
const mira = "(Mira Destrutiva): Ao abdicar da vantagem comum para focar em um ponto vital (olho, perna, braço), Ciel assume uma penalidade de -10 no acerto. Se bem-sucedido, ele não apenas fere, mas impõe as consequências de perda de membro conforme a tabela de danos extremos por 2 rodadas.";
const forma = 'Tipo: Transformação | Conjuração: Ação Bônus\nSustento: 90 pontos de vida por rodada\nDuração: Sustentada\n\nLu e Ciel força sua energia amaldiçoada a transbordar pelo corpo, entrando em estado de hipervitalidade. Enquanto sustentada, ele recebe os seguintes efeitos simultaneamente:\n\n- Forma Demonica.\n- Aumento de Atributo( 4 Dex, 4 Const e 4 Int )\n\nEncerrando a transformação: Ao encerrar voluntariamente ou ao ficar sem vida para pagar o custo, Lu recebe a condição Exposto por 2 rodadas e sua regeneração é reduzida à metade até o início do seu próximo turno. Sustentar uma transformação por mais de 2 rodadas consecutivas, desconsiderando a rodada de ativação, garante um ponto de exaustão.';
const graus = [
  ["Ponto de Ruptura: Exposição Fatal", "I: Ponto de Ruptura:Exposição Fatal: Caso a precisão supere a CA por 5 ou mais, o inimigo entra em choque, sofrendo desvantagem em todos os seus ataques por duas rodadas."],
  ["Colapso de Defesa", "II: Colapso de Defesa: Tiros que superam a CA do alvo por 10 ou mais destroçam a postura do inimigo, reduzindo sua CA em 9 por duas rodadas."],
  ["Carnificina Superior", "III:  Carnificina Superior: O ápice da técnica. O desmembramento causado por Ciel agora é definitivo (arranca o membro). Superar a CA por 15 ou mais aplica o estado de Sangramento Extremo."],
  ["Veredito do Carrasco (Sequencial Destrutivo)", "IV:Veredito do Carrasco (Sequencial Destrutivo): Ao superar a CA por 20 ou mais, o alvo é marcado com Vulnerabilidade total por 2 rodadas. Além disso, Ciel agora pode executar a Mira Destrutiva duas vezes por rodada."],
];
const textoMaxima = "Custo Mecânico: Ação Completa (Consome Ação Padrão, Ação Bônus, todos os Ataques Extras e o Surto de Ação  do turno)\n\nDescrição: Ciel subitamente cessa todo o movimento. No meio do caos da batalha, ele encontra um instante de silêncio absoluto. Ele não está apenas mirando; ele está impondo o fim.\n\nAo abrir mão de sua velocidade e de ataques múltiplos, Ciel força uma quantidade letal e instável de energia amaldiçoada no cano de sua arma. A pressão é tão densa que o ar ao redor deforma, criando pequenas faíscas negras gravitacionais que tentam escapar, mas são engolidas de volta pela força da compressão. Ele usa seu Surto de Ação não para se mover mais rápido, mas para forçar seu próprio corpo a suportar o recuo iminente de concentrar apenas morte em um espaço tão pequeno.\n\nQuando o gatilho é puxado, não há um estrondo comum, mas o som de um vácuo rasgando a realidade. O disparo é um feixe singular e escuro como o abismo.\n\nMecanico: TRANSFORMAÇÕES: Tecnica Maxima\nEscolha entre três efeitos auxiliares Duradouros de Nível 4\nDura apenas uma Rodada: 4 para 5.\nEfeitos da Transformação\nDANO ADICIONAL – APÓS ATAQUE - 7d12 Um Unico Disparo passa pra 14d12\nDANO ADICIONAL – DURANTE ATAQUE 5d12 Um Unico Disparo passa pra 10d12\nDANO ADICIONAL – DANO FIXO +50 Um Unico Disparo passa pra 100.";
// A regra local proíbe ponto e vírgula na UI. A descrição é preservada com
// pontuação equivalente, sem mudar palavras ou conteúdo mecânico.
const textoMaximaUI = textoMaxima.replaceAll(";", ",");
const pacote = {
  id: "ciel-lucielus", nome: "Ciel Lucielus", versao: "1.0.0", paraRaw: "afty",
  permite: ["alcanceArmaMult"],
  descricao: "Fome de Guerra, Mira Destrutiva, Forma Verdadeira e Fio do Vazio.",
  acrescenta: { armas: [{
    id: "sniper", nome: "Sniper", classe: sniperOriginal.classe,
    categoria: sniperOriginal.categoria, dano: sniperOriginal.dano,
    critico: sniperOriginal.critico, espacos: sniperOriginal.espacos,
    custo: sniperOriginal.custo, grupo: sniperOriginal.grupo,
    props: { ...sniperOriginal.props, alcance: [360, 720] },
  }] },
  acoesMotor: [
    { id: "sol", nome: "Postura do Sol (estilo próprio)", tipo: "estado",
      descricao: "quando ele esteja na postura do Sol ele aumente de 2x para 4x o alcance de suas armas",
      efeitos: [{ canal: "alcanceArmaMult", alvo: "arma",
        quando: "!em_postura_sol e !invencivel_sob_osol", expr: "4 / (1 + em_postura_ceu)" }] },
    { id: "fome", nome: "Fome de Guerra", descricao: fome, tipo: "contador", max: 5,
      efeitos: [
        { canal: "bonusAcerto", expr: "cargas" },
        { canal: "dadosDano", alvo: "basico|tipo:pf|tipo:ct|tipo:im", expr: "cargas" },
        { canal: "danoBonus", alvo: "basico|tipo:pf|tipo:ct|tipo:im", expr: "5 * cargas" },
      ] },
    { id: "mira", nome: "Mira Destrutiva", descricao: mira, tipo: "estado",
      efeitos: [{ canal: "acertoArma", alvo: armaId, expr: "-10" }] },
    { id: "forma", nome: "LM - Forma Verdadeira(15)", descricao: forma, tipo: "estado",
      custoPE: 15, sustentacaoPV: 90,
      efeitos: ["destreza", "constituicao", "inteligencia"].flatMap((alvo) => [
        { canal: "atributo", alvo, expr: "4", furaTeto: alvo === "destreza", duracao: "temporaria" },
        { canal: "limiteAtributo", alvo, expr: "4", furaTeto: alvo === "destreza" },
      ]) },
    { id: "alcance", nome: "Estilo próprio de Ciel", tipo: "passivo",
      efeitos: [
        { canal: "alcanceArmaMult", alvo: "cat:distancia|cat:arremesso", quando: "destreza >= 32", expr: "10" },
        { canal: "alcanceArmaMult", alvo: "arma",
          quando: "em_postura_sol ou invencivel_sob_osol",
          expr: "4 / (1 + (em_postura_ceu ou invencivel_sob_osol))" },
      ] },
    { id: "maxima", nome: "Fio do Vazio", descricao: textoMaximaUI, tipo: "disparo",
      feiticoId: maxima.id, armaId, consomeUso: "cmb_surto_de_acao",
      efeitos: [{ canal: "danoBonus", alvo: armaId, expr: "100" }],
      dados: [{ dados: 14, faces: 12, momento: "apos" }, { dados: 10, faces: 12, momento: "durante" }] },
  ],
  funcionamentos: [
    { id: "sol", nome: "Estilo próprio de Ciel",
      descricao: "quando ele esteja na postura do Sol ele aumente de 2x para 4x o alcance de suas armas" },
    { id: "fome", nome: "Fome de Guerra", descricao: fome },
    { id: "mira", nome: "Mira Destrutiva", descricao: mira },
    { id: "forma", nome: "LM - Forma Verdadeira(15)", descricao: forma },
    ...graus.map(([nome, descricao], i) => ({ id: "mira_" + i, nome, descricao })),
  ],
};
const normalizado = normalizarPacote(pacote);
const erros = validarPacote(normalizado);
if (erros.length) throw Error(erros.join("\n"));
c.addons = [...c.addons.filter((p) => p.id !== pacote.id), normalizado];
for (const item of c.equipamentos.itens) {
  if (item.tipo === "arma" && item.refId === sniperOriginal.id) item.refId = armaId;
}
for (const treino of c.treinamentos?.manejo_arma ?? []) {
  if (treino.alvo === sniperOriginal.id) treino.alvo = armaId;
}
// Natureza Personalizada mantém identidade, custo e recarga da Máxima oficial.
// A transformação de um disparo é resolvida exclusivamente pela ação do addon.
Object.assign(maxima, { tipo: "personalizado", descricao: textoMaximaUI,
  acaoPersonalizada: "Ação Completa", duracaoTexto: "Um único disparo",
  alcanceTexto: "Sniper", comCd: false, rolagens: [], transfEfeitos: [] });
const sequencial = c.feiticos.find((f) => f.nome.trim() === "Sequencial Destrutivo");
if (sequencial) {
  sequencial.nome = graus[3][0];
  sequencial.descricao = graus[3][1];
}
pacoteFicha.exportedAt = new Date().toISOString();
aplicarAddons(c.addons);
const d = deriveAfty(c);
mkdirSync(new URL("../src/systems/afty/exports/", import.meta.url), { recursive: true });
writeFileSync(new URL("../addons/ciel-lucielus.json", import.meta.url), JSON.stringify(pacote, null, 2) + "\n");
writeFileSync(new URL("../src/systems/afty/exports/ciel-lucielus-automatizado.json", import.meta.url), JSON.stringify(pacoteFicha, null, 2) + "\n");
console.log(JSON.stringify({ atributos: d.attrEff, armas: d.dano.entradas.map((e) => ({ id: e.id, nome: e.nome, alcance: e.alcance, dano: e.formulaNormal })), maxima: d.feiticos.lista.find((f) => f.id === maxima.id), usos: d.usosHabilidades }, null, 2));
