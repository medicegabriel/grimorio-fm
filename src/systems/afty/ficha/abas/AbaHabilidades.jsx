import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import ItemDeFicha from "../ItemDeFicha";
import { GRUPOS, filtraConteudo } from "../ficha-conteudo";

/**
 * ============================================================
 * ABA HABILIDADES — tudo que a criatura escolheu, com o texto do livro
 * ============================================================
 * Seis grupos, na ordem em que o sistema os apresenta: Origem, Habilidades de
 * Especialização, Talentos, Habilidades Gerais, Aptidões Amaldiçoadas e Níveis
 * Lendários. Grupo sem nenhum item some inteiro.
 *
 * ⚠ Esta aba NÃO edita nada. Trocar Habilidade é escolha de ficha, e escolha
 * mora no criador. Aqui se lê, se fixa no Rápido e se busca.
 *
 * O filtro daqui é LOCAL e some com o Esc. A busca global (Ctrl+K) é outra
 * coisa: ela varre também os números das outras abas e navega até eles.
 * ============================================================
 */

export default function AbaHabilidades({ itens, abertos, onAberto, favoritos, onFavorito, destaque }) {
  const [termo, setTermo] = useState("");
  const filtrados = useMemo(() => filtraConteudo(itens, termo), [itens, termo]);

  const porGrupo = useMemo(() => {
    const mapa = new Map(GRUPOS.map((g) => [g.id, []]));
    for (const i of filtrados) mapa.get(i.grupo)?.push(i);
    return mapa;
  }, [filtrados]);

  return (
    <div className="space-y-3">
      <div className="afty-card p-2 flex items-center gap-2">
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setTermo(""); }}
          placeholder="Filtrar"
          aria-label="Filtrar as habilidades"
          className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
        />
        {termo && (
          <button type="button" className="afty-passo" onClick={() => setTermo("")} aria-label="Limpar o filtro">
            <X className="w-3 h-3" />
          </button>
        )}
        <span className="afty-rotulo text-[11px] flex-shrink-0 tabular-nums">
          {filtrados.length} / {itens.length}
        </span>
      </div>

      {GRUPOS.map((g) => {
        const lista = porGrupo.get(g.id) ?? [];
        if (!lista.length) return null;
        return (
          <section key={g.id} className="afty-card p-3">
            <h2 className="afty-card-titulo mb-2">{g.label}</h2>
            <div className="space-y-1">
              {lista.map((i) => (
                <ItemDeFicha
                  key={i.chave}
                  item={i}
                  aberto={abertos.has(i.chave)}
                  onAberto={onAberto}
                  favorito={favoritos.includes(i.chave)}
                  onFavorito={onFavorito}
                  destacado={destaque === i.chave}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
