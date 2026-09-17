export const REFLETIR_IMAGEM_ID = "manipulacao-do-ceu:refletir_imagem";
export const DUPLICATA_PERFEITA_ID = "manipulacao-do-ceu:duplicata_perfeita";
export const COPIAS_REFLETIDAS_ID = "manipulacao-do-ceu:copias_refletidas";

const nomeCanonico = (valor) => String(valor ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .trim()
  .toLowerCase();

const feiticosDaFicha = (creature) => (
  Array.isArray(creature?.feiticos) ? creature.feiticos : []
);

const correspondeAoFeitico = (feitico, id, nome, tipo) => (
  String(feitico?.id ?? "") === id
  || (
    nomeCanonico(feitico?.nome) === nomeCanonico(nome)
    && feitico?.tipo === tipo
    && Number(feitico?.nivel) === 5
  )
);

const temRefletirImagem = (creature) => feiticosDaFicha(creature)
  .some((feitico) => correspondeAoFeitico(
    feitico,
    REFLETIR_IMAGEM_ID,
    "Refletir Imagem",
    "personalizado",
  ));

const temDuplicataPerfeita = (creature) => feiticosDaFicha(creature)
  .some((feitico) => correspondeAoFeitico(
    feitico,
    DUPLICATA_PERFEITA_ID,
    "Duplicata perfeita",
    "passivo",
  ));

export function estadosManipulacaoCeu(creature) {
  if (!temRefletirImagem(creature)) return [];
  return [{
    id: COPIAS_REFLETIDAS_ID,
    label: "Cópias Refletidas",
    tipo: "faixa",
    min: 0,
    max: 2,
    passo: 1,
    ocultarEmBuffs: true,
    ocultarNoCriador: true,
    dono: { id: "addon:manipulacao-do-ceu", label: "Manipulação do Céu" },
  }];
}

export function resolveManipulacaoCeu(creature, combate, aptidoesIds = []) {
  const temRefletir = temRefletirImagem(creature);
  const temDuplicata = temDuplicataPerfeita(creature);
  const temAura = aptidoesIds.includes("aura_embacada");
  const copias = temRefletir
    ? Math.max(0, Math.min(2, Math.trunc(Number(combate?.[COPIAS_REFLETIDAS_ID]) || 0)))
    : 0;
  const auraAtiva = temAura && !!combate?.auraEmbacada;
  const limiar = auraAtiva ? 2 + (temDuplicata ? copias : 0) : 0;

  return {
    disponivel: temRefletir,
    temDuplicata,
    temAura,
    auraAtiva,
    copias,
    maxCopias: 2,
    limiar,
    percentual: limiar * 10,
    estadoId: COPIAS_REFLETIDAS_ID,
  };
}
