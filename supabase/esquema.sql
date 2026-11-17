-- Esquema da nuvem do Grimório (Supabase). Rodar uma vez no SQL Editor do projeto.
-- Guia completo em docs/nuvem-supabase.md.
--
-- Duas tabelas, as duas presas ao dono pela RLS. A chave anônima é pública (vai
-- no JavaScript do site), então a RLS é o que impede uma conta de ler ou gravar
-- a ficha de outra.

-- Uma linha por ficha. `chave` é o inventário de origem (fm_creatures_v1 na
-- 2.5.2, fm_creatures_player_v1, fm_creatures_afty_v1, fm_creatures_eradeouro_v1).
-- Ficha apagada fica marcada (`apagado`), para outro aparelho saber que saiu.
create table if not exists public.fichas (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  chave         text        not null,
  id            text        not null,
  dados         jsonb,
  apagado       boolean     not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave, id),
  constraint fichas_tamanho check (dados is null or pg_column_size(dados) < 2000000),
  constraint fichas_chave check (chave ~ '^fm_creatures(_[a-z]+)?_v1$' and chave not like 'fm_creatures_meta%')
);

-- As demais chaves do localStorage (encontros, modelos, addons, temas, pastas),
-- uma linha por chave, com o texto inteiro.
create table if not exists public.chaves (
  user_id       uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  chave         text        not null,
  valor         text        not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave),
  constraint chaves_tamanho check (octet_length(valor) < 4000000),
  -- Várias chaves levam o id da ficha depois de dois-pontos
  -- (fm_ficha_sessao_afty_v1:<id>, fm_builder_draft_v1:<id>), então só o prefixo
  -- e o comprimento são conferidos.
  constraint chaves_nome check (chave ~ '^(fm_|afty_)' and char_length(chave) <= 300)
);

-- A hora de cada linha é do SERVIDOR, nunca do aparelho. É ela que o site usa
-- como cursor para baixar só o que mudou desde a última visita, e relógio de
-- celular desacertado faria o cursor pular linhas.
create or replace function public.carimbar_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists fichas_carimbo on public.fichas;
create trigger fichas_carimbo before insert or update on public.fichas
  for each row execute function public.carimbar_atualizado_em();
drop trigger if exists chaves_carimbo on public.chaves;
create trigger chaves_carimbo before insert or update on public.chaves
  for each row execute function public.carimbar_atualizado_em();

create index if not exists fichas_por_hora on public.fichas (user_id, atualizado_em);
create index if not exists chaves_por_hora on public.chaves (user_id, atualizado_em);

alter table public.fichas enable row level security;
alter table public.chaves enable row level security;

drop policy if exists "dono le fichas" on public.fichas;
drop policy if exists "dono grava fichas" on public.fichas;
drop policy if exists "dono atualiza fichas" on public.fichas;
drop policy if exists "dono apaga fichas" on public.fichas;
create policy "dono le fichas"       on public.fichas for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono grava fichas"    on public.fichas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono atualiza fichas" on public.fichas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono apaga fichas"    on public.fichas for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "dono le chaves" on public.chaves;
drop policy if exists "dono grava chaves" on public.chaves;
drop policy if exists "dono atualiza chaves" on public.chaves;
drop policy if exists "dono apaga chaves" on public.chaves;
create policy "dono le chaves"       on public.chaves for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono grava chaves"    on public.chaves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono atualiza chaves" on public.chaves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "dono apaga chaves"    on public.chaves for delete to authenticated using ((select auth.uid()) = user_id);

-- Quem não entrou não enxerga nada. Quem entrou ganha acesso à TABELA (o
-- projeto pode não expor tabela nova à Data API sozinho), e a RLS acima escolhe
-- as LINHAS: só as do próprio dono.
revoke all on public.fichas from anon;
revoke all on public.chaves from anon;
grant select, insert, update, delete on public.fichas to authenticated;
grant select, insert, update, delete on public.chaves to authenticated;
