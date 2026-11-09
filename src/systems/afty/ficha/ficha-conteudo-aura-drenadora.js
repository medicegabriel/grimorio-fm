// Livro p.175. Recebe a transição vital produzida pelo dano, com autoria.
import { aptidaoDeConteudoDisponivel } from "./ficha-conteudo-acesso";
import { rolarDano } from "./ficha-rolagem";
import { registraRolagem } from "./ficha-sessao";
import { comOperacao, jaAplicada } from "./ficha-uso-estado";

const ID = "aura_drenadora";
const FONTE = "Aura Drenadora";

export function drenaAuraAoMatar(sessao, derived, antes, depois, { inimigo, ataqueId, alvoId, rng } = {}) {
  const vazio = { sessao, pv: 0 };
  if (inimigo !== true || !ataqueId || !alvoId || antes.vital?.estado === "morto" || depois.vital?.estado !== "morto"
    || sessao.vital?.estado === "morto" || !aptidaoDeConteudoDisponivel(derived, ID)
    || derived.combate?.concentrarAura?.includes(ID)) return vazio;
  const eventoId = `${ID}:${ataqueId}:${alvoId}`;
  if (jaAplicada(sessao, eventoId)) return vazio;
  const dados = derived.aptidao.efetivo.au;
  const fixo = derived.mods.constituicao;
  const fontes = [{ label: "Nível de Aptidão em Aura", texto: `${dados}d8` }, { label: "Modificador de Constituição", valor: fixo }];
  const rolagem = { ...rolarDano({ rotulo: FONTE, detalhe: "PV Temporário", tom: "pvTemporario", dados, faces: 8, fixo, fontes }, rng),
    consequenciasAplicadas: true, ataqueId, alvoId };
  const pv = Math.max(0, rolagem.total);
  const soma = (sessao.pvTempFontes?.[FONTE] ?? 0) + pv;
  const nova = pv > 0 ? { ...sessao, pvTempFontes: { ...sessao.pvTempFontes, [FONTE]: soma } } : sessao;
  return { sessao: registraRolagem(comOperacao(nova, { id: eventoId, tipo: ID }), rolagem), pv, rolagem };
}
