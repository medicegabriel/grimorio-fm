import React from "react";
import { Flame, Shield, HeartPulse, Sparkles, Anchor, PenLine } from "lucide-react";

/**
 * ============================================================
 * O TIPO DO FEITIÇO, COM CARA
 * ============================================================
 * Nasceu em 2026-09-07, na revisão de aparência dos Feitiços. O relato do autor
 * tem duas metades e esta é a raiz das duas: *"não é intuitivo para CRIAR um
 * Feitiço, com as pessoas levando muito tempo para se acharem no criador"* e
 * *"dificuldades de obter as informações na ficha final"*.
 *
 * O TIPO é a decisão que troca o editor inteiro, e ele era seis chips de texto
 * idênticos no meio do cartão. Um ícone não é texto explicativo (que a regra da
 * casa proíbe): é a MESMA marca aparecendo na escolha, na miniatura da fileira e
 * na linha da Ficha, e é o que faz reconhecer um Feitiço de Dano de relance nas
 * três telas.
 *
 * ⚠ POR QUE UM MÓDULO E NÃO UM MAPA EM CADA TELA. Criador e Ficha mostram o
 * mesmo tipo. Dois mapas de ícone divergiriam no primeiro tipo novo, e o repo já
 * pagou isso: é a mesma razão de `ui/fontes.jsx` e `ui/vital.jsx` existirem.
 *
 * ⚠ ESTE MÓDULO É FOLHA, e exporta SÓ COMPONENTE. Ele importa o lucide e mais
 * nada do Afty, então nenhuma ordem de avaliação o alcança (a lição do ciclo de
 * 2026-09-02, que abria o app em branco). Os rótulos e a lista de tipos moram em
 * `afty-feiticos.js`, que é onde eles são DADO: re-exportá-los daqui criaria uma
 * segunda porta para a mesma tabela, e quebraria o fast refresh de um arquivo de
 * componentes.
 */

/* ⚠ NENHUM ÍCONE SE REPETE, e nenhum deles é o `Zap`. O raio já é a ENERGIA em
   toda a Ficha (o vital de PE, o custo em PE de cada linha), e usá-lo para o
   Feitiço de Dano faria a mesma forma querer dizer duas coisas na mesma tela. */
const ICONES = {
  dano: Flame,
  auxiliar: Shield,
  curativo: HeartPulse,
  especial: Sparkles,
  passivo: Anchor,
  personalizado: PenLine,
};

/* ⚠ A BUSCA NO MAPA FICA FORA DO COMPONENTE, e não é firula de lint. O
   `react-hooks/static-components` reprova componente resolvido DENTRO do corpo
   de outro, porque o caso comum disso é um componente criado a cada render, que
   perde estado. Aqui o valor é estático desde o módulo, e tirar a busca do corpo
   diz isso ao leitor e à regra ao mesmo tempo. */
const renderIcone = (tipo, className) => {
  const Icone = ICONES[tipo];
  return Icone ? <Icone className={className} aria-hidden="true" /> : null;
};

/**
 * O ícone do tipo, pronto para pendurar numa linha. Tipo desconhecido não
 * desenha nada, em vez de quebrar: ficha antiga com um tipo que saiu do
 * catálogo continua abrindo.
 *
 * ⚠ `aria-hidden`: o tipo já vem escrito ao lado em toda tela que usa isto, e
 * anunciar o ícone leria o mesmo rótulo duas vezes.
 */
export function IconeDeTipo({ tipo, className = "w-3.5 h-3.5" }) {
  return renderIcone(tipo, className);
}

export default IconeDeTipo;
