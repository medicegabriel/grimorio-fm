import { AlertTriangle } from "lucide-react";
import { danoDaAmpla } from "../afty-propriedades-armas";

export function ControleDeEnergica({ linha, onGolpe, criador = false, modoDano = "normal" }) {
  const info = linha.armaPropriedades;
  if (!info || !linha.propriedades?.some((p) => p.id === "energica")) return null;
  const bonus = modoDano === "normal" ? info.energica : info.energicaCritico;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]" data-afty-energica={linha.chaveArma}>
      <span className={criador ? "font-semibold text-purple-300" : "afty-rotulo font-semibold"}>Enérgica</span>
      <label className={criador ? "flex items-center gap-1.5 text-slate-300" : "afty-rotulo flex items-center gap-1.5"}>
        Golpe no turno
        <input type="number" min="1" step="1"
          className={criador ? "w-16 rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-slate-100" : "afty-campo w-16 px-1.5 py-1 rounded border"}
          aria-label={"Golpe no turno de " + linha.nome}
          title="1: primeiro golpe. 2: segundo golpe. 3: terceiro golpe. Inclui golpes que erraram."
          value={info.numero}
          onChange={(e) => {
            const golpe = Number(e.target.value);
            onGolpe?.(linha, Number.isFinite(golpe) ? Math.max(1, Math.trunc(golpe)) : 1);
          }} />
      </label>
      <span className={criador ? "rounded border border-purple-800 bg-purple-950/40 px-2 py-1 text-purple-200" : "afty-chip"}
        title="Conta todos os dados de Durante Ataque que serão rolados, já dobrados no crítico. O bônus soma uma vez como dano fixo, sem multiplicação pelo Raio Negro.">
        Enérgica +{bonus} de dano
      </span>
    </div>
  );
}

export default function ControlesDeArma({ linha, onArma, onAmpla, rodada, modoDano = "normal" }) {
  const info = linha.armaPropriedades;
  if (!info) return null;
  const tem = (id) => linha.propriedades?.some((p) => p.id === id);
  const estado = info.estado;
  const relevantes = ["energica", "aparar", "apunhaladora", "oscilante", "ampla", "recarga", "emperrar", "pesada", "estabilidade", "modular"];
  if (!relevantes.some(tem) && !linha.avisosPropriedades?.length) return null;
  const altera = (campo, valor) => onArma?.(linha, campo, valor);
  const danoAmpla = danoDaAmpla(linha, rodada);
  const numero = (campo, titulo, max = undefined) => (
    <label className="afty-rotulo text-[11px] flex items-center gap-1.5">
      {titulo}
      <input type="number" min="0" max={max} step="1" className="afty-campo w-16 px-1 py-0.5"
        aria-label={titulo + " de " + linha.nome} value={estado[campo] ?? ""}
        onChange={(e) => altera(campo, e.target.value)} />
    </label>
  );
  return (
    <>
      <ControleDeEnergica linha={linha} modoDano={modoDano} onGolpe={(arma, golpe) => onArma?.(arma, "ataques", golpe - 1)} />
      {(relevantes.some((id) => id !== "energica" && tem(id)) || linha.avisosPropriedades?.length > 0) && (
        <details className="mt-2 text-[11px]" data-afty-propriedades-arma={linha.chaveArma}>
          <summary className="afty-rotulo cursor-pointer">Propriedades em combate</summary>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {linha.avisosPropriedades?.map((aviso) => (
              <span key={aviso} className="afty-chip flex items-center gap-1" data-afty-tom="custo">
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />{aviso}
              </span>
            ))}
            {info.desvantagem && <span className="afty-chip" data-afty-tom="custo" title={info.requisitos.join("; ")}>
              Desvantagem por {tem("pesada") && info.requisitos.some((r) => r.startsWith("Força")) ? "Pesada" : "Estabilidade"}
            </span>}
            {info.bloqueio && <span className="afty-chip" data-afty-tom="custo">{info.bloqueio}</span>}
            {tem("aparar") && <button type="button" className="afty-botao text-[11px]"
              disabled={!linha.treinada} aria-pressed={estado.aparando}
              data-afty-tom={estado.aparando ? "destaque" : undefined}
              title={linha.treinada ? "Ação de movimento. Dura até o início do seu próximo turno." : "Requer treino com a arma."}
              onClick={() => altera("aparando", !estado.aparando)}>
              Aparar (+{linha.propriedades.find((p) => p.id === "aparar")?.bonusDefesa ?? 2} Defesa)
            </button>}
            {tem("apunhaladora") && <button type="button" className="afty-botao text-[11px]"
              aria-pressed={estado.desprevenido} data-afty-tom={estado.desprevenido ? "destaque" : undefined}
              onClick={() => altera("desprevenido", !estado.desprevenido)}>Alvo desprevenido</button>}
            {tem("modular") && info.tipos.length > 1 && <label className="afty-rotulo flex items-center gap-1.5">
              Tipo de dano
              <select className="afty-campo px-1 py-0.5" aria-label={"Tipo de dano de " + linha.nome}
                value={linha.tipoDano ?? ""} onChange={(e) => altera("tipoDano", e.target.value)}>
                {info.tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>}
            {(tem("oscilante") || tem("ampla")) && numero("defesaAlvo", "Defesa do alvo")}
            {tem("oscilante") && estado.pendente && <>
              <button type="button" className="afty-botao text-[11px]" aria-pressed={estado.pendente.errou}
                data-afty-tom={estado.pendente.errou ? "destaque" : undefined}
                onClick={() => altera("errou", true)}>Errou</button>
              <button type="button" className="afty-botao text-[11px]" aria-pressed={!estado.pendente.errou}
                onClick={() => altera("errou", false)}>Acertou</button>
            </>}
            {info.oscilante > 0 && <span className="afty-chip">Oscilante +2 no próximo acerto</span>}
            {tem("recarga") && <>
              {numero("gastos", "Munições usadas", info.capacidade)}
              <span className="afty-rotulo">de {info.capacidade}</span>
              <button type="button" className="afty-botao text-[11px]" title="Ação bônus"
                onClick={() => altera("recarregar", true)}>Recarregar</button>
            </>}
            {tem("emperrar") && estado.emperrada && <button type="button" className="afty-botao text-[11px]"
              title="Ação comum" onClick={() => altera("desemperrar", true)}>Desemperrar</button>}
            {tem("ampla") && estado.ultimo && <>
              <button type="button" className="afty-botao text-[11px]" aria-pressed={estado.adjacente}
                data-afty-tom={estado.adjacente ? "destaque" : undefined}
                onClick={() => altera("adjacente", !estado.adjacente)}>Segundo alvo adjacente</button>
              {numero("defesaAmpla", "Defesa do segundo alvo")}
              <button type="button" className="afty-botao text-[11px]" disabled={danoAmpla == null}
                title="Uma vez por rodada. A Defesa deve ser menor que o resultado do acerto."
                onClick={() => onAmpla?.(linha)}>
                Ampla{danoAmpla == null ? "" : ": " + danoAmpla + " de dano"}
              </button>
            </>}
          </div>
        </details>
      )}
    </>
  );
}
