import { memo, useEffect } from "react";
import useListaDeEncontros from "./usar-lista-encontros";

/* ============================================================
   A PONTE DA LISTA DE ENCONTROS (etapa E10 do app Era de Ouro, 2026-11-20)
   ============================================================
   O `App.jsx` não importa mais o `usar-lista-encontros` direto: ele puxa o `modelo`, os motores e o motor inteiro do Afty
   (cerca de 1,5 MB), e isso ia no pacote de abertura de toda rota. Esta ponte chega sob demanda (`src/celular/usar-lista-adiada.js`),
   roda o gancho de verdade e entrega a lista ao App a cada mudança. Nada mais muda: a migração do site, a leitura, a
   gravação e o aviso de cota continuam no gancho.

   `memo` com props estáveis (o grupo da rota e o `setState` do App): a ponte só desenha de novo quando a lista muda, e
   cada efeito é uma mudança de verdade. Ela não desenha nada na tela.
   ============================================================ */
function PonteDaLista({ grupo, aoMudar }) {
  const lista = useListaDeEncontros(grupo);
  useEffect(() => { aoMudar({ ...lista, pronto: true }); });
  return null;
}

export default memo(PonteDaLista);
