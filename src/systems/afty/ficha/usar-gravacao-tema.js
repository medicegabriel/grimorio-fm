import { useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";

/** O debounce é só para a digitação. A saída real sempre entrega a última edição.
 * O callback do App muda de identidade a cada gravação, sem significar nova edição. */
export function useGravacaoTema(tema, onSalvar) {
  const ultimo = useRef({ tema, onSalvar });
  const gravado = useRef(tema);
  useLayoutEffect(() => { ultimo.current = { tema, onSalvar }; }, [tema, onSalvar]);
  useEffect(() => {
    if (tema === gravado.current) return undefined;
    const timer = setTimeout(() => {
      const atual = ultimo.current;
      if (atual.tema === gravado.current || !atual.onSalvar) return;
      gravado.current = atual.tema;
      atual.onSalvar(atual.tema);
    }, 600);
    return () => clearTimeout(timer);
  }, [tema]);
  useEffect(() => {
    const descarrega = () => {
      const atual = ultimo.current;
      if (atual.tema === gravado.current || !atual.onSalvar) return;
      gravado.current = atual.tema;
      atual.onSalvar(atual.tema);
    };
    // O armazenamento do App escreve num efeito de React. No encerramento da
    // página, a atualização precisa chegar a esse efeito antes de retornar.
    const aoOcultar = () => flushSync(descarrega);
    window.addEventListener("pagehide", aoOcultar);
    return () => {
      window.removeEventListener("pagehide", aoOcultar);
      descarrega();
    };
  }, []);
}
