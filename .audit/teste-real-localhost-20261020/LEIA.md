# G2 no localhost habitual para teste em sessão

Pedido do autor em 20/10/2026. A revisão funcional já passou, falta o teste
real. A ficha clássica apareceu no print porque a abertura comum ainda
exigia o parâmetro de prévia para selecionar o G2.

O servidor local de teste foi ajustado para acrescentar ficha-g2=1 nas
entradas /Player e /Afty, preservando os outros parâmetros. A resposta é
302 sem cache, na mesma origem localhost:5173. Com ficha-g2=0 a clássica
continua acessível. A raiz / e os assets não redirecionam. A build revisada
index-DBupHr57.js e o seletor de produto não foram alterados.

Para iniciar novamente, na pasta grimorio-tracker:

```
node .audit/teste-real-localhost-20261020/servidor-g2.mjs
```

A porta é estrita, não cai em outra origem se já estiver ocupada. O valor
GRIMORIO_G2_PORT foi usado em 5322 só para a prova inicial, já encerrada.
Só a prévia 5173 que este chat havia iniciado foi substituída. Os servidores
5320 e 5321 permanecem intactos.

Nove verificações HTTP passaram na 5173, em verificacao.json: Player/Afty,
query preservada, G2 explícito, clássica explícita, raiz, asset e navegação
com bundle final conferido. O navegador interno também chegou de /Player
à URL final com ficha-g2=1. Ele não tem as fichas do perfil habitual do autor.

Usar o navegador/perfil de sempre. Uma página já aberta precisa de recarga
para selecionar a apresentação nova. Nenhuma ficha, sessão, biblioteca ou
preferência do autor foi copiada, importada, limpa ou modificada pelo agente.
Sem promoção global, commit, push, merge ou deploy. Barra 9/10 preservada.
