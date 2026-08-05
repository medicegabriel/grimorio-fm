import React from "react";
import { ChevronDown, ChevronRight, Star, AlertTriangle } from "lucide-react";

import { useDestaque } from "./usar-destaque";

/**
 * ============================================================
 * ITEM DE FICHA — uma Habilidade, Talento, Aptidão ou Melhoria
 * ============================================================
 * Fechado é só o nome e as marcas, aberto traz o TEXTO VERBATIM do livro.
 *
 * ⚠ Fechado por padrão, e é uma escolha e não preguiça: uma criatura de ND alto
 * tem 40 itens, e 40 parágrafos abertos de uma vez é uma parede que ninguém lê.
 * O que resolve o "achar" é a busca, não o texto todo à mostra.
 *
 * ⚠ Nada do texto é reescrito, resumido ou cortado. É a regra mais antiga do
 * projeto, e na Ficha ela vale ainda mais: isto é o que o jogador lê na mesa
 * para saber o que a habilidade dele faz.
 *
 * A ESTRELA fixa o item no Rápido, no topo da aba Ações. Uma ficha de ND 40 tem
 * 40 itens e o jogador usa seis: fixar é o que faz a diferença entre procurar e
 * ter à mão.
 * ============================================================
 */

export default function ItemDeFicha({ item, aberto, onAberto, favorito, onFavorito, destacado }) {
  const raiz = useDestaque(destacado);

  return (
    <div
      ref={raiz}
      id={`afty-item-${item.chave}`}
      className="afty-linha"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          className="afty-estrela"
          data-afty-ativa={favorito ? "sim" : undefined}
          onClick={() => onFavorito(item.chave)}
          aria-pressed={!!favorito}
          title={favorito ? "Tirar do Rápido" : "Fixar no Rápido"}
          aria-label={favorito ? `Tirar ${item.nome} do Rápido` : `Fixar ${item.nome} no Rápido`}
        >
          <Star className="w-3.5 h-3.5" fill={favorito ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
          onClick={() => onAberto(item.chave)}
          aria-expanded={!!aberto}
        >
          {aberto
            ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
          <span className="text-[12px] font-semibold truncate">{item.nome}</span>
        </button>

        {item.opcoes.length > 0 && !aberto && (
          <span className="afty-rotulo text-[10px] truncate max-w-[10rem] hidden sm:block">
            {item.opcoes.map((o) => o.nome).join(", ")}
          </span>
        )}
        {item.tags.map((t) => (
          <span key={t} className="afty-chip hidden sm:inline-flex">{t}</span>
        ))}
        {item.aviso && (
          <span className="afty-chip" data-afty-tom="aviso" title={item.aviso}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{item.aviso}</span>
          </span>
        )}
      </div>

      {aberto && (
        <div className="px-2 pb-2 pl-8">
          {item.texto && <p className="afty-texto">{item.texto}</p>}
          {item.opcoes.length > 0 && (
            <div className="mt-2 space-y-1">
              {item.opcoes.map((o) => (
                <div key={o.id} className="afty-opcao px-2 py-1.5">
                  <span className="text-[11px] font-semibold">{o.nome}</span>
                  {o.descricao && <p className="afty-texto mt-1">{o.descricao}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
