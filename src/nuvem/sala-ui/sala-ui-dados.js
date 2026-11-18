/* As constantes e funções pequenas das telas da Sala (etapa 7c, 2026-11-18), fora dos `.jsx` para o recarregamento rápido do Vite
   (o lint pede que arquivo de componente exporte só componente). As peças estão em `PecasSala.jsx`. */

export const ROTULO_PAPEL = { mestre: "Mestre", jogador: "Jogador", espectador: "Espectador" };

/** O endereço da Sala neste site. */
export const linkDaSala = (codigo) => `${typeof location !== "undefined" ? location.origin : ""}/Sala/${codigo}`;

/** O horário de uma linha do Registro. */
export const horaDe = (t) => {
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
};

/* O armazenamento das fichas de personagem de cada grupo, com o MESMO sistema padrão que o `App.jsx` passa na rota dona da
   chave (o `useCreatureStorage` carimba o `rulesVersion` da ficha sem marca e regrava a lista). */
export const ARMAZEM_DO_GRUPO = {
  site: { namespace: "player", defaultRulesVersion: "player" },
  afty: { namespace: "player", defaultRulesVersion: "player" },
  eradeouro: { namespace: "eradeouro", defaultRulesVersion: "afty" },
};
