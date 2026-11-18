/* A CONVERSA COM O BANCO DA SALA (Encontro Unificado, etapa 7b, 2026-11-18).

   Uma função por RPC de supabase/salas.sql e as leituras das tabelas, todas por cima do `cliente()` da nuvem pessoal
   (nuvem-sync.js): a mesma sessão de login, o mesmo cliente, nenhuma chave nova. Toda escrita é RPC (o banco não dá grant
   de escrita em tabela nenhuma), e cada leitura lista as colunas, porque `select *` em `salas` falha (o `senha_hash`
   está fora do grant).

   O erro sai como `ErroDaSala` com o `codigo` em Title Case que o banco levantou ("Versão Mudou", "Sala Fechada"...), e
   o `detalhe` (a versão de agora, no "Versão Mudou"). Erro de rede e de sessão sai com `rede: true`, para quem chama
   tentar de novo em vez de desistir. */

import { cliente } from "./nuvem-sync";

export class ErroDaSala extends Error {
  constructor(codigo, { detalhe = null, rede = false, original = null } = {}) {
    super(codigo);
    this.name = "ErroDaSala";
    this.codigo = codigo;
    this.detalhe = detalhe;
    this.rede = rede;
    this.original = original;
  }
}

/* O que o banco levanta com `raise exception` chega com código P0001 e a mensagem como texto. O resto (rede, JWT vencido,
   PostgREST fora) é falha de transporte. */
function erroDe(error) {
  if (!error) return null;
  const codigo = String(error.code ?? "");
  if (codigo === "P0001") return new ErroDaSala(error.message, { detalhe: error.details ?? null, original: error });
  const rede = !codigo || codigo === "PGRST301" || /fetch|network|Failed|timeout/i.test(String(error.message ?? ""));
  return new ErroDaSala(rede ? "Sem Conexão" : String(error.message ?? "Falha na Sala"), { rede, original: error });
}

async function sbOuErro() {
  const sb = await cliente();
  if (!sb) throw new ErroDaSala("Nuvem Desligada");
  return sb;
}

async function rpc(nome, args) {
  const sb = await sbOuErro();
  let r;
  try {
    r = await sb.rpc(nome, args);
  } catch (e) {
    throw new ErroDaSala("Sem Conexão", { rede: true, original: e });
  }
  if (r.error) throw erroDe(r.error);
  return r.data;
}

const umaLinha = (data) => (Array.isArray(data) ? data[0] ?? null : data ?? null);

/* ---------- entrar, criar e controlar ---------- */

export const verSala = async (codigo) => umaLinha(await rpc("ver_sala", { p_codigo: codigo }));
export const criarSala = async (grupo, senha, nome) => umaLinha(await rpc("criar_sala", { p_grupo: grupo, p_senha: senha, p_nome: nome }));
export async function entrarNaSala(codigo, senha, papel = "jogador") {
  const linha = umaLinha(await rpc("entrar_na_sala", { p_codigo: codigo, p_senha: senha, p_papel: papel }));
  if (linha?.erro) throw new ErroDaSala(linha.erro);
  return linha;
}
export const minhasSalas = async () => (await rpc("minhas_salas", {})) ?? [];
export const trocarSenha = (sala, senha) => rpc("trocar_senha", { p_sala: sala, p_senha: senha });
export const trancar = (sala, trancada = true) => rpc("trancar", { p_sala: sala, p_trancada: trancada });
export const removerMembro = (sala, conta) => rpc("remover_membro", { p_sala: sala, p_conta: conta });
export const promoverMestre = (sala, conta, ligado = true) => rpc("promover_mestre", { p_sala: sala, p_conta: conta, p_ligado: ligado });
export const fecharSala = (sala) => rpc("fechar_sala", { p_sala: sala });

/* ---------- combatentes, resumo, ficha, compartilhamento, estado ---------- */

export const adicionarCombatente = (sala, { combatente, tipo, nome, lado = null, visao = null, dono = null }) =>
  rpc("adicionar_combatente", {
    p_sala: sala, p_combatente: combatente, p_tipo: tipo, p_nome: nome, p_lado: lado, p_visao: visao, p_dono: dono,
  });
export const removerCombatente = (sala, combatente) => rpc("remover_combatente", { p_sala: sala, p_combatente: combatente });
export const definirVisao = (sala, combatente, visao) => rpc("definir_visao", { p_sala: sala, p_combatente: combatente, p_visao: visao });
export const definirDono = (sala, combatente, dono) => rpc("definir_dono", { p_sala: sala, p_combatente: combatente, p_dono: dono });
export const publicarResumo = (sala, combatente, resumo) => rpc("publicar_resumo", { p_sala: sala, p_combatente: combatente, p_resumo: resumo });
/** Devolve a versão nova. Recusa com `codigo: "Versão Mudou"` e a versão de agora em `detalhe`. */
export const gravarFicha = async (sala, combatente, parte, dados, versao) =>
  Number(await rpc("gravar_ficha", { p_sala: sala, p_combatente: combatente, p_parte: parte, p_dados: dados, p_versao: versao ?? 0 }));
export const compartilharFicha = (sala, combatente, para, ligado = true) =>
  rpc("compartilhar_ficha", { p_sala: sala, p_combatente: combatente, p_para: para, p_ligado: ligado });
export const gravarEstado = (sala, { status, rodada, config, ordem, vez }) =>
  rpc("gravar_estado", { p_sala: sala, p_status: status, p_rodada: rodada, p_config: config, p_ordem: ordem, p_vez: vez });

/* ---------- o registro ---------- */

export const gravarOperacao = async (sala, especie, dados, escondida = false) =>
  umaLinha(await rpc("gravar_operacao", { p_sala: sala, p_especie: especie, p_dados: dados, p_escondida: escondida }));
export const responderPedido = async (sala, pedido, aceitar, operacao = null) =>
  umaLinha(await rpc("responder_pedido", { p_sala: sala, p_pedido: pedido, p_aceitar: aceitar, p_operacao: operacao }));

/* ---------- leituras (a RLS escolhe as linhas) ---------- */

export const COLUNAS = {
  salas: "id,codigo,grupo,nome,dono,trancada,status,criada_em,ultima_atividade,fechada_em,fechada_por",
  sala_membros: "id,sala_id,conta,papel,nome,avatar,entrou_em,removido_em",
  sala_estado: "sala_id,status,rodada,config,versao,atualizado_em",
  sala_ordem_mestre: "sala_id,ordem,vez,atualizado_em",
  sala_resumos: "id,sala_id,combatente,tipo,dono,visao,nome,lado,posicao,na_vez,publico,atualizado_em",
  sala_fichas: "id,sala_id,combatente,parte,dados,versao,atualizado_em,atualizado_por",
  sala_compartilhamentos: "id,sala_id,combatente,para,criado_em",
  sala_operacoes: "id,sala_id,seq,especie,operacao_id,autor,papel,dados,envolvidos,escondida,estado_pedido,respondido_por,respondido_em,responde,publica_id,criado_em",
  sala_operacoes_publicas: "id,sala_id,seq,especie,publica,estado_pedido,criado_em",
};

/** Todas as linhas de uma tabela desta Sala que a RLS deixa ler, em páginas de mil. */
export async function lerTabela(tabela, salaId, { filtro = null, ordem = null } = {}) {
  const sb = await sbOuErro();
  const linhas = [];
  const passo = 1000;
  for (let de = 0; ; de += passo) {
    let q = sb.from(tabela).select(COLUNAS[tabela]).eq(tabela === "salas" ? "id" : "sala_id", salaId);
    if (filtro) q = filtro(q);
    if (ordem) q = q.order(ordem);
    let r;
    try { r = await q.range(de, de + passo - 1); } catch (e) { throw new ErroDaSala("Sem Conexão", { rede: true, original: e }); }
    if (r.error) throw erroDe(r.error);
    linhas.push(...r.data);
    if (r.data.length < passo) return linhas;
  }
}

/** Uma linha de `sala_fichas` (para o conflito de versão e o evento grande demais). */
export async function lerParte(salaId, combatente, parte) {
  const linhas = await lerTabela("sala_fichas", salaId, { filtro: (q) => q.eq("combatente", combatente).eq("parte", parte) });
  return linhas[0] ?? null;
}

export { cliente };
