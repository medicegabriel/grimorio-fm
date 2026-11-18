import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy } from "lucide-react";

import "../../systems/afty/ficha/ficha.css";
import "../../systems/afty/encontros/encontro-g2.css";
import "./sala-ui.css";

/**
 * ============================================================
 * AS PEÇAS DAS TELAS DA SALA (etapa 7c, 2026-11-18)
 * ============================================================
 * A casca da página, o campo copiável, o ponto de online e o avatar. Cor só por token, ícone do lucide, texto em Title Case.
 * As peças do Encontro (`Aviso`, `Vazio`, `Dialogo`, `Retrato`) vêm de `systems/afty/encontros/telas/pecas-encontro.jsx`.
 * ============================================================
 */

/** A página da Sala fora da luta (entrar, escolher fichas, Sala fechada). Voltar à esquerda, título no meio, ações à direita. */
export function Casca({ titulo, onVoltar, acoes = null, children, larga = false }) {
  return (
    <div className="afty-ficha ec-raiz sl-pagina">
      <header className="ec-topo">
        <button type="button" className="afty-botao ec-icone" onClick={onVoltar} aria-label="Voltar ao Grimório" title="Voltar ao Grimório"><ArrowLeft aria-hidden="true" /></button>
        <div className="ec-topo-titulo"><h1 className="ec-titulo" title={titulo}>{titulo}</h1></div>
        {acoes && <div className="ec-topo-acoes">{acoes}</div>}
      </header>
      <main className={larga ? "sl-final" : "sl-centro"}>{children}</main>
    </div>
  );
}

/** Copia para a área de transferência e diz que copiou por 1,5 s (o ícone vira o V, e o rótulo também). */
export function BotaoCopiar({ texto, rotulo = "Copiar" }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Sem permissão da área de transferência (página sem https, por exemplo): seleciona o texto numa caixa de apoio.
      const t = document.createElement("textarea");
      t.value = texto;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); } catch { /* sem como copiar */ }
      t.remove();
    }
    setCopiado(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 1500);
  };
  return (
    <button type="button" className="afty-botao" onClick={copiar} aria-label={`${rotulo}: ${texto}`}>
      {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copiado ? "Copiado" : rotulo}
    </button>
  );
}

/** Um valor com o botão de copiar (o código da Sala e o link). */
export function CampoCopiavel({ rotulo, valor, copiar = "Copiar" }) {
  return (
    <div className="sl-copiavel">
      <span className="sl-copiavel-rotulo">{rotulo}</span>
      <span className="sl-copiavel-valor" title={valor}>{valor}</span>
      <BotaoCopiar texto={valor} rotulo={copiar} />
    </div>
  );
}

/** Online ou ausente, com a palavra (a cor sozinha não diz). */
export function PontoOnline({ online }) {
  return <span className="sl-online" data-online={online ? "sim" : undefined}>{online ? "Online" : "Ausente"}</span>;
}

const iniciaisDe = (nome) => String(nome ?? "?").replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0] ?? "").join("").toUpperCase() || "?";

/** O avatar que o Google ou o Discord deu (só https), ou as iniciais. */
export function Avatar({ url, nome }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou || !/^https:/.test(url)) return <span className="sl-avatar" aria-hidden="true">{iniciaisDe(nome)}</span>;
  return <img className="sl-avatar" src={url} alt="" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />;
}

