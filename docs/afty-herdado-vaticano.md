# Herdado: Vaticano

Pacote: [herdado-vaticano.json](../addons/herdado-vaticano.json), versão 1.0.0.
Conteúdo homebrew fornecido pelo autor em 2026-10-12. A descrição narrativa de
Cura Perfeita foi escrita para este pedido.

## Instalação e escolha

Em `/Afty` ou `/Player`, abra Outros > Addons, instale o JSON na biblioteca e
ative o pacote na ficha. Em Identidade > Origem, escolha Herdado e o clã Vaticano.
O Talento Cura Perfeita fica em Especializações > Talentos, no grupo Origem.
Ele exige a origem Herdado, o clã Vaticano e nível 8.

## Benefícios

- Bônus em Atributo: 3 pontos livres. A distribuição permite os três no mesmo
  atributo, respeitando o limite normal da ficha.
- Treinamentos de Clã: Treinado em Teologia (Religião) e Ocultismo, sem gastar vagas de
  perícia. Subir a Mestre custa apenas a diferença; não concede Mestre
  automaticamente a quem já era Treinado.
- Aprimorar Cura: +1 por dado em qualquer cura realizada pelo usuário.
- Cura Perfeita: concede 1 nível gratuito na trilha Energia Reversa, respeitando
  o teto vigente da trilha, e eleva o bônus de Aprimorar Cura para +2 por dado.
  A concessão do nível não compra automaticamente a Aptidão Energia Reversa.

O clã emite `curaPorDado` sem alvo. O talento acrescenta mais 1 no mesmo canal,
totalizando 2, e preserva bônus de outras fontes. O cálculo acompanha a
quantidade de dados efetivamente rolada, inclusive ao gastar mais PER.
Curas sem dados não recebem esse bônus. Desativar o pacote retira seus efeitos;
as escolhas salvas continuam disponíveis para uma reativação.

## Fonte e validação

As regras do pacote vêm do pedido do autor. O autor confirmou que Religião usa
a perícia Teologia, sem acrescentar uma perícia nova. A distinção entre Níveis de Aptidão
e a Aptidão Energia Reversa segue o catálogo atual e o Livro de Regras 2.5.2,
página impressa 190. Fonte externa acessível e SHA-256 conferido:
`1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a`.

Regressão: `asserts/t-herdado-vaticano.mjs`, com instalação, requisitos,
distribuição de atributos, perícias, nível gratuito, cura por dado, outras
fontes e desativação nos dois sistemas.

Validação em 2026-10-12: 48 asserts específicos e a suíte completa com 165
arquivos e 9.661 asserts passaram. No navegador, a instalação, ativação,
seleção do clã, distribuição de três pontos no mesmo atributo e aquisição
do talento no nível 8 foram conferidas na ficha Player.

As 25 entradas do pacote pertencem ao lote AD-52 no controle de revisão,
em NÃO REVISADO. A implementação e os testes não representam aprovação
independente de auditoria.
