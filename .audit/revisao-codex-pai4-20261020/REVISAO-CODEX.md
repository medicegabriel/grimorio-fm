# Reconferência PA-I4, 20/10/2026

## Resultado

PA-I4 corrigido e encerrado na amostra reconferida. O benefício que herda rodadas da opção ganha prazo efetivo e contador, e termina sem levar o benefício por ataque. PA-I1, PA-I2 e PA-I3 continuam encerrados. Não foi encontrado novo bloqueio nesta correção.

O próximo passo é o teste real do autor, com pacote exportado pelo suporte e importado no aliado. Clássica permanece padrão, G2 prévia em `?ficha-g2=1`. As sete leituras de regra já registradas continuam sem aprovação implícita. A decisão de cada benefício no próprio prazo está resolvida.

## Procedência e escopo

- 36 hashes da entrega conferiram antes e depois de todas as verificações, antes de atualizar a documentação. São 24 fontes em `src/`. `proveniencia.json` e `proveniencia-pos-testes.json`.
- As 27 cópias de fontes/asserts da pasta antes/ conferem com o manifesto da nossa revisão anterior. `proveniencia-antes.json`. O episódio de edição relatado pelo desenvolvedor não deixou alteração adicional nos arquivos examinados.
- A revisão do diff confirma quatro arquivos de produto alterados nesta rodada: `pacotes-aliados.js`, `PacotesPecas.jsx`, `RecebidosG2.jsx` e `recebidos.js`. Nenhuma alteração nova no motor ou na virada. `src/components/` sem diff.
- HEAD `68888733deffa9700aa69761fd965a504b9152db`. Referência local origin/main seis commits à frente. Consulta atual ao GitHub falhou. Nenhum merge foi realizado, e a base reunida ainda precisará de revalidação antes de publicar.
- Build reconferida conserva `index-DXbM09UQ.js`. Servidores 5320/5321 preservados. Chrome real, contextos novos e fichas sintéticas, sem ler ou modificar fichas do autor. Nenhum commit, push, deploy ou edição de produto pelo Codex.
- Livro local conferido, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. Não houve nova decisão de regra nesta revisão.

## Verificações independentes

| Prova | Resultado |
|---|---|
| Doze arquivos focados de asserts | 750 passando, incluindo os 189 de Pacotes |
| Nosso roteiro original de compacta/herança, produção | 22/22, em 1024 e 1440 |
| Mesmo roteiro original, desenvolvimento | 22/22, em 1024 e 1440 |
| Roteiro ampliado PA-I4 da entrega, produção | 54/54, em 1024 e 1440 |
| Nossa prova original de função do prazo herdado | TR expira na primeira virada, Defesa preservada até a terceira |
| Lint de Afty/App | Passou, com a nota conhecida do Babel sobre arquivo grande |
| Build | Passou, com avisos de tamanho e tempo dos plugins |

São 98 conferências de interface, sem falha final ou erro de página. A repetição do nosso roteiro é feita a partir da pasta da revisão anterior, sem usar a cópia modificada do desenvolvedor. As únicas adaptações são o destino das evidências e os dados auxiliares na nova pasta. O roteiro de 54 casos é cópia da entrega, executada novamente pelo revisor.

Arquivos: `compacta-heranca.mjs`, `compacta-heranca-5320.json`, `compacta-heranca-5321.json`, `browser-pai4.mjs`, `browser-pai4-5321.json`, `prazos-herdados.mjs`, `prazos-herdados.json`, `asserts-focados.json`, `lint.txt` e `build.txt`. Nenhuma pasta de prova anterior foi sobrescrita. Downloads e dados intermediários ficaram fora do projeto durante a navegação dev, para não provocar recarga do Tailwind.

A suíte completa 223/225 e os percursos de 65/65, 48/48 e Fonte Externa manual 47/47 são provas da entrega e não foram reexecutados pelo Codex nesta rodada. As duas falhas gerais anteriores continuam distintas. O nosso roteiro de 22 casos cobre também o ciclo explícito do PA-I3 na compacta, que segue passando. Não somar números de rodadas anteriores como novas provas independentes.

## Comportamentos reconferidos

- Arquivo com prazo geral de uma rodada e exceção por ataque: importação aceita, resumo da importação e da opção mostram o prazo efetivo, e a instância cria `rodadas: 1` para o TR.
- Virada primeiro: Reflexos +9 retorna a +7, Defesa 20 permanece, e mais viradas ou recarga não restauram o TR nem retiram a Defesa.
- Ataque primeiro: Encerrar Parte tira só Defesa. TR permanece por uma rodada e sai depois, inclusive com a virada feita na clássica.
- Encerrar inteiro, Reativar e recarga conservam a separação e os contadores da ativação nova. Compacta exercitada com clique real e Enter.
- Rodadas diferentes: Defesa de uma rodada sai na primeira, TR herdado de duas sai na segunda, com recarga e comparação na clássica.
- Instância antiga sem contador não é reescrita. A completa mostra o TR como parte de encerramento manual e não alega contagem automática. Encerrar Parte retira só esse TR e preserva Defesa. Para obter o contador, encerrar e reativar a opção.
- Os asserts reexecutados cobrem ainda próprio/herdado na ordem inversa, nenhum prazo próprio, equivalência das instâncias, opção da biblioteca não reescrita, sessão relida e igualdade com a função de Encontro. Encontro não foi exercitado por inclusão na interface.

Nenhum prazo próprio e opção permanente herdada não foram novamente exercitados no navegador: estão na cobertura de função dos asserts. Isso não ratifica a política de descanso ou as outras leituras de regra pendentes. O encerramento automático de um ataque continua fora do escopo, com encerramento manual honesto.

## Desempenho reexecutado

Produção, Chrome, Player 30 denso, duas repetições na mesma build, sem outra bateria simultânea. Sem pausa artificial entre abrir Preparação e clicar Confirmar. Medida do ponteiro à atualização observada e mais dois quadros.

- Com oito recebidos: Confirmar Ataque Concentrado 31/32 ms, ativar nona opção 49/45 ms. Duas ativações em sequência por repetição, quatro de quatro preservadas.
- Sem pacote: Confirmar 34/30 ms.
- Abrir Buffs na clássica: 34/31 ms sem pacote, 33/31 ms com oito.
- Nenhuma tarefa longa observada nesta amostra. Doze registros de medida, quatorze operações, nenhum erro de página. `perf-5321.json`.

O antes não foi reexecutado independentemente. As latências variam entre rodadas, e a coincidência de uma subida com e sem pacote não identifica sua causa. Não atribuir a diferença à máquina com certeza nem prometer ausência universal de travadas. Nesta amostra não apareceu regressão material ou perda de ativação.

## Fechamento e próximos passos

Retirar PA-I4 da fila de correções. Não mandar refazer os quatro casos encerrados nem reexecutar o prompt original dos Pacotes. O autor testa um pacote real com as fontes que usa, ativa/desativa opções, avança rodadas e recarrega, comparando os valores na clássica. As sete perguntas anteriores e os itens Só Consulta/sem representação continuam separados desse aceite técnico.

Para instância recebida antiga que herdava rodadas e nasceu sem contador, encerrar e reativar. Reexportar/importar também quando a biblioteca ainda contém uma duração anterior às correções. Não reescrever silenciosamente uma ativação antiga.

Documentação de estado e progresso atualizada após as provas. Os nove marcos técnicos anteriores do G2 permanecem concluídos, o teste final do autor continua pendente. Nenhuma promoção da prévia ou publicação está implícita nesta reconferência.
