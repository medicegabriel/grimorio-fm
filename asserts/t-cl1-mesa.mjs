/* O CL1 NA CAMADA DA MESA DO G2 (2026-10-29): `ficha/efeitos/operacoes-uso.js`.

   Os adaptadores recebem a mesa, rodam o verbo do CL1 e devolvem `{ mesa, erro? }`. Aqui:
     1. recusa devolve a MESMA mesa, sem evento nem ativação;
     2. política manual não cria ativação (nada foi debitado) e diz o que ficou sem descontar;
     3. política confirmada cria a ativação que o Estornar PE devolve, uma vez;
     4. o mesmo opId não aplica duas vezes;
     5. a sessão que volta de `paraSessao` leva o estado de uso e preserva o registro da mesa;
     6. dano, ataque e concentração viram evento legível, sem a frase "sem abater RD" do dano comum. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const G = await import(R + "ficha/efeitos/sessao-g2.js");
const V = await import(R + "ficha/efeitos/mesa-verbos.js");
const M = await import(R + "ficha/efeitos/operacoes-uso.js");
const U = await import(R + "ficha/ficha-uso.js");
const { USO_ARMAS_ABSOLUTAS } = await import(R + "ficha/ficha-uso-clientes.js");
const { resumoDoEvento } = await import(R + "ficha/efeitos/historico-logica.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const c = createBlankAfty();
c.rulesVersion = "player";
c.core = { ...c.core, nd: 14, tipo: "combatente", patamar: "comum" };
c.especializacoes = [{ id: "lutador", nivel: 14 }];
c.habilidades = ["lut_um_com_a_arma", "lut_armas_absolutas"];
c.defesasDano = { ct: { estado: "resistente", rd: 0 } };
const derived = deriveAfty({ ...c, combate: { ativo: true } });
const sessao0 = { ...S.sessaoEmBranco(derived), combate: { ativo: true }, rodada: 1 };
const deps = { derived, rng: () => 0.001 };
const op = () => ({ opId: U.novaOperacao() });
const PARAMS = { escolha: "defesa", armaDedicada: true };

const mesa0 = G.daSessao(sessao0);

// 1. recusa
const recusa = M.usaPelaMesa(mesa0, USO_ARMAS_ABSOLUTAS, { ...op(), parametros: { escolha: "defesa" } }, deps);
t("recusa: devolve a mesma mesa, com o motivo", [recusa.mesa === mesa0, recusa.erro, recusa.codigo], [true, "Empunhando Arma Dedicada", "requisito-nao-confirmado"]);
t("recusa: nenhum evento", mesa0.eventos.length, 0);

// 2. manual
const idUso = op();
const manual = M.usaPelaMesa(mesa0, USO_ARMAS_ABSOLUTAS, { ...idUso, parametros: PARAMS }, deps);
t("manual: aplica", manual.erro, undefined);
t("manual: nenhuma ativação (nada foi debitado)", Object.keys(manual.mesa.ativacoes).length, 0);
t("manual: o evento diz o que ficou sem descontar", manual.mesa.eventos[0].texto, "Armas Absolutas · usou · PE Não Descontado: 2");
t("manual: o resumo do histórico é o texto", resumoDoEvento(manual.mesa.eventos[0]), "Armas Absolutas · usou · PE Não Descontado: 2");
t("manual: a Energia não saiu", manual.mesa.sessao.peAtual, sessao0.peAtual);
const rep = M.usaPelaMesa(manual.mesa, USO_ARMAS_ABSOLUTAS, { ...idUso, parametros: PARAMS }, deps);
t("o mesmo opId não aplica de novo", [rep.erro, rep.repetida, rep.mesa === manual.mesa], ["Já Aplicado", true, true]);

// 3. confirmada: ativação e estorno
const confirmada = { ...USO_ARMAS_ABSOLUTAS, cobranca: "confirmada" };
const conf = M.usaPelaMesa(mesa0, confirmada, { ...op(), parametros: PARAMS }, deps);
const ids = Object.keys(conf.mesa.ativacoes);
t("confirmada: uma ativação de gasto com o que saiu", [ids.length, conf.mesa.ativacoes[ids[0]].tipo, conf.mesa.ativacoes[ids[0]].custo, conf.mesa.ativacoes[ids[0]].pago.reserva], [1, "gasto", 2, 2]);
t("confirmada: o evento é de ativação (o histórico mostra o PE)", [conf.mesa.eventos[0].tipo, resumoDoEvento(conf.mesa.eventos[0])], ["ativacao", "Armas Absolutas · usou · 2 PE"]);
t("confirmada: a Energia caiu 2", conf.mesa.sessao.peAtual, sessao0.peAtual - 2);
const desfeito = V.desfazer(conf.mesa, ids[0], derived);
t("o Estornar PE devolve os 2", desfeito.mesa.sessao.peAtual, sessao0.peAtual);
t("estornar de novo não devolve mais nada", V.desfazer(desfeito.mesa, ids[0], derived).erro, "Já desfeito");

// manutenção e encerramento
const virada = G.paraSessao(manual.mesa);
const noutraRodada = G.daSessao(S.proximaRodada(virada, derived).sessao);
const pg = M.pagaManutencaoPelaMesa(noutraRodada, "lut_armas_absolutas", op(), deps);
t("manutenção manual: evento sem ativação", [pg.mesa.eventos[0].texto, Object.keys(pg.mesa.ativacoes).length], ["Armas Absolutas · manutenção paga · PE Não Descontado: 2", 0]);
t("manutenção sem nada devido recusa e devolve a mesma mesa", [M.pagaManutencaoPelaMesa(pg.mesa, "lut_armas_absolutas", op(), deps).erro, M.pagaManutencaoPelaMesa(pg.mesa, "lut_armas_absolutas", op(), deps).mesa === pg.mesa], ["Nada Devido", true]);
const fim = M.encerraUsoPelaMesa(pg.mesa, "lut_armas_absolutas", op(), deps);
t("encerrar anota e desliga o estado", [fim.mesa.eventos[0].texto, fim.mesa.sessao.combate.armasAbsolutas], ["Armas Absolutas · encerrado", null]);

// 5. a sessão volta com o estado de uso e preserva o registro da mesa
const volta = G.paraSessao(manual.mesa);
t("paraSessao leva o estado de uso", Object.keys(volta.uso.ativos), ["lut_armas_absolutas"]);
t("e leva o registro da mesa junto", [volta.operacoes.eventos.length, Object.keys(volta.operacoes).sort()], [1, ["ativacoes", "encerrados", "eventos", "pvConcessoes", "reusos"]]);
t("daSessao de novo devolve o mesmo estado", G.daSessao(volta).sessao.uso.ativos.lut_armas_absolutas.nome, "Armas Absolutas");

// 6. dano, concentração, ataque
const dano = M.danoRecebidoPelaMesa(mesa0, { tipo: "ct", total: 20 }, op(), deps);
t("dano tipado: o texto mostra a conta e não diz 'sem abater RD'", [/^Dano 20 para \d+ \(ct\) · Resistência 20 para 10/.test(dano.mesa.eventos[0].texto), dano.mesa.eventos[0].texto.includes("sem abater RD")], [true, false]);
t("dano tipado: a conta fica em passos", dano.mesa.eventos[0].passos[0].id, "resistencia");
t("dano tipado recusado devolve a mesma mesa", M.danoRecebidoPelaMesa(mesa0, { tipo: "gravidade", total: 5 }, op(), deps).mesa === mesa0, true);
t("perda de vida vira evento com o rótulo certo", M.danoRecebidoPelaMesa(mesa0, { modo: "perdaDeVida", total: 4 }, op(), deps).mesa.eventos[0].texto.startsWith("Perda de Vida 4 para 4"), true);

const ritual = S.iniciaRitualEstendido(sessao0, "fei_a");
const mesaR = G.daSessao(ritual);
const amea = M.ameacaConcentracaoPelaMesa(mesaR, "dano", { valor: 40 });
t("concentração ameaçada: o evento diz a CD", amea.mesa.eventos[0].texto, "Concentração ameaçada · CD 20");
t("sem concentração a ameaça não faz nada", M.ameacaConcentracaoPelaMesa(mesa0, "dano", { valor: 40 }).semConcentracao, true);
const perdeu = M.testeDeConcentracaoPelaMesa(amea.mesa, { opId: U.novaOperacao() }, { derived, rng: () => 0.001 });
t("o teste rolado com 1 natural perde e cancela o ritual", [perdeu.mesa.eventos[0].texto.startsWith("Concentração perdida"), perdeu.mesa.sessao.ritualAtual], [true, null]);
const informou = M.testeDeConcentracaoPelaMesa(amea.mesa, { total: 25, opId: U.novaOperacao() }, deps);
t("o resultado informado mantém", informou.mesa.eventos[0].texto, "Concentração mantida · 25 contra CD 20");

const ataque = { acertou: true, critico: true, desastre: false, categorias: ["arma", "corpo"] };
const feito = M.ataqueRealizadoPelaMesa(mesa0, ataque, op(), deps);
t("ataque realizado vira evento", feito.mesa.eventos[0].texto, "Ataque acertou · crítico");
const recebido = M.ataqueRecebidoPelaMesa(mesa0, ataque, op(), deps);
t("ataque recebido conta a sequência", recebido.mesa.eventos[0].texto, "Ataque recebido · sequência de 1");
let m = mesa0;
for (let i = 0; i < 4; i += 1) m = M.ataqueRecebidoPelaMesa(m, ataque, op(), deps).mesa;
t("a quarta pancada mostra a Defesa", m.eventos[0].texto, "Ataque recebido · sequência de 4 · Defesa −2");

// o texto de tela não leva o travessão nem o ponto e vírgula
const textos = [manual, conf, pg, fim, dano, amea, perdeu, informou, feito, recebido].map((r) => resumoDoEvento(r.mesa.eventos[0]));
t("nenhum texto de evento tem travessão nem ponto e vírgula", textos.some((x) => new RegExp("[" + String.fromCharCode(0x2014) + ";]").test(x)), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
