import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
// A entrada do servidor prepara a resolução dos módulos do catálogo no Node.
import { obterRelatorio, receberContribuicao, servicoSupabase } from "../server/balanceamento.js";
import {
  CHAVE_PREFERENCIA, enviarResumoDaFicha, fichasParaIncluir, incluirFichasJaSalvas,
} from "../src/systems/afty/balanceamento/coleta.js";

const { CATEGORIAS, resumirFicha, resumoValido } = await import("../src/systems/afty/balanceamento/resumo.js");
let ok = 0;
const t = (real, esperado) => { assert.deepEqual(real, esperado); ok += 1; };
const ficha = {
  id: "id-da-ficha-local",
  name: "Nome Privado",
  notes: "Anotações Privadas",
  rulesVersion: "player",
  core: { nd: 4, origem: { id: "herdado", cla: "cla_gojo", bonusAtributos: { forca: 1 } } },
  especializacoes: [{ id: "lutador", nivel: 3 }, { id: "conjurador", nivel: 1 }, { id: "addon:classe", nivel: 6 }],
  attrMethod: "fixos",
  attributes: { forca: 14, vazamento: 18 },
  pericias: { atletismo: "mestre", "pericia-privada": "treinado" },
  feiticos: [{ tipo: "dano", nivel: 1, nome: "Feitiço Privado" }, { tipo: "dano", nivel: 1 }],
};
const resumo = resumirFicha(ficha);
t(resumoValido(resumo), true);
t(resumo.escolhas.especializacoes, { lutador: 3, conjurador: 1 });
t(resumirFicha({ ...ficha, especializacoes: [{ id: "lutador", nivel: 1 }] }).escolhas.especializacoes, { lutador: 4 });
t(resumo.escolhas.feiticos, { "dano/1": 2 });
t(resumo.escolhas.pericias, { atletismo: 2 });
t(resumo.atributos.base, { forca: 14 });
t(resumo.atributos.origem.forca, 1);
t(/privad|id-da-ficha|addon:classe|vazamento/i.test(JSON.stringify(resumo)), false);
t(Object.keys(CATEGORIAS.habilidades).length > 100, true);
t(resumirFicha({ ...ficha, especializacoes: [] }), null);
t(resumirFicha({ ...ficha, edicaoDeRegras: "eclesiastes" }), null);
t(resumirFicha({ ...ficha, mesa: "eradeouro" }), null);
t(resumirFicha({ ...ficha, rulesVersion: "afty" }), null);
t(resumoValido({ ...resumo, name: ficha.name }), false);
t(resumoValido({ ...resumo, escolhas: { ...resumo.escolhas, talentos: { "fora-do-catalogo": 1 } } }), false);
t(servicoSupabase({}), null);

const armazenamento = new Map();
const envios = [];
const opcoes = {
  ativo: true,
  obterArmazenamento: () => ({ getItem: (key) => armazenamento.get(key), setItem: (key, valor) => armazenamento.set(key, valor) }),
  enviar: async (url, req) => envios.push({ url, req }),
};
const agora = Date.now();
const salvoEm = new Date(agora).toISOString();
await enviarResumoDaFicha(ficha, salvoEm, opcoes);
t(envios.length, 0);
armazenamento.set(CHAVE_PREFERENCIA, "ativa");
await enviarResumoDaFicha({ ...ficha, especializacoes: [] }, salvoEm, opcoes);
t(envios.length, 0);
await enviarResumoDaFicha(ficha, salvoEm, opcoes);
await enviarResumoDaFicha(ficha, salvoEm, opcoes);
const [primeiro, segundo] = envios.map(({ req }) => JSON.parse(req.body));
t(primeiro.chave, segundo.chave);
t(envios[0].req.credentials, "omit");
t(primeiro.resumo, resumo);
await enviarResumoDaFicha({ ...ficha, id: "outra-ficha" }, salvoEm, opcoes);
t(JSON.parse(envios.at(-1).req.body).chave === primeiro.chave, false);
await enviarResumoDaFicha({ ...ficha, especializacoes: [] }, salvoEm, opcoes);
t(JSON.parse(envios.at(-1).req.body).resumo, null);
await enviarResumoDaFicha(ficha, salvoEm, { ...opcoes, enviar: async () => { throw new Error("offline"); } });
armazenamento.set(CHAVE_PREFERENCIA, "desativada");
await enviarResumoDaFicha(ficha, salvoEm, opcoes);
t(envios.length, 4);

const navegador = new Map();
const local = { getItem: (key) => navegador.get(key) ?? null, setItem: (key, valor) => navegador.set(key, valor) };
const fichasJaSalvas = [ficha, { ...ficha, id: "segunda-ficha" }, { ...ficha, id: "outra-edicao", edicaoDeRegras: "eclesiastes" }];
const enviosLote = [];
const opcoesLote = {
  ativo: true, obterArmazenamento: () => local,
  enviar: async (_url, req) => {
    enviosLote.push(JSON.parse(req.body));
    return enviosLote.length === 2 ? { ok: false, status: 429 } : { ok: true, status: 204 };
  },
};
t(fichasParaIncluir(fichasJaSalvas, local).length, 2);
t(enviosLote.length, 0);
t(await incluirFichasJaSalvas(fichasJaSalvas, opcoesLote), { estado: "limite", enviadas: 1 });
t(fichasParaIncluir(fichasJaSalvas, local).map((c) => c.id), ["segunda-ficha"]);
t(await incluirFichasJaSalvas(fichasJaSalvas, opcoesLote), { estado: "concluida", enviadas: 1 });
t(enviosLote.length, 3);
t(enviosLote[1].chave, enviosLote[2].chave);
t(enviosLote[0].salvoEm, enviosLote[1].salvoEm);
t(enviosLote[0].aceiteLote, 1);
t(Object.keys(enviosLote[0]).sort(), ["aceiteLote", "chave", "resumo", "salvoEm", "versao"]);
t(enviosLote[0].resumo, resumo);
t(navegador.has(CHAVE_PREFERENCIA), false);
t(fichasParaIncluir(fichasJaSalvas, local), []);
await enviarResumoDaFicha(ficha, salvoEm, opcoesLote);
t(enviosLote.length, 3);
navegador.set(CHAVE_PREFERENCIA, "desativada");
t(await incluirFichasJaSalvas([{ ...ficha, id: "pendente" }], opcoesLote), { estado: "interrompida", enviadas: 0 });
t(enviosLote.length, 3);

const optOutNoEnvio = {
  ...opcoesLote,
  enviar: async () => {
    navegador.set(CHAVE_PREFERENCIA, "desativada");
    return { ok: true, status: 204 };
  },
};
navegador.set(CHAVE_PREFERENCIA, "ativa");
t(await incluirFichasJaSalvas([{ ...ficha, id: "pendente" }, { ...ficha, id: "terceira" }], optOutNoEnvio),
  { estado: "interrompida", enviadas: 1 });
t(fichasParaIncluir([{ ...ficha, id: "pendente" }, { ...ficha, id: "terceira" }], local).map((c) => c.id), ["terceira"]);

const origem = "https://fichas.invalid";
const contribuicao = (dados, origin = origem) => new Request(`${origem}/api/balanceamento/contribuicao`, {
  method: "POST", body: JSON.stringify(dados), headers: { Origin: origin, "Content-Type": "application/json" },
});
let ultimaRpc;
const banco = {
  auth: { getUser: async (token) => token === "invalido" ? { error: { status: 401 } } : { data: { user: { id: token } } } },
  rpc: async (nome, params) => { ultimaRpc = { nome, params }; return { data: { total: 0 } }; },
};
t((await receberContribuicao(contribuicao(primeiro), banco, agora)).status, 204);
t(ultimaRpc.nome, "balanceamento_gravar");
t(ultimaRpc.params.p_chave.length, 64);
t(ultimaRpc.params.p_resumo, resumo);
t((await receberContribuicao(contribuicao({ ...primeiro, aceiteLote: 1 }), banco, agora)).status, 204);
t(ultimaRpc.params.p_resumo, { ...resumo, aceiteLote: { versao: 1, aceitoEm: salvoEm } });
t((await receberContribuicao(contribuicao({ ...primeiro, aceiteLote: 8 }), banco, agora)).status, 400);
t((await receberContribuicao(contribuicao({ ...primeiro, resumo: null, aceiteLote: 1 }), banco, agora)).status, 400);
t((await receberContribuicao(contribuicao(primeiro, "https://outro.invalid"), banco, agora)).status, 403);
t((await receberContribuicao(contribuicao({ ...primeiro, chave: randomUUID(), resumo: { ...resumo, id: ficha.id } }), banco, agora)).status, 400);
t((await receberContribuicao(contribuicao({ ...primeiro, salvoEm: "2000-01-01T00:00:00.000Z" }), banco, agora)).status, 400);

const relatorio = (token, filtros = "") => new Request(`${origem}/api/balanceamento/relatorio${filtros}`, {
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
t((await obterRelatorio(relatorio(), banco, "autor")).status, 401);
t((await obterRelatorio(relatorio("invalido"), banco, "autor")).status, 401);
t((await obterRelatorio(relatorio("visitante"), banco, "autor")).status, 403);
t((await obterRelatorio(relatorio("autor", "?dias=47"), banco, "autor")).status, 400);
const resposta = await obterRelatorio(relatorio("autor", "?dias=7&nivel=4&especializacao=lutador&addons=sem"), banco, "autor");
t(resposta.status, 200);
t(await resposta.json(), { total: 0 });
t(resposta.headers.get("cache-control"), "private, no-store");
t(ultimaRpc.params, { p_dias: 7, p_nivel: 4, p_origem: null, p_especializacao: "lutador", p_addons: false });
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
