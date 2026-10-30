# Inovar Estilo e Estilo Próprio

O pacote [talentos-de-estilo.json](../addons/talentos-de-estilo.json) acrescenta dois Talentos para fichas Player e Afty. Ambos usam caixas de seleção repetíveis, no mesmo formato do Incremento de Atributo.

- **Estilo Próprio** recebe variantes que concedem uma Habilidade de Especialização própria.
- **Inovar Estilo** recebe variantes que modificam uma Habilidade de Especialização que a ficha já possui, como trocar seu atributo de escalonamento.

O pacote inicial deixa as duas listas vazias. As variantes serão criadas conforme os pedidos do autor e entregues em addons separados. Instalar uma nova variante a acrescenta à caixa correspondente, sem substituir as anteriores. Este é o padrão para futuros pedidos desses dois Talentos.

## Uso na ficha

1. Abra **Outros > Addons**, instale o JSON base e o ative nesta ficha.
2. Instale e ative também os addons com as variantes desejadas.
3. Em **Especializações > Talentos**, escolha **Estilo Próprio** ou **Inovar Estilo** e marque as variantes na caixa do Talento.
4. Salve a ficha.

Cada variante válida selecionada ocupa uma vaga de Talento, compartilhando o orçamento normal com as Habilidades de Especialização. A segunda variante exige outra vaga, como no Incremento de Atributo. Uma habilidade recebida por Estilo Próprio entra como habilidade concedida e não cobra uma segunda vaga de Habilidade de Especialização.

Inovar Estilo exige a habilidade alvo. Sem ela, a variante não produz efeitos. Desativar o addon retira seu conteúdo do cálculo e da lista disponível, preservando os ids guardados na ficha. Reativar o pacote permite recuperar as escolhas. As escolhas e as cópias dos addons acompanham a exportação JSON.

No Encontro, a união dos catálogos permite abrir fichas com addons diferentes. Cada ficha continua usando somente as opções dos pacotes que ela própria ativou. Desativar o pacote base desliga os dois Talentos e seus gastos, mesmo que outra ficha mantenha o pacote ativo. Uma variante que referencia uma habilidade de outro addon também exige esse addon ligado na própria ficha, tanto para conceder quanto para inovar a habilidade.

## Contrato para futuros addons

### Variante disponível: Mente Analítica (2026-10-25)

O pacote [mente-analitica.json](../addons/mente-analitica.json), versão 1.0.0,
acrescenta **Mente Analítica** às opções de Inovar Estilo. Requer possuir
**Mente Oculta** (`cmb_mente_oculta`) e troca somente seu escalonamento de
Sabedoria para Inteligência. O bônus adicional em Furtividade passa a usar
`mod_inteligencia`. O atributo normal da perícia continua sendo Destreza.

Ative os dois pacotes na própria ficha e marque Mente Analítica em
**Especializações > Talentos > Inovar Estilo**. Instalar a variante não
concede Mente Oculta nem aplica a troca sem selecionar a opção. Ao desmarcar
a opção ou desligar seu pacote, a habilidade volta a usar Sabedoria.

### Formato das variantes

As novas variantes usam a família `acrescenta.opcoesTalento`. Não use `substitui` para copiar e reescrever a lista inteira dos dois Talentos.

Os dois Talentos base declaram `escolha.aceitaOpcoesAddon: true` e `escolha.abertaPorPadrao: true`. A primeira propriedade também permite identificar opções órfãs depois de desinstalar um pacote que só continha variantes, sem habilidades próprias.

| Campo | Uso |
| --- | --- |
| `id`, `nome`, `descricao` | Identidade e texto da variante |
| `talentoId` | `talentos-de-estilo:tal_estilo_proprio` ou `talentos-de-estilo:tal_inovar_estilo` |
| `habilidadeId` | Habilidade real concedida pela variante, se houver |
| `requerHabilidade` | Habilidade que a ficha precisa possuir para a variante funcionar |
| `trocaAtributo` | Objeto `{ "de": "forca", "para": "inteligencia" }`, com atributos diferentes e válidos. Exige `requerHabilidade` |
| `efeitos` | Lista opcional de efeitos do Motor, no formato já usado pelos addons |

Os seis ids de atributo são `forca`, `destreza`, `constituicao`, `inteligencia`, `sabedoria` e `presenca`.

Ids criados no próprio pacote são escritos sem prefixo. O instalador acrescenta o namespace nas referências locais. Referências ao conteúdo de outro pacote usam o id completo, como os dois valores de `talentoId` acima. Referências ao livro conservam o id original.

O exemplo abaixo é apenas um modelo técnico. Ele não vem instalado no pacote base e seus números não constituem uma regra aprovada pelo autor.

```json
{
  "id": "meus-estilos",
  "nome": "Meus Estilos",
  "versao": "1.0.0",
  "paraRaw": "afty",
  "acrescenta": {
    "habilidades": [
      {
        "id": "guarda_autoral",
        "nome": "Guarda Autoral",
        "descricao": "Você soma seu modificador de Força à Defesa.",
        "especializacaoId": "lutador",
        "tipo": "nivel",
        "nivel": 2,
        "requisitos": [],
        "efeitos": [
          { "canal": "defesa", "expr": "mod_forca" }
        ]
      }
    ],
    "opcoesTalento": [
      {
        "id": "criar_guarda",
        "nome": "Guarda Autoral",
        "descricao": "Você recebe a habilidade Guarda Autoral.",
        "talentoId": "talentos-de-estilo:tal_estilo_proprio",
        "habilidadeId": "guarda_autoral"
      },
      {
        "id": "guarda_mental",
        "nome": "Guarda Mental",
        "descricao": "Guarda Autoral usa Inteligência em seu escalonamento.",
        "talentoId": "talentos-de-estilo:tal_inovar_estilo",
        "requerHabilidade": "guarda_autoral",
        "trocaAtributo": { "de": "forca", "para": "inteligencia" }
      }
    ]
  }
}
```

Selecionar Guarda Autoral em Estilo Próprio concede `meus-estilos:guarda_autoral`. Selecionar também Guarda Mental em Inovar Estilo altera o escalonamento dessa habilidade enquanto ela estiver presente. As duas escolhas usam duas vagas de Talento, e a habilidade concedida não acrescenta um terceiro gasto.

## Alcance da troca de atributo

A troca altera os identificadores exatos do atributo e de seu modificador em `expr` e `quando` dos efeitos emitidos pela habilidade alvo. Abrange efeitos das opções aninhadas dessa habilidade e os ids canônicos de habilidades herdadas. Mantém o catálogo compartilhado e os atributos da ficha intactos, sem mudar outras fontes que usem o mesmo atributo.

Por exemplo, `mod_forca` passa a `mod_inteligencia`, e `forca >= 14` passa a `inteligencia >= 14`. Textos literais continuam iguais, então `contar("forca")` conserva a marca `forca`.

Este contrato não converte automaticamente cálculos feitos por resolvedores específicos fora dos efeitos do Motor, como fórmulas próprias de dano, cura, CD ou usos. Uma variante que precise alcançar esses cálculos requer integração própria. Alterações de texto narrativo ou de outros campos da habilidade também precisam ser definidas no addon correspondente.

A criação de variantes é feita pelo conteúdo dos addons. Estes Talentos não acrescentam um editor livre de DSL à ficha.

## Verificação

[t-talentos-de-estilo.mjs](../asserts/t-talentos-de-estilo.mjs) cobre o JSON base, listas inicialmente vazias, referências com namespace, instalação cumulativa, concessão real de habilidades, orçamento, troca de expressão e condição, preservação de literais, opções aninhadas e seus grupos, id de opção compartilhado por habilidades diferentes, inovação de habilidade concedida no mesmo cálculo, alvo ausente, remoção e reativação de addon, variantes órfãs, persistência JSON e isolamento das escolhas no Encontro, tanto em Afty quanto em Player.
