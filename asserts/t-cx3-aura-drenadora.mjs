import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { assumePosturaConteudo } = await import(R + "ficha/ficha-conteudo-posturas.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { rolaDragaoConteudo, aplicaDragaoConteudo } = await import(R + "ficha/ficha-conteudo-dragao.js");
const { rolaEmpurraoEscudo, aplicaEmpurraoEscudo } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { drenaAuraAoMatar } = await import(R + "ficha/ficha-conteudo-aura-drenadora.js");
const S = await import(R + "ficha/ficha-sessao.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `aura-drenadora-${++seq}`, registraAcao: true });

function ficha(sistema, aura) {
 const c = createBlankAfty(); c.id = aura ? "atacante" : "alvo"; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
 c.pericias = { atletismo: "mestre", acrobacia: "treinado", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", ...(aura ? ["ger_aptidao"] : [])] : [];
 c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", equipado: true, qtd: 1 }];
 if (aura) {
  c.aptidoes = { cl: 0, er: 0, au: 2, dom: 0, bar: 0 };
  c.aptidoesAmaldicoadas = ["aura_drenadora", "concentrar_aura"];
 }
 return c;
}

const inicia = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const fonte = s => s.pvTempFontes["Aura Drenadora"] ?? 0;
function prestesAMorrer(s, d) {
 s = S.aplicaDano(s, s.hpAtual + 1, d, { ataqueId: "queda" });
 s = S.aplicaDano(s, 1, d, { ataqueId: "falha-1" });
 return S.aplicaDano(s, 1, d, { ataqueId: "falha-2" });
}

function ataque(s, d, sa, da, { alvoId = "alvo", turnoEmCurso = null, inimigo = true, natural = 0.999 } = {}) {
 const linha = d.dano.entradas.find(l => l.id === "arm_espada_curta");
 const desc = prepararRolagem({ tipo: "teste", rotulo: linha.nome, tipoTeste: "ataque", bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, { sessao: s, derived: d });
 if (!desc.ok) throw Error(desc.etapa);
 const a = rolarTeste({ ...desc.pronta, contextoTurno: { ...desc.pronta.contextoTurno, emCurso: turnoEmCurso } }, () => natural);
 const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: a.critico, linhaArma: linha }, () => 0.5);
 const registrado = S.registraRolagem(S.registraRolagem(s, a), dano);
 const entrada = { ataqueId: a.id, danoId: dano.id, alvoId, inimigo, rngAuraDrenadora: () => 0.5 };
 const pedido = p(), r = confirmaAtaqueConteudo(registrado, d, sa, da, entrada, pedido);
 if (!r.aplicado) throw Error(r.erro);
 return { r, a, entrada, pedido };
}

aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
 const c = ficha(sistema, true), d = deriveAfty(c), da = deriveAfty(ficha(sistema, false));
 const s = inicia(d), sa = inicia(da), fatal = prestesAMorrer(sa, da);
 t(`${sistema} Aptidão e origem válidas`, [d.aptidao.disponiveisConteudo.includes("aura_drenadora"), d.aptidao.efetivo.au, d.habilidades.inacessiveis], [true, 2, []]);
 t(`${sistema} vítima tem duas falhas reais`, [fatal.vital.estado, fatal.vital.falhas], ["morrendo", 2]);
 const caida = ataque(s, d, { ...sa, hpAtual: 1 }, da);
 t(`${sistema} queda a 0 não é morte`, [caida.r.sessaoAlvo.vital.estado, fonte(caida.r.sessao)], ["morrendo", 0]);
 const golpe = ataque(s, d, fatal, da), primeiro = golpe.r.sessao, ganho = 10 + d.mods.constituicao;
 t(`${sistema} morte real concede AU d8 + CON`, [golpe.r.sessaoAlvo.vital.estado, fonte(primeiro)], ["morto", ganho]);
 const registro = primeiro.log.find(r => r.rotulo === "Aura Drenadora");
 t(`${sistema} guarda dados e autoria no histórico`, [registro.dados, registro.ataqueId, registro.alvoId, registro.consequenciasAplicadas], [[5, 5], golpe.a.id, "alvo", true]);
 t(`${sistema} sem ação ou custo`, [primeiro.uso.acoes, primeiro.peAtual], [s.uso.acoes, s.peAtual]);
 t(`${sistema} confirmar outra vez não dá mais PV`, confirmaAtaqueConteudo(primeiro, d, fatal, da, golpe.entrada, p()).sessao === primeiro, true);
 t(`${sistema} o mesmo evento não drena por outro cliente`, drenaAuraAoMatar(primeiro, d, fatal, golpe.r.sessaoAlvo, golpe.entrada).sessao === primeiro, true);
 const drenado = S.aplicaDano(primeiro, 4, d);
 const segundo = ataque(drenado, d, fatal, da, { alvoId: "segundo" }).r.sessao;
 t(`${sistema} segundo inimigo acumula sobre o saldo da mesma fonte`, [fonte(drenado), fonte(segundo), segundo.hpAtual], [ganho - 4, ganho * 2 - 4, s.hpAtual]);
 t(`${sistema} persistência da reserva`, fonte(S.normalizaSessao(JSON.parse(JSON.stringify(segundo)), d)), ganho * 2 - 4);
 t(`${sistema} aliado, erro e cadáver não drenam`, [
  fonte(ataque(s, d, fatal, da, { inimigo: false }).r.sessao),
  fonte(ataque(s, d, fatal, da, { natural: 0 }).r.sessao),
  fonte(ataque(s, d, golpe.r.sessaoAlvo, da).r.sessao),
 ], [0, 0, 0]);
 const desativada = atual(c, { ...s, combate: { ...s.combate, concentrarAura: ["aura_drenadora"] } });
 t(`${sistema} Concentrar Aura suspende o ganho`, [desativada.combate.concentrarAura, fonte(ataque(s, desativada, fatal, da).r.sessao)], [["aura_drenadora"], 0]);
 const sem = deriveAfty(ficha(sistema, false));
 t(`${sistema} sem Aptidão a morte não drena`, fonte(ataque(inicia(sem), sem, fatal, da).r.sessao), 0);

 const dragao = ficha(sistema, true); dragao.habilidades = ["cmb_assumir_postura"]; dragao.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_dragao"] };
 const d0 = deriveAfty(dragao), postura = assumePosturaConteudo(inicia(d0), d0, { postura: "dragao" }, p());
 if (!postura.aplicado) throw Error(postura.erro);
 const dd = atual(dragao, postura.sessao), turnoEmCurso = { id: "atacante", rodada: 1, turno: postura.sessao.uso.acoes.turno };
 const original = ataque(postura.sessao, dd, sa, da, { turnoEmCurso });
 const entradaDragao = { ataqueId: original.a.id, voceId: "atacante", alvoId: "secundario", inimigo: true, em1_5mDoAlvo: true, turnoEmCurso, rngAlvo: () => 0, rngAuraDrenadora: () => 0.5 };
 const tr = rolaDragaoConteudo(original.r.sessao, dd, fatal, da, entradaDragao, p());
 if (!tr.aplicado) throw Error(tr.erro);
 const df = aplicaDragaoConteudo(tr.sessao, dd, tr.sessaoAlvo, da, { ...entradaDragao, testeId: tr.rolagem.id }, p());
 t(`${sistema} dano fatal de Dragão atribuído ao atacante`, [df.aplicado, df.sessaoAlvo.vital.estado, fonte(df.sessao)], [true, "morto", ganho]);

 const escudo = ficha(sistema, true); escudo.talentos = ["tal_tecnicas_ofensivas_de_escudo"];
 escudo.equipamentos.itens.push({ uid: "escudo", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true });
 const de = deriveAfty(escudo), se = inicia(de), linha = de.dano.entradas.find(l => l.id === "basico");
 const prova = prepararRolagem({ tipo: "teste", rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, { sessao: se, derived: de });
 const gatilho = rolarTeste(prova.pronta, () => 0);
 const entradaEscudo = { ataqueId: gatilho.id, alvoId: "alvo", emSeuTurno: true, emAlcanceEscudo: true, inimigo: true,
  periciaAlvo: "acrobacia", escolha: "caido", rngAtacante: () => 0.999, rngAlvo: () => 0, rng: () => 0.999, rngAuraDrenadora: () => 0.5 };
 const disputa = rolaEmpurraoEscudo(S.registraRolagem(se, gatilho), de, fatal, da, entradaEscudo, p());
 if (!disputa.aplicado) throw Error(disputa.erro);
 const ef = aplicaEmpurraoEscudo(disputa.sessao, de, disputa.sessaoAlvo, da, entradaEscudo, p());
 t(`${sistema} dano fatal de Escudo atribuído ao atacante`, [ef.aplicado, ef.sessaoAlvo.vital.estado, fonte(ef.sessao)], [true, "morto", ganho]);
}

if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
