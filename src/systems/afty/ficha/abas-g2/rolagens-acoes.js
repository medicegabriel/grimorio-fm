/* ============================================================
   OS PEDIDOS DE ROLAGEM DAS TRÊS ABAS DA PRÉVIA (2026-10-21)
   ============================================================
   Cada função monta o MESMO pedido que a aba clássica monta hoje, campo por campo (`AbaAcoes.jsx`, `AbaPericias.jsx`,
   `ControleExpansao.jsx`). Elas existem para a prévia perguntar a disponibilidade com o pedido exato que vai rolar, e não com uma cópia
   aproximada. Folha pura: sem React, sem sessão, sem derive.
   ============================================================ */
import { facesDe } from "../ficha-rolagem";
import { curaNoGasto } from "../../afty-cura";

/** O Acerto de uma linha de dano. */
export const pedidoAcerto = (e) => ({
  tipo: "teste", rotulo: `${e.nome} · Acerto`, bonus: e.acerto, dados: e.acertoDados, margem: e.margemCritico, linhaArma: e,
});

/** O Dano de uma linha, no modo que a tela mostra (Normal, Crítico, Raio Negro). */
export const pedidoDano = (e, modoDano) => ({
  tipo: "dano", rotulo: e.nome, grupos: e.gruposDano, modoDano, rerrola: e.rerrola, linhaArma: e,
});

/** O que a linha de cura rola com `blocos` gastos (limitado ao teto da linha, como na clássica). */
export function estadoDaCura(l, blocos) {
  const teto = l.unidade ? Math.max(1, l.blocos) : 1;
  return curaNoGasto(l, Math.min(Math.max(1, blocos), teto));
}
export const pedidoCura = (l, estado) => ({
  tipo: "dano", tom: "cura", fonteCuraId: l.id, rotulo: l.nome,
  detalhe: l.unidade ? `${estado.pontos} ${l.unidade.rotulo}` : null,
  dados: l.dados, faces: facesDe(l.dado), fixo: estado.fixo, blocos: estado.blocos,
});

/** Uma rolagem de Feitiço. Só a PRIMEIRA leva Custo de Vida, consumo de estado, Feitiço de dano e a resolução do Ritual. */
export function pedidoFeitico(f, r, indice, total) {
  return {
    tipo: "dano", tom: r.tom,
    curaDoUsuario: r.curaDoUsuario,
    rotulo: f.nome || "Feitiço Sem Nome",
    detalhe: total > 1 || r.vezes > 1 ? r.rotulo : f.nivelLabel,
    dados: r.dados, faces: r.faces, fixo: r.fixo || 0,
    explosiva: !!r.explosiva,
    custoVidaAtivacao: indice === 0 ? f.custoVidaAtivacao : null,
    // A rolagem da Amplificadora traz o estado dela (2026-10-27), e é a única que o desliga.
    consomeEstado: r.consomeEstado ?? (indice === 0 ? f.consomeEstado : null),
    feiticoDanoId: indice === 0 && f.tipo === "dano" ? f.id : null,
    finalizaRitualId: indice === 0 && f.ritual?.ativo && f.ritual?.podeResolver ? f.id : null,
  };
}
/** A notação de uma rolagem de Feitiço, como a clássica escreve: `3d6!+2`. */
export const notacaoDoFeitico = (r) => `${r.dados}d${r.faces}${r.explosiva ? "!" : ""}${r.fixo ? `${r.fixo > 0 ? "+" : ""}${r.fixo}` : ""}`;

/** O Conflito de Domínio: 1d10 mais o bônus. */
export const pedidoConflito = (c) => ({ tipo: "dano", rotulo: "Conflito de Domínio", dados: c.dados, faces: c.faces, fixo: c.bonus });

/** Uma Manobra (ou Concentração, Fintar, Provocar, Teste de Morte). `lado` só existe quando há dois. */
export const pedidoManobra = (m, lado = "executar") => (lado === "resistir"
  ? { tipo: "teste", rotulo: `${m.nome} · Resistir`, bonus: m.resistir }
  : { tipo: "teste", rotulo: m.resistir != null ? `${m.nome} · Executar` : m.nome, bonus: m.executar });

/** Um teste da aba Perícias (Jogada de Ataque, TR ou perícia). */
export const pedidoTeste = ({ nome, bonus, dados, margem, ataqueId, minimoNatural }) => ({
  tipo: "teste", rotulo: nome, bonus, dados, margem, ataqueId, minimoNatural,
});

/** O teste puro de um atributo. */
export const pedidoAtributo = (rotulo, mod) => ({ tipo: "teste", rotulo, bonus: mod });
