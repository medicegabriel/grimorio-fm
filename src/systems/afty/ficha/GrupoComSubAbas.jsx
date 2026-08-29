import React, { useMemo, useState } from "react";

import ItemDeFicha from "./ItemDeFicha";
import SubAbas from "./SubAbas";

/**
 * As sub-abas de um grupo, na ordem em que os itens aparecem.
 *
 * ⚠ Devolve VAZIO quando há uma divisão só. Uma sub-aba solitária não divide
 * nada e só rouba uma fileira da tela: um ficha de classe única veria "Lutador"
 * sozinho por cima da lista que já é toda do Lutador.
 */
function subsDe(lista) {
  const mapa = new Map();
  for (const i of lista) {
    if (!i.sub) continue;
    if (!mapa.has(i.sub.id)) mapa.set(i.sub.id, { ...i.sub, quantos: 0 });
    mapa.get(i.sub.id).quantos += 1;
  }
  const subs = [...mapa.values()];
  return subs.length > 1 ? subs : [];
}

/**
 * Um grupo, com ou sem sub-abas.
 *
 * ⚠ A sub-aba ativa é ESTADO DE TELA, e ela se conserta sozinha em dois casos
 * que acontecem o tempo todo: o filtro esvaziar a divisão aberta, e a busca
 * global navegar para um item que mora em outra. Sem isso o jogador buscaria uma
 * Habilidade, a Ficha trocaria para esta aba e não mostraria nada.
 */
export default function GrupoComSubAbas({ grupo, lista, abertos, onAberto, favoritos, onFavorito, destaque }) {
  const subs = useMemo(() => subsDe(lista), [lista]);
  // ⚠ A escolha guarda TAMBÉM qual destaque estava valendo quando ela foi feita.
  // É o que deixa a conta abaixo ser de LEITURA: um efeito que escrevesse a
  // sub-aba ao ver um destaque novo seria renderização em cascata para chegar no
  // mesmo lugar, e o eslint do projeto barra isso (react-hooks/set-state-in-effect).
  const [ativa, setAtiva] = useState({ id: null, destaqueVisto: null });

  if (!lista.length) return null;

  // Onde mora o item que a busca escolheu. Enquanto ele for NOVO, ele manda:
  // sem isso o jogador buscaria uma Habilidade, a Ficha trocaria para esta aba e
  // não mostraria nada, porque o item estaria atrás de outra divisão.
  const subDoDestaque = destaque
    ? lista.find((i) => i.chave === destaque)?.sub?.id ?? null
    : null;
  const forcada = subDoDestaque && destaque !== ativa.destaqueVisto ? subDoDestaque : null;

  // A ativa de verdade: a forçada pela busca, senão a escolhida (se ela ainda
  // tem item, porque o filtro pode ter esvaziado), senão a primeira.
  const efetiva = forcada
    ?? (subs.some((s) => s.id === ativa.id) ? ativa.id : (subs[0]?.id ?? null));
  const visiveis = efetiva ? lista.filter((i) => i.sub?.id === efetiva) : lista;
  // A tag que repete o nome da sub-aba aberta vira ruído: o cabeçalho já diz.
  const rotuloAtivo = subs.find((s) => s.id === efetiva)?.label ?? null;

  return (
    <section className="afty-card p-3">
      <h2 className="afty-card-titulo mb-2">{grupo.label}</h2>

      <SubAbas
        subs={subs}
        ativa={efetiva}
        rotulo={grupo.label}
        onAtiva={(id) => setAtiva({ id, destaqueVisto: destaque })}
      />

      <div className="space-y-1">
        {visiveis.map((i) => (
          <ItemDeFicha
            key={i.chave}
            item={rotuloAtivo ? { ...i, tags: i.tags.filter((t) => t.label !== rotuloAtivo) } : i}
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
}

