import { useEffect, useState } from "react";

export function useConsultaComunidade(carregar, { espera = 0, ativa = true } = {}) {
  const [resultado, setResultado] = useState(null);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    if (!ativa) return undefined;
    const controle = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const dados = await carregar(controle.signal);
        if (!controle.signal.aborted) setResultado({ carregar, revisao, dados });
      } catch (erro) {
        if (!controle.signal.aborted) setResultado({ carregar, revisao, erro: erro.message });
      }
    }, espera);
    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [ativa, carregar, espera, revisao]);

  const atual = ativa && resultado?.carregar === carregar && resultado.revisao === revisao ? resultado : null;
  return { dados: atual?.dados, erro: atual?.erro, carregando: ativa && !atual, recarregar: () => setRevisao((valor) => valor + 1) };
}
