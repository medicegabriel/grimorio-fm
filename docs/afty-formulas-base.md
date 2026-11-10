# Fórmulas base — Grimório Afty (cálculos de criatura)

Fonte da verdade das fórmulas reais do Afty, enviadas pelo autor em 2026-07-15, no
formato de planilha (funções em PT-BR: `SWITCH`, `SE`=IF, `IFS`, `ARREDONDAR.PARA.BAIXO`=
FLOOR, `INT`=parte inteira, `MAIOR(intervalo;k)`=k-ésimo maior, `VERDADEIRO`=TRUE).

> ⚠️ O motor atual `src/systems/afty/afty-derive.js` usa coeficientes PLACEHOLDER. Ele
> deve ser substituído por estas fórmulas **depois** que as perguntas em aberto (fim do
> arquivo) forem respondidas. Não implementar antes de confirmar.

---

## Correções estruturais ao que estava assumido

### CX3: conteúdo direcionado e custos de ER (2026-11-03)

- Adepto de Medicina declara a própria fonte de cura. Dados por personagem:
  2d6 antes do nível 4, 2d12 no 4, 3d12 no 8, 6d8 no 12 e 6d10 no 16,
  mais o maior modificador entre PRE e SAB uma vez. Usos são metade do
  modificador positivo, com piso, inclusive zero. Não concede o primeiro
  benefício de Suporte em Combate. Livro p.102 e 165.
- Mestre da Criação aplica +2 a cada um de dois ids distintos de Ofício do
  catálogo real, incluindo Ofícios extras. A produção adicional é de CX5.
  Alcances: +6 m para Arremesso, +1,5 m para Chicote. Livro p.166 e 167.
- Potencial Físico 2 usa duas escolhas nativas de Treino, um ponto direcionado
  por escolha a FOR, DES ou CON. Pode repetir o atributo e respeita seus tetos.
  Escolha de etapa removida ou de origem sem acesso fica inerte. Livro p.346.
- O excedente da p.366 considera apenas aumentos permanentes recebidos, além
  do teto atual da trilha. Uma concessão escolhida substitui aquele aumento,
  mantendo o custo dos níveis alocados. Não concede simultaneamente uma
  Aptidão gratuita e a devolução de um nível pago. Temporários não geram
  concessões. Requisitos cruzados resolvem por ponto fixo sem aceitar ciclos.
- Aura Elemental Reforçada emite RD por Tipo no elemento válido da Aura
  Elemental: valor declarado de Aura Reforçada mais AU, normalmente 3 AU.
  Conserva a fonte e as substituições de Addon. Livro p.175.
- Decisão do autor em 03/11: cada Aptidão de ER segue o próprio custo.
  O teto é da cura. Cada PER custa 2 PE (p.190). O desconto de 2 PER do
  Treino 3 é específico de regenerar membro/ferimento interno (p.342).
  Remover veneno mantém 4 PER. A cura consequente usa metade dos PER gastos,
  com piso, sem reaplicar o teto de uma cura básica ao custo da regeneração.
- Reversão de Técnica (p.194) tem marca própria no Feitiço e concede uma vaga
  exclusiva. O custo ativo recebe o nível efetivo como aumento com fonte,
  herdado pelas variações. Decisão de 03/11: também pode ser Passiva, somando
  o nível à reserva de PE Máximo no Player, com a isenção atual de Afty
  preservada. Passivo comum de nível 3 reserva 9 PE no Player e zero no Afty.
- Movimentos Acrobáticos: no sucesso, levanta e recebe piso(MOD DES / 2) na
  Defesa por uma rodada. Chicote puxa até 3 m após falha de Fortitude contra
  a CD do atacante. Concussão move até 3 m após impacto corpo a corpo efetivo,
  em espaço desocupado, recusando alvo duas categorias maior. Livro p.167 e 168.
- Puxar um Ar copia a pilha de dados normal do desarmado e seus valores fixos,
  preservando faces distintas. Bônus de cura entram uma vez. Revigorar conserva
  1d10 + 1d10 a cada quatro níveis de escalonamento de Combatente, mais
  2 MOD CON + BT. Ambos usam ação bônus. Descanso único autorizado preservado.
- Surto de Ação: 5 PE por ação comum extra, uma vez por rodada e piso(BT / 2)
  usos por descanso longo, com contador e ação extra nativos. Livro p.73.
- Resistir: até 2 PE, +2 por PE no teste de Fortitude ou Reflexos. Conhecimento
  Aplicado: até piso(BT / 2) PE, +2 por PE em TR contra Feitiço. Mente Plácida:
  1 PE dá +3, 2 PE dão +5, a CD diminui pelo maior MOD entre INT/SAB. A redução
  de CD também vale sem PE. Os remendos da própria ficha passam pelo Motor.
  Livro p.54 e 82.
- Indomável paga 1 PE, mantém o melhor TR falho e usa piso(ND / 2) usos.
  Outra Chance paga 3 PE, mantém o melhor teste falho do aliado visível a
  até 6 m e usa BT usos. Não gasta ação, decisão do autor de 06/11. O descanso
  único autorizado permanece. Livro p.68 e 105.
- Perceber Oportunidade: vantagem e até duas repetições por rodada, consumindo
  as reações que a ficha possui. Não concede outra reação. Livro p.164/293.
  Reação Rápida compra uma reação por 2 pontos de estamina, uma vez por rodada.
  Força Imparável/Barreira custam 2 para trocar natural baixo por MOD DES/CON
  no TR correspondente. Precisão Forçada paga 3 pelo dano máximo nativo no
  ataque corpo a corpo e é consumida também se errar. Livro p.121 e 122.
- Investida Aprimorada: decisão do autor em 06/11, máximo de avanço igual a
  2 × (Movimento + 3 m). Com Movimento 9 m, o máximo é 24 m. O acerto usa BT
  no lugar do +2 da ação comum, Defesa -2 até o próximo turno, com ação completa
  e sem terreno difícil. No acerto há disputa de Atletismo. Livro p.164 e 304.
- Intervenção: no nível de escalonamento de Suporte 4/6/12/18 libera condição
  fraca/média/forte/extrema por 3/6/9/12 PE e Ação Comum. Lê a força resolvida
  do destinatário, inclusive Sangramento variável. Desmembramento é excluído
  pela p.210. Análise Profunda: Percepção contra 15 + ND do alvo, uma descoberta
  no sucesso mais uma por cinco pontos excedentes. Livro p.105 e 107.
- Versatilidade: o bônus próprio com proficiência treinada é comparado com
  a oferta fixa antes de escolher. Não soma BT à oferta fixa vencedora.
  Custa 1 PE e MOD SAB usos pelo descanso único autorizado. Livro p.103.
- Remover os efeitos de um veneno: 4 PER, Ação Bônus, selecionando um uso
  ativo de veneno ou uma marcação avulsa. Treino não reduz o custo. Outros
  venenos mantêm as condições que ainda sustentam. Livro p.190.
- Concentração após deslocamento efetivo: CD 5 + metros movidos. Empurrão
  de Bastão usa 10 + bônus de Atletismo do responsável. O núcleo conserva
  a maior CD pendente e não rola sozinho. Livro p.308 e 320.
- Voadora: 3 PE, dados adicionais d8 iguais ao piso de distância/3 m,
  limitados pelo maior modificador entre Força e Destreza, mínimo zero.
  Usa Investida comum ou Aprimorada e crítico nativo. Livro p.56.
- Mobilidade Avançada: reação após queda real do aliado, avanço disponível
  de metade do Movimento atual em direção a ele. Livro p.105.
- Sobrevivente: abaixo de metade do PV máximo, no início do turno,
  1d6 + MOD CON, mais 1d6 em 8/12/16/20. Não cura Inconsciente, nas Portas
  ou morto. Corpo de Aço conserva sua própria pilha, sem misturar dados de
  outra fonte. Cada elegibilidade lê o começo do turno. Livro p.56 e 120.
- Adepto de Briga: após acerto desarmado sem dano, Ação Livre e metade de
  BT no teste de executar Derrubar/Empurrar. A defesa escolhe Atletismo ou
  Acrobacia e conserva bônus nativo de resistir. Empurrar usa a distância
  base nativa mais 1,5 m por cinco pontos de margem. Livro p.165/300/301.
- Incitar Vigor: 3 PE e Ação Bônus do Suporte. Cura usa os dados escolhidos
  da pilha do destinatário e o MOD CON dele por dado, pelo núcleo de CL2.
  A quantidade não recebe outro teto inventado pela Habilidade. Livro p.108.
- Voto Malevolente dispensa somente o peso adicional do Malefício no
  Emergencial, preservando as regras normais e a reação. Livro p.168/356.
- Técnicas Agressivas de Escudo: Empurrar nativo após ataque no próprio
  turno, Ação Bônus, dano MOD FOR d6 + MOD FOR de impacto na vitória.
  Distância base mais 1,5 m por cinco pontos de margem e, por escolha,
  mais 4,5 m ou Caído. Decisão do autor: Caído conserva o empurrão normal.
  Crítico do teste de Atletismo não dobra o dano. Livro p.165/301.
- Renovação pelo Sangue: um PE por confirmação com crítico acertado em
  inimigo ou abate real, sem exceder o máximo nem recuperar PE temporário.
  Crítico e abate no mesmo ataque continuam sendo um gatilho. Livro p.65.
- Postura da Fortuna: um d20 cru de 1 a BT pode ser repetido uma vez,
  conservando o maior. Limite conjunto de piso(BT / 2) por rodada. Em
  vantagem/desvantagem, a troca de um dado recompõe o maior/menor dos dois,
  preserva os dados extras e só então aplica o mínimo natural. O Ápice
  compartilha o limite com a postura normal. Livro p.76, decisão do Ápice
  de 12/09/2026 preservada. Entrada e duração das posturas próprias abaixo.
- Sentinela: acerto de oportunidade reduz Movimento em 4,5 m até o fim
  do turno do alvo, sem exigir dano positivo e sem acumular a mesma fonte.
  A reação contra quem ataca terceiro a 1,5 m é outro tipo de ataque, sem
  essa redução. Perceber mantém vantagem e duas oportunidades, Sentinela
  sozinho não as concede. Livro p.164, 168, 293 e 365.
- Técnicas de Mobilidade conserva +3 m no Motor. Após atacar o alvo,
  disputa Reflexos com ele uma vez por rodada, sem exigir acerto. No
  sucesso, só esse alvo fica impedido de usar oportunidade contra a
  pessoa protegida. Decisão do autor de 06/11: até o fim do turno em curso,
  também quando atacar como reação fora do próprio turno. Livro p.168.
- Terra e Barreira Inamovível: total positivo no canal
  `imunidadeMovimentoForcado` impede deslocamento involuntário nos
  consumidores de conteúdo, sem reduzir o Movimento numérico. Terra
  exige escolha/postura, o segundo espaço exige Mestre válido, e o Ápice
  segue a decisão das oito posturas com acesso atual. Custo e efeitos
  secundários de Empurrar não são aplicados contra imune. Derrubar sem
  deslocamento continua permitido. Livro p.76 e 121.
- Cair ou sofrer incapacitação encerra os dois espaços de postura no
  escritor de condições e na leitura de sessão antiga. Tirar a condição
  não restaura a postura. O Ápice e PV temporário já concedido são
  conservados. Livro p.76.
- Posturas próprias: entrada com Ação Bônus, ou Livre com Preparação Rápida,
  e um uso do contador já derivado, por dez rodadas. Mestre permite duas
  posturas distintas numa entrada. Autor em 06/11: trocar diretamente
  gasta a ação de entrada e outro uso, reiniciando o prazo. Empurrar
  efetivo encerra ambas sem Preparação Rápida. Livro p.72, 75, 76 e 291.
- Sintonização Vital: piso(cura original antes do teto de PV / 2), limitada
  pelo PV máximo do segundo destinatário. Não exige outra ação, custa
  3 PE e exige outra criatura em 3 m. Decisões do autor de 06/11. Livro p.107.
- Aura Redirecionadora: a segunda jogada recebe 1 + piso(AU / 2) no acerto,
  contra outra criatura em 6 m do primeiro alvo. Imbuir custa 2 PE antes
  da primeira jogada, sem outra ação. Autor em 06/11: a primeira falha
  mantém gatilhos e conta como ataque recebido por A. B recebe sua própria
  confirmação, usando o mesmo projétil e uma única munição. Livro p.177.
- Ação Ágil: 2 PE/Estamina para um uso de Andar, Desengajar ou Esconder,
  sem gastar as ações normais. Lutador por rodada, Restringido por turno.
  Habilidades iguais compartilham o limite e usam a cadência melhor
  disponível, sem devolver o uso ao mudar a fonte. Andar até Movimento,
  Desengajar protege de oportunidades até o fim do turno, Esconder rola
  Furtividade. Livro p.55, 119, 301 a 303 e 365.

- Postura da Lua: Andar e Desengajar como ações livres distintas, uma vez
  por rodada cada, sem PE ou ação normal, no próprio turno. Andar respeita
  o Movimento derivado, Desengajar protege de oportunidade até o fim do
  turno. CL1 conserva a leitura por rodada da lista de Ações da p.300.
  Escolha, Mestre, Imitação e oito posturas do Ápice são revalidados. p.76.
- Concentrar Aura suspende até 1 + AU passivas por uma rodada e soma
  1d8 de dano Energético após acerto por passiva suspensa.
- Postura da Devastação soma +1 no acerto e ignora 2 de RD por
  acerto anterior contra o mesmo alvo. Teto de BT no acerto e dobro
  dele na RD. A troca zera a pilha.
- Medicina Infalível soma BT ao total da cura. A quota é metade do
  nível de Suporte arredondada para baixo mais BT. Cada dado
  maximizado gasta um uso, recuperado no descanso.
- Provocação Desafiadora concede piso de MOD PRE dividido por 2 em usos
  de Provocar como Ação Livre. Recarga de descanso longo. Provocar opõe
  Intimidação a Intuição ou Intimidação em até 9 m.
- Pular usa a faixa impressa de FOR ou DES com Acrobata. CD 15 permite
  usar a faixa seguinte. Força Devastadora soma 3 m, Físico Aperfeiçoado
  acrescenta metade, Estímulo Muscular dobra e o salto livre de Saltador
  usa metade. A tabela ausente fica sem valor automático.
- Saltador Constante: +2 no primeiro ataque contra o alvo ao aterrissar.
  Em acerto, MOD FOR se soma ao dano do tipo-base.
- Aura Drenadora: AU d8 + MOD CON em PV temporário ao matar um inimigo.
  Somar ao saldo da mesma fonte. A morte precisa ser atribuída ao dano.
  Livro p.175.
- Cura em Grupo: alcance 4,5 + 1,5 × ER e teto de PER da linha nativa de
  Energia Reversa. Uma Ação Comum, 2 PE por PER e uma rolagem. A divisão
  declarada conserva o total rolado antes da Herança e dos tetos individuais.
  Livro p.191.
- Dragão: na falha em Fortitude, metade do dano final recebido pelo alvo
  original. Preservar os tipos e aplicar as defesas do inimigo próximo.
  Se as metades por tipo não somarem a metade arredondada do total, a mesa
  distribui o resto. Energia Reversa contra secundário de outra origem
  também aguarda decisão. Livro p.76.
- Especialista em Cortes: reduzir Movimento em 4,5 m após acerto com dano
  cortante final positivo, uma vez por turno em curso. Termina no começo
  do próximo turno de quem aplicou. Duas cópias do mesmo benefício não
  somam, por `grupoNaoAcumula`, p.365. A restrição corpo a corpo pertence
  ao aumento de nível de dano, não à redução opcional da frase seguinte.
  Dano absorvido por PV temporário conta, dano zerado pela RD não. Livro p.167.

### CX2: origens e Anatomias (2026-11-01)

Livro p.27, 31 a 36, 145, 169, 170 e 200. Sem alterar fórmulas base de PV,
PE, progressão ou divergências de Player/Afty.

- Marca reduz 1 PE no Feitiço-base e variações. Familiaridade melhora a
  primeira para 2 PE, ou mantém 1 na ativação e reduz 1 na sustentação.
  Ativação positiva conserva o piso nativo. Sustentação pode chegar a zero.
  Marcas adicionais: `floor(BT / 2)`.
- Zenin conserva os marcos 1, 5, 10, 15 e 20. A modalidade fornece dado
  real, alcance dobrado ou CD aumentada em BT. Decisão do autor em 01/11:
  **um dado no total**, em um efeito/disparo/golpe escolhido. A divisão nativa
  ocorre antes desse dado, e apenas a rolagem escolhida o recebe. Concentrado
  recebe uma vez. Os demais bônus por disparo da p.215 ficam preservados.
  Foco em Dano na Alma integra a criação: +1 dado no pool ou alcance dobrado,
  ambos integrais, sem a metade aplicada aos demais aumentos externos da p.234.
- Manual acrescenta `floor(custoPadrao / 2)` e preserva a redução de recarga
  da Máxima no acesso 5. Antecipado fica fora do orçamento comum. Aprender
  passa a entrada ao orçamento normal e libera o próximo Manual.
- Vigor: usos `1 + [ND >= 4] + [ND >= 8] + [ND >= 12]`. Cada uso cura
  `5 * usosMaximos + ModCon`, mais 5 com Reposição elegível. Vários usos
  multiplicam a cura inteira. Passa pelo estado vital de CL2.
- Energia Antinatural recupera `2 * BT`, limitada ao máximo normal.
  Expansão de Reserva concede ainda `floor(BT / 2)` PE temporários.
- Resiliência reduz um dano em `max(1, floor(ND / 2)) * 5`, com usos BT,
  compartilhados com a prevenção declarada de desmembramento.
- Voo converte a caminhada durante uma rodada, após pagar 1 PE. Usa a base
  atual, multiplicador e condições existentes, com fonte própria.
- Feto soma +2 em Fortitude apenas contra Veneno. Herança reduz cura reversa
  recebida a `floor(valor / 2)`. A cura reversa própria pela Herança usa a
  linha nativa inteira, pagando 2 PE por PER empregado.

Kamo conserva as subidas `ND - 1` e Constituição adicional no nível 10.
Rerrolagem continua dependendo da adoção de PV rolado, que não ocorreu.
Mutante foi cancelado pelo autor e não voltou.

### CX1: metade de Sustentada e Arma Natural (2026-10-29)

Livro p.235 e 365: categorias de Passiva baseadas em Sustentada usam
`floor(valorSustentado / 2)`. Defesa 5 passa de 4 para 3. Defesa 2 usa
metade de 1 e chega a zero, sem emitir bônus. Categorias com tabelas próprias
não mudaram. O cálculo continua consultivo: efeitos já salvos não são
reescritos automaticamente. Custo de PE Máximo preserva a divergência vigente.

Arma Natural, p.35: no Player, o dado base mínimo é 1d8. Se o dado desarmado
resolvido antes da Anatomia supera 1d8, ela acrescenta um nível de dano pelo
Motor. Lutador 10 passa de 1d12 para 1d12 + 1d4, conservando o dano fixo.
No empate em 1d8 não há nível adicional. Na criatura Afty o dado impresso
continua substituído pela fórmula própria, e a melhoria usa o canal
`nivelDano`, com a conversão para ND de dano já adotada para Corpo Treinado.
A origem precisa oferecer Anatomias para que essa escolha tenha efeito.

### Vespa Crabro: consumo de ressonância e Shin (2026-10-25)

Homebrew aprovado pelo autor: cada acerto confirmado de Gungnir gera
`min(BT, cargasDoAlvo + 1)`. Ressonância não é dano automático. Zumbido
consome todas as cargas de um único alvo e rola `min(cargasDoAlvo, BT)d12`
perfurante, Após Ataque, sem multiplicar no crítico. Limite global de uma
utilização por rodada, após acertar Gungnir naquele alvo na rodada atual.
Cada golpe acertado do Golpeador Ferrão Amarelo conta separadamente.
O consumo e a rolagem são uma transição de sessão, com registro no histórico.

Shin é Transformação 5 sustentada, ativada manualmente, não uma conversão
de Sanidade. Usa três espaços de Auxiliar 3 na coluna Duradoura: Ataque +4,
Defesa +4 e RD 11, custo 20 PE e sustentação 5 PE. Exaustão e vagas seguem
o comportamento nativo. Arte da Lâmina Relâmpago é Auxiliar 5 sustentado,
margem de crítico +3 somente na Hwando, com custo 20 PE e manutenção 2 PE.
As receitas das duas armas, os oito modelos e as limitações de mesa estão
em `docs/afty-vespa-crabro.md`. Sem alteração nas tabelas oficiais.

### Fórmulas de dano em blocos de 100 dados (2026-10-17)

Por decisão do autor, o limite do bot vale por termo da expressão, sem teto
para a quantidade total de dados. `110d12` aparece como `100d12 + 10d12`,
e `200d12` como `100d12 + 100d12`, sem termo vazio ao final.

`textoDosDados`, em `src/systems/afty/afty-dano.js`, soma fontes de mesma
face, ordena as faces e divide cada soma em blocos de até 100. A divisão
ocorre depois da multiplicação de dados do crítico. No Raio Negro, conserva
a separação entre dados critáveis e Após Ataque, por exemplo:
`(100d12 + 10d12)/2*3 + 100d6 + 10d6 + 10`.

Fórmulas normal, crítica e de Raio Negro, subtotais do hover e fórmula do
registro de rolagem compartilham essa formatação. O motor interno continua
rolando todos os dados, sem descarte ou mudança no dano fixo. Não há canal
novo ou alteração na DSL. Regressão: `asserts/t-dano-blocos-100.mjs`.

### Estágios dos efeitos da Loja de Catarse (2026-10-25)

Na correção da ficha Chrollo, o autor definiu que a compra de Atributo
aumenta valor e limite. Foram preservadas as duas linhas de +6 que já
estavam no Funcionamento Básico da ficha enviada, migradas para a Catarse
sem duplicação. O limite permanente resultante é 26. O valor final 28
inclui as outras fontes já existentes e foi preservado. Não foi somado
outro +6 sobre o manual que a ficha já continha.

As fórmulas base não mudaram. O texto com Motor da Loja passa pelos estágios
da Técnica, conservando a soma fora do pool exclusivo. Atributo permanente
alimenta os modificadores seguintes, temporário fica fora dos pré-requisitos
e limite de atributo chega antes da aparagem. Concessões de vagas continuam
no montante, antes das escolhas. Contrato em `docs/automacao-dsl.md` e
regressões em `asserts/t-catarse.mjs`.

### Retração de Domínio (2026-10-25)

O pacote `addons/retracao-de-dominio.json`, versão 1.0.0, acrescenta uma
Aptidão que requer Dom 3. É necessário escolher a Aptidão e ativar seu buff
durante o combate. O estado declara `ampliaRecursos: { hp: 20, pe: 20 }`.

A ampliação entra nos máximos finais de PV e PE, depois de todas as demais
fontes, multiplicadores e substituições da aba Cálculos. Para cada recurso:

```
bonus = floor(max(0, maximoFinalSemRetracao) * 20 / 100)
maximoComRetracao = maximoFinalSemRetracao + bonus
atualAoAtivar = min(maximoComRetracao, atualAntes + bonus)
```

Assim, máximos 200 PV e 100 PE passam a 240 PV e 120 PE. A ativação soma
40 PV e 20 PE aos atuais. Se faltavam 60 PV e 30 PE, continuam faltando
60 PV e 30 PE. O ganho ocorre somente na transição desligada para ligada,
sem repetição por novo cálculo ou por ativar o estado já ligado.

Desligar apara os atuais aos máximos restantes, sem descontar o bônus outra
vez. Fim de combate e descanso encerram o estado. Cada nova ativação manual
recebe a diferença novamente, pois o pedido não limitou usos. A Alma não
muda, e a ampliação não volta a alimentar as fórmulas que produziram a base.
Não há custo, duração em rodadas, Exaustão ou canal novo do Motor.

O contrato `ampliaRecursos` aceita percentuais positivos de `hp` e/ou `pe`
em estado `bool` de Aptidão em combate. O `quando: "dom >= 3"` é avaliado
no contexto já com os níveis de Aptidão. O cálculo final e a sessão
compartilham a mesma base para preservar o ganho mesmo no clique que ainda
recebe os máximos derivados antes da ativação.

### Fontes da margem de crítico (2026-10-13)

As linhas de dano e TR publicam `partesMargemCritico`, com a base e as
variações assinadas da margem. O canal fornece redução positiva, por isso
cada fonte aparece negativa no hover. Armas usam sua margem própria como
base. Os escopos e fontes suplantadas são os mesmos do cálculo existente.
Arredondamento e piso de 2 aparecem como parcelas quando aplicados.
Permutas que devolvem margem acrescentam uma parcela positiva somente
quando a troca cabe. Os cálculos e canais existentes permanecem iguais.
Regressões em `asserts/t-critico-fontes.mjs`.

### Quantidade de Especialização e Aptidões Amaldiçoadas (2026-10-10)

Na criatura Afty, Especialização concede `1 + floor(Maestria / 2)` vagas por
compra e pode ser comprada `ceil(Maestria / 2)` vezes. O ganho arredonda para
baixo, e o teto de compras arredonda para cima.

Aptidão voltou ao cálculo anterior, por pedido do autor no mesmo dia: cada
compra concede `1 + Grau Numérico` Aptidões Amaldiçoadas e pode ser feita
`floor(Maestria / 2)` vezes. Grau Numérico é o Grau do Feiticeiro derivado do ND
(Quarto 1, Terceiro 2, Segundo 3, Primeiro 4, Especial 5).

| Maestria | ND | Compras de Especialização | Máximo de Especialização | Compras de Aptidão | Máximo de Aptidões |
|---|---|---|---|---|---|
| 2 | 1 a 4 | 1 | 2 | 1 | 2 |
| 3 | 5 a 8 | 2 | 4 | 1 | 3 |
| 4 | 9 a 12 | 2 | 6 | 2 | 8 |
| 5 | 13 a 16 | 3 | 9 | 2 | 10 |
| 6 | 17 a 20 | 3 | 12 | 3 | 18 |
| 7 | 21 a 25 | 4 | 16 | 3 | 18 |
| 8 | 26 a 30 | 4 | 20 | 4 | 24 |
| 9 | 31 a 35 | 5 | 25 | 4 | 24 |
| 10 | 36 ou mais | 5 | 30 | 5 | 30 |

A tabela considera cada Geral comprada até seu teto, sem outras fontes de vagas.
Subir de ND não compra a Geral automaticamente: quatro compras de Especialização
no ND 35 dão 20 vagas, e as mesmas quatro no ND 36 dão 24. Com cinco compras de
Especialização, são 25 e 30 respectivamente. Quatro compras de Aptidão concedem
24 nos dois níveis, e a quinta compra só vale a partir do ND 36, totalizando 30.
As compras continuam gastando o contador compartilhado de Feitiços e Habilidades Gerais.

As escolhas gravadas são preservadas. Ao baixar o ND, o resolver limita as compras
na leitura e as restaura ao subir. Concessões de sessão continuam gratuitas e fora
do teto de compras. A quinta compra de Aptidão eventualmente gravada no ND 31
fica aparada na leitura até o ND 36, sem apagar a entrada ou as Aptidões escolhidas.
O orçamento de Níveis de Aptidão e a progressão da ficha Player não foram alterados.

Implementação: `afty-gerais.js` calcula o teto e descreve a regra;
`GERAL_EFEITOS`, em `afty-efeitos-conteudo.js`, concede as vagas pelo Motor.
Regressões em `asserts/t-gerais-progressao.mjs`.

### Atenção de Olhinhos Lu (2026-10-12)

Autor confirmou condição corporal e bônus adicional de `teto(3 * cl)`
à Intuição com olhos fechados. `cl` é Controle e Leitura efetivo.
O controle opcional de Atenção com Intuição usa
`10 + Intuição da cópia de Atenção + efeitos diretos de Atenção`.
Essa cópia recebe os efeitos direcionados originalmente à Percepção,
incluindo Talentos e Habilidades Lendárias. Preserva o atributo e o treino
escolhido de Intuição, os bônus próprios e o maior treino concedido.
Não duplica efeitos globais nem converte dados extras em valor passivo.
As linhas reais de Percepção e Intuição não recebem a transferência.
Olhos abertos desativam o bônus corporal e a troca, mesmo que a opção
de Atenção com Intuição ainda esteja marcada. Regra em
`docs/olhinhos-lu-regras.md`, pacote em `addons/olhinhos-lu.json`.
Na versão 1.1.0, os estados vêm diretamente de `creature.combate`, como
no Vislumbre Celeste, e os efeitos emitidos ficam fora do pool exclusivo.
O resumo do card e o painel de Ações leem a mesma fonte mesmo sem Em Combate.

### Acerto Amaldiçoado no Pugilato criado (2026-10-03)

Faixas e Manoplas criadas pela receita `niveis` da Criação de Equipamentos podem
escolher `ataqueId: "amaldicoado"` na entrada do inventário. O item equipado que
define o Ataque Básico fornece essa escolha junto dos seus encantamentos e grau.
A integração de 2026-10-12 preserva a decisão local de 2026-10-04: a escolha
`ataqueBasicoId` da sessão precede a da ficha, e ambas precedem a escolha do item.
O campo do item serve de alternativa somente em fichas antigas sem escolha própria.
A linha usa a jogada Amaldiçoada já resolvida, com seu atributo, escala, Maestria
e fontes, sem duplicar o Bônus de Treinamento. O dano segue a divergência vigente
`danoDoAcertoAmaldicoado`: atributo da jogada na criatura, físico no jogador.
Os escopos `atq:*` e `atq_tipo:*:im` acompanham a jogada escolhida. Sem escolha
própria, receita ou item equipado válido, o básico continua Corpo a Corpo.
A receita permanece válida depois de remover o addon, como as demais contas da arma.

### Expressão de Raio Negro para bot de dados (2026-09-30)

`formulaModoDano` em `src/systems/afty/afty-dano.js` escreve os dados critáveis
já dobrados como `(dados)/2*3`. Dados não critáveis e dano fixo somam por fora.
Exemplo: `(6d8)/2*3 + 1d6 + 5`. O crítico continua `6d8 + 1d6 + 5`.
Esta correção troca somente a representação da fórmula. Na rolagem interna,
o subtotal critável continua somando sua metade arredondada para baixo.

O que estas fórmulas revelam e que contradiz o esquema v0 (`createBlankAfty`):

1. **A criatura Afty usa ND + Patamar + Tipo** — não só "nível + tipo".
   - **ND** (Nível de Desafio) é o driver numérico. 1 → ∞ (aparece `ND>=26`, `ND>=30`).
     Provável que "Nível" (falado antes) == **ND**. Confirmar.
   - **Patamar**: `Lacaio | Comum | Desafio | Calamidade | Maldição` (multiplica HP, libera
     Guarda/Resistência, escala atributos). Note: difere da 2.5.2 (que tinha capanga; aqui
     não, e ganhou "Maldição").
   - **Tipo**: `Combatente | Misto | Conjurador | Restringido` (arquétipo → coeficientes).
2. **Atributos = Força, Destreza, Constituição, Inteligência, Sabedoria, CARISMA** (`Mod.Car`).
   O v0 usou "Presença" — provável que seja **Carisma**. Confirmar.
3. **Alma / Integridade (0–100)** escala TODO o HP: `HP × (Alma.Atual/100)`.
4. **Treinamentos** alimentam pesado quase todo stat (por isso é aba própria, "diferente da
   2.5.2"). O mapa célula→treino está tabelado abaixo.
5. **Inventário** (grau de item equipado) entra em Defesa e RD.
6. **Maestria == Treinamento** (mesmo valor), derivado do ND.
   A tabela: 2 até o ND 4, 3 no 5, 4 no 9, 5 no 13, 6 no 17, 7 no 21, 8 no 26, 9 no 31 e 10 no 36. **Depois do 36
   a Maestria segue subindo um ponto a cada 5 níveis** (`10 + piso((ND - 36) / 5)`: 11 no 41, 12 no 46, 13 no 51),
   para toda ficha, com ou sem Addon (autor, 2026-10-29). Antes o 10 era o teto. O Player só passa de 30 com o
   Nível sem Teto (`nivelJogadorSemTeto`), e a criatura não tem teto de ND.

---

## Variáveis de entrada (inputs)

| Variável | Origem | Valores / notas |
|---|---|---|
| `ND` | escolha | inteiro 1 → ∞ |
| `Patamar` | escolha | Lacaio, Comum, Desafio, Calamidade, Maldição |
| `Tipo` | escolha | Combatente, Misto, Conjurador, Restringido |
| `Alma.Atual` / `Alma.Max` | Integridade | 0–100, Max=100 |
| `Mod.For/Dex/Con/Int/Sab/Car` | derivado dos atributos | modificador |
| `Qnt.PE` | escolha | Muito Pouca, Pouca, Normal, Grande, Muito Grande |
| `Mod.Tecnica` | escolha? | qual atributo a técnica usa (Força/…/Carisma) — **?** |
| `Mod.Tecnica.Numerico` | ? | valor numérico da técnica — **origem?** |
| `Maestria` = `Treinamento` | derivado | ver fórmula abaixo |
| `Percepção` | perícia | (perícias virão depois) |
| `Inventario!AQ14` | item equipado | grau que dá bônus de **Defesa** |
| `Inventario!AQ24` | item equipado | grau que dá bônus de **RD** |
| `Criatura!CN7`, `Criatura!CU9` | ? | usados em Guarda — **origem?** |
| `Z8:Z9`, `Z8:Z13` | ? | `MAIOR()` em Movimento/RD — **conteúdo?** |
| Treinamentos!… (checkboxes) | aba Treinamentos | ver tabela de mapeamento |

> Os termos `+ SE(A1=VERDADEIRO;"Nome do Treino";0)` nas fórmulas **sempre valem 0** — são
> auto-documentação (rótulo que diz qual treino cada célula representa). Podem ser ignorados
> no cálculo; foram usados para montar a tabela de mapeamento abaixo.

---

## Fórmulas (verbatim + decodificadas)

### Fluxo Invencível (decisão de 2026-09-21)

O bônus de luta usa o bônus numérico da jogada normal de Corpo a Corpo na aba Perícias,
com as demais fontes e sem o próprio Fluxo. O dano de cada ataque básico ou arma recebe esse
valor, e o acerto recebe `piso(bonusDeLuta / 2)`. O motor reutiliza `resolveTestes`, respeitando
`rulesVersion`, para não duplicar a fórmula da jogada nem realimentar o bônus.

Enquanto ativo, soma 12 à Defesa e a todos os TRs, 30 à RD Geral e um ataque extra. A margem de
crítico reduz em dois e o crítico recebe dois dados adicionais pelo canal `dadosCritico`, com
o tamanho e a multiplicação já adotados pelo motor de crítico. O texto do catálogo permanece
verbatim. O autor confirmou 6 vigor na ativação e 4 para a segunda rodada, total de 10.
Duração, gasto e exaustão ficam sob controle manual na ficha, sem cobrança ao desligar ou
automatismo de manutenção.

### Ataque Concentrado (decisão de 2026-10-05)

Vale para armas e Ataque Básico nas fichas de Player e de Criatura. Para cada
tamanho de dado, soma os dados elegíveis do ataque original, multiplica pela
quantidade de concentrações, divide por dois e só então arredonda para baixo.
Exemplo: 7d12 com três concentrações soma 3,5 + 3,5 + 3,5 = 10,5, acrescenta
10d12 e termina em 17d12. As concentrações não aumentam a base umas das outras.
Fontes do mesmo tamanho são somadas antes do piso. Tamanhos diferentes conservam
suas faces. O mínimo continua sendo um dado por concentração para o ataque
inteiro, sem repetir esse mínimo em cada fonte ou tamanho adicional.

A classificação do autor, pelos números da lista revisada:

| Números | Fontes incluídas nas metades |
|---|---|
| 1 a 6 | Lutador Superior (também Gêmeos), Autossuficiente, Postura do Sol, Invencível sob o Sol, Arsenal Cíclico e Mestre do Arremesso |
| 7 a 11 | Potente, Sintonizada, Aura Elemental, Caçador de Feiticeiros e Foco no Inimigo |
| 12 e 13 | Feitiço Auxiliar Durante Ataque que dure pelo menos uma rodada e Transformação Durante Ataque |
| 14 a 16 | Golpe Especial Atroz, Pistoleiro Iniciado/Avançado e Execução Silenciosa |
| 26 a 30 | Crítico Potente, Destruidora, Mortal, Fatal e Fluxo Invencível, apenas no modo em que o bônus de crítico existe |
| 31 e 32 | Dados adicionais da Azamaru reunida e de Consumir Cinzas |

Ficam fora das metades: Ajuste, Desarme, Quebra Crânio, Ataque Furtivo,
Arremetida Encoberta, Golpe Impactante, dados do Aliado, Canalizar em Golpe
(inclusive Avançada e Máxima), Canalizar Energia Reversa e Auxiliar de um único
golpe. Seus dados continuam sendo somados uma vez ao ataque, conforme sua própria
regra. Danos Após Ataque e dano fixo não entram nas metades. O dado de Postura do
Sol não é repetido quando Invencível sob o Sol já o fornece.

Os modos normal e crítico têm cálculos separados. Bônus exclusivos do crítico
entram nas metades apenas no crítico e no Raio Negro. A dobra ocorre depois das
metades; Fatal também conserva a mudança de tamanho apenas nesses modos.

O motor aplica esta etapa em `afty-ataque-concentrado.js`, depois de Auxiliares,
Sintonizada e Aptidões. `dadosConcentraveis` conserva a quantidade elegível quando
um grupo mistura fontes incluídas e excluídas; `concentra: false` exclui grupos de
um golpe. `dadosCritico` guarda a quantidade alternativa de um grupo no crítico,
usada tanto nas fórmulas quanto na rolagem.

### Alma / Integridade
⚠ DESDE 2026-11-09 a Alma da criatura segue o livro (p.311), igual à do Player: é uma pilha do tamanho do PV máximo.
A fórmula abaixo (`Alma.Max = 100`, escala o HP) é a do Addon `alma-do-afty`, que as fichas de criatura antigas já
carregam ligado. Os Estados da Alma (p.312) são automáticos nos dois regimes (`afty-alma-estados.js`).

`Alma.Max = 100`. `Alma.Atual` = valor corrente (0–100). Escala o HP.

### HP.Max
```
=(Alma.Atual/100)*((
  SWITCH(Tipo;"Combatente";12 + ((ND-1)*6);"Misto";10 + ((ND-1)*5);"Conjurador";10 + ((ND-1)*5);"Restringido";12 * ND)
  +(ND * Mod.Con)
  +SE(Treinamentos!AS17;4;0)   // Treino de Resistência - 1ª Etapa
  +SE(Treinamentos!AS18;5;0)   // Treino de Resistência - 2ª Etapa
  +SE(Treinamentos!AS20;6;0)   // Treino de Resistência - 4ª Etapa
  +SE(Treinamentos!AS20;10;0)  // Treino de Resistência - Completo  ⚠ AS20 repetido
)*2)*SWITCH(Patamar;"Calamidade";1,5;"Maldição";2;1)
```
Decodificado:
```
base = Tipo==Combatente ? 12+(ND-1)*6
     : Tipo∈{Misto,Conjurador} ? 10+(ND-1)*5
     : Restringido ? 12*ND
treinoRes = 4·[Res1ª] + 6·[Res4ª] + 10·[ResCompleto]   (ver Treinamentos)
HP = (Alma.Atual/100) × (base + ND·Mod.Con + treinoRes) × patamarMult
```

> ⚠ **patamarMult ATUALIZADO pelo autor (2026-07-16).** A planilha tinha um `×2` fixo multiplicado
> por `{Comum 1, Desafio 1, Calamidade 1,5, Maldição 2}`, o que dava um efetivo de **2 / 2 / 3 / 4**
> sobre a base: Desafio, Calamidade e Beyond já estavam certos, mas o **Comum empatava com o
> Desafio**. O `×2` era, na prática, o multiplicador do Desafio.
>
> **Regra atual** (`HP_PATAMAR_MULT` em `afty-derive.js`): o `×2` foi absorvido no multiplicador,
> que agora é aplicado direto sobre a base. Só o Comum mudou de valor (caiu pela metade).
>
> | Patamar | Comum | Desafio | Calamidade | Beyond |
> |---|---|---|---|---|
> | ×HP | 1 | 2 | 3 | 4 |
>
> O termo de Treinamento fica dentro do parêntese, então escala junto: Resistência 1ª (+4 na base)
> dá +4 no Comum, +8 no Desafio, +12 na Calamidade e +16 no Beyond.

> **Multiplicador de PV por Addon (2026-09-18).** Depois de tudo isso o PV ainda é multiplicado
> pelo canal `hpMult` (`max(1, soma das fontes)`), que só um Addon com a primitiva `pvEPassivas`
> emite. Sem fonte o valor é 1 e nada muda. Como ele entra depois da Alma, a Integridade da Alma
> da ficha de jogador, que é igual ao PV, acompanha.

### PE.Max
```
=SWITCH(Tipo;"Combatente";4*ND;"Misto";5*ND;"Conjurador";6*ND;"Restringido";4*ND)
+SWITCH(Qnt.PE;"Muito Pouca";-ND;"Pouca";-ARREDONDAR.PARA.BAIXO(ND/2);"Normal";0;"Grande";+ARREDONDAR.PARA.BAIXO(ND/2);"Muito Grande";+ND)
+Mod.Tecnica.Numerico
+SE(Treinamentos!AA5;1;0)   // Compreensão 1ª
+SE(Treinamentos!AA7;2;0)   // Compreensão 3ª
+SE(Treinamentos!AJ5;2;0)   // Controle de Energia 1ª
+SE(Treinamentos!AJ7;3;0)   // Controle de Energia 3ª
+SE(Treinamentos!AJ17;2;0)  // Potencial Físico 1ª
+SE(Treinamentos!AJ19;4;0)  // Potencial Físico 3ª
```

> **Passivas sem custo por Addon (2026-09-18).** Na ficha de jogador cada Passiva tira o dobro do
> nível dela do PE Máximo (`passivaCustaPeMaximo`). O canal `passivaSemCusto`, emitido por um Addon
> com a primitiva `pvEPassivas`, zera essa subtração para TODA Passiva (inclusive a ocular), no PE
> Máximo, no hover do PE e no custo que a linha de cada Feitiço carrega.

### Maestria / Treinamento (mesmo valor)
```
=IFS(ND>=26;8;ND>=21;7;ND>=17;6;ND>=13;5;ND>=9;4;ND>=5;3;ND>=1;2)
```

### Guarda Inabalável — IMPLEMENTADA em 2026-08-26

```
=SWITCH(Patamar;
 "Lacaio";0;"Comum";0;"Desafio";0;
 "Calamidade";SE(Criatura!CN7>=0;SWITCH(Criatura!CU9;0;5;1;3;2;1;3;0;4;0;5;0);0);
 "Maldição";  SE(Criatura!CN7>=0;SWITCH(Criatura!CU9;0;10;1;8;2;6;3;4;4;2;5;0);0))
```
Decodificado: só Calamidade/Maldição têm Guarda; se `CN7>=0`, valor por índice `CU9` (0–5):
- Calamidade: [5,3,1,0,0,0]; Maldição: [10,8,6,4,2,0].

> ⚠ **O texto da regra chegou em 2026-08-26 e a tabela acima é ele.** O `CU9` é o **contador de
> golpes sofridos** e o `CN7` é a Vida Temporária da Guarda, e as duas escadas são "começa em 5 (ou
> 10) e cai **2 por golpe**, com piso em zero". A implementação REPRODUZ a tabela, e há assert
> medindo os dois degraus a degrau.
>
> **Regra completa**, verbatim do autor:
>
> *"inimigos de patamar Calamidade receberão um aumento de +5 na sua CA e em TRs no início da*
> *rodada, o qual será reduzido em 2 a cada ataque ou habilidade que ele sofra, independentemente de*
> *ser atingido, falhar ou ter sucesso no TR. Para inimigos de patamar Beyond, o aumento temporário*
> *em CA e TRs será de +10, também sendo reduzido a cada golpe. O bônus se encerra previamente com a*
> *realização de um Raio Negro, a aplicação das condições Desprevenido, Desorientado, Confuso,*
> *Incapacitado, Exposto, Fragilizado, Atordoado, Paralisado ou Inconsciente ou a perda dos PVs*
> *temporários recebidos por essa característica."*
>
> *"A Guarda possui 5 x ND de Vida Temporaria para Inimigos Calamidade e 10 x ND para Inimigos*
> *Beyond. E, caso a Vida Temporaria da Guarda chegue a 0, a guarda é quebrada perdendo seus*
> *efeitos."*
>
> | O que | Calamidade | Beyond |
> |---|---|---|
> | bônus de CA e dos 5 TRs | +5 | +10 |
> | Vida Temporária | 5 × ND | 10 × ND |
> | queda por golpe sofrido | 2 | 2 |
>
> **As decisões do autor** (2026-08-26) que fecharam o comportamento de mesa:
> 1. as duas metades **voltam cheias a cada rodada**;
> 2. a Vida entra no **mesmo pote do PV Temporário** e **acumula** com as outras fontes dele;
> 3. enquanto durar a condição perde o bônus **e** a Vida, e depois volta no início da rodada;
> 4. **"Incapacitado" foi retirada** do sistema, então são **oito** condições e não nove;
> 5. ⚠ **o bônus chegando a zero pelos golpes TAMBÉM quebra a Guarda**, e quebrar faz o PV
>    Temporário se perder. São **3 golpes** no Calamidade e **5** no Beyond, e é o caminho normal de
>    derrubá-la: é o que faz a característica "exigir trabalho em equipe".
>
> ⚠ **A escada de números NÃO muda com a decisão 5.** O degrau em que ela chega a zero é justamente
> o degrau em que a Guarda quebra, então a tabela da planilha continua exata. O que muda é o que
> acontece com a casca naquele degrau.
>
> Em `afty-derive.js` o teto sai em `derived.guarda`, e o corrente vem da sessão por `opcoes.guarda`.
> Os canais `guardaBonus` e `guardaVida` mexem nas duas metades.

### Resistência Parcial: REMOVIDA do Afty pelo autor (2026-09-21)

⚠ **Não existe mais no Afty**, nem na criatura nem no jogador (no jogador ela já não existia desde
2026-08-30). Saíram o número, o hover, a linha da aba Cálculos, as células do Preview, da Ficha
Final e do Encontro, o chip de Buff e o canal `resParcial` do Motor, que estava declarado e nada
lia. A Grimório 2.5.2 continua com a dela. A tabela abaixo fica como registro da regra que valeu
de 2026-07-16 a 2026-09-21.

A planilha antiga era gambiarra (base 2/4 + limiares de ND {15,20,25,30}). **Regra de 2026-07-16:**

| Patamar | Ganha +1 em | Faixa |
|---|---|---|
| Comum | — | 0 |
| Desafio | — | 0 |
| Calamidade | ND 10, 20, 30 | 0 a 3 |
| Beyond | ND 1, 10, 20, 30 | 1 a 4 |

Era implementada em `afty-derive.js`. Como `nd` tem piso 1, o limiar de ND 1 do Beyond era constante.

<details><summary>Fórmula antiga da planilha (histórico)</summary>

```
=SWITCH(Patamar;"Lacaio";0;"Comum";0;"Desafio";0;
 "Calamidade";2 + SE(ND>=15;1;0)+SE(ND>=20;1;0)+SE(ND>=25;1;0)+SE(ND>=30;1;0);
 "Maldição";  4 + SE(ND>=15;1;0)+SE(ND>=20;1;0)+SE(ND>=25;1;0)+SE(ND>=30;1;0))
```
</details>

### Movimento
```
=9 + (MAIOR(Z8:Z9;1) * 1,5)
+SE(Treinamentos!I5;1,5;0)   // Agilidade 1ª
+SE(Treinamentos!I8;4,5;0)   // Agilidade Completo
```

No Afty derivado, os bônus aditivos do Motor entram nessa base antes de `movimentoMult`. Uma
Expansão de Domínio ativa usa multiplicador 2, portanto dobra o resultado final dentro da expansão.

### RD.Geral
```
=SWITCH(Tipo;
 "Conjurador";SE(ND>=10;ARREDONDAR.PARA.BAIXO(ND/2);0);
 "Misto";SE(ND>=10;ND;ARREDONDAR.PARA.BAIXO(ND/2));
 "Combatente";SE(ND>=10;MAIOR(Z8:Z13;1);0) + ND;
 "Restringido";SE(ND>=10;MAIOR(Z8:Z13;1);0) + ND)
+SWITCH(Inventario!AQ24;"Sem Grau";0;"Quarto Grau";1;"Terceiro Grau";2;"Segundo Grau";3;"Primeiro Grau";4;"Grau Zero";5;"Grau Especial";10)
```

### RD.Específico
```
=SWITCH(Tipo;
 "Conjurador";Mod.Tecnica.Numerico;
 "Misto";SE(ND>=10;2*Mod.Tecnica.Numerico;Mod.Tecnica.Numerico);
 "Combatente";0;"Restringido";0)
```

### CD
```
=10 + SWITCH(Tipo;"Combatente";INT(ND/1,75);"Misto";INT(ND/1,5);"Conjurador";INT(ND/1,25);"Restringido";INT(ND/1,75))
   + (SWITCH(Mod.Tecnica;"Força";Mod.For;"Destreza";Mod.Dex;"Constituição";Mod.Con;"Inteligência";Mod.Int;"Sabedoria";Mod.Sab;"Carisma";Mod.Car) + Maestria)
```

### Atenção
`= 10 + Percepção`  *(perícias virão depois)*

### Defesa / CA (mesmo valor)
```
=10 + SWITCH(Tipo;"Combatente";INT(ND/1,25);"Misto";INT(ND/1,5);"Conjurador";INT(ND/1,75);"Restringido";INT(ND/1,25))
   + Mod.Dex + Maestria
+SWITCH(Inventario!AQ14;"Sem Grau";0;"Quarto Grau";1;"Terceiro Grau";2;"Segundo Grau";3;"Primeiro Grau";4;"Grau Zero";5;"Grau Especial";6)
+SE(Treinamentos!I17;3;0)   // Luta 2ª
```

### Grau da criatura (Grau do Feiticeiro)

Não está na planilha: sai do ND por faixa. Nove degraus desde 2026-08-19 (antes eram 5).

| ND | Grau | ordem | rank |
|---|---|---|---|
| 1 a 4 | Quarto Grau | 1 | 1 |
| 5 a 8 | Terceiro Grau | 2 | 2 |
| 9 a 12 | Segundo Grau | 3 | 3 |
| 13 a 16 | Primeiro Grau | 4 | 4 |
| 17 a 20 | Semi-Grau Especial | 5 | 5 |
| 21 a 25 | Baixo Grau Especial | 6 | 5 |
| 26 a 30 | Alto Grau Especial | 7 | 5 |
| 31 a 35 | Calamidade | 8 | 5 |
| 36+ | Divino | 9 | 5 |

> ⚠ O **`rank` para no 5** (autor, 2026-08-19). Ele é o número que as fórmulas leem (orçamento de
> Perícias e TR, e a variável `grau` do DSL), e os quatro graus acima do Semi-Grau Especial são nome
> e faixa de ND, e não número novo. Para comparar dois graus, use `ordem`.
>
> O **Grau de Equipamento** da Ferramenta Amaldiçoada é outra escada, com 5 degraus e sem faixa de
> ND: ver `AFTY_GRAUS` em `afty-equipamentos.js`.

### Total.Aptidão (nº de níveis de Aptidão)
```
=SE(ND>=2;1;0)+SE(ND>=4;1;0)+SE(ND>=6;1;0)+SE(ND>=8;1;0)+SE(ND>=10;2;0)
+SE(ND>=12;1;0)+SE(ND>=14;1;0)+SE(ND>=16;1;0)+SE(ND>=18;1;0)+SE(ND>=20;2;0)
+SE(Qnt.PE="Muito Grande";1;0)   // Raio Negro
+SE(Treinamentos!R6;1;0)    // Barreiras 2ª
+SE(Treinamentos!AA6;1;0)   // Compreensão 2ª
+SE(Treinamentos!AA8;1;0)   // Compreensão Completo
+SE(Treinamentos!AJ8;1;0)   // Controle de Energia 4ª
+SE(Treinamentos!AA18;1;0)  // Energia Reversa 2ª
```

O total acima é orçamento permanente. Bônus temporário de nível não gasta esse total. A Expansão de
Domínio ativa soma 2 ao nível efetivo e ao limite de Aura, Controle e Leitura e Energia Reversa,
somente nas trilhas que já possuem ao menos Nível 1. Barreira e Domínio não recebem esse bônus.

> ⚠ **ESTENDIDA ALÉM DO ND 20 APENAS NO GRIMÓRIO AFTY pelo autor (2026-08-12).** A tabela da planilha para no 20, e o
> orçamento parava junto. No Afty ele **continua rendendo 1 nível a cada 2 ND** a partir do 20, ou
> seja, nos ND 22, 24, 26, 28, 30, 32 e daí para cima sem fim (o ND do Afty não tem teto).
>
> ```
> Total.Aptidão += PISO((ND - 20) / 2)     // 0 abaixo do ND 22
> ```
>
> Os ND ímpares não rendem nada, e o `+2` do ND 20 continua onde estava. Confere: ND 20 = 12,
> ND 22 = 13, ND 30 = 17, ND 36 = 20. Em `afty-derive.js` é a constante `aptidaoAlem20`.
> Na Ficha de Player, o último marco que concede pontos por nível é o Nível 20 (autor, 2026-09-13).

### Total.Atributos (pontos de atributo)
```
=76 + SWITCH(Patamar;"Maldição";4;3)
   + (ARREDONDAR.PARA.BAIXO(ND/4) * SWITCH(Patamar;"Lacaio";1;"Comum";2;"Desafio";2;"Calamidade";3;"Maldição";3))
+SE(Treinamentos!AJ18;2;0)   // Potencial Físico 2ª
+SE(Treinamentos!AJ29;1;0)+SE(Treinamentos!AJ30;1;0)+SE(Treinamentos!AJ31;1;0)+SE(Treinamentos!AJ32;1;0)  // Treino de Atributo 1 (1ª–4ª)
+SE(Treinamentos!AS29;1;0)+SE(Treinamentos!AS30;1;0)+SE(Treinamentos!AS31;1;0)+SE(Treinamentos!AS32;1;0)  // Treino de Atributo 1 (1ª–4ª) ⚠ 2º bloco também rotulado "Atributo 1"
```

---

## Mapa célula → Treinamento (extraído dos rótulos `A1`)

| Célula | Treino | Efeito |
|---|---|---|
| AS17 | Resistência 1ª | +4 HP |
| AS18 | Resistência 2ª | +5 HP |
| AS20 | Resistência 4ª | +6 HP |
| AS20 ⚠ | Resistência Completo | +10 HP (célula repetida — provável typo) |
| AA5 | Compreensão 1ª | +1 PE |
| AA6 | Compreensão 2ª | +1 Aptidão |
| AA7 | Compreensão 3ª | +2 PE |
| AA8 | Compreensão Completo | +1 Aptidão |
| AA18 | Energia Reversa 2ª | +1 Aptidão |
| AJ5 | Controle de Energia 1ª | +2 PE |
| AJ7 | Controle de Energia 3ª | +3 PE |
| AJ8 | Controle de Energia 4ª | +1 Aptidão |
| AJ17 | Potencial Físico 1ª | +2 PE |
| AJ18 | Potencial Físico 2ª | +2 Atributos |
| AJ19 | Potencial Físico 3ª | +4 PE |
| AJ29–32 | Atributo 1 (1ª–4ª) | +1 Atributo cada |
| AS29–32 | "Atributo 1" (1ª–4ª) ⚠ | +1 Atributo cada (2º bloco, rótulo duplicado — Atributo 2?) |
| I5 | Agilidade 1ª | +1,5 Movimento |
| I8 | Agilidade Completo | +4,5 Movimento |
| I17 | Luta 2ª | +3 Defesa |
| R6 | Barreiras 2ª | +1 Aptidão |

---

## Respostas do autor (2026-07-15) — RESOLVIDO

1. **Nível == ND** (Nível de Desafio). ✅
2. **Patamares = {Comum, Desafio, Calamidade, Beyond}** — **SEM Lacaio** (corrigido; a
   > ⚠ RENOMEADO (2026-07-16): o patamar antes chamado **"Maldição"** agora se chama **"Beyond"**,
   > no rótulo E na chave interna (`value: "beyond"`, lido em `deriveAfty`). As fórmulas transcritas
   > mais abaixo ainda dizem `"Maldição"` porque são a cópia literal da planilha do autor: onde se lê
   > Maldição na planilha, o código usa `beyond`.
   fórmula da Guarda ainda cita Lacaio, mas ele não existe no modelo final). ✅
3. **6º atributo = Presença** (`Mod.Car` é só o nome antigo — usar `presenca`). ✅
4. **Alma/Integridade** = "Integridade da Alma". Vai de 0 a **100+** (poderes aumentam).
   Multiplicador linear de HP: `HP × (Alma.Atual/100)`. 50 → metade; 150 → 1,5×. Default 100. ✅
5. **Mod.Técnica** = modificador do **atributo de CD**, escolhido por ficha. **Mod.Técnica.Numérico**
   era gambiarra (texto→número); no app é só `mod(atributo_da_técnica)`. ✅
6. **Qnt.PE** = escolha por ficha (Muito Pouca…Muito Grande). ✅
7. **Z8:Z9** = maior entre Mod.Força e Mod.Destreza. **Z8:Z13** = maior modificador de atributo
   geral (dos 6). ✅
8. **`Inventario!AQ14`/`AQ24`** = grau do item equipado (Defesa/RD). ✅

### ADIADO (anotado, não implementar ainda)

- **Contribuições de TREINAMENTO** — ⚠ PARCIALMENTE IMPLEMENTADO (2026-07-15). O catálogo
  `afty-treinamentos.js` já existe e `deriveAfty` soma as contribuições via `resolveTreinoEfeitos`
  (canais HP/PE/Movimento/Aptidão/Defesa). Trilhas catalogadas: Agilidade, Barreiras, Compreensão,
  Controle de Energia, Domínios. Faltam Resistência, Potencial Físico, Atributo 1/2, Luta,
  Energia Reversa (o autor vai enviar). **DIVERGÊNCIA a confirmar:** o mapa célula→treino abaixo
  (extraído da planilha) diz Compreensão 1ª=+1 PE, 3ª=+2 PE e 2ª=+1 Aptidão; as TABELAS enviadas
  pelo autor dizem 1ª=+2 PE, 3ª=+3 PE e 2ª=bônus de perícia (sem Aptidão). O código seguiu as
  TABELAS (fonte mais recente). A planilha pode estar desatualizada — confirmar com o autor.
  **Mesma divergência no Treino de Luta:** planilha (I17) dizia Luta 2ª = +3 Defesa; a TABELA diz
  +2 Defesa. Código seguiu a TABELA (+2). Confirmar.
- ~~**GUARDA**~~ ✅ **RESOLVIDO em 2026-08-26.** O autor mandou o texto da regra e respondeu as
  quatro perguntas de comportamento. Ver a seção Guarda Inabalável acima.
- **Perícias** → Atenção usa Percepção = 0 provisoriamente.
- **Grau de item** vem do Inventário (ainda não construído): lido de
  `creature.inventario.{defesaGrau,rdGrau}`, default "Sem Grau" (0).
- Typos (AS20 duplicado; 2º bloco AS29–32) — irrelevantes por ora (são de Treinamento).

> **Status:** `afty-derive.js` e `createBlankAfty` já implementam TODAS as fórmulas acima
> (menos os itens ADIADOS). Verificado com valores conferidos à mão.

## Bloodfeast (2026-10-01)

Com a primitiva bloodfeast, PE utilizável é zero. PV máximo recebe três vezes
PE final após todas as fontes e multiplicadores, depois desconta custoPV das
passivas selecionadas. A conversão não volta a passar pelos multiplicadores de
PV. Custos e sustentação em PE multiplicam por três. Custo próprio limita perda
a PV atual menos um, excedentes completos de três geram um ponto de Sanidade.
Dano inimigo e perda por Bleed não usam esse piso. Bleed perde cargas vezes ações,
sem consumir cargas, e somente PV efetivamente perdido gera Bloodfeast.
Limite aplicado pelo causador: min(80, BT vezes 10), nível 30 usa 99.
Ciclagem guarda metade do PV efetivamente pago, arredondada para baixo, após TR
Fortitude CD 10 mais quatro vezes nível. Regeneração abaixo da metade: 2d8 mais
Constituição. Poder do Sangue usa metade do BT abaixo da metade dos PV, BT inteiro
abaixo de um quarto. Mircalla manifestada cura floor(nível/2)d10 por evento de
dano de técnica confirmado, independente de Hemofagia 7d8.

## Grande Roda do Dharma (2026-10-07)

Cura de Geral ao passar de cinco para seis giros:
`min(danoAcumulado, max(0, ND * ModCon))`, limitada ainda aos PV máximos.
Exemplo confirmado: ND 30 e ModCon 10, teto 300. O sexto giro não se repete
nem cura novamente na rodada seguinte. O dano acumulado é separado por fonte.

Defesa: RD de `BT` a partir de dois giros, cura de `2 * BT` ao
encerrar cada turno com dano registrado, uma vez por tipo no turno. A partir
do sexto giro, cada exposição registrada cura `3 * BT`, mesmo com dano zero.
O botão de dano registra o evento, sem subtrair novamente os PV da barra.
Ataque acrescenta `2 * BT` ao acerto desde o segundo giro. Os sextos giros
de Ataque e Existência somam `2 + 2` dados contra o mesmo alvo selecionado.

Acúmulo confirmado pelo autor em 2026-10-07: Geral e Defesa somam suas RDs
quando o ataque pertence ao fenômeno selecionado e ao tipo de dano adaptado.
A fórmula final confirmada é `2 * BT + BT`, somando `3 * BT`.
Geral concede dobro do BT e Defesa concede BT, desde o segundo giro.
Com BT 6, soma 18 RD. Com BT 8, soma 24 RD. Esses valores substituem
os do texto original, preservado em `docs/grande-roda-dharma-regras.md`.
<!-- Talentos de Estilo, 2026-10-25: as fórmulas base não mudaram. A troca
     de atributo de uma habilidade acontece nas expressões dos efeitos dela,
     antes da avaliação normal. Ver docs/afty-talentos-de-estilo.md e
     docs/automacao-dsl.md. A habilidade própria é concedida sem segunda vaga. -->

## Servos da Guerra (2026-11-05)

Homebrew exclusivo das criaturas Afty com o addon. O PE máximo calculado é 3 × BT, exceto para Archer,
que mantém o PE normal. Saber distribui 6 pontos e aumenta o limite de cada atributo pela parcela
recebida. O treino nativo admite até duas aquisições por atributo, cada uma com etapas e custo próprios.

ManaBurst compra até BT dados por 1 PE cada, Após Ataque e fora do crítico. Escalonamento compra
dados por 2 PE cada, Durante Ataque e critáveis, até o nível da habilidade ou o acesso máximo no ataque
básico ou com arma. A face vem da fonte. Berserker usa piso do dano final × 1,5, incluindo fixo
e Após Ataque. Assassin aumenta o multiplicador dos dados critáveis em 1.

O Caster paga 20 PE uma vez na criação. O raio inicial e o ganho por dia inteiro de concentração
são iguais ao nível de Domínio em metros. O raio máximo é 10 × (nível de Domínio + 1 + aumentos).
Cada aumento de tamanho concede 10 metros de teto. O raio atual é o menor entre o máximo e
nível de Domínio × (1 + dias concluídos). A área permanece fixa e sem vida. Efeitos escolhidos
usam as tabelas de Expansão e admitem duas escolhas iguais dentro do orçamento normal. Restrições
concedem efeitos ou tamanho extra registrados pela mesa. Dentro aplica os efeitos, Fora os desliga.

## Itens e treinos na Guilda (2026-11-09)

Na ficha com `mesa: "eradeouro"`, criatura e personagem.

- **Limite de Acessórios equipados** = 4 + soma do `limiteAcessorios` dos Talentos da ficha (Costas Largas, +2).
  Conta os Acessórios equipados na ordem do inventário, as cópias repetidas inclusive. Arma, escudo e uniforme ficam
  fora. O que passa do limite não dá efeito nenhum.
- **Treino de Testes de Resistência**: no máximo 2 instâncias (2 TRs). As instâncias além do teto não rendem efeito
  nem cobram Foco.
- **4ª etapa do Treino de Perícia** = `piso(bt / 2)` na perícia escolhida, no lugar do sucesso garantido (remendo do
  pacote nativo Regras da Era de Ouro).

## Nível do personagem da Guilda (2026-11-09)

Só no personagem com `mesa: "eradeouro"` (rota /EraDeOuro). A Criatura da Guilda segue o ND digitado.

- **Nível** = o maior nível da `PROGRESSAO_ERA_DE_OURO` cujo XP é menor ou igual ao XP total da
  Carteira. Zero de XP é o Nível 1, e o teto é o 20 (1250). Quem responde é o `nivelDaFicha`, que vem
  antes da tabela do addon Carteira da Guilda.
- **XP no Fim de Semana** = XP da Missão ou do Evento vezes 1,5, em duas casas, SEM `floor` (decisão
  do autor). O Ichibuban e os Focos de Interlúdio não mudam.
- **Focos** = soma dos Focos de Interlúdio anotados, no lugar do campo do jogador, mais o canal `focos`.
- **Maestria** e **Grau** seguem as fórmulas de sempre. Do 17 ao 20 o grau se chama Grau Especial, com
  o mesmo rank do Semi-Grau Especial.
