/**
 * ============================================================
 * TÉCNICA MÁXIMA NA MESA (autor, 2026-10-08)
 * ============================================================
 * O controle que entra na linha do Feitiço quando ele é uma Técnica Máxima, na
 * Ficha Final e no Encontro (as duas telas montam a mesma `AbaAcoes`).
 *
 * Usar (DA-08) confere disponibilidade, requisito e PE, gasta o custo final e
 * abre a recarga. A rolagem continua sendo a da própria linha. Toda regra mora
 * em `ficha-sessao.js` (`situacaoDaTecnicaMaxima`, `usaTecnicaMaxima`): aqui só
 * se desenha o estado e se chama a função.
 * ============================================================
 */
import { Minus, Plus } from "lucide-react";
import { NumeroComFontes } from "../ui/fontes";
import {
  situacaoDaTecnicaMaxima, usaTecnicaMaxima, ajustaRecarga, iniciaRecargaPendente,
} from "./ficha-sessao";

const ROTULO_ESCALA = { 5: "Escala Nível 5", max: "Escala Técnica Máxima" };

export default function ControleTecnicaMaxima({ f, sessao, onSessao }) {
  const s = situacaoDaTecnicaMaxima(sessao, f);
  if (!s) return null;
  const tm = f.tecnicaMaxima;
  const r = s.recarga;
  // UM chip de estado: a recarga, se houver, senão o motivo de não poder usar.
  const estado = r?.aguardando ? "Aguarda Dissipar"
    : r?.restantes > 0 ? `Faltam ${r.restantes} ${r.restantes === 1 ? "Rodada" : "Rodadas"}`
      : s.disponivel ? "Disponível" : s.motivo;
  return (
    <div className="afty-linha flex flex-wrap items-center gap-2 p-2 text-xs" data-afty-tecnica-maxima="sim">
      <span className="afty-chip" data-afty-tom="destaque">Técnica Máxima</span>
      {tm.legacy && <span className="afty-chip">Modelo Anterior</span>}
      {tm.escala != null && <span className="afty-chip">{ROTULO_ESCALA[tm.escala] ?? tm.escala}</span>}
      <span className="afty-rotulo flex items-center gap-1">
        Recarga
        <NumeroComFontes
          valor={`${s.total} ${s.total === 1 ? "Rodada" : "Rodadas"}`}
          partes={tm.partesRecarga}
          total={s.total}
          formatar={false}
          className="afty-valor"
          titulo="Recarga da Técnica Máxima"
        />
      </span>
      <span className="afty-chip" data-afty-tom={s.disponivel ? undefined : "aviso"}>{estado}</span>
      {r?.restantes > 0 && (
        <span className="flex items-center gap-1">
          <button type="button" className="afty-botao" aria-label="Uma rodada a menos"
            onClick={() => onSessao((x) => ajustaRecarga(x, f.id, -1))}>
            <Minus className="w-3 h-3" aria-hidden="true" />
          </button>
          <button type="button" className="afty-botao" aria-label="Uma rodada a mais"
            onClick={() => onSessao((x) => ajustaRecarga(x, f.id, 1))}>
            <Plus className="w-3 h-3" aria-hidden="true" />
          </button>
        </span>
      )}
      {r?.aguardando && (
        <button type="button" className="afty-botao" onClick={() => onSessao((x) => iniciaRecargaPendente(x, f.id))}>
          Iniciar Recarga
        </button>
      )}
      <span className="flex-1" />
      <button
        type="button"
        className="afty-botao"
        data-afty-tom={s.disponivel ? "destaque" : undefined}
        disabled={!s.disponivel}
        onClick={() => onSessao((x) => usaTecnicaMaxima(x, f))}
      >
        Usar {s.custo} PE
      </button>
    </div>
  );
}
