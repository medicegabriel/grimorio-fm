/**
 * ============================================================
 * NOVO ESTILO DA SOMBRA — exclusivo do Sem Técnica
 * ============================================================
 * O trunfo de quem não tem técnica amaldiçoada. Destrava no ND 4, junto da
 * aptidão Domínio Simples, e se expressa por TÉCNICAS DE ESTILO. Ocupa na aba
 * Habilidades o lugar que os Feitiços ocupam nas outras origens.
 *
 * ⚠ Ao contrário dos Feitiços, a Técnica de Estilo NÃO tem nível: ela escala
 * pelo Nível de Aptidão em Domínio do usuário. Por isso não há aqui nada
 * parecido com `nivelMaxFeitico` nem tabela por nível.
 *
 * ------------------------------------------------------------
 * ⚠ MODELO REFEITO EM 2026-08-10 (autor). O anterior estava invertido.
 * ------------------------------------------------------------
 * O modelo velho tratava "Modificação do Domínio Simples" como um RECIPIENTE:
 * uma linha da ficha que custava 1 do contador e carregava dentro dela até
 * `dom` efeitos da tabela. Isso errava as duas pontas: Aumento de Defesa mais
 * Bônus de Acerto na mesma Modificação custavam 1 só, e criar uma segunda
 * Modificação dava um orçamento de `dom` efeitos novo e inteiro.
 *
 * O modelo certo separa DUAS coisas que eram uma só:
 *
 *   CONHECER — cada efeito É uma Técnica de Estilo e custa 1 do contador por
 *              si. Autor: *"O Contador é por Técnica de Estilo. Logo, 'Aumento
 *              de Defesa' contaria como 1. 'Aumento de Acerto' contaria como
 *              outro."* Conhecer a mesma duas vezes não existe.
 *   IMBUIR   — o Nível de Aptidão em Domínio é a quantidade de VAGAS DE
 *              IMBUIÇÃO no Domínio Simples, e a mesma Técnica pode ocupar
 *              várias. Autor: *"se eu tiver 5 Níveis de Domínio e só tiver uma
 *              Técnica de Estilo 'Aumento de Acerto', eu poderia imbuir ele 5x
 *              no meu Domínio Simples. É sobre ter várias Técnicas de Estilo, e
 *              sair imbuindo elas fazendo combinações em meio ao combate."*
 *
 * ⚠ A imbuição é decisão de MESA, e não de ficha (autor, 2026-08-10). Por isso
 * ela mora no estado de combate (`creature.combate`), que é a bancada de
 * Simulação no criador e a SESSÃO na Ficha Final, trocável a qualquer momento.
 * Mesmo desenho da Liberação Máxima, que é modo de saída declarado na hora.
 *
 * Cada Técnica conhecida vira uma FAIXA nos `estadosExtras`, mais um único
 * interruptor `estilo_ativo` que representa o Estilo no ar. A quantidade imbuída
 * entra na expressão como VARIÁVEL do DSL, então o valor acompanha a mesa sem o
 * motor recalcular linha nenhuma. As faixas declaram `requerEstado` no
 * interruptor, e é isso que a UI usa para desenhá-las DENTRO dele.
 *
 * DOIS TIPOS de Técnica de Estilo:
 *
 *   tabela   — uma das 4 do livro (TECNICAS_TABELA). Nome, texto e efeito são
 *              do catálogo, e o jogador só decide se tem ou não.
 *   especial — Técnica de Estilo Especial: nome, texto livre e o Motor de
 *              Automação completo, no mesmo desenho do Funcionamento Básico e
 *              do Feitiço Passivo. É onde entram as Aptidões Amaldiçoadas
 *              incorporadas e os efeitos únicos (a Lua Nebulosa do livro).
 *
 * ⚠ O "Efeito Especial" SAIU da tabela em 2026-08-10 (autor): ele e a Técnica
 * de Estilo Especial eram a mesma coisa escrita duas vezes. O texto do livro
 * dele virou o `title` do botão que cria uma Especial, e está preservado na
 * constante TEXTO_EFEITO_ESPECIAL abaixo.
 *
 * ⚠ A Especial também precisa de vaga de imbuição para valer (autor). Com isso
 * o `modo: "ativa"` por linha do Motor MORREU: nada do Estilo fica no ar sem o
 * Domínio Simples, então não sobrou linha passiva para distinguir.
 *
 * ------------------------------------------------------------
 * ORÇAMENTO (autor, 2026-08-07)
 * ------------------------------------------------------------
 * "Consome o Contador de Habilidades. E Talentos e coisas do gênero que
 *  aumentam isso, fazem que nem Afinidade com Técnica com Feitiços, e só
 *  aumentam o contador de habilidades para Estilos."
 *
 * Ou seja: a Técnica de Estilo é um FEITIÇO para efeito de orçamento. Gasta o
 * contador único da aba (2×Maestria + patamar, dividido com as Habilidades
 * Gerais) e consome PRIMEIRO as vagas exclusivas do canal `vagasFeitico`,
 * exatamente como o Feitiço faz. Ver [[afty-vagas-feitico]].
 *
 * ⚠ Consequência assumida: a progressão por ND do livro ("duas no 4°, mais uma
 * nos níveis 7, 10, 13, 16, 19 e a cada 3 depois") NÃO é implementada como
 * orçamento. Ela teve o mesmo destino que a progressão por ND dos Feitiços, que
 * o contador único substituiu em 2026-07-27. O que sobra do texto é o ND 4 como
 * PORTA DE ENTRADA: abaixo dele o Sem Técnica não tem Estilo nenhum.
 *
 * ------------------------------------------------------------
 * POOL EXCLUSIVO (autor, 2026-08-07)
 * ------------------------------------------------------------
 * O Estilo da Sombra é a sexta fonte do pool que não acumula (a família
 * `estiloSombra` em afty-efeitos.js). Ele é o Feitiço Auxiliar do Sem Técnica:
 * sem isso, seria a única origem cujo bônus escrito à mão soma por cima de
 * tudo. Vale para os dois tipos, inclusive os efeitos de tabela.
 *
 * ⚠ Cada Técnica de tabela escreve UMA linha só, com a quantidade imbuída
 * dentro da expressão. N linhas iguais cairiam na mesma chave do pool e só a
 * maior valeria, comendo as imbuições que o jogador pagou.
 *
 * ------------------------------------------------------------
 * ⚠ 2026-10-04: A EXPANSÃO VIROU A REGRA (autor, DA-02 e DA-03)
 * ------------------------------------------------------------
 * Tudo acima descreve agora a regra `legacy`: a de toda Técnica gravada antes
 * desta data e de toda Técnica de Addon que não declare outra. Ela continua
 * calculando como sempre (DA-05, DA-06), e nada é convertido sozinho.
 *
 * A regra `expansao` volta ao PACOTE: a Técnica é uma entidade própria
 * (Modificação do Domínio Simples ou Técnica de Estilo Especial) com os efeitos
 * dentro dela, e as Técnicas têm progressão própria (2 no Nível 4, +1 em 7, 10,
 * 13, 16 e 19), que não gasta o contador de Habilidades. Catálogo em
 * `afty-estilo-sombras-catalogo.js`, guia em `docs/afty-estilo-sombras.md`.
 *
 * As duas regras convivem na mesma lista `creature.estilosSombra`, separadas
 * pelo campo `regra`: `estilosDaFicha` lê só as `legacy`, e `tecnicasDaFicha`
 * só as `expansao`. Quem regrava a lista precisa juntar as duas.
 * ============================================================
 */

import {
  REGRA_EXPANSAO, regraDaTecnica, TIPO_ESPECIAL, TIPO_MODIFICACAO,
  getEfeitoEstilo, chaveDaCompra, ESCOLHA_ATAQUE, ESCOLHA_TR, tecnicasDaProgressao,
  EFEITOS_ESTILO, getModificacaoAptidao, CATEGORIA_PROIBIDA_NO_ESTILO, MODIFICACOES_APTIDAO,
  bonusDoPrerequisito, DIFICULDADES_PREREQ, ALVO_CONTRA_ATAQUE, alvoDoCritico, degrauDoContraAtaque,
  CRITICO_MODS,
} from "./afty-estilo-sombras-catalogo";
import { normalizarVariavel } from "./afty-dsl";

/** O Novo Estilo da Sombra destrava no 4° nível, junto do Domínio Simples. */
export const ESTILO_ND_MINIMO = 4;

/** A origem que tem o Estilo. Uma só, e é o que a aba Habilidades consulta. */
export const ESTILO_ORIGEM = "sem_tecnica";

/**
 * O interruptor do Estilo no ar. Um por ficha, e não um por Técnica: o que liga
 * e desliga é a expansão, e as Técnicas imbuídas vão junto.
 *
 * ⚠ Pela REGRA quem está no ar é o Domínio Simples ("enquanto ele estiver
 * ativo", no texto de cada efeito). O rótulo diz **Novo Estilo das Sombras** por
 * decisão do autor (2026-08-10): na Ficha Final, uma linha solta chamada
 * "Domínio Simples" lia como aptidão avulsa, sem laço com as Técnicas logo
 * abaixo dela.
 */
export const ESTADO_ESTILO_ATIVO = "estilo_ativo";

/** O rótulo do interruptor, na boca do autor. */
export const ESTILO_LABEL = "Novo Estilo das Sombras";

/**
 * A Técnica da Expansão imbuída AGORA (DA-04: uma por vez, trocada à mão no
 * começo do turno). Estado `opcao` nos `estadosExtras`, dentro do interruptor
 * do Domínio. Na DSL cada Técnica vira `estilo_tecnica_<id>`, e é essa variável
 * que liga os efeitos dela. Vazio é Domínio no ar sem Técnica, que vale.
 */
export const ESTADO_TECNICA_ATIVA = "estilo_tecnica";
export const varDaTecnicaAtiva = (id) => `${ESTADO_TECNICA_ATIVA}_${normalizarVariavel(id)}`;

/**
 * A faixa de imbuição de uma Técnica. O id vira variável do DSL pelo
 * `varDoEstado` de afty-combate.js, que só troca maiúscula por underscore, e
 * por isso a chave já sai em minúsculas daqui.
 */
export const estadoDaTecnica = (id) =>
  `estilo_${String(id).replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`;

/**
 * Texto VERBATIM do "Efeito Especial", que era a 5ª linha da tabela até
 * 2026-08-10. Vira o `title` do botão que cria uma Técnica de Estilo Especial:
 * é explicação de ITEM, que a regra de UI manda para o `title`.
 */
export const TEXTO_EFEITO_ESPECIAL =
  "O Domínio Simples possui um efeito único, desenvolvido pelo Jogador e aprovado pelo " +
  "Narrador. Exemplos seriam: possuir alcance para ataques corpo a corpo igual a área do " +
  "Domínio Simples ou poder manipular o tamanho do seu Domínio Simples.";

/* ============================================================ */
/* AS TÉCNICAS DE ESTILO DE TABELA                              */
/* ============================================================ */
/* Texto VERBATIM do livro. Campos:
     max        -> quantas imbuições cabem. `null` = sem teto declarado, e aí
                   quem limita é a quantidade de vagas do Domínio Simples.
     canal      -> o que ela escreve no Motor. `null` = procedimento de mesa.
     expr(v)    -> a expressão da DSL, onde `v` é o NOME DA VARIÁVEL que guarda
                   quantas vezes a Técnica está imbuída.
     notaVezes  -> o que a imbuição repetida faz, quando não é somar o valor. */

export const TECNICAS_TABELA = [
  {
    id: "gatilho",
    nome: "Ataque com Gatilho",
    max: null,
    canal: null,
    descricao:
      "O Domínio Simples pode realizar um ataque por rodada como Ação Livre, ao atender um " +
      "gatilho específico, como uma criatura inimigo adentrar na área do seu Domínio Simples. " +
      "Este efeito pode ser colocado mais de uma vez, aumentando a quantidade de ataques.",
    // Ataque extra por rodada não é stat de ficha: não existe canal para
    // "quantos ataques você faz". Fica no texto, e a quantidade aparece na UI.
    notaVezes: "ataques por rodada",
  },
  {
    id: "defesa",
    nome: "Aumento de Defesa",
    // "pode ser colocado mais uma vez": duas imbuições no total.
    max: 2,
    canal: "defesa",
    expr: () => "piso(maestria / 2)",
    descricao:
      "O usuário do Domínio Simples recebe um aumento em sua Defesa igual a metade do seu Bônus " +
      "de Treinamento, enquanto ele estiver ativo. Este efeito pode ser colocado mais uma vez, " +
      "passando a conceder o Aumento de Defesa também para aliados dentro do Domínio Simples.",
    // ⚠ A segunda imbuição NÃO aumenta a Defesa de quem usa: ela estende o
    // mesmo bônus aos aliados, e efeito no OUTRO não tem canal (a ficha só
    // conhece a si mesma). Por isso a expressão ignora a variável.
    notaVezes: "a 2ª estende aos aliados, sem somar na sua Defesa",
  },
  {
    id: "acerto",
    nome: "Bônus de Acerto",
    max: null,
    canal: "bonusAcerto",
    // Cada imbuição soma outra metade da Maestria (autor, 2026-08-07). O livro
    // só diz "aumentando o bônus", sem número, e o irmão dele (Dano Adicional)
    // repete o próprio valor base.
    expr: (v) => `piso(maestria / 2) * ${v}`,
    descricao:
      "O usuário do Domínio Simples recebe um bônus igual a metade do seu Bônus de Treinamento " +
      "em jogadas de ataque que realizar enquanto o Domínio Simples estiver ativo. Este efeito " +
      "pode ser colocado mais vezes, aumentando o bônus.",
  },
  {
    id: "dano",
    nome: "Dano Adicional",
    max: null,
    canal: "nivelDano",
    expr: (v) => `2 * ${v}`,
    descricao:
      "Os ataques do usuário do Domínio Simples tem seu dano aumentado em 2 níveis enquanto ele " +
      "estiver ativo. Este dano é considerado Durante Ataque e o efeito pode ser colocado mais " +
      "de uma vez, aumentando +2 níveis para cada outra vez.",
  },
];

const TABELA_BY_ID = Object.fromEntries(TECNICAS_TABELA.map((e) => [e.id, e]));
export const getTecnicaTabela = (id) => TABELA_BY_ID[id] ?? null;

/* ============================================================ */
/* FICHA                                                         */
/* ============================================================ */
/* Uma Técnica de Estilo na ficha (`creature.estilosSombra`). Duas formas:

     { id, tipo: "tabela" }
       O `id` É o id da linha de TECNICAS_TABELA, e por isso conhecer a mesma
       duas vezes é impossível por construção. Nome e texto vêm do catálogo.

     { id, tipo: "especial", nome, descricao,
       efeitos: [{ canal, alvo?, expr, quando?, duracao? }] }
       O Motor livre, no mesmo formato do `core.tecnicaEfeitos`.

   ⚠ A IMBUIÇÃO NÃO MORA AQUI. Ela é estado de combate, em
   `creature.combate[estadoDaTecnica(id)]`. Ver o cabeçalho. */

let estiloSeq = 0;

export function createBlankEstiloEspecial() {
  estiloSeq += 1;
  return {
    id: `est_${Date.now().toString(36)}_${estiloSeq}`,
    tipo: "especial",
    nome: "",
    descricao: "",
    efeitos: [],
  };
}

const inteiro = (v, min, max) => {
  const n = Math.trunc(Number(v) || 0);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

/**
 * As Técnicas de Estilo que a ficha CONHECE, saneadas e sem repetição.
 *
 * ⚠ Converte o shape ANTIGO (a Modificação-recipiente, morta em 2026-08-10).
 * Uma `modificacao` gravada explode nas Técnicas que ela carregava: cada efeito
 * de tabela vira uma Técnica conhecida, e a parte de Motor livre dela (o antigo
 * "Efeito Especial") vira uma Técnica Especial com o nome e o texto da linha.
 * Sem isso, a ficha do autor abriria com o card vazio e o contador liberado, que
 * é perda calada. O que NÃO sobrevive é a quantidade de vezes de cada efeito:
 * ela virou imbuição, que é decisão de mesa e não de ficha.
 */
export function estilosDaFicha(creature) {
  const brutas = Array.isArray(creature?.estilosSombra) ? creature.estilosSombra : [];
  const daTabela = new Set();
  const especiais = [];
  const idsEspeciais = new Set();

  const guardaEspecial = (bruta, efeitos) => {
    const id = String(bruta?.id ?? "").trim();
    if (!id || idsEspeciais.has(id)) return;
    idsEspeciais.add(id);
    especiais.push({
      id,
      tipo: "especial",
      nome: String(bruta.nome ?? "").trim(),
      // ⚠ O cru, para o EDITOR (bug de 2026-08-12): um campo de texto alimentado
      // pelo nome aparado não aceita ESPAÇO, porque o caractere é gravado e a
      // releitura o remove antes do próximo chegar. Ver funcionamentosDaFicha.
      nomeCru: String(bruta.nome ?? ""),
      descricao: String(bruta.descricao ?? ""),
      // Especiais antigas ocupam uma vaga. O campo existe para regras que
      // declaram outro custo, sem obrigar a duplicar a Técnica na ficha.
      custoImbuicao: inteiro(bruta.custoImbuicao, 1, 99),
      maxImbuicoes: inteiro(bruta.maxImbuicoes, 1, 99),
      // ⚠ O `modo` de cada linha é descartado: ele morreu em 2026-08-10, quando
      // a Especial passou a exigir imbuição. Deixá-lo passar manteria um campo
      // morto viajando na ficha a cada edição, sem editor que o mostrasse.
      efeitos: (Array.isArray(efeitos) ? efeitos : [])
        .map(({ modo, ...resto }) => resto),  // eslint-disable-line no-unused-vars
    });
  };

  for (const b of brutas) {
    if (!b || typeof b !== "object") continue;
    const id = String(b.id ?? "").trim();
    if (!id) continue;
    // ⚠ A Técnica da Expansão NÃO passa por aqui: uma Modificação nova tem o
    // mesmo `tipo: "modificacao"` do recipiente antigo, e o caminho de baixo a
    // explodiria em Técnicas de tabela. Ela é lida por `tecnicasDaFicha`.
    if (regraDaTecnica(b) === REGRA_EXPANSAO) continue;

    if (b.tipo === "especial") {
      guardaEspecial(b, b.efeitos);
      continue;
    }
    if (b.tipo === "tabela" || (!b.tipo && TABELA_BY_ID[id])) {
      if (TABELA_BY_ID[id]) daTabela.add(id);
      continue;
    }
    // ---- shape ANTIGO: a Modificação-recipiente ----
    if (b.tipo === "modificacao") {
      for (const e of Array.isArray(b.efeitosModificacao) ? b.efeitosModificacao : []) {
        if (TABELA_BY_ID[e?.id]) daTabela.add(e.id);
      }
      const efeitos = Array.isArray(b.efeitos) ? b.efeitos : [];
      if (efeitos.length) guardaEspecial(b, efeitos);
    }
  }

  return [
    // Ordem do catálogo primeiro, para a lista não dançar conforme o jogador
    // marca e desmarca. As Especiais vêm depois, na ordem em que foram criadas.
    ...TECNICAS_TABELA.filter((t) => daTabela.has(t.id)).map((t) => ({ id: t.id, tipo: "tabela" })),
    ...especiais,
  ];
}

/* ============================================================ */
/* TÉCNICAS DA EXPANSÃO (regra `expansao`)                       */
/* ============================================================ */
/* Uma Técnica de Estilo da Expansão na ficha. Nenhum número é gravado: o
   resolvedor recalcula tudo com o BT, a Aptidão e o nível do dia.

     { id, regra: "expansao", tipo: "modificacao" | "especial", nome, descricao,
       gatilho: { borda, texto },
       efeitos:    [{ uid, efeitoId, escolha }],        // uma entrada por compra
       aptidoes:   [{ uid, aptidaoId, modId, escolha }], // referência + modificação
       requisitos: [{ uid, dificuldade, alvoUid, texto }],
       exaustao, especial: { texto, linhas, confirmacoes } | null,
       critico: { aumentarCD, alvoExtra, condicao }, contraAtaque: { quantidade } | null,
       usaReacao, legado }

   ⚠ A REPETIÇÃO É A CONTAGEM DE ENTRADAS IGUAIS, e não um número gravado: o
   validador precisa enxergar cada compra, e o Pré-Requisito aponta para uma
   delas pelo `uid`.

   ⚠ `legado` guarda a Técnica antiga inteira quando ela foi convertida à mão
   (DA-05: "preservar dados antigos"). Nada lê dali para calcular. */

let tecnicaSeq = 0;
const novoUid = (prefixo) => {
  tecnicaSeq += 1;
  return `${prefixo}_${Date.now().toString(36)}_${tecnicaSeq}`;
};

/** Uma Técnica da Expansão em branco, do tipo pedido. */
export function createBlankTecnicaEstilo(tipo = TIPO_MODIFICACAO) {
  return {
    id: novoUid("tec"),
    regra: REGRA_EXPANSAO,
    tipo: tipo === TIPO_ESPECIAL ? TIPO_ESPECIAL : TIPO_MODIFICACAO,
    nome: "",
    descricao: "",
    gatilho: { borda: true, texto: "" },
    efeitos: [],
    aptidoes: [],
    requisitos: [],
    exaustao: 0,
    especial: null,
    critico: { aumentarCD: false, alvoExtra: false, condicao: null },
    contraAtaque: null,
    usaReacao: false,
  };
}

/** Um `uid` novo para uma compra de efeito, modificação ou Pré-Requisito. */
export const novoUidEstilo = (prefixo = "ef") => novoUid(prefixo);

/**
 * "Converter para o novo sistema" (DA-05): botão manual, nunca automático.
 * Recebe a Técnica `legacy` NORMALIZADA (de `estilosDaFicha`) e devolve uma
 * Técnica da Expansão que preserva nome, descrição e os dados antigos inteiros
 * (`legado`). Só é mapeado o que é seguro:
 *   • a de tabela vira uma Modificação com AQUELE efeito, uma compra (o Bônus de
 *     Acerto volta pedindo a escolha, que o modelo antigo não tinha);
 *   • a Especial vira Técnica de Estilo Especial com as MESMAS linhas de Motor.
 * O resto (a quantidade imbuída, que era decisão de mesa) fica para a pessoa
 * montar de novo no formato de pacote.
 */
export function converterTecnicaLegacy(antiga) {
  const especial = antiga?.tipo === "especial";
  const base = createBlankTecnicaEstilo(especial ? TIPO_ESPECIAL : TIPO_MODIFICACAO);
  // A cópia guardada é só dado: o `def` do catálogo antigo carrega função.
  const { def, ...legado } = antiga ?? {}; // eslint-disable-line no-unused-vars
  if (especial) {
    return {
      ...base,
      nome: texto(antiga.nome),
      descricao: texto(antiga.descricao),
      especial: { texto: texto(antiga.descricao), linhas: lista(antiga.efeitos), confirmacoes: {} },
      legado,
    };
  }
  const ef = getEfeitoEstilo(antiga?.id);
  return {
    ...base,
    nome: ef?.nome ?? texto(antiga?.id),
    efeitos: ef ? [{ uid: novoUid("ef"), efeitoId: ef.id }] : [],
    legado,
  };
}

const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const texto = (v) => String(v ?? "");
const lista = (v) => (Array.isArray(v) ? v : []);

/**
 * Normaliza uma Técnica da Expansão gravada. Lixo some, campo ausente ganha o
 * valor neutro, e nenhum campo é inventado a partir do texto.
 */
export function normalizaTecnicaEstilo(b) {
  const id = texto(b?.id).trim();
  if (!id) return null;
  const comUid = (arr, campos) => lista(arr)
    .map((x) => objeto(x))
    .filter((x) => x && texto(x.uid).trim() && campos.every((c) => texto(x[c]).trim()));
  const esp = objeto(b.especial);
  const crit = objeto(b.critico) ?? {};
  const contra = inteiro(objeto(b.contraAtaque)?.quantidade, 0, 99);
  return {
    id,
    regra: REGRA_EXPANSAO,
    tipo: b.tipo === TIPO_ESPECIAL ? TIPO_ESPECIAL : TIPO_MODIFICACAO,
    nome: texto(b.nome).trim(),
    // O cru, para o campo de texto aceitar espaço (o mesmo bug de 2026-08-12).
    nomeCru: texto(b.nome),
    descricao: texto(b.descricao),
    gatilho: {
      borda: objeto(b.gatilho)?.borda !== false,
      texto: texto(objeto(b.gatilho)?.texto),
    },
    efeitos: comUid(b.efeitos, ["efeitoId"])
      .map((e) => ({ uid: texto(e.uid), efeitoId: texto(e.efeitoId), escolha: objeto(e.escolha) })),
    aptidoes: comUid(b.aptidoes, ["aptidaoId", "modId"])
      .map((a) => ({ uid: texto(a.uid), aptidaoId: texto(a.aptidaoId), modId: texto(a.modId), escolha: objeto(a.escolha) })),
    requisitos: comUid(b.requisitos, ["dificuldade"])
      .map((r) => ({ uid: texto(r.uid), dificuldade: texto(r.dificuldade), alvoUid: texto(r.alvoUid), texto: texto(r.texto) })),
    exaustao: inteiro(b.exaustao, 0, 99),
    especial: esp
      ? { texto: texto(esp.texto), linhas: lista(esp.linhas), confirmacoes: objeto(esp.confirmacoes) ?? {} }
      : null,
    critico: {
      aumentarCD: !!crit.aumentarCD,
      alvoExtra: !!crit.alvoExtra,
      condicao: objeto(crit.condicao),
    },
    contraAtaque: contra > 0 ? { quantidade: contra } : null,
    usaReacao: !!b.usaReacao,
    legado: objeto(b.legado),
  };
}

/** As Técnicas da Expansão que a ficha guarda, normalizadas e sem id repetido. */
export function tecnicasDaFicha(creature) {
  const vistos = new Set();
  const out = [];
  for (const b of lista(creature?.estilosSombra)) {
    if (!objeto(b) || regraDaTecnica(b) !== REGRA_EXPANSAO) continue;
    const t = normalizaTecnicaEstilo(b);
    if (!t || vistos.has(t.id)) continue;
    vistos.add(t.id);
    out.push(t);
  }
  return out;
}

/**
 * As entradas CRUAS da Expansão, como estão gravadas. É o que o escritor do
 * criador junta de volta ao regravar a lista a partir de `estilosDaFicha`,
 * que só devolve as `legacy`. Sem isto, editar uma Técnica antiga apagaria as
 * novas.
 */
export const tecnicasCruasDaExpansao = (creature) =>
  lista(creature?.estilosSombra).filter((b) => objeto(b) && regraDaTecnica(b) === REGRA_EXPANSAO);

/** O nome de uma escolha, para o rótulo ("Aumento de TR (Reflexos)"). */
const nomeDaEscolha = (tipo, id) => {
  if (!id) return null;
  if (tipo === "ataque") return ESCOLHA_ATAQUE.find((x) => x.id === id)?.nome ?? id;
  if (tipo === "tr") return ESCOLHA_TR.find((x) => x.id === id)?.nome ?? id;
  return id;
};

/**
 * Junta as compras iguais (mesmo efeito e mesma escolha) num grupo com `n`.
 * É o `n` que o catálogo lê para somar, estender aos aliados ou contar.
 */
export function gruposDeCompras(tecnica) {
  const grupos = new Map();
  for (const c of tecnica?.efeitos ?? []) {
    const def = getEfeitoEstilo(c.efeitoId);
    const chave = chaveDaCompra(c);
    if (!grupos.has(chave)) {
      const escolha = def?.escolha ? (c.escolha?.[def.escolha] ?? null) : null;
      grupos.set(chave, {
        chave,
        efeitoId: c.efeitoId,
        escolha,
        nomeEscolha: def?.escolha ? nomeDaEscolha(def.escolha, escolha) : null,
        uids: [],
      });
    }
    grupos.get(chave).uids.push(c.uid);
  }
  return [...grupos.values()].map((g) => ({ ...g, n: g.uids.length }));
}

/**
 * Resolve UMA Técnica da Expansão: o orçamento de efeitos, o que ela escreve no
 * Motor do usuário e os números de mesa dos aliados. Nenhum número é gravado.
 *
 * `dom` é o Nível de Aptidão em Domínio efetivo e `imbuicoesExtras` o canal
 * `imbuicoesEstilo` ("a quantidade de Efeitos que você pode manter ativa passa a
 * ser igual ao dobro do seu Nível de Domínio", no Treino de Novo Estilo).
 *
 * ⚠ As expressões saem como TEXTO de DSL, e o derive as avalia. Assim o BT, o
 * nível e a Aptidão do dia entram sozinhos.
 */
/**
 * As modificações de Aptidão juntadas por (modificação, Aptidão), com `n`.
 * O nome da Aptidão vem do catálogo de Aptidões pelo `ctx`, porque este
 * módulo não importa aquele catálogo (ele está no ciclo).
 */
export function gruposDeModificacoes(tecnica, nomeDaAptidao = (id) => id) {
  const grupos = new Map();
  for (const a of tecnica?.aptidoes ?? []) {
    const chave = `${a.modId}:${a.aptidaoId}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        chave, modId: a.modId, aptidaoId: a.aptidaoId, nomeAptidao: nomeDaAptidao(a.aptidaoId), uids: [],
      });
    }
    grupos.get(chave).uids.push(a.uid);
  }
  return [...grupos.values()].map((g) => ({ ...g, n: g.uids.length }));
}

/** O canal de uma linha de Aptidão é numérico se a expressão não é vazia e o
    canal não é marcador. Basta para "Aptidões que concedem bônus numérico". */
const linhaNumerica = (e) => !!String(e?.canal ?? "").trim() && !!String(e?.expr ?? "").trim();

export function resolveTecnicaExpansao(t, {
  dom = 0, imbuicoesExtras = 0, partesImbuicao = [],
  nomeDaAptidao = (id) => id, efeitosDaAptidao = () => [], niveis = {},
} = {}) {
  /* Pré-Requisitos: o bônus no Nível de Aptidão considerado, POR ALVO. Somar os
     de um mesmo alvo é NOVA DECISÃO NECESSÁRIA, e a validação avisa. */
  const bonusPorAlvo = {};
  for (const r of t.requisitos ?? []) {
    const b = bonusDoPrerequisito(r.dificuldade);
    if (b && r.alvoUid) bonusPorAlvo[r.alvoUid] = (bonusPorAlvo[r.alvoUid] ?? 0) + b;
  }
  const bonusDoGrupo = (uids) => uids.reduce((s, u) => s + (bonusPorAlvo[u] ?? 0), 0);
  // A trilha considerada: a real mais o Pré-Requisito daquele alvo, só nele.
  const trilhaCom = (trilha, b) => (b ? `(${trilha} + ${b})` : trilha);
  const domN = Math.max(0, Math.trunc(Number(dom) || 0));
  const extra = Math.max(0, Math.trunc(Number(imbuicoesExtras) || 0));
  const base = domN + extra;
  const limite = {
    base,
    exaustao: t.exaustao,
    total: base + t.exaustao,
    partes: [
      { label: "Nível de Aptidão em Domínio", valor: domN },
      ...(extra ? partesImbuicao : []),
      ...(t.exaustao ? [{ label: "Exaustão", valor: t.exaustao }] : []),
    ],
  };
  const grupos = t.tipo === TIPO_MODIFICACAO ? gruposDeCompras(t) : [];
  const pessoais = [];
  const aliados = [];
  let ataquesComGatilho = 0;
  let usados = 0;
  for (const g of grupos) {
    const def = getEfeitoEstilo(g.efeitoId);
    if (!def) continue;
    usados += g.n * (def.custo ?? 1);
    const rotulo = g.nomeEscolha ? `${def.nome} (${g.nomeEscolha})` : def.nome;
    if (def.contagem === "ataquesComGatilho") ataquesComGatilho += g.n;
    if (def.canal && typeof def.expr === "function") {
      pessoais.push({
        efeitoId: def.id,
        nome: rotulo,
        canal: def.canal,
        ...(g.escolha ? { alvo: g.escolha } : {}),
        expr: def.expr(g.n),
        n: g.n,
      });
    }
    // A 2ª compra ESTENDE aos aliados, e nunca soma no usuário (o `expr` do
    // catálogo ignora o `n` nesses efeitos).
    if (def.repeticao === "aliados" && g.n >= 2 && def.aliados) {
      aliados.push({
        efeitoId: def.id,
        rotulo: g.nomeEscolha ? `${def.aliados} (${g.nomeEscolha})` : def.aliados,
        expr: def.expr(g.n),
      });
    }
  }

  /* As modificações de Aptidão. Cada compra ocupa 1 vaga ("Cada um desses
     efeitos conta como um efeito adicionado ao Domínio Simples"). */
  const modificacoes = t.tipo === TIPO_MODIFICACAO ? gruposDeModificacoes(t, nomeDaAptidao) : [];
  const mesa = [];
  for (const g of modificacoes) {
    const mod = getModificacaoAptidao(g.modId);
    if (!mod) continue;
    usados += g.n;
    const rotulo = `${mod.nome} (${g.nomeAptidao})`;
    // Bônus numérico: `teto(trilha / 2)` em cada canal numérico da Aptidão,
    // com a mesma condição da linha dela.
    //
    // ⚠ "bônus a mais" só existe quando a Aptidão está dando o bônus dela. O
    // Cobrir-se vale `4 * cobrir_se_pe`, e uma linha constante daria PV
    // Temporário a quem nem usou a Aptidão. Por isso o extra é multiplicado pela
    // própria linha estar valendo (`!= 0`).
    const b = bonusDoGrupo(g.uids);
    if (mod.bonus) {
      const expr = `teto(${trilhaCom(mod.bonus, b)} / 2)`;
      for (const linha of (efeitosDaAptidao(g.aptidaoId) ?? []).filter(linhaNumerica)) {
        pessoais.push({
          efeitoId: mod.id,
          nome: rotulo,
          canal: linha.canal,
          ...(linha.alvo ? { alvo: linha.alvo } : {}),
          ...(String(linha.quando ?? "").trim() ? { quando: linha.quando } : {}),
          expr: `${expr} * ((${linha.expr}) != 0)`,
          n: g.n,
        });
      }
      if (g.n >= 2) aliados.push({ efeitoId: mod.id, rotulo: `Bônus dos Aliados no Domínio (${g.nomeAptidao})`, expr });
    }
    if (mod.numero) {
      mesa.push({ efeitoId: mod.id, rotulo: mod.numero.rotulo, expr: trilhaCom(mod.numero.expr, b) });
    }
  }

  /* Contra-Ataque: cada um ocupa 1 vaga, e o degrau sai do Nível de BAR real
     (o Pré-Requisito não mexe na quantidade, e a validação o recusa aqui). */
  const bar = Math.max(0, Math.trunc(Number(niveis?.bar) || 0));
  const contraAtaques = t.tipo === TIPO_MODIFICACAO ? (t.contraAtaque?.quantidade ?? 0) : 0;
  usados += contraAtaques;
  const contra = contraAtaques
    ? { quantidade: contraAtaques, bar, degrau: degrauDoContraAtaque(bar), bar5: bar >= 5 }
    : null;

  /* Crítico: cada modificação ligada ocupa 1 vaga. A CD sobe pelo BAR. */
  const criticoMods = [];
  if (t.tipo === TIPO_MODIFICACAO) {
    for (const c of CRITICO_MODS) {
      const ligado = c.id === "condicao" ? !!t.critico?.condicao : !!t.critico?.[c.id];
      if (!ligado) continue;
      usados += 1;
      criticoMods.push({ id: c.id, nome: c.nome });
      if (c.numero) {
        const bc = bonusPorAlvo[alvoDoCritico(c.id)] ?? 0;
        mesa.push({ efeitoId: alvoDoCritico(c.id), rotulo: c.numero.rotulo, expr: trilhaCom(c.numero.trilha, bc) });
      }
    }
  }

  return {
    ...t,
    estado: varDaTecnicaAtiva(t.id),
    limite,
    usados,
    grupos,
    modificacoes,
    pessoais,
    aliados,
    mesa,
    ataquesComGatilho,
    contra,
    // As modificações de crítico ligadas. O objeto gravado segue em `critico`.
    criticoMods,
    // Com Contra-Ataque, a Reação fica indisponível enquanto o Domínio durar.
    removeReacao: contraAtaques > 0,
    // Os Pontos de Exaustão que esta Técnica gera quando o Domínio fecha.
    exaustaoGerada: t.exaustao,
    bonusPorAlvo,
  };
}

/* ============================================================ */
/* VALIDAÇÃO DA EXPANSÃO (DA-07)                                 */
/* ============================================================ */
/* Três níveis:
     erro   configuração impossível. Os dados ficam salvos e visíveis, e a
            Técnica INTEIRA fica mecanicamente inválida até ser corrigida: o
            autor preferiu bloquear a escolher quais excedentes valeriam.
     aviso  depende de interpretação ou da aprovação do Narrador. Não bloqueia.
     info   regra relevante sem bloqueio. Mora no hover, nunca solta na tela.
   Cada item: { nivel, codigo, texto, uid? }. */

/** Canais que a Técnica não pode escrever: eles são lidos ANTES de os efeitos
    do Estilo existirem, e a linha seria ignorada calada. */
const CANAIS_FORA_DO_ESTILO = new Set(["vagasEstilo", "imbuicoesEstilo"]);

const ARTIGO_ESCOLHA = { tr: "o TR", pericia: "a Perícia", ataque: "o Tipo de Ataque" };

export function validarTecnica(r, {
  aptidoesPossuidas = [], categoriaDaAptidao = () => null, efeitosDaAptidao = () => [], niveis = {},
} = {}) {
  const out = [];
  const erro = (codigo, texto, uid) => out.push({ nivel: "erro", codigo, texto, ...(uid ? { uid } : {}) });
  const aviso = (codigo, texto, uid) => out.push({ nivel: "aviso", codigo, texto, ...(uid ? { uid } : {}) });
  const info = (codigo, texto) => out.push({ nivel: "info", codigo, texto });

  if (r.tipo === TIPO_MODIFICACAO) {
    if (r.usados > r.limite.total) erro("limite", `Efeitos: ${r.usados} de ${r.limite.total}.`);
    for (const g of r.grupos) {
      const def = getEfeitoEstilo(g.efeitoId);
      if (!def) {
        erro("efeito", `Efeito desconhecido: ${g.efeitoId}.`, g.uids[0]);
        continue;
      }
      if (def.escolha && !g.escolha) {
        erro("escolha", `${def.nome}: falta escolher ${ARTIGO_ESCOLHA[def.escolha] ?? "o alvo"}.`, g.uids[0]);
      }
      if (def.max != null && g.n > def.max) {
        const rotulo = g.nomeEscolha ? `${def.nome} (${g.nomeEscolha})` : def.nome;
        erro("teto", `${rotulo}: ${g.n} compras, o teto é ${def.max}.`, g.uids[0]);
      }
    }
    // As modificações de Aptidão: a Aptidão precisa existir na ficha, servir
    // para a modificação, e nunca ser de Domínio.
    const possuidas = new Set(aptidoesPossuidas);
    for (const g of r.modificacoes ?? []) {
      const mod = getModificacaoAptidao(g.modId);
      const quem = g.nomeAptidao || g.aptidaoId;
      if (!mod) {
        erro("modificacao", `Modificação desconhecida: ${g.modId}.`, g.uids[0]);
        continue;
      }
      if (categoriaDaAptidao(g.aptidaoId) === CATEGORIA_PROIBIDA_NO_ESTILO) {
        erro("aptidao_dominio", `${quem}: Aptidões de Domínio não podem ser aplicadas no Domínio Simples.`, g.uids[0]);
        continue;
      }
      if (!possuidas.has(g.aptidaoId)) erro("aptidao_ausente", `${quem}: a ficha não tem esta Aptidão.`, g.uids[0]);
      const serve = mod.aptidoes
        ? mod.aptidoes.includes(g.aptidaoId)
        : categoriaDaAptidao(g.aptidaoId) === mod.categoria;
      if (!serve) erro("aptidao_invalida", `${mod.nome}: não vale para ${quem}.`, g.uids[0]);
      if (serve && mod.exigeNumerico && !(efeitosDaAptidao(g.aptidaoId) ?? []).some(linhaNumerica)) {
        erro("aptidao_sem_numero", `${mod.nome}: ${quem} não concede bônus numérico.`, g.uids[0]);
      }
      if (mod.requerTrilha && (Number(niveis?.[mod.requerTrilha.trilha]) || 0) < mod.requerTrilha.min) {
        erro("requisito", `${mod.nome}: pede Nível de Aptidão ${mod.requerTrilha.min} em ${mod.requerTrilha.trilha.toUpperCase()}.`, g.uids[0]);
      }
      if (g.n > mod.max) erro("teto", `${mod.nome} (${quem}): ${g.n} compras, o teto é ${mod.max}.`, g.uids[0]);
    }
    // Pré-Requisitos: cada um aponta para UM efeito da Técnica.
    const alvos = new Map();
    for (const g of r.grupos) {
      const def = getEfeitoEstilo(g.efeitoId);
      for (const u of g.uids) {
        alvos.set(u, {
          proibido: def ? !def.aceitaBonusPreRequisito : false,
          leAptidao: def?.leAptidao ?? null,
          nome: def?.nome ?? g.efeitoId,
        });
      }
    }
    for (const g of r.modificacoes ?? []) {
      const mod = getModificacaoAptidao(g.modId);
      for (const u of g.uids) alvos.set(u, { proibido: false, leAptidao: mod?.leAptidao ?? null, nome: mod?.nome ?? g.modId });
    }
    if (r.contra) alvos.set(ALVO_CONTRA_ATAQUE, { proibido: true, leAptidao: "bar", nome: "Contra-Ataque" });
    for (const c of r.criticoMods ?? []) {
      const def = CRITICO_MODS.find((x) => x.id === c.id);
      alvos.set(alvoDoCritico(c.id), { proibido: false, leAptidao: def?.leAptidao ?? null, nome: c.nome });
    }
    const porAlvo = {};
    for (const req of r.requisitos ?? []) {
      if (!DIFICULDADES_PREREQ.some((d) => d.value === req.dificuldade)) {
        erro("prereq_dificuldade", "Pré-Requisito sem dificuldade válida.", req.uid);
      }
      const alvo = alvos.get(req.alvoUid);
      if (!alvo) {
        erro("prereq_alvo", "Pré-Requisito sem efeito escolhido.", req.uid);
        continue;
      }
      porAlvo[req.alvoUid] = (porAlvo[req.alvoUid] ?? 0) + 1;
      if (alvo.proibido) {
        erro("prereq_proibido", "O Pré-Requisito não aumenta a quantidade de Ataques com Gatilho nem de Contra-Ataques.", req.uid);
      } else if (!alvo.leAptidao) {
        aviso("prereq_sem_efeito", `${alvo.nome}: não lê Nível de Aptidão, e o Pré-Requisito não tem o que aumentar.`, req.uid);
      }
    }
    for (const n of Object.values(porAlvo)) {
      if (n > 1) aviso("prereq_somados", `${n} Pré-Requisitos no mesmo efeito, somados até a decisão do autor.`);
    }

    // Contra-Ataque: até o Nível de BAR, e pede Barreira.
    if (r.contra) {
      if (r.contra.bar < 1) erro("contra_bar", "Contra-Ataque pede Nível de Aptidão em Barreira.");
      else if (r.contra.quantidade > r.contra.bar) {
        erro("contra_teto", `Contra-Ataques: ${r.contra.quantidade} de BAR ${r.contra.bar}.`);
      }
      info("reacao", "Com Contra-Ataque, a Reação fica indisponível enquanto o Domínio Simples durar.");
    }

    // Crítico: a tabela de efeitos de crítico das armas ainda não existe.
    if ((r.criticoMods ?? []).length) {
      aviso("critico_tabela", "Condição pelo crítico: depende do efeito Crítico da arma, e a tabela de crítico ainda não existe no Afty.");
    }
    if (r.critico?.condicao?.para === "extrema") {
      erro("critico_extrema", "A condição não pode subir para Extrema.");
    }

    info("borda", "Gatilho padrão: alguém ou algo atravessa a borda do Domínio Simples, detectado sem visão. Quem já começa o turno dentro não aciona.");
    info("auxiliar", "A regra que concentra um Feitiço Auxiliar em uma única instância não vale nos Estilos da Sombra.");
  }

  const usaEspecial = r.tipo === TIPO_ESPECIAL || r.grupos.some((g) => g.efeitoId === "especial");
  if (usaEspecial) {
    aviso("especial", "Efeito Especial: depende da aprovação do Narrador.");
    for (const e of r.especial?.linhas ?? []) {
      if (CANAIS_FORA_DO_ESTILO.has(String(e?.canal ?? "").trim())) {
        erro("canal", `O canal ${e.canal} não pode ser escrito por uma Técnica de Estilo.`);
      }
    }
  }
  return out;
}

const temErro = (lista) => lista.some((v) => v.nivel === "erro");

/**
 * O Estilo está disponível para esta criatura?
 *
 * ⚠ O `liberado` vem do campo `libera: ["estiloSombras"]` de um Addon da
 * criatura (autor, 2026-08-21): *"liberar Estilo das Sombras mesmo que as
 * pessoas tenham Feitiços e não sejam Sem Técnica"*. Ele solta a trava de
 * ORIGEM, e só ela.
 *
 * ⚠ O PISO DE NÍVEL CONTINUA VALENDO (decisão do autor no mesmo dia). São duas
 * travas independentes: a origem diz QUEM tem, o nível diz A PARTIR DE QUANDO.
 * O Addon responde a primeira pergunta e não encosta na segunda.
 *
 * ⚠ Quem destrava por Addon NÃO ganha o Domínio Simples junto (decisão do autor
 * no mesmo dia). O Sem Técnica o recebe de graça pelo Empenho Implacável,
 * porque não tem técnica nenhuma para compensar, e quem tem Feitiços compra a
 * aptidão normalmente. Sem Domínio o Estilo é conhecido e não tem vaga de
 * imbuição, então o card avisa em vez de ficar mudo.
 */
export const estiloDisponivel = (origemId, nd, liberado = false) =>
  (origemId === ESTILO_ORIGEM || liberado) && (nd ?? 1) >= ESTILO_ND_MINIMO;

/**
 * O card do Estilo aparece na aba Habilidades do criador?
 *
 * ⚠ MORA AQUI, e não numa condição solta dentro do JSX, porque ele é a QUARTA
 * trava do Estilo e as três primeiras moram neste arquivo. Enquanto a decisão
 * ficou no meio do layout ela saiu de sincronia duas vezes: o `estiloDisponivel`
 * já dizia sim e a aba continuava ramificando por origem, então o Addon abria o
 * Estilo no motor e o card nem era montado (autor, 2026-08-21, com print).
 *
 * Três casos, e cada um por um motivo diferente:
 *
 *   • **Sem Técnica**: sempre, INCLUSIVE trancado. A mensagem "destrava no
 *     Nível 4" é o que diz a ele que o Estilo existe e está vindo.
 *   • **as outras origens**: só com a liberação de Addon. Um card trancado na
 *     tela de quem nunca vai ter é o mesmo erro do card de Concessão.
 *   • **qualquer uma com Técnica JÁ GRAVADA**: senão desinstalar o addon
 *     deixaria a linha morta presa na ficha, sem tela para removê-la.
 */
export const mostraCardEstilo = (origemId, estilo) =>
  origemId === ESTILO_ORIGEM
  || !!estilo?.disponivel
  || (estilo?.conhecidas?.length ?? 0) > 0;

/* ============================================================ */
/* RESOLVEDOR                                                    */
/* ============================================================ */
/**
 * Resolve as Técnicas de Estilo da ficha.
 *
 * `dom` é o Nível de Aptidão em Domínio EFETIVO, e ele é a quantidade de VAGAS
 * DE IMBUIÇÃO. Ele não limita quantas Técnicas a criatura conhece: quem limita é
 * o contador da aba, resolvido no deriveAfty junto dos Feitiços.
 *
 * A quantidade imbuída sai de `creature.combate`, que é a bancada no criador e a
 * sessão na Ficha Final. Lida CRUA de propósito: o resolveCombate zera tudo fora
 * de combate, e a combinação montada tem de continuar aparecendo na tela.
 *
 * Devolve { disponivel, conhecidas, gastos, vagas, gastoVagas, estados, avisos }.
 */
export function resolveEstilos(
  creature,
  {
    origemId = null, nd = 1, dom = 0, liberado = false, imbuicoesExtras = 0,
    partesImbuicao = [], temDominioSimples = false, vagasEstilo = 0, partesVagasEstilo = [],
    // As Aptidões da ficha, para as modificações. Vêm do derive porque este
    // módulo não importa o catálogo de Aptidões (ciclo).
    aptidoesPossuidas = [], categoriaDaAptidao = () => null, efeitosDaAptidao = () => [],
    nomeDaAptidao = (id) => id, niveis = {},
  } = {},
) {
  const disponivel = estiloDisponivel(origemId, nd, liberado);
  // Não entram em estilosDaFicha: o editor grava só as técnicas particulares,
  // nunca uma cópia do pacote que sobreviveria à desinstalação.
  /* As Técnicas de PACOTE (`estilos[]` de um Addon). DA-06: a que não declara
     regra segue `legacy` (o Lime Neds), sem agrupar nada. A que declara
     `regra: "expansao"` entra como Técnica da Expansão, com o id do pacote na
     frente, e não é editável na ficha (ela é do pacote). */
  const pacotes = Array.isArray(creature?.addons) ? creature.addons : [];
  const estilosDoPacote = (p) => (Array.isArray(p?.estilos) ? p.estilos : []).filter((t) => t?.id && t?.nome);
  const deAddon = pacotes.flatMap((p) => estilosDoPacote(p)
    .filter((t) => regraDaTecnica(t) !== REGRA_EXPANSAO)
    .map((t) => ({
      ...t, id: `${p.id}:${t.id}`, tipo: "especial", deAddon: true,
      descricao: [t.descricao, t.adendo].filter(Boolean).join("\n\n"),
    })));
  const deAddonExpansao = pacotes.flatMap((p) => estilosDoPacote(p)
    .filter((t) => regraDaTecnica(t) === REGRA_EXPANSAO)
    .map((t) => normalizaTecnicaEstilo({ ...t, id: `${p.id}:${t.id}` }))
    .filter(Boolean)
    .map((t) => ({ ...t, deAddon: true, pacote: p.nome ?? p.id })));
  const conhecidasCru = [...estilosDaFicha(creature), ...deAddon];
  // As Técnicas da Expansão. Não entram na imbuição nem no contador de
  // Habilidades: o orçamento delas é a progressão própria.
  const tecnicasCru = [...tecnicasDaFicha(creature), ...deAddonExpansao]
    .map((t) => resolveTecnicaExpansao(t, { dom, imbuicoesExtras, partesImbuicao, nomeDaAptidao, efeitosDaAptidao, niveis }));
  const ctxValidacao = { aptidoesPossuidas, categoriaDaAptidao, efeitosDaAptidao, niveis };

  /* A PROGRESSÃO DA EXPANSÃO (DA-03) mais a vaga exclusiva `vagasEstilo`, que
     o derive lê antes daqui. As Técnicas da Expansão usam a vaga exclusiva
     primeiro, e o que sobrar dela segue para as `legacy`. */
  const vagasEstiloTotal = Math.max(0, Math.trunc(Number(vagasEstilo) || 0));
  const daProgressao = disponivel ? tecnicasDaProgressao(nd) : { total: 0, partes: [] };
  const usadas = disponivel ? tecnicasCru.length : 0;
  const totalProgressao = daProgressao.total + (disponivel ? vagasEstiloTotal : 0);
  const progressao = {
    total: totalProgressao,
    partes: [...daProgressao.partes, ...(disponivel ? partesVagasEstilo : [])],
    usadas,
    excedeu: usadas > totalProgressao,
  };
  const vagasEstiloNasNovas = Math.min(Math.max(0, usadas - daProgressao.total), vagasEstiloTotal);

  /* Validação: a Técnica com ERRO fica inteira sem efeito (DA-07), e a
     progressão estourada invalida TODAS, porque escolher quais valeriam seria
     arbitrário. Os dados nunca são tocados. */
  const validacaoEstilo = progressao.excedeu
    ? [{ nivel: "erro", codigo: "progressao", texto: `Técnicas de Estilo: ${usadas} de ${totalProgressao}.` }]
    : [];
  const tecnicas = tecnicasCru.map((t) => {
    const validacao = validarTecnica(t, ctxValidacao);
    return {
      ...t,
      validacao,
      mecanicamenteValida: disponivel && !progressao.excedeu && !temErro(validacao),
    };
  });
  const avisos = [];

  const vagas = Math.max(
    0,
    Math.trunc(Number(dom) || 0) + Math.trunc(Number(imbuicoesExtras) || 0),
  );
  const combate = (creature?.combate && typeof creature.combate === "object") ? creature.combate : {};

  // Primeira passada: quanto cada Técnica pede, já aparado no teto do livro.
  // A soma disso é o que ocupa as vagas do Domínio Simples.
  const pedido = conhecidasCru.map((t) => {
    const def = t.tipo === "tabela" ? TABELA_BY_ID[t.id] : null;
    // ⚠ A Especial não tem cláusula de repetição no livro, então ela só pode
    // ser ligada uma vez. O custo dessa ligação é próprio da Técnica e fica em
    // uma vaga nas fichas antigas.
    const teto = t.tipo === "tabela" ? (def?.max ?? vagas) : inteiro(t.maxImbuicoes, 1, 99);
    const custo = t.tipo === "especial" ? inteiro(t.custoImbuicao, 1, 99) : 1;
    return { t, def, teto, custo, vezes: inteiro(combate[estadoDaTecnica(t.id)], 0, Math.max(0, teto)) };
  });
  const gastoVagas = pedido.reduce((s, p) => s + (p.vezes * p.custo), 0);
  const folga = vagas - gastoVagas;

  const conhecidas = pedido.map(({ t, def, teto, custo, vezes }) => ({
    ...t,
    def,
    nome: t.tipo === "tabela"
      ? (def?.nome ?? t.id)
      : (t.nome || "Técnica Sem Nome"),
    descricao: t.tipo === "tabela" ? (def?.descricao ?? "") : t.descricao,
    estado: estadoDaTecnica(t.id),
    vezes,
    custoImbuicao: custo,
    // O teto da faixa na bancada: nem passa do que o livro escreve, nem estoura
    // as vagas do Domínio. Mesmo desenho do orçamento de efeitos que existia
    // antes, e é o que impede a combinação de exceder sem aviso.
    maxImbuicao: Math.max(
      vezes,
      Math.min(teto, vezes + Math.floor(Math.max(0, folga) / custo)),
    ),
  }));

  if (disponivel && gastoVagas > vagas) {
    /* ⚠ A frase deixou de citar só o Nível de Aptidão em Domínio (2026-08-22).
       Com o canal `imbuicoesEstilo` no ar a régua pode ter outra fonte, e a
       mensagem velha mandaria a pessoa procurar o número no lugar errado. */
    avisos.push(`${gastoVagas} imbuições no Domínio Simples, e cabem ${vagas}.`);
  }

  // A Técnica gravada numa ficha que perdeu o acesso (trocou de origem, ou o ND
  // caiu abaixo de 4) NÃO é apagada: ela some da conta e volta sozinha se o
  // acesso voltar. Mesma convenção do aparo de níveis em resolveNiveisAptidao.
  if (!disponivel && (conhecidas.length || tecnicas.length)) {
    /* ⚠ A segunda mensagem passou a citar o Addon (2026-08-21). Ela dizia só
       "o Novo Estilo da Sombra é do Sem Técnica", e virou meia verdade no dia
       em que um Addon passou a poder destravar: quem lesse aquilo com o addon
       desinstalado não teria como saber o que faltava. */
    avisos.push(
      origemId === ESTILO_ORIGEM || liberado
        ? `Novo Estilo da Sombra destrava no Nível ${ESTILO_ND_MINIMO}.`
        : "As Técnicas de Estilo gravadas não valem: o Novo Estilo da Sombra é do Sem Técnica, ou de um Addon que o libere.",
    );
  }

  // Interruptores da bancada. Um bool para o Domínio Simples no ar, e uma faixa
  // de imbuição por Técnica conhecida, que só aparece com o Domínio ligado.
  //
  // ⚠ 2026-10-04: o interruptor existe também SEM Técnica nenhuma, desde que a
  // ficha tenha o Domínio Simples (E-03: o Sem Técnica de Nível 4 recém-criado
  // não conseguia marcar o Domínio no ar). As Técnicas da Expansão entram por um
  // seletor só ("Técnica Atual"), porque a regra é uma por vez (DA-04). As
  // faixas de imbuição seguem existindo para as `legacy`.
  const temInterruptor = disponivel && (conhecidas.length || tecnicas.length || temDominioSimples);
  /* ⚠ O RÓTULO VOLTOU A SER "Domínio Simples" (DA-04, 2026-10-04): "a interface de
     combate deve deixar claro: Domínio Simples ativo, Técnica atual: X". A decisão
     de 2026-08-10 o chamava "Novo Estilo das Sombras" porque a linha solta lia
     como Aptidão avulsa, e agora a Técnica Atual fica logo abaixo dela.

     O interruptor carrega a Exaustão de cada Técnica da Expansão (DA-08): a
     sessão soma ao FECHAR o Domínio, sem precisar do derive na hora. A Técnica
     inválida não deu benefício nenhum (DA-07), e por isso não gera Exaustão. */
  // `combate` é a leitura CRUA da bancada ou da sessão, feita lá em cima.
  const dominioNoAr = disponivel && !!combate.ativo && !!combate[ESTADO_ESTILO_ATIVO];
  const tecnicaAtiva = dominioNoAr
    ? tecnicas.find((t) => t.id === combate[ESTADO_TECNICA_ATIVA] && t.mecanicamenteValida) ?? null
    : null;
  const exaustaoPorTecnica = Object.fromEntries(
    tecnicas.map((t) => [t.id, t.mecanicamenteValida ? t.exaustaoGerada : 0]),
  );
  const estados = temInterruptor
    ? [
      {
        id: ESTADO_ESTILO_ATIVO,
        label: "Domínio Simples",
        tipo: "bool",
        ...(tecnicas.length ? { exaustaoPorTecnica } : {}),
      },
      ...(tecnicas.length
        ? [{
          id: ESTADO_TECNICA_ATIVA,
          label: "Técnica Atual",
          tipo: "opcao",
          requerEstado: ESTADO_ESTILO_ATIVO,
          opcoes: tecnicas.map((t) => ({
            id: t.id,
            label: `${t.nome || "Técnica Sem Nome"}${t.mecanicamenteValida ? "" : " (Inválida)"}`,
          })),
        }]
        : []),
      ...conhecidas.map((t) => ({
        id: t.estado,
        label: t.nome,
        tipo: "faixa",
        min: 0,
        max: t.maxImbuicao,
        requerEstado: ESTADO_ESTILO_ATIVO,
        title: [
          t.descricao,
          t.custoImbuicao > 1 ? `${t.custoImbuicao} vagas de imbuição` : null,
        ].filter(Boolean).join("\n\n"),
      })),
    ]
    : [];

  return {
    disponivel,
    ndMinimo: ESTILO_ND_MINIMO,
    conhecidas,
    // As Técnicas da Expansão (DA-02), já validadas, e a progressão delas.
    tecnicas,
    /* O que a mesa está usando AGORA, para a Ficha e o Encontro: o Domínio no ar
       (em combate), a Técnica imbuída e a Reação que o Contra-Ataque tira. A
       Técnica inválida não conta como ativa: ela não dá nada (DA-07). */
    dominioAtivo: dominioNoAr,
    tecnicaAtiva: tecnicaAtiva?.id ?? null,
    reacaoIndisponivel: !!tecnicaAtiva?.removeReacao,
    tecnicasUsadas: usadas,
    progressao,
    validacao: validacaoEstilo,
    // A vaga exclusiva inteira, e o que sobrou dela para as `legacy`.
    vagasEstiloTotal,
    vagasEstiloSobra: vagasEstiloTotal - vagasEstiloNasNovas,
    // O que a aba cobra do contador de Habilidades: uma por Técnica LEGACY.
    // A da Expansão não gasta o contador (DA-03).
    gastos: disponivel ? conhecidas.length : 0,
    vagas,
    gastoVagas,
    excedeuVagas: disponivel && gastoVagas > vagas,
    estados,
    avisos,
  };
}

/**
 * Efeitos das Técnicas de Estilo no vocabulário do Motor.
 *
 * Todos levam `exclusivo: "estiloSombra"` (a sexta família do pool que não
 * acumula), `duracao: "temporaria"` e um `quando` que exige o Domínio Simples no
 * ar E pelo menos uma imbuição daquela Técnica.
 *
 * ⚠ A quantidade imbuída entra como VARIÁVEL, e não como número: a linha é
 * estática e o valor acompanha a bancada e a sessão sozinho. É o que permite a
 * imbuição ser trocada em meio ao combate sem o motor remontar efeito nenhum.
 *
 * ⚠ Entrada inválida é descartada em silêncio, igual ao `efeitosDaTecnica`: a
 * validação de expressão e a mensagem de erro são da UI, que pinta a linha de
 * vermelho na hora de escrever.
 */
export function efeitosDoEstilo(creature, ctx = {}) {
  const resolvido = resolveEstilos(creature, ctx);
  if (!resolvido.disponivel) return [];
  const out = [];

  for (const t of resolvido.conhecidas) {
    const origem = `estilo:${t.id}`;
    const porta = `${ESTADO_ESTILO_ATIVO} && ${t.estado} >= 1`;

    if (t.tipo === "tabela") {
      const def = t.def;
      if (!def?.canal || typeof def.expr !== "function") continue;
      const expr = def.expr(t.estado);
      if (!expr) continue;
      out.push({
        canal: def.canal,
        expr,
        quando: porta,
        duracao: "temporaria",
        exclusivo: "estiloSombra",
        origem,
        nome: def.nome,
      });
      continue;
    }

    for (const e of t.efeitos ?? []) {
      const canal = String(e?.canal ?? "").trim();
      const expr = String(e?.expr ?? "").trim();
      if (!canal || !expr) continue;
      const proprio = String(e?.quando ?? "").trim();
      const ef = {
        canal,
        expr: e.porImbuicao ? `(${expr}) * ${t.estado}` : expr,
        // Preso ao Domínio Simples é sempre temporário: ele não pode contar para
        // pré-requisito, que é a regra do autor para tudo que liga e desliga.
        quando: proprio ? `${porta} && (${proprio})` : porta,
        duracao: "temporaria",
        exclusivo: "estiloSombra",
        origem,
        nome: t.nome,
      };
      // Exceção declarada pelo pacote para efeitos que somam ao Estilo comum.
      if (t.deAddon && e.acumulaComEstilo) delete ef.exclusivo;
      if (e.alvo) ef.alvo = e.alvo;
      out.push(ef);
    }
  }

  /* ---- Técnicas da Expansão ----
     Uma linha por efeito e escolha, com a contagem de compras dentro da
     expressão (N linhas iguais cairiam na mesma chave do pool `estiloSombra`).
     A porta é o Domínio no ar E esta Técnica selecionada (DA-04). */
  for (const t of resolvido.tecnicas) {
    if (t.mecanicamenteValida === false) continue;
    const porta = `${ESTADO_ESTILO_ATIVO} && ${t.estado}`;
    const nomeTecnica = t.nome || "Técnica Sem Nome";
    const base = { quando: porta, duracao: "temporaria", exclusivo: "estiloSombra", origem: `estilo:${t.id}` };
    for (const p of t.pessoais) {
      out.push({
        ...base,
        canal: p.canal,
        ...(p.alvo ? { alvo: p.alvo } : {}),
        expr: p.expr,
        // A modificação de Aptidão herda a condição da linha da própria Aptidão.
        ...(p.quando ? { quando: `${porta} && (${p.quando})` } : {}),
        nome: `${nomeTecnica}: ${p.nome}`,
      });
    }
    // O Efeito Especial (na Modificação) e a Técnica de Estilo Especial
    // escrevem as linhas de Motor do autor da Técnica.
    const usaEspecial = t.tipo === TIPO_ESPECIAL || t.grupos.some((g) => g.efeitoId === "especial");
    for (const e of usaEspecial ? (t.especial?.linhas ?? []) : []) {
      const canal = String(e?.canal ?? "").trim();
      const expr = String(e?.expr ?? "").trim();
      if (!canal || !expr) continue;
      const proprio = String(e?.quando ?? "").trim();
      out.push({
        ...base,
        canal,
        ...(e.alvo ? { alvo: e.alvo } : {}),
        expr,
        quando: proprio ? `${porta} && (${proprio})` : porta,
        nome: nomeTecnica,
      });
    }
  }
  return out;
}

/* ============================================================ */
/* VALIDADOR DO CATÁLOGO                                        */
/* ============================================================ */

export function validarConteudoEstilos() {
  const erros = [];
  const vistos = new Set();
  for (const e of TECNICAS_TABELA) {
    if (!e.id) erros.push(`TECNICAS_TABELA: entrada sem id (${e.nome ?? "?"}).`);
    if (vistos.has(e.id)) erros.push(`TECNICAS_TABELA: id duplicado "${e.id}".`);
    vistos.add(e.id);
    if (!e.nome) erros.push(`TECNICAS_TABELA: "${e.id}" sem nome.`);
    if (!e.descricao) erros.push(`TECNICAS_TABELA: "${e.id}" sem descrição.`);
    // Canal e expressão andam juntos: um sem o outro é efeito morto ou linha
    // sem valor. O efeito de mesa declara os dois como ausentes.
    if (e.canal && typeof e.expr !== "function") {
      erros.push(`TECNICAS_TABELA: "${e.id}" declara canal sem expressão.`);
    }
    if (!e.canal && typeof e.expr === "function") {
      erros.push(`TECNICAS_TABELA: "${e.id}" declara expressão sem canal.`);
    }
    if (e.max != null && e.max < 1) erros.push(`TECNICAS_TABELA: "${e.id}" tem max menor que 1.`);
    // A faixa de imbuição não pode colidir com o interruptor do Domínio.
    if (estadoDaTecnica(e.id) === ESTADO_ESTILO_ATIVO) {
      erros.push(`TECNICAS_TABELA: "${e.id}" colide com o estado do Domínio Simples.`);
    }
  }
  return erros;
}

/**
 * Validador do catálogo da Expansão (`EFEITOS_ESTILO`). Os dois validadores do
 * Estilo rodam em `asserts/t-novo-estilo-sombras.mjs` (E-01: o de cima era
 * exportado e ninguém o chamava).
 */
export function validarCatalogoEstilo() {
  const erros = [];
  const vistos = new Set();
  const REPETICOES = new Set(["soma", "aliados", "unica"]);
  const ESCOLHAS = new Set([null, "tr", "pericia", "ataque"]);
  for (const e of EFEITOS_ESTILO) {
    const id = e.id ?? "?";
    if (!e.id) erros.push(`EFEITOS_ESTILO: entrada sem id (${e.nome ?? "?"}).`);
    if (vistos.has(e.id)) erros.push(`EFEITOS_ESTILO: id duplicado "${id}".`);
    vistos.add(e.id);
    if (!e.nome || !e.descricao) erros.push(`EFEITOS_ESTILO: "${id}" sem nome ou descrição.`);
    if (!(e.custo >= 1)) erros.push(`EFEITOS_ESTILO: "${id}" com custo menor que 1.`);
    if (!REPETICOES.has(e.repeticao)) erros.push(`EFEITOS_ESTILO: "${id}" com repetição desconhecida.`);
    if (!ESCOLHAS.has(e.escolha)) erros.push(`EFEITOS_ESTILO: "${id}" com escolha desconhecida.`);
    if (e.repeticao === "unica" && e.max !== 1) erros.push(`EFEITOS_ESTILO: "${id}" é de compra única e o teto não é 1.`);
    if (e.repeticao === "aliados" && (e.max !== 2 || !e.aliados)) {
      erros.push(`EFEITOS_ESTILO: "${id}" estende aos aliados e precisa de teto 2 e do rótulo dos aliados.`);
    }
    if (!!e.canal !== (typeof e.expr === "function")) {
      erros.push(`EFEITOS_ESTILO: "${id}" com canal e expressão desencontrados.`);
    }
    if (typeof e.aceitaBonusPreRequisito !== "boolean") {
      erros.push(`EFEITOS_ESTILO: "${id}" sem aceitaBonusPreRequisito.`);
    }
    if (!["A", "M", "P"].includes(e.automacao)) erros.push(`EFEITOS_ESTILO: "${id}" sem automação.`);
  }
  const vistasMods = new Set();
  for (const m of MODIFICACOES_APTIDAO) {
    const id = m.id ?? "?";
    if (!m.id || vistasMods.has(m.id)) erros.push(`MODIFICACOES_APTIDAO: id ausente ou duplicado "${id}".`);
    vistasMods.add(m.id);
    if (!m.nome || !m.descricao) erros.push(`MODIFICACOES_APTIDAO: "${id}" sem nome ou descrição.`);
    // Ou uma Aptidão certa, ou uma categoria. As duas juntas seriam ambíguas.
    if (!!m.aptidoes === !!m.categoria) erros.push(`MODIFICACOES_APTIDAO: "${id}" precisa de aptidoes OU categoria.`);
    if (m.categoria === CATEGORIA_PROIBIDA_NO_ESTILO) erros.push(`MODIFICACOES_APTIDAO: "${id}" aponta para a categoria proibida.`);
    if (!REPETICOES.has(m.repeticao)) erros.push(`MODIFICACOES_APTIDAO: "${id}" com repetição desconhecida.`);
    if (m.bonus && !["au", "cl"].includes(m.bonus)) erros.push(`MODIFICACOES_APTIDAO: "${id}" com bônus fora de AU e CL.`);
    if (!["A", "M", "P"].includes(m.automacao)) erros.push(`MODIFICACOES_APTIDAO: "${id}" sem automação.`);
  }
  return erros;
}
