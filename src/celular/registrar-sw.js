/* ============================================================
   O REGISTRO DO SERVICE WORKER E A TROCA DE VERSÃO (etapa E9 do app Era de Ouro, 2026-11-20)
   ============================================================
   Chamado pelo App depois de montar, só quando `podeRegistrar` deixa (produção, host do app, rota da Guilda). Escopo
   `/EraDeOuro`: a Sala e as outras rotas seguem só com rede. `updateViaCache: "none"` faz o navegador buscar o `/sw.js` sempre
   no servidor, e o `vercel.json` manda não guardar.

   A TROCA DE VERSÃO, sem nunca recarregar sozinho:
   - um worker novo instalado pergunta a versão dele. Se é a MESMA da página (a página já veio da rede, nova), ele se ativa
     calado e nada muda na tela;
   - se é outra (a página é velha, aberta do guardado), a página mostra "Nova Versão" com Atualizar. O toque sobe a nuvem
     pendente (até 3 s), ativa o worker novo e recarrega quando ele assume.
   - procura versão nova ao voltar para a tela e de hora em hora.
   ============================================================ */

const UMA_HORA = 60 * 60 * 1000;

const perguntarVersao = (worker) => new Promise((resolve) => {
  const canal = new MessageChannel();
  const prazo = setTimeout(() => resolve(null), 3000);
  canal.port1.onmessage = (e) => { clearTimeout(prazo); resolve(e.data?.versao ?? null); };
  worker.postMessage({ tipo: "versao" }, [canal.port2]);
});

/** Registra e acompanha. `aoNovaVersao(worker)` é chamado quando há uma versão diferente esperando o toque. Devolve o desligar. */
export function registrarServiceWorker({ versao, aoNovaVersao }) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return () => {};
  let vivo = true;
  let relogio = null;
  let aoVoltar = null;

  const decidir = async (worker) => {
    const dele = await perguntarVersao(worker);
    if (!vivo) return;
    /* O worker de desligamento (`VITE_SW_DESLIGADO=1`) se ativa e sai sozinho, às vezes antes de responder. Uma versão nova de
       verdade sempre responde, então sem resposta (ou "desligado") não há o que avisar. */
    if (!dele || dele === "desligado") return;
    if (dele === versao) worker.postMessage({ tipo: "ativar" });
    else aoNovaVersao(worker);
  };

  navigator.serviceWorker.register("/sw.js", { scope: "/EraDeOuro", updateViaCache: "none" }).then((reg) => {
    if (!vivo) return;
    // Sem `controller` é a primeira instalação: ela assume sozinha, e não há versão velha em uso para avisar.
    if (reg.waiting && navigator.serviceWorker.controller) decidir(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) decidir(worker);
      });
    });
    aoVoltar = () => { if (document.visibilityState === "visible") reg.update().catch(() => {}); };
    document.addEventListener("visibilitychange", aoVoltar);
    relogio = setInterval(() => reg.update().catch(() => {}), UMA_HORA);
  }).catch(() => {});

  return () => {
    vivo = false;
    clearInterval(relogio);
    if (aoVoltar) document.removeEventListener("visibilitychange", aoVoltar);
  };
}

/** O toque em Atualizar: `antes` (subir a nuvem) e então ativa o worker novo. A página recarrega quando ele assume. */
export function ativarNovaVersao(worker, { antes } = {}) {
  let recarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (recarregou) return;
    recarregou = true;
    location.reload();
  });
  Promise.resolve()
    .then(() => antes?.())
    .catch(() => {})
    .finally(() => worker.postMessage({ tipo: "ativar" }));
}

/** Com `SW_LIGADO` em false: tira o worker do app deste aparelho. Os dados das fichas não são tocados. */
export function desligarServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.filter((r) => /\/EraDeOuro$/.test(r.scope)).forEach((r) => r.unregister()))
    .catch(() => {});
}
