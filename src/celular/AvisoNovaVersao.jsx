import { RefreshCw } from "lucide-react";
import "./celular.css";

/* O aviso de versão nova do app (etapa E9): um cartão embaixo, acima da barra da Guilda, com Atualizar. Só aparece quando a
   página em uso é de uma versão mais velha que a do service worker que chegou. Nunca recarrega sozinho: a pessoa pode estar no
   meio de uma luta, e o toque é dela. */
export default function AvisoNovaVersao({ onAtualizar, atualizando = false }) {
  return (
    <div className="fm-nova-versao" role="status">
      <span className="fm-nova-versao-texto">Nova Versão</span>
      <button type="button" className="fm-nova-versao-botao" onClick={onAtualizar} disabled={atualizando}>
        <RefreshCw aria-hidden="true" />Atualizar
      </button>
    </div>
  );
}
