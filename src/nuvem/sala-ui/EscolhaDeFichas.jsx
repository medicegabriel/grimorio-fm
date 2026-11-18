import React, { useState } from "react";
import { Dices, FileText, Share2, Swords, Trash2, Users } from "lucide-react";

import { Aviso, Dialogo, Retrato, Vazio } from "../../systems/afty/encontros/telas/pecas-encontro";
import { FASE } from "../sala-cliente";
import { idDoPersonagem } from "../sala-oculto";
import { enviarIniciativa, rolarIniciativaDe } from "../sala-jogador";
import { PontoOnline } from "./PecasSala";

/**
 * ============================================================
 * ESCOLHER AS FICHAS DA SALA (etapa 7c, 2026-11-18)
 * ============================================================
 * As fichas de personagem do inventário do grupo da Sala. Uma ou várias entram de uma vez (caixa de seleção e a barra de grupo
 * embaixo, D-24), cada uma com a iniciativa: o campo vazio rola o d20 na entrada, e o botão de dados rola e mostra antes. A ficha
 * que já está na Sala mostra Abrir Ficha, Compartilhar, Rolar Iniciativa e Tirar da Sala. A ficha é a de verdade, ligada nos dois
 * sentidos (o espelho está em `sala-espelho.js`).
 * ============================================================
 */

const sufixoNovo = () => Math.random().toString(36).slice(2, 6);

/** O combatente da Sala que veio desta ficha (o id é `pj:<id da ficha>`, com sufixo se a mesma ficha já estava lá). */
const combatenteDaFicha = (meus, ficha) => meus.find((r) => String(r.combatente).startsWith(`pj:${ficha.id}`)) ?? null;

export function CompartilharFicha({ retrato, cliente, combatente, nome, onFechar }) {
  const [erro, setErro] = useState(null);
  const eu = retrato.eu?.conta;
  const online = new Set(retrato.online ?? []);
  const colegas = Object.values(retrato.membros ?? {}).filter((m) => m.papel === "jogador" && m.conta !== eu && !m.removido_em);
  const com = (conta) => (retrato.compartilhamentos ?? []).some((c) => c.combatente === combatente && c.para === conta);
  const mudar = async (conta, ligado) => {
    setErro(null);
    try { await cliente.compartilhar(combatente, conta, ligado); await cliente.relerTudo(); } catch (e) { setErro(e?.codigo ?? "Falha na Sala"); }
  };
  return (
    <Dialogo titulo={`Compartilhar ${nome}`} icone={Share2} onFechar={onFechar} largura="28rem" rodape={<button type="button" className="afty-botao" onClick={onFechar} data-foco-inicial>Fechar</button>}>
      {erro && <Aviso onFechar={() => setErro(null)}>{erro}</Aviso>}
      {colegas.length === 0 ? <Vazio icone={Users} titulo="Nenhum Colega na Sala" /> : (
        <ul className="sl-membros">
          {colegas.map((m) => (
            <li key={m.conta} className="sl-membro">
              <span className="sl-membro-texto">
                <span className="ec-fila-nome" title={m.nome}>{m.nome}</span>
                <span className="ec-fila-meta"><PontoOnline online={online.has(m.conta)} /></span>
              </span>
              <button type="button" role="switch" aria-checked={com(m.conta)} className="ec-interruptor" onClick={() => mudar(m.conta, !com(m.conta))} aria-label={`Compartilhar com ${m.nome}`}>
                <span className="ec-interruptor-bola" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialogo>
  );
}

export default function EscolhaDeFichas({ retrato, cliente, personagens, meus, onAbrirFicha, onErro }) {
  const [marcadas, setMarcadas] = useState(() => new Set());
  const [iniciativas, setIniciativas] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const [compartilhando, setCompartilhando] = useState(null);
  const pronta = retrato.fase === FASE.PRONTA;
  const planejando = retrato.estado?.status !== "ativo";

  const marcar = (id) => setMarcadas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const rolar = (f) => setIniciativas((m) => ({ ...m, [f.id]: String(rolarIniciativaDe(f).total) }));

  const poNaSala = async (f) => {
    let id = idDoPersonagem(f.id);
    for (let i = 0; i < 3 && id; i += 1) {
      try {
        await cliente.adicionarCombatente({ combatente: id, tipo: "personagem", nome: f.name || "Personagem" });
        await cliente.relerTudo();
        const digitado = iniciativas[f.id];
        await enviarIniciativa(cliente, { combatente: id, ficha: f, total: digitado === undefined || digitado === "" ? null : Math.trunc(Number(digitado) || 0) });
        return;
      } catch (e) {
        if (e?.codigo !== "Combatente Repetido") throw e;
        id = idDoPersonagem(f.id, sufixoNovo());
      }
    }
  };

  const poSelecionadas = async () => {
    setOcupado(true);
    onErro?.(null);
    try {
      for (const f of personagens.filter((x) => marcadas.has(String(x.id)) && !combatenteDaFicha(meus, x))) await poNaSala(f);
      setMarcadas(new Set());
    } catch (e) {
      onErro?.(e?.codigo ?? "Falha na Sala");
    } finally {
      setOcupado(false);
    }
  };

  if (!personagens.length) {
    return <Vazio icone={Users} titulo="Nenhum Personagem neste Aparelho" />;
  }

  // As fichas que já estão na Sala vêm primeiro: são as que o jogador usa na luta.
  const ordenadas = [...personagens].sort((a, b) => Number(!!combatenteDaFicha(meus, b)) - Number(!!combatenteDaFicha(meus, a)));
  const aMarcar = [...marcadas].filter((id) => personagens.some((f) => String(f.id) === id && !combatenteDaFicha(meus, f)));
  return (
    <>
      <ul className="sl-fichas" aria-label="Minhas Fichas">
        {ordenadas.map((f) => {
          const comb = combatenteDaFicha(meus, f);
          const nome = f.name || "Personagem";
          const nivel = f.core?.nd;
          return (
            <li key={f.id} className="sl-ficha" data-na-sala={comb ? "sim" : undefined}>
              {comb ? (
                <span className="afty-chip" data-afty-tom="destaque">Na Sala</span>
              ) : (
                <label className="ec-caixa" title={marcadas.has(String(f.id)) ? "Tirar da Seleção" : "Selecionar"}>
                  <input type="checkbox" checked={marcadas.has(String(f.id))} onChange={() => marcar(String(f.id))} aria-label={`Selecionar ${nome}`} disabled={!pronta || ocupado} />
                </label>
              )}
              <Retrato url={f.portraitUrl} foco={f.portraitFocus} nome={nome} tamanho="sm" />
              <span className="sl-ficha-texto">
                <span className="ec-inv-nome" title={nome}>{nome}</span>
                {nivel != null && <span className="ec-inv-meta">Nível {nivel}</span>}
              </span>
              <div className="sl-ficha-controles">
                {comb ? (
                  <>
                    <button type="button" className="afty-botao" onClick={() => onAbrirFicha(String(f.id))}><FileText aria-hidden="true" />Abrir Ficha</button>
                    <button type="button" className="afty-botao" onClick={() => setCompartilhando({ combatente: comb.combatente, nome })}><Share2 aria-hidden="true" />Compartilhar</button>
                    <button type="button" className="afty-botao" disabled={!planejando && !pronta} onClick={() => enviarIniciativa(cliente, { combatente: comb.combatente, ficha: f }).catch((e) => onErro?.(e?.codigo ?? "Falha na Sala"))}><Dices aria-hidden="true" />Rolar Iniciativa</button>
                    <button type="button" className="afty-botao ec-icone" aria-label={`Tirar ${nome} da Sala`} title={`Tirar ${nome} da Sala`} onClick={() => cliente.removerCombatente(comb.combatente).then(() => cliente.relerTudo()).catch((e) => onErro?.(e?.codigo ?? "Falha na Sala"))}><Trash2 aria-hidden="true" /></button>
                  </>
                ) : (
                  <label className="ec-rotulado ec-rotulado-linha">
                    <span>Iniciativa</span>
                    <input
                      className="ec-campo ec-campo-num" inputMode="numeric" data-largura="media" value={iniciativas[f.id] ?? ""} placeholder="d20"
                      onChange={(e) => setIniciativas((m) => ({ ...m, [f.id]: e.target.value.replace(/[^\d-]/g, "") }))} aria-label={`Iniciativa de ${nome}`}
                    />
                    <button type="button" className="afty-botao ec-icone" onClick={() => rolar(f)} aria-label={`Rolar a Iniciativa de ${nome}`} title="Rolar Iniciativa"><Dices aria-hidden="true" /></button>
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {aMarcar.length > 0 && (
        <div className="sl-barra-grupo" role="region" aria-label="Pôr na Sala">
          <span><b>{aMarcar.length}</b> {aMarcar.length === 1 ? "Selecionada" : "Selecionadas"}</span>
          <button type="button" className="afty-botao" data-afty-tom="destaque" disabled={!pronta || ocupado} onClick={poSelecionadas}><Swords aria-hidden="true" />Pôr na Sala</button>
        </div>
      )}
      {compartilhando && <CompartilharFicha retrato={retrato} cliente={cliente} combatente={compartilhando.combatente} nome={compartilhando.nome} onFechar={() => setCompartilhando(null)} />}
    </>
  );
}
