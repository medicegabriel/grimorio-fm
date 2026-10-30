# Progresso da reformulação da Ficha Final

Atualizado em 19/10/2026. A integração está preservada como prévia
em `/Afty?ficha-g2=1` e `/Player?ficha-g2=1`. A ficha anterior voltou a ser
o padrão diário por pedido do autor, até concluir as etapas restantes.

Reconferência independente de 19/10: G2-I1 encerrado. Fonte Externa conta
nas duas apresentações, e Encontro/delta passaram nas funções. A correção
passou em 36 conferências próprias de interface e 303 asserts focados.
Mais 26 operações com Fonte Externa foram medidas em dev/produção, sem
pausa de dois segundos, mas com tarefas residuais de até 94/72 ms. O teste
real do autor continua necessário. A revisão está em
grimorio-tracker/.audit/revisao-codex-g2-i1-20261019/REVISAO-CODEX.md.

`█████████░` **9 de 10 marcos concluídos (90%).**

Esta barra conta entregas verificáveis da reformulação aprovada, com foco em cabeçalho, Habilidades e Efeitos. Não estima horas restantes nem mede a automação de todo o catálogo de regras. A integração concentra trabalho e incerteza importantes, mesmo sendo um marco só.

| Marco | Entrega | Situação e evidência |
|---|---|---|
| 1 | Direção visual e composição | Concluído. G2, Mosaico e Linha do Tempo escolhidos pelo autor. |
| 2 | Catálogo, Habilidades e consulta | Concluído no protótipo. Busca/categorias/lista/detalhe, linhas uniformes e formatação. |
| 3 | Ativos completa e compacta | Concluído no protótipo. Cartões enxutos, contexto preservado, Encerrados e Reativar. |
| 4 | Preparação, custos, usos e PV do escopo viável | Concluído no protótipo. Famílias implementadas e correções de Cobrir-se/Espírito/Golpe revisadas. |
| 5 | Linha do Tempo funcional e marcadores | Concluído no protótipo. Projeção comparada à virada real nos casos exercitados. |
| 6 | Fechamento e revisão do protótipo | Concluído. Responsividade/Confirmar, Histórico, estorno e estatísticas. Revisão independente: 15 contextos e 66 conferências finais passando. |
| 7 | Integração na aplicação principal | Concluída como entrega técnica em prévia, conforme decisão de 17/10. Não liberada como padrão diário. |
| 8 | Compatibilidade e verificações no destino | Concluído na base local. G2-I1 corrigido e reconferido em G2/clássica, Encontro e delta. |
| 9 | Revisão independente da integração | Concluída por amostra em 19/10 após a correção. Relatório próprio registra testes, desempenho residual e limites. |
| 10 | Teste real final e fechamento do autor | Pendente. Uso representativo, correções materiais e entrega para o commit humano. |

## Lote próprio: Pacotes para Aliados (fora da barra de dez marcos)

Pedido do autor de 19/10, depois da revisão técnica. Não entra na barra acima e não
reabre os marcos 1 a 9. Situação em 20/10/2026:

| Etapa | Situação |
|---|---|
| Implementação no destino real (prévia do G2) | Entregue pelo Claude. Para Aliados no suporte, Recebidos e Importar Pacote na Fonte Externa do aliado, biblioteca no personagem, instância na sessão. |
| Provas do desenvolvedor | `t-pacotes-aliados` (116), suíte 223 de 225 com as duas falhas antigas, percurso completo 65 de 65 em dev e em produção, Fonte Externa manual 47 de 47, desempenho sem tarefa longa observada, tudo no código final (bundle `index-DFPSjt0c.js`). Relatório em `grimorio-tracker/.audit/pacotes-aliados-20261019/RELATORIO.md`. |
| Revisão independente do Codex | PA-I1/PA-I2 e fluxo PA-I3 do exportador atual reconferidos. Revisão atual: 727 asserts, 43/43 dev e 43/43 produção, 48/48 da regressão em produção, 14/14 da compacta, lint/build. |
| Correção da devolutiva | Resta PA-I4: prazo geral em rodadas não herdado por um benefício quando outro tem prazo próprio. Reproduzido por função/interface, G2/clássica, 1024/1440. Não é nova decisão de regra. |
| PA-I3, cada benefício no próprio prazo | Corrigido e reconferido em 20/10 no fluxo produzido pelo exportador. Completa e compacta, duas ordens, recarga e reativação passaram. Relatório atual: `grimorio-tracker/.audit/revisao-codex-pai3-20261020/REVISAO-CODEX.md`. Pergunta 8 resolvida. |
| Teste real do autor (duas fichas, arquivo exportado e importado) | Pendente. |

## O que o próximo lote deve avançar

O próximo trabalho é o teste real do autor na aplicação integrada. Usar a
prévia em http://127.0.0.1:5321/Afty?ficha-g2=1 ou /Player?ficha-g2=1,
com Fonte Externa e ficha densa, confirmando fluidez, custos e persistência.
A clássica permanece padrão até esse aceite. As referências locais indicam
seis commits remotos à frente, ainda sem integração. Revalidar o lote após
resolver essa divergência antes de publicar. Não repetir a integração inteira.

Pequenos retoques visuais podem ficar para o uso posterior. Erro de dados, custo, regra ou interação precisa ser corrigido antes do fechamento correspondente.

## Fora desta contagem

Arsenal/Ciclagem, quantidades de Canalizar, PER e montador das Artes continuam como dependências próprias. As perguntas de Terra, trocas da Postura e políticas de manutenção permanecem registradas. Fechar a reformulação não declara essas automações concluídas. Um redesign completo de celular e de Encontro também não está implicitamente incluído.

Não há commit, publicação ou prazo de término presumido nesta barra.

## Escopo adicional: Pacotes para Aliados

PA-I1/PA-I2 e fluxo PA-I3 do exportador atual reconferidos em 20/10. Resta
PA-I4 na importação de prazo herdado. Falta corrigir e reconferir esse caso,
sem refazer o lote nem pedir nova regra. Próximo pedido em
DEVOLUTIVA-CLAUDE-PACOTES-ALIADOS.md. Este lote tem revisão e aceite próprios,
não altera os nove marcos concluídos acima.
