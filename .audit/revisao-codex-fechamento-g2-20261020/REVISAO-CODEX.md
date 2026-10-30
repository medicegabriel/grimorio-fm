# Revisão independente: fechamento funcional do G2

Data: 20/10/2026. Revisor: Codex. Implementação: Claude.

## Resultado

Revisão técnica aprovada na base local examinada. Nenhum defeito novo que
bloqueie o teste real foi identificado. As cinco rotinas funcionam pelo G2
sem usar a Apresentação Anterior. Clássica permanece padrão, G2 prévia e
marco 10 depende do teste e aceite do autor. Barra preservada em 9/10.

Codex não alterou produto, testes de produto, motor ou DSL. Acrescentou
roteiros/evidências de revisão e atualizou documentação. Sem commit, push,
merge, deploy ou mensagem a outro chat. Servidores 5320 e 5321 preservados.

## Base e proveniência

- HEAD `68888733deffa9700aa69761fd965a504b9152db`.
- Referência local `origin/main`: `bcaf978695c3d239b84f0a12ed11479adc428016`,
  seis commits à frente. A consulta atual ao GitHub falhou por conexão,
  portanto esta revisão não apresenta a referência como confirmação de rede.
- Fonte do livro: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`, SHA-256
  `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a` conferido.
- Os 552 arquivos do manifesto final de fontes/asserts conferem antes e
  depois da revisão. Nenhuma divergência ou arquivo removido.
- Os 93 backups comparados conferem com o manifesto anterior da entrega.
  Os nove backups de fontes que também constavam na revisão própria PA-I4
  conferem com os hashes daquela revisão. O LEIA de asserts mudou conforme
  documentado, sem ser tratado como fonte nova por causa da omissão no
  manifesto antigo.
- Diferença de produto da entrega: 13 fontes existentes alteradas e oito
  novas, concentradas em `ficha/efeitos/`. `AftyFichaG2.jsx` mudou comentários.
  Binários presentes só no manifesto posterior não foram contados como
  alterações deste lote. Nenhum diff em `src/components/`.
- Nenhum U+2014 ou marcador de conflito nos trechos novos das 21 fontes.

## Código e operações conferidas

| Rotina | Conferência |
|---|---|
| Imitação | Selecionar/cancelar não copia. Confirmação explícita, comum/Perfeita, elegibilidade, escolhas, aprender, reutilizar, esquecer e recarga pelos verbos existentes. |
| Concedido pelo Mestre | Disponibilidade, famílias, concessões existentes e órfãs, duplicata não repetível, duas pegas repetíveis e remoção por uid, persistência e igualdade com a clássica. |
| Exaustão | Abrir em zero não grava, passos/zerar, piso zero, recarga e acessos na completa/compacta. Não cria penalidade nem se confunde com Exaustão de Técnica. |
| Sangramento | Faixas resolvidas, ação explícita, rolagem/evento/perda única, Vida baixa, PV Temporário preservado, cadastro manual e compacta. Virada não rola sozinha. |
| Buff de mesa | Valor/expressão, mais inicial, recusa/correção, criatura/invocação específica/todas, duração, expiração, recarga e encerramento por id preservando registros recebidos. |

Examinados adaptador, quatro módulos de lógica, quatro componentes novos,
integração no catálogo, detalhe e compacta, cadastro da faixa, Histórico e
CSS. Os caminhos da clássica e os verbos do motor foram preservados.

## Verificações repetidas pelo Codex

| Verificação | Resultado |
|---|---|
| Quinze arquivos focados | 986 asserts aprovados, inclusive 124 do fechamento e 189 de Pacotes. |
| Suíte completa | 224/226 arquivos aprovados. Apenas `t-prodigio.mjs` e `t-reconciliacao-g00.mjs`, os mesmos nomes da linha de base anterior ao lote. |
| Lint Afty e App | Aprovado. Só a nota do Babel sobre o tamanho do criador. |
| Build | Aprovada, bundle `index-DBupHr57.js`, igual ao identificado na entrega. Avisos de tamanho de chunks permanecem. |
| Rotinas, layout, tema e navegação em produção | 387 verificações executadas, sem falha ou erro de página. |
| Exaustão/Sangramento e compacta em desenvolvimento | 69/69, sem erro de página. |
| Complemento próprio do Golpe denso | 21/21 em 390, 1024 e 1440. Sete propriedades, ponteiro no botão, clique/Enter, um pagamento, um golpe e consulta sem reaplicar. |
| Roteiro próprio de Pacotes | 22/22 em produção, 1024/1440. Prazos explícitos/herdados, duas ordens, compacta, Encerrar Parte, recarga e Reativar. |

São 499 verificações executadas em 12 relatórios de navegador. Quatro do
roteiro de layout são tautológicas (`... === false || true`, uma por largura)
e foram descartadas como prova: **495 verificações efetivas aprovadas**.
O acesso à Exaustão tem outra conferência real em cada largura e cliques
reais nos demais roteiros. Essa ressalva é de qualidade da prova, não um
defeito de produto reproduzido.

Os roteiros da entrega foram copiados para esta pasta, com saída própria,
sem sobrescrever suas evidências. O complemento do Golpe é novo. Chrome
real, contextos isolados, fichas sintéticas, requisições externas bloqueadas
e cliques sem force. Não foram alteradas fichas do autor.

Na primeira tentativa do roteiro de Pacotes faltavam dois arquivos de
amostra na pasta da revisão. A execução parou antes do percurso de produto.
As amostras foram copiadas e o roteiro inteiro passou 22/22. Não foi tratado
como falha do site. A mutação 13/13 e as outras 279/189 provas de regressão
da entrega não foram repetidas integralmente por este revisor.

## Desempenho na produção

Medições feitas depois de encerrar suíte, lint e demais percursos, duas
repetições, com ficha densa e clique real. Resultado até pintar mais dois
quadros, sem pausa entre abrir a Preparação e confirmar.

| Operação | Medidas |
|---|---|
| Exaustão mais um | 30 e 29 ms |
| Sangramento | 36 e 37 ms |
| Confirmar Cópia | 38 e 41 ms |
| Criar Buff | 37 e 39 ms |
| Conceder | 43 e 30 ms |
| Confirmar Ataque Concentrado sem recebidos | 31 e 31 ms |
| Confirmar Ataque Concentrado com oito recebidos | 30 e 34 ms |
| Ativar nona opção recebida | 28 e 54 ms |
| Duas ativações recebidas em sequência | As duas gravadas em ambas as repetições. |
| Abrir Buffs na clássica, sem/com oito recebidos | 31/36 ms e 31/33 ms |

22 medidas, 24 operações, nenhum erro de página ou tarefa longa observada
na amostra. O antes não foi reexecutado e a variação não prova melhora
causal nem ausência universal de travadas.

## Limites e acabamento

- As cinco rotinas não dependem da Apresentação Anterior. Isso não afirma
  automação de todo o catálogo, nem cobre as sete leituras abertas dos Pacotes.
- Exaustão continua contador. Sangramento antigo sem faixa continua sem
  botão. A interface não inventa faixas ou penalidades ausentes no motor.
- Cabeçalho em 390 px ainda é visualmente alto: 407 px em uma janela de
  844 px, aproximadamente 48%. A captura foi inspecionada. Os controles
  exercitados continuam alcançáveis e sem vazamento. O tamanho restante é
  uma decisão visual do autor, não aceite presumido por este relatório.
- A cópia atual fora da lista de candidatas e a normalização do mais inicial
  foram conferidas como decisões locais descritas, sem regra nova de custo.
- A futura integração dos seis commits exige revalidação, especialmente
  `CanalPicker.jsx`, `ficha-sessao.js`, `afty-derive.js` e os documentos comuns.
  Nenhum merge foi feito ou autorizado por esta revisão.

## Próximo passo

Teste real do autor na prévia, com os cinco passos do relatório da entrega
e uma ficha densa com recebidos. Aceite visual e promoção a padrão diário
continuam com o autor. Não abrir outro lote para refazer estas cinco rotinas.

Evidências principais: `hashes-antes.json`, `hashes-depois.json`,
`backups-conferidos.json`, `proveniencia-anterior.json`, `asserts-focados.json`,
`asserts-completos.txt`, `build.txt`, `resumo-browser.json`, `resumo-final.json`,
os relatórios por roteiro e as capturas desta pasta. A confirmação após
documentação fica em `hashes-pos-documentacao.json`.
