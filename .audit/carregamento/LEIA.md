# Bancada de carregamento

Execute os comandos a partir da raiz do `grimorio-tracker`. A bancada usa Node.js, Google Chrome e Playwright. `PW_PATH` aceita o caminho ou a URL `file:` do `playwright/index.mjs`. Sem a variável, o script usa o mesmo cache do npx de `design.local/mingyue.mjs`. O `.env.local` fornece o endereço usado para identificar o projeto Supabase e semear a sessão falsa.

## Como rodar

No PowerShell, crie a pasta de saída fora do repositório antes de chamar o Vite.

```powershell
$distCarga = Join-Path ([IO.Path]::GetTempPath()) ('grimorio-carga-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $distCarga | Out-Null
npx vite build --outDir $distCarga --emptyOutDir
node .audit/carregamento/medir-carga.mjs --base local --dist $distCarga --runs 3 --rotulo base-20261126
```

Não use `npm run build`, pois ele reescreve o `dist/` usado pelo autor. Evite medir com `npm run dev`, em que o JS pode custar de 10 a 20 vezes mais. Faça as medições em sequência para evitar disputa por CPU e rede.

```powershell
node .audit/carregamento/medir-carga.mjs --base prod --runs 3 --rotulo base-20261126-prod --cenarios 'centralFrio:celular,jogadorFrio:celular,jogadorQuente:celular,navJogador:celular,criaturaFrio:celular'
node .audit/carregamento/analisar.mjs base-20261126 jogadorFrio:celular resumo
node .audit/carregamento/analisar.mjs base-20261126 jogadorFrio:celular cascata
```

`--cenarios` aceita uma lista de pares `nome:perfil`, separados por vírgula. `--headed` abre o Chrome visível. `--filme` grava quadros dos cenários de carregamento direto em `filme/` e deve ser usado em corridas separadas, pois a gravação pode afetar os tempos. Nos cenários da Ficha o filme começa no toque, e o nome de cada quadro é o tempo depois dele. Use outro `--rotulo` para preservar as linhas de base. Cada execução grava as corridas em `medicoes/<rotulo>.json`. O resumo no terminal calcula a mediana de cada métrica. O analisador exibe uma corrida, escolhida pela mediana do LCP.

## Cenários

Sem `--cenarios`, a matriz roda todos os casos abaixo no celular, além dos mesmos cenários de Central, navegação e listas no desktop quando indicado na tabela.

| Cenário | O que mede | Perfis na matriz |
|---|---|---|
| `centralFrio`, `centralQuente` | Conteúdo da Central (`/`) na primeira visita e na volta com cache aquecido. | Desktop e celular |
| `navJogador` | Toque no atalho da Central até a lista com 12 fichas. O atalho abre um novo documento. O JSON registra o trecho entre o clique e o início do documento separadamente. | Desktop e celular |
| `jogadorFrio`, `jogadorQuente` | Acesso direto a `/Jogador` com 12 fichas locais, na primeira visita e na volta com cache aquecido. | Desktop e celular |
| `logado150`, `logado2000` | Volta a `/Jogador` com conta falsa e cache aquecido, com 150 ms ou 2 s por pedido simulado. A primeira visita envia as 12 fichas ao simulador fora da medição. | Celular |
| `logadoFrio150`, `logadoFrio2000` | Mesma volta com conta e os dados locais da primeira visita, com o cache HTTP desativado só na página medida. | Celular |
| `criaturaFrio` | Acesso direto a `/Criatura` com cache frio e a biblioteca vazia. Desde 2026-11-26 a vista padrão não espera o compêndio, que chega depois da lista. | Desktop e celular |
| `fichaFrio`, `fichaJaNaLista` | Toque no primeiro card até a Ficha Final, aguardando 6 s ou 300 ms desde a lista. A medida também registra o começo da tela vazia. | Celular |
| `fichaLogadoFrio` | Toque no primeiro card com conta falsa, 6 s depois da lista. O app pode baixar o motor durante a espera. | Celular |
| `fichaQuente` | Toque no primeiro card depois de aquecer o cache abrindo a mesma ficha numa visita anterior. | Celular |
| `perfilLista` | Perfil de CPU da lista com cache quente e 60 fichas (`FICHAS` permite mudar o total). Acima de 60 as cópias saem sem `aparencia`, senão passam da cota de 5 MB do `localStorage` e a semeadura falha calada. | Celular |
| `criaturaFalha` | Estado da tela com o pedaço do compêndio bloqueado. Desde 2026-11-26 a vista padrão desenha a lista sem o compêndio, então a marca da lista aparece e o botão Tentar de Novo não (ele só sai na pasta Criaturas Base, conferida à mão). Com o botão Tentar de Novo na tela, a rede volta e o toque nele é medido até a lista, com a contagem de pedidos do compêndio antes e depois. | Celular |
| `centralFrioEscuro`, `jogadorFrioEscuro` | As visitas frias com o esquema de cor escuro, inclusive para captura com `--filme`. | Celular |

## Condições

- Celular em 375x812, DPR 2, agente Android, toque e perfil Slow 4G do Lighthouse por CDP (RTT de 150 ms, 1,6 Mbit/s de descida, 750 kbit/s de subida e CPU 4x). Desktop em 1366x768, sem limitação de rede nem CPU.
- Chrome headless por padrão, service worker bloqueado. As fichas são cópias da prévia do Satoru Gojo sem retrato externo. O CDP intercepta o Supabase antes da rede e responde no navegador, inclusive na primeira visita dos casos com conta. O site de produção recebe os pedidos da aplicação estática com o Vercel Analytics bloqueado.
- O servidor local simula cabeçalhos de cache da Vercel e comprime com Brotli, mas usa HTTP/1.1. Ele exagera o custo de baixar muitos pedaços. Para tempos absolutos, use os números de produção. Compare antes e depois no mesmo ambiente e perfil.

## Linha de base de 2026-11-26

Foram 72 corridas locais (24 combinações de cenário e perfil) e 15 de produção (5 cenários no celular), com Chrome 158.0.8127.37 e Playwright 1.61.1. A matriz local usou o build temporário das 15h29, anterior à edição concorrente que passou a baixar a tela em paralelo com a nuvem. `criaturaFalha` reproduziu o estado `Carregando` aos 10 s nas três corridas.

Em relação às tabelas de `diagnostico-carregamento.md`, as medianas de produção variaram até 14,8%. Em `/Jogador` frio, a cascata da corrida mediana pelo LCP levou 1.804 ms no nível de 54 pedidos em HTTP/1.1 local e 991 ms em produção. A lista apareceu em 2.957 ms no local e 2.233 ms em produção.

As diferenças locais acima de 15% ficaram nas tarefas longas e no perfil com 60 fichas. Tempos em ms.

| Métrica | Diagnóstico | Linha de base | Diferença |
|---|---:|---:|---:|
| `perfilLista`, conteúdo | 726 | 835 | +15,01% |
| `perfilLista`, fim da última tarefa longa | 1.083 | 1.346 | +24,3% |
| `fichaJaNaLista`, primeira das duas maiores tarefas após o toque | 472 | 556 | +17,8% |
| `fichaFrio`, segunda das duas maiores tarefas após o toque | 371 | 428 | +15,4% |
| `fichaLogadoFrio`, segunda das duas maiores tarefas após o toque | 345 | 430 | +24,6% |

Com 60 fichas, a primeira tarefa longa junto à montagem começou entre 833 e 861 ms, e apareceu outra de 52 a 62 ms após as duas maiores em todas as corridas. O perfil registrou 601 ms de `(program)` e 214 ms de React na mediana, ante 499 e 166 ms no diagnóstico. Os recursos vieram do cache. Na abertura da Ficha, as tarefas após o toque variaram entre corridas (477 a 583 ms, 387 a 449 ms e 387 a 501 ms, respectivamente, nas três linhas da tabela). A duração total do toque até a Ficha variou de -2,2% a +5,6% frente ao diagnóstico. Os dados localizam os desvios nos trechos de CPU, com variação entre amostras. As tabelas antigas trazem apenas duas corridas da Ficha e não permitem atribuir a diferença a uma função específica.

As voltas com conta e cache frio têm sua primeira referência aqui. A lista apareceu em 3.545 ms (`logadoFrio150`) e 5.375 ms (`logadoFrio2000`), ante 744 e 2.611 ms com cache quente. Na janela medida, as duas voltas com cache frio transferiram 712 KB de recursos na mediana, incluindo o `App` e o motor baixado em segundo plano. Com cache quente, a mediana foi de 0 KB.
