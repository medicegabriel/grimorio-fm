import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X, RotateCcw, AlertTriangle, Check, Copy, ClipboardPaste } from "lucide-react";

import {
  PRESETS, GRUPOS_DE_TOKEN, FONTES, FONTES_WEB, ENCAIXES, CSS_MAX,
  corEfetiva, temaEmBranco, normalizaTema, escopoSuportado, saneiaCss, contratoDaEstrutura,
  atributosDaEstrutura, promptParaIA, auditaCss,
} from "./ficha-tema";
import { useFontesDaPrevia } from "./useFontesWeb";

/* Agrupado na ordem em que os grupos aparecem no contrato. Uma lista corrida de
   45 seletores não se lê. */

const ABAS_CSS = [
  { id: "css", label: "CSS" },
  { id: "seletores", label: "Seletores" },
  { id: "prompt", label: "Prompt IA" },
];

/**
 * ============================================================
 * APARÊNCIA — o painel onde a pessoa formata a própria ficha
 * ============================================================
 * Quatro camadas, da mais fácil para a mais livre: preset, formulário de cor,
 * imagem de fundo e CSS livre.
 *
 * ⚠ O CONTRATO DE CLASSES aparece na tela, e isso NÃO fere a regra de "nada de
 * texto explicativo na UI". A regra existe porque o criador de fichas calcula e
 * não ensina, e um número não deve vir com a fórmula escrita ao lado. Aqui é
 * outra coisa: um editor de CSS sem os nomes dos seletores é um editor sem API,
 * e a lista é DADO, no mesmo espírito do seletor de canais do Motor de
 * Automação. Ainda assim ela vem fechada, e sem uma linha de prosa.
 * ============================================================
 */

function Secao({ titulo, children, direita }) {
  return (
    <section className="px-3 py-3" style={{ borderTop: "1px solid var(--afty-borda)" }}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="afty-card-titulo flex-1">{titulo}</h3>
        {direita}
      </div>
      {children}
    </section>
  );
}

/**
 * ⚠ `titulo` e `onGlobal` são OPCIONAIS desde 2026-08-31, quando cada Shikigami
 * ganhou tema próprio. O painel é o MESMO nos dois casos, de propósito: um
 * editor capado para a invocação seria um segundo lugar para manter em dia. O
 * que muda é o nome no alto e a seção "Todas as Fichas", que some quando o alvo
 * é um shikigami. "Quero todas as minhas fichas assim" não quer dizer nada
 * quando o que está sendo temado é uma invocação de dentro de uma delas.
 */
/* ⚠ `escopo` E `nome` SÓ CHEGAM NO TEMA DE UMA INVOCAÇÃO. Sem eles o prompt
   descreve a ficha inteira, que é o caso normal. Ver `promptParaIA`. */
export default function PainelDeAparencia({ tema, onTema, onFechar, onGlobal, titulo = "Aparência", escopo, nome, estrutura = "classica" }) {
  const [abaCss, setAbaCss] = useState("css");
  const [salvouGlobal, setSalvouGlobal] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const campoPrompt = useRef(null);
  const painel = useRef(null);
  const fechar = useRef(onFechar);
  useLayoutEffect(() => { fechar.current = onFechar; }, [onFechar]);
  const tituloId = useId();
  const [restauravel, setRestauravel] = useState(null);
  /* As fontes da internet só no tema da Ficha G2, que é quem as baixa (`useFontesWeb`): a clássica e o cartão da invocação não as carregam. */
  const comFontesWeb = estrutura === "g2" && !escopo;
  useFontesDaPrevia(comFontesWeb);
  const seletores = useMemo(() => contratoDaEstrutura(escopo ? "invocacao" : estrutura).reduce((acc, c) => {
    (acc[c.grupo] ??= []).push(c);
    return acc;
  }, {}), [estrutura, escopo]);
  const atributos = atributosDaEstrutura(escopo ? "invocacao" : estrutura);
  useEffect(() => {
    const anterior = document.activeElement;
    const caixa = painel.current;
    caixa?.querySelector('[aria-label="Fechar"]')?.focus();
    const teclado = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar.current(); }
      if (e.key !== "Tab") return;
      const alvos = [...caixa.querySelectorAll('button, input, textarea, select, a[href], [tabindex]')]
        .filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const primeiro = alvos[0], ultimo = alvos.at(-1);
      if (!primeiro) { e.preventDefault(); caixa.focus(); }
      else if (e.shiftKey && (document.activeElement === primeiro || !caixa.contains(document.activeElement))) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && (document.activeElement === ultimo || !caixa.contains(document.activeElement))) {
        e.preventDefault(); primeiro.focus();
      }
    };
    document.addEventListener("keydown", teclado, true);
    return () => {
      document.removeEventListener("keydown", teclado, true);
      const retorno = anterior?.isConnected ? anterior
        : document.querySelector('#afty-ficha [aria-label="Mais opções da ficha"]');
      retorno?.focus();
    };
  }, []);
  const cssLimpo = saneiaCss(tema.css);
  const grande = cssLimpo.length > CSS_MAX;
  const problemasDoCss = useMemo(() => auditaCss(tema.css), [tema.css]);
  const semEscopo = !escopoSuportado();
  const prompt = useMemo(() => promptParaIA(tema, { escopo, nome, estrutura }), [tema, escopo, nome, estrutura]);

  /* ⚠ Duas rotas, porque a área de transferência é bloqueada em contexto não
     seguro e em alguns navegadores de celular. Quando a API falha, o caminho
     antigo (selecionar e mandar copiar) resolve, e se ele também falhar o texto
     está na tela para o usuário copiar à mão. */
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
    } catch {
      const campo = campoPrompt.current;
      if (campo) {
        campo.select();
        try { setCopiado(document.execCommand("copy")); } catch { /* fica a seleção */ }
      }
    }
  };

  /* COPIAR E COLAR TEMA (2026-11-10): o tema inteiro (preset, cores, fonte, imagem e CSS) vai e volta como um texto JSON, para passar de uma ficha para
     outra sem Exportar e Importar (o import cria uma SEGUNDA ficha e não atualiza a que já existe). Colar é desfazível pelo Restaurar. */
  const [aviso, setAviso] = useState(null);
  const avisa = (texto) => { setAviso(texto); setTimeout(() => setAviso((a) => (a === texto ? null : a)), 2200); };
  const copiarTema = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(normalizaTema(tema))); avisa("Tema Copiado"); }
    catch { avisa("Não Copiou"); }
  };
  const colarTema = async () => {
    try {
      const bruto = JSON.parse(await navigator.clipboard.readText());
      const ehTema = bruto && typeof bruto === "object" && !Array.isArray(bruto)
        && ["presetId", "vars", "css", "imagem", "fonte", "raio"].some((k) => k in bruto);
      if (!ehTema) { avisa("Não É um Tema"); return; }
      setRestauravel(tema);
      onTema(normalizaTema(bruto));
      avisa("Tema Colado");
    } catch { avisa("Não É um Tema"); }
  };
  const troca = (parcial) => onTema({ ...tema, ...parcial });
  const trocaVar = (token, valor) => troca({ vars: { ...tema.vars, [token]: valor } });
  const trocaImagem = (parcial) => troca({ imagem: { ...tema.imagem, ...parcial } });

  return (
    <div className="afty-busca-fundo" onPointerDown={onFechar}>
      <div
        ref={painel}
        className="afty-busca afty-aparencia"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        style={{ maxHeight: "82dvh" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
          <h2 id={tituloId} className="afty-card-titulo flex-1 truncate">{titulo}</h2>
          <button
            type="button"
            className="afty-botao"
            data-afty-tom={tema.ligado ? "destaque" : undefined}
            onClick={() => troca({ ligado: !tema.ligado })}
            aria-pressed={tema.ligado}
          >
            {tema.ligado ? "Ligado" : "Desligado"}
          </button>
          <button
            type="button"
            className="afty-passo"
            onClick={() => { setRestauravel(tema); onTema(temaEmBranco()); }}
            title="Voltar ao tema padrão"
            aria-label="Voltar ao tema padrão"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {aviso && <span className="afty-rotulo text-[11px]" role="status">{aviso}</span>}
          <button type="button" className="afty-passo" onClick={copiarTema} title="Copiar o tema" aria-label="Copiar o tema"><Copy className="w-3 h-3" /></button>
          <button type="button" className="afty-passo" onClick={colarTema} title="Colar um tema" aria-label="Colar um tema"><ClipboardPaste className="w-3 h-3" /></button>
          {restauravel && <button type="button" className="afty-botao" onClick={() => {
            onTema(restauravel); setRestauravel(null);
          }}>Restaurar</button>}
          <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar">
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* ---------- presets ---------- */}
          <Secao titulo="Tema">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="afty-botao"
                  data-afty-tom={tema.presetId === p.id ? "destaque" : undefined}
                  /* ⚠ Trocar de preset LIMPA o que o formulário mudou. Sem isso,
                     escolher Pergaminho depois de mexer nas cores deixaria um
                     fundo claro com o texto escolhido para o escuro. */
                  onClick={() => troca({ presetId: p.id, vars: {} })}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </Secao>

          {/* ---------- cores ---------- */}
          {GRUPOS_DE_TOKEN.map((g) => (
            <Secao key={g.id} titulo={g.label}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {g.tokens.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 min-w-0">
                    <input
                      type="color"
                      className="afty-cor"
                      value={corEfetiva(tema, t.id)}
                      onChange={(e) => trocaVar(t.id, e.target.value)}
                      aria-label={t.label}
                    />
                    <span className="afty-rotulo text-[11px] truncate">{t.label}</span>
                  </label>
                ))}
              </div>
            </Secao>
          ))}

          {/* ---------- forma ---------- */}
          <Secao titulo="Fonte e Canto">
            <div className="flex flex-wrap items-center gap-1.5">
              {FONTES.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  className="afty-botao"
                  data-afty-tom={tema.fonte === f.id ? "destaque" : undefined}
                  style={{ fontFamily: f.id }}
                  onClick={() => troca({ fonte: tema.fonte === f.id ? null : f.id })}
                >
                  {f.label}
                </button>
              ))}
              {comFontesWeb && (
                <span className="flex flex-wrap items-center gap-1.5 w-full" role="group" aria-label="Fontes da Internet" data-fontes-web>
                  {FONTES_WEB.map((f) => (
                    <button
                      key={f.familia}
                      type="button"
                      className="afty-botao"
                      data-afty-tom={tema.fonte === f.id ? "destaque" : undefined}
                      data-fonte-web={f.familia}
                      style={{ fontFamily: f.id }}
                      onClick={() => troca({ fonte: tema.fonte === f.id ? null : f.id })}
                    >
                      {f.label}
                    </button>
                  ))}
                </span>
              )}
              <span className="flex items-center gap-1.5 ml-auto">
                <input
                  type="range"
                  min="0" max="20" step="2"
                  value={parseInt(tema.raio ?? "12", 10)}
                  onChange={(e) => troca({ raio: `${e.target.value}px` })}
                  aria-label="Arredondamento dos cantos"
                />
                <span className="afty-valor text-[11px] w-10">{tema.raio ?? "12px"}</span>
              </span>
            </div>
          </Secao>

          {/* ---------- imagem ---------- */}
          <Secao titulo="Imagem de Fundo">
            <input
              type="text"
              className="afty-campo w-full bg-transparent outline-none px-2 py-1.5"
              style={{ border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}
              value={tema.imagem.url}
              onChange={(e) => trocaImagem({ url: e.target.value })}
              placeholder="https://"
              aria-label="Endereço da imagem de fundo"
            />
            {tema.imagem.url && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {ENCAIXES.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="afty-botao"
                    data-afty-tom={tema.imagem.encaixe === e.id ? "destaque" : undefined}
                    onClick={() => trocaImagem({ encaixe: e.id })}
                  >
                    {e.label}
                  </button>
                ))}
                <span className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="range"
                    min="0" max="100" step="5"
                    value={Math.round(tema.imagem.opacidade * 100)}
                    onChange={(e) => trocaImagem({ opacidade: Number(e.target.value) / 100 })}
                    aria-label="Opacidade da imagem"
                  />
                  <span className="afty-valor text-[11px] w-10">
                    {Math.round(tema.imagem.opacidade * 100)}%
                  </span>
                </span>
              </div>
            )}
          </Secao>

          {/* ---------- CSS livre ---------- */}
          <Secao
            titulo="CSS"
            direita={
              <span className="afty-abas" role="tablist">
                {ABAS_CSS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="tab"
                    aria-selected={abaCss === a.id}
                    className="afty-aba"
                    onClick={() => setAbaCss(a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </span>
            }
          >
            {semEscopo && abaCss === "css" && (
              <div className="afty-chip mb-2" data-afty-tom="aviso">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                Este navegador não isola o CSS na ficha
              </div>
            )}

            {abaCss === "css" && (
              <>
                <textarea
                  className="afty-campo w-full bg-transparent outline-none px-2 py-1.5"
                  style={{
                    border: "1px solid var(--afty-borda)",
                    borderRadius: "var(--afty-raio-peq)",
                    fontFamily: "var(--afty-fonte-num)",
                    minHeight: "8rem",
                    resize: "vertical",
                  }}
                  value={tema.css}
                  onChange={(e) => troca({ css: e.target.value })}
                  spellCheck={false}
                  placeholder=".afty-card { border-color: #f0f; }"
                  aria-label="CSS personalizado"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="afty-rotulo text-[11px] flex-1 tabular-nums">
                    {cssLimpo.length} / {CSS_MAX}
                  </span>
                  {grande && (
                    <span className="afty-chip" data-afty-tom="aviso">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                      Muito grande para o armazenamento
                    </span>
                  )}
                </div>
                {/* Os avisos do auditor: o que no CSS escrito costuma dar errado. Não impedem nada. */}
                {problemasDoCss.length > 0 && (
                  <ul className="mt-1.5 space-y-1" aria-label="Avisos do CSS" data-avisos-css>
                    {problemasDoCss.map((t) => (
                      <li key={t} className="afty-rotulo text-[11px] flex items-start gap-1" style={{ color: "var(--afty-aviso)" }}>
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-px" aria-hidden="true" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {abaCss === "seletores" && (
              <div className="space-y-2">
                {Object.entries(seletores).map(([grupo, lista]) => (
                  <div key={grupo}>
                    <h4 className="afty-card-titulo mb-1">{grupo}</h4>
                    <div className="space-y-0.5">
                      {lista.map((c) => (
                        <div key={c.seletor} className="afty-aparencia-seletor">
                          <code className="afty-valor">{c.seletor}</code>
                          <span className="afty-rotulo">{c.oque}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <h4 className="afty-card-titulo mb-1">Atributos</h4>
                  <div className="space-y-0.5">
                    {atributos.map((a) => (
                      <div key={a.seletor} className="afty-aparencia-seletor">
                        <code className="afty-valor">{a.seletor}</code>
                        <span className="afty-rotulo">{a.oque}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ⚠ O PROMPT existe porque quem quer a ficha bonita nem sempre sabe
                CSS, e hoje qualquer pessoa tem uma IA à mão. O que falta a ela é
                o CONTEXTO: sem saber que existe uma ficha do Afty, quais
                variáveis existem e quais classes são estáveis, ela chuta seletor
                e escreve CSS que não pega em nada. */}
            {abaCss === "prompt" && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    className="afty-botao"
                    data-afty-tom={copiado ? "destaque" : undefined}
                    onClick={copiar}
                  >
                    {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiado ? "Copiado" : "Copiar Prompt"}
                  </button>
                  <span className="afty-rotulo text-[11px] tabular-nums">
                    {prompt.length} caracteres
                  </span>
                </div>
                <textarea
                  ref={campoPrompt}
                  className="afty-campo w-full bg-transparent outline-none px-2 py-1.5"
                  style={{
                    border: "1px solid var(--afty-borda)",
                    borderRadius: "var(--afty-raio-peq)",
                    fontFamily: "var(--afty-fonte-num)",
                    minHeight: "10rem",
                    resize: "vertical",
                  }}
                  value={prompt}
                  readOnly
                  spellCheck={false}
                  onFocus={(e) => e.target.select()}
                  aria-label="Prompt para a IA"
                />
              </>
            )}
          </Secao>

          {/* ---------- global ---------- */}
          {onGlobal && (
            <Secao titulo="Todas as Fichas">
              <button
                type="button"
                className="afty-botao"
                data-afty-tom={salvouGlobal ? "destaque" : undefined}
                onClick={() => { onGlobal(); setSalvouGlobal(true); }}
              >
                {salvouGlobal ? <Check className="w-3.5 h-3.5" /> : null}
                Usar este tema como padrão
              </button>
            </Secao>
          )}
        </div>
      </div>
    </div>
  );
}
