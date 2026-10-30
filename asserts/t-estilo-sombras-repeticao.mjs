import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const E = await import("../src/systems/afty/afty-estilo-sombras.js");
const A = await import("../src/systems/afty/afty-addons.js");
let ok = 0;
const bad = [];
const t = (nome, atual, esperado) => {
  if (JSON.stringify(atual) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(atual)} != ${JSON.stringify(esperado)}`);
};
const tecnica = (efeitos = [], aptidoes = []) => ({ ...E.createBlankTecnicaEstilo(), id: "t1", nome: "Teste", efeitos, aptidoes, exaustao: 4 });
const ficha = (sistema, tec, ativa = true) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 13;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom: 5, au: 3, cl: 3 };
  c.aptidoesAmaldicoadas = ["aura_reforcada", "cobrir_se"];
  c.estilosSombra = [tec];
  c.combate = { ativo: true, estilo_ativo: true, estilo_tecnica: ativa ? ["t1"] : [], cobrirSePE: 2 };
  return c;
};
const compras = (id, escolha, repeticao, n = 2) => Array.from({ length: n }, (_, i) => ({
  uid: `e${i}`, efeitoId: id, ...(escolha ? { escolha } : {}), ...(i === 1 && repeticao ? { repeticao } : {}),
}));
const def = d => d.defesa;
const tr = d => d.testes.resistencias.find(p => p.value === "reflexos").bonus;
const per = d => d.testes.pericias.find(p => p.id === "percepcao").bonus;
const acerto = d => d.testes.ataques.find(p => p.id === "corpo").bonus;
const margem = d => d.dano.entradas.find(p => p.id === "basico").margemCritico;
for (const sistema of ["afty", "player"]) {
  for (const [id, escolha, ler, base, dobro] of [
    ["defesa", null, def, 2, 5], ["tr", { tr: "reflexos" }, tr, 2, 5],
    ["pericia", { pericia: "percepcao" }, per, 2, 5],
    ["deslocamento", null, d => d.movimento, 4.5, 9], ["margem", null, margem, -2, -4],
  ]) {
    const pessoal = tecnica(compras(id, escolha, "pessoal"));
    const cru = ficha(sistema, pessoal);
    const antes = JSON.stringify(cru);
    const ligada = deriveAfty(cru), desligada = deriveAfty(ficha(sistema, pessoal, false));
    t(`${sistema} ${id}: bônus pessoal no valor final`, ler(ligada) - ler(desligada), dobro);
    t(`${sistema} ${id}: duas vagas`, ligada.estilo.tecnicas[0].usados, 2);
    t(`${sistema} ${id}: sem bônus aos aliados`, ligada.estilo.tecnicas[0].aliadosCalculados, []);
    t(`${sistema} ${id}: não muda o dado gravado`, JSON.stringify(cru), antes);
    const aliados = tecnica(compras(id, escolha, "aliados"));
    const da = deriveAfty(ficha(sistema, aliados));
    t(`${sistema} ${id}: aliados mantêm o bônus pessoal original`, ler(da) - ler(desligada), base);
    t(`${sistema} ${id}: aliados recebem o valor original`, da.estilo.tecnicas[0].aliadosCalculados.map(x => x.valor), [Math.abs(base)]);
    const antiga = tecnica(compras(id, escolha));
    t(`${sistema} ${id}: duas compras antigas conservam aliados`, deriveAfty(ficha(sistema, antiga)).estilo.tecnicas[0].aliadosCalculados, da.estilo.tecnicas[0].aliadosCalculados);
    const misturada = tecnica([...compras(id, escolha, "pessoal"), { uid: "e2", efeitoId: id, escolha, repeticao: "aliados" }]);
    const dm = deriveAfty(ficha(sistema, misturada));
    t(`${sistema} ${id}: combinação proibida`, dm.estilo.tecnicas[0].validacao.some(v => v.codigo === "repeticao_exclusiva"), true);
    t(`${sistema} ${id}: combinação inteira sem efeito`, ler(dm) - ler(desligada), 0);
    t(`${sistema} ${id}: dados conflitantes preservados`, dm.estilo.tecnicas[0].efeitos.length, 3);
  }
  for (const [id, escolha, ler] of [["acerto", { ataque: "corpo" }, acerto], ["cd", null, d => d.cd]]) {
    const duas = tecnica(compras(id, escolha));
    const zero = deriveAfty(ficha(sistema, duas, false));
    t(`${sistema} ${id}: uma compra usa metade arredondada`, ler(deriveAfty(ficha(sistema, tecnica(compras(id, escolha, null, 1))))) - ler(zero), 2);
    t(`${sistema} ${id}: duas compras usam BT inteiro ímpar`, ler(deriveAfty(ficha(sistema, duas))) - ler(zero), 5);
    t(`${sistema} ${id}: duas compras antigas não concedem aliados`, deriveAfty(ficha(sistema, duas)).estilo.tecnicas[0].aliadosCalculados, []);
    const paraAliados = tecnica(compras(id, escolha, "aliados"));
    const comAliados = deriveAfty(ficha(sistema, paraAliados));
    t(`${sistema} ${id}: aliados mantêm metade no usuário`, ler(comAliados) - ler(zero), 2);
    t(`${sistema} ${id}: aliados recebem metade`, comAliados.estilo.tecnicas[0].aliadosCalculados.map(a => a.valor), [2]);
    t(`${sistema} ${id}: escolha aparece no rótulo dos aliados`, comAliados.estilo.tecnicas[0].aliadosCalculados[0].rotulo,
      id === "acerto" ? "Acerto dos Aliados no Domínio (Corpo a Corpo)" : "CD dos Aliados no Domínio");
    t(`${sistema} ${id}: escolha normalizada persiste`, E.normalizaTecnicaEstilo(JSON.parse(JSON.stringify(paraAliados))).efeitos[1].repeticao, "aliados");
    const pessoalExplicito = tecnica(compras(id, escolha, "pessoal"));
    t(`${sistema} ${id}: escolha pessoal mantém BT cheio`, ler(deriveAfty(ficha(sistema, pessoalExplicito))) - ler(zero), 5);
    const misturada = tecnica([...compras(id, escolha, "pessoal"), { uid: "extra", efeitoId: id, escolha, repeticao: "aliados" }]);
    const mistura = deriveAfty(ficha(sistema, misturada));
    t(`${sistema} ${id}: combinação incompatível`, mistura.estilo.tecnicas[0].validacao.some(v => v.codigo === "repeticao_exclusiva"), true);
    t(`${sistema} ${id}: combinação sem benefício parcial`, ler(mistura) - ler(zero), 0);
    const tres = deriveAfty(ficha(sistema, tecnica(compras(id, escolha, null, 3))));
    t(`${sistema} ${id}: terceira compra rejeitada`, tres.estilo.tecnicas[0].mecanicamenteValida, false);
    t(`${sistema} ${id}: terceira não concede bônus parcial`, ler(tres) - ler(zero), 0);
  }
  for (const [modId, aptidaoId, ler] of [["au_bonus_numerico", "aura_reforcada", d => d.rdFisico], ["cl_bonus_numerico", "cobrir_se", d => d.pvTemporario]]) {
    const aptidoes = [{ uid: "a1", modId, aptidaoId }, { uid: "a2", modId, aptidaoId, repeticao: "pessoal" }];
    const tec = tecnica([], aptidoes);
    const d = deriveAfty(ficha(sistema, tec)), fora = deriveAfty(ficha(sistema, tec, false));
    t(`${sistema} ${modId}: dobra após arredondar AU/CL`, ler(d) - ler(fora), 4);
    t(`${sistema} ${modId}: não estende aos aliados`, d.estilo.tecnicas[0].aliadosCalculados, []);
    const conflito = tecnica([], [...aptidoes, { uid: "a3", modId, aptidaoId, repeticao: "aliados" }]);
    t(`${sistema} ${modId}: incompatibilidade rejeitada`, deriveAfty(ficha(sistema, conflito)).estilo.tecnicas[0].mecanicamenteValida, false);
    t(`${sistema} ${modId}: opção persiste normalizada`, E.normalizaTecnicaEstilo(JSON.parse(JSON.stringify(tec))).aptidoes[1].repeticao, "pessoal");
  }
  const semBase = tecnica([{ uid: "u1", efeitoId: "defesa", repeticao: "pessoal" }]);
  t(`${sistema}: reforço sem pagar base rejeitado`, deriveAfty(ficha(sistema, semBase)).estilo.tecnicas[0].validacao.some(v => v.codigo === "repeticao_base"), true);
  const invalida = tecnica(compras("defesa", null, "inventada"));
  t(`${sistema}: opção desconhecida rejeitada`, deriveAfty(ficha(sistema, invalida)).estilo.tecnicas[0].mecanicamenteValida, false);
  const separado = tecnica([...compras("tr", { tr: "reflexos" }, "pessoal"), ...compras("tr", { tr: "vontade" }, "aliados")]);
  t(`${sistema}: escolhas diferentes são independentes`, deriveAfty(ficha(sistema, separado)).estilo.tecnicas[0].mecanicamenteValida, true);
}
const epico = A.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/player-progressao-epica.json", import.meta.url), "utf8")));
for (const sistema of ["afty", "player"]) {
  const c = ficha(sistema, tecnica());
  if (sistema === "player") c.addons = [epico];
  for (const nd of [30, 31, 34, 37, 40, 43]) {
    c.core.nd = nd;
    const d = deriveAfty(c);
    /* A progressao propria e do personagem (divergencia `progressaoDoEstilo`). A criatura
       gasta o contador comum e nao tem progressao. */
    t(`${sistema} ND ${nd}: progressão continua no derive`, d.estilo.progressao.total,
      sistema === "player" ? 2 + Math.floor((nd - 4) / 3) : 0);
  }
}
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
