/* ============================================================
   ABA HABILIDADES DO ESTUDO
   ============================================================
   Os pontos de entrada da ficha atual continuam: filtros por efeito, busca,
   Funcionamento Básico, os grupos na ordem de GRUPOS e as sub-abas por
   Classe. O que muda é a LINHA:
     uma linha só, de altura única (2026-10-14): nome, estado ligado (◆),
                 marcas e, na busca, onde casou
     à direita   controles curtos, com "Não Desconta PE" quando o controle
                 aplica o efeito sem cobrar
   A descrição do estudo saiu da linha: ela está na consulta ("Em Resumo") e
   entra no índice da busca. Um valor entre as marcas ("−10 PE") vai sem o
   ponto separador, com o sinal escrito.
   Clicar na linha abre a consulta, que fica POR CIMA da área: a lista não
   se move nem muda de largura.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { AlertTriangle, Search, Star, X, ZapOff, BookOpenText, ChevronRight } from "lucide-react";
import { ContadorDeUsos } from "../ItemDeFicha";
import { useDestaque } from "../usar-destaque";
import { GRUPOS, FILTROS_HABILIDADE, correspondeFiltroHabilidade } from "./ponte";
import { buscar } from "./repertorio";
import { semAcento } from "./util";
import { Controle } from "./pecas";
import { estadoDaLinha, navegarLista } from "./pecas-logica";
import { CHAVE_GOLPE, exemploDoItem as descricaoDe, propriedadesDoGolpe } from "./efeitos-dados";
import { ativaPorPreparacao } from "./g2-dados";

import { ehCurto, naoDescontaPE, rotuloCurto } from "./habilidades-logica";
const GRUPO_IDS = new Set(GRUPOS.map((g) => g.id));

/* O controle aplica o efeito sem cobrar, mas a regra fala em gastar PE:
   isso precisa estar escrito no ponto de uso.
   ⚠ CORRIGIDO NA RODADA 7: a rodada 6 tirava daqui todo estado com
   `custoPE`, supondo que o motor cobrasse. Não cobra: o `custoPE` do
   estado só é MOSTRADO (Canalizar em Golpe, Canalização Máxima). A única
   cobrança da sessão é a do Invencível sob o Sol (`alteraEstadoCombate`). */

function Trecho({ t }) {
  if (!t) return null;
  return (
    <span className="e-trecho">
      {t.cortadoAntes && "…"}
      {t.partes.map((p, i) => (p.marca ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
      {t.cortadoDepois && "…"}
    </span>
  );
}
const ONDE = { nome: "No Nome", "opção": "Na Escolha", texto: "No Texto" };

/* Uma marca que é VALOR (com sinal e número, "-10 PE"): sem o ponto separador,
   e com o sinal de menos tipográfico, como todo número da ficha. */
const EH_VALOR = /^[+\-−]\s?\d/;
function Marca({ t }) {
  const valor = EH_VALOR.test(t);
  return <span className="e-marca" data-valor={valor ? "" : undefined}>{valor ? t.replace(/^-/, "−") : t}</span>;
}

/* O ACESSO DE HABILIDADES aos grupos que já têm Preparação (consolidação ampliada, 2026-10-16). Nada de caminho imediato: o
   controle de quem já tem custo, limite, uso ou confirmação (Ataque Concentrado, Concentrar Aura, Espírito Incansável, Postura,
   Golpe Especial e os outros) é uma ação discreta. Desligado, "Ativar" abre a Preparação NO PAINEL sem gravar nada. Ativo, "Abrir"
   leva ao detalhe, onde o Ajustar diz o que a habilidade realmente permite. O filho (o Incansável) vai ao grupo certo, o do Espírito de Luta. */
export function EntradaDoPreparo({ o, g, onAbrirPainel }) {
  const ativo = g.ativos.some((a) => a.chave === o.chave);
  const rotulo = ativo ? "Abrir" : "Ativar";
  const aoClicar = () => {
    if (ativo) g.acoes.abrirNoPainel(o.chave);
    else if (!g.acoes.abrirPreparo(o)) return;
    onAbrirPainel?.();
  };
  return <button type="button" className="afty-botao e-botao e-ativar-preparo" data-preparo-entrada={o.chave} title={`${rotulo} ${o.nome} pelos Efeitos`} aria-label={`${rotulo} ${o.nome}`} onClick={aoClicar}>{rotulo}</button>;
}

/* Exportada (2026-10-21) para o Rápido da prévia das abas do G2: a MESMA linha, com a consulta, os controles curtos, a entrada da
   Preparação e o contador de usos. Nada muda nesta aba. */
export function Linha({ e, m, g, porChave, onAbrirPainel, consultada, onAbrir, rotuloSub, achado, destacado, contadorUsos }) {
  /* A busca global (Ctrl+K) navega até a linha: rola e marca, como nas outras abas. */
  const raiz = useDestaque(destacado);
  /* Cada controle do item vai para o grupo dele: com Preparação, vira a entrada discreta (uma por grupo). Sem ela, segue o controle de hoje. */
  const roteados = new Map();
  const cs = [];
  for (const c of m.controlesPorDono.get(e.chave) ?? []) {
    const gr = g.grupoDoEstado.get(c.estados[0].id);
    const o = gr ? porChave.get(gr.chave) : null;
    if (o && ativaPorPreparacao(o)) roteados.set(o.chave, o);
    else if (ehCurto(c)) cs.push(c);
  }
  /* Interruptor com o mesmo nome do item: "◆ Ligado", sem repetir o nome. */
  /* O Golpe Especial tem marcas fora dos estados: a linha diz as propriedades marcadas, nas duas casas do montador. */
  const props = e.chave === CHAVE_GOLPE && m.combate ? propriedadesDoGolpe(m.sessao).map((x) => x.texto) : [];
  const estBruto = props.length ? props.join(", ") : estadoDaLinha(e, m);
  const est = estBruto === e.nome ? "Ligado" : estBruto;
  const fixado = m.fixados.includes(e.chave);
  const marcas = (e.tags ?? []).map((t) => t.label).filter((l) => l && l !== rotuloSub);
  return (
    <div ref={raiz} className="afty-linha e-linha" data-consultada={consultada ? "sim" : undefined} data-afty-alvo={destacado ? "sim" : undefined}>
      <button type="button" className="e-estrela" aria-pressed={fixado} onClick={() => m.fixar(e.chave)}
        aria-label={fixado ? `Tirar ${e.nome} dos Fixados` : `Fixar ${e.nome}`} title={fixado ? "Tirar dos Fixados" : "Fixar"}>
        <Star aria-hidden="true" fill={fixado ? "currentColor" : "none"} />
      </button>
      <button type="button" className="e-linha-corpo" data-chave={e.chave} onClick={() => onAbrir(e.chave)} aria-haspopup="dialog"
        aria-label={`${e.nome}. Consultar a regra`}>
        <span className="e-linha-topo">
          <span className="e-nome-item" title={e.nome}>{e.nome}</span>
          {est && <span className="e-ativo">◆ {est}</span>}
          {achado && <span className="e-onde" data-onde={achado.onde}>{ONDE[achado.onde]}</span>}
          {marcas.length > 0 && <span className="e-metas" title={marcas.map((t) => t.replace(/^-(?=\d)/, "−")).join(" · ")}>{marcas.map((t) => <Marca key={t} t={t} />)}</span>}
          {e.aviso && <span className="e-aviso" title={e.aviso}><AlertTriangle aria-hidden="true" /></span>}
        </span>
      </button>
      {(cs.length > 0 || roteados.size > 0 || (e.usos && contadorUsos)) && (
        <div className="e-linha-ctrl">
          {/* O contador de usos da habilidade (Usos, Doses...) é da SESSÃO e mora na linha, como sempre morou. */}
          {e.usos && contadorUsos && (
            <span className="e-ctrl">
              <ContadorDeUsos nome={e.nome} usos={e.usos} gastos={contadorUsos.gastosDe(e.usos.chave)} onUso={(delta) => contadorUsos.onUso(e.usos, delta)} />
            </span>
          )}
          {[...roteados.values()].map((o) => <span key={o.chave} className="e-ctrl"><EntradaDoPreparo o={o} g={g} onAbrirPainel={onAbrirPainel} /></span>)}
          {cs.map((c) => (
            <span key={c.id} className="e-ctrl">
              {rotuloCurto(c, e) && <span className="e-ctrl-rotulo" title={rotuloCurto(c, e)}>{rotuloCurto(c, e)}</span>}
              <Controle c={c} m={m} compacto />
              {naoDescontaPE(c, e) && <span className="e-pe" title="O controle aplica o efeito. O PE da regra é gasto à parte, na Energia."><ZapOff aria-hidden="true" />Não Desconta PE</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function subsDe(lista) {
  const mapa = new Map();
  for (const i of lista) {
    if (!i.sub) continue;
    if (!mapa.has(i.sub.id)) mapa.set(i.sub.id, { ...i.sub, quantos: 0 });
    mapa.get(i.sub.id).quantos += 1;
  }
  const subs = [...mapa.values()];
  return subs.length > 1 ? subs : [];
}

function Grupo({ grupo, lista, m, g, porChave, onAbrirPainel, consultada, onAbrir, filtrando, achados, destaque, contadorUsos }) {
  const subs = useMemo(() => subsDe(lista), [lista]);
  const [ativa, setAtiva] = useState(null);
  if (!lista.length) return null;
  const efetiva = filtrando ? null : (subs.some((s) => s.id === ativa) ? ativa : subs[0]?.id ?? null);
  const visiveis = efetiva ? lista.filter((i) => i.sub?.id === efetiva) : lista;
  const rotuloAtivo = subs.find((s) => s.id === efetiva)?.label ?? null;
  return (
    <section className="afty-card e-grupo" aria-label={grupo.label}>
      <header className="e-grupo-topo">
        <h2 className="afty-card-titulo e-grupo-titulo">{grupo.label}<small>{lista.length}</small></h2>
        {subs.length > 0 && !filtrando && (
          <div className="e-subabas" role="tablist" aria-label={`Divisões de ${grupo.label}`}>
            {subs.map((s) => (
              <button key={s.id} type="button" role="tab" className="e-subaba" aria-selected={s.id === efetiva} onClick={() => setAtiva(s.id)}>
                {s.label}<small>{s.quantos}</small>
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="e-grupo-lista">
        {visiveis.map((e) => (
          <Linha key={e.chave} e={e} m={m} g={g} porChave={porChave} onAbrirPainel={onAbrirPainel} consultada={consultada === e.chave} onAbrir={onAbrir} rotuloSub={rotuloAtivo} achado={achados?.get(e.chave)} destacado={destaque === e.chave} contadorUsos={contadorUsos} />
        ))}
      </div>
    </section>
  );
}

/* `espinho`, `rotulosGrupo`, `contadorUsos` e `destaque` são o que a Ficha já dava a esta aba: o contador das Almas do Addon Espinho (não é
   habilidade, não passa pelo filtro), o nome que a ficha usa para um grupo (o Vampiro chama as Características Amaldiçoadas de Características
   de Anatomia), o contador de usos da sessão e a linha para onde a busca global navegou. */
export default function Habilidades({ m, g, consultada, onAbrir, onAbrirPainel, espinho = null, rotulosGrupo = {}, contadorUsos = null, destaque = null }) {
  const [termo, setTermo] = useState("");
  const porChave = useMemo(() => new Map(g.opcoes.map((o) => [o.chave, o])), [g.opcoes]);
  const [efeito, setEfeito] = useState("todos");
  const { rep } = m.pacote;
  const itens = useMemo(() => rep.todas.filter((e) => GRUPO_IDS.has(e.grupo)), [rep]);
  const funcionamentos = useMemo(() => rep.todas.filter((e) => e.tipo === "funcionamento"), [rep]);
  /* A descrição do estudo saiu da linha, mas continua na busca: ela entra no índice junto do texto da regra. */
  const indice = useMemo(() => [...itens, ...funcionamentos].map((e) => {
    const d = descricaoDe(e);
    return d?.texto ? { ...e, busca: `${e.busca} \n ${semAcento(d.texto)}` } : e;
  }), [itens, funcionamentos]);
  const achados = useMemo(() => (termo.trim() ? new Map(buscar(indice, termo).map((r) => [r.e.chave, r])) : null), [indice, termo]);
  const passaEfeito = (e) => efeito === "todos" || correspondeFiltroHabilidade({ id: e.id, nome: e.nome, texto: e.texto, opcoes: e.opcoes }, efeito, "");
  const filtrados = itens.filter((e) => passaEfeito(e) && (!achados || achados.has(e.chave)));
  const funcsVisiveis = funcionamentos.filter((e) => passaEfeito(e) && (!achados || achados.has(e.chave)));
  const filtrando = !!achados || efeito !== "todos";
  const noNome = achados ? [...achados.values()].filter((r) => r.onde === "nome" && filtrados.concat(funcsVisiveis).some((e) => e.chave === r.e.chave)).length : 0;
  const noTexto = achados ? filtrados.length + funcsVisiveis.length - noNome : 0;
  const total = itens.length;

  return (
    <div className="e-habilidades" onKeyDown={navegarLista(".e-linha-corpo")} data-lista data-rolavel="lista"
      onScroll={(ev) => ev.currentTarget.toggleAttribute("data-rolada", ev.currentTarget.scrollTop > 2)}>
      <div className="e-ferramentas">
        <label className="e-busca">
          <Search aria-hidden="true" />
          <input className="afty-campo" type="search" value={termo} data-filtro placeholder={`Buscar em ${total} habilidades, pelo nome ou pelo texto`}
            onChange={(ev) => setTermo(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Escape") setTermo(""); }} aria-label="Buscar habilidades pelo nome ou pelo texto" />
          {termo && <button type="button" className="e-limpar" onClick={() => setTermo("")} aria-label="Limpar a busca"><X aria-hidden="true" /></button>}
        </label>
        {achados && (
          <p className="e-contagem" aria-live="polite">
            <span className="e-contagem-total"><b>{filtrados.length + funcsVisiveis.length}</b> {filtrados.length + funcsVisiveis.length === 1 ? "Resultado" : "Resultados"}</span>
            <span data-onde="nome">No Nome <b>{noNome}</b></span><span data-onde="texto">No Texto <b>{noTexto}</b></span>
          </p>
        )}
        <div className="e-efeitos" role="radiogroup" aria-label="Filtrar por efeito">
          <span className="e-efeitos-rotulo">Efeito</span>
          {[{ id: "todos", label: "Todos" }, ...FILTROS_HABILIDADE].map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={efeito === f.id} className="e-efeito" onClick={() => setEfeito(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {espinho}

      {funcsVisiveis.map((f) => (
        <button key={f.chave} type="button" className="afty-card e-tecnica" data-chave={f.chave} data-consultada={consultada === f.chave ? "sim" : undefined} onClick={() => onAbrir(f.chave)}>
          <BookOpenText aria-hidden="true" /><span className="e-tecnica-nome">{f.nome}</span>
          {achados?.get(f.chave) && <><span className="e-onde">{ONDE[achados.get(f.chave).onde]}</span><Trecho t={achados.get(f.chave).trecho} /></>}
          <ChevronRight aria-hidden="true" className="e-tecnica-seta" />
        </button>
      ))}

      {GRUPOS.map((grupo) => (
        <Grupo key={grupo.id} g={g} grupo={rotulosGrupo[grupo.id] ? { ...grupo, label: rotulosGrupo[grupo.id] } : grupo} porChave={porChave} onAbrirPainel={onAbrirPainel} lista={filtrados.filter((e) => e.grupo === grupo.id)} m={m} consultada={consultada} onAbrir={onAbrir} filtrando={filtrando} achados={achados} destaque={destaque} contadorUsos={contadorUsos} />
      ))}

      {filtrados.length === 0 && funcsVisiveis.length === 0 && (
        <div className="e-vazio" role="status">
          <p>Nenhuma habilidade para <b>{termo ? `“${termo}”` : FILTROS_HABILIDADE.find((f) => f.id === efeito)?.label}</b></p>
          <button type="button" className="afty-botao e-botao" onClick={() => { setTermo(""); setEfeito("todos"); }}>Limpar</button>
        </div>
      )}
      <div className="e-respiro" aria-hidden="true" />
    </div>
  );
}

