/* ============================================================
   G2 · A AÇÃO DE UMA OPÇÃO DO CATÁLOGO (2026-11-09)
   ============================================================
   O que a linha de uma opção oferece, a ordem que isso dá à lista e o Ativar
   que liga direto. Serve ao catálogo (`CatalogoG2.jsx`) e aos Favoritos da
   tela dos Ativos (`VisaoG2.jsx`). Sem JSX.
   ============================================================ */
import { custoAntes, verificacoes } from "./efeitos-dados";
import { ehGolpe, ehPiloto, ehRecebidoDePacote, ehSustentacao, simples, temPreparo } from "./g2-dados";
import { opcaoAtivavel } from "../pacotes-aliados";
import { rascunhoDoCatalogo } from "./g2-preparo";
import { rascunhoDoGolpe } from "./g2-golpe";

export const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
/* A Sustentação é um grupo de vagas: com uma vaga ocupada e outra livre, ainda se ativa (outro Feitiço numa vaga livre). */
export const comVagaLivre = (o, m) => ehSustentacao(o) && o.grupo.estados.some((e) => !m.sessao.combate?.[e.id]);

/* "ativo" leva ao cartão, "ativar" liga (direto ou pela Preparação), "usar" e "abrir" abrem o detalhe, que tem o custo, os usos ou os
   controles. Sem ação não quer dizer passivo. É também o que ordena a lista: quem tem ação sobe (autor, 2026-11-09). */
export function acaoDaLinha(o, g, m) {
  if (g.ligado(o) && !comVagaLivre(o, m)) return "ativo";
  /* A opção recebida de um pacote: Ativar abre o detalhe com a prévia, e quem só tem consulta não tem Ativar. */
  if (simples(o) || temPreparo(o) || ehGolpe(o) || (ehRecebidoDePacote(o) && opcaoAtivavel(o.pacoteRecebido.opcao))) return "ativar";
  if (o.como === "usar" || o.como === "registrar") return "usar";
  if (o.grupo) return "abrir";
  return null;
}

/** Quem tem ação primeiro, cada metade por nome. */
export function ordenaPorAcao(itens, g, m) {
  const com = itens.filter((o) => acaoDaLinha(o, g, m)).sort(porNome);
  const sem = itens.filter((o) => !acaoDaLinha(o, g, m)).sort(porNome);
  return [...com, ...sem];
}

/* LIGA SEM PASSAR PELO PAINEL (autor, 2026-11-09): um efeito de um estado só, sem Preparação, sem custo registrado e sem nada que o
   bloqueie agora. Com escolha, custo ou bloqueio, o painel abre e mostra isso antes da ação. */
export const ligaDireto = (o, m) => simples(o) && !ehPiloto(o) && !temPreparo(o) && !ehGolpe(o) && !ehRecebidoDePacote(o)
  && !!m.combate && !custoAntes(o) && verificacoes(o, m).nao.length === 0;

/** O rascunho de partida da Preparação de uma opção, ou null para quem não tem Preparação. */
export const preparoInicial = (o, m) => (ehPiloto(o) ? { chave: o.chave, valor: 1 } : temPreparo(o) ? { chave: o.chave, valores: rascunhoDoCatalogo(o, m) }
  : ehGolpe(o) ? { chave: o.chave, valores: rascunhoDoGolpe(m) } : null);

/** O Ativar de uma linha. `abrir(o, preparo)` mostra a opção no painel. Devolve se ligou direto. */
export function ativarOpcao(o, g, m, abrir) {
  if (ligaDireto(o, m) && g.acoes.ativar(o)) return true;
  abrir(o, preparoInicial(o, m));
  return false;
}
