import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Crown, FileText, Swords, Users, X } from "lucide-react";

import { aplicarAddons, unirAddons } from "../../systems/afty/afty-addons";
import { Aviso, BarraCurta, Vazio } from "../../systems/afty/encontros/telas/pecas-encontro";
import FaixaDaLuta from "../../systems/afty/encontros/telas/FaixaDaLuta";
import { useFaixaDeLargura } from "../../systems/afty/encontros/telas/pecas-dados";
import AftyFicha from "../../systems/afty/ficha/AftyFicha";
import useCreatureStorage from "../../components/useCreatureStorage";
import { FASE, meusCombatentes } from "../sala-cliente";
import { ligarEspelho } from "../sala-espelho";
import { enviarFimDeTurno } from "../sala-jogador";
import { faixaDoJogador, nomesDosMembros, pedidosDoJogador } from "../sala-telas";
import EscolhaDeFichas from "./EscolhaDeFichas";
import PainelDaSala from "./PainelDaSala";
import { Avatar, PontoOnline } from "./PecasSala";
import { ARMAZEM_DO_GRUPO, ROTULO_PAPEL, rotaDoGrupo } from "./sala-ui-dados";
import { inventarioDoGrupo } from "../../systems/afty/encontros/listas";

/**
 * ============================================================
 * A TELA DO JOGADOR E DO ESPECTADOR NA SALA (etapa 7c, 2026-11-18)
 * ============================================================
 * Plano, "Tela do jogador": a PRÓPRIA Ficha G2 do jogador, com a faixa da luta grudada em cima (rodada, de quem é a vez, a
 * ordem que a RLS deixou ele ler e o Encerrar Meu Turno, que só acende na vez dele) e o painel da Sala ao lado (Colegas,
 * Criaturas, Pedidos, Histórico e Registro com o chat). Sem ficha aberta, a página é a lista das fichas dele para pôr na Sala.
 * O Espectador é o jogador sem ficha: a faixa e o painel, e nada que escreva na luta.
 *
 * ⚠ A FICHA É A DE VERDADE. Ela lê e grava pela loja da sessão, e o espelho (`sala-espelho.js`) liga essa sessão à linha do
 * banco. A Ficha nunca ganha o Encerrar Meu Turno nem o Em Combate dela aqui (`naSala`): o turno é do Mestre.
 *
 * ⚠ A FICHA DE COLEGA É SÓ LEITURA. Abre pela G2 embutida com a sessão que o banco deu e uma função que não grava nada.
 * ============================================================
 */

const AftyFichaG2 = lazy(() => import("../../systems/afty/ficha/AftyFichaG2"));

const naoGrava = () => {};
const larga = () => typeof window !== "undefined" && window.matchMedia?.("(min-width: 1180px)").matches;

function FichaDoColega({ retrato, combatente, minhas, onFechar }) {
  const dados = retrato.fichas?.[combatente];
  const ficha = dados?.ficha?.dados ?? null;
  const sessao = dados?.sessao?.dados ?? null;
  const nome = retrato.resumos?.[combatente]?.nome ?? ficha?.name ?? "Colega";
  const ref = useRef(null);
  const largura = useFaixaDeLargura(ref, [["estreita", 0], ["larga", 1120]]);
  // Os Addons da Ficha do colega entram junto com os meus (o registro é global): sem os meus, a minha Ficha mudaria de conta.
  useMemo(() => {
    if (!ficha) return;
    const { pacotes } = unirAddons([...minhas, ficha]);
    aplicarAddons(pacotes);
  }, [ficha, minhas]);
  return (
    <>
      <div className="afty-ficha ec-raiz sl-leitura">
        <FileText aria-hidden="true" /><span>Ficha de <b>{nome}</b></span><span className="afty-chip">Só Leitura</span>
        <button type="button" className="afty-botao" onClick={onFechar}><X aria-hidden="true" />Fechar a Ficha</button>
      </div>
      {ficha && sessao ? (
        <div ref={ref} className="ec-g2" data-largura={largura}>
          <Suspense fallback={null}>
            <AftyFichaG2 key={combatente} creature={ficha} sessao={sessao} onSessao={naoGrava} onVoltar={naoGrava} onEditar={naoGrava} />
          </Suspense>
        </div>
      ) : (
        <div className="afty-ficha ec-raiz sl-lobby"><Aviso>A Ficha de {nome} não chegou</Aviso></div>
      )}
    </>
  );
}

export default function TelaDoJogador({ cliente, retrato, grupo, personagens, onVoltar }) {
  const papel = retrato.eu?.papel;
  const ehJogador = papel === "jogador";
  const storage = useCreatureStorage(ARMAZEM_DO_GRUPO[grupo] ?? ARMAZEM_DO_GRUPO.site);
  const [erro, setErro] = useState(null);
  const [aberta, setAberta] = useState(null);
  const [colega, setColega] = useState(null);
  const [painelAberto, setPainelAberto] = useState(larga);
  const [enviando, setEnviando] = useState(false);

  /* O espelho lê as fichas do aparelho NA HORA, direto do inventário (revisão final, 2026-11-18): pela referência da lista do React,
     o evento `storage` chegava ao espelho antes de a lista ser relida, e a ficha editada noutra aba não subia. A ligação não precisa
     ser refeita a cada leitura. */
  useEffect(() => {
    if (!ehJogador) return undefined;
    const fichasDoAparelho = () => inventarioDoGrupo(grupo).fichas.filter((x) => x.tipo === "personagem").map((x) => x.ficha);
    const e = ligarEspelho(cliente, { fichasDoAparelho, aoErro: (x) => setErro(x?.codigo ?? "Falha na Sala") });
    const sair = () => { e.descarregar(); };
    window.addEventListener("pagehide", sair);
    return () => { window.removeEventListener("pagehide", sair); e.desligar(); };
  }, [cliente, ehJogador, grupo]);

  const meusResumos = meusCombatentes(retrato).filter((r) => r.tipo === "personagem");
  const meus = meusResumos
    .map((resumo) => ({ resumo, ficha: personagens.find((f) => String(resumo.combatente).startsWith(`pj:${f.id}`)) }))
    .filter((m) => m.ficha);
  const faixa = faixaDoJogador(retrato);
  const pedidos = pedidosDoJogador(retrato).recebidos.length;
  const fichaAberta = aberta ? personagens.find((f) => String(f.id) === String(aberta)) : null;
  const meuAberto = fichaAberta ? meus.find((m) => String(m.ficha.id) === String(fichaAberta.id)) : null;
  const meuCombatente = meuAberto?.resumo.combatente ?? meus[0]?.resumo.combatente ?? null;

  const encerrar = async () => {
    setEnviando(true);
    try { await enviarFimDeTurno(cliente, { combatente: faixa.vezId, rodada: faixa.rodada }); } catch (e) { setErro(e?.codigo ?? "Falha na Sala"); } finally { setTimeout(() => setEnviando(false), 1500); }
  };

  const botaoPainel = (
    <>
      {!fichaAberta && !colega && (
        <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar ao Grimório" title="Voltar ao Grimório"><ArrowLeft aria-hidden="true" /></button>
      )}
      <button type="button" className="afty-botao sl-botao-sala" aria-pressed={painelAberto} onClick={() => setPainelAberto((v) => !v)} aria-controls="painel-da-sala">
        <Users aria-hidden="true" />Sala{pedidos > 0 && <small title="Pedidos Pendentes">{pedidos}</small>}
      </button>
    </>
  );

  const principal = (() => {
    if (colega) return <FichaDoColega retrato={retrato} combatente={colega} minhas={personagens} onFechar={() => setColega(null)} />;
    if (fichaAberta) {
      return (
        <>
          {meus.length > 1 && (
            <div className="afty-ficha ec-raiz sl-trocar" role="group" aria-label="Minhas Fichas">
              {meus.map((m) => (
                <button key={m.resumo.combatente} type="button" className="ec-segmento" aria-pressed={String(m.ficha.id) === String(fichaAberta.id)} onClick={() => setAberta(String(m.ficha.id))}>
                  <span>{m.resumo.nome}</span>
                </button>
              ))}
            </div>
          )}
          <AftyFicha
            key={fichaAberta.id}
            creature={fichaAberta}
            naSala
            onVoltar={() => setAberta(null)}
            // A rota do grupo: a ficha de um jogador da Guilda mora em /EraDeOuro, e não em /Player.
            onEditar={() => window.open(rotaDoGrupo(grupo), "_blank", "noopener")}
            onSalvarTema={(aparencia) => storage.update(fichaAberta.id, { aparencia })}
            onSalvarInvocacoes={(invocacoes) => storage.update(fichaAberta.id, { invocacoes })}
            onSalvarEspinho={(espinho) => storage.update(fichaAberta.id, { espinho })}
            onSalvarFundamentosPerdidos={(fundamentosPerdidos) => storage.update(fichaAberta.id, { fundamentosPerdidos })}
            onSalvarPreferencias={(preferenciasFicha) => storage.update(fichaAberta.id, { preferenciasFicha })}
            onSalvarRecursoProprio={(recursoProprio) => storage.update(fichaAberta.id, { recursoProprio })}
            onSalvarPacotesAliados={(pacotesAliados) => storage.update(fichaAberta.id, { pacotesAliados })}
            onSalvarRecebidos={(pacotesRecebidos) => storage.update(fichaAberta.id, { pacotesRecebidos })}
          />
        </>
      );
    }
    return (
      <div className="afty-ficha ec-raiz sl-lobby">
        {ehJogador ? (
          <section className="afty-card ec-secao" aria-label="Minhas Fichas">
            <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><Users aria-hidden="true" />Minhas Fichas<small>{meus.length}</small></h2></div>
            <EscolhaDeFichas retrato={retrato} cliente={cliente} personagens={personagens} meus={meusResumos} onAbrirFicha={setAberta} onErro={setErro} />
          </section>
        ) : (
          <NaLuta faixa={faixa} />
        )}
        <Participantes retrato={retrato} />
      </div>
    );
  })();

  return (
    <div className="ec-com-faixa sl-jogador">
      <FaixaDaLuta dados={faixa} onEncerrar={encerrar} enviando={enviando} acoes={botaoPainel} />
      {(erro || retrato.fase === FASE.SEM_CONEXAO) && (
        <div className="afty-ficha ec-raiz sl-avisos">
          {retrato.fase === FASE.SEM_CONEXAO && <Aviso>Sem Conexão com a Sala</Aviso>}
          {erro && <Aviso onFechar={() => setErro(null)}>{erro}</Aviso>}
        </div>
      )}
      <div className="sl-corpo" data-painel={painelAberto ? "aberto" : "fechado"}>
        <div className="sl-principal" data-ficha={fichaAberta || colega ? "sim" : undefined}>{principal}</div>
        {painelAberto && (
          <div className="afty-ficha ec-raiz sl-painel-raiz" id="painel-da-sala">
            <PainelDaSala
              retrato={retrato} cliente={cliente} meus={meus} meuCombatente={meuCombatente} podePedir={ehJogador}
              abas={ehJogador ? ["colegas", "criaturas", "pedidos", "historico", "registro"] : ["colegas", "criaturas", "registro"]}
              onAbrirColega={(id) => { setColega(id); if (!larga()) setPainelAberto(false); }}
              onFechar={() => setPainelAberto(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* Quem não tem ficha (o Espectador) vê a ordem da luta no meio da página: a posição, o nome e a barra que o Mestre deixou ver. */
function NaLuta({ faixa }) {
  return (
    <section className="afty-card ec-secao" aria-label="Na Luta">
      <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><Swords aria-hidden="true" />Na Luta<small>{faixa.ordem.length}</small></h2></div>
      {faixa.ordem.length === 0 ? <Vazio icone={Swords} titulo="Ninguém na Luta Ainda" /> : (
        <ol className="sl-cartoes" aria-label="Ordem">
          {faixa.ordem.map((c) => (
            <li key={c.id} className="sl-cartao" data-vez={c.id === faixa.vezId ? "sim" : undefined}>
              <div className="sl-cartao-topo">
                <span className="ec-ini afty-valor" title="Posição na Ordem">{c.posicao}</span>
                <span className="sl-cartao-texto"><span className="sl-cartao-nome" title={c.nome}>{c.nome}</span></span>
                {c.id === faixa.vezId && <span className="afty-chip" data-afty-tom="destaque">Vez</span>}
              </div>
              {c.barra && c.barra.faixa == null && <BarraCurta tipo="pv" rotulo="PV" atual={c.barra.atual} max={c.barra.max} temp={c.barra.temp} />}
              {c.barra && c.barra.faixa != null && (
                <div className="sl-cartao-barras"><BarraCurta tipo="pv" rotulo="PV" atual={Math.round(c.barra.fracao * 100)} max={100} semNumero /><span className="sl-faixa-vida">{c.barra.rotulo}</span></div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Participantes({ retrato }) {
  const nomes = nomesDosMembros(retrato);
  const online = new Set(retrato.online ?? []);
  const ordem = { mestre: 0, jogador: 1, espectador: 2 };
  const membros = Object.values(retrato.membros ?? {}).filter((m) => !m.removido_em)
    .sort((a, b) => (ordem[a.papel] ?? 3) - (ordem[b.papel] ?? 3) || String(nomes[a.conta]).localeCompare(String(nomes[b.conta]), "pt-BR"));
  return (
    <section className="afty-card ec-secao" aria-label="Participantes">
      <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><Users aria-hidden="true" />Participantes<small>{membros.length}</small></h2></div>
      <ul className="sl-membros">
        {membros.map((m) => (
          <li key={m.conta} className="sl-membro">
            <Avatar url={m.avatar} nome={m.nome} />
            <span className="sl-membro-texto">
              <span className="ec-fila-nome" title={m.nome}>{m.nome}{m.conta === retrato.eu?.conta ? " (Você)" : ""}</span>
              <span className="ec-fila-meta">
                {m.papel === "mestre" ? <span className="ec-estado"><Crown aria-hidden="true" />Mestre</span> : <span>{ROTULO_PAPEL[m.papel]}</span>}
                <PontoOnline online={online.has(m.conta)} />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
