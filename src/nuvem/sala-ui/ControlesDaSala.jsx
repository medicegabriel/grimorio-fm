import React, { useState } from "react";
import { Crown, DoorClosed, KeyRound, Lock, Unlock, Users, X } from "lucide-react";

import { Aviso, Confirmar, Dialogo } from "../../systems/afty/encontros/telas/pecas-encontro";
import { Avatar, CampoCopiavel, PontoOnline } from "./PecasSala";
import { ROTULO_PAPEL, linkDaSala } from "./sala-ui-dados";

/**
 * ============================================================
 * OS CONTROLES DA SALA DO MESTRE (etapa 7c, 2026-11-18)
 * ============================================================
 * Código e link para copiar, quem está na Sala (Remover, Promover a Mestre), Trocar a Senha, Trancar a Sala e Fechar a Sala.
 * Fechar e Remover pedem confirmação, que diz o que acontece (D-25). Quem pode o quê é do banco: o que ele recusa volta como
 * aviso aqui, perto do controle. A tela mostra os controles a quem é Mestre, e Promover só a quem criou a Sala.
 * ============================================================
 */

const senhaValida = (s) => s.length >= 4 && s.length <= 64;

function Interruptor({ ligado, onMudar, rotulo, icone: Icone, desabilitado = false }) {
  return (
    <div className="ec-config-linha" data-desabilitado={desabilitado ? "sim" : undefined}>
      <span className="ec-config-rotulo"><Icone aria-hidden="true" />{rotulo}</span>
      <button type="button" role="switch" aria-checked={!!ligado} className="ec-interruptor" disabled={desabilitado} onClick={() => onMudar(!ligado)} aria-label={rotulo}>
        <span className="ec-interruptor-bola" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function ControlesDaSala({ retrato, cliente, onFechar, onFecharSala }) {
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [senha, setSenha] = useState("");
  const [aRemover, setARemover] = useState(null);
  const [fechando, setFechando] = useState(false);
  const [confirmarFechar, setConfirmarFechar] = useState(false);
  const sala = retrato.sala ?? {};
  const eu = retrato.eu?.conta;
  const criei = !!sala.dono && sala.dono === eu;
  const online = new Set(retrato.online ?? []);
  const ordem = { mestre: 0, jogador: 1, espectador: 2 };
  const membros = Object.values(retrato.membros ?? {}).filter((m) => !m.removido_em)
    .sort((a, b) => (ordem[a.papel] ?? 3) - (ordem[b.papel] ?? 3) || String(a.nome).localeCompare(String(b.nome), "pt-BR"));

  const rodar = async (fn, ok = null) => {
    setErro(null);
    setAviso(null);
    try {
      await fn();
      await cliente.relerTudo();
      if (ok) setAviso(ok);
    } catch (e) {
      setErro(e?.codigo ?? "Falha na Sala");
    }
  };

  return (
    <Dialogo
      titulo={`Sala ${sala.codigo ?? ""}`} icone={Users} onFechar={onFechar} largura="34rem"
      rodape={<button type="button" className="afty-botao" onClick={onFechar} data-foco-inicial>Fechar</button>}
    >
      {erro && <Aviso onFechar={() => setErro(null)}>{erro}</Aviso>}
      <section className="sl-codigo-bloco" aria-label="Código e Link">
        <CampoCopiavel rotulo="Link" valor={linkDaSala(sala.codigo)} />
        <CampoCopiavel rotulo="Código" valor={sala.codigo ?? ""} />
      </section>

      <section className="ec-config-grupo" aria-label="Participantes">
        <h3 className="ec-config-titulo"><Users aria-hidden="true" />Participantes<small className="ec-contagem">{membros.length}</small></h3>
        <ul className="sl-membros">
          {membros.map((m) => {
            const ehCriador = m.conta === sala.dono;
            return (
              <li key={m.conta} className="sl-membro">
                <Avatar url={m.avatar} nome={m.nome} />
                <span className="sl-membro-texto">
                  <span className="ec-fila-nome" title={m.nome}>{m.nome}{m.conta === eu ? " (Você)" : ""}</span>
                  <span className="ec-fila-meta">
                    {m.papel === "mestre" ? <span className="ec-estado"><Crown aria-hidden="true" />{ehCriador ? "Mestre, Criou a Sala" : "Mestre"}</span> : <span>{ROTULO_PAPEL[m.papel]}</span>}
                    <PontoOnline online={online.has(m.conta)} />
                  </span>
                </span>
                {m.conta !== eu && !ehCriador && (
                  <span className="sl-membro-botoes">
                    {criei && m.papel !== "mestre" && m.papel !== "espectador" && (
                      <button type="button" className="afty-botao" onClick={() => rodar(() => cliente.promoverMestre(m.conta, true))}><Crown aria-hidden="true" />Promover a Mestre</button>
                    )}
                    {criei && m.papel === "mestre" && (
                      <button type="button" className="afty-botao" onClick={() => rodar(() => cliente.promoverMestre(m.conta, false))}>Tirar de Mestre</button>
                    )}
                    <button type="button" className="afty-botao" data-afty-tom="perigo" onClick={() => setARemover(m)}><X aria-hidden="true" />Remover</button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ec-config-grupo" aria-label="Acesso">
        <h3 className="ec-config-titulo"><KeyRound aria-hidden="true" />Acesso</h3>
        <Interruptor rotulo="Trancar a Sala" icone={sala.trancada ? Lock : Unlock} ligado={sala.trancada} onMudar={(v) => rodar(() => cliente.trancar(v))} />
        <form
          className="sl-pedir" onSubmit={(ev) => { ev.preventDefault(); if (senhaValida(senha)) rodar(() => cliente.trocarSenha(senha), "Senha Trocada").then(() => setSenha("")); }}
        >
          <input className="ec-campo" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} aria-label="Nova Senha" placeholder="Nova Senha" maxLength={64} style={{ flex: "1 1 10rem" }} />
          <button type="submit" className="afty-botao" disabled={!senhaValida(senha)}><KeyRound aria-hidden="true" />Trocar a Senha</button>
        </form>
        {aviso && <p className="sl-resultado" role="status">{aviso}</p>}
      </section>

      <section className="sl-perigo" aria-label="Fechar">
        <button type="button" className="afty-botao" data-afty-tom="perigo" onClick={() => setConfirmarFechar(true)} disabled={fechando}><DoorClosed aria-hidden="true" />Fechar a Sala</button>
      </section>

      {aRemover && (
        <Confirmar
          titulo={`Remover ${aRemover.nome} da Sala?`} rotulo="Remover"
          onCancelar={() => setARemover(null)}
          onConfirmar={() => { const m = aRemover; setARemover(null); rodar(() => cliente.removerMembro(m.conta)); }}
        >
          <p className="ec-texto">{aRemover.nome} perde o acesso, e os personagens dele saem do Encontro.</p>
        </Confirmar>
      )}
      {confirmarFechar && (
        <Confirmar
          titulo="Fechar a Sala?" rotulo="Fechar a Sala"
          onCancelar={() => setConfirmarFechar(false)}
          onConfirmar={async () => {
            setConfirmarFechar(false);
            setFechando(true);
            try { await onFecharSala(); onFechar(); } catch (e) { setErro(e?.codigo ?? "Falha ao Fechar"); } finally { setFechando(false); }
          }}
        >
          <p className="ec-texto">A luta termina e o link para de abrir. O Encontro fica Finalizado na lista de todos, com o Registro.</p>
        </Confirmar>
      )}
    </Dialogo>
  );
}
