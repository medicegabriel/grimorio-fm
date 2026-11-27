import React, { useMemo, useState } from "react";
import { Search, Plus, Minus, User, Swords, UserPlus, X, Check } from "lucide-react";

import { nivelDaFicha } from "../../afty-addons";
import { rotuloDoNivel, sistemaDaFicha } from "../../afty-sistema";
import { LADO } from "../afty-encontro";
import { Retrato, Vazio } from "./pecas-encontro";
import { LADO_PECA, contagem } from "./pecas-dados";

/**
 * ============================================================
 * ADICIONAR AO ENCONTRO: o inventário do grupo (etapa 6a)
 * ============================================================
 * Três abas, porque são três coisas diferentes: o PERSONAGEM entra ligado à ficha
 * dele (uma vez por Encontro), a CRIATURA entra como cópia (Goblin #1, #2, #3) e
 * o combatente SEM FICHA é só nome e iniciativa. A lista é o inventário da lista
 * de Encontros da rota (`inventarioDoGrupo`), já filtrado pela fronteira da chave.
 *
 * Serve ao planejamento e aos Reforços no meio da luta (`comIniciativa`).
 * ============================================================
 */

const ABAS = [
  { id: "personagem", rotulo: "Personagens", icone: User },
  { id: "criatura", rotulo: "Criaturas", icone: Swords },
  { id: "marcador", rotulo: "Sem Ficha", icone: UserPlus },
];

function nivelDe(entrada) {
  const f = entrada.ficha;
  if (entrada.motor === "252") return `ND ${f?.core?.nd ?? "?"}`;
  try { return `${rotuloDoNivel(sistemaDaFicha(f))} ${nivelDaFicha(f)}`; } catch { return ""; }
}

const livroDe = (entrada) => (entrada.motor === "252" ? "2.5.2" : entrada.tipo === "personagem" ? null : "Afty");

function Passo({ valor, onValor }) {
  return (
    <span className="ec-passo" role="group" aria-label="Quantidade">
      <button type="button" className="afty-passo" onClick={() => onValor(Math.max(1, valor - 1))} disabled={valor <= 1} aria-label="Uma a Menos" title="Uma a Menos"><Minus aria-hidden="true" /></button>
      <span className="ec-passo-num" aria-live="polite">{valor}</span>
      <button type="button" className="afty-passo" onClick={() => onValor(Math.min(20, valor + 1))} disabled={valor >= 20} aria-label="Uma a Mais" title="Uma a Mais"><Plus aria-hidden="true" /></button>
    </span>
  );
}

function LinhaDoInventario({ entrada, naLuta, onAdicionar }) {
  const [qtd, setQtd] = useState(1);
  const f = entrada.ficha;
  const ehPersonagem = entrada.tipo === "personagem";
  const livro = livroDe(entrada);
  return (
    <li className="ec-inv-linha">
      <Retrato url={f?.portraitUrl} foco={f?.portraitFocus} nome={f?.name} tamanho="sm" />
      <span className="ec-inv-texto">
        <span className="ec-inv-nome" title={f?.name}>{f?.name || "Sem Nome"}</span>
        <span className="ec-inv-meta">
          <span className="afty-base">{nivelDe(entrada)}</span>
          {livro && <span className="afty-chip">{livro}</span>}
        </span>
      </span>
      {!ehPersonagem && <Passo valor={qtd} onValor={setQtd} />}
      {ehPersonagem && naLuta ? (
        <button type="button" className="afty-botao ec-inv-botao" disabled aria-label={`${f?.name} Já Está na Luta`}>
          <Check aria-hidden="true" />Na Luta
        </button>
      ) : (
        <button type="button" className="afty-botao ec-inv-botao" onClick={() => { onAdicionar(entrada, { quantidade: qtd }); setQtd(1); }} aria-label={`Adicionar ${f?.name}`}>
          <Plus aria-hidden="true" />Adicionar
        </button>
      )}
    </li>
  );
}

function SemFicha({ onAdicionar }) {
  const [nome, setNome] = useState("");
  const [mod, setMod] = useState("");
  const [lado, setLado] = useState(LADO.JOGADOR);
  const pronto = nome.trim().length > 0;
  const cria = () => {
    if (!pronto) return;
    onAdicionar({ nome: nome.trim(), mod: Math.trunc(Number(mod) || 0), lado });
    setNome(""); setMod("");
  };
  return (
    <div className="ec-semficha">
      <label className="ec-rotulado">
        <span>Nome</span>
        <input className="ec-campo" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") cria(); }} placeholder="Nome do Combatente" />
      </label>
      <div className="ec-semficha-linha">
        <label className="ec-rotulado">
          <span>Mod. Iniciativa</span>
          <input className="ec-campo ec-campo-num" inputMode="numeric" value={mod} onChange={(e) => setMod(e.target.value.replace(/[^\d+-]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") cria(); }} placeholder="0" data-largura="larga" />
        </label>
        <span className="ec-rotulado">
          <span>Lado</span>
          <span className="ec-segmentos" role="group" aria-label="Lado">
            {Object.values(LADO).map((l) => {
              const P = LADO_PECA[l];
              const Icone = P.icone;
              return (
                <button key={l} type="button" className="ec-segmento" aria-pressed={lado === l} onClick={() => setLado(l)}>
                  <Icone aria-hidden="true" />{P.rotulo}
                </button>
              );
            })}
          </span>
        </span>
      </div>
      <button type="button" className="afty-botao" onClick={cria} disabled={!pronto}><Plus aria-hidden="true" />Adicionar</button>
    </div>
  );
}

export default function AdicionarCombatentes({ inventario, naLuta, onAdicionarFicha, onAdicionarMarcador, abaInicial = "personagem", iniciativa = null }) {
  const [aba, setAba] = useState(abaInicial);
  const [busca, setBusca] = useState("");
  const porTipo = useMemo(() => {
    const out = { personagem: [], criatura: [] };
    for (const e of inventario?.fichas ?? []) (out[e.tipo] ?? out.criatura).push(e);
    return out;
  }, [inventario]);
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (porTipo[aba] ?? []).filter((e) => !q || String(e.ficha?.name ?? "").toLowerCase().includes(q));
  }, [porTipo, aba, busca]);

  return (
    <div className="ec-adicionar">
      {iniciativa}
      <div className="ec-abas-mini" role="tablist" aria-label="O Que Adicionar">
        {ABAS.map((a) => {
          const Icone = a.icone;
          const n = a.id === "marcador" ? null : porTipo[a.id].length;
          return (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className="ec-aba-mini" onClick={() => setAba(a.id)}>
              <Icone aria-hidden="true" />{a.rotulo}{n != null && <small>{n}</small>}
            </button>
          );
        })}
      </div>

      {aba === "marcador" ? (
        <SemFicha onAdicionar={onAdicionarMarcador} />
      ) : (
        <>
          <label className="ec-busca">
            <Search aria-hidden="true" />
            <input
              type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape" && busca) { e.preventDefault(); setBusca(""); } }}
              placeholder={aba === "personagem" ? "Buscar Personagem" : "Buscar Criatura"}
              aria-label={aba === "personagem" ? "Buscar Personagem" : "Buscar Criatura"}
            />
            {busca && <button type="button" className="afty-passo" onClick={() => setBusca("")} aria-label="Limpar a Busca" title="Limpar a Busca"><X aria-hidden="true" /></button>}
          </label>
          {lista.length === 0 ? (
            <Vazio icone={aba === "personagem" ? User : Swords} titulo={
              porTipo[aba].length === 0
                ? (aba === "personagem" ? "Nenhum Personagem no Grimório" : "Nenhuma Criatura no Grimório")
                : "Nada com Esse Nome"
            } />
          ) : (
            <>
              <p className="ec-contagem">{contagem(lista.length, aba === "personagem" ? "Personagem" : "Criatura", aba === "personagem" ? "Personagens" : "Criaturas")}</p>
              <ul className="ec-inv-lista">
                {lista.map((e) => (
                  <LinhaDoInventario key={`${e.chave}:${e.ficha.id}`} entrada={e} naLuta={naLuta?.has(String(e.ficha.id))} onAdicionar={onAdicionarFicha} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
