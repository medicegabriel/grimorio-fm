// CX3, frente Aptidões e Treinos (Claude). Livro p.179, Expandir Aura (alcance em p.174 e p.177).
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { usaExpandirAura, alcancesDasAurasPassivas, auraExpandida } = await import(R + "ficha/ficha-conteudo-expandir-aura.js");
const { usaConcentrarAura } = await import(R + "ficha/ficha-conteudo-concentrar-aura.js");
const { pagaManutencao } = await import(R + "ficha/ficha-uso.js");
const N = await import(R + "afty-conteudo-auras.js");
let ok = 0, seq = 0;
const erros = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(n + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
const p = () => ({ opId: "expandir-aura-" + ++seq });
aplicarAddons([]);
const inicio = (d) => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });

function ficha(sistema, id, apts, au = 3) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.id = id; c.name = id; c.core.nd = 12; c.attrMethod = "fixos";
  c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 18 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.aptidoes = { cl: 0, er: 0, au, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = apts;
  return c;
}

// Números puros do Livro.
t("dobro do alcance", [1.5, 4.5].map(N.dobraAlcance), [3, 9]);
t("Aura Movediça escalona por nível: 1,5 m, 3 m no 2, 4,5 m no 4 e 6 m no 5", [0, 1, 2, 3, 4, 5].map(N.alcanceDaAuraMovedica), [1.5, 1.5, 3, 3, 4.5, 6]);
t("custo do Livro: 2 PE para expandir e 1 PE por rodada depois da primeira", N.CUSTO_EXPANDIR_AURA, { ativar: 2, manter: 1 });
t("a tabela de alcance só tem o que o texto numera e cita a página", Object.entries(N.ALCANCES_DE_AURA_PASSIVA).map(([id, a]) => [id, a.base, a.pagina]),
  [["aura_chamativa", 4.5, 174], ["aura_do_bastiao", 4.5, 174], ["aura_macabra", 1.5, 177]]);

for (const sistema of ["player", "afty"]) {
  const teste = (n, a, b) => t(sistema + " " + n, a, b);
  const apts = ["expandir_aura", "aura_do_bastiao", "aura_macabra", "aura_chamativa", "aura_movedica", "concentrar_aura"];
  const c = ficha(sistema, "a", apts), sem = ficha(sistema, "b", ["aura_do_bastiao"]);
  const d0 = deriveAfty(c), dsem = deriveAfty(sem);
  const s = inicio(d0);
  const re = (sessao) => deriveAfty({ ...c, combate: sessao.combate, buffsSessao: sessao.buffs });
  const e = { emSeuTurno: true };

  teste("as cinco Aptidões estão disponíveis com Presença 18", apts.every((id) => d0.aptidao.disponiveisConteudo.includes(id)), true);
  const antes = alcancesDasAurasPassivas(s, d0);
  teste("antes de expandir, o alcance é o do Livro", antes.map((a) => [a.id, a.base, a.atual, a.expandido]),
    [["aura_chamativa", 4.5, 4.5, false], ["aura_do_bastiao", 4.5, 4.5, false], ["aura_macabra", 1.5, 1.5, false], ["aura_movedica", 3, 3, false]]);

  teste("sem a Aptidão", usaExpandirAura(s, dsem, e, p()).erro, "Expandir Aura Indisponível");
  teste("fora do seu turno", [usaExpandirAura(s, d0, { emSeuTurno: false }, p()).aplicado, usaExpandirAura(s, d0, {}, p()).erro], [false, "Expandir Aura Exige Seu Turno"]);
  teste("o turno já encerrado também recusa", usaExpandirAura({ ...s, especializacaoSessao: { ...s.especializacaoSessao, turno: 2, turnoEncerrado: 2 } }, d0, e, p()).erro, "Expandir Aura Exige Seu Turno");
  teste("fora de combate", usaExpandirAura(S.sessaoEmBranco(d0), d0, e, p()).erro, "Pede Em Combate");
  teste("incapacitado não age", usaExpandirAura({ ...s, condicoes: ["Atordoado"] }, d0, e, p()).erro, "Atordoado Impede");

  const id = p(), uso = usaExpandirAura(s, d0, e, id);
  if (!uso.aplicado) throw Error(uso.erro);
  teste("Livre sem gastar ação base e custo de 2 PE só avisado na cobrança manual",
    [uso.sessao.uso.acoes.livres.expandir_aura, uso.sessao.uso.acoes.gastas, uso.custo.pe.pedido, uso.custo.pe.naoDescontado, uso.sessao.peAtual], [1, s.uso.acoes.gastas, 2, 2, s.peAtual]);
  teste("o uso ativo é de manutenção de 1 PE", [uso.sessao.uso.ativos.expandir_aura.duracao.tipo, uso.sessao.uso.ativos.expandir_aura.manutencao], ["manutencao", { pe: 1, mantidas: 0, devidas: 0 }]);
  teste("repetir a identidade é inerte", usaExpandirAura(uso.sessao, d0, e, id).repetida, true);
  teste("já ativa, outra expansão é recusada", usaExpandirAura(uso.sessao, d0, e, p()).erro, "Já Ativo");
  teste("a aura está expandida", auraExpandida(uso.sessao), true);

  const depois = alcancesDasAurasPassivas(uso.sessao, d0);
  teste("expandida: Chamativa, Bastião e Macabra dobram e a Movediça fica de fora com o motivo do Livro",
    depois.map((a) => [a.id, a.base, a.atual, a.expandido, a.motivo ?? null]),
    [["aura_chamativa", 4.5, 9, true, null], ["aura_do_bastiao", 4.5, 9, true, null], ["aura_macabra", 1.5, 3, true, null],
      ["aura_movedica", 3, 3, false, "A Área Não Pode Ser Aumentada por Expandir Aura"]]);

  const pago = usaExpandirAura(s, d0, { ...e, descontarPE: true }, p());
  teste("cobrança confirmada debita os 2 PE", [pago.sessao.peAtual, pago.custo.pe.cobrado], [s.peAtual - 2, 2]);
  const pobre = usaExpandirAura({ ...s, peAtual: 1 }, d0, { ...e, descontarPE: true }, p());
  teste("PE insuficiente recusa na cobrança confirmada", [pobre.aplicado, pobre.erro], [false, "Faltam 1 PE"]);

  // Concentrar Aura suspende uma passiva por uma rodada, e a suspensa não expande.
  const conc = usaConcentrarAura(s, d0, { auras: ["aura_macabra"], emSeuTurno: true }, p());
  if (!conc.aplicado) throw Error(conc.erro);
  const dConc = re(conc.sessao);
  const comAmbos = usaExpandirAura(conc.sessao, dConc, e, p());
  if (!comAmbos.aplicado) throw Error(comAmbos.erro);
  const ambos = alcancesDasAurasPassivas(comAmbos.sessao, dConc);
  teste("a passiva que Concentrar Aura desligou não expande", ambos.find((a) => a.id === "aura_macabra"), { id: "aura_macabra", nome: "Aura Macabra", base: 1.5, atual: 1.5, expandido: false, suspensa: true, pagina: 177 });
  teste("as outras seguem expandidas", ambos.filter((a) => a.expandido).map((a) => a.id), ["aura_chamativa", "aura_do_bastiao"]);

  // Manutenção: a virada marca 1 PE devido, pagar zera a devida, e o uso continua.
  const v = S.proximaRodada(uso.sessao, d0);
  teste("a rodada seguinte marca 1 PE devido", v.registro?.manutencaoDevida?.map((x) => [x.id, x.valor, x.devidas]), [["expandir_aura", 1, 1]]);
  const pg = pagaManutencao(v.sessao, d0, "expandir_aura", p());
  teste("pagar a manutenção de 1 PE mantém a expansão", [pg.aplicado, pg.sessao.uso.ativos.expandir_aura.manutencao, auraExpandida(pg.sessao)], [true, { pe: 1, mantidas: 1, devidas: 0 }, true]);
  teste("a expansão continua enquanto a mesa não a encerra", auraExpandida(v.sessao), true);
  teste("sem manutenção paga os alcances retornam à base", alcancesDasAurasPassivas(v.sessao, d0).map((a) => a.atual), [4.5, 4.5, 1.5, 3]);
  teste("o pagamento volta a dobrar as passivas", alcancesDasAurasPassivas(pg.sessao, d0).map((a) => a.atual), [9, 9, 3, 3]);

  // Salvar e recarregar.
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(uso.sessao)), d0);
  teste("recarregar conserva a expansão", alcancesDasAurasPassivas(lida, d0).find((a) => a.id === "aura_do_bastiao").atual, 9);
  teste("sem a Aptidão nenhuma linha de alcance aparece para o que não há", alcancesDasAurasPassivas(s, dsem).map((a) => a.id), ["aura_do_bastiao"]);
  teste("o derive não depende do uso ativo", re(uso.sessao).aptidao.disponiveisConteudo.includes("expandir_aura"), true);
}

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; } else console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
