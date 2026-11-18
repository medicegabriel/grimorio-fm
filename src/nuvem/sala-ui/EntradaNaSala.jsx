import React, { useState } from "react";
import { Check, DoorOpen, LogIn } from "lucide-react";

import * as rede from "../sala-rede";
import { Aviso } from "../../systems/afty/encontros/telas/pecas-encontro";
import { Casca } from "./PecasSala";
import { ROTULO_PAPEL } from "./sala-ui-dados";

/**
 * ============================================================
 * ENTRAR NA SALA (etapa 7c, 2026-11-18)
 * ============================================================
 * O caminho de quem abre `/Sala/<código>`: a Conta (Google ou Discord, a mesma do resto do site), a senha com o papel
 * (Jogador ou Espectador) e, para o jogador, a escolha das fichas (em `EscolhaDeFichas.jsx`). A tarefa de cada passo é uma só, e
 * o botão de destaque também. O Espectador entra sem ficha.
 * ============================================================
 */

function Passos({ atual }) {
  const passos = ["Conta", "Senha", "Fichas"];
  return (
    <ol className="sl-passos" aria-label="Passos para Entrar">
      {passos.map((p, i) => (
        <li key={p} className="sl-passo" data-feito={i < atual ? "sim" : undefined} data-atual={i === atual ? "sim" : undefined} aria-current={i === atual ? "step" : undefined}>
          {i < atual && <Check aria-hidden="true" />}{p}
        </li>
      ))}
    </ol>
  );
}

export function Login({ codigo, onVoltar, entrar }) {
  return (
    <Casca titulo={codigo ? `Sala ${codigo}` : "Sala"} onVoltar={onVoltar}>
      <section className="afty-card sl-entrada" aria-label="Entrar com a Conta">
        <div className="sl-entrada-topo"><LogIn aria-hidden="true" /><h2 className="sl-entrada-titulo">Entrar com a Conta</h2></div>
        <Passos atual={0} />
        <div className="sl-contas">
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={() => entrar("google")}><LogIn aria-hidden="true" />Entrar com Google</button>
          <button type="button" className="afty-botao" onClick={() => entrar("discord")}><LogIn aria-hidden="true" />Entrar com Discord</button>
        </div>
      </section>
    </Casca>
  );
}

export function FormularioDeEntrada({ codigo, nome, trancada, onEntrou, onVoltar }) {
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState("jogador");
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const enviar = async (ev) => {
    ev.preventDefault();
    if (!senha || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await rede.entrarNaSala(codigo, senha, papel);
      onEntrou(r.sala_id);
    } catch (e) {
      setErro(e?.codigo ?? "Falha ao Entrar");
    } finally {
      setEnviando(false);
    }
  };
  return (
    <Casca titulo={`Sala ${codigo}`} onVoltar={onVoltar}>
      <form className="afty-card sl-entrada" onSubmit={enviar} aria-label="Entrar na Sala">
        <div className="sl-entrada-topo"><DoorOpen aria-hidden="true" /><h2 className="sl-entrada-titulo" title={nome}>{nome || "Entrar na Sala"}</h2></div>
        <Passos atual={1} />
        {trancada && <Aviso>Sala Trancada</Aviso>}
        <label className="sl-campo-linha">
          <span>Senha da Sala</span>
          <input className="ec-campo" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" autoFocus maxLength={64} />
        </label>
        <div className="sl-campo-linha">
          <span>Entrar Como</span>
          <div className="ec-segmentos" role="group" aria-label="Entrar Como">
            {["jogador", "espectador"].map((p) => (
              <button key={p} type="button" className="ec-segmento" aria-pressed={papel === p} onClick={() => setPapel(p)}>{ROTULO_PAPEL[p]}</button>
            ))}
          </div>
        </div>
        {erro && <Aviso onFechar={() => setErro(null)}>{erro}</Aviso>}
        <div className="sl-acoes">
          <button type="submit" className="afty-botao" data-afty-tom="destaque" disabled={enviando || !senha || trancada}><DoorOpen aria-hidden="true" />Entrar na Sala</button>
        </div>
      </form>
    </Casca>
  );
}
