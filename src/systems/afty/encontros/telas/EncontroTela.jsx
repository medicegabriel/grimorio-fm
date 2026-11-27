import React, { useEffect, useState } from "react";
import { ArrowLeft, Copy, Skull, RotateCcw, Trophy, ScrollText, Settings, Inbox, Sparkles } from "lucide-react";

import "../../ficha/ficha.css";
import "../encontro-g2.css";
import useEncontro from "../usar-encontro";
import { ENCONTRO_STATUS } from "../afty-encontro";
import { TIPO, MOTOR } from "../modelo";
import { Aviso, Dialogo, Confirmar, Retrato, RotuloLado, Trilha, Vazio } from "./pecas-encontro";
import { contagem } from "./pecas-dados";
import LinhasDoRegistro from "./LinhasDoRegistro";
import { linhasDoFinalizado } from "../../../../nuvem/sala-telas";
import Planejamento from "./Planejamento";
import LutaDoMestre, { ListaDoRegistro } from "./LutaDoMestre";

/**
 * ============================================================
 * UM ENCONTRO NA TELA: o roteador por status (etapa 6a, 2026-11-17)
 * ============================================================
 * Planejando, Em Combate e Finalizado, mais as Configurações do Encontro e os
 * avisos de topo (falha de gravação fica até a pessoa ver, D-73). A raiz é
 * `.afty-ficha` sem tema (os tokens do padrão) mais `.ec-raiz`, que é onde os
 * diálogos entram por portal.
 * ============================================================
 */

/* ---------- configurações ---------- */

function Interruptor({ ligado, onMudar, rotulo, desabilitado = false, chip = null }) {
  return (
    <div className="ec-config-linha" data-desabilitado={desabilitado ? "sim" : undefined}>
      <span className="ec-config-rotulo">{rotulo}{chip}</span>
      <button type="button" role="switch" aria-checked={!!ligado} className="ec-interruptor" disabled={desabilitado} onClick={() => onMudar?.(!ligado)} aria-label={rotulo}>
        <span className="ec-interruptor-bola" aria-hidden="true" />
      </button>
    </div>
  );
}

/* O lugar das automações da Fase 2 (plano aprovado, "Depois"): o Mestre liga por Encontro, o jogador desliga nas
   próprias rolagens. Nenhuma existe ainda, e por isso aparecem apagadas, sem sumir do lugar (o estado Indisponível). */
const AUTOMACOES_FUTURAS = [
  "Rolar Contra a Defesa", "Dano por Tipo pelas Defesas", "Área em Vários Alvos", "Buffs em Aliados", "Confirmar Antes com Desfazer",
];

export function ConfiguracoesDoEncontro({ encontro, acoes, onFechar }) {
  return (
    <Dialogo titulo="Configurações do Encontro" icone={Settings} onFechar={onFechar} largura="30rem"
      rodape={<button type="button" className="afty-botao" onClick={onFechar} data-foco-inicial>Fechar</button>}>
      <section className="ec-config-grupo" aria-label="Pedidos">
        <h3 className="ec-config-titulo"><Inbox aria-hidden="true" />Pedidos</h3>
        <Interruptor rotulo="Aceitar Sozinho" ligado={encontro.config?.aceitarSozinho} onMudar={(v) => acoes.configurar("aceitarSozinho", v)} />
      </section>
      <section className="ec-config-grupo" aria-label="Automação">
        <h3 className="ec-config-titulo"><Sparkles aria-hidden="true" />Automação</h3>
        {AUTOMACOES_FUTURAS.map((r) => (
          <Interruptor key={r} rotulo={r} ligado={false} desabilitado chip={<span className="afty-chip">Em Breve</span>} />
        ))}
      </section>
    </Dialogo>
  );
}

/* ---------- finalizado ---------- */

function Finalizado({ estado, onVoltar, onDuplicar, trilha = null }) {
  const { encontro, derivado, acoes } = estado;
  // O Encontro Finalizado de quem esteve numa Sala como jogador ou espectador é só para ler: reabrir a luta é do Mestre.
  const soLeitura = !!encontro.sala?.papel && encontro.sala.papel !== "mestre";
  // O Encontro que veio de uma Sala guarda o Registro dela (com o chat), e é ele que se lê aqui.
  const linhasSala = linhasDoFinalizado(encontro);
  return (
    <div className="ec-plano-pagina">
      <header className="ec-topo">
        {!trilha && <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar aos Encontros" title="Voltar aos Encontros"><ArrowLeft aria-hidden="true" /></button>}
        <div className="ec-topo-titulo">
          <Trilha itens={trilha} />
          <h1 className="ec-titulo" title={encontro.nome}>{encontro.nome}</h1>
          <p className="ec-subtitulo"><span>Finalizado</span>{encontro.sala?.codigo && <span>Sala {encontro.sala.codigo}</span>}<span>{contagem(encontro.rodada, "Rodada", "Rodadas")}</span><span>{contagem(derivado.abatidos, "Abatido", "Abatidos")}</span></p>
        </div>
        <div className="ec-topo-acoes">
          <button type="button" className="afty-botao" onClick={onDuplicar}><Copy aria-hidden="true" />Duplicar</button>
          {!soLeitura && <button type="button" className="afty-botao" onClick={acoes.levantarTodos} disabled={!derivado.abatidos}><Skull aria-hidden="true" />Levantar Todos</button>}
          {!soLeitura && <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={acoes.reabrir}><RotateCcw aria-hidden="true" />Reabrir</button>}
        </div>
      </header>
      <div className="ec-plano-caixa"><main className="ec-plano">
        <section className="afty-card ec-secao" aria-label="Resumo">
          <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><Trophy aria-hidden="true" />Resumo<small>{derivado.total}</small></h2></div>
          {derivado.total === 0 ? <Vazio titulo="Nenhum Combatente" /> : (
            <ul className="ec-esc-lista">
              {derivado.ordem.map((c) => {
                const r = derivado.resumos[c.id];
                const ficha = c.motor === MOTOR.M252 ? c.snapshot : c.ficha;
                return (
                  <li key={c.id} className="ec-esc-linha" data-fora={c.flags.abatido ? "abatido" : undefined}>
                    <div className="ec-esc-ident">
                      <Retrato url={ficha?.portraitUrl} foco={ficha?.portraitFocus} nome={c.nome} tamanho="sm" />
                      <span className="ec-esc-texto">
                        <span className="ec-esc-nome" title={c.nome}>{c.nome}</span>
                        <span className="ec-esc-meta"><RotuloLado lado={c.flags.lado} /></span>
                      </span>
                    </div>
                    <span className="ec-fim-estado afty-base">
                      {c.flags.abatido ? <span className="ec-estado"><Skull aria-hidden="true" />Abatido</span>
                        : r && c.tipo !== TIPO.MARCADOR ? <>PV <b className="afty-valor">{r.pv}</b><small>/{r.pvMax}</small></> : <span className="ec-esc-meta">Sem Ficha</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="afty-card ec-secao" aria-label="Registro">
          <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><ScrollText aria-hidden="true" />Registro<small>{linhasSala ? linhasSala.length : encontro.log.length}</small></h2></div>
          {linhasSala ? <LinhasDoRegistro linhas={linhasSala} /> : <ListaDoRegistro log={encontro.log} />}
        </section>
      </main></div>
    </div>
  );
}

/* ---------- a tela ---------- */

/* `sala` (etapa 7b): o Encontro ligado a uma Sala online. `{ fonte, autor, aoExecutar, aoEstado }` vão para o gancho, e
   `aoEstado(estado)` recebe o estado do gancho a cada render, para a ligação da Sala publicar o que mudou. Na 7c a `sala` leva
   também `acoesTopo` (o botão da Sala no cabeçalho), `avisos` (a Sala sem conexão, a escrita que desistiu) e `painel` (a aba Sala
   do Registro). `acoesSala` é o botão Abrir Sala de um Encontro que ainda não tem Sala, montado pelo `App.jsx`. */
/* `trilha` (rework, etapa 1): os links do cabeçalho (rota e lista), no lugar da seta de voltar. A Sala não passa trilha e
   fica com a seta. */
export default function EncontroTela({ encontroId, lista, onVoltar, onDuplicar, onAtualizarBiblioteca = null, namespaceDaBiblioteca = null, sala = null, acoesSala = null, trilha = null }) {
  const estado = useEncontro(encontroId, lista, {
    onAtualizarBiblioteca, namespaceDaBiblioteca,
    ...(sala ? { fonte: sala.fonte, autor: sala.autor, aoExecutar: sala.aoExecutar } : {}),
  });
  const aoEstado = sala?.aoEstado;
  useEffect(() => { aoEstado?.(estado); });
  const [config, setConfig] = useState(false);
  const [encerrar, setEncerrar] = useState(false);
  const { encontro, acoes, aviso, limparAviso } = estado;

  if (!encontro) {
    return (
      <div className="afty-ficha ec-raiz" data-tela="nao-encontrado">
        <div className="ec-centro">
          <Vazio icone={ScrollText} titulo="Encontro Não Encontrado">
            <button type="button" className="afty-botao" onClick={onVoltar}><ArrowLeft aria-hidden="true" />Voltar aos Encontros</button>
          </Vazio>
        </div>
      </div>
    );
  }

  const avisos = (
    <div className="ec-avisos">
      {lista.semGravar && <Aviso papel="alert">Não Foi Possível Gravar: o que mudar agora se perde ao recarregar</Aviso>}
      {lista.ilegivel && <Aviso papel="alert">A Lista de Encontros está ilegível e ficou só para leitura</Aviso>}
      {aviso && <Aviso onFechar={limparAviso}>{aviso.texto}</Aviso>}
      {sala?.avisos}
      {encontro?.fundamentosSemGravar?.length > 0 && (
        <Aviso>Perda do Fundamento Pendente na Biblioteca: {encontro.fundamentosSemGravar.map((f) => `${f.nome} (${f.motivo})`).join(", ")}</Aviso>
      )}
    </div>
  );

  const abrirConfig = () => setConfig(true);
  let tela;
  if (encontro.status === ENCONTRO_STATUS.ATIVO) {
    tela = <LutaDoMestre estado={estado} onVoltar={onVoltar} onConfig={abrirConfig} onEncerrar={() => setEncerrar(true)} acoesSala={sala?.acoesTopo ?? acoesSala} painelSala={sala?.painel ?? null} trilha={trilha} />;
  } else if (encontro.status === ENCONTRO_STATUS.FINALIZADO) {
    tela = <Finalizado estado={estado} onVoltar={onVoltar} onDuplicar={() => onDuplicar?.(encontro.id)} trilha={trilha} />;
  } else {
    tela = <Planejamento estado={estado} onVoltar={onVoltar} onConfig={abrirConfig} acoesSala={sala?.acoesTopo ?? acoesSala} trilha={trilha} />;
  }

  return (
    <div className="afty-ficha ec-raiz" data-status={encontro.status}>
      {avisos}
      {tela}
      {config && <ConfiguracoesDoEncontro encontro={encontro} acoes={acoes} onFechar={() => setConfig(false)} />}
      {encerrar && (
        <Confirmar titulo="Encerrar o Encontro?" rotulo="Encerrar" onCancelar={() => setEncerrar(false)} onConfirmar={() => { setEncerrar(false); acoes.encerrar(); }}>
        </Confirmar>
      )}
    </div>
  );
}

