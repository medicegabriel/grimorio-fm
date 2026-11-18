/* A ROTA /Sala/<código> (Encontro Unificado, etapas 7b e 7c, 2026-11-18).

   Esta página só decide QUAL tela mostrar e é o único lugar que abre o cliente da Sala (`abrirCliente`) e liga o espelho. As
   telas moram em `sala-ui/`:

     sem conta              Login (Google ou Discord, a volta do login cai neste mesmo endereço)
     com conta, de fora     FormularioDeEntrada (senha e papel)
     Mestre que criou       o Encontro dele (as telas da 6a) com o botão Sala, os controles e a aba Sala do Registro
     jogador e espectador   TelaDoJogador (a Ficha G2 com a faixa da luta e o painel da Sala)
     Sala fechada           o Encontro Finalizado, com o Registro (o Mestre e quem estava presente já o têm na lista)

   `/Sala/Nova?encontro=<id>&grupo=<grupo>` abre a janela Abrir Sala de um Encontro do Mestre (o botão do cabeçalho do Encontro
   é a porta de todo dia, e este endereço serve a quem chega por link). */

import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Users } from "lucide-react";

import { nuvemAtiva } from "./nuvem-config";
import { entrar, lerEstadoNuvem, ouvirNuvem } from "./nuvem-sync";
import * as rede from "./sala-rede";
import { abrirCliente, FASE } from "./sala-cliente";
import { useSalaDoEncontro } from "./sala-encontro";
import { gravarFinalizadoDoMembro, idDoFinalizado, recuperarSalasFechadas } from "./sala-fechamento";
import useListaDeEncontros from "../systems/afty/encontros/usar-lista-encontros";
import EncontroTela from "../systems/afty/encontros/telas/EncontroTela";
import { Aviso, Vazio } from "../systems/afty/encontros/telas/pecas-encontro";
import { inventarioDoGrupo } from "../systems/afty/encontros/listas";
import { AbrirSalaDialogo } from "./sala-ui/AbrirSala";
import ControlesDaSala from "./sala-ui/ControlesDaSala";
import { FormularioDeEntrada, Login } from "./sala-ui/EntradaNaSala";
import { RegistroDaSala } from "./sala-ui/PainelDaSala";
import { Casca } from "./sala-ui/PecasSala";
import TelaDoJogador from "./sala-ui/TelaDoJogador";

const useRetrato = (cliente) => useSyncExternalStore(cliente.ouvir, cliente.ler);

const personagensDoGrupo = (grupo) => inventarioDoGrupo(grupo).fichas.filter((e) => e.tipo === "personagem").map((e) => e.ficha);

/* ---------- abrir uma Sala para um Encontro (o endereço /Sala/Nova) ---------- */

function NovaSala({ grupo, encontroId, onVoltar }) {
  const lista = useListaDeEncontros(grupo);
  return (
    <Casca titulo="Abrir Sala" onVoltar={onVoltar}>
      {encontroId ? <AbrirSalaDialogo lista={lista} encontroId={encontroId} onFechar={onVoltar} /> : <Aviso>Escolha o Encontro pelo Botão Abrir Sala</Aviso>}
    </Casca>
  );
}

/* ---------- o Mestre ---------- */

function MestreNaSala({ cliente, lista, encontroId, onVoltar }) {
  const { sala, fechar, retrato, falhas, tentarDeNovo } = useSalaDoEncontro({ cliente, lista, encontroId });
  const [controles, setControles] = useState(false);
  const online = new Set(retrato.online ?? []);
  const membros = Object.values(retrato.membros ?? {}).filter((m) => !m.removido_em);

  const acoesTopo = (
    <>
      <button type="button" className="afty-botao sl-botao-sala" onClick={() => setControles(true)} aria-haspopup="dialog" title={`Sala ${retrato.sala?.codigo ?? ""}`}>
        <Users aria-hidden="true" />Sala <b>{retrato.sala?.codigo ?? ""}</b><small>{membros.filter((m) => online.has(m.conta)).length}/{membros.length}</small>
      </button>
    </>
  );
  const avisos = (
    <>
      {retrato.fase === FASE.SEM_CONEXAO && <Aviso>Sem Conexão com a Sala</Aviso>}
      {falhas.length > 0 && (
        <Aviso papel="alert" acao={<button type="button" className="afty-botao" onClick={tentarDeNovo}>Tentar de Novo</button>}>
          Não Foi Possível Gravar na Sala: {falhas.map((f) => f.onde).join(", ")}
        </Aviso>
      )}
    </>
  );
  const painel = <RegistroDaSala retrato={retrato} cliente={cliente} podeEscrever comEscondida />;

  return (
    <>
      <EncontroTela
        encontroId={encontroId} lista={lista} onVoltar={onVoltar} onDuplicar={() => {}}
        sala={{ ...sala, acoesTopo, avisos, painel }}
      />
      {controles && <ControlesDaSala retrato={retrato} cliente={cliente} onFechar={() => setControles(false)} onFecharSala={fechar} />}
    </>
  );
}

/* ---------- a Sala fechada ---------- */

function SalaFechada({ retrato, lista, onVoltar }) {
  const salaId = retrato.sala?.id ?? retrato.salaId;
  const encontro = lista.encontros.find((e) => e.id === idDoFinalizado(salaId) || e.sala?.id === salaId) ?? null;
  if (encontro) return <EncontroTela encontroId={encontro.id} lista={lista} onVoltar={onVoltar} onDuplicar={() => {}} />;
  return (
    <Casca titulo={retrato.sala?.nome ?? "Sala"} onVoltar={onVoltar}>
      <Vazio titulo="Sala Fechada"><button type="button" className="afty-botao" onClick={onVoltar}>Voltar ao Grimório</button></Vazio>
    </Casca>
  );
}

/* Quem abre o link de uma Sala que já fechou (e não estava lá no fechamento): o Encontro Finalizado dele é recuperado agora, com o
   Registro, e aparece aqui. A recuperação é a mesma do login (`recuperarSalasFechadas`) e não repete o que já está na lista. */
function SalaFechadaDeFora({ salaId, grupo, codigo, onVoltar }) {
  const lista = useListaDeEncontros(grupo);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    let vivo = true;
    recuperarSalasFechadas({ importarPorGrupo: { [grupo]: lista.importar } }).catch(() => {}).finally(() => { if (vivo) setPronto(true); });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo]);
  const encontro = lista.encontros.find((e) => e.id === idDoFinalizado(salaId) || e.sala?.id === salaId) ?? null;
  if (encontro) return <EncontroTela encontroId={encontro.id} lista={lista} onVoltar={onVoltar} onDuplicar={() => {}} />;
  return (
    <Casca titulo={`Sala ${codigo}`} onVoltar={onVoltar}>
      {pronto ? <Aviso tom="info">Sala Fechada</Aviso> : <Vazio titulo="Recuperando o Registro" />}
    </Casca>
  );
}

/* ---------- dentro da Sala ---------- */

function DentroDaSala({ salaId, grupo, onVoltar }) {
  const aoFecharRef = useRef(null);
  /* O cliente nasce no efeito (e não num useMemo): o StrictMode do dev monta, desmonta e monta de novo, e o desligar do
     meio fecharia o cliente que a tela segue usando. */
  const [cliente, setCliente] = useState(null);
  useEffect(() => {
    const c = abrirCliente(salaId, { aoFechar: (x) => aoFecharRef.current?.(x) });
    setCliente(c);
    // Só no dev: o roteiro de prova (Playwright) lê o retrato por aqui.
    if (import.meta.env?.DEV) window.__salaCliente = c;
    return () => { c.desligar(); };
  }, [salaId]);
  const lista = useListaDeEncontros(grupo);
  const encontroDoMestre = lista.encontros.find((e) => e.sala?.id === salaId && e.sala?.segredo) ?? null;

  /* O fechamento com o aparelho aberto. O Mestre que criou grava pelo `fechar` da ligação, o resto aqui. */
  useLayoutEffect(() => {
    aoFecharRef.current = (c) => {
      if (encontroDoMestre) return;
      // Pela lista montada: gravar direto na chave seria regravado por ela depois.
      gravarFinalizadoDoMembro(c.ler(), grupo, { importar: lista.importar });
    };
  });

  if (!cliente) return <Casca titulo="Sala" onVoltar={onVoltar}><Vazio titulo="Conectando" /></Casca>;
  return <DentroDoCliente cliente={cliente} encontroDoMestre={encontroDoMestre} lista={lista} grupo={grupo} onVoltar={onVoltar} />;
}

function DentroDoCliente({ cliente, encontroDoMestre, lista, grupo, onVoltar }) {
  const retrato = useRetrato(cliente);
  // As fichas do aparelho, relidas quando outra aba as grava (a Ficha editada sobe pelo espelho).
  const [versaoInv, setVersaoInv] = useState(0);
  useEffect(() => {
    const f = () => setVersaoInv((v) => v + 1);
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const personagens = React.useMemo(() => personagensDoGrupo(grupo), [grupo, versaoInv]);

  if (retrato.fase === FASE.ERRO) return <Casca titulo="Sala" onVoltar={onVoltar}><Aviso>{retrato.erro ?? "Falha na Sala"}</Aviso></Casca>;
  if (retrato.fase === FASE.REMOVIDO) return <Casca titulo="Sala" onVoltar={onVoltar}><Aviso>Removido da Sala</Aviso></Casca>;
  if (!retrato.eu?.papel) return <Casca titulo="Sala" onVoltar={onVoltar}><Vazio titulo="Conectando" /></Casca>;
  if (retrato.fase === FASE.FECHADA) return <SalaFechada retrato={retrato} lista={lista} onVoltar={onVoltar} />;
  if (retrato.eu.papel === "mestre" && encontroDoMestre) {
    return <MestreNaSala cliente={cliente} lista={lista} encontroId={encontroDoMestre.id} onVoltar={onVoltar} />;
  }
  return <TelaDoJogador cliente={cliente} retrato={retrato} grupo={grupo} personagens={personagens} onVoltar={onVoltar} />;
}

/* ---------- a rota ---------- */

export default function SalaPagina({ codigo: codigoBruto, onVoltar }) {
  const nuvem = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  const codigo = String(codigoBruto ?? "").toUpperCase();
  const [info, setInfo] = useState(null); // { salaId, grupo, papel, trancada, nome, ausente, fechada }
  const [erro, setErro] = useState(null);
  const logado = !!nuvem.usuario;
  const novo = codigo === "NOVA";

  useEffect(() => {
    if (!logado || novo) return undefined;
    let vivo = true;
    (async () => {
      try {
        const ver = await rede.verSala(codigo);
        if (ver?.papel) {
          const r = await rede.entrarNaSala(codigo, null, ver.papel === "espectador" ? "espectador" : "jogador");
          if (vivo) setInfo({ salaId: r.sala_id, grupo: ver.grupo, papel: r.papel });
          return;
        }
        if (ver) { if (vivo) setInfo({ grupo: ver.grupo, trancada: ver.trancada, nome: ver.nome }); return; }
        // Fechada (ou não existe): quem era membro vê que fechou.
        const minha = (await rede.minhasSalas()).find((s) => s.codigo === codigo);
        if (vivo) setInfo(minha ? { salaId: minha.sala_id, grupo: minha.grupo, fechada: true } : { ausente: true });
      } catch (e) {
        if (vivo) setErro(e?.codigo ?? "Falha na Sala");
      }
    })();
    return () => { vivo = false; };
  }, [logado, codigo, novo]);

  if (!nuvemAtiva) return <Casca titulo="Sala" onVoltar={onVoltar}><Aviso>Nuvem Desligada</Aviso></Casca>;
  if (!logado) {
    if (["sincronizando", "entrando"].includes(nuvem.fase)) return <Casca titulo="Sala" onVoltar={onVoltar}><Vazio titulo="Entrando" /></Casca>;
    return <Login codigo={novo ? null : codigo} onVoltar={onVoltar} entrar={entrar} />;
  }
  if (novo) {
    const q = new URLSearchParams(location.search);
    return <NovaSala grupo={q.get("grupo") || "site"} encontroId={q.get("encontro")} onVoltar={onVoltar} />;
  }
  if (erro) return <Casca titulo="Sala" onVoltar={onVoltar}><Aviso>{erro}</Aviso></Casca>;
  if (!info) return <Casca titulo={`Sala ${codigo}`} onVoltar={onVoltar}><Vazio titulo="Procurando a Sala" /></Casca>;
  if (info.ausente) return <Casca titulo={`Sala ${codigo}`} onVoltar={onVoltar}><Aviso>Sala Ausente</Aviso></Casca>;
  if (info.fechada) return <SalaFechadaDeFora salaId={info.salaId} grupo={info.grupo} codigo={codigo} onVoltar={onVoltar} />;
  if (!info.salaId) {
    return <FormularioDeEntrada codigo={codigo} nome={info.nome} trancada={info.trancada} onVoltar={onVoltar} onEntrou={(salaId) => setInfo({ ...info, salaId })} />;
  }
  return <DentroDaSala salaId={info.salaId} grupo={info.grupo} onVoltar={onVoltar} />;
}
