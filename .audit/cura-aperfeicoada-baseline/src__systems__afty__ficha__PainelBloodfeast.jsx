import { useState } from "react";
import { HARDBLOOD_EFEITOS, normalizaBloodfeast, conjuraBloodfeast, sofreBleed,
  resolveCiclagem, fimCenaBloodfeast, recebeBleed } from "../afty-bloodfeast";
import { aplicaCura, gastaPe, registraRolagem } from "./ficha-sessao";
import { rolarDano, rolarTeste } from "./ficha-rolagem";

function Contador({ nome, valor, onChange, max = Infinity }) {
  return <label className="flex gap-2 items-center text-xs" title={nome}>
    {nome}<input aria-label={nome} className="w-20 bg-transparent border rounded p-1" type="number"
      min="0" max={Number.isFinite(max) ? max : undefined} value={valor}
      onChange={(e) => onChange(Math.min(max, Math.max(0, Math.trunc(Number(e.target.value) || 0))))} />
  </label>;
}

/** Configuração da conjuração integrada à linha nativa do Feitiço. */
export function ConjuracaoBloodfeast({ f, derived, sessao, onSessao }) {
  const [escolhas, setEscolhas] = useState({});
  const [reutilizar, setReutilizar] = useState(false);
  if (!derived.bloodfeast?.tem || f.tipo === "passivo") return null;
  const b = normalizaBloodfeast(sessao.bloodfeast);
  const total = Object.values(escolhas).reduce((n, x) => n + x, 0);
  return <div className="afty-linha p-2 space-y-2">
    <div className="flex flex-wrap gap-3">
      {HARDBLOOD_EFEITOS.map((e) => <Contador key={e.id} nome={e.nome} valor={escolhas[e.id] ?? 0}
        max={Math.min(b.hardblood, derived.bloodfeast.bt) - total + (escolhas[e.id] ?? 0)}
        onChange={(v) => setEscolhas({ ...escolhas, [e.id]: v })} />)}
    </div>
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span>Hardblood {total} / {Math.min(b.hardblood, derived.bloodfeast.bt)}</span>
      <span>Bloodfeast {Number(f.nivel === "max" ? 6 : f.nivel) * derived.bloodfeast.bt}</span>
      {derived.bloodfeast.ids.includes("ciclagem") && <label><input type="checkbox" checked={reutilizar}
        onChange={(e) => setReutilizar(e.target.checked)} /> Reutilizar Sangue</label>}
      <button type="button" className="afty-botao" disabled={f.custoPE == null || sessao.hpAtual <= 0
        || total > b.hardblood || total > derived.bloodfeast.bt}
        onClick={() => { onSessao((s) => conjuraBloodfeast(s, f, derived, escolhas, { reutilizar }).sessao); setEscolhas({}); }}>
        Conjurar
      </button>
    </div>
  </div>;
}

export default function PainelBloodfeast({ derived, sessao, onSessao, alvos = [], onAlvo = null }) {
  const [acoes, setAcoes] = useState(1);
  const [energia, setEnergia] = useState(1);
  const [alvoId, setAlvoId] = useState("");
  const [faixa, setFaixa] = useState(0);

  const b = normalizaBloodfeast(sessao.bloodfeast);
  const info = derived.bloodfeast;
  if (!info?.tem && !b.bleed) return null;
  const muda = (parcial) => onSessao((s) => ({ ...s, bloodfeast: { ...normalizaBloodfeast(s.bloodfeast), ...parcial } }));
  const cura = (nome, dados, faces, fixo = 0, resolverUltima = false) => onSessao((s) => {
    const estado = normalizaBloodfeast(s.bloodfeast);
    if (resolverUltima && (!estado.ultima || estado.ultima.curaResolvida)) return s;
    const r = rolarDano({ rotulo: nome, dados, faces, fixo, tom: "cura" });
    const proxima = aplicaCura(registraRolagem(s, r), r.total, derived.hp);
    return resolverUltima ? { ...proxima, bloodfeast: { ...normalizaBloodfeast(proxima.bloodfeast),
      ultima: { ...estado.ultima, curaResolvida: true } } } : proxima;
  });
  const testeCiclagem = () => onSessao((s) => {
    const ultima = normalizaBloodfeast(s.bloodfeast).ultima;
    if (!ultima || ultima.ciclagemResolvida) return s;
    const tr = derived.testes?.resistencias?.find((r) => r.id === "fortitude" || r.value === "fortitude");
    const r = rolarTeste({ rotulo: "Ciclagem Sanguínea", bonus: tr?.total ?? tr?.bonus ?? 0, cd: ultima.cdCiclagem });
    return resolveCiclagem(registraRolagem(s, r), r.sucesso);
  });
  return <section className="afty-card p-3 space-y-2" data-afty-painel="bloodfeast">
    <h2 className="afty-card-titulo">Bloodfeast</h2>
    <div className="flex flex-wrap gap-3">
      {info?.tem && <>
        <Contador nome="Bloodfeast" valor={b.cargas} onChange={(cargas) => muda({ cargas })} />
        <Contador nome="Hardblood" valor={b.hardblood} onChange={(hardblood) => muda({ hardblood })} />
        <Contador nome="Sanidade" valor={b.sanidade} onChange={(sanidade) => muda({ sanidade })} />
        <span className="text-xs">Sangue {b.sangue}</span>
        <span className="text-xs">Reações {info.ids.includes("reacoes") ? 2 : 1}</span>
      </>}
      <Contador nome="Bleed" valor={b.bleed} onChange={(bleed) => muda({ bleed })} />
      <Contador nome="Ações" valor={acoes} onChange={setAcoes} />
      <button type="button" className="afty-botao" onClick={() => onSessao((s) => sofreBleed(s, acoes))}>Aplicar Perda</button>
    </div>
    {info?.tem && <>
      <div className="flex flex-wrap gap-3 items-center text-xs">
        <label title={info.textos.descricao}><input type="checkbox" checked={b.agua}
          onChange={(e) => muda({ agua: e.target.checked })} /> Água Corrente ou Chuva</label>
        <span title="Você não pode ser curada por nenhuma fonte externa que não seja sua">Cura Externa Bloqueada</span>
        <button type="button" className="afty-botao" onClick={() => onSessao((s) => {
          const r = rolarTeste({ rotulo: "Portão da Morte", modo: "vantagem", bonus: info.modCon });
          return registraRolagem(s, r);
        })}>Portão da Morte</button>
        <button type="button" className="afty-botao" onClick={() => onSessao(fimCenaBloodfeast)}>Fim da Cena</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Contador nome="Energia" valor={energia} onChange={setEnergia} />
        <button type="button" className="afty-botao" onClick={() => onSessao((s) => gastaPe(s, energia))}>Gastar {energia * 3} PV</button>
        <button type="button" className="afty-botao" onClick={() => onSessao((s) => aplicaCura(s, energia * 3, derived.hp))}>Recuperar {energia * 3} PV</button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {info.passivas.map((p) => <span key={p.id} className="afty-chip" title={p.descricao}>{p.nome}</span>)}
      </div>
      {onAlvo && <div className="flex gap-2 flex-wrap">
        <select aria-label="Alvo de ataque" className="bg-slate-950" value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
          <option value="">Alvo</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button type="button" className="afty-botao" disabled={!alvoId}
          onClick={() => onAlvo(alvoId, (s) => recebeBleed(s, 1 + (info.ids.includes("mais_sangue") ? faixa : 0), info.limiteBleed))}>Marcar Ataque</button>
      </div>}
      {b.ultima && <div className="afty-linha p-2 space-y-2 text-xs">
        <div className="flex flex-wrap gap-3">
          <span>PV {b.ultima.pago}</span><span>CD {b.ultima.cd}</span>
          <span>Acerto +{b.ultima.escolhas.acerto}</span>
          <span>Alcance +{b.ultima.escolhas.alcance * 3} m</span>
          <span>Área +{b.ultima.escolhas.area * 1.5} m</span>
          <span>Auxiliar +{b.ultima.escolhas.auxiliar}</span>
          <span>Ataques {b.ultima.ataques}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {b.ultima.rolagens.map((r, i) => <button key={i} type="button" className="afty-botao"
            onClick={() => onSessao((s) => registraRolagem(s, rolarDano({ ...r, rotulo: r.rotulo }))) }>
            {r.dados}d{r.faces}
          </button>)}
          {info.ids.includes("ciclagem") && <button type="button" className="afty-botao"
            disabled={b.ultima.ciclagemResolvida} onClick={testeCiclagem}>Ciclagem CD {b.ultima.cdCiclagem}</button>}
          {info.ids.includes("hemofagia") && <button type="button" className="afty-botao"
            onClick={() => cura("Hemofagia", 7, 8)}>Causou Dano: 7d8 PV</button>}
          {b.ativos.mircalla && <button type="button" className="afty-botao"
            onClick={() => cura("Yearning Mircalla", Math.floor(b.ultima.nivel / 2), 10)}>Yearning Mircalla</button>}
        </div>
        {onAlvo && <div className="flex flex-wrap gap-2">
          <select aria-label="Alvo de Bleed" className="bg-slate-950" value={alvoId} onChange={(e) => setAlvoId(e.target.value)}>
            <option value="">Alvo</option>{alvos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
          <select aria-label="Sangramento do alvo" className="bg-slate-950" value={faixa} onChange={(e) => setFaixa(Number(e.target.value))}>
            {["Sem Sangramento", "Leve", "Médio", "Forte", "Extremo"].map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
          <button type="button" className="afty-botao" disabled={!alvoId} onClick={() => {
            const extra = info.ids.includes("mais_sangue") ? faixa : 0;
            onAlvo(alvoId, (s) => recebeBleed(s, b.ultima.nivel + extra, info.limiteBleed));

          }}>Aplicar Bleed</button>
        </div>}
      </div>}
      {Object.keys(b.ativos).length > 0 && <div className="flex gap-2 flex-wrap">
        {Object.entries(b.ativos).map(([id, e]) => <button key={id} type="button" className="afty-botao"
          onClick={() => muda({ ativos: Object.fromEntries(Object.entries(b.ativos).filter(([chave]) => chave !== id)) })}>
          Encerrar {id === "mircalla" ? "Yearning Mircalla" : id === "defesa" ? `RD ${e.valor}` : "Reação"}
        </button>)}
      </div>}

    </>}
  </section>;
}
