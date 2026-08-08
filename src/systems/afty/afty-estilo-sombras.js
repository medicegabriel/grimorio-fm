/**
 * ============================================================
 * NOVO ESTILO DA SOMBRA — exclusivo do Sem Técnica
 * ============================================================
 * O trunfo de quem não tem técnica amaldiçoada. Destrava no ND 4, junto da
 * aptidão Domínio Simples, e se expressa por TÉCNICAS DE ESTILO, criadas pelo
 * jogador. Ocupa na aba Habilidades o lugar que os Feitiços ocupam nas outras
 * origens.
 *
 * ⚠ Ao contrário dos Feitiços, a Técnica de Estilo NÃO tem nível: ela escala
 * pelo Nível de Aptidão em Domínio do usuário. Por isso não há aqui nada
 * parecido com `nivelMaxFeitico` nem tabela por nível.
 *
 * DOIS TIPOS (o jogador escolhe por Técnica):
 *
 *   modificacao — Modificação do Domínio Simples. Ativa como Ação Livre junto
 *                 da ativação do Domínio Simples, e concede efeitos escolhidos
 *                 de uma TABELA FECHADA (EFEITOS_MODIFICACAO). A quantidade de
 *                 efeitos é o Nível de Aptidão em Domínio.
 *   especial    — Técnica de Estilo Especial. Texto livre mais o Motor de
 *                 Automação completo, no mesmo desenho do Funcionamento Básico
 *                 e do Feitiço Passivo. É onde entram as Aptidões Amaldiçoadas
 *                 incorporadas e os efeitos únicos (a Lua Nebulosa do livro).
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
 * tudo. Vale para os DOIS tipos, inclusive os efeitos de tabela da Modificação.
 *
 * ⚠ Por isso a repetição de um efeito de tabela vira UMA linha com o valor já
 * multiplicado, e não N linhas iguais: N linhas cairiam na mesma chave do pool
 * e só a maior valeria, comendo as repetições que o jogador pagou.
 * ============================================================
 */

/** O Novo Estilo da Sombra destrava no 4° nível, junto do Domínio Simples. */
export const ESTILO_ND_MINIMO = 4;

/** A origem que tem o Estilo. Uma só, e é o que a aba Habilidades consulta. */
export const ESTILO_ORIGEM = "sem_tecnica";

export const ESTILO_TIPOS = [
  { value: "modificacao", label: "Modificação do Domínio Simples" },
  { value: "especial",    label: "Técnica de Estilo Especial" },
];

export const ESTILO_TIPO_LABEL = Object.fromEntries(ESTILO_TIPOS.map((t) => [t.value, t.label]));

/* ============================================================ */
/* TABELA DE EFEITOS · MODIFICAÇÃO DE DOMÍNIO SIMPLES           */
/* ============================================================ */
/* Texto VERBATIM do livro. Campos:
     max        -> quantas vezes o efeito cabe. `null` = sem teto declarado.
     canal      -> o que ele escreve no Motor. `null` = procedimento de mesa.
     expr(n)    -> a expressão da DSL para `n` colocações, JÁ somadas. Ver o
                   aviso do cabeçalho sobre por que não são N linhas.
     livre      -> abre o editor do Motor (só o Efeito Especial).
     notaVezes  -> o que a repetição faz, quando não é somar o próprio valor. */

export const EFEITOS_MODIFICACAO = [
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
    // "pode ser colocado mais uma vez": duas colocações no total.
    max: 2,
    canal: "defesa",
    expr: () => "piso(maestria / 2)",
    descricao:
      "O usuário do Domínio Simples recebe um aumento em sua Defesa igual a metade do seu Bônus " +
      "de Treinamento, enquanto ele estiver ativo. Este efeito pode ser colocado mais uma vez, " +
      "passando a conceder o Aumento de Defesa também para aliados dentro do Domínio Simples.",
    // ⚠ A segunda colocação NÃO aumenta a Defesa de quem usa: ela estende o
    // mesmo bônus aos aliados, e efeito no OUTRO não tem canal (a ficha só
    // conhece a si mesma). Por isso a expressão ignora `n`.
    notaVezes: "a 2ª estende aos aliados, sem somar na sua Defesa",
  },
  {
    id: "acerto",
    nome: "Bônus de Acerto",
    max: null,
    canal: "bonusAcerto",
    // Cada colocação soma outra metade da Maestria (autor, 2026-08-07). O livro
    // só diz "aumentando o bônus", sem número, e o irmão dele (Dano Adicional)
    // repete o próprio valor base.
    expr: (n) => (n > 1 ? `piso(maestria / 2) * ${n}` : "piso(maestria / 2)"),
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
    expr: (n) => String(2 * n),
    descricao:
      "Os ataques do usuário do Domínio Simples tem seu dano aumentado em 2 níveis enquanto ele " +
      "estiver ativo. Este dano é considerado Durante Ataque e o efeito pode ser colocado mais " +
      "de uma vez, aumentando +2 níveis para cada outra vez.",
  },
  {
    id: "especial",
    nome: "Efeito Especial",
    max: null,
    canal: null,
    livre: true,
    descricao:
      "O Domínio Simples possui um efeito único, desenvolvido pelo Jogador e aprovado pelo " +
      "Narrador. Exemplos seriam: possuir alcance para ataques corpo a corpo igual a área do " +
      "Domínio Simples ou poder manipular o tamanho do seu Domínio Simples.",
  },
];

const EFEITO_BY_ID = Object.fromEntries(EFEITOS_MODIFICACAO.map((e) => [e.id, e]));
export const getEfeitoModificacao = (id) => EFEITO_BY_ID[id] ?? null;

/* ============================================================ */
/* ESTADO DA BANCADA                                             */
/* ============================================================ */
/**
 * O interruptor de uma Técnica de Estilo na Simulação de Combate. Mesmo
 * desenho do `estadoDaUnica` das Ferramentas: instância da ficha, e não linha
 * de catálogo, então o id é gerado e entra pelos `estadosExtras`.
 *
 * Uma Modificação SEMPRE tem interruptor (os efeitos dela só valem "enquanto o
 * Domínio Simples estiver ativo"). Uma Especial só tem quando alguma linha dela
 * é marcada como ativa.
 */
export const estadoDoEstilo = (id) => `estilo_${String(id).replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`;

/* ============================================================ */
/* FICHA                                                         */
/* ============================================================ */
/* Uma Técnica de Estilo na ficha (`creature.estilosSombra`):
     {
       id, nome, tipo: "modificacao" | "especial", descricao,
       // só na modificacao: quais efeitos da tabela, e quantas vezes cada um
       efeitosModificacao: [{ id, vezes }],
       // o Motor livre. Na modificacao é o Efeito Especial; na especial é a
       // técnica inteira.
       efeitos: [{ canal, alvo?, expr, quando?, duracao?, modo? }],
     } */

let estiloSeq = 0;

export function createBlankEstilo(tipo = "modificacao") {
  estiloSeq += 1;
  return {
    id: `est_${Date.now().toString(36)}_${estiloSeq}`,
    nome: "",
    tipo: ESTILO_TIPO_LABEL[tipo] ? tipo : "modificacao",
    descricao: "",
    efeitosModificacao: [],
    efeitos: [],
  };
}

const inteiro = (v, min, max) => {
  const n = Math.trunc(Number(v) || 0);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

/** As Técnicas de Estilo da ficha, saneadas e sem id repetido. */
export function estilosDaFicha(creature) {
  const brutas = Array.isArray(creature?.estilosSombra) ? creature.estilosSombra : [];
  const vistos = new Set();
  const out = [];
  for (const b of brutas) {
    if (!b || typeof b !== "object") continue;
    const id = String(b.id ?? "").trim();
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    const tipo = ESTILO_TIPO_LABEL[b.tipo] ? b.tipo : "modificacao";
    // Um efeito por id, com as colocações somadas e aparadas no teto do
    // catálogo. Duplicata na ficha vira repetição, que é o que ela significa.
    const porId = new Map();
    if (tipo === "modificacao") {
      for (const e of Array.isArray(b.efeitosModificacao) ? b.efeitosModificacao : []) {
        const def = EFEITO_BY_ID[e?.id];
        if (!def) continue;
        const vezes = inteiro(e.vezes ?? 1, 1, def.max ?? 99);
        const atual = porId.get(def.id) ?? 0;
        porId.set(def.id, inteiro(atual + vezes, 1, def.max ?? 99));
      }
    }
    out.push({
      id,
      nome: String(b.nome ?? "").trim(),
      tipo,
      descricao: String(b.descricao ?? ""),
      efeitosModificacao: [...porId].map(([eid, vezes]) => ({ id: eid, vezes })),
      efeitos: Array.isArray(b.efeitos) ? b.efeitos : [],
    });
  }
  return out;
}

/** O Estilo está disponível para esta criatura? */
export const estiloDisponivel = (origemId, nd) =>
  origemId === ESTILO_ORIGEM && (nd ?? 1) >= ESTILO_ND_MINIMO;

/* ============================================================ */
/* RESOLVEDOR                                                    */
/* ============================================================ */
/**
 * Resolve as Técnicas de Estilo da ficha.
 *
 * `dom` é o Nível de Aptidão em Domínio EFETIVO, que é o orçamento de efeitos
 * de cada Modificação. Ele não limita a quantidade de Técnicas: quem limita é o
 * contador da aba, resolvido no deriveAfty junto dos Feitiços.
 *
 * Devolve { disponivel, linhas, gastos, estados, avisos }, onde `linhas` já traz
 * o orçamento de efeitos de cada Modificação resolvido, para a UI só exibir.
 */
export function resolveEstilos(creature, { origemId = null, nd = 1, dom = 0 } = {}) {
  const disponivel = estiloDisponivel(origemId, nd);
  const linhas = estilosDaFicha(creature);
  const avisos = [];
  const estados = [];

  const orcamentoEfeitos = Math.max(0, Math.trunc(Number(dom) || 0));

  const resolvidas = linhas.map((l) => {
    const nome = l.nome || (l.tipo === "modificacao" ? "Modificação Sem Nome" : "Técnica Sem Nome");
    const efeitos = l.efeitosModificacao.map((e) => ({
      ...e,
      def: EFEITO_BY_ID[e.id],
    }));
    const gastoEfeitos = efeitos.reduce((s, e) => s + e.vezes, 0);
    const excedeuEfeitos = l.tipo === "modificacao" && gastoEfeitos > orcamentoEfeitos;
    if (excedeuEfeitos) {
      avisos.push(`${nome}: ${gastoEfeitos} efeitos escolhidos, o Nível de Aptidão em Domínio permite ${orcamentoEfeitos}.`);
    }
    // Interruptor da bancada. A Modificação sempre tem um (ela só vale com o
    // Domínio Simples no ar); a Especial só quando alguma linha é ativa.
    const temAtiva = (l.efeitos ?? []).some((e) => e?.modo === "ativa" && String(e?.expr ?? "").trim());
    const precisaEstado = l.tipo === "modificacao" || temAtiva;
    if (disponivel && precisaEstado) {
      estados.push({
        id: estadoDoEstilo(l.id),
        label: l.tipo === "modificacao" ? `${nome} (Domínio Simples)` : nome,
      });
    }
    return {
      ...l,
      nome,
      efeitos: l.efeitos,
      efeitosModificacao: efeitos,
      gastoEfeitos,
      orcamentoEfeitos,
      excedeuEfeitos,
      estado: precisaEstado ? estadoDoEstilo(l.id) : null,
    };
  });

  // A Técnica gravada numa ficha que perdeu o acesso (trocou de origem, ou o ND
  // caiu abaixo de 4) NÃO é apagada: ela some da conta e volta sozinha se o
  // acesso voltar. Mesma convenção do aparo de níveis em resolveNiveisAptidao.
  if (!disponivel && linhas.length) {
    avisos.push(
      origemId === ESTILO_ORIGEM
        ? `Novo Estilo da Sombra destrava no Nível ${ESTILO_ND_MINIMO}.`
        : "As Técnicas de Estilo gravadas não valem: o Novo Estilo da Sombra é do Sem Técnica.",
    );
  }

  return {
    disponivel,
    ndMinimo: ESTILO_ND_MINIMO,
    linhas: resolvidas,
    // O que a aba cobra do contador de Habilidades. Zero sem acesso.
    gastos: disponivel ? resolvidas.length : 0,
    orcamentoEfeitos,
    estados,
    avisos,
  };
}

/**
 * Efeitos das Técnicas de Estilo no vocabulário do Motor.
 *
 * Todos levam `exclusivo: "estiloSombra"` (a sexta família do pool que não
 * acumula) e, quando presos a um interruptor, `quando` mais
 * `duracao: "temporaria"`.
 *
 * ⚠ Entrada inválida é descartada em silêncio, igual ao `efeitosDaTecnica`: a
 * validação de expressão e a mensagem de erro são da UI, que pinta a linha de
 * vermelho na hora de escrever.
 */
export function efeitosDoEstilo(creature, ctx = {}) {
  const resolvido = resolveEstilos(creature, ctx);
  if (!resolvido.disponivel) return [];
  const out = [];

  for (const l of resolvido.linhas) {
    const origem = `estilo:${l.id}`;
    const quando = l.estado;

    // ---- Efeitos de TABELA (só a Modificação) ----
    for (const e of l.efeitosModificacao) {
      const def = e.def;
      if (!def?.canal || typeof def.expr !== "function") continue;
      const expr = def.expr(e.vezes);
      if (!expr) continue;
      out.push({
        canal: def.canal,
        expr,
        quando,
        duracao: "temporaria",
        exclusivo: "estiloSombra",
        origem,
        nome: `${l.nome} · ${def.nome}`,
      });
    }

    // ---- Motor LIVRE (Efeito Especial da Modificação, e a Técnica Especial) ----
    for (const e of l.efeitos ?? []) {
      const canal = String(e?.canal ?? "").trim();
      const expr = String(e?.expr ?? "").trim();
      if (!canal || !expr) continue;
      const ef = {
        canal,
        expr,
        exclusivo: "estiloSombra",
        origem,
        nome: l.nome,
      };
      if (e.alvo) ef.alvo = e.alvo;
      // A Modificação inteira depende do Domínio Simples estar no ar, então o
      // interruptor dela vale também para as linhas livres. Um `quando` escrito
      // à mão soma por cima, com E.
      const gatilhos = [];
      if (l.tipo === "modificacao" || e.modo === "ativa") {
        if (quando) gatilhos.push(quando);
      }
      if (e.quando) gatilhos.push(`(${String(e.quando).trim()})`);
      if (gatilhos.length) ef.quando = gatilhos.join(" && ");
      // Preso a interruptor é sempre temporário: ele não pode contar para
      // pré-requisito, que é a regra do autor para tudo que liga e desliga.
      if (gatilhos.length || e.duracao === "temporaria") ef.duracao = "temporaria";
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
  for (const e of EFEITOS_MODIFICACAO) {
    if (!e.id) erros.push(`EFEITOS_MODIFICACAO: entrada sem id (${e.nome ?? "?"}).`);
    if (vistos.has(e.id)) erros.push(`EFEITOS_MODIFICACAO: id duplicado "${e.id}".`);
    vistos.add(e.id);
    if (!e.nome) erros.push(`EFEITOS_MODIFICACAO: "${e.id}" sem nome.`);
    if (!e.descricao) erros.push(`EFEITOS_MODIFICACAO: "${e.id}" sem descrição.`);
    // Canal e expressão andam juntos: um sem o outro é efeito morto ou linha
    // sem valor. O efeito de mesa declara os dois como ausentes.
    if (e.canal && typeof e.expr !== "function") {
      erros.push(`EFEITOS_MODIFICACAO: "${e.id}" declara canal sem expressão.`);
    }
    if (!e.canal && typeof e.expr === "function") {
      erros.push(`EFEITOS_MODIFICACAO: "${e.id}" declara expressão sem canal.`);
    }
    if (e.max != null && e.max < 1) erros.push(`EFEITOS_MODIFICACAO: "${e.id}" tem max menor que 1.`);
  }
  return erros;
}
