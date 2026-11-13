# Normas de Addons

Escrito em 2026-11-12, a pedido do autor ("criar normas e orientaçoes para criaçao de addons e do site").

Este documento é NORMA: diz o que é obrigatório, o que é proibido e em que ordem se trabalha. O COMO de cada
campo continua em `docs/afty-addons.md` (o guia técnico, com uma seção por pacote) e em
`docs/automacao-dsl.md` (a linguagem). Quando uma norma daqui discordar do código, vale o código, e a norma é
corrigida no mesmo dia.

Cada regra tem um número (A-01, A-02) para ser citada em revisão e em relatório.

## 1. Princípios

| Nº | Regra | Por quê |
|---|---|---|
| A-01 | Addon é DADO, nunca JavaScript. A lógica de um addon é DSL | sem servidor, código de terceiro alcançaria todo o armazenamento do navegador |
| A-02 | Um addon pode tudo que o Motor já sabe dizer, e nada além | falta de canal vira trabalho no motor, e não gambiarra no pacote |
| A-03 | Verbo (mecanismo) entra no motor. Substantivo (conteúdo da mesa) fica no pacote | um verbo escondido num pacote não serve a outra mesa e não tem assert |
| A-04 | Regra que tem número vira efeito. Texto solto só para o que o motor não alcança, marcado como de mesa | "a tela só exibe" é o defeito que o autor mais combate |
| A-05 | O texto de regra é fiel ao que o autor mandou. Nada de parafrasear, resumir ou "melhorar" | o pacote é a fonte da mesa, e paráfrase muda regra sem ninguém ver |
| A-06 | Regra ambígua, faltando ou contraditória vira pergunta ao autor, com opções fechadas, ANTES do JSON | suposição vira número errado na ficha de alguém |
| A-07 | Correção de regra do livro dentro do Afty é `substitui`. Nunca se edita o raw nem `src/components/` | o livro tem de continuar igual ao livro |

## 2. Da ideia ao pacote (ordem obrigatória)

1. **Receber a fonte.** O texto do autor, inteiro. Se veio em pedaços, juntar e confirmar que está completo.
2. **Classificar cada frase** em uma de quatro caixas:
   - **Número automático:** bônus, custo, vaga, limite, dado. Vira efeito.
   - **Escolha do jogador:** "escolha uma entre", "ou". Vira escolha com custo.
   - **Estado de mesa:** "enquanto ativo", "ao despertar". Vira interruptor ou contador.
   - **Narrativa ou decisão do mestre:** vira descrição, marcada como de mesa quando descreve regra não
     automatizada.
3. **Listar as dúvidas** (A-06) e perguntar de uma vez, no máximo quatro perguntas, cada uma com a
   recomendação primeiro.
4. **Decidir o alcance:** vale para criatura, personagem, ou os dois? Vale em que mesa? Sem resposta, parar.
5. **Procurar um vizinho.** Antes de inventar campo, achar em `addons/` e em `docs/afty-addons.md` um pacote
   que já fez algo parecido e copiar a forma dele.
6. **Checar o alcance do motor.** Para cada número, existe canal? Para cada estado, existe porta de dono? Se
   faltar, é trabalho de motor (seção 7), e ele vem ANTES do pacote.
7. **Escrever o JSON**, validar, escrever o assert, conferir no navegador, documentar (seções 3 a 6).

## 3. O pacote

### 3.1 Identidade

| Nº | Regra |
|---|---|
| A-10 | `id` em minúsculas, números e hífen, de 2 a 40 caracteres. Ele vira o namespace e NUNCA muda depois de publicado: mudar o id deixa toda ficha que usa o pacote com linha morta |
| A-11 | `autor` é `"Templas"` e `paraRaw` é `"afty"`. O validador recusa outro `paraRaw` |
| A-12 | `versao` no formato `maior.menor.correção`. Sobe a correção para texto e conserto, a menor para conteúdo novo, e a maior quando uma ficha antiga muda de número ou perde uma entrada |
| A-13 | `nome` em Title Case, sem o prefixo "Addon" e sem versão no nome |
| A-14 | `categoria` é uma de: `regras`, `origens`, `treinos`, `talentos`, `equipamentos`, `tecnicas`, `ferramentas`, `outros` |
| A-15 | Um pacote, um assunto. Regra de mesa não viaja no mesmo pacote que uma origem. Pacote que depende de outro declara isso na descrição |

### 3.2 Texto

| Nº | Regra |
|---|---|
| A-20 | `descricao` diz o que o pacote traz, o que ficou de mesa e do que ele precisa (versão do app, outro pacote) |
| A-21 | `resumo` é uma linha de fato direto, até 160 caracteres, com o número ou o nome concreto. Sem "permite", "oferece", "garante", "serve como", adjetivo vago, gerúndio no fim, travessão, ponto e vírgula, negrito, emoji ou aspas curvas |
| A-22 | Nome de entrada em Title Case, igual ao da fonte |
| A-23 | Descrição de entrada é o texto da fonte, sem títulos de seção, numeração editorial ou observação de quem digitou. Erro de digitação da fonte fica, salvo o autor mandar corrigir |
| A-24 | Nenhum travessão U+2014 em campo algum. Em texto de tela escrito por nós (rótulo, nome de opção), também sem ponto e vírgula |
| A-25 | Texto que descreve regra NÃO automatizada leva `mesa: true` quando a família aceita, e entra em `docs/a-fazer.md` como pendência com o motivo |

### 3.3 Ids e referências

| Nº | Regra |
|---|---|
| A-30 | Id de entrada em `snake_case`, sem o prefixo do pacote. O registro prefixa na carga |
| A-31 | Referência a irmão do mesmo pacote vai sem prefixo. Referência ao livro usa o id do livro |
| A-32 | Id de OPÇÃO de escolha não é prefixado pelo registro. Ele leva um prefixo curto do pacote escrito à mão (`edo_uchiha_...`), para não colidir com opção de outro pacote |
| A-33 | Id publicado não muda e não é reaproveitado para outra coisa. Entrada aposentada sai do pacote, e a versão maior sobe |
| A-34 | A variável da DSL é o `snake_case` do id final (`meu_pacote_golpe_eco`). Fórmula nunca cita nome de tela |

### 3.4 Efeitos

| Nº | Regra |
|---|---|
| A-40 | Todo efeito é `{ canal, expr, quando?, alvo?, duracao? }`, com canal que existe. Canal inventado é descartado em silêncio pelo motor, então o validador e o assert são a única defesa |
| A-41 | Arredondamento sempre para baixo (`piso`), salvo a fonte mandar outro |
| A-42 | Bônus que só vale com algo ligado usa `quando` com o estado, e `duracao: "temporaria"`. Só o permanente conta para pré-requisito |
| A-43 | O efeito mora onde ele pode ser desligado: na OPÇÃO escolhida quando depende de escolha, e não na raiz. Desmarcar a escolha tem de zerar o número |
| A-44 | Efeito leva `nome` quando a parcela precisa aparecer no hover com o nome da característica, e não o do pacote |
| A-45 | Estado de combate de addon declara dono (`requerTalento`, `requerHabilidade`, `requerAptidao` ou `requerEscolha`). Sem dono, o interruptor aparece para toda ficha que tem o pacote |
| A-46 | Primitiva do motor que fica escondida da tela comum é pedida em `permite`. `libera` só com nome que existe na lista de liberações |
| A-47 | "Um entre vários" com pesos diferentes ("2 treinadas ou 1 especialista") é escolha com `vagas` e `custo` por opção, nunca dois campos soltos |
| A-48 | Vaga só abre no nível certo (`ndMin`). Nada de opção que aparece cedo e "não vale ainda" |

### 3.5 Tamanho e forma

| Nº | Regra |
|---|---|
| A-50 | Campo de topo que o normalizador não conhece é apagado em silêncio. Campo novo de topo é trabalho de motor |
| A-51 | A entrada tem a MESMA forma da entrada do livro daquela família, mais `tags` e `efeitos`. Copiar a forma do catálogo, não de memória |
| A-52 | Variação de classe usa `herdaDe`. Variação de origem usa `variacaoDe`. Copiar as entradas da mãe para dentro do pacote é proibido |
| A-53 | Clã novo do Herdado entra pela família `clas`, nunca por `substitui` no campo `clas` |
| A-54 | O pacote é pequeno: o armazenamento do navegador tem 5 MB e cada ficha carrega a cópia. Imagem e texto longo repetido não entram |

## 4. Verificação (nada é entregue sem)

| Nº | Passo |
|---|---|
| A-60 | `validarPacote(json)` sem erro e `aplicarAddons([normalizarPacote(json)])` sem `problemas` |
| A-61 | Assert próprio em `asserts/t-<pacote>.mjs`, com `afty-derive.js` importado primeiro e o JSON lido de `addons/` |
| A-62 | O assert roda a ficha nos DOIS sistemas (`player` e `afty`), salvo o pacote ser de um só por decisão do autor |
| A-63 | Para cada efeito: o caso ligado, o caso desligado e a contraprova (sem o pacote, ou sem a escolha, o número não muda) |
| A-64 | Para cada degrau de nível citado na fonte: um caso abaixo, um no degrau e um acima |
| A-65 | O assert confere que os textos não têm U+2014 |
| A-66 | `npm run asserts` inteiro, `npx eslint src/systems/afty` e `npx vite build` |
| A-67 | Navegador: instalar o pacote na aba Addons (ou abrir a ficha da mesa, se for nativo), escolher a entrada, ver o número mudar e ver o hover dizer de onde veio |
| A-68 | Dados de teste apagados, servidor desligado, entrada temporária removida |

## 5. Documentação ao fechar

| Arquivo | O que entra |
|---|---|
| `docs/afty-addons.md` | a seção do pacote: tabela de partes, o que ficou de mesa, o que mudou no motor |
| `docs/automacao-dsl.md` | canal, variável ou função nova |
| `docs/afty-formulas-base.md` | fórmula nova ou confirmada pelo autor |
| `docs/a-fazer.md` | as leituras feitas sem o autor, numeradas, e o que segue de mesa. Sai a entrada resolvida |
| `docs/afty-status.md` | a sessão: o pedido nas palavras do autor, a tabela de decisões, o que mudou, o que foi verificado |
| `asserts/LEIA.md` | a linha do assert novo |

## 6. Entrega

| Nº | Regra |
|---|---|
| A-70 | Commit e push são do autor. Entregam-se os comandos em PowerShell, um por bloco |
| A-71 | Motor e pacote vão no mesmo push. Pacote que depende de campo novo só funciona depois do deploy |
| A-72 | O JSON do pacote acompanha a entrega como arquivo, porque o autor costuma instalar colando |
| A-73 | O relatório diz: o que entrou com número, o que ficou de mesa, as decisões tomadas e o que depende do autor |

## 7. Quando o motor precisa crescer

Só depois de confirmar que nenhum canal, porta ou campo existente serve (seção 2, passo 6).

| Nº | Regra |
|---|---|
| A-80 | O verbo novo é geral: serve a qualquer mesa, e não cita o pacote que o pediu. A única exceção registrada é dado estrutural de um pacote embutido |
| A-81 | Verbo novo nasce escondido atrás de `permite`, para não aparecer na tela de quem não pediu |
| A-82 | Verbo novo tem assert próprio, linha em `docs/automacao-dsl.md` e exemplo em pelo menos um pacote do repositório |
| A-83 | Validador que olha o FORMATO de um id usa o id sem o namespace |
| A-84 | Família nova declara o religador de TODAS as estruturas derivadas do catálogo dela. Estrutura esquecida é bug calado |
| A-85 | Nunca um `import` novo no topo de módulo FOLHA. Rodar `node asserts/t-ordem-modulos.mjs` em toda mudança de import |

## 8. Pacotes nativos de mesa

Valem para a Guilda e para qualquer mesa futura.

| Nº | Regra |
|---|---|
| A-90 | Pacote nativo é o que TODA ficha da mesa tem. Conteúdo opcional continua sendo addon comum |
| A-91 | O que o motor já sabe dizer vai no pacote nativo de regras da mesa. O que precisa de código vai em `src/systems/<mesa>/`, atrás de `regraDaMesa` |
| A-92 | Nativo não aparece na aba Addons nem na marca de addons da Ficha, e se refaz da fonte do app toda vez que a ficha entra |
| A-93 | Mudar um nativo muda TODAS as fichas da mesa no próximo deploy. Mudança que altera número de ficha existente pede aviso ao autor antes |
| A-94 | Regra de mesa que só esconde ou troca algo da tela é registrada como regra de tela, com a frase do autor como fonte |

## 9. Erros que já aconteceram (não repetir)

1. Efeito validado e nunca aplicado, porque o exemplo do doc não tinha assert.
2. Estado de combate sem dono aparecendo para quem não pegou o Talento.
3. Clã de uma origem de addon vazando para o Herdado do livro.
4. Validador reprovando todo Treino Especial de addon por olhar o id com o namespace.
5. Campo de topo desconhecido sumindo em silêncio.
6. Pacote de perícias recusado como "vazio" porque o validador não contava a família como conteúdo.
7. Assert comparando um campo que não existe (`total` em vez de `bonus`), e passando vazio contra vazio.
8. Relato de "não funciona" logo depois do push que era o deploy antigo ainda no ar.
