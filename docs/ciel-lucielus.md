# Ciel Lucielus

Entrega de 2026-10-13, sobre main 6888873. Sem commit ou push.
O código e o índice humano do checkout anterior foram preservados.
Os registros preliminares de Ciel nos documentos foram encerrados.

## Arquivos

- `addons/ciel-lucielus.json`: pacote de regras e controles.
- `src/systems/afty/exports/ciel-lucielus-automatizado.json`: ficha importável,
  já com o pacote instalado e os três addons anteriores preservados.
- `scripts/preparar-ciel.mjs`: preparação reproduzível, recebe o caminho
  do JSON original como argumento. Não sobrescreve a entrada.
- `asserts/t-ciel-lucielus.mjs`: derivação da ficha real, custos, duração,
  remoção do addon, alcance, crítico e validação do pacote.

O JSON depende das alterações de motor desta entrega. Importar apenas o
arquivo na versão antiga do site não instala código JavaScript.

## Uso na ficha

Ligar Em Combate em Buffs. Em Ações ficam os controles do pacote.

- Fome de Guerra: botões de menos e mais, de zero a cinco. Cada carga soma
  um ao acerto, um dado da arma e cinco de dano físico. Persiste entre
  rodadas e zera ao encerrar o combate ou descansar.
- Mira Destrutiva: liga o -10 no acerto da sniper. Desligar devolve o acerto.
  A troca da vantagem e as consequências no alvo ficam sob controle da mesa.
  Os quatro graus constam na ficha com o texto fornecido pelo autor.
- Postura do Sol (estilo próprio): controle do alcance do estilo. A ficha
  recebida só selecionava Céu e Devastação nas opções de Postura comuns.
  O controle próprio não concede as outras regras da Postura do Sol do livro.
  Se o Sol comum ou Invencível sob o Sol já está ativo, o multiplicador não
  duplica. O dobro do Céu também não produz um fator oito por acidente.
- LM - Forma Verdadeira(15): paga 15 PE, aplica +4 em Destreza, Constituição
  e Inteligência. O autor confirmou que somente Destreza pode passar de 30.
  Na ficha recebida, os valores ativos são 32, 22 e 30.
  Sustentar (90 PV) paga uma manutenção por clique. Sem PV suficientes,
  encerra sem pagamento parcial. Pagamento que zera PV também encerra.
  Exposto, regeneração reduzida e exaustão permanecem no texto da ficha,
  para acompanhamento manual.
- Fio do Vazio: paga o custo resolvido da Máxima oficial e um uso de Surto
  de Ação. Soma 14d12 após o ataque, 10d12 durante e 100 fixos somente à
  sniper. O primeiro grupo não multiplica no crítico. Rolar o dano consome
  o bônus. Concluir disparo atende erro, rolagem externa e cancelamento,
  sem devolver custo. A próxima rodada também remove um tiro não usado.
  Recarga, PE insuficiente, ausência de arma e falta de Surto bloqueiam
  ativação. Ação Padrão, Bônus e Ataques Extras consumidos pela Ação Completa
  constam no texto, pois a ficha não possui um saldo geral dessas ações.

## Alcance e preservação

A sniper original resolvia 120/240 m pela receita de Criação de Equipamentos.
O pacote fornece a arma com 360/720 m, preservando a proporção curta/longa
do motor. O inventário aponta para ela e o vínculo de Manejo de Arma acompanha
a troca. Encantamentos e Habilidade Única do inventário são preservados.
A versão criada anterior continua no arquivo, sem equipar uma segunda arma.

Mira Telescópica já somava 18 m. Assim, o alcance curto resulta em 378 m,
3.780 m com Destreza 32 e 15.120 m com Destreza 32 e o estilo do Sol.
Sem os 18 m da passiva, a última conta é 14.400 m. Fontes aparecem no hover.
Cano Alongado não foi alterado nesta entrega.

A máxima homebrew usa a natureza Personalizado para manter os três valores
confirmados, sem receber espaços extras da transformação oficial. Conserva
identidade, custo, recarga e vaga da Técnica Máxima. O addon resolve a
transformação de um disparo por canais, sem alterar tabelas globais.

Sequencial Destrutivo foi atualizado com o texto de Veredito do Carrasco.
Os demais feitiços e funcionamentos anteriores foram preservados, inclusive
as duas entradas de Ricochete Perfeito e a expressão atual de Disparo Destruidor.

## Verificação visual

Prévia local em 127.0.0.1:5178/Afty, importação pela interface.
Verificados contador da Fome, ativação da Forma com pagamento usando PE
temporário primeiro, alcance 3.780/7.380 m, ativação da Máxima por 25 PE,
fórmula com os 24d12 adicionais e +100, consumo do bônus ao rolar dano e
bloqueio com Recarga 2. A sessão de teste não faz parte do JSON entregue.

## Validação final (2026-10-13)

- npx eslint src/systems/afty/: passou.
- npx vite build: passou. Avisos existentes de Node 22.11, tamanho do bundle
  e tempo dos plugins de build permanecem.
- npm run asserts: 204 arquivos e 11865 asserts passaram, incluindo os 53
  cenários da ficha real de Ciel.
- Sem conflitos não resolvidos, alterações em src/components/ ou U+2014 novo.
- Main remota reconferida em 6888873. Mudanças preparadas, sem commit ou push.

A retomada visual da última base foi bloqueada pela revisão automática da
política de URL em 127.0.0.1:5178/Afty. Não foi tentado contornar o bloqueio.
Os resultados visuais acima são da conferência anterior à integração.

## Integração na pasta principal (2026-10-13)

A pasta principal está em main 6888873 e recebeu esta entrega. Não é mais
necessário buscar o código no worktree para preparar o commit local.
Foram conciliados 12 blocos em sete arquivos durante a atualização da base.
Nenhum conflito permanece. O estado anterior completo, incluindo o índice,
está preservado no stash a370ed262fc1ac84b2fb8320d8d31e0a3d92ae1a.
Os arquivos de prévia Dharma permanecem locais. Sem commit ou push.

Nesta pasta, ESLint e build passaram. Regressões de Ciel, integração dos treinos
de escudo e primitivas passaram: 3 arquivos, 121 asserts. O código transferido
é equivalente à entrega cuja suíte completa passou em 204 arquivos e 11865 asserts.
Diff sem conflitos, sem src/components/ alterado e sem U+2014 novo.
