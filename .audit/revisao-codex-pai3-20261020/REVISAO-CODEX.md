# Reconferência PA-I3, 20/10/2026

## Resultado

O fluxo PA-I3 produzido pelo exportador atual está corrigido e reconferido: cada benefício termina no seu prazo, na completa e na compacta. PA-I1 e PA-I2 seguem encerrados. Resta um defeito distinto na criação de instâncias importadas, PA-I4, P2: o prazo geral em rodadas não é herdado quando outro benefício tem prazo próprio. Não refazer o lote nem pedir uma decisão nova de regra.

Clássica padrão, G2 prévia em `?ficha-g2=1`. Teste real e aceite visual do autor pendentes. Pacotes tem revisão própria, fora da barra de nove marcos técnicos já concluídos do G2. Nenhuma edição de produto, commit, push, merge ou deploy pelo revisor.

## Procedência

- Os 36 hashes finais da entrega conferiram antes e depois dos testes, antes de atualizar os documentos desta revisão. São 24 fontes em `src/`. `proveniencia.json` e `proveniencia-pos-testes.json`.
- As 24 cópias recuperadas da pasta antes/ que já tinham hash em nossa reconferência anterior conferem com esse registro independente. `proveniencia-recuperadas.json`. Isso inclui fontes, testes e o LEIA dos asserts, não todos os documentos.
- Os três arquivos adicionais fora do manifesto anterior não possuem hash anterior próprio do Codex. O diff fornecido e inspecionado mostra a adição de leitura no conjurador e ajustes nas duas telas. Não transformar isso em alegação de cópia feita antes da edição.
- No motor, `efeitosDoAuxiliarPorEfeito` é uma adição de leitura usando o caminho interno existente. `resolveAuxiliaresAtivos` não foi reescrito. Os asserts de igualdade da lista e regressões passaram.
- Livro local acessível, SHA-256 `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`. A decisão dos prazos próprios é resposta expressa do autor, não leitura nova do revisor.
- HEAD `68888733deffa9700aa69761fd965a504b9152db`. Referência local origin/main seis commits à frente. A consulta atual ao GitHub falhou. Os dois arquivos de motor/sessão também diferem nessa referência remota, que não foi integrada. Linhas diferentes não comprovam uma integração semanticamente segura, será preciso revalidar depois de juntar os lados.
- Build reconferida com `index-nJzpcPu0.js`. Servidores 5320/5321 preservados, contextos novos com fichas sintéticas, sem usar o armazenamento do autor. `src/components/` sem diff.

## Provas executadas pelo Codex

| Prova | Resultado |
|---|---|
| Doze arquivos de asserts focados | 727 passando, incluindo os 166 de Pacotes |
| PA-I3 no navegador dev, 1024/1440 | 43/43 |
| PA-I3 no navegador produção, 1024/1440 | 43/43 |
| PA-I1/PA-I2 no navegador produção, 1024/1440 | 48/48 |
| Compacta, teste adicional próprio em produção, 1024/1440 | 14/14 |
| Importação de prazo herdado, teste adicional próprio em produção | 4/8, quatro reprovações do mesmo defeito PA-I4 |
| Lint Afty/App e build | Passaram, com notas de tamanho já conhecidas |

Os roteiros de PA-I3 e regressão são cópias dos da entrega, executadas novamente pelo revisor em pasta própria. Compacta e prazo herdado têm roteiro próprio, `compacta-heranca.mjs`. Cliques reais sem force, exportação/importação de arquivo, encerramento também pelo teclado na compacta. Downloads e dados intermediários ficam fora do projeto durante a navegação dev, evitando recarga do Tailwind.

São 156 conferências de interface no total, 152 passando. As quatro reprovações são PA-I4 repetido em duas larguras e duas apresentações, não quatro bugs. As 148 conferências dos fluxos principais e da compacta passaram.

Também reexecutei a prova própria anterior `prazos-mistos.mjs`: Reflexos volta de +9 para +7 na primeira virada, Defesa permanece 20 até a terceira, com o benefício por ataque ainda ligado. A prova de função de herança está em `prazos-herdados.mjs` e reproduz PA-I4.

A suíte inteira 223/225, os 65/65 anteriores e os 47/47 de Fonte Externa manual são provas da entrega e não foram novamente executados pelo Codex nesta rodada. Não somá-los como repetição independente. As duas falhas prévias da suíte continuam distintas.

## PA-I3 reconferido

- Arquivo exportado pelo suporte e importado pelo aliado conserva Defesa por ataque e TR de uma rodada. Resumo e detalhe dizem os prazos próprios.
- Virada primeiro: TR sai, Reflexos retorna à base, Defesa fica por mais viradas e recarga. Números e linha da clássica conferem.
- Ataque primeiro, representado por Encerrar Parte: só Defesa sai, TR fica com uma rodada e expira na virada seguinte. Encerrar o Feitiço inteiro e Reativar devolvem as partes com prazos novos.
- Linha do Tempo mostra a parte de rodadas. A parte de um ataque permanece de encerramento manual honesto.
- Compacta: Encerrar Parte funciona por mouse e Enter, prazo restante sobrevive à recarga, Encerrar inteiro e Reativar funcionam, e a outra ordem de término também. Não é mais uma lacuna de teste desta entrega.
- Arquivos/instâncias anteriores sem duração por benefício continuam como antes, conforme os asserts reexecutados. Para os prazos novos, reexportar, importar revisão e encerrar/reativar. A biblioteca não deve reescrever instâncias antigas já ativas.

## PA-I4, P2: contador não nasce para o benefício que herda rodadas

Local: `src/systems/afty/ficha/pacotes-aliados.js`, `instanciaDaOpcao`, linhas 515 a 526 na versão revisada, especialmente 524 a 526.

O contrato do campo é explícito: duração no benefício é opcional, e sem ela vale a da opção (`prazoDoBeneficio`). O importador aceita essa representação. Entretanto, quando qualquer benefício declara prazo próprio, a instância perde o contador geral e só um benefício com `b.duracao` explícita ganha contador. O que herda a duração geral não ganha contador nenhum.

Arquivo de prova válido, com os mesmos números e prazos do caso anterior, representados pelo prazo comum e uma exceção:

```json
{
  "duracao": { "tipo": "rodadas", "rodadas": 1 },
  "beneficios": [
    { "canal": "defesa", "valor": 3, "duracao": { "tipo": "proximo", "texto": "Por Um Ataque" } },
    { "canal": "bonusTR", "alvo": "reflexos", "valor": 2 }
  ]
}
```

O fragmento está num arquivo completo válido (`herdado.json`). Foi construído a partir do resultado dos resolvedores/exportador reais, colocando a duração comum na opção e retirando somente a duração redundante do TR. O exportador atual escreve os dois prazos explicitamente e por isso seu fluxo passa. Não afirmar que ele produz o arquivo dessa forma: é uma representação equivalente aceita pela importação e pelo contrato opcional do campo.

Reprodução independente:

1. Importador aceita sem recusa ou aviso, ativa com Defesa 20 e Reflexos +9, bases 17/+7.
2. Instância com `rodadas: null`. Defesa tem duração própria, TR não tem duração nem contador próprios.
3. Compacta mostra TR com 1 Rodada e diz que a ficha conta e encerra sozinha.
4. Avançar a rodada mantém Reflexos +9. Clássica também mostra +9. A prova de função mantém o erro por três viradas.

Evidências: `prazos-herdados.json`, `compacta-heranca-5321.json`, `herdado.json`, capturas `5321-herdado-compacta-apos-virada-*`, em 1024 e 1440. Não é mudança de regra, trata-se do prazo já decidido e da herança que o formato oferece.

Correção esperada: ao criar uma instância nova com prazos por benefício, resolver o prazo efetivo de cada benefício, inclusive o herdado, e inicializar o contador correspondente. Manter intactos arquivos antigos sem campo próprio e instâncias já ativas. Conferir prazo explícito e herdado nas duas ordens de término, recarga e apresentações. Pode materializar o prazo efetivo na instância ou usar outra representação consistente, sem apenas ajustar rótulos.

## Desempenho

Reexecutado em produção, Chrome, Player 30 denso, duas repetições, mesma build, sem outra bateria em paralelo e sem pausa artificial entre abrir Preparação e Confirmar. Medida do ponteiro à atualização observada e mais dois quadros.

- Com oito recebidos: Confirmar Ataque Concentrado 36/33 ms, ativar nona opção 48/30 ms. Duas ativações em sequência por repetição, quatro de quatro preservadas.
- Sem pacote: Confirmar 31/55 ms.
- Abrir Buffs na clássica: 32/32 ms sem pacote, 32/35 ms com oito.
- Nenhuma tarefa longa observada nesta amostra. Doze registros, quatorze operações, nenhum erro de página. `perf-5321.json`. Antes histórico não reexecutado. Não generalizar para todas as fichas nem substituir o teste real do autor.

## Limites e próximo passo

Uma primeira tentativa do script próprio de herança importou sessão antes do derive, contrariando a ordem conhecida dos módulos, e falhou no carregamento. O roteiro foi corrigido sem alterar produto e então produziu a reprodução acima. Não é defeito adicional do aplicativo.

Corrigir apenas PA-I4, preservando PA-I3 e os consertos anteriores. Não refazer Pacotes, redesenhar, promover G2, juntar remoto, fazer commit/push/deploy ou pedir novamente decisão de prazos. Sete perguntas anteriores continuam abertas, a antiga pergunta 8 já está resolvida. Codex reconfere a criação da instância e a importação herdada no retorno. O autor pode testar os arquivos produzidos normalmente pelo suporte enquanto esse caso é ajustado.
