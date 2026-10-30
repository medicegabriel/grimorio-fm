/* ============================================================
   BUFF DE MESA NO G2 (fechamento funcional do G2, 2026-10-20)
   ============================================================
   O formulário do `NovoBuff` da Apresentação Anterior, no fluxo do catálogo (Adicionar > Fonte Externa > Buff de Mesa): nome, onde cai (criatura ou
   invocação, e qual), canal (`CanalPicker`, com o catálogo do escopo), valor ou expressão do DSL e a duração em rodadas ou sem contador.

   ⚠ É o buff de mesa de sempre (`sessao.buffs`, lido por `efeitosDaSessao`), e NÃO um registro de Fonte Externa: guarda a expressão, o canal e o escopo.
   Criar é uma ação explícita (o botão, ou Enter num campo). O rascunho mora em `tela.catalogo.buff`, só na tela, e sobrevive a trocar de aba do
   catálogo. A conferência (`montarBuff`) recusa a expressão vazia ou inválida SEM gravar nada, e o formulário continua como estava para corrigir.
   ============================================================ */
import React, { useRef, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import CanalPicker from "../CanalPicker";
import { catalogoDeCanais, comEscopo, ESCOPOS_DE_BUFF, montarBuff, rascunhoDeBuff } from "./buff-mesa-logica";

export function BuffDeMesaG2({ g, m, onFechar }) {
  const rascunho = { ...rascunhoDeBuff(), ...(g.tela.catalogo.buff ?? {}) };
  const muda = (patch) => g.mudaCatalogo((c) => ({ buff: { ...rascunhoDeBuff(), ...(c.buff ?? {}), ...patch } }));
  const [erro, setErro] = useState(null);
  const [criado, setCriado] = useState(null);
  /* O clique duplo não cria duas vezes: o mesmo rascunho, no mesmo instante, vale uma criação só. */
  const ultimo = useRef(null);
  const invocacoes = m.derived.invocacoes?.lista ?? [];
  const naInvocacao = rascunho.escopo === "invocacao";
  const edita = (patch) => { setErro(null); setCriado(null); muda(patch); };

  const criar = (ev) => {
    ev?.preventDefault();
    const assinatura = JSON.stringify(rascunho);
    /* O relógio é o do próprio evento (`timeStamp`): o componente não lê o relógio da máquina. */
    const agora = ev?.timeStamp ?? 0;
    if (ultimo.current && ultimo.current.assinatura === assinatura && Math.abs(agora - ultimo.current.ts) < 800) return;
    const r = montarBuff(rascunho, { invocacoes });
    if (r.erro) { setErro(r); return; }
    ultimo.current = { assinatura, ts: agora };
    m.acoes.criarBuff(r.buff);
    g.mudaCatalogo({ buff: rascunhoDeBuff() });
    setErro(null);
    setCriado({ id: r.buff.id, nome: r.buff.nome });
  };

  return (
    <form className="g-registro" onSubmit={criar} aria-label="Criar buff de mesa" data-buff-mesa>
      <div className="g-registro-topo">
        <h2 className="g-titulo">Buff de Mesa</h2>
        <button type="button" className="g-x" onClick={onFechar} aria-label="Fechar o buff de mesa"><X aria-hidden="true" /></button>
      </div>
      <label className="g-campo"><span>Nome</span>
        <input className="afty-campo" value={rascunho.nome} onChange={(e) => edita({ nome: e.target.value })} placeholder="Nome do Buff" data-campo="buff-nome" autoComplete="off" />
      </label>
      {invocacoes.length > 0 && (
        <div className="g-campo"><span>Onde Cai</span>
          <span className="m-seg" role="radiogroup" aria-label="Onde o buff cai">
            {ESCOPOS_DE_BUFF.map((e) => (
              <button key={e.id} type="button" role="radio" className="m-seg-op" aria-checked={rascunho.escopo === e.id} data-escopo-buff={e.id}
                onClick={() => edita(comEscopo(rascunho, e.id))}>{e.rotulo}</button>
            ))}
          </span>
        </div>
      )}
      {invocacoes.length > 0 && naInvocacao && (
        <label className="g-campo"><span>Qual Invocação</span>
          <span className="m-select"><select className="afty-campo" value={rascunho.invocacaoAlvo} onChange={(e) => edita({ invocacaoAlvo: e.target.value })} data-campo="buff-invocacao">
            <option value="">Todas</option>
            {invocacoes.map((inv) => <option key={inv.id} value={inv.id}>{inv.nome || "Sem Nome"}</option>)}
          </select></span>
        </label>
      )}
      <div className="g-campo"><span>Canal</span>
        <span data-campo="buff-canal"><CanalPicker value={rascunho.canal} onChange={(canal) => edita({ canal })} catalogo={catalogoDeCanais(rascunho.escopo)} /></span>
      </div>
      <label className="g-campo"><span>Valor ou Expressão</span>
        <input className="afty-campo" value={rascunho.expr} onChange={(e) => edita({ expr: e.target.value })} placeholder="+2" data-campo="buff-expr" autoComplete="off" spellCheck={false} aria-invalid={erro?.campo === "expr" ? "true" : undefined} />
      </label>
      <label className="g-campo g-campo-curto"><span>Rodadas</span>
        <input className="afty-campo m-campo-num" value={rascunho.rodadas} onChange={(e) => edita({ rodadas: e.target.value.replace(/\D/g, "") })} placeholder="Sem" inputMode="numeric" data-campo="buff-rodadas" />
      </label>
      {erro && <span className="x-atencao" role="alert" data-erro-buff title={erro.detalhe ?? undefined}><AlertTriangle aria-hidden="true" />{erro.erro}</span>}
      {criado && (
        <div className="g-resultado" role="status" data-buff-criado={criado.id}>
          <span className="g-resultado-verbo"><Check aria-hidden="true" />Buff Criado · {criado.nome}</span>
          <button type="button" className="m-botao" onClick={() => g.irAoAtivo(`buff:${criado.id}`)} data-abrir-buff>Abrir nos Ativos</button>
        </div>
      )}
      <div className="g-registro-rodape">
        <button type="submit" className="g-botao" data-primaria="sim" data-criar-buff>Criar Buff</button>
      </div>
    </form>
  );
}
