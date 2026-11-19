/* Configuração do app de celular (plano "App Era de Ouro", docs/app-celular.md).
   FOLHA, zero imports: os asserts leem este arquivo direto.

   ⚠ UMA CONSULTA SÓ PARA "É CELULAR". A largura de 720 px é o corte de telefone que a
   Ficha G2 e o Encontro já usam (efeitos-g2.css, encontro-g2.css). A segunda metade
   segura o celular DEITADO: de lado ele passa de 720 px de largura, mas continua sendo
   um celular, com pouca altura e dedo no lugar de mouse. */
export const CONSULTA_CELULAR = "(max-width: 720px), (max-height: 500px) and (pointer: coarse)";
