/* ============================================================
   ABA PERÍCIAS DO G2 (prévia isolada, 2026-10-21; decisão 1A)
   ============================================================
   Um painel de testes: os seis atributos (o VALOR consulta as fontes, o MODIFICADOR rola o teste puro), as Jogadas de Ataque e os cinco
   Testes de Resistência lado a lado, e a lista COMPLETA de perícias em grade, com as personalizadas e os Ofícios. Nada aqui edita
   treino ou atributo: isso é do criador.

   Busca e filtro locais, com Todas por padrão (as destreinadas nunca somem sozinhas) e a contagem à vista quando há filtro. A busca
   global que aponta uma linha escondida pelo filtro limpa o filtro (ajuste no render) e realça a linha, sem rolar dado.
   O treino tem forma e palavra, e não só cor: ○ sem treino, ● Treinada, ◆ Mestre.

   Outros (aceite do autor, 21/10): as Manobras, Concentração, Fintar, Provocar, Teste de Morte e tudo que `derived.testes.manobras`
   trouxer moram aqui, numa seção própria entre os testes e a lista de perícias. Fica FORA do filtro de treino e da busca local, que são
   só da lista de perícias, então nenhum dos dois esconde um cartão. Os cartões são os que eram de Ações, sem mudança de conta ou verbo.
   ============================================================ */
import React, { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { AFTY_ATTRS } from "../../afty-schema";
import { semAcento } from "../ficha-conteudo";
import { Motivo, Rolar, Secao, Vazio } from "./pecas-mesa";
import { useDestaqueG2 } from "./usar-destaque-g2";
import { motivoDaRecusa } from "./rolagem-g2";
import { pedidoAtributo, pedidoManobra, pedidoTeste } from "./rolagens-acoes";

const ABREV = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.abbr]));
const NOME_ATTR = Object.fromEntries(AFTY_ATTRS.map((a) => [a.key, a.label]));
const TREINO = {
  mestre: { marca: "◆", rotulo: "Mestre" },
  treinado: { marca: "●", rotulo: "Treinada" },
};

function LinhaTeste({ chave, nome, atributo, atributoPadrao = null, bonus, textoBonus, dados, partes, prof, margem, partesMargemCritico, falha, minimoNatural, ataqueId, rolar, prova, avisar, destaque }) {
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const idMotivo = useId();
  const pedido = pedidoTeste({ nome, bonus, dados, margem, ataqueId, minimoNatural });
  const motivo = motivoDaRecusa(prova(pedido), pedido);
  const treino = TREINO[prof] ?? null;
  const trocado = atributoPadrao && atributo && atributoPadrao !== atributo;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-teste" data-afty-destacada={prof === "mestre" ? "sim" : "nao"}
      data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave} data-treino={prof ?? "nenhum"}>
      <span className="m-treino" title={treino?.rotulo ?? "Sem Treino"} aria-label={treino?.rotulo ?? "Sem Treino"}>{treino?.marca ?? "○"}</span>
      <span className="m-teste-nome">{nome}</span>
      <span className="m-teste-metas">
        {atributo && (
          <span className="m-meta m-atributo" data-trocado={trocado ? "sim" : undefined}
            title={trocado ? `${NOME_ATTR[atributo]}. Padrão: ${NOME_ATTR[atributoPadrao]}` : NOME_ATTR[atributo]}>
            {ABREV[atributo]}
          </span>
        )}
        {prof === "mestre" && <span className="m-chip">Mestre</span>}
        {falha?.length > 0 && <span className="m-chip" data-tom="aviso" title={`Falha automática: ${falha.join(", ")}`}>Falha</span>}
        {minimoNatural != null && <span className="m-chip" title="Mínimo do d20 natural">Mín. {minimoNatural}</span>}
        {margem != null && (
          <span className="m-meta">
            <NumeroComFontes className="m-meta-num" titulo="Margem de Crítico" valor={`Crít ${margem}`} partes={partesMargemCritico} total={margem} formatar={false} ancora="direita" />
          </span>
        )}
      </span>
      <Rolar valor={textoBonus ?? sinalDe(bonus)} partes={partes} total={textoBonus ?? sinalDe(bonus)} motivo={motivo} idMotivo={idMotivo} avisar={avisar}
        className="m-rolar-teste" onRolar={() => rolar(pedido)} />
      {motivo && <Motivo id={idMotivo} texto={motivo} />}
    </div>
  );
}

function Atributos({ derived, rolar, avisar, prova, destaque }) {
  return (
    <section className="afty-card m-atributos" aria-label="Atributos">
      {AFTY_ATTRS.map((a) => {
        const chave = `atributo:${a.key}`;
        const valor = derived.attrEff?.[a.key] ?? 0;
        const mod = derived.mods?.[a.key] ?? 0;
        const pedido = pedidoAtributo(a.label, mod);
        const motivo = motivoDaRecusa(prova(pedido), pedido);
        return <CelulaAtributo key={a.key} chave={chave} a={a} valor={valor} mod={mod} partes={derived.partesAtributo?.[a.key]} motivo={motivo} avisar={avisar} rolar={() => rolar(pedido)} destaque={destaque} />;
      })}
    </section>
  );
}
function CelulaAtributo({ chave, a, valor, mod, partes, motivo, avisar, rolar, destaque }) {
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  return (
    <span ref={raiz} id={`afty-item-${chave}`} className="afty-atributo m-atributo-celula" data-afty-atributo={a.key} data-afty-alvo={destaque?.chave === chave ? "sim" : undefined}>
      <span className="afty-atributo-rotulo m-atributo-rotulo" title={a.label}>{a.abbr}</span>
      <NumeroComFontes valor={valor} partes={partes} total={valor} formatar={false} className="afty-atributo-valor m-atributo-valor" titulo={a.label} />
      <Rolar valor={sinalDe(mod)} total={sinalDe(mod)} titulo={`Teste de ${a.label}`} motivo={motivo} avisar={avisar} className="m-rolar-mod" onRolar={rolar} />
    </span>
  );
}

/* Um cartão de Outros: o nome, a perícia usada e Executar/Resistir (ou o teste simples), pelos descritores de `rolagens-acoes.js`. */
function CartaoManobra({ m, rolar, prova, avisar, destaque }) {
  const chave = `manobra:${m.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const pedE = pedidoManobra(m, "executar");
  const pedR = m.resistir != null ? pedidoManobra(m, "resistir") : null;
  const motE = motivoDaRecusa(prova(pedE), pedE);
  const motR = pedR ? motivoDaRecusa(prova(pedR), pedR) : null;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-cartao" data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave}>
      <span className="m-cartao-nome">{m.nome}</span>
      {m.periciaUsada && <span className="m-meta">{m.periciaUsada}</span>}
      <span className="m-acoes">
        <Rolar rotulo={m.resistir != null ? "Executar" : null} valor={sinalDe(m.executar)} partes={m.partesExecutar} total={sinalDe(m.executar)} motivo={motE} avisar={avisar} onRolar={() => rolar(pedE)} />
        {pedR && <Rolar rotulo="Resistir" valor={sinalDe(m.resistir)} partes={m.partesResistir} total={sinalDe(m.resistir)} motivo={motR} avisar={avisar} onRolar={() => rolar(pedR)} />}
      </span>
    </div>
  );
}

const FILTROS = [
  { id: "todas", rotulo: "Todas", passa: () => true },
  { id: "treinadas", rotulo: "Treinadas", passa: (p) => p.prof === "treinado" || p.prof === "mestre" },
  { id: "mestre", rotulo: "Mestre", passa: (p) => p.prof === "mestre" },
];

export default function PericiasG2({ derived, rolar, prova, avisar, destaque = null }) {
  const { pericias = [], resistencias = [], ataques = [], manobras = [] } = derived.testes ?? {};
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const indice = useMemo(() => pericias.map((p) => ({ p, busca: semAcento(`${p.nome} ${NOME_ATTR[p.atributo] ?? ""} ${ABREV[p.atributo] ?? ""}`) })), [pericias]);
  const casa = (x) => {
    const partes = semAcento(termo).split(/\s+/).filter(Boolean);
    return partes.every((t) => x.busca.includes(t)) && (FILTROS.find((f) => f.id === filtro)?.passa(x.p) ?? true);
  };
  /* A busca global que aponta uma perícia escondida pelo filtro LIMPA o filtro, uma vez por busca (`seq`). Ajuste no render, sem efeito. */
  const [seqVisto, setSeqVisto] = useState(0);
  if (destaque?.seq && destaque.seq !== seqVisto) {
    setSeqVisto(destaque.seq);
    const alvo = indice.find((x) => `pericia:${x.p.id}` === destaque.chave);
    if (alvo && !casa(alvo)) { setTermo(""); setFiltro("todas"); }
  }
  const visiveis = indice.filter(casa).map((x) => x.p);
  const filtrando = !!termo.trim() || filtro !== "todas";
  const contagem = (f) => pericias.filter(f.passa).length;

  return (
    <div className="e-g2 m-aba m-pericias-aba" data-m-aba="pericias">
      <Atributos derived={derived} rolar={rolar} avisar={avisar} prova={prova} destaque={destaque} />

      <div className="m-testes">
        {ataques.length > 0 && (
          <Secao id="ataques" titulo="Jogadas de Ataque" contagem={ataques.length}>
            {ataques.map((a) => (
              <LinhaTeste key={a.id} chave={`ataque:${a.id}`} nome={a.nome} ataqueId={a.id} bonus={a.bonus} textoBonus={a.textoBonus} dados={a.dadosExtras}
                partes={a.partes} prof={a.treinado ? "treinado" : null} rolar={rolar} prova={prova} avisar={avisar} destaque={destaque} />
            ))}
          </Secao>
        )}
        {resistencias.length > 0 && (
          <Secao id="resistencias" titulo="Testes de Resistência" contagem={resistencias.length}>
            {resistencias.map((r) => (
              <LinhaTeste key={r.value} chave={`tr:${r.value}`} nome={r.label} atributo={r.atributo} bonus={r.bonus} textoBonus={r.textoBonus} dados={r.dadosExtras}
                partes={r.partes} prof={r.prof} margem={r.margemCritico} partesMargemCritico={r.partesMargemCritico} falha={r.falhaAutomatica}
                rolar={rolar} prova={prova} avisar={avisar} destaque={destaque} />
            ))}
          </Secao>
        )}
      </div>

      {manobras.length > 0 && (
        <Secao id="outros" titulo="Outros" contagem={manobras.length}>
          <div className="m-grade-cartoes">
            {manobras.map((m) => <CartaoManobra key={m.id} m={m} rolar={rolar} prova={prova} avisar={avisar} destaque={destaque} />)}
          </div>
        </Secao>
      )}

      {pericias.length > 0 && (
        <Secao id="pericias" titulo="Perícias" contagem={filtrando ? `${visiveis.length} de ${pericias.length}` : pericias.length} controles={(
          <div className="m-ferramentas">
            <label className="e-busca m-busca">
              <Search aria-hidden="true" />
              <input className="afty-campo" type="search" value={termo} placeholder="Buscar Perícia" aria-label="Buscar perícia pelo nome ou atributo"
                onChange={(ev) => setTermo(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Escape" && termo) { ev.stopPropagation(); setTermo(""); } }} />
              {termo && <button type="button" className="e-limpar" onClick={() => setTermo("")} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
            </label>
            <span className="m-seg" role="radiogroup" aria-label="Filtrar perícias pelo treino">
              {FILTROS.map((f) => (
                <button key={f.id} type="button" role="radio" className="m-seg-op" aria-checked={filtro === f.id} onClick={() => setFiltro(f.id)}>
                  {f.rotulo}<small>{contagem(f)}</small>
                </button>
              ))}
            </span>
          </div>
        )}>
          {visiveis.length > 0 ? (
            <div className="m-grade-pericias">
              {visiveis.map((p) => (
                <LinhaTeste key={p.id} chave={`pericia:${p.id}`} nome={p.nome} atributo={p.atributo} atributoPadrao={p.atributoPadrao} bonus={p.bonus}
                  textoBonus={p.textoBonus} dados={p.dadosExtras} partes={p.partes} prof={p.prof} minimoNatural={p.minimoNatural}
                  rolar={rolar} prova={prova} avisar={avisar} destaque={destaque} />
              ))}
            </div>
          ) : (
            <Vazio texto="Nenhuma Perícia Encontrada" acao={<button type="button" className="m-botao" onClick={() => { setTermo(""); setFiltro("todas"); }}>Limpar</button>} />
          )}
        </Secao>
      )}
    </div>
  );
}
