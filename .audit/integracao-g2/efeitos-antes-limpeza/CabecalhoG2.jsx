/* ============================================================
   CABEÇALHO E AGORA, NUMA PLACA SÓ
   ============================================================
   Faixa de cima: quem é (retrato com moldura, nome, classe) e os três
   recursos. Faixa de baixo: os valores e o Agora.
   O Agora mostra o combate, a rodada e o ACESSO aos efeitos: quantos estão
   ativos e quantos pedem atenção. As condições moram em Efeitos (desde
   2026-10-14 sem chip próprio aqui): com quinze efeitos a faixa não
   comporta cada um, e a gestão mora na aba Efeitos ou no painel ao lado.
   ============================================================ */
import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, MoreHorizontal, Sparkles, Swords } from "lucide-react";
import { statsDaFicha } from "./estatisticas";
import { Retrato, Medidor, PainelVital, Flutuante, Valor } from "./pecas";
import { recursos, linhaDeIdentidade, useQuantosCabem } from "./pecas-logica";
import { aplicaPreferencia } from "./estatisticas";
import EstatisticasConfig from "./EstatisticasConfig";

function Stat({ s, m }) {
  return (
    <div className="afty-stat e-stat" data-afty-stat={s.id} data-efeito={m.marcadas.has(s.chaveSaldo ?? s.id) ? "sim" : undefined} data-cabe>
      <dt>{s.k}</dt>
      <dd><Valor valor={s.v} partes={s.partes} total={s.v} titulo={s.k} classe="afty-stat-valor" /></dd>
    </div>
  );
}

/* Os valores numa fileira só: o que não cabe vai para "+N". A ordem e o que aparece são a preferência do personagem (`estatisticas.js`): o que o
   jogador ocultou não está aqui, e por isso nunca volta como excesso de largura no "+N". Sem preferência, é a apresentação de sempre. */
function Valores({ m, onConfigurar }) {
  const caixa = useRef(null);
  const [mais, setMais] = useState(null);
  const stats = aplicaPreferencia(statsDaFicha(m.derived), m.ui?.estatisticas).visiveis;
  const cabem = useQuantosCabem(caixa, stats.map((s) => `${s.id}:${s.v}`).join("|"), 48);
  const resto = stats.slice(Math.min(cabem, stats.length));
  return (
    <dl ref={caixa} className="afty-stats e-stats">
      {stats.slice(0, cabem).map((s) => <Stat key={s.id} s={s} m={m} />)}
      {resto.length > 0 && (
        <>
          <button type="button" className="e-mais" onClick={(e) => setMais(e.currentTarget)} aria-label={`Mais ${resto.length} valores`}>+{resto.length}</button>
          {mais && (
            <Flutuante ancora={mais} onFechar={() => setMais(null)} largura={240} rotulo="Mais valores">
              <dl className="e-stats-mais">{resto.map((s) => <Stat key={s.id} s={s} m={m} />)}</dl>
              <button type="button" className="m-link h-estat-abrir" onClick={() => { const a = mais; setMais(null); onConfigurar(a); }} data-estat-abrir>Configurar Estatísticas</button>
            </Flutuante>
          )}
        </>
      )}
    </dl>
  );
}

function Menu({ m, onConfigurar, onHistorico }) {
  const [menu, setMenu] = useState(null);
  const [confirma, setConfirma] = useState(false);
  const fecha = () => { setMenu(null); setConfirma(false); };
  return (
    <>
      <button type="button" className="afty-botao e-icone" aria-label="Mais opções da ficha" aria-haspopup="menu" onClick={(e) => setMenu(e.currentTarget)}>
        <MoreHorizontal aria-hidden="true" />
      </button>
      {menu && (
        <Flutuante ancora={menu} onFechar={fecha} largura={240} rotulo="Opções da ficha">
          <div role="menu" className="e-menu">
            {confirma
              ? <button role="menuitem" type="button" className="e-menu-item e-menu-confirma" onClick={() => { m.acoes.descansar(); fecha(); }}>Confirmar Descanso</button>
              : <button role="menuitem" type="button" className="e-menu-item" onClick={() => setConfirma(true)}>Descanso</button>}
            <button role="menuitem" type="button" className="e-menu-item" onClick={() => { const a = menu; fecha(); onHistorico(a); }} data-menu-historico>Histórico</button>
            <button role="menuitem" type="button" className="e-menu-item" onClick={() => { const a = menu; fecha(); onConfigurar(a); }} data-menu-estatisticas>Estatísticas do Cabeçalho</button>
            <button role="menuitem" type="button" className="e-menu-item" onClick={() => { m.acoes.representado("Aparência"); fecha(); }}>Aparência</button>
            <button role="menuitem" type="button" className="e-menu-item" onClick={() => { m.acoes.representado("Editar no Criador"); fecha(); }}>Editar no Criador</button>
          </div>
        </Flutuante>
      )}
    </>
  );
}

/* As condições não têm mais chip próprio aqui (autor, 2026-10-14): moram em
   Efeitos, com a duração e o que mudam na conta, e o acesso "Efeitos" leva
   até elas. */
function Agora({ m, acesso, total, atencao }) {
  return (
    <section className="e-agora" aria-label="Agora">
      <span className="e-agora-rotulo">Agora</span>
      <button type="button" className="e-combate" aria-pressed={m.combate} onClick={m.acoes.alternaCombate}>
        <Swords aria-hidden="true" />{m.combate ? "Em Combate" : "Fora de Combate"}
      </button>
      <span className="e-rodada">
        Rodada <b aria-live="polite">{m.sessao.rodada}</b>
        <button type="button" className="e-proxima" onClick={m.acoes.proximaRodada} aria-label="Próxima rodada" title="Próxima Rodada"><ChevronRight aria-hidden="true" /></button>
      </span>
      <button type="button" className="f-acesso" aria-pressed={acesso.pressionado} aria-controls={acesso.controla} onClick={acesso.onClick}
        title={acesso.dica} aria-label={`${acesso.rotulo}: ${total} ativos${atencao ? `, ${atencao} pedem atenção` : ""}. ${acesso.dica ?? ""}`}>
        <Sparkles aria-hidden="true" />{acesso.rotulo}<b>{total}</b>
        {atencao > 0 && <span className="f-acesso-atencao"><AlertTriangle aria-hidden="true" />{atencao}</span>}
      </button>
    </section>
  );
}

export default function Cabecalho({ m, acesso, total, atencao, onHistorico = () => {} }) {
  const { ficha, derived } = m;
  const [vital, setVital] = useState(null);
  /* O painel de configuração das estatísticas (a âncora é o botão que o abriu). A preferência é da mesa do personagem. */
  const [config, setConfig] = useState(null);
  /* O `Flutuante` refaz o foco quando o `onFechar` muda: ele tem de ser estável, ou cada mudança de estado devolve o foco à primeira linha. */
  const fechaConfig = useCallback(() => setConfig(null), []);
  const id = linhaDeIdentidade(ficha, derived);
  return (
    <header className="afty-cabecalho e-cabeca">
      <div className="e-placa">
        <div className="e-moldura"><Retrato ficha={ficha} classe="e-retrato" /></div>
        <div className="e-ident">
          <h1 className="afty-nome e-nome">{ficha.name || "Sem nome"}</h1>
          <p className="e-linhagem">
            {id.principal.map((t, i) => <span key={t} className={i === 0 ? "e-classe" : undefined}>{t}</span>)}
            {id.extra.map((t) => <span key={t}>{t}</span>)}
          </p>
        </div>
        <div className="e-recursos">
          {recursos(m).map((r) => <Medidor key={r.tipo} r={r} m={m} onAbrir={(e) => setVital({ tipo: r.tipo, ancora: e.currentTarget })} />)}
        </div>
        <Menu m={m} onConfigurar={setConfig} onHistorico={onHistorico} />
      </div>
      <div className="e-faixa">
        <Valores m={m} onConfigurar={setConfig} />
        <Agora m={m} acesso={acesso} total={total} atencao={atencao} />
      </div>
      {config && (
        <EstatisticasConfig ancora={config} stats={statsDaFicha(derived)} preferencia={m.ui?.estatisticas} onFechar={fechaConfig}
          onMuda={(p) => m.setUi((u) => ({ ...u, estatisticas: p }))} />
      )}
      {vital && (
        <Flutuante ancora={vital.ancora} onFechar={() => setVital(null)} largura={320} rotulo={`Painel de ${vital.tipo}`}>
          <PainelVital tipo={vital.tipo} m={m} onFechar={() => setVital(null)} />
        </Flutuante>
      )}
    </header>
  );
}
