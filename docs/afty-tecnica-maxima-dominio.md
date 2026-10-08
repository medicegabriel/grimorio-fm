# Técnica Máxima e Expansão de Domínio

Guia da área. As duas são criadas em **Feitiços → Especial → Tipo de Especial**, nos dois sistemas
(`/Afty` e `/Player`). O lugar é decisão de TELA: a Técnica Máxima continua sendo um Feitiço da
natureza dela, e a Expansão de Domínio continua morando em `creature.dominios`.

Fontes, em ordem de precedência:

1. as decisões do autor abaixo (2026-10-08);
2. o Livro 2.5.2: Técnica Máxima (Aptidões Especiais), Aptidões de Domínio, Regras sobre
   Domínios, Exaustão de Técnica, Resistência de Expansões e o Guia de Criação de Expansão de
   Domínio;
3. as decisões antigas registradas em `afty-status.md` (domo de 12 paredes, Conflito, canais do
   Treino de Domínios).

## A REGRA EM VIGOR (2026-10-08)

### Regras gerais que o Livro já resolve

| Ponto | Regra |
|---|---|
| Arredondamento | toda divisão arredonda PARA BAIXO, salvo texto em contrário. Vale para a recarga da Técnica Máxima e para o Fortalecer |
| Condições do Efeito Ambiental | Gerência de Dano por Condições: Fraca custa 1 dado, Média 3, Forte 5. DOM 1 dá 2 dados (só Fracas), DOM 2 dá 4 (até Médias), DOM 3 dá 6 (até Fortes), DOM 4 dá 8, DOM 5 dá 12. Extrema nunca |
| Execução da Expansão | Ação Comum, duas mãos livres e capacidade de fala |

### Decisões do autor

| ID | Decisão |
|---|---|
| DA-01 | A Técnica Máxima é identificada por `nivel: "max"`, sem um segundo campo de identidade. O `tipo` é a natureza verdadeira do Feitiço. A escala do cálculo é derivada e não muda a identidade |
| DA-02 | Técnica Máxima gravada ANTES desta implementação (Addons, Oda, Honnō-ji, fichas antigas) continua LEGACY: calcula e gasta orçamento como antes, sem conversão automática. A Técnica Máxima nova oficial exige a Aptidão `tecnica_maxima` e usa o orçamento exclusivo. Addon novo não ganha Técnica Máxima só por usar `nivel: "max"`: a concessão é explícita, pelo canal `vagasTecnicaMaxima` |
| DA-03 | As TABELAS seguem a escala. As regras que dizem "caso seja uma Técnica Máxima" seguem a IDENTIDADE |
| DA-04 | Naturezas permitidas: Dano, Auxiliar, Curativo, Golpeador, Dano na Alma, Shikigami, Transformação e Invisibilidade. Personalizado é opção manual, com AVISO de aprovação do Narrador. Passivo e Criação de Itens são proibidos (sem estrutura de uso e sem linha no Livro) |
| DA-05 | Recarga = `6 − piso(BT / 2)`, com mínimo 0 |
| DA-06 | Reduções e aumentos genéricos de custo de Feitiço valem sobre a base de 25 PE, e as reduções específicas de Técnica Máxima também. O piso geral de custo continua |
| DA-07 | Na escala de Nível 5, o orçamento de criação (Múltiplos Efeitos) é o de Nível 5 (20). O custo real continua 25 |
| DA-08 | A Ficha tem a ação Usar: confere disponibilidade, requisito e PE, gasta o custo final, rola e inicia a recarga. No Shikigami a recarga fica aguardando a dissipação. A recarga desce pelas rodadas da sessão, não some no fim do combate, aceita ajuste manual e zera no descanso |
| DA-09 | O requisito "Capacidade de Conjurar Feitiços Nível 4" é checado de verdade (`nivelFeitico`), pelo mesmo cálculo de acesso da ficha, junto do Mestre em Feitiçaria |
| DA-10 | A Expansão é Ação Comum |
| DA-11 | Sem Barreiras oficial: sem domo, sem PV de domo, sem Totem e sem `9 m × BT`. O Livro dá só "alcance superior para o Acerto Garantido", e a tela diz isso sem inventar número. A ficha LEGACY que dependa do Totem ou do `9 × BT` fica como estava |
| DA-12 | Fortalecer, no lugar de um efeito novo, soma `piso(base / 2)` do valor BASE, uma vez por fortalecimento, sem composição. Cada fortalecimento ocupa 1 vaga e pode repetir com outra vaga. Efeito sem número fortalecível vira AVISO e mesa |
| DA-13 | A CD da Amplificação de Técnica vale só nos Feitiços (escopo `feitico`), nunca na CD de Aptidão ou de Habilidade |
| DA-14 | Acerto Garantido é proibido na Incompleta |
| DA-15 | Em Confronto e em Confronto Estendido não vale nada da Expansão (benefícios gerais, efeitos e Acerto Garantido). O contestador recebe só as regras da Contestação. Interrompida por Golpe de Oportunidade: perde a ação, não abre, sem Exaustão de Técnica, e o PE continua gasto |
| DA-16 | Exaustão de Técnica é TRAVA mecânica: bloqueia Feitiços, Técnica Máxima e novos efeitos ativos, sustentados ou duradouros da Técnica, e suprime os passivos da Técnica quando o Motor os identifica. Não bloqueia Aptidões, armas, ações básicas, Habilidades de Especialização nem nada que não venha da Técnica. Curar é controle manual |
| DA-17 | ERRO bloqueia a abertura da Expansão, com os dados preservados. AVISO e INFO não bloqueiam. Duplicata só quando idêntica: dois efeitos da mesma categoria podem coexistir se forem diferentes |
| DA-18 | A edição mora só em Feitiços → Especial. O card da aba Habilidades vira resumo com o atalho Editar em Feitiços |
| DA-19 | Confronto entre fichas no Encontro é manual assistido: rolagem, bônus, DOM, fontes e o +2 de Expansão já ativa prontos, a mesa decide o resto |
| DA-20 | Efeito Especial e Acerto Garantido livres: texto estruturado, AVISO de aprovação do Narrador e Motor opcional só com canais conhecidos |

E as regras que a autorização fixou junto:

- **Orçamento da Técnica Máxima.** A Aptidão concede 1 Técnica Máxima pelo canal
  `vagasTecnicaMaxima`, que não gasta vaga de Feitiço nem o contador comum. A Técnica Máxima oficial
  acima do total fica salva, inválida e sem uso.
- **Sem Barreiras custa 25 PE** (20 + 5), com o Acerto Garantido inerente, sem botão.
- **Acerto Garantido só existe com a Aptidão** `acerto_garantido`. O JSON antigo fica preservado e
  o efeito, indisponível.
- **O custo da Expansão passa pelo canal `custoPE`** com escopo `dominio` (e pelos efeitos sem
  alvo). Uma redução só de `feitico` não alcança a Expansão.
- **Fases do Domínio.** `ativa`, `confronto`, `estendido` e `contestando`, separadas do id da
  Expansão. Sessão antiga sem fase vale `ativa`.

## Técnica Máxima

- **Identidade e regime.** `nivel: "max"` é a Técnica Máxima. A oficial tem também
  `regraTecnicaMaxima: "oficial"`. Sem esse campo, é LEGACY (DA-02): calcula e gasta orçamento como
  antes.
- **Natureza.** É o `tipo` (e o `especialSubtipo` no Especial). A lista vem de
  `NATUREZAS_TECNICA_MAXIMA`. Personalizado dá AVISO, e Passivo e Criação de Itens dão ERRO.
- **Escala.** `escalaDaTecnicaMaxima(acesso)`: com acesso ao Nível 5, `"max"`. Abaixo disso, `5`.
  A escala nunca é gravada.
- **Porta única.** `calcularFeitico(f, ctx)`:
  - a oficial calcula numa CÓPIA escalada com `ctx.tecnicaMaxima`, e o custo-base é 25 nas duas
    escalas;
  - as regras de identidade (penalidade do Golpeador, recarga do Shikigami ao dissipar, Exaustão da
    Transformação de cena) leem `ctx.tecnicaMaxima`.
- **Orçamento.**
  - A Aptidão concede `vagasTecnicaMaxima +1`. O Addon concede pelo mesmo canal.
  - `resolveTecnicasMaximas` devolve `{ total, usadas, excedeu, livres }`.
  - A oficial sai do `feiticosGastos` nos dois sistemas.
- **Requisito.** `{ tipo: "nivelFeitico", valor: 4 }` mais Mestre em Feitiçaria, conferidos no
  derive (DA-09).
- **Recarga.** `recargaDaTecnicaMaxima(bt, extra) = max(0, 6 − piso(BT / 2)) + extra`. O canal
  `recargaTecnicaMaxima` é negativo para reduzir (Manual de Técnica: −1 com
  `nivel_feitico_max >= 5`).
- **Sessão** (`ficha-sessao.js`):
  - `situacaoDaTecnicaMaxima` e `usaTecnicaMaxima` (gasta o PE e abre a recarga);
  - `ajustaRecarga` e `iniciaRecargaPendente`;
  - a recarga desce na virada da rodada e zera no descanso.
  - Tela: `ficha/ControleTecnicaMaxima.jsx`.

## Expansão de Domínio

### Os dados (`creature.dominios[]`)

| Campo | O que guarda |
|---|---|
| `regra` | `"oficial"` em toda Expansão criada desde 2026-10-08. Sem ele, LEGACY |
| `versao` | `incompleta`, `completa` ou `sem_barreiras`. Trocar a versão no editor marca `oficial` |
| `efeitos[]` | `{ id, categoria, tipo, nome, descricao, fortalecimentos, atributos, rdTipos, rdTiposTexto, condicoes, motor }` |
| `efeitos[].fortalecimentos` | quantos Fortalecer (1 vaga cada). O `fortalecido: true` antigo vale 1 |
| `efeitos[].rdTipos` | ids de tipo de dano da RD Corporal, até o teto do DOM. O texto livre antigo fica em `rdTiposTexto` e não vira número |
| `efeitos[].condicoes` | `[{ nome, forca }]` do Efeito Ambiental de Condições, pelo orçamento em dados |
| `efeitos[].motor` | só no Efeito Especial: linhas `{ canal, expr, alvo? }` (DA-20) |
| `beneficiosRitual` | uma melhoria de Ritual por categoria (Dano, Especial, Auxiliar, Cura) |
| `acertoGarantido` | `{ ativo, tipo, escopo, referencias, letalidade, descricao }`. Sem `tipo` gravado é o MODO ANTERIOR, que escreve o texto de antes |

Tipos de Acerto Garantido (`AG_TIPOS`): Grupo de Feitiços, Ataque Armado, Ataque Desarmado,
Condição, Informação, Voto e Outro. O não letal ganha a Abertura de 0,2 Segundos (teste de
Feitiçaria contra a Atenção de todos).

### O derive (`derived.dominios`)

Cada linha da `lista` traz:

- `custo` e `partesCusto`, pelo `custoPE` com escopo `dominio`;
- `duracao` e `area` ("Definida pela Mesa" na Sem Barreiras oficial);
- `temDomo` e `pvBarreira`;
- `acertoGarantidoValido` e `acertoGarantidoResumo`;
- `exaustaoTecnica`, as rodadas que o fechamento cobra;
- `contestacao`, com `area` e `danoPorRodada`;
- `validacao` e `valida`;
- `corpo`, o texto da Ficha.

O resumo traz ainda:

- `ativoId`, a Expansão escolhida;
- `aberta`, que é `{ id, fase }` só com a sessão;
- `conflito`, com o +2 da Expansão ativa;
- `amplificacaoTecnica` e `beneficiosRitualAtivos`.

### A sessão (`ficha-sessao.js`)

- **Estado no `combate`.** `dominioAtivo`, `dominioFase`, `dominioRodadas`, `dominioPvDomo`,
  `dominioPvDomoMax`, `dominioExaustao` e `dominioNome`.
- **Abrir e fases.** `abreExpansao` paga o PE e só abre em combate, válida e com PE. As fases ficam
  em `defineFaseDaExpansao`.
- **Fechar.** `encerraExpansao(sessao, motivo, linha)`:
  - `interrompida` não cobra Exaustão e deixa o PE gasto;
  - `descanso` não cobra;
  - `encerrada`, `duracao`, `domo`, `perdeu` e `fimDoCombate` cobram. Fica a maior Exaustão, sem
    somar.
- **Domo e rodadas.** `danoNoDomo` e `defineDomo`: o domo a zero fecha a Expansão.
  `ajustaRodadasDaExpansao`: as rodadas a zero fecham.
- **Exaustão de Técnica.** `sessao.exaustaoTecnica = { restantes, total, fonte }`, com
  `ajustaExaustaoTecnica` e `curaExaustaoTecnica`.
- **Virada da rodada.** A Exaustão em curso desce, e depois a Expansão perde uma rodada.
- **Trava (DA-16).** A trava é do derive. Ele recebe `opcoes.exaustaoTecnica`, marca cada Feitiço
  com `bloqueado` e tira do Motor os Passivos e os Auxiliares ligados.
- **Seletor da Aba Buffs.** `alteraEstadoCombate(sessao, estado, valor, derived)` passa pelas mesmas
  funções.

### A tela

- Criador: `AftyDominioEditor.jsx` (`DominioEditor`, `AcertoGarantidoEditor`,
  `EfeitoDominioLinha`, `ResumoDominios`), aberto por Feitiços → Especial. A aba Habilidades mostra
  só o resumo.
- Ficha e Encontro: `ficha/ControleExpansao.jsx` (`ControleExpansao`, `PainelExaustaoTecnica`),
  montado pela `AbaAcoes` nas duas telas.

### A validação (`validarDominio`)

ERRO trava a abertura (DA-17), AVISO não.

| Nível | Código | Quando |
|---|---|---|
| ERRO | `versao` | nenhuma versão disponível |
| ERRO | `limite` | vagas acima do limite de efeitos |
| ERRO | `duplicata` | efeito idêntico (mesma categoria, tipo e escolhas) |
| ERRO | `atributos` | Aumento de Atributo sem dois físicos distintos |
| ERRO | `rdTipos` | tipos de RD acima do teto |
| ERRO | `condicoesDados`, `condicaoForca`, `condicaoNome`, `condicoesRepetidas` | Condições fora do orçamento, da força, do catálogo, ou duas vezes |
| ERRO | `acertoDesmembramento` | Acerto Garantido de Condição com Desmembramento |
| AVISO | `versao` | versão gravada sem a Aptidão, usando outra |
| AVISO | `especial`, `fortalecer` | Efeito Especial (aprovação do Narrador) |
| AVISO | `rdTipos`, `condicoes` | escolhas vazias |
| AVISO | `acertoIncompleta`, `acertoAptidao` | Acerto Garantido que não vale |
| AVISO | `acertoFeiticos`, `acertoFeiticoSumiu`, `acertoCondicao`, `acertoDescricao`, `acertoLivre` | Acerto Garantido incompleto, ou livre (Narrador) |
| AVISO | `motorCanal`, `motorExpr` | linha do Motor do Efeito Especial fora dos canais permitidos ou sem expressão |

Canais permitidos no Efeito Especial: `canalPermitidoEmExpansao` (`afty-efeitos.js`). Ficam fora
três grupos:

- Orçamentos;
- Barreira e Domínio;
- `nivelAptidao` e `limiteAptidao`.

## Legado e compatibilidade

Nenhuma migração escrita: tudo é leitura, e nenhum dado antigo é apagado.

- A Técnica Máxima sem `regraTecnicaMaxima` é LEGACY. O painel do criador oferece converter.
- O modelo de Técnica Máxima de Addon:
  - só aparece com vaga livre, e a cópia nasce oficial;
  - a cópia antiga mantém o regime ao atualizar (`modelosPendentesDeAddon`).
- A Expansão sem `regra` é LEGACY. A Sem Barreiras LEGACY segue com o Totem e o `9 × BT`, e o
  editor oferece converter.
- A sessão sem fase vale `ativa`, e o `dominioAtivo: true` antigo continua lido.

## Asserts

| Arquivo | Cobre |
|---|---|
| `t-tecnica-maxima-modelo` | concessão, vaga, regime, naturezas, requisitos, a porta da Expansão em Tipo de Especial |
| `t-tecnica-maxima-escala` | escala 5 e `max`, tabelas e identidade |
| `t-tecnica-maxima-recarga` | recarga, Manual de Técnica, Usar, Shikigami, descanso |
| `t-tecnica-maxima-custo` | os 25 PE e as reduções genéricas (e o conserto do `custoPE` do estágio principal) |
| `t-tecnica-maxima-dominio` | Técnica Máxima dentro da Expansão |
| `t-dominio-versoes` | custos, duração, área, Acerto Garantido por versão |
| `t-dominio-efeitos` | as onze tabelas, Fortalecer, RD por tipo, Condições, o que o editor lê |
| `t-dominio-motor` | fases no Motor, Ritual por categoria, Amplificação nos Especiais, `custoPE` |
| `t-dominio-acerto` | Acerto Garantido estruturado, modo anterior, Motor do Efeito Especial |
| `t-dominio-sessao` | abrir, fases, duração, domo, Exaustão de Técnica e a trava |
| `t-dominio-migracao` | Expansão antiga byte a byte, sessão antiga, Técnica Máxima de Addon |
| `t-dominio-corpo` | o corpo da Ficha (Ação Comum, Acerto Garantido no modo anterior) |

## Pontos ainda abertos

As ambiguidades novas vão para `docs/a-fazer.md`, no formato NOVA DECISÃO NECESSÁRIA, com o título
"Técnica Máxima e Expansão de Domínio". Hoje são sete:

1. a área da Sem Barreiras oficial;
2. o fixo do Golpeador de vários golpes;
3. o Fortalecer da RD Corporal;
4. quantas condições cabem num Acerto Garantido de Condição;
5. abrir uma Expansão durante a Exaustão de Técnica;
6. o Funcionamento Básico durante a Exaustão;
7. o fim do combate com a Expansão aberta.

Cada um está implementado na leitura mais conservadora, marcada lá.
