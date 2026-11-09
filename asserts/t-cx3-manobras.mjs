import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { deslocaAlvoTalento, usaMovimentosAcrobaticos, preparaOportunidadeConteudo } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { acoesDisponiveis } = await import(R + "ficha/ficha-acoes.js");
const { rerrolaDanoTalento, usaEspecializacaoConteudo } = await import(R + "ficha/ficha-conteudo-uso.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { usa } = await import(R + "ficha/ficha-uso.js");
let ok = 0, seq = 0;
const bad = [], t = (nome, real, esperado) => JSON.stringify(real) === JSON.stringify(esperado) ? ok++ : bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
const p = () => ({ opId: `cx3-manobra-${++seq}`, registraAcao: true });
const ficha = (sistema) => {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.id = "cx3-dono"; c.name = "CX3 Manobras"; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { destreza: 2, forca: 1 } }; c.attrNivel.destreza = 3;
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { acrobacia: "treinado", feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  aplicarAddons([]); return c;
};
const deriveSessao = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
function acerto(c, arma, alvoC) {
  if (arma !== "basico") c.equipamentos.itens = [{ uid: "cx3-arma", tipo: "arma", refId: arma, qtd: 1, equipado: true }];
  const d = deriveAfty(c), da = deriveAfty(alvoC), linha = d.dano.entradas.find((l) => l.id === arma);
  let s = S.iniciaCombate(S.sessaoEmBranco(d), d), sa = S.iniciaCombate(S.sessaoEmBranco(da), da);
  const ataque = rolarTeste({ rotulo: "Ataque", bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.999);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.5);
  s = S.registraRolagem(S.registraRolagem(s, ataque), dano);
  const r = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: ataque.id, danoId: dano.id, alvoId: alvoC.id }, p());
  if (!r.aplicado) throw new Error(r.erro);
  return { s: r.sessao, sa: r.sessaoAlvo, d, da, ataque, dano, linha };
}
for (const sistema of ["player", "afty"]) {
  const alvoC = ficha(sistema); alvoC.id = "cx3-alvo";
  for (const [talento, arma] of [["tal_mestre_dos_chicotes", "arm_chicote"], ["tal_especialista_em_concussao", "basico"]]) {
    const c = ficha(sistema); c.talentos = [talento];
    const { s, sa, d, da, ataque } = acerto(c, arma, alvoC);
    t(`${sistema} ${talento} acessível`, d.talentos.inacessiveis, []);
    const entrada = { talento, ataqueId: ataque.id, alvoId: alvoC.id, distancia: 3, espacoDesocupado: true, rng: () => 0 };
    const pedido = p(), r = deslocaAlvoTalento(s, d, sa, da, entrada, pedido);
    if (!r.aplicado) throw new Error(`${sistema} ${talento}: ${r.erro}`);
    t(`${sistema} ${talento} deslocamento real registrado`, [r.aplicado, r.deslocamento, r.sessaoAlvo.log[0].deslocamento], [true, 3, 3]);
    t(`${sistema} ${talento} não cria penalidade de movimento`, r.sessaoAlvo.buffs, sa.buffs);
    t(`${sistema} ${talento} não repete operação`, deslocaAlvoTalento(r.sessao, d, r.sessaoAlvo, da, entrada, pedido).repetida, true);
    t(`${sistema} ${talento} uma vez por turno`, deslocaAlvoTalento(r.sessao, d, r.sessaoAlvo, da, entrada, p()).aplicado, false);
    t(`${sistema} ${talento} alvo trocado recusado`, deslocaAlvoTalento(s, d, sa, da, { ...entrada, alvoId: "outro" }, p()).sessao === s, true);
    t(`${sistema} ${talento} distância inválida não consome`, deslocaAlvoTalento(s, d, sa, da, { ...entrada, distancia: 4 }, p()).sessao === s, true);
    const novoTurno = S.iniciaTurnoFicha(s, d);
    t(`${sistema} ${talento} acerto antigo não serve`, deslocaAlvoTalento(novoTurno, d, sa, da, entrada, p()).aplicado, false);
    const relida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d);
    t(`${sistema} ${talento} limite persiste`, deslocaAlvoTalento(relida, d, r.sessaoAlvo, da, entrada, p()).aplicado, false);
    const focada = usa(sa, da, { id: "foco-manobra", nome: "Foco da Manobra", duracao: { ate: "cena" }, concentracao: true }, p()).sessao;
    const movida = deslocaAlvoTalento(s, d, focada, da, entrada, p());
    t(`${sistema} ${talento} movimento abre concentração com CD nativa`, [movida.sessaoAlvo.uso.teste.cd, movida.sessaoAlvo.uso.teste.causa], [8, "movido"]);
    t(`${sistema} ${talento} não resolve concentração sozinho`, movida.sessaoAlvo.uso.concentracao.id, "foco-manobra");
    const parada = deslocaAlvoTalento(s, d, focada, da, { ...entrada, distancia: 0 }, p());
    t(`${sistema} ${talento} zero metros não ameaça concentração`, parada.sessaoAlvo.uso.teste, null);
    if (talento === "tal_mestre_dos_chicotes") {
      const resiste = deslocaAlvoTalento(s, d, sa, da, { ...entrada, rng: () => 0.999 }, p());
      t(`${sistema} chicote usa Fortitude e CD corretos`, [r.rolagem.rotulo, r.rolagem.cd], ["Fortitude", d.cd]);
      t(`${sistema} sucesso não puxa`, [resiste.rolagem.sucesso, resiste.deslocamento], [true, 0]);
      t(`${sistema} chicote resistido não ameaça concentração`, deslocaAlvoTalento(s, d, focada, da, { ...entrada, rng: () => 0.999 }, p()).sessaoAlvo.uso.teste, null);
    } else {
      t(`${sistema} Concussão exige espaço livre`, deslocaAlvoTalento(s, d, sa, da, { ...entrada, espacoDesocupado: false }, p()).aplicado, false);
      t(`${sistema} Concussão barra duas categorias maiores`, deslocaAlvoTalento(s, d, sa, { ...da, tamanho: "enorme" }, entrada, p()).aplicado, false);
      t(`${sistema} Concussão admite uma categoria maior`, deslocaAlvoTalento(s, d, sa, { ...da, tamanho: "grande" }, entrada, p()).aplicado, true);
      const zerado = { ...s, log: s.log.map((r) => r.rotulo === "Ataque Confirmado" ? { ...r, calculos: r.calculos.map((c) => ({ ...c, final: 0 })) } : r) };
      t(`${sistema} impacto todo absorvido não desloca`, deslocaAlvoTalento(zerado, d, sa, da, entrada, p()).aplicado, false);
    }
  }
  const c = ficha(sistema); c.talentos = ["tal_movimentos_acrobaticos"];
  const d = deriveAfty(c); let s = S.iniciaCombate(S.sessaoEmBranco(d), d);
  s = S.defineCondicoes(s, [{ id: "queda-1", nome: "Caído" }, { id: "cego", nome: "Cego" }]);
  const entrada = { origem: "tecnica", dificuldade: 10, rng: () => 0.999 }, pedido = p();
  const r = usaMovimentosAcrobaticos(s, deriveSessao(c, s), entrada, pedido);
  t(`${sistema} Acrobacia acessível`, d.talentos.inacessiveis, []);
  t(`${sistema} levanta só no sucesso e conserva outras condições`, [r.levantou, r.sessao.condicoes.map((c) => c.nome)], [true, ["Cego"]]);
  t(`${sistema} bônus correto de Defesa`, deriveSessao(c, r.sessao).defesa - deriveSessao(c, S.defineCondicoes(s, [{ id: "cego", nome: "Cego" }])).defesa, Math.floor(d.mods.destreza / 2));
  t(`${sistema} duração e ação livre nativas`, [r.sessao.uso.ativos.tal_movimentos_acrobaticos.duracao, r.sessao.uso.acoes.livres.tal_movimentos_acrobaticos], [{ tipo: "rodadas", restantes: 1 }, s.rodada]);
  t(`${sistema} repetir id não levanta de novo`, usaMovimentosAcrobaticos(r.sessao, d, entrada, pedido).repetida, true);
  const falha = usaMovimentosAcrobaticos(s, d, { ...entrada, dificuldade: 99, rng: () => 0 }, p());
  t(`${sistema} falha conserva Caído sem bônus`, [falha.levantou, falha.sessao.condicoes.length, falha.sessao.buffs.length], [false, 2, 0]);
  t(`${sistema} não repete a mesma queda após falha`, usaMovimentosAcrobaticos(falha.sessao, d, entrada, p()).erro, "Queda Já Testada");
  t(`${sistema} sem queda recusa`, usaMovimentosAcrobaticos(S.defineCondicoes(s, []), d, entrada, p()).aplicado, false);
  t(`${sistema} sem origem recusa`, usaMovimentosAcrobaticos(s, d, { dificuldade: 10 }, p()).sessao === s, true);
  const expira = S.proximaRodada(r.sessao, d).sessao;
  t(`${sistema} Defesa expira`, expira.buffs.some((b) => b.nome === "Movimentos Acrobáticos"), false);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d);
  t(`${sistema} bônus e prazo persistem`, [deriveSessao(c, relida).defesa, relida.uso.ativos.tal_movimentos_acrobaticos.duracao], [deriveSessao(c, r.sessao).defesa, { tipo: "rodadas", restantes: 1 }]);

  const perf = ficha(sistema); perf.talentos = ["tal_especialista_em_perfuracao"];
  const ranged = acerto(perf, "arm_arco_curto", alvoC);
  const sAntes = S.iniciaCombate(S.registraRolagem(S.sessaoEmBranco(ranged.d), ranged.dano), ranged.d);
  t(`${sistema} Perfuração recusa ataque a distância`, rerrolaDanoTalento(sAntes, ranged.d, { id: ranged.dano.id, talento: "tal_especialista_em_perfuracao", acertou: true }, p()).aplicado, false);

  for (const fonte of ["manejo", "grupo", "luta"]) {
    const crit = ficha(sistema), arma = fonte === "luta" ? "basico" : "arm_espada_longa";
    crit.equipamentos.itens = [{ uid: "arma", tipo: "arma", refId: "arm_espada_longa", qtd: 1, equipado: true }];
    crit.focosLivres = 15;
    if (fonte === "manejo") crit.treinamentos = { manejo_arma: [{ alvo: arma, progresso: 3 }] };
    if (fonte === "luta") crit.treinamentos = { luta: 4 };
    if (fonte === "grupo") { crit.habilidades = ["cmb_grupo_favorito"]; crit.escolhasHabilidade = { cmb_grupo_favorito: ["cmb_favorito_espada"] }; }
    const d = deriveAfty(crit), efeito = d.dano.entradas.find((l) => l.id === arma)?.efeitoCritico;
    t(`${sistema} concessão crítica por ${fonte}`, efeito?.fontes, [fonte === "manejo" ? "Treino de Manejo de Arma" : fonte === "luta" ? "Treino de Luta" : "Grupo Favorito"]);
    t(`${sistema} ${fonte} não concede outro grupo`, d.dano.entradas.find((l) => l.id === (arma === "basico" ? "arm_espada_longa" : "basico"))?.efeitoCritico, null);
  }
  for (const instintos of [false, true]) {
    const c = ficha(sistema); c.talentos = ["tal_perceber_oportunidade"];
    if (instintos) { c.core.tipo = "restringido"; c.core.origem = { id: "restringido" }; c.especializacoes = [{ id: "restringido", nivel: 20 }]; c.habilidades = ["res_reacao_rapida", "res_instintos_agucados"]; }
    const d = deriveAfty(c), s = S.iniciaCombate(S.sessaoEmBranco(d), d), arma = d.dano.entradas.find((l) => l.id === "basico");
    t(`${sistema} oportunidade com Instintos ${instintos}: acesso`, [d.talentos.inacessiveis, d.habilidades.inacessiveis], [[], []]);
    const entrada = { armaId: arma.id, chaveArma: arma.chaveArma, gatilhoValido: true }, pedido = p();
    const primeira = preparaOportunidadeConteudo(s, d, entrada, pedido);
    t(`${sistema} oportunidade tem vantagem e usa reação`, [primeira.aplicado, primeira.pedidoRolagem.modo, acoesDisponiveis(primeira.sessao, d).reacoes], [true, "vantagem", instintos ? 1 : 0]);
    t(`${sistema} oportunidade não gasta ação Atacar`, acoesDisponiveis(primeira.sessao, d).comum, acoesDisponiveis(s, d).comum);
    t(`${sistema} oportunidade idempotente`, preparaOportunidadeConteudo(primeira.sessao, d, entrada, pedido).repetida, true);
    const segunda = preparaOportunidadeConteudo(primeira.sessao, d, entrada, p());
    t(`${sistema} oportunidade não cria reação`, segunda.aplicado, instintos);
    if (instintos) {
      const rapida = usaEspecializacaoConteudo(segunda.sessao, d, { id: "res_reacao_rapida", descontarPE: true }, p());
      t(`${sistema} Reação Rápida paga dois para outra reação`, [rapida.aplicado, segunda.sessao.peAtual - rapida.sessao.peAtual, acoesDisponiveis(rapida.sessao, d).reacoes], [true, 2, 1]);
      t(`${sistema} Reação Rápida não repete na rodada`, usaEspecializacaoConteudo(rapida.sessao, d, { id: "res_reacao_rapida", descontarPE: true }, p()).sessao === rapida.sessao, true);
      const extra = rapida.sessao;
      t(`${sistema} terceira oportunidade recusa mesmo com saldo`, preparaOportunidadeConteudo(extra, d, entrada, p()).sessao === extra, true);
      const relida = S.normalizaSessao(JSON.parse(JSON.stringify(segunda.sessao)), d);
      t(`${sistema} repetição e saldo persistem`, [relida.usos["rodada:uso:golpe-oportunidade"], acoesDisponiveis(relida, d).reacoes], [2, 0]);
    }
    t(`${sistema} oportunidade cancela desvantagem`, preparaOportunidadeConteudo(s, d, { ...entrada, modo: "desvantagem" }, p()).pedidoRolagem.modo, "normal");
    t(`${sistema} oportunidade exige gatilho`, preparaOportunidadeConteudo(s, d, { ...entrada, gatilhoValido: false }, p()).sessao === s, true);
    const novaRodada = S.proximaRodada(primeira.sessao, d).sessao;
    t(`${sistema} oportunidade volta na rodada`, preparaOportunidadeConteudo(novaRodada, d, entrada, p()).aplicado, true);
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
