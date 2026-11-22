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
  eclesiastes: { namespace: "eclesiastes", defaultRulesVersion: "afty" },
};

/* A rota de cada grupo, espelho do `ARMAZEM_DO_GRUPO`: é nela que a lista e o criador das fichas do grupo moram. Até
   2026-11-19 a Sala voltava sempre para `/Player` e o Editar abria `/Player`, onde a ficha de um jogador da Guilda (guardada em
   `fm_creatures_eradeouro_v1`) não existe. */
export const ROTA_DO_GRUPO = { site: "/Jogador", afty: "/Jogador", eradeouro: "/EraDeOuro", eclesiastes: "/Eclesiastes" };

/** Para onde a Sala volta e onde a ficha do grupo se edita. Grupo ainda desconhecido (antes de entrar na conta) cai em `/Jogador`. */
export const rotaDoGrupo = (grupo) => ROTA_DO_GRUPO[grupo] ?? "/Jogador";

/* O alfabeto do código da Sala (`supabase/salas.sql`, `salas_codigo`): seis letras e números, sem I, L, O, 0 e 1, que se confundem. */
const CODIGO_DA_SALA = /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/;

/**
 * O código de Sala que está num texto colado: o código puro ("k7m2qx", com espaço ou traço no meio) ou o link inteiro
 * ("https://fichafm.com.br/Sala/K7M2QX", do WhatsApp). Devolve o código em maiúsculas, ou `null` se o texto não traz um código
 * válido (etapa E7 do app, 2026-11-20).
 */
export function codigoDoTexto(texto) {
  const bruto = String(texto ?? "").trim();
  if (!bruto) return null;
  const doLink = /\/sala\/([^/?#\s]+)/i.exec(bruto);
  const codigo = (doLink ? doLink[1] : bruto).replace(/[\s-]/g, "").toUpperCase();
  return CODIGO_DA_SALA.test(codigo) ? codigo : null;
}
