import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check } from "lucide-react";

import {
  condicoesPorForca, descreveCondicao, listaComE, faixaDeSangramento,
  CONDICAO_EFEITOS, SANGRAMENTO_FAIXAS,
} from "../afty-condicoes";
import { IconeDaCondicao } from "../ui/icones-afty";
import { semAcento } from "./ficha-conteudo";

/**
 * ============================================================
 * GAVETA DE CONDIÇÕES (fase 4, 2026-09-22)
 * ============================================================
 * Aplicar condição é coisa de mestre no meio do turno, e o teclado é o caminho
 * mais curto: abre, digita, Enter.
 *
 * ⚠ MESMA ANATOMIA DA BUSCA GLOBAL (`BuscaGlobal.jsx`): véu, caixa no alto,
 * foco no campo, setas para andar, Enter para escolher, Esc para sair. Uma
 * segunda gramática de camada na mesma tela seria uma segunda coisa para
 * aprender.
 *
 * ⚠ É MESTRE-DETALHE DESDE A SEGUNDA LEVA (2026-09-22). Foi grade de ladrilhos
 * por um dia, e o autor apontou o que a grade sempre faz: "tamanhos irregulares,
 * inicialmente enorme, e os efeitos mecânicos aparecendo junto aos narrativos".
 * As três coisas têm a mesma causa. O ladrilho carregava conteúdo de tamanho
 * livre (números, inclusões, resumo e, no Sangramento, quatro botões de faixa),
 * a fileira da grade esticava pelo mais alto, e a caixa inteira crescia e
 * encolhia a cada tecla do filtro, movendo a linha que estava sendo lida.
 *
 * A resposta é a que os catálogos de regra usam (o índice de condições do
 * Pathfinder 2e é o exemplo mais próximo): LISTA de uma coluna com linhas de
 * altura igual, e o item inteiro ao lado. Na lista fica só o que é igual em
 * todas (ícone, nome, se está aplicada). Tudo que varia mora no detalhe, com
 * RÓTULO, que é o que separa o número do texto do livro.
 *
 * ⚠ A ALTURA É FIXA, e não `max-height`. Uma caixa que encolhe conforme o filtro
 * estreita puxa o chão de quem está lendo.
 *
 * ⚠ ELA NÃO FECHA AO APLICAR. Numa emboscada o mestre põe Surpreso em quatro
 * criaturas, e fechar a cada uma obrigaria a reabrir quatro vezes.
 *
 * ⚠ ENTER NUMA CONDIÇÃO JÁ APLICADA TIRA, e não aplica de novo: é o mesmo
 * interruptor do toque, e evita duas Cegueiras na mesma criatura por engano.
 *
 * ⚠ SAI POR PORTAL, e isto não é firula: o `.afty-ficha-corpo` tem
 * `isolation: isolate`, então todo `position: fixed` nascido dentro da aba fica
 * preso NAQUELE contexto de empilhamento, e o cabeçalho grudado (z-index 40)
 * passa por cima de um véu de z-index 1200. Medido em 2026-09-22: o clique no
 * canto superior esquerdo caía no cabeçalho, e não no véu. O destino é o
 * `.afty-ficha`, que é onde os tokens do tema moram: o `body` perderia a cor.
 * ============================================================
 */

/* O mesmo destino que o painel de fontes usa (ver `MolduraFlutuante`): a raiz da
   Ficha, com o id como rede de segurança e o `body` como último recurso. */
const destinoDaGaveta = () => (typeof document === "undefined"
  ? null
  : document.querySelector(".afty-ficha") ?? document.getElementById("afty-ficha") ?? document.body);

/* O Sangramento é o único que precisa de uma segunda escolha: a faixa decide o
   dado da perda. Ela mora no RODAPÉ DO DETALHE, e não na linha da lista, que é
   o que fazia dele o item mais alto da grade antiga. */
const PADRAO_SANGRAMENTO = "medio";

/* Se o ponteiro é grosso (dedo). Lido DENTRO do gesto, e não guardado em estado:
   o lint de efeitos barra `setState` a partir de `matchMedia`, com razão, e o
   manipulador de evento é o lugar em que ler o mundo é permitido. Também pega o
   caso do tablet que ganha um mouse no meio da sessão. */
const noToque = () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;

export default function GavetaDeCondicoes({ aplicadas, onAplicar, onTirar, onFechar }) {
  const [termo, setTermo] = useState("");
  const [rodadas, setRodadas] = useState("");
  const [faixa, setFaixa] = useState(PADRAO_SANGRAMENTO);
  const [cursor, setCursor] = useState(0);
  const campo = useRef(null);
  const lista = useRef(null);

  // Foco é DOM, e não estado: entra em efeito sem cascata nenhuma.
  useEffect(() => { campo.current?.focus(); }, []);

  const grupos = useMemo(() => condicoesPorForca({ especiais: true }).map((g) => ({
    ...g,
    rotulo: g.nivel ? `${g.nivel}. ${g.label}` : g.label,
    condicoes: g.condicoes.map((c) => ({ ...c, ...descreveCondicao(c.nome) })),
  })), []);

  /* O filtro casa contra nome, resumo e o que ela FAZ, então "defesa" acha
     Paralisado, Desprevenido e Enredado. Todos os termos precisam bater, como na
     busca global. */
  const filtradas = useMemo(() => {
    const partes = semAcento(termo).split(/\s+/).filter(Boolean);
    const casa = (c) => {
      if (!partes.length) return true;
      const alvo = semAcento([c.nome, c.resumo ?? "", ...c.efeitos.map((e) => `${e.rotulo} ${e.texto}`)].join(" "));
      return partes.every((p) => alvo.includes(p));
    };
    return grupos
      .map((g) => ({ ...g, condicoes: g.condicoes.filter(casa) }))
      .filter((g) => g.condicoes.length > 0);
  }, [grupos, termo]);

  // A lista achatada é a que o cursor percorre: o grupo é desenho, e não ordem.
  const emOrdem = useMemo(() => filtradas.flatMap((g) => g.condicoes), [filtradas]);
  const atual = emOrdem[Math.min(cursor, emOrdem.length - 1)] ?? null;
  const atualSangra = !!CONDICAO_EFEITOS[atual?.nome]?.perdaVida;
  const atualAplicada = !!atual && aplicadas.has(atual.nome);

  // O item sob o cursor rola para dentro da vista, e só ele.
  useEffect(() => {
    lista.current?.querySelector('[data-afty-cursor="sim"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor, termo]);

  const aplica = (c, faixaId = null) => {
    onAplicar({
      nome: c.nome,
      forca: faixaId ? faixaDeSangramento(faixaId).forca : c.forcaId,
      rodadas: rodadas.trim() ? Math.max(1, Math.trunc(Number(rodadas)) || 1) : null,
      ...(faixaId ? { sangramento: faixaId } : {}),
    });
    setTermo("");
    setCursor(0);
    campo.current?.focus();
  };

  const alterna = (c) => {
    if (aplicadas.has(c.nome)) onTirar(c.nome);
    else aplica(c, CONDICAO_EFEITOS[c.nome]?.perdaVida ? faixa : null);
  };

  const aoTeclar = (e) => {
    if (e.key === "Escape") {
      // Esc limpa o que foi digitado, e só fecha a gaveta quando não há nada.
      if (termo) { setTermo(""); setCursor(0); } else onFechar();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(emOrdem.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Home") {
      e.preventDefault(); setCursor(0);
    } else if (e.key === "End") {
      e.preventDefault(); setCursor(Math.max(0, emOrdem.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (atual) alterna(atual);
    }
  };

  const estiloCampo = { border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)", padding: "2px 6px" };

  const destino = destinoDaGaveta();
  if (!destino) return null;

  return createPortal(
    <div className="afty-gaveta-veu" onPointerDown={onFechar}>
      {/* O clique de dentro não fecha junto com o de fora. */}
      <div
        className="afty-gaveta"
        role="dialog"
        aria-modal="true"
        aria-label="Aplicar Condição"
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={aoTeclar}
      >
        <div className="afty-gaveta-topo">
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--afty-texto-fraco)" }} aria-hidden="true" />
          <input
            ref={campo}
            type="text"
            value={termo}
            onChange={(e) => { setTermo(e.target.value); setCursor(0); }}
            placeholder="Condição"
            aria-label="Filtrar as condições"
            className="afty-campo flex-1 min-w-0 bg-transparent outline-none"
          />
          <button type="button" className="afty-passo" onClick={onFechar} aria-label="Fechar">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="afty-gaveta-corpo">
          {/* ---------- o mestre ---------- */}
          <div className="afty-gaveta-master" ref={lista}>
            {emOrdem.length === 0 && <p className="afty-vazio px-1 py-3">Nada com esse filtro</p>}
            {filtradas.map((g) => (
              <div key={g.id} className="afty-gaveta-forca-bloco">
                <p className="afty-gaveta-forca">{g.rotulo}</p>
                {g.condicoes.map((c) => {
                  const ja = aplicadas.has(c.nome);
                  const sobCursor = atual?.nome === c.nome;
                  const indice = emOrdem.findIndex((x) => x.nome === c.nome);
                  return (
                    <button
                      key={c.nome}
                      type="button"
                      className="afty-cond-item"
                      aria-pressed={ja}
                      data-afty-cursor={sobCursor ? "sim" : undefined}
                      data-afty-aplicada={ja ? "sim" : undefined}
                      onPointerEnter={() => setCursor(indice)}
                      /* ⚠ NO TOQUE, O PRIMEIRO TOQUE SÓ ESCOLHE. Sem mouse não
                         há hover, então tocar e já aplicar seria aplicar sem
                         nunca ter lido o detalhe, que é a queixa que trouxe
                         este desenho. Com mouse o hover mostra o detalhe antes
                         do clique, e o clique segue aplicando de uma vez. */
                      onClick={() => {
                        setCursor(indice);
                        if (sobCursor || !noToque()) alterna(c);
                      }}
                    >
                      <IconeDaCondicao nome={c.nome} className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="afty-cond-item-nome">{c.nome}</span>
                      {ja && <Check className="w-3 h-3 flex-shrink-0" aria-label="Aplicada" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* ---------- o detalhe ----------
              Cada coisa com o seu rótulo, que é o que separa "o que ela faz no
              número" de "o que o livro diz". Eram dois parágrafos seguidos. */}
          <div className="afty-gaveta-detalhe">
            {atual ? (
              <>
                <div className="afty-det-corpo">
                  <p className="afty-det-nome">
                    <IconeDaCondicao nome={atual.nome} className="w-4 h-4 flex-shrink-0" />
                    {atual.nome}
                  </p>
                  {(atual.forcaLabel || atual.grupo) && (
                    <p className="afty-det-meta">{[atual.forcaLabel, atual.grupo].filter(Boolean).join(" · ")}</p>
                  )}

                  {atual.efeitos.length > 0 && (
                    <div className="afty-det-bloco">
                      <p className="afty-det-rotulo">No Número</p>
                      {/* Uma linha por efeito, rótulo à esquerda e valor à
                          direita: em frase única com pontos médios, "Ataques -3
                          · Perícias -3" lia como uma coisa só. */}
                      <ul className="afty-det-numeros">
                        {atual.efeitos.map((e) => (
                          <li key={e.chave}>
                            <span className="afty-det-chave">{e.rotulo}</span>
                            <span className="afty-det-valor">{e.texto}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {atual.inclui.length > 0 && (
                    <div className="afty-det-bloco">
                      <p className="afty-det-rotulo">Inclui</p>
                      <p className="afty-det-texto">{listaComE(atual.inclui)}</p>
                    </div>
                  )}

                  {atual.resumo && (
                    <div className="afty-det-bloco">
                      <p className="afty-det-rotulo">Na Mesa</p>
                      <p className="afty-det-texto">{atual.resumo}</p>
                    </div>
                  )}

                  {atual.descricao && (
                    <div className="afty-det-bloco">
                      <p className="afty-det-rotulo">No Livro</p>
                      <p className="afty-det-texto afty-det-livro">{atual.descricao}</p>
                    </div>
                  )}
                </div>

                <div className="afty-det-pe">
                  {atualSangra && (
                    <label className="afty-det-campo">
                      <span className="afty-rotulo text-[10px] uppercase tracking-wider">Faixa</span>
                      <select
                        value={faixa}
                        onChange={(e) => setFaixa(e.target.value)}
                        aria-label="Força do Sangramento"
                        className="afty-campo bg-transparent outline-none"
                        style={estiloCampo}
                      >
                        {SANGRAMENTO_FAIXAS.map((f) => (
                          <option key={f.id} value={f.id} style={{ background: "var(--afty-card)" }}>
                            {f.label} {f.dados}d{f.faces}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="afty-det-campo">
                    <span className="afty-rotulo text-[10px] uppercase tracking-wider">Rodadas</span>
                    <input
                      type="text" inputMode="numeric" value={rodadas}
                      onChange={(e) => setRodadas(e.target.value.replace(/\D/g, ""))}
                      placeholder="∞" aria-label="Duração em rodadas"
                      title="Vazio é sem duração"
                      className="afty-campo bg-transparent outline-none w-12 text-center"
                      style={estiloCampo}
                    />
                  </label>
                  <button
                    type="button"
                    className="afty-botao ml-auto"
                    data-afty-tom={atualAplicada ? undefined : "destaque"}
                    onClick={() => alterna(atual)}
                  >
                    {atualAplicada ? "Tirar" : "Aplicar"}
                  </button>
                </div>
              </>
            ) : (
              <p className="afty-vazio">Nenhuma condição escolhida</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    destino,
  );
}
