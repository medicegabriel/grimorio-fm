/**
 * ESTILO MASSIVO, A ROLAGEM REPETIDA — 2026-10-02
 *
 * "Quando rolar um 1 ou 2 em um dado na rolagem de dano com uma arma que esteja
 * usando em duas mãos ou que possua a propriedade pesada, você pode rolar
 * novamente esse dado, ficando com o novo resultado."
 *
 * O +1 de dano já estava no Motor (t-combatente-revisao.mjs). A rolagem era de
 * mesa, e o autor a pediu programada, com três decisões:
 *   • AUTOMÁTICA: todo 1 e 2 rola de novo uma vez, sem perguntar.
 *   • em TODOS os dados da linha, e não só no da arma.
 *   • nos DOIS sistemas.
 *
 * O canal é `rerrolaDano`, que NÃO SOMA: o valor é o maior resultado que rola de
 * novo, e entre fontes vale o maior.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { getCanal, canaisSemGrupo } = await import(R + "afty-efeitos.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Dado viciado: cada chamada devolve o rng que faz `umDado` cair na face
   pedida. `umDado` é 1 + piso(rng × faces). */
const viciado = (faces, ...resultados) => {
  let i = 0;
  return () => (resultados[i++] - 0.5) / faces;
};

/* ============================================================ */
/* 1. O CANAL                                                    */
/* ============================================================ */
t("o canal existe e mira fonte de dano", getCanal("rerrolaDano")?.alvo, "fonteDano");
t("e mora num grupo nomeado", canaisSemGrupo().includes("rerrolaDano"), false);

/* ============================================================ */
/* 2. A MARCA NA LINHA, NOS DOIS SISTEMAS                        */
/* ============================================================ */
const MASSIVO = { cmb_repertorio_do_especialista: ["cmb_estilo_massivo"] };
const ficha = (sistema, armas, o = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 12, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 12 }];
  f.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  // A criatura só tem o Repertório escolhido; o jogador o recebe da Classe.
  f.habilidades = o.escolhas ? ["cmb_repertorio_do_especialista"] : [];
  f.escolhasHabilidade = o.escolhas ?? {};
  f.equipamentos = {
    itens: armas.map((a, i) => ({
      id: `e${i}`, tipo: "arma", refId: a.ref, qtd: 1, equipado: true, ...(a.duas ? { duasMaos: true } : {}),
    })),
  };
  if (o.funcionamentos) f.core.funcionamentosAdicionais = o.funcionamentos;
  return f;
};
const linhaDa = (sistema, arma, o) =>
  deriveAfty(ficha(sistema, [arma], o)).dano.entradas.find((e) => e.id === arma.ref);
const MARCA = { ate: 2, fonte: "Estilo Massivo" };

for (const sistema of ["afty", "player"]) {
  const com = (arma) => linhaDa(sistema, arma, { escolhas: MASSIVO })?.rerrola ?? null;
  t(`${sistema}: Espada Grande (Pesada e Duas Mãos) rola de novo 1 e 2`, com({ ref: "arm_espada_grande" }), MARCA);
  t(`${sistema}: só Pesada, só Duas Mãos e Versátil nas duas mãos também`, [
    com({ ref: "arm_corrente_de_aco" }), com({ ref: "arm_adagas_duplas" }),
    com({ ref: "arm_espada_longa", duas: true }),
  ], [MARCA, MARCA, MARCA]);
  t(`${sistema}: Versátil numa mão e arma comum não`, [
    com({ ref: "arm_espada_longa" }), com({ ref: "arm_espada_curta" }),
  ], [null, null]);
  const basico = deriveAfty(ficha(sistema, [{ ref: "arm_espada_grande" }], { escolhas: MASSIVO }))
    .dano.entradas.find((e) => e.id === "basico");
  t(`${sistema}: o Ataque Básico não`, basico.rerrola, null);
  t(`${sistema}: sem o Estilo, nada`, linhaDa(sistema, { ref: "arm_espada_grande" })?.rerrola ?? null, null);

  /* O Talento Adepto de Combate empresta o mesmo pool de Estilos, e chega igual. */
  const adepto = ficha(sistema, [{ ref: "arm_espada_grande" }]);
  adepto.core = { ...adepto.core, tipo: "lutador" };
  adepto.especializacoes = [{ id: "lutador", nivel: 12 }];
  adepto.talentos = ["tal_adepto_de_combate"];
  adepto.escolhasTalento = { tal_adepto_de_combate: ["cmb_estilo_massivo"] };
  t(`${sistema}: pelo Adepto de Combate também`,
    deriveAfty(adepto).dano.entradas.find((e) => e.id === "arm_espada_grande").rerrola, MARCA);
}

/* ============================================================ */
/* 3. O CANAL NÃO MEXE EM NÚMERO, E ENTRE FONTES VALE O MAIOR    */
/* ============================================================ */
const fb = (expr) => [{ id: "fb_teste", nome: "Regra de Mesa", efeitos: [{ canal: "rerrolaDano", alvo: "arma", expr }] }];
for (const sistema of ["afty", "player"]) {
  const sem = linhaDa(sistema, { ref: "arm_espada_curta" });
  const so = linhaDa(sistema, { ref: "arm_espada_curta" }, { funcionamentos: fb("2") });
  t(`${sistema}: o canal sozinho marca a linha`, so.rerrola, { ate: 2, fonte: "Regra de Mesa" });
  t(`${sistema}: e não muda dado, fixo nem total`,
    [so.dados, so.fixo, so.total, so.formulaNormal], [sem.dados, sem.fixo, sem.total, sem.formulaNormal]);

  /* ⚠ O MAIOR, E NÃO A SOMA. Massivo (2) com uma fonte de 1 continua 2: somar
     daria "rola de novo até 3", regra que nenhuma das duas escreve. */
  const grande = { ref: "arm_espada_grande" };
  t(`${sistema}: Massivo e uma fonte menor ficam no Massivo`,
    linhaDa(sistema, grande, { escolhas: MASSIVO, funcionamentos: fb("1") }).rerrola, MARCA);
  t(`${sistema}: uma fonte maior vence, com o nome dela`,
    linhaDa(sistema, grande, { escolhas: MASSIVO, funcionamentos: fb("3") }).rerrola, { ate: 3, fonte: "Regra de Mesa" });
}

/* ============================================================ */
/* 4. A ROLAGEM                                                  */
/* ============================================================ */
const UM_D12 = [{ nome: "Ataque", dados: 3, faces: 12, fixo: 8, momento: "durante", multiplica: true }];

/* Caem 1, 7 e 2. O 1 rola de novo e dá 5. O 2 rola de novo e dá 1, que FICA:
   "ficando com o novo resultado", e o novo não rola uma terceira vez. */
{
  const r = rolarDano({ rotulo: "Espada Grande", grupos: UM_D12, rerrola: MARCA }, viciado(12, 1, 7, 2, 5, 1));
  t("os dados que ficam são os novos", r.dados, [5, 7, 1]);
  t("o total soma os novos e o fixo", r.total, 5 + 7 + 1 + 8);
  t("o registro guarda cada par", r.rerrolados, [{ indice: 0, de: 1, para: 5 }, { indice: 2, de: 2, para: 1 }]);
  t("e o nome de quem deu", r.rerrolaFonte, "Estilo Massivo");
  t("o fixo do registro continua fechando a conta", r.dados.reduce((s, n) => s + n, 0) + r.fixo, r.total);
}
{
  const r = rolarDano({ rotulo: "Espada Grande", grupos: UM_D12 }, viciado(12, 1, 7, 2));
  t("sem a marca, nada rola de novo", [r.dados, r.rerrolados, r.rerrolaFonte], [[1, 7, 2], [], null]);
}
{
  const r = rolarDano({ rotulo: "Espada Grande", grupos: UM_D12, rerrola: MARCA }, viciado(12, 3, 12, 4));
  t("sem 1 nem 2, nada rola de novo", [r.dados, r.rerrolados, r.rerrolaFonte], [[3, 12, 4], [], null]);
}

/* ⚠ TODOS OS DADOS DA LINHA (autor). O segundo grupo é um dado de outra fonte
   (o d6 da Postura do Sol, por exemplo), e o índice do par conta a lista
   inteira, não o grupo. */
{
  const grupos = [
    { nome: "Ataque", dados: 1, faces: 12, fixo: 0, momento: "durante", multiplica: true },
    { nome: "Outra Fonte", dados: 2, faces: 6, fixo: 0, momento: "durante", multiplica: true },
  ];
  let i = 0;
  const seq = [[12, 12], [2, 6], [4, 6], [6, 6]];
  const rng = () => { const [n, f] = seq[i++]; return (n - 0.5) / f; };
  const r = rolarDano({ rotulo: "Espada Grande", grupos, rerrola: MARCA }, rng);
  t("o dado de outra fonte rola de novo também", r.dados, [12, 6, 4]);
  t("com o índice da lista inteira", r.rerrolados, [{ indice: 1, de: 2, para: 6 }]);
}

/* No crítico os dados dobram ANTES, e cada um dos seis tem a sua chance. */
{
  const r = rolarDano(
    { rotulo: "Espada Grande", grupos: UM_D12, rerrola: MARCA, critico: true },
    viciado(12, 1, 2, 3, 4, 5, 6, 9, 10),
  );
  t("no crítico os seis dados podem rolar de novo", r.dados, [9, 10, 3, 4, 5, 6]);
  t("e o total usa os novos", r.total, 9 + 10 + 3 + 4 + 5 + 6 + 8);
}

/* De ponta a ponta: a linha que o derive monta, rolada como a aba Ações rola. */
for (const sistema of ["afty", "player"]) {
  const e = linhaDa(sistema, { ref: "arm_espada_grande" }, { escolhas: MASSIVO });
  const faces = e.gruposDano[0].faces;
  const n = e.gruposDano.reduce((s, g) => s + g.dados, 0);
  const rng = viciado(faces, ...Array(n).fill(1), ...Array(n).fill(faces));
  const r = rolarDano({ rotulo: e.nome, grupos: e.gruposDano, rerrola: e.rerrola }, rng);
  t(`${sistema}: a linha da Espada Grande troca todo 1 pelo máximo`, r.dados, Array(n).fill(faces));
  t(`${sistema}: e diz quantos rolaram de novo`, r.rerrolados.length, n);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
