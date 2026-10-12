# Talentos Iniciais

Addon de mesa em [addons/talentos-iniciais.json](../addons/talentos-iniciais.json). Funciona em fichas Player e Afty.

1. No criador da ficha, abra **Outros > Addons**.
2. Clique em **Instalar**, cole o conteúdo do JSON e confirme a instalação.
3. Ative **Talentos Iniciais** na biblioteca.
4. No quadro **Neste Personagem** ou **Nesta Criatura**, digite de **1 a 4** no campo **Talentos**.
5. Escolha os Talentos em **Especializações > Talentos** e salve a ficha.

O padrão é 1. A quantidade pertence à cópia do addon nesta ficha e acompanha sua exportação. Outras fichas podem usar valores diferentes. A cópia da biblioteca conserva o padrão instalado.

As vagas são exclusivas de Talento e acumulam com as demais fontes. Não pagam Habilidades de Especialização nem dispensam os pré-requisitos dos Talentos. O addon não escolhe Talentos automaticamente. Desligá-lo retira as vagas, preservando as escolhas, que podem ficar excedentes.

## Formato

regrasAfty.talentosIniciais aceita somente um inteiro entre 1 e 4. Quantidades inválidas reprovam a instalação e não concedem vagas ao motor.

Os efeitos entram no montante pelo canal vagasTalento, com o nome e o id do pacote como fonte. A leitura é dos addons da própria ficha para que um Encontro com fichas diferentes não compartilhe o bônus.

## Verificação

asserts/t-talentos-iniciais.mjs: instalação, quatro quantidades, limites inválidos, orçamento exclusivo nos dois sistemas, acúmulo, remoção, isolamento por ficha e ida e volta pela exportação.
