import React, { useState } from "react";
import { catalogoImitacao, trocarCopiaImitacao, cdAprenderImitacao, tentarAprenderImitacao, idsPossuidosNaImitacao } from "../afty-imitacao";
import SubAbas from "./SubAbas";
import FiltroDeHabilidades from "../ui/FiltroDeHabilidades";
import { filtraHabilidades } from "../afty-filtro-habilidades";
import { abasDeOpcoes } from "../afty-habilidades";

const ROTULOS = { postura: "Posturas", manobra: "Manobras", ativa: "Habilidades ativas", passiva: "Habilidades passivas", estilo: "Estilos" };

export default function PainelDeImitacao({ derived, sessao, onPatchCombate, controleCombate }) {
  const [tipo, setTipo] = useState("postura");
  const [busca, setBusca] = useState("");
  const [efeitoFiltro, setEfeitoFiltro] = useState("todos");
  const [elegivel, setElegivel] = useState(false);
  const [resultado, setResultado] = useState("");
  const [especializacao, setEspecializacao] = useState(null);
  const [nivel, setNivel] = useState(null);
  const estado = { ...sessao.combate?.imitacao, aprendidas: derived.imitacao?.aprendidas ?? [] };
  const tipos = derived.imitacao?.perfeita
    ? ["postura", "manobra", "ativa", "passiva", "estilo"] : ["postura", "manobra", "ativa"];
  const atual = tipos.includes(tipo) ? tipo : "postura";
  const possuidas = idsPossuidosNaImitacao(derived, estado.aprendidas ?? []);
  const disponiveis = (t) => catalogoImitacao(t).filter((h) => !possuidas.has(h.id));
  const filtradas = filtraHabilidades(disponiveis(atual), efeitoFiltro, busca);
  const comNiveis = ["ativa", "passiva"].includes(atual);
  const especializacoes = comNiveis ? abasDeOpcoes(filtradas.map((h) => ({ ...h, nivelMin: h.nivel })), "especializacao") : [];
  const especializacaoAtiva = especializacoes.find((e) => e.id === especializacao) ?? especializacoes[0];
  const niveis = especializacaoAtiva ? abasDeOpcoes(especializacaoAtiva.opcoes, "nivel") : [];
  const nivelAtivo = niveis.find((n) => n.id === nivel) ?? niveis[0];
  const lista = comNiveis ? (nivelAtivo?.opcoes ?? []) : filtradas;
  if (!derived.imitacao?.disponivel) return null;
  const copiar = (copia) => {
    onPatchCombate(trocarCopiaImitacao(sessao.combate, copia));
    setResultado("");
  };
  const trocarTipo = (proximo) => {
    setTipo(proximo);
    setBusca("");
    setElegivel(false);
    setEspecializacao(null);
    setNivel(null);
  };
  const aprender = () => {
    if (resultado.trim() === "") return;
    onPatchCombate({ imitacao: tentarAprenderImitacao(estado, Number(resultado), derived.imitacao) });
    setResultado("");
  };
  const escolherOpcao = (id) => {
    const antes = derived.imitacao.copia?.escolhas ?? [];
    const limite = derived.habilidades?.escolhas?.porHab?.[estado.copia?.id]?.allowance ?? 1;
    if (!antes.includes(id) && antes.length >= limite) return;
    const escolhas = antes.includes(id) ? antes.filter((o) => o !== id) : [...antes, id];
    onPatchCombate({ imitacao: { ...estado, copia: { ...estado.copia, escolhas },
      aprendidas: estado.aprendidas.map((c) => c.id === estado.copia.id ? { ...c, escolhas } : c) } });
  };
  return (
    <section className="afty-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="afty-card-titulo flex-1">{derived.imitacao.perfeita ? "Imitação Perfeita" : "Imitação"}</h2>
        {controleCombate}
      </div>
      {derived.imitacao.copia && <div className="afty-linha flex items-center gap-2 p-2">
        <span className="flex-1">{derived.imitacao.copia.nome}</span>
        <button type="button" className="afty-botao" onClick={() => copiar(null)}>Encerrar cópia</button>
      </div>}
      {derived.imitacao.copia && <div className="flex flex-wrap items-center gap-2">
        <span className="afty-chip">CD {cdAprenderImitacao(estado, estado.copia)}</span>
        <input className="afty-campo afty-linha p-2 w-28" type="number" aria-label="Resultado de Percepção" placeholder="Percepção" value={resultado} onChange={(e) => setResultado(e.target.value)} />
        <button type="button" className="afty-botao" onClick={aprender}>Tentar aprender</button>
        {estado.aviso && <span role="status" className="afty-chip">{estado.aviso}</span>}
      </div>}
      {derived.imitacao.copia && derived.imitacao.def?.escolha && <div className="flex flex-wrap gap-2">
        {derived.imitacao.def.escolha.opcoes.map((o) => <button type="button" className="afty-botao" key={o.id}
          aria-pressed={(derived.imitacao.copia?.escolhas ?? []).includes(o.id)} onClick={() => escolherOpcao(o.id)}>{o.nome}</button>)}
      </div>}
      {!!estado.aprendidas?.length && <h3 className="afty-card-titulo">Aprendidas ({estado.aprendidas.length})</h3>}
      {(estado.aprendidas ?? []).map((c) => <div key={c.id} className="flex items-center gap-2">
        <button type="button" className="afty-botao flex-1 text-left" disabled={!derived.combate?.ativo || !tipos.includes(c.tipo)}
          aria-pressed={derived.imitacao.copia?.id === c.id}
          data-afty-tom={derived.imitacao.copia?.id === c.id ? "destaque" : undefined}
          title={catalogoImitacao(c.tipo).find((h) => h.id === c.id)?.descricao}
          onClick={() => copiar({ ...c, aprendida: true })}>
          {catalogoImitacao(c.tipo).find((h) => h.id === c.id)?.nome ?? "Cópia indisponível"}
        </button>
        <button type="button" className="afty-botao" aria-label="Esquecer cópia" onClick={() => onPatchCombate({ imitacao: { ...estado, aprendidas: estado.aprendidas.filter((h) => h.id !== c.id) } })}>Esquecer</button>
      </div>)}
      <SubAbas rotulo="Tipos de cópia" ativa={atual} onAtiva={trocarTipo}
        subs={tipos.map((t) => ({ id: t, label: ROTULOS[t], quantos: filtraHabilidades(disponiveis(t), efeitoFiltro, busca).length }))} />
      <FiltroDeHabilidades rotulo="Buscar cópia" efeito={efeitoFiltro} onEfeito={setEfeitoFiltro}
        termo={busca} onTermo={setBusca} visiveis={lista.length} total={disponiveis(atual).length} />
      {comNiveis && especializacoes.length > 0 && <>
        <SubAbas rotulo="Especializações de cópia" ativa={especializacaoAtiva.id}
          onAtiva={(id) => { setEspecializacao(id); setNivel(null); }}
          subs={especializacoes.map((e) => ({ id: e.id, label: e.label, quantos: e.opcoes.length }))} />
        <SubAbas rotulo="Níveis de cópia" ativa={nivelAtivo?.id} onAtiva={setNivel}
          subs={niveis.map((n) => ({ id: n.id, label: n.label, quantos: n.opcoes.length }))} />
      </>}
      {["ativa", "passiva"].includes(atual) && <label className="flex items-center gap-2">
        <input type="checkbox" checked={elegivel} onChange={(e) => setElegivel(e.target.checked)} />
        Habilidade do tipo selecionado, sem gasto de PE
      </label>}
      <div className="max-h-64 overflow-y-auto space-y-1" role="region" aria-label="Opções de cópia">
        {lista.length === 0 && <p className="afty-vazio px-1 py-2">Nada com esse filtro</p>}
        {lista.map((h) => <button key={h.id} type="button" className="afty-linha w-full text-left p-2 disabled:opacity-40"
          disabled={!derived.combate?.ativo || (["ativa", "passiva"].includes(atual) && !elegivel)} onClick={() => copiar({ tipo: atual, id: h.id })} title={h.descricao}>
          {h.nome}
        </button>)}
      </div>
    </section>
  );
}
