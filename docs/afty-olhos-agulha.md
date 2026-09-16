# Olhos de Agulha

Implementado em 2026-09-16, após as respostas do autor. Pacote instalável:
`addons/olhos-de-agulha.json`. Requer o motor com a primitiva `olhosDeAgulha`.
O JSON habilita a condição. As regras e os textos completos ficam no módulo
`src/systems/afty/afty-olhos-agulha.js`, seguindo a estrutura do Vislumbre Celeste.

## Uso

No criador, abrir Outros, Addons, Instalar, colar o JSON e marcar o pacote para a ficha.
O card Olhos de Agulha aparece na aba Habilidades. Nele são escolhidas as passivas e os
olhos restantes da ficha. Cada escolha cria uma entrada normal em `creature.feiticos`.
O painel da aba Ações, na Ficha Final e nos Encontros, controla a perda dos olhos na
sessão e os usos de Olhar que Não Falha. Usar marca o gasto, Devolver corrige a marcação.
O botão Descansar existente recupera os usos. A rolagem com vantagem continua sendo
feita pelos controles normais da ficha.

## Decisões confirmadas

- A condição base acompanha a instalação, como no Vislumbre. As habilidades são escolhidas.
- Níveis 2, 3 e 4 são de liberação de Feitiço, incluindo antecipações do Conjurador.
- As habilidades são passivas comuns e ocupam o orçamento normal de Feitiços.
- Olhar que Não Falha possui uma única entrada. A versão 4 substitui a 2.
- Custo de PE máximo: 4 ou 8 pelo Olhar, 6 pela Precisão e 6 pela Visão.
- Com um olho, os benefícios numéricos são reduzidos pela metade, com piso.
  A imunidade a Cego e a Precisão Infalível permanecem até perder o segundo olho.
- Sem olhos, nenhum benefício ocular permanece. Os custos das passivas continuam.
- O voto é somente referenciado. O autor registra seu conteúdo em outro lugar.
- O descanso atual foi aceito para recuperar os usos.

## Implementação

`resolveOlhosAgulha` recebe BT e nível máximo de Feitiço já resolvidos. Somente habilidades
escolhidas e acessíveis concedem benefícios. Escolhas inacessíveis são preservadas, com aviso
no criador, e continuam sendo passivas registradas para cobrança de PE máximo.

O bônus de Percepção entra no canal `bonusPericia` sem exclusividade, acumulando com Técnica.
Os custos passam por `peMaximoDasPassivas`, uma única vez e com fontes individuais no hover.
A exceção explícita das oculares também cobra na criatura Afty, conforme o texto fornecido.
Passivas comuns do Afty continuam sem esse custo. Desinstalar retira os benefícios da condição,
mas não apaga as passivas escolhidas nem seus custos. Elas podem ser removidas na lista de Feitiços.

Os três ids das passivas são `olhos-de-agulha:olhar`, `olhos-de-agulha:precisao` e
`olhos-de-agulha:visao`. O editor das entradas oculares não oferece a calculadora genérica de
Defesa, duplicação ou troca de tipo, pois essas entradas possuem regras próprias.

`core.olhosAgulhaRestantes` guarda a escolha do criador. A sessão pode sobrescrevê-la por
`combate.olhosAgulhaRestantes`, inclusive fora de combate. Descansar não restaura olhos.
`sessao.usos["olhosAgulha:olhar"]` guarda usos gastos, preservados ao alterar a quantidade de olhos.

Imunidade a Cego, sua exceção por ferimento complexo, alcance visual e a dispensa de Desvantagem
da Precisão aparecem como resultados e texto no title. Sua adjudicação é de mesa, pois o sistema
atual não identifica a causa da cegueira nem a distância entre atacante e alvo.

## Arquivos e verificação

- `afty-olhos-agulha.js`: regras, modelos de passivas, textos verbatim e operações de sessão.
- `ui/OlhosAgulhaCard.jsx`: escolhas do criador.
- `ficha/PainelOlhosAgulha.jsx`: painel de Ações, também usado em Encontros.
- `afty-addons.js`, `afty-derive.js` e `afty-feiticos.js`: registro, efeitos e custos.
- `asserts/t-olhos-agulha.mjs`: cálculos nos dois sistemas, liberação, acúmulo, custos,
  persistência, limites de usos e descanso.

Os textos do autor são preservados no módulo, com entidades HTML e espaços de formatação
normalizados. Não há mudanças em `src/components/`.
