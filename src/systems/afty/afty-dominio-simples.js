/**
 * ============================================================
 * DOMÍNIO SIMPLES — a área e o custo em PE
 * ============================================================
 * A aptidão que o Sem Técnica recebe de graça no ND 4 e que qualquer origem
 * pode comprar. Ela é o RECIPIENTE do Novo Estilo das Sombras: as Técnicas de
 * Estilo são imbuídas nela, e é por isso que o custo dela cresce com a
 * combinação que está no ar.
 *
 * ⚠ ATÉ 2026-08-28 O DOMÍNIO SIMPLES NÃO TINHA NÚMERO NENHUM. Ele era uma
 * entrada de catálogo com `descricao` e mais nada, e a área e o custo viviam
 * dentro da prosa. Foi essa falta que deixou três etapas do Treino de Novo
 * Estilo das Sombras sem automação: elas mexem exatamente nesses números, e não
 * havia onde escrever. Ver `docs/a-fazer.md` na entrada que este módulo fechou.
 *
 * ------------------------------------------------------------
 * OS NÚMEROS SÃO DADO DE CATÁLOGO, E NÃO CONSTANTE DAQUI
 * ------------------------------------------------------------
 * Cada aptidão pode carregar um campo `dominioSimples` com a tabela abaixo, e
 * este módulo só a lê. A razão é o REMENDO: o Addon do autor reescreve o
 * Domínio Simples com um modelo de custo que o livro cru não tem, e
 * `remendarLista` troca campo a campo. Com os números aqui dentro, o remendo
 * mudaria o TEXTO e o custo continuaria o antigo, calado, que é exatamente a
 * armadilha que o `coletarEfeitos` teve de resolver em 2026-08-22.
 *
 *   areaBase            metros do raio, antes do Nível de Aptidão em Domínio
 *   areaPorDom          metros a mais por Nível de Aptidão em Domínio
 *   erguer              PE para erguer
 *   erguerPorEstilo     PE a mais por Técnica de Estilo imbuída
 *   sustentar           PE por rodada, do domínio em si
 *   sustentarPorEstilos 1 PE por rodada a cada N Técnicas imbuídas (0 = não paga)
 *
 * ⚠ O CRU NÃO TEM SUSTENTAÇÃO, e é decisão do autor (2026-08-28). O texto do
 * livro diz Concentração e Durabilidade, e quem troca isso por "pagar 2 PE para
 * sustentar" é o Addon. Por isso `sustentar` e `sustentarPorEstilos` nascem em
 * ZERO no padrão: quem não instalou o pacote não passa a pagar um custo que o
 * texto dele não menciona.
 *
 * Texto VERBATIM do livro, que é de onde a área e os 5 PE saem:
 *
 *   "Você pode, com uma Reação contra a expansão de um domínio ou como Ação
 *    Bônus no seu turno, gastar 5 PE e criar uma esfera de X metros de raio a
 *    sua volta (onde X é igual a: 1,5m + Nível de DOM x 1,5 metros)."
 *
 * Texto VERBATIM do remendo, que é de onde o resto sai:
 *
 *   "Para cada rodada após a primeira, é necessário pagar 2 PE para sustentar o
 *    domínio simples."
 *   "Para cada efeito de estilo escolhido, aumente em 1 PE o custo para erguer o
 *    Domínio Simples. Para cada rodada após a primeira, é necessário pagar 1 PE
 *    para cada Dois Estilos adicionados para sustentar os efeitos do Novo Estilo
 *    Das Sombras."
 * ============================================================
 */

/* ⚠ ESTE MÓDULO NÃO IMPORTA NADA, e isso é decisão e não sobra. A leitura dos
   quatro canais chega como as funções `canal` e `fontes`, servidas pelo derive,
   em vez de sair de um `import` do `afty-efeitos.js`.

   O motivo é um CICLO: `afty-efeitos.js` importa `afty-aptidoes.js`, então um
   import daqui para lá fecharia `aptidoes → dominio-simples → efeitos →
   aptidoes` no dia em que o validador abaixo fosse ligado no catálogo de
   Aptidões, que é exatamente o que ele precisa para validar conteúdo de Addon
   de graça. O repositório já tem um ciclo assim documentado em `a-fazer.md`
   (importar `afty-habilidades.js` primeiro estoura), e um segundo não ajuda. */

/** A aptidão. Uma só, e é o que o derive consulta para saber se o card existe. */
export const DOMINIO_SIMPLES_APTIDAO = "dominio_simples";

/**
 * O piso de todo custo em PE do sistema. Mesma constante em espírito que o
 * `Math.max(1, ...)` do `afty-feiticos.js`, e a mesma que a nota do canal
 * `custoPE` promete ("o piso de 1 PE continua valendo").
 */
export const CUSTO_PE_MINIMO = 1;

/**
 * O que vale quando a entrada do catálogo não declara `dominioSimples`.
 *
 * ⚠ Não é "o Domínio Simples do livro", é o PADRÃO de qualquer entrada sem a
 * tabela. Hoje as duas coisas coincidem, e vão deixar de coincidir no dia em que
 * outra aptidão ganhar área e custo.
 */
export const DOMINIO_SIMPLES_PADRAO = {
  areaBase: 1.5,
  areaPorDom: 1.5,
  erguer: 5,
  erguerPorEstilo: 0,
  sustentar: 0,
  sustentarPorEstilos: 0,
};

/**
 * ⚠ `null`, `""` e `false` NÃO são zero aqui, e o teste explícito existe por um
 * bug real: `Number(null)` é 0, que é finito e não negativo, então um
 * `erguer: null` vindo de um Addon passava direto e virava "erguer de graça" em
 * vez de cair no padrão de 5 PE. Custo sumindo calado é o pior desfecho
 * possível, e a coerção do JavaScript o entregava de graça.
 */
const ehNumeroValido = (v) => {
  if (v == null || v === "" || typeof v === "boolean") return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

const numero = (v, padrao = 0) => (ehNumeroValido(v) ? Number(v) : padrao);

/**
 * A tabela de uma entrada de catálogo, saneada. Campo ausente cai no padrão, e
 * campo inválido também: a entrada pode ter vindo de um Addon colado à mão.
 */
export function dadosDoDominioSimples(def) {
  const d = (def && typeof def === "object" && def.dominioSimples) || null;
  if (!d || typeof d !== "object") return { ...DOMINIO_SIMPLES_PADRAO };
  const out = {};
  for (const [k, padrao] of Object.entries(DOMINIO_SIMPLES_PADRAO)) out[k] = numero(d[k], padrao);
  return out;
}

/**
 * Aplica as reduções de um custo e devolve o valor JUNTO das parcelas do hover.
 *
 * ⚠ Custo que já é ZERO continua zero. O piso de 1 PE vale para o que se paga, e
 * não para o que não existe: quem não imbuiu Técnica nenhuma não sustenta nada,
 * e cobrar 1 PE por zero estilos seria inventar custo. É a diferença que a
 * resposta do autor sobre o piso (2026-08-28) obriga a fazer.
 *
 * ⚠ E o PISO VIRA UMA PARCELA quando ele morde. Sem essa linha o painel de
 * fontes mostraria "Base 2, Redução −5" com Total 1, e a soma das parcelas não
 * fecharia o total. Número certo com detalhamento errado é bug.
 */
function custoComPartes(base, partesBase, fontesReducao) {
  if (base <= 0) return { valor: 0, partes: partesBase };
  const reducao = fontesReducao.reduce((s, p) => s + p.valor, 0);
  const bruto = base - reducao;
  const valor = Math.max(CUSTO_PE_MINIMO, bruto);
  const partes = [...partesBase, ...fontesReducao.map((p) => ({ ...p, valor: -p.valor }))];
  if (valor !== bruto) partes.push({ label: `Piso de ${CUSTO_PE_MINIMO} PE`, valor: valor - bruto });
  return { valor, partes };
}

/**
 * Resolve os números do Domínio Simples.
 *
 * `def`        a entrada do catálogo, já remendada pelos Addons.
 * `tem`        a criatura possui a aptidão (escolhida ou concedida).
 * `dom`        Nível de Aptidão em Domínio EFETIVO.
 * `imbuicoes`  quantas Técnicas de Estilo estão imbuídas AGORA. Sai do
 *              `gastoVagas` do resolveEstilos, que lê a bancada e a sessão.
 * `canal`      lê o total de um canal. Vem do derive, ver a nota de ciclo acima.
 * `fontes`     lê as parcelas de um canal, já no formato `{ label, valor }`.
 *
 * ⚠ Os quatro canais moram em `CANAIS_POS_APTIDAO` e não no estágio principal,
 * pelo mesmo encaixe do `imbuicoesEstilo`: eles leem `dom`, que o pré-contexto
 * ainda não tem, e precisam estar prontos antes deste resolvedor.
 */
export function resolveDominioSimples({
  def = null, tem = false, dom = 0, imbuicoes = 0,
  canal = () => 0, fontes = () => [],
} = {}) {
  const t = dadosDoDominioSimples(def);
  const nivel = Math.max(0, Math.trunc(Number(dom) || 0));
  const estilos = Math.max(0, Math.trunc(Number(imbuicoes) || 0));

  /* ---------- ÁREA ---------- */
  const areaBonus = canal("areaDominioSimples");
  const area = Math.max(0, t.areaBase + nivel * t.areaPorDom + areaBonus);
  /* ⚠ O rótulo NÃO escreve o multiplicador. "Nível de Aptidão em Domínio × 1,5"
     é a fórmula na tela, que é o que a regra de UI proíbe, e ainda sairia com
     ponto decimal em vez de vírgula. O painel de fontes já mostra o valor que a
     parcela vale, que é o que o leitor precisa. */
  const partesArea = [
    { label: "Base", valor: t.areaBase },
    ...(nivel > 0 ? [{ label: "Nível de Aptidão em Domínio", valor: nivel * t.areaPorDom }] : []),
    ...fontes("areaDominioSimples"),
  ];

  const rotuloEstilos = `${estilos} ${estilos === 1 ? "Técnica imbuída" : "Técnicas imbuídas"}`;

  /* ---------- ERGUER ---------- */
  const erguerPorEstilo = t.erguerPorEstilo * estilos;
  const { valor: custoErguer, partes: partesErguer } = custoComPartes(
    t.erguer + erguerPorEstilo,
    [
      { label: "Base", valor: t.erguer },
      ...(erguerPorEstilo > 0 ? [{ label: rotuloEstilos, valor: erguerPorEstilo }] : []),
    ],
    fontes("custoErguerDominio"),
  );

  /* ---------- SUSTENTAR: o domínio ---------- */
  const { valor: custoSustentar, partes: partesSustentar } = custoComPartes(
    t.sustentar,
    [{ label: "Base", valor: t.sustentar }],
    fontes("custoSustentarDominio"),
  );

  /* ---------- SUSTENTAR: as Técnicas de Estilo ----------
     "1 PE para cada Dois Estilos adicionados". Três Técnicas fecham um par só,
     então o arredondamento é para BAIXO, que é a regra geral do Afty. */
  const porEstilos = t.sustentarPorEstilos > 0
    ? Math.floor(estilos / t.sustentarPorEstilos)
    : 0;
  const { valor: custoSustentarEstilo, partes: partesSustentarEstilo } = custoComPartes(
    porEstilos,
    [{ label: rotuloEstilos, valor: porEstilos }],
    fontes("custoSustentarEstilo"),
  );

  return {
    tem: !!tem,
    // O modelo de custo TEM sustentação? O livro cru não tem, e é o que decide
    // se a tela mostra a linha ou a esconde. Zero não é a mesma coisa que
    // ausente: um Addon pode zerar a sustentação de propósito.
    sustenta: t.sustentar > 0 || t.sustentarPorEstilos > 0,
    imbuicoes: estilos,
    area,
    partesArea,
    custoErguer,
    partesErguer,
    custoSustentar,
    partesSustentar,
    custoSustentarEstilo,
    partesSustentarEstilo,
    custoSustentarTotal: custoSustentar + custoSustentarEstilo,
  };
}

/* ============================================================ */
/* VALIDADOR DO CATÁLOGO                                        */
/* ============================================================ */
/**
 * Confere a tabela `dominioSimples` de toda entrada que a declara. Roda sobre o
 * catálogo JÁ REMENDADO, então ele valida o conteúdo de Addon de graça, que é a
 * promessa que o registro de famílias faz.
 */
export function validarCatalogoDominioSimples(lista = []) {
  const erros = [];
  for (const def of lista) {
    const d = def?.dominioSimples;
    if (d == null) continue;
    const onde = `dominioSimples de "${def.id}"`;
    if (typeof d !== "object" || Array.isArray(d)) {
      erros.push(`${onde}: deveria ser um objeto de números.`);
      continue;
    }
    for (const [k, v] of Object.entries(d)) {
      if (!(k in DOMINIO_SIMPLES_PADRAO)) {
        erros.push(`${onde}: campo desconhecido "${k}". Os aceitos são ${Object.keys(DOMINIO_SIMPLES_PADRAO).join(", ")}.`);
        continue;
      }
      if (!ehNumeroValido(v)) erros.push(`${onde}: "${k}" tem de ser um número não negativo.`);
    }
    // Erguer de graça não existe: o piso de 1 PE do sistema tornaria o número
    // escrito uma mentira, porque a conta o levantaria para 1 de novo.
    if (numero(d.erguer, DOMINIO_SIMPLES_PADRAO.erguer) === 0) {
      erros.push(`${onde}: "erguer" zero não existe, o piso de ${CUSTO_PE_MINIMO} PE do sistema o desmentiria.`);
    }
  }
  return erros;
}
