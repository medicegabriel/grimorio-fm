/* ============================================================
   ABA AÇÕES DO G2 (prévia isolada, 2026-10-21; decisões 1A, 2A e 3B do autor)
   ============================================================
   O que a criatura faz no turno, na linguagem do G2:
     - índice das seções, que salta para cada uma;
     - Agora na Mesa: os condicionais numa faixa de resumo (`MesaG2.jsx`);
     - Rápido: os favoritos, habilidades (a linha das Habilidades do G2) e equipamentos;
     - Dano, Cura | Feitiços, Expansão de Domínio, em duas colunas a partir de 1180 px úteis.
   O bloco Outros (Manobras, Concentração, Teste de Morte) mora em Perícias desde o aceite do autor (21/10, `PericiasG2.jsx`).
   As linhas de Dano dividem as mesmas colunas (`.m-secao-dano` em `abas-g2.css`): uma arma não fica mais alta que a outra só porque
   a fórmula dela tem alguns caracteres a mais.
   Tudo vem RESOLVIDO do derive e opera pelos MESMOS verbos da aba clássica (`AbaAcoes.jsx`), que segue intacta para a clássica e o
   Encontro. O que é desta aba: cada operação pergunta a própria disponibilidade (`prova`, o caminho do `rolar` sem sorteio) e mostra o
   motivo da recusa na linha; o Feitiço de rolagem única rola da linha fechada (3B); o Golpe abre a Preparação dos Efeitos (2A).
   ============================================================ */
import React, { useContext, useId, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ZapOff } from "lucide-react";

import { DicaDeTexto, NumeroComFontes } from "../../ui/fontes";
import { VisibilidadeDaAba } from "../../ui/visibilidade-da-aba";
import { sinalDe } from "../../ui/formato";
import { tituloCustoFeitico, TIPO_FEITICO_LABEL } from "../../afty-feiticos";
import { textoDaEscada, TM_ACAO_LABEL } from "../../afty-tecnicas-marciais";
import { AFTY_RESISTENCIAS } from "../../afty-schema";
import { IconeDeTipo } from "../../ui/feitico-tipo";
import TextoRico from "../../ui/TextoRico";
import { ControleDeEnergica } from "../ControlesDeArma";
import { danoDaAmpla } from "../../afty-propriedades-armas";
import { situacaoDaTecnicaMaxima, usosGastosDe, marcaUso } from "../ficha-sessao";
import { ControlesRitual } from "../abas/AbaAcoes";
import MesaG2 from "./MesaG2";
import { celulasDaMesa } from "./mesa-celulas";
import { Motivo, Rolar, Secao } from "./pecas-mesa";
import { useDestaqueG2 } from "./usar-destaque-g2";
import { motivoDaRecusa, travaDoFeitico, etapaDoRitual } from "./rolagem-g2";
import {
  pedidoAcerto, pedidoDano, estadoDaCura, pedidoCura, pedidoFeitico, notacaoDoFeitico, pedidoConflito,
} from "./rolagens-acoes";

/* ---------------------------------------------------------------- */
/* Motivos: um texto visível por motivo distinto, ligado a quem recusa */
/* ---------------------------------------------------------------- */
function useMotivos(lista) {
  const base = useId();
  const distintos = [...new Set(lista.map((m) => m.texto).filter(Boolean))];
  const idDe = (texto) => (texto ? `${base}-m${distintos.indexOf(texto)}` : undefined);
  const nos = distintos.length ? (
    <span className="m-motivos">
      {distintos.map((t) => {
        const quem = lista.filter((m) => m.texto === t).map((m) => m.quem).filter(Boolean);
        /* Quando só uma das operações da linha recusa, o motivo diz qual ("Dano: Errou"). Quando as duas recusam igual, basta o texto. */
        return <Motivo key={t} id={idDe(t)} texto={quem.length && quem.length < lista.length ? `${quem.join(" e ")}: ${t}` : t} />;
      })}
    </span>
  ) : null;
  return { idDe, nos };
}

/* O detalhe no lugar: Esc fecha o detalhe que tem o foco e devolve o foco ao nome, a não ser que haja camada por cima (fontes, consulta,
   busca), que fecha primeiro pelo próprio Esc. */
const haCamadaPorCima = () => !!document.querySelector("#afty-ficha .afty-fontes-flutuante, #afty-ficha .e-consulta, .afty-busca-fundo");
function escDoDetalhe(ev, aberto, fechar, nome) {
  if (ev.key !== "Escape" || !aberto || haCamadaPorCima()) return;
  ev.stopPropagation();
  fechar();
  requestAnimationFrame(() => nome.current?.focus({ preventScroll: true }));
}

/* ---------------------------------------------------------------- */
/* Dano                                                              */
/* ---------------------------------------------------------------- */
const TITULO = { "Arma emperrada": "Arma Emperrada", "Recarregue a arma": "Recarregue a Arma" };

function EmCombate({ e, onArma, onAmpla, rodada, modoDano, onImbuir }) {
  const info = e.armaPropriedades;
  const tem = (id) => e.propriedades?.some((p) => p.id === id);
  const estado = info?.estado ?? {};
  const altera = (campo, valor) => onArma?.(e, campo, valor);
  const danoAmpla = info ? danoDaAmpla(e, rodada) : null;
  const numero = (campo, titulo, max = undefined) => (
    <label className="m-campo">
      <span>{titulo}</span>
      <input type="number" min="0" max={max} step="1" className="afty-campo m-campo-num" aria-label={`${titulo} de ${e.nome}`}
        value={estado[campo] ?? ""} onChange={(ev) => altera(campo, ev.target.value)} />
    </label>
  );
  const feiticoImbuido = e.imbuir?.escolhido ?? null;
  const temControles = info && (["aparar", "apunhaladora", "oscilante", "ampla", "recarga", "emperrar", "modular"].some(tem)
    || e.avisosPropriedades?.length || info.desvantagem || info.bloqueio);
  if (!temControles && !e.imbuir && !(info && tem("energica"))) return null;
  return (
    <div className="m-bloco" data-m-bloco="em-combate" data-afty-propriedades-arma={e.chaveArma}>
      <h3 className="m-bloco-titulo">Em Combate</h3>
      {info && tem("energica") && (
        <ControleDeEnergica linha={e} modoDano={modoDano} onGolpe={(arma, golpe) => onArma?.(arma, "ataques", golpe - 1)} />
      )}
      {temControles && (
        <div className="m-controles">
          {e.avisosPropriedades?.map((aviso) => (
            <span key={aviso} className="m-aviso-chip"><AlertTriangle aria-hidden="true" />{aviso}</span>
          ))}
          {info.desvantagem && (
            <span className="m-aviso-chip" title={info.requisitos.join(", ")}>
              Desvantagem por {tem("pesada") && info.requisitos.some((r) => r.startsWith("Força")) ? "Pesada" : "Estabilidade"}
            </span>
          )}
          {info.bloqueio && <span className="m-aviso-chip"><AlertTriangle aria-hidden="true" />{TITULO[info.bloqueio] ?? info.bloqueio}</span>}
          {tem("aparar") && (
            <button type="button" className="m-botao" disabled={!e.treinada} aria-pressed={!!estado.aparando}
              title={e.treinada ? "Ação de movimento. Dura até o início do seu próximo turno." : "Requer treino com a arma."}
              onClick={() => altera("aparando", !estado.aparando)}>
              Aparar (+{e.propriedades.find((p) => p.id === "aparar")?.bonusDefesa ?? 2} Defesa)
            </button>
          )}
          {tem("apunhaladora") && (
            <button type="button" className="m-botao" aria-pressed={!!estado.desprevenido} onClick={() => altera("desprevenido", !estado.desprevenido)}>
              Alvo Desprevenido
            </button>
          )}
          {tem("modular") && info.tipos.length > 1 && (
            <label className="m-campo">
              <span>Tipo de Dano</span>
              <select className="afty-campo" aria-label={`Tipo de dano de ${e.nome}`} value={e.tipoDano ?? ""} onChange={(ev) => altera("tipoDano", ev.target.value)}>
                {info.tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
          )}
          {(tem("oscilante") || tem("ampla")) && numero("defesaAlvo", "Defesa do Alvo")}
          {tem("oscilante") && estado.pendente && (
            <span className="m-seg" role="group" aria-label={`Resultado do último ataque de ${e.nome}`}>
              <button type="button" className="m-seg-op" aria-pressed={!!estado.pendente.errou} onClick={() => onArma?.(e, "errou", true)}>Errou</button>
              <button type="button" className="m-seg-op" aria-pressed={!estado.pendente.errou} onClick={() => onArma?.(e, "errou", false)}>Acertou</button>
            </span>
          )}
          {info.oscilante > 0 && <span className="m-chip">Oscilante +2 no Próximo Acerto</span>}
          {tem("recarga") && (
            <>
              {numero("gastos", "Munições Usadas", info.capacidade)}
              <span className="m-rotulo">de {info.capacidade}</span>
              <button type="button" className="m-botao" title="Ação bônus" onClick={() => altera("recarregar", true)}>Recarregar</button>
            </>
          )}
          {tem("emperrar") && estado.emperrada && (
            <button type="button" className="m-botao" title="Ação comum" onClick={() => altera("desemperrar", true)}>Desemperrar</button>
          )}
          {tem("ampla") && estado.ultimo && (
            <>
              <button type="button" className="m-botao" aria-pressed={!!estado.adjacente} onClick={() => altera("adjacente", !estado.adjacente)}>Segundo Alvo Adjacente</button>
              {numero("defesaAmpla", "Defesa do Segundo Alvo")}
              <button type="button" className="m-botao" disabled={danoAmpla == null} title="Uma vez por rodada. A Defesa deve ser menor que o resultado do acerto."
                onClick={() => onAmpla?.(e)}>
                Ampla{danoAmpla == null ? "" : `: ${danoAmpla} de Dano`}
              </button>
            </>
          )}
        </div>
      )}
      {e.imbuir && (
        <div className="m-controles">
          <label className="m-campo">
            <span>Imbuir</span>
            <select className="afty-campo" value={feiticoImbuido?.id ?? ""} aria-label={`Imbuir técnica em ${e.nome}`}
              onChange={(ev) => onImbuir?.(e.imbuir.estadoId, ev.target.value || null)}>
              <option value="">Nenhum</option>
              {e.imbuir.opcoes.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <span className="m-custo">+{e.imbuir.custoAdicional} PE</span>
          <span className="e-pe" title="Escolher o Feitiço imbuído não desconta o PE. O gasto é feito à parte, na Energia."><ZapOff aria-hidden="true" />Não Desconta PE</span>
        </div>
      )}
    </div>
  );
}

function LinhaDano({ e, rolar, prova, avisar, critico, onCritico, modoDano, aberto, onAberto, destaque, onAtaqueBasico, onArma, onAmpla, rodada, onImbuir }) {
  const chave = `dano:${e.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const nome = useRef(null);
  const modoVisual = modoDano !== "normal" ? modoDano : critico ? "critico" : "normal";
  const danoExibido = modoVisual === "critico" ? e.formulaCritico : modoVisual === "raio_negro" ? e.formulaRaioNegro : (e.formulaNormal ?? e.texto);
  const pedA = e.acerto != null ? pedidoAcerto(e) : null;
  const motA = pedA ? motivoDaRecusa(prova(pedA), pedA) : null;
  const pedD = pedidoDano(e, modoVisual);
  const motD = motivoDaRecusa(prova(pedD), pedD);
  const { idDe, nos: motivos } = useMotivos([{ quem: "Acerto", texto: motA }, { quem: "Dano", texto: motD }]);
  const info = e.armaPropriedades;
  const feiticoImbuido = e.imbuir?.escolhido ?? null;
  const condicoesImbuidas = feiticoImbuido?.propriedades?.find((p) => p.id === "condicoes")?.valor;
  const cdImbuida = feiticoImbuido?.propriedades?.find((p) => p.id === "cd")?.valor;
  const idDetalhe = `m-detalhe-${chave}`;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-linha" data-afty-destacada={e.fonte === "basico" ? "sim" : "nao"}
      data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave} onKeyDown={(ev) => escDoDetalhe(ev, aberto, () => onAberto(chave), nome)}>
      <div className="m-linha-topo">
        <button ref={nome} type="button" className="m-linha-nome" aria-expanded={aberto} aria-controls={idDetalhe} onClick={() => onAberto(chave)}>
          <ChevronDown aria-hidden="true" className="m-seta" />
          <span className="m-nome">{e.nome}</span>
        </button>
        <span className="m-metas">
          {e.fonte === "basico" && <span className="m-meta" data-m-ataque-basico={e.ataqueId}>{e.ataqueId === "amaldicoado" ? "Amaldiçoado" : "Corpo a Corpo"}</span>}
          {e.tipoDanoLabel && <span className="m-meta">{e.tipoDanoLabel}</span>}
          {e.margemCritico != null && (
            <span className="m-meta">
              <NumeroComFontes className="m-meta-num" titulo="Margem de Crítico" valor={`Crít ${e.margemCritico}`} partes={e.partesMargemCritico} total={e.margemCritico} formatar={false} ancora="direita" />
            </span>
          )}
          {e.alcance && (
            <span className="m-meta">
              <NumeroComFontes className="m-meta-num" valor={e.alcance.texto} partes={e.alcance.partes} total={e.alcance.texto} formatar={false} ancora="direita" />
            </span>
          )}
          {e.ignoraRD > 0 && <span className="m-meta">Ignora RD {e.ignoraRD}</span>}
          {e.ignoraTodaRD && <span className="m-meta">Ignora Toda RD</span>}
          {e.ignoraImunidade && <span className="m-meta">Ignora Imunidade</span>}
          {e.removeResistencia && <span className="m-meta">Remove Resistência</span>}
          {info?.capacidade > 0 && <span className="m-meta" data-m-municao="">Munição {Math.max(0, info.capacidade - (info.estado?.gastos ?? 0))}/{info.capacidade}</span>}
          {info?.energica > 0 && <span className="m-meta">Enérgica +{modoVisual === "normal" ? info.energica : info.energicaCritico}</span>}
          {e.acerto != null && e.vantagemAtaque && e.vantagemAtaque.vantagem !== e.vantagemAtaque.desvantagem && (
            <DicaDeTexto titulo={e.vantagemAtaque.vantagem ? "Vantagem" : "Desvantagem"} texto={e.vantagemAtaque.fontes.map((f) => f.label).join(", ")}>
              <span className="m-chip" tabIndex={0}>{e.vantagemAtaque.vantagem ? "Vantagem" : "Desvantagem"}</span>
            </DicaDeTexto>
          )}
          {critico && <span className="m-chip" data-tom="destaque">Crítico Pendente</span>}
          {feiticoImbuido && (
            <span className="m-chip" data-tom="destaque" title={[feiticoImbuido.conjuracaoTexto, feiticoImbuido.descricao].filter(Boolean).join("\n\n")}>
              {feiticoImbuido.rolagens?.length ? (feiticoImbuido.nome || "Feitiço Sem Nome") : `+${feiticoImbuido.valor || feiticoImbuido.nome || "Efeito"}`}
            </span>
          )}
          {condicoesImbuidas && cdImbuida && <span className="m-chip" title={condicoesImbuidas}>TR CD {cdImbuida}</span>}
          {e.golpeComAura && <span className="m-chip" title={e.golpeComAura.nome}>TR CD {e.golpeComAura.cd}</span>}
        </span>
        <span className="m-acoes">
          {pedA && (
            <Rolar rotulo="Acerto" valor={e.acertoTexto ?? sinalDe(e.acerto)} partes={e.partesAcerto} total={e.acertoTexto ?? sinalDe(e.acerto)}
              titulo={e.acertoAtaque} motivo={motA} idMotivo={idDe(motA)} avisar={avisar}
              onRolar={() => { const r = rolar(pedA); if (r) onCritico(r.critico); }} />
          )}
          <Rolar rotulo="Dano" valor={danoExibido} partes={e.hoverDano?.partes ?? e.partes}
            total={modoVisual === "normal" ? (e.hoverDano?.total ?? e.totalFontes ?? e.total) : danoExibido}
            motivo={motD} idMotivo={idDe(motD)} avisar={avisar} className="m-rolar-dano"
            onRolar={() => { const r = rolar(pedD); if (r && critico) onCritico(false); }} />
        </span>
      </div>
      {motivos}
      <div id={idDetalhe} className="m-detalhe" hidden={!aberto}>
        {aberto && (
          <>
            {e.fonte === "basico" && (
              <div className="m-bloco" data-m-bloco="ataque-basico">
                <h3 className="m-bloco-titulo">Ataque</h3>
                <span className="m-seg" role="radiogroup" aria-label="Ataque do Ataque Básico">
                  {[{ id: "corpo", rotulo: "Corpo a Corpo" }, { id: "amaldicoado", rotulo: "Amaldiçoado" }].map((o) => (
                    <button key={o.id} type="button" role="radio" className="m-seg-op" aria-checked={e.ataqueId === o.id} disabled={!onAtaqueBasico}
                      onClick={() => onAtaqueBasico?.(o.id)}>{o.rotulo}</button>
                  ))}
                </span>
              </div>
            )}
            <EmCombate e={e} onArma={onArma} onAmpla={onAmpla} rodada={rodada} modoDano={modoVisual} onImbuir={onImbuir} />
            {e.propriedades?.length > 0 && (
              <div className="m-bloco">
                <h3 className="m-bloco-titulo">Propriedades</h3>
                <div className="m-chips">
                  {e.propriedades.map((p) => <span key={p.id} className="m-chip" data-tom={p.concedida ? "destaque" : undefined}>{p.rotulo}</span>)}
                </div>
              </div>
            )}
            {!e.propriedades?.length && !e.imbuir && !info && e.fonte !== "basico" && <p className="m-sem-detalhe">Sem Propriedades</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Cura                                                              */
/* ---------------------------------------------------------------- */
function LinhaCura({ l, rolar, prova, avisar, destaque }) {
  const chave = `cura:${l.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const [blocos, setBlocos] = useState(1);
  const teto = l.unidade ? Math.max(1, l.blocos) : 1;
  const usados = Math.min(blocos, teto);
  const estado = estadoDaCura(l, usados);
  const pedido = pedidoCura(l, estado);
  const motivo = motivoDaRecusa(prova(pedido), pedido);
  const { idDe, nos: motivos } = useMotivos([{ texto: motivo }]);
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-linha" data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave}>
      <div className="m-linha-topo">
        <span className="m-linha-nome m-linha-nome-fixo"><span className="m-nome">{l.nome}{l.qtd ? <span className="m-qtd"> ×{l.qtd}</span> : null}</span></span>
        <span className="m-metas">
          {l.alcance && <span className="m-meta">{l.alcance}</span>}
          {l.usos != null && <span className="m-meta" title="Usos por descanso">Usos {l.usos}</span>}
          {l.espelhaNome && <span className="m-meta" title={`Rola a mesma coisa que ${l.espelhaNome}`}>{l.espelhaNome}</span>}
          {l.rerrola && (
            <span className="m-chip" title={l.rerrola.continua ? `${l.rerrola.fonte} + ${l.rerrola.fonteContinua}: repete até sair acima de ${l.rerrola.ate}` : `${l.rerrola.fonte}: uma rerrolagem por dado, mantendo o melhor resultado`}>
              Rerrola até {l.rerrola.ate}{l.rerrola.continua ? " (Contínua)" : ""}
            </span>
          )}
        </span>
        <span className="m-acoes">
          {l.unidade && (
            <span className="m-passos" role="group" aria-label={`Quanto gastar em ${l.nome}`}>
              <button type="button" className="m-passo" aria-label={`Gastar um bloco a menos em ${l.nome}`} disabled={usados <= 1} onClick={() => setBlocos(Math.max(1, usados - 1))}>−</button>
              <span className="m-passos-valor" title={`Até ${estado.pontosMaximos} ${l.unidade.rotulo}`}>{estado.pontos} {l.unidade.rotulo}</span>
              <button type="button" className="m-passo" aria-label={`Gastar um bloco a mais em ${l.nome}`} disabled={usados >= teto} onClick={() => setBlocos(Math.min(teto, usados + 1))}>+</button>
            </span>
          )}
          <Rolar rotulo="Cura" valor={estado.texto} partes={estado.partes} total={estado.texto} motivo={motivo} idMotivo={idDe(motivo)} avisar={avisar}
            className="m-rolar-cura" onRolar={() => rolar(pedido)} />
        </span>
      </div>
      {motivos}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Técnica Marcial de Ataque (Livro, p. 250 e 251)                   */
/* ---------------------------------------------------------------- */
/* UM golpe: o Acerto e o Dano da arma com o que a Técnica soma, e a marca de que acertou (é dela que sai a Condição). O crítico do
   Acerto amarra no Dano seguinte, como na linha de arma. */
function LinhaDeGolpe({ titulo, e, rolar, prova, avisar, critico, onCritico, modoDano, acertou, onAcertou, consomeEstado }) {
  const modoVisual = modoDano !== "normal" ? modoDano : critico ? "critico" : "normal";
  const danoExibido = modoVisual === "critico" ? e.formulaCritico : modoVisual === "raio_negro" ? e.formulaRaioNegro : (e.formulaNormal ?? e.texto);
  const pedA = e.acerto != null ? { ...pedidoAcerto(e), rotulo: `${titulo} · Acerto` } : null;
  const motA = pedA ? motivoDaRecusa(prova(pedA), pedA) : null;
  const pedD = { ...pedidoDano(e, modoVisual), rotulo: titulo, ...(consomeEstado ? { consomeEstado } : {}) };
  const motD = motivoDaRecusa(prova(pedD), pedD);
  const { idDe, nos: motivos } = useMotivos([{ quem: "Acerto", texto: motA }, { quem: "Dano", texto: motD }]);
  return (
    <div className="m-golpe" data-m-golpe={titulo}>
      <div className="m-linha-topo">
        <span className="m-linha-nome m-linha-nome-fixo"><span className="m-nome">{titulo}</span></span>
        <span className="m-metas">
          {e.ignoraRD > 0 && <span className="m-meta">Ignora RD {e.ignoraRD}</span>}
          {critico && <span className="m-chip" data-tom="destaque">Crítico Pendente</span>}
        </span>
        <span className="m-acoes">
          {pedA && (
            <Rolar rotulo="Acerto" valor={e.acertoTexto ?? sinalDe(e.acerto)} partes={e.partesAcerto} total={e.acertoTexto ?? sinalDe(e.acerto)}
              titulo={e.acertoAtaque} motivo={motA} idMotivo={idDe(motA)} avisar={avisar}
              onRolar={() => { const r = rolar(pedA); if (r) onCritico(r.critico); }} />
          )}
          <Rolar rotulo="Dano" valor={danoExibido} partes={e.hoverDano?.partes ?? e.partes}
            total={modoVisual === "normal" ? (e.hoverDano?.total ?? e.totalFontes ?? e.total) : danoExibido}
            motivo={motD} idMotivo={idDe(motD)} avisar={avisar} className="m-rolar-dano"
            onRolar={() => { const r = rolar(pedD); if (r && critico) onCritico(false); }} />
          <button type="button" className="m-botao" aria-pressed={acertou} onClick={onAcertou}>Acertou</button>
        </span>
      </div>
      {motivos}
    </div>
  );
}

/* A linha da Técnica de Ataque: a arma se escolhe uma vez (sessão), cada golpe rola a arma com o bônus da Técnica, e o contador de
   acertos diz a Condição, o TR e a CD. O custo é só exibido, e a Técnica vale uma vez por rodada. A primeira linha da arma leva os dados
   Após Ataque do Elementalista e da Amplificadora. */
function LinhaTecnicaAtaque({ f, info, usos, sessao, onSessao, rolar, prova, avisar, modoDano, destaque, consomeEstadoNoPrimeiro }) {
  const chave = `feitico:${f.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const [acertos, setAcertos] = useState({});
  const [criticos, setCriticos] = useState({});
  const linhas = info?.linhas ?? [];
  const escolhida = linhas.find((l) => l.linhaId === sessao?.armasDaTecnica?.[f.id]) ?? linhas[0] ?? null;
  const ataque = f.ataque;
  const total = Object.values(acertos).filter(Boolean).length;
  const cond = ataque.condicao;
  const degrau = cond && total > 0 ? cond.escada[Math.min(total, cond.escada.length) - 1] : null;
  const tr = cond?.tr ? AFTY_RESISTENCIAS.find((r) => r.value === cond.tr) : null;
  const gastos = usos ? usosGastosDe(sessao, usos.chave) : 0;
  const restantes = usos ? Math.max(0, usos.max - gastos) : null;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-linha m-feitico" data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave}>
      <div className="m-linha-topo">
        <span className="m-linha-nome m-linha-nome-fixo">
          <span className="m-tipo" title={f.tipoLabel}><IconeDeTipo tipo="ataque" className="w-4 h-4" /></span>
          <span className="m-nome">{f.nome || "Técnica Sem Nome"}</span>
        </span>
        <span className="m-metas">
          <span className="m-meta">{f.nivelLabel}</span>
          <span className="m-meta">{TM_ACAO_LABEL[ataque.acao]}</span>
          <span className="m-meta">{ataque.ataques} {ataque.ataques === 1 ? "Ataque" : "Ataques"}</span>
          {f.custoPE != null && <span className="m-meta m-custo" title={tituloCustoFeitico(f)}>{f.custoPE} PE</span>}
          {f.avisos?.length > 0 && (
            <span className="m-chip" data-tom="aviso" title={f.avisos.join("\n")}><AlertTriangle aria-hidden="true" />{f.avisos.length === 1 ? "1 Aviso" : `${f.avisos.length} Avisos`}</span>
          )}
          {usos && (
            <span className="m-passos" role="group" aria-label={`Usos de ${f.nome || "Técnica"}`}>
              <button type="button" className="m-passo" aria-label={`Gastar um uso de ${f.nome || "Técnica"}`} disabled={restantes === 0}
                onClick={() => onSessao((s) => marcaUso(s, usos, 1))}>−</button>
              <span className="m-passos-valor">Usos {restantes}/{usos.max}</span>
              <button type="button" className="m-passo" aria-label={`Devolver um uso de ${f.nome || "Técnica"}`} disabled={gastos === 0}
                onClick={() => onSessao((s) => marcaUso(s, usos, -1))}>+</button>
            </span>
          )}
        </span>
      </div>
      {linhas.length === 0 ? (
        <p className="m-sem-detalhe">Sem Arma para Atacar</p>
      ) : (
        <div className="m-detalhe">
          <div className="m-bloco" data-m-bloco="golpes">
            <div className="m-controles">
              <label className="m-campo">
                <span>Arma</span>
                <select className="afty-campo" aria-label={`Arma de ${f.nome || "Técnica"}`} value={escolhida.linhaId}
                  onChange={(ev) => onSessao((s) => ({ ...s, armasDaTecnica: { ...(s.armasDaTecnica ?? {}), [f.id]: ev.target.value } }))}>
                  {linhas.map((l) => <option key={l.linhaId} value={l.linhaId}>{l.nome}</option>)}
                </select>
              </label>
              <button type="button" className="m-botao" onClick={() => { setAcertos({}); setCriticos({}); }}>Zerar</button>
            </div>
            {Array.from({ length: ataque.ataques }, (_, i) => (
              <LinhaDeGolpe key={`${escolhida.linhaId}:${i}`} titulo={`Golpe ${i + 1} · ${escolhida.nome}`}
                e={i === 0 ? escolhida.primeiro : escolhida.demais} rolar={rolar} prova={prova} avisar={avisar}
                critico={!!criticos[i]} onCritico={(v) => setCriticos((c) => ({ ...c, [i]: v }))} modoDano={modoDano}
                acertou={!!acertos[i]} onAcertou={() => setAcertos((a) => ({ ...a, [i]: !a[i] }))}
                consomeEstado={i === 0 ? consomeEstadoNoPrimeiro : null} />
            ))}
          </div>
          {cond && (
            <div className="m-bloco" data-m-bloco="condicao">
              <h3 className="m-bloco-titulo">Acertos {total}/{ataque.ataques}</h3>
              <div className="m-chips">
                {degrau ? <span className="m-chip" data-tom="destaque">{textoDaEscada(degrau)}</span> : <span className="m-chip">Sem Condição</span>}
                {tr && <span className="m-chip" title="Um único teste, depois do último ataque">TR {tr.label}{cond.cd != null ? ` CD ${cond.cd}` : ""}</span>}
              </div>
            </div>
          )}
          {f.descricao && <div className="m-bloco"><TextoRico texto={f.descricao} /></div>}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Feitiços                                                          */
/* ---------------------------------------------------------------- */
function LinhaFeitico({
  f: base, sessao, rolar, prova, avisar, aberto, onAberto, destaque, comLiberacao, controleTecnicaMaxima, conjuracaoBloodfeast, ritual,
}) {
  const chave = `feitico:${base.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const nome = useRef(null);
  /* LIBERAÇÃO MÁXIMA: só a SELEÇÃO é guardada (estado desta linha, que a aba mantém montada). O resultado é sempre o do motor com o
     contexto de agora: `comLiberacao` é refeito a cada derive, então mudar um efeito ou a etapa do Ritual refaz o Feitiço exibido. A
     seleção é filtrada na leitura contra o menu atual. */
  const [selecao, setSelecao] = useState([]);
  const menu = base.liberacao ?? null;
  const idsDoMenu = useMemo(() => new Set((menu?.categorias ?? []).flatMap((c) => c.melhorias.map((m) => m.id))), [menu]);
  const validas = menu ? selecao.filter((id) => idsDoMenu.has(id)).slice(0, menu.max) : [];
  const chaveValidas = validas.join("|");
  const liberado = useMemo(
    () => (validas.length && comLiberacao ? comLiberacao(base.id, validas) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base.id, chaveValidas, comLiberacao],
  );
  const f = liberado ?? base;
  const liberacaoPerdida = !menu && selecao.length > 0;
  const rolagens = f.rolagens ?? [];
  const unica = rolagens.length === 1;
  const propriedades = f.propriedades ?? [];
  const propriedadeValor = propriedades.find((p) => p.id === "valor");
  const propriedadesFixas = propriedades.filter((p) => p.id !== "valor");
  const tm = f.tecnicaMaxima ? situacaoDaTecnicaMaxima(sessao, f) : null;
  const etapa = etapaDoRitual(f.ritual);
  const travas = rolagens.map((r, i) => travaDoFeitico(f, base, i));
  const pedidos = rolagens.map((r, i) => pedidoFeitico(f, r, i, rolagens.length));
  const motivos = pedidos.map((p, i) => travas[i] ?? motivoDaRecusa(prova(p), p));
  const { idDe, nos: textoMotivo } = useMotivos(unica ? [{ texto: motivos[0] }] : []);
  const idDetalhe = `m-detalhe-${chave}`;
  const alterna = (id) => setSelecao((atual) => {
    const vigentes = atual.filter((x) => idsDoMenu.has(x));
    if (vigentes.includes(id)) return vigentes.filter((x) => x !== id);
    return vigentes.length >= (menu?.max ?? 0) ? vigentes : [...vigentes, id];
  });
  const custoTexto = f.custoPETexto ? f.custoPETexto : f.custoPE != null ? `${f.custoPE} PE` : null;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-linha m-feitico" data-afty-alvo={destaque?.chave === chave ? "sim" : undefined}
      data-afty-bloqueado={base.bloqueado ? "sim" : undefined} data-m-linha={chave} onKeyDown={(ev) => escDoDetalhe(ev, aberto, () => onAberto(chave), nome)}>
      <div className="m-linha-topo">
        <button ref={nome} type="button" className="m-linha-nome" aria-expanded={aberto} aria-controls={idDetalhe} onClick={() => onAberto(chave)}>
          <ChevronDown aria-hidden="true" className="m-seta" />
          <span className="m-tipo" title={TIPO_FEITICO_LABEL[f.tipo] ?? ""}><IconeDeTipo tipo={f.tipo} className="w-4 h-4" /></span>
          <span className="m-nome">{f.nome || "Feitiço Sem Nome"}</span>
        </button>
        <span className="m-metas">
          <span className="m-meta">{f.nivelLabel}</span>
          {f.variacao && <span className="m-meta" title="Variação de liberação">Var.</span>}
          {custoTexto && <span className="m-meta m-custo" title={f.custoPETexto ? "Custo definido pela regra do Feitiço" : tituloCustoFeitico(f)}>{custoTexto}</span>}
          {f.custoVidaAtivacao && <span className="m-meta m-custo-vida">{f.custoVidaAtual} PV</span>}
          {tm && <span className="m-chip" data-tom={tm.disponivel ? undefined : "aviso"} data-m-tm-usar="">Usar: {tm.disponivel ? "Disponível" : tm.motivo}</span>}
          {etapa && <span className="m-chip" data-m-ritual="">Ritual {etapa}</span>}
          {validas.length > 0 && <span className="m-chip" data-tom="destaque">Liberação {validas.length}/{menu.max}</span>}
          {liberacaoPerdida && <span className="m-chip" data-tom="aviso">Liberação Indisponível</span>}
          {base.bloqueado && <span className="m-chip" data-tom="aviso"><AlertTriangle aria-hidden="true" />{base.bloqueado}</span>}
          {f.avisos?.length > 0 && (
            <span className="m-chip" data-tom="aviso" title={f.avisos.join("\n")}><AlertTriangle aria-hidden="true" />{f.avisos.length === 1 ? "1 Aviso" : `${f.avisos.length} Avisos`}</span>
          )}
        </span>
        <span className="m-acoes">
          {unica ? (
            <>
              <Rolar rotulo="Rolar" valor={notacaoDoFeitico(rolagens[0])} partes={rolagens[0].partes} titulo={rolagens[0].rotulo}
                motivo={motivos[0]} idMotivo={idDe(motivos[0])} avisar={avisar} className="m-rolar-feitico"
                onRolar={() => rolar(pedidos[0])} />
              {rolagens[0].vezes > 1 && <span className="m-chip" title={`${rolagens[0].vezes} ${rolagens[0].rotulo}s`}>×{rolagens[0].vezes}</span>}
            </>
          ) : f.valor ? (
            <span className="m-valor" title={`${f.valorLabel}: ${f.valor}`}>{f.valor}</span>
          ) : null}
        </span>
      </div>
      {textoMotivo}
      <div id={idDetalhe} className="m-detalhe" hidden={!aberto}>
        {aberto && (
          <>
            {(rolagens.length > 0 || propriedadeValor) && (
              <div className="m-bloco" data-m-bloco="rolagens">
                <h3 className="m-bloco-titulo">
                  {rolagens.length > 1 ? "Rolagens" : rolagens.length ? "Rolagem" : propriedadeValor.nome}
                  {rolagens.length > 0 && f.custoPE > 0 && (
                    <span className="e-pe" title="Rolar o Feitiço não desconta o PE. O gasto é feito à parte, na Energia."><ZapOff aria-hidden="true" />Não Desconta PE</span>
                  )}
                </h3>
                {rolagens.length === 0 && propriedadeValor && <p className="m-valor-grande">{propriedadeValor.valor}</p>}
                <div className="m-saidas">
                  {rolagens.map((r, i) => (
                    <span key={`${r.rotulo}:${i}`} className="m-saida">
                      <span className="m-rotulo">{rolagens.length > 1 ? r.rotulo : (propriedadeValor?.nome || f.valorLabel)}</span>
                      <Rolar valor={notacaoDoFeitico(r)} partes={r.partes} titulo={r.rotulo} motivo={motivos[i]} idMotivo={`${idDetalhe}-motivo-${i}`} avisar={avisar}
                        className="m-rolar-feitico" onRolar={() => rolar(pedidos[i])} />
                      {r.vezes > 1 && <span className="m-chip" title={`${r.vezes} ${r.rotulo}s`}>×{r.vezes}</span>}
                      {motivos[i] && <span id={`${idDetalhe}-motivo-${i}`} className="m-motivo"><AlertTriangle aria-hidden="true" />{motivos[i]}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {f.tecnicaMaxima && <div className="m-bloco">{controleTecnicaMaxima?.(f)}</div>}
            {conjuracaoBloodfeast?.(f)}
            {(propriedadesFixas.length > 0 || f.custoVidaAtivacao) && (
              <dl className="m-propriedades">
                {propriedadesFixas.map((p) => (
                  <div key={p.id} className="m-propriedade" data-afty-propriedade={p.id}><dt>{p.nome}</dt><dd>{p.valor}</dd></div>
                ))}
                {f.custoVidaAtivacao && (
                  <div className="m-propriedade" data-afty-propriedade="custoVida">
                    <dt>Custo de Vida</dt>
                    <dd>{f.custoVidaAtual} PV{!f.custoVidaDisponivel && <span className="m-aviso-chip"><AlertTriangle aria-hidden="true" />Vida Insuficiente</span>}</dd>
                  </div>
                )}
              </dl>
            )}
            {f.avisos?.length > 0 && (
              <ul className="m-avisos">{f.avisos.map((a) => <li key={a}><AlertTriangle aria-hidden="true" />{a}</li>)}</ul>
            )}
            {menu && (
              <div className="m-bloco" data-m-bloco="liberacao">
                <h3 className="m-bloco-titulo">Liberação Máxima <small>{validas.length}/{menu.max} · {menu.custoPE} PE</small></h3>
                {menu.categorias.map((c) => (
                  <div key={c.value} className="m-liberacao-grupo">
                    <span className="m-rotulo">{c.label}</span>
                    <span className="m-chips">
                      {c.melhorias.map((m) => {
                        const ligada = validas.includes(m.id);
                        return (
                          <DicaDeTexto key={m.id} titulo={m.nome} texto={m.descricao} nota={m.nota}>
                            <button type="button" className="m-seg-op m-opcao" aria-pressed={ligada} disabled={!ligada && validas.length >= menu.max} onClick={() => alterna(m.id)}>
                              {m.nome}
                            </button>
                          </DicaDeTexto>
                        );
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {!base.bloqueado && ritual(f)}
            {f.descricao && (
              <div className="m-bloco m-regra">
                <h3 className="m-bloco-titulo">Regra</h3>
                <div className="e-texto"><TextoRico texto={f.descricao} /></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Expansão de Domínio                                               */
/* ---------------------------------------------------------------- */
function BarreiraConflito({ info, rolar, prova, avisar }) {
  const b = info?.barreira;
  const c = info?.conflito;
  const mostraParede = !!b?.tem;
  const mostraConflito = (info?.domNivel ?? 0) > 0;
  const pedido = mostraConflito ? pedidoConflito(c) : null;
  const motivo = pedido ? motivoDaRecusa(prova(pedido), pedido) : null;
  if (!mostraParede && !mostraConflito) return null;
  return (
    <div className="afty-linha m-linha" data-m-linha="dominio:barreira">
      <div className="m-linha-topo">
        <span className="m-linha-nome m-linha-nome-fixo"><span className="m-nome">{mostraParede ? "Parede de Barreira" : "Conflito de Domínio"}</span></span>
        <span className="m-metas">
          {mostraParede && (
            <>
              <span className="m-meta"><NumeroComFontes className="m-meta-num" valor={`${b.pvParede} PV`} partes={b.partesPvParede} total={b.pvParede} formatar={false} ancora="direita" titulo="Pontos de vida de cada parede" /></span>
              {b.rdParede > 0 && <span className="m-meta">{b.rdParede} RD</span>}
              <span className="m-meta">{b.maxParedes} {b.maxParedes === 1 ? "Parede" : "Paredes"}</span>
              {b.temCortina && (
                <span className="m-meta">Cortina <NumeroComFontes className="m-meta-num" valor={`${b.pvCortina} PV`} partes={b.partesPvCortina} total={b.pvCortina} formatar={false} ancora="direita" titulo="Pontos de vida da cortina" /></span>
              )}
            </>
          )}
        </span>
        {mostraConflito && (
          <span className="m-acoes">
            <Rolar rotulo="Conflito" valor={`1d${c.faces}+${c.bonus}`} partes={c.partes} total={c.bonus} motivo={motivo} avisar={avisar} onRolar={() => rolar(pedido)} />
          </span>
        )}
      </div>
    </div>
  );
}

const ROTULO_FASE = { ativa: "Aberta", confronto: "Confronto", estendido: "Confronto Estendido", contestando: "Contestando" };

function LinhaExpansao({ d, ativo, fase, partesPvDomo, controle, aberto, onAberto, destaque }) {
  const chave = `dominio:${d.id}`;
  const raiz = useDestaqueG2(destaque?.chave === chave, destaque?.seq);
  const nome = useRef(null);
  const estrutura = d.versao === "sem_barreiras" ? "Totem" : "Domo";
  const corpo = d.corpo ?? { execucao: "", proprios: [], base: [], aparencia: "" };
  const comDomo = d.temDomo ?? true;
  const idDetalhe = `m-detalhe-${chave}`;
  return (
    <div ref={raiz} id={`afty-item-${chave}`} className="afty-linha m-linha" data-afty-destacada={ativo ? "sim" : "nao"}
      data-afty-alvo={destaque?.chave === chave ? "sim" : undefined} data-m-linha={chave} onKeyDown={(ev) => escDoDetalhe(ev, aberto, () => onAberto(chave), nome)}>
      <div className="m-linha-topo">
        <button ref={nome} type="button" className="m-linha-nome" aria-expanded={aberto} aria-controls={idDetalhe} onClick={() => onAberto(chave)}>
          <ChevronDown aria-hidden="true" className="m-seta" />
          <span className="m-nome">{d.nome || "Domínio Sem Nome"}</span>
        </button>
        <span className="m-metas">
          {fase && <span className="m-chip" data-tom="destaque">{ROTULO_FASE[fase] ?? "Aberta"}</span>}
          <span className="m-meta">Área {d.area}</span>
          <span className="m-meta">{d.duracao} {d.duracao === 1 ? "Rodada" : "Rodadas"}</span>
          {comDomo ? (
            <span className="m-meta">{estrutura} <NumeroComFontes className="m-meta-num" valor={`${d.pvBarreira} PV`} partes={partesPvDomo} total={d.pvBarreira} formatar={false} ancora="direita" titulo={`Pontos de vida do ${estrutura.toLowerCase()}`} /></span>
          ) : (
            <span className="m-meta">Alcance do Acerto Superior</span>
          )}
          {d.custo != null && (
            <span className="m-meta m-custo"><NumeroComFontes className="m-meta-num" valor={`${d.custo} PE`} partes={d.partesCusto} total={d.custo} formatar={false} ancora="direita" titulo="Custo da expansão" /></span>
          )}
        </span>
      </div>
      {/* Os controles de mesa ficam fora do corpo recolhível: abrir a Expansão é a ação do turno. */}
      {controle && <div className="m-expansao-controle">{controle}</div>}
      <div id={idDetalhe} className="m-detalhe" hidden={!aberto}>
        {aberto && (
          <>
            {corpo.execucao && (
              <dl className="m-propriedades"><div className="m-propriedade"><dt>Execução</dt><dd>{corpo.execucao}{corpo.requisitosExecucao ? ` · ${corpo.requisitosExecucao}` : ""}</dd></div></dl>
            )}
            {corpo.proprios.length > 0 && (
              <div className="m-bloco">
                {corpo.proprios.map((e) => (
                  <div key={e.id} className="m-efeito">
                    <h3 className="m-bloco-titulo">{e.titulo}{e.categoria && e.categoria !== e.titulo && <small>{e.categoria}</small>}</h3>
                    {e.texto && <p className="m-texto">{e.texto}</p>}
                  </div>
                ))}
              </div>
            )}
            {corpo.aparencia && (
              <div className="m-bloco"><h3 className="m-bloco-titulo">Aparência</h3><p className="m-texto">{corpo.aparencia}</p></div>
            )}
            {corpo.base.length > 0 && (
              <div className="m-bloco">
                <h3 className="m-bloco-titulo">Toda Expansão</h3>
                <dl className="m-propriedades m-propriedades-texto">
                  {corpo.base.map((b) => <div key={b.titulo} className="m-propriedade"><dt>{b.titulo}</dt><dd>{b.texto}</dd></div>)}
                </dl>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* A aba                                                             */
/* ---------------------------------------------------------------- */
const MODOS_DANO = [{ id: "normal", rotulo: "Normal" }, { id: "critico", rotulo: "Crítico" }, { id: "raio_negro", rotulo: "Raio Negro" }];

export default function AcoesG2({
  derived, sessao, rolar, prova, avisar, modo = "normal", turnoArmas = 0, rodadaArmas = 0,
  onSessao, onEstado, onGatilhoTreino, onAtaqueBasico, onImbuir, onArma, onAmpla,
  ritual, controleTecnicaMaxima, conjuracaoBloodfeast, controleExpansao, exaustaoTecnica = null,
  nosDaMesa, golpe = null, rapido = [], abertos, onAberto, destaque = null,
}) {
  const visivel = useContext(VisibilidadeDaAba);
  const dano = derived.dano?.entradas ?? [];
  const cura = derived.cura?.linhas ?? [];
  const feiticos = (derived.feiticos?.lista ?? []).filter((f) => f.tipo !== "passivo" && !f.marcial);
  // A Técnica Marcial tem a seção dela (2026-10-27). A Passiva marcial vai para as Habilidades.
  const tecnicas = (derived.feiticos?.lista ?? []).filter((f) => f.marcial && f.tipo !== "passivo");
  const dominios = derived.dominios?.lista ?? [];
  const dominioAtivo = derived.dominios?.ativoId ?? null;
  const dominioAberto = derived.dominios?.aberta ?? null;
  const temRaioNegro = (derived.aptidoesEscolhidas ?? []).includes("raio_negro");
  const temDominio = dominios.length > 0 || derived.dominios?.barreira?.tem || (derived.dominios?.domNivel ?? 0) > 0;
  /* Estado de TELA desta aba, que fica montada entre as trocas de aba: modo do dano e crítico pendente (chave com o turno, então um
     crítico de outro turno não vale mais). Nada disto vai para a sessão. */
  const [modoDano, setModoDano] = useState("normal");
  const modoDanoAtivo = modoDano === "raio_negro" && !temRaioNegro ? "normal" : modoDano;
  const [criticos, setCriticos] = useState({});
  const celulas = useMemo(() => celulasDaMesa({ derived, sessao, nos: nosDaMesa }), [derived, sessao, nosDaMesa]);
  const pendentesMesa = celulas.filter((c) => c.pendente).length;

  /* O índice salta para a seção, logo abaixo do cabeçalho grudado, e põe o foco no título dela. */
  const raiz = useRef(null);
  const salta = (id) => {
    const el = raiz.current?.querySelector(`[data-m-secao="${id}"]`);
    if (!el) return;
    const topo = parseFloat(getComputedStyle(document.getElementById("afty-ficha") ?? document.documentElement).getPropertyValue("--afty-ficha-topo")) || 0;
    window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - topo - 10), behavior: "smooth" });
    el.querySelector("h2")?.focus({ preventScroll: true });
  };
  const indice = [
    celulas.length && { id: "mesa", rotulo: "Mesa", n: celulas.length, extra: pendentesMesa ? (pendentesMesa === 1 ? "1 Pendente" : `${pendentesMesa} Pendentes`) : null },
    visivel && rapido.length && { id: "rapido", rotulo: "Rápido", n: rapido.length },
    dano.length && { id: "dano", rotulo: "Dano", n: dano.length },
    cura.length && { id: "cura", rotulo: "Cura", n: cura.length },
    tecnicas.length && { id: "tecnicas", rotulo: "Técnicas Marciais", n: tecnicas.length },
    (feiticos.length || exaustaoTecnica) && { id: "feiticos", rotulo: "Feitiços", n: feiticos.length },
    temDominio && { id: "dominio", rotulo: "Domínio", n: dominios.length || null },
  ].filter(Boolean);
  /* Sem Outros, a segunda coluna é só Feitiços e Domínio: uma ficha só de armas fica numa coluna, com o Dano na largura toda. */
  const colunaA = dano.length > 0 || cura.length > 0;
  const colunaB = feiticos.length > 0 || tecnicas.length > 0 || !!exaustaoTecnica || temDominio;

  return (
    <div ref={raiz} className="e-g2 m-aba m-acoes-aba" data-m-aba="acoes">
      {indice.length > 1 && (
        <nav className="m-indice" aria-label="Seções de Ações">
          {indice.map((s) => (
            <button key={s.id} type="button" className="m-indice-item" onClick={() => salta(s.id)}>
              <span>{s.rotulo}{s.n != null && <small>{s.n}</small>}</span>{s.extra &&<span className="m-pendente"><AlertTriangle aria-hidden="true" />{s.extra}</span>}
            </button>
          ))}
        </nav>
      )}

      <MesaG2 derived={derived} sessao={sessao} onSessao={onSessao} onEstado={onEstado} onGatilhoTreino={onGatilhoTreino} nos={nosDaMesa} golpe={golpe} />

      {/* O Rápido só existe com a aba à vista: a linha de Habilidades que ele reaproveita tem `data-chave`, que a consulta usa para
          devolver o foco, e uma aba oculta não pode oferecer esse alvo. */}
      {visivel && rapido.length > 0 && (
        <Secao id="rapido" titulo="Rápido" contagem={rapido.length} className="m-rapido">
          <div className="e-grupo-lista">{rapido}</div>
        </Secao>
      )}

      <div className="m-colunas" data-duas={colunaA && colunaB ? "sim" : undefined}>
        {colunaA && (
          <div className="m-coluna">
            {dano.length > 0 && (
              <Secao id="dano" titulo="Dano" contagem={dano.length} className="m-secao-dano" controles={(
                <>
                  <span className="m-seg" role="radiogroup" aria-label="Modo do Dano">
                    <span className="m-seg-rotulo" aria-hidden="true">Dano</span>
                    {MODOS_DANO.filter((m) => m.id !== "raio_negro" || temRaioNegro).map((m) => (
                      <button key={m.id} type="button" role="radio" className="m-seg-op" aria-checked={modoDanoAtivo === m.id} onClick={() => setModoDano(m.id)}>{m.rotulo}</button>
                    ))}
                  </span>
                  {modo !== "normal" && <span className="m-chip" data-m-d20="" title="Modo do d20, escolhido no painel de dados do cabeçalho">d20 {modo === "vantagem" ? "Vantagem" : "Desvantagem"}</span>}
                </>
              )}>
                {dano.map((e) => {
                  const k = `${e.chaveArma ?? e.id}:${turnoArmas}`;
                  return (
                    <LinhaDano key={k} e={e} rolar={rolar} prova={prova} avisar={avisar} critico={!!criticos[k]}
                      onCritico={(v) => setCriticos((c) => ({ ...c, [k]: v }))} modoDano={modoDanoAtivo}
                      aberto={abertos.has(`dano:${e.id}`)} onAberto={onAberto} destaque={destaque}
                      onAtaqueBasico={onAtaqueBasico} onArma={onArma} onAmpla={onAmpla} rodada={rodadaArmas} onImbuir={onImbuir} />
                  );
                })}
              </Secao>
            )}
            {cura.length > 0 && (
              <Secao id="cura" titulo="Cura" contagem={cura.length}>
                {cura.map((l) => <LinhaCura key={l.id} l={l} rolar={rolar} prova={prova} avisar={avisar} destaque={destaque} />)}
              </Secao>
            )}
          </div>
        )}
        {colunaB && (
          <div className="m-coluna">
            {tecnicas.length > 0 && (
              <Secao id="tecnicas" titulo="Técnicas Marciais" contagem={tecnicas.length}>
                {tecnicas.map((t) => (t.tipo === "ataque" && t.ataque ? (
                  <LinhaTecnicaAtaque key={t.id} f={t} info={derived.tecnicasMarciais?.ataques?.[t.id]}
                    usos={derived.mesa?.[`tecnicaMarcial:${t.id}`]?.usos ?? null} sessao={sessao} onSessao={onSessao}
                    rolar={rolar} prova={prova} avisar={avisar} modoDano={modoDanoAtivo} destaque={destaque}
                    consomeEstadoNoPrimeiro={derived.tecnicasMarciais?.consomeEstadoNoPrimeiro ?? null} />
                ) : (
                  <LinhaFeitico key={t.id} f={t} sessao={sessao} rolar={rolar} prova={prova} avisar={avisar}
                    aberto={abertos.has(`feitico:${t.id}`)} onAberto={onAberto} destaque={destaque}
                    comLiberacao={derived.feiticos?.comLiberacao} controleTecnicaMaxima={controleTecnicaMaxima}
                    conjuracaoBloodfeast={conjuracaoBloodfeast} ritual={ritual} />
                )))}
              </Secao>
            )}
            {(feiticos.length > 0 || exaustaoTecnica) && (
              <Secao id="feiticos" titulo="Feitiços" contagem={feiticos.length}>
                {exaustaoTecnica && <div className="m-faixa">{exaustaoTecnica}</div>}
                {feiticos.map((f) => (
                  <LinhaFeitico key={f.id} f={f} sessao={sessao} rolar={rolar} prova={prova} avisar={avisar}
                    aberto={abertos.has(`feitico:${f.id}`)} onAberto={onAberto} destaque={destaque}
                    comLiberacao={derived.feiticos?.comLiberacao} controleTecnicaMaxima={controleTecnicaMaxima}
                    conjuracaoBloodfeast={conjuracaoBloodfeast} ritual={ritual} />
                ))}
              </Secao>
            )}
            {temDominio && (
              <Secao id="dominio" titulo="Expansão de Domínio" contagem={dominios.length || null}>
                <BarreiraConflito info={derived.dominios} rolar={rolar} prova={prova} avisar={avisar} />
                {dominios.map((d) => (
                  <LinhaExpansao key={d.id} d={d} ativo={d.id === dominioAtivo} fase={dominioAberto?.id === d.id ? dominioAberto.fase : null}
                    partesPvDomo={derived.dominios?.barreira?.partesPvDomo} controle={controleExpansao?.(d) ?? null}
                    aberto={abertos.has(`dominio:${d.id}`)} onAberto={onAberto} destaque={destaque} />
                ))}
              </Secao>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
