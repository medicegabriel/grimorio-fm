/**
 * ============================================================
 * ABA RESISTÊNCIAS — Imunidade, Resistência, RD e Vulnerabilidade por tipo de dano
 * ============================================================
 * Pedido do autor em 2026-09-02. O modelo e a resolução ficam em
 * `afty-defesas-dano.js`, e esta tela só desenha o que ele devolve.
 *
 * ⚠ ELA SE CHAMAVA "DEFESAS" ATÉ 2026-09-05, e o nome novo é só o RÓTULO. O id
 * da aba, o nome deste arquivo, o do módulo e o campo `creature.defesasDano`
 * continuam dizendo "defesas": renomear o campo pediria migração de ficha
 * salva, e um rótulo novo não vale esse risco. Comentário que fale da "aba de
 * Defesas" num evento PASSADO está certo como está.
 *
 * ⚠ Não confundir com os TESTES DE RESISTÊNCIA da aba Perícias, que são outra
 * coisa (Reflexos, Fortitude, Vontade, Astúcia, Integridade).
 *
 * ⚠ ARQUIVO PRÓPRIO, pelo mesmo motivo do painel de Addons: o AftyCreatureBuilder.jsx
 * passou das 13 mil linhas e o Babel já reclama do tamanho ao processá-lo.
 *
 * ------------------------------------------------------------
 * O QUE A TELA DEIXA MEXER, E O QUE ELA SÓ MOSTRA
 * ------------------------------------------------------------
 * A linha de um tipo tem DUAS metades, e elas não se confundem:
 *
 *   EDITÁVEL — os três chips de estado (excludentes entre si) e o campo de RD.
 *              É o que a criatura tem POR NATUREZA.
 *   DERIVADO — o que o Motor concedeu, que aparece como chip aceso e não
 *              clicável, e a RD EFETIVA à direita, com hover de fontes.
 *
 * Um chip que o Motor acendeu não desliga daqui, igual a toda concessão do
 * projeto: quem concede é a habilidade, e desmarcar aqui mentiria.
 *
 * ------------------------------------------------------------
 * ⚠ AS FONTES DE RD VÊM ANTES DA GRADE (2026-09-05)
 * ------------------------------------------------------------
 * Pedido do autor: *"programe as fontes de RD do Livro direitinho e coloque
 * lá"*. A grade por tipo mostrava a RD EFETIVA de cada linha e nada dizia de
 * onde ela saía, e três pilhas alimentam as quinze linhas ao mesmo tempo: a RD
 * Geral alcança todo tipo menos alma, a Física soma nos três físicos, e a da
 * Alma só existe no dano na alma.
 *
 * O card de cima é essas pilhas, cada uma com o hover das fontes DELA. É o mesmo
 * número que a grade usa, lido pelo outro lado: ali a pergunta é "quanto tenho
 * contra Queimante", aqui é "de onde vem a RD que eu tenho".
 *
 * ⚠ A parcela do EQUIPAMENTO chega nomeada desde 2026-09-05. Antes ela vinha
 * como uma linha só, "Equipamento: 9", que somava a coluna de RD do escudo e a
 * tabela de grau da Ferramenta, que o livro lista separadas. Ver `rdPartes` em
 * `afty-equipamentos.js`.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO, e aviso usa `<AlertTriangle/>` e nunca o caractere. Explicação de item
 * vai no `title`.
 * ============================================================
 */

import { AlertTriangle } from "lucide-react";
import { Card } from "./ui/primitivos";
import { PainelDeFontes } from "./ui/fontes";
import { ESTADOS_DEFESA } from "./afty-defesas-dano";

/* Cada estado tem cor própria, porque a linha é lida de relance: verde protege,
   âmbar protege menos, vermelho machuca. */
const CORES = {
  imune:      { on: "bg-emerald-700 border-emerald-500 text-white", off: "border-slate-700 text-slate-400 hover:border-emerald-700 hover:text-emerald-300" },
  resistente: { on: "bg-sky-700 border-sky-500 text-white",         off: "border-slate-700 text-slate-400 hover:border-sky-700 hover:text-sky-300" },
  vulneravel: { on: "bg-rose-800 border-rose-600 text-white",       off: "border-slate-700 text-slate-400 hover:border-rose-700 hover:text-rose-300" },
};

function ChipEstado({ estado, ligado, doMotor, onToggle, fontes }) {
  const cor = CORES[estado.id];
  const concedido = doMotor && !ligado;
  return (
    <div className="relative group/est">
      <button
        type="button"
        onClick={() => !doMotor && onToggle()}
        disabled={doMotor}
        aria-pressed={ligado || doMotor}
        title={doMotor ? `${estado.label} concedida` : estado.label}
        className={`w-full text-[11px] font-semibold px-2 py-1 rounded-md border transition-colors ${
          ligado || doMotor ? cor.on : cor.off
        } ${doMotor ? "cursor-default ring-1 ring-inset ring-white/25" : ""}`}
      >
        {estado.curto}
      </button>
      {concedido && fontes?.length > 0 && (
        <PainelDeFontes partes={fontes} total={fontes.length} aparecer="group-hover/est:block" />
      )}
    </div>
  );
}

/* ⚠ AS COLUNAS SÃO AS MESMAS NO CABEÇALHO E NA LINHA, e a constante existe para
   que continuem sendo. Elas estavam escritas duas vezes, e duas grades
   independentes com colunas `auto` só se alinham enquanto ninguém mexe numa
   das duas: mudar a largura de um chip aqui e esquecer o cabeçalho lá desalinha
   a tabela inteira sem erro nenhum. */
const COLUNAS = "grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto] items-center gap-1.5";

function LinhaTipo({ linha, onEstado, onRd }) {
  const manualEstado = linha.manual.estado;
  return (
    <div className={`${COLUNAS} px-2 py-1.5 rounded-lg ${
      linha.conflito ? "bg-amber-950/40 ring-1 ring-amber-800" : "odd:bg-slate-950/40"
    }`}>
      <span className="text-[12px] text-slate-200 truncate" title={linha.label}>{linha.label}</span>

      {/* ⚠ Os controles encolhem no telefone. Em 390px a linha tem ~324px, e com
          os chips em 44px sobravam 58px para o nome: "Congelante" virava
          "Congela...". Estreitar os cinco controles devolve ~40px ao rótulo, que
          é onde a informação está. */}
      {ESTADOS_DEFESA.map((e) => (
        <div key={e.id} className="w-9 sm:w-11">
          <ChipEstado
            estado={e}
            ligado={manualEstado === e.id}
            doMotor={linha.estados.includes(e.id) && manualEstado !== e.id}
            fontes={linha.fontesEstado[e.id]}
            onToggle={() => onEstado(linha.tipo, manualEstado === e.id ? null : e.id)}
          />
        </div>
      ))}

      {/* A RD da ficha. Só o que a pessoa digitou, porque é o único pedaço
          que ela controla: o total vem ao lado.

          ⚠ AS SETINHAS SAEM, E ELAS SÃO O QUE TORTA QUALQUER ALINHAMENTO AQUI.
          Um `input[type=number]` com `appearance: auto` reserva ~15,75px à
          direita para os botões de subir e descer, mesmo sem desenhá-los: o
          Chrome só os PINTA no hover, e o espaço fica sempre lá. Isso desloca
          tanto o `text-right` (o número foge da borda) quanto o `text-center`
          (o centro cai ~7,5px à esquerda do centro real).

          As três utilidades abaixo são as MESMAS que o `builder-controls.jsx`
          da 2.5.2 já usa nos campos numéricos dele.

          ⚠ E CUIDADO COM A MEDIÇÃO. Calcular a posição do número pela caixa
          (`borda − padding`) dá o valor errado, porque a caixa não sabe da
          faixa reservada: a conta dava 385,05 e o glifo estava em 369,3, e o
          `getComputedStyle` concordava com a conta. Para conferir alinhamento
          aqui, medir o PIXEL do que foi desenhado. */}
      <input
        type="number"
        min={0}
        value={linha.manual.rd || ""}
        onChange={(ev) => onRd(linha.tipo, ev.target.value)}
        placeholder="0"
        aria-label={`RD contra ${linha.label}`}
        className="w-10 sm:w-12 bg-slate-950 border border-slate-700 rounded-md px-1 sm:px-1.5 py-1 text-[12px] text-center text-slate-200 focus:border-purple-600 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      {/* A RD EFETIVA contra este tipo, que é o número que se usa na mesa: já
          traz a Geral, a Física e a da Alma somadas onde cada uma alcança. */}
      {/* Centrado, para cair debaixo da palavra "Total". Ver a nota no cabeçalho. */}
      <div className="relative group/rd w-8 sm:w-10 text-center">
        <span className={`text-[13px] font-semibold tabular-nums ${linha.rd > 0 ? "text-white" : "text-slate-600"}`}>
          {linha.rd}
        </span>
        {linha.partes.length > 0 && (
          <PainelDeFontes partes={linha.partes} total={linha.rd} aparecer="group-hover/rd:block" />
        )}
      </div>
    </div>
  );
}

/* ============================================================ */
/* AS PILHAS DE RD                                              */
/* ============================================================ */
/* ⚠ A ORDEM É A DO ALCANCE, da mais larga para a mais estreita, e não a
   alfabética: a Geral pega catorze dos quinze tipos, a Física pega três, a da
   Alma pega um. Quem lê de cima para baixo lê a régua.

   ⚠ A RD ESPECÍFICA fica de fora quando é zero, e é a única das quatro que
   some. O autor decidiu em 2026-07-30 que ela *"vai VIRAR RD POR TIPO DE
   DANO"*, e o bloqueio de então (a lista de tipos) caiu em 2026-09-02: ela está
   de saída, então mostrar um zero dela em toda ficha seria dar destaque a uma
   pilha que o sistema está aposentando. Enquanto houver ficha com valor nela, o
   número aparece. */
const PILHAS_RD = [
  { key: "rdGeral",      label: "RD Geral" },
  { key: "rdFisico",     label: "RD Física" },
  { key: "rdAlma",       label: "RD a Alma" },
  { key: "rdEspecifico", label: "RD Específica", soSeTiver: true },
];

function PilhaRd({ label, valor, partes }) {
  return (
    <div className="relative group/pilha bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
      <div className="text-[9px] uppercase tracking-wider text-slate-500 truncate">{label}</div>
      <div className={`font-mono font-bold text-lg tabular-nums ${valor > 0 ? "text-white" : "text-slate-600"}`}>
        {valor}
      </div>
      {partes.length > 0 && (
        <PainelDeFontes partes={partes} total={valor} ancora="esquerda" aparecer="group-hover/pilha:block" />
      )}
    </div>
  );
}

export default function TabDefesas({ derived, setDefesaEstado, setDefesaRd }) {
  const { linhas, avisos } = derived.defesasDano;

  /* ⚠ AGRUPA PELO QUE A LINHA JÁ TRAZ, e não pelo catálogo: cada linha vem do
     `resolveDefesasDano` com `categoriaId` e `categoria` dentro. Assim esta tela
     não importa o `afty-equipamentos`, que é o que quebrou o app em 2026-09-02
     (ver a nota do módulo folha em afty-defesas-dano.js). O bônus é que um tipo
     que um Addon trouxe entra sozinho, sem a aba saber que ele existe. */
  const porCategoria = [];
  for (const l of linhas) {
    const achado = porCategoria.find((c) => c.id === l.categoriaId);
    if (achado) achado.linhas.push(l);
    else porCategoria.push({ id: l.categoriaId, nome: l.categoria ?? "Outros", linhas: [l] });
  }

  const cabecalho = (
    <div className={`${COLUNAS} px-2 pb-1 text-[10px] uppercase tracking-wide text-slate-500`}>
      <span>Tipo</span>
      {ESTADOS_DEFESA.map((e) => (
        <span key={e.id} className="w-9 sm:w-11 text-center" title={e.label}>{e.curto}</span>
      ))}
      {/* ⚠ RD É CENTRADO, e as duas colunas de número desta linha também
          (autor, 2026-09-05: *"era para alinhar o RD e o número para o centro, e
          não o número para a lateral"*).

          O caminho até aqui vale registro, porque foram três tentativas. A
          primeira alinhava os dois à DIREITA e o rótulo ficava 7,75px fora,
          porque o campo tem padding e o rótulo não. A segunda consertou isso e
          continuava torto, porque um `input[type=number]` reserva ~15px
          invisíveis para as setinhas. A terceira é esta, e é a que o autor
          queria desde o começo: nada de borda, os dois no centro da coluna.

          ⚠ O CONSERTO DAS SETINHAS CONTINUA SENDO NECESSÁRIO. Com elas, o
          `text-center` centraria o número no espaço que SOBRA depois da faixa
          reservada, e ele cairia ~7,5px à esquerda do centro real. */}
      <span className="w-10 sm:w-12 text-center">RD</span>
      {/* O Total segue a mesma régua: rótulo e número no centro da coluna, como
          IMU, RES e VUL já eram sobre os chips. */}
      <span className="w-8 sm:w-10 text-center">Total</span>
    </div>
  );

  /* As pilhas que a tela mostra, com as fontes já filtradas. */
  const pilhas = PILHAS_RD
    .map((p) => ({ ...p, valor: derived[p.key] ?? 0, partes: (derived.partes?.[p.key] ?? []).filter(Boolean) }))
    .filter((p) => !p.soSeTiver || p.valor > 0);

  return (
    <div className="space-y-4">
      {avisos.length > 0 && (
        <div className="bg-amber-950/50 border border-amber-800 rounded-xl px-4 py-3 space-y-1">
          {avisos.map((a) => (
            <p key={a.tipo} className="text-[12px] text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
              <span>{a.texto}</span>
            </p>
          ))}
        </div>
      )}

      {/* ⚠ AS FONTES DE RD VÊM ANTES DA GRADE. Elas alimentam as quinze linhas
          de baixo, então lê-las depois seria ler a conta antes das parcelas. */}
      <Card title="Redução de Dano">
        {/* ⚠ A CONTAGEM DE COLUNAS SEGUE A DE PILHAS, e as duas classes estão
            escritas por extenso porque o Tailwind lê o código-fonte e não
            enxerga nome montado em template. Com `sm:grid-cols-4` fixo e só três
            pilhas na tela, sobrava um quarto vazio à direita que lia como
            informação faltando. */}
        <div className={`grid grid-cols-2 gap-2 ${pilhas.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          {pilhas.map((p) => (
            <PilhaRd key={p.key} label={p.label} valor={p.valor} partes={p.partes} />
          ))}
        </div>
      </Card>

      {/* ⚠ OS CARDS VÃO EM DUAS COLUNAS, e isto é o conserto do desalinhamento
          que o autor apontou. Em coluna única a grade tinha 889px de largura e
          precisava de 250: o nome do tipo ficava colado na borda esquerda e os
          controles na direita, com 590px de vão no meio, e o olho perdia a linha
          entre um e outro. Com duas colunas cada grade tem ~430px e o vão some.

          ⚠ AS COLUNAS SÃO PILHAS, E NÃO CÉLULAS DE GRADE (2026-09-05, a pedido
          do autor: *"suba a lista de Etéreos para cima"*). Numa grade de duas
          colunas toda fileira tem a altura do card mais alto dela, então
          Físicos (3 tipos) deixava 124px de buraco embaixo de si e Etéreos só
          começava depois de Elementais (5 tipos) terminar. Empilhando, cada
          coluna corre sozinha e Etéreos sobe para logo abaixo de Físicos.

          ⚠ A DIVISÃO É POR PARIDADE, e não pela metade, para o desenho não
          trocar de lugar: os pares ficam na coluna da esquerda e os ímpares na
          direita, que é exatamente onde cada card já estava. Dividir pela
          metade mandaria Elementais para baixo de Físicos e Etéreos para o topo
          da direita, que não é subir, é atravessar.

          ⚠ O PREÇO É A ORDEM NO TELEFONE. Abaixo de `lg` as duas pilhas viram
          uma só, e a leitura passa a ser Físicos, Etéreos, Elementais,
          Biológicos, em vez da ordem do livro. Não há como evitar em CSS puro
          sem duplicar os cards no DOM: masonry de grade não existe, e a ordem
          de leitura de uma pilha é a ordem dela.

          ⚠ E OS FUNDOS NÃO FECHAM EXATAMENTE, o que também é aritmética e não
          descuido. Com 3, 5, 5 e 2 tipos, a melhor divisão possível deixa a
          esquerda com 8 linhas e a direita com 7: sobra a altura de UMA linha,
          52px medidos. Emparelhar de outro jeito só troca qual coluna sobra. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {[porCategoria.filter((_, i) => i % 2 === 0), porCategoria.filter((_, i) => i % 2 === 1)]
          .map((coluna, i) => (
            <div key={i} className="space-y-4">
              {coluna.map((c) => (
                <Card key={c.id} title={c.nome}>
                  {cabecalho}
                  <div className="space-y-0.5">
                    {c.linhas.map((l) => (
                      <LinhaTipo key={l.tipo} linha={l} onEstado={setDefesaEstado} onRd={setDefesaRd} />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
