# Bordas dos cartões da prévia, 22/10/2026

Pedido do autor: uniformizar os cantos mostrados em Rápido e Dano, que pareciam
ter curvaturas diferentes conforme o tamanho.

Alteração única de produto em src/systems/afty/ficha/abas-g2/abas-g2.css:
as seções usam raio fixo de 12 px, e o fundo do cabeçalho usa 11 px nos cantos
superiores, acompanhando o interior da borda de 1 px. Antes, o contorno tinha
14 px e o cabeçalho não tinha arredondamento próprio, dependendo do recorte
externo. A medida comum fica declarada na própria seção e vale nas três abas.
Alturas, espaçamentos, operações e o restante aprovado não foram alterados.

Build exclusivo da prévia aprovado, servido na 5330. Conferência direta no
navegador em 390, 1280 com compacta, 1440 e 2560 px. Rápido, Dano, Feitiços e
Domínio mantiveram 12 px em todos os tamanhos, cabeçalhos com 11 px e nenhum
estouro lateral. Em 1440, Rápido com 1244 px e Dano com 615 px usam a mesma curva.
Medidas em medidas.json e capturas em bordas-1440.png e bordas-390.png.

Mudança apenas de CSS. Sem nova suíte funcional ou testes de regra neste
retoque. O resultado 225/227 da revisão anterior continua histórico.
Lint e build têm logs próprios nesta pasta. Snapshot anterior do CSS e hashes
de fonte/dist diário preservados. Nenhuma integração nas rotas normais.
Prop, App, dist diário, 5173, dados reais e barra 9/10 preservados.
Sem commit, push, merge ou deploy.
