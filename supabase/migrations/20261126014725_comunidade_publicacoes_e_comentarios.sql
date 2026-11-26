begin;

create schema if not exists comunidade_interna;
revoke all on schema comunidade_interna from public, anon;
grant usage on schema comunidade_interna to authenticated;

create table if not exists public.comunidade_publicacoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria text not null check (categoria in ('jogador', 'criatura', 'css', 'topico')),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 100),
  autor text not null check (char_length(btrim(autor)) between 1 and 50),
  resumo text not null check (char_length(btrim(resumo)) between 1 and 240),
  texto text not null default '' check (char_length(texto) <= 12000),
  dados jsonb not null default '{}' check (
    jsonb_typeof(dados) = 'object' and octet_length(dados::text) <= 1200
    and not jsonb_path_exists(dados, '$.* ? (@.type() != "string")')
  ),
  conteudo jsonb,
  criado_em timestamptz not null default now(),
  busca text generated always as (
    translate(lower(titulo || ' ' || resumo || ' ' || autor || ' ' || categoria || ' ' || dados::text),
      'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  ) stored,
  constraint comunidade_conteudo_valido check ((
    case categoria
      when 'topico' then conteudo is null and char_length(btrim(texto)) > 0
      when 'css' then jsonb_typeof(conteudo) = 'object'
        and jsonb_typeof(conteudo->'css') = 'string'
        and octet_length(conteudo::text) <= 48000
        and char_length(btrim(conteudo->>'css')) > 0
        and octet_length(conteudo->>'css') <= 32000
      else jsonb_typeof(conteudo) = 'object' and octet_length(conteudo::text) <= 262144
        and jsonb_typeof(conteudo->'name') = 'string'
        and char_length(btrim(conteudo->>'name')) between 1 and 250
        and case categoria when 'jogador' then conteudo->>'rulesVersion' = 'player'
          else conteudo->>'rulesVersion' in ('2.5.2', 'afty') end
    end
  ) is true)
);

create table if not exists public.comunidade_comentarios (
  id uuid primary key default gen_random_uuid(),
  publicacao_id uuid not null references public.comunidade_publicacoes (id) on delete cascade,
  conta_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  autor text not null check (char_length(btrim(autor)) between 1 and 50),
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_em timestamptz not null default now()
);

create index if not exists comunidade_publicacoes_recentes_idx on public.comunidade_publicacoes (criado_em desc, id);
create index if not exists comunidade_publicacoes_categoria_idx on public.comunidade_publicacoes (categoria, criado_em desc, id);
create index if not exists comunidade_publicacoes_titulo_idx on public.comunidade_publicacoes (titulo, id);
create index if not exists comunidade_publicacoes_conta_idx on public.comunidade_publicacoes (conta_id);
create index if not exists comunidade_comentarios_publicacao_idx on public.comunidade_comentarios (publicacao_id, criado_em desc, id);
create index if not exists comunidade_comentarios_conta_idx on public.comunidade_comentarios (conta_id);

alter table public.comunidade_publicacoes enable row level security;
alter table public.comunidade_comentarios enable row level security;
revoke all on public.comunidade_publicacoes, public.comunidade_comentarios from public, anon, authenticated;

-- Somente as colunas públicas saem pela API. Os UUIDs das contas são privados.
grant select (id, categoria, titulo, autor, resumo, texto, dados, conteudo, criado_em, busca)
  on public.comunidade_publicacoes to anon, authenticated;
grant select (id, publicacao_id, autor, texto, criado_em)
  on public.comunidade_comentarios to anon, authenticated;
grant insert (id, categoria, titulo, autor, resumo, texto, dados, conteudo)
  on public.comunidade_publicacoes to authenticated;
grant insert (id, publicacao_id, autor, texto) on public.comunidade_comentarios to authenticated;
grant delete on public.comunidade_publicacoes, public.comunidade_comentarios to authenticated;

drop policy if exists comunidade_publicacoes_leitura on public.comunidade_publicacoes;
drop policy if exists comunidade_publicacoes_exclusao on public.comunidade_publicacoes;
drop policy if exists comunidade_publicacoes_insercao on public.comunidade_publicacoes;
create policy comunidade_publicacoes_leitura on public.comunidade_publicacoes for select to anon, authenticated using (true);
create policy comunidade_publicacoes_insercao on public.comunidade_publicacoes for insert to authenticated
  with check (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');
create policy comunidade_publicacoes_exclusao on public.comunidade_publicacoes for delete to authenticated
  using (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

drop policy if exists comunidade_comentarios_leitura on public.comunidade_comentarios;
drop policy if exists comunidade_comentarios_exclusao on public.comunidade_comentarios;
drop policy if exists comunidade_comentarios_insercao on public.comunidade_comentarios;
create policy comunidade_comentarios_leitura on public.comunidade_comentarios for select to anon, authenticated using (true);
create policy comunidade_comentarios_insercao on public.comunidade_comentarios for insert to authenticated
  with check (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');
create policy comunidade_comentarios_exclusao on public.comunidade_comentarios for delete to authenticated
  using (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

-- A consulta de autoria expõe apenas a relação com a conta autenticada.
create or replace function comunidade_interna.autoria(p_publicacao uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'publicacao', exists(select 1 from public.comunidade_publicacoes
      where id = p_publicacao and conta_id = (select auth.uid())),
    'comentarios', coalesce((select pg_catalog.jsonb_agg(id) from public.comunidade_comentarios
      where publicacao_id = p_publicacao and conta_id = (select auth.uid())), '[]'::jsonb)
  );
$$;
revoke all on function comunidade_interna.autoria(uuid) from public, anon, authenticated;
grant execute on function comunidade_interna.autoria(uuid) to authenticated;

create or replace function public.comunidade_autoria(p_publicacao uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select comunidade_interna.autoria(p_publicacao);
$$;
revoke all on function public.comunidade_autoria(uuid) from public, anon, authenticated;
grant execute on function public.comunidade_autoria(uuid) to authenticated;

-- Serializa as inserções da mesma conta para que o limite valha em abas concorrentes.
create or replace function comunidade_interna.limitar_envio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.conta_id::text, 618031));
  if tg_table_name = 'comunidade_publicacoes' then
    if (select count(*) from public.comunidade_publicacoes where conta_id = new.conta_id) >= 50 then
      raise exception using errcode = 'P0001', message = 'comunidade_limite_publicacoes';
    end if;
  elsif (select count(*) from public.comunidade_comentarios where conta_id = new.conta_id) >= 200 then
    raise exception using errcode = 'P0001', message = 'comunidade_limite_comentarios';
  end if;
  return new;
end;
$$;
revoke all on function comunidade_interna.limitar_envio() from public, anon, authenticated;

create or replace trigger comunidade_limitar_publicacoes before insert on public.comunidade_publicacoes
  for each row execute function comunidade_interna.limitar_envio();
create or replace trigger comunidade_limitar_comentarios before insert on public.comunidade_comentarios
  for each row execute function comunidade_interna.limitar_envio();

commit;
