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
 * ============================================================
 */

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
  { origemId = null, nd = 1, dom = 0, liberado = false, imbuicoesExtras = 0 } = {},
) {
  const disponivel = estiloDisponivel(origemId, nd, liberado);
  const conhecidasCru = estilosDaFicha(creature);
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
    // ⚠ A Especial não tem cláusula de repetição no livro, então ela ocupa UMA
    // vaga. Assunção anotada: só repete quem o texto manda repetir.
    const teto = t.tipo === "tabela" ? (def?.max ?? vagas) : 1;
    return { t, def, teto, vezes: inteiro(combate[estadoDaTecnica(t.id)], 0, Math.max(0, teto)) };
  });
  const gastoVagas = pedido.reduce((s, p) => s + p.vezes, 0);
  const folga = vagas - gastoVagas;

  const conhecidas = pedido.map(({ t, def, teto, vezes }) => ({
    ...t,
    def,
    nome: t.tipo === "tabela"
      ? (def?.nome ?? t.id)
      : (t.nome || "Técnica Sem Nome"),
    descricao: t.tipo === "tabela" ? (def?.descricao ?? "") : t.descricao,
    estado: estadoDaTecnica(t.id),
    vezes,
    // O teto da faixa na bancada: nem passa do que o livro escreve, nem estoura
    // as vagas do Domínio. Mesmo desenho do orçamento de efeitos que existia
    // antes, e é o que impede a combinação de exceder sem aviso.
    maxImbuicao: Math.max(vezes, Math.min(teto, vezes + Math.max(0, folga))),
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
  if (!disponivel && conhecidas.length) {
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
  const estados = disponivel && conhecidas.length
    ? [
      { id: ESTADO_ESTILO_ATIVO, label: ESTILO_LABEL, tipo: "bool" },
      ...conhecidas.map((t) => ({
        id: t.estado,
        label: t.nome,
        tipo: "faixa",
        min: 0,
        max: t.maxImbuicao,
        requerEstado: ESTADO_ESTILO_ATIVO,
      })),
    ]
    : [];

  return {
    disponivel,
    ndMinimo: ESTILO_ND_MINIMO,
    conhecidas,
    // O que a aba cobra do contador de Habilidades: uma por Técnica conhecida.
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
        expr,
        // Preso ao Domínio Simples é sempre temporário: ele não pode contar para
        // pré-requisito, que é a regra do autor para tudo que liga e desliga.
        quando: proprio ? `${porta} && (${proprio})` : porta,
        duracao: "temporaria",
        exclusivo: "estiloSombra",
        origem,
        nome: t.nome,
      };
      if (e.alvo) ef.alvo = e.alvo;
      out.push(ef);
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
