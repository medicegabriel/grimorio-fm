// Homebrew do autor, 2026-11-04. Folha sem imports. Não concede habilidades.
export const SERVOS_ID = "servos-da-guerra";
export const CLASSES_SERVOS = ["Berserker", "Lancer", "Archer", "Saber", "Caster", "Rider", "Assassin"];
export const ATRIBUTOS_SERVOS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"];
const natural = (v) => Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : 0;

export function validarDadosServos(regras) {
  if (!regras?.classes || typeof regras.peMaximo !== "string" || !regras.peMaximo.trim()) {
    return ["Servos da Guerra precisa das classes e da expressão de PE máximo."];
  }
  const problemas = [];
  const canais = new Set(["margemCritico", "acoesMovimento", "alcanceHabilidadeMult", "criticoMultBonus", "danoFinalMult"]);
  for (const nome of CLASSES_SERVOS) {
    const classe = regras.classes[nome];
    if (!classe || typeof classe !== "object" || Array.isArray(classe)) {
      problemas.push(`Classe do Servo inválida: ${nome}.`);
      continue;
    }
    if ("efeitos" in classe && (!Array.isArray(classe.efeitos) || classe.efeitos.some((e) =>
      !canais.has(e?.canal) || typeof e?.expr !== "string" || !Number.isFinite(Number(e.expr)) || Number(e.expr) <= 0))) {
      problemas.push(`Efeito inválido na classe ${nome}.`);
    }
  }
  if (!Number.isInteger(regras.classes.Saber?.pontosAtributo) || regras.classes.Saber.pontosAtributo < 0) {
    problemas.push("Pontos de atributo de Saber inválidos.");
  }
  return problemas;
}

export const temServos = (ficha) => ficha?.rulesVersion === "afty"
  && Array.isArray(ficha.addons) && ficha.addons.some((p) => p?.id === SERVOS_ID && p.servosGuerra?.classes);

export function configuracaoServo(ficha) {
  if (!temServos(ficha)) return null;
  const regras = ficha.addons.find((p) => p.id === SERVOS_ID).servosGuerra;
  const bruto = ficha.servosGuerra ?? {};
  const classe = CLASSES_SERVOS.includes(bruto.classe) ? bruto.classe : null;
  const atributos = Object.fromEntries(ATRIBUTOS_SERVOS.map((a) => [a, natural(bruto.atributos?.[a])]));
  const usados = Object.values(atributos).reduce((a, b) => a + b, 0);
  const pontos = natural(regras.classes.Saber?.pontosAtributo);
  return { classe, atributos, usados, pontos, atributosValidos: usados <= pontos, regras };
}

export function efeitosServos(ficha) {
  const servo = configuracaoServo(ficha);
  if (!servo?.classe) return [];
  const efeito = (canal, expr, alvo) => ({ canal, expr: String(expr),
    origem: SERVOS_ID, nome: `Servos da Guerra: ${servo.classe || "Servo"}`,
    ...(alvo ? { alvo } : {}) });
  const classe = servo.regras.classes[servo.classe];
  if (!classe) return [];
  const out = classe.preservaPE ? [] : [efeito("peMaxFixo", servo.regras.peMaximo)];
  if (servo.classe === "Saber" && servo.atributosValidos) {
    for (const [alvo, n] of Object.entries(servo.atributos)) {
      if (n) out.push(efeito("atributo", n, alvo), efeito("limiteAtributo", n, alvo));
    }
  }
  for (const e of Array.isArray(classe.efeitos) ? classe.efeitos : []) {
    if (e && typeof e.expr === "string") out.push(efeito(e.canal, e.expr, e.alvo));
  }
  return out;
}

/** Escolha por ataque, aparada pelo BT e pelo nível efetivo da fonte. */
export function dadosDoServo({ bt, nivel, manaburst = 0, escalonamento = 0, faces }) {
  const mana = Math.min(natural(bt), natural(manaburst));
  const escala = Math.min(natural(nivel), natural(escalonamento));
  const dado = natural(faces);
  if (dado < 2) return { grupos: [], custo: 0, mana: 0, escala: 0 };
  return { mana, escala, custo: mana + 2 * escala, grupos: [
    ...(mana ? [{ nome: "ManaBurst", dados: mana, faces: dado, fixo: 0, momento: "apos", multiplica: false }] : []),
    ...(escala ? [{ nome: "Escalonamento", dados: escala, faces: dado, fixo: 0, momento: "durante", multiplica: true }] : []),
  ] };
}

/** Cada dia informado representa um dia inteiro de concentração concluído. */
export function tamanhoDominioInato({ nivel = 0, dias = 0, aumentos = 0 } = {}) {
  const dom = natural(nivel);
  const bonus = natural(aumentos);
  const maximo = 10 * (dom + 1 + bonus);
  return { inicial: dom, crescimento: dom, dias: natural(dias), maximo,
    raio: Math.min(maximo, dom * (1 + natural(dias))), vida: null, custoPE: 20,
    partes: [{ label: "Nível de Domínio", valor: dom },
      { label: "Dias de Concentração", valor: dom * natural(dias) }],
    partesMaximo: [{ label: "Domínio Inato", valor: 10 * (dom + 1) },
      ...(bonus ? [{ label: "Aumentos de Tamanho", valor: 10 * bonus }] : [])] };
}
