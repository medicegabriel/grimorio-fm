/**
 * ============================================================
 * ESTADO VITAL: SALDO NEGATIVO, PORTAS DA MORTE E FERIMENTOS COMPLEXOS (CL2, 2026-10-30)
 * ============================================================
 * Livro p.313 e 314. Vale para o Player e para o Afty sem divergência (autor, 2026-10-30).
 *
 * ⚠ UM ESTADO SÓ, `sessao.vital`, para todo corpo. Ele GENERALIZA o que só o Restringido tinha
 * (`especializacaoSessao.pvNegativos` e `falhasMorte`, de Ainda de Pé, Rejeitar a Morte e Mesmo Morto): esses
 * dois campos migraram para cá (`saldo` e `falhas`) e o Restringido ficou só com os MODOS próprios dele
 * (`modoMorte`, `quedaPendente`, `cairNoProximoDano`), que continuam em `especializacaoSessao`. Não existe
 * segundo contador. NÃO COPIA a queda das invocações (`transicaoDeQueda`, Corpo desativado), que é outra regra.
 *
 * ⚠ FOLHA, ZERO IMPORTS. As funções são puras e recebem números e o próprio `vital`. Quem junta isto ao PV, à
 * casca e ao derive é `ficha-sessao.js` (os verbos `aplicaDano` e `aplicaCura`) e `ficha-morte.js` (as operações
 * com `opId`). A aleatoriedade entra por `rng`, e nenhuma rolagem acontece sozinha.
 *
 * O QUE O LIVRO MANDA, e a leitura adotada onde o texto cala (as leituras estão em CL2.md e na fila):
 *
 *   • Chegou a 0 PV: Portas da Morte. No começo de todo turno rola-se um d20: 1 = duas falhas, 2 a 9 = uma
 *     falha, 10 a 19 = um sucesso, 20 = dois sucessos. Três sucessos estabilizam, três falhas matam.
 *   • AS FALHAS PERDURAM até um descanso longo ou até outra fonte as remover. Estabilizar zera os SUCESSOS e
 *     o saldo, e NÃO as falhas.
 *   • Dano enquanto nas Portas: uma falha por ATAQUE (não por tipo de dano). Adotado: o dano também soma ao
 *     saldo negativo (a CD de Medicina usa os PV negativos, e o Restringido já somava o excesso).
 *   • Medicina: ação comum, a 1,5 m, CD 15 + 1 para cada 5 PV negativos. Sucesso estabiliza com 1 PV.
 *   • Cura: precisa quitar TODO o saldo negativo, até voltar ao 0. O que sobra da cura sobe o PV.
 *   • Dano massivo: o dano que deixa em 0 e ainda passa do PV máximo em PV negativos mata sem as Portas.
 *     Adotado: o saldo ACUMULADO passando do máximo também mata. "Passa" é estritamente maior.
 *   • Ferimento Complexo: em UM ataque, metade do PV máximo ou mais, com mínimo de 50 (p.313).
 * ============================================================
 */

export const ESTADOS_VITAIS = ["vivo", "morrendo", "estabilizado", "morto"];
export const FALHAS_PARA_MORRER = 3;
export const SUCESSOS_PARA_ESTABILIZAR = 3;
export const FERIMENTO_DANO_MINIMO = 50;
export const CAUSAS_DE_MORTE = ["falhas", "massivo", "decisao"];

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const naoNegativo = (v) => Math.max(0, inteiro(v));

/* ============================================================ */
/* A TABELA DE FERIMENTOS COMPLEXOS (p.314), verbatim            */
/* ============================================================ */
/** `faixa` é o d10 do livro. `grupo` é a chave de máquina do que o ferimento faz, lida por `restricoesDeFerimentos`. */
export const TABELA_FERIMENTOS = Object.freeze([
  { faixa: [1, 2], grupo: "olho", membro: "Perde um olho.", ferimento: "Tem desvantagem em testes de percepção e ataques a distância." },
  { faixa: [3, 3], grupo: "olhos", membro: "Perde ambos os olhos.", ferimento: "Tem a condição Cego permanentemente, até que regenere os olhos." },
  { faixa: [4, 5], grupo: "perna", membro: "Perde uma perna.", ferimento: "Perde metade do movimento total e recebe desvantagem em rolagens de acrobacia." },
  { faixa: [6, 6], grupo: "pernas", membro: "Perde ambas as pernas.", ferimento: "Não pode se mover normalmente, podendo apenas rastejar." },
  { faixa: [7, 7], grupo: "interna", membro: "Recebe uma ferida interna.", ferimento: "Sempre que tentar realizar uma ação em combate, deve realizar um teste de resistência de Fortitude com CD 20 + nível do personagem. Em uma falha, perde essa ação e não pode usar reações até o seu próximo turno. Ela pode ser tratada por uma criatura mestre em Medicina com uma ação comum. Ao ser tratada, reduz a CD de 20 para 10. (mesma CD do TR de Fortitude)." },
  { faixa: [8, 9], grupo: "braco", membro: "Perde um braço.", ferimento: "Não pode segurar nada com duas mãos e só pode segurar um objeto por vez, além de receber desvantagem em rolagens de atletismo." },
  { faixa: [10, 10], grupo: "bracos", membro: "Perde ambos os braços.", ferimento: "É incapaz de segurar objetos, o valor de Destreza diminui em 4." },
]);

/** A linha da tabela para um resultado de 1 a 10, ou `null`. */
export const linhaDoFerimento = (resultado) => {
  const n = inteiro(resultado, 0);
  return TABELA_FERIMENTOS.find((l) => n >= l.faixa[0] && n <= l.faixa[1]) ?? null;
};

/** O limiar do gatilho: metade do PV máximo ou mais, com valor mínimo de 50 (p.313). */
export const limiarDeFerimento = (hpMax) => Math.max(Math.floor(naoNegativo(hpMax) / 2), FERIMENTO_DANO_MINIMO);

/** A CD do TR de Fortitude da ferida interna: 20 + nível, ou 10 + nível depois de tratada (p.314). */
export const cdDaFeridaInterna = (nivel, tratada = false) => (tratada ? 10 : 20) + naoNegativo(nivel);

/**
 * O que os ferimentos RESTRINGEM, num objeto só, para quem desenha a ficha e quem rola o teste.
 * Quase nada disto tem canal no Motor (a desvantagem em perícia e a mão ocupada não cabem num número), então a
 * ficha DECLARA e quem rola aplica. As duas exceções com canal ficam em `efeitosMotorDoFerimento`.
 */
export function restricoesDeFerimentos(ferimentos = []) {
  const grupos = new Set((Array.isArray(ferimentos) ? ferimentos : []).map((f) => f?.grupo));
  const um = (g) => grupos.has(g);
  const desvantagemPericias = [
    ...(um("olho") ? ["percepcao"] : []),
    ...(um("perna") ? ["acrobacia"] : []),
    ...(um("braco") ? ["atletismo"] : []),
  ];
  return {
    desvantagemPericias: [...new Set(desvantagemPericias)],
    desvantagemAtaqueDistancia: um("olho"),
    cego: um("olhos"),
    metadeDoMovimento: um("perna"),
    apenasRasteja: um("pernas"),
    maosMax: um("bracos") ? 0 : um("braco") ? 1 : 2,
    feridaInterna: um("interna"),
  };
}

/**
 * Os efeitos que TÊM caminho no motor, para a sessão levá-los pelos mecanismos que já existem (condição e Buff de
 * Mesa), sem canal novo. `condicao` vira uma condição persistente (`rodadas: null`), e `buff` vira um Buff de Mesa
 * (`buffsSessao`, também sem prazo). Ambos sobrevivem ao descanso, porque o descanso só tira o que tem rodadas.
 *   • Ambos os olhos: a condição Cego.
 *   • Uma perna: a condição Lento (metade do movimento, o que o texto diz).
 *   • Ambos os braços: Destreza -4 (canal `atributo`, alvo `destreza`).
 * Os demais (desvantagens, mãos, rastejar, ferida interna) ficam em `restricoesDeFerimentos`.
 */
export function efeitosMotorDoFerimento(ferimento) {
  switch (ferimento?.grupo) {
    case "olhos": return { condicao: "Cego" };
    case "perna": return { condicao: "Lento" };
    case "bracos": return { buff: { canal: "atributo", alvo: "destreza", expr: "-4" } };
    default: return {};
  }
}

/* ============================================================ */
/* O ESTADO                                                      */
/* ============================================================ */
export const vitalEmBranco = () => ({
  estado: "vivo",
  saldo: 0,
  sucessos: 0,
  falhas: 0,
  testePendente: false,
  causa: null,
  massivoPendente: false,
  ultimoTeste: null,
  ataque: null,
  ferimentosPendentes: 0,
  semReacoes: false,
  ferimentos: [],
});

function normalizaFerimento(f) {
  if (!f || typeof f !== "object") return null;
  const linha = linhaDoFerimento(f.rolagem);
  if (!linha || typeof f.uid !== "string" || !f.uid) return null;
  return {
    uid: f.uid,
    rolagem: inteiro(f.rolagem),
    grupo: linha.grupo,
    membro: linha.membro,
    ferimento: linha.ferimento,
    rodada: naoNegativo(f.rodada),
    tratado: !!f.tratado,
    permanente: !!f.permanente,
  };
}

/**
 * Lê o estado gravado. `legado` é o `especializacaoSessao` das sessões anteriores a 2026-10-30, que guardavam o
 * saldo em `pvNegativos` e as falhas em `falhasMorte`: o valor MIGRA, e quem normaliza a sessão tira os dois
 * campos antigos de lá. Sem `vital` e sem legado a sessão nasce viva.
 */
export function normalizaVital(bruto, legado = null) {
  const base = vitalEmBranco();
  const antigo = legado && typeof legado === "object" ? legado : null;
  const b = bruto && typeof bruto === "object" ? bruto : null;
  const saldo = naoNegativo(b ? b.saldo : antigo?.pvNegativos);
  const falhas = Math.min(FALHAS_PARA_MORRER, naoNegativo(b ? b.falhas : antigo?.falhasMorte));
  let estado = ESTADOS_VITAIS.includes(b?.estado) ? b.estado : null;
  /* Sessão antiga: a queda do Restringido gravava os PV negativos. Havendo saldo, o corpo estava caído. */
  if (!estado) estado = !b && (saldo > 0 || antigo?.modoMorte) ? "morrendo" : "vivo";
  const ferimentos = (Array.isArray(b?.ferimentos) ? b.ferimentos : []).map(normalizaFerimento).filter(Boolean);
  const a = b?.ataque && typeof b.ataque === "object" && typeof b.ataque.id === "string" && b.ataque.id
    ? { id: b.ataque.id, total: naoNegativo(b.ataque.total), falhou: !!b.ataque.falhou, ferido: !!b.ataque.ferido }
    : null;
  const t = b?.ultimoTeste && typeof b.ultimoTeste === "object"
    ? { natural: inteiro(b.ultimoTeste.natural), falhas: naoNegativo(b.ultimoTeste.falhas), sucessos: naoNegativo(b.ultimoTeste.sucessos), rodada: naoNegativo(b.ultimoTeste.rodada) }
    : null;
  return {
    ...base,
    estado,
    saldo,
    sucessos: Math.min(SUCESSOS_PARA_ESTABILIZAR, naoNegativo(b?.sucessos)),
    falhas,
    testePendente: !!b?.testePendente && estado === "morrendo",
    causa: estado === "morto" && CAUSAS_DE_MORTE.includes(b?.causa) ? b.causa : null,
    massivoPendente: !!b?.massivoPendente && estado === "morrendo",
    ultimoTeste: t,
    ataque: a,
    ferimentosPendentes: naoNegativo(b?.ferimentosPendentes),
    semReacoes: !!b?.semReacoes,
    ferimentos,
  };
}

/** Está nas Portas da Morte (incapaz de agir)? */
export const estaMorrendo = (vital) => vital?.estado === "morrendo";
export const estaMorto = (vital) => vital?.estado === "morto";

/** A CD do teste de Medicina que estabiliza: 15 + 1 para cada 5 PV negativos (p.313). */
export const cdDeMedicina = (saldo) => 15 + Math.floor(naoNegativo(saldo) / 5);

/* ============================================================ */
/* TRANSIÇÕES PURAS                                              */
/* ============================================================ */
const morto = (vital, causa) => ({ ...vital, estado: "morto", causa, testePendente: false, massivoPendente: false });

/** Soma falhas e mata no terceiro. As falhas só caem no descanso longo ou por outra fonte. */
export function comFalhas(vital, n = 1) {
  const falhas = Math.min(FALHAS_PARA_MORRER, vital.falhas + naoNegativo(n));
  const v = { ...vital, falhas };
  return falhas >= FALHAS_PARA_MORRER && v.estado === "morrendo" ? morto(v, "falhas") : v;
}

/**
 * Registra uma perda de vida que levou (ou manteve) o corpo em 0. Pura: não conhece PV temporário nem derive.
 *   hpAntes, hpDepois   o PV de antes e de depois (já aparados em 0)
 *   sobrou              o que passou da casca e chegou à vida
 *   dano                o dano inteiro do ataque, casca inclusa (alimenta o gatilho do Ferimento)
 *   hpMax               o PV máximo, para o dano massivo e para o limiar do Ferimento
 *   ataqueId            identifica o ATAQUE: uma falha e um Ferimento por ataque, mesmo com vários tipos de dano
 *   tipo                "dano" (padrão) ou "perda". Perda de vida (Sangramento, custo, Dano na Alma) entra nas Portas
 *                       mas não é ataque: não dá falha por si e não dispara Ferimento
 *   massivoAdiado       o Restringido com Ainda de Pé disponível: a morte massiva espera a escolha dele
 */
export function registraDano(vital, { hpAntes, hpDepois, sobrou = 0, dano = 0, hpMax = 0, ataqueId = null, tipo = "dano", massivoAdiado = false } = {}) {
  if (vital.estado === "morto") return { vital, caiu: false, morreu: false, falhaPorDano: false, ferimento: false };
  const eDano = tipo !== "perda";
  let v = { ...vital };
  const antes = naoNegativo(hpAntes);
  const depois = naoNegativo(hpDepois);

  /* O Ferimento Complexo: a conta é do ATAQUE inteiro, e cada ataque dispara uma vez. Sem id, cada chamada é um ataque. */
  let ferimento = false;
  if (eDano && naoNegativo(dano) > 0) {
    const a = ataqueId && v.ataque?.id === ataqueId
      ? { ...v.ataque }
      : { id: ataqueId || null, total: 0, falhou: false, ferido: false };
    a.total += naoNegativo(dano);
    if (!a.ferido && naoNegativo(hpMax) > 0 && a.total >= limiarDeFerimento(hpMax)) {
      a.ferido = true;
      ferimento = true;
      v.ferimentosPendentes = naoNegativo(v.ferimentosPendentes) + 1;
    }
    v.ataque = a.id ? a : null;
  }

  let caiu = false;
  let falhaPorDano = false;
  if (depois === 0) {
    const excesso = Math.max(0, naoNegativo(sobrou) - antes);
    if (antes > 0) {
      v = { ...v, estado: "morrendo", saldo: excesso, sucessos: 0, testePendente: false };
      caiu = true;
    } else if (v.estado === "morrendo") {
      v.saldo = naoNegativo(v.saldo) + naoNegativo(sobrou);
      if (eDano && naoNegativo(sobrou) > 0 && !(v.ataque?.falhou)) {
        v = comFalhas(v, 1);
        falhaPorDano = true;
        if (v.ataque) v.ataque = { ...v.ataque, falhou: true };
      }
    } else if (naoNegativo(sobrou) > 0) {
      /* Já estava em 0 sem estar nas Portas (estabilizado por cura exata, ou o PV foi posto em 0 à mão): o golpe é a queda. */
      v = { ...v, estado: "morrendo", saldo: naoNegativo(sobrou), sucessos: 0, testePendente: false };
      caiu = true;
    }
    /* O ataque que derrubou não dá, ele mesmo, a falha por dano: um segundo tipo de dano do MESMO ataque chega com o
       corpo já nas Portas e não pode contar como golpe novo. */
    if (caiu && v.ataque) v.ataque = { ...v.ataque, falhou: true };
    /* Dano massivo: o saldo negativo passando do PV máximo mata sem as Portas, salvo a escolha do Restringido. */
    if (v.estado === "morrendo" && naoNegativo(hpMax) > 0 && v.saldo > naoNegativo(hpMax)) {
      v = massivoAdiado ? { ...v, massivoPendente: true } : morto(v, "massivo");
    }
  }
  return { vital: v, caiu, morreu: v.estado === "morto", falhaPorDano, ferimento };
}

/** Abre o teste de morte do turno. Quem está de pé por Mesmo Morto (Restringido) não está nas Portas e não rola. */
export function abreTesteDeMorte(vital, { suprime = false } = {}) {
  if (vital.estado !== "morrendo" || suprime) return vital;
  return vital.testePendente ? vital : { ...vital, testePendente: true };
}

/**
 * Resolve o d20 do teste de morte (p.313): 1 duas falhas, 2 a 9 uma falha, 10 a 19 um sucesso, 20 dois sucessos.
 * Devolve `{ vital, falhas, sucessos, estabilizou, morreu }`. Três sucessos estabilizam com 1 PV (a definição de
 * "estabilizado" da p.313), cabendo a quem chama pôr o PV. O saldo e os sucessos zeram, as falhas ficam.
 */
export function resolveTesteDeMorte(vital, natural, rodada = 0) {
  const n = inteiro(natural, 0);
  const falhas = n <= 1 ? 2 : n <= 9 ? 1 : 0;
  const sucessos = n >= 20 ? 2 : n >= 10 ? 1 : 0;
  let v = { ...vital, testePendente: false, ultimoTeste: { natural: n, falhas, sucessos, rodada: naoNegativo(rodada) } };
  if (falhas) v = comFalhas(v, falhas);
  if (v.estado === "morto") return { vital: v, falhas, sucessos, estabilizou: false, morreu: true };
  v.sucessos = Math.min(SUCESSOS_PARA_ESTABILIZAR, v.sucessos + sucessos);
  if (v.sucessos >= SUCESSOS_PARA_ESTABILIZAR) {
    return { vital: { ...v, estado: "vivo", saldo: 0, sucessos: 0, massivoPendente: false }, falhas, sucessos, estabilizou: true, morreu: false };
  }
  return { vital: v, falhas, sucessos, estabilizou: false, morreu: false };
}

/** Estabiliza (Medicina, ou a decisão de quem chama): sai das Portas com 1 PV e as falhas ficam. */
export const estabilizado = (vital) => ({ ...vital, estado: "vivo", saldo: 0, sucessos: 0, testePendente: false, massivoPendente: false });

/**
 * Aplica uma cura ao saldo (p.313): ela quita PRIMEIRO os PV negativos, e só o que sobra sobe o PV. Quitar tudo
 * estabiliza. `hpAntes` é o PV de antes da cura.
 * Devolve `{ vital, hpDepois, abatido, recusada }`. `hpDepois` ainda não está aparado no máximo.
 */
export function curaNoSaldo(vital, hpAntes, cura) {
  const c = naoNegativo(cura);
  const antes = naoNegativo(hpAntes);
  if (vital.estado === "morto") return { vital, hpDepois: antes, abatido: 0, recusada: true };
  if (!c) return { vital, hpDepois: antes, abatido: 0, recusada: false };
  if (vital.estado !== "morrendo") {
    const viva = vital.estado === "estabilizado" ? { ...vital, estado: "vivo" } : vital;
    return { vital: viva, hpDepois: antes + c, abatido: 0, recusada: false };
  }
  const abatido = Math.min(c, naoNegativo(vital.saldo));
  const saldo = naoNegativo(vital.saldo) - abatido;
  const resto = c - abatido;
  if (saldo > 0) return { vital: { ...vital, saldo }, hpDepois: 0, abatido, recusada: false };
  const quitado = { ...vital, saldo: 0, sucessos: 0, testePendente: false, massivoPendente: false, estado: resto > 0 ? "vivo" : "estabilizado" };
  return { vital: quitado, hpDepois: resto, abatido, recusada: false };
}

/**
 * A cura comum aplicada a uma SESSÃO (p.313): quita o saldo antes de subir o PV, estabiliza se quitar tudo, e recusa o corpo morto
 * (devolve a mesma sessão). É a regra de `aplicaCura`, e mora aqui para o Restringido (Corpo de Aço, que é regeneração comum) usar a
 * mesma sem importar a sessão. Os modos de queda do Restringido só acabam quando o corpo sai das Portas.
 */
export function curaNaSessao(sessao, cura, hpMax) {
  const c = naoNegativo(cura);
  if (!c) return sessao;
  const r = curaNoSaldo(sessao.vital ?? vitalEmBranco(), sessao.hpAtual, c);
  if (r.recusada) return sessao;
  const teto = Math.max(0, inteiro(hpMax, 0));
  const saiuDasPortas = r.vital.estado !== "morrendo";
  return {
    ...sessao, hpAtual: Math.min(teto, Math.max(0, r.hpDepois)), vital: r.vital,
    ...(sessao.especializacaoSessao && saiuDasPortas ? { especializacaoSessao: { ...sessao.especializacaoSessao,
      modoMorte: null, quedaPendente: false, cairNoProximoDano: false } } : {}),
  };
}

/**
 * Concilia o estado com o PV corrente, depois de QUALQUER escrita (campo de digitar, Bloodfeast, ampliação de
 * recurso). PV acima de zero tira o corpo das Portas (saldo e sucessos zeram, as falhas ficam), e quem estava morto
 * volta com as falhas zeradas: escrever PV à mão num corpo morto é a mesa devolvendo a vida. Três falhas com o PV em
 * zero são a morte, mesmo que a terceira tenha entrado por um poder (Rejeitar a Morte).
 * Devolve o MESMO objeto quando nada muda.
 */
export function conciliaVital(vital, hpAtual) {
  const hp = naoNegativo(hpAtual);
  if (hp > 0) {
    if (vital.estado === "morto") return { ...vital, estado: "vivo", saldo: 0, sucessos: 0, falhas: 0, causa: null, testePendente: false, massivoPendente: false };
    if (vital.estado !== "vivo" || vital.saldo || vital.sucessos || vital.testePendente || vital.massivoPendente) {
      return { ...vital, estado: "vivo", saldo: 0, sucessos: 0, testePendente: false, massivoPendente: false };
    }
    return vital;
  }
  if (vital.estado === "morrendo" && vital.falhas >= FALHAS_PARA_MORRER) return morto(vital, "falhas");
  return vital;
}

/**
 * O descanso longo (p.313 e 335): as falhas caem, e o corpo sai das Portas porque o PV volta cheio. O que NÃO volta:
 * os Ferimentos Complexos (p.314: só energia reversa, meios raros ou a alma os curam) e a morte. Devolve o mesmo
 * objeto se o corpo estava morto.
 */
export function vitalNoDescanso(vital) {
  if (vital.estado === "morto") return vital;
  return { ...vital, estado: "vivo", saldo: 0, sucessos: 0, falhas: 0, testePendente: false, massivoPendente: false, ataque: null, semReacoes: false };
}

/**
 * A linha de AVISO do estado vital, para a barra de PV: só resultado e aviso, sem explicação (regra de UI do autor).
 * Devolve `null` quando o corpo está inteiro. Os termos vêm em Title Case e separados por vírgula.
 */
export function avisoDoVital(vital) {
  if (!vital) return null;
  const partes = [];
  if (vital.estado === "morto") {
    partes.push(vital.causa === "massivo" ? "Morto por Dano Massivo" : vital.causa === "falhas" ? "Morto por Três Falhas" : "Morto");
  } else if (vital.estado === "morrendo") {
    partes.push("Morrendo");
    if (vital.saldo > 0) partes.push(`${vital.saldo} PV Negativos`);
    if (vital.falhas > 0) partes.push(`${vital.falhas} ${vital.falhas === 1 ? "Falha" : "Falhas"}`);
    if (vital.sucessos > 0) partes.push(`${vital.sucessos} ${vital.sucessos === 1 ? "Sucesso" : "Sucessos"}`);
    if (vital.testePendente) partes.push("Teste de Morte Pendente");
    if (vital.massivoPendente) partes.push("Morte Massiva Pendente");
  } else if (vital.estado === "estabilizado") {
    partes.push("Estabilizado");
    if (vital.falhas > 0) partes.push(`${vital.falhas} ${vital.falhas === 1 ? "Falha" : "Falhas"}`);
  } else if (vital.falhas > 0) {
    partes.push(`${vital.falhas} ${vital.falhas === 1 ? "Falha de Morte" : "Falhas de Morte"}`);
  }
  const n = Array.isArray(vital.ferimentos) ? vital.ferimentos.length : 0;
  if (n > 0) partes.push(`${n} ${n === 1 ? "Ferimento Complexo" : "Ferimentos Complexos"}`);
  return partes.length ? partes.join(", ") : null;
}

/** O início do turno de quem tem ferida interna: a perda das reações acaba (p.314: "até o seu próximo turno"). */
export const semReacoesAcabou = (vital) => (vital.semReacoes ? { ...vital, semReacoes: false } : vital);
