/* O REGISTRO DAS OPERAÇÕES DA ABA EFEITOS DENTRO DA SESSÃO DA FICHA (integração do G2, 2026-10-17).

   Uma SESSÃO só. O que a camada dos Efeitos guarda além da sessão (o histórico de eventos com horário real, o registro de cada gasto de PE que o
   Estornar PE consulta, os usos novos, as concessões de PV Temporário e os encerrados) mora no campo `operacoes` da própria sessão. Aqui:
     1. persistência: sobrevive a salvar e carregar, ao `aparaSessao` e ao descanso (que apaga só o que é da cena que acabou, por regra explícita);
     2. sanidade: lixo, formato errado e campo ausente viram o padrão e nunca derrubam; evento antigo sem horário continua sem horário;
     3. atomicidade: a operação que recusa devolve a mesa que recebeu (nada muda e nenhum evento nasce); o evento só nasce depois do sucesso;
     4. o Estornar PE devolve só o PE e só uma vez;
     5. as opções do derive da Ficha (lista única) e o derive pelo `prepararCalculo` são o derive de sempre. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const loja = new Map();
globalThis.localStorage = {
  getItem: (k) => (loja.has(k) ? loja.get(k) : null),
  setItem: (k, v) => loja.set(k, String(v)),
  removeItem: (k) => loja.delete(k),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const V = await import(R + "ficha/efeitos/mesa-verbos.js");
const G = await import(R + "ficha/efeitos/sessao-g2.js");
const O = await import(R + "ficha/efeitos/operacoes.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 20, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }];
const derived = deriveAfty({ ...ficha, combate: { ativo: true } });
const sessao0 = { ...S.sessaoEmBranco(derived), combate: { ativo: true }, rodada: 1 };
const deps = { derived, calculo: (s) => prepararCalculo(ficha, s).derived };

/* ============================================================ */
/* 1. PERSISTÊNCIA                                               */
/* ============================================================ */
let mesa = G.daSessao(sessao0);
t("a sessão sem registro dá uma mesa vazia", [mesa.eventos, mesa.ativacoes, mesa.reusos, mesa.pvConcessoes, mesa.ui.encerrados], [[], {}, {}, {}, []]);

const gasto = V.gastoManual(mesa, 5, "Teste de Gasto", derived);
mesa = V.danoOuCura(gasto.mesa, { valor: 7, tipo: "dano", naAlma: false }, derived).mesa;
mesa = { ...mesa, reusos: { "efeito:x": 2 }, pvConcessoes: { terra: { valor: 30, fonte: "Terra", rodada: 1 } }, ui: { ...mesa.ui, encerrados: [{ chave: "g:espirito", nome: "Espírito de Luta", restaurar: { tipo: "grupo", valores: { a: 1 } } }] } };
const comRegistro = G.paraSessao(mesa);
t("a sessão guarda o registro no campo próprio", Object.keys(comRegistro.operacoes).sort(), ["ativacoes", "encerrados", "eventos", "pvConcessoes", "reusos"]);
t("os eventos têm horário real e rodada", comRegistro.operacoes.eventos.every((e) => typeof e.ts === "number" && e.rodada === 1), true);

S.salvarSessao("pessoa-1", comRegistro);
const lida = S.carregarSessao("pessoa-1", derived);
t("salvar e carregar devolve o registro inteiro", JSON.stringify(lida.operacoes), JSON.stringify(comRegistro.operacoes));
t("e o resto da sessão (PE, Vida, rodada) é o que se gravou", [lida.peAtual, lida.hpAtual, lida.rodada], [comRegistro.peAtual, comRegistro.hpAtual, comRegistro.rodada]);
t("o `aparaSessao` não perde o registro", JSON.stringify(S.aparaSessao(lida, derived).operacoes), JSON.stringify(comRegistro.operacoes));
t("outra pessoa não vê o registro (a chave é da ficha)", S.carregarSessao("pessoa-2", derived).operacoes, undefined);

/* o descanso: regra explícita, o histórico fica */
const descansada = G.descansaComRegistro(lida, derived);
const md = G.daSessao(descansada);
t("o descanso apaga os usos novos, as concessões e os encerrados (são da cena que acabou)", [md.reusos, md.pvConcessoes, md.ui.encerrados], [{}, {}, []]);
t("o descanso mantém o histórico e acrescenta o evento dele, com horário", [md.eventos.length, md.eventos[0].tipo, typeof md.eventos[0].ts], [comRegistro.operacoes.eventos.length + 1, "info", "number"]);
t("o descanso devolve a rodada zero", descansada.rodada, 0);

/* ============================================================ */
/* 2. SANIDADE                                                   */
/* ============================================================ */
const lixos = [null, undefined, "x", 4, [], { eventos: "x", ativacoes: [], reusos: 9, pvConcessoes: null, encerrados: {} },
  { eventos: [{}, { id: 3 }, { id: "a" }, { id: "b", tipo: "info", texto: "ok" }], ativacoes: { a: 3, b: { tipo: "gasto", custo: "5", pago: { casca: 4, reserva: "2" } } }, reusos: { x: -4, y: "7", z: 0 }, pvConcessoes: { k: "v", j: { valor: "9" } }, encerrados: [1, { chave: "c" }, { chave: "d", restaurar: { tipo: "grupo" } }] }];
for (const [i, lixo] of lixos.entries()) {
  let m = null;
  try { m = G.daSessao({ ...sessao0, operacoes: lixo }); } catch (e) { bad.push(`lixo ${i} derrubou: ${e.message}`); }
  t(`lixo ${i}: vira o padrão seguro (listas e mapas)`, m && [Array.isArray(m.eventos), typeof m.ativacoes, typeof m.reusos, typeof m.pvConcessoes, Array.isArray(m.ui.encerrados)], [true, "object", "object", "object", true]);
}
const misto = G.daSessao({ ...sessao0, operacoes: lixos.at(-1) });
t("só o evento bem formado fica", misto.eventos.map((e) => e.id), ["b"]);
t("evento antigo sem horário continua sem horário (nunca se inventa um)", misto.eventos[0].ts, undefined);
t("uso negativo ou zero some, e o número em texto vira número", misto.reusos, { y: 7 });
t("o gasto com números em texto vira número, e a casca inválida vira vazia", [misto.ativacoes.b.custo, misto.ativacoes.b.pago], [5, { casca: {}, reserva: 2 }]);
t("o encerrado sem o que restaurar é descartado", misto.ui.encerrados.map((x) => x.chave), ["d"]);

const cheio = { ...mesa, eventos: Array.from({ length: 120 }, (_, i) => ({ id: `e${i}`, tipo: "info", texto: "x", ts: i })), ui: { ...mesa.ui, encerrados: Array.from({ length: 9 }, (_, i) => ({ chave: `c${i}`, nome: "n", restaurar: { tipo: "grupo" } })) } };
t("o histórico tem teto de 80 eventos ao comentar o registro", V.comEvento(cheio, { tipo: "info", texto: "y" }).eventos.length, 80);
t("os encerrados têm teto de 6 ao gravar", G.daSessao(G.paraSessao(cheio)).ui.encerrados.length, 6);
const semEvento = G.paraSessao({ ...mesa, eventos: [], ativacoes: { z: { id: "z", tipo: "gasto", custo: 1, pago: { casca: {}, reserva: 1 } } } });
t("o registro de gasto sem evento no histórico não fica guardado", semEvento.operacoes.ativacoes, {});

/* ============================================================ */
/* 3. ATOMICIDADE                                                */
/* ============================================================ */
const m0 = G.daSessao({ ...sessao0, peAtual: 3, peTempFontes: {} });
const recusa = O.descontaEnergia(m0, { valor: 10, motivo: "Falta" }, deps);
t("sem Energia: a operação recusa", recusa.erro, "Faltam 7 PE");
t("e devolve a mesa que recebeu, sem evento nem mudança", [recusa.mesa === m0, recusa.mesa.eventos.length, recusa.mesa.sessao.peAtual], [true, 0, 3]);
const vazio = O.descontaEnergia(m0, { valor: 0 }, deps);
t("valor vazio recusa sem tocar em nada", [vazio.erro, vazio.mesa === m0], ["Informe o Valor", true]);
const mudou = O.descontaEnergia(m0, { valor: 1, energiaVista: 9 }, deps);
t("a Energia mudou antes de descontar: nada é debitado (o segundo clique de um clique duplo)", [mudou.erro, mudou.mesa === m0], ["A Energia Mudou Antes de Descontar", true]);
const certo = O.descontaEnergia(m0, { valor: 2, motivo: "Aura", energiaVista: 3 }, deps);
t("com Energia: subtrai, e o evento nasce só depois do sucesso", [certo.erro, certo.mesa.sessao.peAtual, certo.mesa.eventos.length, certo.mesa.eventos[0].tipo], [undefined, 1, 1, "gasto"]);
t("a mesa de partida não foi alterada (função pura)", [m0.sessao.peAtual, m0.eventos.length], [3, 0]);

const casca = G.daSessao({ ...sessao0, peAtual: 3, peTempFontes: { "Treino": 4 } });
const pagoCasca = V.gastoManual(casca, 5, "Casca primeiro", derived);
t("o gasto come a casca antes da reserva", [pagoCasca.mesa.sessao.peTempFontes, pagoCasca.mesa.sessao.peAtual], [{}, 2]);

/* ============================================================ */
/* 4. ESTORNAR PE                                                */
/* ============================================================ */
const g1 = V.gastoManual(casca, 5, "Estornável", derived);
const idGasto = Object.keys(g1.mesa.ativacoes)[0];
const e1 = V.desfazer(g1.mesa, idGasto, derived);
t("estornar devolve só os PE do gasto, na mesma rodada", [e1.mesa.sessao.peAtual, e1.mesa.sessao.peTempFontes], [3, { "Treino": 4 }]);
t("o estorno vira evento novo, com o horário", [e1.mesa.eventos[0].tipo, typeof e1.mesa.eventos[0].ts, e1.mesa.eventos[0].devolvido], ["desfazer", "number", 5]);
const e2 = V.desfazer(e1.mesa, idGasto, derived);
t("estornar duas vezes não faz nada", [e2.erro, e2.mesa === e1.mesa], ["Já desfeito", true]);
const virou = V.avancarRodada(g1.mesa, derived).mesa;
const e3 = V.desfazer(virou, idGasto, derived);
t("virada a rodada, a casca NÃO volta (foi renovada ou encerrada pelo motor)", [e3.mesa.sessao.peAtual > virou.sessao.peAtual || e3.mesa.sessao.peAtual === virou.sessao.peAtual, Object.keys(e3.mesa.sessao.peTempFontes).includes("Treino") && e3.mesa.sessao.peTempFontes.Treino === 4 && !virou.sessao.peTempFontes.Treino], [true, false]);
t("e o estorno diz o que não voltou", Array.isArray(e3.mesa.eventos[0].limites), true);
t("a cobrança que o próprio motor faz ao ligar o Invencível sob o Sol não se estorna", V.podeDesfazer({ ativacoes: { a: { id: "a", tipo: "estado", desfeita: false } } }, "a"), { ok: false, motivo: "Desfazer de estado não está definido" });

/* dano e cura pelos verbos da Ficha */
const dc = V.danoOuCura(G.daSessao({ ...sessao0, hpAtual: 50, pvTempFontes: { "Escudo": 10 } }), { valor: 15, tipo: "dano", naAlma: false }, derived);
t("o dano come a casca antes da Vida", [dc.mesa.sessao.pvTempFontes, dc.mesa.sessao.hpAtual, dc.mudou], [{}, 45, { vida: -5, casca: -10, alma: 0 }]);
t("o dano vira evento, com a mudança", [dc.mesa.eventos[0].tipo, dc.mesa.eventos[0].mudou], ["dano", { vida: -5, casca: -10, alma: 0 }]);
t("dano zero não faz nada", V.danoOuCura(G.daSessao(sessao0), { valor: 0, tipo: "dano" }, derived).mesa.eventos.length, 0);

/* ============================================================ */
/* 5. AS OPÇÕES DO DERIVE E O DERIVE DA FICHA                    */
/* ============================================================ */
const marca = (n) => ({ __marca: n });
const sentinela = {
  propriedadesArmas: marca(1), ataqueBasicoId: marca(2), bloodfeast: marca(3), hpAtual: 41, almaAtual: 42, ultimoFeiticoDanoId: marca(5), rituais: marca(6),
  concedido: marca(7), adaptacoes: marca(8), dharma: marca(9), treinosAtivos: marca(10), invocacoes: marca(11), condicoes: marca(12), exaustaoTecnica: marca(13),
};
const op = opcoesDeriveDaSessao({ ...S.sessaoEmBranco(derived), ...sentinela, usosRitualistaCru: undefined });
t("a lista de opções tem exatamente as chaves que a Ficha sempre mandou ao derive",
  Object.keys(op).sort(),
  ["adaptacoes", "almaAtual", "ataqueBasicoId", "bloodfeast", "concedido", "condicoes", "dharma", "exaustaoTecnica", "guarda", "invocacoes", "propriedadesArmas", "rituais", "ritualAtual", "treinosAtivos", "ultimoFeiticoDanoId", "usosRitualista", "vidaAtual"]);
t("cada opção vem do campo certo da sessão", [op.vidaAtual, op.almaAtual, op.propriedadesArmas, op.ataqueBasicoId, op.bloodfeast, op.concedido, op.adaptacoes, op.dharma, op.treinosAtivos, op.invocacoes, op.condicoes, op.exaustaoTecnica, op.rituais, op.ultimoFeiticoDanoId],
  [41, 42, marca(1), marca(2), marca(3), marca(7), marca(8), marca(9), marca(10), marca(11), marca(12), marca(13), marca(6), marca(5)]);
t("a Guarda corrente e os rituais saem pelos verbos da sessão", [op.guarda, op.usosRitualista, op.ritualAtual], [S.entradaDaGuarda(S.sessaoEmBranco(derived)), S.usosRitualista(S.sessaoEmBranco(derived)), S.ritualEmAndamento(S.sessaoEmBranco(derived))]);

const comBuffs = { ...S.sessaoEmBranco(derived), combate: { ativo: true }, buffs: [{ id: "b1", nome: "Bênção", rodadas: 3, efeitos: [] }] };
const antigo = deriveAfty({ ...ficha, combate: comBuffs.combate, buffsSessao: comBuffs.buffs }, opcoesDeriveDaSessao(comBuffs));
const novo = prepararCalculo(ficha, comBuffs).derived;
t("sem registro da aba Efeitos, o derive pelo `prepararCalculo` é o derive de sempre", JSON.stringify(novo) === JSON.stringify(antigo), true);

/* ============================================================ */
/* 6. O SURTO DE AÇÃO: O VERBO EXISTENTE DA ESPECIALIZAÇÃO       */
/* ============================================================ */
/* `usarEfeitoEspecializacao(s, d, id, rng)` mora em `ficha/ficha-especializacoes.js`, que o repositório ainda não rastreia: ele precisa seguir junto
   com `efeitos/operacoes.js` (a relação final de arquivos da entrega o lista). A camada dos Efeitos só chama o verbo e confere se a sessão mudou. Sem
   simular contador: uma vez por rodada, um uso do contador do motor, e uma ação comum a mais. */
{
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 20, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 20 }];
  f.habilidades = ["cmb_surto_de_acao"];
  const d = deriveAfty({ ...f, combate: { ativo: true } });
  const m0 = G.daSessao({ ...S.sessaoEmBranco(d), combate: { ativo: true }, rodada: 1 });
  const pedido = { chave: "x", nome: "Surto de Ação", itemId: "cmb_surto_de_acao", esperado: 0 };
  t("o contador do motor existe para o Surto de Ação", d.usosHabilidades?.cmb_surto_de_acao?.chave, "hab:cmb_surto_de_acao");
  const r1 = O.registraUso(m0, pedido, { derived: d });
  t("o primeiro uso gasta um do contador e entrega uma ação comum", [r1.erro, r1.usos.restam, r1.mesa.sessao.especializacaoSessao.surtoAcaoRodada, r1.mesa.sessao.especializacaoSessao.acoesComuns], [undefined, 2, 1, 1]);
  t("o uso vira evento, com o que restou", [r1.mesa.eventos[0].tipo, r1.mesa.eventos[0].usos], ["uso", { max: 3, restam: 2 }]);
  const r2 = O.registraUso(r1.mesa, { ...pedido, esperado: 1 }, { derived: d });
  t("o segundo na mesma rodada recusa, e a mesa não muda", [r2.erro, r2.mesa === r1.mesa], ["Já Usado Nesta Rodada", true]);
  t("a tela que mostrou um número velho recusa (o segundo clique de um clique duplo)", O.registraUso(r1.mesa, pedido, { derived: d }).erro, "A Ficha Mudou Antes de Registrar");
  const r4 = O.registraUso({ ...r1.mesa, sessao: S.proximaRodada(r1.mesa.sessao, d).sessao }, { ...pedido, esperado: 1 }, { derived: d });
  t("na rodada seguinte o Surto volta a poder ser usado, com o contador gasto", [r4.erro, r4.usos.restam], [undefined, 1]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
