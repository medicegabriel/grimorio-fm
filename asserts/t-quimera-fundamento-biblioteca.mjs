/* Lote 11: PV após a fusão e perda do Fundamento na biblioteca, nos dois sistemas. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const I = await import(R + "afty-invocacoes.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const B = await import(R + "encontros/fundamento-biblioteca.js");
const { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");
aplicarAddons([]);
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const inv = (id, tipo = "shikigami", grau = "terceiro") => ({ ...I.createBlankInvocacao(grau, tipo), id, nome: id });
const qm = { ...I.createBlankQuimera(), id: "Q", principalId: "P", fundidasIds: ["S"] };
const parcela = (r, nome) => r.fontes.pv.filter((p) => p.label === nome);
for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.rulesVersion = sistema; c.id = "dono"; c.core.nd = 10; c.core.nivel = 10;
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  c.habilidades = ["ctr_invocacoes_resistentes", "ctr_visionario"];
  c.invocacoes = [inv("P"), inv("S")];
  c.invocacoes[0].caracteristicas = [{ ...I.createBlankCaracteristica(), id: "vida", nome: "Vida Própria", subtipo: "vida" }];
  c.quimeras = [qm];
  const salvo = JSON.stringify(c);
  const sem = deriveAfty({ ...c, habilidades: [] });
  const d = deriveAfty(c);
  const base = sem.invocacoes.lista;
  const esperado = base[0].pv + Math.floor(base[1].pv / 3) - I.grauMeta("terceiro").rank + d.maestria * 5;
  const r = d.quimeras.lista[0].resolvida;
  t(`${sistema}: Resistentes entra uma vez após a fusão`, r.pv, esperado);
  t(`${sistema}: componentes mantêm seus cartões com Resistentes`, d.invocacoes.lista.map((r, i) => r.pv - base[i].pv), [d.maestria * 5, d.maestria * 5]);
  t(`${sistema}: hover tem uma parcela com o nome da Habilidade`, parcela(r, "Invocações Resistentes").map((p) => p.valor), [d.maestria * 5]);
  t(`${sistema}: hover fecha com o PV`, r.fontes.pv.reduce((s, p) => s + (p.valor ?? 0), 0), r.pv);
  t(`${sistema}: Característica de Vida não entra novamente`, parcela(r, "Vida Própria").length, 0);
  t(`${sistema}: Visionário concede vagas à Quimera pronta`, r.efeitosHabilidade.orcamentoPago, Math.floor(d.maestria / 2));
  t(`${sistema}: ficha original não é mutada`, JSON.stringify(c), salvo);
  const antiga = I.resolveQuimera({ ...qm, regra: "addon", nivel: 2 }, c.invocacoes, {
    nd: 10, bt: d.maestria, nivelControlador: 10, nivelControladorReal: 10,
    efeitos: [{ canal: "pv", expr: "bt * 5", nome: "Invocações Resistentes" }],
  });
  t(`${sistema}: addon conserva soma dos cartões menos 10`, antiga.pv, d.invocacoes.lista.reduce((s, i) => s + i.pv, 0) - 10);
}
const dono = { nd: 10, bt: 4, nivelControlador: 10, nivelControladorReal: 10 };
const fichas = [inv("P", "tecnica"), inv("S", "shikigami", "segundo")];
const base = I.resolveInvocacoesList(fichas, dono).lista;
const formula = base[0].pv + Math.floor(base[1].pv / 3) - I.grauMeta("segundo").rank;
const resolver = (efeitos) => I.resolveQuimera(qm, fichas, { ...dono, efeitos }).resolvida;
const extras = resolver([
  { canal: "pv", expr: "7", nome: "Bênção" },
  { canal: "pv", expr: "3", quando: "grau >= 3", nome: "Grau Maior" },
  { canal: "pv", expr: "999", quando: "nunca", nome: "Desligado" },
]);
t("bônus afins usam o Motor no grau final", extras.pv, formula + 10);
t("todas as parcelas finais são nomeadas", [parcela(extras, "Bênção")[0]?.valor, parcela(extras, "Grau Maior")[0]?.valor, parcela(extras, "Desligado").length], [7, 3, 0]);
t("PV próprio do tipo Técnica não é reaplicado", extras.fontes.pv.reduce((s, p) => s + (p.valor ?? 0), 0), extras.pv);
t("efeito mirado só na componente não passa para a Quimera", resolver([{ canal: "pv", expr: "9", nome: "Só Principal", invocacaoAlvo: "P" }]).pv, formula);
t("efeito mirado na Quimera entra uma vez", resolver([{ canal: "pv", expr: "9", nome: "Só Quimera", invocacaoAlvo: "quimera:Q" }]).pv, formula + 9);
for (const valor of [0.5, -0.5]) {
  const r = resolver([{ canal: "pv", expr: String(valor), nome: "Fração" }]);
  t("PV fracionário após a fusão arredonda para baixo: " + valor, r.pv, formula + Math.floor(valor));
  t("hover inclui o arredondamento: " + valor, r.fontes.pv.reduce((s, p) => s + (p.valor ?? 0), 0), r.pv);
}
const f = inv("F");
const p = { ...inv("P"), marcadores: { elo: true }, marcadorFontes: { elo: ["F"] } };
const donoFontes = { ...dono, marcadores: [{ id: "elo", label: "Elo", limite: 4, fontes: true }], efeitos: [{ canal: "pv", expr: 'fontes("elo", "soma", "piso(pv_max / 4)")', quando: "marc_elo", nome: "PV do Elo" }] };
const rFontes = I.resolveQuimera(qm, [p, fichas[1], f], donoFontes).resolvida;
const semElo = I.resolveQuimera(qm, [p, fichas[1], f], { ...donoFontes, efeitos: [] }).resolvida;
t("PV após a fusão preserva o segundo passe de fontes", rFontes.pv - semElo.pv, Math.floor(I.resolveInvocacao(f, dono).pv / 4));
t("fonte do vínculo aparece uma vez no hover", parcela(rFontes, "PV do Elo").length, 1);

const registro = { invocacaoId: "F", nome: "Divino", em: "2026-10-03T15:00:00.000Z" };
const anterior = { invocacaoId: "antigo", nome: "Antigo", em: "2026-01-01" };
const memoria = (dados) => {
  const m = new Map(Object.entries(dados).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
  const writes = [];
  return { m, writes, bloqueado: false,
    getItem: (k) => m.get(k) ?? null,
    setItem(k, v) { if (this.bloqueado) throw new Error("quota"); writes.push(k); m.set(k, v); },
  };
};
const combatente = (sistema, registros = [registro], extra = {}) => ({
  id: "cmb-" + sistema, criaturaId: "mesmo-id", nome: "Cópia Antiga",
  ficha: { id: "mesmo-id", name: "Nome Antigo", rulesVersion: sistema, core: { nd: 1 }, fundamentosPerdidos: registros },
  ...extra,
});
const atual = (sistema) => ({ id: "mesmo-id", name: "Edição Posterior", rulesVersion: sistema,
  core: { nd: 20, tecnicaNome: "Outra Edição" }, invocacoes: [{ id: "F", nome: "Divino Editado" }],
  fundamentosPerdidos: [anterior], campoFuturo: { preservado: true }, updatedAt: "antes" });
for (const sistema of ["afty", "player"]) {
  const chave = `fm_creatures_${sistema}_v1`;
  const outroSistema = sistema === "afty" ? "player" : "afty";
  const outraChave = `fm_creatures_${outroSistema}_v1`;
  const outraFicha = { id: "outro", name: "Intocada", campo: 42 };
  const storage = memoria({ [chave]: [atual(sistema), outraFicha], [outraChave]: [atual(outroSistema)] });
  const cmb = combatente(sistema);
  const antes = JSON.stringify(cmb);
  const outraBiblioteca = storage.getItem(outraChave);
  const resultado = B.sincronizarFundamentosNaBiblioteca([cmb, { ...cmb, id: "segunda-copia" }], storage);
  const ficha = JSON.parse(storage.getItem(chave))[0];
  t(`${sistema}: perdas são unidas à biblioteca atual`, ficha.fundamentosPerdidos, [anterior, registro]);
  t(`${sistema}: edições posteriores são preservadas`, [ficha.name, ficha.core, ficha.invocacoes, ficha.campoFuturo], [atual(sistema).name, atual(sistema).core, atual(sistema).invocacoes, atual(sistema).campoFuturo]);
  t(`${sistema}: outra ficha da mesma biblioteca é preservada`, JSON.parse(storage.getItem(chave))[1], outraFicha);
  t(`${sistema}: id igual na outra biblioteca não é tocado`, storage.getItem(outraChave), outraBiblioteca);
  t(`${sistema}: duas cópias geram uma gravação`, storage.writes, [chave]);
  t(`${sistema}: resultado permite atualizar o app na mesma aba`, [resultado.gravadas[0].sistema, resultado.gravadas[0].ficha.name, resultado.falhas], [sistema, "Edição Posterior", []]);
  t(`${sistema}: atualização da aba recebe toda a biblioteca atual`, resultado.gravadas[0].biblioteca, JSON.parse(storage.getItem(chave)));
  t(`${sistema}: perda não altera o snapshot`, JSON.stringify(cmb), antes);
  t(`${sistema}: repetir não grava nem duplica`, B.sincronizarFundamentosNaBiblioteca([cmb], storage), { gravadas: [], falhas: [] });
  t(`${sistema}: carimbo do primeiro registro é preservado`, JSON.parse(storage.getItem(chave))[0].fundamentosPerdidos[1].em, registro.em);
  const excluida = memoria({ [chave]: [outraFicha] });
  t(`${sistema}: criatura removida não é recriada`, B.sincronizarFundamentosNaBiblioteca([cmb], excluida).falhas.length, 1);
  t(`${sistema}: ausência não grava`, excluida.writes, []);
  const semVinculo = memoria({ [chave]: [atual(sistema)] });
  t(`${sistema}: id do vínculo diferente do snapshot é recusado`, B.sincronizarFundamentosNaBiblioteca([{ ...cmb, criaturaId: "outro" }], semVinculo).falhas.length, 1);
  t(`${sistema}: vínculo inválido não grava`, semVinculo.writes, []);
  const errado = memoria({ [chave]: [atual(outroSistema)] });
  t(`${sistema}: ficha do outro sistema na chave é recusada`, B.sincronizarFundamentosNaBiblioteca([cmb], errado).falhas.length, 1);
  t(`${sistema}: sistema errado não grava`, errado.writes, []);
  const duplicada = memoria({ [chave]: [atual(sistema), atual(sistema)] });
  t(`${sistema}: id duplicado não escolhe ficha por suposição`, B.sincronizarFundamentosNaBiblioteca([cmb], duplicada).falhas.length, 1);
  t(`${sistema}: id duplicado não grava`, duplicada.writes, []);
  for (const raw of ["{quebrado", "{}", "[null]", '[{"name":"Sem ID"}]']) {
    const ruim = memoria({ [chave]: raw });
    t(`${sistema}: biblioteca inválida gera falha (${raw})`, B.sincronizarFundamentosNaBiblioteca([cmb], ruim).falhas.length, 1);
    t(`${sistema}: biblioteca inválida é preservada (${raw})`, ruim.getItem(chave), raw);
  }
  const bloqueado = memoria({ [chave]: [atual(sistema)] }); bloqueado.bloqueado = true;
  const rawAntes = bloqueado.getItem(chave);
  t(`${sistema}: falha de escrita é informada`, B.sincronizarFundamentosNaBiblioteca([cmb], bloqueado).falhas.length, 1);
  t(`${sistema}: falha mantém o storage anterior`, bloqueado.getItem(chave), rawAntes);
  bloqueado.bloqueado = false;
  t(`${sistema}: nova tentativa grava a perda`, B.sincronizarFundamentosNaBiblioteca([cmb], bloqueado).gravadas.length, 1);
  const antiga = atual(sistema); delete antiga.rulesVersion; delete antiga.fundamentosPerdidos;
  const migrada = memoria({ [chave]: [antiga] });
  t(`${sistema}: ficha antiga herda sua biblioteca`, B.sincronizarFundamentosNaBiblioteca([cmb], migrada).falhas, []);
  t(`${sistema}: ficha antiga recebe o registro`, JSON.parse(migrada.getItem(chave))[0].fundamentosPerdidos, [registro]);
}
const misto = memoria({ fm_creatures_afty_v1: [atual("afty")], fm_creatures_player_v1: [atual("player")] });
t("Encontro misto grava na biblioteca de cada ficha", B.sincronizarFundamentosNaBiblioteca([combatente("afty"), combatente("player")], misto).gravadas.map((g) => g.sistema), ["afty", "player"]);
t("combatente sem ficha ou sem perdas não escreve", B.sincronizarFundamentosNaBiblioteca([{ ficha: null }, combatente("afty", [])], misto), { gravadas: [], falhas: [] });
const publico = combatente("2.5.2");
t("ficha pública não ganha caminho para bibliotecas privadas", B.sincronizarFundamentosNaBiblioteca([publico], misto).falhas.length, 1);
const state = { combatentes: [combatente("afty", [])] };
const snapshot = JSON.stringify(state);
const gravado = redutorDeEncontro(state, { tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id: "cmb-afty", registro });
t("redutor guarda a perda na cópia do Encontro", gravado.combatentes[0].ficha.fundamentosPerdidos, [registro]);
t("redutor não altera o estado anterior", JSON.stringify(state), snapshot);
t("redutor não duplica registros", redutorDeEncontro(gravado, { tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id: "cmb-afty", registro }).combatentes[0].ficha.fundamentosPerdidos, [registro]);
t("redutor ignora registro com id inválido", redutorDeEncontro(state, { tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id: "cmb-afty", registro: { invocacaoId: 42 } }).combatentes[0] === state.combatentes[0], true);
const falhas = [{ nome: "Cópia", motivo: "Biblioteca Indisponível" }];
const pendente = redutorDeEncontro(gravado, { tipo: "RESULTADO_FUNDAMENTOS_BIBLIOTECA", falhas });
t("falha real fica disponível para a tela", pendente.fundamentosSemGravar, falhas);
t("mesmo resultado preserva identidade do Encontro", redutorDeEncontro(pendente, { tipo: "RESULTADO_FUNDAMENTOS_BIBLIOTECA", falhas }) === pendente, true);
t("sucesso retira a pendência da tela", redutorDeEncontro(pendente, { tipo: "RESULTADO_FUNDAMENTOS_BIBLIOTECA", falhas: [] }).fundamentosSemGravar, []);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
