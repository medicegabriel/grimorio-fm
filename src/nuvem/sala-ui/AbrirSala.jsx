import React, { useState, useSyncExternalStore } from "react";
import { DoorOpen, LogIn } from "lucide-react";

import { nuvemAtiva } from "../nuvem-config";
import { entrar, lerEstadoNuvem, ouvirNuvem } from "../nuvem-sync";
import * as rede from "../sala-rede";
import { abrirSalaDoEncontro } from "../sala-encontro";
import { Aviso, Dialogo } from "../../systems/afty/encontros/telas/pecas-encontro";
import { CampoCopiavel } from "./PecasSala";
import { linkDaSala } from "./sala-ui-dados";

/**
 * ============================================================
 * ABRIR SALA NO ENCONTRO (etapa 7c, 2026-11-18)
 * ============================================================
 * O botão do cabeçalho do Encontro do Mestre (Planejamento e Luta). A tarefa única: pôr uma senha e receber o código e o
 * link para copiar. Sem conta, a janela pede a entrada com Google ou Discord (a mesma Conta do resto do site). O Encontro que
 * já tem Sala aberta abre direto no código e no link.
 *
 * Quem monta o botão é o `App.jsx`, por `lazy`, só com a Sala liberada (chave de teste enquanto o cadeado estiver posto) e a
 * nuvem ligada. A lista de Encontros não importa nada daqui.
 * ============================================================
 */

const senhaValida = (s) => s.length >= 4 && s.length <= 64;

export function AbrirSalaDialogo({ lista, encontroId, onFechar }) {
  const nuvem = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  const encontro = lista.encontros.find((e) => e.id === encontroId) ?? null;
  const salaAberta = encontro?.sala?.id && !encontro.sala.fechadaEm ? encontro.sala : null;
  const [senha, setSenha] = useState("");
  const [criada, setCriada] = useState(null);
  const [erro, setErro] = useState(null);
  const [criando, setCriando] = useState(false);
  const codigo = criada?.codigo ?? salaAberta?.codigo ?? null;

  const abrir = async (ev) => {
    ev.preventDefault();
    if (!senhaValida(senha) || criando) return;
    setCriando(true);
    setErro(null);
    try {
      const r = await abrirSalaDoEncontro({ lista, encontroId, senha, criarSala: rede.criarSala, verSala: rede.verSala });
      setCriada({ codigo: r.codigo });
      setSenha("");
    } catch (e) {
      setErro(e?.codigo ?? e?.message ?? "Falha ao Abrir");
    } finally {
      setCriando(false);
    }
  };

  let corpo;
  if (!nuvemAtiva) {
    corpo = <Aviso>Nuvem Desligada</Aviso>;
  } else if (!nuvem.usuario) {
    corpo = (
      <div className="sl-contas">
        <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={() => entrar("google")} data-foco-inicial><LogIn aria-hidden="true" />Entrar com Google</button>
        <button type="button" className="afty-botao" onClick={() => entrar("discord")}><LogIn aria-hidden="true" />Entrar com Discord</button>
      </div>
    );
  } else if (codigo) {
    corpo = (
      <div className="sl-codigo-bloco">
        <span className="sl-codigo" aria-label={`Código ${codigo}`}>{codigo}</span>
        <CampoCopiavel rotulo="Link" valor={linkDaSala(codigo)} />
        <CampoCopiavel rotulo="Código" valor={codigo} />
      </div>
    );
  } else {
    corpo = (
      <form className="sl-campo-linha" onSubmit={abrir} id="form-abrir-sala">
        <span>Senha da Sala</span>
        <input
          className="ec-campo" type="password" value={senha} autoComplete="new-password" data-foco-inicial maxLength={64}
          onChange={(e) => setSenha(e.target.value)} aria-label="Senha da Sala"
        />
      </form>
    );
  }

  return (
    <Dialogo
      titulo={codigo ? `Sala ${codigo}` : "Abrir Sala"} icone={DoorOpen} onFechar={onFechar} largura="30rem"
      rodape={(
        <>
          <button type="button" className="afty-botao" onClick={onFechar}>Fechar</button>
          {codigo ? (
            <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={() => location.assign(`/Sala/${codigo}`)}><DoorOpen aria-hidden="true" />Entrar na Sala</button>
          ) : nuvem.usuario && nuvemAtiva ? (
            <button type="submit" form="form-abrir-sala" className="afty-botao" data-afty-tom="destaque" disabled={!senhaValida(senha) || criando}><DoorOpen aria-hidden="true" />Abrir Sala</button>
          ) : null}
        </>
      )}
    >
      {erro && <Aviso onFechar={() => setErro(null)}>{erro}</Aviso>}
      {corpo}
    </Dialogo>
  );
}

/** O botão do cabeçalho. Sem Encontro, ou com o Encontro já Finalizado, não aparece. */
export default function BotaoAbrirSala({ lista, encontroId }) {
  const [aberto, setAberto] = useState(false);
  const encontro = lista.encontros.find((e) => e.id === encontroId) ?? null;
  if (!encontro || encontro.status === "finalizado") return null;
  const aberta = encontro.sala?.id && !encontro.sala.fechadaEm;
  return (
    <>
      <button type="button" className="afty-botao" onClick={() => setAberto(true)} aria-haspopup="dialog">
        <DoorOpen aria-hidden="true" />{aberta ? `Sala ${encontro.sala.codigo}` : "Abrir Sala"}
      </button>
      {aberto && <AbrirSalaDialogo lista={lista} encontroId={encontroId} onFechar={() => setAberto(false)} />}
    </>
  );
}
