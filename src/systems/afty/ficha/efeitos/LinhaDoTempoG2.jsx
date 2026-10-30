/* ============================================================
   G2 · A LINHA DO TEMPO DA ABA COMPLETA
   ============================================================
   A referência visual é a do G2 no modelo estático (esquemas-efeitos.html).
   As colunas são a rodada GERAL da sessão (a de agora e as três seguintes);
   o contador PRÓPRIO do Invencível vai dentro da barra ("2 de 4").
   Os dados são a virada do motor sobre cópias da sessão (`linhaDoTempo.js`):
   ler a Linha do Tempo não muda a sessão nem o histórico.

   Cada acontecimento (cobrança, Exaustão, encerramento, a Aura opcional) é um
   MARCADOR pequeno na própria faixa da barra: o do começo da rodada à
   esquerda, o do fim à direita. A linha tem sempre a altura de uma barra.
   A explicação completa (acontecimento, efeito, rodada, motivo) abre numa
   sobreposição FIXA, fora do fluxo da grade: ao passar o mouse, no foco do
   teclado ou no clique (que a deixa presa). Esc ou um clique fora fecham.
   Consultar um marcador não seleciona nada nem executa ação.

   Clicar no nome ou na barra abre o cartão e o traz à vista; o cartão aberto
   marca a linha dele. Sem nada que a ficha conte ou cobre, nada é desenhado.
   ============================================================ */
import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Hand, Power, Zap } from "lucide-react";
import { avancaFatia } from "../fatias";
import { COLUNAS, energiaDe, linhasDoTempo, projetarViradasEmPassos } from "./g2-linha-do-tempo";

/* Um símbolo por acontecimento: Zap é o PE que a ficha desconta (o mesmo do
   custo), o triângulo é a Exaustão, Power é o encerramento (o mesmo do botão
   Encerrar) e a mão é o que o jogador faz se quiser. */
const ICONE = { cobra: Zap, exaustao: AlertTriangle, encerra: Power, opcional: Hand };

/* A sobreposição: posição fixa calculada do marcador, presa à janela. */
function Dica({ id, alvo, marca, nome }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const I = ICONE[marca.icone] ?? AlertTriangle;
  useLayoutEffect(() => {
    const posicionar = () => {
      const el = ref.current, a = alvo.current;
      if (!el || !a) return;
      const r = a.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, M = 8;
      let left = marca.lado === "fim" ? r.right - w : r.left;
      left = Math.max(M, Math.min(left, innerWidth - w - M));
      let top = r.bottom + 6;
      if (top + h > innerHeight - M) top = Math.max(M, r.top - 6 - h);
      setPos({ left, top });
    };
    posicionar();
    addEventListener("scroll", posicionar, true);
    addEventListener("resize", posicionar);
    return () => { removeEventListener("scroll", posicionar, true); removeEventListener("resize", posicionar); };
  }, [alvo, marca]);
  return (
    <div ref={ref} id={id} role="tooltip" className="lt-dica" data-tom={marca.tom} data-dica={marca.evento}
      style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: "hidden" }}>
      <span className="lt-dica-titulo"><I aria-hidden="true" />{marca.acontecimento}</span>
      <dl className="lt-dica-campos">
        <dt>Efeito</dt><dd>{nome}</dd>
        <dt>Rodada</dt><dd>{marca.quando}</dd>
        {marca.motivo && <><dt>Motivo</dt><dd>{marca.motivo}</dd></>}
        {marca.condicao && <><dt>Vale</dt><dd>{marca.condicao}</dd></>}
      </dl>
      {marca.nota && <span className="lt-dica-nota">{marca.nota}</span>}
    </div>
  );
}

function Marcador({ marca, nome, aberto, setAberto, idMarcador }) {
  const ref = useRef(null);
  const idDica = `${useId()}-dica`;
  const I = ICONE[marca.icone] ?? AlertTriangle;
  const meu = aberto?.id === idMarcador;
  /* Esc e o clique fora fecham, só enquanto este estiver aberto. */
  useEffect(() => {
    if (!meu) return undefined;
    const tecla = (e) => { if (e.key === "Escape") { e.stopPropagation(); setAberto(null); } };
    const fora = (e) => { if (!ref.current?.contains(e.target) && !document.getElementById(idDica)?.contains(e.target)) setAberto(null); };
    document.addEventListener("keydown", tecla, true);
    document.addEventListener("pointerdown", fora, true);
    return () => { document.removeEventListener("keydown", tecla, true); document.removeEventListener("pointerdown", fora, true); };
  }, [meu, idDica, setAberto]);
  /* O que abriu pelo mouse ou pelo foco fecha ao sair. O preso pelo clique fica. */
  const solta = () => setAberto((a) => (a?.id === idMarcador && !a.fixo ? null : a));
  const mostra = () => setAberto((a) => (a?.fixo || a?.id === idMarcador ? a : { id: idMarcador, fixo: false }));
  return (
    <>
      <button ref={ref} type="button" className="lt-pino" data-tom={marca.tom} data-evento={marca.evento} data-lado={marca.lado} data-quando={marca.quando} data-motivo={marca.motivo ?? undefined}
        aria-label={`${nome}: ${marca.texto}`} aria-describedby={meu ? idDica : undefined} aria-expanded={meu}
        onMouseEnter={mostra} onMouseLeave={solta} onFocus={mostra} onBlur={solta}
        onClick={(e) => { e.stopPropagation(); setAberto((a) => (a?.id === idMarcador && a.fixo ? null : { id: idMarcador, fixo: true })); }}>
        <I aria-hidden="true" />
      </button>
      {meu && <Dica id={idDica} alvo={ref} marca={marca} nome={nome} />}
    </>
  );
}

/* A projeção em FATIAS de uns 30 ms, entre quadros (cada virada é um derive): o clique que mudou a sessão pinta primeiro, e a previsão chega logo depois. Vale a
   anterior até a nova terminar, e nada até a primeira (a seção só aparece quando há o que mostrar). É a mesma conta de `projetarViradas`. */
function useProjecao(ficha, sessao, derived) {
  const [P, setP] = useState(null);
  useEffect(() => {
    let vivo = true;
    let timer = null;
    const job = projetarViradasEmPassos(ficha, sessao, derived);
    const passo = () => {
      if (!vivo) return;
      const r = avancaFatia(job);
      if (r.done) { setP(r.value); return; }
      timer = setTimeout(passo, 0);
    };
    timer = setTimeout(passo, 0);
    return () => { vivo = false; clearTimeout(timer); };
  }, [ficha, sessao, derived]);
  return P;
}

export function LinhaDoTempoG2({ g, m }) {
  /* A previsão são quatro viradas do motor com a ficha recalculada a cada passo: ela vem DEPOIS da pintura (valor adiado), e o clique que mudou a sessão não a
     espera. Continua sendo a mesma conta, só que num segundo tempo. */
  const P = useProjecao(m.ficha, m.mesa.sessao, m.derived);
  const linhas = useMemo(() => (P ? linhasDoTempo(P, g.ativos, g.encerrados) : []), [P, g.ativos, g.encerrados]);
  /* A explicação aberta é estado desta tela só ({ id, fixo }). Nada vai à sessão. */
  const [aberto, setAberto] = useState(null);
  if (!linhas.length) return null;
  const abrir = (alvo) => {
    if (!alvo) return;
    if (alvo.tipo === "encerrado") g.mudaTela({ encerradosAberto: true, reativando: null, revelar: `encerrado:${alvo.chave}` });
    else g.mudaTela({ selecionado: alvo.chave, revelar: alvo.chave });
  };
  return (
    <section className="lt-painel" aria-label="Prazos e cobranças" data-linha-do-tempo>
      <div className="lt-linha lt-cab">
        <span className="lt-cab-nome">Prazos e Cobranças</span>
        {P.slice(0, COLUNAS).map((p, k) => (
          <span key={k} className="lt-cab-r" data-agora={k === 0 ? "" : undefined} data-rodada={p.sessao.rodada} data-energia={energiaDe(p.sessao)} data-exaustao={Math.trunc(Number(p.sessao.exaustao) || 0)}>
            Rodada {p.sessao.rodada}{k === 0 && <small>Agora</small>}
          </span>
        ))}
      </div>
      {linhas.map((l) => (
        <div key={l.chave} className="lt-linha" data-linha={l.chave} data-marcada={l.alvo?.tipo === "ativo" && g.tela.selecionado === l.alvo.chave ? "" : undefined}>
          <button type="button" className="lt-nome" onClick={() => abrir(l.alvo)} disabled={!l.alvo} title={l.nome}>
            <span className="lt-nome-texto">{l.nome}</span>{l.sub && <small>{l.sub}</small>}
          </button>
          {l.celulas.map((c, k) => {
            const ini = c.marcas.filter((x) => x.lado !== "fim"), fim = c.marcas.filter((x) => x.lado === "fim");
            const pino = (x, i) => <Marcador key={x.evento + i} marca={x} nome={l.nome} aberto={aberto} setAberto={setAberto} idMarcador={`${l.chave}|${k}|${x.evento}|${i}`} />;
            return (
              <span key={k} className="lt-celula" data-agora={k === 0 ? "" : undefined} data-r={k}>
                <span className="lt-faixa">
                  {c.seg && (
                    <span className="lt-seg" role="button" tabIndex={-1} onClick={() => abrir(l.alvo)} data-tipo={c.seg.tipo}
                      data-ini={c.seg.ini ? "" : undefined} data-fim={c.seg.fim ? "" : undefined} data-mantido={c.seg.tipo === "condicional" ? "" : undefined}
                      style={{ "--m-ini": ini.length, "--m-fim": fim.length }}
                      title={c.seg.tipo === "condicional" ? "Se o jogador mantiver e a ficha puder cobrar" : undefined}><span className="lt-seg-texto">{c.seg.pre && <span className="lt-seg-pre">{c.seg.pre}</span>}<span className="lt-seg-valor">{c.seg.texto}</span></span></span>
                  )}
                  {ini.length > 0 && <span className="lt-pinos" data-lado="inicio">{ini.map(pino)}</span>}
                  {fim.length > 0 && <span className="lt-pinos" data-lado="fim">{fim.map(pino)}</span>}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </section>
  );
}
