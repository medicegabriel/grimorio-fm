import { useLayoutEffect, useState } from "react";
import { EyeOff, Tag, HeartPulse, Eye, Swords, User, Shield } from "lucide-react";

/* As constantes e o gancho das telas do Encontro (etapa 6a, 2026-11-17), fora dos `.jsx` para o recarregamento rápido do
   Vite (o lint pede que arquivo de componente exporte só componente). As peças estão em `pecas-encontro.jsx`. */

export const LADO_PECA = {
  inimigo: { rotulo: "Inimigo", plural: "Inimigos", icone: Swords },
  jogador: { rotulo: "Jogador", plural: "Jogadores", icone: User },
  aliado: { rotulo: "Aliado", plural: "Aliados", icone: Shield },
};

export const VISAO_ICONE = { oculta: EyeOff, nome: Tag, barra: HeartPulse, aberta: Eye };

/** "1 Combatente", "2 Combatentes". */
export const contagem = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/* ---------- a largura medida (no lugar do @container onde a Ficha G2 mora dentro) ---------- */

/**
 * A largura do PRÓPRIO elemento, em faixas (`limiares` em px, do menor para o maior). Devolve o nome da faixa.
 *
 * ⚠ Por que não `@container`: `container-type: inline-size` traz contenção de leiaute, e todo elemento com ela vira o
 * bloco de contenção dos descendentes `position: fixed`. O painel de fontes da Ficha G2 embutida é `fixed`, posto pela
 * janela, e sairia deslocado. Fora da coluna da Ficha (lista, planejamento, cartões) o CSS usa `@container` de verdade.
 */
export function useFaixaDeLargura(ref, limiares) {
  const [faixa, setFaixa] = useState(limiares[0]?.[0] ?? "base");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => {
      const w = el.getBoundingClientRect().width;
      let nome = limiares[0][0];
      for (const [n, min] of limiares) if (w >= min) nome = n;
      setFaixa((f) => (f === nome ? f : nome));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  return faixa;
}

/* ---------- a faixa da luta do jogador: dados de EXEMPLO até a etapa 7c ---------- */

/** Uma luta de exemplo: Lia é a ficha aberta, Rui é colega, um Goblin está em Barra de Vida e um outro está Oculto (não aparece). */
export const FAIXA_DE_EXEMPLO = {
  rodada: 3,
  vezId: "lia",
  minhas: ["lia"],
  ordem: [
    { id: "lia", nome: "Lia Tsukino", iniciativa: 19, tipo: "minha" },
    { id: "gob1", nome: "Goblin #1", iniciativa: 15, tipo: "criatura", barra: { atual: 18, max: 40 } },
    { id: "rui", nome: "Rui", iniciativa: 12, tipo: "colega" },
    { id: "gob2", nome: "Goblin #2", iniciativa: 8, tipo: "criatura" },
  ],
};
