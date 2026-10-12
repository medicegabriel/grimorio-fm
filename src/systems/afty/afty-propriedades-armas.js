import { comFormulasDeDano, gruposDaLinha, dadosNoModo, grupoMultiplicavel } from "./afty-dano";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const numeroOpcional = (v) => v == null || v === "" || !Number.isFinite(Number(v)) ? null : inteiro(v);
const tem = (linha, id) => (linha?.propriedades ?? []).some((p) => p.id === id);
const valor = (linha, id) => (linha?.propriedades ?? []).find((p) => p.id === id)?.valor;
export const chaveDaArma = (linha) => linha?.chaveArma ?? linha?.id;

export function dadoDePropriedade(v) {
  const faces = Number(String(v ?? "").trim().match(/^(?:1d|d)?(4|6|8|10|12)$/i)?.[1]);
  return faces ? "1d" + faces : null;
}

export function normalizaPropriedadesArmas(bruta) {
  const mapa = bruta?.porArma;
  const porArma = {};
  for (const [id, e] of Object.entries(mapa && typeof mapa === "object" && !Array.isArray(mapa) ? mapa : {})) {
    if (!e || typeof e !== "object") continue;
    porArma[id] = {
      ataques: inteiro(e.ataques), gastos: inteiro(e.gastos),
      emperrada: !!e.emperrada, aparando: !!e.aparando, desprevenido: !!e.desprevenido,
      tipoDano: typeof e.tipoDano === "string" ? e.tipoDano : null,
      defesaAlvo: numeroOpcional(e.defesaAlvo), defesaAmpla: numeroOpcional(e.defesaAmpla),
      adjacente: !!e.adjacente,
      amplaRodada: numeroOpcional(e.amplaRodada),
      pendente: e.pendente && typeof e.pendente === "object" ? {
        numero: inteiro(e.pendente.numero), acerto: numeroOpcional(e.pendente.acerto),
        errou: !!e.pendente.errou, id: String(e.pendente.id ?? ""),
      } : null,
      ultimo: e.ultimo && typeof e.ultimo === "object" ? {
        dano: inteiro(e.ultimo.dano), acerto: numeroOpcional(e.ultimo.acerto),
        errou: !!e.ultimo.errou,
      } : null,
    };
  }
  return { turno: inteiro(bruta?.turno), porArma,
    oscilante: typeof bruta?.oscilante === "string" ? bruta.oscilante : null,
    ultimoAtaque: typeof bruta?.ultimoAtaque === "string" ? bruta.ultimoAtaque : null };
}

export function estadoDaArma(estado, linha) {
  return normalizaPropriedadesArmas(estado).porArma[chaveDaArma(linha)]
    ?? { ataques: 0, gastos: 0, emperrada: false, aparando: false, desprevenido: false,
      tipoDano: null, defesaAlvo: null, defesaAmpla: null, adjacente: false,
      amplaRodada: null, pendente: null, ultimo: null };
}

function comArma(sessao, linha, fn) {
  const estado = normalizaPropriedadesArmas(sessao?.propriedadesArmas);
  const chave = chaveDaArma(linha);
  if (!chave) return sessao;
  const antes = estadoDaArma(estado, linha);
  return { ...sessao, propriedadesArmas: { ...estado,
    porArma: { ...estado.porArma, [chave]: fn(antes, estado) } } };
}

export function iniciaTurnoArmas(sessao, { novaRodada = false, preservarTurno = false } = {}) {
  const estado = normalizaPropriedadesArmas(sessao?.propriedadesArmas);
  return { ...sessao, propriedadesArmas: {
    turno: estado.turno + (preservarTurno ? 0 : 1),
    oscilante: preservarTurno ? estado.oscilante : null,
    ultimoAtaque: preservarTurno ? estado.ultimoAtaque : null,
    porArma: Object.fromEntries(Object.entries(estado.porArma).map(([id, e]) => [id, {
      ...e,
      ...(preservarTurno ? {} : { ataques: 0, aparando: false, pendente: null, ultimo: null }),
      ...(novaRodada ? { amplaRodada: null } : {}),
    }])),
  } };
}

// Aparar dura até o próximo turno próprio, mas Enérgica e Oscilante acabam aqui.
export function encerraTurnoArmas(sessao) {
  const estado = normalizaPropriedadesArmas(sessao?.propriedadesArmas);
  return { ...sessao, propriedadesArmas: { ...estado, turno: estado.turno + 1, oscilante: null, ultimoAtaque: null,
    porArma: Object.fromEntries(Object.entries(estado.porArma).map(([id, e]) => [id,
      { ...e, ataques: 0, pendente: null, ultimo: null }])),
  } };
}

export function tipoDanoDaArma(def, chave, estado) {
  const base = def?.dano?.tipo ?? null;
  const escolhido = estadoDaArma(estado, { chaveArma: chave }).tipoDano;
  const tipos = [base, ...[def?.props?.modular ?? []].flat()];
  return tipos.includes(escolhido) ? escolhido : base;
}

export function configuraArmaNaSessao(sessao, linha, campo, v) {
  if (!linha?.armaPropriedades) return sessao;
  return comArma(sessao, linha, (e) => {
    if (campo === "ataques") return { ...e, ataques: inteiro(v), pendente: null, ultimo: null };
    if (campo === "gastos" && tem(linha, "recarga")) return { ...e, gastos: Math.min(inteiro(v), inteiro(valor(linha, "recarga"))) };
    if (campo === "aparando" && tem(linha, "aparar") && linha.treinada) return { ...e, aparando: !!v };
    if (campo === "desprevenido" && tem(linha, "apunhaladora")) return { ...e, desprevenido: !!v };
    if (["defesaAlvo", "defesaAmpla"].includes(campo)) return { ...e, [campo]: numeroOpcional(v) };
    if (campo === "adjacente" && tem(linha, "ampla")) return { ...e, adjacente: !!v };
    if (campo === "tipoDano" && linha.armaPropriedades.tipos.some((t) => t.id === v)) return { ...e, tipoDano: v };
    if (campo === "recarregar" && tem(linha, "recarga")) return { ...e, gastos: 0 };
    if (campo === "desemperrar" && tem(linha, "emperrar")) return { ...e, emperrada: false };
    return e;
  });
}

export function marcaErroDaArma(sessao, linha, errou) {
  const atual = normalizaPropriedadesArmas(sessao?.propriedadesArmas);
  if (atual.ultimoAtaque && estadoDaArma(atual, linha).pendente?.id !== atual.ultimoAtaque) return sessao;
  let proxima = comArma(sessao, linha, (e) => e.pendente
    ? { ...e, pendente: { ...e.pendente, errou: !!errou } } : e);
  const estado = normalizaPropriedadesArmas(proxima.propriedadesArmas);
  if (!estadoDaArma(estado, linha).pendente || !tem(linha, "oscilante")) return proxima;
  proxima = { ...proxima, propriedadesArmas: { ...estado,
    oscilante: errou ? chaveDaArma(linha) : (estado.oscilante === chaveDaArma(linha) ? null : estado.oscilante) } };
  return proxima;
}

export function modoAtaqueDaArma(modo, desvantagem) {
  // Uma vantagem e uma desvantagem se anulam; duas desvantagens continuam 2d20.
  return desvantagem ? (modo === "vantagem" ? "normal" : "desvantagem") : modo;
}

/**
 * O modo final de uma jogada, juntando o escolhido à mão com as fontes de fora
 * (o Motor e a propriedade da arma). Livro de Regras, página 282: *"Vantagens e
 * desvantagens não podem acumular. Caso receba vantagens de uma fonte e
 * desvantagens de outra, elas irão se anular, tornando a rolagem uma rolagem
 * comum."* Por isso cada lado é sim ou não, e os dois juntos dão normal.
 */
export function modoCombinado(modo, { vantagem = false, desvantagem = false } = {}) {
  const v = modo === "vantagem" || !!vantagem;
  const d = modo === "desvantagem" || !!desvantagem;
  if (v && d) return "normal";
  return v ? "vantagem" : d ? "desvantagem" : "normal";
}

export function preparaRolagemArma(desc, modo = "normal") {
  const linha = desc.linhaArma;
  if (!linha) return desc.tipo === "teste" ? { ...desc, modo: desc.modo ?? modo } : desc;
  const info = linha.armaPropriedades;
  if (desc.tipo === "teste" && info?.bloqueio) return null;
  if (desc.tipo === "dano" && (info?.estado.pendente?.errou || (info?.bloqueio && !info.estado.pendente))) return null;
  /* A vantagem do Motor na linha (`vantagemAtaque`, 2026-10-07) entra junto da
     desvantagem da arma. O Encontro chama sem modo, e a do Motor vale lá também. */
  const doMotor = linha.vantagemAtaque ?? {};
  return desc.tipo === "teste" ? {
    ...desc,
    modo: modoCombinado(desc.modo ?? modo, {
      vantagem: doMotor.vantagem, desvantagem: !!info?.desvantagem || !!doMotor.desvantagem,
    }),
    cd: info?.estado.defesaAlvo ?? null,
  } : desc;
}

export function registraRolagemArma(sessao, desc, r) {
  const linha = desc.linhaArma;
  if (!r) return sessao;
  if (!linha) {
    if (!desc.ataqueId) return sessao;
    const estado = normalizaPropriedadesArmas(sessao?.propriedadesArmas);
    return { ...sessao, propriedadesArmas: { ...estado, oscilante: null, ultimoAtaque: r.id } };
  }
  let proxima = comArma(sessao, linha, (e) => {
    const ataque = desc.tipo === "teste" || !e.pendente;
    const numero = ataque ? e.ataques + 1 : e.pendente.numero;
    const errou = desc.tipo === "teste" && (r.pifia || r.sucesso === false);
    const pendente = desc.tipo === "teste"
      ? { numero, acerto: r.total, errou, id: r.id }
      : null;
    return { ...e,
      ataques: ataque ? numero : e.ataques,
      gastos: e.gastos + (ataque && tem(linha, "recarga") ? 1 : 0),
      emperrada: e.emperrada || (desc.tipo === "teste" && r.pifia && tem(linha, "emperrar")),
      pendente,
      ...(desc.tipo === "dano" ? { ultimo: { dano: r.total,
        acerto: e.pendente?.acerto ?? null, errou: e.pendente?.errou ?? false } } : {}),
    };
  });
  if (desc.tipo === "teste" || !estadoDaArma(sessao.propriedadesArmas, linha).pendente) {
    const estado = normalizaPropriedadesArmas(proxima.propriedadesArmas);
    proxima = { ...proxima, propriedadesArmas: { ...estado, ultimoAtaque: r.id,
      oscilante: desc.tipo === "teste" && (r.pifia || r.sucesso === false) && tem(linha, "oscilante")
        ? chaveDaArma(linha) : null } };
  }
  return proxima;
}

export function danoDaAmpla(linha, rodada) {
  const e = linha?.armaPropriedades?.estado;
  if (!tem(linha, "ampla") || !e?.ultimo || e.ultimo.errou || !e.adjacente
    || e.defesaAmpla == null || e.ultimo.acerto == null
    || e.defesaAmpla >= e.ultimo.acerto || e.amplaRodada === inteiro(rodada)) return null;
  return Math.floor(e.ultimo.dano / 2);
}

export function usaAmpla(sessao, linha) {
  if (danoDaAmpla(linha, sessao.rodada) == null) return sessao;
  return comArma(sessao, linha, (e) => ({ ...e, amplaRodada: inteiro(sessao.rodada) }));
}

export function defesaDeAparar(armas, estado) {
  const candidatas = armas.filter((a) => a.treinada && tem(a, "aparar") && estadoDaArma(estado, a).aparando);
  const melhor = candidatas.sort((a, b) => ((b.propriedades.find((p) => p.id === "aparar")?.bonusDefesa ?? 2)
    - (a.propriedades.find((p) => p.id === "aparar")?.bonusDefesa ?? 2)))[0];
  return melhor ? { valor: melhor.propriedades.find((p) => p.id === "aparar")?.bonusDefesa ?? 2,
    label: "Aparar (" + melhor.nome + ")" } : null;
}

export function aplicarOscilanteNosTestes(testes, estado) {
  if (!normalizaPropriedadesArmas(estado).oscilante) return testes;
  return { ...testes, ataques: (testes.ataques ?? []).map((a) => ({ ...a,
    bonus: a.bonus + 2, textoBonus: a.textoBonus ? a.textoBonus + " + 2" : a.textoBonus,
    partes: [...a.partes, { label: "Oscilante", valor: 2 }],
  })) };
}

export function aplicarPropriedadesNoDano(dano, { estado, atributos = {}, bt = 0, tipos = {} } = {}) {
  const normal = normalizaPropriedadesArmas(estado);
  return { ...dano, entradas: (dano.entradas ?? []).map((linha) => {
    if (!linha.chaveArma) return linha;
    const e = estadoDaArma(normal, linha);
    const numero = e.pendente && !e.pendente.errou ? e.pendente.numero : e.ataques + 1;
    const gruposDano = [...gruposDaLinha(linha)];
    // Decisão do autor (2026-10-05): todos os dados de Durante Ataque, de
    // qualquer fonte, incluindo os dados já dobrados pelo crítico.
    const bonusEnergica = (modo) => tem(linha, "energica") && numero >= 2
      ? gruposDano.filter((g) => g.momento !== "apos" && (modo !== "normal" || !g.apenasCritico))
        .reduce((n, g) => n + dadosNoModo(g, modo) * (modo !== "normal" && grupoMultiplicavel(g) ? 2 : 1), 0) + numero - 2
      : 0;
    const energica = bonusEnergica("normal");
    const energicaCritico = bonusEnergica("critico");
    const apunhaladora = tem(linha, "apunhaladora") && e.desprevenido ? inteiro(bt) : 0;
    const oscilante = normal.oscilante ? 2 : 0;
    for (const [nome, fixo] of [["Enérgica", energica], ["Apunhaladora", apunhaladora]]) {
      if (fixo) gruposDano.push({ nome, dados: 0, faces: 6, fixo, multiplica: false, momento: "durante" });
    }
    // A diferença da contagem crítica entra uma única vez como dano fixo.
    // Ela inclui o dobro dos dados, mas o bônus não dobra de novo nem recebe 1,5x.
    if (energicaCritico !== energica) gruposDano.push({
      nome: "Enérgica", dados: 0, faces: 6, fixo: energicaCritico - energica,
      multiplica: false, momento: "durante", apenasCritico: true,
    });
    const requisitos = [["pesada", "forca", "Força"], ["estabilidade", "destreza", "Destreza"]]
      .filter(([id, attr]) => tem(linha, id) && Number(atributos[attr] ?? 10) < Number(valor(linha, id)))
      .map(([id, , nome]) => nome + " menor que " + valor(linha, id));
    const tipoBase = linha.tipoDanoBase ?? linha.tipoDano ?? null;
    const alternativos = tem(linha, "modular") ? [valor(linha, "modular")].flat() : [];
    const tiposDisponiveis = [...new Set([tipoBase, ...alternativos].filter((id) => id && tipos[id]))]
      .map((id) => ({ id, label: tipos[id] }));
    const tipoDano = tiposDisponiveis.some((t) => t.id === e.tipoDano) ? e.tipoDano : tipoBase;
    const capacidade = inteiro(valor(linha, "recarga"));
    const bloqueio = e.emperrada ? "Arma emperrada"
      : capacidade && e.gastos >= capacidade ? "Recarregue a arma" : null;
    return comFormulasDeDano({ ...linha, gruposDano, tipoDano,
      tipoDanoLabel: tipos[tipoDano] ?? linha.tipoDanoLabel,
      total: (linha.total ?? 0) + energica + apunhaladora,
      acerto: (linha.acerto ?? 0) + oscilante,
      acertoTexto: linha.acertoTexto && oscilante ? linha.acertoTexto + " + 2" : linha.acertoTexto,
      partesAcerto: [...(linha.partesAcerto ?? []), ...(oscilante ? [{ label: "Oscilante", valor: 2 }] : [])],
      armaPropriedades: { estado: e, numero, energica, energicaCritico, apunhaladora, oscilante, capacidade,
        desvantagem: requisitos.length > 0, requisitos, bloqueio, tipos: tiposDisponiveis },
    });
  }) };
}
