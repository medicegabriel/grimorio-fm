# Reconferência independente do G2-I1, 19/10/2026

G2-I1 encerrado. A revisão técnica do escopo viável integrado está aprovada por amostra. Marcos 8 e 9 concluídos na base local examinada. O marco 10 continua com o autor. A ficha clássica permanece como padrão e o G2 como prévia. Não houve mudança de produto, sessão do autor, commit, push, deploy ou merge pelo Codex.

## Procedência

HEAD local 68888733deffa9700aa69761fd965a504b9152db. Os 17 hashes do manifesto da correção conferem antes e depois das verificações. As referências locais indicam origin/main seis commits à frente, substituindo o número cinco do relato anterior. A consulta ao GitHub falhou nesta revisão. Nenhum remoto foi integrado.

## Fonte Externa

- Inspeção de ficha-recebidos.js e dos consumidores G2, clássica, Encontro e ficha-buffs. A tradução fica em módulo folha, sem importar a apresentação do G2 na clássica. Sem registro, o consumidor recebe o derive anterior. A cópia traduzida conserva identidade e a tradução não duplica benefícios.
- 303 asserts focados reexecutados: Fonte Externa 52, desempenho 30, preferências 42, operações 51, virada 57, módulos 36 e classificação 35. Todos passaram.
- Sete contextos próprios de Chrome, 36 conferências de interface, sem falha final ou erro de página. Registro feito por clique real, sem force ou element.click. Minamoto, Player 30 e Calamidade mantêm +7 ao trocar G2/clássica e recarregar. Minamoto passa de 82 para 89 nas duas.
- Dois registros de Aura do Bastião, +2 e +3 de aliados diferentes, contam +3 uma vez nas duas apresentações, em 1024 e 1440. Com Feitiço +7, a combinação conserva +10. A virada na clássica, recarga no G2 e expiração no G2 conservam prazo e número.
- Ataque Concentrado, Espírito de Luta e Conhecimento Aplicado confirmados em sequência sem pausa: três estados preservados, uma cobrança automática do AC, sem cobrança indevida dos manuais. O resultado final da tela corresponde à sessão mais recente e à clássica.
- Encontro: 21 conferências próprias nas funções, em três amostras, incluindo invalidação do cache por registro, maior de catálogo, prazo e expiração. Não há prova de inclusão pela interface do Encontro. O primeiro verificador usou incorretamente a Defesa inicial como referência após a renovação da Guarda na Calamidade. As duas falhas do verificador foram corrigidas comparando a mesma rodada com e sem registro. Primeira passagem preservada, sem mudança de produto.

## Desempenho independente com Fonte Externa

Chrome local, sem throttling, 1440x900, contextos isolados e imagens externas abortadas. Desenvolvimento em 5320 e build de produção em 5321. Sementes densas iguais entre ambientes, com Feitiço recebido e, no caso de Catálogo, também duas Auras do Bastião. A amostra é mais densa que o roteiro da entrega. Não comparar diretamente os números como regressão ou ganho.

Foram 26 operações reais em dez contextos: 14 confirmações G2 e 12 encerramentos individuais na clássica. As confirmações medem pointerdown até cartão observado no DOM e dois quadros, sem pausa artificial entre abrir Preparação e confirmar. A sequência do Minamoto também confirma Espírito e Conhecimento sem espera entre eles. O observador acompanha o trabalho posterior por 650 a 900 ms. Não houve ativação perdida ou pausa de dois segundos nessa amostra.

| Medida | Desenvolvimento | Produção |
|---|---|---|
| Confirmações G2, ponteiro até cartão e dois quadros | 31,5 a 51 ms | 28,9 a 43 ms |
| Tarefas longas residuais observadas | 60 a 94 ms | 55 a 72 ms |

Com apenas Feitiço recebido, o G2 não apresentou tarefa longa nesta amostra. Com Catálogo, o Minamoto G2 apresentou três tarefas de 70 a 72 ms em produção, e a clássica uma de 55 ms. A Calamidade G2 com Catálogo não apresentou tarefa longa na operação medida. Não vale a afirmação universal de uma única tarefa de 54 ms ou ausência de tarefa longa na clássica.

O corte previsivo evita iniciar outro passo estimado quando excederia o orçamento, mas não interrompe um derive atômico nem garante um teto rígido de 30 ms. A versão anterior não foi reconstruída e reexecutada pelo Codex. O aceite de desempenho em uso real permanece no marco 10 do autor.

## Demais verificações e limites

Lint de Afty/App e build reexecutados e aprovados. Suíte integral reexecutada: 222 de 224 arquivos passaram. Falharam somente t-prodigio e t-reconciliacao-g00, os dois já registrados na linha de base. A saída está em asserts-completo.txt. Não declarar uma suíte totalmente verde. Os resultados focados e os hashes estão em auditoria.json e proveniencia.json.

A aprovação cobre a correção e a integração viável na base local, somada à revisão anterior. Não declara automação universal, aceite visual ou integração dos commits remotos. Recursos ainda acessados pela Apresentação Anterior e dependências de regra continuam na fila. O trabalho paralelo foi preservado. Não houve edição de src/components/.

## Teste do autor

Abrir http://127.0.0.1:5321/Afty?ficha-g2=1 ou /Player?ficha-g2=1, selecionar a própria ficha e:

1. Registrar Feitiço recebido de Defesa +7 e comparar com a mesma ficha sem o parâmetro G2.
2. Com Fonte Externa registrada, confirmar AC e outras ativações em sequência na ficha densa e comparar fluidez, Energia e Histórico.
3. Avançar rodada, recarregar e conferir prazo, expiração e persistência.

Servidores iniciados pelo Codex em 5320 e 5321. O protótipo da porta 5200 não é o destino desta revisão.
