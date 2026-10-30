/* O CORTE DAS FATIAS (2026-10-19). Os cálculos pesados da Ficha (consequências dos efeitos, delta dos estados, projeção da Linha do Tempo) são geradores: devolvem o
   controle depois de cada derive. Quem os roda avança em FATIAS entre quadros, e este é o único lugar que decide onde cortar.

   O corte PREVÊ o próximo passo pelo anterior: parar só depois de passar do orçamento deixava uma tarefa longa quando um passo custava quase o orçamento inteiro (um
   passo com dois derives, como o de uma Fonte Externa de Catálogo, chegava a 60 ou 80 ms no dev). Um passo sozinho não se parte, então o pior caso é o custo de UM passo.
   É folha: sem React, sem derive. */
export const FATIA_MS = 30;

/** Avança `job` até o fim ou até o próximo passo estourar a fatia. Devolve o último `{ done, value }`. Sempre roda ao menos um passo. */
export function avancaFatia(job, fatiaMs = FATIA_MS) {
  const t0 = performance.now();
  let r = job.next();
  let ultimo = performance.now() - t0;
  while (!r.done) {
    if (performance.now() - t0 + ultimo > fatiaMs) break;
    const t1 = performance.now();
    r = job.next();
    ultimo = performance.now() - t1;
  }
  return r;
}
