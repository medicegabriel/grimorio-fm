# Nuvem (Supabase), Login e Mudança de Endereço

## Balanceamento de Jogador

A coleta fica desligada por padrão. Os dados das fichas e os resumos de balanceamento usam tabelas distintas. O painel privado fica em `/Jogador/balanceamento` e usa o login já disponível no site.

1. Em um projeto de teste, execute [`supabase/balanceamento.sql`](../supabase/balanceamento.sql) pelo SQL Editor. Confira que o job `balanceamento-apagar-expiradas` aparece em Cron. Ele apaga os resumos vencidos de hora em hora. O relatório aplica o corte de 90 dias mesmo entre execuções do job.
2. Use Node.js 24.x nas funções da Vercel. Em Preview, configure a URL de teste em `SUPABASE_URL` e a chave secreta desse projeto em `SUPABASE_SECRET_KEY`. Ambas são variáveis de servidor. Para o login do painel, configure também as variáveis públicas da nuvem descritas mais abaixo, apontando para o mesmo projeto de teste. Use `BALANCEAMENTO_ADMIN_ID` com o UID da conta autorizada, disponível em Authentication → Users no Supabase. O UID depende da conta e do projeto. Escolha a conta do provedor que será usada para consultar o painel.
3. No Firewall da Vercel, configure uma regra de limite para `POST /api/balanceamento/contribuicao`, por IP, com 60 requisições por minuto e resposta 429. O IP é usado para o limite na Vercel. O resumo e o banco de balanceamento dispensam esse dado.
4. Ative `BALANCEAMENTO_ATIVO=1` no servidor e `VITE_BALANCEAMENTO_ATIVO=1` no site da prévia. Publique a prévia com essas variáveis e confira um salvamento de Jogador sem login, a recusa pelo aviso, e o painel com a conta autorizada e com outra conta. Verifique a amostra em duas edições da mesma ficha.
5. Repita a configuração no ambiente de produção com as credenciais e o UID desse ambiente. Publique a política de privacidade junto com o recurso. Para pausar a coleta, retire as duas variáveis de ativação e publique a configuração atualizada.

Os períodos do painel usam a data em que o último resumo chegou ao servidor. Fichas salvas antes do lançamento podem entrar ao serem editadas e salvas de novo. Cada navegador e domínio conserva seu próprio código por ficha e sua preferência de coleta.

O convite **Incluir Fichas Já Salvas** envia as fichas elegíveis disponíveis no navegador após o clique no botão. Ele reaproveita o código por ficha do salvamento individual e inclui a versão e a data do aceite no resumo recebido. O envio em sequência respeita o limite da API. Em caso de interrupção, o botão de tentativa envia apenas as fichas pendentes. As Preferências de Privacidade desativam os próximos envios neste navegador.

Implementado em 2026-11-16. O código fica INERTE até as variáveis de ambiente existirem: sem elas o
site é o de sempre, só com localStorage, e a biblioteca do Supabase nem é baixada.

## Como funciona

- O localStorage continua sendo a cópia de trabalho. Criar e usar ficha nunca espera a rede.
- `src/nuvem/nuvem-sync.js` intercepta as gravações em chaves `fm_*` e `afty_*` e sobe as mudanças
  3 segundos depois da última. Vale para as quatro rotas (`/`, `/Player`, `/Afty`, `/EraDeOuro`).
- Ficha vai uma linha por ficha na tabela `fichas`, com apagamento marcado. O resto (encontros,
  modelos, addons, temas, pastas) vai inteiro na tabela `chaves`.
- Ao abrir o site com conta, o `main.jsx` lê a nuvem antes de montar o React (no máximo 2,5 s). Se
  a rede atrasar, o site abre com o local e a leitura tardia recarrega a página uma vez.
- Desde 2026-11-26 a tela (o App ou a Central) é baixada junto com a nuvem, mas só MONTA depois dela. Por isso nenhum módulo
  do grafo estático do App pode ler fichas no topo: o módulo pode ser avaliado antes de a leitura gravar.
- Nada sobe antes da primeira leitura da sessão.
- Só o primeiro login de um aparelho baixa tudo. Depois o site baixa só o que mudou desde o cursor
  guardado em `nuvem_estado_v1`, que é hora do servidor (gatilho `carimbar_atualizado_em`).
- Linha recusada pelo banco (grande demais) não trava a fila: as outras sobem, o ícone da Conta
  fica âmbar e a recusada só é tentada de novo quando mudar. Limite de 1,9 MB por linha.
- Uma chave inteira apagada em outro aparelho não some deste (a tabela `chaves` não marca
  apagamento). Fichas marcam.
- Conflito: ficha igual nos dois lados fica a de `updatedAt` mais novo. Ficha apagada em outro
  aparelho sai daqui, salvo se foi editada aqui depois do apagamento.
- Sair da conta mantém as fichas no aparelho.
- Ficam no aparelho: `fm_last_error_v1`, `fm_storage_limit_v1`, `fm_dashboard_view*` e toda chave que termina em
  `_aparelho_vN` (`ehChaveDoAparelho`, 2026-11-19, S-37).
- Login só com Google ou Discord (OAuth), sem senha. Google e Discord com e-mails diferentes viram
  duas contas separadas.
- A volta do login cai na MESMA página, com a query dela (`destinoDoLogin` em `nuvem-config.js`, 2026-11-19).
  Até ali ia só o caminho, e a `/Sala/Nova?encontro=<id>&grupo=<g>` perdia o encontro na volta do Google.
- Num computador compartilhado, entrar com outra conta junta as fichas locais à conta nova.

## Passo a passo (o autor)

Domínio escolhido em 2026-11-16: **`fichafm.com.br`**. Onde aparece `<ref>`, use o código do
projeto Supabase (o pedaço antes de `.supabase.co` na Project URL).

**A ordem importa.** O `VITE_DOMINIO_NOVO` liga a faixa do endereço antigo, então ele entra por
último, só depois de `https://fichafm.com.br` abrir com cadeado de HTTPS.

### 1. Comprar o domínio (Registro.br)

1. Entre em registro.br e crie a conta com o seu CPF (botão Entrar, depois Criar Conta).
2. Na busca da página inicial, digite `fichafm.com.br` e clique em Registrar.
3. Escolha o prazo (1 ano custa R$ 40; prazos maiores saem mais baratos por ano).
4. Em servidores DNS, deixe **"Utilizar os servidores DNS do Registro.br"**.
5. Pague por PIX (libera em minutos), cartão ou boleto (até 3 dias úteis). O domínio só passa a
   existir depois do pagamento confirmado.
6. Ligue a **renovação automática** no painel do domínio, senão ele expira daqui a um ano.

### 2. Ligar o domínio na Vercel

1. vercel.com, projeto `grimorio-fm`, Settings, Domains, Add.
2. Digite `fichafm.com.br` e aceite a sugestão de também adicionar `www.fichafm.com.br`
   redirecionando para o principal.
3. A Vercel mostra os registros DNS que faltam (em geral um `A` para o domínio raiz e um `CNAME`
   para o `www`). **Copie os valores que ela mostrar**, eles podem mudar por projeto.
4. No registro.br, abra o domínio, DNS, Editar Zona (ou Configurar Endereçamento, Modo Avançado) e
   crie esses mesmos registros. Salve.
5. Volte à Vercel e espere o domínio ficar com "Valid Configuration" (de minutos a algumas horas).
   O certificado HTTPS sai sozinho.
6. **Não mexa** no `grimorio-fm.vercel.app`: ele segue no ar e não deve redirecionar.

### 3. Criar o Supabase

1. supabase.com, Start your project, entre com o GitHub.
2. New project: organização pessoal, nome `fichafm`, **Region South America (São Paulo)**, plano
   Free. Gere uma senha do banco e guarde num gerenciador de senhas (o site não usa essa senha).
3. Espere o projeto subir (1 a 2 minutos).
4. SQL Editor, New query, cole o arquivo `supabase/esquema.sql` inteiro e clique em Run. Tem de
   terminar com "Success. No rows returned".
5. Table Editor: as tabelas `fichas` e `chaves` aparecem com o selo **RLS enabled**.
6. Project Settings, API Keys: copie a **Project URL** e a chave **publishable**
   (`sb_publishable_...`). **Nunca** use a `secret` nem a `service_role`.
7. Authentication, Sign In / Providers, abra Google: ali aparece a **Callback URL**
   (`https://<ref>.supabase.co/auth/v1/callback`). Copie, ela serve para o Google e o Discord.

### 4. Login com Google

1. console.cloud.google.com, seletor de projeto no topo, New Project, nome `Ficha FM`.
2. Menu, Google Auth Platform (ou APIs e Serviços, Tela de Consentimento OAuth), Get Started:
   - App name: `Ficha F&M`. Support email: o seu.
   - Audience: **External**.
   - Contact: o seu e-mail. Aceite os termos e crie.
3. Clients, Create Client, tipo **Web application**, nome `Supabase`:
   - Authorized JavaScript origins: `https://fichafm.com.br`, `https://grimorio-fm.vercel.app` e
     `http://localhost:5173`.
   - Authorized redirect URIs: a Callback URL do Supabase.
   - Create. Copie o **Client ID** e o **Client Secret**.
4. Audience, **Publish App** (Em produção). Em modo teste, só os e-mails de teste entram. O site só
   pede nome, e-mail e foto, que não exigem verificação do Google.
5. No Supabase, Providers, Google: ligue, cole o Client ID e o Secret, Save.

### 5. Login com Discord

1. discord.com/developers/applications, New Application, nome `Ficha F&M`.
2. OAuth2: em Redirects, Add Redirect com a Callback URL do Supabase. Save Changes.
3. Copie o **Client ID**. Em Client Secret, Reset Secret e copie (ele só aparece uma vez).
4. No Supabase, Providers, Discord: ligue, cole os dois, Save.

### 6. Endereços de retorno no Supabase

Authentication, URL Configuration:

- Site URL: `https://fichafm.com.br`
- Redirect URLs (Add URL, uma por vez):
  - `https://fichafm.com.br/**`
  - `https://www.fichafm.com.br/**`
  - `https://grimorio-fm.vercel.app/**`
  - `http://localhost:5173/**`

### 7. Variáveis na Vercel

Projeto, Settings, Environment Variables. Marque Production e Preview em cada uma:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | a Project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | a chave publishable (`sb_publishable_...`) |
| `VITE_DOMINIO_NOVO` | `https://fichafm.com.br` (**só quando o passo 2 estiver verde**) |

Variável `VITE_` entra no build. Depois de salvar: Deployments, último deploy, menu, **Redeploy**.

Para testar no computador antes de publicar, crie `grimorio-tracker/.env.local` (já ignorado pelo
git) com as duas primeiras linhas e rode `npm run dev`.

### 8. Conferir depois do deploy

1. Abra `https://fichafm.com.br/Player`, Entrar, Google. Volta logado, com o ícone de nuvem verde.
2. Crie uma ficha, espere 5 segundos e veja a linha nova no Table Editor, tabela `fichas`.
3. Entre com a mesma conta no celular: a ficha aparece.
4. Repita com o Discord.
5. Abra `https://grimorio-fm.vercel.app`: a faixa "O Grimório Mudou para fichafm.com.br" aparece.
   Clique em "Levar Minhas Fichas" e confira as fichas no endereço novo.

## Mudança de endereço

No host `grimorio-fm.vercel.app` exato, com `VITE_DOMINIO_NOVO` definido, aparece uma faixa fixa
no rodapé com "Levar Minhas Fichas". O botão abre o endereço novo numa janela e manda todas as
chaves da pessoa por `postMessage`, com a origem conferida nas duas pontas. O novo mescla sem apagar
nada: ficha igual fica a mais nova, chave que só existe lá entra, lista com id é unida.

Quem tiver conta também pode só entrar nos dois endereços: o antigo sobe, o novo desce.

## Custos a acompanhar

O banco só pesa para quem entra. Meça o tamanho de uma ficha real em Supabase, Table Editor, e
confira o limite do plano grátis (banco e usuários ativos por mês) na página de preços atual.

## Comunidade

A rota `/Comunidade` usa a conta já existente do fichafm. Qualquer visitante pode listar publicações, baixar fichas e CSS e ler comentários. Contas Google ou Discord podem publicar uma cópia da ficha selecionada, CSS ou um tópico, escrever sobre a publicação e comentar. Addons ficam trancados. O banco assina cada envio com o usuário do Discord vinculado ou com a parte anterior ao arroba do e-mail confirmado. O identificador da conta fica privado.

O Supabase de produção do fichafm já recebeu [publicações e comentários](../supabase/migrations/20261126014725_comunidade_publicacoes_e_comentarios.sql), [autoria da conta](../supabase/migrations/20261126014733_comunidade_autoria_da_conta.sql) e [edição de publicações](../supabase/migrations/20261126020955_comunidade_editar_publicacao.sql), nessa ordem. Para liberar a rota no domínio público, publique a versão do frontend que inclui a Comunidade. As URLs de retorno existentes cobrem `/Comunidade` quando o domínio foi configurado com `/**`.

O catálogo lista até 24 publicações por página e só lê o conteúdo completo ao abrir uma publicação. Os comentários têm paginação independente. A publicação de uma ficha usa uma cópia de até 240 KB sem o retrato principal. CSS tem limite de 32 KB e é exibido em uma amostra isolada de nível 10. Cada conta pode manter até 50 publicações e 200 comentários. O autor pode editar e retirar publicações próprias ou excluir comentários próprios. A edição grava na publicação original e preserva a discussão. Retirar uma publicação apaga todos os comentários dela.

Para verificar o SQL localmente, instale `@electric-sql/pglite@0.5.15` fora do repositório e execute `node supabase/prova-comunidade-pglite.mjs <pasta dist do pglite>`. No ambiente escolhido para publicação, confira a leitura sem login e, com duas contas, publique um tópico, comente na segunda conta e verifique se só a primeira conta consegue editar o tópico.

## Sala Online (2026-11-17 e 2026-11-18)

Estado em 2026-11-18: o banco (`supabase/salas.sql`, etapa 7a), o cliente (`src/nuvem/sala-*.js`, 7b) e as telas (`src/nuvem/sala-ui/`, 7c) estão
prontos, e o `salas.sql` está no projeto de produção desde 2026-11-18. A Sala está aberta a todos desde 2026-11-18 (o cadeado
saiu depois da revisão final, a pedido do autor). A ordem desta seção: o banco, os tetos, o que o SQL cria, o passo a passo do banco,
o cliente, as telas, **como usar a Sala**, a manutenção e como testar.

O banco da Sala está em `supabase/salas.sql`, separado do `esquema.sql`, e não toca em `fichas` nem
em `chaves`. O modelo de ameaça (o que cada papel lê e grava, e por quê) está no topo do arquivo. As
funções puras de corte, espelho do SQL, estão em `src/nuvem/sala-projecao.js`.

### O plano grátis e os tetos

Conferido em 2026-11-17 (página de preços e limites do tempo real):

| Recurso | Plano grátis | Vale para |
|---|---|---|
| Conexões de tempo real ao mesmo tempo | 200 | o projeto inteiro |
| Mensagens de tempo real por mês | 2 milhões | o projeto inteiro (cada evento conta uma vez POR assinante) |
| Mensagens por segundo | 100 | o projeto inteiro |
| Carga de um evento `postgres_changes` | 1 MB (acima disso chegam só os campos pequenos) | por evento |
| Banco | 500 MB | o MESMO das fichas e chaves da nuvem pessoal |
| Saída de dados | 5 GB por mês | tudo, tempo real incluído |
| pg_cron (Supabase Cron) | disponível | |

O que acaba primeiro são as mensagens: uma sessão de 3 horas com 5 pessoas gasta por volta de 10
mil, umas 200 sessões por mês no site todo. Os tetos (autor, 2026-11-17) ficam na linha única de
`sala_interno.tetos`, e mudar é um `update` só:

| Teto | Valor |
|---|---|
| Pessoas por Sala (Mestre, co-Mestre, jogadores e espectadores) | 8 |
| Salas abertas por Mestre | 2 |
| Horas sem gravação até a Sala fechar sozinha | 6 |
| Dias que a Sala fechada fica guardada | 14 |
| Combatentes por Sala, registros por Sala, senhas erradas por hora | 60, 10.000, 10 (30 somando as Salas) |

```sql
update sala_interno.tetos set horas_parada = 8;
```

Decisões do autor na mesma data: Barra de Vida em cinco faixas (Inteira, Acima da Metade, Até a
Metade, Até um Quarto, Caída), em Só Nome e Barra o Registro mostra só o valor rolado de Dano e Cura,
a rolagem escondida não gera linha pública, todo mundo entra com conta (o espectador também, e a
conta anônima é recusada), e a tabela `salas` fica fora da publicação do tempo real.

### O que o SQL cria

- **Tabelas** em `public` (todas com RLS e só com SELECT para o `authenticated`): `salas`,
  `sala_membros`, `sala_estado`, `sala_ordem_mestre`, `sala_resumos`, `sala_fichas` (ficha e sessão em
  linhas separadas), `sala_compartilhamentos`, `sala_operacoes`, `sala_operacoes_publicas`. Em
  `sala_interno` (fora da Data API, sem grant): `tetos`, `varredura`, `resumos_completos`, `tentativas`.
- **Nenhuma escrita direta.** Tudo passa por RPC: `ver_sala`, `criar_sala`, `entrar_na_sala`,
  `minhas_salas`, `trocar_senha`, `trancar`, `remover_membro`, `promover_mestre`, `fechar_sala`,
  `adicionar_combatente`, `remover_combatente`, `definir_visao`, `definir_dono`, `publicar_resumo`,
  `gravar_ficha`, `compartilhar_ficha`, `gravar_estado`, `gravar_operacao`, `responder_pedido`.
- **Publicação** `supabase_realtime`: as tabelas da Sala menos `salas`. A publicação passa a mandar só
  insert e update (nenhum DELETE sai do banco). Hoje nada mais do projeto usa o tempo real.
- **Presence** em `realtime.messages`, canal privado `sala:<id>`, só para membro.
- **pg_cron**: a tarefa `sala_varrer` a cada 15 minutos (fecha as paradas, apaga as velhas). Sem
  pg_cron, as RPCs de entrada varrem sozinhas, no máximo a cada 5 minutos.

### O que o cliente precisa saber do banco

- `select *` em `salas` falha (o `senha_hash` está fora do grant). Liste as colunas.
- Assine `postgres_changes` sempre com filtro `sala_id=eq.<id>`: o filtro corta o evento antes da RLS
  e cada evento sem filtro é conferido contra todo assinante do projeto.
- Nenhum DELETE chega. Quando `sala_estado.versao` sobe, releia resumos, fichas, compartilhamentos e
  membros: é o sinal de que algo deixou de passar pela RLS sem evento.
- Evento acima de 1 MB chega sem os campos grandes: compare a `versao` e releia a linha.
- `gravar_ficha` recusa com `Versão Mudou` e a versão de agora no `details` do erro.
- O histórico e o log que o Mestre grava na sessão de um personagem são lidos inteiros pelo dono.
  Grave lá a versão que o dono pode ver (sem o combatente Oculto que agiu, sem a rolagem de criatura
  que ele não vê). O banco não enxerga dentro da sessão.
- Aceitar Sozinho é do aparelho do Mestre: o pedido nasce pendente e o Mestre aceita pelo
  `responder_pedido` (o jogador não consegue medir o delta de uma criatura que não lê).
- Presence com `supabase.channel('sala:<id>', { config: { private: true } })`. Com "Allow public access" desligado
  TODO canal é privado, e a documentação não diz se um canal só de `postgres_changes` entra sem política em
  `realtime.messages`. O mais simples é pôr as `postgres_changes` no mesmo canal `sala:<id>`, e a 7b confirma no projeto.
- O Encontro Finalizado de cada um se monta das linhas públicas e do que o aparelho recebeu ao vivo. Nunca relendo o
  registro completo no fechamento: a leitura completa segue a visão e os compartilhamentos de AGORA, e uma criatura que
  virou Aberta no fim abriria as operações de quando ela estava Oculta.
- O dono do alvo lê o pedido completo que um colega fez nele (para ter o id e a intenção e responder).

### Passo a passo (o autor)

1. **Antes**, em Database, Usage, anote o tamanho do banco (o teto de 500 MB é o mesmo da nuvem
   pessoal).
2. SQL Editor, New query, cole o `supabase/salas.sql` inteiro e clique em Run. Tem de terminar sem
   erro. Os avisos (NOTICE) que podem aparecer: pg_cron indisponível, publicação sem permissão,
   Presence sem permissão. Qualquer um deles, me mande o texto.
3. Realtime, Settings: **desligue "Allow public access"**. Sem isso o canal privado de Presence não é
   exigido. Hoje nada do site usa o tempo real, então desligar não quebra nada.
4. Rode as conferências de estrutura abaixo (como `postgres`, o papel padrão do Editor).
5. Rode o roteiro por papel com as suas duas contas (Google e Discord). Ao fim, apague a Sala de prova.

### Conferências de estrutura (como postgres)

```sql
-- 1. Publicação: oito tabelas, sem salas, sem DELETE.
select (select string_agg(tablename, ', ' order by tablename) from pg_publication_tables
        where pubname = 'supabase_realtime') as tabelas,
       pubdelete, pubtruncate
from pg_publication where pubname = 'supabase_realtime';
```

Esperado: as oito `sala_*` (sem `salas`), `pubdelete` e `pubtruncate` falsos.

```sql
-- 2. RLS ligada em todas e privilégios certos (tudo tem de dar o valor esperado ao lado).
select
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind = 'r' and not c.relrowsecurity
     and (n.nspname = 'sala_interno' or (n.nspname = 'public' and (c.relname = 'salas' or c.relname like 'sala_%')))) as sem_rls, -- 0
  has_function_privilege('anon', 'public.ver_sala(text)', 'execute') as anon_executa,                        -- false
  has_function_privilege('authenticated', 'public.ver_sala(text)', 'execute') as authenticated_executa,      -- true
  has_function_privilege('authenticated', 'sala_interno.varrer(boolean)', 'execute') as interna_exposta,     -- false
  has_table_privilege('authenticated', 'public.sala_fichas', 'insert') as escreve_direto,                   -- false
  has_table_privilege('anon', 'public.sala_resumos', 'select') as anon_le,                                  -- false
  has_column_privilege('authenticated', 'public.salas', 'senha_hash', 'select') as le_senha;                -- false
```

```sql
-- 3. pg_cron (se ligado): a tarefa existe.
select jobname, schedule, command from cron.job where jobname = 'sala_varrer';
```

```sql
-- 4. Presence: as duas políticas de realtime.messages.
select policyname, cmd from pg_policies where schemaname = 'realtime' and policyname like 'sala:%';
```

### Roteiro por papel (prova da RLS no ar)

O Editor do Supabase mostra o resultado da ÚLTIMA consulta. Para agir como uma conta, use o seletor
de papel do Editor (canto de cima, "Role": `authenticated` e escolha o usuário). Se o seu Editor não
tiver o seletor, cole as duas linhas abaixo antes de cada consulta, na mesma execução (`<conta>` é o
id da conta):

```sql
select set_config('request.jwt.claims', '{"sub":"<conta>","role":"authenticated"}', true);
set local role authenticated;
```

Toda consulta do roteiro devolve `current_user` e `auth.uid()` na primeira coluna: se não aparecer
`authenticated` e a conta certa, o papel não pegou e o resultado não vale.

Os ids das contas (como `postgres`):

```sql
select id, email, raw_app_meta_data ->> 'provider' as provedor from auth.users order by created_at desc limit 10;
```

Nos passos, **M** é a conta do Google (Mestre), **J** a do Discord (jogador). Uma terceira conta (**N**,
qualquer outra, ou a de um amigo) prova o não membro. Sem ela, rode os passos de N com J ANTES do
passo 2.

**1. M cria a Sala e põe as criaturas.** Como M:

```sql
select current_user, auth.uid(), s.* from public.criar_sala('site', 'prova1234', 'Prova da RLS') as s;
```

Guarde o `sala_id` e o `codigo`. Ainda como M, uma consulta por execução:

```sql
select public.adicionar_combatente('<sala_id>', 'gob_oculto', 'criatura', 'Goblin Oculto');
select public.adicionar_combatente('<sala_id>', 'gob_barra', 'criatura', 'Goblin de Barra', null, 'barra');
select public.publicar_resumo('<sala_id>', 'gob_oculto', '{"pv": 50, "pvMax": 50}');
select public.publicar_resumo('<sala_id>', 'gob_barra', '{"pv": 18, "pvMax": 40}');
select public.gravar_estado('<sala_id>', 'ativo', 1, '{}', array['gob_oculto', 'gob_barra'], 'gob_oculto');
select * from public.gravar_operacao('<sala_id>', 'operacao', '{"id":"prova_1","tipo":"dano","alvo":"gob_oculto","entrada":{"valor":7},"delta":[{"caminho":["hpAtual"],"antes":50,"depois":43}]}');
select * from public.gravar_operacao('<sala_id>', 'operacao', '{"id":"prova_2","tipo":"dano","alvo":"gob_barra","entrada":{"valor":9},"delta":[{"caminho":["hpAtual"],"antes":27,"depois":18}]}');
select * from public.gravar_operacao('<sala_id>', 'rolagem', '{"id":"prova_3","rolagem":{"tipo":"teste","total":19}}', true);
```

Esperado: a operação `prova_1` (em Oculta) e a rolagem escondida voltam com `publica_id` nulo, a
`prova_2` com um id.

**2. N não vê nada.** Como N:

```sql
select current_user, auth.uid(),
  (select count(*) from public.salas) as salas,
  (select count(*) from public.sala_resumos) as resumos,
  (select count(*) from public.sala_operacoes_publicas) as publicas,
  (select count(*) from public.sala_membros) as membros;
```

Esperado: tudo 0. `select * from public.ver_sala('<codigo>')` devolve só o grupo e `trancada`, com
`papel` nulo.

**3. J entra.** Como J, uma por execução:

```sql
select current_user, auth.uid(), e.* from public.entrar_na_sala('<codigo>', 'errada') as e;
select current_user, auth.uid(), e.* from public.entrar_na_sala('<codigo>', 'prova1234') as e;
```

Esperado: `Senha Errada` na primeira, `papel` jogador na segunda.

**4. J não vê o Oculto em lugar nenhum.** Como J:

```sql
select current_user, auth.uid(),
  (select count(*) from public.sala_resumos where combatente = 'gob_oculto') as oculto_no_resumo,      -- 0
  (select publico::text from public.sala_resumos where combatente = 'gob_barra') as barra,           -- {"faixa": "ate_a_metade"}
  (select posicao from public.sala_resumos where combatente = 'gob_barra') as posicao_da_barra,      -- 1
  (select count(*) from public.sala_resumos where na_vez) as alguem_na_vez,                         -- 0
  (select count(*) from public.sala_ordem_mestre) as ordem_completa,                                -- 0
  (select count(*) from public.sala_operacoes) as registro_completo,                                -- 0
  (select count(*) from public.sala_operacoes_publicas) as registro_publico,                        -- 1
  (select coalesce(json_agg(r)::text, '') from public.sala_resumos r)
    || (select coalesce(json_agg(p)::text, '') from public.sala_operacoes_publicas p)
    || (select coalesce(json_agg(m)::text, '') from public.sala_membros m)
    ~ 'Oculto|gob_oculto|"total": 19' as vazou;                                                     -- false
```

```sql
select publica from public.sala_operacoes_publicas;
```

Esperado: só a `prova_2`, com `valor` 9 e `vida` em faixas (`acima_da_metade` para `ate_a_metade`),
sem número de Vida e sem `delta`.

```sql
select senha_hash from public.salas;
```

Esperado: `permission denied for table salas`. Faça o mesmo com `select * from public.salas`.

**5. A visão muda e a versão sobe.** Como M, `select public.definir_visao('<sala_id>', 'gob_oculto',
'nome');`. Como J, a consulta do passo 4 agora mostra `oculto_no_resumo` 1 (com `publico` vazio, só
o nome), a ordem com as posições 1 e 2, ele na vez, `vazou` verdadeiro (o nome agora é visível) e
`select versao from public.sala_estado` maior que antes.
Volte a Oculta e o Goblin some de novo, sem buraco na posição.

**6. Pedido.** Como J, `select * from public.gravar_operacao('<sala_id>', 'pedido',
'{"id":"prova_4","tipo":"dano","alvo":"gob_oculto","delta":[]}');` com o Goblin Oculto: tem de dar
`Combatente Ausente` (igual a um id que não existe). Em `gob_barra` o pedido entra. Como J,
`select * from public.gravar_operacao('<sala_id>', 'operacao', '{"id":"prova_5","tipo":"dano","alvo":"gob_barra","delta":[]}');`
dá `Sem Permissão`.

**7. O anon não chama nada.** No seletor de papel, `anon`: `select * from public.ver_sala('<codigo>');`
dá `permission denied for function ver_sala`.

**8. Remover e fechar.** Como M, `select public.remover_membro('<sala_id>', '<conta de J>');`. Como J:

```sql
select current_user, auth.uid(), conta, removido_em, (select count(*) from public.sala_estado) as estado
from public.sala_membros;
```

Esperado: uma linha só (a própria), com `removido_em` preenchido, e `estado` 0. `entrar_na_sala` de
novo dá `Removido da Sala`. Como M, `select public.fechar_sala('<sala_id>');` e qualquer gravação
depois dá `Sala Fechada`.

**9. Apagar a prova** (como `postgres`):

```sql
delete from public.salas where nome = 'Prova da RLS';
```

### Prova local (sem o Supabase)

`supabase/prova-salas-pglite.mjs` roda o `salas.sql` duas vezes num Postgres em WebAssembly (PGlite,
que NÃO é dependência do site) com os esquemas do Supabase imitados no pior caso de grant, passa por
todos os papéis e roda os casos de `asserts/sala-projecao-casos.json` nas funções do SQL, comparando
com o JavaScript. Em 2026-11-18: 351 conferências, todas verdes. Para rodar:

```bash
npm install --prefix ../pglite-prova @electric-sql/pglite@0.5.15
```

```bash
node supabase/prova-salas-pglite.mjs ../pglite-prova/node_modules/@electric-sql/pglite/dist
```

O que ela não cobre: o pg_cron, o tempo real em si (evento, filtro, Presence ao vivo) e o seletor de
papel do Editor. Esses ficam para o roteiro acima e para a 7b.

### O cliente da Sala (etapa 7b, 2026-11-18)

O `salas.sql` está no projeto de produção desde 2026-11-18 (o autor colou e desligou "Allow public access").
O cliente mora em `src/nuvem/` e usa o mesmo `cliente()` da nuvem pessoal (`nuvem-sync.js`): a mesma
sessão de login, nenhuma chave nova. A rota `/Sala/<código>` abre para todos.

| Arquivo | O que faz |
|---|---|
| `sala-rede.js` | uma função por RPC e as leituras (colunas listadas, nunca `select *`). O erro sai como `ErroDaSala` com o `codigo` do banco ("Versão Mudou", "Sala Fechada") e `rede: true` quando é falha de transporte |
| `sala-cliente.js` | uma Sala aberta: o retrato do que a RLS deixa ler, o canal privado `sala:<id>` com as `postgres_changes` das oito tabelas (filtro `sala_id=eq.<id>`) e o Presence, a releitura de tudo quando `sala_estado.versao` sobe e a cada (re)inscrição, a reconexão (de novo, até 30 s entre tentativas, e na volta da rede ou da aba), e a escrita com versão (`gravarComVersao`: "Versão Mudou" relê e reaplica a transformação, sem rede espera e tenta de novo conferindo se a gravação já tinha chegado). Cache em `sala_cache_v1:<id>`, fora de `fm_` e `afty_` |
| `sala-espelho.js` | o aparelho do jogador: a sessão de `sala_fichas` vai para `fm_ficha_sessao_afty_v1:<id>` pela loja (`aplicarRemoto`), a edição dele sobe como DIFERENÇA por cima da versão do banco, a ficha sobe quando ele a edita noutra aba, e ele publica o resumo dos próprios personagens |
| `sala-encontro.js` | o aparelho do Mestre que criou: o Encontro dele (a lista de sempre) publica cadastro, visão, estado e ordem completa, ficha e sessão das criaturas, resumos, operações e eventos, e recebe os personagens dos jogadores (ligados à Sala, pela `fonte` do `useEncontro`), as sessões deles e os pedidos. Também `abrirSalaDoEncontro` |
| `sala-oculto.js` | FOLHA. O Apelido Opaco e o id do personagem na Sala (`pj:<id da ficha>`) |
| `sala-fechamento.js` | o Encontro Finalizado de cada um e a recuperação do ausente no login seguinte |
| `SalaPagina.jsx` | a rota `/Sala/<código>`: decide qual tela mostrar (as telas são de `sala-ui/`, ver abaixo) |
| `sala-telas.js`, `sala-frases.js` | FOLHAS, a lógica pura das telas (faixa, colegas, Registro, sinais) e as frases do Registro |
| `sala-jogador.js` | as escritas do jogador: pedir, aceitar, recusar, Desfazer, iniciativa, Encerrar Meu Turno, chat e rolagem escondida |
| `sala-ui/` | as telas (Abrir Sala, Controles, entrada, escolha de fichas, tela do jogador, painel) e `sala-ui.css` |

**Conferido no projeto (2026-11-18).** O canal privado `sala:<id>` com as `postgres_changes` e o Presence
juntos entra com "Allow public access" desligado, e os eventos chegam. A primeira inscrição pode cair com
"MissingPartition: Realtime was unable to find the expected messages partition", e a segunda tentativa
entra (o cliente tenta de novo sozinho).

**O que o banco não esconde, resolvido no cliente.** O Mestre grava a sessão do personagem do jogador, que o
dono lê inteira. Antes de gravar, o id de toda criatura Oculta vira um APELIDO sem significado (hash com o
segredo da Sala, que só o aparelho do Mestre que a criou tem, em `encontro.sala.segredo`), e a entrada do
histórico feita por uma Oculta perde o detalhe da rolagem (o valor fica). O aparelho do Mestre traduz de
volta na leitura, e a duração aplicada por ela segue descendo no turno dela (autor, 2026-11-18, "Apelido Opaco").
Desde a revisão final (8b, 2026-11-18) vale também para a sessão de TODA criatura (e personagem) que o Mestre sobe (`sessaoQueSobe`): a criatura Aberta é lida
inteira por todo membro, e a condição com Aplicado Por de uma Oculta contava que ela existe. A base da mesclagem fica na vista do Mestre (ids de verdade), e a
versão que o co-Mestre grava é traduzida antes de entrar no Encontro.

**A escrita que desiste.** Quando a gravação da sessão de um personagem de jogador desiste (rede ou conflito sem fim), os passos da ação ficam guardados, e o Tentar
de Novo do aviso os aplica por cima da versão de agora do banco (`sessaoDoJogadorQueSobe`).

**A mesma mudança dos dois lados.** A mesclagem (`reaplicarSobre`, `usar-encontro.js`) leva a diferença de um
lado por cima da versão do outro, e nos números relativos do motor (Vida, PE, Alma, as cascas por fonte) leva
a SOMA: o Mestre tirando 5 e o jogador tirando 1 ao mesmo tempo dá -6, nunca -1.

**O personagem que chega com a luta começada** (entrou depois do Começar, ou a sessão dele chegou depois)
começa o combate na sessão dele, com a rodada da luta.

**Fechar.** O Mestre encerra a luta, espera as escritas chegarem ao banco e só então chama `fechar_sala`. O
Encontro dele vira Finalizado só com o Registro (`registroSala`): a sessão do personagem de um jogador fica
com o jogador e não vai para a nuvem pessoal do Mestre (autor, 2026-11-18, "Só o Registro"). Quem estava na
Sala grava o Finalizado na própria lista (`sala_<id da Sala>`), com a sessão final dos PRÓPRIOS personagens
(`sessaoFinal`, para consulta), e a sessão final na loja, só se a do aparelho não foi gravada depois da última gravação na Sala e do fechamento
(`salaMaisNova`, revisão final, autor, "Mais Nova Vence"). Quem estava fora recebe tudo no próximo login (`recuperarSalasFechadas`, no `App.jsx`):
as Salas fechadas de `minhas_salas` que não estão em `afty_salas_recebidas_v1` (lista de `{ id }`, vai para a
nuvem pessoal, e é ela que impede o Finalizado apagado de voltar). O Registro guardado é o público mais as
completas que o aparelho recebeu ao vivo ou que a própria conta escreveu, nunca uma releitura do completo.

### As telas e o que o cliente ganhou na 7c (2026-11-18)

As telas moram em `src/nuvem/sala-ui/` (guia delas em `docs/afty-encontros.md`, "As telas da Sala").

- **Sinais do jogador ao Mestre** como linha de `rolagem` (sem SQL novo): `dados.iniciativa` e `dados.fimDeTurno`. O banco confere que o jogador é dono do combatente que
  rola. O Mestre trata uma vez por linha, e o tratado fica em `encontro.sala.sinais` (`sala-telas.js`, `sinaisDoJogador`).
- **Rolagens da Ficha** viram linha de `rolagem` (id `rol:<id da rolagem>`): o espelho do jogador publica o que o `log` da sessão ganhou, e a ligação do Mestre o que o `log`
  de uma criatura ganhou. A rolagem escondida é só do Mestre (`escondida: true`).
- **Pedido do jogador**: `registrar("pedido", ...)` com a intenção e `delta: []`. O dono do alvo responde por `responder_pedido` com a operação medida no aparelho dele.
- **Escrita que desiste**: `useSalaDoEncontro` devolve `falhas` e `tentarDeNovo`, e a tela do Mestre mostra o aviso.

### Como usar a Sala (passo a passo)

Só com a nuvem ligada (conta Google ou Discord entrada).

**Mestre**
1. Abra o Encontro (planejando ou em luta) e clique em **Abrir Sala** no cabeçalho. Escolha uma senha (4 a 64 caracteres). O código de 6 caracteres e o link
   `/Sala/<código>` aparecem com Copiar. Cada Mestre tem até 2 Salas abertas.
2. Mande o link e a senha aos jogadores. Criatura nova entra **Oculta**: troque a visão de cada uma (Oculta, Só Nome, Barra de Vida, Aberta) quando quiser mostrá-la.
3. Conduza a luta como no Encontro local. O personagem de cada jogador entra no Encontro sozinho, e o Mestre muda Vida, PE, Alma, condições e Efeitos nele. Cada mudança
   fica no Histórico da ficha do jogador, que pode desfazer.
4. Em **Controles** (o botão vira Sala `<código>`): Remover, Promover a Mestre (só quem criou), Trocar a Senha, Trancar e **Fechar a Sala**. Fechar encerra a luta e vira o
   Encontro Finalizado, com o Registro, na sua lista.

**Jogador**
1. Abra o link, entre com Google ou Discord, digite a senha e escolha **Jogador** (ou **Espectador**, sem ficha).
2. Escolha uma ou mais fichas e a iniciativa. Elas ficam ligadas nos dois sentidos: o que o Mestre muda aparece na sua ficha, e o que você muda aparece no Mestre.
3. Dano e cura em criatura ou em colega saem como **pedido**: o dono do alvo aceita (o Mestre, nas criaturas). Você abre a Ficha inteira de um colega só se ele a compartilhar.
4. **Encerrar Meu Turno** fica na faixa da luta. Rolagens e chat vão para o Registro.

**No celular (etapa E7 do app, 2026-11-20).** Na lista da Guilda, o botão **Sala** do cabeçalho aceita o código ou o link colado.
No celular e no app instalado, o **Editar** da Ficha na Sala abre o criador no mesmo app (e não numa aba nova), e Salvar ou Cancelar
voltam para a Sala. Um link de Sala aberto direto no app leva à Guilda no Voltar. Detalhes em `docs/app-celular.md`.

**Ausente no fechamento.** Quem não estava na Sala quando ela fechou recebe a sessão final das fichas e o Registro no próximo login (até 14 dias depois). Se usou a Ficha sozinho depois do fechamento, a sessão do aparelho fica, e a da
Sala fica no Encontro Finalizado para consulta.

### Manutenção

- **Mudar um teto**: `update sala_interno.tetos set ...;` (ver a tabela acima). Vale na hora.
- **Mudar a assinatura de uma RPC** numa versão nova do `salas.sql` exige `drop function` da antiga antes do `create or replace`. Senão a antiga fica no ar como
  sobrecarga, e o cliente pode chamar a errada. O arquivo é idempotente para tudo o mais e pode ser colado de novo.
- **A varredura** (`sala_varrer`, pg_cron a cada 15 minutos) fecha as Salas paradas e apaga as fechadas há mais de 14 dias. Conferir que roda:
  `select jobname, schedule, active from cron.job;` e `select status, start_time from cron.job_run_details order by start_time desc limit 5;`. Sem pg_cron, as RPCs
  de entrada varrem sozinhas (no máximo a cada 5 minutos).
- **Cota**: o banco do plano grátis é o mesmo das fichas (500 MB). Uma ficha completa em `sala_fichas` chega a 2 MB e sai quando a Sala fecha.
- **O que cresce sem teto**: `afty_salas_recebidas_v1` (um `{ id }` por Sala fechada que o aparelho recebeu, na nuvem pessoal). Ver `docs/a-fazer.md`.
- **Privacidade**: o que a Sala mostra aos outros membros está descrito em `public/privacidade.html`. Mudou o que viaja ou o que é guardado, mude a página junto.

### Testar no computador

⚠ **Com o `.env.local` o `npm run dev` fala com o Supabase de PRODUÇÃO**, e a nuvem pessoal sincroniza no dev para a conta logada. Use contas de teste. O arquivo não
fica no repositório (ignorado pelo git) e foi apagado em 2026-11-18, a pedido do autor, depois da prova da 7c: recrie-o só para testar.

1. `grimorio-tracker/.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (a chave publishable que o
   site no ar já usa), e `npm run dev`.
2. Duas contas em dois perfis do navegador. O login do Google
   recusa a janela que o Playwright controla: entre num Chrome comum com o mesmo perfil (`--user-data-dir`) e
   depois o roteiro usa o perfil já logado.
3. O Mestre abre `/Sala/Nova?encontro=<id do Encontro>&grupo=site`, põe a senha, e cai em `/Sala/<código>`.
4. O jogador abre `/Sala/<código>`, põe a senha, Pôr na Sala e Abrir Ficha.

A prova de 2026-11-18 (Playwright, as duas contas, no dev) passou em tudo: senha errada recusada, personagem do
jogador no Encontro do Mestre, o começo do combate na sessão do jogador, a Vida mudada pelo Mestre na Ficha
do jogador, a mudança do jogador no Mestre, mudança simultânea e conflito sem rede sem perder nenhum lado,
criatura Oculta em nenhuma resposta da rede do jogador (REST e quadros do tempo real), criatura em Barra sem
número de Vida, Finalizado do Mestre com o Registro, e o jogador ausente no fechamento recebendo a sessão final
e o Registro no login seguinte.
