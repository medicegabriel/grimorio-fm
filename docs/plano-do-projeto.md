# Plano do Projeto: análise, rumo, arte e normas

Escrito em 2026-11-12, a pedido do autor: "faça uma analise do projeto atual e proponha melhorias [...] observe
artes e inicie um planos [...] crie normas e regras para o futuro do projeto e andamaento dele, como sera
desenvolvido pensado e codado".

Este documento é PROPOSTA. Nada aqui foi aplicado no código. Cada etapa só começa com o autor dizendo qual, e
as decisões que dependem dele estão na seção 7. As regras que já valem (AGENTS.md, CLAUDE.md) continuam
valendo, e a seção 6 só acrescenta o que falta.

## 1. O que o projeto é hoje

Um site só, sem servidor, que guarda tudo no navegador de quem usa. Quatro portas:

| Rota | Para quem | O que faz |
|---|---|---|
| `/` | qualquer mestre de F&M 2.5.2 | criador e rastreador de criaturas do livro oficial |
| `/Afty` | o mestre da mesa do Afty | criatura do homebrew |
| `/Player` | o jogador da mesa do Afty | ficha de personagem |
| `/EraDeOuro` | a Guilda | criatura e personagem juntos, Carteira, Mesa do Mestre |

Medido em 2026-11-12:

| Medida | Valor |
|---|---|
| Linhas de código em `src` | cerca de 179 mil |
| Maior arquivo | `AftyCreatureBuilder.jsx`, 20.997 linhas, 1 MB |
| Arquivos de assert | 319 (2 vermelhos antigos, de inventário de revisão) |
| Addons de exemplo | 96 |
| Documentos em `docs/` | 259 arquivos, 33 MB |
| JavaScript principal publicado | 4,5 MB, mais 2,2 MB do bloco do motor |
| Pasta publicada (`dist`) | 71 MB, dos quais 62 MB são dois PDFs do livro |
| Repositório | 233 MB de histórico, 4.389 arquivos, 3.201 deles em `.audit/` (477 MB no disco) |

## 2. O que está forte

1. **O motor.** Uma função pura (`deriveAfty`) calcula a ficha inteira, e todo número diz de onde veio. É o
   que permite a Ficha, o Encontro e a Mesa do Mestre mostrarem o mesmo valor.
2. **Os addons.** A mesa acrescenta conteúdo como dado, sem código. É a ideia mais valiosa do projeto: outra
   mesa pode usar o site sem abrir o GitHub.
3. **A suíte de asserts.** 319 arquivos seguram regra de jogo. Poucos projetos pessoais têm isso.
4. **A Ficha Final G2.** É a tela mais bem acabada: hierarquia clara, Vida, Energia e Alma no topo, temas por
   variável CSS, cinco presets e CSS livre.
5. **A disciplina de registro.** Decisão do autor fica escrita com data e com as palavras dele.

## 3. Onde dói

### 3.1 O site não tem rosto
- A aba do navegador diz "grimorio-tracker".
- O ícone é o raio roxo padrão do Vite.
- O `index.css` ainda traz as variáveis do modelo do Vite, que ninguém usa.
- A fonte é a do sistema de cada pessoa, então o site muda de cara entre Windows, Android e iPhone.
- Não há página de entrada: quem chega em `/` cai direto numa lista vazia, e as outras três rotas só existem
  para quem sabe o endereço.

### 3.2 São três linguagens visuais
- A **lista** (2.5.2, `src/components/`) e o **criador** usam cores fixas do Tailwind (cinza-azulado e roxo).
- A **Ficha**, os **Encontros** e a **Mesa do Mestre** usam os tokens `--afty-*`.
- Resultado: o tema que o jogador escolhe vale na Ficha e some ao clicar em Editar. O criador também é mais
  apertado (texto de 10 e 11 px) que a Ficha.

### 3.3 O peso
- Toda rota baixa as cinco enciclopédias da 2.5.2 (4,5 MB de JSON), inclusive `/Player`, que nunca as usa.
- O criador, de 1 MB, vem junto mesmo para quem só abre a Ficha no celular.
- Só a Ficha G2 é carregada sob demanda.
- Os dois PDFs do livro (9 MB e 55 MB) estão em `public/docs` e vão ao ar com o site. Isso merece decisão do
  autor por dois motivos: peso, e ser material de terceiros publicado num endereço aberto.

### 3.4 O arquivo de 21 mil linhas
O `AftyCreatureBuilder.jsx` guarda quase todas as abas de criação. Consequências já sentidas: o HMR cria erros
fantasma, o lint demora, uma edição pequena pede a leitura de milhares de linhas, e duas pessoas não conseguem
mexer nele ao mesmo tempo sem conflito.

### 3.5 O repositório carrega a oficina
- `.audit/` tem 3.201 arquivos versionados (477 MB): capturas, cópias de segurança, saídas de teste e até
  dependências do Vite. Isso é o que faz o `npm run lint` acusar 748 problemas que não são do código.
- `themes/` tem 36 capturas de tela ao lado de 5 arquivos de tema.
- `docs/afty-status.md` passou de 14 mil linhas e não dá para ler inteiro.
- Há arquivos soltos na raiz (enciclopédias 0.2 a 0.4 duplicadas de `src/data/`).

### 3.6 Os dados moram num lugar só
Tudo fica no `localStorage` de um navegador. Limpar o navegador, trocar de celular ou estourar a cota apaga a
campanha. Hoje a única defesa é o botão Exportar, que depende de a pessoa lembrar.

### 3.7 Dois vermelhos permanentes
`t-reconciliacao-g00` e `t-revisao-g00` falham há semanas porque o inventário de revisão não conhece os módulos
novos. Uma suíte que "sempre tem dois vermelhos" ensina a ignorar vermelho.

## 4. A ideia, e como ela pode crescer

Hoje o projeto é "a ferramenta da mesa do Afty que também serve a 2.5.2". A ideia maior que já está meio
construída é: **um grimório de mesa para Feiticeiros & Maldições em que cada mesa traz as próprias regras como
pacote.** A Guilda (`/EraDeOuro`) é a primeira prova disso: uma mesa com regras, pacotes nativos, Carteira e
painel do mestre próprios.

Três direções, da mais barata à mais cara:

1. **Mesa como conceito de primeira classe.** O que a Guilda ganhou à mão (rota, pacotes nativos, regras de
   mesa, vocabulário) vira um molde: uma mesa nova é um arquivo de configuração, e não uma rota escrita no
   `App.jsx`. Fecha a pendência de "quarta rota feita à mão".
2. **Mestre e jogador conversando por arquivo.** A Mesa do Mestre já importa a ficha do jogador. O passo
   seguinte é o caminho de volta: o mestre exporta um "estado da sessão" (Vida, PE, condições) que o jogador
   importa, e os Pacotes para Aliados já apontam nessa direção. Continua sem servidor.
3. **Sincronização de verdade** (sala com código, tempo real). Exige servidor, conta e custo. Só vale depois
   das duas de cima, e é decisão de produto do autor.

## 5. Plano por etapas

Cada etapa cabe em uma ou poucas sessões, fecha com asserts, lint, build e navegador, e não depende da
seguinte. A ordem é a recomendada.

### Etapa 1: Identidade (pequena, só ganho)
- Título da aba por rota: "Grimório F&M", "Grimório Afty", "Ficha de Jogador", "Era de Ouro".
- Ícone próprio no lugar do raio do Vite (proposta na seção 5.1) e `meta` de descrição e de cor do tema.
- Limpar do `index.css` as variáveis do modelo do Vite que ninguém lê.
- Não toca em `src/components/`.

### Etapa 2: Peso (média, ganho grande no celular)
- Carregar sob demanda: o criador, os Encontros, a Mesa do Mestre e o rastreador da 2.5.2.
- Enciclopédias da 2.5.2 só na rota `/`.
- Decisão do autor sobre os PDFs (seção 7).
- Meta: a Ficha de Jogador abrir com menos de 1,5 MB de JavaScript.

### Etapa 3: Segurança dos dados (média)
- Aviso de "faz N dias que você não exporta" e botão de cópia de segurança de tudo (fichas, encontros, mesa,
  addons) num arquivo só, com restauração.
- Medidor de uso do armazenamento também nas rotas do Afty (a 2.5.2 já tem).

### Etapa 4: Arrumar a casa (média, sem mudança para o usuário)
- Tirar `.audit/` do versionamento, deixando só os scripts que ainda rodam, numa pasta `ferramentas/`.
- Mover as capturas de `themes/` para fora do repositório ou para `docs/imagens/`.
- Partir o `afty-status.md` por mês (`docs/historico/2026-11.md`), com o arquivo principal virando índice.
- Zerar os dois vermelhos: classificar os módulos novos no inventário de revisão.
- Meta: `npm run lint` e `npm run asserts` verdes de ponta a ponta.

### Etapa 5: Uma linguagem visual só (grande, em fatias)
- Levar os tokens `--afty-*` para o criador, uma aba por vez, começando pela Identidade.
- O criador passa a respeitar o tema da ficha que está sendo editada.
- Subir o texto mínimo do criador de 10 px para 12 px.
- A lista da 2.5.2 fica como está, por ser somente leitura, salvo decisão do autor.

### Etapa 6: Partir o criador (grande, em fatias)
- Uma aba por arquivo em `src/systems/afty/criador/`, na ordem em que forem tocadas pelas outras etapas.
- Regra de corte: mover sem reescrever, um assert de ordem de módulos por fatia, e navegador a cada uma.

### Etapa 7: Mesa como molde (grande)
- Extrair da Guilda o que é de qualquer mesa: registro de mesa, pacotes nativos, regras, vocabulário, rota.
- A segunda mesa (se existir) nasce de um arquivo, e prova o molde.

### 5.1 Proposta de arte e estilo

O que a observação das telas sugere, para o autor aprovar ou trocar:

| Tema | Hoje | Proposta |
|---|---|---|
| Ícone | raio do Vite | um selo próprio: um olho estilizado dentro de um círculo de barreira, em roxo sobre fundo escuro. Liga com a energia amaldiçoada e funciona em 16 px |
| Cor de marca | roxo `#a855f7` em tudo | manter o roxo como marca do Afty e dar um acento por porta: roxo no Afty, azul no Jogador, dourado na Era de Ouro, neutro na 2.5.2. O usuário sabe onde está sem ler o título |
| Fonte de título | a do sistema | uma fonte de título embarcada no site (arquivo local, sem depender de serviço externo), condensada e firme, no espírito da Bahnschrift que o G2 já pede. O texto corrido segue na fonte do sistema |
| Números | monoespaçada do sistema | manter. É o que dá leitura rápida de Vida e PE |
| Fundo | degradê escuro com brilho roxo | manter na Ficha. Na lista e no criador, usar o mesmo fundo da Ficha para acabar com a troca de clima ao navegar |
| Entrada | lista vazia | uma tela de entrada simples com as quatro portas, só para quem chega pela raiz sem fichas |
| Movimento | quase nenhum | manter contido: só transição de barra de Vida e de abertura de painel, e nada piscando além do PV crítico |

Nenhuma dessas mudanças altera regra de jogo. Todas passam pelos tokens, então os temas que os jogadores já
fizeram continuam valendo.

## 6. Normas para o futuro

As regras de AGENTS.md e CLAUDE.md seguem valendo. Estas se somam a elas.

### 6.1 Como uma mudança é pensada
1. **Primeiro a pergunta de alcance:** vale para a criatura, para o personagem, para a Guilda, ou para todos?
   Sem resposta, não se começa.
2. **Regra de jogo ambígua vira pergunta ao autor**, com opções fechadas, antes do código. A resposta é
   registrada com as palavras dele.
3. **Conteúdo é dado, mecanismo é motor.** Se dá para dizer com addon, é addon. Canal ou verbo novo no motor
   só quando o addon não alcança, e sempre com documentação.
4. **Regra de mesa mora na mesa.** O que é só da Guilda fica em `src/systems/eradeouro/`, atrás de
   `regraDaMesa`, e nunca como `if` solto no motor.
5. **Uma regra, um dono.** Antes de escrever um cálculo, procurar quem já o faz. A Mesa do Mestre usar os
   verbos da Ficha é o modelo.

### 6.2 Como é codado
1. **Arquivo novo de tela não passa de 600 linhas**, e de lógica não passa de 1.500. Passou, parte antes de
   continuar. Os gigantes de hoje só encolhem.
2. **Nada novo no `AftyCreatureBuilder.jsx` além de ligação.** Aba ou painel novo nasce em arquivo próprio.
3. **Tela nova usa os tokens `--afty-*`**, nunca cor fixa do Tailwind. Cor nova vira token com nome e uso.
4. **Tela pesada entra sob demanda** (`lazy`), para não engordar quem não a abre.
5. **Todo número derivado sai com `partes`**, e toda regra nova nasce com assert no mesmo lote.
6. **Função pura primeiro, React depois.** O modelo fica num `.js` sem React, testável no Node, e a tela só
   desenha.
7. **Dado gravado tem versão e normalizador.** Toda chave nova do `localStorage` nasce com `versao` e com uma
   função que aceita lixo sem quebrar.
8. **Nada some calado.** Recusa, corte e falha de gravação aparecem na tela.

### 6.3 Como é entregue
1. Antes de começar: rodar a suíte e anotar a linha de base.
2. Ao terminar: lint da área, build, suíte inteira, navegador (e celular quando a tela mudou), diff sem
   travessão e sem `src/components/` fora de exceção registrada.
3. Dados de teste apagados e servidor desligado.
4. Relatório curto: o que mudou, o que foi verificado, o que ficou pendente, o que depende do autor.
5. Commit e push são do autor. Um commit por assunto, com o prefixo do que mudou (`feat`, `fix`, `docs`,
   `chore`) e a área entre parênteses.

### 6.4 Como é registrado
1. Pendência vai para `docs/a-fazer.md`, com onde, situação, o que precisa e a data.
2. O que foi feito vai para o histórico, em até dez linhas por sessão. Detalhe longo vai para o guia da área.
3. Decisão do autor fica em tabela de pergunta e resposta, com a data.
4. Documento novo só quando há leitor para ele. Guia de área sim, relatório de sessão solto não.

### 6.5 Arte e texto de tela
1. Rótulos em Title Case, sem travessão e sem ponto e vírgula.
2. A tela mostra resultado e aviso de problema real. Explicação de regra fica no hover.
3. Texto mínimo de 12 px em tela nova, e alvo de toque mínimo de 36 px no celular.
4. Toda tela nova é conferida em 375 px de largura, sem rolagem lateral.
5. Contraste mínimo de 4,5 para texto e 3 para borda de controle, nos cinco temas.
6. Ícone é do lucide. Imagem de terceiros não entra no repositório sem o autor dizer de onde veio.

## 7. O que depende do autor

1. **Qual etapa começa.** A recomendação é a 1 (Identidade), por ser pequena e visível.
2. **Os PDFs do livro em `public/docs`:** continuam no ar, saem do site, ou ficam só como arquivo local que
   cada um aponta?
3. **A arte:** aprovar ou trocar o selo, as cores por porta e a fonte de título da seção 5.1.
4. **A lista da 2.5.2:** pode receber o visual novo (exceção em `src/components/`) ou fica como está?
5. **`.audit/`:** pode sair do versionamento? Há colaborador que dependa dela?
6. **O rumo da seção 4:** parar em "mesa como molde" ou mirar a troca de estado entre mestre e jogador?
