# Ferramentas da campanha

Os comandos de inventário, cobertura e revisão são somente leitura. revisao:reconciliar aplica atualizações ao controle somente quando chamado com --aplicar. Não modifica o aplicativo, addons, fichas nem armazenamento pessoal.

1. Execute npm run revisao:reconciliar -- --proposta docs/revisao-automacao/G00/rechecagem/proposta-NN.json. O arquivo registra adições, remoções e atualizações, sem alterar o controle. Use nome novo para preservar o histórico.
2. Revise a proposta e preencha somente decisoes. Confirme o proprietário de cada adição, justifique cada remoção e informe renomeadoPara quando houver renomeação. Preencha justificativaAtualizacao. Sugestão de dono não equivale a confirmação.
3. Execute npm run revisao:reconciliar -- --aplicar com o mesmo caminho. Proposta obsoleta, payload editado, erro de coleta, remoção sem motivo ou dono inválido impedem aplicação. A transação é preparada antes da gravação e restaura os bytes anteriores se houver erro de gravação.
4. Rode revisao:cobertura e faça a revisão semântica dos itens e parcelas atingidos. A reconciliação registra identidade e invalida aprovação antiga; não aprova regra.

O dono existente não muda silenciosamente. Alteração que atinge lote APROVADO devolve o lote e seus itens aprovados para EM REVISÃO, retira evidência aprovada das parcelas e preserva a auditoria anterior no histórico. Tombstones documentam remoções. Adições começam NÃO REVISADO. Habilidade nova sem regra de propriedade explícita fica sem sugestão, em vez de herdar P01.

As regressões estão em asserts/t-revisao-g00.mjs, asserts/t-fontes-revisao.mjs e asserts/t-reconciliacao-g00.mjs. Não aprovam regras do livro.

Lint específico:

```text
npx eslint scripts/revisao-automacao/*.mjs asserts/t-revisao-g00.mjs asserts/t-fontes-revisao.mjs asserts/t-reconciliacao-g00.mjs --config scripts/revisao-automacao/eslint.config.mjs
```

O protocolo completo está em docs/revisao-automacao/LEIA.md.
