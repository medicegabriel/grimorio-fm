// O provedor de mesa monta o recibo e resolve o contexto a partir das sessões atuais.
export const identificador = (valor) => typeof valor === "string" && valor.length > 0;

export function mesmoTurnoCx3(a, b) {
  return identificador(a?.id) && a.id === b?.id && Number.isSafeInteger(a.rodada)
    && a.rodada === b.rodada && Number.isSafeInteger(a.turno) && a.turno === b.turno;
}

export function reciboProspectivo(recibo, mesa, tipo) {
  return recibo?.tipo === tipo && recibo.estado === "pendente" && identificador(recibo.id)
    && identificador(mesa?.origemId) && recibo.origemId === mesa.origemId && identificador(mesa.alvoId)
    && mesmoTurnoCx3(recibo.turno, mesa.turno)
    && Array.isArray(recibo.afetados) && recibo.afetados.every(identificador)
    && new Set(recibo.afetados).size === recibo.afetados.length && recibo.afetados.includes(mesa.alvoId);
}
