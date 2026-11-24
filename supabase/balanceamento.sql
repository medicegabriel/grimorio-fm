-- Execute no SQL Editor como proprietário do projeto. Pode ser reaplicado.
begin;

create schema if not exists balanceamento_interno;
revoke all on schema balanceamento_interno from public, anon, authenticated;

create table if not exists balanceamento_interno.fichas (
  chave text primary key check (length(chave) = 64),
  salvo_em timestamptz not null,
  recebido_em timestamptz not null default now(),
  resumo jsonb check (resumo is null or jsonb_typeof(resumo) = 'object')
);
create index if not exists balanceamento_fichas_recebido_em
  on balanceamento_interno.fichas (recebido_em);
alter table balanceamento_interno.fichas enable row level security;
revoke all on balanceamento_interno.fichas from public, anon, authenticated;
grant usage on schema balanceamento_interno to service_role;
grant select, insert, update on balanceamento_interno.fichas to service_role;

-- A chave chega em hash. Um salvamento atrasado jamais troca um mais recente.
-- Um resumo nulo retira a ficha da amostra e conserva a ordem dos salvamentos.
create or replace function public.balanceamento_gravar(
  p_chave text, p_salvo_em timestamptz, p_resumo jsonb
) returns void
language sql security invoker set search_path = ''
as $$
  insert into balanceamento_interno.fichas as f (chave, salvo_em, resumo)
  values (p_chave, p_salvo_em, p_resumo)
  on conflict (chave) do update
    set salvo_em = excluded.salvo_em, recebido_em = now(), resumo = excluded.resumo
  where excluded.salvo_em > f.salvo_em;
$$;

create or replace function public.balanceamento_relatorio(
  p_dias integer, p_nivel integer, p_origem text, p_especializacao text, p_addons boolean
) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  with amostra as materialized (
    select resumo
    from balanceamento_interno.fichas
    where recebido_em >= now() - make_interval(days => p_dias)
      and p_dias in (7, 30, 90)
      and resumo is not null
      and (p_nivel is null or (resumo->>'nivel')::int = p_nivel)
      and (p_origem is null or (resumo->'escolhas'->'origens') ? p_origem)
      and (p_especializacao is null or (resumo->'escolhas'->'especializacoes') ? p_especializacao)
      and (p_addons is null or (resumo->>'addons')::boolean = p_addons)
  ), niveis as (
    select (resumo->>'nivel')::int as valor, count(*) as fichas
    from amostra group by 1
  ), escolhas as (
    select grupo.key as categoria, opcao.key as id, count(*) as fichas,
           sum(opcao.value::int) as soma
    from amostra
    cross join lateral jsonb_each(resumo->'escolhas') grupo
    cross join lateral jsonb_each_text(grupo.value) opcao
    group by 1, 2
  ), atributos as (
    select grupo.key as distribuicao, atributo.key as id, atributo.value::int as valor,
           count(*) as fichas
    from amostra
    cross join lateral jsonb_each(resumo->'atributos') grupo
    cross join lateral jsonb_each_text(grupo.value) atributo
    group by 1, 2, 3
  ), origem_especializacao as (
    select origem as origem, especializacao as especializacao, count(*) as fichas
    from amostra
    cross join lateral jsonb_object_keys(resumo->'escolhas'->'origens') origem
    cross join lateral jsonb_object_keys(resumo->'escolhas'->'especializacoes') especializacao
    group by 1, 2
  ), multiclasse as (
    select combinacao.especializacoes, count(*) as fichas
    from amostra
    cross join lateral (
      select array_agg(id order by id) as especializacoes
      from jsonb_object_keys(resumo->'escolhas'->'especializacoes') id
    ) combinacao
    where cardinality(combinacao.especializacoes) > 1
    group by 1
  )
  select jsonb_build_object(
    'total', (select count(*) from amostra),
    'niveis', coalesce((select jsonb_agg(niveis order by valor) from niveis), '[]'::jsonb),
    'escolhas', coalesce((select jsonb_agg(escolhas) from escolhas), '[]'::jsonb),
    'atributos', coalesce((select jsonb_agg(atributos order by valor) from atributos), '[]'::jsonb),
    'origemEspecializacao', coalesce((select jsonb_agg(origem_especializacao order by fichas desc, origem, especializacao) from origem_especializacao), '[]'::jsonb),
    'multiclasse', coalesce((select jsonb_agg(multiclasse order by fichas desc, especializacoes) from multiclasse), '[]'::jsonb)
  );
$$;

revoke all on function public.balanceamento_gravar(text, timestamptz, jsonb)
  from public, anon, authenticated;
revoke all on function public.balanceamento_relatorio(integer, integer, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.balanceamento_gravar(text, timestamptz, jsonb) to service_role;
grant execute on function public.balanceamento_relatorio(integer, integer, text, text, boolean) to service_role;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'balanceamento-apagar-expiradas', '13 * * * *',
  'delete from balanceamento_interno.fichas where recebido_em <= now() - interval ''90 days'''
);

commit;
notify pgrst, 'reload schema';
