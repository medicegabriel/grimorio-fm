# Lime, Novo Estilo das Sombras

Pacote: `addons/lime-neds.json`.

As cinco técnicas fornecidas pelo pacote entram como conhecidas na ficha que o
ativa. Cada técnica custa uma habilidade. Cada imbuição ocupa uma vaga e o
máximo é duas por técnica. Desinstalar remove as técnicas sem alterar os estilos
criados manualmente. O Domínio Simples não é concedido pelo pacote.

O Pacto altera a base derivada, preservando a alocação salva. Força e Constituição
recebem +4 e limite fixo 30. Inteligência e Sabedoria têm limite fixo 6. Destreza
e Presença não recebem alterações. As parcelas aparecem no hover das fontes.

A Reforçada acrescenta o dobro do nível de Aura por imbuição em RD Geral,
exigindo Aura Reforçada, combate, Estilo ativo e o estado Dentro do Domínio
Simples. A RD física original permanece. A confirmação posterior do autor está
anexada literalmente à descrição original, que não foi reescrita.

Poder da Amizade mostra o número de amigos por imbuição, usando Presença 20
como requisito. O pacote não modifica fichas de aliados. Provocação e Anulação
são consultáveis integralmente, com testes opostos, condições, Reação e gasto
de energia resolvidos na mesa. Os requisitos escritos permanecem na descrição.

O Aumento de Defesa usa a diferença contra o maior teste adversário. Cada
imbuição concede o Nível de Aura mais 1 para cada 2 pontos de diferença, com a
parcela da diferença limitada pela Maestria. O resultado soma com o Aumento de
Defesa comum do Estilo. Os controles de ativação e diferença expiram no início
da próxima rodada e no descanso.

Infraestrutura genérica adicionada, sem conteúdo da Lime no código do motor:

- `atributos`: `bonusBase`, `limiteFixo` e `nome` por atributo.
- `estilos`: técnicas próprias do pacote, `maxImbuicoes`, `custoImbuicao`,
  `efeitos`, `resultados`, `adendo` e `aviso`.
- `porImbuicao` multiplica um efeito ou resultado pela quantidade imbuída.
- `acumulaComEstilo` permite ao efeito de addon somar ao Estilo comum.
- `expiraNaRodada` remove estados temporários na virada da rodada e no descanso.

Verificação específica:

```powershell
npm run asserts -- lime
```

O trabalho foi integrado sobre `origin/main` em `3d5ad26`, sem editar
`src/components/`.
