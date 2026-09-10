/**
 * ============================================================
 * VISLUMBRE CELESTE — o painel da Ficha Final
 * ============================================================
 * O que a mesa usa DURANTE o jogo: descobrir e cobrir os olhos, e a Fadiga que
 * corre enquanto eles estão descobertos.
 *
 * ⚠ ELE FICA NA ABA AÇÕES, e não em Buffs (autor, 2026-09-09: *"para eu não
 * precisar ir para Buffs o tempo inteiro"*). É a mesma decisão que o controle da
 * Azamaru recebeu em 2026-09-07: o que se FAZ no turno mora onde se age.
 *
 * ⚠ NÓ PRONTO, montado pela Ficha e injetado na aba, como o Ciclo de Adaptação e
 * as Armas Transformáveis. O painel mexe na SESSÃO, e a sessão é de quem monta a
 * aba: a Ficha e o painel de Encontros têm `onSessao` diferentes.
 *
 * ⚠ A CONVERSÃO DA FADIGA É AUTOMÁTICA. *"Ao acumular 4 pontos de fadiga, você
 * sofre imediatamente 1 Nível de Exaustão e seus Pontos de Fadiga são zerados"*:
 * o quarto ponto nunca fica na tela. A conta mora em `acumulaFadiga`, e o
 * contador de Exaustão fica ao lado para a conversão se ver acontecer.
 * ============================================================
 */

import { Eye, EyeOff, Minus, Plus } from "lucide-react";

import { acumulaFadiga, alternaOlhos, FADIGA_MAXIMA } from "../afty-vislumbre-celeste";

/* Metros com vírgula, como o resto da ficha escreve distância. */
const metros = (n) => `${String(n).replace(".", ",")}m`;

/* Um contador de dois botões. O mesmo desenho do de Exaustão na aba Buffs. */
function Contador({ rotulo, valor, onMenos, onMais, tom, dica, semMenos = false }) {
  return (
    <span className="flex items-center gap-1.5" role="group" aria-label={`${rotulo}: ${valor}`}>
      <span className="afty-rotulo text-[10px] uppercase tracking-wider">{rotulo}</span>
      <button
        type="button"
        className="afty-botao"
        onClick={onMenos}
        disabled={semMenos}
        aria-label={`Menos um ponto de ${rotulo}`}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="afty-valor text-[12px] tabular-nums" data-afty-tom={tom} title={dica}>
        {valor}
      </span>
      <button
        type="button"
        className="afty-botao"
        onClick={onMais}
        aria-label={`Mais um ponto de ${rotulo}`}
      >
        <Plus className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function PainelDoVislumbre({ derived, sessao, onSessao }) {
  const v = derived?.vislumbre;
  if (!v?.tem) return null;
  const descoberto = v.descoberto;
  const fadiga = v.fadiga;
  const exaustao = Math.max(0, Math.trunc(Number(sessao?.exaustao) || 0));

  return (
    <section className="afty-card p-3 space-y-2" data-afty-painel="vislumbre">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">Vislumbre Celeste</h2>
        {/* O botão é o que a pessoa vem aqui fazer: uma Ação Livre que troca os
            dois blocos de benefício. */}
        <button
          type="button"
          className="afty-botao flex items-center gap-1"
          data-afty-tom={descoberto ? "destaque" : undefined}
          aria-pressed={descoberto}
          onClick={() => onSessao((s) => alternaOlhos(s, !descoberto))}
          title="Ação Livre. Troca os benefícios cobertos pelos descobertos, e começa a gerar Fadiga"
        >
          {descoberto ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {v.bloco.rotulo}
        </button>
      </div>

      <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
        <span className="afty-valor text-[11px]" title={`${v.bloco.visaoNome}: percepção às cegas`}>
          Visão {metros(v.visao)}
        </span>
        <span className="afty-valor text-[11px]" title={`${v.bloco.processamento}: todo gasto em PE, com o piso de 1 PE`}>
          PE {v.reducaoPe > 0 ? `-${v.reducaoPe}` : "0"}
        </span>
        <span className="afty-valor text-[11px]" title="Percepção e Feitiçaria">
          Perícias {v.pericia > 0 ? `+${v.pericia}` : "0"}
        </span>
        <span className="afty-valor text-[11px]" title="Teste de Feitiçaria ou Percepção">
          Ler Técnica CD {v.cdLerTecnica}
        </span>
        <span className="afty-rotulo text-[10px]">CL {v.cl}</span>
      </div>

      {/* ⚠ A FADIGA E A EXAUSTÃO NA MESMA LINHA, e nessa ordem: uma vira a outra.
          O quarto ponto de Fadiga não aparece, ele já sai como Exaustão. */}
      <div className="afty-linha px-2.5 py-2 flex items-center gap-4 flex-wrap">
        <Contador
          rotulo="Fadiga"
          valor={`${fadiga} / ${FADIGA_MAXIMA}`}
          tom={fadiga > 0 ? "custo" : undefined}
          dica="1 ponto no fim de cada turno com os olhos descobertos"
          semMenos={fadiga === 0}
          onMenos={() => onSessao((s) => acumulaFadiga(s, -1))}
          onMais={() => onSessao((s) => acumulaFadiga(s, 1))}
        />
        <Contador
          rotulo="Exaustão"
          valor={exaustao}
          tom={exaustao > 0 ? "custo" : undefined}
          semMenos={exaustao === 0}
          onMenos={() => onSessao((s) => ({ ...s, exaustao: Math.max(0, exaustao - 1) }))}
          onMais={() => onSessao((s) => ({ ...s, exaustao: exaustao + 1 }))}
        />
      </div>
    </section>
  );
}
