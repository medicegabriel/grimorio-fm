/* ============================================================
   CABEÇALHO E AGORA, NUMA PLACA SÓ
   ============================================================
   Faixa de cima: quem é (retrato com moldura, nome, classe), os recursos e os controles da ficha. Faixa de baixo: os valores e o Agora.

   O QUE É DA FICHA CONTINUA AQUI. A placa aprovada do estudo tem três barras, mas a Ficha também tem o Preparo (Combatente), o Voo, a Guarda
   e o Titã (que moram logo abaixo desta placa, na própria Ficha), o chip de Sobrecarregado, a marca de Addon, a densidade, o cofre de
   texto, a busca e o descanso com a escolha da Marionete. Nada disso saiu por não aparecer no personagem do estudo.

   O Agora mostra o combate, a rodada e o ACESSO aos efeitos: quantos estão ativos e quantos pedem atenção. As condições moram em Efeitos
   (desde 2026-10-14 sem chip próprio aqui): com quinze efeitos a faixa não comporta cada um, e a gestão mora na aba Efeitos ou no painel
   ao lado.
   ============================================================ */
import React, { useCallback, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, MoreHorizontal, Search, Sparkles, SunMoon, Swords } from "lucide-react";
import { statsDaFicha, aplicaPreferencia } from "./estatisticas";
import { Retrato, Medidor, PainelVital, Flutuante, Valor } from "./pecas";
import { recursos, linhaDeIdentidade, useQuantosCabem } from "./pecas-logica";
import { Sessao } from "./ponte";
import EstatisticasConfig from "./EstatisticasConfig";
import OrbitasDoRetrato from "../../ui/OrbitasDoRetrato";
import BotaoDeDescanso from "../BotaoDeDescanso";

function Stat({ s, m }) {
  return (
    <div className="afty-stat e-stat" data-afty-stat={s.id} data-efeito={m.marcadas.has(s.chaveSaldo ?? s.id) ? "sim" : undefined} data-cabe>
      <dt className="afty-stat-rotulo" title={s.k}>{s.k}</dt>
      <dd><Valor valor={s.v} partes={s.partes} total={s.v} titulo={s.k} classe="afty-stat-valor" /></dd>
    </div>
  );
}

/* Os valores numa fileira só: o que não cabe vai para "+N". A ordem e o que aparece são a preferência do personagem (`estatisticas.js`): o que o
   jogador ocultou não está aqui, e por isso nunca volta como excesso de largura no "+N". Sem preferência, é a apresentação de sempre. */
function Valores({ m, stats, preferencia, onConfigurar }) {
  const caixa = useRef(null);
  const [mais, setMais] = useState(null);
  const visiveis = aplicaPreferencia(stats, preferencia).visiveis;
  const cabem = useQuantosCabem(caixa, visiveis.map((s) => `${s.id}:${s.v}`).join("|"), 48);
  const resto = visiveis.slice(Math.min(cabem, visiveis.length));
  return (
    <dl ref={caixa} className="afty-stats e-stats">
      {visiveis.slice(0, cabem).map((s) => <Stat key={s.id} s={s} m={m} />)}
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

/* O RECURSO PRÓPRIO (autor, 2026-11-16): a barra a mais da ficha, com nome e máximo digitados (as Calorias da Dehya). A definição grava na criatura
   (`recursoProprio`), e Remover a apaga. O corrente é da sessão e não passa por aqui. */
function RecursoProprioConfig({ ancora, atual, onSalvar, onFechar }) {
  const [nome, setNome] = useState(atual?.nome ?? "");
  const [max, setMax] = useState(atual ? String(atual.max) : "");
  const n = Math.max(0, Math.trunc(Number(max) || 0));
  const pronto = nome.trim() !== "" && n > 0;
  const grava = () => { if (pronto) { onSalvar({ nome: nome.trim(), max: n }); onFechar(); } };
  return (
    <Flutuante ancora={ancora} onFechar={onFechar} largura={300} rotulo="Recurso Próprio" classe="h-estat-painel">
      <div className="m-painel-vital" data-recurso-proprio-config>
        <div className="m-pv-titulo"><b>Recurso Próprio</b></div>
        <label className="m-pv-linha">
          <span className="m-rotulo">Nome</span>
          <input className="afty-campo m-campo-texto" value={nome} maxLength={24} onChange={(e) => setNome(e.target.value)} aria-label="Nome do recurso"
            onKeyDown={(e) => { if (e.key === "Enter") grava(); }} />
        </label>
        <label className="m-pv-linha">
          <span className="m-rotulo">Máximo</span>
          <input className="afty-campo m-campo-num" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))} aria-label="Máximo do recurso"
            placeholder="0" onKeyDown={(e) => { if (e.key === "Enter") grava(); }} />
        </label>
        <div className="m-pv-rodape h-proprio-rodape">
          {atual && <button type="button" className="afty-botao m-botao" onClick={() => { onSalvar(null); onFechar(); }}>Remover</button>}
          <button type="button" className="afty-botao m-botao" onClick={onFechar}>Fechar</button>
          <button type="button" className="afty-botao m-botao g2-primario" disabled={!pronto} onClick={grava}>Salvar</button>
        </div>
      </div>
    </Flutuante>
  );
}

function Menu({ densidade, onDensidade, cofre, apresentacaoAnterior, onHistorico, onConfigurar, onAparencia, onEditar, onRecursoProprio }) {
  const [menu, setMenu] = useState(null);
  const fecha = () => setMenu(null);
  const item = (rotulo, aoClicar, extra = {}) => (
    <button role="menuitem" type="button" className="e-menu-item" onClick={() => { const a = menu; fecha(); aoClicar(a); }} {...extra}>{rotulo}</button>
  );
  return (
    <>
      <button type="button" className="afty-botao e-icone" aria-label="Mais opções da ficha" aria-haspopup="menu" onClick={(e) => setMenu(e.currentTarget)}>
        <MoreHorizontal aria-hidden="true" />
      </button>
      {menu && (
        <Flutuante ancora={menu} onFechar={fecha} largura={260} rotulo="Opções da ficha">
          <div role="menu" className="e-menu">
            {item("Histórico da Sessão", onHistorico, { "data-menu-historico": "" })}
            {item("Estatísticas do Cabeçalho", onConfigurar, { "data-menu-estatisticas": "" })}
            {item(densidade === "compacta" ? "Densidade Confortável" : "Densidade Compacta", onDensidade, { "aria-pressed": densidade === "compacta", "data-menu-densidade": "" })}
            {onRecursoProprio && item("Recurso Próprio", onRecursoProprio, { "data-menu-recurso-proprio": "" })}
            {item("Aparência", onAparencia)}
            {/* A antiga aba Buffs, mantida enquanto os Efeitos novos não cobrem tudo que ela fazia (Imitação, Concessão do mestre, Exaustão, Sangramento e o buff de mesa). */}
            {apresentacaoAnterior && item(apresentacaoAnterior.ativa ? "Usar os Efeitos Novos" : "Usar a Apresentação Anterior", apresentacaoAnterior.alterna, { "data-menu-apresentacao": "" })}
            {cofre && item(cofre.aberto ? "Cofre Aberto Nesta Aba" : "Texto Protegido por Senha", cofre.onAbrir, { "data-menu-cofre": "" })}
            {item("Editar no Criador", onEditar, { "data-menu-editar": "" })}
          </div>
        </Flutuante>
      )}
    </>
  );
}

/* As condições não têm mais chip próprio aqui (autor, 2026-10-14): moram em Efeitos, com a duração e o que mudam na conta, e o acesso "Efeitos"
   leva até elas. */
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

/* `acoesDaFicha`: o que só a Ficha sabe fazer (voltar, buscar, editar, aparência, densidade, cofre). O Cabeçalho não decide nenhum deles. */
export default function Cabecalho({
  m, acesso, total, atencao, onHistorico = () => {}, preferencia = null, onPreferencia = () => {}, acoesDaFicha,
}) {
  const { ficha, derived } = m;
  const { onVoltar, onBusca, onEditar, onAparencia, densidade, onDensidade, cofre, apresentacaoAnterior, face = null, onSalvarRecursoProprio = null } = acoesDaFicha;
  const [proprioConfig, setProprioConfig] = useState(null);
  const fechaProprio = useCallback(() => setProprioConfig(null), []);
  const [vital, setVital] = useState(null);
  /* O painel de configuração das estatísticas (a âncora é o botão que o abriu). A preferência é do personagem. */
  const [config, setConfig] = useState(null);
  /* O `Flutuante` refaz o foco quando o `onFechar` muda: ele tem de ser estável, ou cada mudança de estado devolve o foco à primeira linha. */
  const fechaConfig = useCallback(() => setConfig(null), []);
  const fechaVital = useCallback(() => setVital(null), []);
  const id = linhaDeIdentidade(ficha, derived);
  const stats = statsDaFicha(derived);
  return (
    /* ⚠ A PLACA TAMBÉM É `.afty-cabecalho`. O tema e o CSS personalizado pintam o cabeçalho por essa classe (fundo, texto, fio de luz, chips e botões
       dentro dele), e a placa é a parte do cabeçalho que ficou à vista. Sem a classe, um tema claro com faixa escura deixava a placa clara com texto claro.
       `.afty-placa` (A4 de docs/tema-g2-problemas.md, 2026-11-14) é o nome de contrato SÓ da placa, para o tema mirar nela sem o `.afty-cabecalho .afty-cabecalho`.
       O fundo da placa mora em `:where` (`efeitos-g2.css`), então `.afty-placa` sozinho repinta. */
    <div className="e-cabeca afty-cabecalho afty-placa">
      {/* O RETRATO É A ÂNCORA: uma moldura que acompanha a altura do corpo inteiro (placa e faixa), à esquerda. A identidade ocupa só a largura do nome. */}
      <div className="e-moldura"><Retrato ficha={ficha} classe="e-retrato" /><OrbitasDoRetrato orbitas={derived.orbitas} /></div>
      <div className="e-corpo">
        <div className="e-placa">
          <button type="button" className="afty-botao e-icone e-voltar" onClick={onVoltar} aria-label="Voltar"><ChevronLeft aria-hidden="true" /></button>
          <div className="e-ident">
            <h1 className="afty-nome e-nome">{ficha.name || "Sem nome"}</h1>
            <p className="e-linhagem">
              {id.principal.map((x, i) => <span key={x.texto} className={i === 0 ? "e-classe" : undefined} title={x.title}>{x.texto}</span>)}
              {id.extra.map((x) => (
                <span key={x.texto} title={x.title} data-aviso={x.aviso ? "sim" : undefined}>
                  {x.aviso && <AlertTriangle aria-hidden="true" className="e-linhagem-aviso" />}{x.texto}
                </span>
              ))}
            </p>
          </div>
          <div className="e-recursos">
            {recursos(m).map((r) => <Medidor key={r.tipo} r={r} m={m} onAbrir={(e) => setVital({ tipo: r.tipo, ancora: e.currentTarget })} />)}
          </div>
          <div className="e-controles">
            {/* A troca de face só existe em tema de duas faces (`temDuasFaces`). O ícone é do app e o tema pode trocá-lo por `.afty-face-botao`. */}
            {face && (
              <button type="button" className="afty-botao e-icone afty-face-botao" data-afty-face-atual={face.atual} onClick={face.alterna}
                aria-pressed={face.atual === "2"} title="Alternar Face" aria-label="Alternar Face"><SunMoon aria-hidden="true" /></button>
            )}
            <button type="button" className="afty-botao e-icone" onClick={onBusca} title="Buscar na ficha (Ctrl+K)" aria-label="Buscar na ficha"><Search aria-hidden="true" /></button>
            <BotaoDeDescanso sessao={m.sessao} derived={derived} onDescansar={(marioneteId) => m.acoes.descansar({ marioneteId })} />
            <Menu densidade={densidade} onDensidade={onDensidade} cofre={cofre} apresentacaoAnterior={apresentacaoAnterior} onHistorico={onHistorico} onConfigurar={setConfig}
              onAparencia={onAparencia} onEditar={onEditar} onRecursoProprio={onSalvarRecursoProprio ? setProprioConfig : null} />
          </div>
        </div>
        <div className="e-faixa">
          <Valores m={m} stats={stats} preferencia={preferencia} onConfigurar={setConfig} />
          <Agora m={m} acesso={acesso} total={total} atencao={atencao} />
        </div>
      </div>
      {proprioConfig && <RecursoProprioConfig ancora={proprioConfig} atual={Sessao.recursoProprioDe(ficha)} onSalvar={onSalvarRecursoProprio} onFechar={fechaProprio} />}
      {config && <EstatisticasConfig ancora={config} stats={stats} preferencia={preferencia} onFechar={fechaConfig} onMuda={onPreferencia} />}
      {vital && (
        <Flutuante ancora={vital.ancora} onFechar={fechaVital} largura={320} rotulo={`Painel de ${vital.tipo}`}>
          <PainelVital tipo={vital.tipo} m={m} onFechar={fechaVital} />
        </Flutuante>
      )}
    </div>
  );
}

