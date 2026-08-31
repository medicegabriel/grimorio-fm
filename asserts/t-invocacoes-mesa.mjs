/* SHIKIGAMIS NA MESA, 2026-08-31.

   O autor: *"na Ficha Final, a aba de Shikigamis ficou horripilante de entender
   e usar tudo que eu tenho a dispor. A impressão que dá é que você fez
   Shikigamis como se fossem só mais uma habilidade qualquer, quando eles são a
   Peça CHAVE em um personagem Controlador."*

   Duas regras dele fecharam o motor desta leva:

     1. INTEGRIDADE DA INVOCAÇÃO: "Máximo igual ao PV dela". É a régua do livro
        do JOGADOR (Integridade da Alma = máximo de Pontos de Vida), e não a
        porcentagem de 0 a 100 da criatura.

     2. AUXÍLIO LIGADO MEXE NO NÚMERO: *"Mexe na ficha do DONO de verdade e na
        ficha da INVOCAÇÃO de verdade. Por exemplo, um shikigami pode escolher
        entre me BUFFAR ou se BUFFAR com +5 de Defesa usando suas ações."*

   ⚠ Este arquivo prova NÚMERO, e não aparência. Render não se testa aqui. */
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
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* A ficha de teste                                              */
/* ============================================================ */
/* Um Controlador ND 10, com uma invocação de Segundo Grau e três Ações de
   Auxílio: uma que defende a si mesma, uma que defende o dono e uma de RD no
   dono. Segundo Grau porque a tabela dele dá números distintos entre si (Defesa
   3, RD 6), então um número trocado aparece na hora. */
const auxilio = (id, sub, alvo, classe = "simples") => ({
  id, nome: `Aux ${id}`, familia: "auxilio", auxilioSub: sub, alvoAuxilio: alvo,
  classe, custoPE: 0,
});

function ficha() {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tipo = "misto";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  c.invocacoes = [{
    ...INV.createBlankInvocacao("segundo"),
    id: "INV1",
    nome: "Nue",
    acoes: [
      auxilio("A_SELF", "defesa", "invocacao"),
      auxilio("A_DONO", "defesa", "aliados"),
      auxilio("A_RD", "rd", "aliados"),
      auxilio("A_ACERTO", "acerto", "invocacao"),
      auxilio("A_DADO", "danoAdicional", "aliados"),
      { id: "A_CURA", nome: "Curar", familia: "auxilio", auxilioSub: "cura", alvoAuxilio: "aliados", classe: "complexa" },
    ],
  }];
  return c;
}

const comSessao = (invocacoes) => deriveAfty(ficha(), invocacoes ? { invocacoes } : {});
const invDe = (d) => d.invocacoes.lista[0];

/* ============================================================ */
/* 1. Os campos novos existem e a Integridade é o PV             */
/* ============================================================ */

const base = comSessao(null);
const i0 = invDe(base);
t("a invocacao resolve", i0.id, "INV1");
t("Integridade maxima = PV maximo", i0.almaMax, i0.pv);
/* Um número redondo é pior que um número conferido: Segundo Grau é
   `40 + Constituição + ND`, e a base de atributo do Shikigami comum é 8. */
t("o PV do Segundo Grau bate com a tabela", i0.pv, 40 + 8 + 10);
t("nasce fora de campo", i0.emCampo, false);
t("retrato nasce vazio", [i0.portraitUrl, i0.aparencia], ["", null]);
t("foco do retrato nasce no centro", i0.portraitFocus, { x: 50, y: 50 });

/* ============================================================ */
/* 2. Fora de campo, nenhum auxílio vale                         */
/* ============================================================ */
/* ⚠ É a regra que impede bônus de sobreviver à fonte. Ligar tudo com a
   invocação guardada tem de dar exatamente o mesmo número de não ligar nada. */

const tudoLigadoForaDeCampo = {
  INV1: { emCampo: false, auxilios: { A_SELF: true, A_DONO: true, A_RD: true, A_ACERTO: true } },
};
const fora = comSessao(tudoLigadoForaDeCampo);
t("fora de campo: a Defesa do dono nao muda", fora.defesa, base.defesa);
t("fora de campo: a RD do dono nao muda", fora.rdGeral, base.rdGeral);
t("fora de campo: a Defesa dela nao muda", invDe(fora).defesa, i0.defesa);
t("fora de campo: nenhum auxilio ligado", invDe(fora).auxilios.every((a) => !a.ligado), true);

/* ============================================================ */
/* 3. "Se BUFFAR": o alvo Invocação sobe o número DELA           */
/* ============================================================ */

const soEla = comSessao({ INV1: { emCampo: true, auxilios: { A_SELF: true } } });
const iEla = invDe(soEla);
/* Segundo Grau, Ação Simples: a tabela de Bônus de Defesa dá 3. */
t("Defesa dela sobe 3 (Segundo Grau, Simples)", iEla.defesa - i0.defesa, 3);
t("e a Defesa do DONO nao se mexe", soEla.defesa, base.defesa);
t("a linha do auxilio aparece ligada", iEla.auxilios.find((a) => a.id === "A_SELF").ligado, true);
t("e a irmã dela continua desligada", iEla.auxilios.find((a) => a.id === "A_DONO").ligado, false);

/* ============================================================ */
/* 4. "Me BUFFAR": o alvo Aliados sobe o número do DONO          */
/* ============================================================ */

const soDono = comSessao({ INV1: { emCampo: true, auxilios: { A_DONO: true } } });
t("Defesa do dono sobe 3", soDono.defesa - base.defesa, 3);
t("e a Defesa DELA nao se mexe", invDe(soDono).defesa, i0.defesa);

/* ⚠ O NOME DA FONTE APARECE NO HOVER. Número certo com detalhamento errado é
   bug (a regra do `defesaAtributo`), e um bônus de Shikigami sem nome na lista
   de fontes é exatamente isso. */
const fontesDefesa = (d) => (d.partes?.defesa ?? []).map((p) => p.nome ?? p.label ?? "");
t("a fonte da Defesa nomeia a invocacao e a acao",
  fontesDefesa(soDono).some((n) => n.includes("Nue") && n.includes("Aux A_DONO")), true);

/* ============================================================ */
/* 5. RD e Acerto seguem as mesmas duas portas                   */
/* ============================================================ */

const comRd = comSessao({ INV1: { emCampo: true, auxilios: { A_RD: true } } });
/* Segundo Grau, Ação Simples: a tabela de RD de Ação dá 6. */
t("RD Geral do dono sobe 6", comRd.rdGeral - base.rdGeral, 6);

const comAcerto = comSessao({ INV1: { emCampo: true, auxilios: { A_ACERTO: true } } });
const iAcerto = invDe(comAcerto);
/* Segundo Grau, Ação Simples: a tabela de Bônus de Acerto dá 3. */
t("o Acerto dela sobe 3 nos dois tipos de ataque", [
  iAcerto.testes.acerto.corpo.bonus - i0.testes.acerto.corpo.bonus,
  iAcerto.testes.acerto.distancia.bonus - i0.testes.acerto.distancia.bonus,
], [3, 3]);

/* ============================================================ */
/* 6. Cura e Dano Adicional NÃO são interruptor                  */
/* ============================================================ */
/* Os dois são EVENTO e não estado: a cura rola e devolve PV, e o dano adicional
   é "em um próximo ataque", um dado, uma vez. Um interruptor neles prometeria
   um bônus permanente que o livro não dá. */

const linhas = Object.fromEntries(i0.auxilios.map((a) => [a.id, a]));
t("Defesa, Acerto e RD sao sustentaveis",
  ["A_SELF", "A_DONO", "A_RD", "A_ACERTO"].every((id) => linhas[id].sustentavel), true);
t("Cura e Dano Adicional nao sao",
  ["A_CURA", "A_DADO"].some((id) => linhas[id].sustentavel), false);
t("mas os dois continuam na lista, com o que entregam",
  [linhas.A_CURA.subLabel, linhas.A_DADO.dado], ["Cura", "2d6"]);

/* Ligar um insustentável não pode mexer em número nenhum, mesmo em campo. */
const forcado = comSessao({ INV1: { emCampo: true, auxilios: { A_CURA: true, A_DADO: true } } });
t("ligar Cura e Dano Adicional a força nao muda a Defesa", forcado.defesa, base.defesa);
t("nem a RD", forcado.rdGeral, base.rdGeral);

/* ============================================================ */
/* 7. A Ação Complexa vale 1,5x, arredondado para baixo          */
/* ============================================================ */
/* Regra geral do sistema (autor, 2026-07-18). Segundo Grau: Defesa 3 vira 4. */

const c = ficha();
c.invocacoes[0].acoes = [auxilio("A_CPX", "defesa", "aliados", "complexa")];
const cpx = deriveAfty(c, { invocacoes: { INV1: { emCampo: true, auxilios: { A_CPX: true } } } });
const cpxSem = deriveAfty(c, {});
t("Complexa: 3 vira 4 (piso de 1,5x)", cpx.defesa - cpxSem.defesa, 4);

/* ============================================================ */
/* 8. Somam entre si, e por invocação                            */
/* ============================================================ */

const doisNoDono = comSessao({ INV1: { emCampo: true, auxilios: { A_DONO: true, A_RD: true } } });
t("Defesa e RD juntos, cada um no seu canal",
  [doisNoDono.defesa - base.defesa, doisNoDono.rdGeral - base.rdGeral], [3, 6]);

const dois = ficha();
dois.invocacoes.push({
  ...INV.createBlankInvocacao("terceiro"),
  id: "INV2", nome: "Toad",
  acoes: [auxilio("B_DONO", "defesa", "aliados")],
});
const dosDois = deriveAfty(dois, {
  invocacoes: {
    INV1: { emCampo: true, auxilios: { A_DONO: true } },
    INV2: { emCampo: true, auxilios: { B_DONO: true } },
  },
});
const semNenhum = deriveAfty(dois, {});
/* Segundo Grau 3 + Terceiro Grau 2. Duas invocações somam, e é o esperado: o
   livro limita AUXÍLIOS REPETIDOS pelo Prejuízo por Múltiplos, que é regra de
   uso na mesa, e não duas invocações diferentes ajudando ao mesmo tempo. */
t("duas invocacoes somam no dono", dosDois.defesa - semNenhum.defesa, 5);

/* ============================================================ */
/* 9. O estado de sessão: escrever, apagar e descansar           */
/* ============================================================ */

const s0 = SES.sessaoEmBranco(base);
t("a sessao nasce sem invocacao nenhuma", s0.invocacoes, {});
t("invocacao intocada le como cheia e fora de campo",
  SES.estadoDaInvocacao(s0, "INV1"),
  { emCampo: false, pvAtual: null, almaAtual: null, pvTempFontes: {}, auxilios: {}, abatida: false, exorcizada: false });

/* ⚠ Ligar um auxílio TRAZ ao campo. Era a alternativa a um interruptor
   desabilitado que não diz o que falta fazer. */
const s1 = SES.alternaAuxilioInvocacao(s0, "INV1", "A_DONO", true);
t("ligar um auxilio traz ao campo", [s1.invocacoes.INV1.emCampo, s1.invocacoes.INV1.auxilios.A_DONO], [true, true]);

/* ⚠ Sair de campo apaga os auxílios, e NÃO o PV: "ela pode ser reinvocada com
   os PVs que possuía". */
const s2 = SES.aplicaDanoInvocacao(s1, "INV1", 20, i0.pv);
t("o dano desce do PV maximo", s2.invocacoes.INV1.pvAtual, i0.pv - 20);
const s3 = SES.poeInvocacaoEmCampo(s2, "INV1", false);
t("dissipar apaga os auxilios", s3.invocacoes.INV1.auxilios, {});
t("mas guarda o PV que ela tinha", s3.invocacoes.INV1.pvAtual, i0.pv - 20);

const s4 = SES.aplicaCuraInvocacao(s3, "INV1", 5, i0.pv);
t("a cura sobe, sem passar do maximo", s4.invocacoes.INV1.pvAtual, i0.pv - 15);
t("e a cura nunca passa do teto",
  SES.aplicaCuraInvocacao(s4, "INV1", 9999, i0.pv).invocacoes.INV1.pvAtual, i0.pv);

const s5 = SES.defineVitalInvocacao(s4, "INV1", "alma", 3, i0.almaMax);
t("a Integridade se escreve direto", s5.invocacoes.INV1.almaAtual, 3);

const s6 = SES.poeInvocacaoEmCampo(s5, "INV1", true);
const s7 = SES.descansar(s6, base);
t("o descanso enche PV e Integridade",
  [s7.invocacoes.INV1.pvAtual, s7.invocacoes.INV1.almaAtual], [null, null]);
t("o descanso derruba os auxilios", s7.invocacoes.INV1.auxilios, {});
t("mas quem estava em campo continua em campo", s7.invocacoes.INV1.emCampo, true);

/* ⚠ APARAR CONTRA O MÁXIMO. Tirar uma Característica de Vida no criador com a
   Ficha aberta deixaria o PV corrente acima do teto, e a barra passaria de
   100%. É a mesma razão de o dono ser aparado. */
const acima = SES.normalizaSessao({ invocacoes: { INV1: { pvAtual: 9999, almaAtual: 9999 } } }, base);
const aparada = SES.aparaSessao(acima, base);
t("PV e Integridade aparam no maximo da invocacao",
  [aparada.invocacoes.INV1.pvAtual, aparada.invocacoes.INV1.almaAtual], [i0.pv, i0.almaMax]);

/* Invocação que sumiu da ficha NÃO perde o que tinha: alguém pode estar editando
   o criador noutra aba no meio da luta. */
const orfa = SES.aparaSessao(
  SES.normalizaSessao({ invocacoes: { SUMIDA: { pvAtual: 7 } } }, base), base,
);
t("invocacao orfa sobrevive na sessao", orfa.invocacoes.SUMIDA.pvAtual, 7);

/* ============================================================ */
/* 10. O motor não muda quando ninguém liga nada                 */
/* ============================================================ */
/* ⚠ O assert mais importante do arquivo. Uma ficha sem sessão de invocação tem
   de derivar EXATAMENTE como derivava antes desta leva, senão toda criatura já
   montada mudou de número por causa de uma feature que ninguém usou. */

const semSessao = deriveAfty(ficha(), {});
const sessaoVazia = deriveAfty(ficha(), { invocacoes: {} });
for (const k of ["defesa", "rdGeral", "hp", "pe", "cd", "atencao", "iniciativa"]) {
  t(`sessao vazia nao mexe em ${k}`, sessaoVazia[k], semSessao[k]);
}
t("nem na Defesa da invocacao", invDe(sessaoVazia).defesa, invDe(semSessao).defesa);

/* ============================================================ */
/* 11. Retrato e CSS por Shikigami                               */
/* ============================================================ */
/* O autor, 2026-08-31: *"faça com que cada Shikigami tenha direito a uma imagem
   própria na criação e na ficha final. Além disso, na Ficha Final, cada
   Shikigami terá um CSS Personalizado próprio em sua ficha."* */

const TEMA = await import(R + "ficha/ficha-tema.js");

t("o escopo da ficha nao mudou", TEMA.ESCOPO_FICHA, "#afty-ficha");
t("o escopo de uma invocacao sai do id", TEMA.escopoDaInvocacao("I_NUE"), "#afty-inv-I_NUE");

/* ⚠ SEM TEMA PRÓPRIO, NENHUM BLOCO. Emitir o preset padrão para quem não temou
   arrancaria o shikigami do tema do dono, que é o oposto do esperado: quem não
   escolhe herda. */
t("invocacao sem tema nao emite CSS", TEMA.cssDaInvocacao({ id: "X", aparencia: null }), "");

const comTema = TEMA.cssDaInvocacao({
  id: "I_NUE",
  aparencia: {
    presetId: "padrao",
    vars: { "--afty-destaque": "#22d3ee" },
    css: ".afty-inv-titulo { text-transform: uppercase }",
    ligado: true,
    imagem: { url: "", opacidade: 0.25, encaixe: "cover", posicao: "center top" },
  },
});
t("o bloco de variaveis abre no seletor DELA",
  comTema.startsWith("#afty-inv-I_NUE {"), true);
t("a variavel escolhida esta no bloco", comTema.includes("--afty-destaque: #22d3ee;"), true);
/* ⚠ O CSS livre entra dentro do `@scope`, e não solto. Sem escopo ele vaza para
   a ficha inteira, e o shikigami repintaria o dono. Em node não há
   `CSSScopeRule`, então `escopoSuportado()` é falso e o bloco sai cru: o que se
   mede aqui é que o texto do usuário chegou, e a prova do escopo é o assert de
   navegador (dois shikigamis temados, cada um com a sua cor). */
t("o CSS livre do usuario entra no bloco",
  comTema.includes("text-transform: uppercase"), true);

/* Tema DESLIGADO mantém as variáveis e derruba só o CSS livre, igual ao tema da
   ficha: o interruptor é o bote salva-vidas de quem escreveu CSS que se
   trancou para fora, e não um desliga-tudo. */
const desligado = TEMA.cssDaInvocacao({
  id: "I_NUE",
  aparencia: { presetId: "padrao", vars: {}, css: ".x{}", ligado: false, imagem: { url: "" } },
});
t("tema desligado nao emite o CSS livre", desligado.includes(".x{}"), false);

/* Os campos novos sobrevivem ao clone, que gera ids novos mas não pode perder
   nem o retrato nem o tema. */
const clonada = INV.cloneInvocacao({
  ...INV.createBlankInvocacao("segundo"),
  id: "ORIG", portraitUrl: "https://exemplo/x.png", portraitFocus: { x: 20, y: 80 },
  aparencia: { css: ".a{}" },
});
t("o clone leva retrato, foco e tema",
  [clonada.portraitUrl, clonada.portraitFocus, clonada.aparencia.css],
  ["https://exemplo/x.png", { x: 20, y: 80 }, ".a{}"]);
t("mas ganha id novo", clonada.id !== "ORIG", true);

/* ============================================================ */
/* 12. Chegar a zero, e o dano que exorciza                      */
/* ============================================================ */
/* Verbatim do livro (docs/afty-invocacoes.md):
     *"Quando uma Invocação chega a 0 pontos de vida, ela é dissipada ou
      desativada"*
     *"quando uma Invocação que já tenha sido desativada é invocada novamente,
      ela retorna com metade dos seus pontos de vida máximos, até que seja feito
      um descanso curto ou longo"*
     *"caso uma Invocação receba dano excedente superior ao seu máximo de vida,
      ela é exorcizada ou destruída"* */

const PV = i0.pv; // 58

/* Em campo, com dois auxílios ligados, e leva dano até o zero. */
let sX = SES.poeInvocacaoEmCampo(SES.sessaoEmBranco(base), "INV1", true, PV);
sX = SES.alternaAuxilioInvocacao(sX, "INV1", "A_DONO", true);
sX = SES.aplicaDanoInvocacao(sX, "INV1", PV, PV);
const abatida = SES.estadoDaInvocacao(sX, "INV1");
t("zerar o PV tira de campo", abatida.emCampo, false);
t("e apaga os auxilios junto", abatida.auxilios, {});
t("marca abatida", [abatida.abatida, abatida.exorcizada, abatida.pvAtual], [true, false, 0]);

/* ⚠ E O BÔNUS QUE ELA DAVA MORRE COM ELA. É o assert que prova que a regra
   chegou ao NÚMERO do dono, e não só a um selo na tela. */
t("o bonus que ela dava some do dono",
  deriveAfty(ficha(), { invocacoes: sX.invocacoes }).defesa, base.defesa);

/* A volta é pela metade, e `piso` porque todo arredondamento do Afty é para
   baixo salvo o texto dizer o contrário. */
const voltou = SES.estadoDaInvocacao(SES.poeInvocacaoEmCampo(sX, "INV1", true, PV), "INV1");
t("quem foi abatida volta com metade do PV", voltou.pvAtual, Math.floor(PV / 2));
t("e volta em campo", voltou.emCampo, true);

/* ⚠ VALE PARA TODA REINVOCAÇÃO ATÉ O DESCANSO, e não só para a primeira: o
   texto diz "até que seja feito um descanso curto ou longo". */
let sY = SES.poeInvocacaoEmCampo(sX, "INV1", true, PV);
sY = SES.poeInvocacaoEmCampo(sY, "INV1", false, PV);
t("a segunda reinvocacao tambem vem pela metade",
  SES.estadoDaInvocacao(SES.poeInvocacaoEmCampo(sY, "INV1", true, PV), "INV1").pvAtual,
  Math.floor(PV / 2));

/* O descanso limpa a marca, e aí ela volta cheia. */
const descansada = SES.descansar(sX, base);
t("o descanso apaga a marca de abatida", SES.estadoDaInvocacao(descansada, "INV1").abatida, false);
t("e depois dele ela volta cheia",
  SES.estadoDaInvocacao(SES.poeInvocacaoEmCampo(descansada, "INV1", true, PV), "INV1").pvAtual, null);

/* Dano que zera mas NÃO passa do máximo: abatida, e nada mais. */
const soAbate = SES.aplicaDanoInvocacao(SES.sessaoEmBranco(base), "INV1", PV + PV, PV);
t("excedente igual ao maximo ainda nao exorciza",
  SES.estadoDaInvocacao(soAbate, "INV1").exorcizada, false);

/* ⚠ "SUPERIOR ao seu máximo": o excedente é o que passou de zero, e ele tem de
   passar do MÁXIMO, não do que restava. Um golpe de 2×PV+1 exorciza. */
const exorcizada = SES.aplicaDanoInvocacao(SES.sessaoEmBranco(base), "INV1", 2 * PV + 1, PV);
t("excedente superior ao maximo exorciza",
  SES.estadoDaInvocacao(exorcizada, "INV1").exorcizada, true);

/* ⚠ E O DESCANSO NÃO A TRAZ DE VOLTA: *"não pode ser recuperada por métodos
   convencionais, sendo perdida permanentemente"*, e descansar é o método mais
   convencional que existe. */
t("o descanso nao desfaz a exorcizacao",
  SES.estadoDaInvocacao(SES.descansar(exorcizada, base), "INV1").exorcizada, true);

/* ⚠ A LISTA DA CRIATURA NÃO É MEXIDA, e é decisão a confirmar (docs/a-fazer.md):
   a Ficha Final opera, não edita ficha. Um clique errado no dano apagaria um
   shikigami inteiro sem desfazer. */
t("a invocacao continua na ficha depois de exorcizada",
  deriveAfty(ficha(), { invocacoes: exorcizada.invocacoes }).invocacoes.total, 1);

/* ⚠ AS DUAS PORTAS DA BARRA APLICAM A MESMA REGRA. O campo de texto e os botões
   de passo são dois caminhos para o mesmo fato, e só um deles dissipava: quem
   digitasse `0` ficava com um shikigami morto em campo, ainda sustentando os
   bônus. */
let sZ = SES.poeInvocacaoEmCampo(SES.sessaoEmBranco(base), "INV1", true, PV);
sZ = SES.alternaAuxilioInvocacao(sZ, "INV1", "A_DONO", true);
sZ = SES.defineVitalInvocacao(sZ, "INV1", "pv", 0, PV);
const porCampo = SES.estadoDaInvocacao(sZ, "INV1");
t("escrever zero no PV tira de campo", porCampo.emCampo, false);
t("escrever zero apaga os auxilios", porCampo.auxilios, {});
t("escrever zero marca abatida", porCampo.abatida, true);
t("mas escrever zero NAO exorciza", porCampo.exorcizada, false);
t("e o bonus some do dono por esse caminho tambem",
  deriveAfty(ficha(), { invocacoes: sZ.invocacoes }).defesa, base.defesa);

/* Escrever um valor acima de zero não mexe em campo nenhum. */
const vivo = SES.estadoDaInvocacao(
  SES.defineVitalInvocacao(SES.poeInvocacaoEmCampo(SES.sessaoEmBranco(base), "INV1", true, PV), "INV1", "pv", 5, PV),
  "INV1",
);
t("escrever PV acima de zero mantem em campo", [vivo.emCampo, vivo.pvAtual, vivo.abatida], [true, 5, false]);

/* Zerar a INTEGRIDADE não dissipa: a regra do livro fala de pontos de vida. */
const almaZero = SES.estadoDaInvocacao(
  SES.defineVitalInvocacao(SES.poeInvocacaoEmCampo(SES.sessaoEmBranco(base), "INV1", true, PV), "INV1", "alma", 0, i0.almaMax),
  "INV1",
);
t("zerar a Integridade nao tira de campo", [almaZero.emCampo, almaZero.abatida], [true, false]);

/* ============================================================ */
/* 13. O tema da invocacao e um DELTA, e nao um tema inteiro     */
/* ============================================================ */
/* ⚠ BUG ACHADO NA REVISAO DE 2026-08-31, e ele era calado. A sub-aba Aparencia
   do criador grava `{ css, ligado }` e mais nada, e o `normalizaTema` preenchia
   o `presetId` com "padrao" na leitura. Resultado: uma linha de CSS livre num
   shikigami carimbava as 13 cores do preset padrao dentro do `#afty-inv-<id>` e
   arrancava ele do tema do dono. Uma ficha verde ganhava um shikigami roxo e
   ardosia no meio, sem ninguem ter pedido.

   A ficha do DONO emite o preset resolvido porque ela e o tema inteiro, e nao
   tem em cima de quem cair. A invocacao cai em cima da ficha, entao ela emite
   so o que escolheu. */

const varsDe = (out) => (out.match(/--afty-[a-z-]+:/g) || []).length;
const temaDe = (ap) => TEMA.cssDaInvocacao({ id: "I_NUE", aparencia: ap });

/* Uma linha de CSS livre e mais nada: zero variavel, e o CSS chega. */
const soCss = temaDe({ css: ".afty-inv-titulo { color: #22d3ee }", ligado: true });
t("so CSS livre nao emite variavel nenhuma", varsDe(soCss), 0);
t("mas o CSS livre chega", soCss.includes("#22d3ee"), true);

/* Uma cor escolhida no formulario: sai UMA linha, e nao a paleta. */
t("uma cor escolhida emite uma linha so",
  varsDe(temaDe({ vars: { "--afty-destaque": "#22d3ee" }, ligado: true })), 1);

/* ⚠ ESCOLHER "PADRAO" NAO E ESCOLHER UM PRESET. O primeiro preset e o estado
   "sem preset meu", que e o mesmo que o botao de limpar devolve. E e exatamente
   o que o painel grava ao abrir, porque o `normalizaTema` o preenche. */
t("o preset Padrao explicito nao carimba a paleta",
  varsDe(temaDe({ presetId: "padrao", vars: {}, ligado: true })), 0);

/* Um preset NOMEADO e um pedido explicito de "outra cara", e af sim vale a
   paleta inteira. */
const nomeado = TEMA.PRESETS[1];
t("um preset nomeado carimba a paleta inteira",
  varsDe(temaDe({ presetId: nomeado.id, vars: {}, ligado: true })),
  Object.keys(nomeado.vars).length);

/* ⚠ E A FICHA DO DONO NAO MUDOU. Ela continua emitindo o preset resolvido,
   porque ela e o tema inteiro. Um assert dos dois lados, porque o conserto
   estava a uma linha de valer para as duas e quebrar a ficha. */
t("a ficha do dono segue emitindo o preset resolvido",
  varsDe(TEMA.cssDasVars({ presetId: "padrao", vars: {} })) > 0, true);
t("e o bloco dela ainda abre no #afty-ficha",
  TEMA.cssDasVars({ presetId: "padrao", vars: {} }).startsWith("#afty-ficha {"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
