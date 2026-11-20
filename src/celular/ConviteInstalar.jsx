import { useState } from "react";
import { AlertTriangle, Share } from "lucide-react";
import FolhaInferior from "./FolhaInferior";
import { IOS_LIBERADO } from "./pwa-config";
import { conviteDaVez, gravarConvite, lerConvite } from "./convite";
import { useCelular } from "./usar-celular";
import { useInstalacao } from "./usar-instalacao";
import "./celular.css";

/**
 * O convite de instalar o app Era de Ouro (etapa E4). Aparece na lista da Guilda, no navegador do celular, quando o
 * Chrome já entregou o pedido de instalação. "Agora Não" o guarda por 14 dias neste aparelho (a chave termina em
 * `_aparelho_v1` e não vai para a nuvem). As regras moram em `convite.js`.
 *
 * No iPhone (só com `IOS_LIBERADO`, ou `?convite-ios=1` para testar) o botão abre os passos do Safari, com o aviso de
 * que o app começa vazio até entrar na conta dentro dele.
 */
export default function ConviteInstalar({ ativo }) {
  const celular = useCelular();
  const { temPedido, instalado, plataforma, instalar } = useInstalacao();
  const [convite, setConvite] = useState(lerConvite);
  const [agora] = useState(() => Date.now());
  const [passos, setPassos] = useState(false);
  const iosLiberado = IOS_LIBERADO || (typeof location !== "undefined" && new URLSearchParams(location.search).has("convite-ios"));
  const tipo = conviteDaVez({ noLugar: ativo, celular, instalado, convite, agora, plataforma, temPedido, iosLiberado });

  const guardar = (parcial) => {
    const novo = { ...convite, ...parcial };
    gravarConvite(novo);
    setConvite(novo);
  };
  const dispensar = () => guardar({ dispensadoEm: Date.now() });
  const aoInstalar = async () => {
    const escolha = await instalar();
    if (escolha === "accepted") guardar({ instaladoEm: Date.now() });
    else if (escolha === "dismissed") dispensar();
  };

  return (
    <>
      {tipo && (
        <div className="fm-convite" role="region" aria-label="Instalar o App">
          <img src="/icons/era-de-ouro-192.png" alt="" width="40" height="40" className="fm-convite-icone" />
          <div className="fm-convite-titulo">Instalar o App Era de Ouro</div>
          <div className="fm-convite-botoes">
            <button type="button" className="fm-convite-botao" onClick={dispensar}>Agora Não</button>
            <button
              type="button"
              className="fm-convite-botao"
              data-principal
              onClick={tipo === "ios" ? () => setPassos(true) : aoInstalar}
            >
              {tipo === "ios" ? "Como Instalar" : "Instalar"}
            </button>
          </div>
        </div>
      )}
      <FolhaInferior aberta={passos} onFechar={() => setPassos(false)} titulo="Instalar no iPhone">
        <ol className="fm-passos">
          <li><span>1</span> Toque em Compartilhar <Share className="w-4 h-4 inline" aria-hidden="true" /></li>
          <li><span>2</span> Toque em Adicionar à Tela de Início</li>
          <li><span>3</span> Toque em Adicionar</li>
        </ol>
        <p className="fm-passos-aviso">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          O app começa vazio. Entre na conta dentro dele para trazer as fichas.
        </p>
      </FolhaInferior>
    </>
  );
}
