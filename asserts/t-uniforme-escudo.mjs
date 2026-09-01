/**
 * UNIFORMES E ESCUDOS: O QUE O LIVRO DO JOGADOR DIZ, E O QUE O AUTOR MUDOU
 * PARA A CRIATURA — 2026-08-31
 *
 * O autor mandou as duas seções do livro na íntegra, e delas saíram duas
 * divergências. A do uniforme está na seção 5; o resto do arquivo é a do escudo.
 *
 * ============================================================
 * A RD DO ESCUDO É GERAL NA CRIATURA E FÍSICA NO JOGADOR
 *
 * O livro escreve "RD FÍSICO" na tabela de grau do escudo e "contra dano físico"
 * no encantamento Reforçado. Em 2026-08-01 o autor mandou o contrário para a
 * criatura (*"RD Geral, exceto Alma"*), e na mesma decisão o encantamento
 * Isolante de escudo foi REMOVIDO, porque ele estende a RD do escudo a um tipo
 * elemental e a RD Geral já cobre todo tipo menos alma: ele não tinha o que
 * estender.
 *
 * Em 2026-08-31 o autor separou os dois sistemas: *"1 e 2 no Livro de Jogador é
 * RD Físico. 3. Volte o encantamento Isolante, somente para Jogador."*
 *
 * ⚠ O PEDIDO 3 É O QUE PROVA O ALCANCE DO 1 E DO 2. Pedir o Isolante de volta só
 * faz sentido se a RD do escudo no jogador NÃO for Geral, e isso inclui a RD
 * BASE (a coluna 2/2/4/6), que o autor não citou nominalmente: se ela fosse
 * Geral, o Isolante continuaria sem função lá. As três parcelas andam juntas.
 *
 * O que este arquivo prende:
 *   1. as três parcelas caem na pilha certa, em cada sistema,
 *   2. e SÓ numa delas: nada de um escudo somar nos dois,
 *   3. o Isolante existe de um lado e não do outro,
 *   4. e o hover fecha a conta na pilha que recebeu.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");
const { rolarTeste } = await import(R + "ficha/ficha-rolagem.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Escudo Pesado: RD base 6. Grau Especial: +5, dando 11. Reforçado: +2.
   ⚠ O TOTAL COM O REFORÇADO DIFERE POR SISTEMA desde 2026-09-01. Na criatura o
   encantamento comprado desce um grau de cálculo (o Especial vira Primeiro,
   RD 4), e a conta é 6 + 4 + 2 = 12. No jogador não desce nada, e a conta é
   6 + 5 + 2 = 13. Ver a divergência `reducaoDeGrau`. */
const ficha = (sistema, { grau = null, reforcado = false } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.equipamentos = {
    itens: [{
      uid: "e1", refId: "esc_pesado", tipo: "escudo", qtd: 1, equipado: true,
      ...(grau ? { fa: { grau, encantamentos: reforcado ? ["enc_esc_reforcado"] : [] } } : {}),
    }],
  };
  return deriveAfty(f);
};
/* A mesma ficha SEM escudo, para medir só o que o escudo acrescenta. A base da
   RD Geral por Tipo existe na criatura e não no jogador (divergência `rdBase`),
   então comparar valores absolutos entre os dois não diria nada. */
const semEscudo = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  return deriveAfty(f);
};

/* ============================================================ */
/* 1. AS TRÊS PARCELAS, UMA A UMA, NOS DOIS SISTEMAS             */
/* ============================================================ */
const CASOS = [
  ["a RD base do escudo", {}, 6],
  ["mais o grau da Ferramenta", { grau: "especial" }, 11],
  ["mais o Reforçado", { grau: "especial", reforcado: true }, { afty: 12, player: 13 }],
];
const esperadoDe = (e, sis) => (typeof e === "object" ? e[sis] : e);
for (const [nome, op, esperado] of CASOS) {
  const base = semEscudo("afty");
  const d = ficha("afty", op);
  t(`criatura: ${nome} soma na RD Geral`, d.rdGeral - base.rdGeral, esperadoDe(esperado, "afty"));
  t(`criatura: ${nome} NÃO soma na Física`, d.rdFisico - base.rdFisico, 0);

  const baseP = semEscudo("player");
  const p = ficha("player", op);
  t(`jogador: ${nome} soma na RD Física`, p.rdFisico - baseP.rdFisico, esperadoDe(esperado, "player"));
  t(`jogador: ${nome} NÃO soma na Geral`, p.rdGeral - baseP.rdGeral, 0);
}

/* ⚠ E NUNCA NAS DUAS. Uma parcela que caísse nas duas pilhas dobraria a RD do
   escudo sem sintoma nenhum: os dois números continuariam "plausíveis". */
for (const sis of ["afty", "player"]) {
  const base = semEscudo(sis);
  const d = ficha(sis, { grau: "especial", reforcado: true });
  t(`${sis}: o escudo entra numa pilha só`,
    (d.rdGeral - base.rdGeral) + (d.rdFisico - base.rdFisico), sis === "afty" ? 12 : 13);
}

/* ⚠ A REDUÇÃO DE GRAU POR ENCANTAMENTO NÃO EXISTE NO JOGADOR (autor,
   2026-09-01: *"Jogador não perde Bônus Numérico ou qualquer bônus por pegar
   Encantamentos"*). Ela se mordia lá: a tabela de grau do livro do jogador
   CONCEDE encantamentos, e cobrar o grau por usar o que o grau deu tirava com
   uma mão o que a outra entregou. Um Escudo Pesado de Primeiro Grau, que o livro
   diz dar RD 4 e três encantamentos, ficava com RD 1 ao usar os três. */
const comEncs = (sistema, n) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.equipamentos = {
    itens: [{
      uid: "e1", refId: "esc_pesado", tipo: "escudo", qtd: 1, equipado: true,
      fa: { grau: "primeiro", encantamentos: ["enc_esc_bloqueador", "enc_esc_espinhoso", "enc_esc_intangivel"].slice(0, n) },
    }],
  };
  const d = deriveAfty(f);
  const b = semEscudo(sistema);
  return (d.rdGeral - b.rdGeral) + (d.rdFisico - b.rdFisico);
};
t("jogador: os tres encantamentos do Primeiro Grau nao cobram nada",
  [0, 1, 2, 3].map((n) => comEncs("player", n)), [10, 10, 10, 10]);
t("criatura: e cada um cobra um degrau",
  [0, 1, 2, 3].map((n) => comEncs("afty", n)), [10, 9, 8, 7]);

/* ============================================================ */
/* 2. O ISOLANTE VOLTOU, E SÓ NO JOGADOR                         */
/* ============================================================ */
const listaDe = (sis) => EQ.encantamentosDe("escudo", sis).map((e) => e.id);
t("a criatura não oferece o Isolante de escudo", listaDe("afty").includes("enc_esc_isolante"), false);
t("o jogador oferece", listaDe("player").includes("enc_esc_isolante"), true);
t("e é a ÚNICA diferença entre as duas listas",
  listaDe("player").filter((id) => !listaDe("afty").includes(id)), ["enc_esc_isolante"]);
t("nenhum encantamento some do jogador",
  listaDe("afty").filter((id) => !listaDe("player").includes(id)), []);

/* O texto é o do livro, e ele é a razão de o encantamento ser do jogador: a RD
   Geral da criatura já cobre todo tipo menos alma, e não sobra o que estender. */
t("o texto do Isolante é o do livro",
  EQ.getEncantamento("enc_esc_isolante").descricao,
  "A redução de dano do escudo passa também a ser aplicado a um tipo de dano elemental à sua escolha. Esta propriedade pode ser pega diversas vezes para tipos de dano diferentes.");

/* ⚠ SEM `efeitos`, e é o estado consistente. Não existe canal de RD por TIPO de
   dano no motor, e os dois irmãos dele no uniforme estão na mesma situação. Se
   alguém ligar um dos três, tem de ligar os outros dois: este assert avisa. */
const SEM_CANAL_POR_TIPO = ["enc_esc_isolante", "enc_unif_isolante", "enc_unif_resiliente"];
t("os três que precisam de RD por tipo seguem sem efeito",
  SEM_CANAL_POR_TIPO.filter((id) => EQ.getEncantamento(id)?.efeitos), []);

/* ============================================================ */
/* 3. O CANAL, E O ENCANTAMENTO QUE O SEGUE                      */
/* ============================================================ */
t("o canal do escudo por sistema",
  ["afty", "player"].map((s) => EQ.canalRdEscudo(s)), ["rdGeral", "rdFisico"]);

/* ⚠ O Reforçado declara o PSEUDO-CANAL `rdEscudo`, e não um canal do motor.
   Escrever `rdGeral` nele fazia o encantamento decidir uma coisa que é do
   sistema, e o texto do livro ("contra dano físico") ficava contradizendo o
   catálogo em silêncio. */
t("o Reforçado usa o pseudo-canal, e não um canal do motor",
  EQ.getEncantamento("enc_esc_reforcado").efeitos.map((e) => e.canal), ["rdEscudo"]);

/* ============================================================ */
/* 4. O HOVER FECHA A CONTA NA PILHA QUE RECEBEU                 */
/* ============================================================ */
/* Número certo com detalhamento errado é bug (a regra do `defesaAtributo`). */
const soma = (partes) => (partes || []).reduce((s, x) => s + (Number(x.valor) || 0), 0);
for (const [sis, campo] of [["afty", "rdGeral"], ["player", "rdFisico"]]) {
  const d = ficha(sis, { grau: "especial", reforcado: true });
  t(`${sis}: as parcelas de ${campo} somam o valor`, soma(d.partes[campo]), d[campo]);
  t(`${sis}: e nenhuma parcela sem nome`, (d.partes[campo] || []).every((x) => !!x.label), true);
  t(`${sis}: o Reforçado aparece nomeado`,
    (d.partes[campo] || []).some((x) => /Reforçado/.test(x.label)), true);
}
/* A pilha que NÃO recebeu não ganha linha nenhuma do escudo. */
t("jogador: a RD Geral não lista equipamento",
  (ficha("player", { grau: "especial", reforcado: true }).partes.rdGeral || [])
    .some((x) => x.label === "Equipamento"), false);

/* ============================================================ */
/* 5. O UNIFORME: A COLUNA DO LIVRO, E O GRAU QUE NÃO SOMA       */
/* ============================================================ */
/* Autor, 2026-08-31: *"você não modificou os Uniformes. Ainda está fornecendo +3
   de Defesa o Robusto."* São duas coisas numa: o Bônus na Defesa é o da TABELA
   (e não o custo da modificação) e o GRAU não acrescenta Defesa nenhuma.

   ⚠ A segunda metade não está escrita em lugar nenhum do texto, ela se lê pela
   AUSÊNCIA: a tabela de grau do livro para UNIFORMES tem uma coluna só, "Recebe
   um Encantamento", enquanto a de escudos tem "RD FÍSICO" e a de armas tem
   "Bônus de Arma". Ligar só a coluna daria um Robusto de Segundo Grau com
   6 + 3 = 9, e o livro dá 6. */
const comUniforme = (sistema, refId, grau = null) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.equipamentos = refId ? {
    itens: [{
      uid: "u1", refId, tipo: "uniforme", qtd: 1, equipado: true,
      ...(grau ? { fa: { grau, encantamentos: [] } } : {}),
    }],
  } : { itens: [] };
  return deriveAfty(f);
};
const defesaDe = (sistema, refId, grau = null) =>
  comUniforme(sistema, refId, grau).defesa - comUniforme(sistema, null).defesa;

/* A tabela do livro, linha a linha. */
const TABELA = [
  ["unif_comum", 0, 0],
  ["unif_revestimento_leve", 2, 1],
  ["unif_revestimento_medio", 4, 2],
  ["unif_revestimento_robusto", 6, 3],
  /* ⚠ Sob Medida é a exceção declarada do lado da criatura (autor, 2026-08-01):
     custa 2 e dá 1, "já que ela já dá benefícios em Perícia". O valor bate com a
     coluna do livro por acidente, e os dois caminhos são diferentes. */
  ["unif_sob_medida", 1, 1],
];
for (const [id, doLivro, daCriatura] of TABELA) {
  const nome = EQ.UNIFORME_MODIFICACOES.find((m) => m.id === id).nome;
  t(`jogador: ${nome} dá o Bônus na Defesa do livro`, defesaDe("player", id), doLivro);
  t(`criatura: ${nome} segue no custo`, defesaDe("afty", id), daCriatura);
  /* O grau some do lado do jogador e continua somando do lado da criatura. */
  t(`jogador: ${nome} não ganha Defesa por grau`, defesaDe("player", id, "segundo"), doLivro);
  t(`criatura: ${nome} ganha 3 no Segundo Grau`, defesaDe("afty", id, "segundo"), daCriatura + 3);
}

/* E o catálogo continua sendo o livro: a coluna `defesa` é o texto, e mexer nela
   por acidente passaria a mentir nos dois sistemas de uma vez. */
t("a coluna `defesa` do catálogo é a tabela do livro",
  EQ.UNIFORME_MODIFICACOES.map((m) => [m.id, m.defesa]),
  TABELA.map(([id, doLivro]) => [id, doLivro]));

/* ============================================================ */
/* 6. O QUE NÃO MUDOU                                            */
/* ============================================================ */
/* `rdEscudoBase` é a parcela que o Especialista em Escudo (Combatente 4°) lê, e
   ela é a mesma nos dois: o que muda é onde ela DESEMBOCA, não quanto vale. */
t("a parcela base do escudo é a mesma nos dois",
  ["afty", "player"].map((s) => ficha(s, { grau: "especial" }).equip.rdEscudoBase), [6, 6]);
/* E a penalidade não tem nada com isso. */
t("a penalidade do escudo também",
  ["afty", "player"].map((s) => ficha(s).equip.penalidadeDestreza), [-4, -4]);

/* ============================================================ */
/* 7. O GRAU DA ARMA NÃO DÁ NADA NO JOGADOR                      */
/* ============================================================ */
/* Autor, 2026-08-31 (sessão do dano): *"Grau da Arma não fornece +Acerto ou
   +Dano para Jogador. Só fornece os Bônus de Encantamentos."* Fica aqui ao lado
   das outras duas porque a pergunta é a mesma: o que o GRAU entrega, e em qual
   sistema. */
const comArma = (sistema, grau) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 14, destreza: 14, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.equipamentos = {
    itens: [{
      uid: "a", refId: "arm_espada_longa", tipo: "arma", qtd: 1, equipado: true,
      ...(grau ? { fa: { grau, encantamentos: [] } } : {}),
    }],
  };
  const d = deriveAfty(f);
  const linha = (d.dano?.entradas ?? []).find((e) => /Espada Longa/.test(e.nome));
  return { texto: linha?.texto, acerto: linha?.acerto, fixo: linha?.fixo, dado: linha?.dado };
};
const GRAUS = ["quarto", "terceiro", "segundo", "primeiro", "especial"];
/* ⚠ O JOGADOR GANHA DANO FIXO PELO GRAU desde 2026-09-01, e é escada própria: o
   RANK, de 1 a 5, e não a tabela da criatura (4, 8, 12, 16, 20). O ACERTO segue
   em zero, e essa metade não mudou. Ver `danoFixoPorGrau`. */
t("jogador: o dano fixo sobe de um em um com o grau",
  GRAUS.map((g) => comArma("player", g).fixo - comArma("player", null).fixo), [1, 2, 3, 4, 5]);
t("jogador: e o DADO nao muda",
  [...new Set(GRAUS.map((g) => comArma("player", g).dado))].length, 1);
t("jogador: nem o acerto",
  [...new Set(GRAUS.map((g) => comArma("player", g).acerto))].length, 1);
/* Na criatura os cinco graus dão cinco números diferentes, nas duas colunas. */
t("criatura: cada grau muda o dano",
  [...new Set(GRAUS.map((g) => comArma("afty", g).texto))].length, 5);
t("criatura: e o acerto",
  [...new Set(GRAUS.map((g) => comArma("afty", g).acerto))].length, 5);

/* ============================================================ */
/* 8. DADO NOMEADO É DADO, E NÃO A MÉDIA DELE                    */
/* ============================================================ */
/* Autor, 2026-08-31: *"Execução Silenciosa está aparecendo como +6 ao invés de
   1d6."* O texto é "adicionando 1d6 de dano. A cada +2 no Modificador de
   Sabedoria, o dano aumenta em +1d6", e o canal `dadosNomeados` guarda o dado
   com o tamanho escrito na regra em vez da média dele.

   ⚠ NÃO É DIVERGÊNCIA. Um d6 é um d6 em qualquer Patamar, então a correção vale
   igual nos dois sistemas. O que não podia era virar dado da LINHA, que muda de
   tamanho com o Patamar: esse é o outro canal, o `dadosDano`. */
const comArte = (sistema, sab, ligada) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 14, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: sab, presenca: 12 };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.habilidades = ["cmb_artes_do_combate"];
  f.equipamentos = { itens: [{ uid: "a", refId: "arm_espada_longa", tipo: "arma", qtd: 1, equipado: true }] };
  f.combate = { ativo: true, arteExecucaoSilenciosa: !!ligada };
  const d = deriveAfty(f);
  return (d.dano?.entradas ?? []).find((e) => /Espada Longa/.test(e.nome));
};
for (const sistema of ["afty", "player"]) {
  const base = comArte(sistema, 10, false).texto;
  t(`${sistema}: desligada nao acrescenta nada`, comArte(sistema, 18, false).texto, base);
  t(`${sistema}: com SAB 10 (mod 0) e 1d6`, comArte(sistema, 10, true).texto, `${base} + 1d6`);
  t(`${sistema}: com SAB 14 (mod +2) e 2d6`, comArte(sistema, 14, true).texto, `${base} + 2d6`);
  t(`${sistema}: com SAB 18 (mod +4) e 3d6`, comArte(sistema, 18, true).texto, `${base} + 3d6`);
  /* ⚠ E ELE DOBRA NO CRÍTICO. Enquanto era média, virava dano FIXO e não
     dobrava: "Só os Dados, o fixo não dobra" (autor). Trocar o canal conserta a
     rolagem E o crítico, e o segundo não teria sintoma nenhum sozinho. */
  t(`${sistema}: e dobra no critico`,
    /4d6/.test(comArte(sistema, 14, true).formulaCritico), true);
  /* O grupo sai NOMEADO pela habilidade, e não vira uma linha anônima. */
  const grupo = (comArte(sistema, 14, true).gruposDano ?? []).find((g) => g.faces === 6);
  t(`${sistema}: o grupo sai nomeado`, [grupo?.nome, grupo?.dados], ["Artes do Combate", 2]);
}

/* ============================================================ */
/* 9. AS OUTRAS CINCO VIRARAM DADO JUNTO                         */
/* ============================================================ */
/* Autor, 2026-09-01: *"pode trocá-las junto. E deixar como Dado."* Quatro somam
   numa linha de dano e a quinta soma num Teste de Resistência, que precisou de
   canal próprio (`dadosTR`) e de um TR capaz de carregar rolagem. */
const comHab = (op) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: op.nivel, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 14, destreza: 14, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12, ...(op.attrs ?? {}) };
  f.especializacoes = [{ id: op.classe, nivel: op.nivel }];
  if (op.classe === "restringido") f.core.origem = { id: "restringido" };
  f.habilidades = op.habs;
  f.equipamentos = { itens: [{ uid: "a", refId: "arm_espada_longa", tipo: "arma", qtd: 1, equipado: true }] };
  f.combate = { ativo: true, ...(op.combate ?? {}) };
  return deriveAfty(f);
};
const danoDe = (op) => ((comHab(op).dano?.entradas ?? []).find((e) => /Espada Longa/.test(e.nome)) ?? {}).texto;

for (const [nome, op, dado] of [
  ["Ataque Furtivo no nivel 1", { classe: "restringido", nivel: 1, habs: ["res_ataque_furtivo"], combate: { ataqueFurtivo: true } }, "1d8"],
  ["Ataque Furtivo no nivel 15", { classe: "restringido", nivel: 15, habs: ["res_ataque_furtivo"], combate: { ataqueFurtivo: true } }, "6d8"],
  ["Golpe Impactante com FOR 18", { classe: "restringido", nivel: 10, habs: ["res_golpe_impactante"], combate: { golpeImpactante: true }, attrs: { forca: 18 } }, "2d6"],
  /* ⚠ O FOCO NO INIMIGO SUBSTITUI o dado a cada degrau, e não soma: são quatro
     linhas mutuamente exclusivas no catálogo. Se duas acendessem juntas, a
     linha mostraria "1d6 + 1d8" e ninguém veria diferença de um "+7". */
  ["Foco no Inimigo no nivel 1", { classe: "restringido", nivel: 1, habs: ["res_foco_no_inimigo"], combate: { focoInimigo: true } }, "1d6"],
  ["Foco no Inimigo no nivel 16", { classe: "restringido", nivel: 16, habs: ["res_foco_no_inimigo"], combate: { focoInimigo: true } }, "1d12"],
  ["Quebra Cranio", { classe: "lutador", nivel: 10, habs: ["lut_manobras_finalizadoras"], combate: { empolgacao: 5, manobraFinalizadora: "cranio" } }, "2d10"],
]) {
  const desligada = danoDe({ ...op, combate: { ativo: true } });
  t(`${nome} vira ${dado}`, danoDe(op), `${desligada} + ${dado}`);
}
/* Um degrau por vez: o Foco no Inimigo nunca acende dois dados. */
t("o Foco no Inimigo nunca soma dois dados",
  [1, 6, 12, 16].map((n) => (danoDe({ classe: "restringido", nivel: n, habs: ["res_foco_no_inimigo"], combate: { focoInimigo: true } }).match(/d/g) || []).length),
  [2, 2, 2, 2]);

/* A quinta: TR com dado. O bônus fixo segue sendo o bônus, e o dado viaja ao
   lado — quem mostra junta os dois num texto e quem rola soma as duas coisas. */
const trDe = (ligado) => comHab({
  classe: "restringido", nivel: 10, habs: ["res_resiliencia_pela_adrenalina"],
  combate: ligado ? { surtoAdrenalina: true } : {},
}).testes.resistencias[0];
t("desligado o TR nao tem dado", [trDe(false).dadosExtras, trDe(false).textoBonus], [[], null]);
t("ligado ele ganha 2d3", trDe(true).dadosExtras, [{ faces: 3, qtd: 2 }]);
t("e o bonus fixo NAO muda", trDe(true).bonus, trDe(false).bonus);
t("o texto mostra os dois", trDe(true).textoBonus, `+${trDe(false).bonus} + 2d3`);
/* ⚠ E O ROLADOR SOMA. Mostrar o dado e não rolá-lo seria o mesmo silêncio de
   antes por outro caminho. */
const rolagem = rolarTeste(
  { rotulo: "TR", bonus: trDe(true).bonus, dados: trDe(true).dadosExtras },
  () => 0.99,
);
t("a rolagem soma os dados extras", rolagem.total, 20 + trDe(true).bonus + 6);
t("e escreve a formula inteira", rolagem.formula, `d20+${trDe(true).bonus} + 2d3`);
/* Sem dados o rolador segue exatamente como era. */
t("sem dados a formula fica limpa",
  rolarTeste({ rotulo: "TR", bonus: 5 }, () => 0.5).formula, "d20+5");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
