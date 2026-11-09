/* CL3: VOTOS DE RESTRIÇÃO. Tipos, pesos, legalidade, Restrição Congênita, ciclo de vida (realizar, quebrar, desfazer,
   prazo, fim do combate, interlúdio), Contratos e a compatibilidade com o Voto livre de antes. Livro p.350 a 358. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const V = await import(R + "afty-votos.js");
const RG = await import(R + "ficha/ficha-votos-regras.js");
const F = await import(R + "ficha/ficha-votos.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const codigos = (r) => r.erros.map((e) => e.codigo);
let n = 0;
const op = () => `op_t_${(n += 1)}`;

/* ============================================================ */
/* 1. O VOTO LIVRE DE ANTES NÃO MUDA                             */
/* ============================================================ */
const livre = {
  id: "livre", nome: "Livre", narrativa: "n",
  beneficio: { texto: "b", efeitos: [{ canal: "rdGeral", expr: "3" }] },
  maleficio: { texto: "m", efeitos: [{ canal: "movimento", expr: "-1" }] },
};
const lido = V.votosDaFicha({ votos: { contratuais: [{ id: "c", texto: "x" }], mecanicos: [livre] } });
t("Voto livre volta sem chave nova", JSON.stringify(lido.mecanicos[0]), JSON.stringify(livre));
t("Contratual antigo volta sem chave nova", JSON.stringify(lido.contratuais[0]), JSON.stringify({ id: "c", texto: "x" }));
t("Voto livre passa na validação", RG.validaVoto(livre, { bt: 0, vigentes: 9 }).ok, true);
t("Voto livre é marcado como legado", RG.validaVoto(livre).legado, true);
t("Voto livre emite os dois lados", V.efeitosDeVotos({ votos: { mecanicos: [livre] } }, 2).length, 2);
t("Voto livre não tem ciclo de vida", F.avaliaRealizacao({ mecanicos: [livre], contratuais: [] }, "livre").erros[0].codigo, "voto-livre");

const deAddon = { ...livre, id: "voto_addon_p_x", origemAddon: "p", tipo: "congenita", congenita: { trocas: [{ perde: "pe", ganha: "pe" }] } };
t("Voto de Addon é exceção declarada", RG.validaVoto(deAddon, { criacao: false }).excecao, true);
t("Voto de Addon não é recusado", RG.validaVoto(deAddon, { criacao: false }).ok, true);

/* ============================================================ */
/* 2. PESOS E LEGALIDADE (p.351 a 356)                            */
/* ============================================================ */
const proprio = (extra = {}) => ({
  ...livre, id: "p1", tipo: "proprio", permanencia: "temporario", estado: "proposto",
  beneficio: { texto: "", efeitos: [], peso: "medio", envolve: ["aptidao"] },
  maleficio: { texto: "", efeitos: [], peso: "medio", envolve: ["pe"] },
  aptidoes: ["cobrir_se"],
  ...extra,
});
const ctx = { aptidoes: ["cobrir_se"], bt: 4, vigentes: 0 };
t("Voto Próprio Temporário Médio é legal", RG.validaVoto(proprio(), ctx).ok, true);
t("temporário não pode ser Extremo", codigos(RG.validaVoto(proprio({ maleficio: { texto: "", efeitos: [], peso: "extremo", envolve: ["pe"] } }), ctx)).includes("temporario-extremo-maleficio"), true);
t("temporário pode ser Pesado", RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "pesado", envolve: ["pe"] }, maleficio: { texto: "", efeitos: [], peso: "pesado", envolve: ["pe"] }, aptidoes: [] }), ctx).ok, true);
t("permanente não pode ser Leve", codigos(RG.validaVoto(proprio({ permanencia: "permanente", beneficio: { texto: "", efeitos: [], peso: "leve", envolve: ["pe"] } }), ctx)).includes("permanente-leve-beneficio"), true);
t("permanente Extremo é legal", RG.validaVoto(proprio({ permanencia: "permanente", beneficio: { texto: "", efeitos: [], peso: "extremo", envolve: ["pe"] }, maleficio: { texto: "", efeitos: [], peso: "extremo", envolve: ["pe"] }, aptidoes: [] }), ctx).ok, true);
t("peso fora da lista é recusado", codigos(RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "absurdo" } }), ctx)).includes("peso-beneficio"), true);
t("benefício permanente com malefício temporário é impossível", codigos(RG.validaVoto(proprio({ beneficioDuracao: "permanente" }), ctx)).includes("beneficio-permanente-malefico-temporario"), true);
t("benefício temporário em voto permanente é o Braço por Poder", RG.validaVoto(proprio({ permanencia: "permanente", beneficioDuracao: "temporario" }), ctx).ok, true);
t("antecipar Aptidão só em permanente", codigos(RG.validaVoto(proprio({ antecipaAptidao: true }), ctx)).includes("antecipa-so-permanente"), true);
t("antecipar Aptidão permanente dispensa possuí-la", RG.validaVoto(proprio({ permanencia: "permanente", antecipaAptidao: true, aptidoes: ["dominio_simples"] }), { ...ctx, aptidoes: [] }).ok, true);
t("Peso Leve não envolve Aptidões", codigos(RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "leve", envolve: ["aptidao"] }, maleficio: { texto: "", efeitos: [], peso: "leve", envolve: ["pe"] } }), ctx)).includes("leve-sem-aptidao-beneficio"), true);
t("Peso Leve sem Aptidão é legal", RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "leve", envolve: ["feitico"] }, maleficio: { texto: "", efeitos: [], peso: "leve", envolve: ["pe"] }, aptidoes: [] }), ctx).ok, true);
t("benefício não envolve Atributo", codigos(RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "medio", envolve: ["atributo"] } }), ctx)).includes("escopo-beneficio"), true);
t("benefício não envolve Defesa nem RD", codigos(RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "medio", envolve: ["defesa", "rd"] } }), ctx)).includes("escopo-beneficio"), true);
t("malefício pode ser conhecimento", RG.validaVoto(proprio({ maleficio: { texto: "", efeitos: [], peso: "medio", envolve: ["conhecimento"] } }), ctx).ok, true);
t("malefício pode ser efeito simples", RG.validaVoto(proprio({ maleficio: { texto: "", efeitos: [], peso: "medio", envolve: ["simples"] } }), ctx).ok, true);
t("benefício nunca é conhecimento", codigos(RG.validaVoto(proprio({ beneficio: { texto: "", efeitos: [], peso: "medio", envolve: ["conhecimento"] } }), ctx)).includes("escopo-beneficio"), true);
t("malefício não envolve Atributo", codigos(RG.validaVoto(proprio({ maleficio: { texto: "", efeitos: [], peso: "medio", envolve: ["atributo"] } }), ctx)).includes("escopo-maleficio"), true);
t("Aptidão que a ficha não tem é recusada", codigos(RG.validaVoto(proprio({ aptidoes: ["expansao"] }), ctx)).includes("aptidao-nao-possuida"), true);
t("limite de BT recusa o voto a mais", codigos(RG.validaVoto(proprio(), { ...ctx, vigentes: 4 })).includes("limite-bt"), true);
t("abaixo do limite de BT passa", codigos(RG.validaVoto(proprio(), { ...ctx, vigentes: 3 })).includes("limite-bt"), false);

const emerg = (b, m, extra = {}) => proprio({
  tipo: "emergencial",
  beneficio: { texto: "", efeitos: [], peso: b, envolve: ["pe"] },
  maleficio: { texto: "", efeitos: [], peso: m, envolve: ["pe"] },
  aptidoes: [], ...extra,
});
t("Emergencial: Médio pede malefício Pesado", RG.validaVoto(emerg("medio", "pesado"), ctx).ok, true);
t("Emergencial: Médio com Médio é recusado", codigos(RG.validaVoto(emerg("medio", "medio"), ctx)).includes("emergencial-um-peso-acima"), true);
t("Emergencial: Pesado pede Extremo", RG.validaVoto(emerg("pesado", "extremo", { permanencia: "permanente" }), ctx).ok, true);
t("Emergencial: dois pesos acima é recusado", codigos(RG.validaVoto(emerg("leve", "pesado"), ctx)).includes("emergencial-um-peso-acima"), true);
t("Emergencial temporário com malefício Extremo cai na regra do temporário", codigos(RG.validaVoto(emerg("pesado", "extremo"), ctx)).includes("temporario-extremo-maleficio"), true);

/* ============================================================ */
/* 3. RESTRIÇÃO CONGÊNITA (p.357 e 358)                           */
/* ============================================================ */
const cong = (c, extra = {}) => ({ ...livre, id: "k1", tipo: "congenita", permanencia: "permanente", estado: "proposto", congenita: c, ...extra });
t("limite 4 rende 4 pontos", RG.pontosDoLimite(4), 4);
t("limite 6 rende 2 pontos", RG.pontosDoLimite(6), 2);
t("limite 2 rende 6 pontos", RG.pontosDoLimite(2), 6);
t("limite 1 ou 9 não rende", [RG.pontosDoLimite(1), RG.pontosDoLimite(9)], [0, 0]);
t("balanço: limite 4 e 4 pontos gastos fecha em zero", RG.balancoDaCongenita({ atributos: [{ atributo: "forca", limite: 4 }], destinos: { destreza: 4 } }), { ganhos: 4, gastos: 4, saldo: 0 });
t("balanço: PV por nível reduzido rende 2 por ponto", RG.balancoDaCongenita({ pvPorNivel: -3 }).ganhos, 6);
t("balanço: PV por nível aumentado custa 4 por ponto", RG.balancoDaCongenita({ pvPorNivel: 2 }).gastos, 8);
t("só na criação", codigos(RG.validaVoto(cong({}), { criacao: false })).includes("congenita-so-na-criacao"), true);
t("na criação é legal", RG.validaVoto(cong({}), { criacao: true }).ok, true);
t("Pontos de Energia não podem ser afetados", codigos(RG.validaVoto(cong({ trocas: [{ perde: "pe", ganha: "defesa" }] }), { criacao: true })).includes("congenita-pe"), true);
t("domínio fora da lista é recusado", codigos(RG.validaVoto(cong({ trocas: [{ perde: "sorte", ganha: "defesa" }] }), { criacao: true })).includes("congenita-dominio"), true);
t("Defesa não se troca por RD", codigos(RG.validaVoto(cong({ trocas: [{ perde: "defesa", ganha: "rd" }] }), { criacao: true })).includes("congenita-defesa-rd"), true);
t("RD não se troca por Defesa", codigos(RG.validaVoto(cong({ trocas: [{ perde: "rd", ganha: "defesa" }] }), { criacao: true })).includes("congenita-defesa-rd"), true);
t("Defesa por movimento é legal", RG.validaVoto(cong({ trocas: [{ perde: "defesa", ganha: "movimento" }] }), { criacao: true }).ok, true);
t("resistência sem vulnerabilidade é recusada", codigos(RG.validaVoto(cong({ resistencias: [{ tipo: "fogo", familia: "elemental" }] }), { criacao: true })).includes("congenita-resistencia-vulnerabilidade"), true);
t("resistência elemental com vulnerabilidade é legal", RG.validaVoto(cong({ resistencias: [{ tipo: "fogo", familia: "elemental", vulnerabilidade: "gelo" }] }), { criacao: true }).ok, true);
t("atributo limitado exige Valores Fixos", codigos(RG.validaVoto(cong({ atributos: [{ atributo: "forca", limite: 4 }], destinos: { destreza: 4 } }), { criacao: true, metodoAtributos: "compra" })).includes("congenita-valores-fixos"), true);
t("Valores Fixos libera", RG.validaVoto(cong({ atributos: [{ atributo: "forca", limite: 4 }], destinos: { destreza: 4 } }), { criacao: true, metodoAtributos: "valoresFixos" }).ok, true);
t("pontos recebidos além do rendido são recusados", codigos(RG.validaVoto(cong({ atributos: [{ atributo: "forca", limite: 6 }], destinos: { destreza: 3 } }), { criacao: true })).includes("congenita-pontos"), true);
t("limite abaixo de 2 é recusado", codigos(RG.validaVoto(cong({ atributos: [{ atributo: "forca", limite: 1 }] }), { criacao: true })).includes("congenita-limite"), true);
t("cortar menos da metade dos Feitiços não rende", codigos(RG.validaVoto(cong({ feiticos: { total: 6, cortados: 2 } }), { criacao: true })).includes("congenita-feiticos-metade"), true);
t("cortar a metade dos Feitiços é legal", RG.validaVoto(cong({ feiticos: { total: 6, cortados: 3 } }), { criacao: true }).ok, true);

/* ============================================================ */
/* 4. CICLO DE VIDA                                               */
/* ============================================================ */
const criar = (voto) => F.adicionaVoto({ contratuais: [], mecanicos: [] }, voto).votos;
let votos = criar(F.novoVotoTipado({
  tipo: "proprio", permanencia: "temporario", nome: "Alcance por Dano",
  beneficio: { texto: "Mais dano", efeitos: [{ canal: "rdGeral", expr: "4" }], peso: "leve", envolve: ["feitico"] },
  maleficio: { texto: "Menos alcance", efeitos: [{ canal: "movimento", expr: "-3" }], peso: "leve", envolve: ["feitico"] },
}));
const id1 = votos.mecanicos[0].id;
t("Voto novo nasce proposto", votos.mecanicos[0].estado, "proposto");
t("Voto proposto não emite efeito", V.efeitosDeVotos({ votos }, 4), []);
t("Voto proposto libera a vaga", V.mecanicosQueOcupamVaga(votos.mecanicos).length, 0);
t("id repetido é recusado", F.adicionaVoto(votos, votos.mecanicos[0]).codigo, "voto-repetido");

t("sem opId não realiza", F.realizaVoto(votos, id1, {}).codigo, "sem-opid");
const o1 = op();
const real = F.realizaVoto(votos, id1, { opId: o1, rodada: 2, ctx });
t("realizar aplica", real.aplicado, true);
t("realizar deixa vigente", real.votos.mecanicos[0].estado, "vigente");
t("realizar registra no histórico", real.votos.mecanicos[0].historico[0], { evento: "realizado", opId: o1, rodada: 2 });
t("Próprio gasta ação bônus", real.acao, "bonus");
t("vigente emite os dois lados", V.efeitosDeVotos({ votos: real.votos }, 4).map((e) => e.canal).sort(), ["movimento", "rdGeral"]);
const repetida = F.realizaVoto(real.votos, id1, { opId: o1, ctx });
t("repetir o opId devolve repetida e o mesmo objeto", [repetida.repetida, repetida.votos === real.votos], [true, true]);
const jaVigente = F.realizaVoto(real.votos, id1, { opId: op(), ctx });
t("realizar de novo recusa", jaVigente.codigo, "nao-proposto");
t("recusa devolve o MESMO objeto de votos", jaVigente.votos === real.votos, true);

// A ação: o Próprio gasta a ação bônus da sessão
const criatura = createBlankAfty();
criatura.core.nd = 8;
const derivado = deriveAfty(criatura);
const sessao0 = S.sessaoEmBranco(derivado);
const comAcao = F.realizaVoto(votos, id1, { opId: op(), ctx, sessao: sessao0, derived: derivado, registraAcao: true });
t("realizar com ação grava na sessão", comAcao.sessao.uso.acoes.gastas.bonus, 1);
const semAcao = F.realizaVoto(votos, id1, { opId: op(), ctx, sessao: comAcao.sessao, derived: derivado, registraAcao: true });
t("sem ação bônus restante o Próprio vira comum ou recusa", semAcao.aplicado || semAcao.codigo === "sem-acao", true);
t("registraAcao sem sessão recusa", F.realizaVoto(votos, id1, { opId: op(), ctx, registraAcao: true }).codigo, "sem-sessao");

// Limite de BT
let cheio = criar(F.novoVotoTipado({ tipo: "proprio", permanencia: "temporario", beneficio: { peso: "leve", envolve: ["feitico"] }, maleficio: { peso: "leve", envolve: ["feitico"] } }));
const idCheio = cheio.mecanicos[0].id;
t("no limite de BT realizar recusa", F.realizaVoto(cheio, idCheio, { opId: op(), ctx: { bt: 2, vigentes: 2 } }).codigo, "limite-bt");

// Quebrar em combate: some tudo, depois só o malefício até o interlúdio
const q = F.quebraVoto(real.votos, id1, { opId: op(), rodada: 3, emCombate: true });
t("quebrar em combate", [q.aplicado, q.votos.mecanicos[0].estado, q.votos.mecanicos[0].maleficioAte], [true, "quebrado", "fimDoCombate"]);
t("quebrado no combate não emite benefício nem malefício", V.efeitosDeVotos({ votos: q.votos }, 4), []);
t("quebrado ainda ocupa a vaga", V.mecanicosQueOcupamVaga(q.votos.mecanicos).length, 1);
const fim = F.votosAoFimDoCombate(q.votos, { rodada: 5 });
t("fim do combate devolve só o malefício", V.efeitosDeVotos({ votos: fim.votos }, 4).map((e) => e.canal), ["movimento"]);
t("fim do combate marca até o interlúdio", fim.votos.mecanicos[0].maleficioAte, "interludio");
const inter = F.votosNoInterludio(fim.votos, { rodada: 9 });
t("interlúdio encerra o malefício", [inter.votos.mecanicos[0].estado, V.efeitosDeVotos({ votos: inter.votos }, 4)], ["encerrado", []]);
t("interlúdio libera a vaga", V.mecanicosQueOcupamVaga(inter.votos.mecanicos).length, 0);
t("interlúdio não quebra o descanso: sem Voto quebrado nada muda", F.votosNoInterludio(real.votos).aplicado, false);
t("histórico guarda a sequência", inter.votos.mecanicos[0].historico.map((h) => h.evento), ["realizado", "quebrado", "fimDoCombate", "interludio"]);

// Quebrar com duração: malefício direto até o interlúdio, qualquer que seja a duração
const comPrazo = F.realizaVoto(criar(F.novoVotoTipado({
  tipo: "proprio", permanencia: "temporario", duracao: { rodadas: 3 },
  beneficio: { efeitos: [{ canal: "rdGeral", expr: "2" }], peso: "leve", envolve: ["feitico"] },
  maleficio: { efeitos: [{ canal: "movimento", expr: "-1" }], peso: "leve", envolve: ["feitico"] },
})), null, { opId: "x" });
t("realizar um id nulo recusa", comPrazo.codigo, "voto-inexistente");
votos = criar(F.novoVotoTipado({
  tipo: "proprio", permanencia: "temporario", duracao: { rodadas: 3 },
  beneficio: { efeitos: [{ canal: "rdGeral", expr: "2" }], peso: "leve", envolve: ["feitico"] },
  maleficio: { efeitos: [{ canal: "movimento", expr: "-1" }], peso: "leve", envolve: ["feitico"] },
}));
const idPrazo = votos.mecanicos[0].id;
let comDur = F.realizaVoto(votos, idPrazo, { opId: op(), ctx }).votos;
t("duração em rodadas fica guardada", comDur.mecanicos[0].rodadasRestantes, 3);
const quebraDur = F.quebraVoto(comDur, idPrazo, { opId: op(), emCombate: true });
t("quebrar voto com duração vai direto ao malefício até o interlúdio", [quebraDur.votos.mecanicos[0].maleficioAte, V.efeitosDeVotos({ votos: quebraDur.votos }, 4).map((e) => e.canal)], ["interludio", ["movimento"]]);

// Prazo
comDur = F.avancaVotosNaRodada(comDur, { rodada: 2 }).votos;
comDur = F.avancaVotosNaRodada(comDur, { rodada: 2 }).votos;
t("a mesma rodada conta uma vez só", comDur.mecanicos[0].rodadasRestantes, 2);
comDur = F.avancaVotosNaRodada(comDur, { rodada: 3 }).votos;
comDur = F.avancaVotosNaRodada(comDur, { rodada: 4 }).votos;
t("prazo zerado encerra o voto", [comDur.mecanicos[0].estado, comDur.mecanicos[0].historico.at(-1).evento], ["encerrado", "prazo"]);
t("voto encerrado deixa de emitir", V.efeitosDeVotos({ votos: comDur }, 4), []);

// Até o fim da cena
votos = criar(F.novoVotoTipado({
  tipo: "proprio", permanencia: "temporario", duracao: { ate: "cena" },
  beneficio: { peso: "leve", envolve: ["feitico"] }, maleficio: { peso: "leve", envolve: ["feitico"] },
}));
const idCena = votos.mecanicos[0].id;
const naCena = F.realizaVoto(votos, idCena, { opId: op(), ctx }).votos;
t("até a cena segue vigente na virada de rodada", F.avancaVotosNaRodada(naCena, { rodada: 4 }).votos.mecanicos[0].estado, "vigente");
t("fim do combate encerra o voto até a cena", F.votosAoFimDoCombate(naCena).votos.mecanicos[0].estado, "encerrado");

// Desfazer e permanente
const desf = F.desfazVoto(real.votos, id1, { opId: op(), custo: "Perde a próxima reação" });
t("temporário se desfaz", [desf.aplicado, desf.votos.mecanicos[0].estado], [true, "desfeito"]);
t("o custo é texto da mesa no histórico", desf.votos.mecanicos[0].historico.at(-1).nota, "Perde a próxima reação");
t("desfeito não emite", V.efeitosDeVotos({ votos: desf.votos }, 4), []);
votos = criar(F.novoVotoTipado({
  tipo: "proprio", permanencia: "permanente", nome: "Sem Espada",
  beneficio: { efeitos: [{ canal: "rdGeral", expr: "1" }], peso: "medio", envolve: ["pe"] },
  maleficio: { efeitos: [], peso: "medio", envolve: ["conhecimento"] },
}));
const idPerm = votos.mecanicos[0].id;
const perm = F.realizaVoto(votos, idPerm, { opId: op(), ctx }).votos;
t("permanente realiza", perm.mecanicos[0].estado, "vigente");
t("permanente não se desfaz", F.desfazVoto(perm, idPerm, { opId: op() }).codigo, "permanente-nao-desfaz");
t("romper permanente é pergunta e recusa", F.quebraVoto(perm, idPerm, { opId: op() }).codigo, "ruptura-permanente-indefinida");
t("só se quebra o que está vigente", F.quebraVoto(votos, idPerm, { opId: op() }).codigo, "nao-vigente");

// Emergencial: reação
votos = criar(F.novoVotoTipado({
  tipo: "emergencial", permanencia: "temporario",
  beneficio: { peso: "leve", envolve: ["feitico"] }, maleficio: { peso: "medio", envolve: ["feitico"] },
}));
const idEm = votos.mecanicos[0].id;
t("Emergencial gasta reação", F.realizaVoto(votos, idEm, { opId: op(), ctx }).acao, "reacao");
const emRes = F.realizaVoto(votos, idEm, { opId: op(), ctx, sessao: sessao0, derived: derivado, registraAcao: true });
t("Emergencial gasta a reação da sessão", emRes.aplicado, true);
t("a reação do Voto fica marcada na rodada", Object.keys(emRes.sessao.uso.acoes.reacoes), [`voto:${idEm}`]);

// Congênita pelo ciclo
votos = criar(F.novoVotoTipado({
  tipo: "congenita", permanencia: "permanente",
  congenita: { atributos: [{ atributo: "forca", limite: 4 }], destinos: { destreza: 4 } },
}));
const idCg = votos.mecanicos[0].id;
t("Congênita fora da criação é recusada", F.declaraCongenita(votos, idCg, { opId: op(), ctx: { criacao: false } }).codigo, "congenita-so-na-criacao");
const cg = F.declaraCongenita(votos, idCg, { opId: op(), ctx: { criacao: true, metodoAtributos: "valoresFixos" } });
t("Congênita na criação vigora", cg.votos.mecanicos[0].estado, "vigente");
t("Congênita não gasta ação", cg.acao, null);
t("Congênita não se quebra", F.quebraVoto(cg.votos, idCg, { opId: op() }).codigo, "congenita-nao-quebra");
t("resumo traz o balanço da Congênita", F.resumoDoVoto(votos, idCg, { criacao: true, metodoAtributos: "valoresFixos" }).balanco, { ganhos: 4, gastos: 4, saldo: 0 });

/* ============================================================ */
/* 5. CONTRATOS (p.356)                                           */
/* ============================================================ */
let cts = F.adicionaVoto({ contratuais: [], mecanicos: [] }, F.novoContrato({ texto: "Cada um cumpre a sua parte", permanencia: "permanente", participantes: ["Ana", "Beto"] })).votos;
const idC = cts.contratuais[0].id;
t("Contrato nasce proposto, na lista de contratuais", [cts.contratuais[0].estado, cts.mecanicos.length], ["proposto", 0]);
t("Contrato gasta ação comum", F.acaoDoVoto(cts.contratuais[0], true), "comum");
t("sem aceite não se realiza", F.avaliaRealizacao(cts, idC).erros.map((e) => e.codigo), ["contrato-nao-aceito", "contrato-incapaz"]);
cts = F.respondeContrato(cts, idC, "Ana", { aceita: true, capaz: true, opId: op() }).votos;
const recusou = F.respondeContrato(cts, idC, "Beto", { aceita: false, capaz: true, opId: op() });
t("recusa fica registrada", recusou.votos.contratuais[0].participantes[1], { nome: "Beto", aceitou: false, capaz: true });
t("quem recusa trava o contrato", F.realizaVoto(recusou.votos, idC, { opId: op() }).codigo, "contrato-nao-aceito");
t("participante inexistente é recusado", F.respondeContrato(cts, idC, "Zé", { aceita: true, opId: op() }).codigo, "participante-inexistente");
const sem = F.retiraParticipante(recusou.votos, idC, "Beto", { opId: op() });
t("tirar o que recusou deixa um só", sem.votos.contratuais[0].participantes.length, 1);
t("um participante só não faz contrato", F.realizaVoto(sem.votos, idC, { opId: op() }).codigo, "contrato-participantes");
cts = F.respondeContrato(cts, idC, "Beto", { aceita: true, capaz: true, opId: op() }).votos;
const comAcaoC = F.realizaVoto(cts, idC, { opId: op(), sessao: sessao0, derived: derivado, registraAcao: true });
t("Contrato realizado gasta a ação comum", [comAcaoC.aplicado, comAcaoC.sessao.uso.acoes.gastas.comum], [true, 1]);
t("Contrato vigente não emite efeito", V.efeitosDeVotos({ votos: comAcaoC.votos }, 4), []);
t("Contrato não é cortado pelo BT", F.realizaVoto(cts, idC, { opId: op(), ctx: { bt: 0, vigentes: 9 } }).aplicado, true);
const rompido = F.quebraVoto(comAcaoC.votos, idC, { opId: op(), rodada: 4, quem: "Beto", consequencia: "O narrador decide a consequência" });
t("quebrar Contrato guarda a consequência da mesa", rompido.votos.contratuais[0].ruptura, { quem: "Beto", consequencia: "O narrador decide a consequência", rodada: 4 });
t("Contrato quebrado fica quebrado", rompido.votos.contratuais[0].estado, "quebrado");
t("a ficha não aplica a consequência", V.efeitosDeVotos({ votos: rompido.votos }, 4), []);
t("Contrato não se desfaz", F.desfazVoto(comAcaoC.votos, idC, { opId: op() }).codigo, "contrato-nao-desfaz");
const cumprido = F.cumpreContrato(comAcaoC.votos, idC, { opId: op() });
t("Contrato cumprido encerra", cumprido.votos.contratuais[0].estado, "encerrado");

/* ============================================================ */
/* 6. PERSISTÊNCIA E DERIVE                                       */
/* ============================================================ */
const salvo = JSON.parse(JSON.stringify({ votos: inter.votos }));
t("o estado sobrevive ao JSON", V.votosDaFicha(salvo).mecanicos[0].historico.length, 4);
t("o merge da ficha preserva os campos novos", mesclaFichaAfty({ votos: fim.votos }).votos.mecanicos[0].maleficioAte, "interludio");
const lixo = V.votosDaFicha({ votos: { mecanicos: [{ id: "z", nome: "z", tipo: "inventado", estado: "xx", historico: [{ evento: "?" }], beneficio: { peso: "enorme", envolve: ["nada"] } }] } });
t("lixo vira ausência", Object.keys(lixo.mecanicos[0]).sort(), ["beneficio", "id", "maleficio", "narrativa", "nome"]);
t("peso e escopo inválidos somem do lado", lixo.mecanicos[0].beneficio, { texto: "", efeitos: [] });

const ficha = createBlankAfty();
ficha.core.nd = 20;
const base = deriveAfty(ficha);
ficha.votos = real.votos;
const vigente = deriveAfty(ficha);
t("Voto vigente chega ao derivado", vigente.rdGeral - base.rdGeral, 4);
ficha.votos = q.votos;
t("Voto quebrado no combate sai do derivado", deriveAfty(ficha).rdGeral - base.rdGeral, 0);
ficha.votos = fim.votos;
const soMaleficio = deriveAfty(ficha);
t("depois do combate só o malefício vale", [soMaleficio.rdGeral - base.rdGeral, soMaleficio.movimento - base.movimento], [0, -3]);
ficha.votos = inter.votos;
t("no interlúdio nada resta", deriveAfty(ficha).movimento - base.movimento, 0);

// Duas fichas sem vazamento: o estado de um Voto de A não toca em B
const fichaA = createBlankAfty(); fichaA.core.nd = 20; fichaA.votos = real.votos;
const fichaB = createBlankAfty(); fichaB.core.nd = 20;
const a1 = deriveAfty(fichaA).rdGeral;
const b1 = deriveAfty(fichaB).rdGeral;
const a2 = deriveAfty(fichaA).rdGeral;
t("duas fichas: A, B, A", [a1 - b1, a2], [4, a1]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
