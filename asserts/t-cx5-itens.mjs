/**
 * CX5: USO DOS ITENS ESPECIAIS NA MESA (Livro p.144 a 149), nos DOIS sistemas.
 *
 * O que este arquivo prende:
 *   - a unidade sai UMA vez, sob um `opId`, e voltar a enviar o id não gasta nem aplica de novo;
 *   - a recusa devolve a MESMA sessão (nada é gasto pela metade) e deixa a unidade no inventário;
 *   - o efeito é delegado: PE, cura, Dados de Vida, Buff de Mesa, paredes, óleo e veneno;
 *   - duas cópias do mesmo item não somam (p.365);
 *   - o consumido NÃO volta no descanso, e o que era da cena cai nela;
 *   - ficha e sessão antigas, sem o campo novo, continuam lendo como antes.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");
const USO = await import(R + "afty-itens-uso.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const US = await import(R + "ficha/ficha-uso-estado.js");
const IT = await import(R + "ficha/ficha-itens.js");
const CE = await import(R + "ficha/ficha-combate-eventos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const op = () => `cx5-it-${++contador}`;

const entrada = (uid, refId, extra = {}) => ({ uid, tipo: extra.tipo ?? "item", refId, qtd: 1, equipado: false, ...extra });
const fichaCom = (sistema, itens, { nd = 10 } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "combatente", nivel: nd }];
  f.equipamentos = { itens };
  return f;
};
const mesa = (ficha, ajuste = {}) => {
  const d = deriveAfty(ficha);
  return { d, s: { ...SE.sessaoEmBranco(d), ...ajuste } };
};
const meio = () => 0.5;
const comTeste = (s) => ({ ...s, uso: { ...US.usoDe(s), teste: { cd: 14, causa: "dano", desde: 0 } } });

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;

  /* ------------------------------------------------------------ A. Pérolas e Mixes: PE e Estamina */
  {
    const f = fichaCom(sistema, [entrada("p1", "it_perola_carregada", { qtd: 2 }), entrada("m1", "it_mix_energetico_medio")]);
    const { d, s } = mesa(f);
    const peMax = d.pe;
    const baixo = { ...s, peAtual: peMax - 2 };
    const o1 = op();
    const r1 = IT.usaItem(f, baixo, d, { uid: "p1", opId: o1 });
    t(tag("Pérola aplica"), r1.aplicado, true);
    t(tag("sobe o PE só até o máximo"), [r1.sessao.peAtual, r1.resultado.pe.pedido, r1.resultado.pe.ganho], [peMax, 3, 2]);
    t(tag("e a unidade sai: 2 viram 1"), [r1.restantes, IT.unidadesRestantes(f, r1.sessao, "p1")], [1, 1]);
    const rep = IT.usaItem(f, r1.sessao, d, { uid: "p1", opId: o1 });
    t(tag("o mesmo id não gasta de novo"), [rep.aplicado, rep.repetida, rep.sessao === r1.sessao], [false, true, true]);
    const r2 = IT.usaItem(f, r1.sessao, d, { uid: "p1", opId: op() });
    t(tag("a segunda unidade sai"), [r2.aplicado, r2.restantes], [true, 0]);
    const r3 = IT.usaItem(f, r2.sessao, d, { uid: "p1", opId: op() });
    t(tag("sem unidade recusa e devolve a mesma sessão"), [r3.aplicado, r3.erro, r3.sessao === r2.sessao], [false, "Sem Unidades", true]);
    const mix = IT.usaItem(f, { ...s, peAtual: 0 }, d, { uid: "m1", opId: op() });
    t(tag("Mix Médio recupera 6 de Estamina, que é o PE"), [mix.sessao.peAtual, mix.resultado.pe.recurso], [6, "Estamina"]);
  }

  /* ------------------------------------------------------------ B. Símbolos: cura e PV temporário */
  {
    const f = fichaCom(sistema, [
      entrada("s1", "it_simbolo_da_vida"), entrada("s2", "it_simbolo_de_vida_florescente"), entrada("s3", "it_simbolo_de_vida_absoluta"),
    ], { nd: 12 });
    const { d, s } = mesa(f);
    const ferido = { ...s, hpAtual: 5 };
    const a = IT.usaItem(f, ferido, d, { uid: "s1", opId: op() });
    t(tag("Símbolo da Vida cura 10"), [a.sessao.hpAtual, a.resultado.cura.pedido], [15, 10]);
    const b = IT.usaItem(f, ferido, d, { uid: "s2", opId: op() });
    t(tag("Florescente cura 25"), b.sessao.hpAtual, 30);
    const c = IT.usaItem(f, ferido, d, { uid: "s3", opId: op() });
    t(tag("Absoluta cura tudo"), c.sessao.hpAtual, d.hp);
    t(tag("e dá PV temporário igual ao triplo do nível"), [c.resultado.pvTemporario.valor, c.sessao.pvTempFontes["item:it_simbolo_de_vida_absoluta"]], [36, 36]);
    t(tag("a cura que enche o PV não poupa a unidade"), IT.unidadesRestantes(f, c.sessao, "s3"), 0);
    const cheia = IT.usaItem(f, c.sessao, d, { uid: "s3", opId: op() });
    t(tag("a unidade acabou e recusa"), cheia.erro, "Sem Unidades");
    const sobre = IT.usaItem(f, { ...s, hpAtual: d.hp }, d, { uid: "s1", opId: op() });
    t(tag("cura em quem está cheio gasta a unidade e não passa do máximo"), [sobre.sessao.hpAtual, IT.unidadesRestantes(f, sobre.sessao, "s1")], [d.hp, 0]);
  }

  /* ------------------------------------------------------------ C. Remédios e Elixir: Dados de Vida */
  {
    const f = fichaCom(sistema, [entrada("r1", "it_remedio_simples"), entrada("r2", "it_remedio_intermediario"), entrada("e1", "it_elixir_da_vida")], { nd: 10 });
    const { d, s } = mesa(f);
    const ferido = { ...s, hpAtual: 1 };
    const recusado = IT.usaItem(f, ferido, d, { uid: "r1", opId: op(), rng: meio, parametros: { classeId: "combatente", quantidade: 5 } });
    t(tag("Remédio Simples recusa mais de 4 dados"), [recusado.aplicado, recusado.erro, recusado.sessao === ferido], [false, "Passa do Limite de 4 Dados", true]);
    t(tag("e a unidade continua no inventário"), IT.unidadesRestantes(f, recusado.sessao, "r1"), 1);
    const bom = IT.usaItem(f, ferido, d, { uid: "r1", opId: op(), rng: meio, parametros: { classeId: "combatente", quantidade: 3 } });
    t(tag("Remédio gasta 3 Dados de Vida e cura"), [bom.aplicado, bom.resultado.dadosDeVida.dados[0].quantidade, bom.sessao.hpAtual > 1], [true, 3, true]);
    t(tag("os dados gastos ficam na sessão"), bom.sessao.dadosVida.gastos.combatente, 3);
    t(tag("e a unidade sai"), IT.unidadesRestantes(f, bom.sessao, "r1"), 0);
    const elixir = IT.usaItem(f, ferido, d, { uid: "e1", opId: op(), rng: meio });
    t(tag("Elixir usa todos os dados com o dobro do modificador"), [elixir.aplicado, elixir.resultado.dadosDeVida.restantes], [true, 0]);
    t(tag("e liga Fortitude e Integridade +5 na cena"),
      elixir.sessao.buffs.map((b) => [b.canal, b.alvo, b.expr]).sort(),
      [["bonusTR", "fortitude", "5"], ["bonusTR", "integridade", "5"]]);
    t(tag("com a vantagem lembrada, porque a ficha não a rola sozinha"), elixir.resultado.lembretes, ["Vantagem em Fortitude e Integridade pelo resto da cena"]);
    t(tag("o uso ativo dura a cena"), US.usoDe(elixir.sessao).ativos["item:it_elixir_da_vida"].duracao, { tipo: "cena" });
    const fimDaCena = US.fechaCombateNoUso(elixir.sessao);
    t(tag("e cai no fim da cena, junto dos buffs"), [Object.keys(US.usoDe(fimDaCena).ativos), fimDaCena.buffs.length], [[], 0]);
    const semDados = IT.usaItem(f, elixir.sessao, d, { uid: "r2", opId: op(), rng: meio, parametros: { classeId: "combatente", quantidade: 1 } });
    t(tag("sem dados restantes o Remédio recusa e não gasta a unidade"), [semDados.aplicado, IT.unidadesRestantes(f, semDados.sessao, "r2")], [false, 1]);
  }

  /* ------------------------------------------------------------ D. Injeções */
  {
    const f = fichaCom(sistema, [entrada("i1", "it_injecao_estimulante", { qtd: 2 }), entrada("a1", "it_injecao_de_adrenalina")]);
    const { d, s } = mesa(f);
    const sem = IT.usaItem(f, s, d, { uid: "i1", opId: op() });
    t(tag("Estimulante sem atributo recusa"), [sem.aplicado, sem.erro], [false, "Falta Atributo"]);
    const com = IT.usaItem(f, s, d, { uid: "i1", opId: op(), parametros: { atributo: "forca" } });
    t(tag("Estimulante liga +2 nas perícias do atributo"), com.sessao.buffs.map((b) => [b.canal, b.alvo, b.expr]), [["bonusPericia", "atr:forca", "2"]]);
    const antes = deriveAfty({ ...f, buffsSessao: [] }).testes.pericias.find((p) => p.id === "atletismo").bonus;
    const depois = deriveAfty({ ...f, buffsSessao: com.sessao.buffs }).testes.pericias.find((p) => p.id === "atletismo").bonus;
    t(tag("e o derive soma +2 em Atletismo (Força)"), depois - antes, 2);
    const outra = IT.usaItem(f, com.sessao, d, { uid: "i1", opId: op(), parametros: { atributo: "destreza" } });
    t(tag("duas Injeções Estimulantes não somam (p.365)"), [outra.aplicado, outra.erro, IT.unidadesRestantes(f, outra.sessao, "i1")], [false, "Já Ativo", 1]);

    // Prazo MANUAL (decisão do autor, 2026-11-06): o buff fica até a mesa tirá-lo pela aba Buffs.
    t(tag("Injeção Estimulante não cria uso ativo com prazo"), Object.keys(US.usoDe(com.sessao).ativos), []);
    const depoisDoCombate = US.fechaCombateNoUso(com.sessao);
    t(tag("o fim do combate NÃO derruba o buff da Injeção"), depoisDoCombate.buffs.map((b) => b.canal), ["bonusPericia"]);
    t(tag("nem o descanso derruba o buff manual"), SE.descansar(com.sessao, d).buffs.map((b) => b.canal), ["bonusPericia"]);
    t(tag("o buff leva o id do item, que é o que a guarda de duas cópias procura"), com.sessao.buffs.map((b) => b.id), ["item:it_injecao_estimulante:1"]);
    const semBuff = US.semBuff(com.sessao, "item:it_injecao_estimulante:1");
    const depoisDeTirar = IT.usaItem(f, semBuff, d, { uid: "i1", opId: op(), parametros: { atributo: "destreza" } });
    t(tag("tirado o buff pela mesa, a Injeção pode ser usada de novo"), [depoisDeTirar.aplicado, IT.unidadesRestantes(f, depoisDeTirar.sessao, "i1")], [true, 0]);

    const cansado = IT.usaItem(f, { ...s, exaustao: 2 }, d, { uid: "a1", opId: op() });
    t(tag("Adrenalina reduz a Exaustão em 1 até o fim da cena"), [cansado.sessao.exaustao, cansado.resultado.exaustao.reduzida], [1, 1]);
    t(tag("e ela volta ao fim da cena"), US.fechaCombateNoUso(cansado.sessao).exaustao, 2);
    const folgado = IT.usaItem(f, { ...s, exaustao: 0 }, d, { uid: "a1", opId: op() });
    t(tag("sem Exaustão não há o que devolver depois"), [folgado.sessao.exaustao, US.fechaCombateNoUso(folgado.sessao).exaustao], [0, 0]);
  }

  /* ------------------------------------------------------------ E. Mistura Profana */
  {
    const f = fichaCom(sistema, [entrada("x1", "it_mistura_profana", { qtd: 2 })]);
    const { d, s } = mesa(f);
    const a = IT.usaItem(f, s, d, { uid: "x1", opId: op() });
    t(tag("Mistura Profana reduz 1 PE em todo gasto da cena"), a.sessao.buffs.map((b) => [b.canal, b.expr]), [["custoPE", "1"]]);
    const b = IT.usaItem(f, a.sessao, d, { uid: "x1", opId: op() });
    t(tag("a segunda não soma enquanto a primeira vale"), [b.aplicado, b.erro, IT.unidadesRestantes(f, b.sessao, "x1")], [false, "Já Ativo", 1]);
    const fim = US.fechaCombateNoUso(a.sessao);
    t(tag("no fim da cena cobra 1 nível de Exaustão, uma vez"), [fim.exaustao, fim.buffs.length], [1, 0]);
    t(tag("e não cobra de novo no segundo fechamento"), US.fechaCombateNoUso(fim).exaustao, 1);
  }

  /* ------------------------------------------------------------ F. Antídotos */
  {
    const f = fichaCom(sistema, [entrada("t1", "it_antidoto_simples", { qtd: 3 })]);
    const { d, s } = mesa(f);
    const envenenado = { ...s, condicoes: [{ nome: "Envenenado", rodadas: 3 }, { nome: "Abalado", rodadas: 1 }] };
    const ok1 = IT.usaItem(f, envenenado, d, { uid: "t1", opId: op() });
    t(tag("Antídoto cura a condição Envenenado e deixa as outras"), ok1.sessao.condicoes.map((c) => c.nome), ["Abalado"]);
    const forte = IT.usaItem(f, envenenado, d, { uid: "t1", opId: op(), parametros: { custoDoVeneno: 2 } });
    t(tag("veneno de custo 2 passa do Antídoto Simples"), [forte.aplicado, forte.erro, forte.sessao === envenenado], [false, "Veneno Acima do Antídoto", true]);
    const nada = IT.usaItem(f, s, d, { uid: "t1", opId: op() });
    t(tag("sem veneno não gasta a unidade à toa"), [nada.aplicado, nada.erro], [false, "Nada a Curar"]);
  }

  /* ------------------------------------------------------------ G. Talismã de Barreira */
  {
    const f = fichaCom(sistema, [entrada("b1", "it_talisma_de_barreira"), entrada("b2", "it_talisma_de_barreira_superior")]);
    const { d, s } = mesa(f);
    const a = IT.usaItem(f, s, d, { uid: "b1", opId: op() });
    t(tag("Talismã de Barreira ergue 4 paredes de 15 PV"), [a.sessao.barreiras.paredes.length, a.sessao.barreiras.paredes[0].pv, a.sessao.barreiras.paredes[0].rd], [4, 15, 0]);
    const b = IT.usaItem(f, a.sessao, d, { uid: "b2", opId: op(), acao: "reacao" });
    t(tag("o Superior aceita reação e ergue paredes de 25 PV"), [b.aplicado, b.sessao.barreiras.paredes.length, b.sessao.barreiras.paredes.at(-1).pv], [true, 8, 25]);
    t(tag("os ids das paredes nascem do opId (sem colisão)"), new Set(b.sessao.barreiras.paredes.map((p) => p.id)).size, 8);
    const descanso = SE.descansar(b.sessao, d);
    t(tag("o descanso desmancha as paredes e o consumido NÃO volta"), [descanso.barreiras.paredes.length, IT.unidadesRestantes(f, descanso, "b1")], [0, 0]);
  }

  /* ------------------------------------------------------------ H. Óleos e Venenos */
  {
    const f = fichaCom(sistema, [
      entrada("w1", "arm_espada_longa", { tipo: "arma", equipado: true }), entrada("w2", "arm_adaga", { tipo: "arma" }), entrada("w3", "arm_katana", { tipo: "arma" }),
      entrada("o1", "it_oleo_amolador"), entrada("v1", "it_veneno_maldito"), entrada("v2", "it_lagrima_de_shinigami"),
    ]);
    const { d, s } = mesa(f);
    const semArma = IT.usaItem(f, s, d, { uid: "o1", opId: op() });
    t(tag("Óleo sem arma escolhida recusa"), [semArma.aplicado, semArma.erro], [false, "Escolha a Arma"]);
    const tres = IT.usaItem(f, s, d, { uid: "o1", opId: op(), parametros: { armas: ["w1", "w2", "w3"] } });
    t(tag("Óleo cobre no máximo duas armas"), [tres.aplicado, tres.erro], [false, "No Máximo 2 Armas"]);
    const fantasma = IT.usaItem(f, s, d, { uid: "o1", opId: op(), parametros: { armas: ["w1", "zzz"] } });
    t(tag("e só armas do inventário"), fantasma.erro, "Arma Não Encontrada");
    const oleo = IT.usaItem(f, s, d, { uid: "o1", opId: op(), parametros: { armas: ["w1", "w2"] } });
    t(tag("Óleo Amolador dá o traço às duas armas"), IT.tracosTemporariosDasArmas(oleo.sessao), { w1: ["Mortal d6"], w2: ["Mortal d6"] });
    const dormiu = SE.descansar(oleo.sessao, d);
    t(tag("o óleo dura até o descanso e então sai"), [Object.keys(US.usoDe(dormiu).ativos), IT.tracosTemporariosDasArmas(dormiu)], [[], {}]);

    const ven = IT.usaItem(f, s, d, { uid: "v1", opId: op(), parametros: { armas: ["w1"] } });
    t(tag("Veneno Maldito: custo 3, CD 35"), [ven.resultado.veneno.custo, ven.resultado.veneno.cd], [3, 35]);
    t(tag("o que está entre parênteses vale mesmo se o alvo passar"), ven.resultado.veneno.mesmoSePassar, { condicoes: ["Envenenado"], rodadas: 3 });
    t(tag("o veneno fica armado para o ataque com ESSA arma"), US.usoDe(ven.sessao).pendencias.map((p) => [p.id, p.consome, p.elegivel.qualquer]), [["veneno:it_veneno_maldito", "acerto", ["arma:w1"]]]);
    const errou = CE.registraAtaqueRealizado(ven.sessao, d, { acertou: false, categorias: ["arma", "arma:w1"] }, { opId: op() });
    t(tag("errar o golpe NÃO gasta o veneno da arma"), US.usoDe(errou.sessao).pendencias.length, 1);
    const outraArma = CE.registraAtaqueRealizado(ven.sessao, d, { acertou: true, categorias: ["arma", "arma:w2"] }, { opId: op() });
    t(tag("acertar com OUTRA arma também não"), US.usoDe(outraArma.sessao).pendencias.length, 1);
    const acertou = CE.registraAtaqueRealizado(ven.sessao, d, { acertou: true, categorias: ["arma", "arma:w1"] }, { opId: op() });
    t(tag("acertar com a arma envenenada consome o veneno e encerra o uso"), [US.usoDe(acertou.sessao).pendencias.length, Object.keys(US.usoDe(acertou.sessao).ativos)], [0, []]);
    t(tag("o veneno acaba no fim do combate se ninguém acertou"), Object.keys(US.usoDe(US.fechaCombateNoUso(ven.sessao)).ativos), []);
    t(tag("a CD da Lágrima de Shinigami é 45"), USO.cdDoVeneno(4), 45);
    t(tag("o Dardo soma +2 na CD (p.137)"), USO.cdDoVeneno(1, { dardo: true }), 17);
  }

  /* ------------------------------------------------------------ I. Faixa de Foco e Amuleto: uso diário, sem gastar o item */
  {
    const f = fichaCom(sistema, [entrada("ff", "it_faixa_de_foco", { equipado: true }), entrada("fg", "it_faixa_de_foco"), entrada("am", "it_amuleto_do_vislumbre", { equipado: true })]);
    const { d, s } = mesa(f);
    const sem = IT.usaItem(f, s, d, { uid: "ff", opId: op() });
    t(tag("Faixa de Foco sem teste pendente recusa"), [sem.aplicado, sem.erro], [false, "Sem Teste Pendente"]);
    const guardada = IT.usaItem(f, comTeste(s), d, { uid: "fg", opId: op() });
    t(tag("Faixa guardada não vale"), guardada.erro, "Item Guardado");
    const usou = IT.usaItem(f, comTeste(s), d, { uid: "ff", opId: op() });
    t(tag("Faixa de Foco dispensa o teste e o item NÃO é gasto"), [usou.aplicado, US.usoDe(usou.sessao).teste, usou.restantes, IT.unidadesRestantes(f, usou.sessao, "ff")], [true, null, null, 1]);
    const dois = IT.usaItem(f, comTeste(usou.sessao), d, { uid: "ff", opId: op() });
    t(tag("uma vez por dia"), [dois.aplicado, dois.erro], [false, "Sem Usos Restantes"]);
    const descansou = SE.descansar(comTeste(usou.sessao), d);
    t(tag("o descanso devolve o uso diário"), IT.bloqueioDeItem(f, descansou, d, { uid: "ff" }), null);
    const vis = IT.usaItem(f, s, d, { uid: "am", opId: op() });
    t(tag("Amuleto do Vislumbre dura 10 rodadas (1 minuto)"), [vis.aplicado, US.usoDe(vis.sessao).ativos["item:it_amuleto_do_vislumbre"].duracao], [true, { tipo: "rodadas", restantes: 10 }]);
  }

  /* ------------------------------------------------------------ J. O adaptador ficha + sessão */
  {
    const f = fichaCom(sistema, [entrada("p1", "it_perola_carregada", { qtd: 2 }), entrada("g1", "it_bracelete_do_vigor", { equipado: true })]);
    const { d, s } = mesa(f);
    t(tag("sem nada gasto o adaptador devolve a PRÓPRIA ficha"), IT.fichaComItensDaSessao(f, s) === f, true);
    const um = IT.usaItem(f, s, d, { uid: "p1", opId: op() });
    const f1 = IT.fichaComItensDaSessao(f, um.sessao);
    t(tag("abate a unidade consumida"), f1.equipamentos.itens.find((e) => e.uid === "p1").qtd, 1);
    t(tag("sem mexer na ficha original"), f.equipamentos.itens.find((e) => e.uid === "p1").qtd, 2);
    const dois = IT.usaItem(f, um.sessao, d, { uid: "p1", opId: op() });
    const f2 = IT.fichaComItensDaSessao(f, dois.sessao);
    t(tag("zerada, a entrada sai da ficha que a mesa enxerga"), f2.equipamentos.itens.map((e) => e.uid), ["g1"]);
    const carga = (x) => deriveAfty(x).carga.espacosUsados;
    t(tag("a Carga cai com cada Pérola gasta (meio espaço), pelo resolveEquipamentos de sempre"), [carga(f) - carga(f1), carga(f1) - carga(f2)], [0.5, 0.5]);
    t(tag("o bônus do acessório equipado segue valendo"), deriveAfty(f2).hp, deriveAfty(f).hp);
  }

  /* ------------------------------------------------------------ K. Persistência e compatibilidade */
  {
    const f = fichaCom(sistema, [entrada("p1", "it_perola_carregada", { qtd: 3 })]);
    const { d, s } = mesa(f);
    const um = IT.usaItem(f, s, d, { uid: "p1", opId: "persiste" });
    const volta = SE.normalizaSessao(JSON.parse(JSON.stringify(um.sessao)), d);
    t(tag("o consumido sobrevive ao ida e volta em JSON"), IT.unidadesRestantes(f, volta, "p1"), 2);
    t(tag("e a identidade da operação também"), IT.usaItem(f, volta, d, { uid: "p1", opId: "persiste" }).repetida, true);
    const antiga = { ...um.sessao, uso: { ...US.usoDe(um.sessao) } };
    delete antiga.uso.itens;
    t(tag("sessão gravada antes do campo lê zero consumido"), IT.unidadesRestantes(f, SE.normalizaSessao(antiga, d), "p1"), 3);
    const lixo = SE.normalizaSessao({ ...um.sessao, uso: { ...US.usoDe(um.sessao), itens: { consumidos: { p1: "x", "": 4, q: -3 }, cargas: 7, criados: [null, { uid: 3 }] } } }, d);
    t(tag("lixo no campo vira o padrão e não derruba"), US.usoDe(lixo).itens, US.itensEmBranco());
    const descanso = SE.descansar(um.sessao, d);
    t(tag("o descanso não devolve o que foi consumido"), IT.unidadesRestantes(f, descanso, "p1"), 2);
    t(tag("e o anel de operações fica"), IT.usaItem(f, descanso, d, { uid: "p1", opId: "persiste" }).repetida, true);
  }

  /* ------------------------------------------------------------ L. Recusas básicas */
  {
    const f = fichaCom(sistema, [entrada("p1", "it_perola_carregada"), entrada("c1", "it_chaveiro_canalizador", { equipado: true })]);
    const { d, s } = mesa(f);
    t(tag("sem opId recusa"), IT.usaItem(f, s, d, { uid: "p1" }).codigo, "sem-opid");
    t(tag("uid desconhecido"), IT.usaItem(f, s, d, { uid: "nao", opId: op() }).codigo, "item-ausente");
    t(tag("item sem uso (acessório de número)"), IT.usaItem(f, s, d, { uid: "c1", opId: op() }).codigo, "sem-uso");
  }

  /* ------------------------------------------------------------ M. A tabela de uso confere com o catálogo */
  {
    const ids = new Set(EQ.ITENS_ESPECIAIS.map((i) => i.id));
    t(tag("todo id da tabela de uso existe no catálogo"), USO.idsDeItensComUso().filter((id) => !ids.has(id)), []);
    t(tag("nenhuma linha tem tipo de ação desconhecido"), USO.idsDeItensComUso().filter((id) => {
      const u = USO.usoDoItem(id);
      const acoes = Array.isArray(u.acao) ? u.acao : [u.acao];
      return acoes.some((a) => !["comum", "bonus", "livre", "reacao", "movimento", "completa", undefined].includes(a));
    }), []);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
