/* ============================================================
   G2 · ENCERRADOS NESTA SESSÃO E REATIVAR
   ============================================================
   O mesmo registro de encerramentos do gerenciador (`g.encerrados`, na mesa),
   nas duas apresentações G2: um acesso discreto ao pé dos Ativos, recolhido
   ao entrar, que não pesa na leitura dos ativos.

   Reativar é uma ATIVAÇÃO NOVA, com a confirmação antes:
     - Ataque Concentrado: a MESMA Preparação do catálogo (intensidade, custo
       do motor, prévia), começando na intensidade de antes. Confirmar cobra.
     - Concentrar Aura, Conhecimento Aplicado e Invencível sob o Sol (2026-10-15):
       a MESMA Preparação comum do catálogo, começando nos valores de antes.
       Uso novo, com o custo inteiro. O que é à mão continua à mão.
     - os outros: o que volta (os valores de quando encerrou) e o custo como
       sempre, manual ("Desconte", com Descontar) ou da ficha. Confirmar usa
       o `acoes.reativar` de hoje.
   Voltar (cancelar) não toca a sessão: o rascunho mora em `tela.reativando`.
   A saída dos Encerrados vai na MESMA operação da confirmação: se ela não
   passar, o encerrado fica.
   ============================================================ */
import React, { useEffect, useRef } from "react";
import { AlertTriangle, ChevronRight, RotateCcw } from "lucide-react";
import { verificacoes } from "./efeitos-dados";
import { ehGolpe, ehPiloto, estadosDoCartao, temPreparo } from "./g2-dados";
import { CustoG2 } from "./PecasG2";
import { PreparoG2, PreparoGolpe, PreparoGrupo, faixaDoPiloto } from "./PreparoG2";
import { rascunhoDeReativarSustentacao, rascunhoInicial } from "./g2-preparo";
import { rascunhoDoGolpe } from "./g2-golpe";

/* O que volta ao reativar, dito como o cartão diria. */
function oQueVolta(x, g, m) {
  const r = x.restaurar;
  if (r.tipo === "grupo") {
    const gr = g.grupos.find((y) => y.chave === x.chave);
    if (!gr) return null;
    const mm = { ...m, sessao: { ...m.sessao, combate: { ...(m.sessao.combate ?? {}), ...r.valores } } };
    return estadosDoCartao({ tipo: "grupo", grupo: gr }, mm, { curto: false }).map((e) => [e.rotulo, e.valor].filter(Boolean).join(" ")).join(" · ") || null;
  }
  const rodadas = (r.item ?? {}).rodadas;
  if (r.tipo === "condicao" || r.tipo === "buff") return rodadas == null ? null : rodadas === 1 ? "Última Rodada" : `${rodadas} Rodadas`;
  if (r.tipo === "sustentado") return "Sustentado";
  return null;
}

function Confirmacao({ x, g, m, onde, o }) {
  const custo = g.custoDeReativar(x);
  const volta = oQueVolta(x, g, m);
  const bloqueios = o ? verificacoes(o, m).nao : [];
  const depois = () => g.mudaTela((t) => ({ reativando: null, selecionado: x.chave, revelar: x.chave, compactaAberto: onde === "compacta" ? x.chave : t.compactaAberto }));
  /* O Confirmar à vista quando a confirmação abre (os Encerrados ficam no pé da lista). */
  const botoes = useRef(null);
  useEffect(() => { botoes.current?.scrollIntoView({ block: "nearest" }); }, []);
  return (
    <div className="k-confirmar e2-confirmar" data-reativando={x.chave}>
      {volta && <span className="x-linha"><span className="x-ctrl-nome">Volta Como Estava</span><b className="e2-volta">{volta}</b></span>}
      {custo ? <CustoG2 custo={custo} m={m} nome={x.nome} /> : <span className="x-mesa">Sem Custo Registrado</span>}
      {bloqueios.map((t) => <span key={t} className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{t}</span>)}
      <span ref={botoes} className="x-linha">
        <button type="button" className="m-botao x-adicionar g2-primario" disabled={bloqueios.length > 0} onClick={() => { g.acoes.reativar(x); depois(); }} data-confirmar-reativar>Confirmar Reativação</button>
        <button type="button" className="m-botao" onClick={() => g.mudaTela({ reativando: null })} data-voltar-reativar>Voltar</button>
      </span>
    </div>
  );
}

function Encerrado({ x, g, m, onde }) {
  const rascunho = g.tela.reativando?.chave === x.chave ? g.tela.reativando : null;
  const o = x.restaurar.tipo === "grupo" ? g.opcoes.find((y) => y.chave === x.chave) ?? null : null;
  const piloto = !!o && ehPiloto(o);
  const preparo = !!o && temPreparo(o);
  /* Consolidação ampliada (2026-10-16): a Sustentação e o Golpe Especial também reativam pela Preparação. A vaga já ocupada por outro
     Feitiço aparece como "Sai", e nada é substituído calado. */
  const sust = x.restaurar.tipo === "sustentado" ? g.opcoes.find((y) => y.chave === "estado:sustentacao") ?? null : null;
  const golpe = !!o && ehGolpe(o);
  const inicial = () => {
    if (sust) return { valor: null, valores: rascunhoDeReativarSustentacao(sust, m, x.restaurar) };
    if (golpe) return { valor: null, valores: rascunhoDoGolpe(m, x.restaurar.golpe ?? null) };
    if (preparo) return { valor: null, valores: rascunhoInicial(o.grupo, m.derived, x.restaurar.valores ?? {}) };
    if (!piloto) return { valor: null };
    const f = faixaDoPiloto(o.grupo, m.derived);
    return { valor: Math.min(f.max, Math.max(1, Math.trunc(Number(x.restaurar.valores?.[f.e.id]) || 1))) };
  };
  return (
    <li className="e2-item" data-encerrado={x.chave}>
      <div className="e2-linha">
        <span className="e2-nome" title={x.nome}>{x.nome}</span>
        {!rascunho && (
          <button type="button" className="k-acao e2-reativar" onClick={() => g.mudaTela({ reativando: { chave: x.chave, ...inicial() } })} aria-label={`Reativar ${x.nome}`} data-reativar-g2={x.chave}>
            <RotateCcw aria-hidden="true" /><span className="k-acao-texto">Reativar</span>
          </button>
        )}
      </div>
      {rascunho && piloto && (
        <PreparoG2 o={o} g={g} m={m} valor={rascunho.valor} rotuloConfirmar="Confirmar Reativação"
          onValor={(n) => g.mudaTela((t) => ({ reativando: { ...t.reativando, valor: n } }))}
          onCancelar={() => g.mudaTela({ reativando: null })}
          onConfirmar={(v) => g.acoes.confirmarAtivacao(o, v, { onde })} />
      )}
      {rascunho && preparo && rascunho.valores && (
        <PreparoGrupo o={o} m={m} valores={rascunho.valores} rotuloConfirmar="Confirmar Reativação"
          onValores={(valores) => g.mudaTela((t) => ({ reativando: { ...t.reativando, valores } }))}
          onCancelar={() => g.mudaTela({ reativando: null })}
          onConfirmar={(valores) => g.acoes.confirmarPreparo(o, valores, { onde, verbo: "Reativado" })} />
      )}
      {rascunho && sust && rascunho.valores && (
        <PreparoGrupo o={sust} m={m} valores={rascunho.valores} rotuloConfirmar="Confirmar Reativação" encerrado={x.chave}
          onValores={(valores) => g.mudaTela((t) => ({ reativando: { ...t.reativando, valores } }))}
          onCancelar={() => g.mudaTela({ reativando: null })}
          onConfirmar={(valores) => g.acoes.confirmarPreparo(sust, valores, { onde, verbo: "Reativado", encerrado: x.chave })} />
      )}
      {rascunho && golpe && rascunho.valores && (
        <PreparoGolpe o={o} m={m} valores={rascunho.valores} rotuloConfirmar="Confirmar Reativação"
          onValores={(valores) => g.mudaTela((t) => ({ reativando: { ...t.reativando, valores } }))}
          onCancelar={() => g.mudaTela({ reativando: null })}
          onConfirmar={(valores) => g.acoes.confirmarGolpe(o, valores, { onde, verbo: "Reativado" })} />
      )}
      {rascunho && !piloto && !preparo && !sust && !golpe && <Confirmacao x={x} g={g} m={m} onde={onde} o={o} />}
    </li>
  );
}

/* `onde`: "completa" ou "compacta". O recolhido é um estado só para as duas. */
export function EncerradosG2({ g, m, onde }) {
  if (!g.encerrados.length) return null;
  const aberto = g.tela.encerradosAberto;
  return (
    <section className="e2-encerrados" data-encerrados={onde} aria-label="Encerrados nesta sessão">
      <button type="button" className="e2-toggle" aria-expanded={aberto} onClick={() => g.mudaTela((t) => ({ encerradosAberto: !t.encerradosAberto, reativando: null }))} data-encerrados-toggle>
        <ChevronRight aria-hidden="true" className="e2-seta" />Encerrados Nesta Sessão<small>{g.encerrados.length}</small>
      </button>
      {aberto && <ul className="e2-lista">{g.encerrados.map((x) => <Encerrado key={x.chave} x={x} g={g} m={m} onde={onde} />)}</ul>}
    </section>
  );
}
