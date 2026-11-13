# G00: inventário, fontes, cobertura e protocolo

Data: 2026-10-05. Executor: Codex nesta entrega. Estado: **IMPLEMENTADO, AGUARDA AUDITORIA**. Auditoria independente: **NÃO EXECUTADA**.

O G00 entrega o controle da campanha e sete parcelas administrativas. Não revisa nem aprova o comportamento de todas as habilidades. As 11.591 chaves fora de G00 e os outros 257 lotes permanecem **NÃO REVISADO**. As sete chaves G00 também aguardam aprovação independente.

## Base e preservação

- Checkout: `main`, commit `a0cefc29f32f6bd05e1617fc98014dbda2980483`.
- A entrada já continha 46 arquivos rastreados modificados e arquivos novos do autor/outros trabalhos. [entrada.json](evidencias/entrada.json) preserva status, diff e 706 hashes iniciais.
- [preservacao.json](evidencias/preservacao.json): 700 arquivos byte a byte idênticos à entrada, seis mudanças previstas e nenhum arquivo da entrada ausente. Esses seis são `package.json`, `CLAUDE.md`, `asserts/LEIA.md`, `docs/a-fazer.md`, `docs/afty-player.md` e `docs/afty-motor-referencia-estrutural.md`.
- Não houve commit, push, deploy, sincronização da base, novo checkout, reset ou stash. Código do aplicativo, dados oficiais e addons foram preservados.
- [arquivos-examinados.json](arquivos-examinados.json) distingue consulta de fonte, leitura pertinente, introspecção automática e execução de teste. Um hash ou um import não é uma auditoria de regra.
- Os hashes finais estão em [registro.json](registro.json) e [entrega-sha256.json](entrega-sha256.json). O manifesto externo inclui o registro, este relatório e as provas finais; exclui apenas o próprio manifesto para evitar autorreferência.

## Inventário explícito e reconciliação

| Medida | Pacote inicial | Entrega |
|---|---:|---:|
| Lotes | 258 | 258 |
| Chaves comparáveis, união dos mapas iniciais | 1.659 | 11.598 |
| Catálogos/tabelas exportados | 100 | 400 |
| Arquivos de addons | 51 | 51 |
| Integrações de habilidades herdadas | 118 | 118 |
| IDs iniciais ausentes | N/A | 0 |

Foram explicitados **9.939 componentes** ausentes da granularidade inicial: contêineres, tabelas, pools, requisitos, escolhas, geradores, referências, dados de addon e controles administrativos. Eles não representam 9.939 habilidades novas criadas no aplicativo. Todos receberam proprietário único.

A coleta entra pelo derive e descobre dados exportados dos 75 módulos `afty-*.js` da raiz. Inclui objetos, arrays, Sets, Maps, aliases e tabelas vazias. Expande parcelas declaradas e arrays aninhados; conserva posição em identidades sem ID e em valores repetidos. Aplica os 51 pacotes JSON separadamente no registro real, em processo local isolado, sem tocar armazenamento pessoal.

Os 127 itens de `HABILIDADES_ROUBAVEIS` apontam para as habilidades originais. Reexports/subconjuntos e referências a pools compartilhados conservam a identidade canônica. Cada uma das 118 habilidades herdadas conserva o dono da regra original e um dono da integração. Não há duplicação de aprovação da regra de origem.

Não houve remoção de ID. Uma mudança nominal de pontuação foi localizada em `PASSIVO_EFEITOS::regeneracao`, com a chave preservada. [reconciliacao.json](../reconciliacao.json) guarda antes/depois. Nomes capturados do código são dados de fonte; os JSONs usam escapes Unicode quando necessário, preservando o valor sem introduzir o caractere proibido no arquivo novo.

O snapshot inicial não possui hashes completos das regras. Comparar IDs e nomes não prova igualdade de comportamento entre a data do pacote e hoje.

Os 18 domínios de [dominios-dinamicos.json](../dominios-dinamicos.json) cobrem declarações de alvo/parâmetro e cinco provedores contextuais: Verdadeiras Origens, alvos de treinamento, alvos do motor, perícias próprias da ficha e Manejo Especial. Universos abertos dependem da ficha, das liberações e dos addons. Não é possível enumerar todos os nomes ou números que um jogador poderá criar; o registro aponta provedor, consumidor e cenários obrigatórios do lote proprietário. Essas provas de interface e contexto permanecem **NÃO VERIFICADA**.

## Fontes e decisões vigentes

[fontes.json](../fontes.json) mapeia todos os 258 lotes, com caminhos, versões, páginas e hashes das fontes localizadas. Página impressa e página do PDF são campos separados; a coincidência nos trechos localizados não é pressuposta para páginas sem numeração.

| Fonte disponível | Identificação interna | Consulta G00 |
|---|---|---|
| `public/docs/F&M 2.5.2 - Livro de Regras.pdf`, 368 páginas | Folha de rosto PDF 2: VERSÃO 2.5 | Sumário, texto/contexto e localização das famílias |
| `public/docs/F&M 2.5.2 - Grimório das Maldições.pdf`, 80 páginas | Folha de rosto PDF 2: VERSÃO 1, F&M 2.5 | Sumário, créditos e localização de origens/aptidões |
| `docs/afty-formula-entropica.md` | Transcrição própria e decisões datadas | Distinguir fonte independente do JSON e respeitar fases adiadas |
| `docs/afty-criacao-equipamentos-fonte.md` e guia de decisões | Transcrição própria e decisões separadas | Distinguir versão/decisão da implementação auditada |

O rótulo 2.5.2 dos arquivos foi conservado e a divergência da folha de rosto registrada. Não se presumiu uma revisão textual que os PDFs não declaram.

Guias de implementação e textos dos addons não foram tratados como fonte independente de suas próprias regras. O mapeamento é uma indicação de onde revisar; cada executor futuro deve consultar o trecho original e seu contexto antes de confirmar uma parcela.

O autor respondeu **“Essas partes você pode ignorar por enquanto.”** à localização de F&M 2.0, Livro do Narrador e PDFs próprios de homebrews, incluindo The Crimsom Queen e Yna. A autorização foi incorporada: 76 lotes têm alguma fonte externa marcada como adiada. A falta dessas fontes não bloqueia a entrega administrativa do G00 e não aprova as regras dependentes.

Decisões preservadas: sistema definido por `creature.rulesVersion`; arredondamento para baixo salvo fonte expressa; separação de CD adiada; decisões e fases já respondidas da Fórmula Entrópica; procedimentos adiados e perguntas de regra preexistentes. Nenhuma pergunta antiga foi reapresentada nem houve decisão nova de balanceamento.

## Sete parcelas administrativas

Cada linha corresponde a um item `controle::G00::ID` e a uma parcela completa em [registro.json](registro.json).

| ID | Parcela e resultado | Execução | Evidência |
|---|---|---|---|
| inventario | Catálogo vivo, opções, aliases, heranças e donos materializados | COMPLETA | NÃO VERIFICADA |
| fontes | Procedência, versões, páginas, decisões e fontes adiadas mapeadas | COMPLETA | NÃO VERIFICADA |
| cobertura | Lacunas e inconsistências detectadas sem aprovação automática | COMPLETA | NÃO VERIFICADA |
| linha-base | Suíte, build, lint e testes fora do lançador confrontados | COMPLETA | NÃO VERIFICADA |
| registro | Schema recebido, estados e critérios por parcela preservados | COMPLETA | NÃO VERIFICADA |
| pendencias | Fila única e decisões vigentes, trabalho alheio preservado | COMPLETA | NÃO VERIFICADA |
| passagem | Arquivos, hashes, intervalo e protocolo de auditoria por leitura | COMPLETA | NÃO VERIFICADA |

A regra administrativa está CONFIRMADA pelo pedido do autor. Nenhuma evidência foi marcada APROVADA pelo próprio executor. Para essas sete parcelas, aquisição, rolagem, limiares, acúmulo, recursos e duração de jogo são N/A, com justificativa no registro.

O schema não tem N/A nos enums de motor/autoria. Foram conservados **PARCIAL** e **INACESSÍVEL**, acompanhados de `naoAplicavel` explícito. Isso não descreve uma habilidade parcialmente automatizada nem uma capacidade de jogador inacessível. O verificador só aceita essa exceção para os sete controles administrativos reais de G00.

## Percurso e mecanismos entregues

O percurso administrativo é manifesto/mapa inicial e `escopo.json` -> `coletarInventario` -> dados e hashes em `inventario.json` -> `conferirCampanha/verificarCobertura` -> comandos locais e relatórios -> executor/auditor.

`validarRegistro` verifica as palavras-chave usadas pelo schema recebido (campos, tipos, enums, mínimos, data, propriedades e arrays). Não é um validador geral de JSON Schema. Os testes incluem aprovação sem auditor independente, outra versão de hashes, item sem parcela, fonte/estado insuficiente, falha de prova, declaração duplicada, órfão, retorno de item removido e domínio sem protocolo.

Comandos entregues:

```text
npm run revisao:inventario
npm run revisao:cobertura
npm run revisao:revisoes
node asserts/t-revisao-g00.mjs
```

Os três comandos são somente leitura. `revisao:cobertura` retorna 0 quando a estrutura está coerente e 1 quando há inconsistência ou conteúdo alterado. Continua imprimindo revisão ausente. `revisao:revisoes` retorna 2 enquanto houver conteúdo sem aprovação ou lote sem registro.

Não foi necessário ampliar canal, DSL, aquisição, sessão, editor ou persistência de jogo neste lote. G00 amplia os instrumentos da campanha. A reprodução acessível ao jogador será exigida nos lotes de conteúdo e mecanismo correspondentes; nenhum controle novo de habilidade foi apresentado ao jogador aqui.

Antes/depois dos guias: o vermelho antigo de invocações foi substituído pela linha de base observada; a regra de sistema pela ficha foi corrigida no guia estrutural; contagem de divergências foi atualizada para 38 entradas, 37 ativas; fonte antiga em Downloads substituída pelo PDF disponível; comando da suíte alinhado ao lançador Windows; sincronização condicionada a checkout livre. A orientação histórica de extrapolar números não foi usada para inventar regra e agora aponta para decisão do autor nesta campanha.

## Validação real

Os metadados de cada comando em `evidencias/*.json` registram início/fim UTC e código de saída. A entrada foi capturada em **2026-10-05T19:05:21.551Z**. A suíte final rodou de **19:34:22.786Z a 19:35:27.266Z** no mesmo dia. O intervalo completo das verificações finais, incluindo os comandos de cobertura, está em `registro.json -> validacao.intervalo`.

| Verificação | Entrada | Entrega |
|---|---|---|
| Suíte completa | 153 arquivos, 9.038 asserts, PASSOU | 154 arquivos, 9.073 asserts, PASSOU |
| Prova G00 | Inexistente | 35 asserts, PASSOU |
| Ordem de módulos | Incluída na suíte | 34 asserts, PASSOU também isoladamente |
| Build | PASSOU | PASSOU |
| Lint Afty | PASSOU | PASSOU |
| Lint scripts novos | N/A | PASSOU com configuração .mjs entregue |
| Lint geral | 748 problemas, 736 erros/12 avisos, FALHOU | Mesmos 748 problemas, FALHOU |
| Cobertura | Campanha ainda sem controle | PASSOU, saída 0 |
| Exigir revisão | N/A | Saída 2 esperada, sem fingir aprovação |

O build mantém o aviso de chunk acima de 500 kB. O lint geral inclui caches anteriores em `.audit/`, componentes legados e configuração. A área Afty e os scripts G00 não introduziram erros de lint. A comparação não atribui a G00 os problemas que já existiam.

Os dois testes em `src/systems/afty/asserts/` passaram diretamente na entrada, com código 0 e sem a linha padronizada do lançador. Estão mapeados em [testes-mapeados.json](testes-mapeados.json), seus logs foram preservados e seus arquivos permanecem iguais. Não foram alterados Filtro nem Imitação.

Navegador: **NÃO EXECUTADO**. G00 não alterou UI, sessão ou autoria do aplicativo. Criador, Ficha Final e Encontros em desktop/móvel, ambos rulesVersion, bem como configuração própria por interface/addon, continuam exigidos nos lotes que mexerem nessas capacidades. A suíte não substitui essas provas.

## Pendências e manutenção

A única entrada ativa nova está em `docs/a-fazer.md`, chave **G00-auditoria-independente**. O registro guarda esse vínculo. Fontes externas adiadas e perguntas antigas conservam as orientações do autor; não existe fila concorrente neste relatório.

Mudança em conteúdo, ID, proprietário, referência, gerador, domínio, fonte, decisão, schema ou arquivo examinado exige reconciliação e revalidação das parcelas atingidas. Não regenerar o controle zerando estados. Novo item recebe dono explícito; remoção leva justificativa; renomeação mantém chave anterior e rastreabilidade.

## Passagem para o auditor

O executor concluiu as edições deste G00. Uma pessoa ou chat edita por vez nesta árvore. O auditor independente trabalha por leitura e entrega achados em chat, sem editar arquivos ou criar coordenação externa.

1. Conferir commit, entrada preexistente, `preservacao.json` e os hashes em `entrega-sha256.json`.
2. Conferir as quatro cópias originais e o schema byte a byte.
3. Executar cobertura e os 35 asserts do verificador; saída 2 de exigir revisão é esperada.
4. Examinar propriedade dos 9.939 componentes explicitados, aliases, 127 referências de Roubo, 118 integrações herdadas e domínios abertos.
5. Conferir o SHA-256 do Markdown e as páginas pelos marcadores; usar o PDF do Livro somente para desempate e conservar o Grimório das Maldições em PDF, independência das transcrições, decisões vigentes e autorização de fontes adiadas.
6. Confirmar os estados das sete parcelas, a ausência de aprovação dos demais lotes e a exceção N/A estritamente administrativa.
7. Confrontar os resultados finais e a falha global de lint com a entrada. Julgar comportamento das ferramentas, sem usar a suíte como aprovação de regras.
8. Se algum hash mudar, identificar a versão divergente e pedir nova entrega estável. Aprovação antiga não vale para bytes novos.

Arquivos de aplicativo e addons não foram alterados. Os arquivos G00, configuração dos comandos e seis atualizações pontuais estão listados na entrega. Os achados devem indicar parcela, arquivo/hash, cenário observado e consequência. Somente após auditoria independente registrada o lote pode chegar a APROVADO.



## Atualização da fonte em 2026-10-05

O protocolo vigente foi atualizado por solicitação do autor. As consultas ao PDF descritas acima são históricas e não foram reclassificadas como leitura do Markdown. Esta atualização não aprova regras nem executa a auditoria independente. Leia atualizacao-fonte-2026-10-05.json e o protocolo em ../LEIA.md; os hashes da entrega anterior foram preservados antes das alterações.
