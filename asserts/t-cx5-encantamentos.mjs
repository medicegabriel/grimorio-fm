/**
 * CX5: CARGAS DE ENCANTAMENTO E OS 16 ENCANTAMENTOS ATIVOS (Livro p.154, 158 a 160), nos DOIS sistemas.
 *
 * O que este arquivo prende:
 *   - o pool de cargas é UM por ferramenta, vale o BT, é compartilhado entre os encantamentos dela e volta no descanso;
 *   - a recusa devolve a MESMA sessão, sem carga nem reação gastas;
 *   - o "uma vez por turno" do Distorcivo, a reação única por rodada e o prazo do Ricochete;
 *   - os números (CD, dados, empurrão, redução da Esponja) saem da ficha com fonte;
 *   - os oito de Uniforme e os oito de Escudo são exatamente a lista do recorte e existem no catálogo;
 *   - o escudo que ataca perde a RD até o início do próximo turno.
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
const ATIVOS = await import(R + "afty-encantamentos-ativos.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const US = await import(R + "ficha/ficha-uso-estado.js");
const EN = await import(R + "ficha/ficha-encantamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const op = () => `cx5-enc-${++contador}`;

const uniforme = (encantamentos, extra = {}) => ({
  uid: "u1", tipo: "uniforme", refId: "unif_revestimento_leve", qtd: 1, equipado: true,
  fa: { grau: "primeiro", encantamentos }, ...extra,
});
const escudo = (encantamentos, grau = "primeiro", extra = {}) => ({
  uid: "e1", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true,
  fa: { grau, encantamentos }, ...extra,
});
const fichaCom = (sistema, itens, nd = 10) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "combatente", nivel: nd }];
  f.equipamentos = { itens };
  return f;
};
const mesa = (f, ajuste = {}) => {
  const d = deriveAfty(f);
  return { d, s: { ...SE.sessaoEmBranco(d), rodada: 1, ...ajuste } };
};
const novoTurno = (s, d) => SE.iniciaTurnoFicha(s, d);
const novaRodada = (s, d) => SE.proximaRodada(s, d).sessao;

/* ------------------------------------------------------------ A. A lista do recorte e o catálogo */
{
  const uni = ["enc_unif_aeronauta", "enc_unif_distorcivo", "enc_unif_escaldante", "enc_unif_estimulante", "enc_unif_impulso", "enc_unif_repulsor", "enc_unif_revestido_espinhos", "enc_unif_ricochete"];
  const esc = ["enc_esc_avassalador", "enc_esc_bloqueador", "enc_esc_destruidor", "enc_esc_disco", "enc_esc_espinhoso", "enc_esc_esponja", "enc_esc_expansao", "enc_esc_intangivel"];
  t("a tabela cobre exatamente os 16", [...ATIVOS.IDS_ATIVOS].sort(), [...uni, ...esc].sort());
  const catalogo = new Set([...EQ.ENCANTAMENTOS_UNIFORME, ...EQ.ENCANTAMENTOS_ESCUDO].map((e) => e.id));
  t("todos existem no catálogo", ATIVOS.IDS_ATIVOS.filter((id) => !catalogo.has(id)), []);
  t("os oito de uniforme são de uniforme", uni.every((id) => ATIVOS.encantamentoAtivo(id).tipo === "uniforme"), true);
  t("os oito de escudo são de escudo", esc.every((id) => ATIVOS.encantamentoAtivo(id).tipo === "escudo"), true);
  const comCargasNoCatalogo = EQ.ENCANTAMENTOS_UNIFORME.filter((e) => e.usaCargas).map((e) => e.id).sort();
  t("quem tem cargas no catálogo tem cargas na tabela, e só eles",
    ATIVOS.IDS_ATIVOS.filter((id) => ATIVOS.encantamentoAtivo(id).cargas).sort(), comCargasNoCatalogo);
}

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;

  /* ------------------------------------------------------------ B. O pool de cargas */
  {
    const f = fichaCom(sistema, [uniforme(["enc_unif_distorcivo", "enc_unif_estimulante", "enc_unif_repulsor", "enc_unif_ricochete"])]);
    const { d, s } = mesa(f);
    const [cargas] = EN.resumoDeCargas(d, s);
    t(tag("o pool vale o BT e começa cheio"), [cargas.max, cargas.gastas, cargas.restantes], [4, 0, 4]);
    t(tag("o pool é um só para os quatro encantamentos"), cargas.encantamentos.length, 4);

    const a = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_distorcivo", opId: op() });
    t(tag("Distorcivo gasta uma carga"), [a.aplicado, a.cargas.restantes, a.resultado.deslocamento, a.resultado.semAtaqueDeOportunidade], [true, 3, 6, true]);
    const outraVez = EN.usaEncantamento(a.sessao, d, { uid: "u1", encId: "enc_unif_distorcivo", opId: op() });
    t(tag("uma vez por turno: a segunda recusa e NÃO gasta carga"), [outraVez.aplicado, outraVez.erro, outraVez.sessao === a.sessao], [false, "Já Usado Neste Turno", true]);
    const noutroTurno = EN.usaEncantamento(novaRodada(a.sessao, d), d, { uid: "u1", encId: "enc_unif_distorcivo", opId: op() });
    t(tag("na rodada seguinte volta a poder"), [noutroTurno.aplicado, noutroTurno.cargas?.restantes], [true, 2]);

    const mesmoId = op();
    const x1 = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_repulsor", opId: mesmoId });
    const x2 = EN.usaEncantamento(x1.sessao, d, { uid: "u1", encId: "enc_unif_repulsor", opId: mesmoId });
    t(tag("o mesmo opId devolve repetida e a mesma sessão"), [x2.aplicado, x2.repetida, x2.sessao === x1.sessao], [false, true, true]);

    // Quatro cargas compartilhadas: Estimulante, Repulsor, Ricochete e Distorcivo, cada um numa rodada para a reação não segurar.
    let sx = s;
    const usos = [];
    for (const encId of ["enc_unif_estimulante", "enc_unif_repulsor", "enc_unif_ricochete", "enc_unif_distorcivo"]) {
      const parametros = encId === "enc_unif_estimulante" ? { tr: "vontade" } : {};
      const r = EN.usaEncantamento(sx, d, { uid: "u1", encId, opId: op(), parametros });
      usos.push(r.aplicado);
      sx = novaRodada(r.sessao, d);
    }
    t(tag("quatro usos consomem as quatro cargas do pool"), [usos, EN.resumoDeCargas(d, sx)[0].restantes], [[true, true, true, true], 0]);
    const sem = EN.usaEncantamento(sx, d, { uid: "u1", encId: "enc_unif_repulsor", opId: op() });
    t(tag("sem cargas recusa"), [sem.aplicado, sem.erro, sem.codigo, sem.sessao === sx], [false, "Sem Cargas", "sem-cargas", true]);
    const depois = SE.descansar(sx, d);
    t(tag("o descanso devolve todas as cargas"), EN.resumoDeCargas(d, depois)[0].restantes, 4);
  }

  /* ------------------------------------------------------------ C. Reação, parâmetro e acesso */
  {
    const f = fichaCom(sistema, [uniforme(["enc_unif_estimulante", "enc_unif_repulsor", "enc_unif_ricochete", "enc_unif_aeronauta"])]);
    const { d, s } = mesa(f);
    const sem = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_estimulante", opId: op() });
    t(tag("Estimulante sem o TR escolhido recusa"), [sem.aplicado, sem.erro], [false, "Falta Teste de Resistência"]);
    const ruim = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_estimulante", opId: op(), parametros: { tr: "integridade" } });
    t(tag("e só Fortitude, Reflexos ou Vontade"), ruim.erro, "Teste de Resistência Inválido");
    const e = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_estimulante", opId: op(), parametros: { tr: "reflexos" } });
    t(tag("Estimulante dá vantagem no TR escolhido, gasta carga e reação"), [e.aplicado, e.resultado.vantagemEm, e.cargas.restantes, US.usoDe(e.sessao).acoes.reacoes["enc:enc_unif_estimulante:u1"]], [true, "reflexos", 3, 1]);
    const r = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_repulsor", opId: op() });
    t(tag("Repulsor: CD da ficha, raio 1,5, empurra 3 (1,5 se passar)"), [r.resultado.cd, r.resultado.raio, r.resultado.empurra, r.resultado.empurraNoSucesso, r.resultado.tr], [d.cd, 1.5, 3, 1.5, "fortitude"]);
    t(tag("a CD é a mesma que a ficha mostra"), r.resultado.cd, d.cd);

    const guardado = fichaCom(sistema, [uniforme(["enc_unif_repulsor"], { equipado: false })]);
    const g = mesa(guardado);
    t(tag("equipamento guardado não usa o encantamento"), EN.usaEncantamento(g.s, g.d, { uid: "u1", encId: "enc_unif_repulsor", opId: op() }).erro, "Equipamento Guardado");
    const semEnc = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_distorcivo", opId: op() });
    t(tag("a ferramenta que não tem o encantamento recusa"), semEnc.erro, "Ferramenta Sem o Encantamento");
    const fantasma = EN.usaEncantamento(s, d, { uid: "zzz", encId: "enc_unif_repulsor", opId: op() });
    t(tag("uid desconhecido recusa"), fantasma.erro, "Ferramenta Não Encontrada");
    t(tag("sem opId recusa"), EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_repulsor" }).codigo, "sem-opid");

    // Impulso exige Propulsor: o catálogo marca o pré-requisito e a ficha o respeita.
    const semPropulsor = fichaCom(sistema, [uniforme(["enc_unif_impulso"])]);
    const sp = mesa(semPropulsor);
    t(tag("Impulso sem Propulsor não atende o pré-requisito"), EN.usaEncantamento(sp.s, sp.d, { uid: "u1", encId: "enc_unif_impulso", opId: op() }).erro, "Pré-Requisito Não Atendido");
    const comPropulsor = fichaCom(sistema, [uniforme(["enc_unif_impulso", "enc_unif_propulsor"])]);
    const cp = mesa(comPropulsor);
    const imp = EN.usaEncantamento(cp.s, cp.d, { uid: "u1", encId: "enc_unif_impulso", opId: op() });
    t(tag("Impulso com Propulsor: linha de duas vezes o movimento, 1d10 a cada 6 m"), [imp.aplicado, imp.resultado.linha, imp.resultado.dano, imp.resultado.porMetros], [true, 2 * cp.d.movimento, "1d10", 6]);
    t(tag("o TR do Impulso é Reflexos contra a CD da ficha do portador (decisão do autor)"), [imp.resultado.tr, imp.resultado.cd], ["reflexos", cp.d.cd]);

    // Gatilhos passivos não têm operação.
    const passivo = fichaCom(sistema, [uniforme(["enc_unif_escaldante", "enc_unif_revestido_espinhos"])]);
    const ps = mesa(passivo);
    t(tag("Escaldante é gatilho passivo, sem operação"), EN.usaEncantamento(ps.s, ps.d, { uid: "u1", encId: "enc_unif_escaldante", opId: op() }).erro, "Gatilho Passivo");
    const esc = EN.numerosDoEncantamento(ps.d, "u1", "enc_unif_escaldante");
    t(tag("Escaldante: metade do BT em d6, CD da ficha, refaz no início do turno"), [esc.dados, esc.faces, esc.cd, esc.refazNoInicioDoTurno], [2, 6, ps.d.cd, true]);
    t(tag("o TR do Escaldante é Fortitude (decisão do autor)"), esc.tr, "fortitude");
    const esp = EN.numerosDoEncantamento(ps.d, "u1", "enc_unif_revestido_espinhos");
    t(tag("Espinhos: BT em d6 mais o modificador de Constituição, perfurante"), [esp.dados, esp.faces, esp.fixo, esp.tipo, esp.cd], [4, 6, ps.d.mods.constituicao, "perfurante", ps.d.cd]);
  }

  /* ------------------------------------------------------------ D. Ricochete */
  {
    const f = fichaCom(sistema, [uniforme(["enc_unif_ricochete"])]);
    const { d, s } = mesa(f);
    t(tag("sem carga gasta a chance é 20% (2 ou menos no d10)"), EN.chanceDeRicochete(s, d), { chance: 20, d10AteOu: 2, elevado: false });
    const r = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_ricochete", opId: op() });
    t(tag("a reação com carga sobe para 50% (5 ou menos)"), EN.chanceDeRicochete(r.sessao, d), { chance: 50, d10AteOu: 5, elevado: true });
    t(tag("d10 de 4 falha a 50% e não a 20%"), [EN.rolaRicochete(r.sessao, d, { rng: () => 0.35 }).falhou, EN.rolaRicochete(s, d, { rng: () => 0.35 }).falhou], [true, false]);
    t(tag("d10 de 2 falha nos dois"), [EN.rolaRicochete(r.sessao, d, { rng: () => 0.15 }).falhou, EN.rolaRicochete(s, d, { rng: () => 0.15 }).falhou], [true, true]);
    t(tag("d10 de 6 não falha em nenhum"), [EN.rolaRicochete(r.sessao, d, { rng: () => 0.55 }).falhou, EN.rolaRicochete(s, d, { rng: () => 0.55 }).falhou], [false, false]);
    const proximo = novoTurno(r.sessao, d);
    t(tag("os 50% caem no início do próximo turno"), EN.chanceDeRicochete(proximo, d).chance, 20);
    const segunda = EN.usaEncantamento(r.sessao, d, { uid: "u1", encId: "enc_unif_ricochete", opId: op() });
    t(tag("não renova enquanto vale"), [segunda.aplicado, segunda.erro], [false, "Já Ativo"]);
    const sem = fichaCom(sistema, [uniforme(["enc_unif_distorcivo"])]);
    const ss = mesa(sem);
    t(tag("sem Ricochete não há chance nem rolagem"), [EN.chanceDeRicochete(ss.s, ss.d), EN.rolaRicochete(ss.s, ss.d)], [null, null]);
  }

  /* ------------------------------------------------------------ E. Escudo: Esponja, Expansão, ataque e RD */
  {
    const f = fichaCom(sistema, [escudo(["enc_esc_espinhoso", "enc_esc_destruidor", "enc_esc_avassalador"])]);
    const { d, s } = mesa(f);
    const comEsponja = mesa(fichaCom(sistema, [escudo(["enc_esc_esponja", "enc_esc_expansao"])]));
    const grande = EN.usaEsponja(comEsponja.s, comEsponja.d, { uid: "e1", dano: 35, opId: op() });
    t(tag("Esponja de Primeiro Grau absorve 20"), [grande.aplicado, grande.resultado.reducao, grande.resultado.danoFinal], [true, 20, 15]);
    const pouco = EN.usaEsponja(comEsponja.s, comEsponja.d, { uid: "e1", dano: 12, opId: op() });
    t(tag("e não absorve mais que o dano"), [pouco.resultado.reducao, pouco.resultado.danoFinal], [12, 0]);
    const segundoGrau = fichaCom(sistema, [escudo(["enc_esc_esponja"], "segundo")]);
    const sg = mesa(segundoGrau);
    t(tag("de Segundo Grau absorve 15"), EN.usaEsponja(sg.s, sg.d, { uid: "e1", dano: 99, opId: op() }).resultado.reducao, 15);
    const terceiro = fichaCom(sistema, [escudo(["enc_esc_esponja"], "terceiro")]);
    const tr = mesa(terceiro);
    t(tag("de Terceiro Grau absorve 10"), EN.usaEsponja(tr.s, tr.d, { uid: "e1", dano: 99, opId: op() }).resultado.reducao, 10);
    const semConfirma = EN.usaEncantamento(comEsponja.s, comEsponja.d, { uid: "e1", encId: "enc_esc_esponja", opId: op() });
    t(tag("a mesa confirma que é queda ou estrutura"), [semConfirma.aplicado, semConfirma.erro], [false, "Queda ou Dano de Estrutura"]);
    const duas = EN.usaEsponja(grande.sessao, comEsponja.d, { uid: "e1", dano: 10, opId: op() });
    t(tag("uma reação por rodada: a segunda recusa"), [duas.aplicado, duas.erro], [false, "Reação Já Usada Nesta Rodada"]);

    const exp = EN.usaEncantamento(comEsponja.s, comEsponja.d, { uid: "e1", encId: "enc_esc_expansao", opId: op() });
    t(tag("Expansão de Escudo é ação bônus, dura a cena"), [exp.aplicado, US.usoDe(exp.sessao).ativos["enc:enc_esc_expansao:e1"]?.duracao], [true, { tipo: "cena" }]);

    // Dano do ataque do escudo: Escudo Médio (1d6), o MAIOR dos níveis vale (3).
    const dano = EN.danoDoEscudoAtacando(d, "e1");
    t(tag("o ataque conta o maior nível entre Espinhoso, Destruidor e Avassalador"), [dano.base, dano.niveis, dano.tipo], ["1d6", 3, "im"]);
    t(tag("o dado sobe pela escada só no jogador"), dano.dado, sistema === "player" ? "1d12" : null);
    const so = fichaCom(sistema, [escudo(["enc_esc_espinhoso"])]);
    const sso = mesa(so);
    t(tag("só Espinhoso sobe um nível"), EN.danoDoEscudoAtacando(sso.d, "e1").niveis, 1);
    const nenhum = fichaCom(sistema, [escudo([])]);
    t(tag("sem encantamento o dado não sobe"), EN.danoDoEscudoAtacando(mesa(nenhum).d, "e1").niveis, 0);

    // Atacar com o escudo suspende a RD até o início do próximo turno.
    t(tag("o escudo começa fornecendo RD"), EN.escudoSuspenso(s, "e1"), false);
    const ataque = EN.atacaComEscudo(s, d, { uid: "e1", opId: op() });
    t(tag("atacar com o escudo o deixa sem RD"), [ataque.aplicado, ataque.rdSuspensa, EN.escudoSuspenso(ataque.sessao, "e1")], [true, true, true]);
    t(tag("e a RD volta no início do próximo turno"), EN.escudoSuspenso(novoTurno(ataque.sessao, d), "e1"), false);
    const guardadoEsc = mesa(fichaCom(sistema, [escudo([], "primeiro", { equipado: false })]));
    t(tag("escudo guardado não ataca"), EN.atacaComEscudo(guardadoEsc.s, guardadoEsc.d, { uid: "e1", opId: op() }).erro, "Equipamento Guardado");
    t(tag("o ataque do escudo não é um encantamento a usar"), EN.usaEncantamento(s, d, { uid: "e1", encId: "enc_esc_destruidor", opId: op() }).erro, "Ataque do Escudo");

    // Bloqueador, Disco e Intangível são passivos de escudo.
    const passivos = mesa(fichaCom(sistema, [escudo(["enc_esc_bloqueador", "enc_esc_disco", "enc_esc_intangivel"])]));
    t(tag("Disco: arremesso 6/18"), EN.numerosDoEncantamento(passivos.d, "e1", "enc_esc_disco").arremesso, { alcance: 6, maximo: 18 });
    t(tag("Intangível libera a mão para as habilidades"), EN.escudoIntangivelEquipado(passivos.d), true);
    t(tag("o escudo sem Intangível ocupa a mão"), EN.escudoIntangivelEquipado(d), false);
    t(tag("Bloqueador: meia cobertura a 1,5 m, efeito em outra criatura"), EN.numerosDoEncantamento(passivos.d, "e1", "enc_esc_bloqueador").meiaCoberturaAtras, 1.5);
  }

  /* ------------------------------------------------------------ F. Persistência */
  {
    const f = fichaCom(sistema, [uniforme(["enc_unif_distorcivo", "enc_unif_repulsor"])]);
    const { d, s } = mesa(f);
    const r = EN.usaEncantamento(s, d, { uid: "u1", encId: "enc_unif_repulsor", opId: "persiste-enc" });
    const volta = SE.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d);
    t(tag("as cargas gastas sobrevivem ao ida e volta em JSON"), EN.resumoDeCargas(d, volta)[0].gastas, 1);
    t(tag("e a identidade da operação também"), EN.usaEncantamento(volta, d, { uid: "u1", encId: "enc_unif_repulsor", opId: "persiste-enc" }).repetida, true);
    t(tag("ficha sem sessão de itens antiga lê cheio"), EN.resumoDeCargas(d, SE.sessaoEmBranco(d))[0].restantes, 4);
  }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
