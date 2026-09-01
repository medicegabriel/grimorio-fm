# Asserts do Afty

Os asserts de lógica do lado do Afty. São **2248, em 42 arquivos**, e cobrem o avaliador do DSL, as
primitivas novas do motor, o sistema de Addons de ponta a ponta e regras do catálogo que
são fáceis de quebrar sem sintoma.

Nasceram em 2026-08-20 com os Addons, e o autor decidiu no mesmo dia que a pasta **fica**, com um
comando para rodar. O motivo é que os Addons são a única parte do Afty em que **outra pessoa
escreve a entrada**: os 13 validadores de catálogo são o portão de aceitação, e estes asserts são o
que prova que o portão fecha.

## Como rodar

A partir de `grimorio-tracker/`:

```
npm run asserts
```

Ou só os que interessam, filtrando pelo nome:

```
npm run asserts -- addons
npm run asserts -- exemplo familias
```

Um arquivo sozinho continua funcionando direto, que é o mais rápido enquanto se mexe em um só:

```
node asserts/t-addons.mjs
```

O lançador roda cada arquivo em **processo próprio**, e não importando tudo junto. São dois
motivos: eles mexem no mundo global dos Addons (`aplicarAddons` reescreve os catálogos no lugar, e
um arquivo sujaria o outro), e a ordem de importação importa (ver o ciclo abaixo).

Ele só conta como sucesso quem sai com código **zero** E imprime a linha de aprovação. Arquivo que
nem compila aparece com a stack inteira. Falhou algum, o `npm run asserts` sai diferente de zero.

Nenhum assert escreve nada: são todos de leitura, com um `localStorage` de mentira onde precisa.

## Fora do build

A pasta está **fora de `src/`** e os arquivos são `.mjs`. O `vite build` não os enxerga, e o
`eslint .` também não, porque o `eslint.config.js` casa só `**/*.{js,jsx}`. Nada aqui entra no que
vai para o ar.

## O que cada arquivo cobre

| Arquivo | O que verifica |
|---|---|
| `t-dsl` | o avaliador copiado, com **30 asserts de paridade** contra o `fm-dsl.js` da 2.5.2, mais o literal de texto e o `contar()` |
| `t-contar` | o `contar()` ponta a ponta, o mapa de marcas, e a descoberta dele no seletor `{ }` |
| `t-hpatributo` | o canal `hpAtributo`, incluindo alvo ausente, empate e as linhas do hover |
| `t-ponta` | o `contar()` passando pelo `deriveAfty` de verdade, pelo Funcionamento Básico |
| `t-addons` | o ciclo completo de um pacote: validar, instalar, namespace, religar, desinstalar |
| `t-biblioteca` | a biblioteca, com `localStorage` corrompido e com `localStorage` indisponível |
| `t-linha-morta` | os três motivos de linha morta, e a garantia de que a ficha SEMPRE abre |
| `t-familias` | as seis famílias de catálogo, num pacote que mexe em todas de uma vez |
| `t-familias2` | Origem e as três de alto nível |
| `t-tabelas` | Tipo de Dano e Condição, que são tabela e não catálogo |
| `t-exemplo` | **o pacote de exemplo do `docs/afty-addons.md`**, executado de verdade |
| `t-marcas-declaradas` | marca que o addon declara mas a criatura ainda não usa aparece no seletor com zero |
| `t-encontro-addons` | o encontro MISTO: a união põe dois mundos no ar ao mesmo tempo e o de ninguém some depois do laço |
| `t-concessao` | a primitiva 8.3 no MOTOR: as 7 famílias, o "de graça" medido contra a ficha crua, e conceder algo que só existe por addon |
| `t-concessao-sessao` | a 8.3 na SESSÃO: gravar e ler de volta, o aparo que não perde o campo, e a prova de que a ficha salva não é tocada |
| `t-adaptacao` | o ciclo do Mahoraga: giros, rodada automática, marcos, Narrativa, Mecânica e escolha aninhada de Acerto |
| `t-primitivas` | o campo `permite`: quem enxerga cada primitiva de Addon, e a prova de que criatura raw não vê nenhuma |
| `t-estilo-liberado` | o campo `libera`: o Estilo das Sombras fora do Sem Técnica, o Gêmeo copiando do Sem Técnica em Verdadeiras Origens, e a QUARTA trava (o card aparecer na aba) |
| `t-remendo` | o campo `substitui`: trocar campo de entrada do livro, o id que não se mexe, o alvo que precisa existir, dois pacotes na mesma linha e a volta ao raw ao desinstalar |
| `t-estilo-conteudo` | o conteúdo do addon do Estilo: Domínio Simples reescrito, a Linha de Treinamento com `soDaOrigem`, os quatro Talentos de Origem, a vaga exclusiva de Estilo e o Estudo Amaldiçoado repetível |
| `t-gemeos-maldicao` | a liberacao `gemeosMaldicao` e a ORIGEM ESTRUTURAL: o Gemeo que copia da Maldicao perde a Energia Reversa e ganha a aba dela, medido pela igualdade com uma Maldicao de verdade |
| `t-bases-automaticas` | as Bases que a Especialização concede sozinha (`automatica: true`): quem recebe, o orçamento intocado, e a escolha aninhada que sobrevive à concessão |
| `t-pugilato` | Faixas, Manoplas e Soco Inglês alimentando o Ataque Básico: os cinco graus, o item que define o golpe, e o efeito de encantamento chegando na linha |
| `t-tamanho-pingente` | Crescimento Corporal repetível, redução de categoria, distância por tamanho e o Pingente de Amaterasu sob o sol ou com os três tesouros |
| `t-interludios` | a varredura das 12 Linhas de Treinamento: os 13 requisitos que deixaram de ser `nota`, a trava do Potencial Físico no Restringido, e ⚠ o assert estrutural que compara efeito DECLARADO contra efeito EMITIDO, para nenhum voltar a ser descartado calado |
| `t-flugel` | o pacote Flugel de ponta a ponta, lido do JSON em `addons/flugel.json` (ele saiu do bundle em 2026-09-01): instalação, Futen, Akutame, Alma Livre no nível menos 4, troca de atributo-chave, Treino não congênito, vagas conjugais, o interruptor de sessão `Cônjuge`, a Dupla Empenhada em metade do BT e ⚠ o Bônus do Cônjuge, que SUBSTITUI a perícia em vez de somar nela |
| `t-dominio-barreira` | a Expansão de Domínio lendo o Motor: os seis canais e o passe pós-aptidão em que rodam, as 4 etapas do Treino de Domínios medidas uma a uma, o Conflito de Domínio, a fórmula das duas aptidões de barreira verbatim, a Cortina valendo 3 paredes e o domo 12, o ciclo inteiro da casca de PE (da cena ao descanso), e ⚠ o assert de ARQUIVO que amarra o `Vital` compartilhado, porque assert de lógica não pega componente duplicado |

⚠ O `t-exemplo` é o mais importante de manter: ele garante que o JSON que está escrito no doc
realmente funciona. Foi ele que achou a lacuna do `efeitos` que era validado e nunca aplicado.

## Como escrever mais um

Copie a cabeça de qualquer um deles. O contrato é curto:

- importe **`afty-derive.js` primeiro**, sempre (ver a ordem, abaixo);
- use o mesmo `t(nome, achou, esperado)` e o mesmo par `ok` / `bad`;
- termine com a linha do `console.log` e com `process.exitCode = bad.length ? 1 : 0;`, porque é
  ela que o lançador lê;
- chame `limparAddons()` no fim se mexeu no mundo, para não deixar sujeira.

⚠ **Ordem de importação:** todo arquivo importa `afty-derive.js` primeiro. Importar
`afty-habilidades.js` como primeiro módulo estoura um ciclo em `afty-combate.js`
(`Cannot access 'POSTURAS_DE_COMBATE' before initialization`), e isso é anterior a este trabalho
(ver `docs/a-fazer.md`).
