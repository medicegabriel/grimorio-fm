import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCamadaDeVoltar } from "./camadas";
import "./celular.css";

/**
 * A folha de baixo do celular: o painel que sobe da borda inferior, com véu atrás.
 * É o lugar do menu, da escolha e do formulário curto no telefone (D-87), onde um
 * menu suspenso de computador abriria cortado ou longe do dedo.
 *
 * Fecha pelo véu, pelo Esc e pelo Voltar do aparelho (é uma camada da pilha, camadas.js).
 * Ao abrir, o foco vai para a própria folha, e não para um campo, para o teclado do
 * celular não subir sozinho. Ao fechar, o foco volta para quem abriu.
 */
export default function FolhaInferior({ aberta, onFechar, titulo, rotulo, children }) {
  const painel = useRef(null);
  const fechar = useRef(onFechar);
  useEffect(() => { fechar.current = onFechar; });
  useCamadaDeVoltar(aberta, () => fechar.current?.());

  useEffect(() => {
    if (!aberta) return undefined;
    const antes = document.activeElement;
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painel.current?.focus({ preventScroll: true });
    const tecla = (e) => { if (e.key === "Escape") fechar.current?.(); };
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = rolagem;
      if (antes && typeof antes.focus === "function") antes.focus({ preventScroll: true });
    };
  }, [aberta]);

  if (!aberta || typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="fm-folha-veu" onClick={() => fechar.current?.()} aria-hidden="true" />
      <div
        ref={painel}
        className="fm-folha"
        role="dialog"
        aria-modal="true"
        aria-label={rotulo ?? titulo}
        tabIndex={-1}
      >
        <div className="fm-folha-alca" aria-hidden="true" />
        {titulo && <div className="fm-folha-titulo">{titulo}</div>}
        {children}
      </div>
    </>,
    document.body,
  );
}
