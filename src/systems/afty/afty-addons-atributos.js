/** Alterações estruturais de atributo declaradas por pacote, antes do Motor.
 * Não reescrevem a alocação salva. Desinstalar devolve a base original.
 * Limites fixos são restrições: entre pacotes vale o menor limite declarado.
 */
export function atributosDosAddons(creature) {
  const fontes = {};
  for (const p of Array.isArray(creature?.addons) ? creature.addons : []) {
    for (const [key, regra] of Object.entries(p?.atributos ?? {})) {
      if (!regra || typeof regra !== "object") continue;
      const lista = fontes[key] ??= [];
      lista.push({
        nome: regra.nome || p.nome,
        bonusBase: Number.isInteger(regra.bonusBase) ? regra.bonusBase : 0,
        limiteFixo: Number.isInteger(regra.limiteFixo) && regra.limiteFixo >= 0 && regra.limiteFixo <= 32
          ? regra.limiteFixo : undefined,
      });
    }
  }
  const bonus = (key) => (fontes[key] ?? []).reduce((s, f) => s + f.bonusBase, 0);
  const limite = (key) => Math.min(...(fontes[key] ?? []).map((f) => f.limiteFixo ?? Infinity));
  return { fontes, bonus, limite };
}
