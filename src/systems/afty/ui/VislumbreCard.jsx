/**
 * ============================================================
 * VISLUMBRE CELESTE — o card da aba Habilidades
 * ============================================================
 * A tela da Condição Corporal dos Seis Olhos. As contas moram em
 * `afty-vislumbre-celeste.js` e chegam prontas em `derived.vislumbre`: aqui só
 * se desenha.
 *
 * ⚠ ELE SÓ EXISTE COM O ADDON QUE O PEDE (`permite: ["vislumbreCeleste"]`), e o
 * portão está no `derived`, e não neste arquivo nem no ramo da aba. A aba
 * Habilidades ramifica o layout inteiro por origem, e uma Condição Corporal não
 * é de origem nenhuma: o card é montado UMA vez e os três ramos o consomem. É a
 * lição que o Estilo Marcial pagou em 2026-09-07, escrita em docs/afty-addons.md.
 *
 * ⚠ O INTERRUPTOR NÃO MORA AQUI. "Olhos Descobertos" é estado de combate, e
 * quem o liga é a bancada de Simulação (no criador) ou a aba Buffs (na Ficha
 * Final). Um segundo controle para o mesmo estado seria uma segunda verdade, e
 * este card mostra a que está no ar AGORA.
 *
 * ⚠ Regras de UI do autor valendo: nada de texto explicativo, só resultado e
 * AVISO. O texto do livro não é explicação: é o conteúdo que a pessoa possui, e
 * ele fica dobrado, como nos outros cards.
 * ============================================================
 */

import { useState } from "react";
import { AlertTriangle, ChevronDown, Eye, EyeOff } from "lucide-react";

import { Card } from "./primitivos";
import { VISLUMBRE_TEXTOS, FADIGA_MAXIMA } from "../afty-vislumbre-celeste";

const CABECALHO = "text-[10px] uppercase tracking-wider text-slate-500";

/* Um número do card. Mesmo ladrilho da Carteira e da bancada de armas. */
function Ladrilho({ rotulo, valor, dica, tom = "normal" }) {
  return (
    <div title={dica} className="bg-slate-950/50 border border-slate-800 rounded-lg px-2.5 py-1.5">
      <div className={`${CABECALHO} truncate`}>{rotulo}</div>
      <div className={`font-mono font-bold text-sm tabular-nums ${
        tom === "ruim" ? "text-rose-300" : tom === "forte" ? "text-purple-300" : "text-white"
      }`}
      >
        {valor}
      </div>
    </div>
  );
}

/* Um bloco de texto do livro, com o nome do benefício em cima. */
function Beneficio({ nome, texto }) {
  return (
    <p className="text-[11px] leading-relaxed text-slate-300">
      <span className="font-semibold text-purple-200">{nome}. </span>
      {texto}
    </p>
  );
}

/* Metros com vírgula, que é como o resto do app escreve distância. */
const metros = (n) => `${String(n).replace(".", ",")}m`;

export default function VislumbreCard({ vislumbre }) {
  const [aberto, setAberto] = useState(false);
  const v = vislumbre;
  const descoberto = v.descoberto;
  const textos = descoberto ? VISLUMBRE_TEXTOS.descoberto : VISLUMBRE_TEXTOS.coberto;

  return (
    <Card
      title="Vislumbre Celeste"
      headerRight={
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
            descoberto
              ? "bg-purple-700 border-purple-600 text-white"
              : "border-slate-700 text-slate-300"
          }`}
          title={descoberto
            ? "Os olhos estão descobertos na bancada de combate"
            : "Os olhos estão cobertos. Descobrir é uma Ação Livre, na bancada de combate"}
        >
          {descoberto ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {v.bloco.rotulo}
        </span>
      }
    >
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5">
          <Ladrilho
            rotulo="Nível de CL"
            valor={v.cl}
            dica="Nível de Aptidão em Controle e Leitura, de onde tudo escala"
            tom={v.cl > 0 ? "forte" : "normal"}
          />
          <Ladrilho
            rotulo="Custo em PE"
            valor={v.reducaoPe > 0 ? `-${v.reducaoPe}` : "0"}
            dica={`${v.bloco.processamento}: todo gasto em PE, com o piso de 1 PE`}
          />
          <Ladrilho
            rotulo="Visão às Cegas"
            valor={metros(v.visao)}
            dica={`${v.bloco.visaoNome}: ${metros(v.bloco.visaoBase)} mais ${metros(v.bloco.visaoPorNivel)} por nível de CL`}
          />
          <Ladrilho
            rotulo="Perícias"
            valor={v.pericia > 0 ? `+${v.pericia}` : "0"}
            dica="Percepção e Feitiçaria"
          />
          <Ladrilho
            rotulo="Fadiga"
            valor={`${v.fadiga} / ${FADIGA_MAXIMA}`}
            tom={v.fadigaCheia ? "ruim" : "normal"}
            dica="1 ponto no fim de cada turno com os olhos descobertos"
          />
          <Ladrilho
            rotulo="Ler Técnica"
            valor={`CD ${v.cdLerTecnica}`}
            dica="Teste de Feitiçaria ou Percepção, com a CD do grau da criatura"
          />
        </div>

        {v.fadigaCheia && (
          <p className="text-[11px] text-amber-400 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
            Fadiga cheia, e ela vira 1 Nível de Exaustão
          </p>
        )}

        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
          {textos.map(([nome, texto]) => (
            <Beneficio key={nome} nome={nome} texto={texto} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-expanded={aberto}
          className="flex items-center gap-1.5 text-left group"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`}
            aria-hidden="true"
          />
          <span className={`${CABECALHO} group-hover:text-slate-300`}>
            {descoberto ? "Cobertos, Sobrecarga e o Resto" : "Descobertos, Sobrecarga e o Resto"}
          </span>
        </button>

        {aberto && (
          <div className="space-y-2.5">
            <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
              {(descoberto ? VISLUMBRE_TEXTOS.coberto : VISLUMBRE_TEXTOS.descoberto)
                .map(([nome, texto]) => <Beneficio key={nome} nome={nome} texto={texto} />)}
            </div>
            <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
              {VISLUMBRE_TEXTOS.sobrecarga.map(([nome, texto]) => (
                <Beneficio key={nome} nome={nome} texto={texto} />
              ))}
            </div>
            <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
              <p className="text-[11px] leading-relaxed text-slate-300">{VISLUMBRE_TEXTOS.compreensao}</p>
              <p className="text-[11px] leading-relaxed text-slate-300">{VISLUMBRE_TEXTOS.lerTecnica}</p>
              <p className="text-[11px] leading-relaxed text-slate-300">{VISLUMBRE_TEXTOS.impossivel}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
