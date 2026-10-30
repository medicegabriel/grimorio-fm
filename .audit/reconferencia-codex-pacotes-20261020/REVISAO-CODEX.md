# Reconferência dos Pacotes para Aliados, 20/10/2026

## Resultado

PA-I1 e PA-I2 encerrados na versão entregue. Não repetir a implementação nem manter esses dois defeitos na fila. Há uma pendência distinta, PA-I3, no Múltiplos Efeitos com prazos mistos. Após esta revisão, o autor respondeu em 20/10: cada benefício termina no próprio prazo. A pergunta 8 está resolvida, falta implementar e reconferir PA-I3.

Clássica continua padrão, G2 prévia em `?ficha-g2=1`. O teste real e o aceite visual do autor continuam pendentes. O lote dos Pacotes é escopo adicional e não altera os nove marcos técnicos já concluídos do G2.

## Procedência e preservação

- Os 33 arquivos do manifesto da correção conferiram antes e depois de todas as verificações, antes de atualizar a documentação desta reconferência. Destes, 21 são fontes em `src/`. Ver `proveniencia.json` e `proveniencia-pos-testes.json`.
- Não houve edição de produto pelo Codex. Os documentos de revisão/coordenação foram atualizados depois das provas. Nenhuma sessão ou ficha do autor foi usada, alterada ou apagada.
- Chrome real, contextos isolados, fichas sintéticas e cliques reais sem `force`. Downloads e evidências intermediárias ficam fora do projeto durante a navegação, para não provocar recarga do servidor dev pelo Tailwind.
- Desenvolvimento em 5320 e produção em 5321. A build reconferida mantém `index-BeqttLoe.js`, igual à entrega. Servidores preservados.
- Nenhum commit, push, merge ou deploy. `origin/main` local indica seis commits à frente. A consulta atual ao remoto não teve sucesso, portanto essa contagem é da referência local, não uma confirmação atual do GitHub.

## Verificação independente executada

| Prova | Resultado |
|---|---|
| Doze arquivos de asserts focados | 706 passando, incluindo os 145 de Pacotes |
| Roteiro de navegador da devolutiva, desenvolvimento | 48/48, em 1024 e 1440 |
| Mesmo roteiro, produção | 48/48, em 1024 e 1440 |
| Provas próprias de função da revisão anterior | 6/6, incluindo +3 fora e +5 em combate |
| Lint de Afty e App | Passou, apenas nota do Babel sobre arquivo grande |
| Build | Passou, com aviso de tamanho de bundle |
| Caso adicional misto, função e navegador de produção | Pendência reproduzida nas duas larguras e apresentações |

O `browser.mjs` desta reconferência é uma cópia do roteiro ampliado da correção, que por sua vez usa os auxiliares e casos do roteiro original do Codex. Foi executado novamente pelo revisor. O teste misto é próprio: `prazos-mistos.mjs` e `misto-browser.mjs`. As pastas da entrega e da primeira revisão ficaram intactas.

A suíte inteira 223/225, os 65/65 anteriores e os 47/47 de Fonte Externa manual constam da entrega, mas não foram novamente executados pelo Codex nesta reconferência. Não apresentá-los como prova independente adicional. As duas falhas prévias da suíte não foram atribuídas a este lote.

## PA-I1 encerrado

Arquivo realmente exportado e importado: Bastião +3 e definição manual da mesma origem, +5 Só em Combate. Resultado na tela: Defesa base 17, fora de combate 20, em combate 22, fora novamente 20. Igual na clássica. O resultado da segunda ativação não tira Defesa. Clique duplo não duplica a instância.

O código filtra a elegibilidade antes de disputar o maior nos ramos de catálogo, auxílio, Aura numérica e Aura de Dano. O dado próprio da Aura não é retirado fora da condição. As provas desses ramos também estão nos 145 asserts reexecutados. Feitiço e Estilo continuam usando o filtro do motor.

## PA-I2 encerrado para prazos de uso

O arquivo guarda `proximo`, Por Um Ataque. O efeito de um ataque sobrevive a uma virada no G2 e outra na clássica, à recarga e permanece até Encerrar ou descanso. O Feitiço de uma rodada expira na primeira virada e o de duas na segunda, sem arrastar o de um ataque junto. Cartão G2, detalhe e linha clássica mostram o prazo.

O resolvedor usa `umGolpe` de cada subefeito resolvido, incluindo Reação de Defesa/RD e Múltiplos Efeitos cujo campo geral é falso. A combinação com prazos diferentes tem a pendência abaixo, separada do conserto do prazo de uso.

Arquivos já exportados conservam a duração antiga. Reexportar pelo suporte, importar a revisão nova no aliado e encerrar/reativar a opção. Atualizar a biblioteca não deve modificar uma instância antiga já ativa.

## PA-I3, P2: TR de uma rodada continua ligado junto do benefício por ataque

Local: `src/systems/afty/ficha/pacotes-familias.js`, `resolverFeitico`, seleção do prazo e criação da lista de benefícios. A instância em `pacotes-aliados.js` tem um único `rodadas`, para a lista inteira.

Reprodução própria:

1. Suporte sintético com Feitiço Auxiliar nível 1, Múltiplos Efeitos, Imediata, Reação, Defesa e TR. O motor resolve Defesa por um golpe e TR sem essa marca.
2. O pacote exporta Defesa +3 e Reflexos +2. A opção inteira recebe Por Um Ataque. A condição textual diz Bônus em Teste de Resistência: Uma Rodada.
3. Aliado sem pacote: Defesa 17, Reflexos +7. Ativar: Defesa 20, Reflexos +9.
4. Avançar três vezes sem ataque: Reflexos continua +9 em todas, inclusive depois de abrir a clássica. A instância tem `rodadas: null` e conserva os dois benefícios.

O texto da condição não encerra o TR. São quatro reprovações de comportamento, uma por largura/apresentação, para um mesmo defeito. Ver `prazos-mistos.json`, `misto-browser-5321.json` e as capturas `5321-misto-*`. O arquivo importado nesse teste foi produzido pelo resolvedor e pelo exportador reais, não escrito com bônus inventados pelo teste.

Recomendação técnica: preservar o prazo de cada benefício. Não expirar a Defesa por ataque junto com o TR, nem estender o TR até o uso da Defesa. A representação interna pode ser escolhida pelo implementador, preservando identidade, atualização, instâncias existentes e uma ativação coerente. Uma condição textual não substitui esse comportamento.

Decisão do autor recebida depois da reprodução: "Cada benefício termina no próprio prazo (recomendado)". Implementar os prazos próprios, preservando cada parte até o seu término. Não manter o conjunto por prazo de uso nem retirar a parte ainda válida quando a outra termina. Não mexer nas outras sete leituras para resolver esta. A correção dos dois defeitos anteriores permanece válida.

## Desempenho reexecutado

Mesma build, Player 30 denso, com e sem oito opções recebidas, duas repetições. Sem pausa artificial entre abrir a Preparação e clicar Confirmar. Medida do ponteiro até a atualização observada e mais dois quadros.

- Com oito opções: Confirmar Ataque Concentrado 31 e 32 ms. Ativar uma nona recebida 58 e 54 ms. Quatro ativações adicionais em sequência, todas presentes ao final. Nenhuma tarefa longa observada nesses casos.
- Sem pacote: Confirmar 58 e 38 ms. Houve uma tarefa longa de 57 ms na primeira repetição.
- Abrir Buffs na clássica: 31 ms sem pacote e 34 ms com oito, nas duas repetições, sem tarefa longa nesses casos.
- Doze registros de medida, quatorze operações, nenhum erro de página. `perf-5321.json`. O benchmark reutiliza o roteiro da entrega em cópia própria. Antes histórico não reexecutado. Essa amostra não garante ausência universal de travadas nem substitui o teste real do autor.

## Próximo passo

Levar a reconferência e PA-I3 ao Claude sem refazer o lote. A decisão de prazos próprios já foi dada pelo autor, sem necessidade de nova confirmação. Conservar biblioteca, instâncias antigas, rascunhos, custos, tema e clássica como padrão. Reconfirmar o caso misto após o ajuste e manter os testes PA-I1/PA-I2 como regressão. O autor pode testar os demais Pacotes na prévia enquanto essa pendência é resolvida.
