/* O MOTOR DE AUTOMAÇÃO NA CARACTERÍSTICA LIVRE DA INVOCAÇÃO, 2026-09-10.

   O autor, escolhendo como a Invocação ganha Motor:

     *"Faça igual Feitiços Passivas para Caracteristica."*

   A Passiva é o Feitiço cujo corpo é o Motor, e a Livre virou a Característica
   cujo corpo é o Motor. Ela continua ocupando vaga e custando 1 PE como toda
   Característica. Três decisões do autor na mesma conversa, e cada uma tem
   bloco próprio aqui:

     1. duas Características com o mesmo efeito, uma delas pelo Motor, NÃO
        acumulam: vale a maior (a Habilidade de Controlador soma por cima);
     2. os 19 canais que já existiam e mais os de ALVO: atributo, TR, perícia e
        RD por tipo;
     3. o atributo pelo Motor para no máximo do grau.

   ⚠ O que este arquivo prova é o STAT BLOCK, e não o card. A Invocação já teve
   duas vezes o bug de o card mostrar o número e o stat block não mudar (as
   Características em agosto, o Modificador logo depois). Todo assert abaixo
   compara o número resolvido, ou a soma das parcelas contra ele.

   ⚠ Número, e não aparência. Render não se testa aqui. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const { vocabularioInvocacao } = await import(R + "afty-dsl-vocabulario.js");
const { TIPOS_DANO } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const soma = (lista) => (lista || []).reduce((n, p) => n + (Number(p.valor) || 0), 0);
const temAviso = (r, trecho) => (r.warnings || []).some((w) => w.includes(trecho));

const DONO = { nd: 10, bt: 4, nivelControlador: 10 };
const livre = (nome, efeitos) => ({ ...INV.createBlankCaracteristica(), nome, subtipo: "livre", efeitos });
const invocacao = (grau = "terceiro", caracteristicas = []) => {
  const i = INV.createBlankInvocacao(grau);
  i.id = "inv-motor";
  i.nome = "Kon";
  i.caracteristicas = caracteristicas;
  return i;
};
const res = (inv, dono = DONO) => INV.resolveInvocacao(inv, dono);
const TIPO = "queimante" in TIPOS_DANO ? "queimante" : Object.keys(TIPOS_DANO)[0];

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */
t("o validador do catálogo de Invocação fecha zerado", INV.validarCatalogoInvocacoes(), []);
t("a Característica em branco nasce com o Motor vazio", INV.createBlankCaracteristica().efeitos, []);
t("os 19 canais de antes seguem no catálogo, e mais os dois novos",
  INV.EFEITO_CANAIS.length, 21);
for (const id of ["atributo", "bonusPericia"]) {
  t(`o canal ${id} existe`, INV.EFEITO_CANAIS.includes(id), true);
}
t("o rótulo mora no motor", INV.INV_EFEITO_CANAL_LABEL.defesa, "Defesa");
t("todo canal está num grupo do seletor",
  INV.INV_EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens).length, INV.EFEITO_CANAIS.length);
t("o vocabulário de alvo de atributo tem os seis", INV.alvoOpcoesInvocacao("atributo").length, 6);
t("o de TR deixa Integridade de fora",
  INV.alvoOpcoesInvocacao("tr").some((o) => o.value === "integridade"), false);

/* ============================================================ */
/* 2. A LIVRE COM MOTOR MEXE NO STAT BLOCK                        */
/* ============================================================ */
const r0 = res(invocacao());
const rDef = res(invocacao("terceiro", [livre("Casca", [{ canal: "defesa", expr: "3" }])]));
t("Defesa sobe 3", rDef.defesa - r0.defesa, 3);
t("as parcelas da Defesa fecham com o número", soma(rDef.fontes.defesa), rDef.defesa);
t("a parcela leva o nome da Característica",
  rDef.fontes.defesa.some((p) => p.label === "Casca" && p.valor === 3), true);
t("a Livre com Motor custa 1 PE, como toda Característica", rDef.custo - r0.custo, 1);
t("e ocupa uma vaga do orçamento", rDef.orcamento.usados - r0.orcamento.usados, 1);
t("a linha volta resolvida para o editor",
  { valor: rDef.caracteristicas[0].efeitos[0].valor, ativo: rDef.caracteristicas[0].efeitos[0].ativo },
  { valor: 3, ativo: true });
t("o card diz o que ela concede", rDef.caracteristicas[0].resumoMotor, "+3 Defesa");

const rGrau = res(invocacao("terceiro", [livre("Escala", [{ canal: "defesa", expr: "grau" }])]));
t("a expressão lê o namespace da invocação (Terceiro Grau é 2)", rGrau.defesa - r0.defesa, 2);

/* ============================================================ */
/* 3. `sempre` E `nunca` NO CONTEXTO DA INVOCAÇÃO                  */
/* ============================================================ */
/* Elas existiam só no contexto da criatura, e o campo "enquanto" mostra
   "sempre" como exemplo. Escrita aqui, a palavra caía no zero e DESLIGAVA a
   linha, que é o engano de 2026-08-31 de novo. */
t("`sempre` vale 1 no contexto da invocação", r0.contextoDsl.sempre, 1);
t("`nunca` vale 0", r0.contextoDsl.nunca, 0);
const nomesVocab = vocabularioInvocacao(r0.contextoDsl).flatMap((g) => g.itens.map((i) => i.nome));
t("o seletor { } conhece `sempre`, e o editor não a pinta de vermelho", nomesVocab.includes("sempre"), true);
const rSempre = res(invocacao("terceiro", [livre("A", [{ canal: "defesa", expr: "2", quando: "sempre" }])]));
t("quando: sempre liga", rSempre.defesa - r0.defesa, 2);
const rNunca = res(invocacao("terceiro", [livre("A", [{ canal: "defesa", expr: "2", quando: "nunca" }])]));
t("quando: nunca desliga", rNunca.defesa - r0.defesa, 0);
t("e a linha desligada volta inativa, com o valor",
  { valor: rNunca.caracteristicas[0].efeitos[0].valor, ativo: rNunca.caracteristicas[0].efeitos[0].ativo },
  { valor: 2, ativo: false });

/* ============================================================ */
/* 4. MESMO EFEITO NÃO ACUMULA: VALE A MAIOR                      */
/* ============================================================ */
const rDuas = res(invocacao("terceiro", [
  livre("Casca", [{ canal: "defesa", expr: "2" }]),
  livre("Couraça", [{ canal: "defesa", expr: "3" }]),
]));
t("duas Livres de Defesa: vale a maior", rDuas.defesa - r0.defesa, 3);
t("e sai aviso", temAviso(rDuas, "não acumulam"), true);
t("a parcela é só a vencedora",
  rDuas.fontes.defesa.filter((p) => p.label === "Casca" || p.label === "Couraça").map((p) => p.label), ["Couraça"]);

const rDentro = res(invocacao("terceiro", [
  livre("Casca", [{ canal: "defesa", expr: "2" }, { canal: "defesa", expr: "1" }]),
]));
t("dentro de UMA Característica as linhas somam", rDentro.defesa - r0.defesa, 3);
t("e não há aviso de acúmulo", temAviso(rDentro, "não acumulam"), false);

const rPena = res(invocacao("terceiro", [
  livre("Ferida", [{ canal: "defesa", expr: "-2" }]),
  livre("Rasgo", [{ canal: "defesa", expr: "-4" }]),
]));
t("entre penalidades vale a PIOR", rPena.defesa - r0.defesa, -4);
const rMisto = res(invocacao("terceiro", [
  livre("Ferida", [{ canal: "defesa", expr: "-4" }]),
  livre("Casca", [{ canal: "defesa", expr: "3" }]),
]));
t("bônus e penalidade não disputam entre si", rMisto.defesa - r0.defesa, -1);

// PV do Motor contra a Característica de Vida (Terceiro Grau dá 10).
const vida = { ...INV.createBlankCaracteristica(), nome: "Corpo Grande", subtipo: "vida" };
const rVida = res(invocacao("terceiro", [vida]));
const rPvMaior = res(invocacao("terceiro", [vida, livre("Colosso", [{ canal: "pv", expr: "25" }])]));
t("Motor de PV maior que a Vida: vale o Motor, e não a soma", rPvMaior.pv - r0.pv, 25);
t("a parcela do PV leva o nome da Livre",
  rPvMaior.fontes.pv.some((p) => p.label === "Colosso" && p.valor === 25), true);
t("as parcelas do PV fecham", soma(rPvMaior.fontes.pv), rPvMaior.pv);
t("e avisa que não acumulam", temAviso(rPvMaior, "não acumulam"), true);
const rPvMenor = res(invocacao("terceiro", [vida, livre("Colosso", [{ canal: "pv", expr: "5" }])]));
t("Motor de PV menor que a Vida: vale a Vida", rPvMenor.pv - r0.pv, rVida.pv - r0.pv);
t("e a parcela é a da Vida",
  rPvMenor.fontes.pv.some((p) => p.label === "Corpo Grande"), true);

// A Habilidade de Controlador soma POR CIMA da Característica.
const donoHab = { ...DONO, efeitos: [{ canal: "defesa", expr: "2", nome: "Guarda do Dono" }] };
const rHab0 = res(invocacao(), donoHab);
const rHab = res(invocacao("terceiro", [livre("Casca", [{ canal: "defesa", expr: "3" }])]), donoHab);
t("a Habilidade segue somando com a Livre", rHab.defesa - r0.defesa, 5);
t("sem aviso de acúmulo entre Habilidade e Característica", temAviso(rHab, "não acumulam"), false);
t("e a Habilidade sozinha dá 2", rHab0.defesa - r0.defesa, 2);

/* ============================================================ */
/* 5. ATRIBUTO: SOMA E PARA NO MÁXIMO DO GRAU                     */
/* ============================================================ */
// Terceiro Grau: máximo 20.
const comForca = (efeitos) => {
  const i = invocacao("terceiro", efeitos ? [livre("Força Bruta", efeitos)] : []);
  i.atributos = { ...i.atributos, forca: 18, destreza: 8 };
  return i;
};
const rF0 = res(comForca(null));
const rF = res(comForca([{ canal: "atributo", alvo: "forca", expr: "4" }]));
t("Força 18 + 4 para no máximo 20", rF.atributos.valores.forca, 20);
t("o modificador é o do valor efetivo", rF.atributos.mods.forca, 5);
t("o que passou do máximo vira aviso", temAviso(rF, "Força: 2 de bônus acima do máximo 20 do grau."), true);
t("as parcelas do atributo fecham com o valor", soma(rF.atributos.partes.forca), 20);
t("o bônus aplicado é o que coube", rF.atributos.bonus.forca, 2);
t("o orçamento de pontos NÃO muda (bônus não é ponto gasto)", rF.atributos.usados, rF0.atributos.usados);
t("o acerto corpo a corpo sobe com o modificador (4 para 5)",
  rF.testes.acerto.corpo.bonus - rF0.testes.acerto.corpo.bonus, 1);
t("o contexto de DSL segue lendo o valor BASE", rF.contextoDsl.forca, 18);

const rCon = res(invocacao("terceiro", [livre("Vigor", [{ canal: "atributo", alvo: "constituicao", expr: "2" }])]));
t("Constituição do Motor entra no PV, e as parcelas fecham", soma(rCon.fontes.pv), rCon.pv);
t("e o PV de fato mudou", rCon.pv > r0.pv, true);

const rSemAlvo = res(invocacao("terceiro", [livre("Vago", [{ canal: "atributo", expr: "2" }])]));
t("atributo sem alvo não mexe em nada", rSemAlvo.atributos.valores, r0.atributos.valores);
t("e avisa", temAviso(rSemAlvo, "Escolha o atributo deste efeito."), true);
t("a linha diz ao editor que o alvo é obrigatório", rSemAlvo.caracteristicas[0].efeitos[0].alvoObrigatorio, true);
const rAlvoRuim = res(invocacao("terceiro", [livre("Vago", [{ canal: "atributo", alvo: "sorte", expr: "2" }])]));
t("alvo que não existe também avisa", temAviso(rAlvoRuim, "Escolha o atributo deste efeito."), true);

/* ============================================================ */
/* 6. OS CANAIS COM ALVO                                          */
/* ============================================================ */
const tr = (r, id) => r.testes.resistencias.find((x) => x.value === id);
const rFort = res(invocacao("terceiro", [livre("Pele", [{ canal: "bonusTR", alvo: "fortitude", expr: "2" }])]));
t("TR com alvo sobe só aquele TR", tr(rFort, "fortitude").bonus - tr(r0, "fortitude").bonus, 2);
t("e não os outros", tr(rFort, "reflexos").bonus - tr(r0, "reflexos").bonus, 0);
t("as parcelas de Fortitude fecham", soma(tr(rFort, "fortitude").partes), tr(rFort, "fortitude").bonus);
t("as de Reflexos também, sem a parcela alheia", soma(tr(rFort, "reflexos").partes), tr(rFort, "reflexos").bonus);
const rTodos = res(invocacao("terceiro", [livre("Pele", [{ canal: "bonusTR", expr: "1" }])]));
t("TR sem alvo segue valendo em todos",
  ["fortitude", "reflexos", "vontade"].map((id) => tr(rTodos, id).bonus - tr(r0, id).bonus), [1, 1, 1]);

// Habilidade com alvo (canal por alvo pelo `dono.efeitos`) também soma.
const rTrHab = res(invocacao(), { ...DONO, efeitos: [{ canal: "bonusTR", alvo: "vontade", expr: "3", nome: "Mente Firme" }] });
t("Habilidade com alvo num TR", tr(rTrHab, "vontade").bonus - tr(r0, "vontade").bonus, 3);
t("e a parcela dela está só em Vontade",
  [tr(rTrHab, "vontade").partes.some((p) => p.label === "Mente Firme"),
    tr(rTrHab, "reflexos").partes.some((p) => p.label === "Mente Firme")], [true, false]);
const rTrSemAlvo = res(invocacao(), { ...DONO, efeitos: [{ canal: "atributo", expr: "3", nome: "Sem Rumo" }] });
t("Habilidade de canal com alvo obrigatório sem alvo vira aviso",
  temAviso(rTrSemAlvo, "Sem Rumo: Atributo sem alvo."), true);

const per = (r, id) => r.testes.pericias.find((x) => x.id === id);
const rPer = res(invocacao("terceiro", [livre("Olhos", [{ canal: "bonusPericia", alvo: "percepcao", expr: "3" }])]));
t("perícia não treinada com bônus do Motor ganha linha", !!per(rPer, "percepcao"), true);
t("as parcelas dela fecham", soma(per(rPer, "percepcao").partes), per(rPer, "percepcao").bonus);
t("a parcela leva o nome da Livre",
  per(rPer, "percepcao").partes.some((p) => p.label === "Olhos" && p.valor === 3), true);
const teste = { ...INV.createBlankCaracteristica(), nome: "Faro", subtipo: "teste", alvoTeste: "pericia", periciaId: "percepcao" };
const rTeste = res(invocacao("terceiro", [teste]));
const rPerMaior = res(invocacao("terceiro", [teste, livre("Olhos", [{ canal: "bonusPericia", alvo: "percepcao", expr: "6" }])]));
t("Motor de perícia maior que a Característica de Teste: vale o Motor",
  per(rPerMaior, "percepcao").bonus - per(rTeste, "percepcao").bonus, 6 - 4);
t("e avisa", temAviso(rPerMaior, "não acumulam"), true);

const rRd = res(invocacao("terceiro", [livre("Brasa", [{ canal: "rd", alvo: TIPO, expr: "5" }])]));
const linhaRd = rRd.rd.porTipo.find((l) => l.chave === TIPO);
t("RD por tipo do Motor abre a linha do tipo", !!linhaRd, true);
t("o total dela soma a Geral", linhaRd?.total, 5 + rRd.rd.geral);
t("e as parcelas fecham", soma(rRd.fontes.rdPorTipo[TIPO]), linhaRd?.total);
const rdCarac = { ...INV.createBlankCaracteristica(), nome: "Escamas", subtipo: "rd", rdTipo: TIPO };
const rRdMaior = res(invocacao("terceiro", [rdCarac, livre("Brasa", [{ canal: "rd", alvo: TIPO, expr: "5" }])]));
t("contra a Característica de RD do mesmo tipo (4): vale o Motor, numa linha só",
  rRdMaior.rd.porTipo.filter((l) => l.chave === TIPO).map((l) => l.valor), [5]);
const rRdMenor = res(invocacao("terceiro", [rdCarac, livre("Brasa", [{ canal: "rd", alvo: TIPO, expr: "3" }])]));
t("e a Característica vence quando é maior", rRdMenor.rd.porTipo.find((l) => l.chave === TIPO)?.valor, 4);
const rRdGeral = res(invocacao("terceiro", [livre("Couro", [{ canal: "rd", expr: "2" }])]));
t("RD sem alvo é a Geral", rRdGeral.rd.geral - r0.rd.geral, 2);
const rRdHab = res(invocacao(), { ...DONO, efeitos: [{ canal: "rd", alvo: TIPO, expr: "4", nome: "Bênção" }] });
const linhaHab = rRdHab.rd.porTipo.find((l) => l.chave === TIPO);
t("RD por tipo de Habilidade abre linha própria", linhaHab?.total, 4 + rRdHab.rd.geral);
t("sem parcela de Característica atrás, e fechando",
  soma(rRdHab.fontes.rdPorTipo[TIPO]), linhaHab?.total);

/* ============================================================ */
/* 7. OS CANAIS DE AÇÃO CHEGAM ÀS AÇÕES                           */
/* ============================================================ */
/* O Motor da Livre escreve nos canais das Habilidades, e eles chegam às Ações
   pelo `donoLocal`. Por isso as Características passaram a resolver ANTES
   dele: resolvidas depois, a linha apareceria no card e a Ação sairia igual. */
const comAtaque = (caracs, dono = DONO) => {
  const i = invocacao("terceiro", caracs);
  const a = INV.createBlankAcao();
  a.id = "acao-mordida"; a.nome = "Mordida"; a.familia = "ataque"; a.classe = "complexa";
  i.acoes = [a];
  return res(i, dono);
};
const aHab = comAtaque([], { ...DONO, efeitos: [{ canal: "danoNivel", expr: "1", nome: "Fúria" }] });
const aLivre = comAtaque([livre("Presas", [{ canal: "danoNivel", expr: "1" }])]);
const aNada = comAtaque([]);
t("Níveis de Dano da Livre sobem o dado da Ação igual ao da Habilidade",
  aLivre.acoes[0].dano.dado, aHab.acoes[0].dano.dado);
t("e o dado mudou de fato", aLivre.acoes[0].dano.dado !== aNada.acoes[0].dano.dado, true);
const aAcerto = comAtaque([livre("Mira", [{ canal: "acerto", expr: "2" }])]);
t("Acerto da Livre entra na jogada da Ação", aAcerto.acoes[0].bonusAtaque - aNada.acoes[0].bonusAtaque, 2);

/* ============================================================ */
/* 8. O QUE NÃO PODE SUMIR CALADO                                 */
/* ============================================================ */
const rCanal = res(invocacao("terceiro", [livre("Erro", [{ canal: "voar", expr: "1" }])]));
t("canal desconhecido na Livre avisa", temAviso(rCanal, "desconhecido"), true);
const rVazia = res(invocacao("terceiro", [livre("Nova", [{ canal: "defesa", expr: "" }])]));
t("a linha vazia (a que o botão acabou de criar) não avisa nada",
  rVazia.warnings.filter((w) => w.startsWith("Nova")), []);
t("e volta na lista, senão o editor a perderia", rVazia.caracteristicas[0].efeitos.length, 1);
const rResumo = res(invocacao("terceiro", [livre("Duas Coisas", [
  { canal: "defesa", expr: "2" }, { canal: "atributo", alvo: "forca", expr: "1" },
])]));
t("o resumo junta as linhas ativas", rResumo.caracteristicas[0].resumoMotor, "+2 Defesa · +1 Força");
t("clonar a invocação leva o Motor junto",
  INV.cloneInvocacao(invocacao("terceiro", [livre("A", [{ canal: "defesa", expr: "1" }])]))
    .caracteristicas[0].efeitos.length, 1);

/* ============================================================ */
/* 9. A HORDA LÊ O LÍDER RESOLVIDO                                */
/* ============================================================ */
const lider = invocacao("terceiro", [livre("Colosso", [{ canal: "pv", expr: "25" }])]);
lider.id = "lider";
const liderNu = invocacao("terceiro");
liderNu.id = "lider";
const membro = INV.createBlankInvocacao("quarto");
membro.id = "membro";
const horda = { id: "h", nome: "Matilha", liderId: "lider", membroIds: ["membro"] };
t("o PV da Livre do líder chega à Horda",
  INV.resolveHorda(horda, [lider, membro], DONO).pv - INV.resolveHorda(horda, [liderNu, membro], DONO).pv, 25);

/* ============================================================ */
/* 10. OS DOIS SISTEMAS, PELO deriveAfty                          */
/* ============================================================ */
/* Autor: a mudança vale para a criatura E para o personagem. Nenhuma
   divergência nova, então os dois lados têm de dar o MESMO número. */
const fichaDe = (sistema, comLivre) => {
  const f = createBlankAfty();
  f.name = "Controlador do Motor";
  f.rulesVersion = sistema;
  f.core.nd = 10;
  f.core.nivel = 10;
  f.especializacoes = [{ id: "controlador", nivel: 10 }];
  const i = INV.createBlankInvocacao("terceiro");
  i.id = "inv-derive";
  i.caracteristicas = comLivre ? [livre("Casca", [{ canal: "defesa", expr: "3" }])] : [];
  f.invocacoes = [i];
  return f;
};
for (const sistema of ["afty", "player"]) {
  const defesa = (comLivre) => deriveAfty(fichaDe(sistema, comLivre)).invocacoes.lista
    .find((x) => x.id === "inv-derive").defesa;
  t(`${sistema}: a Livre sobe a Defesa pelo derive`, defesa(true) - defesa(false), 3);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
