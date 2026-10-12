# Arsenal de Grau Especial: análise de integração

Análise em 2026-10-08 do pedido anexado pelo autor. Cadastro dos oito itens
concluído em `addons/arsenal-de-ryuma.json`. Export atualizado de Ryuma
preparado com os oito guardados. Relatório final em `arsenal-ryuma-relatorio.md`.

O autor acrescentou Espada colossal e Presa do Desgarrado ao pedido,
totalizando oito itens. As famílias `escudos` e `uniformes` foram abertas
no mecanismo existente de addon, sem criar outro sistema de equipamento.
Cadastro e export concluídos, sem duplicar encantamentos já incluídos no dano.

## Estruturas existentes

| Aspecto | Representação atual | Consequência para a integração |
| --- | --- | --- |
| Inventário | `creature.equipamentos.itens`, com `uid`, `tipo`, `refId`, `qtd`, `equipado` | Uma entrada por item, vinculada à ficha, com IDs estáveis para não duplicar |
| Catálogo | `catalogoDoTipo` e `getEquipamento`, em `afty-equipamentos.js` | Reutilizar os tipos `arma`, `escudo` e `uniforme` |
| Armas próprias | `creature.armasCustom`, saneadas por `saneiaArmaCustom` | Propriedades parametrizadas recebem padrões na leitura, então campos ausentes exigem cuidado |
| Escudos e uniformes criados | `escudosCriados` e `revestimentosCriados` | Números são recalculados pelo custo, não aceitam diretamente os valores especiais enviados |
| Armas em addon | Família `armas`, com `dano.dado`, `dano.tipo`, `grupo`, `props`, `custo`, `espacos`, `critico` | Existe precedente de equipamento com `faPadrao` e `faFixa` |
| Grau e encantamentos | `entrada.fa.grau`, `encantamentos`, `sintonizadaTipo` | Grau Especial é `especial`, encantamentos acumulam entre graus. Elemental tem regra textual, sem seletor encontrado |
| Habilidade única | `fa.habilidadeUnica` e `fa.habilidadeEfeitos` | Texto separado das linhas do Motor, efeitos ativos dependem de interruptor |
| Passivas próprias | `def.efeito.motor`, `def.efeito.pericia` e `def.efeitosEspeciais` | Emissão condicionada ao equipamento em uso, sem gravar bônus permanentes |
| Cargas comuns | `resolveFerramenta` reconhece `usaCargas` e calcula cargas iguais ao BT | Não transferir esse padrão para Impulso personalizado sem confirmação |
| Estados e recursos | Estados de combate, inclusive faixas e opções | Há estrutura reutilizável, mas falta regra para alimentar e consumir alguns recursos enviados |
| Sangramento | `SANGRAMENTO_FAIXAS`, em `afty-condicoes.js`, e estado do alvo | Quatro intensidades existentes, crítico da Murasama ainda exige ligação com alvo e ataque |
| Pulo | Textos de talentos e habilidades | Não há canal nem distância de salto calculada na ficha |
| Ler Intenções | Referências textuais | Não foi encontrado modelo de níveis ou bônus da ação para automatizar os dois aumentos |

Em ficha de jogador, o grau do escudo soma RD e o grau da arma já participa
dos cálculos de ataque e dano. Potente adiciona um dado, Blindado adiciona
2 Defesa e Reforçado adiciona 2 RD do escudo. É necessário esclarecer se os
números enviados já incluem essas parcelas. A penalidade de equipamento é
armazenada como valor negativo no motor.

Os escudos e revestimentos da bancada de criação não são receptáculos para
valores arbitrários. Colocar Yagen em `escudosCriados` somente com custo 4
substituiria sua RD por 8, penalidade por -6 e dano por 1d10. Revestimentos
também são recalculados pelo custo. A integração precisa preservar os itens
especiais no catálogo existente, sem alterar as fórmulas da bancada.

## Reutilização e conflitos

Encantamentos encontrados no catálogo: Certeira, Complementar, Potente,
Elemental, Penetrante, Amplificadora, Blindado, Propulsor, Furtivo,
Material Pesado, Defensora, Sintonizada, Reforçado, Intangível,
Expansão de Escudo e Precisa. Cada encantamento mantém sua implementação
atual, que pode ser numérica ou somente textual.

Propriedades têm identificadores existentes, incluindo `fineza`, `fatal`,
`energica`, `mortal`, `leve`, `especial`, `versatil`, `apunhaladora`,
`arremessavel`, `marcial` e `modular`. Fatal e Mortal requerem dado, Modular
requer tipo de dano e Arremessável requer par de alcances. Esses parâmetros
não podem receber padrões silenciosos quando o autor não os informou.

`enc_esc_bloqueador` concede Meia Cobertura a uma criatura atrás do portador.
Não é o Bloqueador da Yagen, que aumenta RD base e Ler Intenções.
`enc_unif_impulso` move em linha com dano de impacto, não ativa Perceber o Ar.
Os dois nomes especiais devem preservar seus textos sem reutilizar os
efeitos incompatíveis dos homônimos comuns.

Material Pesado exige revestimento médio ou robusto por `refId`. Não se
deve eliminar esse requisito global para aceitar o uniforme especial.
É necessário confirmar o revestimento que o Lobo Saltitante representa.

`res_perceber_o_ar` existe, mas sua regra original exige 2 Estamina e
Reação, com Acrobacia contra Reflexos. O pedido do uniforme menciona uma
carga, sem esclarecer se substitui os 2 pontos ou também a Reação.
Não conceder toda a habilidade permanentemente: ela inclui outros benefícios
que não foram concedidos pelo texto do uniforme.

Manejo de Arma Precisa e Penetrante não deve ser confundido com os
encantamentos Precisa e Penetrante. Confirmar sua representação e aquisição
antes de conceder um treino ou bônus adicional ao personagem.

## Respostas do autor

Autor respondeu "complesxo" à pergunta de classe das armas, interpretado
como Complexa. Depois autorizou os padrões: crítico 20, 1 espaço por arma,
2 na Yagen, 6 no uniforme e definição existente da Espada colossal.
Dados de Fatal, Mortal e Versátil sem parâmetros continuam pendentes.

Atualização: elementos fixos confirmados, Murasama Congelante, Dragon Bone
Queimante, Esmaga Mata Ácido, Totsuka Queimante, Espada colossal Chocante e
Presa do Desgarrado Sônico. Não implementar alternância entre elementos.

Autor mandou desconsiderar as anotações de bônus de jogador na Yagen e
manter somente a base. Base informada: 8 RD. Talento +4, Armeiro BT/2 e
treino +5 não pertencem à definição do equipamento. O encantamento especial
e Reforçado continuam pelas regras próprias, separados da base.

Uniforme: base 8 Defesa e Blindado +2, total 10. Manter penalidade 6
informada, sem derivar outra penalidade a partir do total de Defesa.

Autor confirmou que os dados de dano já incluem Potente. Não somar esse
dado novamente. Confirmou Destruidora na Dragon Bone, além dos quatro
encantamentos normais da lista inicial. Isso totaliza cinco encantamentos
normais, enquanto o grau atual permite quatro vagas normais de arma.
Não excluir encantamentos nem criar vaga extra silenciosamente.

Presa do Desgarrado: Grau Especial, custo 1, grupo Faca, alcance 7,5,
dado 1d6, Dano 5, Nível Padrão, Manejo de Arma Precisa. Propriedades
Apunhaladora, Arremessável [6/18m], Fineza, Leve, Marcial e Modular Ct.
Encantamentos Certeira (3º), Harmonizada (2º), Potente e Elemental Sônico
(1º), Predar (Especial). Predar reduz margem de crítico em 3 enquanto
empunhada. O texto deve preservar a propriedade de Grau Especial.

Espada colossal: Primeiro Grau, custo 3, grupo Espada, dado 2d8,
Dano 4, Nível Padrão. Encantamentos Penetrante (3º), Elemental Chocante
(2º) e Potente (1º). Alcance e propriedades não informados na nova tabela.

Em 2026-10-08, o autor confirmou: "Eles já estão com o efeito de grau delas".
Preservar essa informação de origem. Nos esclarecimentos posteriores,
separou as bases da Yagen e do uniforme e confirmou inclusão de Potente
nos dados. Não usar os totais antigos como novas bases de RD e Defesa.

## Pontos enviados para confirmação

1. Oito itens guardados no export de Ryuma, sem alterar o arquivo original.
2. Dados incluem Potente, uniforme inclui Blindado e Yagen usa base 8:
   confirmado. Falta conciliar a quinta vaga da Dragon Bone.
3. Tipos de dano físico ausentes, dados de Fatal e Mortal,
   dados de Versátil e alcances não informados.
4. Dragon Bone: conversão PE/acúmulos, dado liberado, arredondamento,
   destruição de arma e verificações da absorção.
5. Uniforme: cargas e recuperação, substituição do custo de Perceber o Ar,
   Reação e arredondamento do bônus de metade do BT.
6. Totsuka: duração e alcance da escolha de dano Radiante.
7. Yagen: acúmulo entre +1 nível e +2 da ação Ler Intenções.
8. Procedimentos sem regra fechada mantidos como texto, conforme o pedido
   original, distinguindo-os das automações efetivas.

## Verificação desta análise

Main remota consultada em `891b6d4826e781b3bda99aaedfc47bfd6e4968b9`,
igual ao HEAD local. O export da carteira completa de Ryuma tem inventário
e armas próprias vazios. Famílias `escudos` e `uniformes` preparadas no
catálogo de addon. `asserts/t-addon-escudos-uniformes.mjs`: 21 asserts,
incluindo bases, encantamentos, guardar/equipar, persistência, reconstrução,
ausência de duplicação e ausência de alteração de inventário de outra ficha.
ESLint e Vite build passaram. O build mantém avisos existentes de versão
de Node e tamanho do bundle. Cadastro de oito itens concluído. Suíte final:
165 arquivos, 8989 asserts. Validação visual tentou abrir o preview local,
mas o navegador retornou `ERR_CONNECTION_TIMED_OUT`. Relatório registra
quais efeitos são automáticos e quais continuam descritivos.
