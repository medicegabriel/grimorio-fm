# Livro de Regras: decomposição funcional Player/Afty

## Complemento da análise

O recorte original de 27 unidades está preservado abaixo. A análise ampliada de 2026-10-29 fica em
[Análise aprofundada de fechamento](10-analise-aprofundada-2026-10-29.md), com cenários executados,
conferência de 412 células de tabelas e a [matriz dos 52 Talentos](11-matriz-talentos-2026-10-29.md).
As contagens históricas deste README e de `progresso.md` não são um percentual de conclusão do site.

A [fila de execução dividida entre Codex e Claude](../a-fazer.md#divisão-de-execução-codex-e-claude-2026-10-29)
fica em `a-fazer.md`: nove lotes grandes, seis do Codex e três do Claude, com dependências, critérios de entrega
e ordem de trabalho. Essa consolidação substitui os 31 lotes anteriores, preservando o escopo. Os relatórios
desta pasta permanecem como referência, sem uma segunda fila de status.

Os [nove prompts completos para chats novos](prompts/README.md) correspondem a essa fila. Cada um exige
conferir o livro, as decisões e o percurso real antes de programar, reclassificar achados refutados e executar
somente o escopo confirmado. Sua criação não inicia os lotes.

## Objetivo e versão da fonte

Primeira decomposição funcional, em 2026-10-29. O objeto é o sistema da Ficha de Player e seus percursos compartilhados com Afty, não somente uma tela. Não altera regras, código, dados oficiais, fonte externa ou estados da campanha de automação.

- `fonteLivroRegras.caminho`: `/mnt/projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
- Caminho Windows do mesmo arquivo: `C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md`.
- `fonteLivroRegras.sha256`: `1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.
- Hash exigido confirmado antes e depois da escrita. Fonte lida diretamente, sem criar cópia ou editá-la.
- Cada página citada é a impressa, pelo último marcador `<!-- página N -->` acima do trecho. Nenhum PDF foi usado.
- Proveniência indicada pelas instruções: `../_backup-livro/correcoes.md`. Não é fonte alternativa de regras desta entrega.

## Como interpretar os estados

| Estado | Significado nesta decomposição | Não significa |
|---|---|---|
| implementado | Há código executável lido que cobre o recorte explicitamente delimitado, com consumidor quando pertinente | Teste passou, interface validada ou regra aprovada |
| parcial | Há percurso implementado, mas o conjunto da unidade tem limite conhecido ou conferência incompleta, descrita na unidade | Tudo que falta ler está ausente do produto |
| pendente | Unidade reservada para leitura e verificação granular ainda não feita | Funcionalidade não implementada |

O estado de implementação conhecido e a cobertura da leitura não são sinônimos. Por isso cada unidade explicita evidência e limite. O estado pendente deste primeiro inventário é sempre **pendente de verificação**, não uma estimativa de código faltante. Nenhum item recebe APROVADO. Nenhum resultado de teste foi produzido ou reutilizado como prova desta leitura.

Afirmações de regras aparecem como citações curtas da fonte. Os demais textos descrevem implementação e escopo, não reescrevem a regra. Decisões próprias do autor são identificadas e não apresentadas como texto do livro.

## Índice por parte

| Parte | Implementado | Parcial | Pendente de verificação |
|---|---|---|---|
| [Atributos e valores adicionais](01-atributos-valores.md) | 2 | 1 | 0 |
| [Progressão e especializações](02-progressao-especializacoes.md) | 2 | 1 | 0 |
| [Origens e talentos](03-origens-talentos.md) | 1 | 1 | 1 |
| [Testes, perícias e níveis de aptidão](04-testes-pericias-aptidoes.md) | 1 | 2 | 0 |
| [Inventário e equipamentos](05-equipamentos.md) | 1 | 1 | 1 |
| [Técnica e Feitiços](06-tecnica-feiticos.md) | 2 | 1 | 0 |
| [Combate e invocações](07-combate-invocacoes.md) | 0 | 2 | 1 |
| [Descansos, Interlúdios e Votos](08-interludios-votos.md) | 0 | 3 | 0 |
| [Cálculos, acúmulo e recursos temporários](09-regras-transversais.md) | 1 | 2 | 0 |
| **Total** | **10** | **14** | **3** |

- [Progresso agregado e denominador](progresso.md).
- [Rastreabilidade, arquitetura e preservação](rastreabilidade.md).

## Limites da primeira leitura

Leitura direta prioritária: atributos e valores adicionais (17 a 21), características e progressão de classes (43 a 48), Inato (27), Derivado (32), inventário e equipamento inicial (129 e 130), abertura dos talentos (163 e 164), abertura de Aptidões (172 e 173), Funcionamento Básico e orçamento (197 a 199), Passivas (235), obtenção/controle de invocações (256 e 257), fórmulas de testes (278 a 283), iniciativa (291), dano/crítico/resistências (306 a 309), descansos e abertura de Interlúdios (335 e 336), abertura de Votos (350 e 351) e apêndice (365 e 366).

Isso é leitura seletiva, não revisão integral de todas essas páginas ou capítulos. Foram cotejados os recortes citados nas 27 unidades. Não foram revisados item a item os catálogos de classes, origens, talentos, Aptidões, equipamentos, Feitiços, invocações, treinos, Votos ou conteúdos de addons. Capítulo 1 e ambientação do capítulo 13 não foram decompostos como requisitos mecânicos. Temas, importação, exportação e armazenamento do produto não recebem percentual do livro.

Os catálogos extensos foram reservados em LR09, LR15 e LR21 ou nas fronteiras das unidades parciais. As faixas de páginas são localizadores, nunca aprovação por família. Ainda será necessário subdividir unidades amplas para uma campanha integral. O denominador desta versão não representa a totalidade das regras.

## Decisões e fila única

Perguntas de regra permanecem exclusivamente em [a-fazer.md](../a-fazer.md). As referências nesta árvore apenas apontam entradas existentes, sem criar uma fila alternativa. Não foram inventadas integrações nem novas decisões. CD separada adiada, distribuição livre do Derivado, alocador +1/+1/+1 e descanso único conservam as decisões registradas. Nenhuma pergunta nova foi acrescentada.

Esta árvore é uma decomposição inicial, não um lote formal da campanha descrita em [revisao-automacao/LEIA.md](../revisao-automacao/LEIA.md). Não foram criados registro.json, alterações de inventário ou aprovações paralelas. Uma futura auditoria formal deve usar o schema, versões, percurso completo e provas de cada parcela exigidos por aquele protocolo.
