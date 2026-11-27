begin;

grant update (titulo, resumo, texto, dados, conteudo) on public.comunidade_publicacoes to authenticated;

create policy comunidade_publicacoes_atualizacao on public.comunidade_publicacoes for update to authenticated
  using (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false')
  with check (conta_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'), 'false') = 'false');

commit;
