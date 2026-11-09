/* CX6: OS PODERES DO CONTROLADOR QUE DEPENDEM DE POSIÇÃO (Livro p.97 a 100).
 *
 * A ficha não tem mapa. A posição é DECLARADA pela mesa num contador da bancada de combate, e daí em diante vale o Motor
 * (autor, 2026-11-06, "Sim, contador na bancada", a proposta da fila de 2026-09-02):
 *
 *   invocacoes_a_3m          quantas invocações estão a 3 metros do dono. Guarda Viva soma 1 de Defesa por invocação, e
 *                            Rede de Detecção soma +2 em Percepção e +2 de Atenção por invocação. Os dois efeitos moram em
 *                            `HABILIDADE_EFEITOS` (`ctr_guarda_viva`, `ctr_rede_de_deteccao`).
 *   invocacoes_no_alcance    quantas invocações estão no alcance de ataque do alvo. Combate em Alcateia sobe 1 nível de dano
 *                            por invocação, SÓ nas armas escolhidas em Técnicas de Combate. É dinâmico (as armas escolhidas
 *                            são dado da ficha), então o efeito sai daqui, como o Combate Amaldiçoado.
 *
 * Camuflagem Aprimorada, Táticas de Alcateia e Flanco Avançado mexem no INIMIGO (chance de erro, Defesa e testes de resistência dele,
 * dano adicional). A ficha do dono não tem onde escrever isso, e eles seguem como texto de mesa (divergência intencional).
 *
 * FOLHA: zero imports. O `afty-derive.js` e o `afty-combate.js` leem os ids daqui.
 */
export const ESTADO_INVOCACOES_A_3M = "invocacoes_a_3m";
export const ESTADO_INVOCACOES_NO_ALCANCE = "invocacoes_no_alcance";
export const COMBATE_EM_ALCATEIA_ID = "ctr_combate_em_alcateia";

const lista = (v) => (Array.isArray(v) ? v : []);

/** Os tetos das duas faixas, que o `resolveCombate` lê pelo id do estado. O limite em campo vem do roster (`resolveControleInvocacoes`). */
export const tetosDaPosicaoDoControlador = (limiteCampo) => {
  const n = Math.max(0, Math.trunc(Number(limiteCampo)) || 0);
  return { [ESTADO_INVOCACOES_A_3M]: n, [ESTADO_INVOCACOES_NO_ALCANCE]: n };
};

/**
 * Combate em Alcateia: "Enquanto manejando uma arma escolhida em Técnicas de Combate, você tem seu dano com ela aumentado em 1 nível
 * para cada Invocação que esteja com a criatura no alcance de ataque dela". Uma linha por arma escolhida, só com o combate ligado.
 * `tecnicas` é o resultado de `resolveTecnicasCombate` (`armas` são os ids), `combate` é o estado da bancada.
 */
export function efeitosCombateEmAlcateia(tecnicas, combate, habilidades = []) {
  if (!lista(habilidades).includes(COMBATE_EM_ALCATEIA_ID) || !combate?.ativo) return [];
  const n = Math.max(0, Math.trunc(Number(combate[ESTADO_INVOCACOES_NO_ALCANCE]) || 0));
  if (!n) return [];
  return lista(tecnicas?.armas).map((id) => ({
    canal: "nivelDano",
    alvo: id,
    expr: String(n),
    origem: COMBATE_EM_ALCATEIA_ID,
    nome: "Combate em Alcateia",
    duracao: "temporaria",
  }));
}
