/* O CONTRATO DE USO (CL1, 2026-10-29): `ficha/ficha-uso.js`, `ficha-uso-estado.js`, `ficha-uso-clientes.js`.

   Mede, com o `deriveAfty` e a sessão reais, nos dois sistemas (criatura e personagem):
     1. IDENTIDADE: sem `opId` recusa, o mesmo `opId` não debita nem aplica de novo, recusa não entra no anel;
     2. RECUSA COM MOTIVO: a sessão devolvida é o MESMO objeto, e nada foi gasto;
     3. CLIENTE REAL: Armas Absolutas (custo exibido, manutenção devida, duração em aberto) e o número no derive;
     4. POLÍTICA DE COBRANÇA: manual não debita, confirmada debita pela casca primeiro, e tudo-ou-nada;
     5. DURAÇÃO, LIMITES, USOS, RECARGA e CONCENTRAÇÃO ÚNICA;
     6. PERSISTÊNCIA: salvar, carregar, descanso, lixo no armazenamento e o combatente do Encontro. */
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
const U = await import(R + "ficha/ficha-uso.js");
const E = await import(R + "ficha/ficha-uso-estado.js");
const { USO_ARMAS_ABSOLUTAS, usoDoEstado } = await import(R + "ficha/ficha-uso-clientes.js");
const { COMBATE_ESTADOS, CUSTO_ATAQUE_CONCENTRADO } = await import(R + "afty-combate.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, habs = ["lut_um_com_a_arma", "lut_armas_absolutas"]) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 14, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel: 14 }];
  c.habilidades = habs;
  c.attributes = { forca: 14, destreza: 12, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: "arm_bastao", qtd: 1, equipado: true }] };
  return c;
};
const derivaDe = (f, s) => deriveAfty({ ...f, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const mesa = (f, derived) => ({ ...S.sessaoEmBranco(derived), combate: { ativo: true }, rodada: 1 });
const energia = (s) => s.peAtual + S.peTempTotal(s);
const PARAMS = { escolha: "acerto", armaDedicada: true };

for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = mesa(f, d0);
  const rot = (n) => `${sistema}: ${n}`;
  t(rot("a ficha tem a habilidade (o acesso do cliente depende dela)"), d0.habilidades.efetivas.includes("lut_armas_absolutas"), true);

  /* ---------- 1. IDENTIDADE ---------- */
  const semId = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { parametros: PARAMS });
  t(rot("sem opId recusa com motivo"), [semId.aplicado, semId.erro, semId.codigo], [false, "Sem Identidade da Operação", "sem-opid"]);
  t(rot("e devolve a mesma sessão"), semId.sessao === s0, true);
  t(rot("a sessão em branco nasce com o estado de uso vazio"), [s0.uso.ops, s0.uso.ativos, s0.uso.concentracao], [[], {}, null]);

  /* ---------- 2. RECUSAS COM MOTIVO, sem alterar nada ---------- */
  const recusa = (sessao, derived, desc, params, esperado, codigo, nome) => {
    const r = U.usa(sessao, derived, desc, { opId: U.novaOperacao(), parametros: params });
    t(rot(`${nome}: motivo`), [r.aplicado, r.erro, r.codigo], [false, esperado, codigo]);
    t(rot(`${nome}: a sessão é a mesma`), r.sessao === sessao, true);
    t(rot(`${nome}: nada entrou no anel`), r.sessao.uso.ops.length, 0);
  };
  recusa({ ...s0, combate: { ativo: false } }, d0, USO_ARMAS_ABSOLUTAS, PARAMS, "Pede Em Combate", "fora-de-combate", "fora de combate");
  recusa(s0, deriveAfty({ ...ficha(sistema, []), combate: { ativo: true } }), USO_ARMAS_ABSOLUTAS, PARAMS, "Habilidade Não Escolhida", "acesso", "sem a habilidade");
  recusa(s0, d0, USO_ARMAS_ABSOLUTAS, { armaDedicada: true }, "Falta Escolha do Bônus", "parametro-falta", "sem a escolha");
  recusa(s0, d0, USO_ARMAS_ABSOLUTAS, { escolha: "dano", armaDedicada: true }, "Escolha do Bônus Inválido", "parametro-invalido", "escolha fora das opções");
  recusa(s0, d0, USO_ARMAS_ABSOLUTAS, { escolha: "acerto" }, "Empunhando Arma Dedicada", "requisito-nao-confirmado", "sem confirmar a arma");
  recusa(s0, d0, USO_ARMAS_ABSOLUTAS, { escolha: "acerto", armaDedicada: false }, "Empunhando Arma Dedicada", "requisito-nao-confirmado", "arma negada");
  recusa({ ...s0, peAtual: 1, peTempFontes: {} }, d0, USO_ARMAS_ABSOLUTAS, PARAMS, "Faltam 1 PE", "sem-energia", "um PE a menos");

  /* ---------- 3. O CLIENTE REAL ---------- */
  const op1 = U.novaOperacao();
  const peAntes = energia(s0);
  const acertoAntes = d0.dano.entradas.find((x) => x.id === "basico").acerto;
  const r1 = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { opId: op1, parametros: PARAMS });
  t(rot("aplica"), [r1.aplicado, r1.erro, r1.ativoId], [true, undefined, "lut_armas_absolutas"]);
  t(rot("liga o estado com a opção escolhida"), r1.sessao.combate.armasAbsolutas, "acerto");
  t(rot("política manual: a Energia NÃO sai"), energia(r1.sessao), peAntes);
  t(rot("e o resultado diz o que a pessoa ainda precisa descontar"), [r1.custo.pe.pedido, r1.custo.pe.cobrado, r1.custo.pe.naoDescontado], [2, 0, 2]);
  t(rot("o id entra no anel"), r1.sessao.uso.ops.map((o) => o.id), [op1]);
  t(rot("o uso ativo guarda a manutenção em aberto"), [r1.sessao.uso.ativos.lut_armas_absolutas.duracao.tipo, r1.sessao.uso.ativos.lut_armas_absolutas.manutencao], ["manutencao", { pe: 2, mantidas: 0, devidas: 0 }]);
  const d1 = derivaDe(f, r1.sessao);
  t(rot("o número chega ao derive: +3 no acerto da arma"), d1.dano.entradas.find((x) => x.id === "basico").acerto - acertoAntes, 3);

  // repetir o mesmo id: nada muda, nada é cobrado de novo
  const rep = U.usa(r1.sessao, d1, USO_ARMAS_ABSOLUTAS, { opId: op1, parametros: PARAMS });
  t(rot("o mesmo opId é repetida"), [rep.aplicado, rep.repetida, rep.erro], [false, true, undefined]);
  t(rot("e a sessão é a mesma"), rep.sessao === r1.sessao, true);
  // outro id enquanto ativo
  const jaAtivo = U.usa(r1.sessao, d1, USO_ARMAS_ABSOLUTAS, { opId: U.novaOperacao(), parametros: PARAMS });
  t(rot("outro id com o uso ativo recusa"), [jaAtivo.erro, jaAtivo.codigo, jaAtivo.sessao === r1.sessao], ["Já Ativo", "ja-ativo", true]);
  // a recusa não gasta o id: o mesmo id serve depois de corrigido
  const opR = U.novaOperacao();
  const recusado = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { opId: opR, parametros: { escolha: "acerto" } });
  const corrigido = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { opId: opR, parametros: PARAMS });
  t(rot("recusa não consome o id"), [recusado.aplicado, corrigido.aplicado], [false, true]);

  // a virada: manutenção devida, sem débito e sem desligar
  const v1 = S.proximaRodada(r1.sessao, d1);
  t(rot("a virada marca a manutenção como devida"), v1.registro.manutencaoDevida, [{ id: "lut_armas_absolutas", nome: "Armas Absolutas", valor: 2, devidas: 1 }]);
  t(rot("sem debitar a Energia"), energia(v1.sessao), peAntes);
  t(rot("e sem desligar o estado"), v1.sessao.combate.armasAbsolutas, "acerto");
  const v2 = S.proximaRodada(v1.sessao, d1);
  t(rot("sem pagar, a segunda virada soma a devida"), v2.sessao.uso.ativos.lut_armas_absolutas.manutencao.devidas, 2);
  // pagar a manutenção
  const opM = U.novaOperacao();
  const pg = U.pagaManutencao(v1.sessao, d1, "lut_armas_absolutas", { opId: opM });
  t(rot("paga a manutenção (manual: marca, não debita)"), [pg.aplicado, pg.custo.pe.naoDescontado, pg.custo.pe.cobrado, pg.atrasadas], [true, 2, 0, 0]);
  t(rot("a devida zera e a mantida sobe"), pg.sessao.uso.ativos.lut_armas_absolutas.manutencao, { pe: 2, mantidas: 1, devidas: 0 });
  t(rot("o mesmo id de novo é repetida"), [U.pagaManutencao(pg.sessao, d1, "lut_armas_absolutas", { opId: opM }).repetida], [true]);
  const outro = U.pagaManutencao(pg.sessao, d1, "lut_armas_absolutas", { opId: U.novaOperacao() });
  t(rot("outro id sem nada devido recusa"), [outro.erro, outro.sessao === pg.sessao], ["Nada Devido", true]);
  t(rot("pagar o atraso informa as rodadas atrasadas"), U.pagaManutencao(v2.sessao, d1, "lut_armas_absolutas", { opId: U.novaOperacao() }).atrasadas, 1);
  t(rot("manutenção sem energia recusa"), U.pagaManutencao({ ...v1.sessao, peAtual: 1, peTempFontes: {} }, d1, "lut_armas_absolutas", { opId: U.novaOperacao() }).erro, "Faltam 1 PE");

  // encerrar desfaz o que ligou
  const fim = U.encerraUso(v1.sessao, d1, "lut_armas_absolutas", { opId: U.novaOperacao(), motivo: "parou" });
  t(rot("encerrar desliga o estado"), [fim.aplicado, fim.sessao.combate.armasAbsolutas, Object.keys(fim.sessao.uso.ativos)], [true, null, []]);
  t(rot("encerrar o que não está ativo recusa"), U.encerraUso(fim.sessao, d1, "lut_armas_absolutas", { opId: U.novaOperacao() }).erro, "Uso Não Está Ativo");
  // fim do combate e descanso
  const semCombate = S.aplicaPatchCombate(v1.sessao, { ativo: false });
  t(rot("o fim do combate encerra o uso que só vale em combate e desliga o estado (não fica ligado para a luta seguinte)"), [Object.keys(semCombate.uso.ativos), semCombate.combate.armasAbsolutas], [[], null]);
  const livre = U.usa(s0, d0, { ...USO_ARMAS_ABSOLUTAS, emCombate: false }, { opId: U.novaOperacao(), parametros: PARAMS });
  t(rot("já um uso sem emCombate atravessa o fim do combate"), Object.keys(S.aplicaPatchCombate(livre.sessao, { ativo: false }).uso.ativos), ["lut_armas_absolutas"]);
  const dormiu = S.descansar(v1.sessao, d1);
  t(rot("o descanso encerra o uso e desliga o estado"), [Object.keys(dormiu.uso.ativos), dormiu.combate.armasAbsolutas], [[], null]);
  t(rot("o descanso conserva o anel de ids"), dormiu.uso.ops.map((o) => o.id), [op1]);
}

/* ---------- 4. A POLÍTICA DE COBRANÇA ---------- */
{
  const f = ficha("player");
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = { ...mesa(f, d0), peTempFontes: { Cenário: 1 } };
  const desc = { ...USO_ARMAS_ABSOLUTAS, cobranca: "confirmada" };
  const r = U.usa(s0, d0, desc, { opId: U.novaOperacao(), parametros: PARAMS });
  t("confirmada: debita a casca primeiro", [r.custo.pe.casca, r.custo.pe.reserva, r.custo.pe.cobrado, r.custo.pe.naoDescontado], [{ Cenário: 1 }, 1, 2, 0]);
  t("confirmada: a Energia caiu 2", energia(r.sessao), energia(s0) - 2);
  t("confirmada: a manutenção herda a política", r.sessao.uso.ativos.lut_armas_absolutas.cobranca, "confirmada");
  const v = S.proximaRodada(r.sessao, d0);
  const pg = U.pagaManutencao(v.sessao, d0, "lut_armas_absolutas", { opId: U.novaOperacao() });
  t("confirmada: pagar a manutenção debita pelo gastaPe", [pg.custo.pe.cobrado, energia(pg.sessao)], [2, energia(v.sessao) - 2]);

  // tudo ou nada: um efeito que o motor recusa desfaz o pagamento
  const furtivo = { id: "teste_atomico", nome: "Teste Atômico", cobranca: "confirmada", custo: { pe: 3, vida: 2 }, efeitos: [{ tipo: "estado", id: "ataqueFurtivo", valor: true }] };
  const travado = { ...s0, usos: { "turno:res_ataque_furtivo": 1 } };
  const at = U.usa(travado, d0, furtivo, { opId: U.novaOperacao() });
  t("atomicidade: o estado recusado devolve a sessão de antes", [at.aplicado, at.erro, at.sessao === travado], [false, "Estado Não Mudou", true]);
  t("atomicidade: nem PE nem vida saíram", [energia(at.sessao), at.sessao.hpAtual], [energia(travado), travado.hpAtual]);
  const vida = U.usa(s0, d0, { id: "paga_vida", nome: "Paga Vida", cobranca: "confirmada", custo: { vida: 5 } }, { opId: U.novaOperacao() });
  t("confirmada: o custo em vida passa por pagaCustoVida", [vida.custo.vida.pago, vida.sessao.hpAtual], [5, s0.hpAtual - 5]);
  const semVida = U.usa({ ...s0, hpAtual: 3 }, d0, { id: "paga_vida", nome: "Paga Vida", custo: { vida: 5 } }, { opId: U.novaOperacao() });
  t("vida insuficiente recusa", [semVida.erro, semVida.codigo], ["PV Insuficiente", "sem-vida"]);
  t("esperado desatualizado recusa", U.usa(s0, d0, desc, { opId: U.novaOperacao(), parametros: PARAMS, esperado: { energia: energia(s0) + 1 } }).erro, "A Ficha Mudou Antes de Confirmar");
}

/* ---------- 5. DURAÇÃO, LIMITES, USOS, RECARGA, CONCENTRAÇÃO ---------- */
{
  const f = ficha("player");
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = mesa(f, d0);
  const op = () => ({ opId: U.novaOperacao() });

  // duração em rodadas com um Buff de Mesa que o derive lê
  const escudo = { id: "escudo", nome: "Escudo de Mesa", duracao: { rodadas: 2 }, efeitos: [{ tipo: "buff", canal: "defesa", expr: "+2" }] };
  const e1 = U.usa(s0, d0, escudo, op());
  t("duração: aplica", e1.aplicado, true);
  t("duração: o derive enxerga o buff", derivaDe(f, e1.sessao).defesa - d0.defesa, 2);
  const e2 = S.proximaRodada(e1.sessao, d0);
  t("duração: depois da 1ª virada segue ativo, com 1 restante", e2.sessao.uso.ativos.escudo.duracao, { tipo: "rodadas", restantes: 1 });
  const e3 = S.proximaRodada(e2.sessao, d0);
  t("duração: na 2ª virada acaba e o registro diz", e3.registro.encerrou, [{ id: "escudo", nome: "Escudo de Mesa", motivo: "duracao" }]);
  t("duração: o buff saiu e o derive voltou", [e3.sessao.buffs.length, derivaDe(f, e3.sessao).defesa], [0, d0.defesa]);
  t("expressão inválida recusa antes de aplicar", U.usa(s0, d0, { id: "x", efeitos: [{ tipo: "buff", canal: "defesa", expr: "2 +" }] }, op()).erro, "Expressão Inválida");

  // limites por rodada, turno e cena
  const porRodada = { id: "uma_vez", nome: "Uma Vez", limite: { por: "rodada" } };
  const l1 = U.usa(s0, d0, porRodada, op());
  t("limite por rodada: o segundo uso recusa", U.usa(l1.sessao, d0, porRodada, op()).erro, "Já Usado Nesta Rodada");
  t("limite por rodada: a virada devolve", U.usa(S.proximaRodada(l1.sessao, d0).sessao, d0, porRodada, op()).aplicado, true);
  const porTurno = { id: "no_turno", nome: "No Turno", limite: { por: "turno" } };
  const lt = U.usa(s0, d0, porTurno, op());
  t("limite por turno: recusa dentro do turno e devolve no início do próximo", [U.usa(lt.sessao, d0, porTurno, op()).erro, U.usa(S.iniciaTurnoFicha(lt.sessao, d0), d0, porTurno, op()).aplicado], ["Já Usado Neste Turno", true]);
  const porCena = { id: "na_cena", nome: "Na Cena", limite: { por: "cena" } };
  const lc = U.usa(s0, d0, porCena, op());
  t("limite por cena: recusa e o descanso devolve", [U.usa(lc.sessao, d0, porCena, op()).erro, U.usa(S.descansar(lc.sessao, d0), d0, porCena, op()).aplicado], ["Já Usado Nesta Cena", true]);

  // usos (contador do motor) e recarga
  const comUsos = { id: "tem_usos", nome: "Tem Usos", usos: { chave: "hab:tem_usos", max: 1 } };
  const u1 = U.usa(s0, d0, comUsos, op());
  t("usos: gasta um e o segundo recusa", [u1.sessao.usos["hab:tem_usos"], U.usa(u1.sessao, d0, comUsos, op()).erro], [1, "Sem Usos Restantes"]);
  t("usos: o descanso devolve", U.usa(S.descansar(u1.sessao, d0), d0, comUsos, op()).aplicado, true);
  const comRecarga = { id: "recarrega", nome: "Recarrega", recarga: { rodadas: 2 } };
  const rc = U.usa(s0, d0, comRecarga, op());
  t("recarga: abre com 2 rodadas", S.recargaDe(rc.sessao, "recarrega")?.restantes, 2);
  t("recarga: recusa com o motivo e a conta", U.usa(rc.sessao, d0, comRecarga, op()).erro, "Recarga 2");
  const rc1 = S.proximaRodada(rc.sessao, d0).sessao;
  const rc2 = S.proximaRodada(rc1, d0).sessao;
  t("recarga: desce uma por virada e libera", [U.usa(rc1, d0, comRecarga, op()).erro, U.usa(rc2, d0, comRecarga, op()).aplicado], ["Recarga 1", true]);

  // concentração: um espaço só
  const a = { id: "mantem_a", nome: "Mantém A", concentracao: true, duracao: { rodadas: 5 }, efeitos: [{ tipo: "estado", id: "estadoA", valor: true }] };
  const b = { id: "mantem_b", nome: "Mantém B", concentracao: true, duracao: { rodadas: 5 } };
  const ca = U.usa(s0, d0, a, op());
  t("concentração: abre", ca.sessao.uso.concentracao, { id: "mantem_a", nome: "Mantém A", ritualFeiticoId: null, desde: 1 });
  const cb = U.usa(ca.sessao, d0, b, op());
  t("concentração: a segunda é recusada com o motivo", [cb.erro, cb.codigo, cb.recusas[0].detalhe, cb.sessao === ca.sessao], ["Já Concentrado", "concentrado", "Mantém A", true]);
  const troca = U.usa(ca.sessao, d0, b, { ...op(), encerraAnterior: true });
  t("concentração: trocar encerra a anterior e desfaz o estado dela", [troca.aplicado, Object.keys(troca.sessao.uso.ativos), troca.sessao.combate.estadoA, troca.sessao.uso.concentracao.id], [true, ["mantem_b"], false, "mantem_b"]);
  t("concentração: encerrar o ativo fecha a concentração", U.encerraUso(ca.sessao, d0, "mantem_a", op()).sessao.uso.concentracao, null);

  // exclusividade
  const x = { id: "excl_x", nome: "Exclusivo X", exclusivoCom: ["mantem_a"], duracao: { rodadas: 1 } };
  t("exclusivoCom recusa com o nome", U.usa(ca.sessao, d0, x, op()).erro, "Exclusivo Com Mantém A");

  // proibido por condição
  const proib = { id: "p", nome: "P", proibidoCom: ["Atordoado"] };
  t("condição que impede recusa", U.usa({ ...s0, condicoes: [{ nome: "Atordoado", rodadas: null }] }, d0, proib, op()).erro, "Atordoado Impede");

  // ação
  const acao = { id: "bonus_x", nome: "Bônus X", acao: "bonus" };
  const ac1 = U.usa(s0, d0, acao, { ...op(), registraAcao: true });
  t("ação: registra a bônus", [ac1.aplicado, ac1.acao, ac1.sessao.uso.acoes.gastas.bonus], [true, "bonus", 1]);
  t("ação: sem registraAcao a ficha não mexe nas ações", U.usa(s0, d0, acao, op()).sessao.uso.acoes.gastas.bonus, 0);
}

/* ---------- 6. PERSISTÊNCIA ---------- */
{
  const f = ficha("player");
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = mesa(f, d0);
  const r = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { opId: "op_fixa", parametros: PARAMS });
  S.salvarSessao("pessoa-cl1", r.sessao);
  const lida = S.carregarSessao("pessoa-cl1", d0);
  t("salvar e carregar devolve o estado de uso", JSON.stringify(lida.uso), JSON.stringify(r.sessao.uso));
  t("o anel sobrevive e repetir o id continua repetida", U.usa(lida, d0, USO_ARMAS_ABSOLUTAS, { opId: "op_fixa", parametros: PARAMS }).repetida, true);
  t("o aparaSessao não perde o estado", JSON.stringify(S.aparaSessao(lida, d0).uso), JSON.stringify(r.sessao.uso));
  // combatente do Encontro guarda a sessão inteira por JSON
  t("o clone JSON do combatente conserva o estado", JSON.stringify(S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d0).uso), JSON.stringify(r.sessao.uso));
  // lixo no armazenamento
  const lixos = [null, undefined, "x", 4, [], { ops: "x", ativos: [], pendencias: 9, acoes: "z", concentracao: 3, teste: "t", sequencia: null },
    { ops: [{}, { id: 7 }, { id: "ok", tipo: "uso", rodada: "3" }], ativos: { a: 1, b: { id: "b", duracao: { tipo: "inventado" } }, c: { duracao: { tipo: "rodadas", restantes: -4 } } }, pendencias: [1, { id: "p1", elegivel: "x" }], acoes: { gastas: { comum: -2, bonus: "3" }, reacoes: { r: "x", s: 4 } }, concentracao: { id: "c" }, teste: { cd: "12" }, sequencia: { ataques: -9 } }];
  for (const [i, lixo] of lixos.entries()) {
    let u;
    try { u = E.normalizaUso(lixo); } catch (e) { u = String(e); }
    t(`lixo ${i}: não derruba e sai no formato`, typeof u === "object" && Array.isArray(u.ops) && typeof u.ativos === "object" && Array.isArray(u.pendencias) && u.sequencia.ataques >= 0 && ["comum", "bonus", "movimento"].every((k) => u.acoes.gastas[k] >= 0), true);
  }
  const bagunca = E.normalizaUso(lixos[lixos.length - 1]);
  t("lixo: ids de operação sem forma saem, o válido fica", bagunca.ops, [{ id: "ok", tipo: "uso", rodada: 3 }]);
  t("lixo: tipo de duração inventado vira descanso e restantes negativo vira 1", [bagunca.ativos.b.duracao, bagunca.ativos.undefined === undefined], [{ tipo: "descanso" }, true]);
  t("lixo: ação gasta negativa vira zero", [bagunca.acoes.gastas.comum, bagunca.acoes.gastas.bonus, bagunca.acoes.reacoes], [0, 3, { s: 4 }]);
  // o anel tem teto
  let anel = r.sessao;
  for (let i = 0; i < E.TETO_ANEL_OPS + 20; i += 1) anel = E.comOperacao(anel, { id: `o${i}`, tipo: "uso" });
  t("o anel respeita o teto e guarda o mais novo", [anel.uso.ops.length, anel.uso.ops[0].id], [E.TETO_ANEL_OPS, `o${E.TETO_ANEL_OPS + 19}`]);
  // sessão antiga, sem o campo
  const { uso: _x, ...antiga } = r.sessao;
  t("sessão gravada antes do motor ganha o estado em branco", S.normalizaSessao(antiga, d0).uso, E.usoEmBranco());
}

/* ---------- 7. A PONTE DOS ESTADOS DE COMBATE (M03-D01) ---------- */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema, ["cmb_ataque_concentrado"]);
  f.especializacoes = [{ id: "combatente", nivel: 14 }];
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = mesa(f, d0);
  const rot = (n) => `${sistema}: ponte: ${n}`;
  const op = () => ({ opId: U.novaOperacao() });

  // faixa do catálogo real: o Ataque Concentrado (custo por intensidade, teto pelas habilidades)
  const ac = COMBATE_ESTADOS.find((e) => e.id === "ataqueConcentrado");
  const dAc = usoDoEstado(ac, d0);
  t(rot("a faixa herda o teto do catálogo"), dAc.parametros[0].max, ac.max(d0));
  const um = U.usa(s0, d0, dAc, { ...op(), parametros: { valor: 1 } });
  t(rot("liga o estado pelo verbo de sempre"), [um.aplicado, um.sessao.combate.ataqueConcentrado], [true, 1]);
  t(rot("e o custoPE que só era exibido agora é conferido e devolvido"), [um.custo.pe.pedido, um.custo.pe.naoDescontado, um.custo.pe.cobrado], [CUSTO_ATAQUE_CONCENTRADO[1], CUSTO_ATAQUE_CONCENTRADO[1], 0]);
  const alto = U.usa(s0, d0, dAc, { ...op(), parametros: { valor: ac.max(d0) + 1 } });
  t(rot("intensidade acima do teto é recusada"), [alto.erro, alto.sessao === s0], ["Ataque Concentrado Fora da Faixa", true]);
  t(rot("sem Energia recusa com a conta"), U.usa({ ...s0, peAtual: 0, peTempFontes: {} }, d0, dAc, { ...op(), parametros: { valor: 1 } }).erro, "Faltam 1 PE");

  // bool com custo e exclusividade (os dois Canalizar)
  const canalizar = { id: "canalizarEmGolpe", label: "Canalizar em Golpe", tipo: "bool", custoPE: 4, exclusivoCom: ["canalizarEnergiaReversa"] };
  const comER = { ...s0, combate: { ...s0.combate, canalizarEnergiaReversa: true } };
  const cg = U.usa(comER, d0, usoDoEstado(canalizar, d0), op());
  t(rot("Canalizar em Golpe: custo 4 devolvido, e o exclusivo desliga o outro"), [cg.custo.pe.naoDescontado, cg.sessao.combate.canalizarEmGolpe, cg.sessao.combate.canalizarEnergiaReversa], [4, true, false]);

  // opção e rodada
  const aa = COMBATE_ESTADOS.find((e) => e.id === "armasAbsolutas");
  const dAa = usoDoEstado(aa, d0);
  t(rot("opção: liga com a escolha"), U.usa(s0, d0, dAa, { ...op(), parametros: { valor: "defesa" } }).sessao.combate.armasAbsolutas, "defesa");
  t(rot("opção inventada é recusada"), U.usa(s0, d0, dAa, { ...op(), parametros: { valor: "dano" } }).erro, "Armas Absolutas Inválido");
  const umaVez = { id: "u1", label: "Uma Vez", tipo: "bool", umaVezPorRodada: true };
  const u1 = U.usa(s0, d0, usoDoEstado(umaVez, d0), op());
  t(rot("umaVezPorRodada vira recusa com motivo, e não silêncio"), [U.usa(u1.sessao, d0, usoDoEstado(umaVez, d0), op()).erro, U.usa(S.proximaRodada(u1.sessao, d0).sessao, d0, usoDoEstado(umaVez, d0), op()).aplicado], ["Já Usado Nesta Rodada", true]);
  // com duração o estado vira uso ativo, que o fim do turno desfaz
  const ligado = U.usa(s0, d0, usoDoEstado(canalizar, d0, { duracao: { ate: "fimDoTurno" } }), op());
  t(rot("com duração o estado cai no fim do turno"), [ligado.sessao.combate.canalizarEmGolpe, S.encerraTurnoFicha(ligado.sessao, d0).combate.canalizarEmGolpe], [true, false]);
}

/* ---------- 8. DESLIGAR À MÃO NÃO DEIXA O USO ATIVO PENDURADO ---------- */
for (const sistema of ["player", "afty"]) {
  const f = ficha(sistema);
  const d0 = deriveAfty({ ...f, combate: { ativo: true } });
  const s0 = mesa(f, d0);
  const rot = (n) => `${sistema}: à mão: ${n}`;
  const op = () => ({ opId: U.novaOperacao() });
  const r = U.usa(s0, d0, USO_ARMAS_ABSOLUTAS, { ...op(), parametros: PARAMS });
  // o seletor antigo da aba Buffs desliga o estado pelo verbo de sempre, que não conhece o uso ativo
  const aa = COMBATE_ESTADOS.find((e) => e.id === "armasAbsolutas");
  const desligado = S.alteraEstadoCombate(r.sessao, aa, null, d0);
  t(rot("o seletor antigo desliga o estado e o uso ainda consta"), [desligado.combate.armasAbsolutas, Object.keys(desligado.uso.ativos)], [null, ["lut_armas_absolutas"]]);
  const v = S.proximaRodada(desligado, d0);
  t(rot("a virada encerra o uso e nada fica devido"), [Object.keys(v.sessao.uso.ativos), v.registro.manutencaoDevida, v.registro.encerrou.map((x) => x.motivo)], [[], undefined, ["desligadoAMao"]]);
  // o mesmo no fim do turno e no início do turno
  t(rot("o fim do turno também sincroniza"), Object.keys(S.encerraTurnoFicha(desligado, d0).uso.ativos), []);
  t(rot("o início do turno também sincroniza"), Object.keys(S.iniciaTurnoFicha(desligado, d0).uso.ativos), []);
  // enquanto o estado está ligado, nada é encerrado
  t(rot("ligado, o uso continua"), Object.keys(S.proximaRodada(r.sessao, d0).sessao.uso.ativos), ["lut_armas_absolutas"]);
  // só Buff de Mesa: tirado à mão, o uso sai
  const so = U.usa(s0, d0, { id: "so_buff", nome: "Só Buff", duracao: { rodadas: 5 }, efeitos: [{ tipo: "buff", canal: "defesa", expr: "2" }] }, op());
  const semBuff = { ...so.sessao, buffs: [] };
  t(rot("buff tirado à mão encerra o uso na virada"), Object.keys(S.proximaRodada(semBuff, d0).sessao.uso.ativos), []);
  t(rot("uso sem efeito nenhum não é dado como desligado"), Object.keys(S.proximaRodada(U.usa(s0, d0, { id: "so_conc", nome: "Só Concentração", concentracao: true, duracao: { rodadas: 5 } }, op()).sessao, d0).sessao.uso.ativos), ["so_conc"]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
