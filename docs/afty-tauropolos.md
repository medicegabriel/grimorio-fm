# Habilidades de Tauropolos

Pacote: `addons/habilidades-tauropolos.json`, versão 1.0.0, preparado em
2026-10-16 a partir do texto colado pelo autor. Conteúdo de mesa, sem
atribuição ao Livro de Regras. Nome neutro porque a personagem não foi nomeada.

Fonte recebida: anexo `Texto colado.txt`, SHA-256
`42d67dd92fa83d5c3d32eb876d4b8f5071b112f8dedef407810ee014d02fd353`.

Instalar o JSON em Outros > Addons e ativar na ficha. Na aba Feitiços,
copiar os modelos do pacote conforme o nível disponível. As cópias usam
as vagas normais da ficha. Funciona em Afty e Player.

| Modelo | Nível | Custo | Rolagens |
|---|---|---|---|
| Khrysea Mela | 5 | 20 PE | Cura 16d10 |
| Hokuto no Nanaya (Var.4) | 4 | 12 PE | Dois adicionais de 4d10 e um de 2d10 |
| Ourania Kynigos (Var.5) | 5 | 20 PE | Adicional de 7d12 |
| Hokuto no Nanaya | 0 | 0 PE | Adicional de 1d4 |
| Akribeia Toxon | 3 | 8 PE | Sem rolagem própria |
| Caçada de Antares | 2 | 5 PE | Sem rolagem própria |
| Phoebos Catastrophe | 4 | 12 PE | Dano 10d10 |
| Phoebos Pythoktonos Alter | 4 | 18 PE | Dano 15d10 e sangramento 6d10 |

Decisões confirmadas pelo autor: Ourania usa o custo de Nível 5, 20 PE,
e Catastrophe usa área de 12 m. Essas duas parcelas foram corrigidas no
texto importado. U+2014 da fonte foi substituído por dois-pontos.
O espaço Habilidade Ativa 09, vazio e com erro de planilha, foi excluído.
Hokuto de Nível 0 foi preservado mesmo com FALSE na coluna da planilha,
como modelo opcional, sem aquisição automática.

São modelos personalizados com texto e rolagens. Os dados de Tauropolos
não foram enviados. Dano e acerto do arco, crítico de Ourania, alcance,
penetração de RD, margem de crítico e bônus de acerto devem ser aplicados
manualmente. As rolagens de adicional não incluem o dano do arco.
Os adicionais Após Ataque não devem ser multiplicados por crítico.

CD adicional de +4 ou +9, desvantagem, terreno difícil, condição e remoção
do sangramento permanecem no texto. A CD numérica do personalizado ainda
usa a CD base, sem somar esses modificadores. Criação, estoque e consumo
das maçãs, conversão do excedente em PV temporário, concentração,
sustentação de 2 PE por rodada de Ourania e duração de Caçada são manuais.
O custo especial de 18 PE do Alter usa custoPETexto e não recebe redução
automática. Liberação Máxima e Ritual Estendido foram mantidos no texto,
sem converter o modelo para a Técnica Máxima oficial de 25 PE.

Não há mudança no motor, na DSL ou nas fórmulas. Conferência de importação,
custos, rolagens e deriveAfty executada em Afty e Player. Conferência no
navegador não executada nesta entrega.

Inventário: 31 novas chaves registradas no lote AD-72, sem atualização ou
remoção de chaves anteriores, sem aprovação de auditoria. Reconciliação
restrita ao pacote, pela API construirProposta/aplicarProposta, com proposta
em `docs/revisao-automacao/tauropolos-proposta.json`. As 267 identidades
preexistentes e ainda não registradas de Oda Nobunaga foram excluídas do
escopo da transação. A suíte completa passou em 203 de 204 arquivos. A única
falha, t-reconciliacao-g00, continua apontando essas 267 chaves anteriores,
registradas como pendência em `docs/a-fazer.md`. ESLint e build passaram.
