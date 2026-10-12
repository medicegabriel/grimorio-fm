Escrito para: o autor, para encaminhar ao executor do G00 (Codex).

# Auditoria G00: entrega das 16:50

**Veredito do lote: REPROVADO, a ser registrado como AUDITADO COM PENDÊNCIAS.** A base é boa: inventário vivo, propriedade, linha de base e protocolo são sólidos. Mas a ferramenta de cobertura, do jeito que está, não aguenta o próximo lote, e o mapa de fontes atribui páginas erradas a vários itens.

**A entrega mudou durante a auditoria.** Às 17:04 os 382 hashes de `entrega-sha256.json` batiam todos. Às 17:11:53 mudaram sete arquivos:
- `registro.json`
- `revisao.md`
- `pedido.md`
- `LEIA.md`
- `fontes.json`
- `schema-registro.json`
- `cobertura.mjs`

Surgiram também `fontes.mjs` e `fonte-livro-regras.json`. Essa atualização adota o `.md` do livro e está bem feita no essencial, mas veio sem novo pacote de hashes. Os achados abaixo foram conferidos nas duas versões, salvo quando indicado.

## Conferido e aprovado

- **Hashes e preservação:**
  - Os 382 hashes batiam às 17:04.
  - Contra a linha de base que eu tirei às 16:04, antes do executor começar, só mudaram os seis arquivos declarados, mais os arquivos novos.
  - As quatro cópias do pacote são idênticas ao original.
  - Nenhum U+2014 literal foi introduzido.
- **Linha de base reproduzida:**
  - Suíte: 154 arquivos e 9073 asserts, todos verdes.
  - Build: passa.
  - Lint: o geral continua com os mesmos 748 problemas, e o da área Afty e o dos scripts ficam zerados.
  - Os dois testes de `src/systems/afty/asserts/` passam.
  - Os comandos: `revisao:inventario` saiu com 0, e `revisao:cobertura` com 0 na versão entregue.
- **A cobertura detecta o que deve.** Rodei numa cópia descartável:
  - habilidade nova, número mudado com o mesmo id, módulo novo, addon novo e id renomeado foram todos acusados;
  - com tudo restaurado, a saída volta a 0.
- **Inventário:**
  - Os catálogos que antes não tinham dono agora têm: `COMBATE_ESTADOS` com o M03, condições com o SIS-01, `EFEITO_CANAIS` com o M01, `PRIMITIVAS` e `LIBERACOES` com o M05.
  - Os 127 Roubáveis ficaram como referência.
  - Os 118 herdados guardam a regra original.
  - O registro passa num validador de schema independente que eu escrevi.

## Veredito por parcela

| Parcela | Veredito | Motivo |
|---|---|---|
| inventario | REPROVADO | Achados 3 e 4 |
| fontes | REPROVADO | Achado 5. A versão das 17:11 continua com o mesmo problema |
| cobertura | REPROVADO | Achados 1, 2, 6 e 7 |
| linha-base | APROVADO | Números reproduzidos |
| registro | APROVADO na versão entregue, INCONCLUSIVO na das 17:11 | O schema mudou depois da entrega |
| pendencias | APROVADO | Uma entrada só, na fila única |
| passagem | INCONCLUSIVO | Houve edição depois do aviso de entrega estável, sem novos hashes |

## Achados

**1. Alta: os hashes finais do G00 incluem os arquivos que ele só examinou, e isso trava a cobertura em qualquer trabalho normal.**
- `base.hashesFinais` tem 379 arquivos: os 81 módulos do motor, os 51 addons, 156 asserts, `docs/a-fazer.md` e `CLAUDE.md`.
- `cobertura.mjs` acusa "hash final divergente" para qualquer registro, em qualquer estado, e sai com 1.
- **Reprodução, na cópia:**
  - acrescentar uma pendência ao `a-fazer.md` dá saída 1;
  - um comentário num assert dá saída 1;
  - a própria atualização das 17:11 já faz `revisao:revisoes` sair com 1 em vez de 2.
- **Sugestão:**
  - separar hashes entregues (os artefatos do lote) de hashes consultados;
  - divergência num arquivo consultado vira aviso de revalidação das parcelas ligadas a ele, sem falhar a estrutura;
  - o bloqueio vale só para os artefatos do lote enquanto ele aguarda auditoria.

**2. Média-alta: não há ferramenta de reconciliação.**
- O protocolo manda editar à mão o `inventario.json` (6,8 MB, 11.598 hashes).
- **Na cópia:**
  - um número mudado altera 5 chaves;
  - uma habilidade nova gera 2 chaves sem registro e muda a chave do catálogo inteiro.
- Cada lote vai precisar disso.
- **Sugestão:** um `revisao:reconciliar` em duas etapas.
  - Primeiro ele propõe a mudança: chaves novas com dono sugerido, removidas e hashes mudados.
  - Depois ele aplica: atualiza o `hashDado`, preserva estado e dono, e devolve para EM REVISÃO o que estava aprovado.

**3. Média: remendo de addon sem vínculo com a entrada nativa.**
- São 32 itens `remendo`, e nenhum tem `referencia` ou `regraOriginal`.
- Os `libera: soPorAddon:` viram "valor de domínio" solto.
- Exemplo: `tal_alma_livre` tem quatro chaves com quatro donos sem ligação entre elas:
  - TAL-05, a entrada nativa;
  - AD-23, o remendo do Flugel;
  - AD-02, a trava da Alma Livre;
  - M05, em `LIBERACOES`.
- **Sugestão:** fazer como na herança. O remendo aponta o alvo nativo, a entrada nativa recebe `remendadoPor`, e a prova de integração passa a ser exigida.

**4. Média: a coleta lê só a raiz de `src/systems/afty/`.**
- `CONDICOES_QUEBRAM_GUARDA` e `FONTE_GUARDA` estão em `ficha/ficha-sessao.js`. A primeira é a lista das 8 condições que quebram a Guarda Inabalável, uma regra de jogo.
- O `escopo.json` não menciona `ficha/` nem `encontros/`.
- **Sugestão:** varrer as subpastas, ou registrar essas constantes como exceção com dono.

**5. Média: o mapa de fontes por lote atribui páginas a itens que não estão nelas.** Conferi cada caso no PDF e no `.md`:

| Lote | Itens | Página atribuída | O que há na página |
|---|---|---|---|
| APT-12 | as 14 `mal_*` | Grimório p. 66 a 71 | Aptidões de Controle, Domínio, Barreira, Especiais e Anatomia. Pelo nome, só Regeneração Corporal aparece (p. 70) |
| GER-01 | Habilidades Gerais | Grimório p. 20 | "Os Dotes" das criaturas |
| INC-01 | 45 Características | só o Livro de Regras | O próprio catálogo tem `fonte: livro / adicionais / casa`, e `docs/afty-invocacoes.md` cita *Mecânicas* e *Adicionais* |
| PRO-02 | `estabilidade` | Livro p. 131 a 139 | Não está no livro |
| ITE-06 | Pingente de Amaterasu | Livro p. 144 a 151 | Não está no livro (é item de evento) |
| CNJ-07 | `cnj_agilidade_no_campo_de_batalha` | Livro p. 78 a 89 | Não está no livro |
| TAL-05 | `tal_alma_livre` | Livro p. 163 a 171 | Não está no livro (é de addon) |

- **Esperado:** marcar a fonte por item como "não localizada", "adiada" ou "da casa". A autorização de adiar fonte externa não cobre atribuir uma página que não contém o item.

**6. Média, pergunta ao autor: nenhuma parcela MANUAL INTENCIONAL pode ser aprovada.**
- A regra de aprovação em `cobertura.mjs` exige motor INTEGRADO, autoria diferente de INACESSÍVEL e `provaAutoria`.
- **Teste:** fiz um registro sintético com `justificativaManual`, motor LÓGICA ESPECÍFICA ou CAPACIDADE AUSENTE, e todos os outros critérios cumpridos. Ele foi recusado com "aprovação de parcela sem critérios".
- **Consequência:** um lote com um procedimento de mesa decidido pelo autor nunca chega a APROVADO.
- O autor precisa decidir se isso é intencional.

**7. Média, só na versão das 17:11: a cobertura quebra fora desta máquina.**
- `verificarLivro` lança uma exceção quando o `.md` não está em `C:/Projetos/Grimorio/...`, e `conferirCampanha` não trata essa exceção.
- Num clone de outro colaborador, `revisao:cobertura` cai com a pilha de erro.
- **Sugestão:** devolver um erro estruturado de fonte externa indisponível, sem derrubar a checagem de inventário.

**8. Baixa: o dono sugerido para item novo é o padrão do módulo.** Uma habilidade nova de Lutador sugere P01. Melhor derivar o dono da `especializacaoId`, ou não sugerir nenhum.

**9. Baixa, decisão do autor: o `CLAUDE.md` mudou a regra de sincronização para o repositório inteiro.**
- O texto novo diz: "Sincronize a base apenas com checkout livre e sem mudanças locais".
- O pedido do G00 só restringia a sincronização durante a campanha.
- A regra anterior, de rodar `git fetch` e adiantar o `main` antes de editar, foi trocada sem consulta.

**10. Baixa: a nota de lint no `CLAUDE.md` ficou incompleta.**
- A nota diz "caches de `.audit/`". Na verdade são dependências do Vite versionadas no commit `a0cefc2`, em `.audit/lote02-vite-*/deps`.
- Sem `.audit/` o lint dá 22 problemas, uma linha de base útil que sumiu do texto.

## Cobertura desta auditoria e limites

- **Executado:**
  - os hashes, a preservação e a validação completa (suíte, build, os três lints e os dois testes avulsos);
  - os três comandos novos;
  - 8 cenários de falha numa cópia descartável e um teste sintético de aprovação;
  - amostras de propriedade em 17 catálogos;
  - os 32 remendos;
  - 7 lotes de fontes conferidos no PDF e no `.md`.
- **Não executado:**
  - navegador, que não se aplica porque o G00 não mexe em tela;
  - os 18 domínios dinâmicos e o `reconciliacao.json` em profundidade;
  - os 11.598 donos um a um, que conferi só por amostra;
  - a versão das 17:11 por inteiro, que precisa de novos hashes antes.

Nada do repositório foi alterado por mim.

**Para aprovar na rechecagem:**
1. Uma entrega estável com novo `entrega-sha256.json`.
2. Os achados 1 a 5 e 7 corrigidos, ou justificados.
3. A decisão do autor sobre o 6 e o 9.

---

Em `_backup-livro/correcoes.md` acrescentei uma linha: o PDF tem 368 páginas, e a 368 é a contracapa, sem texto e por isso sem marcador. O `.md` e o hash dele não mudaram, e a política de 1 a 367 que o executor gravou está certa.