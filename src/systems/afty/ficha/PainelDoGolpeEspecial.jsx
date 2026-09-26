import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { PROPRIEDADES_GOLPE, marcasDoGolpe } from "../afty-golpe-especial";
import {
  marcaPropriedadeGolpe, custoDoGolpeDaSessao, pagaGolpeEspecial, precisoPagoNaRodada,
  seisDoAutossuficienteUsado, peTempTotal,
} from "./ficha-sessao";

/**
 * ============================================================
 * O MONTADOR DO GOLPE ESPECIAL (2026-09-24)
 * ============================================================
 * As onze propriedades, o custo total e o Pagar. As marcas ficam até a pessoa
 * desmarcar (autor, 2026-09-23), e as que viram número (Atroz, Letal, Longo,
 * Penetrante, Desfocado) já mexem nas linhas de Dano logo abaixo, porque são os
 * mesmos estados da aba Buffs.
 *
 * Quem soma e quem cobra é a sessão (`custoDoGolpeDaSessao` e
 * `pagaGolpeEspecial`): o painel só desenha. Fora de combate ele fica
 * desligado, como todo estado de bancada, que só vale em combate.
 * ============================================================
 */

/** "+2" e "−1", com o sinal de menos tipográfico. */
const comSinal = (n) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`);

export default function PainelDoGolpeEspecial({ derived, sessao, onSessao }) {
  // A troca por 6 do Autossuficiente é escolha da vez, e volta a 3 depois do Pagar.
  const [seis, setSeis] = useState(false);
  if (!derived?.golpeEspecial?.disponivel) return null;

  const emCombate = !!sessao?.combate?.ativo;
  const marcas = marcasDoGolpe(sessao);
  const auto = !!derived.golpeEspecial.autossuficiente;
  const seisUsado = seisDoAutossuficienteUsado(sessao);
  const querSeis = auto && seis && !seisUsado;
  const custo = custoDoGolpeDaSessao(sessao, derived, { seis: querSeis });
  const precisoRepetido = precisoPagoNaRodada(sessao);
  const peDisponivel = Math.max(0, Math.trunc(Number(sessao?.peAtual) || 0)) + peTempTotal(sessao);
  const falta = custo.montado && peDisponivel < custo.aPagar;
  const marca = (id, valor) => onSessao((s) => marcaPropriedadeGolpe(s, id, valor));
  const pagar = () => {
    onSessao((s) => pagaGolpeEspecial(s, derived, { seis: querSeis }));
    setSeis(false);
  };

  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="golpe-especial">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">Golpe Especial</h2>
        {custo.montado && (
          <span className="afty-chip" data-afty-tom="destaque">Custo {custo.total} PE</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PROPRIEDADES_GOLPE.map((p) => {
          const vezes = marcas[p.id];
          const unidade = precisoRepetido && p.custoRepetido != null ? p.custoRepetido : p.custo;
          if (!p.max) {
            return (
              <button
                key={p.id}
                type="button"
                className="afty-botao text-[11px] px-2 py-1"
                data-afty-tom={vezes ? "destaque" : undefined}
                data-afty-golpe={p.id}
                aria-pressed={!!vezes}
                disabled={!emCombate}
                title={emCombate ? undefined : "Disponível em combate"}
                onClick={() => marca(p.id, !vezes)}
              >
                {p.nome}
                <span className="afty-rotulo tabular-nums">{comSinal(unidade)}</span>
              </button>
            );
          }
          // As de contagem: Sanguinário (Leve e Médio) e Desfocado (até três).
          const rotulo = vezes ? (p.niveis?.[vezes - 1] ?? `×${vezes}`) : null;
          return (
            <span
              key={p.id}
              className="afty-botao text-[11px] px-1 py-0.5 gap-1"
              data-afty-tom={vezes ? "destaque" : undefined}
              data-afty-golpe={p.id}
            >
              <button
                type="button"
                className="afty-passo"
                disabled={!emCombate || !vezes}
                onClick={() => marca(p.id, vezes - 1)}
                aria-label={`${p.nome} menos 1`}
              >−</button>
              <span>
                {p.nome}{rotulo ? ` ${rotulo}` : ""}
                <span className="afty-rotulo tabular-nums"> {comSinal(unidade)}</span>
              </span>
              <button
                type="button"
                className="afty-passo"
                disabled={!emCombate || vezes >= p.max}
                onClick={() => marca(p.id, vezes + 1)}
                aria-label={`${p.nome} mais 1`}
              >+</button>
            </span>
          );
        })}
      </div>

      <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
        {auto && (
          <button
            type="button"
            className="afty-botao text-[11px] px-2 py-1"
            data-afty-tom={querSeis ? "destaque" : undefined}
            aria-pressed={querSeis}
            disabled={!emCombate || seisUsado}
            onClick={() => setSeis((v) => !v)}
          >
            Autossuficiente {querSeis ? 6 : 3} PE
          </button>
        )}
        {falta && (
          <span className="text-amber-400 text-xs flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            PE Insuficiente
          </span>
        )}
        <button
          type="button"
          className="afty-botao ml-auto"
          data-afty-tom="destaque"
          disabled={!emCombate || !custo.montado || falta}
          onClick={pagar}
        >
          Pagar {custo.montado ? custo.aPagar : 0} PE
          {marcas.sacrificio ? " e 15 de Dano" : ""}
        </button>
      </div>
    </section>
  );
}
