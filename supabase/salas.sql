-- Sala online do Grimório (Supabase). Etapa 7a do Encontro Unificado, 2026-11-17.
--
-- Colar INTEIRO no SQL Editor do projeto e rodar (Run). Pode rodar de novo: tudo
-- é idempotente (if not exists, create or replace, drop ... if exists antes de
-- criar). Não toca em public.fichas nem em public.chaves. Passo a passo e roteiro
-- de prova da RLS em docs/nuvem-supabase.md, seção "Sala Online".
--
-- Para mudar um teto depois (o padrão vem das decisões do autor em 2026-11-17):
--   update sala_interno.tetos set horas_parada = 8;
--
-- ============================================================================
-- MODELO DE AMEAÇA
-- ============================================================================
-- A chave publishable vai no JavaScript do site, então qualquer pessoa conversa
-- com a Data API e com o tempo real. Quem esconde é o BANCO. A tela só mostra o
-- que já chegou cortado.
--
-- QUEM NÃO É MEMBRO (com ou sem conta)
--   Lê: nada de nenhuma tabela da Sala. O anon não tem grant em tabela nenhuma e
--   não executa função nenhuma. Com conta, só ver_sala(código), que devolve o
--   grupo e se está trancada (e o papel, se já for membro), e só de Sala aberta.
--   Grava: só criar_sala e entrar_na_sala. Entrar pede a senha (bcrypt do
--   pgcrypto), recusa Sala trancada, cheia e quem foi removido, e para depois de
--   10 senhas erradas numa hora na mesma Sala (30 somando todas).
--   Conta anônima (Anonymous Sign-In) é recusada em tudo (autor: "Só com Conta").
--
-- ESPECTADOR (membro sem ficha)
--   Lê: a Sala sem o senha_hash, os membros ativos, o estado (status, rodada,
--   configurações, versão), o resumo de todo personagem e das criaturas que não
--   estão Ocultas (já cortado pela visão), a ficha e a sessão das criaturas
--   Abertas e de quem compartilhou com ele, o Registro público, e a operação
--   completa só quando enxerga a ficha de todos os envolvidos.
--   Grava: chat.
--
-- JOGADOR
--   Lê: o que o espectador lê, mais a ficha e a sessão dos próprios combatentes,
--   e o próprio pedido, a própria rolagem e o próprio chat completos, e o pedido
--   que um colega fez num combatente dele (para ter o id e a intenção e responder).
--   Grava: os próprios personagens (pôr, tirar, resumo, ficha e sessão) e o
--   compartilhamento deles, operação direta só no que é dele, pedido no que não
--   é (e só em alvo que ele enxerga), rolagem nunca escondida, chat. Responde o
--   pedido feito num combatente dele.
--
-- MESTRE E CO-MESTRE
--   Lê: tudo da Sala, menos o senha_hash. A ordem completa e a vez.
--   Grava: tudo do jogo (combatentes, visão, dono, estado, ordem, sessões,
--   operações, rolagem escondida, respostas), trancar, trocar a senha, remover
--   jogador e espectador, fechar. A FICHA (a criação) de um personagem que tem
--   dono continua só do dono.
--
-- QUEM CRIOU (o dono da Sala)
--   O que o Mestre faz, mais promover, rebaixar e remover co-Mestre. Ninguém
--   remove nem rebaixa quem criou.
--
-- POR QUÊ, E COMO O BANCO SEGURA CADA PONTO
-- 1. Nenhum grant de escrita em tabela. Toda escrita é RPC security definer com
--    search_path vazio, que lê a conta de auth.uid() (nunca do JSON do cliente)
--    e o papel de sala_membros. O autor de toda operação é reescrito aqui.
--    ⚠ Toda conferência de dono usa "is not distinct from": o dono nulo é o
--    combatente que o Mestre controla, e um NULL dentro de "if not (...)" deixa
--    passar calado (a prova local pegou o jogador gravando a ficha da criatura).
-- 2. Leitura por RLS em TODAS as tabelas, com ajudantes security definer no
--    esquema sala_interno, que fica fora da Data API. Uma política de
--    sala_membros que lesse sala_membros recursaria. O ajudante não recursa.
-- 3. senha_hash: privilégio por coluna (o authenticated tem SELECT nas outras
--    colunas, e "select *" falha). A tabela salas fica FORA da publicação do
--    tempo real (autor: "Fora da Publicação"). Trancar e fechar sobem a versão.
-- 4. O resumo cortado é calculado AQUI, da visão gravada no banco. O resumo
--    completo mora em sala_interno.resumos_completos, sem grant nenhum, e
--    sala_resumos.publico é o corte. Trocar a visão recorta sem o dono publicar
--    de novo. Barra de Vida mostra só a faixa (cinco faixas), nunca o número.
-- 5. A versão pública da operação é calculada AQUI, da visão de TODOS os
--    envolvidos naquela hora. Com um envolvido Oculto (ou desconhecido) não
--    existe linha pública. A sequência pública é própria, sem buraco que revele
--    a escondida. É uma LISTA BRANCA de campos: nunca o delta, nunca a Vida de
--    verdade de quem não está Aberto, nunca os registros da Ficha, nunca o id que
--    o aparelho deu à operação (o contador dentro dele revelaria quantas o
--    Mestre fez escondido). Rolagem escondida não gera linha pública (autor:
--    "Nada"). Em Só Nome e Barra, o valor rolado de Dano e Cura aparece, o de
--    PE, Alma e Condições não (autor: "Dano e Cura Rolados").
-- 6. A ordem do jogador sai dos resumos que ele pode ler. A posição é contada só
--    entre os visíveis (sem buraco que revele um Oculto entre dois), e na vez de
--    um Oculto ninguém visível está na vez.
-- 7. postgres_changes passa cada evento pela RLS do assinante, mas o assinante
--    NÃO recebe evento quando uma linha deixa de passar pela RLS (a criatura
--    ficou Oculta, o colega tirou o compartilhamento, o membro foi removido, o
--    papel mudou). Por isso toda mudança de visão, dono, compartilhamento,
--    papel ou membro sobe sala_estado.versao (por gatilho, além das RPCs), e o
--    cliente relê tudo ao ver a versão nova. O membro removido lê a PRÓPRIA linha
--    de sala_membros, e é por ela que o removido_em chega até ele.
-- 8. DELETE não passa pela RLS no tempo real: a chave primária da linha apagada
--    iria para TODOS os assinantes da tabela, de todas as Salas. Por isso a
--    publicação supabase_realtime passa a publicar só insert e update (nenhum
--    DELETE sai do banco, e a limpeza das Salas velhas não manda nada para
--    ninguém), e toda chave primária publicada é uuid aleatório, nunca a Sala
--    ou o combatente. NUNCA pôr replica identity full nestas tabelas.
-- 9. Presence (quem está online) só em canal privado "sala:<id>", com política
--    em realtime.messages para membro. Precisa desligar "Allow public access" em
--    Realtime Settings. Dado escondido nunca vai por Broadcast. Com o acesso
--    público desligado TODO canal é privado: a 7b confirma no projeto que o
--    canal das postgres_changes entra (o mais simples é o mesmo "sala:<id>").
-- 10. Id Oculto e id que não existe dão o MESMO erro para quem não é Mestre
--    ("Combatente Ausente" no pedido, na operação, no resumo, na ficha e no
--    tirar), e o pedido que a pessoa não pode responder dá "Pedido Ausente".
--
-- O QUE O BANCO NÃO CONSEGUE ESCONDER (fica com o cliente, etapa 7b)
-- - A sessão é JSON opaco aqui. O histórico (sessao.historico) e o log que o
--   Mestre grava na sessão de um personagem são lidos inteiros pelo dono: a
--   operação que entra lá precisa ser a versão que o dono pode ver (sem o
--   combatente Oculto que agiu, sem a rolagem de criatura que ele não vê).
-- - O texto do chat é de quem escreveu.
-- - O ritmo: a vez de um Oculto aparece como "não é a vez de ninguém visível"
--   (o plano aceita).
-- - O nome e o avatar do membro vêm do Google ou do Discord (nunca o e-mail).
-- - Um id que COLIDE conta que existe: adicionar_combatente responde "Combatente
--   Repetido" e gravar_operacao "Operação Repetida". Os ids novos do Encontro são
--   aleatórios, mas os migrados da 2.5.2 mantêm o formato antigo.
-- - A leitura COMPLETA do registro segue a visão e os compartilhamentos de AGORA:
--   quando a criatura vira Aberta, ou o colega compartilha a ficha, as operações
--   completas de antes com ela passam a ser lidas. O Encontro Finalizado de cada
--   um (7b) se monta das linhas públicas e do que o aparelho recebeu ao vivo,
--   nunca relendo o registro completo no fechamento.
-- ============================================================================

begin;

-- ============================================================================
-- EXTENSÕES E ESQUEMA INTERNO
-- ============================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
do $$
begin
  if (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace
      where e.extname = 'pgcrypto') is distinct from 'extensions' then
    raise exception 'O pgcrypto precisa estar no esquema extensions';
  end if;
end $$;

-- Os ajudantes das políticas e as tabelas sem grant. Fora da Data API (não
-- acrescentar este esquema em Exposed Schemas). O authenticated precisa de USAGE
-- porque as políticas e o tempo real avaliam os ajudantes com o papel dele.
create schema if not exists sala_interno;
revoke all on schema sala_interno from public;
grant usage on schema sala_interno to authenticated;

-- ============================================================================
-- TETOS (uma linha, decisões do autor em 2026-11-17)
-- ============================================================================

create table if not exists sala_interno.tetos (
  id                   boolean primary key default true,
  pessoas_por_sala     integer not null,
  salas_por_mestre     integer not null,
  horas_parada         integer not null,
  dias_guardada        integer not null,
  combatentes_por_sala integer not null,
  operacoes_por_sala   integer not null,
  tentativas_por_hora  integer not null,
  constraint tetos_uma_linha check (id),
  constraint tetos_faixas check (
    pessoas_por_sala between 2 and 50 and salas_por_mestre between 1 and 20
    and horas_parada between 1 and 168 and dias_guardada between 1 and 90
    and combatentes_por_sala between 1 and 500 and operacoes_por_sala between 100 and 100000
    and tentativas_por_hora between 1 and 100)
);
-- O "do nothing" preserva o que o autor mudou depois: rodar de novo não volta ao padrão.
insert into sala_interno.tetos (id, pessoas_por_sala, salas_por_mestre, horas_parada, dias_guardada,
  combatentes_por_sala, operacoes_por_sala, tentativas_por_hora)
values (true, 8, 2, 6, 14, 60, 10000, 10)
on conflict (id) do nothing;

-- A última varredura (fechar as paradas, apagar as velhas), para a varredura
-- preguiçosa das RPCs não rodar a cada chamada.
create table if not exists sala_interno.varredura (
  id boolean primary key default true,
  em timestamptz not null default '-infinity',
  constraint varredura_uma_linha check (id)
);
insert into sala_interno.varredura (id) values (true) on conflict (id) do nothing;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- A Sala. Uma Sala é UM Encontro. O código tem seis caracteres sem os ambíguos
-- (sem I, L, O, 0 e 1). Lida pelos membros SEM o senha_hash (grant por coluna).
create table if not exists public.salas (
  id               uuid        primary key default gen_random_uuid(),
  codigo           text        not null unique,
  grupo            text        not null,
  nome             text        not null default 'Encontro',
  dono             uuid        not null references auth.users (id) on delete cascade,
  senha_hash       text        not null,
  trancada         boolean     not null default false,
  status           text        not null default 'aberta',
  criada_em        timestamptz not null default now(),
  ultima_atividade timestamptz not null default now(),
  fechada_em       timestamptz,
  fechada_por      text,
  constraint salas_codigo check (codigo ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  constraint salas_nome check (char_length(nome) between 1 and 120),
  constraint salas_status check (status in ('aberta', 'fechada')),
  constraint salas_fechada check ((status = 'fechada') = (fechada_em is not null)),
  constraint salas_fechada_por check (fechada_por is null or fechada_por in ('mestre', 'parada'))
);
alter table public.salas
  drop constraint if exists salas_grupo,
  add constraint salas_grupo check (grupo in ('site', 'afty', 'eradeouro', 'eclesiastes'));
create index if not exists salas_por_dono on public.salas (dono, status);
create index if not exists salas_paradas on public.salas (status, ultima_atividade);
create index if not exists salas_fechadas on public.salas (status, fechada_em);

-- Quem está na Sala. O removido fica (removido_em) para não entrar de novo.
create table if not exists public.sala_membros (
  id          uuid        primary key default gen_random_uuid(),
  sala_id     uuid        not null references public.salas (id) on delete cascade,
  conta       uuid        not null references auth.users (id) on delete cascade,
  papel       text        not null,
  nome        text        not null default '',
  avatar      text,
  entrou_em   timestamptz not null default now(),
  removido_em timestamptz,
  constraint sala_membros_unico unique (sala_id, conta),
  constraint sala_membros_papel check (papel in ('mestre', 'jogador', 'espectador')),
  constraint sala_membros_nome check (char_length(nome) <= 80),
  constraint sala_membros_avatar check (avatar is null or (char_length(avatar) <= 500 and avatar ~ '^https://'))
);
create index if not exists sala_membros_por_conta on public.sala_membros (conta, sala_id);

-- O estado da luta. A versão sobe quando o que alguém pode ler mudou SEM evento
-- (ver o item 7 do modelo de ameaça): o cliente relê ao ver a versão nova.
create table if not exists public.sala_estado (
  sala_id       uuid        primary key references public.salas (id) on delete cascade,
  status        text        not null default 'planejando',
  rodada        integer     not null default 1,
  config        jsonb       not null default '{}'::jsonb,
  versao        bigint      not null default 1,
  atualizado_em timestamptz not null default now(),
  constraint sala_estado_status check (status in ('planejando', 'ativo', 'finalizado')),
  constraint sala_estado_rodada check (rodada between 1 and 100000),
  constraint sala_estado_config check (jsonb_typeof(config) = 'object' and octet_length(config::text) <= 4096)
);

-- A ordem COMPLETA e a vez. Só os Mestres leem.
create table if not exists public.sala_ordem_mestre (
  sala_id       uuid        primary key references public.salas (id) on delete cascade,
  ordem         text[]      not null default '{}',
  vez           text,
  atualizado_em timestamptz not null default now(),
  constraint sala_ordem_tamanho check (cardinality(ordem) <= 500)
);

-- Um por combatente. É também o cadastro dos combatentes da Sala: tipo, dono
-- (null = o Mestre controla), visão, nome, lado. `publico` é o resumo JÁ
-- CORTADO pela visão, calculado aqui. `posicao` e `na_vez` são a ordem vista
-- pelo jogador, contada só entre os visíveis.
create table if not exists public.sala_resumos (
  id            uuid        primary key default gen_random_uuid(),
  sala_id       uuid        not null references public.salas (id) on delete cascade,
  combatente    text        not null,
  tipo          text        not null,
  dono          uuid        references auth.users (id) on delete set null,
  visao         text,
  nome          text        not null,
  lado          text        not null default 'inimigo',
  posicao       integer,
  na_vez        boolean     not null default false,
  publico       jsonb       not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint sala_resumos_unico unique (sala_id, combatente),
  constraint sala_resumos_combatente check (combatente ~ '^[A-Za-z0-9_:.-]{1,100}$'),
  constraint sala_resumos_tipo check (tipo in ('personagem', 'criatura', 'marcador')),
  constraint sala_resumos_visao check (
    (tipo = 'personagem' and visao is null)
    or (tipo <> 'personagem' and visao in ('oculta', 'nome', 'barra', 'aberta'))),
  constraint sala_resumos_nome check (char_length(nome) between 1 and 120),
  constraint sala_resumos_lado check (lado in ('inimigo', 'jogador', 'aliado'))
);

-- O resumo completo, de onde sai o corte. Sem grant nenhum: só as RPCs leem.
create table if not exists sala_interno.resumos_completos (
  resumo_id     uuid        primary key references public.sala_resumos (id) on delete cascade,
  completo      jsonb       not null,
  atualizado_em timestamptz not null default now()
);

-- A ficha e a sessão, em linhas SEPARADAS: a sessão muda a cada clique e a
-- ficha quase nunca, e o tempo real manda a linha inteira a cada UPDATE.
create table if not exists public.sala_fichas (
  id             uuid        primary key default gen_random_uuid(),
  sala_id        uuid        not null,
  combatente     text        not null,
  parte          text        not null,
  dados          jsonb       not null,
  versao         bigint      not null default 1,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid,
  constraint sala_fichas_unico unique (sala_id, combatente, parte),
  constraint sala_fichas_combatente foreign key (sala_id, combatente)
    references public.sala_resumos (sala_id, combatente) on delete cascade,
  constraint sala_fichas_parte check (parte in ('ficha', 'sessao')),
  constraint sala_fichas_dados check (jsonb_typeof(dados) = 'object'),
  constraint sala_fichas_tamanho check (pg_column_size(dados) < 2000000)
);

-- A ficha inteira de um personagem aberta (só leitura) para um colega escolhido.
create table if not exists public.sala_compartilhamentos (
  id         uuid        primary key default gen_random_uuid(),
  sala_id    uuid        not null,
  combatente text        not null,
  para       uuid        not null references auth.users (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  constraint sala_compartilhamentos_unico unique (sala_id, combatente, para),
  constraint sala_compartilhamentos_combatente foreign key (sala_id, combatente)
    references public.sala_resumos (sala_id, combatente) on delete cascade
);
create index if not exists sala_compartilhamentos_para on public.sala_compartilhamentos (sala_id, para);

-- O registro COMPLETO, só de acréscimo: operações, pedidos, rolagens, chat e os
-- eventos do Mestre. `envolvidos` é calculado aqui, dos campos da operação.
create table if not exists public.sala_operacoes (
  id             uuid        primary key default gen_random_uuid(),
  sala_id        uuid        not null references public.salas (id) on delete cascade,
  seq            bigint      not null,
  especie        text        not null,
  operacao_id    text        not null,
  autor          uuid        references auth.users (id) on delete set null,
  papel          text        not null,
  dados          jsonb       not null,
  envolvidos     text[]      not null default '{}',
  escondida      boolean     not null default false,
  estado_pedido  text,
  respondido_por uuid,
  respondido_em  timestamptz,
  responde       uuid        references public.sala_operacoes (id) on delete set null,
  publica_id     uuid,
  criado_em      timestamptz not null default now(),
  constraint sala_operacoes_seq unique (sala_id, seq),
  constraint sala_operacoes_unica unique (sala_id, operacao_id, especie),
  constraint sala_operacoes_especie check (especie in ('operacao', 'pedido', 'rolagem', 'chat', 'sistema')),
  constraint sala_operacoes_pedido check ((especie = 'pedido') = (estado_pedido is not null)),
  constraint sala_operacoes_estado check (estado_pedido is null or estado_pedido in ('pendente', 'aceito', 'recusado')),
  constraint sala_operacoes_escondida check (not escondida or especie = 'rolagem'),
  constraint sala_operacoes_papel check (papel in ('mestre', 'jogador', 'espectador')),
  constraint sala_operacoes_tamanho check (octet_length(dados::text) <= 131072)
);

-- O registro PÚBLICO: a versão cortada de cada operação que pode ser vista,
-- com sequência própria. Gerado na mesma RPC, nunca pelo cliente.
create table if not exists public.sala_operacoes_publicas (
  id            uuid        primary key default gen_random_uuid(),
  sala_id       uuid        not null references public.salas (id) on delete cascade,
  seq           bigint      not null,
  especie       text        not null,
  publica       jsonb       not null,
  estado_pedido text,
  criado_em     timestamptz not null default now(),
  constraint sala_publicas_seq unique (sala_id, seq),
  constraint sala_publicas_especie check (especie in ('operacao', 'pedido', 'rolagem', 'chat', 'sistema')),
  constraint sala_publicas_estado check (estado_pedido is null or estado_pedido in ('pendente', 'aceito', 'recusado'))
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sala_operacoes_publica_fk') then
    alter table public.sala_operacoes add constraint sala_operacoes_publica_fk
      foreign key (publica_id) references public.sala_operacoes_publicas (id) on delete set null;
  end if;
end $$;

-- As senhas erradas, para parar a força bruta pela RPC.
create table if not exists sala_interno.tentativas (
  id      bigint      generated always as identity primary key,
  sala_id uuid        not null references public.salas (id) on delete cascade,
  conta   uuid        not null,
  em      timestamptz not null default now()
);
create index if not exists tentativas_por_conta on sala_interno.tentativas (conta, em);
create index if not exists tentativas_por_sala on sala_interno.tentativas (sala_id, conta, em);

-- Nunca "full": com full, o DELETE mandaria a linha inteira para todo assinante.
alter table public.sala_membros replica identity default;
alter table public.sala_estado replica identity default;
alter table public.sala_ordem_mestre replica identity default;
alter table public.sala_resumos replica identity default;
alter table public.sala_fichas replica identity default;
alter table public.sala_compartilhamentos replica identity default;
alter table public.sala_operacoes replica identity default;
alter table public.sala_operacoes_publicas replica identity default;

-- ============================================================================
-- AJUDANTES DAS POLÍTICAS (security definer: leem sala_membros sem recursar)
-- ============================================================================

create or replace function sala_interno.papel(p_sala uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.papel from public.sala_membros m
  where m.sala_id = p_sala and m.conta = (select auth.uid()) and m.removido_em is null
$$;

create or replace function sala_interno.membro(p_sala uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sala_membros m
    where m.sala_id = p_sala and m.conta = (select auth.uid()) and m.removido_em is null)
$$;

create or replace function sala_interno.mestre(p_sala uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sala_membros m
    where m.sala_id = p_sala and m.conta = (select auth.uid()) and m.removido_em is null
      and m.papel = 'mestre')
$$;

create or replace function sala_interno.dono_de(p_sala uuid, p_combatente text)
returns uuid language sql stable security definer set search_path = '' as $$
  select r.dono from public.sala_resumos r where r.sala_id = p_sala and r.combatente = p_combatente
$$;

-- A ficha completa (e a sessão) de um combatente: Mestre, dono, criatura Aberta,
-- ou quem recebeu o compartilhamento. Sempre de membro ativo.
create or replace function sala_interno.pode_ler_ficha(p_sala uuid, p_combatente text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.sala_membros m
    join public.sala_resumos r on r.sala_id = m.sala_id and r.combatente = p_combatente
    where m.sala_id = p_sala and m.conta = (select auth.uid()) and m.removido_em is null
      and (m.papel = 'mestre'
        or r.dono = m.conta
        or (r.tipo = 'criatura' and r.visao = 'aberta')
        or exists (
          select 1 from public.sala_compartilhamentos c
          where c.sala_id = r.sala_id and c.combatente = r.combatente and c.para = m.conta)))
$$;

-- A operação completa: só quem enxerga a ficha de TODOS os envolvidos.
create or replace function sala_interno.pode_ler_todos(p_sala uuid, p_envolvidos text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(bool_and(sala_interno.pode_ler_ficha(p_sala, c)), true) from unnest(p_envolvidos) as c
$$;

-- O canal de Presence de uma Sala é "sala:<uuid>".
create or replace function sala_interno.topico_de_membro(p_topico text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when p_topico ~ '^sala:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then sala_interno.membro(substr(p_topico, 6)::uuid)
    else false end
$$;

-- ============================================================================
-- POLÍTICAS (só SELECT: nenhuma tabela tem grant de escrita)
-- ============================================================================

alter table sala_interno.tetos enable row level security;
alter table sala_interno.varredura enable row level security;
alter table sala_interno.resumos_completos enable row level security;
alter table sala_interno.tentativas enable row level security;
alter table public.salas enable row level security;
alter table public.sala_membros enable row level security;
alter table public.sala_estado enable row level security;
alter table public.sala_ordem_mestre enable row level security;
alter table public.sala_resumos enable row level security;
alter table public.sala_fichas enable row level security;
alter table public.sala_compartilhamentos enable row level security;
alter table public.sala_operacoes enable row level security;
alter table public.sala_operacoes_publicas enable row level security;

drop policy if exists "membro le a sala" on public.salas;
create policy "membro le a sala" on public.salas for select to authenticated
  using (sala_interno.membro(id));

-- A própria linha sempre (é por ela que o removido fica sabendo). Os membros
-- ativos para todo membro. Os removidos só para os Mestres.
drop policy if exists "membro le os membros" on public.sala_membros;
create policy "membro le os membros" on public.sala_membros for select to authenticated
  using (conta = (select auth.uid())
    or sala_interno.mestre(sala_id)
    or (removido_em is null and sala_interno.membro(sala_id)));

drop policy if exists "membro le o estado" on public.sala_estado;
create policy "membro le o estado" on public.sala_estado for select to authenticated
  using (sala_interno.membro(sala_id));

drop policy if exists "mestre le a ordem" on public.sala_ordem_mestre;
create policy "mestre le a ordem" on public.sala_ordem_mestre for select to authenticated
  using (sala_interno.mestre(sala_id));

drop policy if exists "membro le o resumo visivel" on public.sala_resumos;
create policy "membro le o resumo visivel" on public.sala_resumos for select to authenticated
  using (sala_interno.mestre(sala_id)
    or (sala_interno.membro(sala_id) and (tipo = 'personagem' or visao <> 'oculta')));

drop policy if exists "quem pode le a ficha" on public.sala_fichas;
create policy "quem pode le a ficha" on public.sala_fichas for select to authenticated
  using (sala_interno.pode_ler_ficha(sala_id, combatente));

drop policy if exists "dono e destinatario leem" on public.sala_compartilhamentos;
create policy "dono e destinatario leem" on public.sala_compartilhamentos for select to authenticated
  using (sala_interno.membro(sala_id)
    and (para = (select auth.uid()) or sala_interno.dono_de(sala_id, combatente) is not distinct from (select auth.uid())));

drop policy if exists "quem ve todos le a operacao" on public.sala_operacoes;
create policy "quem ve todos le a operacao" on public.sala_operacoes for select to authenticated
  using (sala_interno.mestre(sala_id)
    or (not escondida and sala_interno.membro(sala_id)
      and ((autor = (select auth.uid()) and especie in ('pedido', 'rolagem', 'chat'))
        or (especie = 'pedido' and sala_interno.dono_de(sala_id, dados ->> 'alvo') is not distinct from (select auth.uid()))
        or sala_interno.pode_ler_todos(sala_id, envolvidos))));

drop policy if exists "membro le o registro publico" on public.sala_operacoes_publicas;
create policy "membro le o registro publico" on public.sala_operacoes_publicas for select to authenticated
  using (sala_interno.membro(sala_id));

-- ============================================================================
-- OS CORTES (puros). ⚠ ESPELHADOS em src/nuvem/sala-projecao.js. Mudou um, muda
-- o outro, e o asserts/t-sala-projecao.mjs confere as constantes dos dois.
-- ============================================================================

-- Número do JSON: só número de verdade, truncado e preso entre -1e9 e 1e9.
create or replace function sala_interno.inteiro(p jsonb)
returns bigint language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'number'
    then greatest(-1000000000::numeric, least(1000000000::numeric, trunc((p #>> '{}')::numeric)))::bigint
    else 0 end
$$;

-- Texto do JSON: só texto de verdade, cortado em n caracteres. O resto vira ''.
create or replace function sala_interno.texto(p jsonb, p_tamanho integer)
returns text language sql immutable set search_path = '' as $$
  select case when jsonb_typeof(p) = 'string' then left(p #>> '{}', p_tamanho) else '' end
$$;

-- Lista de textos não vazios, os primeiros n, cada um cortado.
create or replace function sala_interno.textos(p jsonb, p_itens integer, p_tamanho integer)
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(left(x.valor, p_tamanho) order by x.ord), '[]'::jsonb)
  from (
    select a.e #>> '{}' as valor, a.ord
    from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end)
      with ordinality as a(e, ord)
    where jsonb_typeof(a.e) = 'string' and a.e #>> '{}' <> ''
    order by a.ord
    limit p_itens
  ) as x
$$;

-- Lista de números (os primeiros n), cada um pelo inteiro().
create or replace function sala_interno.inteiros(p jsonb, p_itens integer)
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(sala_interno.inteiro(x.e) order by x.ord), '[]'::jsonb)
  from (
    select a.e, a.ord
    from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end)
      with ordinality as a(e, ord)
    where jsonb_typeof(a.e) = 'number'
    order by a.ord
    limit p_itens
  ) as x
$$;

-- Nomes de condição: texto, ou objeto com `nome`. Um item solto vira lista de um.
create or replace function sala_interno.nomes(p jsonb, p_itens integer, p_tamanho integer)
returns jsonb language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(left(x.valor, p_tamanho) order by x.ord), '[]'::jsonb)
  from (
    select case when jsonb_typeof(a.e) = 'string' then a.e #>> '{}' else a.e ->> 'nome' end as valor, a.ord
    from jsonb_array_elements(case
        when jsonb_typeof(p) = 'array' then p
        when jsonb_typeof(p) in ('string', 'object') then jsonb_build_array(p)
        else '[]'::jsonb end) with ordinality as a(e, ord)
    where (jsonb_typeof(a.e) = 'string' and a.e #>> '{}' <> '')
       or (jsonb_typeof(a.e) = 'object' and jsonb_typeof(a.e -> 'nome') = 'string' and a.e ->> 'nome' <> '')
    order by a.ord
    limit p_itens
  ) as x
$$;

-- O resumo completo que o dono publica (a forma do `resumo` dos motores), só com
-- os campos conhecidos. A Vida pode ser negativa (o saldo do Vital CL2).
create or replace function sala_interno.resumo_saneado(p jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'pv', sala_interno.inteiro(p -> 'pv'),
    'pvMax', greatest(0, sala_interno.inteiro(p -> 'pvMax')),
    'pvTemp', greatest(0, sala_interno.inteiro(p -> 'pvTemp')),
    'pe', greatest(0, sala_interno.inteiro(p -> 'pe')),
    'peMax', greatest(0, sala_interno.inteiro(p -> 'peMax')),
    'peTemp', greatest(0, sala_interno.inteiro(p -> 'peTemp')),
    'alma', greatest(0, sala_interno.inteiro(p -> 'alma')),
    'almaMax', greatest(0, sala_interno.inteiro(p -> 'almaMax')),
    'condicoes', sala_interno.textos(p -> 'condicoes', 40, 80),
    'efeitos', sala_interno.textos(p -> 'efeitos', 40, 80),
    'caido', coalesce(p -> 'caido' = 'true'::jsonb, false),
    'morto', coalesce(p -> 'morto' = 'true'::jsonb, false))
$$;

-- As cinco faixas da Barra de Vida (autor: "Cinco Faixas"), com os cortes de 50%
-- e 25% da barra curta. Conta inteira, sem fração. Sem máximo, sem faixa.
create or replace function sala_interno.faixa_de_vida(p_pv bigint, p_max bigint)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_max is null or p_max <= 0 then null
    when p_pv <= 0 then 'caida'
    when p_pv * 4 <= p_max then 'ate_um_quarto'
    when p_pv * 2 <= p_max then 'ate_a_metade'
    when p_pv < p_max then 'acima_da_metade'
    else 'inteira' end
$$;

-- O resumo que o jogador lê: personagem e Aberta, o completo. Barra, só a faixa.
-- Só Nome, Oculta e marcador, nada. Sem completo publicado, nada.
create or replace function sala_interno.resumo_por_visao(p_completo jsonb, p_tipo text, p_visao text)
returns jsonb language sql immutable set search_path = '' as $$
  select case
    when p_completo is null or p_tipo = 'marcador' then '{}'::jsonb
    when p_tipo = 'personagem' or p_visao = 'aberta' then p_completo
    when p_visao = 'barra' then jsonb_build_object('faixa', sala_interno.faixa_de_vida(
      sala_interno.inteiro(p_completo -> 'pv'), sala_interno.inteiro(p_completo -> 'pvMax')))
    else '{}'::jsonb end
$$;

-- O nível de um combatente no Registro público: 0 Oculta (ou ausente), 1 Só Nome,
-- 2 Barra, 3 Aberta. O personagem conta como Aberta (o colega lê o resumo dele).
create or replace function sala_interno.nivel(p_sala uuid, p_combatente text)
returns integer language sql stable set search_path = '' as $$
  select coalesce((
    select case
      when r.tipo = 'personagem' or r.visao = 'aberta' then 3
      when r.visao = 'barra' then 2
      when r.visao = 'nome' then 1
      else 0 end
    from public.sala_resumos r where r.sala_id = p_sala and r.combatente = p_combatente), 0)
$$;

create or replace function sala_interno.ref(p_sala uuid, p_combatente text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', p_combatente, 'nome',
    (select r.nome from public.sala_resumos r where r.sala_id = p_sala and r.combatente = p_combatente))
$$;

-- Os envolvidos de uma operação, sem repetir, na ordem: alvo, combatente do
-- autor, quem aplicou. Na rolagem e no evento, o combatente.
create or replace function sala_interno.envolvidos(p_especie text, p_dados jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(x.c order by x.o), '{}'::text[])
  from (
    select u.c, min(u.o) as o
    from unnest(case
        when p_especie in ('operacao', 'pedido') then array[
          case when jsonb_typeof(p_dados -> 'alvo') = 'string' then p_dados ->> 'alvo' end,
          case when jsonb_typeof(p_dados #> '{autor,combatente}') = 'string' then p_dados #>> '{autor,combatente}' end,
          case when jsonb_typeof(p_dados #> '{entrada,aplicadorId}') = 'string'
            then nullif(p_dados #>> '{entrada,aplicadorId}', 'proprio') end]
        when p_especie in ('rolagem', 'sistema') then array[
          case when jsonb_typeof(p_dados -> 'combatente') = 'string' then p_dados ->> 'combatente' end]
        else array[]::text[] end) with ordinality as u(c, o)
    where u.c is not null and u.c <> ''
    group by u.c
  ) as x
$$;

-- A VERSÃO PÚBLICA de uma operação, ou null quando ela não pode ser vista.
-- `p_dados` já vem com o autor reescrito pelo servidor.
create or replace function sala_interno.publica(p_sala uuid, p_especie text, p_dados jsonb, p_escondida boolean)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  v_c       text;
  v_min     integer := 3;
  v_saida   jsonb;
  v_autor   jsonb;
  v_r       jsonb;
  v_alvo    text;
  v_nivel   integer;
  v_tipo    text;
  v_entrada jsonb;
  v_modo    text;
  v_mud     jsonb;
  v_max     bigint;
begin
  if p_escondida then return null; end if;
  foreach v_c in array sala_interno.envolvidos(p_especie, p_dados) loop
    v_min := least(v_min, sala_interno.nivel(p_sala, v_c));
  end loop;
  if v_min = 0 then return null; end if;

  v_autor := jsonb_build_object('conta', p_dados #> '{autor,conta}', 'papel', p_dados #> '{autor,papel}');
  if p_especie in ('operacao', 'pedido') and jsonb_typeof(p_dados #> '{autor,combatente}') = 'string' then
    v_autor := v_autor || jsonb_build_object('combatente', sala_interno.ref(p_sala, p_dados #>> '{autor,combatente}'));
  end if;
  v_saida := jsonb_build_object('especie', p_especie, 'autor', v_autor);

  if p_especie = 'chat' then
    return v_saida || jsonb_build_object('texto', sala_interno.texto(p_dados -> 'texto', 1000));
  end if;

  if p_especie = 'sistema' then
    v_saida := v_saida || jsonb_build_object('evento', sala_interno.texto(p_dados -> 'evento', 20));
    if jsonb_typeof(p_dados -> 'rodada') = 'number' then
      v_saida := v_saida || jsonb_build_object('rodada', sala_interno.inteiro(p_dados -> 'rodada'));
    end if;
    if jsonb_typeof(p_dados -> 'combatente') = 'string' then
      v_saida := v_saida || jsonb_build_object('combatente', sala_interno.ref(p_sala, p_dados ->> 'combatente'));
    end if;
    return v_saida;
  end if;

  if p_especie = 'rolagem' then
    v_r := case when jsonb_typeof(p_dados -> 'rolagem') = 'object' then p_dados -> 'rolagem' else '{}'::jsonb end;
    if jsonb_typeof(p_dados -> 'combatente') = 'string' then
      v_saida := v_saida || jsonb_build_object('combatente', sala_interno.ref(p_sala, p_dados ->> 'combatente'));
    end if;
    v_saida := v_saida || jsonb_build_object(
      'tipo', case when v_r ->> 'tipo' in ('teste', 'dano', 'info') then v_r ->> 'tipo' end,
      'total', sala_interno.inteiro(v_r -> 'total'));
    -- Só de quem está Aberto (ou de personagem, ou sem combatente): o detalhe da
    -- rolagem conta a ficha de quem rolou.
    if v_min >= 3 then
      v_saida := v_saida || jsonb_build_object(
        'rotulo', sala_interno.texto(v_r -> 'rotulo', 120),
        'formula', sala_interno.texto(v_r -> 'formula', 200),
        'natural', sala_interno.inteiro(v_r -> 'natural'),
        'd20', sala_interno.inteiros(v_r -> 'd20', 4),
        'dados', sala_interno.inteiros(v_r -> 'dados', 100),
        'critico', coalesce(v_r -> 'critico' = 'true'::jsonb, false));
    end if;
    return v_saida;
  end if;

  -- Operação e pedido. O que se diz do ALVO vai até o nível dele.
  v_alvo := p_dados ->> 'alvo';
  v_nivel := sala_interno.nivel(p_sala, v_alvo);
  v_tipo := p_dados ->> 'tipo';
  v_entrada := case when jsonb_typeof(p_dados -> 'entrada') = 'object' then p_dados -> 'entrada' else '{}'::jsonb end;
  v_saida := v_saida || jsonb_build_object('tipo', v_tipo, 'alvo', sala_interno.ref(p_sala, v_alvo));

  if jsonb_typeof(v_entrada -> 'valor') = 'number'
     and (v_tipo in ('dano', 'danoMetade', 'cura')
       or (v_nivel >= 3 and v_tipo in ('gastarPe', 'recuperarPe', 'alma'))) then
    v_saida := v_saida || jsonb_build_object('valor', greatest(0, sala_interno.inteiro(v_entrada -> 'valor')));
  end if;

  if v_nivel >= 3 and v_tipo = 'alma' then
    v_modo := case when v_entrada ->> 'modo' in ('dano', 'cura', 'definir') then v_entrada ->> 'modo' else 'dano' end;
    v_saida := v_saida || jsonb_build_object('modo', v_modo);
  end if;
  if v_nivel >= 3 and v_tipo = 'condicao' then
    v_modo := case when v_entrada ->> 'modo' in ('adicionar', 'remover', 'definir') then v_entrada ->> 'modo' else 'definir' end;
    v_saida := v_saida || jsonb_build_object('modo', v_modo, 'condicoes', sala_interno.nomes(
      case when v_modo = 'definir' then v_entrada -> 'condicoes' else v_entrada -> 'condicao' end, 40, 80));
  end if;

  if v_tipo = 'desfazer' then
    v_saida := v_saida || jsonb_build_object(
      'tipoDesfeito', case when v_entrada ->> 'tipoDesfeito' in ('dano', 'danoMetade', 'cura', 'gastarPe',
        'recuperarPe', 'descansar', 'alma', 'condicao', 'sessao') then v_entrada ->> 'tipoDesfeito' end,
      'desfaz', (select to_jsonb(o.publica_id) from public.sala_operacoes o
        where o.sala_id = p_sala and o.operacao_id = p_dados ->> 'desfaz' and o.especie = 'operacao'));
  end if;

  -- A Vida do alvo: em Barra a faixa antes e depois, em Aberta os números. O
  -- máximo da faixa é o do resumo completo naquela hora.
  select d into v_mud
  from jsonb_array_elements(case when jsonb_typeof(p_dados -> 'delta') = 'array' then p_dados -> 'delta' else '[]'::jsonb end) as d
  where d -> 'caminho' in ('["hpAtual"]'::jsonb, '["hpCurrent"]'::jsonb)
  limit 1;
  if v_mud is not null and jsonb_typeof(v_mud -> 'antes') = 'number' and jsonb_typeof(v_mud -> 'depois') = 'number' then
    if v_nivel >= 3 then
      v_saida := v_saida || jsonb_build_object('vida', jsonb_build_object(
        'antes', sala_interno.inteiro(v_mud -> 'antes'), 'depois', sala_interno.inteiro(v_mud -> 'depois')));
    elsif v_nivel = 2 then
      select sala_interno.inteiro(c.completo -> 'pvMax') into v_max
      from public.sala_resumos r join sala_interno.resumos_completos c on c.resumo_id = r.id
      where r.sala_id = p_sala and r.combatente = v_alvo;
      v_saida := v_saida || jsonb_build_object('vida', jsonb_build_object(
        'antes', sala_interno.faixa_de_vida(sala_interno.inteiro(v_mud -> 'antes'), v_max),
        'depois', sala_interno.faixa_de_vida(sala_interno.inteiro(v_mud -> 'depois'), v_max)));
    end if;
  end if;
  return v_saida;
end $$;

-- A ordem vista pelo jogador: posição contada só entre os visíveis, na ordem do
-- Mestre (a primeira vez que o id aparece), e a vez só se quem joga é visível.
create or replace function sala_interno.recalcular_ordem(p_sala uuid)
returns void language sql security definer set search_path = '' as $$
  with m as (
    select om.ordem, om.vez from public.sala_ordem_mestre om where om.sala_id = p_sala
  ), o as (
    select u.c, min(u.ord) as ord from m, unnest(m.ordem) with ordinality as u(c, ord) group by u.c
  ), vis as (
    select r.id, row_number() over (order by o.ord) as pos, r.combatente = (select m.vez from m) as vez
    from public.sala_resumos r join o on o.c = r.combatente
    where r.sala_id = p_sala and (r.tipo = 'personagem' or r.visao <> 'oculta')
  ), novo as (
    select r.id, v.pos::integer as pos, coalesce(v.vez, false) as vez
    from public.sala_resumos r left join vis v on v.id = r.id
    where r.sala_id = p_sala
  )
  update public.sala_resumos r set posicao = n.pos, na_vez = n.vez, atualizado_em = now()
  from novo n
  where n.id = r.id and (r.posicao is distinct from n.pos or r.na_vez is distinct from n.vez)
$$;

-- ============================================================================
-- INTERNAS DAS RPCs
-- ============================================================================

-- A conta de quem chama. Sem conta, ou conta anônima, nada feito.
create or replace function sala_interno.conta()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare v uuid := auth.uid();
begin
  if v is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Conta Necessária';
  end if;
  return v;
end $$;

-- Nome e avatar do Google ou do Discord. Nunca o e-mail: os outros membros leem.
create or replace function sala_interno.descricao(p_conta uuid)
returns table (nome text, avatar text) language sql stable security definer set search_path = '' as $$
  select
    left(coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), nullif(u.raw_user_meta_data ->> 'name', ''),
      nullif(u.raw_user_meta_data ->> 'user_name', ''), 'Conta'), 80),
    case when coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), u.raw_user_meta_data ->> 'picture') ~ '^https://'
      then left(coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), u.raw_user_meta_data ->> 'picture'), 500) end
  from (select p_conta as id) as q left join auth.users u on u.id = q.id
$$;

create or replace function sala_interno.validar_senha(p_senha text)
returns void language plpgsql immutable set search_path = '' as $$
begin
  if p_senha is null or char_length(p_senha) not between 4 and 64 then
    raise exception 'Senha de 4 a 64 Caracteres';
  end if;
end $$;

-- Seis caracteres do alfabeto sem ambíguos, de bytes aleatórios (sem viés: só os
-- bytes abaixo de 248, que é 8 vezes 31).
create or replace function sala_interno.gerar_codigo()
returns text language plpgsql volatile set search_path = '' as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_codigo text := '';
  v_b integer;
begin
  while char_length(v_codigo) < 6 loop
    v_bytes := extensions.gen_random_bytes(16);
    for i in 0 .. 15 loop
      v_b := get_byte(v_bytes, i);
      if v_b < 248 and char_length(v_codigo) < 6 then
        v_codigo := v_codigo || substr(v_alfabeto, (v_b % 31) + 1, 1);
      end if;
    end loop;
  end loop;
  return v_codigo;
end $$;

-- Fecha uma Sala: o estado vira Finalizado (com versão nova) e as fichas
-- completas saem na hora. Ficam as sessões e o Registro, para o ausente.
create or replace function sala_interno.ao_fechar(p_sala uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.sala_estado e set status = 'finalizado', versao = e.versao + 1, atualizado_em = now()
  where e.sala_id = p_sala;
  delete from public.sala_fichas f where f.sala_id = p_sala and f.parte = 'ficha';
  delete from sala_interno.tentativas a where a.sala_id = p_sala;
end $$;

-- Fecha as paradas e apaga as fechadas há mais dias que o teto. Preguiçosa (as
-- RPCs de entrada chamam, no máximo uma vez a cada 5 minutos) e pelo pg_cron.
create or replace function sala_interno.varrer(p_forcar boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_t  sala_interno.tetos;
  v_id uuid;
begin
  if p_forcar then
    update sala_interno.varredura set em = now() where id;
  else
    update sala_interno.varredura set em = now() where id and em < now() - interval '5 minutes';
    if not found then return; end if;
  end if;
  select * into v_t from sala_interno.tetos t where t.id;
  for v_id in
    update public.salas s set status = 'fechada', fechada_em = now(), fechada_por = 'parada'
    where s.status = 'aberta' and s.ultima_atividade < now() - make_interval(hours => v_t.horas_parada)
    returning s.id
  loop
    perform sala_interno.ao_fechar(v_id);
  end loop;
  delete from public.salas s where s.status = 'fechada' and s.fechada_em < now() - make_interval(days => v_t.dias_guardada);
  delete from sala_interno.tentativas a where a.em < now() - interval '1 day';
end $$;

-- A porta de toda escrita numa Sala: trava a linha da Sala (as escritas de uma
-- Sala ficam em fila), exige membro e Sala aberta e não parada, e marca a
-- atividade. Quem não é membro recebe "Sala Ausente", nunca "Sala Fechada".
create or replace function sala_interno.abrir(p_sala uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_s     public.salas;
  v_papel text;
  v_horas integer;
begin
  perform sala_interno.conta();
  select * into v_s from public.salas s where s.id = p_sala for update;
  v_papel := sala_interno.papel(p_sala);
  if v_s.id is null or v_papel is null then raise exception 'Sala Ausente'; end if;
  select t.horas_parada into v_horas from sala_interno.tetos t where t.id;
  if v_s.status <> 'aberta' or v_s.ultima_atividade < now() - make_interval(hours => v_horas) then
    raise exception 'Sala Fechada';
  end if;
  update public.salas s set ultima_atividade = now()
  where s.id = p_sala and s.ultima_atividade < now() - interval '1 minute';
  return v_papel;
end $$;

create or replace function sala_interno.resumo_de(p_sala uuid, p_combatente text)
returns public.sala_resumos language sql stable security definer set search_path = '' as $$
  select r.* from public.sala_resumos r where r.sala_id = p_sala and r.combatente = p_combatente
$$;

-- O combatente como quem chama enxerga: para quem não é Mestre, o Oculto volta
-- nulo, e a RPC responde "Combatente Ausente" igual a um id que não existe. Um
-- erro diferente contaria que o Oculto existe.
create or replace function sala_interno.resumo_visivel(p_sala uuid, p_combatente text, p_papel text)
returns public.sala_resumos language sql stable security definer set search_path = '' as $$
  select r.* from public.sala_resumos r
  where r.sala_id = p_sala and r.combatente = p_combatente
    and (p_papel = 'mestre' or r.tipo = 'personagem' or r.visao <> 'oculta')
$$;

-- Grava a operação completa e, se ela pode ser vista, a pública, cada uma com a
-- sua sequência. `p_dados` já vem conferido e com o autor do servidor.
create or replace function sala_interno.inserir_operacao(
  p_sala uuid, p_conta uuid, p_papel text, p_especie text, p_dados jsonb,
  p_escondida boolean, p_estado_pedido text, p_responde uuid)
returns table (id uuid, seq bigint, publica_id uuid)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_teto    integer;
  v_seq     bigint;
  v_seq_pub bigint;
  v_pub     jsonb;
  v_pub_id  uuid;
  v_id      uuid := gen_random_uuid();
begin
  select t.operacoes_por_sala into v_teto from sala_interno.tetos t where t.id;
  select coalesce(max(o.seq), 0) + 1 into v_seq from public.sala_operacoes o where o.sala_id = p_sala;
  if v_seq > v_teto then raise exception 'Registro Cheio'; end if;
  v_pub := sala_interno.publica(p_sala, p_especie, p_dados, p_escondida);
  if v_pub is not null then
    if p_responde is not null then
      v_pub := v_pub || coalesce((select jsonb_build_object('responde', o.publica_id) from public.sala_operacoes o
        where o.id = p_responde and o.publica_id is not null), '{}'::jsonb);
    end if;
    select coalesce(max(p.seq), 0) + 1 into v_seq_pub from public.sala_operacoes_publicas p where p.sala_id = p_sala;
    insert into public.sala_operacoes_publicas (sala_id, seq, especie, publica, estado_pedido)
    values (p_sala, v_seq_pub, p_especie, v_pub, p_estado_pedido)
    returning sala_operacoes_publicas.id into v_pub_id;
  end if;
  insert into public.sala_operacoes (id, sala_id, seq, especie, operacao_id, autor, papel, dados, envolvidos,
    escondida, estado_pedido, responde, publica_id)
  values (v_id, p_sala, v_seq, p_especie, p_dados ->> 'id', p_conta, p_papel, p_dados,
    sala_interno.envolvidos(p_especie, p_dados), p_escondida, p_estado_pedido, p_responde, v_pub_id);
  return query select v_id, v_seq, v_pub_id;
end $$;

-- Gatilho: sobe a versão quando o que alguém pode ler mudou sem evento. O que
-- vem em cascata (pg_trigger_depth > 1: a Sala apagada levando tudo junto) não sobe.
create or replace function sala_interno.subir_versao()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_sala uuid;
begin
  if pg_trigger_depth() > 1 then return null; end if;
  if tg_op = 'DELETE' then v_sala := old.sala_id; else v_sala := new.sala_id; end if;
  update public.sala_estado e set versao = e.versao + 1, atualizado_em = now() where e.sala_id = v_sala;
  return null;
end $$;

drop trigger if exists sala_resumos_visao on public.sala_resumos;
create trigger sala_resumos_visao after update of visao, dono on public.sala_resumos
  for each row when (old.visao is distinct from new.visao or old.dono is distinct from new.dono)
  execute function sala_interno.subir_versao();
drop trigger if exists sala_resumos_saiu on public.sala_resumos;
create trigger sala_resumos_saiu after delete on public.sala_resumos
  for each row execute function sala_interno.subir_versao();
drop trigger if exists sala_compartilhamentos_mudou on public.sala_compartilhamentos;
create trigger sala_compartilhamentos_mudou after insert or delete on public.sala_compartilhamentos
  for each row execute function sala_interno.subir_versao();
drop trigger if exists sala_membros_mudou on public.sala_membros;
create trigger sala_membros_mudou after update of papel, removido_em on public.sala_membros
  for each row when (old.papel is distinct from new.papel or old.removido_em is distinct from new.removido_em)
  execute function sala_interno.subir_versao();

-- ============================================================================
-- RPCs: ENTRAR, CRIAR E CONTROLAR A SALA
-- ============================================================================

-- O mínimo de uma Sala aberta pelo código: o grupo, se está trancada e o papel
-- de quem pergunta (null se não é membro). Código que não existe, Sala fechada
-- e Sala parada devolvem nada, tudo igual.
create or replace function public.ver_sala(p_codigo text)
returns table (grupo text, trancada boolean, papel text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare v_horas integer;
begin
  perform sala_interno.conta();
  perform sala_interno.varrer(false);
  select t.horas_parada into v_horas from sala_interno.tetos t where t.id;
  return query
    select s.grupo, s.trancada, sala_interno.papel(s.id)
    from public.salas s
    where s.codigo = upper(btrim(coalesce(p_codigo, '')))
      and s.status = 'aberta' and s.ultima_atividade >= now() - make_interval(hours => v_horas);
end $$;

-- Cria a Sala com quem chama como Mestre (e dono). A senha vai em bcrypt.
create or replace function public.criar_sala(p_grupo text, p_senha text, p_nome text default 'Encontro')
returns table (sala_id uuid, codigo text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_conta  uuid := sala_interno.conta();
  v_t      sala_interno.tetos;
  v_id     uuid;
  v_codigo text;
  v_nome   text := left(btrim(coalesce(p_nome, '')), 120);
begin
  perform sala_interno.varrer(false);
  if p_grupo is null or p_grupo not in ('site', 'afty', 'eradeouro', 'eclesiastes') then raise exception 'Grupo Desconhecido'; end if;
  perform sala_interno.validar_senha(p_senha);
  if v_nome = '' then v_nome := 'Encontro'; end if;
  select * into v_t from sala_interno.tetos t where t.id;
  -- Duas criações ao mesmo tempo da mesma conta passariam juntas pela contagem.
  perform pg_advisory_xact_lock(hashtextextended('sala_criar:' || v_conta::text, 0));
  if (select count(*) from public.salas s
      where s.dono = v_conta and s.status = 'aberta'
        and s.ultima_atividade >= now() - make_interval(hours => v_t.horas_parada)) >= v_t.salas_por_mestre then
    raise exception 'Limite de Salas Abertas';
  end if;
  for i in 1 .. 20 loop
    v_codigo := sala_interno.gerar_codigo();
    begin
      insert into public.salas (codigo, grupo, nome, dono, senha_hash)
      values (v_codigo, p_grupo, v_nome, v_conta, extensions.crypt(p_senha, extensions.gen_salt('bf', 8)))
      returning salas.id into v_id;
      exit;
    exception when unique_violation then
      v_id := null;
    end;
  end loop;
  if v_id is null then raise exception 'Código Indisponível'; end if;
  insert into public.sala_membros (sala_id, conta, papel, nome, avatar)
  select v_id, v_conta, 'mestre', d.nome, d.avatar from sala_interno.descricao(v_conta) as d;
  insert into public.sala_estado (sala_id) values (v_id);
  insert into public.sala_ordem_mestre (sala_id) values (v_id);
  return query select v_id, v_codigo;
end $$;

-- Entra com código e senha. Quem já é membro volta sem senha. Os erros saem em
-- `erro` (e não por exceção) para a senha errada ficar anotada.
create or replace function public.entrar_na_sala(p_codigo text, p_senha text, p_papel text default 'jogador')
returns table (sala_id uuid, papel text, erro text)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_conta uuid := sala_interno.conta();
  v_t     sala_interno.tetos;
  v_s     public.salas;
  v_m     public.sala_membros;
  v_papel text := case when p_papel = 'espectador' then 'espectador' else 'jogador' end;
begin
  perform sala_interno.varrer(false);
  select * into v_t from sala_interno.tetos t where t.id;
  select * into v_s from public.salas s
  where s.codigo = upper(btrim(coalesce(p_codigo, ''))) and s.status = 'aberta'
  for update;
  if v_s.id is null or v_s.ultima_atividade < now() - make_interval(hours => v_t.horas_parada) then
    return query select null::uuid, null::text, 'Sala Ausente'::text; return;
  end if;
  select * into v_m from public.sala_membros m where m.sala_id = v_s.id and m.conta = v_conta;
  if v_m.id is not null and v_m.removido_em is null then
    return query select v_s.id, v_m.papel, null::text; return;
  end if;
  if v_m.id is not null then
    return query select null::uuid, null::text, 'Removido da Sala'::text; return;
  end if;
  if v_s.trancada then
    return query select null::uuid, null::text, 'Sala Trancada'::text; return;
  end if;
  if (select count(*) from sala_interno.tentativas a
      where a.sala_id = v_s.id and a.conta = v_conta and a.em > now() - interval '1 hour') >= v_t.tentativas_por_hora
     or (select count(*) from sala_interno.tentativas a
      where a.conta = v_conta and a.em > now() - interval '1 hour') >= 3 * v_t.tentativas_por_hora then
    return query select null::uuid, null::text, 'Muitas Tentativas'::text; return;
  end if;
  if p_senha is null or extensions.crypt(p_senha, v_s.senha_hash) <> v_s.senha_hash then
    insert into sala_interno.tentativas (sala_id, conta) values (v_s.id, v_conta);
    return query select null::uuid, null::text, 'Senha Errada'::text; return;
  end if;
  if (select count(*) from public.sala_membros m where m.sala_id = v_s.id and m.removido_em is null) >= v_t.pessoas_por_sala then
    return query select null::uuid, null::text, 'Sala Cheia'::text; return;
  end if;
  insert into public.sala_membros (sala_id, conta, papel, nome, avatar)
  select v_s.id, v_conta, v_papel, d.nome, d.avatar from sala_interno.descricao(v_conta) as d;
  update public.salas s set ultima_atividade = now() where s.id = v_s.id;
  return query select v_s.id, v_papel, null::text;
end $$;

-- As Salas de quem chama (não removido), com o status de fato (a parada conta
-- como fechada). É por aqui que o ausente no fechamento acha o que falta gravar.
create or replace function public.minhas_salas()
returns table (sala_id uuid, codigo text, grupo text, nome text, papel text, status text, trancada boolean,
  criada_em timestamptz, fechada_em timestamptz)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_conta uuid := sala_interno.conta();
  v_horas integer;
begin
  perform sala_interno.varrer(false);
  select t.horas_parada into v_horas from sala_interno.tetos t where t.id;
  return query
    select s.id, s.codigo, s.grupo, s.nome, m.papel,
      case when s.status = 'aberta' and s.ultima_atividade < now() - make_interval(hours => v_horas)
        then 'fechada' else s.status end,
      s.trancada, s.criada_em, s.fechada_em
    from public.sala_membros m join public.salas s on s.id = m.sala_id
    where m.conta = v_conta and m.removido_em is null
    order by s.criada_em desc;
end $$;

create or replace function public.trocar_senha(p_sala uuid, p_senha text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  perform sala_interno.validar_senha(p_senha);
  update public.salas s set senha_hash = extensions.crypt(p_senha, extensions.gen_salt('bf', 8)) where s.id = p_sala;
end $$;

create or replace function public.trancar(p_sala uuid, p_trancada boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  update public.salas s set trancada = coalesce(p_trancada, true)
  where s.id = p_sala and s.trancada is distinct from coalesce(p_trancada, true);
  if found then
    update public.sala_estado e set versao = e.versao + 1, atualizado_em = now() where e.sala_id = p_sala;
  end if;
end $$;

-- O Mestre remove jogador e espectador. Co-Mestre só quem criou remove. Quem
-- criou ninguém remove. Os combatentes do removido ficam com o Mestre.
create or replace function public.remover_membro(p_sala uuid, p_conta uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_m    public.sala_membros;
  v_dono uuid;
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  select s.dono into v_dono from public.salas s where s.id = p_sala;
  select * into v_m from public.sala_membros m where m.sala_id = p_sala and m.conta = p_conta and m.removido_em is null;
  if v_m.id is null then raise exception 'Membro Ausente'; end if;
  if p_conta = v_dono or p_conta = auth.uid() or (v_m.papel = 'mestre' and auth.uid() <> v_dono) then
    raise exception 'Sem Permissão';
  end if;
  update public.sala_membros m set removido_em = now() where m.id = v_m.id;
end $$;

-- Só quem criou promove a co-Mestre (ou rebaixa, com p_ligado false, a jogador).
create or replace function public.promover_mestre(p_sala uuid, p_conta uuid, p_ligado boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_m    public.sala_membros;
  v_dono uuid;
begin
  perform sala_interno.abrir(p_sala);
  select s.dono into v_dono from public.salas s where s.id = p_sala;
  if auth.uid() <> v_dono then raise exception 'Sem Permissão'; end if;
  select * into v_m from public.sala_membros m where m.sala_id = p_sala and m.conta = p_conta and m.removido_em is null;
  if v_m.id is null then raise exception 'Membro Ausente'; end if;
  if p_conta = v_dono then raise exception 'Sem Permissão'; end if;
  if coalesce(p_ligado, true) then
    update public.sala_membros m set papel = 'mestre' where m.id = v_m.id and m.papel <> 'mestre';
  else
    update public.sala_membros m set papel = 'jogador' where m.id = v_m.id and m.papel = 'mestre';
  end if;
end $$;

-- Fecha a Sala: o link para, as escritas param, os membros seguem lendo até o prazo.
create or replace function public.fechar_sala(p_sala uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_s public.salas;
begin
  perform sala_interno.conta();
  select * into v_s from public.salas s where s.id = p_sala for update;
  if v_s.id is null or sala_interno.papel(p_sala) is null then raise exception 'Sala Ausente'; end if;
  if not sala_interno.mestre(p_sala) then raise exception 'Sem Permissão'; end if;
  if v_s.status = 'fechada' then return; end if;
  update public.salas s set status = 'fechada', fechada_em = now(), fechada_por = 'mestre' where s.id = p_sala;
  perform sala_interno.ao_fechar(p_sala);
end $$;

-- ============================================================================
-- RPCs: COMBATENTES, RESUMO, FICHA E COMPARTILHAMENTO
-- ============================================================================

-- Põe um combatente na Sala (ou, para o Mestre, atualiza nome e lado de um que já
-- está). O jogador só põe personagem, que fica dele. O Mestre põe qualquer um,
-- com dono escolhido ou sem dono (ele controla). Criatura nasce Oculta, marcador
-- de inimigo também, o de jogador nasce Só Nome (a regra de modelo.js).
create or replace function public.adicionar_combatente(
  p_sala uuid, p_combatente text, p_tipo text, p_nome text,
  p_lado text default null, p_visao text default null, p_dono uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_papel text := sala_interno.abrir(p_sala);
  v_conta uuid := auth.uid();
  v_r     public.sala_resumos;
  v_dono  uuid;
  v_lado  text;
  v_visao text;
  v_nome  text := left(btrim(coalesce(p_nome, '')), 120);
  v_teto  integer;
begin
  if v_papel = 'espectador' then raise exception 'Sem Permissão'; end if;
  if p_tipo is null or p_tipo not in ('personagem', 'criatura', 'marcador') then raise exception 'Operação Inválida'; end if;
  if p_combatente is null or p_combatente !~ '^[A-Za-z0-9_:.-]{1,100}$' then raise exception 'Operação Inválida'; end if;
  if v_nome = '' then v_nome := 'Combatente'; end if;
  if p_lado is not null and p_lado not in ('inimigo', 'jogador', 'aliado') then raise exception 'Operação Inválida'; end if;
  if p_visao is not null and p_visao not in ('oculta', 'nome', 'barra', 'aberta') then raise exception 'Operação Inválida'; end if;
  v_r := sala_interno.resumo_de(p_sala, p_combatente);
  if v_r.id is not null then
    if v_papel = 'mestre' then
      update public.sala_resumos r set nome = v_nome, lado = coalesce(p_lado, r.lado), atualizado_em = now()
      where r.id = v_r.id and (r.nome, r.lado) is distinct from (v_nome, coalesce(p_lado, r.lado));
    elsif v_r.dono is not distinct from v_conta then
      update public.sala_resumos r set nome = v_nome, atualizado_em = now() where r.id = v_r.id and r.nome <> v_nome;
    else
      raise exception 'Combatente Repetido';
    end if;
    return;
  end if;
  select t.combatentes_por_sala into v_teto from sala_interno.tetos t where t.id;
  if (select count(*) from public.sala_resumos r where r.sala_id = p_sala) >= v_teto then
    raise exception 'Combatentes Demais';
  end if;
  if v_papel = 'jogador' then
    if p_tipo <> 'personagem' then raise exception 'Sem Permissão'; end if;
    v_dono := v_conta;
    v_lado := 'jogador';
  else
    if p_dono is not null and not exists (select 1 from public.sala_membros m where m.sala_id = p_sala
        and m.conta = p_dono and m.removido_em is null and m.papel in ('mestre', 'jogador')) then
      raise exception 'Membro Ausente';
    end if;
    v_dono := p_dono;
    v_lado := coalesce(p_lado, case when p_tipo = 'personagem' then 'jogador' else 'inimigo' end);
  end if;
  v_visao := case
    when p_tipo = 'personagem' then null
    when v_papel = 'mestre' and p_visao is not null then p_visao
    when p_tipo = 'criatura' then 'oculta'
    when v_lado = 'inimigo' then 'oculta'
    else 'nome' end;
  insert into public.sala_resumos (sala_id, combatente, tipo, dono, visao, nome, lado)
  values (p_sala, p_combatente, p_tipo, v_dono, v_visao, v_nome, v_lado);
  perform sala_interno.recalcular_ordem(p_sala);
end $$;

-- Tira um combatente (com ficha, sessão e compartilhamentos). O Mestre tira
-- qualquer um, o jogador os dele.
create or replace function public.remover_combatente(p_sala uuid, p_combatente text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_papel text := sala_interno.abrir(p_sala);
  v_r     public.sala_resumos := sala_interno.resumo_visivel(p_sala, p_combatente, v_papel);
begin
  if v_r.id is null then raise exception 'Combatente Ausente'; end if;
  if not (v_papel = 'mestre' or (v_papel = 'jogador' and v_r.dono is not distinct from auth.uid())) then raise exception 'Sem Permissão'; end if;
  delete from public.sala_resumos r where r.id = v_r.id;
  perform sala_interno.recalcular_ordem(p_sala);
end $$;

-- O seletor de visão do Mestre. Recorta o resumo e a ordem, e a versão sobe.
create or replace function public.definir_visao(p_sala uuid, p_combatente text, p_visao text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_r public.sala_resumos;
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  v_r := sala_interno.resumo_de(p_sala, p_combatente);
  if v_r.id is null then raise exception 'Combatente Ausente'; end if;
  if v_r.tipo = 'personagem' or p_visao is null or p_visao not in ('oculta', 'nome', 'barra', 'aberta') then
    raise exception 'Operação Inválida';
  end if;
  update public.sala_resumos r set visao = p_visao, atualizado_em = now(),
    publico = sala_interno.resumo_por_visao(
      (select c.completo from sala_interno.resumos_completos c where c.resumo_id = r.id), r.tipo, p_visao)
  where r.id = v_r.id and r.visao is distinct from p_visao;
  perform sala_interno.recalcular_ordem(p_sala);
end $$;

-- Quem controla um combatente: um membro (jogador ou Mestre) ou ninguém (o Mestre).
create or replace function public.definir_dono(p_sala uuid, p_combatente text, p_dono uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_r public.sala_resumos;
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  v_r := sala_interno.resumo_de(p_sala, p_combatente);
  if v_r.id is null then raise exception 'Combatente Ausente'; end if;
  if v_r.tipo = 'marcador' then raise exception 'Operação Inválida'; end if;
  if p_dono is not null and not exists (select 1 from public.sala_membros m where m.sala_id = p_sala
      and m.conta = p_dono and m.removido_em is null and m.papel in ('mestre', 'jogador')) then
    raise exception 'Membro Ausente';
  end if;
  update public.sala_resumos r set dono = p_dono, atualizado_em = now()
  where r.id = v_r.id and r.dono is distinct from p_dono;
end $$;

-- O dono (ou o Mestre) publica o resumo COMPLETO, já derivado no aparelho dele.
-- O banco guarda o completo longe de todos e publica o corte pela visão.
create or replace function public.publicar_resumo(p_sala uuid, p_combatente text, p_resumo jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_papel    text := sala_interno.abrir(p_sala);
  v_r        public.sala_resumos := sala_interno.resumo_visivel(p_sala, p_combatente, v_papel);
  v_completo jsonb;
  v_publico  jsonb;
begin
  if v_r.id is null then raise exception 'Combatente Ausente'; end if;
  if not (v_papel = 'mestre' or (v_papel = 'jogador' and v_r.dono is not distinct from auth.uid())) then raise exception 'Sem Permissão'; end if;
  if v_r.tipo = 'marcador' then raise exception 'Combatente sem Ficha'; end if;
  if jsonb_typeof(p_resumo) is distinct from 'object' or octet_length(p_resumo::text) > 16384 then
    raise exception 'Operação Inválida';
  end if;
  v_completo := sala_interno.resumo_saneado(p_resumo);
  insert into sala_interno.resumos_completos (resumo_id, completo) values (v_r.id, v_completo)
  on conflict (resumo_id) do update set completo = excluded.completo, atualizado_em = now();
  v_publico := sala_interno.resumo_por_visao(v_completo, v_r.tipo, v_r.visao);
  update public.sala_resumos r set publico = v_publico, atualizado_em = now()
  where r.id = v_r.id and r.publico is distinct from v_publico;
end $$;

-- Grava a ficha ou a sessão de um combatente, com a versão esperada (0 na
-- primeira vez). Versão diferente recusa com "Versão Mudou" e a versão de agora
-- no detalhe: o cliente relê e reaplica. A FICHA é só do dono (ou do Mestre, se
-- não tem dono). A SESSÃO é do dono e dos Mestres.
create or replace function public.gravar_ficha(p_sala uuid, p_combatente text, p_parte text, p_dados jsonb, p_versao bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_papel  text := sala_interno.abrir(p_sala);
  v_conta  uuid := auth.uid();
  v_r      public.sala_resumos := sala_interno.resumo_visivel(p_sala, p_combatente, v_papel);
  v_id     uuid;
  v_versao bigint;
begin
  if v_r.id is null then raise exception 'Combatente Ausente'; end if;
  if v_r.tipo = 'marcador' then raise exception 'Combatente sem Ficha'; end if;
  if p_parte is null or p_parte not in ('ficha', 'sessao') then raise exception 'Operação Inválida'; end if;
  if v_papel = 'espectador'
     or (p_parte = 'ficha' and not (v_r.dono is not distinct from v_conta or (v_r.dono is null and v_papel = 'mestre')))
     or (p_parte = 'sessao' and not (v_r.dono is not distinct from v_conta or v_papel = 'mestre')) then
    raise exception 'Sem Permissão';
  end if;
  if jsonb_typeof(p_dados) is distinct from 'object' then raise exception 'Operação Inválida'; end if;
  if octet_length(p_dados::text) > 1900000 then raise exception 'Ficha Grande Demais'; end if;
  select f.id, f.versao into v_id, v_versao from public.sala_fichas f
  where f.sala_id = p_sala and f.combatente = p_combatente and f.parte = p_parte for update;
  if v_id is null then
    if coalesce(p_versao, 0) <> 0 then raise exception 'Versão Mudou' using detail = '0'; end if;
    insert into public.sala_fichas (sala_id, combatente, parte, dados, versao, atualizado_por)
    values (p_sala, p_combatente, p_parte, p_dados, 1, v_conta);
    return 1;
  end if;
  if p_versao is distinct from v_versao then raise exception 'Versão Mudou' using detail = v_versao::text; end if;
  update public.sala_fichas f set dados = p_dados, versao = v_versao + 1, atualizado_em = now(), atualizado_por = v_conta
  where f.id = v_id;
  return v_versao + 1;
end $$;

-- O jogador abre a ficha inteira de um personagem dele para um colega (ou fecha,
-- com p_ligado false). A versão sobe pelo gatilho.
create or replace function public.compartilhar_ficha(p_sala uuid, p_combatente text, p_para uuid, p_ligado boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_conta uuid;
  v_r     public.sala_resumos;
begin
  perform sala_interno.abrir(p_sala);
  v_conta := auth.uid();
  v_r := sala_interno.resumo_de(p_sala, p_combatente);
  if v_r.id is null or v_r.tipo <> 'personagem' or v_r.dono is distinct from v_conta then raise exception 'Sem Permissão'; end if;
  if p_para is null or p_para = v_conta or not exists (select 1 from public.sala_membros m
      where m.sala_id = p_sala and m.conta = p_para and m.removido_em is null) then
    raise exception 'Membro Ausente';
  end if;
  if coalesce(p_ligado, true) then
    insert into public.sala_compartilhamentos (sala_id, combatente, para) values (p_sala, p_combatente, p_para)
    on conflict (sala_id, combatente, para) do nothing;
  else
    delete from public.sala_compartilhamentos c where c.sala_id = p_sala and c.combatente = p_combatente and c.para = p_para;
  end if;
end $$;

-- O Mestre grava o estado da luta e a ordem COMPLETA com a vez (null: ninguém).
-- O banco recalcula a ordem que o jogador vê. Nada muda sem mudança.
create or replace function public.gravar_estado(
  p_sala uuid, p_status text, p_rodada integer, p_config jsonb, p_ordem text[], p_vez text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if sala_interno.abrir(p_sala) <> 'mestre' then raise exception 'Sem Permissão'; end if;
  if p_status is null or p_status not in ('planejando', 'ativo', 'finalizado')
     or p_rodada is null or p_rodada not between 1 and 100000
     or jsonb_typeof(p_config) is distinct from 'object' or octet_length(p_config::text) > 4096
     or p_ordem is null or cardinality(p_ordem) > 500
     or exists (select 1 from unnest(p_ordem) as c where c is null or c !~ '^[A-Za-z0-9_:.-]{1,100}$')
     or (p_vez is not null and p_vez !~ '^[A-Za-z0-9_:.-]{1,100}$') then
    raise exception 'Operação Inválida';
  end if;
  update public.sala_estado e set status = p_status, rodada = p_rodada, config = p_config, atualizado_em = now()
  where e.sala_id = p_sala and (e.status, e.rodada, e.config) is distinct from (p_status, p_rodada, p_config);
  update public.sala_ordem_mestre o set ordem = p_ordem, vez = p_vez, atualizado_em = now()
  where o.sala_id = p_sala and (o.ordem, o.vez) is distinct from (p_ordem, p_vez);
  perform sala_interno.recalcular_ordem(p_sala);
end $$;

-- ============================================================================
-- RPCs: O REGISTRO
-- ============================================================================

-- Grava uma operação (a de encontros/operacoes.js), um pedido, uma rolagem, um
-- chat ou um evento do Mestre. O servidor reescreve o autor, confere a
-- autoridade, calcula os envolvidos e a versão pública. Repetir o mesmo id
-- devolve o que já foi gravado.
create or replace function public.gravar_operacao(p_sala uuid, p_especie text, p_dados jsonb, p_escondida boolean default false)
returns table (id uuid, seq bigint, publica_id uuid)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_papel   text := sala_interno.abrir(p_sala);
  v_conta   uuid := auth.uid();
  v_esc     boolean := coalesce(p_escondida, false);
  v_dados   jsonb;
  v_op      text;
  v_alvo    public.sala_resumos;
  v_c       text;
  v_existe  public.sala_operacoes;
begin
  if p_especie is null or p_especie not in ('operacao', 'pedido', 'rolagem', 'chat', 'sistema') then
    raise exception 'Operação Inválida';
  end if;
  if jsonb_typeof(p_dados) is distinct from 'object' then raise exception 'Operação Inválida'; end if;
  if octet_length(p_dados::text) > 131072 then raise exception 'Operação Grande Demais'; end if;
  v_op := p_dados ->> 'id';
  if jsonb_typeof(p_dados -> 'id') is distinct from 'string' or v_op !~ '^[A-Za-z0-9_:.-]{1,120}$' then
    raise exception 'Operação Inválida';
  end if;
  select * into v_existe from public.sala_operacoes o
  where o.sala_id = p_sala and o.operacao_id = v_op and o.especie = p_especie;
  if v_existe.id is not null then
    if v_existe.autor is distinct from v_conta then raise exception 'Operação Repetida'; end if;
    return query select v_existe.id, v_existe.seq, v_existe.publica_id; return;
  end if;
  if v_papel = 'espectador' and p_especie <> 'chat' then raise exception 'Sem Permissão'; end if;
  if v_esc and not (p_especie = 'rolagem' and v_papel = 'mestre') then raise exception 'Sem Permissão'; end if;

  -- O autor é do servidor. O combatente do autor fica, e é conferido abaixo. O
  -- `pedido` do cliente sai: o estado do pedido mora na coluna e nas respostas.
  v_dados := (p_dados - 'pedido') || jsonb_build_object('autor',
    jsonb_build_object('conta', v_conta::text, 'papel', v_papel)
    || case when jsonb_typeof(p_dados #> '{autor,combatente}') = 'string'
         then jsonb_build_object('combatente', p_dados #> '{autor,combatente}') else '{}'::jsonb end);

  if p_especie = 'chat' then
    if jsonb_typeof(v_dados -> 'texto') is distinct from 'string' or btrim(v_dados ->> 'texto') = ''
       or char_length(v_dados ->> 'texto') > 1000 then
      raise exception 'Operação Inválida';
    end if;
  elsif p_especie = 'sistema' then
    if v_papel <> 'mestre' then raise exception 'Sem Permissão'; end if;
    if coalesce(v_dados ->> 'evento', '') not in ('comecar', 'turno', 'rodada', 'encerrar', 'reabrir', 'entrou', 'saiu') then
      raise exception 'Operação Inválida';
    end if;
  elsif p_especie = 'rolagem' then
    if jsonb_typeof(v_dados -> 'rolagem') is distinct from 'object' then raise exception 'Operação Inválida'; end if;
    if v_papel <> 'mestre' and jsonb_typeof(v_dados -> 'combatente') = 'string'
       and sala_interno.dono_de(p_sala, v_dados ->> 'combatente') is distinct from v_conta then
      raise exception 'Sem Permissão';
    end if;
  else
    if jsonb_typeof(v_dados -> 'alvo') is distinct from 'string'
       or coalesce(v_dados ->> 'tipo', '') not in ('dano', 'danoMetade', 'cura', 'gastarPe', 'recuperarPe',
         'descansar', 'alma', 'condicao', 'sessao', 'desfazer')
       or jsonb_typeof(v_dados -> 'delta') is distinct from 'array' then
      raise exception 'Operação Inválida';
    end if;
    v_alvo := sala_interno.resumo_visivel(p_sala, v_dados ->> 'alvo', v_papel);
    if v_alvo.id is null then raise exception 'Combatente Ausente'; end if;
    if p_especie = 'operacao' then
      -- Direta: o Mestre em qualquer um, o jogador só no que é dele (alvo, o
      -- combatente com que age e quem aplicou).
      if v_papel <> 'mestre' then
        foreach v_c in array sala_interno.envolvidos('operacao', v_dados) loop
          if sala_interno.dono_de(p_sala, v_c) is distinct from v_conta then raise exception 'Sem Permissão'; end if;
        end loop;
      end if;
    else
      -- Pedido: só o jogador, só em alvo que ele enxerga (o Oculto responde
      -- como ausente), agindo com o que é dele.
      if v_papel <> 'jogador' then raise exception 'Sem Permissão'; end if;
      if v_alvo.tipo <> 'personagem' and v_alvo.visao = 'oculta' then raise exception 'Combatente Ausente'; end if;
      foreach v_c in array sala_interno.envolvidos('pedido', v_dados) loop
        if v_c <> v_alvo.combatente and sala_interno.dono_de(p_sala, v_c) is distinct from v_conta then
          raise exception 'Sem Permissão';
        end if;
      end loop;
    end if;
  end if;

  return query select * from sala_interno.inserir_operacao(p_sala, v_conta, v_papel, p_especie, v_dados, v_esc,
    case when p_especie = 'pedido' then 'pendente' end, null);
end $$;

-- Responde um pedido pendente: o Mestre ou o dono do alvo. Ao aceitar, manda a
-- operação medida no aparelho de quem aceita (o id é o do pedido, como em
-- aceitarPedido), e o autor continua sendo quem pediu.
create or replace function public.responder_pedido(p_sala uuid, p_pedido text, p_aceitar boolean, p_operacao jsonb default null)
returns table (id uuid, seq bigint, publica_id uuid)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_papel text := sala_interno.abrir(p_sala);
  v_conta uuid := auth.uid();
  v_p     public.sala_operacoes;
  v_dados jsonb;
  v_id    uuid;
  v_seq   bigint;
  v_pub   uuid;
begin
  select * into v_p from public.sala_operacoes o
  where o.sala_id = p_sala and o.operacao_id = p_pedido and o.especie = 'pedido' for update;
  if v_p.id is null then raise exception 'Pedido Ausente'; end if;
  if not (v_papel = 'mestre' or (v_papel = 'jogador' and sala_interno.dono_de(p_sala, v_p.dados ->> 'alvo') is not distinct from v_conta)) then
    raise exception 'Pedido Ausente';
  end if;
  if v_p.estado_pedido <> 'pendente' then raise exception 'Pedido Respondido'; end if;
  if coalesce(p_aceitar, false) then
    if jsonb_typeof(p_operacao) is distinct from 'object' or octet_length(p_operacao::text) > 131072
       or p_operacao ->> 'id' is distinct from p_pedido
       or p_operacao ->> 'alvo' is distinct from v_p.dados ->> 'alvo'
       or p_operacao ->> 'tipo' is distinct from v_p.dados ->> 'tipo'
       or jsonb_typeof(p_operacao -> 'delta') is distinct from 'array' then
      raise exception 'Operação Inválida';
    end if;
    v_dados := p_operacao || jsonb_build_object(
      'autor', v_p.dados -> 'autor',
      'pedido', jsonb_build_object('estado', 'aceito',
        'por', jsonb_build_object('conta', v_conta::text, 'papel', v_papel),
        'em', floor(extract(epoch from now()) * 1000)::bigint,
        'pedidoEm', v_p.dados -> 'quando'));
    select r.id, r.seq, r.publica_id into v_id, v_seq, v_pub
    from sala_interno.inserir_operacao(p_sala, v_conta, v_papel, 'operacao', v_dados, false, null, v_p.id) as r;
  end if;
  update public.sala_operacoes o set estado_pedido = case when coalesce(p_aceitar, false) then 'aceito' else 'recusado' end,
    respondido_por = v_conta, respondido_em = now()
  where o.id = v_p.id;
  update public.sala_operacoes_publicas p set estado_pedido = case when coalesce(p_aceitar, false) then 'aceito' else 'recusado' end
  where p.id = v_p.publica_id;
  if v_id is null then
    return query select v_p.id, v_p.seq, v_p.publica_id; return;
  end if;
  return query select v_id, v_seq, v_pub;
end $$;

-- ============================================================================
-- PRIVILÉGIOS
-- ============================================================================

-- Tabelas: ninguém escreve. O authenticated lê (a RLS escolhe as linhas). O
-- senha_hash fica de fora do grant de salas. As do sala_interno, sem grant.
revoke all on table public.salas, public.sala_membros, public.sala_estado, public.sala_ordem_mestre,
  public.sala_resumos, public.sala_fichas, public.sala_compartilhamentos, public.sala_operacoes,
  public.sala_operacoes_publicas from public, anon, authenticated;
grant select (id, codigo, grupo, nome, dono, trancada, status, criada_em, ultima_atividade, fechada_em, fechada_por)
  on public.salas to authenticated;
grant select on public.sala_membros, public.sala_estado, public.sala_ordem_mestre, public.sala_resumos,
  public.sala_fichas, public.sala_compartilhamentos, public.sala_operacoes, public.sala_operacoes_publicas
  to authenticated;
revoke all on all tables in schema sala_interno from public, anon, authenticated;
revoke all on all sequences in schema sala_interno from public, anon, authenticated;

-- Funções: o Postgres dá EXECUTE ao PUBLIC por padrão (e o Supabase ao anon). Os
-- ajudantes das políticas precisam do authenticated, as internas de ninguém, e as
-- RPCs só do authenticated.
revoke all on all functions in schema sala_interno from public, anon, authenticated;
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'sala_interno'
      and p.proname in ('papel', 'membro', 'mestre', 'dono_de', 'pode_ler_ficha', 'pode_ler_todos', 'topico_de_membro')
  loop
    execute format('grant execute on function %s to authenticated', f);
  end loop;
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('ver_sala', 'criar_sala', 'entrar_na_sala', 'minhas_salas', 'trocar_senha', 'trancar',
        'remover_membro', 'promover_mestre', 'fechar_sala', 'adicionar_combatente', 'remover_combatente',
        'definir_visao', 'definir_dono', 'publicar_resumo', 'gravar_ficha', 'compartilhar_ficha', 'gravar_estado',
        'gravar_operacao', 'responder_pedido')
  loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ============================================================================
-- TEMPO REAL
-- ============================================================================

-- As tabelas da Sala entram na publicação (menos salas, por causa do senha_hash).
-- A publicação passa a mandar só insert e update: nenhum DELETE sai do banco
-- (item 8 do modelo de ameaça). Hoje nada mais do projeto usa o tempo real.
do $$
declare v_t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  begin
    alter publication supabase_realtime set (publish = 'insert, update');
  exception when others then
    raise notice 'Não deu para tirar o DELETE da publicação supabase_realtime (%). Ver o roteiro.', sqlerrm;
  end;
  foreach v_t in array array['sala_membros', 'sala_estado', 'sala_ordem_mestre', 'sala_resumos', 'sala_fichas',
      'sala_compartilhamentos', 'sala_operacoes', 'sala_operacoes_publicas'] loop
    if not exists (select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_t) then
      execute format('alter publication supabase_realtime add table public.%I', v_t);
    end if;
  end loop;
end $$;

-- Presence no canal privado "sala:<id>", só para membro. Broadcast fica sem
-- política (negado no canal privado).
do $$
begin
  if to_regclass('realtime.messages') is null then
    raise notice 'Sem realtime.messages: as políticas de Presence ficaram de fora.';
    return;
  end if;
  begin
    execute 'drop policy if exists "sala: membro le a presenca" on realtime.messages';
    execute 'create policy "sala: membro le a presenca" on realtime.messages for select to authenticated '
      || 'using (extension = ''presence'' and sala_interno.topico_de_membro((select realtime.topic())))';
    execute 'drop policy if exists "sala: membro publica a presenca" on realtime.messages';
    execute 'create policy "sala: membro publica a presenca" on realtime.messages for insert to authenticated '
      || 'with check (extension = ''presence'' and sala_interno.topico_de_membro((select realtime.topic())))';
  exception when others then
    raise notice 'Não deu para criar as políticas de Presence (%). Ver o roteiro.', sqlerrm;
  end;
end $$;

-- ============================================================================
-- PG_CRON (se o projeto tiver): varre a cada 15 minutos. Sem ele, as RPCs de
-- entrada varrem sozinhas (no máximo a cada 5 minutos).
-- ============================================================================

do $$
begin
  begin
    create extension if not exists pg_cron with schema pg_catalog;
  exception when others then
    raise notice 'pg_cron indisponível (%): a varredura fica só nas RPCs.', sqlerrm;
    return;
  end;
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'sala_varrer';
  perform cron.schedule('sala_varrer', '*/15 * * * *', 'select sala_interno.varrer(true)');
end $$;

commit;
