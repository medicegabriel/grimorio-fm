/* ============================================================
   O SERVICE WORKER DO APP ERA DE OURO (etapa E9, 2026-11-20). MODELO.
   ============================================================
   Este arquivo NÃO é importado por ninguém. O plugin do `vite.config.js` lê o texto dele no build, troca as três marcas pelos
   valores da versão (a versão, a lista de pré-carga e a regra `destinoDoPedido` de `sw-regras.js`) e grava `dist/sw.js`.

   O que ele faz:
   - instala guardando a lista de pré-carga num cache `ouro-<versão>`;
   - ao ativar, apaga os caches `ouro-` de outras versões (nunca outro cache, nunca o armazenamento das fichas);
   - navegação: a rede primeiro, com 3 s de prazo, e a página guardada desta versão se a rede falhar ou demorar;
   - arquivo (`/assets`, ícones, manifesto): o guardado primeiro, e o que faltar vem da rede e é guardado;
   - o resto passa direto (o Supabase, a análise da Vercel, os PDFs dos Livros, o próprio `/sw.js`);
   - NUNCA se ativa sozinho por cima de uma versão em uso: espera a página pedir (`ativar`), que é o toque em Atualizar, ou a
     página que já é da versão nova. Isso evita trocar o código no meio de uma luta.
   ============================================================ */
const VERSAO = "__VERSAO__";
const CACHE = `ouro-${VERSAO}`;
const PRECACHE = /*__PRECACHE__*/ [];
const ESPERA_DA_REDE_MS = 3000;
const PAGINA = "/EraDeOuro";
const destinoDoPedido = /*__DESTINO__*/ () => "ignorar";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => /^ouro-/.test(n) && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  const tipo = e.data?.tipo;
  if (tipo === "versao") e.ports?.[0]?.postMessage({ versao: VERSAO });
  if (tipo === "ativar") self.skipWaiting();
});

async function navegar(pedido) {
  try {
    return await Promise.race([
      fetch(pedido),
      new Promise((_, falha) => setTimeout(() => falha(new Error("rede lenta")), ESPERA_DA_REDE_MS)),
    ]);
  } catch {
    const guardada = await caches.match(PAGINA, { cacheName: CACHE });
    return guardada || Response.error();
  }
}

async function arquivo(pedido) {
  const cache = await caches.open(CACHE);
  /* `ignoreVary`: o servidor responde com `Vary: Origin`, e o módulo pedido pela página leva o `Origin` que a cópia da
     pré-carga não tinha. Sem isso nenhum arquivo casava, e sem internet a página ficava em branco. Os arquivos de `/assets`
     têm hash no nome e nunca mudam, então a mesma resposta serve a qualquer origem do próprio site. */
  const guardado = await cache.match(pedido, { ignoreVary: true });
  if (guardado) return guardado;
  const resposta = await fetch(pedido);
  if (resposta.ok && resposta.type === "basic") cache.put(pedido, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (e) => {
  const destino = destinoDoPedido({ metodo: e.request.method, url: e.request.url, origem: self.location.origin, modo: e.request.mode });
  if (destino === "navegacao") e.respondWith(navegar(e.request));
  else if (destino === "arquivo") e.respondWith(arquivo(e.request));
});
