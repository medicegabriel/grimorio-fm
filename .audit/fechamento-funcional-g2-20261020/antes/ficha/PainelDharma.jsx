import { useState } from "react";
import { Plus, RotateCw, Check, AlertTriangle } from "lucide-react";
import { TIPOS_DANO } from "../afty-equipamentos";
import {
  TIPOS_DHARMA, normalizaDharma, adicionarDharma, configurarDharma, anotarDharma,
  girarDharma, registrarDanoDharma, encerrarTurnoDharma, girosNestaRodada,
  limiteCuraDharma, resultadosDharma, danoAdaptavel,
} from "../afty-dharma";

const campo = "afty-campo bg-transparent px-2 py-1.5 text-sm rounded min-w-0";

function Entrada({ entrada: e, estado, sessao, derived, onSessao }) {
  const [dano, setDano] = useState("");
  const usados = girosNestaRodada(e, sessao.rodada);
  const aguardando = e.tipo === "existencia" && estado.existencia !== e.id;
  const registrar = () => {
    onSessao((s) => registrarDanoDharma(s, derived, e.id, dano));
    setDano("");
  };
  return (
    <article className="afty-card p-4 space-y-3" aria-label={`${TIPOS_DHARMA[e.tipo]}: ${e.nome}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="afty-rotulo text-xs">{TIPOS_DHARMA[e.tipo]}</div>
          <h3 className="font-semibold text-lg break-words">{e.nome}</h3>
          {e.tipo === "defesa" && <span className="afty-chip">{TIPOS_DANO[e.tipoDano]}</span>}
        </div>
        <span className="afty-valor text-2xl" aria-label={`${e.giros} de 6 giros`}>{e.giros}<span className="afty-rotulo text-sm"> / 6</span></span>
      </div>
      <div className="flex gap-2" aria-label="Progresso dos giros">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="flex-1 rounded-md border py-2 text-center text-sm font-semibold"
            style={{ borderColor: "var(--afty-borda)", background: i < e.giros ? "var(--afty-acento, #8b5cf6)" : "transparent" }}
            title={`Giro ${i + 1}${[1, 3, 5].includes(i) ? ": marco" : ""}`}>
            {i < e.giros ? <Check className="w-4 h-4 mx-auto" aria-hidden="true" /> : i + 1}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="afty-chip">Rodada: {usados}/2</span>
        <button type="button" className="afty-botao flex items-center gap-1"
          disabled={e.giros === 6 || usados === 2 || aguardando}
          onClick={() => onSessao((s) => girarDharma(s, derived, e.id))}>
          <RotateCw className="w-4 h-4" aria-hidden="true" /> Girar
        </button>
        {e.giros === 6 && <span className="afty-chip">Adaptação completa</span>}
        {usados === 2 && e.giros < 6 && <span className="afty-rotulo text-xs">Limite da rodada</span>}
        {aguardando && <button type="button" className="afty-botao"
          onClick={() => onSessao((s) => configurarDharma(s, derived, { existencia: e.id }))}>Adaptar este alvo</button>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {resultadosDharma(e, derived).map((texto) => <span key={texto} className="afty-chip">{texto}</span>)}
      </div>
      {e.tipo === "geral" && (
        <div className="flex items-end gap-3 flex-wrap">
          <label className="flex flex-col gap-1 text-xs afty-rotulo">Dano acumulado
            <input type="number" min="0" disabled={e.giros === 6} value={e.dano}
              aria-label={`Dano acumulado de ${e.nome}`} className={`${campo} w-28`}
              title="Dano efetivamente recebido desta fonte antes do sexto giro. Não altera a barra de PV"
              onChange={(ev) => onSessao((s) => anotarDharma(s, derived, e.id, { dano: ev.target.value }))} />
          </label>
          <span className="afty-chip" title={`Limite: ND ${derived.nd} × Mod. Constituição ${derived.mods?.constituicao ?? 0}`}>
            {e.giros === 6 ? `Cura aplicada: ${e.curaGeral}` : `Cura no giro 6: ${Math.min(e.dano, limiteCuraDharma(derived))}`} PV
          </span>
        </div>
      )}
      {["geral", "defesa"].includes(e.tipo) && (
        <div className="flex gap-2 flex-wrap items-end">
          <label className="flex flex-col gap-1 text-xs afty-rotulo">Dano recebido
            <input type="number" min="0" value={dano} onChange={(ev) => setDano(ev.target.value)}
              className={`${campo} w-28`} aria-label={`Registrar dano de ${e.nome}`} />
          </label>
          <button type="button" className="afty-botao" onClick={registrar}
            disabled={(e.tipo === "geral" && e.giros === 6) || (!(Number(dano) > 0) && !(e.tipo === "defesa" && e.giros === 6))}
            title="Registra dano já descontado nos PV. No sexto giro de Defesa, registra a exposição e aplica a cura">
            {e.tipo === "defesa" && e.giros === 6 ? "Receber exposição" : "Registrar dano"}
          </button>
          {e.curaPendente && <span className="afty-chip">Cura pendente: {2 * derived.maestria} PV</span>}
        </div>
      )}
      {e.tipo === "existencia" && !aguardando && e.giros < 6 && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={e.confronto}
            onChange={(ev) => onSessao((s) => anotarDharma(s, derived, e.id, { confronto: ev.target.checked }))} />
          Em confronto <span className="afty-chip">{e.rodadasConfronto}/6 rodadas</span>
        </label>
      )}
      <textarea rows={2} value={e.notas} placeholder="Anotações" aria-label={`Anotações de ${e.nome}`}
        title="Fenômeno, condições, proteções destruídas e Características ou Talentos anulados"
        className={`${campo} w-full resize-y`}
        onChange={(ev) => onSessao((s) => anotarDharma(s, derived, e.id, { notas: ev.target.value }))} />
    </article>
  );
}

export default function PainelDharma({ derived, sessao, onSessao }) {
  const [adicionando, setAdicionando] = useState(false);
  const [tipo, setTipo] = useState("geral");
  const [nome, setNome] = useState("");
  const [tipoDano, setTipoDano] = useState("queimante");
  const [aviso, setAviso] = useState("");
  const [encerrando, setEncerrando] = useState(false);
  if (!derived?.dharma?.ativo) return null;
  const estado = normalizaDharma(sessao.dharma);
  const alvos = [...new Set(estado.entradas.filter((e) => ["ataque", "existencia"].includes(e.tipo)).map((e) => e.nome))];
  const adicionar = (ev) => {
    ev.preventDefault();
    const proxima = adicionarDharma(sessao, derived, { tipo, nome, tipoDano });
    if (proxima === sessao) { setAviso("Adaptação já cadastrada ou nome inválido"); return; }
    onSessao((s) => adicionarDharma(s, derived, { tipo, nome, tipoDano }));
    setNome(""); setAviso(""); setAdicionando(false);
  };
  return (
    <section className="space-y-4">
      <div className="afty-card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="afty-card-titulo flex-1">Grande Roda do Dharma</h2>
          <span className="afty-chip">{estado.entradas.length} {estado.entradas.length === 1 ? "adaptação" : "adaptações"}</span>
          <button type="button" className="afty-botao flex items-center gap-1" onClick={() => setAdicionando(!adicionando)}>
            <Plus className="w-4 h-4" aria-hidden="true" /> Nova adaptação
          </button>
          <button type="button" className="afty-botao" disabled={!estado.entradas.some((e) => e.curaPendente)}
            onClick={() => onSessao((s) => encerrarTurnoDharma(s, derived))}>Encerrar turno</button>
          <button type="button" className="afty-botao" disabled={!estado.entradas.length} onClick={() => setEncerrando(true)}>Encerrar cena</button>
        </div>
        {encerrando && <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm">Encerrar todas as adaptações?</span>
          <button type="button" className="afty-botao" onClick={() => { onSessao((s) => ({ ...s, dharma: normalizaDharma() })); setEncerrando(false); }}>Encerrar</button>
          <button type="button" className="afty-botao" onClick={() => setEncerrando(false)}>Cancelar</button>
        </div>}
        <div className="flex gap-3 flex-wrap">
          <label className="flex flex-col gap-1 text-xs afty-rotulo">Alvo dos ataques
            <select className={campo} value={estado.alvo} title="Os bônus de Ataque e Existência valem somente contra o alvo selecionado"
              onChange={(ev) => onSessao((s) => configurarDharma(s, derived, { alvo: ev.target.value }))}>
              <option value="">Nenhum</option>{alvos.map((alvo) => <option key={alvo}>{alvo}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs afty-rotulo">Fenômeno recebido agora
            <select className={campo} value={estado.fenomeno} title="Aplica a RD e a imunidade de Geral somente enquanto estiver resolvendo este fenômeno"
              onChange={(ev) => onSessao((s) => configurarDharma(s, derived, { fenomeno: ev.target.value }))}>
              <option value="">Nenhum</option>{estado.entradas.filter((e) => e.tipo === "geral").map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </label>
        </div>
        {(estado.alvo || estado.fenomeno) && <div className="flex flex-wrap gap-2">
          {estado.alvo && <span className="afty-chip">Ataques contra {estado.alvo}</span>}
          {estado.fenomeno && <span className="afty-chip">Recebendo {estado.entradas.find((e) => e.id === estado.fenomeno)?.nome}</span>}
        </div>}
        {adicionando && <form onSubmit={adicionar} className="flex items-end gap-2 flex-wrap pt-2">
          <label className="flex flex-col gap-1 text-xs afty-rotulo">Adaptação
            <select className={campo} value={tipo} onChange={(ev) => setTipo(ev.target.value)}>
              {Object.entries(TIPOS_DHARMA).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs afty-rotulo flex-1 min-w-40">{["ataque", "existencia"].includes(tipo) ? "Alvo" : "Fenômeno"}
            <input className={campo} required value={nome} onChange={(ev) => setNome(ev.target.value)} list="dharma-alvos" />
            <datalist id="dharma-alvos">{alvos.map((alvo) => <option key={alvo} value={alvo} />)}</datalist>
          </label>
          {tipo === "defesa" && <label className="flex flex-col gap-1 text-xs afty-rotulo">Tipo de dano
            <select className={campo} value={tipoDano} onChange={(ev) => setTipoDano(ev.target.value)}>
              {Object.entries(TIPOS_DANO).filter(([id]) => danoAdaptavel(id)).map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
            </select>
          </label>}
          <button type="submit" className="afty-botao">Adicionar</button>
          {aviso && <span className="flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4" />{aviso}</span>}
        </form>}
      </div>
      {!estado.entradas.length && <div className="afty-card p-6 afty-rotulo text-center">Nenhuma adaptação em curso</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {estado.entradas.map((e) => <Entrada key={e.id} entrada={e} estado={estado} sessao={sessao} derived={derived} onSessao={onSessao} />)}
      </div>
    </section>
  );
}
