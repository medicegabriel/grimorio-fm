# Ajustes do teste real do G2, 21/10/2026

Pedidos: alinhar o cabeçalho ao corpo em Quad HD, aproveitar a largura e
fechar o detalhe de um buff clicando fora, sem buscar o X.

## Implementação

- `AftyFichaG2.jsx`: marcador exclusivo da apresentação G2 e contêiner
  compartilhado do cabeçalho e corpo. O painel faz parte dessa largura.
- `efeitos-g2.css`: coluna de 1280 px, 1440 px a partir de 1920 e 1760 px
  a partir de 2400. Consulta deslocada pela margem externa. Até 720 px a
  compacta ocupa o palco, preservando a coluna montada, e a consulta cabe
  na janela. Nenhuma fonte reduzida, zoom ou recorte para esconder estouro.
- `VisaoG2.jsx`: clique primário fora do detalhe remove a seleção visual.
  Não chama verbos de sessão. Controles internos e troca entre cartões
  continuam operáveis. Consulta e flutuantes têm prioridade. O gesto no
  painel compacto permanece o Voltar já existente.

## Verificação

- Browser Use, perfil separado do navegador interno. Amostra sintética
  importada pelo fluxo normal de arquivo, sem manipular fichas reais.
- 20 checks de interação aprovados em `browser.json`: clique interno,
  consulta, proteção da camada aberta, Esc, fora, cartão ainda ativo,
  reabertura, ajuste pendente descartado sem gasto, troca de cartão, X,
  telefone, preservação da clássica e consulta compacta em 390 px.
- 17 medições finais com nomes `final-*`, de 390 a 2560 px, sem estouro
  horizontal. Os limites laterais do contêiner do cabeçalho e do corpo
  coincidem. Em Quad HD: 2188 px com o painel de 428 px, 1760 px sem ele.
- As medições anteriores à correção do telefone permanecem no JSON como
  histórico, incluindo o estouro de 15 px encontrado durante a conferência.
- 196 asserts focados: t-fechamento-g2 (124), t-g2-desempenho (30) e
  t-g2-preferencias (42). Todos passam. Suíte inteira não repetida.
- Lint de src/systems/afty e App.jsx aprovado. Build aprovada. Avisos já
  conhecidos de tamanho de bundle, sem erro de compilação. Sem diff em
  src/components/. Nenhuma regra de cálculo alterada.
- Duas tentativas de automação precisaram de correção de alvo: Importar
  abre primeiro o modal, e Esc precisa de foco em um controle da consulta.
  Nenhuma delas indica defeito do produto. Uma chamada de recarga expirou
  e o navegador foi retomado pelo estado atual. Sem erro de página nos
  logs finais observados.

## Entrega

Build `index-CaOM8unz.js` servida pelo processo existente na 5173. O autor
precisa atualizar sua página habitual. A origem, o seletor de apresentação
e o armazenamento não mudaram. Clássica padrão global, G2 prévia, com o
direcionamento local de teste da 5173 preservado.

Capturas: `qhd-painel.jpg` e `qhd-detalhe.jpg`. Cópias anteriores dos três
arquivos em `antes/`, com hashes em `hashes-antes.json`. Os hashes finais
e o diff deste ajuste ficam ao lado. Aceite visual do autor pendente,
barra 9/10. Sem merge, commit, push ou deploy.

Fonte de regras conferida, sem alteração neste lote de UI:
SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
Consulta ao remoto falhou nesta sessão. A referência local preserva seis
commits à frente, sem integração automática.
