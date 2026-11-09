import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { curaNoGasto } = await import(R + "afty-cura.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarDano, rolarTeste } = await import(R + "ficha/ficha-rolagem.js");
const { usaCuraConteudo, usaEspecializacaoConteudo, usaIntervencaoConteudo } = await import(R + "ficha/ficha-conteudo-uso.js");
const { acoesDisponiveis, gastaAcao } = await import(R + "ficha/ficha-acoes.js");
const { pedidoCura } = await import(R + "ficha/abas-g2/rolagens-acoes.js");
const { usaTesteConteudo, usaMentePlacida, rerrolaTesteDeClasse, usaAnaliseProfunda, concluiAnaliseProfunda } = await import(R + "ficha/ficha-conteudo-testes.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const { usa } = await import(R + "ficha/ficha-uso.js");
const { abreTesteDeConcentracao } = await import(R + "ficha/ficha-concentracao.js");
const { aptidaoDeConteudoDisponivel } = await import(R + "ficha/ficha-conteudo-acesso.js");
const { prepararRolagemEspecializacao } = await import(R + "ficha/ficha-especializacoes.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { condicoesPorForca } = await import(R + "afty-condicoes.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { usaMobilidadeAvancada } = await import(R + "ficha/ficha-conteudo-manobras.js");
let ok = 0, seq = 0;
const bad = [], t = (nome, real, esperado) => JSON.stringify(real) === JSON.stringify(esperado) ? ok++ : bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
const p = () => ({ opId: `cx3-classe-${++seq}`, registraAcao: true });
const ficha = (sistema, classe = "combatente") => {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
  c.especializacoes = [{ id: classe, nivel: 20 }]; c.pericias = { medicina: "mestre", feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; aplicarAddons([]); return c;
};
for (const sistema of ["player", "afty"]) {
  for (const [classe, hab, curaId, chave] of [["combatente", "cmb_revigorar", "cura_revigorar", "hab:cmb_revigorar"], ["lutador", "lut_puxar_um_ar", "cura_puxar_um_ar", "cura:cura_puxar_um_ar"]]) {
    const c = ficha(sistema, classe); c.habilidades = [hab];
    if (classe === "lutador") { c.treinamentos = { luta: 3 }; c.focosLivres = 10; }
    const d = deriveAfty(c), linha = d.cura.linhas.find((l) => l.id === curaId); let s = S.iniciaCombate(S.sessaoEmBranco(d), d); s.hpAtual = 1;
    const pedido = p(), r = usaCuraConteudo(s, d, { id: curaId, rng: () => 0.999 }, pedido);
    t(`${sistema} ${hab} disponível`, d.habilidades.inacessiveis, []);
    t(`${sistema} ${hab} cura e usa ação bônus`, [r.aplicado, r.sessao.hpAtual > s.hpAtual, acoesDisponiveis(r.sessao, d).bonus], [true, true, 0]);
    t(`${sistema} ${hab} chave nativa`, r.sessao.usos[chave], 1);
    t(`${sistema} ${hab} sem PE adicional`, r.sessao.peAtual, s.peAtual);
    t(`${sistema} ${hab} não duplica`, usaCuraConteudo(r.sessao, d, { id: curaId }, pedido).repetida, true);
    const esgotada = S.marcaUso(s, { chave, max: linha.usos }, linha.usos);
    t(`${sistema} ${hab} sem usos não cura`, usaCuraConteudo(esgotada, d, { id: curaId }, p()).sessao === esgotada, true);
    t(`${sistema} ${hab} recarrega no descanso único`, S.usosGastosDe(S.descansar(esgotada, d), chave), 0);
    t(`${sistema} ${hab} não cura outro alvo`, usaCuraConteudo(s, d, { id: curaId }, p(), { sessao: s, derived: d }).aplicado, false);
    if (classe === "lutador") {
      const ataque = d.dano.entradas.find((l) => l.id === "basico"), dano = rolarDano({ grupos: ataque.gruposDano }, () => 0.999);
      t(`${sistema} cenário conserva sua escada de dano`, new Set(ataque.gruposDano.map((g) => g.faces)).size > 1, sistema === "player");
      t(`${sistema} Puxar um Ar mantém a rolagem do desarmado`, r.rolagem.total, dano.total);
      t(`${sistema} pedido G2 preserva as mesmas faces`, rolarDano(pedidoCura(linha, curaNoGasto(linha, 1)), () => 0.999).total, dano.total);
      t(`${sistema} hover não achata o dano`, linha.partes[0].texto, ataque.formulaNormal.replace(/ /g, ""));
    }
  }
  const c = ficha(sistema); c.habilidades = ["cmb_surto_de_acao"];
  const d = deriveAfty(c); let s = S.iniciaCombate(S.sessaoEmBranco(d), d); s = gastaAcao(s, d, "comum").sessao;
  const pedido = p(), r = usaEspecializacaoConteudo(s, d, { id: "cmb_surto_de_acao", descontarPE: true }, pedido);
  t(`${sistema} Surto concede ação e paga`, [r.aplicado, acoesDisponiveis(r.sessao, d).comum, s.peAtual - r.sessao.peAtual], [true, 1, 5]);
  t(`${sistema} Surto usa contador original`, r.sessao.usos["hab:cmb_surto_de_acao"], 1);
  t(`${sistema} ação extra é consumida pelo núcleo`, acoesDisponiveis(gastaAcao(r.sessao, d, "comum").sessao, d).comum, 0);
  t(`${sistema} Surto repetido é idempotente`, usaEspecializacaoConteudo(r.sessao, d, { id: "cmb_surto_de_acao", descontarPE: true }, pedido).repetida, true);
  t(`${sistema} segunda tentativa não paga nem concede`, usaEspecializacaoConteudo(r.sessao, d, { id: "cmb_surto_de_acao", descontarPE: true }, p()).sessao === r.sessao, true);
  t(`${sistema} sem 5 PE recusa integralmente`, usaEspecializacaoConteudo({ ...s, peAtual: 4 }, d, { id: "cmb_surto_de_acao", descontarPE: true }, p()).aplicado, false);
  const manual = usaEspecializacaoConteudo(s, d, { id: "cmb_surto_de_acao" }, p());
  t(`${sistema} cobrança manual preservada`, [manual.sessao.peAtual, manual.custo.pe.naoDescontado], [s.peAtual, 5]);
  const rodada = S.proximaRodada(r.sessao, d).sessao;
  t(`${sistema} rodada nova libera outro Surto`, usaEspecializacaoConteudo(rodada, d, { id: "cmb_surto_de_acao", descontarPE: true }, p()).aplicado, true);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d);
  t(`${sistema} ação e limite persistem`, [acoesDisponiveis(relida, d).comum, usaEspecializacaoConteudo(relida, d, { id: "cmb_surto_de_acao" }, p()).aplicado], [1, false]);
  const semHabilidade = deriveAfty(ficha(sistema));
  t(`${sistema} sem Surto não paga`, usaEspecializacaoConteudo(s, semHabilidade, { id: "cmb_surto_de_acao", descontarPE: true }, p()).sessao === s, true);

  const suporte = ficha(sistema, "suporte"); suporte.habilidades = ["sup_cura_aperfeicoada"];
  suporte.talentos = ["tal_adepto_de_medicina"];
  const ds = deriveAfty(suporte); let ss = S.sessaoEmBranco(ds); ss.hpAtual = 1;
  let i = 0; const rng = () => ++i % 2 ? 0 : 0.999;
  const curada = usaCuraConteudo(ss, ds, { id: "tal_adepto_de_medicina", rng }, p());
  t(`${sistema} cliente respeita Cura Aperfeiçoada`, curada.rolagem.rerrolados.length > 0, true);
  t(`${sistema} Cura Aperfeiçoada preserva fonte`, curada.rolagem.rerrolaFonte, "Cura Aperfeiçoada");

  for (const [classe, habilidade, fonte, estado] of [["lutador", "lut_resistir", "resistir", "resistirPE"], ["conjurador", "cnj_conhecimento_aplicado", "conhecimento", "conhecimentoAplicado"]]) {
    const c = ficha(sistema, classe); c.habilidades = [habilidade];
    const base = deriveAfty(c); c.combate = { ativo: true, [estado]: 2 };
    const d = deriveAfty(c); let s = S.iniciaCombate(S.sessaoEmBranco(d), d);
    const entrada = { fonte, id: "fortitude", pe: 2, contraFeitico: true, descontarPE: true, rng: () => 0.5 }, pedido = p();
    const r = usaTesteConteudo(s, d, entrada, pedido);
    t(`${sistema} ${habilidade} disponível`, d.habilidades.inacessiveis, []);
    t(`${sistema} ${habilidade} paga duas PE`, [r.aplicado, s.peAtual - r.sessao.peAtual], [true, 2]);
    t(`${sistema} ${habilidade} não duplica a bancada`, r.rolagem.bonus, base.testes.resistencias.find((t) => t.value === "fortitude").bonus + 4);
    t(`${sistema} ${habilidade} não modifica a bancada`, r.sessao.combate[estado], s.combate[estado]);
    t(`${sistema} ${habilidade} registra TR correto`, r.rolagem.resistenciaId, "fortitude");
    t(`${sistema} ${habilidade} repete sem pagar`, usaTesteConteudo(r.sessao, d, entrada, pedido).repetida, true);
    t(`${sistema} ${habilidade} barra gasto acima do teto`, usaTesteConteudo(s, d, { ...entrada, pe: 4 }, p()).sessao === s, true);
    const manual = usaTesteConteudo(s, d, { ...entrada, descontarPE: false }, p());
    t(`${sistema} ${habilidade} preserva custo manual`, [manual.sessao.peAtual, manual.custo.pe.naoDescontado], [s.peAtual, 2]);
    t(`${sistema} ${habilidade} não dá acesso sem habilidade`, usaTesteConteudo(s, deriveAfty(ficha(sistema, classe)), entrada, p()).aplicado, false);
    t(`${sistema} ${habilidade} respeita o escopo`, usaTesteConteudo(s, d, { ...entrada, id: "vontade", contraFeitico: false }, p()).aplicado, false);
  }
  const mente = ficha(sistema, "conjurador"); mente.habilidades = ["cnj_mente_placida"];
  const semMente = deriveAfty(mente); mente.combate = { ativo: true, mentePlacida: 1 };
  const dm = deriveAfty(mente); let sm = S.iniciaCombate(S.sessaoEmBranco(dm), dm);
  sm = usa(sm, dm, { id: "concentrado", nome: "Teste de Concentração", concentracao: true, duracao: { ate: "cena" } }, p()).sessao;
  sm = abreTesteDeConcentracao(sm, "movido", { distancia: 5 }).sessao;
  const pedidoMente = p(), rMente = usaMentePlacida(sm, dm, { pe: 2, descontarPE: true, rng: () => 0.999 }, pedidoMente);
  t(`${sistema} Mente paga e resolve pendência`, [rMente.aplicado, sm.peAtual - rMente.sessao.peAtual, rMente.sessao.uso.teste], [true, 2, null]);
  t(`${sistema} Mente reduz CD pelo maior modificador`, rMente.cd, 10 - Math.max(0, dm.mods.inteligencia, dm.mods.sabedoria));
  t(`${sistema} Mente troca parcela sem somar 3 e 5`, rMente.rolagem.bonus, semMente.testes.manobras.find((m) => m.id === "concentracao").executar + 5);
  t(`${sistema} Mente mantém concentração no sucesso`, rMente.sessao.uso.concentracao.id, "concentrado");
  t(`${sistema} Mente tem fonte da CD`, rMente.rolagem.fontes[0].label, "Mente Plácida");
  t(`${sistema} Mente idempotente`, usaMentePlacida(rMente.sessao, dm, { pe: 2 }, pedidoMente).repetida, true);
  t(`${sistema} Mente sem pendência não paga`, usaMentePlacida(rMente.sessao, dm, { pe: 2, descontarPE: true }, p()).sessao === rMente.sessao, true);
  const dificil = abreTesteDeConcentracao(sm, "dano", { valor: 100 }).sessao;
  const falhou = usaMentePlacida(dificil, dm, { pe: 0, rng: () => 0 }, p());
  t(`${sistema} Mente sem PE conserva redução passiva da CD`, [falhou.custo.pe.pedido, falhou.cd], [0, 50 - Math.max(0, dm.mods.inteligencia, dm.mods.sabedoria)]);
  t(`${sistema} falha realmente encerra a concentração`, falhou.sessao.uso.concentracao, null);
  t(`${sistema} Mente recusa gasto inválido`, usaMentePlacida(sm, dm, { pe: 3 }, p()).sessao === sm, true);

  const dono = ficha(sistema, "conjurador"), vizinho = ficha(sistema, "conjurador");
  const pacote = { id: "cx3-remendo", nome: "Remendo de Teste", paraRaw: "afty", substitui: {
    habilidades: [{ id: "cnj_conhecimento_aplicado", efeitos: [{ canal: "bonusTR", expr: "3 * conhecimento_aplicado", duracao: "temporaria" }] }],
    aptidoes: [{ id: "aura_controlada", requisitos: [{ tipo: "nd", valor: 99 }] }],
  } };
  for (const c of [dono, vizinho]) { c.habilidades = ["cnj_conhecimento_aplicado"]; c.aptidoes.au = 2; c.aptidoesAmaldicoadas = ["aura_controlada"]; c.pericias.furtividade = "treinado"; c.attrNivel.destreza = 3; }
  dono.addons = [pacote]; aplicarAddons([pacote]);
  const dd = deriveAfty(dono), dv = deriveAfty(vizinho);
  const entradaRemendo = { fonte: "conhecimento", id: "fortitude", pe: 2, contraFeitico: true, rng: () => 0.5 };
  const trDono = usaTesteConteudo(S.iniciaCombate(S.sessaoEmBranco(dd), dd), dd, entradaRemendo, p());
  const trVizinho = usaTesteConteudo(S.iniciaCombate(S.sessaoEmBranco(dv), dv), dv, entradaRemendo, p());
  t(`${sistema} remendo da habilidade vale só para o dono`, trDono.rolagem.bonus - trVizinho.rolagem.bonus, 2);
  t(`${sistema} requisito remendado da Aptidão no escopo correto`, [aptidaoDeConteudoDisponivel(dd, "aura_controlada"), aptidaoDeConteudoDisponivel(dv, "aura_controlada")], [false, true]);
  aplicarAddons([]);

  for (const externo of [false, true]) {
    const c = ficha(sistema, externo ? "suporte" : "combatente"), hab = externo ? "sup_conceder_outra_chance" : "cmb_indomavel";
    c.habilidades = [hab]; const d = deriveAfty(c), s = S.iniciaCombate(S.sessaoEmBranco(d), d);
    const tr = d.testes.resistencias.find((t) => t.value === "fortitude");
    const original = rolarTeste({ rotulo: "Fortitude", bonus: tr.bonus, dados: tr.dadosExtras, cd: 99 }, () => 0);
    const destino = S.registraRolagem(s, original), emissor = externo ? s : destino;
    const alvo = externo ? { sessao: destino, derived: d } : null;
    const entrada = { id: original.id, antesConsequencias: true, aliadoVisivelAte6m: true, descontarPE: true, rng: () => 0.999 }, pedido = p();
    const r = rerrolaTesteDeClasse(emissor, d, entrada, pedido, alvo), atualizado = r.sessaoAlvo ?? r.sessao;
    t(`${sistema} ${hab} disponível`, d.habilidades.inacessiveis, []);
    t(`${sistema} ${hab} custo próprio`, [r.aplicado, emissor.peAtual - r.sessao.peAtual], [true, externo ? 3 : 1]);
    t(`${sistema} ${hab} preserva melhor total`, atualizado.log[0].total > original.total, true);
    t(`${sistema} ${hab} conserva identidade do teste`, atualizado.log[0].id, original.id);
    t(`${sistema} ${hab} contador nativo`, r.sessao.usos[`hab:${hab}`], 1);
    t(`${sistema} ${hab} não gasta ação`, acoesDisponiveis(r.sessao, d), acoesDisponiveis(emissor, d));
    t(`${sistema} ${hab} idempotente`, rerrolaTesteDeClasse(r.sessao, d, entrada, pedido, externo ? { sessao: atualizado, derived: d } : null).repetida, true);
    const menor = rerrolaTesteDeClasse(emissor, d, { ...entrada, rng: () => 0 }, p(), alvo);
    t(`${sistema} ${hab} resultado pior conserva original`, menor.rolagem.total, original.total);
    t(`${sistema} ${hab} conserva dado descartado no registro`, menor.rolagem.rerrolagensClasse[0].manteveAnterior, true);
    t(`${sistema} ${hab} exige janela declarada`, rerrolaTesteDeClasse(emissor, d, { ...entrada, antesConsequencias: false }, p(), alvo).sessao === emissor, true);
    const automatico = { ...destino, log: [{ ...original, consequenciasAplicadas: true }] };
    t(`${sistema} ${hab} não desfaz efeito automático`, rerrolaTesteDeClasse(externo ? emissor : automatico, d, entrada, p(), externo ? { sessao: automatico, derived: d } : null).aplicado, false);
    const sucesso = { ...destino, log: [{ ...original, sucesso: true }] };
    t(`${sistema} ${hab} recusa sucesso mesmo com declaração de falha`, rerrolaTesteDeClasse(externo ? emissor : sucesso, d, { ...entrada, falhou: true }, p(), externo ? { sessao: sucesso, derived: d } : null).aplicado, false);
    const chave = d.usosHabilidades[hab]; const semUso = S.marcaUso(emissor, chave, chave.max);
    t(`${sistema} ${hab} sem usos recusa`, rerrolaTesteDeClasse(semUso, d, entrada, p(), alvo).sessao === semUso, true);
    const relida = S.normalizaSessao(JSON.parse(JSON.stringify(atualizado)), d);
    t(`${sistema} ${hab} mantém histórico no salvamento`, relida.log[0].rerrolagensClasse[0].fonte, externo ? "Conceder Outra Chance" : "Indomável");
    if (externo) {
      t(`${sistema} Outra Chance exige alcance e visão`, rerrolaTesteDeClasse(emissor, d, { ...entrada, aliadoVisivelAte6m: false }, p(), alvo).aplicado, false);
      t(`${sistema} Outra Chance não muda PV do aliado`, atualizado.hpAtual, destino.hpAtual);
    } else {
      const pericia = { ...destino, log: [{ ...original, rotulo: "Atletismo", periciaId: "atletismo" }] };
      t(`${sistema} Indomável exige TR`, rerrolaTesteDeClasse(pericia, d, entrada, p()).aplicado, false);
    }
  }
  const sorte = ficha(sistema); sorte.talentos = ["tal_favorecido_pela_sorte"];
  const dSorte = deriveAfty(sorte), dadoAutomatico = rolarTeste({ rotulo: "Fortitude", detalhe: "Crítico", bonus: 1 }, () => 0);
  const depoisDoEfeito = S.registraRolagem(S.sessaoEmBranco(dSorte), { ...dadoAutomatico, consequenciasAplicadas: true });
  t(`${sistema} Sorte não reescreve TR já aplicado`, rolaSorte(depoisDoEfeito, dSorte, { id: dadoAutomatico.id }, p()).sessao === depoisDoEfeito, true);

  for (const [id, resistencia, atributo] of [["res_forca_imparavel", "Reflexos", "destreza"], ["res_barreira_inamovivel", "Fortitude", "constituicao"]]) {
    const c = ficha(sistema, "restringido"); c.core.origem = { id: "restringido" }; c.core.tipo = "restringido";
    c.habilidades = [id]; c.attrNivel.destreza = 3; c.attrNivel.constituicao = 3;
    if (id === "res_forca_imparavel") c.escolhasHabilidade = { [id]: ["res_imparavel_astucia", "res_imparavel_fortitude"] };
    const d = deriveAfty(c), tr = d.testes.resistencias.find((t) => t.label === resistencia);
    let s = S.iniciaCombate(S.sessaoEmBranco(d), d); const original = rolarTeste({ rotulo: resistencia, bonus: tr.bonus, cd: 99 }, () => 0);
    s = S.registraRolagem(s, original); const pedido = p(), r = usaEspecializacaoConteudo(s, d, { id, descontarPE: true }, pedido);
    t(`${sistema} ${id} acessível`, d.habilidades.inacessiveis, []);
    t(`${sistema} ${id} paga e corrige natural`, [r.aplicado, s.peAtual - r.sessao.peAtual, r.sessao.log[0].natural], [true, 2, d.mods[atributo]]);
    t(`${sistema} ${id} corrige total`, r.sessao.log[0].total, original.total + d.mods[atributo] - original.natural);
    t(`${sistema} ${id} não paga novamente sem correção`, usaEspecializacaoConteudo(r.sessao, d, { id, descontarPE: true }, p()).sessao === r.sessao, true);
    t(`${sistema} ${id} idempotente`, usaEspecializacaoConteudo(r.sessao, d, { id, descontarPE: true }, pedido).repetida, true);
    const aplicado = { ...s, log: [{ ...original, consequenciasAplicadas: true }] };
    t(`${sistema} ${id} não reescreve consequência`, usaEspecializacaoConteudo(aplicado, d, { id, descontarPE: true }, p()).sessao === aplicado, true);
    const pobre = { ...s, peAtual: 1 };
    t(`${sistema} ${id} sem estamina não altera TR`, usaEspecializacaoConteudo(pobre, d, { id, descontarPE: true }, p()).sessao === pobre, true);
  }
  const preciso = ficha(sistema, "restringido"); preciso.core.origem = { id: "restringido" }; preciso.core.tipo = "restringido"; preciso.habilidades = ["res_precisao_forcada"];
  preciso.equipamentos.itens = [{ uid: "arco", tipo: "arma", refId: "arm_arco_curto", qtd: 1, equipado: true }];
  const dp = deriveAfty(preciso), sp = S.iniciaCombate(S.sessaoEmBranco(dp), dp), pr = p();
  const armada = usaEspecializacaoConteudo(sp, dp, { id: "res_precisao_forcada", descontarPE: true }, pr);
  t(`${sistema} Precisão acessível`, dp.habilidades.inacessiveis, []);
  t(`${sistema} Precisão paga três e arma`, [armada.aplicado, sp.peAtual - armada.sessao.peAtual, armada.sessao.uso.pendencias.length], [true, 3, 1]);
  const linha = dp.dano.entradas.find((l) => l.id === "basico"), arco = dp.dano.entradas.find((l) => l.id === "arm_arco_curto");
  const dano = prepararRolagemEspecializacao({ tipo: "dano", linhaArma: linha, grupos: linha.gruposDano }, armada.sessao, dp);
  t(`${sistema} Precisão usa máximo nativo`, rolarDano(dano, () => 0).total, rolarDano({ grupos: linha.gruposDano, maximizado: true }).total);
  t(`${sistema} Precisão não maximiza distância`, !!prepararRolagemEspecializacao({ tipo: "dano", linhaArma: arco, grupos: arco.gruposDano }, armada.sessao, dp).maximizado, false);
  t(`${sistema} Precisão não paga outra vez na rodada`, usaEspecializacaoConteudo(armada.sessao, dp, { id: "res_precisao_forcada", descontarPE: true }, p()).sessao === armada.sessao, true);
  const erro = rolarTeste({ rotulo: linha.nome, linhaArma: linha, tipoTeste: "ataque", bonus: linha.acerto }, () => 0);
  const errou = confirmaAtaqueConteudo(S.registraRolagem(armada.sessao, erro), dp, sp, dp, { ataqueId: erro.id, alvoId: "outro" }, p());
  t(`${sistema} Precisão também consome no erro`, [errou.aplicado, errou.ataque.acertou, errou.sessao.uso.pendencias.length, errou.sessao.combate.precisaoForcada], [true, false, 0, false]);
  for (const nivel of [4, 6, 12, 18]) {
    const sup = ficha(sistema, "suporte"); sup.core.nd = nivel; sup.especializacoes = [{ id: "suporte", nivel }]; sup.habilidades = ["sup_intervencao"];
    const ds = deriveAfty(sup), ss = S.iniciaCombate(S.sessaoEmBranco(ds), ds);
    t(`${sistema} Intervenção nível ${nivel} admissível`, ds.habilidades.inacessiveis, []);
    for (const grupo of condicoesPorForca()) {
      const alvo = ficha(sistema), nome = grupo.condicoes[0].nome;
      const sa = S.defineCondicoes(S.sessaoEmBranco(deriveAfty(alvo)), [{ id: "remover", nome, rodadas: 2 }, { id: "conservar", nome, rodadas: 4 }]);
      const da = deriveAfty({ ...alvo, combate: sa.combate }, opcoesDeriveDaSessao(sa));
      const entrada = { condicaoId: "remover", aliadoEmToque: true, descontarPE: true }, pedido = p();
      const r = usaIntervencaoConteudo(ss, ds, sa, da, entrada, pedido), permitido = grupo.nivel <= 1 + Math.floor(nivel / 6);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} respeita liberação`, r.aplicado, permitido);
      if (!permitido) { t(`${sistema} Intervenção ${nivel}/${grupo.label} inerte`, r.sessao === ss, true); continue; }
      t(`${sistema} Intervenção ${nivel}/${grupo.label} custo`, ss.peAtual - r.sessao.peAtual, 3 * grupo.nivel);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} ação comum nativa`, acoesDisponiveis(r.sessao, ds).comum, 0);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} só encerra id escolhido`, r.sessaoAlvo.condicoes, [sa.condicoes[1]]);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} persistência`, S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)), da).condicoes, r.sessaoAlvo.condicoes);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} repetição`, usaIntervencaoConteudo(r.sessao, ds, r.sessaoAlvo, da, entrada, pedido).repetida, true);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} exige toque`, usaIntervencaoConteudo(ss, ds, sa, da, { ...entrada, aliadoEmToque: false }, p()).sessao === ss, true);
      const pobre = { ...ss, peAtual: 0, peTemp: [] };
      t(`${sistema} Intervenção ${nivel}/${grupo.label} falta de PE sem alterar`, usaIntervencaoConteudo(pobre, ds, sa, da, entrada, p()).sessao === pobre, true);
      const manual = usaIntervencaoConteudo(ss, ds, sa, da, { ...entrada, descontarPE: false }, p());
      t(`${sistema} Intervenção ${nivel}/${grupo.label} política manual`, [manual.sessao.peAtual, manual.custo.pe.naoDescontado], [ss.peAtual, 3 * grupo.nivel]);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} alvo mudou`, usaIntervencaoConteudo(ss, ds, S.defineCondicoes(sa, []), da, entrada, p()).sessao === ss, true);
      t(`${sistema} Intervenção ${nivel}/${grupo.label} sem ação não cobra`, usaIntervencaoConteudo(r.sessao, ds, sa, da, entrada, p()).sessao === r.sessao, true);
    }
    const alvo = ficha(sistema), sa = S.defineCondicoes(S.sessaoEmBranco(deriveAfty(alvo)), [{ id: "especial", nome: "Indefeso" }, { id: "desconhecida", nome: "Condição Ausente" }, { id: "membro", nome: "Desmembramento" }, { id: "sangramento", nome: "Sangramento", sangramento: "extremo" }]);
    const da = deriveAfty(alvo, opcoesDeriveDaSessao(sa));
    for (const condicaoId of ["especial", "desconhecida", "nenhuma", "membro"]) t(`${sistema} Intervenção ${nivel} não presume força ${condicaoId}`,
      usaIntervencaoConteudo(ss, ds, sa, da, { condicaoId, aliadoEmToque: true }, p()).sessao === ss, true);
    t(`${sistema} Intervenção ${nivel} usa força variável do Sangramento`, usaIntervencaoConteudo(ss, ds, sa, da, { condicaoId: "sangramento", aliadoEmToque: true }, p()).aplicado, nivel >= 18);
    const semHab = deriveAfty({ ...sup, habilidades: [] });
    t(`${sistema} Intervenção ${nivel} exige habilidade`, usaIntervencaoConteudo(ss, semHab, sa, da, { condicaoId: "especial", aliadoEmToque: true }, p()).sessao === ss, true);
  }
  {
    const sup = ficha(sistema, "suporte"); sup.habilidades = ["sup_analise_profunda"]; sup.talentos = ["tal_favorecido_pela_sorte"];
    const alvo = ficha(sistema); alvo.id = "alvo-da-analise"; alvo.core.nd = 4; alvo.especializacoes = [{ id: "combatente", nivel: 4 }]; alvo.attrNivel = {};
    const ds = deriveAfty(sup), da = deriveAfty(alvo), ss = S.iniciaCombate(S.sessaoEmBranco(ds), ds), sa = S.sessaoEmBranco(da);
    const pedido = p(), entrada = { alvoId: alvo.id, descontarPE: true, rng: () => 0.999 };
    const uso = usaAnaliseProfunda(ss, ds, sa, da, entrada, pedido);
    if (!uso.aplicado) throw new Error(`${sistema} Análise: ${uso.erro}`);
    t(`${sistema} Análise admissível`, ds.habilidades.inacessiveis, []);
    t(`${sistema} Análise usa Percepção e CD reais`, [uso.rolagem.bonus, uso.rolagem.cd, uso.rolagem.periciaId], [ds.testes.pericias.find((l) => l.id === "percepcao").bonus, 19, "percepcao"]);
    t(`${sistema} Análise paga um e ação comum`, [ss.peAtual - uso.sessao.peAtual, acoesDisponiveis(uso.sessao, ds).comum], [1, 0]);
    t(`${sistema} Análise não altera alvo`, uso.sessaoAlvo === sa, true);
    t(`${sistema} Análise separa rolagem da descoberta`, uso.sessao.log.some((r) => r.quantidade != null), false);
    t(`${sistema} Análise não duplica pagamento`, usaAnaliseProfunda(uso.sessao, ds, sa, da, entrada, pedido).repetida, true);
    const rodada = S.iniciaTurnoFicha(uso.sessao, ds);
    t(`${sistema} Análise não repete mesmo alvo na cena`, usaAnaliseProfunda(rodada, ds, sa, da, entrada, p()).sessao === rodada, true);
    t(`${sistema} Análise permite outra criatura`, usaAnaliseProfunda(rodada, ds, sa, da, { ...entrada, alvoId: "outra-criatura" }, p()).aplicado, true);
    const novaCena = S.iniciaTurnoFicha(S.iniciaCombate(rodada, ds), ds);
    t(`${sistema} Análise volta na cena seguinte`, usaAnaliseProfunda(novaCena, ds, sa, da, entrada, p()).aplicado, true);
    const relida = S.normalizaSessao(JSON.parse(JSON.stringify(uso.sessao)), ds);
    t(`${sistema} Análise preserva vínculo ao salvar`, relida.log[0].contextoConteudo, uso.rolagem.contextoConteudo);
    const concluida = concluiAnaliseProfunda(relida, ds, { id: uso.rolagem.id }, p());
    t(`${sistema} Análise descobre uma por cinco excedentes`, concluida.quantidade, 4);
    t(`${sistema} Análise não cobra ao concluir`, concluida.sessao.peAtual, uso.sessao.peAtual);
    t(`${sistema} Análise registra fonte e alvo`, [concluida.sessao.log[0].alvoId, concluida.sessao.log[0].fontes[0].label], [alvo.id, "Análise Profunda"]);
    t(`${sistema} Análise não conclui duas vezes`, concluiAnaliseProfunda(concluida.sessao, ds, { id: uso.rolagem.id }, p()).sessao === concluida.sessao, true);
    t(`${sistema} Análise concluída fecha Sorte`, rolaSorte(concluida.sessao, ds, { id: uso.rolagem.id }, p()).sessao === concluida.sessao, true);
    const sorte = rolaSorte(uso.sessao, ds, { id: uso.rolagem.id, rng: () => 0 }, p());
    t(`${sistema} Análise espera escolha de Sorte`, concluiAnaliseProfunda(sorte.sessao, ds, { id: uso.rolagem.id }, p()).sessao === sorte.sessao, true);
    const escolha = escolheSorte(sorte.sessao, ds, { id: uso.rolagem.id, escolha: "novo" }, p());
    t(`${sistema} Análise usa resultado atual após Sorte`, concluiAnaliseProfunda(escolha.sessao, ds, { id: uso.rolagem.id }, p()).quantidade, 0);
    const pobre = { ...ss, peAtual: 0 };
    t(`${sistema} Análise sem PE não consome tentativa`, usaAnaliseProfunda(pobre, ds, sa, da, entrada, p()).sessao === pobre, true);
    const semAcao = gastaAcao(ss, ds, "comum").sessao;
    t(`${sistema} Análise sem ação não cobra`, usaAnaliseProfunda(semAcao, ds, sa, da, entrada, p()).sessao === semAcao, true);
    const manual = usaAnaliseProfunda(ss, ds, sa, da, { ...entrada, descontarPE: false }, p());
    t(`${sistema} Análise preserva cobrança manual`, [manual.sessao.peAtual, manual.custo.pe.naoDescontado], [ss.peAtual, 1]);
    t(`${sistema} Análise exige fonte disponível`, usaAnaliseProfunda(ss, deriveAfty({ ...sup, habilidades: [] }), sa, da, entrada, p()).sessao === ss, true);
    t(`${sistema} Análise sem id do alvo inerte`, usaAnaliseProfunda(ss, ds, sa, da, { ...entrada, alvoId: "" }, p()).sessao === ss, true);
  }
  {
    const sup = ficha(sistema, "suporte"); sup.habilidades = ["sup_mobilidade_avancada"];
    const atacante = ficha(sistema), aliado = ficha(sistema); aliado.id = "aliado-caido";
    const ds = deriveAfty(sup), dd = deriveAfty(atacante), da = deriveAfty(aliado), linha = dd.dano.entradas.find((l) => l.id === "basico");
    const ss = S.iniciaCombate(S.sessaoEmBranco(ds), ds), sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), hpAtual: 1 };
    const ataque = rolarTeste({ rotulo: "Ataque", tipoTeste: "ataque", bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, () => 0.999);
    const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.2);
    const sd = S.registraRolagem(S.registraRolagem(S.iniciaCombate(S.sessaoEmBranco(dd), dd), ataque), dano);
    const confirmado = confirmaAtaqueConteudo(sd, dd, sa, da, { ataqueId: ataque.id, danoId: dano.id, alvoId: aliado.id }, p());
    if (!confirmado.aplicado) throw new Error(confirmado.erro);
    const caida = confirmado.sessaoAlvo, queda = caida.log[0], entrada = { alvoId: aliado.id, quedaId: queda.id, aliadoEmDirecao: true }, pedido = p();
    t(`${sistema} Mobilidade guarda queda real de CL2`, [queda.abateu, queda.estadoVitalAlvo, caida.vital.estado], [true, "morrendo", "morrendo"]);
    t(`${sistema} Mobilidade conserva bônus permanente`, ds.movimento - deriveAfty({ ...sup, habilidades: [] }).movimento, 3);
    const r = usaMobilidadeAvancada(ss, ds, caida, da, entrada, pedido);
    if (!r.aplicado) throw new Error(`${sistema} Mobilidade: ${r.erro}`);
    t(`${sistema} Mobilidade gasta reação e usa metade real`, [r.sessao.especializacaoSessao.reacoesGastas, r.distancia], [1, ds.movimento / 2]);
    t(`${sistema} Mobilidade não consome ação comum ou PE`, [r.sessao.uso.acoes.gastas.comum, r.sessao.peAtual], [0, ss.peAtual]);
    t(`${sistema} Mobilidade não altera aliado`, r.sessaoAlvo === caida, true);
    t(`${sistema} Mobilidade não duplica operação`, usaMobilidadeAvancada(r.sessao, ds, caida, da, entrada, pedido).repetida, true);
    t(`${sistema} Mobilidade não repete queda com outro id`, usaMobilidadeAvancada(r.sessao, ds, caida, da, entrada, p()).sessao === r.sessao, true);
    t(`${sistema} Mobilidade exige direção do aliado`, usaMobilidadeAvancada(ss, ds, caida, da, { ...entrada, aliadoEmDirecao: false }, p()).sessao === ss, true);
    t(`${sistema} Mobilidade exige o alvo do recibo`, usaMobilidadeAvancada(ss, ds, caida, da, { ...entrada, alvoId: "outro" }, p()).sessao === ss, true);
    t(`${sistema} Mobilidade exige evento identificável`, usaMobilidadeAvancada(ss, ds, caida, da, { ...entrada, quedaId: "ausente" }, p()).sessao === ss, true);
    const semReacao = gastaAcao(ss, ds, "reacao", { id: "outra-reacao" }).sessao;
    t(`${sistema} Mobilidade sem reação não se move`, usaMobilidadeAvancada(semReacao, ds, caida, da, entrada, p()).sessao === semReacao, true);
    const imovel = S.defineCondicoes(ss, [{ id: "preso", nome: "Imóvel" }]);
    t(`${sistema} Mobilidade impedida não gasta reação`, usaMobilidadeAvancada(imovel, ds, caida, da, entrada, p()).sessao === imovel, true);
    const curada = S.aplicaCura(caida, da.hp * 2, da.hp);
    t(`${sistema} Mobilidade não reage a aliado já curado`, usaMobilidadeAvancada(ss, ds, curada, da, entrada, p()).sessao === ss, true);
    const amanha = S.proximaRodada(ss, ds).sessao;
    t(`${sistema} Mobilidade não usa queda de rodada anterior`, usaMobilidadeAvancada(amanha, ds, caida, da, entrada, p()).sessao === amanha, true);
    const semHab = deriveAfty({ ...sup, habilidades: [] });
    t(`${sistema} Mobilidade exige habilidade atual`, usaMobilidadeAvancada(ss, semHab, caida, da, entrada, p()).sessao === ss, true);
    const intacta = confirmaAtaqueConteudo(sd, dd, S.iniciaCombate(S.sessaoEmBranco(da), da), da, { ataqueId: ataque.id, danoId: dano.id, alvoId: aliado.id }, p());
    t(`${sistema} Mobilidade não inventa queda sem chegar a zero`, [intacta.sessaoAlvo.log[0].abateu, usaMobilidadeAvancada(ss, ds, intacta.sessaoAlvo, da, { ...entrada, quedaId: intacta.sessaoAlvo.log[0].id }, p()).aplicado], [false, false]);
    const relida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), ds), alvoRelido = S.normalizaSessao(JSON.parse(JSON.stringify(caida)), da);
    t(`${sistema} Mobilidade persiste reação e resultado`, [relida.especializacaoSessao.reacoesGastas, relida.log[0].distancia], [1, r.distancia]);
    t(`${sistema} Mobilidade persiste evento e recusa repetição`, [alvoRelido.log[0].eventosAlvo.some((e) => e.abateu), usaMobilidadeAvancada(relida, ds, alvoRelido, da, entrada, p()).aplicado], [true, false]);
    const fora = confirmaAtaqueConteudo(S.registraRolagem(S.registraRolagem(S.sessaoEmBranco(dd), ataque), dano), dd,
      { ...S.sessaoEmBranco(da), hpAtual: 1 }, da, { ataqueId: ataque.id, danoId: dano.id, alvoId: aliado.id }, p());
    t(`${sistema} Mobilidade não acrescenta exigência de combate`, usaMobilidadeAvancada(S.sessaoEmBranco(ds), ds, fora.sessaoAlvo, da,
      { ...entrada, quedaId: fora.sessaoAlvo.log[0].id }, p()).aplicado, true);
  }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
