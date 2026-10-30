/* ============================================================
   CONCEDIDO PELO MESTRE NO G2 (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O catálogo por família, a busca, a concessão e a remoção da Apresentação Anterior, no fluxo do catálogo (Adicionar > Fonte Externa > Concedido pelo
   Mestre). A tela só existe para quem tem a primitiva `concessao` de Addon ou já tem uma concessão na sessão (a linha morta de um addon que saiu
   continua à vista, com o aviso, e sai pelo X).

   ⚠ CONCEDER NÃO É ATIVAR. A concessão é uma entrada de catálogo em `sessao.concedido`, que o derive interpreta na hora: ela não é gravada na ficha,
   não gasta orçamento, não exige o pré-requisito de compra e não tem prazo de rodada. Uma habilidade que pede ativação própria continua pedindo:
   quem a ativa é o catálogo (Da Ficha), como qualquer outra. Aqui só se vê de onde ela veio e se tira.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Search, X } from "lucide-react";
import { buscarNaFamilia, familiasDeConcessao, jaConcedida } from "./concedido-logica";

const VAZIO = Object.freeze({ familia: "habilidades", termo: "" });

export function ConcedidoG2({ g, m }) {
  const tela = { ...VAZIO, ...(g.tela.catalogo.conc ?? {}) };
  const muda = (patch) => g.mudaCatalogo((c) => ({ conc: { ...VAZIO, ...(c.conc ?? {}), ...patch } }));
  const [aviso, setAviso] = useState(null);
  const familias = familiasDeConcessao();
  const concedidos = m.derived.concedido ?? [];
  const mortas = concedidos.filter((c) => c.morta).length;
  /* A busca é lida a cada render que a muda: um addon pode ter entrado depois de a tela montar (`aplicarAddons` reescreve a lista no lugar). */
  const busca = useMemo(() => buscarNaFamilia(tela.familia, tela.termo), [tela.familia, tela.termo, concedidos.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const conceder = (e) => {
    const r = m.acoes.conceder(tela.familia, e.id);
    setAviso(r.erro ? { tom: "atencao", texto: `${e.nome}: ${r.erro}` } : { tom: "ok", texto: `Concedido · ${e.nome}` });
  };
  const tirar = (c) => { m.acoes.tirarConcessao(c.uid); setAviso({ tom: "ok", texto: `Removido · ${c.nome}` }); };
  return (
    <div className="k-concedido" data-concedido-mestre>
      {aviso && (
        <div className="g-resultado" role="status" data-aviso-concedido data-tom={aviso.tom === "atencao" ? "nada" : undefined}>
          <span className="g-resultado-verbo">{aviso.texto}</span>
          <button type="button" className="g-x" onClick={() => setAviso(null)} aria-label="Fechar o aviso"><X aria-hidden="true" /></button>
        </div>
      )}
      <h3 className="k-grupo">Concedidos Agora<small>{concedidos.length}</small></h3>
      {concedidos.length === 0 && <p className="x-mesa" data-nenhum-concedido>Nada Concedido</p>}
      {concedidos.map((c) => (
        <div key={c.uid} className="k-fila" data-concedido={c.uid} data-morta={c.morta ? "" : undefined}>
          <span className="k-item" title={c.morta ? c.id : c.nome}>
            <span className="k-nome"><span className="k-texto" style={c.morta ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{c.nome}</span></span>
          </span>
          <span className="k-meta">
            <span className="x-neutro k-familia">{c.rotuloFamilia}</span>
            {c.morta && <span className="x-atencao" data-sem-addon><AlertTriangle aria-hidden="true" />Sem Addon</span>}
          </span>
          <button type="button" className="k-acao" data-largo data-tom="ativar" aria-label={`Remover ${c.nome}`} onClick={() => tirar(c)} data-remover-concessao={c.uid}>
            <span className="k-acao-texto">Remover</span><span className="k-acao-seta" aria-hidden="true" />
          </button>
        </div>
      ))}
      {mortas > 0 && <p className="x-atencao"><AlertTriangle aria-hidden="true" />{mortas === 1 ? "1 Concessão Sem Addon" : `${mortas} Concessões Sem Addon`}</p>}

      <h3 className="k-grupo">Conceder</h3>
      <div className="im-filtros">
        <span className="m-select"><select className="afty-campo" value={tela.familia} aria-label="Família" onChange={(e) => muda({ familia: e.target.value })} data-campo="concedido-familia">
          {familias.map((f) => <option key={f.id} value={f.id}>{f.rotulo}</option>)}
        </select><ChevronDown aria-hidden="true" /></span>
        <label className="e-busca k-busca">
          <Search aria-hidden="true" />
          <input className="afty-campo" type="search" value={tela.termo} placeholder="Buscar no catálogo" aria-label="Buscar para conceder" onChange={(e) => muda({ termo: e.target.value })} data-busca-concedido />
          {tela.termo && <button type="button" className="e-limpar" onClick={() => muda({ termo: "" })} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
        </label>
      </div>
      {busca.itens.length === 0 && <p className="x-mesa">Nada Encontrado</p>}
      {busca.itens.map((e) => {
        const ja = !familias.find((f) => f.id === tela.familia)?.repetivel && jaConcedida(m.sessao, tela.familia, e.id);
        return (
          <div key={e.id} className="k-fila" data-chave-concessao={e.id}>
            <span className="k-item" title={e.id}><span className="k-nome"><span className="k-texto">{e.nome}</span></span></span>
            {ja
              ? <span className="k-acao" data-tom="ativo" data-largo><span className="k-acao-texto">Concedido</span></span>
              : (
                <button type="button" className="k-acao" data-largo data-tom="ativar" aria-label={`Conceder ${e.nome}`} onClick={() => conceder(e)}>
                  <span className="k-acao-texto">Conceder</span><span className="k-acao-seta" aria-hidden="true" />
                </button>
              )}
          </div>
        );
      })}
      {busca.sobrando > 0 && <p className="x-mesa">Mais {busca.sobrando}: Refine a Busca</p>}
    </div>
  );
}
