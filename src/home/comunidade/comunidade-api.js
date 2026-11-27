import { cliente } from "../../nuvem/nuvem-sync";
import { termosDe } from "../../systems/afty/ficha/efeitos/util";

const PUBLICACOES = "comunidade_publicacoes";
const COMENTARIOS = "comunidade_comentarios";
const COLUNAS_CATALOGO = "id,categoria,titulo,autor,resumo,dados,criado_em";
const COLUNAS_COMENTARIO = "id,autor,texto,criado_em";
const TAMANHO_PAGINA = 24;
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

async function banco() {
  const sb = await cliente();
  if (!sb) throw new Error("A Comunidade ainda não está disponível neste ambiente.");
  return sb;
}

function obter({ data, error }) {
  if (!error) return data;
  const limite = {
    comunidade_limite_publicacoes: "Você atingiu o limite de 50 publicações. Retire uma para publicar outra.",
    comunidade_limite_comentarios: "Você atingiu o limite de 200 comentários. Exclua um para continuar.",
    comunidade_conta_sem_usuario: "A conta precisa de um usuário do Discord ou de um e-mail confirmado.",
  }[error.message];
  const mensagem = limite ?? ({
    "42501": "Entre novamente na sua conta para concluir esta ação.",
    "23503": "Esta publicação já foi retirada.",
    "23514": "O conteúdo não atende aos limites da Comunidade.",
    "42P01": "O catálogo ainda não foi ativado neste ambiente.",
    PGRST205: "O catálogo ainda não foi ativado neste ambiente.",
  }[error.code] ?? "Não foi possível concluir a ação. Tente novamente.");
  throw new Error(mensagem);
}

function paginar(linhas) {
  return { itens: linhas.slice(0, TAMANHO_PAGINA), mais: linhas.length > TAMANHO_PAGINA };
}

export async function buscarPublicacoes({ categoria, busca, ordem, pagina }, sinal) {
  const sb = await banco();
  const inicio = pagina * TAMANHO_PAGINA;
  let consulta = sb.from(PUBLICACOES).select(COLUNAS_CATALOGO);
  if (categoria !== "tudo") consulta = consulta.eq("categoria", categoria);
  for (const termo of termosDe(busca.replaceAll("*", " ")).slice(0, 8)) {
    const literal = termo.replace(/[\\%_]/g, "\\$&");
    consulta = consulta.ilike("busca", `%${literal}%`);
  }
  return paginar(obter(await consulta
    .order(ordem === "nome" ? "titulo" : "criado_em", { ascending: ordem === "nome" })
    .order("id", { ascending: true }).range(inicio, inicio + TAMANHO_PAGINA).abortSignal(sinal)));
}

export async function buscarPublicacao(id, sinal) {
  if (!UUID.test(id)) return null;
  const sb = await banco();
  return obter(await sb.from(PUBLICACOES).select(`${COLUNAS_CATALOGO},texto,conteudo`)
    .eq("id", id).abortSignal(sinal).maybeSingle());
}

export async function buscarComentarios(id, pagina, sinal) {
  const sb = await banco();
  const inicio = pagina * TAMANHO_PAGINA;
  return paginar(obter(await sb.from(COMENTARIOS).select(COLUNAS_COMENTARIO)
    .eq("publicacao_id", id).order("criado_em", { ascending: false })
    .order("id", { ascending: true }).range(inicio, inicio + TAMANHO_PAGINA).abortSignal(sinal)));
}

export async function buscarAutoria(id, sinal) {
  const sb = await banco();
  const consulta = sb.rpc("comunidade_autoria", { p_publicacao: id });
  return obter(await (sinal ? consulta.abortSignal(sinal) : consulta));
}

export async function publicarCriacao(publicacao) {
  const sb = await banco();
  const resposta = await sb.from(PUBLICACOES).insert(publicacao).select("id").single();
  if (resposta.error?.code === "23505" && (await buscarAutoria(publicacao.id)).publicacao) return publicacao.id;
  return obter(resposta).id;
}

export async function editarPublicacao(id, alteracoes) {
  const sb = await banco();
  const editada = obter(await sb.from(PUBLICACOES).update(alteracoes).eq("id", id).select("id").maybeSingle());
  if (!editada) throw new Error("Não foi possível editar. A publicação pode ter sido retirada ou pertencer a outra conta.");
}

export async function publicarComentario(comentario) {
  const sb = await banco();
  const resposta = await sb.from(COMENTARIOS).insert(comentario).select("id").single();
  if (resposta.error?.code === "23505" && (await buscarAutoria(comentario.publicacao_id)).comentarios.includes(comentario.id)) return;
  obter(resposta);
}

async function excluir(tabela, id) {
  const sb = await banco();
  const removido = obter(await sb.from(tabela).delete().eq("id", id).select("id").maybeSingle());
  if (!removido) throw new Error("O conteúdo já foi retirado ou pertence a outra conta.");
}

export const excluirPublicacao = (id) => excluir(PUBLICACOES, id);
export const excluirComentario = (id) => excluir(COMENTARIOS, id);
