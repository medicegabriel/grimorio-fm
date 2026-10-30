import { useState } from "react";
import { AlertTriangle, RotateCcw, RotateCw } from "lucide-react";

import {
  escolherAdaptacaoMecanica, escolherAdaptacaoNarrativa, girarAdaptacao, resetarAdaptacao,
} from "../afty-adaptacao";

const sinal = (n) => (n > 0 ? `+${n}` : String(n));

function Mecanica({ mecanica }) {
  if (!mecanica) return null;
  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
      <span className="text-[12px] font-semibold">Adaptação Mecânica</span>
      <span className="afty-chip">{mecanica.modo === "passiva" ? "Passiva" : "Ativa"}</span>
      <span className="afty-chip">{mecanica.requisitoNome}</span>
      <span className="afty-valor text-[11px]">Acerto {sinal(mecanica.bonusAcerto)}</span>
      {mecanica.ignoraRD > 0 && (
        <span className="afty-valor text-[11px]">Ignora RD {mecanica.ignoraRD}</span>
      )}
      <span className="afty-rotulo text-[10px]">Feitiço {mecanica.nivelFeitico}</span>
      {mecanica.melhorias.map((nome) => <span key={nome} className="afty-chip">{nome}</span>)}
    </div>
  );
}

function Ciclo({ ciclo, derived, onSessao }) {
  const [texto, setTexto] = useState("");
  const estado = ciclo.estado;
  const ultimo = estado.ganhos.at(-1) ?? null;
  const faltam = ciclo.intervalo - (estado.giros % ciclo.intervalo);
  const narrativa = () => {
    onSessao((s) => escolherAdaptacaoNarrativa(s, ciclo.chave, texto));
    setTexto("");
  };

  return (
    <section className="afty-card p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="afty-card-titulo flex-1 min-w-0">{ciclo.nome}</h2>
        <span className="afty-chip">Giros {estado.giros}</span>
        <span className="afty-chip">Narrativas {estado.narrativas.length}</span>
        <span className="afty-chip">Próximo marco {faltam}</span>
        <button
          type="button"
          className="afty-botao flex items-center gap-1"
          disabled={estado.giros === 0}
          onClick={() => onSessao((s) => resetarAdaptacao(s, ciclo.chave))}
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Resetar
        </button>
        <button
          type="button"
          className="afty-botao flex items-center gap-1"
          onClick={() => onSessao((s) => girarAdaptacao(s, derived, ciclo.chave))}
        >
          <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          Girar
        </button>
      </div>

      {estado.pendentes > 0 && (
        <div className="afty-linha px-2.5 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="text-[12px] font-semibold flex-1">Adaptação Pendente</span>
            <span className="afty-chip">{estado.pendentes}</span>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            placeholder="Descrição"
            aria-label="Descrição da adaptação narrativa"
            className="w-full afty-campo bg-transparent outline-none px-2 py-1.5 text-[12px]"
          />
          <div className="flex items-center gap-2">
            <button type="button" className="afty-botao" onClick={narrativa}>Narrativa</button>
            <button
              type="button"
              className="afty-botao"
              onClick={() => onSessao((s) => escolherAdaptacaoMecanica(s, derived, ciclo.chave))}
            >
              Mecânica
            </button>
          </div>
        </div>
      )}

      {ultimo?.esgotado && (
        <div className="afty-linha px-2.5 py-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span className="text-[12px]">Nenhuma habilidade disponível</span>
        </div>
      )}
      {ultimo?.nome && (
        <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
          <span className="afty-rotulo text-[10px]">Giro {ultimo.giro}</span>
          <span className="text-[12px] font-semibold">{ultimo.nome}</span>
          {ultimo.requisito && <span className="afty-chip">Pré-requisito</span>}
        </div>
      )}

      <Mecanica mecanica={estado.mecanica} />

      {estado.narrativas.map((item, indice) => (
        <div key={item.id} className="afty-linha px-2.5 py-2">
          <span className="afty-rotulo text-[10px]">Narrativa {indice + 1}</span>
          {item.texto && <p className="text-[12px] whitespace-pre-wrap mt-1">{item.texto}</p>}
        </div>
      ))}
    </section>
  );
}

export default function PainelDeAdaptacao({ derived, onSessao }) {
  if (!derived?.primitivas?.includes("adaptacao") || !derived.adaptacoes?.length) return null;
  return derived.adaptacoes.map((ciclo) => (
    <Ciclo key={ciclo.chave} ciclo={ciclo} derived={derived} onSessao={onSessao} />
  ));
}
