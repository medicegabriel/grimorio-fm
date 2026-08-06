import React, { useMemo, useState } from "react";
import { Search, X, AlertTriangle } from "lucide-react";

import GrupoComSubAbas from "../GrupoComSubAbas";
import { NumeroComFontes } from "../../ui/fontes";
import { numeroBr } from "../../ui/formato";
import { filtraConteudo } from "../ficha-conteudo";

/**
 * ============================================================
 * ABA EQUIPAMENTOS — o que a criatura está CARREGANDO
 * ============================================================
 * A tela de jogo não tinha inventário: as armas, os uniformes, os escudos e os
 * itens existiam no criador e nunca chegavam à mesa. O jogador que quisesse ler
 * o que o próprio talismã faz tinha de voltar ao criador.
 *
 * ⚠ NADA aqui é editável. Comprar, equipar e encantar são escolhas de ficha, e
 * escolha mora no criador. Isto é a mesma decisão da aba Habilidades.
 *
 * ⚠ Os números do equipamento NÃO se repetem aqui. O bônus de Defesa do
 * uniforme, a RD do escudo e o acerto da Ferramenta já entram na Defesa, na RD e
 * na linha de Dano, com as fontes no hover de cada um. Repetir aqui seria
 * convidar o jogador a somar duas vezes. O que esta aba mostra é o que NÃO está
 * em lugar nenhum: o que ele carrega, quanto pesa e o texto de cada item.
 * ============================================================
 */

/**
 * A carga.
 *
 * ⚠ A sobrecarga é o único número que esta aba mostra, e ela ganhou destaque
 * porque é uma penalidade que se esquece: −5 de Defesa e −4,5m de Deslocamento
 * saem do nada se ninguém disser de onde vêm. Os dois já estão descontados nos
 * números do cabeçalho.
 */
function Carga({ carga }) {
  const limite = Math.max(1, carga.cargaLimite || 1);
  const pct = Math.min(100, (carga.espacosUsados / limite) * 100);
  const nivel = carga.acimaDoMaximo ? "critico" : carga.sobrecarregado ? "baixo" : "normal";
  return (
    <section className="afty-card p-3" data-afty-carga={nivel}>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1">Carga</h2>
        {carga.sobrecarregado && (
          <span className="afty-chip" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Sobrecarregado
          </span>
        )}
        <span className="afty-valor text-[13px] tabular-nums">
          {carga.espacosUsados} / {carga.cargaLimite}
        </span>
      </div>
      <div className="afty-vital-trilho flex" data-afty-vital="carga">
        <span
          className="afty-vital-barra"
          style={{ width: `${pct}%`, "--afty-vital-cor": carga.sobrecarregado ? "var(--afty-aviso)" : "var(--afty-destaque)" }}
        />
      </div>
      {carga.sobrecarregado && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="afty-chip" data-afty-tom="aviso">Defesa {carga.defesa}</span>
          <span className="afty-chip" data-afty-tom="aviso">Deslocamento {numeroBr(carga.movimento)}m</span>
          {carga.acimaDoMaximo && (
            <span className="afty-chip" data-afty-tom="aviso">Máximo {carga.cargaMaxima}</span>
          )}
        </div>
      )}
    </section>
  );
}

export default function AbaEquipamentos({
  derived, itens, abertos, onAberto, favoritos, onFavorito, destaque,
}) {
  const [termo, setTermo] = useState("");
  const filtrados = useMemo(() => filtraConteudo(itens, termo), [itens, termo]);
  const carga = derived.carga ?? null;
  const avisos = derived.equip?.avisos ?? [];
  const penalidade = derived.penalidadeDestreza ?? 0;

  return (
    <div className="space-y-3">
      {carga && <Carga carga={carga} />}

      {/* Os avisos do equipamento (dois uniformes vestidos, encantamento acima
          do grau). Eles existem no criador e some-los aqui seria esconder do
          jogador justo o que está errado na ficha dele. */}
      {avisos.length > 0 && (
        <section className="afty-card p-3">
          <h2 className="afty-card-titulo mb-2">Avisos</h2>
          <div className="space-y-1">
            {avisos.map((a) => (
              <div key={a} className="afty-linha px-2.5 py-1.5 flex items-start gap-2">
                <AlertTriangle
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                  style={{ color: "var(--afty-aviso)" }}
                  aria-hidden="true"
                />
                <span className="afty-rotulo text-[12px]">{a}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="afty-card p-2 flex items-center gap-2">
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setTermo(""); }}
          placeholder="Filtrar"
          aria-label="Filtrar o inventário"
          className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
        />
        {termo && (
          <button type="button" className="afty-passo" onClick={() => setTermo("")} aria-label="Limpar o filtro">
            <X className="w-3 h-3" />
          </button>
        )}
        {penalidade !== 0 && (
          <NumeroComFontes
            valor={penalidade}
            partes={derived.partes?.penalidadeDestreza}
            total={penalidade}
            className="afty-valor text-[12px] flex-shrink-0"
            ancora="direita"
            titulo="Penalidade de Destreza do uniforme e do escudo"
          />
        )}
        <span className="afty-rotulo text-[11px] flex-shrink-0 tabular-nums">
          {filtrados.length} / {itens.length}
        </span>
      </div>

      {itens.length === 0 ? (
        <section className="afty-card p-3">
          <p className="afty-vazio">Nada Carregado</p>
        </section>
      ) : (
        <GrupoComSubAbas
          grupo={{ id: "equipamento", label: "Inventário" }}
          lista={filtrados}
          abertos={abertos}
          onAberto={onAberto}
          favoritos={favoritos}
          onFavorito={onFavorito}
          destaque={destaque}
        />
      )}
    </div>
  );
}
