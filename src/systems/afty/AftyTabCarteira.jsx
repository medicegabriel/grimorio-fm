/**
 * ============================================================
 * ABA CARTEIRA — o livro-caixa das sessões da Guilda
 * ============================================================
 * Pedido do autor em 2026-09-08, com a planilha de Google Sheets dele como
 * modelo. O modelo e as contas ficam em `afty-carteira.js`, e esta tela só
 * desenha o que ele devolve.
 *
 * ⚠ ARQUIVO PRÓPRIO, pelo mesmo motivo das abas Addons, Defesas e Catarse: o
 * `AftyCreatureBuilder.jsx` passou das 15 mil linhas e o Babel já reclama do
 * tamanho ao processá-lo.
 *
 * ------------------------------------------------------------
 * A ABA SÓ EXISTE COM O ADDON
 * ------------------------------------------------------------
 * Ela é uma PRIMITIVA (`permite: ["carteira"]`), e não conteúdo de catálogo. O
 * portão está em `tabsDoSistema`, no `AftyCreatureBuilder`, e a razão está
 * escrita em docs/afty-addons.md: em 2026-08-20 a Concessão do Mestre vazou
 * para a tela de todo mundo porque o verbo foi ao motor e ninguém disse quem o
 * enxerga.
 *
 * ------------------------------------------------------------
 * O QUE A TELA DEIXA MEXER, E O QUE ELA SÓ MOSTRA
 * ------------------------------------------------------------
 *   EDITÁVEL — cada linha das duas listas (nome, os números, o tipo).
 *   DERIVADO — os cinco totais da faixa, que saem do `resolveCarteira` e nunca
 *              são digitados.
 *
 * ⚠ A LISTA EDITÁVEL SAI DO `draft`, E NUNCA DO `derived`, e isso custou o
 * primeiro defeito da aba de Catarse em 2026-09-04: o derivado é a lista JÁ
 * SANEADA, e um saneador entre o campo e o campo de volta come todo estado
 * intermediário, que é o que digitar é. **Editar sai do rascunho, mostrar
 * número sai do derivado.**
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>` e nunca o caractere. Explicação de
 * campo vai no `title`.
 * ============================================================
 */

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, GripVertical, Plus, Search, Trash2, X } from "lucide-react";
import {
  DndContext, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BoolChip, Card } from "./ui/primitivos";
import { moedaBr, decimalBr } from "./ui/formato";
import {
  CARTEIRA_TIPOS,
  CARTEIRA_GASTO_TIPOS,
  createBlankEntradaCarteira,
  createBlankGastoCarteira,
  filtraLinhasCarteira,
  moverNaCarteira,
} from "./afty-carteira";

/* ============================================================ */
/* AS RÉGUAS DAS DUAS LISTAS                                     */
/* ============================================================ */
/* ⚠ CABEÇALHO E LINHA DIVIDEM A MESMA CLASSE, e é a única forma de as colunas
   ficarem alinhadas: duas definições separadas divergem na primeira coluna que
   alguém aperta. É o mesmo motivo do `LINHA_INTERLUDIO` no builder.

   ⚠ A PRIMEIRA COLUNA É A PEGA DE ARRASTAR, e ela existe no cabeçalho também,
   como célula vazia. Sem a célula vazia lá em cima, todo rótulo anda uma coluna
   para a esquerda e o alinhamento ao centro se perde.

   ⚠ AS COLUNAS DO MEIO SÃO `fr`, E NÃO `rem`, e isso é o conserto da barra de
   rolagem horizontal (autor, 2026-09-08: *"O quê cria essa barra de arrastar
   para a direita embaixo que é bem feinha"*). A primeira versão tinha largura
   fixa em rem e um `overflow-x-auto` com `min-w` embaixo, para a linha nunca
   embrulhar. Só que a soma das larguras fixas passava da caixa em boa parte das
   telas, e aí o navegador desenhava a barra.

   Com `minmax(0, Nfr)` a soma é sempre exatamente a largura disponível: as
   colunas encolhem juntas em vez de estourar, e a linha continua sendo uma
   linha. As proporções são as larguras antigas, para a tela não mudar de cara
   em 700px, que é onde a coluna do formulário fica no desktop.

   ⚠ O `minmax(0, ...)` é obrigatório, e não `Nfr` sozinho: o mínimo automático
   de uma trilha `fr` é `auto`, ou seja, o conteúdo dela, e um `<select>` com
   "Transferência" dentro se recusaria a encolher. Voltaria a barra, pela porta
   dos fundos. */
const GRADE_ENTRADA = "grid grid-cols-[1.25rem_minmax(0,2.2fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_minmax(0,0.6fr)_minmax(0,1.5fr)_1.75rem] gap-1.5 items-center";
const GRADE_GASTO = "grid grid-cols-[1.25rem_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_1.75rem] gap-1.5 items-center";
const CABECALHO = "text-[9px] uppercase tracking-wider text-slate-500";
/* ⚠ A ALTURA É FIXA, e não sai do `py`. Um `<select>` tem métrica interna
   própria (padding e line-height que o navegador escolhe), então a mesma classe
   de padding num `<input>` e num `<select>` rende caixas de alturas DIFERENTES.
   Com `h-7` nos dois a linha inteira fecha na mesma altura. Autor, 2026-09-08:
   *"Deixa a caixa de seleção no mesmo tamanho das caixas ao lado"*. */
const CAMPO = "h-7 px-2 rounded border border-slate-800 bg-slate-950/70 text-[12px] text-slate-200 outline-none focus:border-purple-700";
/* ⚠ AS SETINHAS SAEM DE TODO CAMPO NUMÉRICO, e não é preferência: um
   `input[type=number]` reserva ~15px à direita para os botões de subir e
   descer mesmo sem desenhá-los, e essa faixa invisível joga o número meio
   degrau para o lado. Medido em 2026-09-05 na aba de Defesas.

   ⚠ E A COLUNA ALINHA PELO CENTRO, rótulo e valor (autor, 2026-09-08). É a
   regra da tela desde a aba de Defesas: alinhar pela borda é convenção de
   tabela numérica e falha aqui, onde o rótulo costuma ser bem mais largo que o
   número. Sem as três utilidades acima, `text-center` cairia meio degrau à
   esquerda do centro de verdade. */
const CAMPO_NUM = `${CAMPO} font-mono tabular-nums text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
/* ⚠ O `<select>` PERDE O CHROME NATIVO e ganha a seta do lucide, que é o padrão
   que o `MOTOR_SELECT_CLS` do builder já usa. Duas razões, e as duas são do
   autor: a seta nativa é colada na borda direita e não tem como afastá-la por
   CSS, e o chrome nativo é o que fazia a caixa sair de outro tamanho.

   ⚠ O PADDING É SIMÉTRICO de propósito. O texto centra dentro da CAIXA DE
   CONTEÚDO, então `pl-2 pr-5` o deixaria 10px à esquerda do centro real da
   caixa, que é justamente o desalinhamento que este conserto veio tirar. Os
   20px da direita são o que a seta ocupa (12px dela mais os 8px do `right-2`),
   e os 20px da esquerda existem só para equilibrar. */
const CAMPO_SELECT = `${CAMPO} w-full px-5 text-center appearance-none`;
/* ⚠ A CAIXA TEM TAMANHO PRÓPRIO E CENTRA POR FLEX (autor, 2026-09-08:
   *"Centralize o icone de lixeira dentro da caixa"*). A primeira versão era só
   `p-1` em volta do ícone, e isso errava nos dois eixos ao mesmo tempo:

     • na horizontal, a caixa nascia com 24px dentro de uma coluna de 28px, e a
       centragem do `<button>` centra o CONTEÚDO na caixa, não a caixa na
       coluna. O ícone ficava à esquerda do centro da coluna, e o alinhamento
       era o da caixa, não o do desenho.
     • na vertical, a caixa tinha 24px enquanto todo campo da linha tem 28px, e
       um SVG inline ainda se assenta na linha de base do texto.

   `h-7 w-7` casa com o `h-7` dos campos e com os 1.75rem da coluna, e o
   `flex items-center justify-center` tira o ícone da linha de base. */
const BOTAO_LIXO = "h-7 w-7 rounded border border-slate-800 text-slate-500 hover:border-rose-800 hover:text-rose-300 flex items-center justify-center";
/* ⚠ O BOTÃO DE ACRESCENTAR É O MESMO DO "NOVA PERÍCIA" (autor, 2026-09-08: *"o
   botão +Sessão também não ficou bom"*). A primeira versão era cinza sobre
   cinza, com borda `slate-800` num card `slate-900`: a borda quase não
   aparecia, e o botão lia como texto desligado em vez de ação. O do criador tem
   o roxo de acento, e é o botão que faz exatamente esta coisa noutra aba. */
const BOTAO_MAIS = "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-purple-700/70 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 transition-colors";
/* ⚠ A SETA FICA A 8px DA BORDA, e é a metade visível do conserto de 2026-09-08:
   *"desgrude a setinha da lateral direita"*. A do navegador é colada e não sai
   do lugar por CSS nenhum, então a única saída é `appearance-none` mais uma
   seta desenhada, como o `MotorChevron` do builder já faz. */
const SETA = "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none";
/* Lista vazia congelada e compartilhada, para a ficha sem carteira não criar um
   array novo a cada render. Mesma razão do `SEM_PRIMITIVAS` em afty-addons.js. */
const SEM_LINHAS = Object.freeze([]);

/* ⚠ O ARRASTE ANDA SÓ NA VERTICAL. Sem isto o `transform` do dnd-kit carrega o
   eixo X junto, a linha sai pela direita da caixa enquanto está na mão e o
   navegador abre uma barra de rolagem horizontal para alcançar o que saiu
   (autor, 2026-09-08: *"Está dando para arrastar para o lado"*).

   ⚠ É UMA FUNÇÃO DE UMA LINHA, e não o `@dnd-kit/modifiers`. O pacote existe e
   tem o `restrictToVerticalAxis` pronto, mas ele NÃO é dependência deste
   projeto: só `core`, `sortable` e `utilities` são. Um modificador do dnd-kit é
   só uma função que recebe o `transform` e devolve outro, então acrescentar uma
   dependência inteira para zerar um número seria caro pelo que entrega.

   ⚠ Ela mora FORA do componente. Dentro, seria uma função nova a cada render e
   o `DndContext` receberia um array de modificadores diferente toda vez. */
const SO_VERTICAL = [({ transform }) => ({ ...transform, x: 0 })];

/* ============================================================ */
/* O SELETOR DE TIPO                                             */
/* ============================================================ */
/* As duas listas o usam com catálogos diferentes. Ele é um componente e não
   duas cópias porque o `relative` e a posição da seta têm de andar juntos: em
   cópia, o primeiro ajuste conserta um dos dois e deixa o outro para trás.

   ⚠ TIPO DESCONHECIDO CAI NO NEUTRO NA TELA, e o que estava gravado vai para o
   `title`. A linha não morre por causa dele, porque o tipo é etiqueta e não
   decide conta nenhuma. Ver a nota do `normalizaEntradaCarteira`. */
function Seletor({ valor, opcoes, onChange, dica }) {
  const conhecido = opcoes.some((o) => o.id === valor);
  return (
    <div className="relative min-w-0">
      <select
        value={conhecido ? valor : ""}
        onChange={(e) => onChange(e.target.value)}
        title={!conhecido && valor ? `Tipo desconhecido na ficha: ${valor}` : dica}
        className={CAMPO_SELECT}
      >
        {opcoes.map((o) => (
          <option key={o.id || "neutro"} value={o.id}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className={SETA} aria-hidden="true" />
    </div>
  );
}

/* ============================================================ */
/* A FAIXA DE TOTAIS                                             */
/* ============================================================ */
/* É a coluna do meio da planilha do autor: grudada no topo, porque é o número
   que ele consulta a cada linha que lança. Mesmo padrão da faixa de saldo da
   Loja de Catarse e da barra de resultado da Invocação. */
/* ⚠ O LADRILHO É O `PilhaRd` DA ABA DE RESISTÊNCIAS, e a cópia é o pedido do
   autor (2026-09-08): *"poderia ficar com aparência proxima a da aba de
   Resistências. Essa cor de fundo sendo diferente ficou meio esquisita aos
   olhos"*. Rótulo pequeno em cima, número grande embaixo, caixa escura sobre o
   card claro.

   ⚠ O NÚMERO É `text-base`, E NÃO `text-lg` COMO LÁ. A RD é um inteiro de um ou
   dois dígitos, e aqui cabe "$ 51.117,00": no tamanho de lá, o valor estoura o
   ladrilho na largura de cinco colunas. É a única divergência, e ela é de
   conteúdo, não de gosto. */
function Total({ rotulo, valor, dica, tom = "normal" }) {
  return (
    <div title={dica} className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
      <div className={`${CABECALHO} truncate`}>{rotulo}</div>
      <div className={`font-mono font-bold text-base tabular-nums ${
        tom === "ruim" ? "text-rose-300" : tom === "forte" ? "text-purple-300" : "text-white"
      }`}
      >
        {valor}
      </div>
    </div>
  );
}

/* ⚠ A FAIXA CONTINUA GRUDANDO, e agora com o fundo DO PRÓPRIO CARD. A primeira
   versão pintava `slate-950/95`, uma cor que não existe em mais lugar nenhum do
   criador: o card é `slate-900` e o escuro vive dentro dos ladrilhos. Era isso
   que saltava aos olhos.

   ⚠ O FUNDO PRECISA SER OPACO, e por isso ele não é `bg-slate-900/80`: ela gruda
   por cima da lista enquanto a pessoa rola, e fundo translúcido deixaria as
   linhas passarem por baixo dos números.

   O `-mt-4` come o padding de cima do corpo do card, para a faixa encostar na
   barra do título em vez de flutuar a quatro pixels dela. */
function FaixaDaCarteira({ extrato }) {
  return (
    <div
      className="sticky z-10 -mx-4 -mt-4 px-4 pt-4 pb-3 mb-3 bg-slate-900 border-b border-slate-800"
      style={{ top: "var(--afty-topo, 0px)" }}
    >
      {/* ⚠ AS COLUNAS TODAS SÓ ENTRAM NO `xl`, e não no `lg` como na aba de
          Resistências. Lá o ladrilho carrega um inteiro de um ou dois dígitos,
          e aqui carrega "$ 51.117,00": em cinco colunas na largura de 1024px o
          ladrilho fica com ~97px de conteúdo e o valor não cabe. Em três
          colunas ele cabe com folga, e a partir de 1280px as cinco entram.

          ⚠ AS DUAS CLASSES ESTÃO ESCRITAS POR EXTENSO porque o Tailwind lê o
          código-fonte e não enxerga nome de classe montado em template. É a
          mesma nota das pilhas de RD na aba de Resistências. */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${
        extrato.alimentaNivel ? "xl:grid-cols-6" : "xl:grid-cols-5"
      }`}
      >
        {/* ⚠ O NÍVEL SÓ APARECE COM A LIBERAÇÃO `carteiraNivel`. Sem ela a
            tabela continua sendo calculada (ela é uma leitura do XP), mas
            mostrá-la aqui anunciaria um nível que a ficha não tem. */}
        {extrato.alimentaNivel && (
          <Total
            rotulo="Nível"
            valor={extrato.nivel}
            tom="forte"
            dica={extrato.proximo
              ? `Faltam ${decimalBr(extrato.proximo.falta)} de XP para o Nível ${extrato.proximo.nivel}`
              : "O último nível da tabela de progressão"}
          />
        )}
        <Total rotulo="XP Total" valor={decimalBr(extrato.xpTotal)} dica="Soma da coluna XP de todas as sessões" />
        <Total
          rotulo="Interlúdios"
          valor={extrato.interludios}
          tom={extrato.alimentaFocos ? "forte" : "normal"}
          dica={extrato.alimentaFocos
            ? "Soma da coluna Interlúdios. Este addon a usa como orçamento de Focos na aba Interlúdios"
            : "Soma da coluna Interlúdios de todas as sessões"}
        />
        <Total rotulo="Recebido" valor={moedaBr(extrato.ganho)} dica="Soma da coluna $ de todas as sessões" />
        <Total rotulo="Retirado" valor={moedaBr(extrato.retirado)} dica="Soma dos gastos da lista de baixo" />
        <Total
          rotulo="Atual"
          valor={moedaBr(extrato.atual)}
          tom={extrato.atual < 0 ? "ruim" : "forte"}
          dica="Recebido menos Retirado"
        />
      </div>
    </div>
  );
}

/* ============================================================ */
/* A PEGA DE ARRASTAR                                            */
/* ============================================================ */
/* Uma linha das duas listas, arrastável. Autor, 2026-09-08: *"coloque Filtros e
   a opção de arrastar assim como feito em Pericias"*.
 *
 * ⚠ É COMPONENTE, e não um `map` com `useSortable` dentro, porque `useSortable`
 * é um HOOK e hook não pode ser chamado dentro de um laço de render. A aba de
 * Perícias aprendeu isso em 2026-08-30 e teve de extrair a linha dela pelo mesmo
 * motivo. Ver `LinhaPericiaOrdenavel`.
 *
 * ⚠ AQUI NÃO TEM `DragOverlay`, e lá tem. Não é esquecimento: a linha de
 * Perícias é uma caixa própria, e esta é um conjunto de TRILHAS de uma grade.
 * Uma cópia flutuante dela nasceria sem as colunas da grade e sairia com outra
 * largura, então o que segue o cursor é a linha de verdade, pelo `transform` do
 * próprio `useSortable`, com um anel roxo para dizer qual é.
 *
 * O grupo do hover chama-se `linha` de propósito, e não `group` puro: o `group`
 * sem nome já é do `ValorComFontes`, e um `group-hover` sem nome responde a
 * qualquer ancestral com a classe. */
function LinhaArrastavel({ id, grade, rotulo, children }) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${grade} group/linha ${
        isDragging ? "relative z-10 rounded ring-2 ring-purple-400/80 shadow-xl shadow-purple-950/60" : ""
      }`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        /* `touch-none` é obrigatório: sem ele o navegador rola a página no dedo
           e o arraste nunca começa. */
        className={`w-5 h-5 rounded flex items-center justify-center touch-none transition-opacity ${
          isDragging
            ? "opacity-100 text-purple-300 cursor-grabbing"
            : "opacity-30 group-hover/linha:opacity-100 focus-visible:opacity-100 text-slate-500 hover:text-purple-300 hover:bg-slate-800 cursor-grab"
        }`}
        title="Arrastar para reordenar"
        aria-label={`Reordenar ${rotulo}`}
      >
        <GripVertical className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}

/* ============================================================ */
/* O FILTRO                                                      */
/* ============================================================ */
/* Mesmo desenho do `FiltroDeHabilidades`: uma fileira de chips e uma caixa de
   busca com o contador `visíveis / total`.
 *
 * ⚠ É CÓPIA DO DESENHO, e não import daquele componente, porque ele é casado
 * com o `FILTROS_HABILIDADE` (os eixos de efeito de habilidade). O que muda
 * aqui são as opções, e generalizar aquele arquivo para servir aos dois pediria
 * mexer nas cinco telas que já o usam.
 *
 * ⚠ O `X` DE LIMPAR SÓ APARECE QUANDO HÁ O QUE LIMPAR. Um botão de limpar num
 * filtro vazio é um botão que não faz nada. */
function BarraDeFiltro({ tipos, tipo, onTipo, termo, onTermo, visiveis, total, rotulo }) {
  const limpar = () => { onTipo("todos"); onTermo(""); };
  return (
    <div className="space-y-2 mb-3" role="group" aria-label={rotulo}>
      {/* ⚠ OS CHIPS SÃO O `BoolChip` DO PROJETO, e não um botão desenhado aqui
          (autor, 2026-09-08: *"A barra de busca e filtros ficaram um pouco
          abaixo da média em aparência"*). A primeira versão copiava o chip do
          `FiltroDeHabilidades`, que é `bg-slate-900` quando desligado. Só que lá
          ele mora sobre o fundo da PÁGINA, e aqui mora dentro de um card
          `bg-slate-900`: o chip desligado ficava da cor exata do que está atrás
          dele, sem borda, e sumia. O primitivo do projeto tem borda e é o mesmo
          chip do resto do criador. */}
      <div className="flex flex-wrap gap-1.5">
        {[{ id: "todos", label: "Todos" }, ...tipos].map((f) => (
          <BoolChip
            key={f.id || "neutro"}
            ativo={tipo === f.id}
            onToggle={() => onTipo(f.id)}
            title={f.id === "todos" ? "Todas as linhas" : `Só as linhas de ${f.label}`}
          >
            {f.label}
          </BoolChip>
        ))}
      </div>
      <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-slate-800 bg-slate-950/50 text-slate-500">
        <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={termo}
          onChange={(e) => onTermo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") limpar(); }}
          placeholder="Buscar"
          aria-label={`${rotulo} por texto`}
          className="flex-1 min-w-0 bg-transparent outline-none text-[12px] text-slate-200 placeholder:text-slate-600"
        />
        <span className="text-[11px] font-mono tabular-nums flex-shrink-0" aria-label="Resultados do filtro">
          {visiveis} / {total}
        </span>
        {/* O X só existe quando há o que limpar: um botão de limpar num filtro
            vazio é um botão que não faz nada. */}
        {(tipo !== "todos" || termo) && (
          <button type="button" onClick={limpar} aria-label="Limpar filtros" className="p-0.5 rounded text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* UMA SESSÃO                                                    */
/* ============================================================ */
/* ⚠ XP E $ SÃO CAMPO DE TEXTO, e Interlúdios é campo de número. Não é
   descuido: os dois de cima aceitam decimal, e a vírgula do teclado brasileiro
   faz um `input[type=number]` devolver string vazia enquanto se digita, ou
   seja, o valor sumiria a cada "10,5". Quem lê a vírgula é o `numero()` do
   `afty-carteira.js`, onde isso está escrito por extenso. O Interlúdio é
   inteiro e não passa por nada disso. */
function LinhaDeEntrada({ entrada, onPatch, onRemove }) {
  return (
    <LinhaArrastavel id={entrada.id} grade={GRADE_ENTRADA} rotulo={entrada.nome || "esta sessão"}>
      <input
        value={entrada.nome ?? ""}
        onChange={(e) => onPatch({ nome: e.target.value })}
        placeholder="Nome"
        className={`${CAMPO} min-w-0`}
      />
      <input
        value={entrada.xp ?? ""}
        onChange={(e) => onPatch({ xp: e.target.value })}
        inputMode="decimal"
        title="XP ganho nesta sessão"
        className={`${CAMPO_NUM} min-w-0`}
      />
      <input
        value={entrada.dinheiro ?? ""}
        onChange={(e) => onPatch({ dinheiro: e.target.value })}
        inputMode="decimal"
        title="Dinheiro ganho nesta sessão"
        className={`${CAMPO_NUM} min-w-0`}
      />
      <input
        type="number"
        value={entrada.interludios ?? ""}
        onChange={(e) => onPatch({ interludios: e.target.value })}
        title="Interlúdios ganhos nesta sessão"
        className={`${CAMPO_NUM} min-w-0`}
      />
      <Seletor
        valor={entrada.tipo}
        opcoes={CARTEIRA_TIPOS}
        onChange={(v) => onPatch({ tipo: v })}
        dica="O que esta sessão foi"
      />
      <button type="button" onClick={onRemove} title="Remover esta sessão" className={BOTAO_LIXO}>
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </LinhaArrastavel>
  );
}

/* ============================================================ */
/* UM GASTO                                                      */
/* ============================================================ */
function LinhaDeGasto({ gasto, onPatch, onRemove }) {
  return (
    <LinhaArrastavel id={gasto.id} grade={GRADE_GASTO} rotulo={gasto.nome || "este gasto"}>
      <input
        value={gasto.nome ?? ""}
        onChange={(e) => onPatch({ nome: e.target.value })}
        placeholder="Nome"
        className={`${CAMPO} min-w-0`}
      />
      <input
        value={gasto.fonte ?? ""}
        onChange={(e) => onPatch({ fonte: e.target.value })}
        placeholder="Fonte"
        title="De onde saiu, ou para onde foi"
        className={`${CAMPO} min-w-0`}
      />
      <Seletor
        valor={gasto.tipo}
        opcoes={CARTEIRA_GASTO_TIPOS}
        onChange={(v) => onPatch({ tipo: v })}
        dica="O que este gasto foi"
      />
      <input
        value={gasto.valor ?? ""}
        onChange={(e) => onPatch({ valor: e.target.value })}
        inputMode="decimal"
        title="Quanto saiu"
        className={`${CAMPO_NUM} min-w-0`}
      />
      <button type="button" onClick={onRemove} title="Remover este gasto" className={BOTAO_LIXO}>
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </LinhaArrastavel>
  );
}

/* ============================================================ */
/* A ABA                                                         */
/* ============================================================ */
export default function TabCarteira({ draft, derived, patchCarteira }) {
  const extrato = derived.carteira ?? {
    entradas: [], gastos: [], xpTotal: 0, interludios: 0,
    ganho: 0, retirado: 0, atual: 0, nivel: 3, proximo: null,
    avisos: [], alimentaFocos: false, alimentaNivel: false,
  };
  /* ⚠ O FALLBACK É UMA CONSTANTE CONGELADA, e não `[]` escrito aqui. Um literal
     é um array NOVO a cada render, e a ficha sem carteira invalidaria o
     `useMemo` do filtro em TODO render, que é justamente o que ele veio evitar.
     O eslint pegou isso na primeira versão deste arquivo. */
  const entradas = Array.isArray(draft?.carteira?.entradas) ? draft.carteira.entradas : SEM_LINHAS;
  const gastos = Array.isArray(draft?.carteira?.gastos) ? draft.carteira.gastos : SEM_LINHAS;

  const patchEntrada = (id, campo) => patchCarteira({
    entradas: entradas.map((e) => (e.id === id ? { ...e, ...campo } : e)),
  });
  const patchGasto = (id, campo) => patchCarteira({
    gastos: gastos.map((g) => (g.id === id ? { ...g, ...campo } : g)),
  });

  /* O filtro é ESTADO DE TELA, e não da ficha. Ele não é uma escolha do
     personagem: é como a pessoa está olhando a lista agora, e gravá-lo faria a
     ficha reabrir escondendo linhas sem ninguém pedir. */
  const [tipoEntrada, setTipoEntrada] = useState("todos");
  const [termoEntrada, setTermoEntrada] = useState("");
  const [tipoGasto, setTipoGasto] = useState("todos");
  const [termoGasto, setTermoGasto] = useState("");

  const entradasVisiveis = useMemo(
    () => filtraLinhasCarteira(entradas, { tipo: tipoEntrada, termo: termoEntrada, tipos: CARTEIRA_TIPOS }),
    [entradas, tipoEntrada, termoEntrada],
  );
  const gastosVisiveis = useMemo(
    () => filtraLinhasCarteira(gastos, { tipo: tipoGasto, termo: termoGasto, tipos: CARTEIRA_GASTO_TIPOS }),
    [gastos, tipoGasto, termoGasto],
  );

  /* Os mesmos sensores da aba de Perícias, e pelas mesmas razões escritas lá.
     `distance: 6` deixa o clique seco continuar sendo clique, o que aqui importa
     ainda mais: a linha é feita de campos, e roubar o toque de quem só quer
     digitar seria pior do que não ter arraste nenhum. */
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  return (
    <>
      <Card title="Carteira">
        <FaixaDaCarteira extrato={extrato} />

        {extrato.avisos.length > 0 && (
          <div className="mb-3 space-y-1">
            {extrato.avisos.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}

        <BarraDeFiltro
          tipos={CARTEIRA_TIPOS}
          tipo={tipoEntrada}
          onTipo={setTipoEntrada}
          termo={termoEntrada}
          onTermo={setTermoEntrada}
          visiveis={entradasVisiveis.length}
          total={entradas.length}
          rotulo="Filtrar sessões"
        />

        <div className="space-y-1.5">
          <div className={GRADE_ENTRADA}>
            {/* ⚠ RÓTULO E VALOR ALINHAM PELO CENTRO, e é a regra da tela
                inteira desde a aba de Defesas (autor, 2026-09-08 aqui, e
                2026-09-05 lá). Alinhar pela borda é convenção de tabela
                numérica e falha aqui, onde "Inter." é várias vezes mais
                largo que o "4" embaixo dele.

                A primeira célula é a da pega, e fica vazia. */}
            <span />
            <span className={CABECALHO}>Nome</span>
            <span className={`${CABECALHO} text-center`}>XP</span>
            <span className={`${CABECALHO} text-center`}>$</span>
            <span className={`${CABECALHO} text-center`}>Inter.</span>
            <span className={`${CABECALHO} text-center`}>Tipo</span>
            <span />
          </div>
          {/* ⚠ ARRASTAR CONTINUA VALENDO COM O FILTRO LIGADO, e o
              `moverNaCarteira` é por id justamente para isso: "põe A onde B
              está" é a mesma frase na lista inteira e na filtrada, e as linhas
              escondidas guardam a posição relativa delas. */}
          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            modifiers={SO_VERTICAL}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              patchCarteira({ entradas: moverNaCarteira(entradas, String(active.id), String(over.id)) });
            }}
          >
            <SortableContext items={entradasVisiveis.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {entradasVisiveis.map((e) => (
                  <LinhaDeEntrada
                    key={e.id}
                    entrada={e}
                    onPatch={(campo) => patchEntrada(e.id, campo)}
                    onRemove={() => patchCarteira({ entradas: entradas.filter((x) => x.id !== e.id) })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={() => patchCarteira({ entradas: [...entradas, createBlankEntradaCarteira()] })}
          className={`${BOTAO_MAIS} mt-2`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Sessão
        </button>
      </Card>

      <Card title="Carteira · Gastos">
        <BarraDeFiltro
          tipos={CARTEIRA_GASTO_TIPOS}
          tipo={tipoGasto}
          onTipo={setTipoGasto}
          termo={termoGasto}
          onTermo={setTermoGasto}
          visiveis={gastosVisiveis.length}
          total={gastos.length}
          rotulo="Filtrar gastos"
        />

        <div className="space-y-1.5">
          <div className={GRADE_GASTO}>
            <span />
            <span className={CABECALHO}>Nome</span>
            <span className={CABECALHO}>Fonte</span>
            <span className={`${CABECALHO} text-center`}>Tipo</span>
            <span className={`${CABECALHO} text-center`}>Valor</span>
            <span />
          </div>
          <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            modifiers={SO_VERTICAL}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;
              patchCarteira({ gastos: moverNaCarteira(gastos, String(active.id), String(over.id)) });
            }}
          >
            <SortableContext items={gastosVisiveis.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {gastosVisiveis.map((g) => (
                  <LinhaDeGasto
                    key={g.id}
                    gasto={g}
                    onPatch={(campo) => patchGasto(g.id, campo)}
                    onRemove={() => patchCarteira({ gastos: gastos.filter((x) => x.id !== g.id) })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={() => patchCarteira({ gastos: [...gastos, createBlankGastoCarteira()] })}
          className={`${BOTAO_MAIS} mt-2`}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Gasto
        </button>
      </Card>
    </>
  );
}
