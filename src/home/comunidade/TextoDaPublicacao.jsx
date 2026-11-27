import { useId, useLayoutEffect, useRef, useState } from "react";
import { Bold, Heading, Italic, List, ListOrdered, Strikethrough, Underline } from "lucide-react";
import { alternarMarcador, alternarTitulo, MARCADORES } from "../../systems/afty/afty-texto-rico";
import TextoRico from "../../systems/afty/ui/TextoRico";
import { LIMITE_TEXTO } from "./comunidade-conteudo";

const PREFIXO_LISTA = /^(?:- |(\d{1,9})\. )/;
const ICONES = { negrito: Bold, italico: Italic, sublinhado: Underline, riscado: Strikethrough };
const ESTILOS = ["negrito", "italico", "sublinhado", "riscado"].map((chave) => MARCADORES.find((estilo) => estilo.chave === chave));

function blocosDaPublicacao(texto) {
  const blocos = [];
  for (const linha of texto.split(/\r?\n/)) {
    const prefixo = PREFIXO_LISTA.exec(linha);
    const tipo = !prefixo ? "texto" : prefixo[1] ? "numerada" : "marcadores";
    if (blocos.at(-1)?.tipo !== tipo) blocos.push({ tipo, inicio: Number(prefixo?.[1] ?? 1), linhas: [] });
    blocos.at(-1).linhas.push(prefixo ? linha.slice(prefixo[0].length) : linha);
  }
  return blocos;
}

function manterBarrasLiterais(texto) {
  // O parser do Afty também escapa barras antes de letras. Preserve caminhos de arquivos em posts.
  return texto.replace(/\\(?![\\*_~#|])/g, "\\\\");
}

export default function TextoDaPublicacao({ texto, className = "" }) {
  return (
    <div className={`comunidade-texto-publicado ${className}`.trim()}>
      {blocosDaPublicacao(texto).map(({ tipo, inicio, linhas }, i) => {
        if (tipo === "texto") return <TextoRico key={i} texto={manterBarrasLiterais(linhas.join("\n"))} />;
        const Lista = tipo === "numerada" ? "ol" : "ul";
        return (
          <Lista key={i} start={tipo === "numerada" ? inicio : undefined}>
            {linhas.map((linha, j) => <li key={j}><TextoRico texto={manterBarrasLiterais(linha)} /></li>)}
          </Lista>
        );
      })}
    </div>
  );
}

function alternarEstilo(texto, inicio, fim, marca) {
  const selecao = texto.slice(inicio, fim);
  if (!selecao.includes("\n")) return alternarMarcador(texto, inicio, fim, marca);
  const partes = selecao.split("\n").map((linha) => (
    linha.trim() ? alternarMarcador(linha, 0, linha.length, marca).texto : linha
  ));
  const trecho = partes.join("\n");
  return { texto: texto.slice(0, inicio) + trecho + texto.slice(fim), ini: inicio, fim: inicio + trecho.length };
}

function alternarLista(texto, inicio, fim, numerada) {
  const pontoFinal = fim > inicio && texto[fim - 1] === "\n" ? fim - 1 : fim;
  const primeiraLinha = inicio === 0 ? 0 : texto.lastIndexOf("\n", inicio - 1) + 1;
  const quebraSeguinte = texto.indexOf("\n", pontoFinal);
  const ultimaLinha = quebraSeguinte === -1 ? texto.length : quebraSeguinte;
  const linhas = texto.slice(primeiraLinha, ultimaLinha).split("\n");
  const remover = linhas.every((linha) => {
    const prefixo = PREFIXO_LISTA.exec(linha);
    return prefixo && Boolean(prefixo[1]) === numerada;
  });
  const trecho = linhas.map((linha, i) => {
    const conteudo = linha.replace(PREFIXO_LISTA, "");
    if (remover) return conteudo;
    const prefixo = numerada ? String(i + 1) + ". " : "- ";
    return prefixo + conteudo;
  }).join("\n");
  const cursor = Math.max(primeiraLinha, inicio + trecho.length - linhas.join("\n").length);
  return {
    texto: texto.slice(0, primeiraLinha) + trecho + texto.slice(ultimaLinha),
    ini: inicio === fim ? cursor : primeiraLinha,
    fim: inicio === fim ? cursor : primeiraLinha + trecho.length,
  };
}

export function EditorTextoPublicacao({
  rotulo, texto, onChange, placeholder, obrigatorio, nome = "texto", linhas = 4, maxLength = LIMITE_TEXTO,
}) {
  const id = useId();
  const campo = useRef(null);
  const selecaoPendente = useRef(null);
  const [modoPrevia, setModoPrevia] = useState(false);
  const [limite, setLimite] = useState(false);
  const temTexto = Boolean(texto.trim());
  const previa = modoPrevia && temTexto;

  useLayoutEffect(() => {
    const selecao = selecaoPendente.current;
    if (!selecao || !campo.current) return;
    selecaoPendente.current = null;
    campo.current.focus();
    campo.current.setSelectionRange(selecao.ini, selecao.fim);
  }, [texto]);

  function editar(valor) {
    setModoPrevia(false);
    setLimite(false);
    onChange(valor);
  }

  function aplicar(transformar) {
    const el = campo.current;
    if (!el || previa) return;
    const resultado = transformar(texto, el.selectionStart, el.selectionEnd);
    if (resultado.texto.length > maxLength) {
      setLimite(true);
      return;
    }
    if (resultado.texto === texto) return;
    selecaoPendente.current = resultado;
    editar(resultado.texto);
  }

  function aplicarEstilo(marca) {
    aplicar((valor, ini, fim) => alternarEstilo(valor, ini, fim, marca));
  }

  function teclado(evento) {
    if (!(evento.ctrlKey || evento.metaKey) || evento.altKey || evento.shiftKey) return;
    const estilo = ESTILOS.find(({ atalho, chave }) => chave !== "riscado" && atalho === evento.key.toUpperCase());
    if (!estilo) return;
    evento.preventDefault();
    aplicarEstilo(estilo.marca);
  }

  return (
    <div className="comunidade-editor-texto">
      <div className="comunidade-rotulo-publicacao">
        <label htmlFor={id}>{rotulo}</label>
        <span aria-hidden="true">{texto.length}/{maxLength}</span>
      </div>
      <div className="comunidade-moldura-texto">
        <div className="comunidade-barra-texto">
          <div className="comunidade-comandos-texto" role="group" aria-label="Formatação de Texto" onMouseDown={(e) => e.preventDefault()}>
            <div className="comunidade-estilos-texto">
              {ESTILOS.map(({ chave, label, marca, atalho }) => {
                const Icone = ICONES[chave];
                return (
                  <button key={chave} type="button" aria-label={label} title={label} disabled={previa}
                    aria-keyshortcuts={chave === "riscado" ? undefined : "Control+" + atalho + " Meta+" + atalho}
                    onClick={() => aplicarEstilo(marca)}><Icone aria-hidden="true" /></button>
                );
              })}
            </div>
            <div className="comunidade-blocos-texto">
              <button type="button" aria-label="Título de Seção" title="Título de Seção" disabled={previa}
                onClick={() => aplicar((valor, ini, fim) => alternarTitulo(valor, ini, fim, 1))}><Heading aria-hidden="true" /></button>
              <button type="button" aria-label="Lista com Marcadores" title="Lista com Marcadores" disabled={previa}
                onClick={() => aplicar((valor, ini, fim) => alternarLista(valor, ini, fim, false))}><List aria-hidden="true" /></button>
              <button type="button" aria-label="Lista Numerada" title="Lista Numerada" disabled={previa}
                onClick={() => aplicar((valor, ini, fim) => alternarLista(valor, ini, fim, true))}><ListOrdered aria-hidden="true" /></button>
            </div>
          </div>
          <div className="comunidade-modos-texto" role="group" aria-label="Visualização do Texto">
            <button type="button" aria-pressed={!previa} onClick={() => setModoPrevia(false)}>Editar</button>
            <button type="button" aria-pressed={previa} disabled={!temTexto} onClick={() => setModoPrevia(true)}>Prévia</button>
          </div>
        </div>
        <textarea id={id} ref={campo} name={nome} rows={linhas} placeholder={placeholder} maxLength={maxLength}
          value={texto} required={obrigatorio} hidden={previa} onKeyDown={teclado}
          onChange={(e) => editar(e.target.value)} />
        {previa && <div className="comunidade-previa-texto"><TextoDaPublicacao texto={texto.trim()} /></div>}
      </div>
      {limite && temTexto && <p className="comunidade-erro" role="status">Reduza o texto para aplicar a formatação dentro do limite de {maxLength.toLocaleString("pt-BR")} caracteres.</p>}
    </div>
  );
}
