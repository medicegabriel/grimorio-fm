/**
 * ATAQUE CONCENTRADO (Combatente 10°), ligado em 2026-09-12.
 *
 * "Ao utilizar a ação Atacar, você pode gastar PE equivalentes a metade do custo
 *  de Ataque Extra e/ou Surto de Ação, até um limite igual ao máximo de vezes que
 *  poderia usá-los dentro do seu turno. Para cada vez que o fizer, você adiciona
 *  metade dos dados de dano de um ataque (mínimo 1 dado) à rolagem de dano do seu
 *  próximo ataque."
 *
 * As decisões do autor, por pergunta:
 *   • O limite é a sequência do turno: *"Ataque (Cheio) + Ataque Extra
 *     (Concentrado) + Surto de Ação (Concentrado) + Ataque Extra (Concentrado)"*.
 *     Três com Surto de Ação, um sem. Ataque por ação bônus ou livre não conta.
 *   • Metade do Surto (5 PE) é 2, para baixo. A sequência custa 1, 3 e 4 PE.
 *   • Vale nos dois sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O estado: teto, custo e que o `resolveCombate` apara no mesmo teto. Faixa
 *    sem teto lá é aparada em zero calada, e foi exatamente o que aconteceu na
 *    primeira versão desta habilidade.
 * 2. A metade usa o ataque original, com mínimo de um dado por concentração.
 *    Desde 2026-10-05 o piso vem após somar as concentrações: 7 / 2 * 3 = 10.
 * 3. Vale para arma e Ataque Básico, nos dois sistemas, e não vaza para quem
 *    não tem a habilidade nem para fora de combate.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const C = await import(R + "afty-combate.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const HABS = ["cmb_ataque_extra", "cmb_ataque_concentrado"];
const ficha = (sistema, vezes, { surto = true, arma = "arm_espada_grande", habs = HABS, ativo = true, nivel = 12 } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel }];
  f.habilidades = [...habs, ...(surto ? ["cmb_surto_de_acao"] : [])];
  f.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: arma, qtd: 1, equipado: true }] };
  f.combate = { ativo, ataqueConcentrado: vezes };
  return f;
};
const linha = (f, id) => deriveAfty(f).dano.entradas.find((e) => e.id === id);
const dadosDe = (f, id) => linha(f, id).dados;

/* ============================================================ */
/* 1. O ESTADO                                                   */
/* ============================================================ */
const estado = C.COMBATE_ESTADOS.find((e) => e.id === "ataqueConcentrado");
t("o estado existe e é faixa", [estado?.tipo, estado?.min, estado?.requerHabilidade], ["faixa", 0, "cmb_ataque_concentrado"]);
t("com Surto de Ação o teto é 3", estado.max(deriveAfty(ficha("player", 0))), 3);
t("sem Surto de Ação o teto é 1", estado.max(deriveAfty(ficha("player", 0, { surto: false }))), 1);
t("o custo segue a sequência do turno", [0, 1, 2, 3].map(estado.custoPE), [0, 1, 3, 4]);
t("o resolveCombate apara no mesmo teto, com Surto", deriveAfty(ficha("player", 9)).combate.ataqueConcentrado, 3);
t("e sem Surto", deriveAfty(ficha("player", 3, { surto: false })).combate.ataqueConcentrado, 1);

/* ============================================================ */
/* 2. A METADE É DA LINHA                                        */
/* ============================================================ */
for (const s of ["player", "afty"]) {
  const base = (arma) => dadosDe(ficha(s, 0, { arma }), arma);
  const com = (arma, vezes) => dadosDe(ficha(s, vezes, { arma }), arma);
  for (const arma of ["arm_espada_grande", "arm_espada_colossal", "arm_bazuca"]) {
    const n = base(arma);
    t(`${s}, ${arma} (${n} dados): as concentrações arredondam no final`,
      [1, 2, 3].map((v) => com(arma, v) - n), [1, 2, 3].map((v) => Math.floor(v * Math.max(1, n / 2))));
  }
}
/* A Bazuca no Combatente 20 ganha +1 dado do Autossuficiente e rola 4.
   Três concentrações somam 6, sem aumentar a base entre concentrações. */
{
  const quatro = (vezes) => dadosDe(ficha("player", vezes, { arma: "arm_bazuca", nivel: 20 }), "arm_bazuca");
  t("jogador, Bazuca no nível 20: a linha rola 4 dados", quatro(0), 4);
  t("jogador, Bazuca no nível 20: cada concentração soma 2, sem crescer",
    [1, 2, 3].map((v) => quatro(v) - quatro(0)), [2, 4, 6]);
}
/* A linha nomeia a fonte no hover. */
t("a parcela aparece com o nome da habilidade",
  linha(ficha("player", 2), "arm_espada_grande").partes.filter((p) => p.label === "Ataque Concentrado").map((p) => p.texto),
  ["+2d12"]);

/* ============================================================ */
/* 3. ONDE VALE, E ONDE NÃO VALE                                 */
/* ============================================================ */
for (const s of ["player", "afty"]) {
  t(`${s}: o Ataque Básico também recebe`,
    dadosDe(ficha(s, 1), "basico") - dadosDe(ficha(s, 0), "basico"), 1);
  t(`${s}: sem a habilidade, a faixa não soma`,
    dadosDe(ficha(s, 3, { habs: ["cmb_ataque_extra"] }), "arm_espada_grande")
      - dadosDe(ficha(s, 0, { habs: ["cmb_ataque_extra"] }), "arm_espada_grande"), 0);
  t(`${s}: fora de combate, nada`,
    dadosDe(ficha(s, 3, { ativo: false }), "arm_espada_grande") - dadosDe(ficha(s, 0), "arm_espada_grande"), 0);
}

/* ============================================================ */

/* Decisão de 2026-10-05: soma das metades com piso no final e seleção por fonte.
   O exemplo do autor, os tamanhos diferentes e os críticos são medidos nas
   fórmulas e nas rolagens, não só no contador de dados da linha. */
const { aplicarAtaqueConcentradoNoDano } = await import(R + "afty-ataque-concentrado.js");
const { HABILIDADE_EFEITOS } = await import(R + "afty-efeitos-conteudo.js");
const { formulaModoDano } = await import(R + "afty-dano.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { estadoLigadoDoFeitico } = await import(R + "afty-combate-conjurador.js");
const efeitosConcentrados = HABILIDADE_EFEITOS.cmb_ataque_concentrado;
const grupoTeste = (dados, faces, extra = {}) => ({
  nome: "Ataque", dados, faces, fixo: 0, momento: "durante", multiplica: true, ...extra,
});
const concentraGrupos = (grupos, vezes = 3) => aplicarAtaqueConcentradoNoDano({
  entradas: [{ id: "teste", fonte: "arma", dados: 7, dado: "d12", dadosExtras: 0,
    fixo: 5, total: 50, gruposDano: grupos, partes: [] }],
}, { efeitos: efeitosConcentrados, contexto: { ataque_concentrado: vezes }, vezes }).entradas[0];
const formulaDoConcentrado = (l, modo = "normal") =>
  formulaModoDano(l.gruposDano.filter((g) => g.nome === "Ataque Concentrado"), modo);

const exemplo = concentraGrupos([grupoTeste(7, 12, { fixo: 5 })]);
t("7d12 por três concentrações acrescenta 10d12", formulaDoConcentrado(exemplo), "10d12");
t("7d12 termina em 17d12, com o fixo uma vez", exemplo.formulaNormal, "17d12 + 5");
t("as três metades são do ataque original, sem recursão",
  [1, 2, 3].map((n) => formulaDoConcentrado(concentraGrupos([grupoTeste(7, 12)], n))),
  ["3d12", "7d12", "10d12"]);
t("fontes do mesmo tamanho somam antes do piso",
  formulaDoConcentrado(concentraGrupos([grupoTeste(7, 12), grupoTeste(3, 12)])), "15d12");
t("cada tamanho conserva suas faces, com piso só após as três metades",
  formulaDoConcentrado(concentraGrupos([grupoTeste(7, 12), grupoTeste(3, 8)])), "10d12 + 4d8");
t("dado de golpe único, dano após ataque e fixo não entram na metade",
  formulaDoConcentrado(concentraGrupos([
    grupoTeste(7, 12, { fixo: 123 }), grupoTeste(9, 10, { concentra: false }),
    grupoTeste(9, 8, { momento: "apos", multiplica: false }),
  ])), "10d12");
t("mínimo de um dado por concentração, sem conceder um mínimo por fonte",
  formulaDoConcentrado(concentraGrupos([grupoTeste(1, 12), grupoTeste(1, 8)])), "2d12 + 1d8");

const soCritico = concentraGrupos([grupoTeste(7, 12, { fixo: 5 }), grupoTeste(1, 12, { apenasCritico: true })]);
t("o dado exclusivo do crítico não cresce no dano normal", soCritico.formulaNormal, "17d12 + 5");
t("no crítico a metade de oito dados acrescenta doze antes da dobra", soCritico.formulaCritico, "40d12 + 5");
t("Raio Negro usa a mesma seleção do crítico", soCritico.formulaRaioNegro, "(40d12)/2*3 + 5");
for (const [modo, qtd, total] of [["normal", 17, 22], ["critico", 40, 45], ["raio_negro", 40, 65]]) {
  const rolada = rolarDano({ rotulo: "Concentrado", grupos: soCritico.gruposDano, modoDano: modo }, () => 0);
  t(`rolagem ${modo}: dados e total correspondem à fórmula`, [rolada.dados.length, rolada.total], [qtd, total]);
}
const blocos = rolarDano({ rotulo: "Concentrado", grupos: soCritico.gruposDano, modoDano: "critico", blocos: 2 }, () => 0);
t("quantidade própria do crítico também respeita blocos", [blocos.formula, blocos.dados.length], ["80d12 + 5", 80]);

const fatal = concentraGrupos([grupoTeste(2, 8, { facesCritico: 12 }), grupoTeste(1, 6)]);
t("Fatal mantém o tamanho normal e o adicional de outro tamanho", fatal.formulaNormal, "5d8 + 2d6");
t("Fatal muda também as metades da arma somente no crítico", fatal.formulaCritico, "10d12 + 4d6");
t("rolagem da Fatal usa a mesma mudança de tamanho",
  rolarDano({ rotulo: "Fatal", grupos: fatal.gruposDano, modoDano: "critico" }, () => 0).formula, fatal.formulaCritico);

const sete = (sistema, vezes = 3) => {
  const f = ficha(sistema, vezes);
  // Espada Grande no jogador: 1d12 mais seis dados permanentes de técnica.
  f.core.tecnicaEfeitos = [{ canal: "dadosDano", expr: "6" }];
  return f;
};
const semConcentrar = (f) => ({ ...f, combate: { ...f.combate, ataqueConcentrado: 0 } });
for (const sistema of ["player", "afty"]) {
  const f = sete(sistema);
  const l = linha(f, "arm_espada_grande");
  const base = linha(semConcentrar(f), "arm_espada_grande");
  t(`${sistema}: o motor real soma as três metades dos sete dados`, [base.dados, l.dados], [7, 17]);
  t(`${sistema}: a fonte aparece no hover`, l.hoverDano.partes.some((p) => p.label === "Ataque Concentrado"), true);
  t(`${sistema}: conserva o contador de dados próprios da arma`, l.dadosPropriosArma, 17);
  if (sistema === "afty") t("criatura: parcelas de Dano Total fecham com o total",
    l.partes.filter((p) => p.categoria === "total").reduce((s, p) => s + (p.valor ?? 0), 0), l.total);

  // Fontes marcadas pelo autor que antes já estavam no agregado da linha.
  for (const [nome, habs, combate, arma] of [
    ["Atroz", ["cmb_golpe_especial"], { golpeAtroz: true }, "arm_espada_grande"],
    ["Pistoleiro", ["cmb_pistoleiro_iniciado", "cmb_pistoleiro_avancado"], { pistoleiroEmperrar: 6 }, "arm_bazuca"],
    ["Execução Silenciosa", ["cmb_artes_do_combate"], { arteExecucaoSilenciosa: true }, "arm_espada_grande"],
    ["Caçador de Feiticeiros", ["res_cacador_de_feiticeiros"], { cacadorFeiticeiros: 1 }, "arm_espada_grande"],
    ["Foco no Inimigo", ["res_foco_no_inimigo"], { focoInimigo: true }, "arm_espada_grande"],
  ]) {
    const c = sete(sistema);
    c.habilidades.push(...habs);
    c.combate = { ...c.combate, ...combate };
    c.equipamentos.itens[0].refId = arma;
    const b = linha(semConcentrar(c), arma);
    const result = linha(c, arma);
    const esperado = b.gruposDano.filter((g) => !g.apenasCritico)
      .reduce((m, g) => m.set(g.faces, (m.get(g.faces) ?? 0) + g.dados), new Map());
    const esperadoTexto = [...esperado].sort(([a], [b2]) => b2 - a)
      .map(([faces, qtd]) => `${Math.floor(qtd * 3 / 2)}d${faces}`).join(" + ");
    t(`${sistema}: ${nome} está ativo no ataque`, b.gruposDano.reduce((n, g) => n + g.dados, 0) > base.dados, true);
    t(`${sistema}: ${nome} participa das metades`, formulaDoConcentrado(result), esperadoTexto);
  }

  // As fontes não selecionadas não podem aumentar a base das metades.
  for (const [nome, hab, combate] of [
    ["Ataque Furtivo", "res_ataque_furtivo", { ataqueFurtivo: true }],
    ["Arremetida Encoberta", "res_arremetida_encoberta", { ataqueFurtivo: true, furtivoGarantido: true }],
    ["Golpe Impactante", "res_golpe_impactante", { golpeImpactante: true }],
    ["Quebra Crânio", "lut_manobras_finalizadoras", { manobraFinalizadora: "cranio", empolgacao: 5 }],
  ]) {
    const c = sete(sistema);
    c.habilidades.push(hab);
    if (nome === "Quebra Crânio") c.especializacoes.push({ id: "lutador", nivel: 12 });
    if (nome === "Golpe Impactante") {
      c.attrMethod = "fixos";
      c.attributes = { forca: 18, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
    }
    c.combate = { ...c.combate, ...combate };
    const b = linha(semConcentrar(c), "arm_espada_grande");
    const result = linha(c, "arm_espada_grande");
    const comFonte = b.gruposDano.reduce((n, g) => n + g.dados, 0);
    const limpa = structuredClone(c);
    limpa.habilidades = limpa.habilidades.filter((id) => id !== hab);
    const esperado = linha(limpa, "arm_espada_grande");
    t(`${sistema}: ${nome} acrescenta dados antes de concentrar`,
      comFonte > linha(semConcentrar(limpa), "arm_espada_grande").gruposDano.reduce((n, g) => n + g.dados, 0), true);
    t(`${sistema}: ${nome} soma uma vez, fora das metades`,
      formulaDoConcentrado(result), formulaDoConcentrado(esperado));
  }

  for (const [nome, combate, aptidoes] of [
    ["Canalização Máxima", { canalizarEmGolpe: true, canalizacaoMaxima: true }, ["canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima"]],
    ["Canalizar Energia Reversa", { canalizarEnergiaReversa: true }, ["energia_reversa", "liberacao_de_energia_reversa", "canalizar_energia_reversa"]],
    ["Concentrar Aura", { concentrarAura: ["aura_elemental"] }, ["aura_elemental", "concentrar_aura"]],
  ]) {
    const c = sete(sistema);
    c.aptidoes = { au: 3, cl: 3, bar: 0, dom: 0, er: 3 };
    c.aptidoesAmaldicoadas = aptidoes;
    c.combate = { ...c.combate, ...combate };
    const result = linha(c, "arm_espada_grande");
    t(`${sistema}: ${nome} está nos grupos do ataque`, result.gruposDano.some((g) => g.nome === nome), true);
    t(`${sistema}: ${nome} fica fora das metades`, formulaDoConcentrado(result), formulaDoConcentrado(l));
  }

  for (const [nome, feitico, ativacao, entra] of [
    ["Auxiliar de uma rodada", { tipo: "auxiliar", nivel: 3, efeitoAux: "danoDurante", duracaoAux: "imediata" }, "ligado", true],
    ["Auxiliar de um único ataque", { tipo: "auxiliar", nivel: 3, efeitoAux: "danoDurante", duracaoAux: "imediata", umGolpe: true }, "ligado", false],
    ["Auxiliar Sustentado", { tipo: "auxiliar", nivel: 3, efeitoAux: "danoDurante", duracaoAux: "sustentada" }, "sustentacao", true],
    ["Auxiliar Após Ataque", { tipo: "auxiliar", nivel: 3, efeitoAux: "danoApos", duracaoAux: "sustentada" }, "sustentacao", false],
    ["Transformação", { tipo: "especial", especialSubtipo: "transformacao", nivel: 3, transfDuracao: "sustentada", transfEfeitos: ["danoDurante"] }, "sustentacao", true],
  ]) {
    const c = sete(sistema);
    c.feiticos = [{ ...feitico, id: "extra", nome }];
    c.combate[ativacao === "sustentacao" ? "sustentacaoFeitico1" : estadoLigadoDoFeitico("extra")] = ativacao === "sustentacao" ? "extra" : true;
    const b = linha(semConcentrar(c), "arm_espada_grande");
    const result = linha(c, "arm_espada_grande");
    const extra = b.gruposDano.find((g) => g.nome === nome);
    t(`${sistema}: ${nome} entrega dados na ficha`, !!extra && extra.dados > 0, true);
    const esperado = entra && extra
      ? [[Number(base.dado.slice(1)), 10], [extra.faces, Math.floor(extra.dados * 3 / 2)]]
        .sort(([a], [b2]) => b2 - a).map(([faces, qtd]) => `${qtd}d${faces}`).join(" + ")
      : `10${base.dado}`;
    // As faces da criatura podem coincidir com as do Auxiliar: o teste mede a
    // soma das fontes pelo mesmo tamanho antes de arredondar.
    const correto = entra && extra && extra.faces === Number(base.dado.slice(1))
      ? `${Math.floor((7 + extra.dados) * 3 / 2)}${base.dado}` : esperado;
    t(`${sistema}: ${nome} ${entra ? "entra" : "não entra"} nas metades`, formulaDoConcentrado(result), correto);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
