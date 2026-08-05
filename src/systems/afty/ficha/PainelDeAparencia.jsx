import React, { useMemo, useRef, useState } from "react";
import { X, RotateCcw, AlertTriangle, Check, Copy } from "lucide-react";

import {
  PRESETS, GRUPOS_DE_TOKEN, FONTES, ENCAIXES, CSS_MAX,
  corEfetiva, temaEmBranco, escopoSuportado, saneiaCss, CONTRATO_DE_CLASSES,
  promptParaIA,
} from "./ficha-tema";

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

export default function PainelDeAparencia({ tema, onTema, onFechar, onGlobal }) {
  const [abaCss, setAbaCss] = useState("css");
  const [salvouGlobal, setSalvouGlobal] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const campoPrompt = useRef(null);
  const cssLimpo = saneiaCss(tema.css);
  const grande = cssLimpo.length > CSS_MAX;
  const semEscopo = !escopoSuportado();
  const prompt = useMemo(() => promptParaIA(tema), [tema]);

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

  const troca = (parcial) => onTema({ ...tema, ...parcial });
  const trocaVar = (token, valor) => troca({ vars: { ...tema.vars, [token]: valor } });
  const trocaImagem = (parcial) => troca({ imagem: { ...tema.imagem, ...parcial } });

  return (
    <div className="afty-busca-fundo" onPointerDown={onFechar}>
      <div
        className="afty-busca"
        style={{ maxHeight: "82dvh" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0">
          <h2 className="afty-card-titulo flex-1">Aparência</h2>
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
            onClick={() => onTema(temaEmBranco())}
            title="Voltar ao tema padrão"
            aria-label="Voltar ao tema padrão"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
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
                  <span className="afty-rotulo text-[10px] flex-1 tabular-nums">
                    {cssLimpo.length} / {CSS_MAX}
                  </span>
                  {grande && (
                    <span className="afty-chip" data-afty-tom="aviso">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                      Muito grande para o armazenamento
                    </span>
                  )}
                </div>
              </>
            )}

            {abaCss === "seletores" && (
              <div className="space-y-0.5">
                {CONTRATO_DE_CLASSES.map((c) => (
                  <div key={c.seletor} className="flex items-baseline gap-2">
                    <code className="afty-valor text-[11px] flex-shrink-0">{c.seletor}</code>
                    <span className="afty-rotulo text-[10px] truncate">{c.oque}</span>
                  </div>
                ))}
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
                  <span className="afty-rotulo text-[10px] tabular-nums">
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
        </div>
      </div>
    </div>
  );
}
