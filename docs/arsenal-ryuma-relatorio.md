# Integração do arsenal de Ryuma

Concluído em 2026-10-08. O export `ryuma-carteira-e-arsenal.json` contém
oito itens guardados na ficha Ryuma e o addon incorporado. Preserva a
carteira completa e todos os outros campos da ficha. O original não foi
sobrescrito. As escolhas dos treinos anteriores não foram preenchidas.

## 1. Equipamentos cadastrados

| Item | Tipo | Grau | Dado enviado | Elemento | Base |
| --- | --- | --- | --- | --- | --- |
| Murasama | Arma, Espada | Especial | 2d10 | Congelante | Custo 4 |
| Dragon Bone (Versão Odachi) | Arma, Espada | Especial | 2d12 | Queimante | Custo 4 |
| Uniforme do Lobo Saltitante | Uniforme | Especial | N/A | N/A | Defesa 8, penalidade -6, custo 4 |
| Totsuka-No-Tsurugi | Arma, Espada | Especial | 1d8 | Queimante | Custo 1 |
| Yagen Tōshirō | Escudo | Especial | N/A | N/A | RD base 8, penalidade 0, custo 4 |
| Esmaga Mata | Arma, Faca | Especial | 1d6 | Ácido | Custo 4 |
| Espada colossal | Arma, Espada | Primeiro | 2d8 | Chocante | Custo 3 |
| Presa do Desgarrado | Arma, Faca | Especial | 1d6 | Sônico | Custo 1 |

Classes Complexas confirmadas. Autor autorizou crítico base 20, 1 espaço
por arma, 2 na Yagen e 6 no uniforme. Espada colossal reutiliza propriedades
e 4 espaços do catálogo. Elementos fixos, sem seletor de alternância.
Dados já incluem Potente. Valores originais, incluindo Dano 5 ou 4 e os
totais antigos de RD e Defesa, ficam em `dadosOriginais`, sem virar outra
parcela automática. O motor preserva o cálculo existente do dano fixo por
grau. Encantamentos por grau ficam registrados em `encantamentosPorGrau`.

## 2. Arquivos modificados ou criados

- `addons/arsenal-de-ryuma.json`: pacote com as oito definições.
- `scripts/preparar-arsenal-ryuma.mjs`: fonte das definições e integração
  idempotente, aceita export de entrada e um caminho de saída diferente.
- `src/systems/afty/afty-equipamentos.js`: famílias `escudos` e `uniformes`,
  alcance corpo a corpo declarado, dados com encantamento já incluído e
  expressão de aumento da RD base. Nenhum componente da 2.5.2 alterado.
- `asserts/t-addon-escudos-uniformes.mjs` e `asserts/t-arsenal-ryuma.mjs`.
- `docs/afty-addons.md`, `docs/automacao-dsl.md`, `docs/afty-status.md`,
  `docs/a-fazer.md`, análise e este relatório.

## 3. Estruturas, encantamentos e propriedades reutilizados

Inventário existente, namespace de addon, Ferramentas Amaldiçoadas, grau,
equipar/guardar, persistência e texto de equipamento na Ficha Final.
Sem inventário paralelo e sem inserir equipamentos em outras fichas.

Encantamentos do catálogo: Certeira, Complementar, Potente, Elemental,
Penetrante, Amplificadora, Destruidora, Blindado, Propulsor, Furtivo,
Material Pesado, Defensora, Sintonizada, Reforçado, Intangível,
Expansão de Escudo, Precisa e Harmonizada. Reutilizar o registro não
significa que todo procedimento desse encantamento esteja automatizado.

Propriedades parametrizadas conhecidas reutilizam IDs existentes.
Fatal d10 da Totsuka está aplicado. Fatal e Mortal sem dado não recebem
um valor inventado. Propriedades da Espada colossal vêm do catálogo, por
autorização. Apunhaladora, Fineza, Leve, Marcial e Modular Ct das facas
estão preservadas, assim como Arremessável [6/18m].

## 4. Mecânicas efetivamente automatizadas

- Bases, custo, carga, grau e aplicação/remoção dos efeitos ao equipar/guardar.
- Tipos elementais fixos nas linhas de dano das seis armas.
- Dado final enviado sem duplicar Potente. Outras fontes de dados adicionais
  continuam somando normalmente. Armas comuns não têm o desconto.
- Dragon Bone: Destruidora acrescenta um dado em acerto crítico.
- Uniforme: base 8 + Blindado 2 = 10 Defesa, Propulsor +3 movimento,
  Furtivo +4 Furtividade e Sob Medida +2 Acrobacia/+2 Furtividade, sujeitos
  à penalidade de equipamento de -6. Material Pesado não passa seu requisito.
- Yagen: RD base 8 + BT enquanto empunhada, mais RD de Grau Especial 5 e
  Reforçado 2. A base resolvida alimenta `rd_escudo` e os treinos existentes.
  Com BT 8 e sem outras fontes: 23 RD Física. Não grava o total 31 como base.
- Presa: Predar reduz a margem de crítico em 3 enquanto empunhada.
- Alcances corpo a corpo informados preservados, incluindo 7,5 da Presa,
  sem substituir a propriedade Arremessável [6/18m].
- Outros efeitos de encantamentos seguem a automação que já possuíam.

## 5. Mecânicas somente descritivas

Lâmina Carniceira, percepção situacional de Sede de Sangue, absorção e
liberação da Dragon Bone, Impulso personalizado e antirrastreamento,
Queimação Superior e modo Radiante, orientação e mudanças de Ler Intenções,
e +13,5 metros de pulo de Esmaga Mata. Textos preservados e visíveis no
inventário, separados de campos numéricos do Motor. Não foram declarados
como automações concluídas. Não há gastos automáticos de Reação, Ação
Bônus, PE, cargas ou acúmulos nessas habilidades.

Manejo de Arma informado aparece como texto. Não compra um treinamento
nem concede suas etapas automaticamente. Manejo Especial ausente fica vazio.
Autor confirmou posteriormente que Ryuma não tem Manejo Especial.
Registrado `manejoEspecialInformado: null`, não é mais pergunta pendente.
Export não possui a habilidade nem instâncias de Treino de Manejo de Arma.

## 6. Pendências de confirmação

Dados de Fatal/Mortal e Versátil ausentes, tipos físicos originais e alcances
não informados. Dragon Bone precisa conversão PE/acúmulos, dado liberado,
arredondamento e procedimento de destruir arma. Impulso precisa regra de
cargas e substituição dos custos de Perceber o Ar. Totsuka precisa duração
do modo Radiante. Ler Intenções precisa esclarecer níveis e acúmulo com +2.
Pulo não possui um canal de cálculo. Perguntas ficam em `docs/a-fazer.md`.

## 7. Testes e resultados

21 asserts de famílias de equipamento e 72 de integração do arsenal.
Suíte completa: 165 arquivos, 8989 asserts, todos passaram.
ESLint do Afty e Vite build passaram. Build conserva avisos existentes
de Node 22.11 e bundle grande. Comparação do export real confirmou que
somente `addons` e `equipamentos` mudaram. Salvar/recarregar e repetir a
integração preservam oito entradas, sem duplicação ou bônus permanentes.

Conferência visual pendente: servidor de preview iniciou, mas o navegador
da ferramenta retornou `ERR_CONNECTION_TIMED_OUT` para o endereço local.
Servidor e arquivos temporários foram removidos após a tentativa.
Diff sem conflitos ou alterações em `src/components/`. Sem commit ou push.

## 8. Incompatibilidades identificadas

- Dragon Bone possui cinco encantamentos normais confirmados, quatro vagas.
  Mantidos os cinco e o aviso do motor, sem criar uma vaga extra silenciosa.
  Grau de Destruidora não foi informado, registrado separadamente.
- Material Pesado exige revestimento Médio ou Robusto por ID. O uniforme
  personalizado não possui equivalência confirmada, portanto não concede
  os +2 Fortitude desse encantamento. Requisito não foi removido globalmente.
- Impulso e Bloqueador do catálogo têm outros efeitos. Habilidades especiais
  usam seus próprios textos, sem instalar os encantamentos homônimos comuns.
- Campos não informados de Fatal/Mortal permanecem no texto. Seus dados
  críticos não são fabricados. Versátil sem dado de duas mãos não oferece
  um segundo dano automático.
- A versão publicada precisa receber estas alterações de motor antes de
  importar o pacote ou a ficha com escudo e uniforme personalizados.
