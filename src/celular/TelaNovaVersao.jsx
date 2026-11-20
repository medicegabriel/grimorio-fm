import { RefreshCw } from "lucide-react";

/* No lugar de uma tela sob demanda que não chegou (etapa E3). O caso comum: o site foi publicado de novo com a pessoa com a
   página aberta, e os pedaços da versão antiga não existem mais no servidor. Recarregar traz a versão nova. Nunca recarrega
   sozinho: a pessoa pode estar no meio de uma luta, e o toque é dela. */
export default function TelaNovaVersao() {
  return (
    <div
      role="alert"
      className="min-h-screen grid place-items-center p-6"
      style={{ background: "var(--afty-fundo, #060910)", color: "var(--afty-texto, #f1f5f9)" }}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div className="text-base font-bold">Nova Versão Disponível</div>
        <button
          type="button"
          onClick={() => location.reload()}
          className="inline-flex items-center gap-2 min-h-11 px-4 rounded font-semibold"
          style={{ background: "var(--afty-destaque, #a855f7)", color: "#fff" }}
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Atualizar
        </button>
      </div>
    </div>
  );
}
