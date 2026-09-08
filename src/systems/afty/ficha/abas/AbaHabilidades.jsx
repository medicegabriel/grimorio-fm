import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import GrupoComSubAbas from "../GrupoComSubAbas";
import { GRUPOS } from "../ficha-conteudo";
import TextoRico from "../../ui/TextoRico";
import FiltroDeHabilidades from "../../ui/FiltroDeHabilidades";
import { filtraHabilidades, correspondeFiltroHabilidade } from "../../afty-filtro-habilidades";

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

/**
 * Um Funcionamento Básico, que é o texto que o próprio autor escreveu para a
 * Técnica desta criatura. Vêm de `funcionamentosDaFicha`, que junta o principal
 * (`core.tecnicaDescricao`) com os adicionais.
 *
 * ⚠ NÃO é um `ItemDeFicha`, e a diferença importa: o item renderiza um `<p>`
 * corrido, e este campo aceita título, subtítulo e tabela desde 2026-08-07.
 * Passar por ali achataria a formatação justamente onde ela foi pedida.
 *
 * ⚠ FECHADO POR PADRÃO desde 2026-09-08 (autor: *"Faça com que os
 * Funcionamentos Básicos sempre comece FECHADO ao invés de aberto"*). Antes era
 * aberto, com o argumento de que são um ou dois cartões e que eles descrevem a
 * criatura. O argumento não sobreviveu ao conteúdo real: um Funcionamento com
 * tabela e subtítulos ocupa várias telas, e com quatro deles a aba Habilidades
 * abria com o livro inteiro escancarado antes da primeira habilidade. Agora
 * segue a mesma regra do `ItemDeFicha`, e abrir é um clique.
 */
function CartaoTecnica({ titulo, texto }) {
  const [aberto, setAberto] = useState(false);
  const corpo = String(texto ?? "").trim();
  // O pai já filtrou pelo mesmo índice usado nas habilidades do catálogo.
  if (!corpo) return null;

  return (
    <section className="afty-card p-3 afty-tecnica">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
      >
        {aberto
          ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
        <h2 className="afty-card-titulo flex-1" data-afty-linha>{titulo}</h2>
      </button>
      {/* ⚠ SEM a classe `afty-texto` aqui. Ela carrega `max-width: 78ch`, que é
          a medida de leitura de um parágrafo — e no container ela estrangulava
          o cartão inteiro, tabela junto, em metade da largura. O `TextoRico`
          aplica a medida bloco a bloco, que é onde ela faz sentido. */}
      {aberto && <TextoRico texto={corpo} className="mt-2" />}
    </section>
  );
}

export default function AbaHabilidades({ funcionamentos = [], itens, abertos, onAberto, favoritos, onFavorito, destaque }) {
  const [termo, setTermo] = useState("");
  const [efeitoFiltro, setEfeitoFiltro] = useState("todos");
  const filtrados = useMemo(() => filtraHabilidades(itens, efeitoFiltro, termo), [itens, efeitoFiltro, termo]);
  const tecnicasFiltradas = funcionamentos.filter((f) => correspondeFiltroHabilidade(f, efeitoFiltro, termo));

  const porGrupo = useMemo(() => {
    const mapa = new Map(GRUPOS.map((g) => [g.id, []]));
    for (const i of filtrados) mapa.get(i.grupo)?.push(i);
    return mapa;
  }, [filtrados]);

  return (
    <div className="space-y-3">
      <div className="afty-card p-2">
        <FiltroDeHabilidades rotulo="Filtrar as habilidades" efeito={efeitoFiltro} onEfeito={setEfeitoFiltro}
          termo={termo} onTermo={setTermo} visiveis={filtrados.length} total={itens.length} />
      </div>

      {/* Um cartão por Funcionamento Básico, o principal primeiro. O adicional
          leva o nome que o jogador deu, e o principal leva o rótulo do sistema:
          ele é a técnica, e não tem nome próprio. Cartão sem texto não aparece,
          então uma ficha sem nada escrito continua idêntica ao que era. */}
      {tecnicasFiltradas.map((f) => (
        <CartaoTecnica key={f.id} titulo={f.nome} texto={f.descricao} />
      ))}

      {filtrados.length === 0 && tecnicasFiltradas.length === 0 && <p className="afty-vazio py-2" role="status">Nenhuma habilidade encontrada</p>}

      {GRUPOS.map((g) => (
        <GrupoComSubAbas
          key={g.id}
          grupo={g}
          lista={porGrupo.get(g.id) ?? []}
          abertos={abertos}
          onAberto={onAberto}
          favoritos={favoritos}
          onFavorito={onFavorito}
          destaque={destaque}
        />
      ))}
    </div>
  );
}
