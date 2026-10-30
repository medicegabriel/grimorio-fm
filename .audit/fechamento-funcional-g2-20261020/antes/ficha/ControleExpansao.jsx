/**
 * ============================================================
 * A EXPANSÃO DE DOMÍNIO NA MESA (Etapa 10, 2026-10-08)
 * ============================================================
 * O controle que entra na linha da Expansão, na Ficha Final e no Encontro (as
 * duas telas montam a mesma `AbaAcoes`), e o painel da Exaustão de Técnica.
 *
 * Toda regra mora em `ficha-sessao.js` (`situacaoDaExpansao`, `abreExpansao`,
 * `encerraExpansao`, as fases, o domo e a Exaustão): aqui só se desenha o estado
 * e se chama a função. O Confronto é manual assistido (DA-19): a tela rola o
 * Conflito e oferece Venceu e Perdeu, e quem compara é a mesa.
 * ============================================================
 */
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { DicaDeTexto } from "../ui/fontes";
import {
  situacaoDaExpansao, abreExpansao, encerraExpansao, defineFaseDaExpansao, defineDomo,
  ajustaRodadasDaExpansao, ajustaExaustaoTecnica, curaExaustaoTecnica, exaustaoTecnicaDe,
} from "./ficha-sessao";

const FASES = [
  { value: "ativa", label: "Ativa" },
  { value: "confronto", label: "Confronto" },
  { value: "estendido", label: "Estendido" },
  { value: "contestando", label: "Contestando" },
];
const rodadas = (n) => `${n} ${n === 1 ? "Rodada" : "Rodadas"}`;

function Passo({ rotulo, onMenos, onMais }) {
  return (
    <span className="flex items-center gap-1">
      <button type="button" className="afty-botao" aria-label={`${rotulo} a menos`} onClick={onMenos}>
        <Minus className="w-3 h-3" aria-hidden="true" />
      </button>
      <button type="button" className="afty-botao" aria-label={`${rotulo} a mais`} onClick={onMais}>
        <Plus className="w-3 h-3" aria-hidden="true" />
      </button>
    </span>
  );
}

/* O PV do domo, gravado só ao confirmar (Enter ou sair do campo). Gravar a cada
   tecla fecharia a Expansão no instante em que o campo ficasse vazio, porque
   domo a zero desmancha o domínio. O `key` no PV recria o campo quando o número
   muda por fora. */
function CampoDomo({ valor, onDefinir }) {
  const [texto, setTexto] = useState(String(valor));
  const confirma = () => {
    const n = Math.trunc(Number(texto));
    if (Number.isFinite(n) && texto.trim() !== "" && n !== valor) onDefinir(n);
    else setTexto(String(valor));
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      className="afty-campo w-16 px-1 text-right"
      aria-label="PV do domo"
      value={texto}
      onChange={(ev) => setTexto(ev.target.value)}
      onBlur={confirma}
      onKeyDown={(ev) => { if (ev.key === "Enter") ev.currentTarget.blur(); }}
    />
  );
}

/**
 * `d` é a linha pronta do derive (`derived.dominios.lista`), e `feiticaria` o
 * bônus da perícia, para a Abertura de 0,2 Segundos do Acerto Garantido não letal.
 */
export default function ControleExpansao({ d, sessao, onSessao, rolar, feiticaria = null }) {
  const s = situacaoDaExpansao(sessao, d);
  if (!s) return null;
  const aberta = s.aberta;
  const ag = d.acertoGarantidoResumo;

  if (!aberta) {
    return (
      <div className="afty-linha flex flex-wrap items-center gap-2 p-2 text-xs" data-afty-expansao="fechada">
        {!s.podeAbrir && s.motivo !== "Outra Expansão Aberta" && (
          <span className="afty-chip" data-afty-tom="aviso">{s.motivo}</span>
        )}
        <span className="flex-1" />
        <button
          type="button"
          className="afty-botao"
          data-afty-tom={s.podeAbrir ? "destaque" : undefined}
          disabled={!s.podeAbrir}
          onClick={() => onSessao((x) => abreExpansao(x, d))}
        >
          Abrir {s.custo} PE
        </button>
      </div>
    );
  }

  const fecha = (motivo) => onSessao((x) => encerraExpansao(x, motivo, d));
  const emDisputa = aberta.fase === "confronto" || aberta.fase === "estendido";
  return (
    <div className="afty-linha space-y-2 p-2 text-xs" data-afty-expansao={aberta.fase}>
      <div className="flex flex-wrap items-center gap-1.5">
        {FASES.map((f) => (
          <button
            key={f.value}
            type="button"
            className="afty-botao"
            data-afty-tom={aberta.fase === f.value ? "destaque" : undefined}
            aria-pressed={aberta.fase === f.value}
            onClick={() => onSessao((x) => defineFaseDaExpansao(x, f.value))}
          >
            {f.label}
          </button>
        ))}
        <span className="flex-1" />
        {aberta.rodadas != null && (
          <span className="afty-rotulo flex items-center gap-1">
            <span className="afty-valor">{rodadas(aberta.rodadas)}</span>
            <Passo
              rotulo="Uma rodada"
              onMenos={() => onSessao((x) => ajustaRodadasDaExpansao(x, -1))}
              onMais={() => onSessao((x) => ajustaRodadasDaExpansao(x, 1))}
            />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {aberta.pvDomo != null && (
          <span className="afty-rotulo flex items-center gap-1">
            {d.versao === "sem_barreiras" ? "Totem" : "Domo"}
            <CampoDomo key={aberta.pvDomo} valor={aberta.pvDomo} onDefinir={(v) => onSessao((x) => defineDomo(x, v))} />
            <span className="afty-valor">/ {aberta.pvDomoMax ?? aberta.pvDomo} PV</span>
          </span>
        )}
        {aberta.fase === "contestando" && d.contestacao && (
          <span className="afty-rotulo">
            Contestação <span className="afty-valor">{d.contestacao.area}</span>
            {" · "}Dano na Barreira <span className="afty-valor">{d.contestacao.danoPorRodada}</span> por Rodada
          </span>
        )}
        {aberta.fase === "ativa" && ag && (
          <span className="afty-chip" data-afty-tom="destaque">
            Acerto Garantido{ag.letal ? "" : " · Não Letal"}
          </span>
        )}
        {aberta.fase === "ativa" && ag?.abertura && feiticaria != null && (
          <button
            type="button"
            className="afty-botao"
            onClick={() => rolar?.({ tipo: "teste", rotulo: "Abertura de 0,2 Segundos · Feitiçaria", bonus: feiticaria })}
          >
            Abertura de 0,2 Segundos
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {emDisputa && (
          <button type="button" className="afty-botao" onClick={() => onSessao((x) => defineFaseDaExpansao(x, "ativa"))}>
            Venceu
          </button>
        )}
        {(emDisputa || aberta.fase === "contestando") && (
          <button type="button" className="afty-botao" onClick={() => fecha("perdeu")}>
            Perdeu
          </button>
        )}
        <DicaDeTexto
          titulo="Interrompida"
          texto="Golpe de Oportunidade derrubou a abertura. O PE fica gasto e não há Exaustão de Técnica."
        >
          <button type="button" className="afty-botao" onClick={() => fecha("interrompida")}>
            Interrompida
          </button>
        </DicaDeTexto>
        <span className="flex-1" />
        <button type="button" className="afty-botao" data-afty-tom="aviso" onClick={() => fecha("encerrada")}>
          Encerrar
        </button>
      </div>
    </div>
  );
}

/**
 * A EXAUSTÃO DE TÉCNICA corrente (DA-16), com o ajuste à mão e o Curar (a
 * Lendária de Energia Reversa). Some quando não há Exaustão.
 */
export function PainelExaustaoTecnica({ sessao, onSessao }) {
  const e = exaustaoTecnicaDe(sessao);
  if (!e) return null;
  return (
    <div className="afty-card flex flex-wrap items-center gap-2 p-2 text-xs" data-afty-exaustao-tecnica="sim">
      <span className="afty-chip" data-afty-tom="aviso">Técnica Inutilizável</span>
      <span className="afty-valor">{rodadas(e.restantes)}</span>
      {e.fonte && <span className="afty-rotulo">{e.fonte}</span>}
      <Passo
        rotulo="Uma rodada"
        onMenos={() => onSessao((x) => ajustaExaustaoTecnica(x, -1))}
        onMais={() => onSessao((x) => ajustaExaustaoTecnica(x, 1))}
      />
      <span className="flex-1" />
      <button type="button" className="afty-botao" onClick={() => onSessao((x) => curaExaustaoTecnica(x))}>
        Curar
      </button>
    </div>
  );
}
