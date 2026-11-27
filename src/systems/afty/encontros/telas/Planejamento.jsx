import React, { useMemo, useState } from "react";
import { ArrowLeft, Dices, Play, Settings, Pencil, Trash2, Users, Swords, Plus } from "lucide-react";

import { TIPO, MOTOR, ehLigado } from "../modelo";
import { LADO } from "../afty-encontro";
import {
  Retrato, Aviso, CampoNumero, SeletorDeVisao, Trilha, Vazio,
} from "./pecas-encontro";
import { LADO_PECA, contagem } from "./pecas-dados";
import AdicionarCombatentes from "./AdicionarCombatentes";

/**
 * ============================================================
 * O PLANEJAMENTO (etapa 6a, 2026-11-17)
 * ============================================================
 * À esquerda o inventário do grupo (Personagens, Criaturas, Sem Ficha). À direita
 * a escalação agrupada por lado (D-23), com Mod, Iniciativa, Rolar, o lado e, nas
 * criaturas, a visão dos jogadores (nasce Oculta). O personagem entra do lado
 * Jogador. Uma ação de destaque só: Começar (D-20).
 *
 * Largura pelo `@container ec-plano` (limiar em px, porque a raiz tem 18 px):
 * aqui não mora Ficha G2, então o contêiner não prende painel fixo nenhum.
 * ============================================================
 */

const TIPO_ROTULO = (c) => (c.tipo === TIPO.PERSONAGEM ? "Personagem"
  : c.tipo === TIPO.MARCADOR ? "Sem Ficha" : c.motor === MOTOR.M252 ? "Criatura 2.5.2" : "Criatura Afty");

function LinhaDaEscalacao({ c, acoes, onRemover }) {
  const ficha = c.motor === MOTOR.M252 ? c.snapshot : c.ficha;
  const temIniciativa = c.iniciativa.rolagem > 0 || c.iniciativa.manual;
  return (
    <li className="ec-esc-linha">
      <div className="ec-esc-ident">
        <Retrato url={ficha?.portraitUrl} foco={ficha?.portraitFocus} nome={c.nome} tamanho="sm" />
        <span className="ec-esc-texto">
          <span className="ec-esc-nome" title={c.nome}>{c.nome}</span>
          <span className="ec-esc-meta">{TIPO_ROTULO(c)}</span>
        </span>
      </div>
      <div className="ec-esc-controles">
        <label className="ec-rotulado">
          <span>Mod.</span>
          <CampoNumero valor={c.iniciativa.mod} rotulo={`Modificador de Iniciativa de ${c.nome}`} onConfirmar={(v) => acoes.definirMod(c.id, v)} />
        </label>
        <label className="ec-rotulado">
          <span>Iniciativa</span>
          <CampoNumero
            valor={temIniciativa ? c.iniciativa.total : ""} rotulo={`Iniciativa de ${c.nome}`} placeholder="Vazia"
            data-manual={c.iniciativa.manual ? "sim" : undefined}
            onConfirmar={(v) => acoes.definirIniciativa(c.id, v)}
          />
        </label>
        <button type="button" className="afty-botao ec-icone" onClick={() => acoes.rolarUma(c.id)} aria-label={`Rolar a Iniciativa de ${c.nome}`} title="Rolar Iniciativa">
          <Dices aria-hidden="true" />
        </button>
        <span className="ec-rotulado">
          <span>Lado</span>
          <select className="ec-campo" value={c.flags.lado} onChange={(e) => acoes.definirLado(c.id, e.target.value)} aria-label={`Lado de ${c.nome}`}>
            {Object.values(LADO).map((l) => <option key={l} value={l}>{LADO_PECA[l].rotulo}</option>)}
          </select>
        </span>
        {c.tipo !== TIPO.PERSONAGEM && (
          <span className="ec-rotulado">
            <span>Visão</span>
            <SeletorDeVisao visao={c.visao} compacto onEscolher={(v) => acoes.definirVisao(c.id, v)} />
          </span>
        )}
        <button type="button" className="afty-botao ec-icone ec-remover" onClick={onRemover} aria-label={`Tirar ${c.nome}`} title={`Tirar ${c.nome}`}>
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

export default function Planejamento({ estado, onVoltar, onConfig, acoesSala = null, trilha = null }) {
  const { encontro, derivado, acoes, inventario } = estado;
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(encontro.nome);
  const confirmaNome = () => {
    const limpo = nome.trim();
    if (limpo && limpo !== encontro.nome) acoes.renomear(limpo);
    setEditandoNome(false);
  };
  const naLuta = useMemo(() => new Set(encontro.combatentes.filter(ehLigado).map((c) => String(c.fichaRef.id))), [encontro.combatentes]);
  const porLado = useMemo(() => {
    const out = { jogador: [], aliado: [], inimigo: [] };
    for (const c of derivado.ordem) (out[c.flags.lado] ?? out.inimigo).push(c);
    return out;
  }, [derivado.ordem]);
  const criaturas = encontro.combatentes.filter((c) => c.tipo !== TIPO.PERSONAGEM).length;
  // A conta da validação do modelo (`validarInicio`), escrita aqui em singular e plural certos (D-58).
  const semIniciativa = encontro.combatentes.filter((c) => c.iniciativa.rolagem === 0 && !c.iniciativa.manual).length;

  return (
    <div className="ec-plano-pagina">
      <header className="ec-topo">
        {!trilha && <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar aos Encontros" title="Voltar aos Encontros"><ArrowLeft aria-hidden="true" /></button>}
        <div className="ec-topo-titulo">
          <Trilha itens={trilha} />
          {editandoNome ? (
            <input
              className="ec-campo ec-titulo-campo" autoFocus value={nome} aria-label="Nome do Encontro"
              onChange={(e) => setNome(e.target.value)} onBlur={confirmaNome}
              onKeyDown={(e) => { if (e.key === "Enter") confirmaNome(); if (e.key === "Escape") { setNome(encontro.nome); setEditandoNome(false); } }}
            />
          ) : (
            <button type="button" className="ec-titulo-botao" onClick={() => { setNome(encontro.nome); setEditandoNome(true); }} aria-label="Renomear o Encontro">
              <h1 className="ec-titulo" title={encontro.nome}>{encontro.nome}</h1><Pencil aria-hidden="true" />
            </button>
          )}
          <p className="ec-subtitulo"><span>Planejando</span><span>{contagem(derivado.total, "Combatente", "Combatentes")}</span></p>
        </div>
        <div className="ec-topo-acoes">
          {acoesSala}
          <button type="button" className="afty-botao" onClick={() => acoes.rolarTodas(true)} disabled={!derivado.total}><Dices aria-hidden="true" />Rolar Vazias</button>
          <button type="button" className="afty-botao" onClick={() => acoes.rolarTodas(false)} disabled={!derivado.total}><Dices aria-hidden="true" />Rolar Todas</button>
          <button type="button" className="afty-botao ec-icone" onClick={onConfig} aria-label="Configurações do Encontro" title="Configurações do Encontro"><Settings aria-hidden="true" /></button>
          <button type="button" className="afty-botao" data-afty-tom="destaque" onClick={acoes.comecar} disabled={!derivado.validacao.valido}><Play aria-hidden="true" />Começar</button>
        </div>
      </header>

      <div className="ec-plano-caixa"><main className="ec-plano">
        <section className="afty-card ec-secao ec-plano-adicionar" aria-label="Adicionar ao Encontro">
          <div className="ec-secao-topo"><h2 className="afty-card-titulo" data-afty-linha><Plus aria-hidden="true" />Adicionar</h2></div>
          <AdicionarCombatentes
            inventario={inventario} naLuta={naLuta}
            onAdicionarFicha={(entrada, op) => acoes.adicionarFicha(entrada, op)}
            onAdicionarMarcador={(m) => acoes.adicionarMarcador(m)}
          />
        </section>

        <section className="afty-card ec-secao ec-plano-escalacao" aria-label="Escalação">
          <div className="ec-secao-topo">
            <h2 className="afty-card-titulo" data-afty-linha><Swords aria-hidden="true" />Escalação<small>{derivado.total}</small></h2>
            {criaturas > 0 && (
              <span className="ec-rotulado ec-rotulado-linha">
                <span>Visão de Todas</span>
                <SeletorDeVisao visao={null} compacto onEscolher={(v) => acoes.definirVisaoDeTodas(v)} rotulo="Visão de Todas as Criaturas" />
              </span>
            )}
          </div>
          {semIniciativa > 0 && <Aviso>{contagem(semIniciativa, "Combatente sem Iniciativa", "Combatentes sem Iniciativa")}</Aviso>}
          {derivado.divergencias?.length > 0 && (
            <Aviso>{derivado.divergencias.length === 1 ? `${derivado.divergencias[0].nome} em duas versões, vale a ${derivado.divergencias[0].versoes[0]}` : `${derivado.divergencias.length} Addons em versões diferentes`}</Aviso>
          )}
          {derivado.total === 0 ? (
            <Vazio icone={Users} titulo="Nenhum Combatente na Escalação" />
          ) : (
            ["jogador", "aliado", "inimigo"].map((lado) => porLado[lado].length > 0 && (
              <div key={lado} className="ec-esc-grupo">
                <h3 className="ec-esc-grupo-titulo">{LADO_PECA[lado].plural}<small>{porLado[lado].length}</small></h3>
                <ul className="ec-esc-lista">
                  {porLado[lado].map((c) => <LinhaDaEscalacao key={c.id} c={c} acoes={acoes} onRemover={() => acoes.remover(c.id)} />)}
                </ul>
              </div>
            ))
          )}
        </section>
      </main></div>
    </div>
  );
}
