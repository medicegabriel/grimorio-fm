import { AlertTriangle } from "lucide-react";
import { CLASSES_SERVOS, ATRIBUTOS_SERVOS, configuracaoServo } from "../afty-servos";
import { novoEfeitoDominio } from "../afty-dominios";
import { EfeitoDominioLinha } from "../AftyDominioEditor";

const nomes = ["Força", "Destreza", "Constituição", "Inteligência", "Sabedoria", "Carisma"];
const campo = "bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm";
export default function ServosEditor({ draft, derived, onFicha, renderMotor }) {
  const s = configuracaoServo(draft);
  if (!s) return null;
  const config = draft.servosGuerra ?? {};
  const patch = (v) => onFicha((f) => ({ ...f, servosGuerra: { ...f.servosGuerra, ...v } }));
  const d = config.dominio ?? {};
  const dominio = derived.dominioInato;
  const patchDominio = (v) => patch({ dominio: { ...d, ...v } });
  const efeitos = d.efeitos ?? [];
  const restricoes = d.restricoes ?? [];
  const linha = (e, onPatch, onRemove) => <EfeitoDominioLinha efeito={e} dom={dominio?.nivel ?? 0}
    versao="completa" vagasLivres={Math.max(0, (dominio?.vagas ?? 0) - (dominio?.usadas ?? 0))}
    tiposDano={dominio?.tiposDano ?? []} condicoesCatalogo={dominio?.condicoesCatalogo ?? {}}
    renderMotor={renderMotor} onPatch={onPatch} onRemove={onRemove} />;
  return <div className="space-y-3 p-2">
    <label className="flex gap-2 items-center">Classe do Servo
      <select className={campo} value={s.classe ?? ""} onChange={(e) => patch({ classe: e.target.value })}>
        <option value="">Escolher</option>{CLASSES_SERVOS.map((c) => <option key={c}>{c}</option>)}
      </select>
    </label>
    {!s.classe && <div className="text-amber-400 flex gap-2"><AlertTriangle size={14} />Escolha a Classe do Servo</div>}
    {s.classe === "Saber" && <div className="space-y-2">
      <div>Pontos de Atributo: {s.usados} / {s.pontos}</div>
      {ATRIBUTOS_SERVOS.map((a, i) => <label key={a} className="flex gap-2 items-center">{nomes[i]}
        <input aria-label={`Saber: ${nomes[i]}`} className={`${campo} w-20`} type="number" min="0" max={s.pontos - s.usados + s.atributos[a]}
          value={s.atributos[a]} onChange={(e) => patch({ atributos: { ...s.atributos, [a]: Math.max(0, Math.min(s.pontos - s.usados + s.atributos[a], Math.floor(Number(e.target.value) || 0))) } })} />
      </label>)}
    </div>}
    {dominio && <div className="space-y-3">
      <label className="flex gap-2 items-center">Domínio Inato
        <input className={campo} aria-label="Nome do Domínio Inato" value={d.nome ?? ""} onChange={(e) => patchDominio({ nome: e.target.value })} />
      </label>
      <label className="flex gap-2 items-center">Local Fixo<input className={campo} value={d.local ?? ""} onChange={(e) => patchDominio({ local: e.target.value })} /></label>
      <div>Efeitos: {dominio.usadas} / {dominio.vagas}</div>
      {efeitos.map((e, i) => <div key={e.id ?? i}>{linha(e,
        (v) => patchDominio({ efeitos: efeitos.map((x, j) => i === j ? { ...x, ...v } : x) }),
        () => patchDominio({ efeitos: efeitos.filter((_, j) => i !== j) }))}</div>)}
      <button type="button" className={campo} onClick={() => patchDominio({ efeitos: [...efeitos, novoEfeitoDominio()] })}>Adicionar Efeito</button>
      <label className="flex gap-2 items-center">Aumentos de Tamanho
        <input className={`${campo} w-20`} type="number" min="0" value={d.aumentos ?? 0} onChange={(e) => patchDominio({ aumentos: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} />
      </label>
      {restricoes.map((r, i) => {
        const muda = (v) => patchDominio({ restricoes: restricoes.map((x, j) => i === j ? { ...x, ...v } : x) });
        return <div key={i} className="space-y-2 border border-slate-700 rounded p-2">
          <label className="block">Restrição
            <textarea className={`${campo} w-full`} value={r.descricao ?? ""} onChange={(e) => muda({ descricao: e.target.value })} />
          </label>
          <select aria-label="Benefício da Restrição" className={campo} value={r.tipo} onChange={(e) => muda({ tipo: e.target.value })}>
            <option value="efeito">Efeito de Domínio</option><option value="tamanho">Tamanho Máximo</option>
          </select>
          <label className="flex gap-2 items-center">Quantidade
            <input className={`${campo} w-20`} type="number" min="1" value={r.quantidade ?? 1} onChange={(e) => muda({ quantidade: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />
          </label>
          {r.tipo === "efeito" && linha(r.efeito ?? novoEfeitoDominio(), (v) => muda({ efeito: { ...r.efeito, ...v } }),
            () => patchDominio({ restricoes: restricoes.filter((_, j) => i !== j) }))}
          <button type="button" className={campo} onClick={() => patchDominio({ restricoes: restricoes.filter((_, j) => i !== j) })}>Remover Restrição</button>
        </div>;
      })}
      <button type="button" className={campo} onClick={() => patchDominio({ restricoes: [...restricoes,
        { descricao: "", tipo: "efeito", quantidade: 1, efeito: novoEfeitoDominio() }] })}>Adicionar Restrição</button>
      {dominio.validacao.map((v, i) => <div key={i} className="text-amber-400 flex gap-2"><AlertTriangle size={14} />{v.texto}</div>)}
    </div>}
  </div>;
}
