// Livro p.194. Identidade e concessão de conteúdo, sem outro orçamento.
import { baseDoFeitico } from "./afty-origens-feiticos";

export function reversoesDeTecnica(creature, { pode = false, manualId = null } = {}) {
  const lista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  const porFeitico = {};
  const bases = [];
  for (const f of lista) {
    const base = baseDoFeitico(f, lista);
    if (!base?.reversaoTecnica || f.marcial || base.marcial) continue;
    const disponivel = pode;
    porFeitico[f.id] = { baseId: base.id, disponivel };
    if (disponivel && !f.variacaoDe && f.nivel !== "max" && !f.regraTecnicaMaxima && f.id !== manualId) bases.push(f.id);
  }
  return { pode, vagas: Number(pode), exclusivaId: bases[0] ?? null, porFeitico };
}
