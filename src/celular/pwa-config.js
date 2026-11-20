/* Configuração do app de celular (plano "App Era de Ouro", docs/app-celular.md).
   FOLHA, zero imports: os asserts leem este arquivo direto.

   ⚠ UMA CONSULTA SÓ PARA "É CELULAR". A largura de 720 px é o corte de telefone que a
   Ficha G2 e o Encontro já usam (efeitos-g2.css, encontro-g2.css). A segunda metade
   segura o celular DEITADO: de lado ele passa de 720 px de largura, mas continua sendo
   um celular, com pouca altura e dedo no lugar de mouse. */
export const CONSULTA_CELULAR = "(max-width: 720px), (max-height: 500px) and (pointer: coarse)";

/* O Voltar do aparelho (etapa E2): cada tela e cada painel aberto vira uma entrada do histórico do navegador. Em `false`
   o App volta a trocar de tela só pelo estado do React, como antes de 2026-11-19, sem caçar código. */
export const PILHA_LIGADA = true;

/* O convite de instalar no iPhone (etapa E4). Desligado por decisão do autor (2026-11-18, "Android primeiro"): o app
   instalado do iPhone guarda os dados separados do Safari e o login dentro dele ainda não foi provado num aparelho real.
   Liga só depois que um amigo passar o protocolo de docs/app-celular.md. Para testar antes, `?convite-ios=1` na URL. */
export const IOS_LIBERADO = false;
