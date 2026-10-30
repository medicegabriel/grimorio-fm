/* ============================================================
   ABA (OU CORPO) MANTIDA MONTADA E CONGELADA ENQUANTO OCULTA
   ============================================================
   Prévia das três abas do G2 (2026-10-21). Trocar de aba desmontava Ações, Perícias e Equipamentos, e com elas iam embora o crítico
   pendente, a Liberação escolhida, a Narrativa da Adaptação, as escolhas do Bloodfeast e os filtros. Aqui a aba visitada fica montada,
   escondida, e não renderiza enquanto está escondida. Ao voltar, renderiza com a sessão, o derive e os callbacks de agora.

   O isolamento, que `hidden` e `memo` não dão sozinhos:
     - `inert` na caixa oculta: nem foco, nem clique, nem leitor de tela;
     - o último render antes de congelar leva `VisibilidadeDaAba` = falso, e todo painel de fontes ou dica aberto (que mora num PORTAL,
       fora da caixa) fecha nesse render;
     - quem troca de aba tira o foco de dentro antes de ocultar (ver `AftyFichaG2.jsx`), e o blur confirma o que confirma no blur hoje;
     - as abas da prévia não usam os seletores lidos pela raiz (`data-rolavel`, `data-lista`, `data-chave-ativo`, `role="dialog"`).
   Nada daqui grava na sessão nem executa verbo: só decide se renderiza.
   ============================================================ */
import React, { useLayoutEffect, useRef } from "react";
import { VisibilidadeDaAba } from "../../ui/visibilidade-da-aba";

/* Pula o render enquanto a caixa CONTINUA oculta. A passagem de visível para oculta renderiza uma vez (é ela que fecha os flutuantes). */
const Conteudo = React.memo(function Conteudo({ children }) { return children; }, (antes, depois) => antes.oculta && depois.oculta);

export default function AbaCongelada({ oculta, nome, className = "", children }) {
  const caixa = useRef(null);
  useLayoutEffect(() => {
    if (caixa.current) caixa.current.inert = !!oculta;
  }, [oculta]);
  return (
    <div ref={caixa} hidden={oculta} className={className} data-aba-g2={nome} data-oculta={oculta ? "sim" : undefined}>
      <VisibilidadeDaAba.Provider value={!oculta}>
        <Conteudo oculta={oculta}>{children}</Conteudo>
      </VisibilidadeDaAba.Provider>
    </div>
  );
}
