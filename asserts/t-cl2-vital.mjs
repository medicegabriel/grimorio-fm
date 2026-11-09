/* O NÚCLEO VITAL (CL2, 2026-10-30): saldo negativo, Portas da Morte, estabilização, dano massivo e Ferimentos Complexos
   (Livro p.313 e 314), nos DOIS sistemas (autor, 2026-10-30: valem para o Player e para o Afty).

   ------------------------------------------------------------
   O QUE ESTE ARQUIVO PRENDE
   ------------------------------------------------------------
   N09  Dano comum perdia o saldo negativo: com 10 PV, receber 25 deixava 0 e esquecia os 15.
   N10  Cura comum APAGAVA a dívida: com 15 negativos, curar 1 dava 1 PV e zerava tudo.
   E mais: as Portas da Morte nunca tiveram rolagem, falha por dano, estabilização por Medicina nem morte massiva, e o
   Ferimento Complexo nunca teve gatilho, tabela ou tratamento.

   ⚠ NÃO É O RESTRINGIDO. As exceções dele (Ainda de Pé, Rejeitar a Morte, Mesmo Morto) já existiam, guardavam o saldo em
   `especializacaoSessao.pvNegativos` e passaram a ler o estado vital geral. A seção 12 prova que elas continuam de pé. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const V = await import(R + "ficha/ficha-vital.js");
const M = await import(R + "ficha/ficha-morte.js");
const ESP = await import(R + "ficha/ficha-especializacoes.js");
const AC = await import(R + "ficha/ficha-acoes.js");
const DR = await import(R + "ficha/ficha-dano-recebido.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let contador = 0;
const op = () => ({ opId: `cl2-vital-${++contador}` });

const ficha = (sistema, { classe = "combatente", nivel = 10, con = 10, habilidades = [], origem = "inato" } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "misto", patamar: "comum", origem: { id: origem } };
  f.especializacoes = [{ id: classe, nivel }];
  f.attributes = { ...f.attributes, constituicao: con };
  f.habilidades = habilidades;
  return f;
};
const prepara = (sistema, opcoes) => {
  const f = ficha(sistema, opcoes);
  const d = deriveAfty(f);
  return { f, d, s: SE.sessaoEmBranco(d) };
};
/** A sessão do corpo com `hp` de PV. */
const com = (s, hp) => ({ ...s, hpAtual: hp });
const rngDe = (valor) => () => (valor - 1) / 20 + 0.0001;

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;
  const { d, s: base } = prepara(sistema);
  const MAX = d.hp;

  /* ---------------------------------------------------------- 1. N09, o saldo negativo geral */
  {
    const s = SE.aplicaDano(com(base, 10), 25, d);
    t(tag("N09 dano 25 com 10 PV deixa 0"), s.hpAtual, 0);
    t(tag("N09 registra os 15 negativos"), [s.vital.estado, s.vital.saldo], ["morrendo", 15]);
    t(tag("a casca não protege a dívida que passou dela"), SE.aplicaDano({ ...com(base, 10), pvTempFontes: { Casca: 5 } }, 25, d).vital.saldo, 10);
    t(tag("dano exato a 0 PV entra nas Portas com saldo 0"), (({ vital }) => [vital.estado, vital.saldo])(SE.aplicaDano(com(base, 10), 10, d)), ["morrendo", 0]);
    t(tag("dano que não zera não toca no estado"), SE.aplicaDano(com(base, 10), 9, d).vital.estado, "vivo");
  }

  /* ---------------------------------------------------------- 2. N10, a cura quita antes de subir */
  {
    const caido = SE.aplicaDano(com(base, 10), 25, d);
    const c1 = SE.aplicaCura(caido, 1, MAX);
    t(tag("N10 cura 1 com 15 negativos NÃO sobe o PV"), c1.hpAtual, 0);
    t(tag("N10 e abate a dívida em 1"), [c1.vital.estado, c1.vital.saldo], ["morrendo", 14]);
    const quitada = SE.aplicaCura(c1, 14, MAX);
    t(tag("quitar tudo estabiliza no 0"), [quitada.hpAtual, quitada.vital.estado, quitada.vital.saldo], [0, "estabilizado", 0]);
    const levanta = SE.aplicaCura(quitada, 5, MAX);
    t(tag("depois de estabilizado a cura sobe o PV"), [levanta.hpAtual, levanta.vital.estado], [5, "vivo"]);
    const sobra = SE.aplicaCura(caido, 20, MAX);
    t(tag("a cura maior que a dívida quita e sobe o resto"), [sobra.hpAtual, sobra.vital.estado, sobra.vital.saldo], [5, "vivo", 0]);
    t(tag("a cura passa do máximo só até o máximo"), SE.aplicaCura(caido, MAX + 500, MAX).hpAtual, MAX);
    t(tag("cura em quem não caiu continua igual"), SE.aplicaCura(com(base, 10), 5, MAX).hpAtual, 15);
  }

  /* ---------------------------------------------------------- 3. dano massivo (estritamente maior) */
  {
    const justo = SE.aplicaDano(com(base, 10), 10 + MAX, d);
    t(tag("saldo igual ao máximo ainda não é massivo (passa é maior)"), [justo.vital.estado, justo.vital.saldo], ["morrendo", MAX]);
    const massivo = SE.aplicaDano(com(base, 10), 10 + MAX + 1, d);
    t(tag("saldo acima do máximo morre sem as Portas"), [massivo.vital.estado, massivo.vital.causa, massivo.vital.falhas], ["morto", "massivo", 0]);
    const aos_poucos = SE.aplicaDano(SE.aplicaDano(com(base, 0), MAX - 5, d), 10, d);
    t(tag("o saldo ACUMULADO passando do máximo também mata"), [aos_poucos.vital.estado, aos_poucos.vital.causa], ["morto", "massivo"]);
    t(tag("corpo morto não leva mais dano"), SE.aplicaDano(massivo, 50, d), massivo);
    t(tag("corpo morto não recebe cura"), SE.aplicaCura(massivo, 50, MAX), massivo);
  }

  /* ---------------------------------------------------------- 4. dano enquanto nas Portas */
  {
    const caido = SE.aplicaDano(com(base, 10), 10, d);
    const a = SE.aplicaDano(caido, 7, d);
    t(tag("dano nas Portas dá UMA falha e soma ao saldo"), [a.vital.falhas, a.vital.saldo, a.vital.estado], [1, 7, "morrendo"]);
    const dois = SE.aplicaDano(SE.aplicaDano(caido, 4, d, { ataqueId: "golpe-1" }), 3, d, { ataqueId: "golpe-1" });
    t(tag("dois tipos de dano do MESMO ataque contam uma falha só"), [dois.vital.falhas, dois.vital.saldo], [1, 7]);
    const outros = SE.aplicaDano(SE.aplicaDano(caido, 4, d, { ataqueId: "golpe-1" }), 3, d, { ataqueId: "golpe-2" });
    t(tag("ataques diferentes contam falhas diferentes"), outros.vital.falhas, 2);
    const queda = SE.aplicaDano(SE.aplicaDano(com(base, 10), 15, d, { ataqueId: "g" }), 5, d, { ataqueId: "g" });
    t(tag("o ataque que derrubou não dá falha por dano em si"), [queda.vital.falhas, queda.vital.saldo], [0, 10]);
    const tres = [1, 2, 3].reduce((s, i) => SE.aplicaDano(s, 1, d, { ataqueId: `x${i}` }), caido);
    t(tag("três falhas por dano matam"), [tres.vital.estado, tres.vital.causa], ["morto", "falhas"]);
    const perda = SE.aplicaPerdaDeVida(caido, 2, d);
    t(tag("perda de vida nas Portas soma ao saldo mas não é ataque: sem falha"), [perda.vital.saldo, perda.vital.falhas], [2, 0]);
    const aPerda = SE.aplicaPerdaDeVida(com(base, 3), 8, d);
    t(tag("perda de vida que chega a 0 também entra nas Portas"), [aPerda.vital.estado, aPerda.vital.saldo], ["morrendo", 5]);
    const casca = SE.aplicaDano({ ...caido, pvTempFontes: { Casca: 9 } }, 4, d);
    t(tag("dano absorvido inteiro pela casca não é falha"), [casca.vital.falhas, casca.vital.saldo], [0, 0]);
  }

  /* ---------------------------------------------------------- 5. o teste de morte */
  {
    const caido = SE.aplicaDano(com(base, 10), 10, d);
    const turno = SE.iniciaTurnoFicha(caido, d);
    t(tag("o início do turno abre o teste, e NÃO rola"), [turno.vital.testePendente, turno.vital.falhas, turno.vital.sucessos], [true, 0, 0]);
    t(tag("quem não está nas Portas não ganha teste"), SE.iniciaTurnoFicha(com(base, 10), d).vital.testePendente, false);
    const r = (nat, sess = turno) => M.rolaTesteDeMorte(sess, d, { natural: nat }, op());
    /* Cada faixa do d20 confere as DUAS contagens, falhas e sucessos: um resultado nunca dá as duas. */
    const par = (nat) => (({ sessao }) => [sessao.vital.falhas, sessao.vital.sucessos])(r(nat));
    t(tag("1 natural = duas falhas"), par(1), [2, 0]);
    t(tag("2 = uma falha"), par(2), [1, 0]);
    t(tag("9 = uma falha"), par(9), [1, 0]);
    t(tag("10 = um sucesso"), par(10), [0, 1]);
    t(tag("19 = um sucesso"), par(19), [0, 1]);
    t(tag("20 = dois sucessos"), par(20), [0, 2]);
    t(tag("rolar fecha o teste pendente"), r(12).sessao.vital.testePendente, false);
    t(tag("o resultado fica registrado"), r(7).sessao.vital.ultimoTeste.natural, 7);

    const tresSucessos = (() => {
      let s = turno;
      s = M.rolaTesteDeMorte(s, d, { natural: 15 }, op()).sessao;
      s = SE.iniciaTurnoFicha(s, d);
      s = M.rolaTesteDeMorte(s, d, { natural: 20 }, op()).sessao;
      return s;
    })();
    t(tag("três sucessos estabilizam com 1 PV"), [tresSucessos.hpAtual, tresSucessos.vital.estado, tresSucessos.vital.saldo, tresSucessos.vital.sucessos], [1, "vivo", 0, 0]);
    const comFalha = (() => {
      let s = M.rolaTesteDeMorte(turno, d, { natural: 3 }, op()).sessao;
      s = SE.iniciaTurnoFicha(s, d);
      s = M.rolaTesteDeMorte(s, d, { natural: 20 }, op()).sessao;
      s = SE.iniciaTurnoFicha(s, d);
      s = M.rolaTesteDeMorte(s, d, { natural: 11 }, op()).sessao;
      return s;
    })();
    t(tag("as FALHAS sobrevivem à estabilização"), [comFalha.vital.estado, comFalha.vital.falhas, comFalha.vital.sucessos], ["vivo", 1, 0]);
    const morreu = (() => {
      let s = turno;
      for (const nat of [4, 1]) {
        s = M.rolaTesteDeMorte(s, d, { natural: nat }, op()).sessao;
        if (s.vital.estado === "morto") break;
        s = SE.iniciaTurnoFicha(s, d);
      }
      return s;
    })();
    t(tag("uma falha e depois duas somam três e matam"), [morreu.vital.estado, morreu.vital.causa, morreu.vital.falhas], ["morto", "falhas", 3]);
    t(tag("sem teste pendente a rolagem é recusada"), M.rolaTesteDeMorte(caido, d, { natural: 10 }, op()).codigo, "sem-teste-pendente");
    t(tag("forçar rola sem pendência"), M.rolaTesteDeMorte(caido, d, { natural: 10, forcar: true }, op()).aplicado, true);
    t(tag("fora das Portas é recusado"), M.rolaTesteDeMorte(com(base, 10), d, { natural: 10 }, op()).codigo, "nao-morrendo");
    t(tag("d20 inválido é recusado"), M.rolaTesteDeMorte(turno, d, { natural: 21 }, op()).codigo, "natural-invalido");
    t(tag("sem opId é recusado e devolve a mesma sessão"), (({ sessao, codigo }) => [sessao === turno, codigo])(M.rolaTesteDeMorte(turno, d, { natural: 10 }, {})), [true, "sem-opid"]);
    const uma = M.rolaTesteDeMorte(turno, d, { natural: 2 }, { opId: "fixo" });
    t(tag("repetir o opId não aplica de novo"), (({ repetida, aplicado }) => [repetida, aplicado])(M.rolaTesteDeMorte({ ...uma.sessao, vital: { ...uma.sessao.vital, testePendente: true } }, d, { natural: 2 }, { opId: "fixo" })), [true, false]);
    const rolada = M.rolaTesteDeMorte(turno, d, { rng: rngDe(15) }, op());
    t(tag("sem natural, o d20 sai do rng e entra no log"), [rolada.natural, rolada.sessao.log[0]?.rotulo], [15, "Teste de Morte"]);
  }

  /* ---------------------------------------------------------- 6. estabilização por Medicina */
  {
    const caido = SE.aplicaDano(com(base, 10), 10 + 14, d);
    t(tag("a CD da Medicina é 15 + 1 por 5 PV negativos"), [V.cdDeMedicina(0), V.cdDeMedicina(4), V.cdDeMedicina(5), V.cdDeMedicina(14), V.cdDeMedicina(25)], [15, 15, 16, 17, 20]);
    const falha = M.estabilizaPorMedicina(caido, d, { total: 16 }, op());
    t(tag("Medicina abaixo da CD gasta a tentativa e não muda o corpo"), [falha.aplicado, falha.estabilizou, falha.cd, falha.sessao.vital.estado], [true, false, 17, "morrendo"]);
    const sucesso = M.estabilizaPorMedicina(com(caido, 0), d, { total: 17 }, op());
    t(tag("Medicina na CD estabiliza com 1 PV"), [sucesso.estabilizou, sucesso.sessao.hpAtual, sucesso.sessao.vital.estado, sucesso.sessao.vital.saldo], [true, 1, "vivo", 0]);
    const comFalhas = M.estabilizaPorMedicina({ ...caido, vital: { ...caido.vital, falhas: 2 } }, d, { sucesso: true }, op());
    t(tag("a Medicina não apaga as falhas"), comFalhas.sessao.vital.falhas, 2);
    t(tag("fora de 1,5 m é recusado"), M.estabilizaPorMedicina(caido, d, { total: 99, adjacente: false }, op()).codigo, "fora-do-alcance");
    t(tag("sem resultado é recusado"), M.estabilizaPorMedicina(caido, d, {}, op()).codigo, "sem-resultado");
    t(tag("quem não está nas Portas não precisa"), M.estabilizaPorMedicina(com(base, 10), d, { total: 99 }, op()).codigo, "nao-morrendo");
  }

  /* ---------------------------------------------------------- 7. persistência e fichas antigas */
  {
    let s = SE.aplicaDano(com(base, 10), 30, d);
    s = SE.aplicaDano(s, 4, d);
    s = M.registraFerimento(s, d, { resultado: 4, forcar: true }, op()).sessao;
    const volta = SE.normalizaSessao(JSON.parse(JSON.stringify(s)), d);
    t(tag("o estado vital sobrevive ao salvamento"), volta.vital, s.vital);
    t(tag("o saldo, as falhas e o ferimento estão lá"), [volta.vital.saldo, volta.vital.falhas, volta.vital.ferimentos.length], [24, 1, 1]);
    t(tag("sessão sem o campo abre viva"), SE.normalizaSessao({ hpAtual: 5 }, d).vital, V.vitalEmBranco());
    const antiga = SE.normalizaSessao({
      hpAtual: 0, especializacaoSessao: { pvNegativos: 15, falhasMorte: 1, modoMorte: "portas_da_morte", quedaPendente: true, turno: 3 },
    }, d);
    t(tag("sessão antiga do Restringido MIGRA o saldo e as falhas"), [antiga.vital.saldo, antiga.vital.falhas, antiga.vital.estado], [15, 1, "morrendo"]);
    t(tag("e os campos antigos saem do especializacaoSessao"), [antiga.especializacaoSessao.pvNegativos, antiga.especializacaoSessao.falhasMorte, antiga.especializacaoSessao.quedaPendente, antiga.especializacaoSessao.turno], [undefined, undefined, true, 3]);
    t(tag("ferimento corrompido é descartado"), V.normalizaVital({ ferimentos: [{ uid: "a", rolagem: 99 }, null, { rolagem: 3 }] }).ferimentos, []);
    t(tag("estado desconhecido vira vivo"), V.normalizaVital({ estado: "voando" }).estado, "vivo");
    t(tag("falhas acima de três são aparadas"), V.normalizaVital({ falhas: 9 }).falhas, 3);
    t(tag("morto grava a causa e volta morto"), (({ estado, causa }) => [estado, causa])(V.normalizaVital({ estado: "morto", causa: "massivo" })), ["morto", "massivo"]);
    /* O Encontro guarda a sessão do combatente e a abre pelo mesmo normalizador. */
    t(tag("a sessão do combatente do Encontro mantém o estado"), SE.normalizaSessao(JSON.parse(JSON.stringify(SE.aplicaDano(com(base, 5), 30, d))), d).vital.saldo, 25);
  }

  /* ---------------------------------------------------------- 8. descanso */
  {
    let s = SE.aplicaDano(com(base, 10), 20, d);
    s = SE.aplicaDano(s, 1, d, { ataqueId: "z" });
    s = M.registraFerimento(s, d, { resultado: 7, forcar: true }, op()).sessao;
    const d2 = SE.descansar(s, d);
    t(tag("o descanso tira o corpo das Portas e zera as falhas"), [d2.hpAtual, d2.vital.estado, d2.vital.saldo, d2.vital.falhas], [MAX, "vivo", 0, 0]);
    t(tag("o descanso NÃO cura Ferimento Complexo"), d2.vital.ferimentos.length, 1);
    const morto = SE.aplicaDano(com(base, 1), 999, d);
    t(tag("quem morreu não se levanta descansando"), SE.descansar(morto, d), morto);
  }

  /* ---------------------------------------------------------- 9. conciliação com escritas diretas de PV */
  {
    const caido = SE.aplicaDano(com(base, 10), 25, d);
    const manual = SE.aparaSessao({ ...caido, hpAtual: 12 }, d);
    t(tag("PV escrito à mão acima de 0 tira o corpo das Portas"), [manual.vital.estado, manual.vital.saldo], ["vivo", 0]);
    const falhas = SE.aparaSessao({ ...{ ...caido, vital: { ...caido.vital, falhas: 2 } }, hpAtual: 12 }, d);
    t(tag("e conserva as falhas"), falhas.vital.falhas, 2);
    const revive = SE.aparaSessao({ ...SE.aplicaDano(com(base, 1), 999, d), hpAtual: 30 }, d);
    t(tag("escrever PV num corpo morto devolve a vida e zera as falhas"), [revive.vital.estado, revive.vital.falhas], ["vivo", 0]);
    const igual = SE.aparaSessao(com(base, 10), d);
    t(tag("sessão intacta devolve o MESMO objeto"), SE.aparaSessao(igual, d) === igual, true);
    const semCampo = { ...com(base, 10) };
    delete semCampo.vital;
    t(tag("sessão montada à mão sem o campo continua sem ele"), "vital" in SE.aparaSessao(semCampo, d), false);
    t(tag("três falhas com o PV em 0 são a morte, mesmo escritas por um poder"), V.conciliaVital({ ...V.vitalEmBranco(), estado: "morrendo", falhas: 3 }, 0).estado, "morto");
  }

  /* ---------------------------------------------------------- 10. ações */
  {
    const caido = SE.aplicaDano(com(base, 10), 10, d);
    t(tag("nas Portas ninguém age"), AC.gastaAcao(caido, d, "comum").codigo, "morrendo");
    const morto = SE.aplicaDano(com(base, 1), 999, d);
    t(tag("morto não age"), AC.gastaAcao(morto, d, "comum").codigo, "morto");
    t(tag("quem está de pé age normalmente"), AC.gastaAcao(com(base, 10), d, "comum").usou, "comum");
    const estab = SE.aplicaCura(SE.aplicaDano(com(base, 10), 13, d), 3, MAX);
    t(tag("estabilizado por cura exata (0 PV, fora das Portas) age"), [estab.hpAtual, estab.vital.estado, AC.gastaAcao(estab, d, "comum").usou], [0, "estabilizado", "comum"]);
    t(tag("e qualquer dano o derruba de novo, sem falha por dano"), (({ vital }) => [vital.estado, vital.saldo, vital.falhas])(SE.aplicaDano(estab, 6, d)), ["morrendo", 6, 0]);
  }

  /* ---------------------------------------------------------- 11. Ferimento Complexo */
  {
    t(tag("o limiar é metade do máximo, com mínimo de 50"), [V.limiarDeFerimento(66), V.limiarDeFerimento(100), V.limiarDeFerimento(101), V.limiarDeFerimento(300)], [50, 50, 50, 150]);
    t(tag("um golpe abaixo do limiar não dispara"), SE.aplicaDano(com(base, MAX), 49, d).vital.ferimentosPendentes, 0);
    const bate = SE.aplicaDano(com(base, MAX), 50, d);
    t(tag("um golpe no limiar dispara UM Ferimento"), bate.vital.ferimentosPendentes, 1);
    const dois = SE.aplicaDano(SE.aplicaDano(com(base, MAX), 25, d, { ataqueId: "a" }), 25, d, { ataqueId: "a" });
    t(tag("dois tipos de dano do mesmo ataque somam para o limiar, uma vez"), dois.vital.ferimentosPendentes, 1);
    const tres = SE.aplicaDano(dois, 10, d, { ataqueId: "a" });
    t(tag("e o mesmo ataque não dispara de novo"), tres.vital.ferimentosPendentes, 1);
    const dano2 = SE.aplicaDano(com(bate, MAX), 50, d, { ataqueId: "b" });
    t(tag("outro ataque dispara outro"), dano2.vital.ferimentosPendentes, 2);
    t(tag("perda de vida não é ataque: não dispara"), SE.aplicaPerdaDeVida(com(base, MAX), 60, d).vital.ferimentosPendentes, 0);
    t(tag("a casca absorvendo o golpe ainda conta como dano recebido"), SE.aplicaDano({ ...com(base, MAX), pvTempFontes: { Casca: 80 } }, 55, d).vital.ferimentosPendentes, 1);

    t(tag("a tabela do Livro cobre 1 a 10 sem buraco"), Array.from({ length: 10 }, (_, i) => V.linhaDoFerimento(i + 1)?.grupo), ["olho", "olho", "olhos", "perna", "perna", "pernas", "interna", "braco", "braco", "bracos"]);
    t(tag("fora da tabela não existe"), [V.linhaDoFerimento(0), V.linhaDoFerimento(11)], [null, null]);
    t(tag("sem gatilho pendente não registra"), M.registraFerimento(base, d, { resultado: 3 }, op()).codigo, "sem-gatilho");
    t(tag("resultado fora da tabela é recusado"), M.registraFerimento(bate, d, { resultado: 11 }, op()).codigo, "resultado-invalido");
    const rolado = M.registraFerimento(bate, d, { rng: () => 0.95 }, op());
    t(tag("sem resultado, o d10 sai do rng"), [rolado.ferimento.rolagem, rolado.sessao.vital.ferimentosPendentes], [10, 0]);

    /* Os efeitos que têm caminho no motor */
    const braços = M.registraFerimento(bate, d, { resultado: 10 }, op()).sessao;
    const antes = deriveAfty({ ...ficha(sistema), buffsSessao: bate.buffs });
    const depois = deriveAfty({ ...ficha(sistema), buffsSessao: braços.buffs });
    t(tag("ambos os braços tiram 4 de Destreza pelo Buff de Mesa"), antes.attrEff.destreza - depois.attrEff.destreza, 4);
    t(tag("o buff é o de ferimento e não tem prazo"), braços.buffs.filter((b) => b.id.startsWith("ferimento:")).map((b) => [b.canal, b.alvo, b.expr, b.rodadas]), [["atributo", "destreza", "-4", null]]);
    const olhos = M.registraFerimento(bate, d, { resultado: 3 }, op()).sessao;
    t(tag("ambos os olhos aplicam a condição Cego"), olhos.condicoes.map((c) => [c.nome, c.rodadas]), [["Cego", null]]);
    const perna = M.registraFerimento(bate, d, { resultado: 5 }, op()).sessao;
    t(tag("uma perna aplica a condição Lento (metade do movimento)"), perna.condicoes.map((c) => c.nome), ["Lento"]);
    const dLento = deriveAfty({ ...ficha(sistema) }, { condicoes: perna.condicoes });
    const dNormal = deriveAfty({ ...ficha(sistema) });
    t(tag("e o movimento cai pela metade no derive"), dLento.movimento, dNormal.movimento / 2);
    t(tag("os efeitos persistem no descanso"), (({ condicoes }) => condicoes.map((c) => c.nome))(SE.descansar(perna, d)), ["Lento"]);
    t(tag("o resto é declarado nas restrições"), V.restricoesDeFerimentos(M.registraFerimento(bate, d, { resultado: 1 }, op()).sessao.vital.ferimentos), {
      desvantagemPericias: ["percepcao"], desvantagemAtaqueDistancia: true, cego: false, metadeDoMovimento: false, apenasRasteja: false, maosMax: 2, feridaInterna: false,
    });
    t(tag("um braço limita as mãos e dá desvantagem em atletismo"), (({ maosMax, desvantagemPericias }) => [maosMax, desvantagemPericias])(V.restricoesDeFerimentos([{ grupo: "braco" }])), [1, ["atletismo"]]);
    t(tag("ambos os braços tiram as mãos"), V.restricoesDeFerimentos([{ grupo: "bracos" }]).maosMax, 0);

    /* Ferida interna */
    const interna = M.registraFerimento(bate, d, { resultado: 7 }, op());
    const uid = interna.ferimento.uid;
    t(tag("a CD da ferida interna é 20 + nível, e 10 + nível tratada"), [V.cdDaFeridaInterna(10), V.cdDaFeridaInterna(10, true)], [30, 20]);
    t(tag("tratar exige mestre em Medicina"), M.trataFeridaInterna(interna.sessao, d, { uid }, op()).codigo, "sem-medicina");
    const tratada = M.trataFeridaInterna(interna.sessao, d, { uid, mestreEmMedicina: true }, op());
    t(tag("tratada, a CD cai para 10 + nível"), [tratada.aplicado, tratada.cd], [true, d.nd + 10]);
    t(tag("tratar de novo é recusado"), M.trataFeridaInterna(tratada.sessao, d, { uid, mestreEmMedicina: true }, op()).codigo, "ja-tratada");
    const falhou = M.testeDeFeridaInterna(interna.sessao, d, { natural: 1 }, op());
    t(tag("falhar o teste perde a ação e as reações"), [falhou.sucesso, falhou.perdeAcao, falhou.sessao.vital.semReacoes], [false, true, true]);
    t(tag("e a reação é recusada até o próximo turno"), AC.gastaAcao(falhou.sessao, d, "reacao", { id: "r" }).codigo, "ferida-interna");
    t(tag("o início do turno devolve as reações"), SE.iniciaTurnoFicha(falhou.sessao, d).vital.semReacoes, false);
    /* A CD 30 não cede nem ao 20 natural (o 20 só garante acerto em ATAQUE, p.307). Tratada a CD cai para 20. */
    t(tag("o 20 natural não passa a CD 30 sem o bônus"), M.testeDeFeridaInterna(interna.sessao, d, { natural: 20 }, op()).sucesso, 20 + d.testes.resistencias.find((x) => x.value === "fortitude").bonus >= 30);
    const passou = M.testeDeFeridaInterna(tratada.sessao, d, { natural: 20 }, op());
    t(tag("tratada, passar o teste não custa nada"), [passou.sucesso, passou.perdeAcao, passou.sessao.vital.semReacoes], [true, false, false]);
    t(tag("sem ferida interna é recusado"), M.testeDeFeridaInterna(base, d, { natural: 10 }, op()).codigo, "sem-ferida-interna");

    /* Permanência e recuperação */
    const olho = M.registraFerimento(bate, d, { resultado: 2 }, op());
    const permanente = M.tornaFerimentoPermanente(olho.sessao, { uid: olho.ferimento.uid }, op());
    t(tag("a passagem para permanente é declarada"), permanente.sessao.vital.ferimentos[0].permanente, true);
    t(tag("permanente não passa duas vezes"), M.tornaFerimentoPermanente(permanente.sessao, { uid: olho.ferimento.uid }, op()).codigo, "ja-permanente");
    t(tag("o comum se cura por energia reversa"), M.recuperaFerimento(olho.sessao, d, { via: "energiaReversa", uid: olho.ferimento.uid }, op()).sessao.vital.ferimentos.length, 0);
    t(tag("o permanente só pela alma"), M.recuperaFerimento(permanente.sessao, d, { via: "energiaReversa", uid: olho.ferimento.uid }, op()).codigo, "so-pela-alma");
    t(tag("e com vida e integridade no máximo"), M.recuperaFerimento(com(permanente.sessao, MAX - 1), d, { via: "alma", uid: olho.ferimento.uid }, op()).codigo, "vida-ou-alma-baixa");
    const cheio = M.recuperaFerimento({ ...permanente.sessao, hpAtual: MAX, almaAtual: d.almaMax }, d, { via: "alma", uid: olho.ferimento.uid }, op());
    t(tag("tudo no máximo a alma cura o permanente"), [cheio.aplicado, cheio.sessao.vital.ferimentos.length], [true, 0]);
    t(tag("curar o ferimento tira o efeito de motor"), M.recuperaFerimento(perna, d, { via: "meios", todos: true }, op()).sessao.condicoes, []);
    t(tag("via desconhecida é recusada"), M.recuperaFerimento(perna, d, { via: "oracao", todos: true }, op()).codigo, "via-desconhecida");
    t(tag("sem ferimento é recusado"), M.recuperaFerimento(base, d, { via: "meios", todos: true }, op()).codigo, "sem-ferimento");
    const doisFer = M.registraFerimento(M.registraFerimento(dano2, d, { resultado: 2 }, op()).sessao, d, { resultado: 5 }, op()).sessao;
    t(tag("o Feitiço Curativo cura um só quando pede um"), M.recuperaFerimento(doisFer, d, { via: "feitico", quantidade: 1 }, op()).sessao.vital.ferimentos.length, 1);
    t(tag("e todos quando pede todos"), M.recuperaFerimento(doisFer, d, { via: "feitico", todos: true }, op()).sessao.vital.ferimentos.length, 0);
  }

  /* ---------------------------------------------------------- 13. a entrada do CL1 reaproveita o estado */
  {
    const r = DR.aplicaDanoRecebido(com(base, 10), d, { total: 25, ataqueId: "g1" }, { opId: "dr-1" });
    t(tag("o dano recebido do CL1 registra o saldo"), [r.sessao.vital.estado, r.sessao.vital.saldo, r.abateu], ["morrendo", 15, true]);
    const rp = DR.aplicaDanoRecebido(com(base, 10), d, { total: 25, modo: "perdaDeVida" }, { opId: "dr-2" });
    t(tag("a perda de vida do CL1 também"), [rp.sessao.vital.estado, rp.sessao.vital.saldo], ["morrendo", 15]);
  }
}

/* ---------------------------------------------------------- 12. O RESTRINGIDO CONTINUA DE PÉ */
for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema} Restringido: ${nome}`;
  const f = ficha(sistema, { classe: "restringido", nivel: 20, habilidades: ["res_ainda_de_pe", "res_rejeitar_a_morte", "res_mesmo_morto"], origem: "restringido" });
  const d = deriveAfty(f);
  const base = SE.sessaoEmBranco(d);
  const MAX = d.hp;

  const a = SE.aplicaDano(com(base, 10), 19, d);
  t(tag("Ainda de Pé oferece a queda e o saldo vai para o estado vital"), [a.especializacaoSessao.quedaPendente, a.vital.saldo, ESP.recursosDeEspecializacao(a, d).pvNegativos], [true, 9, 9]);
  const letal = ESP.usarEfeitoEspecializacao(a, d, "res_ainda_de_pe_letal");
  t(tag("Ainda de Pé letal levanta com 1 PV e quita o saldo"), [letal.hpAtual, letal.vital.estado, letal.vital.saldo, letal.especializacaoSessao.cairNoProximoDano], [1, "vivo", 0, true]);
  const cai = SE.aplicaDano(letal, 5, d);
  t(tag("e o próximo dano cai com UMA falha"), [cai.vital.falhas, cai.vital.estado, cai.especializacaoSessao.modoMorte], [1, "morrendo", "caido"]);

  /* Dano massivo adiado pela escolha do Ainda de Pé */
  const massivo = SE.aplicaDano(com(base, 10), 10 + MAX + 5, d);
  t(tag("dano massivo com Ainda de Pé disponível ESPERA a escolha"), [massivo.vital.estado, massivo.vital.massivoPendente], ["morrendo", true]);
  const resiste = ESP.usarEfeitoEspecializacao(massivo, d, "res_ainda_de_pe_letal");
  t(tag("escolher resistir deixa com 1 PV"), [resiste.hpAtual, resiste.vital.estado, resiste.vital.massivoPendente], [1, "vivo", false]);
  const recusa = M.confirmaMorteMassiva(massivo, op());
  t(tag("recusar o Ainda de Pé confirma a morte"), [recusa.aplicado, recusa.sessao.vital.estado, recusa.sessao.vital.causa], [true, "morto", "massivo"]);
  t(tag("sem pendência não há o que confirmar"), M.confirmaMorteMassiva(com(base, 10), op()).codigo, "sem-massivo");
  const gasto = { ...com(base, 10), usos: { "hab:res_ainda_de_pe": 1 } };
  t(tag("sem Ainda de Pé disponível o dano massivo mata na hora"), SE.aplicaDano(gasto, 10 + MAX + 5, d).vital.estado, "morto");

  /* Mesmo Morto: continua de pé, sem as Portas e sem teste de morte */
  const mm = SE.aplicaDano({ ...com(base, 10), usos: { "hab:res_ainda_de_pe": 1 } }, 25, d);
  t(tag("Mesmo Morto fica de pé"), [mm.especializacaoSessao.modoMorte, mm.vital.saldo], ["mesmo_morto", 15]);
  t(tag("e age normalmente apesar do 0 PV"), AC.gastaAcao(mm, d, "comum").usou, "comum");
  t(tag("e não ganha teste de morte no turno"), SE.iniciaTurnoFicha(mm, d).vital.testePendente, false);
  const fim = ESP.encerrarTurnoEspecializacao(mm, d, () => 0);
  t(tag("falhar o teste do fim do turno cai com UMA falha"), [fim.especializacaoSessao.modoMorte, fim.vital.falhas], ["caido", 1]);
  t(tag("e caído ele ganha o teste de morte"), SE.iniciaTurnoFicha(fim, d).vital.testePendente, true);
  t(tag("a CD do Mesmo Morto lê o saldo do estado vital"), ESP.recursosDeEspecializacao(mm, d).cdMesmoMorto, 25 + Math.floor(15 / 5));

  /* Rejeitar a Morte: falha garantida, e passando levanta com 1 PV */
  const rm = SE.aplicaDano(com(base, 10), 19, d);
  const rej = ESP.usarEfeitoEspecializacao({ ...rm, usos: { "hab:res_ainda_de_pe": 1 } }, d, "res_rejeitar_a_morte", () => 0.99);
  t(tag("Rejeitar a Morte passando levanta com 1 PV, com a falha garantida"), [rej.hpAtual, rej.vital.estado, rej.vital.falhas], [1, "vivo", 1]);

  /* A cura comum NÃO desfaz os modos da queda enquanto a dívida existe */
  const cura1 = SE.aplicaCura(a, 1, MAX);
  t(tag("cura parcial mantém os modos da queda"), [cura1.especializacaoSessao.modoMorte, cura1.vital.estado], ["portas_da_morte", "morrendo"]);
  const cura9 = SE.aplicaCura(a, 20, MAX);
  t(tag("quitando a dívida os modos acabam"), [cura9.especializacaoSessao.modoMorte, cura9.especializacaoSessao.quedaPendente, cura9.vital.estado], [null, false, "vivo"]);
}

/* ---------------------------------------------------------- 14. CORPO MORTO NÃO VOLTA POR CAMINHO AUTOMÁTICO */
for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema} morto: ${nome}`;
  /* Corpo de Aço: regeneração comum no início do turno, com o estado ligado na bancada de combate */
  const fa = ficha(sistema, { classe: "restringido", nivel: 20, habilidades: ["res_corpo_de_aco"], origem: "restringido" });
  fa.combate = { ...fa.combate, ativo: true, corpoDeAco: true };
  const da = deriveAfty(fa);
  const ba = { ...SE.sessaoEmBranco(da), combate: { ativo: true, corpoDeAco: true } };
  const morta = SE.aplicaDano(com(ba, 1), 9999, da);
  t(tag("o fixture do Corpo de Aço está ligado"), [!!da.combate.corpoDeAco, morta.vital.estado], [true, "morto"]);
  const turnoMorta = ESP.iniciarTurnoEspecializacao(morta, da, () => 0.5);
  t(tag("Corpo de Aço NÃO regenera corpo morto"), [turnoMorta.hpAtual, turnoMorta.vital.estado, turnoMorta.log.length], [0, "morto", morta.log.length]);
  const devendo = SE.aplicaDano(com(ba, 10), 10 + 30, da);
  const regen = ESP.iniciarTurnoEspecializacao(devendo, da, () => 0.5);
  const total = regen.log[0]?.total ?? 0;
  t(tag("Corpo de Aço em quem está morrendo QUITA a dívida antes de subir o PV (é cura comum)"), [total > 0, regen.vital.saldo, regen.hpAtual], [true, Math.max(0, 30 - total), Math.max(0, total - 30)]);
  const vivo = ESP.iniciarTurnoEspecializacao(com(ba, 10), da, () => 0.5);
  t(tag("Corpo de Aço em quem está vivo cura normalmente"), vivo.hpAtual, Math.min(da.hp, 10 + (vivo.log[0]?.total ?? 0)));

  /* Ainda de Pé, Rejeitar a Morte e Mesmo Morto */
  const fb = ficha(sistema, { classe: "restringido", nivel: 20, habilidades: ["res_ainda_de_pe", "res_rejeitar_a_morte", "res_mesmo_morto"], origem: "restringido" });
  const db = deriveAfty(fb);
  const bb = SE.sessaoEmBranco(db);
  const massivo = SE.aplicaDano(com(bb, 10), 10 + db.hp + 5, db);
  const morto = M.confirmaMorteMassiva(massivo, op()).sessao;
  t(tag("a morte massiva confirmada deixa o Ainda de Pé sem uso gasto"), [morto.vital.estado, ESP.recursosDeEspecializacao(morto, db).ainda], ["morto", true]);
  t(tag("Ainda de Pé não ressuscita corpo morto"), ESP.usarEfeitoEspecializacao(morto, db, "res_ainda_de_pe") === morto, true);
  t(tag("a variante letal também não"), ESP.usarEfeitoEspecializacao(morto, db, "res_ainda_de_pe_letal") === morto, true);
  const rejeita = ESP.usarEfeitoEspecializacao(morto, db, "res_rejeitar_a_morte", () => 0.99);
  t(tag("Rejeitar a Morte não ressuscita, e a falha garantida também não vale"), [rejeita === morto, rejeita.vital.falhas, rejeita.hpAtual], [true, morto.vital.falhas, 0]);
  t(tag("a cura rolada do Ainda de Pé não vale para corpo morto"), [ESP.prepararRolagemEspecializacao({ fonteCuraId: "cura_ainda_de_pe" }, morto, db), ESP.aplicarCuraRoladaEspecializacao(morto, { fonteCuraId: "cura_ainda_de_pe" }, { total: 10 }, db) === morto], [null, true]);
  const mm = { ...SE.aplicaDano({ ...com(bb, 10), usos: { "hab:res_ainda_de_pe": 1 } }, 25, db) };
  const mortoMM = { ...mm, vital: { ...mm.vital, estado: "morto", causa: "falhas" } };
  t(tag("o teste do Mesmo Morto não rola em corpo morto (nem escreve no log)"), ESP.encerrarTurnoEspecializacao(mortoMM, db, () => 0).log.length, mortoMM.log.length);

  /* Ampliação de recurso e Bloodfeast: a escrita automática de PV não devolve a vida */
  const dAmp = { ...db, recursosAmpliados: { base: { hp: db.hp, pe: db.pe }, estados: [{ id: "amplia", label: "Amplia", ampliaRecursos: { hp: 50 } }] } };
  const estadoAmp = { id: "amplia", ampliaRecursos: true };
  const emCombate = { ...com(bb, 10), combate: { ativo: true } };
  const vivoAmp = SE.alteraEstadoCombate(emCombate, estadoAmp, true, dAmp);
  t(tag("controle: a ampliação sobe o PV de quem está vivo"), vivoAmp.hpAtual, 10 + Math.floor(db.hp * 50 / 100));
  const mortoAmp = SE.alteraEstadoCombate({ ...morto, combate: { ativo: true } }, estadoAmp, true, dAmp);
  t(tag("a ampliação de recurso NÃO devolve PV ao corpo morto"), [mortoAmp.hpAtual, mortoAmp.vital.estado], [0, "morto"]);
  const comBlood = { ...morto, energiaEmVida: 3 };
  t(tag("o ganho de PV do Bloodfeast não ressuscita"), (({ hpAtual, vital }) => [hpAtual, vital.estado])(SE.aplicaPeTemporario(comBlood, [{ chave: "x", valor: 10 }])), [0, "morto"]);
  const vivoBlood = SE.aplicaPeTemporario({ ...com(bb, 5), energiaEmVida: 3 }, [{ chave: "x", valor: 10 }]);
  t(tag("controle: o ganho do Bloodfeast sobe o PV de quem está vivo"), vivoBlood.hpAtual, 5 + 10 * 3);

  /* A condição do Ferimento entra pelo único escritor */
  const bate = SE.aplicaDano(com(bb, db.hp), 60, db);
  const cego = M.registraFerimento({ ...bate, bloodfeastRegras: ["pureza_refinada"] }, db, { resultado: 3, forcar: true }, op()).sessao;
  t(tag("a condição do ferimento passa pelo defineCondicoes (a regra do Bloodfeast que limita a duração a 1 rodada age sobre ela)"), cego.condicoes.map((c) => [c.nome, c.rodadas]), [["Cego", 1]]);
  const normal = M.registraFerimento(bate, db, { resultado: 3, forcar: true }, op()).sessao;
  t(tag("sem a regra do addon, a condição do ferimento não tem prazo"), normal.condicoes.map((c) => [c.nome, c.rodadas]), [["Cego", null]]);
}

/* ---------------------------------------------------------- 15. O AVISO da barra de PV */
{
  const aviso = (v) => V.avisoDoVital({ ...V.vitalEmBranco(), ...v });
  t("aviso: corpo inteiro não mostra nada", aviso({}), null);
  t("aviso: morrendo mostra o saldo e as falhas", aviso({ estado: "morrendo", saldo: 12, falhas: 2 }), "Morrendo, 12 PV Negativos, 2 Falhas");
  t("aviso: teste pendente aparece enquanto morrendo", aviso({ estado: "morrendo", testePendente: true }), "Morrendo, Teste de Morte Pendente");
  t("aviso: morto diz a causa", aviso({ estado: "morto", causa: "massivo" }), "Morto por Dano Massivo");
  t("aviso: estabilizado", aviso({ estado: "estabilizado" }), "Estabilizado");
  t("aviso: falhas que sobram depois de levantar", aviso({ falhas: 1 }), "1 Falha de Morte");
  t("aviso: o Ferimento PENDENTE não entra (nenhum botão o resolve ainda, e um aviso que não some vira ruído)", aviso({ ferimentosPendentes: 3 }), null);
  t("aviso: ferimentos já registrados aparecem", aviso({ ferimentos: [{}, {}] }), "2 Ferimentos Complexos");
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
