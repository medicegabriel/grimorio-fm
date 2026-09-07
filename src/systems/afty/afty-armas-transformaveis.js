/**
 * ============================================================
 * ARMA TRANSFORMÁVEL — a primitiva das duas formas
 * ============================================================
 * Uma arma com DUAS formas alternáveis e uma reserva de clones ilusórios. É
 * VERBO: o mecanismo mora aqui e o conteúdo mora no addon, que é a mesma
 * diretriz de `docs/afty-addons.md`. O primeiro (e único) caso é o **Azamaru**,
 * em `addons/azamaru.json`, documentado em `docs/afty-azamaru.md`.
 *
 * ⚠ SÓ APARECE PARA QUEM PEDIU. A primitiva é `armaTransformavel`, e um pacote
 * a declara em `permite`. Sem isso os dois canais que ela abriu
 * (`ignoraTodaRD` e `ignoraImunidade`) apareceriam no seletor de todo mundo,
 * que é a lição já escrita no topo de `PRIMITIVAS`.
 *
 * ⚠ TODA LEITURA DE FICHA AQUI É DEFENSIVA. Este módulo roda dentro do
 * `deriveAfty`, e o contrato do projeto é que ficha salva SEMPRE abre: um
 * `equipamentos.itens` que não é lista, ou um `addons` que não é lista, não
 * podem derrubar a derivação inteira. Ver o assert "ficha suja nao derruba o
 * derive" em `asserts/t-pugilato.mjs`.
 * ============================================================
 */
const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const lista = (v) => (Array.isArray(v) ? v : []);
/** A criatura carrega o addon que declarou esta entrada? */
const temAddon = (creature, addonId) =>
  !addonId || lista(creature?.addons).some((p) => p?.id === addonId);
export const chaveForma = (id) => `forma:${id}`;
export function estadoForma(combate, id) {
  const s = combate?.[chaveForma(id)] ?? {};
  return { reunida: !!s.reunida, clones: inteiro(s.clones), reserva: inteiro(s.reserva),
    residuo: inteiro(s.residuo), usos: inteiro(s.usos), dividida: s.dividida ?? -1 };
}
export function formaDaArma(def, creature) {
  if (!def?.formas?.reunida || !creature) return def;
  if (!temAddon(creature, def.addonId)) return def;
  const ativa = estadoForma(creature.combate, def.id).reunida;
  return ativa ? { ...def, ...def.formas.reunida, id: def.id } : def;
}
export function armasTransformaveis(creature, catalogo, bt) {
  // ⚠ `lista()`, e não `?? []`. O segundo só cobre null e undefined, e
  // `equipamentos.itens` pode chegar como qualquer coisa numa ficha antiga ou
  // suja. É o mesmo guarda do `listaEntradas` em afty-equipamentos.js.
  const armas = lista(catalogo);
  return lista(creature?.equipamentos?.itens).filter((e) => e?.tipo === "arma" && e.equipado)
    .flatMap((e) => {
      const def = armas.find((a) => a?.id === e.refId);
      if (!def?.formas?.reunida || !def?.ilusoes) return [];
      if (!temAddon(creature, def.addonId)) return [];
      return [{ id: def.id, nome: def.nome, titulo: def.titulo, descricao: def.descricao, bt,
        ...estadoForma(creature.combate, def.id) }];
    }).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);
}
/* A régua da forma reunida, revisada pelo autor em 2026-09-07:
   *"Reduza os Bônus da Azamaru para 8 de Defesa e remova o Reflexos. Os Dados de
   Dano continuam igual, para cada 2 de Defesa se recebe 1 Dado de Dano.
   Finalizando com 4 Dados de Dano."*

   ⚠ O TETO DE 8 SÓ SIGNIFICA ALGUMA COISA ACIMA DA MAESTRIA 4. Com Maestria 4 a
   conta antiga (2 × clones) já dava exatamente 8, então "reduza para 8" só
   reduz de fato quem tem Maestria 5 ou mais, que antes chegava a 10 e 12. Por
   isso o 8 entrou como TETO e não como valor fixo: fixo AUMENTARIA o bônus de
   quem tem Maestria 2 ou 3, e o verbo do pedido é reduzir.

   ⚠ A DEFESA VIROU A MOEDA DOS DADOS. Antes o dado saía dos clones ("1 dado
   para cada 2 clones dissipados", o texto do livro), e agora sai da Defesa que
   se perdeu: cada clone carrega 2 de Defesa, e cada 2 de Defesa dissipada vale
   1 dado. Com o teto de 8 isso fecha nos 4 dados que o autor nomeou. */
const DEFESA_POR_CLONE = 2;
const DEFESA_MAX = 8;
const DEFESA_POR_DADO = 2;

/**
 * O que a forma reunida está entregando AGORA: `{ defesa, dados }`.
 *
 * ⚠ UM DONO SÓ PARA A FÓRMULA. Ela alimenta os efeitos logo abaixo E o painel
 * de combate, que mostra os números em vez de só a contagem de clones. Repetir
 * o cálculo na tela deixaria o painel mentir no dia em que a regra mudasse de um
 * lado só, e ela acabou de mudar.
 *
 * ⚠ O REFLEXOS SAIU em 2026-09-07. Quem ler um `bonus.reflexos` daqui recebe
 * `undefined`, e não zero: o campo não existe mais.
 */
export function bonusDaForma(arma) {
  const defesa = Math.min(DEFESA_POR_CLONE * inteiro(arma?.clones), DEFESA_MAX);
  // A Defesa que já foi dissipada, que é o que vira dado. Ela topa no mesmo teto:
  // clone que nunca chegou a dar Defesa também não dá dado.
  const defesaDissipada = Math.min(DEFESA_POR_CLONE * inteiro(arma?.reserva), DEFESA_MAX);
  return {
    defesa,
    dados: Math.floor(defesaDissipada / DEFESA_POR_DADO),
  };
}

export function efeitosArmasTransformaveis(armas) {
  return armas.flatMap((a) => !a.reunida ? [] : [
    { canal: "defesa", expr: String(bonusDaForma(a).defesa) },
    { canal: "dadosDano", alvo: a.id, expr: String(bonusDaForma(a).dados) },
    { canal: "ignoraTodaRD", alvo: a.id, expr: "1" },
    { canal: "ignoraImunidade", alvo: a.id, expr: "1" },
    { canal: "removeResistencia", alvo: a.id, expr: "1" },
  ].map((e) => ({ ...e, origem: a.id, nome: a.nome, fonte: "item" })));
}
export function alteraArmaTransformavel(sessao, arma, evento, pagarPe) {
  const atual = estadoForma(sessao.combate, arma.id);
  const proximo = { ...atual };
  let custo = 0;
  if (evento === "reunir") {
    if (atual.reunida || atual.dividida === sessao.rodada) return sessao;
    custo = atual.usos ? inteiro(arma.bt) : 0;
    const temporario = Object.values(sessao.peTempFontes ?? {}).reduce((n, v) => n + inteiro(v), 0);
    if (inteiro(sessao.peAtual) + temporario < custo) return sessao;
    Object.assign(proximo, { reunida: true, clones: inteiro(arma.bt), usos: atual.usos + 1 });
  } else if (evento === "dividir") {
    if (!atual.reunida) return sessao;
    /* ⚠ FORA DE COMBATE NÃO EXISTE "MESMA RODADA" (conserto de 2026-09-07). A
       Ficha abre na rodada 0, que quer dizer "nenhuma cena em andamento", e o
       contador só sobe quando o jogador vira a rodada. Gravar `dividida: 0` ali
       travava o Reunir PARA SEMPRE, porque `0 === 0` e nada faz a rodada 0
       passar: o autor clicou Reunir, Dividir, e não conseguiu reunir de novo.

       O `-1` é o mesmo valor que o `estadoForma` já usa para "nunca dividida",
       então ele nunca casa com rodada nenhuma. Dentro de uma cena a regra do
       livro continua inteira: dividiu na rodada 3, só reúne na 4. */
    Object.assign(proximo, {
      reunida: false,
      dividida: inteiro(sessao.rodada) > 0 ? sessao.rodada : -1,
    });
  } else if (evento === "acerto") {
    if (!atual.reunida) return sessao;
    proximo.reserva = atual.reserva % 2;
    proximo.residuo = proximo.reserva;
  } else if (["golpe", "todos", "livre"].includes(evento)) {
    if (!atual.reunida) return sessao;
    const n = evento === "todos" ? atual.clones : Math.min(1, atual.clones);
    proximo.clones -= n;
    proximo.reserva += n;
  } else return sessao;
  return { ...(custo ? pagarPe(sessao, custo) : sessao),
    combate: { ...sessao.combate, [chaveForma(arma.id)]: proximo } };
}
export function avancaArmasTransformaveis(sessao, reiniciar = false) {
  const combate = { ...sessao.combate };
  for (const k of Object.keys(combate).filter((x) => x.startsWith("forma:"))) {
    if (reiniciar) delete combate[k];
    else {
      const s = combate[k];
      combate[k] = { ...s, reserva: Math.max(0, inteiro(s.reserva) - inteiro(s.residuo)), residuo: 0 };
    }
  }
  return { ...sessao, combate };
}
