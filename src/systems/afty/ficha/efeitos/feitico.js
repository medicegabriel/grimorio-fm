/* A utilização de um Feitiço, em dados: os lugares de rolagem, na ordem do
   catálogo (`rolagens`, repetidas por `vezes`). A MESMA montagem do Leitor
   da aba Efeitos, num lugar só. */
import { sinal } from "./util";

export function slotsDoFeitico(f) {
  const slots = [];
  for (const [ri, r] of (f?.rolagens ?? []).entries()) {
    const n = Math.max(1, r.vezes || 1);
    for (let k = 0; k < n; k += 1) {
      slots.push({
        id: `${ri}:${k}`,
        rotulo: n > 1 ? `${r.rotulo || "Dano"} ${k + 1}` : r.rotulo || "Dano",
        formula: `${r.dados}d${r.faces}${r.explosiva ? "!" : ""}${r.fixo ? sinal(r.fixo) : ""}`,
        primeira: ri === 0 && k === 0,
        tom: r.tom,
        desc: { tipo: "dano", tom: r.tom, rotulo: f.nome, detalhe: n > 1 ? `${r.rotulo || "Dano"} ${k + 1}` : r.rotulo || "Dano", dados: r.dados, faces: r.faces, fixo: r.fixo || 0, explosiva: !!r.explosiva },
      });
    }
  }
  return slots;
}

/** O acerto que o Feitiço declara (propriedade `acerto`), como está no catálogo. */
export function acertoDoFeitico(f) {
  const p = (f?.propriedades ?? []).find((x) => x.id === "acerto");
  if (!p) return null;
  return { texto: p.valor, bonus: Number(String(p.valor).replace(/[^\d-]/g, "")) || 0 };
}
