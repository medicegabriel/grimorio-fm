begin;

alter table public.comunidade_publicacoes
  drop constraint comunidade_publicacoes_autor_check,
  add constraint comunidade_publicacoes_autor_check check (char_length(btrim(autor)) between 1 and 64);
alter table public.comunidade_comentarios
  drop constraint comunidade_comentarios_autor_check,
  add constraint comunidade_comentarios_autor_check check (char_length(btrim(autor)) between 1 and 64);

create or replace function comunidade_interna.nome_da_conta(p_conta uuid)
returns text language sql stable security invoker set search_path = '' as $$
  select pg_catalog.left(coalesce(
    (
      select coalesce(
        nullif(pg_catalog.btrim(i.identity_data->>'full_name'), ''),
        nullif(pg_catalog.btrim(pg_catalog.split_part(i.identity_data->>'name', '#', 1)), '')
      )
      from auth.identities i
      where i.user_id = u.id and i.provider = 'discord'
      order by i.last_sign_in_at desc nulls last, i.id
      limit 1
    ),
    case when u.email_confirmed_at is not null
      then nullif(pg_catalog.btrim(pg_catalog.split_part(u.email, '@', 1)), '')
    end
  ), 64)
  from auth.users u
  where u.id = p_conta;
$$;
revoke all on function comunidade_interna.nome_da_conta(uuid) from public, anon, authenticated;

-- A RPC existente revela somente a assinatura e os direitos da própria sessão.
create or replace function comunidade_interna.autoria(p_publicacao uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object(
    'nome', case when coalesce(auth.jwt()->>'is_anonymous', 'false') = 'false'
      then comunidade_interna.nome_da_conta(auth.uid()) end,
    'publicacao', exists(select 1 from public.comunidade_publicacoes
      where id = p_publicacao and conta_id = (select auth.uid())),
    'comentarios', coalesce((select pg_catalog.jsonb_agg(id) from public.comunidade_comentarios
      where publicacao_id = p_publicacao and conta_id = (select auth.uid())), '[]'::jsonb)
  );
$$;

create or replace function comunidade_interna.assinar_envio()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- conta_id tem auth.uid() como padrão e é protegido pelas políticas existentes.
  new.autor := comunidade_interna.nome_da_conta(new.conta_id);
  if new.autor is null then
    raise exception using errcode = 'P0001', message = 'comunidade_conta_sem_usuario';
  end if;
  return new;
end;
$$;
revoke all on function comunidade_interna.assinar_envio() from public, anon, authenticated;

create or replace trigger comunidade_assinar_publicacoes before insert on public.comunidade_publicacoes
  for each row execute function comunidade_interna.assinar_envio();
create or replace trigger comunidade_assinar_comentarios before insert on public.comunidade_comentarios
  for each row execute function comunidade_interna.assinar_envio();

-- Versões antigas podem enviar autor, mas o banco sempre o substitui.
with nomes as materialized (
  select conta_id, coalesce(comunidade_interna.nome_da_conta(conta_id), 'Conta da Comunidade') as nome
  from (
    select conta_id from public.comunidade_publicacoes
    union
    select conta_id from public.comunidade_comentarios
  ) contas
), publicacoes_atualizadas as (
  update public.comunidade_publicacoes p
  set autor = n.nome
  from nomes n
  where p.conta_id = n.conta_id and p.autor is distinct from n.nome
)
update public.comunidade_comentarios c
set autor = n.nome
from nomes n
where c.conta_id = n.conta_id and c.autor is distinct from n.nome;

commit;
