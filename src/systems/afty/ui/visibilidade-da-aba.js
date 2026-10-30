/* A ABA (OU O CORPO) QUE O CONTÉM ESTÁ À VISTA? (prévia das três abas do G2, 2026-10-21)
   As abas Ações, Perícias e Equipamentos da prévia ficam MONTADAS e ocultas quando se troca de aba, para não perder rascunho. O painel de
   fontes e a dica (`ui/fontes.jsx`) vão por PORTAL para a raiz da Ficha, fora da aba: escondê-la não esconde o painel. Quem oculta avisa
   por este contexto, e o painel aberto fecha no mesmo render. ⚠ O padrão é VISÍVEL: a clássica, o criador, o Encontro e o resto do G2
   nunca fornecem o contexto e seguem exatamente como eram. Mora em arquivo próprio porque contexto não é componente (Fast Refresh). */
import { createContext } from "react";

export const VisibilidadeDaAba = createContext(true);
