import React from "react";

// ============================================================
// DOMAIN TEXT — renderiza a Expansão no estilo "stat block"
// ============================================================
// Layout (ver Print003): título centralizado entre filetes, descrição,
// faixa marrom com "Nome [Expansão X]", e o corpo mecânico com os efeitos em
// bullets de título destacado.
//
// `text` é o corpo gerado por fm-domain-calc (parágrafos separados por "\n\n";
// linhas iniciadas em "●" são efeitos). `name`, `versaoLabel` e `lore` montam
// o cabeçalho. `header={false}` omite título/faixa (ex.: quando o card já
// mostra o nome).
//
// Os efeitos usam layout flex (marcador "●" em coluna própria) para que as
// linhas quebradas alinhem sob o texto — sem recuo lateral exagerado.
const TITLE_RE = /^●\s*(.*?\.)\s+([\s\S]*)$/;

function Bullet({ title, body, size }) {
  return (
    <div className={`${size} leading-relaxed text-slate-300 flex gap-1.5`}>
      <span className="text-rose-300 flex-shrink-0 select-none">●</span>
      <p className="min-w-0 text-justify">
        <span className="font-bold text-rose-200">{title}</span>
        {body ? <> {body}</> : null}
      </p>
    </div>
  );
}

function Body({ text, size }) {
  const paras = (text || "").split("\n\n").map((p) => p.trim()).filter(Boolean);
  return paras.map((para, i) => {
    if (para.startsWith("●")) {
      const m = para.match(TITLE_RE);
      const title = m ? m[1] : para.replace(/^●\s*/, "");
      const body = m ? m[2] : "";
      return <Bullet key={i} title={title} body={body} size={size} />;
    }
    return (
      <p key={i} className={`${size} leading-relaxed text-slate-300 text-justify whitespace-pre-wrap`}>
        {para}
      </p>
    );
  });
}

export default function DomainText({ text, name, versaoLabel, lore, header = true, size = "text-[11px]" }) {
  if (!text?.trim() && !lore?.trim()) return null;
  // flex+gap (em vez de space-y) evita o colapso de margens — o espaçamento
  // ao redor da Descrição fica real e simétrico mesmo com várias linhas.
  return (
    <div className="flex flex-col gap-3">
      {header && (
        <div className="border-y-2 border-rose-900/60 py-1">
          <h3 className="text-center text-sm font-bold text-rose-100">
            Expansão de Domínio{name?.trim() ? `: ${name.trim()}` : ""}
          </h3>
        </div>
      )}

      {lore?.trim() && (
        <p className={`${size} leading-relaxed text-slate-300 text-justify whitespace-pre-wrap`}>{lore.trim()}</p>
      )}

      {header && versaoLabel && (
        <div className="bg-rose-950/50 border border-rose-900/60 rounded-sm px-2 py-1">
          <p className="text-center text-xs font-bold text-rose-200 underline">
            {name?.trim() || "Expansão"} [Expansão {versaoLabel}]
          </p>
        </div>
      )}

      <Body text={text} size={size} />
    </div>
  );
}
