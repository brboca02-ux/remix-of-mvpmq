create or replace function public.buscar_empresas(filtro text)
returns setof public.leads_import
language sql
stable
set search_path = public
as $$
  select *
  from public.leads_import
  where
    filtro is null
    or filtro = ''
    or razao_social ilike '%' || filtro || '%'
    or nome         ilike '%' || filtro || '%'
    or fantasia     ilike '%' || filtro || '%'
    or bairro       ilike '%' || filtro || '%'
    or cidade       ilike '%' || filtro || '%'
  limit 100;
$$;

create index if not exists idx_leads_import_busca
on public.leads_import
using gin (
  to_tsvector('portuguese',
    coalesce(razao_social,'') || ' ' ||
    coalesce(nome,'')         || ' ' ||
    coalesce(fantasia,'')     || ' ' ||
    coalesce(bairro,'')       || ' ' ||
    coalesce(cidade,'')
  )
);