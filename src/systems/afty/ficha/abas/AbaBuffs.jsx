import React, { useMemo, useState } from "react";
import { Plus, Minus, X, Search, Dices, Check, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

import { estadoVisivel } from "../../afty-combate";
import { ESTADO_APICE, RODADAS_APICE } from "../../afty-talisma-apice";
import { fichaDaCondicao, listaComE } from "../../afty-condicoes";
import { IconeDaCondicao, IconeDoDono } from "../../ui/icones-afty";
import { getCanal } from "../../afty-efeitos";
import { INV_EFEITO_CANAL_GRUPOS } from "../../afty-invocacoes";
import CanalPicker from "../CanalPicker";
import PainelDeConcessao from "../PainelDeConcessao";
import PainelDeImitacao from "../PainelDeImitacao";
import GavetaDeCondicoes from "../GavetaDeCondicoes";
import SubAbas from "../SubAbas";
import { usePrimitiva } from "../../ui/usar-primitiva";
import { estadoUsadoNestaRodada } from "../ficha-sessao";
import { estaLigado, padraoDe, linhasDeEstado } from "../ficha-buffs";
import { useDestaque } from "../usar-destaque";
import { organizaEstados } from "../ficha-estados";

/**
 * ============================================================
 * ABA BUFFS — o que está ligado agora
 * ============================================================
 * ⚠ A ORDEM DA TELA MUDOU em 2026-09-22 (autor: "Ligado Agora fica MUITO
 * poluído", e "Deixar como uma lista não fala nada sobre nenhuma das
 * condições"). De cima para baixo, pela frequência de uso numa rodada:
 *
 *   AGORA            o saldo de tudo que a aba liga, e o botão Em Combate
 *   CONDIÇÕES        cartões, e o catálogo que diz o que cada uma faz
 *   LIGADOS AGORA    lista densa por dono e família, com um × que desliga
 *   ESTADOS          a lista completa, com filtro e sub-abas
 *   BUFFS DE MESA    o ad-hoc, com rodadas
 *
 * ⚠ A SEÇÃO TEMPORÁRIOS SAIU em 2026-09-22 ("não precisa existir", autor). Ela
 * listava em só leitura o que o Motor já somou, e o que ela dizia continua no
 * hover de cada número da Ficha, que é onde as fontes moram desde sempre.
 *
 * As camadas de dados continuam sendo quatro:
 *
 *   1. CATALOGADOS  os estados que o sistema já conhece (`COMBATE_ESTADOS`).
 *      Nada disso precisou ser construído: cada estado já é variável do DSL e o
 *      `quando` de cada habilidade liga e desliga sozinho desde 2026-07-28.
 *   2. AD-HOC       "+2 de Defesa por 3 rodadas", escrito na hora. É uma linha
 *      do Motor com duração, no mesmo shape do Funcionamento Básico.
 *   3. TEMPORÁRIOS  o que a própria criatura concede com `duracao: "temporaria"`
 *      (Feitiço Auxiliar, Habilidade Única, linha do Funcionamento Básico). Só
 *      LISTA, e não liga nem desliga: ver o aviso abaixo.
 *   4. CONDIÇÕES    o que a criatura sofre, com o número já aplicado e as
 *      rodadas que faltam.
 *
 * ⚠ OS TEMPORÁRIOS SÃO SÓ LEITURA, e isso segue a assunção do Motor (ver
 * `afty-efeitos.js`): efeito temporário fica sempre ligado na ficha. Eles já
 * estavam entrando na conta desde sempre, o que faltava era APARECER — sem a
 * lista, um +4 de Força temporário e um permanente eram o mesmo número, e o
 * jogador não tinha como saber qual dos dois ele perde no fim da cena.
 *
 * ⚠ AS CONDIÇÕES MEXEM NO NÚMERO desde 2026-09-21, quando o autor mandou os
 * textos e pediu a automação. Até ali eram só marcadores, porque inventar o que
 * faz "Fragilizado" seria número saído do nada. Quem resolve é o
 * `resolveCondicoes` (afty-condicoes.js), dentro do derive, e ELAS NÃO ACUMULAM
 * ENTRE SI: Paralisado e Desprevenido dão -10 de Defesa, e não -13. Cada linha
 * mostra o que a condição faz e risca o número que perdeu para outra.
 * ============================================================
 */

/* Acima de quantas opções a linha de escolha nasce fechada. Três é o ponto em
   que a fileira ainda cabe ao lado do rótulo numa tela de celular: a Manobra
   Finalizadora tem três e continua aberta, a Postura tem oito e fecha. */
const MAX_OPCOES_ABERTAS = 3;

/* NÍVEL DE EXAUSTÃO. Contador da sessão, e de todo mundo: seis Habilidades
   Lendárias e a Expansão de Domínio dizem "você recebe um ponto de exaustão"
   desde sempre, e a ficha não tinha onde marcar. Ele nasceu com a Fadiga Mental
   do Vislumbre Celeste (autor, 2026-09-09: "a ficha conta as duas"), e não fica
   atrás de primitiva nenhuma porque não é do addon.

   ⚠ O QUE UM NÍVEL FAZ ainda não tem fonte no Afty, então ele CONTA e MOSTRA, e
   a penalidade é de mesa. Exausto não está na lista de condições que o autor
   mandou em 2026-09-21, e por isso continua sem número. */
function ContadorDeExaustao({ valor, onValor }) {
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  return (
    <span className="flex items-center gap-1.5" role="group" aria-label={`Nível de Exaustão: ${n}`}>
      <button
        type="button"
        className="afty-botao"
        onClick={() => onValor(Math.max(0, n - 1))}
        disabled={n === 0}
        aria-label="Menos um Nível de Exaustão"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span
        className="afty-valor text-[12px] tabular-nums"
        data-afty-tom={n > 0 ? "custo" : undefined}
      >
        {n}
      </span>
      <button
        type="button"
        className="afty-botao"
        onClick={() => onValor(n + 1)}
        aria-label="Mais um Nível de Exaustão"
      >
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ⚠ NÃO VOLTE COM O CARTÃO DE "RECURSOS DO SISTEMA" AQUI. Entre 2026-09-13 e
   2026-09-17 esta aba abria com quatro cartões de texto descrevendo Aliados,
   Alma, Comidas e Ferreiro, sempre à mostra. O autor mandou tirar: *"não quero
   que ela seja visível o tempo todo"*. Ela também contrariava a regra de a UI
   não explicar (AGENTS.md), e o texto não se perdeu: cada controle da bancada
   carrega a própria explicação no `title`, que é onde ela deve morar. */

/* O rótulo de uma linha de buff: o canal, e para quem ele vai quando é de
   invocação. Os dois espaços de canal repetem nomes, então ler o rótulo no
   catálogo errado mostraria outro número com o mesmo nome. */
function rotuloDoBuff(buff, invocacoes = []) {
  if (buff?.escopo !== "invocacao") return getCanal(buff?.canal)?.label ?? buff?.canal;
  const def = INV_EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).find((c) => c.id === buff.canal);
  const canal = def?.label ?? buff.canal;
  const alvo = buff.invocacaoAlvo
    ? (invocacoes.find((i) => i.id === buff.invocacaoAlvo)?.nome || "invocação")
    : "invocações";
  return `${canal} (${alvo})`;
}

/* Uma seção da aba. Com `recolhivel`, o título vira botão e a seção fecha.

   ⚠ ESTADOS E TEMPORÁRIOS NASCEM FECHADOS quando já há algo ligado (2026-09-22):
   os dois somavam 890px de aba sempre abertos, e são BIBLIOTECA (o que existe),
   e não painel (o que está valendo). A contagem no cabeçalho é o que diz que há
   coisa lá dentro sem precisar abrir. */
function Secao({ titulo, children, direita, contagem = null, recolhivel = false, abertaPadrao = true }) {
  const [aberta, setAberta] = useState(abertaPadrao);
  const mostra = !recolhivel || aberta;
  return (
    <section className="afty-card p-3">
      <div className="flex items-center gap-2 mb-2">
        {recolhivel ? (
          <button
            type="button"
            className="afty-secao-botao flex-1"
            aria-expanded={aberta}
            onClick={() => setAberta((a) => !a)}
          >
            {aberta
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
            <span className="afty-card-titulo">{titulo}</span>
            {contagem != null && <span className="afty-secao-conta">{contagem}</span>}
          </button>
        ) : (
          <h2 className="afty-card-titulo flex-1" data-afty-linha>{titulo}</h2>
        )}
        {direita}
      </div>
      {mostra && <div className="space-y-1">{children}</div>}
    </section>
  );
}

/* Uma linha do catálogo de estados. `delta` é o que ligar este estado muda na
   ficha, calculado por fora (ver `deltaDosEstados`).

   Ela NÃO desenha a própria caixa: quem desenha é o `GrupoDeEstados`, para o
   estado e os que dependem dele lerem como uma coisa só. A classe
   `afty-estado-linha` é o gancho estável do CSS do usuário e da densidade
   compacta, que antes apertava a `.afty-linha` de cada estado. */
function LinhaEstado({ estado, valor, delta, opcoes, onValor, derived, bloqueado }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  /* ⚠ A LISTA DE OPÇÕES LONGA NASCE FECHADA (2026-08-28). A Postura tem oito, e
     oito botões numa linha que as vizinhas resolvem com um só faziam três
     coisas ruins de uma vez: quebravam em três fileiras no celular (onde o
     `pointer: coarse` põe todo botão em 44px), deixavam a linha quatro vezes
     mais alta que a de cima, e empurravam a coluna de controle para um x
     diferente do resto da lista.

     Fechada, ela mostra a ESCOLHA ATUAL, que é a informação que se procura no
     meio do turno, e abre as outras ao toque. Abaixo do teto continua tudo à
     mostra, porque duas ou três opções nunca foram o problema. */
  const [opcoesAbertas, setOpcoesAbertas] = useState(false);
  const escolhaEmLista = ["opcao", "dominio"].includes(estado.tipo);
  const fecha = escolhaEmLista && opcoes.length > MAX_OPCOES_ABERTAS;
  const escolhida = escolhaEmLista ? opcoes.find((o) => o.id === valor) : null;
  /* O rótulo pode vir encurtado pelo cabeçalho de família ("Manobra · Ajuste"
     embaixo de "Manobra" é só "Ajuste"). O `title` guarda o do catálogo, que é
     o inteiro: sem ele um rótulo aparado no `truncate` não teria como ser lido.
     Ver `organizaEstados`. */
  const rotulo = estado.rotulo ?? estado.label;
  const custoPE = typeof estado.custoPE === "function" ? estado.custoPE(valor) : estado.custoPE;
  /* ⚠ A TRAVA DO FEITIÇO PERMUTATIVO (autor, 2026-10-02): "o Feitiço não pode ser
     usado". Desligado, ela impede de ligar. Ligado, o número caiu depois (uma
     condição) e o Feitiço segue ligado, com o motivo à mostra. Mesma leitura do
     `max(derived)`, pelo estado inteiro (interruptor) ou pela opção (vaga). */
  const travaDe = (alvo, ligado) => (typeof alvo?.bloqueio === "function" ? alvo.bloqueio(derived, ligado) : null);
  const trava = estado.tipo === "bool" ? travaDe(estado, !!valor) : travaDe(escolhida, true);
  const travaDaOpcao = (o) => (valor === o.id ? null : travaDe(o, false));
  return (
    <div className="afty-estado-linha px-2.5 py-1.5 flex items-center gap-2 flex-wrap">
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={estado.title || estado.label}>
        {rotulo}
        {/* A escolha corrente ao lado do nome, e não dentro do controle: com a
            lista fechada, ela é o que a linha está fazendo. */}
        {fecha && escolhida && (
          <span className="afty-estado-escolha">{escolhida.label}</span>
        )}
      </span>

      {/* ⚠ O DELTA É TEXTO, E NÃO PÍLULA (autor, 2026-08-28). Era um `afty-chip`
          com borda, fundo e canto de 9999px, e numa lista de quarenta linhas
          aquilo virava quarenta cápsulas disputando a atenção com os botões que
          estão logo ao lado e que são o que se CLICA. O delta é leitura, não
          alvo. Mesmo desenho dos pré-requisitos do criador: texto miúdo em roxo,
          separados por um ponto médio. */}
      {delta.length > 0 && (
        <span className="afty-estado-delta">
          {delta.map((d) => (
            <span key={d.rotulo} className="afty-delta">{d.rotulo} {d.texto}</span>
          ))}
        </span>
      )}
      {/* O custo pode ser FUNÇÃO do valor, para a faixa cujo preço não é
          linear (Ataque Concentrado: 1, 3 e 4 PE). Mesma leitura do `max`. */}
      {custoPE != null && !!valor && (
        <span className="afty-valor text-[11px]" data-afty-tom="custo">{custoPE} PE</span>
      )}
      {estado.id === "invencivelSobOSol" && !!valor && (
        <span className="afty-estado-delta">
          {/* Texto, e não cápsula: o autor recusa frase dentro de pílula de raio
              total (2026-09-03), e estas três eram as últimas da aba. */}
          <span className="afty-delta" data-afty-tom="nota">Rodada {derived?.combate?.invencivelRodadas ?? 1} de 4</span>
          <span className="afty-delta" data-afty-tom="nota">Imune a Críticos Inimigos</span>
          <span className="afty-delta" data-afty-tom="nota">Não Pode Ser Movido à Força</span>
        </span>
      )}
      {estado.id === ESTADO_APICE && !!valor && (
        <span className="afty-delta" data-afty-tom="nota">Rodada {derived?.combate?.talismaApiceRodadas || 1} de {RODADAS_APICE}</span>
      )}
      {trava && (
        <span className="afty-estado-delta">
          <span className="afty-delta" data-afty-tom="aviso">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {trava}
          </span>
        </span>
      )}

      {/* ⚠ A COLUNA DE CONTROLE TEM LARGURA RESERVADA, e é o que tira o
          serrilhado da direita: um `bool` entrega um botão, uma `faixa` entrega
          três células e uma `opcao` entrega de duas a oito, então sem piso a
          borda esquerda do controle caía num lugar por linha ao longo de
          quarenta delas. Mesma resposta que os chips numerados receberam em
          2026-08-06, ver o `data-afty-tag` no ficha.css. */}
      <span className="afty-estado-controle">
        {estado.tipo === "bool" ? (
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={valor ? "destaque" : undefined}
            aria-pressed={!!valor}
            disabled={(bloqueado || !!trava) && !valor}
            title={valor ? undefined : trava || (bloqueado ? "Já usada nesta rodada" : undefined)}
            onClick={() => onValor(estado, !valor)}
          >
            {valor ? "Ativa" : trava ? "Travada" : bloqueado ? "Usada" : "Inativa"}
          </button>
        ) : estado.tipo === "multi" ? (
          <span className="flex items-center gap-1 flex-wrap justify-end">
            {opcoes.map((o) => {
              const atuais = Array.isArray(valor) ? valor : [];
              const ativo = atuais.includes(o.id);
              const cheio = atuais.length >= (estado.maxSelecionados ?? 0);
              return (
                <button
                  key={o.id}
                  type="button"
                  className="afty-botao"
                  data-afty-tom={ativo ? "destaque" : undefined}
                  aria-pressed={ativo}
                  title={o.title}
                  onClick={() => onValor(
                    estado,
                    ativo ? atuais.filter((id) => id !== o.id) : cheio ? atuais : [...atuais, o.id],
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </span>
        ) : escolhaEmLista && fecha ? (
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={escolhida ? "destaque" : undefined}
            aria-expanded={opcoesAbertas}
            onClick={() => setOpcoesAbertas((a) => !a)}
          >
            {escolhida ? "Trocar" : "Escolher"}
          </button>
        ) : escolhaEmLista ? (
          <span className="flex items-center gap-1 flex-wrap justify-end">
            {opcoes.map((o) => (
              <button
                key={o.id}
                type="button"
                className="afty-botao"
                data-afty-tom={valor === o.id ? "destaque" : undefined}
                aria-pressed={valor === o.id}
                disabled={!!travaDaOpcao(o)}
                title={travaDaOpcao(o) || o.title}
                onClick={() => onValor(estado, valor === o.id ? null : o.id)}
              >
                {o.label}
              </button>
            ))}
          </span>
        ) : (
          <span className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.max(estado.min ?? 0, (valor || 0) - 1))}
              aria-label={`${estado.label} menos 1`}
            >
              −
            </button>
            <span className="afty-valor text-[13px] w-8 text-center">{valor || 0}</span>
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.min(teto ?? 0, (valor || 0) + 1))}
              aria-label={`${estado.label} mais 1`}
            >
              +
            </button>
          </span>
        )}
      </span>

      {/* As opções, quando a lista longa está aberta. Fileira PRÓPRIA, embaixo,
          e não ao lado: é o que deixa a linha fechada ter a mesma altura das
          vizinhas e a aberta crescer sem desalinhar ninguém. */}
      {fecha && opcoesAbertas && (
        <div className="afty-estado-opcoes">
          {opcoes.map((o) => (
            <button
              key={o.id}
              type="button"
              className="afty-botao"
              data-afty-tom={valor === o.id ? "destaque" : undefined}
              aria-pressed={valor === o.id}
              disabled={!!travaDaOpcao(o)}
              title={travaDaOpcao(o) || o.title}
              onClick={() => {
                onValor(estado, valor === o.id ? null : o.id);
                setOpcoesAbertas(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* As rodadas que faltam para a coisa acabar: a condição e o buff de mesa. A
   virada de rodada da Ficha desce este número e tira a linha quando ele zera
   (`proximaRodada`). Sem duração é o infinito, e é o mesmo símbolo do campo de
   duração ao adicionar.

   ⚠ TEXTO PURO, e não `afty-chip`: o autor não quer frase dentro da cápsula de
   raio total (2026-09-03), e "2 Rodadas" são duas palavras. A largura mínima
   segura os dois botões no lugar quando o número muda. */
function Rodadas({ nome, rodadas, onRodadas }) {
  return (
    <span className="flex items-center gap-1 flex-shrink-0" role="group" aria-label={`Rodadas de ${nome}`}>
      <button
        type="button" className="afty-passo"
        onClick={() => onRodadas(rodadas - 1)}
        disabled={rodadas == null || rodadas <= 1}
        aria-label={`Uma rodada a menos em ${nome}`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span
        className="afty-rotulo text-[11px] font-semibold tabular-nums text-center"
        style={{ minWidth: "4.25rem" }}
        title={rodadas == null ? "Sem duração" : "Rodadas restantes"}
      >
        {rodadas == null ? "∞" : `${rodadas} ${rodadas === 1 ? "Rodada" : "Rodadas"}`}
      </span>
      <button
        type="button" className="afty-passo"
        onClick={() => onRodadas((rodadas ?? 0) + 1)}
        aria-label={`Uma rodada a mais em ${nome}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ============================================================ */
/* AGORA: o painel do turno (2026-09-22)                         */
/* ============================================================ */
/* A pergunta da mesa é "como eu estou agora", e até 2026-09-22 a aba só
   respondia "quanto cada linha me dá", vinte linhas para somar de cabeça (autor,
   com captura: "o Ligado Agora fica MUITO poluído").

   O painel responde de uma vez: o saldo de estados, buffs e condições contra a
   ficha sem nada disso, e embaixo o que a criatura está SOFRENDO.

   ⚠ O SALDO VEM PRONTO de `saldoDoAgora` (ficha-buffs.js), que tem conta
   própria: ele não é a soma dos deltas das linhas, porque as regras interagem.

   ⚠ TETO DE MARCAS. Com Paralisado e meia dúzia de estados ligados o saldo passa
   de dez marcas e volta a ser a parede que ele veio substituir. As primeiras são
   as que se rolam (acerto, dano, defesa), e o resto abre no `+N`.

   ⚠ A FAIXA "SOFRENDO" NÃO É VERMELHA (autor, 2026-09-22, recusando a cor de
   severidade pela segunda vez). Quem separa ganho de prejuízo aqui é o ÍCONE e a
   posição, e não a tinta. Verde e vermelho seguem só nos números do saldo, onde
   são sinal de grandeza e não de natureza. */
const MAX_MARCAS = 8;

/* Quantos números da condição cabem na linha antes do "e mais N". Três é o que
   cabe ao lado do nome e do degrau na coluna do painel do Encontro, que é a mais
   estreita das duas casas da aba. */
const MAX_EFEITOS_NA_LINHA = 3;

function PainelDoTurno({ saldo, controle, condicoes, onAbrirCondicao }) {
  const [tudo, setTudo] = useState(false);
  /* ⚠ TRES ESTADOS, e não dois. `null` é "a conta ainda não voltou", e é diferente
     de lista vazia, que é "nada está mexendo na ficha". Sem essa distinção a aba
     afirmaria que nada mexe na ficha durante o quadro em que o saldo ainda está
     sendo calculado, que é mentira e logo se desmente sozinha na tela. */
  const calculando = saldo == null;
  const lista = saldo ?? [];
  const visiveis = tudo ? lista : lista.slice(0, MAX_MARCAS);
  const escondidas = lista.length - visiveis.length;
  return (
    <section className="afty-card p-3" data-afty-agora="">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="afty-card-titulo flex-1" data-afty-linha>Agora</h2>
        {controle}
      </div>
      {lista.length > 0 ? (
        <div className="afty-agora">
          {visiveis.map((m) => (
            <span
              key={m.chave}
              className="afty-agora-item"
              data-afty-sinal={m.valor < 0 ? "menos" : m.valor > 0 ? "mais" : undefined}
              title={m.fontes ? m.fontes.join(", ") : undefined}
            >
              <span className="afty-agora-rotulo">{m.rotulo}</span>
              <span className="afty-agora-valor">{m.texto}</span>
              {m.final != null && <span className="afty-agora-final">→ {m.final}</span>}
            </span>
          ))}
          {escondidas > 0 && (
            <button type="button" className="afty-agora-item afty-agora-mais" onClick={() => setTudo(true)}>
              <span className="afty-agora-rotulo">Mais</span>
              <span className="afty-agora-valor">+{escondidas}</span>
            </button>
          )}
          {tudo && lista.length > MAX_MARCAS && (
            <button type="button" className="afty-agora-item afty-agora-mais" onClick={() => setTudo(false)}>
              <span className="afty-agora-rotulo">Ver</span>
              <span className="afty-agora-valor">Menos</span>
            </button>
          )}
        </div>
      ) : calculando ? (
        <p className="afty-vazio text-[11px]">Calculando</p>
      ) : (
        <p className="afty-vazio text-[11px]">Nada mexendo na ficha</p>
      )}

      {condicoes.length > 0 && (
        <div className="afty-sofrendo">
          <span className="afty-sofrendo-rotulo">Sofrendo</span>
          {condicoes.map((c) => (
            <button
              key={c.id}
              type="button"
              className="afty-pastilha"
              onClick={() => onAbrirCondicao(c.id)}
              title={c.resumo ?? c.descricao ?? undefined}
            >
              <IconeDaCondicao nome={c.nome} className="w-3.5 h-3.5 flex-shrink-0" />
              {c.nome}
              {c.rodadas != null && <span className="afty-pastilha-rodadas">{c.rodadas}</span>}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================ */
/* LIGADOS AGORA: uma linha por estado (2026-09-22)              */
/* ============================================================ */
/* ⚠ ERAM LADRILHOS, E ANTES DISSO A LINHA INTEIRA DO ESTADO. O ladrilho durou um
   dia: com vinte ligados viravam vinte caixas roxas iguais, a fileira da grade
   esticava pela altura do mais alto (o Invencível tem seis efeitos, e deixava
   quatro caixas vazias ao lado) e o nome longo era cortado em 27 dos 63 estados
   do catálogo. O autor: "extremamente feio em quesito Design e confuso".

   A resposta é a que a NN/g dá para este caso: LISTA, e não cartão. Cartão é
   para explorar conteúdo rico, lista é para varrer e comparar, que é o que se
   faz no meio do turno.

   Cada linha tem 28px, sem caixa própria (fundo só no hover), e o grupo resolve
   o nome longo: "Golpe Especial · Atroz" vira "Atroz" embaixo do cabeçalho
   "Golpe Especial". Quem calcula dono e família é o `organizaEstados`, o mesmo
   da lista completa.

   ⚠ O QUE NÃO CABE NA LINHA VAI PARA O `title`, e não some: a lista de auras
   escolhidas, as comidas consumidas e as três notas do Invencível. É divulgação
   progressiva, e não corte. */
/* Um estado só ganha seta quando há o que abrir. A linha já diz o nome e, desde
   que virou duas linhas, TODOS os números dele: um interruptor simples como a
   Brutalidade não tem segunda camada, e uma seta que abre uma caixa vazia é
   pior que seta nenhuma. */
const temDetalheDeEstado = (estado, valor, opcoes, derived) => {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  const custoPE = typeof estado.custoPE === "function" ? estado.custoPE(valor) : estado.custoPE;
  return custoPE != null
    || !!estado.title
    || (estado.tipo === "faixa" && teto != null)
    || (["opcao", "dominio", "multi"].includes(estado.tipo) && opcoes.length > 0);
};

function LinhaLigada({ estado, valor, delta, opcoes, onValor, derived, aberta, onAbrir, notas, abrivel }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  const custoPE = typeof estado.custoPE === "function" ? estado.custoPE(valor) : estado.custoPE;
  const escolhidas = estado.tipo === "multi"
    ? opcoes.filter((o) => (Array.isArray(valor) ? valor : []).includes(o.id)).map((o) => o.label)
    : ["opcao", "dominio"].includes(estado.tipo)
      ? [opcoes.find((o) => o.id === valor)?.label].filter(Boolean)
      : [];
  // A primeira escolha fica na linha de cima, e a lista inteira no detalhe.
  const escolhaCurta = escolhidas.length > 1 ? `${escolhidas[0]} +${escolhidas.length - 1}` : escolhidas[0];
  const rotulo = estado.rotulo ?? estado.label;
  const marcas = delta.length > 0 || notas.length > 0;
  return (
    <div className="afty-ligada" data-afty-estado={estado.id} data-afty-aberta={aberta ? "sim" : undefined}>
      {/* EM CIMA: quem é, o que foi escolhido e o que se clica. */}
      <div className="afty-ligada-topo">
        {/* O nome abre o detalhe: é o alvo maior da linha, e a seta diz que há
            mais embaixo. Ver `DetalheDoEstado`. Sem detalhe, é só texto, e o
            recuo da seta continua para a coluna dos nomes não serrilhar. */}
        {abrivel ? (
          <button
            type="button"
            className="afty-ligada-nome"
            title={estado.title || estado.label}
            aria-expanded={aberta}
            onClick={onAbrir}
          >
            {aberta
              ? <ChevronDown className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              : <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
            <span className="afty-ligada-rotulo">{rotulo}</span>
          </button>
        ) : (
          <span className="afty-ligada-nome" data-afty-sem-seta="sim" title={estado.label}>
            <span className="afty-ligada-rotulo">{rotulo}</span>
          </span>
        )}
        {escolhaCurta && (
          <span className="afty-ligada-escolha" title={escolhidas.join(", ")}>{escolhaCurta}</span>
        )}
        {estado.tipo === "faixa" && (
          <span className="afty-ligada-passo">
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.max(estado.min ?? 0, (valor || 0) - 1))}
              aria-label={`${estado.label} menos 1`}
            >
              −
            </button>
            <span className="afty-valor text-[12px] w-5 text-center">{valor || 0}</span>
            <button
              type="button" className="afty-passo"
              onClick={() => onValor(estado, Math.min(teto ?? 0, (valor || 0) + 1))}
              aria-label={`${estado.label} mais 1`}
            >
              +
            </button>
          </span>
        )}
        {custoPE != null && (
          <span className="afty-valor text-[11px] flex-shrink-0" data-afty-tom="custo">{custoPE} PE</span>
        )}
        <button
          type="button" className="afty-passo flex-shrink-0"
          onClick={() => onValor(estado, padraoDe(estado))}
          aria-label={`Desligar ${estado.label}`}
          title="Desligar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {/* EMBAIXO: o que ele está dando. Linha própria, largura inteira e quebra
          livre, porque era aqui que o corte comia a primeira letra ("efesa −4",
          captura do autor em 2026-09-22): o delta dividia uma linha só com o
          nome e a escolha, alinhado à direita e com `overflow: hidden`, e o que
          transbordava sumia pela ESQUERDA. */}
      {marcas && (
        <div className="afty-ligada-marcas">
          <span className="afty-estado-delta afty-condicao-efeitos">
            {delta.map((d) => <span key={d.rotulo} className="afty-delta">{d.rotulo} {d.texto}</span>)}
            {notas.map((n) => <span key={n} className="afty-delta" data-afty-tom="nota">{n}</span>)}
          </span>
        </div>
      )}
    </div>
  );
}

/* A lista dos ligados, agrupada por dono e por família, em colunas de jornal: o
   grupo nunca quebra no meio (`break-inside: avoid`), e a largura decide quantas
   colunas cabem, na Ficha e no painel do Encontro. */
function ListaLigados({ ligados, combate, deltaPorEstado, onValor, derived }) {
  const { subs, blocosDaSub } = useMemo(() => organizaEstados(ligados, ""), [ligados]);
  const ids = useMemo(() => new Set(ligados.map((e) => e.id)), [ligados]);
  // Uma linha aberta por vez: duas abertas já empurram a segunda coluna.
  const [aberto, setAberto] = useState(null);
  /* O que o estado faz ALÉM do número, e que na fase 1 saiu da linha. Fica aqui,
     e não no catálogo, porque os dois casos leem estado de SESSÃO (a rodada em
     que o Ápice está). */
  const notasDe = (e) => [
    ...(e.id === "invencivelSobOSol"
      ? [`Rodada ${derived?.combate?.invencivelRodadas ?? 1} de 4`, "Imune a Críticos Inimigos", "Não Pode Ser Movido à Força"]
      : []),
    ...(e.id === ESTADO_APICE ? [`Rodada ${derived?.combate?.talismaApiceRodadas || 1} de ${RODADAS_APICE}`] : []),
  ];
  return (
    <div className="afty-ligados" data-afty-estados="ligados">
      {subs.map((sub) => (
        <div key={sub.id} className="afty-ligados-grupo">
          {/* ⚠ O CABEÇALHO É O SEPARADOR (autor, 2026-09-22: "ícones de separação
              faltando"). Ícone, nome, quantos e um fio que corre até a borda:
              com dois donos na mesma coluna, o fio é o que diz onde um acaba. */}
          <p className="afty-ligados-dono">
            <IconeDoDono id={sub.id} className="w-3.5 h-3.5 flex-shrink-0" />
            {sub.label}
            <span className="afty-ligados-quantos">
              {(blocosDaSub[sub.id] ?? []).reduce(
                (n, b) => n + b.grupos.flatMap(({ pai, filhos }) => [pai, ...filhos]).filter((e) => ids.has(e.id)).length,
                0,
              )}
            </span>
          </p>
          {(blocosDaSub[sub.id] ?? []).map((bloco, i) => (
            /* A família ganha trilho à esquerda, e não só um texto em versalete:
               o trilho é o que liga o cabeçalho às linhas dele. */
            <div key={`${bloco.familia ?? ""}#${i}`} className={bloco.familia ? "afty-ligados-familia-bloco" : undefined}>
              {bloco.familia && <p className="afty-ligados-familia">{bloco.familia}</p>}
              {bloco.grupos.flatMap(({ pai, filhos }) => [pai, ...filhos])
                .filter((e) => ids.has(e.id))
                .map((e) => (
                  <React.Fragment key={e.id}>
                    <LinhaLigada
                      estado={e}
                      valor={combate[e.id]}
                      opcoes={e.opcoesVisiveis}
                      delta={deltaPorEstado?.[e.id] ?? []}
                      notas={notasDe(e)}
                      onValor={onValor}
                      derived={derived}
                      aberta={aberto === e.id}
                      abrivel={temDetalheDeEstado(e, combate[e.id], e.opcoesVisiveis, derived)}
                      onAbrir={() => setAberto((a) => (a === e.id ? null : e.id))}
                    />
                    {aberto === e.id && temDetalheDeEstado(e, combate[e.id], e.opcoesVisiveis, derived) && (
                      <DetalheDoEstado
                        estado={e}
                        valor={combate[e.id]}
                        opcoes={e.opcoesVisiveis}
                        derived={derived}
                        onValor={onValor}
                      />
                    )}
                  </React.Fragment>
                ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ============================================================ */
/* CONDIÇÕES: o cartão e o catálogo (2026-09-22)                 */
/* ============================================================ */
/* O autor: "Deixar como uma lista não fala nada sobre nenhuma das condições ou
   mostra o que elas fazem". Duas respostas:

   1. A condição aplicada é um CARTÃO, e não uma linha: nome e degrau, o que ela
      faz no número (com o riscado de quem perdeu a disputa), o que ela faz FORA
      do número numa linha (`resumo`), e as rodadas. O texto do livro fica no
      nome, a um passar de mouse, toque longo ou foco (`DicaDeTexto`).
   2. O seletor deixou de ser um `<select>` de nomes e virou um CATÁLOGO: cada
      condição com o que ela faz, agrupada pela força, com filtro. Escolher
      passou a ser comparar, e não adivinhar. */
function DegrauDaForca({ nivel, forcaLabel, especial }) {
  if (nivel > 0) {
    return (
      <span className="afty-forca" data-afty-forca={nivel} title={`Força ${nivel} de 4: ${forcaLabel}`}>
        <span className="afty-forca-degraus" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => <span key={n} data-afty-cheio={n <= nivel ? "sim" : undefined} />)}
        </span>
        <span className="afty-forca-nome">{forcaLabel}</span>
      </span>
    );
  }
  return especial ? <span className="afty-forca"><span className="afty-forca-nome">{forcaLabel}</span></span> : null;
}

/* ============================================================ */
/* O DETALHE SOB DEMANDA (fase 3, 2026-09-22)                    */
/* ============================================================ */
/* A linha responde "o que está ligado e quanto", e o detalhe responde o resto:
   o que mais aquilo faz, quanto custa, QUAL escolha está valendo (e a troca ali
   mesmo, sem descer até a lista completa) e o texto do catálogo.

   ⚠ ABRE NA PRÓPRIA LISTA, e não num painel flutuante: a aba vive na Ficha e no
   painel do Encontro, e um flutuante teria de saber de qual dos dois. Recuado e
   com um fio à esquerda, ele lê como filho da linha.

   ⚠ É AQUI QUE MORA O QUE SAIU DA LINHA na fase 1: a lista inteira de auras
   escolhidas, as comidas consumidas e as três notas do Invencível. Divulgação
   progressiva, e não corte. */
function DetalheDoEstado({ estado, valor, opcoes, derived, onValor }) {
  const teto = typeof estado.max === "function" ? estado.max(derived) : estado.max;
  const custoPE = typeof estado.custoPE === "function" ? estado.custoPE(valor) : estado.custoPE;
  const escolhaEmLista = ["opcao", "dominio"].includes(estado.tipo);
  const atuais = Array.isArray(valor) ? valor : [];
  const cheio = atuais.length >= (estado.maxSelecionados ?? 0);
  return (
    <div className="afty-detalhe" data-afty-detalhe={estado.id}>
      {/* ⚠ "ESTÁ DANDO" E "TAMBÉM" SAÍRAM DAQUI (2026-09-22). A linha do ligado
          virou duas e a de baixo já mostra os números e as notas por inteiro,
          sem corte: repetir os mesmos valores dois centímetros abaixo fazia o
          detalhe parecer uma segunda contagem. O detalhe guarda só o que a
          linha NÃO diz. */}
      {custoPE != null && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">Custo</span>
          <span className="afty-valor text-[12px]" data-afty-tom="custo">{custoPE} PE</span>
        </div>
      )}
      {/* O teto, que a linha não tem espaço para dizer. Os botões ficam SÓ na
          linha: dois pares para o mesmo número, um em cima do outro, era a
          pergunta "estes dois contam junto?". */}
      {estado.tipo === "faixa" && teto != null && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">Quanto</span>
          <span className="afty-detalhe-texto">{valor || 0} de {teto}</span>
        </div>
      )}
      {/* A troca da escolha, que era o motivo mais comum de descer até a lista
          completa no meio do turno (a Postura, a Manobra, a Aura). */}
      {(escolhaEmLista || estado.tipo === "multi") && opcoes.length > 0 && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">{estado.tipo === "multi" ? "Escolhas" : "Escolha"}</span>
          <span className="afty-detalhe-opcoes">
            {opcoes.map((o) => {
              const ativo = estado.tipo === "multi" ? atuais.includes(o.id) : valor === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  className="afty-botao"
                  data-afty-tom={ativo ? "destaque" : undefined}
                  aria-pressed={ativo}
                  title={o.title}
                  onClick={() => onValor(
                    estado,
                    estado.tipo === "multi"
                      ? (ativo ? atuais.filter((id) => id !== o.id) : cheio ? atuais : [...atuais, o.id])
                      : (valor === o.id ? null : o.id),
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </span>
        </div>
      )}
      {/* O texto do catálogo com rótulo, como todo o resto do detalhe: solto ele
          lia como continuação da última linha rotulada. */}
      {estado.title && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">No Livro</span>
          <span className="afty-detalhe-texto">{estado.title}</span>
        </div>
      )}
    </div>
  );
}

/* Uma condição em cima da criatura, em LINHA.

   ⚠ ERA CARTÃO até a fase 3. O cartão dizia tudo de uma vez (número, inclusão,
   resumo, rodadas), e três condições comiam 248px da aba. A linha diz o nome, o
   degrau, os números e as rodadas, e o resto abre embaixo. */
function LinhaCondicao({ condicao, aberta, onAbrir, onRemover, onRodadas, destacado }) {
  const { nome, nivel, forcaLabel, travada, especial, efeitos = [] } = condicao;
  // A linha rola até a tela quando a pastilha do painel do turno a chama.
  const raiz = useDestaque(destacado);
  const visiveis = efeitos.slice(0, MAX_EFEITOS_NA_LINHA);
  const escondidos = efeitos.length - visiveis.length;
  return (
    <div
      ref={raiz}
      className="afty-cond-linha"
      data-afty-condicao={nome}
      data-afty-forca={nivel || undefined}
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <button type="button" className="afty-cond-abrir" onClick={onAbrir} aria-expanded={aberta}>
        {aberta
          ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
        <IconeDaCondicao nome={nome} className="w-4 h-4 flex-shrink-0" />
        <span className="afty-cond-nome">{nome}</span>
      </button>
      {efeitos.length > 0 && (
        <span className="afty-estado-delta afty-cond-efeitos">
          {visiveis.map((x) => (
            <span
              key={x.chave}
              className="afty-delta"
              data-afty-suplantado={x.suplantado ? "sim" : undefined}
              title={x.suplantado ? "Outra condição já impõe um valor pior: este não está valendo" : undefined}
            >
              {x.rotulo} {x.texto}
            </span>
          ))}
          {escondidos > 0 && <span className="afty-delta" data-afty-tom="nota">e mais {escondidos}</span>}
        </span>
      )}
      <DegrauDaForca nivel={nivel} forcaLabel={forcaLabel} especial={especial} />
      <Rodadas nome={nome} rodadas={condicao.rodadas} onRodadas={onRodadas} />
      <button
        type="button" className="afty-passo flex-shrink-0"
        disabled={travada}
        title={travada ? "Imposta pelo Ritual Estendido" : "Tirar"}
        onClick={onRemover}
        aria-label={`Remover ${nome}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* O detalhe de uma condição: os números inteiros (com o riscado de quem perdeu a
   disputa), o que ela aplica junto, o que ela faz fora do número e o texto do
   livro, que antes dependia de passar o mouse no nome. */
function DetalheDaCondicao({ condicao, onSangrar }) {
  const { nome, descricao, resumo, grupo, efeitos = [], inclui = [], sangramento } = condicao;
  return (
    <div className="afty-detalhe" data-afty-detalhe={nome}>
      {efeitos.length > 0 && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">No Número</span>
          <span className="afty-estado-delta afty-condicao-efeitos">
            {efeitos.map((x) => (
              <span
                key={x.chave}
                className="afty-delta"
                data-afty-suplantado={x.suplantado ? "sim" : undefined}
                title={x.suplantado ? "Outra condição já impõe um valor pior: este não está valendo" : undefined}
              >
                {x.rotulo} {x.texto}
              </span>
            ))}
          </span>
        </div>
      )}
      {inclui.length > 0 && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">Inclui</span>
          <span className="afty-detalhe-texto">{listaComE(inclui)}</span>
        </div>
      )}
      {resumo && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">Na Mesa</span>
          <span className="afty-detalhe-texto">{resumo}</span>
        </div>
      )}
      {sangramento && onSangrar && (
        <div className="afty-detalhe-linha">
          <span className="afty-detalhe-rotulo">Sangra</span>
          <button type="button" className="afty-botao" onClick={onSangrar} title={`Rolar ${sangramento.dados}d${sangramento.faces} e descontar do PV`}>
            <Dices className="w-3.5 h-3.5" aria-hidden="true" />
            Perda de Vida {sangramento.dados}d{sangramento.faces}
          </button>
        </div>
      )}
      {descricao
        ? <p className="afty-detalhe-texto afty-detalhe-livro">{grupo ? `${grupo}. ` : ""}{descricao}</p>
        : <p className="afty-vazio text-[11px]">Condição sem texto no livro</p>}
    </div>
  );
}

/* O id de uma condição nova: o próximo número livre da lista. Puro, porque o
   lint de pureza do React barra o relógio aqui, e basta não repetir um id da
   própria sessão (os antigos, com o relógio em base 36, nunca casam com isto). */
const idNovoDeCondicao = (lista) => {
  const usados = lista.map((c) => /^cond_(\d+)$/.exec(c.id ?? "")?.[1]).filter(Boolean).map(Number);
  return `cond_${Math.max(0, ...usados) + 1}`;
};

/* ⚠ O CATÁLOGO SAIU DAQUI NA FASE 4 (2026-09-22) e virou `GavetaDeCondicoes`,
   uma camada com foco no campo, setas, Enter para aplicar e Esc para sair. Ele
   era um painel dentro da aba, e aplicar uma condição pedia rolar a Ficha, achar
   o cartão certo no meio de 29 e clicar. Ver o arquivo de lá. */

/* O interruptor mora no primeiro cartão de combate: Imitação, Ligados Agora
   ou Estados. Imitação pode existir sem qualquer outro estado catalogado e
   precisa do botão mesmo nesse caso, pois copiar só funciona em combate. */
function BotaoEmCombate({ combate, onPatchCombate }) {
  return (
    <button
      type="button"
      className="afty-botao"
      data-afty-tom={combate.ativo ? "destaque" : undefined}
      aria-pressed={!!combate.ativo}
      onClick={() => onPatchCombate({ ativo: !combate.ativo })}
    >
      Em Combate
    </button>
  );
}

/* Um estado e os que DEPENDEM dele, numa caixa só.

   `requerEstado` sempre significou "esta linha só existe com aquela ligada", mas
   a lista era achatada e as duas liam como assuntos separados: o autor apontou
   isso na imbuição das Técnicas de Estilo, que apareciam soltas embaixo do
   interruptor do Novo Estilo das Sombras (2026-08-10). Vale igual para as pilhas
   da Brutalidade e para o PE Extra dela, que declaram a mesma dependência.

   O pai desenha a caixa, os filhos entram dentro dela recuados e com um fio
   correndo ao lado. Nenhum estado precisou de campo novo. */
function GrupoDeEstados({ pai, filhos, children }) {
  return (
    <div className="afty-linha afty-estado-caixa" data-afty-estado={pai.id}>
      {children}
      {filhos.length > 0 && <div className="afty-estado-filhos">{filhos}</div>}
    </div>
  );
}

/* O formulário do buff ad-hoc. Reusa o vocabulário do Motor: canal, alvo
   opcional e uma expressão do DSL (que na prática costuma ser só um número). */
function NovoBuff({ onCriar, invocacoes = [] }) {
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("defesa");
  const [expr, setExpr] = useState("");
  const [rodadas, setRodadas] = useState("");
  /* ONDE o buff cai (2026-09-15). Um buff de mesa escrito para um shikigami
     precisa do espaço de canais DELE: `pv` aqui e `pv` na criatura são números
     diferentes. Ver `efeitosInvocacaoEscritos` em afty-invocacoes.js. */
  const [escopo, setEscopo] = useState("criatura");
  const [invocacaoAlvo, setInvocacaoAlvo] = useState("");
  const naInvocacao = escopo === "invocacao";
  const temInvocacoes = invocacoes.length > 0;

  const def = naInvocacao
    ? INV_EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).find((c) => c.id === canal)
    : getCanal(canal);
  const trocaEscopo = (v) => {
    setEscopo(v);
    setInvocacaoAlvo("");
    // O canal recomeça: o id do catálogo antigo não existe no novo. `defesa`
    // existe nos dois, e é o padrão dos dois.
    setCanal("defesa");
  };
  const cria = () => {
    const valor = expr.trim();
    if (!valor) return;
    onCriar({
      id: `buff_${Date.now().toString(36)}`,
      nome: nome.trim() || def?.label || "Buff",
      canal,
      expr: valor,
      rodadas: rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null,
      ...(naInvocacao ? { escopo: "invocacao" } : {}),
      ...(naInvocacao && invocacaoAlvo ? { invocacaoAlvo } : {}),
    });
    setNome(""); setExpr(""); setRodadas("");
  };

  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-1.5 flex-wrap">
      <input
        type="text" value={nome} onChange={(e) => setNome(e.target.value)}
        placeholder="Nome" aria-label="Nome do buff"
        className="afty-campo bg-transparent outline-none flex-1 min-w-[6rem]"
      />
      {temInvocacoes && (
        <select
          value={escopo}
          onChange={(e) => trocaEscopo(e.target.value)}
          aria-label="Onde o buff cai"
          className="afty-campo bg-transparent outline-none"
          style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
        >
          <option value="criatura" style={{ background: "var(--afty-card)" }}>na criatura</option>
          <option value="invocacao" style={{ background: "var(--afty-card)" }}>na invocação</option>
        </select>
      )}
      {naInvocacao && (
        <select
          value={invocacaoAlvo}
          onChange={(e) => setInvocacaoAlvo(e.target.value)}
          aria-label="Qual invocação"
          className="afty-campo bg-transparent outline-none"
          style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
        >
          <option value="" style={{ background: "var(--afty-card)" }}>todas</option>
          {invocacoes.map((inv) => (
            <option key={inv.id} value={inv.id} style={{ background: "var(--afty-card)" }}>
              {inv.nome || "Sem nome"}
            </option>
          ))}
        </select>
      )}
      {/* ⚠ Era um `<select>` com os canais numa lista corrida, e o autor pediu o
          do Motor em 2026-08-06: são dezenas de canais, e o nativo os despeja
          num tubo sem grupo nenhum. Ver `CanalPicker`. */}
      <CanalPicker
        value={canal}
        onChange={setCanal}
        catalogo={naInvocacao ? INV_EFEITO_CANAL_GRUPOS : undefined}
      />
      <input
        type="text" value={expr} onChange={(e) => setExpr(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="+2" aria-label="Valor ou expressão"
        className="afty-campo bg-transparent outline-none w-16 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <input
        type="text" inputMode="numeric" value={rodadas} onChange={(e) => setRodadas(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") cria(); }}
        placeholder="∞" aria-label="Duração em rodadas"
        className="afty-campo bg-transparent outline-none w-12 text-center"
        style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
      />
      <button type="button" className="afty-botao" onClick={cria} aria-label="Adicionar o buff">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function AbaBuffs({
  derived, sessao, onPatchCombate, onEstado, onBuffs, onCondicoes, deltaPorEstado,
  onConceder, onRemoverConcessao, onExaustao, onSangrar, saldoAgora,
}) {
  const combate = derived.combate ?? {};
  // As invocações da ficha, para um buff de mesa poder cair num shikigami.
  const invocacoes = derived.invocacoes?.lista ?? [];

  /* ⚠ A CONCESSÃO É RECURSO DE ADDON, e não do raw (autor, 2026-08-20, vendo o
     card aparecer na tela de quem não usa addon nenhum). Só enxerga quem
     instalou um pacote com `permite: ["concessao"]`.

     O `|| já tem alguma coisa` não é folga: sem ele, desinstalar o addon
     deixaria a linha morta presa na sessão sem botão de tirar. */
  const concedido = derived.concedido ?? [];
  const mostraConcessao = usePrimitiva("concessao") || concedido.length > 0;

  /* Os estados que ESTA criatura alcança. Mesma filtragem da bancada do
     criador: quem não pegou a habilidade não vê a linha.

     ⚠ As listas são lidas DENTRO do memo, e não fora: `derived.x ?? []` cria um
     array novo a cada render, e como dependência ele invalidaria o memo sempre.
     Depender do `derived` inteiro é o certo, porque é ele que muda de verdade. */
  /* ⚠ A REGRA MORA NO `ficha-buffs.js`, e não aqui. O `deltaDosEstados` precisa
     da MESMA lista para saber em quais estados vale gastar um derive, e a posse
     escrita nos dois lugares envelheceria num só. Ver `linhasDeEstado`. */
  const linhas = useMemo(() => linhasDeEstado(derived), [derived]);

  /* O filtro local, gêmeo do das abas Habilidades e Equipamentos: some com Esc
     e não é gravado na sessão, porque é estado de TELA. */
  const [termo, setTermo] = useState("");
  /* A sub-aba escolhida. Guarda só a escolha, e quem a conserta quando o filtro
     esvazia a divisão aberta é a conta de leitura logo abaixo, e não um efeito:
     efeito que chama setState é cascata, e o eslint do projeto barra. */
  const [subEscolhida, setSubEscolhida] = useState(null);

  /* As linhas em ÁRVORE, por sub-aba e por família. Quem faz a conta é o
     `organizaEstados`, que é puro e testado à parte: o parentesco do
     `requerEstado`, o dono de cada estado e o cabeçalho de família saem todos de
     lá. Ver `ficha-estados.js`. */
  const { subs, blocosDaSub } = useMemo(
    () => organizaEstados(linhas, termo),
    [linhas, termo],
  );
  const subAtiva = subs.some((x) => x.id === subEscolhida)
    ? subEscolhida
    : (subs[0]?.id ?? null);
  const blocos = blocosDaSub[subAtiva] ?? [];

  /* ⚠ OS LIGADOS SAEM DA MESMA `estaLigado` QUE O DELTA USA, e não de um teste
     escrito aqui: esta seção mostra exatamente as linhas para as quais o
     `deltaDosEstados` calculou um chip. Com duas definições de "ligado", a
     seção listaria uma linha sem chip nenhum, ou esconderia uma que tem.

     A lista é PLANA e com o rótulo INTEIRO, ao contrário da de baixo: aqui não
     se procura nada, se lê o que está valendo, e "Brutalidade · Pilhas" sem a
     caixa do pai ao redor precisa dizer de quem é.

     Fora de combate ela não aparece, porque `ativo: false` zera tudo. */
  const ligados = useMemo(
    () => {
      // ⚠ O `combate` é lido DENTRO, pela mesma razão anotada no memo das
      // linhas: `derived.combate ?? {}` cria objeto novo a cada render, e como
      // dependência ele invalidaria este memo sempre. Depender do `derived`
      // inteiro é o certo, porque é ele que muda de verdade.
      const c = derived.combate ?? {};
      if (!c.ativo) return [];
      /* ⚠ O `requerEstado` vale AQUI TAMBÉM. O valor de um filho não é zerado
         quando o pai desliga, então um "Pilhas 3" esquecido de uma luta anterior
         continua ligado no papel: sem esta guarda ele subiria para o topo da aba
         enquanto a lista de baixo, que aplica o mesmo teste, o esconde. */
      return linhas.filter((e) => estaLigado(e, c[e.id]) && estadoVisivel(e, c));
    },
    [linhas, derived],
  );

  const visivel = (e) => estadoVisivel(e, combate);
  const buffs = sessao.buffs ?? [];
  const condicoes = sessao.condicoes ?? [];

  /* As condições da sessão, JÁ RESOLVIDAS pelo derive (o que cada uma faz e o
     que perdeu a disputa), e ordenadas pela GRAVIDADE. Com três em cima da
     criatura, a que mais dói tem de estar no topo, e a ordem de quem clicou
     primeiro não diz nada.

     ⚠ A ordenação é ESTÁVEL: `sort` comparando só o nível preserva a ordem de
     chegada dentro da mesma força, então marcar duas Fracas não faz uma pular
     por cima da outra a cada render. */
  const condicoesNaCriatura = useMemo(
    () => {
      const resolvidas = new Map((derived.condicoes?.lista ?? []).map((c) => [c.id, c]));
      return (sessao.condicoes ?? [])
        .map((c) => ({
          ...fichaDaCondicao(c.nome, c.forca),
          ...(resolvidas.get(c.id) ?? {}),
          id: c.id,
          rodadas: c.rodadas ?? null,
          // A do Ritual Estendido não sai pelo X: quem a tirou foi o ritual.
          travada: c.id === "ritual:desprevenido",
        }))
        .sort((a, b) => b.nivel - a.nivel);
    },
    [sessao.condicoes, derived],
  );
  // O catálogo de condições fica fechado: aberto, ele ocupa a aba inteira.
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  // Qual condição a pastilha do painel do turno mandou mostrar, e qual está
  // aberta no detalhe. A pastilha faz as duas coisas: rola até ela e abre.
  const [condicaoAlvo, setCondicaoAlvo] = useState(null);
  const [condicaoAberta, setCondicaoAberta] = useState(null);
  // O formulário de buff de mesa mora atrás de um botão: ele tem cinco campos.
  const [novoBuff, setNovoBuff] = useState(false);
  const aplicadas = new Set(condicoes.map((c) => c.nome));
  // O Em Combate aparece para quem tem estado para ligar, ou Imitação.
  const temCombate = linhas.length > 0 || !!derived.imitacao?.disponivel;
  const trocaRodadas = (id, rodadas) => onCondicoes(condicoes.map((c) => (c.id === id
    ? { ...c, rodadas: rodadas == null ? null : Math.max(1, Math.trunc(rodadas)) }
    : c)));

  return (
    <div className="space-y-3">
      {/* ---------- agora ----------
          A primeira coisa da aba, porque é a pergunta do meio do turno: com tudo
          isto ligado, onde estão os meus números. Ver `FaixaAgora`. */}
      <PainelDoTurno
        saldo={saldoAgora}
        controle={temCombate ? <BotaoEmCombate combate={combate} onPatchCombate={onPatchCombate} /> : null}
        condicoes={condicoesNaCriatura}
        onAbrirCondicao={(id) => { setCondicaoAlvo(id); setCondicaoAberta(id); }}
      />
      <PainelDeImitacao derived={derived} sessao={sessao} onPatchCombate={onPatchCombate} controleCombate={null} />
      {/* ---------- concedido pelo mestre (Addons 8.3) ----------
          Primeiro da aba quando aparece, e de propósito: é o único bloco daqui
          em que a criatura na mesa passa a ser diferente da criatura no papel.

          Some inteiro para quem só usa o raw. Ver `mostraConcessao`. */}
      {mostraConcessao && (
        <PainelDeConcessao
          concedido={concedido}
          onConceder={onConceder}
          onRemover={onRemoverConcessao}
        />
      )}

      {/* ---------- condições ----------
          ⚠ SUBIRAM PARA DEPOIS DO SALDO (2026-09-22). Moravam no fim da aba,
          embaixo de três seções, e são o que muda mais vezes numa rodada: é o
          inimigo que as põe e tira.

          ⚠ A EXAUSTÃO VIAJA NO CABEÇALHO DELAS, e não numa seção própria: ela é
          um número só, e um card inteiro para um número empurraria as Condições
          para baixo da dobra no celular. */}
      <Secao
        titulo="Condições"
        direita={
          <span className="flex items-center gap-2">
            <span className="afty-rotulo text-[10px] uppercase tracking-wider">Exaustão</span>
            <ContadorDeExaustao valor={sessao?.exaustao} onValor={onExaustao} />
          </span>
        }
      >
        {condicoesNaCriatura.length > 0 && (
          <div className="afty-cond-lista mb-1.5">
            {condicoesNaCriatura.map((c) => (
              <React.Fragment key={c.id}>
                <LinhaCondicao
                  condicao={c}
                  aberta={condicaoAberta === c.id}
                  onAbrir={() => setCondicaoAberta((a) => (a === c.id ? null : c.id))}
                  onRemover={() => onCondicoes(condicoes.filter((x) => x.id !== c.id))}
                  onRodadas={(n) => trocaRodadas(c.id, n)}
                  destacado={condicaoAlvo === c.id}
                />
                {condicaoAberta === c.id && (
                  <DetalheDaCondicao condicao={c} onSangrar={onSangrar ? () => onSangrar(c) : null} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <button
          type="button"
          className="afty-botao"
          aria-haspopup="dialog"
          aria-expanded={catalogoAberto}
          onClick={() => setCatalogoAberto(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Condição
        </button>
      </Secao>

      {/* A gaveta é CAMADA, e não filha da seção: ela cobre a ficha e pede uma
          coisa só, como a busca global e o Cofre. Montada na hora, nasce com o
          termo limpo e o cursor no começo. */}
      {catalogoAberto && (
        <GavetaDeCondicoes
          aplicadas={aplicadas}
          onAplicar={(c) => onCondicoes([...condicoes, { ...c, id: idNovoDeCondicao(condicoes) }])}
          // Tirar pela gaveta tira todas daquele nome, menos a do Ritual.
          onTirar={(nome) => onCondicoes(condicoes.filter((x) => x.nome !== nome || x.id === "ritual:desprevenido"))}
          onFechar={() => setCatalogoAberto(false)}
        />
      )}

      {/* ---------- o que está ligado agora ----------
          Ladrilhos, e não a linha inteira de cada estado: ver `LadrilhoLigado`.
          O controle completo continua na lista de Estados logo abaixo. */}
      {ligados.length > 0 && (
        <Secao
          titulo="Ligados Agora"
          direita={(
            <button
              type="button"
              className="afty-botao"
              onClick={() => onPatchCombate(Object.fromEntries(ligados.map((e) => [e.id, padraoDe(e)])))}
            >
              Desligar Tudo
            </button>
          )}
        >
          <ListaLigados
            ligados={ligados}
            combate={combate}
            deltaPorEstado={deltaPorEstado}
            onValor={onEstado}
            derived={derived}
          />
        </Secao>
      )}

      {/* ---------- catalogados ---------- */}
      {linhas.length > 0 && (
        <Secao
          titulo="Estados"
          contagem={linhas.length}
          recolhivel
          abertaPadrao={ligados.length === 0}
        >
          {/* O filtro local, gêmeo do das Habilidades: casa contra o rótulo do
              catálogo, com a família na frente, então procurar "manobra" acha as
              quatro Manobras mesmo depois que o cabeçalho tirou a palavra dos
              rótulos delas. */}
          <div className="afty-linha px-2.5 py-1.5 flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setTermo(""); }}
              placeholder="Filtrar"
              aria-label="Filtrar os estados"
              className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
            />
            {termo && (
              <button type="button" className="afty-passo" onClick={() => setTermo("")} aria-label="Limpar o filtro">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <SubAbas subs={subs} ativa={subAtiva} rotulo="Estados" onAtiva={setSubEscolhida} />

          {/* ⚠ Fora de combate TUDO zera, e é por isso que a lista fica apagada
              em vez de sumir: o jogador precisa ver o que existe para saber que
              tem de entrar em combate primeiro. */}
          <div className={combate.ativo ? "space-y-1" : "space-y-1 opacity-40 pointer-events-none"}>
            {blocos.length === 0 && <p className="afty-vazio px-1 py-2">Nada com esse filtro</p>}
            {blocos.map((bloco, i) => {
              const visiveis = bloco.grupos.filter(({ pai }) => visivel(pai));
              if (!visiveis.length) return null;
              return (
                /* A chave leva o índice porque uma família pode voltar a
                   aparecer depois de um trecho sem cabeçalho, e o bloco sem
                   cabeçalho não tem nome nenhum para dar. */
                <div key={`${bloco.familia ?? ""}#${i}`} className="space-y-1">
                  {bloco.familia && <p className="afty-estado-familia">{bloco.familia}</p>}
                  {visiveis.map(({ pai, filhos }) => {
                    const linha = (e) => (
                      <LinhaEstado
                        key={e.id}
                        estado={e}
                        valor={combate[e.id]}
                        opcoes={e.opcoesVisiveis}
                        delta={deltaPorEstado?.[e.id] ?? []}
                        onValor={onEstado}
                        derived={derived}
                        bloqueado={e.umaVezPorRodada && estadoUsadoNestaRodada(sessao, e.id)}
                      />
                    );
                    return (
                      <GrupoDeEstados key={pai.id} pai={pai} filhos={filhos.filter(visivel).map(linha)}>
                        {linha(pai)}
                      </GrupoDeEstados>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Secao>
      )}

      {/* ---------- ad-hoc ---------- */}
      <Secao titulo="Buffs de Mesa">
        {buffs.map((b) => (
          <div key={b.id} className="afty-linha px-2.5 py-1.5 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{b.nome}</span>
            {/* O buff da invocação lê o rótulo no catálogo DELA, e diz para
                quem vai: sem isso um "+2 Defesa" na lista não se distingue do
                da criatura. */}
            <span className="afty-rotulo text-[10px] truncate">{rotuloDoBuff(b, invocacoes)}</span>
            <span className="afty-valor text-[12px]">{b.expr}</span>
            <Rodadas
              nome={b.nome}
              rodadas={b.rodadas}
              onRodadas={(n) => onBuffs(buffs.map((x) => (x.id === b.id ? { ...x, rodadas: Math.max(1, Math.trunc(n)) } : x)))}
            />
            <button
              type="button" className="afty-passo"
              onClick={() => onBuffs(buffs.filter((x) => x.id !== b.id))}
              aria-label={`Remover ${b.nome}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {novoBuff
          ? <NovoBuff onCriar={(b) => { onBuffs([...buffs, b]); setNovoBuff(false); }} invocacoes={invocacoes} />
          : (
            <button type="button" className="afty-botao" onClick={() => setNovoBuff(true)}>
              <Plus className="w-3.5 h-3.5" />
              Novo Buff
            </button>
          )}
      </Secao>

    </div>
  );
}
