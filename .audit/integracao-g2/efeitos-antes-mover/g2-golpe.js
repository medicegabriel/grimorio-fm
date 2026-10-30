/* ============================================================
   G2 · O MONTADOR DO GOLPE ESPECIAL NA PREPARAÇÃO (consolidação ampliada, 2026-10-16)
   ============================================================
   O que o motor já tem, e a aplicação principal usa no `PainelDoGolpeEspecial`:
     PROPRIEDADES_GOLPE        as onze propriedades do livro, o custo de cada uma e onde mora a marca
                               (afty-golpe-especial.js, módulo folha)
     marcasDoGolpe             as marcas na sessão, pelas DUAS casas: seis são estados de bancada
                               (`sessao.combate`) e cinco são marcas próprias (`sessao.golpeEspecial`)
     marcaPropriedadeGolpe     marca ou desmarca uma propriedade na casa dela
     custoDoGolpeDaSessao      o custo total (no mínimo 1 PE), o abate do Autossuficiente e o Preciso repetido
     pagaGolpeEspecial         o ÚNICO lugar que cobra: o PE pelo `gastaPe` (casca primeiro), o Sacrifício como dano,
                               o Preciso pago na rodada e a troca por 6 do Autossuficiente
   Nada daqui calcula custo nem número: o plano chama as funções da ficha. As marcas FICAM até a pessoa desmarcar
   (autor, 2026-09-23), e cada confirmação é UM golpe novo, que paga o custo inteiro, inclusive com as mesmas marcas.
   O que esta Preparação NÃO faz: rolar o ataque, nem montar o golpe de uma arte do combate. Cinco propriedades (Amplo,
   Impactante, Sanguinário, Lento e Sacrifício) não têm número na linha de dano: entram só no custo, e a prévia diz isso.

   RASCUNHO  { marcas: { <id da propriedade>: 0, 1 ou a contagem }, seis: bool }, só na tela.
   PEDIDO    as marcas a aplicar e o que a tela viu (as marcas de partida, a rodada, o custo e o contador de golpes
             novos). `aplicaGolpe` (modelo.jsx) confere tudo na mesa que estiver valendo, e paga.
   ============================================================ */
import { Sessao } from "./ponte";
import { energiaDisponivel } from "./mesa-verbos";
import { PROPRIEDADES_GOLPE, marcasDoGolpe, vezesDaPropriedade } from "../../afty-golpe-especial";
import { CHAVE_GOLPE, compararTudo, derivarCom } from "./efeitos-dados";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

export const PROPRIEDADES = PROPRIEDADES_GOLPE;
export { CHAVE_GOLPE };

/** O rascunho de partida: as marcas de agora (ficam até desmarcar), ou as de uma reativação. */
export function rascunhoDoGolpe(m, de = null) {
  const base = de?.marcas ?? marcasDoGolpe(m.sessao);
  return { marcas: Object.fromEntries(PROPRIEDADES.map((p) => [p.id, vezesDaPropriedade(p, base[p.id])])), seis: !!de?.seis };
}

/** As marcas que estão valendo na sessão, num objeto simples (para guardar no Encerrado e reativar). */
export const marcasDeAgora = (sessao) => ({ marcas: marcasDoGolpe(sessao), seis: false });

/** A sessão com as marcas do rascunho aplicadas, cada uma na casa dela. Só o que difere do que já está marcado. */
export function sessaoComMarcas(sessao, marcas) {
  const agora = marcasDoGolpe(sessao);
  let s = sessao;
  for (const p of PROPRIEDADES) {
    const v = vezesDaPropriedade(p, marcas?.[p.id]);
    if (v !== agora[p.id]) s = Sessao.marcaPropriedadeGolpe(s, p.id, p.max ? v : v > 0);
  }
  return s;
}

/** Sem propriedade nenhuma marcada: o golpe encerrado. As marcas próprias também saem. */
export const sessaoSemGolpe = (sessao) => sessaoComMarcas({ ...sessao, golpeEspecial: {} }, Object.fromEntries(PROPRIEDADES.map((p) => [p.id, 0])));

/**
 * O plano de um golpe. Tudo sai das funções da ficha: o custo (`custoDoGolpeDaSessao`), o que cada marca muda nos números
 * (o derive com as marcas contra o de agora) e o que o pagamento recusa (a mesma operação da confirmação, na mesa de agora).
 * `simula`: a operação pura `aplicaGolpe` sobre a mesa de agora (modelo.jsx).
 */
export function planoDoGolpe({ valores, m, chave = CHAVE_GOLPE, simula }) {
  const derived = m.derived;
  const agora = marcasDoGolpe(m.sessao);
  const marcas = Object.fromEntries(PROPRIEDADES.map((p) => [p.id, vezesDaPropriedade(p, valores?.marcas?.[p.id])]));
  const disponivelNoMotor = !!derived.golpeEspecial?.disponivel;
  const auto = !!derived.golpeEspecial?.autossuficiente;
  const seisUsado = Sessao.seisDoAutossuficienteUsado(m.sessao);
  const seis = auto && !!valores?.seis && !seisUsado;
  const alvoSessao = sessaoComMarcas(m.sessao, marcas);
  const custo = Sessao.custoDoGolpeDaSessao(alvoSessao, derived, { seis });
  const disponivel = energiaDisponivel(m.sessao);
  const sacrificio = marcas.sacrificio > 0;
  const precisoRepetido = Sessao.precisoPagoNaRodada(m.sessao);

  const pedido = {
    chave, marcas, esperadoMarcas: agora, seis, custoVisto: custo.aPagar, rodadaVista: m.sessao.rodada, golpesVistos: inteiro(m.mesa.reusos?.[chave]),
  };
  const sim = custo.montado && simula ? simula(pedido) : { mesa: m.mesa, erro: null };

  const bloqueios = [];
  if (!m.combate) bloqueios.push("Pede Em Combate");
  if (!disponivelNoMotor) bloqueios.push("Golpe Especial Indisponível");
  if (!custo.montado) bloqueios.push("Nenhuma Propriedade");
  if (custo.montado && custo.aPagar > disponivel) bloqueios.push(`Faltam ${custo.aPagar - disponivel} PE`);
  if (sim.erro && !bloqueios.length) bloqueios.push("A Ficha Não Aceita Agora");

  return {
    marcas, agora, pedido, sim, custo, auto, seis, seisUsado, sacrificio, precisoRepetido, alvoSessao,
    mudou: custo.montado,
    propriedades: PROPRIEDADES.map((p) => ({ ...p, vezes: marcas[p.id], unidade: precisoRepetido && p.custoRepetido != null ? p.custoRepetido : p.custo })),
    bloqueios,
  };
}

/** O que as marcas mudam nos números, pelo derive com elas contra o de agora. As cinco sem número ficam de fora do comparador. */
export function previaDoGolpe(plano, m, antes) {
  if (!plano.mudou) return [];
  return compararTudo(derivarCom(m.ficha, plano.alvoSessao), antes);
}
