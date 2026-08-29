export const CICLO_ADAPTACAO_MAHORAGA = Object.freeze({
  id: "ciclo-adaptacao-mahoraga",
  nome: "Ciclo de Adaptação do Mahoraga",
  versao: "1.0.0",
  autor: "Afty",
  descricao: "Roda de adaptação progressiva por rodada.",
  paraRaw: "afty",
  permite: ["adaptacao"],
  adaptacoes: [
    {
      id: "roda",
      nome: "Roda de Adaptação",
      intervalo: 5,
      ganho: "habilidades_bonus_acerto",
      mecanica: "auxiliar_acerto_progressivo",
    },
  ],
  acrescenta: {},
});

export default CICLO_ADAPTACAO_MAHORAGA;
