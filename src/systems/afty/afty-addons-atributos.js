/** Alterações estruturais de atributo declaradas por pacote, antes do Motor.
 * Não reescrevem a alocação salva. Desinstalar devolve a base original.
 * Limites fixos são restrições: entre pacotes vale o menor limite declarado.
 *
 * `rolagem` só vale quando a ficha monta a base pelo Método Rolagem (Atributo
 * Fang, 2026-10-12). `baseMax` sobe o teto do campo de Base (o raw é 18) e
 * `limite` soma no Limite do atributo FURANDO os tetos 30 e 32: *"Até mesmo
 * caso o Atributo já esteja em 30. Ficando com Limite 31. Ou Limite 33 caso
 * possua Aperfeiçoamento de Atributo."* Entre pacotes, o `baseMax` fica com o
 * maior e o `limite` soma.
 */
export function atributosDosAddons(creature) {
  const fontes = {};
  const naRolagem = creature?.attrMethod === "rolagem";
  for (const p of Array.isArray(creature?.addons) ? creature.addons : []) {
    for (const [key, regra] of Object.entries(p?.atributos ?? {})) {
      if (!regra || typeof regra !== "object") continue;
      const rolagem = naRolagem && regra.rolagem && typeof regra.rolagem === "object" ? regra.rolagem : null;
      const lista = fontes[key] ??= [];
      lista.push({
        nome: regra.nome || p.nome,
        bonusBase: Number.isInteger(regra.bonusBase) ? regra.bonusBase : 0,
        limiteFixo: Number.isInteger(regra.limiteFixo) && regra.limiteFixo >= 0 && regra.limiteFixo <= 32
          ? regra.limiteFixo : undefined,
        baseMaxRolagem: Number.isInteger(rolagem?.baseMax) ? rolagem.baseMax : undefined,
        limiteExtra: Number.isInteger(rolagem?.limite) && rolagem.limite > 0 ? rolagem.limite : 0,
      });
    }
  }
  const bonus = (key) => (fontes[key] ?? []).reduce((s, f) => s + f.bonusBase, 0);
  const limite = (key) => Math.min(...(fontes[key] ?? []).map((f) => f.limiteFixo ?? Infinity));
  const limiteExtra = (key) => (fontes[key] ?? []).reduce((s, f) => s + f.limiteExtra, 0);
  /** O maior `baseMax` declarado, ou null quando nenhum pacote mexe no campo. */
  const baseMaxRolagem = (key) => {
    const v = (fontes[key] ?? []).map((f) => f.baseMaxRolagem).filter((n) => n != null);
    return v.length ? Math.max(...v) : null;
  };
  return { fontes, bonus, limite, limiteExtra, baseMaxRolagem };
}
