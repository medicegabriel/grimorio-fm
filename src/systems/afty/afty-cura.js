/**
 * ============================================================
 * CURA — as linhas de cura da criatura
 * ============================================================
 * Irmão do `resolveDano` (afty-pericias.js): uma LINHA por fonte, cada uma com
 * a rolagem que ela produz, e o Motor de Automação escrevendo por cima.
 *
 * A diferença para o Dano é de onde vem o número. O dano da criatura sai de uma
 * FÓRMULA única (ND, Patamar, atributo-chave), e por isso o catálogo de armas
 * não guarda dado nenhum. A cura não tem fórmula: cada poder escreve a rolagem
 * dele no próprio texto ("2d6 + seu modificador de presença ou sabedoria"), e
 * elas não se parecem entre si. Então aqui o catálogo diz só QUE LINHA EXISTE e
 * quando, e TODO número entra pelo Motor, nomeando a linha em `alvo`:
 *
 *   { canal: "curaDados", alvo: "cura_energia_reversa", expr: "..." }
 *
 * Nomear a linha não é enfeite: `curaFixa` SEM alvo é o que "em toda cura que
 * realizar" (Medicina Infalível) significa, então o alvo é o que impede o bônus
 * de uma fonte de vazar para as outras.
 *
 * ------------------------------------------------------------
 * A ANATOMIA DE UMA LINHA
 * ------------------------------------------------------------
 * A mesma dos três canais de Regeneração, e pelo mesmo motivo: uma cura é
 * `NdF + fixo`, e cada pedaço tem canal próprio.
 *
 *   curaDados  → N     curaFaces → F     curaFixa → fixo
 *
 * Mais três que a Regeneração não precisa, porque cura é gasto de AÇÃO:
 *
 *   curaUsos   → quantas vezes por descanso
 *   curaPontos → o teto de PER ou PE gastáveis de uma vez
 *   curaPorDado (+ curaPorDadoTeto) → soma por dado rolado
 *
 * ------------------------------------------------------------
 * POR PONTO GASTO (autor, 2026-08-03)
 * ------------------------------------------------------------
 * Energia Reversa e Regeneração Corporal cobram por ponto e escalam por ponto:
 * "para cada ponto de energia reversa gasto, você se cura em 2d6" e "nos níveis
 * 10, 15 e 20, a cura aumenta em 1d6" valem POR PONTO, e não uma vez na
 * rolagem. Um ND 20 gastando 3 PER rola 3 × 5d6, e não 6d6 + 3d6.
 *
 * ⚠ O MODIFICADOR NÃO. Ele entra UMA vez, porque o texto diz "somando seu
 * modificador ao TOTAL de cura". Por isso `curaDados` é por bloco e `curaFixa`
 * é do uso inteiro, e a linha mostra os dois separados.
 *
 * ------------------------------------------------------------
 * ESPELHO DE CURA E ESPELHO DE DANO SÃO DIFERENTES
 * ------------------------------------------------------------
 * Descarga Reanimadora copia uma CURA pronta, que já contém Medicina Infalível,
 * Apanhador de Saúde e outros bônus globais. Aplicá-los outra vez duplicaria.
 *
 * Puxar um Ar e Insistência copiam o ATAQUE BÁSICO. Ele não contém bônus de
 * cura, então os dados e o valor fixo do ataque viram a base da nova rolagem e
 * os canais globais de cura entram uma vez sobre ela.
 *
 * Item que cura é flat pelo mesmo motivo: "curando-se em 10 pontos de vida" é
 * um número do talismã, não uma cura que a criatura realiza.
 * ============================================================
 */

import { valorCanal, detalhesDoCanal } from "./afty-efeitos";
// Mesmo formatador da linha de dano, de propósito: `3d8+5` é a mesma notação
// nos dois lugares, e uma segunda cópia divergiria na primeira errata.
import { textoDeDano as textoDeRolagem } from "./afty-pericias";

/* ============================================================ */
/* CATÁLOGO DE LINHAS                                            */
/* ============================================================ */
/**
 * `requer` diz quando a linha existe, e é a ÚNICA coisa que o catálogo decide
 * sozinho junto do alcance. Os números todos vêm do Motor.
 *
 * `unidade` marca a fonte que cobra por ponto: `porBloco` é quanto custa cada
 * bloco de dados ("2 pontos de energia" da Regeneração Corporal), e o teto de
 * pontos por uso vem do canal `curaPontos`.
 *
 * `alcance` é rótulo, não número, então mora aqui: quem cura só a si mesmo,
 * quem alcança o toque e quem divide entre o grupo. As Aptidões que ampliam o
 * alcance não têm efeito numérico nenhum, e é só isso que elas fazem.
 */
export const FONTES_CURA = [
  {
    // "Sua capacidade básica é se curar: para cada ponto de energia reversa
    // gasto, você se cura em 2d6, somando seu modificador de presença ou
    // sabedoria ao total de cura."
    id: "cura_energia_reversa",
    nome: "Energia Reversa",
    grupo: "aptidao",
    requer: (c) => c.aptidoes.includes("energia_reversa"),
    unidade: { rotulo: "PER", porBloco: 1 },
    // "Você se torna capaz de curar outras criaturas utilizando a habilidade
    // Energia Reversa, desde que estejam dentro do seu alcance de toque" e, com
    // a Cura em Grupo, "dividir o total do resultado entre todas as criaturas".
    alcance: (c) => (
      c.aptidoes.includes("cura_em_grupo") ? "Grupo"
        : c.aptidoes.includes("liberacao_de_energia_reversa") ? "Toque"
          : "Você"
    ),
  },
  {
    // "Como uma ação comum, você pode gastar até 2 pontos de energia amaldiçoada
    // para se curar; para cada 2 pontos gastos, você se cura em 2d6 + seu
    // modificador de constituição ou presença."
    // ⚠ "Você não pode curar outras pessoas desta maneira", então o alcance é
    // fixo e nenhuma aptidão de Maldição o amplia.
    id: "cura_regeneracao_corporal",
    nome: "Regeneração Corporal",
    grupo: "aptidao",
    requer: (c) => c.aptidoes.includes("mal_regeneracao_corporal"),
    unidade: { rotulo: "PE", porBloco: 2 },
    alcance: () => "Você",
  },
  {
    // "Você pode, como uma ação bônus, curar uma criatura em alcance de toque em
    // um valor igual a 2d6 + seu modificador de Presença ou Sabedoria."
    id: "cura_suporte_em_combate",
    nome: "Suporte em Combate",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("sup_suporte_em_combate"),
    alcance: () => "Toque",
  },
  {
    // "você pode usar sua ação bônus para se curar em um valor igual a 1d10 + o
    // dobro do seu modificador de Constituição + bônus de treinamento."
    id: "cura_revigorar",
    nome: "Revigorar",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("cmb_revigorar"),
    alcance: () => "Você",
  },
  {
    // "você pode escolher se manter de pé e curar em 3d10 + nível de personagem."
    id: "cura_ainda_de_pe",
    nome: "Ainda de Pé",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("res_ainda_de_pe"),
    alcance: () => "Você",
  },
  {
    // "realizar uma rolagem do seu dano desarmado e se curar nesse valor."
    id: "cura_puxar_um_ar",
    nome: "Puxar um Ar",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("lut_puxar_um_ar"),
    espelhaDanoBasico: true,
    alcance: () => "Você",
  },
  {
    // "curando-se em um valor igual a uma rolagem de dano do seu ataque
    // desarmado."
    id: "cura_insistencia",
    nome: "Insistência",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("lut_insistencia"),
    espelhaDanoBasico: true,
    alcance: () => "Você",
  },
  {
    // "Curar a você em 2d10 + seu modificador de Sabedoria ou Presença."
    // A rolagem é do companheiro amaldiçoado, mas quem sara é o dono, então a
    // linha é da ficha dele.
    id: "cura_invocacao_as",
    nome: "Invocação Às",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("ctr_invocacao_as"),
    alcance: () => "Você",
  },
  {
    // "recupere pontos de vida igual a uma rolagem da sua cura de Suporte em
    // Combate."
    id: "cura_descarga_reanimadora",
    nome: "Descarga Reanimadora",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("sup_descarga_reanimadora"),
    espelha: "cura_suporte_em_combate",
    alcance: () => "Toque",
  },
  {
    // "Um remédio cura em um valor igual a sua cura da habilidade Suporte em
    // Combate, dura 1 dia e consome uma ação comum para ser usado."
    id: "cura_criar_medicina",
    nome: "Criar Medicina",
    grupo: "habilidade",
    requer: (c) => c.habilidades.includes("sup_criar_medicina"),
    espelha: "cura_suporte_em_combate",
    alcance: () => "Toque",
  },
];

const FONTE_BY_ID = Object.fromEntries(FONTES_CURA.map((f) => [f.id, f]));
export const getFonteCura = (id) => FONTE_BY_ID[id] ?? null;

/* ============================================================ */
/* RESOLVER                                                      */
/* ============================================================ */

const inteiro = (v) => Math.trunc(Number(v) || 0);

/**
 * Fecha o bônus por dado por FONTE. O teto acompanha somente a fonte que o
 * declarou: o limite do Apanhador de Saúde não pode aparar um bônus separado
 * escrito no Funcionamento Básico.
 */
function resolveCuraPorDado(ef, alvo) {
  if (!ef) return null;
  const bonus = detalhesDoCanal(ef, "curaPorDado", alvo);
  if (!bonus.length) return null;

  const chave = (p) => `${p.origem ?? ""}\u0000${p.nome ?? ""}`;
  const tetos = new Map();
  for (const p of detalhesDoCanal(ef, "curaPorDadoTeto", alvo)) {
    const k = chave(p);
    tetos.set(k, (tetos.get(k) ?? 0) + inteiro(p.valor));
  }

  const agrupadas = new Map();
  for (const p of bonus) {
    const k = chave(p);
    const atual = agrupadas.get(k) ?? { label: p.nome, valor: 0, teto: null };
    atual.valor += inteiro(p.valor);
    agrupadas.set(k, atual);
  }
  for (const [k, p] of agrupadas) {
    if (tetos.has(k)) p.teto = Math.max(0, tetos.get(k));
  }

  return { parcelas: [...agrupadas.values()] };
}

/** O custo de UM bloco, por extenso: "PER" quando é um, "2 PE" quando são dois. */
export const rotuloBloco = (u) => (u.porBloco === 1 ? u.rotulo : `${u.porBloco} ${u.rotulo}`);

/**
 * Fecha uma linha no gasto escolhido pela Ficha Final.
 *
 * `blocos` conta compras da cura, não pontos da moeda. Na Energia Reversa um
 * bloco custa 1 PER. Na Regeneração Corporal um bloco custa 2 PE. O retorno
 * separa os dois para a interface nunca exibir algo ambíguo como "3 2 PE".
 *
 * O bônus por dado também nasce aqui, porque ele depende da quantidade de
 * dados realmente rolada. Calculá-lo no teto faria uma rolagem de 2 PE receber
 * o bônus reservado ao gasto máximo.
 */
export function curaNoGasto(linha, blocos = 1) {
  if (!linha) return null;
  const limite = linha.unidade ? Math.max(1, inteiro(linha.blocos)) : 1;
  const usados = linha.unidade
    ? Math.min(limite, Math.max(1, inteiro(blocos)))
    : 1;
  const dados = Math.max(0, inteiro(linha.dados)) * usados;
  const porDado = linha.curaPorDado;
  const parcelasPorDado = Array.isArray(porDado?.parcelas)
    ? porDado.parcelas.map((p) => {
      const bruto = dados * inteiro(p.valor);
      const valor = p.teto == null ? bruto : Math.min(bruto, inteiro(p.teto));
      return { label: p.label, valor };
    })
    // Compatibilidade com linhas montadas no formato anterior.
    : porDado
      ? [{
        label: porDado.fontes?.[0] ?? "Bônus por Dado",
        valor: inteiro(porDado.teto) > 0
          ? Math.min(dados * inteiro(porDado.valor), inteiro(porDado.teto))
          : dados * inteiro(porDado.valor),
      }]
      : [];
  const bonusPorDado = parcelasPorDado.reduce((s, p) => s + p.valor, 0);
  const fixo = inteiro(linha.fixoBase ?? linha.fixo) + bonusPorDado;
  const partes = linha.partesDados
    ? [...linha.partesDados]
    : [...(linha.partes || [])];
  if (usados > 1) partes.push({ label: "Gasto", texto: `× ${usados}` });
  if (linha.partesFixas) partes.push(...linha.partesFixas);
  for (const p of parcelasPorDado) partes.push(p);
  const pontos = linha.unidade ? usados * linha.unidade.porBloco : 0;
  return {
    blocos: usados,
    pontos,
    pontosMaximos: linha.unidade ? limite * linha.unidade.porBloco : 0,
    dados,
    fixo,
    bonusPorDado,
    texto: textoDeRolagem(dados, linha.dado, fixo),
    partes,
  };
}

/**
 * Uma linha de cura, já fechada.
 *
 * `dados` é o que UM bloco compra, e é assim que a linha aparece na tela
 * (decisão do autor, 2026-08-03): a Energia Reversa mostra `2d6` com o chip
 * "1 PER, até 4", e não a rolagem do gasto máximo. O total no gasto cheio fica
 * em `dadosNoMaximo`, que é o número que o bônus por dado usa.
 */
function montaLinha({
  id, nome, grupo, alcance, dados, faces, fixoBase, usos, pontos, unidade,
  partesDados, partesFixas, curaPorDado,
}) {
  const blocos = unidade ? Math.max(1, Math.floor(pontos / unidade.porBloco)) : 1;
  const dadosNoMaximo = dados * blocos;
  const dado = `d${faces}`;
  const base = {
    id, nome, grupo, alcance,
    dados, dado, fixoBase,
    usos: usos > 0 ? usos : null,
    unidade: unidade ? { ...unidade, pontos, pontosUsaveis: blocos * unidade.porBloco } : null,
    blocos,
    dadosNoMaximo,
    partesDados,
    partesFixas,
    curaPorDado,
  };
  const noMaximo = curaNoGasto(base, blocos);
  return {
    ...base,
    fixo: noMaximo.fixo,
    // Sem unidade a linha é uma rolagem só, e o texto fecha inteiro. Com
    // unidade o fixo entra uma vez no total e não cabe no `2d6 por PER`.
    texto: unidade ? textoDeRolagem(dados, dado, 0) : noMaximo.texto,
    // A rolagem do uso INTEIRO, no gasto máximo. É o que fecha o hover: a linha
    // mostra o que um ponto compra e o hover mostra onde isso chega. Quem não
    // tem unidade já mostra o total na própria linha, e os dois são iguais.
    textoNoMaximo: noMaximo.texto,
    partes: noMaximo.partes,
  };
}

/**
 * Resolve TODAS as linhas de cura da criatura.
 *
 * ctx = { efeitos, aptidoes, habilidades, itens, hp, danoBasico }
 *   • `efeitos`    — o resultado do Motor (`ef`), de onde saem todos os números.
 *   • `aptidoes` / `habilidades` — os ids escolhidos, para o `requer`.
 *   • `itens`      — as entradas de equipamento, para os itens que curam.
 *   • `hp`         — o PV máximo já fechado, para o item que cura uma fração dele.
 *   • `danoBasico` — a linha do Ataque Básico, para as fontes que a espelham.
 */
export function resolveCura(ctx = {}) {
  const ef = ctx.efeitos || null;
  const cond = {
    aptidoes: Array.isArray(ctx.aptidoes) ? ctx.aptidoes : [],
    habilidades: Array.isArray(ctx.habilidades) ? ctx.habilidades : [],
  };
  const canal = (c, alvo) => (ef ? valorCanal(ef, c, alvo) : 0);
  const fontesDe = (c, alvo) =>
    (ef ? detalhesDoCanal(ef, c, alvo) : []).map((d) => ({ label: d.nome, valor: d.valor }));

  // As FACES valem o MAIOR entre as fontes, e não a soma: a Cura Amplificada
  // troca o d6 por d8, ela não soma 8 faces ao dado. Mesma regra do dado de
  // Regeneração, e o mesmo motivo de ela ler `detalhes` em vez de somar.
  const facesDe = (alvo, piso) => {
    const vistas = (ef ? detalhesDoCanal(ef, "curaFaces", alvo) : []).map((d) => d.valor);
    return Math.max(piso, ...vistas);
  };

  const linhas = [];
  const porId = {};

  for (const f of FONTES_CURA) {
    if (!f.requer(cond)) continue;

    const usos = Math.max(0, inteiro(canal("curaUsos", f.id)));
    const alcance = f.alcance(cond);

    // ---------- Espelho de CURA: copia a rolagem inteira ----------
    // Nenhum canal entra de novo, porque ele já está dentro da cura copiada.
    if (f.espelha) {
      const molde = porId[f.espelha];
      if (!molde) continue;                    // a fonte espelhada não existe
      const texto = textoDeRolagem(molde.dados, molde.dado, molde.fixo);
      const espelhaNome = molde.nome;
      const linha = {
        id: f.id, nome: f.nome, grupo: f.grupo, alcance,
        dados: molde.dados, dado: molde.dado, fixo: molde.fixo,
        usos: usos > 0 ? usos : null,
        unidade: null, blocos: 1, dadosNoMaximo: molde.dados,
        texto, textoNoMaximo: texto, espelhaNome,
        partes: [{ label: espelhaNome, texto }],
      };
      linhas.push(linha);
      porId[f.id] = linha;
      continue;
    }

    // ---------- Espelho de DANO: vira cura e recebe bônus de cura ----------
    // O Ataque Básico não carrega Medicina Infalível nem Apanhador de Saúde.
    // Puxar um Ar e Insistência copiam os dados dele, mas a rolagem resultante
    // é cura e recebe os bônus globais uma vez.
    if (f.espelhaDanoBasico) {
      const molde = ctx.danoBasico;
      if (!molde) continue;
      const espelhaNome = "Ataque Básico";
      const partesFixas = fontesDe("curaFixa", f.id);
      const curaPorDado = resolveCuraPorDado(ef, f.id);
      const base = {
        id: f.id, nome: f.nome, grupo: f.grupo, alcance,
        dados: molde.dados, dado: molde.dado,
        fixoBase: inteiro(molde.fixo) + inteiro(canal("curaFixa", f.id)),
        usos: usos > 0 ? usos : null,
        unidade: null, blocos: 1, dadosNoMaximo: molde.dados,
        espelhaNome,
        partesDados: [{ label: espelhaNome, texto: textoDeRolagem(molde.dados, molde.dado, molde.fixo) }],
        partesFixas,
        curaPorDado,
      };
      const estado = curaNoGasto(base, 1);
      const linha = {
        ...base,
        fixo: estado.fixo,
        texto: estado.texto,
        textoNoMaximo: estado.texto,
        partes: estado.partes,
      };
      linhas.push(linha);
      porId[f.id] = linha;
      continue;
    }

    // ---------- Linha normal ----------
    const dados = Math.max(0, inteiro(canal("curaDados", f.id)));
    if (!dados) continue;                      // sem dados não há cura para mostrar
    const faces = facesDe(f.id, 6);
    const dadoTexto = `d${faces}`;
    const pontos = f.unidade
      ? Math.max(f.unidade.porBloco, inteiro(canal("curaPontos", f.id)))
      : 0;

    // O hover tem de fechar a conta sozinho, então ele mostra os dados (já com
    // as faces finais), o que trocou as faces, a multiplicação pelo gasto
    // máximo e cada parcela fixa.
    const partesDados = fontesDe("curaDados", f.id).map((p) => ({
      label: p.label,
      texto: `${p.valor}${dadoTexto}${f.unidade ? ` por ${rotuloBloco(f.unidade)}` : ""}`,
    }));
    // As FACES só viram linha quando há disputa: com uma fonte só, a linha de
    // dados acima já mostrou o dado e repetir não explica nada. Com duas, a
    // perdedora aparece riscada, que é o mesmo vocabulário do pool exclusivo.
    const fontesFaces = fontesDe("curaFaces", f.id);
    if (fontesFaces.length > 1) {
      for (const p of fontesFaces) {
        partesDados.push({ label: p.label, texto: `d${p.valor}`, ...(p.valor < faces ? { suplantado: true } : {}) });
      }
    }

    const partesFixas = fontesDe("curaFixa", f.id);

    // "+1 de cura por dado, com um limite de cura adicional igual a metade do
    // seu nível" (Apanhador de Saúde). Vale por dado ROLADO, então conta os do
    // gasto máximo, e cai no fixo porque é uma soma no total do uso.
    const fixoBase = inteiro(canal("curaFixa", f.id));

    const linha = montaLinha({
      id: f.id, nome: f.nome, grupo: f.grupo, alcance,
      dados, faces,
      fixoBase,
      usos, pontos, unidade: f.unidade,
      partesDados,
      partesFixas,
      curaPorDado: resolveCuraPorDado(ef, f.id),
    });
    linhas.push(linha);
    porId[f.id] = linha;
  }

  // ---------- Itens que curam ----------
  // Basta CARREGAR: consumir um talismã ou um remédio não pede equipar, e o
  // botão de equipar é dos itens que valem enquanto vestidos. Uma entrada por
  // item, com a quantidade ao lado quando há mais de um.
  for (const e of Array.isArray(ctx.itens) ? ctx.itens : []) {
    const cura = e?.def?.cura;
    if (!cura) continue;
    // "recuperando todos os seus pontos de vida" e "cura metade dos seus pontos
    // de vida" são os dois únicos casos em que o número é do PORTADOR, e não do
    // item. O PV já está fechado quando a cura resolve.
    const fixo = cura.fracaoPV
      ? Math.floor(Math.max(0, inteiro(ctx.hp)) * cura.fracaoPV)
      : inteiro(cura.fixo);
    if (!fixo) continue;
    linhas.push({
      id: `item_${e.uid}`, nome: e.def.nome, grupo: "item",
      alcance: cura.alcance ?? "Você",
      dados: 0, dado: "d6", fixo,
      usos: null, unidade: null, blocos: 1, dadosNoMaximo: 0,
      qtd: e.qtd > 1 ? e.qtd : null,
      texto: String(fixo),
      textoNoMaximo: String(fixo),
      partes: [{ label: e.def.nome, valor: fixo }],
    });
  }

  return { linhas };
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */

/** Confere o catálogo de linhas. Rodar junto dos outros validadores. */
export function validarCatalogoCura() {
  const problemas = [];
  const vistos = new Set();
  for (const f of FONTES_CURA) {
    if (vistos.has(f.id)) problemas.push(`Cura: id repetido "${f.id}"`);
    vistos.add(f.id);
    if (!f.nome) problemas.push(`Cura: ${f.id} sem nome`);
    if (typeof f.requer !== "function") problemas.push(`Cura: ${f.id} sem requer`);
    if (typeof f.alcance !== "function") problemas.push(`Cura: ${f.id} sem alcance`);
    if (f.espelha && !FONTE_BY_ID[f.espelha]) {
      problemas.push(`Cura: ${f.id} espelha "${f.espelha}", que não existe`);
    }
    // Espelho e unidade juntos não têm significado: a linha espelhada copia a
    // rolagem pronta e não multiplica por ponto nenhum.
    if (f.unidade && (f.espelha || f.espelhaDanoBasico)) {
      problemas.push(`Cura: ${f.id} é espelhada e mesmo assim declara unidade`);
    }
    if (f.unidade && !(f.unidade.porBloco > 0)) {
      problemas.push(`Cura: ${f.id} tem unidade sem porBloco`);
    }
  }
  // A ORDEM importa: uma linha só pode espelhar quem já foi resolvida antes
  // dela, senão o molde ainda não existe e a linha some calada.
  const ordem = FONTES_CURA.map((f) => f.id);
  for (const f of FONTES_CURA) {
    if (f.espelha && ordem.indexOf(f.espelha) > ordem.indexOf(f.id)) {
      problemas.push(`Cura: ${f.id} espelha "${f.espelha}", que vem depois dela no catálogo`);
    }
  }
  return problemas;
}

/** Os canais que miram uma linha de cura, para o validador de alvo abaixo. */
const CANAIS_DE_CURA = [
  "curaDados", "curaFaces", "curaFixa", "curaPorDado", "curaPorDadoTeto", "curaUsos", "curaPontos",
];

/**
 * Confere que todo efeito de cura mira uma linha que EXISTE. Vale a pena porque
 * o erro é mudo dos dois lados: `validarMapaEfeitos` só sabe se o canal existe e
 * o `alvo` é string livre, então um `alvo: "cura_suporte_combate"` sem o "em"
 * some sem aviso nenhum, e a habilidade simplesmente não cura.
 *
 * Alvo AUSENTE é legítimo e passa: é o "em toda cura que realizar".
 */
export function validarAlvosDeCura(mapa, nomeDoMapa = "efeitos") {
  const problemas = [];
  for (const [id, efs] of Object.entries(mapa || {})) {
    for (const e of Array.isArray(efs) ? efs : []) {
      if (!CANAIS_DE_CURA.includes(e?.canal) || !e.alvo) continue;
      if (!FONTE_BY_ID[e.alvo]) {
        problemas.push(`${nomeDoMapa}: ${id} mira a linha de cura "${e.alvo}", que não existe`);
      }
    }
  }
  return problemas;
}
