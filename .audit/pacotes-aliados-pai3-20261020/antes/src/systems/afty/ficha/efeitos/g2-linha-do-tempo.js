/* ============================================================
   G2 · LINHA DO TEMPO FUNCIONAL: a previsão é a VIRADA DO MOTOR
   ============================================================
   A previsão não reescreve regra nenhuma: ela roda o `proximaRodada` do
   motor (ficha-sessao.js) sobre CÓPIAS da sessão, três vezes, com a ficha
   recalculada a cada passo (`prepararCalculo`, a mesma conta da tela). É a
   mesma chamada que o botão Próxima Rodada faz (`avancaRodadaComRegistro`
   em sessao-g2.js), sem gravar nada: consultar não avança rodada, não cobra e
   não escreve no histórico.

   A ordem que importa (e que a previsão antiga errava): na virada, a casca
   de PE Temporário do gatilho `rodada` volta ao teto ANTES de o Invencível
   sob o Sol cobrar os 4 PE. Com zero PE agora, a renovação pode manter o
   Invencível. Rodando o motor, a previsão herda essa ordem sem copiá-la.

   O que entra (só o que a ficha CONTA ou COBRA na virada):
     - condição e registro com rodadas: a barra vai até a última rodada em
       que eles ainda estão na sessão projetada;
     - Invencível sob o Sol: o contador PRÓPRIO ("1 de 4"), a manutenção
       como condicional ("Se Mantido"), a cobrança no começo da rodada
       seguinte, a Exaustão no fim da rodada e o encerramento previsto;
     - a Exaustão ainda devida depois de o Invencível ser encerrado;
     - Aura Excessiva: a escolha opcional e manual de pagar no começo de
       cada rodada (o texto do estudo), sem presumir pagamento.
   O que NÃO entra: turno, ataque, minuto, cena e duração manual (Cobrir-se,
   Concentrar Aura, Canalizar em Golpe). O motor não os conta na virada, e a
   Linha do Tempo não inventa contador.
   ============================================================ */
import { Sessao } from "./ponte";
import { aquecerCalculo, prepararCalculo } from "./recebidos";
import { depoisDaVirada, estaLigado } from "./efeitos-dados";

export const energiaDe = (s) => Math.max(0, Math.trunc(Number(s?.peAtual) || 0)) + Sessao.peTempTotal(s);

/* A tela mostra a rodada de agora e as três seguintes. A projeção vai uma
   virada além, para dizer o que acontece no FIM da última coluna (a Exaustão
   e o encerramento do Invencível na quarta rodada dele). */
export const COLUNAS = 4;

/** A mesma projeção, como GERADOR: devolve o controle depois de cada virada (um derive cada), para quem a roda decidir quando continuar. */
export function* projetarViradasEmPassos(ficha, sessao, derived, passos = COLUNAS) {
  const out = [{ sessao, derived, expirou: [] }];
  for (let i = 0; i < passos; i++) {
    const ant = out[i];
    const { sessao: prox, expirou } = Sessao.proximaRodada(ant.sessao, ant.derived);
    /* O mesmo acabamento do botão: o `avancarRodada` apara pelos máximos de
       antes da virada, e o `depoisDaVirada` junta a reserva da Terra. */
    const s = depoisDaVirada({ sessao: Sessao.aparaSessao(prox, ant.derived) }).sessao;
    if (aquecerCalculo(ficha, s)) yield out;
    out.push({ sessao: s, derived: prepararCalculo(ficha, s).derived, expirou });
    yield out;
  }
  return out;
}

/** As viradas previstas: [agora, +1, ..., +passos], cada uma com a sessão e o derive daquele momento. */
export function projetarViradas(ficha, sessao, derived, passos = COLUNAS) {
  const it = projetarViradasEmPassos(ficha, sessao, derived, passos);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

const ESTADO_INV = "invencivelSobOSol";
const ESTADO_AURA = "auraExcessiva";
const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
const rotuloRodadas = (n) => (n === 1 ? "Última Rodada" : `${n} Rodadas`);
const comeco = (r) => `Começo da Rodada ${r}`;
const fimDa = (r) => `Fim da Rodada ${r}`;
/* Um marcador: o símbolo na faixa e a explicação completa da sobreposição.
   `texto` é a frase inteira (rótulo acessível); `condicao` diz quando o
   acontecimento depende de o jogador manter o efeito. */
function marca({ evento, tom = "atencao", icone, lado, acontecimento, quando, motivo = null, condicao = null, nota = null }) {
  const texto = [acontecimento, quando, motivo, condicao].filter(Boolean).join(" · ");
  return { evento, tom, icone, lado, acontecimento, quando, motivo, condicao, nota, texto };
}
const invencivel = (s) => {
  const c = s.combate ?? {};
  return { ativo: !!(c.ativo && c[ESTADO_INV]), contador: inteiro(c.invencivelRodadas), pendente: !!c.invencivelPendenteExaustao };
};

/* As células de uma linha: [{ seg, marcas }], uma por rodada. */
const vazias = (n) => Array.from({ length: n }, () => ({ seg: null, marcas: [] }));
/* Junta os segmentos vizinhos numa barra: começo e fim. */
function emendar(celulas) {
  celulas.forEach((c, k) => {
    if (!c.seg) return;
    const antes = celulas[k - 1]?.seg, depois = celulas[k + 1]?.seg;
    c.seg.ini = !antes || antes.tipo !== c.seg.tipo;
    c.seg.fim = !depois || depois.tipo !== c.seg.tipo;
  });
  return celulas;
}

/**
 * As linhas da Linha do Tempo a partir da projeção e dos ativos do gerenciador.
 * [{ chave, nome, sub, alvo, celulas: [{ seg: { pre?, texto, tipo, ini, fim }, marcas: [{ evento, tom, icone, lado, acontecimento, quando, motivo, condicao, nota, texto }] }] }]
 * `alvo`: { tipo: "ativo" | "encerrado", chave } para a navegação.
 */
export function linhasDoTempo(P, ativos, encerrados = [], colunas = COLUNAS) {
  /* As células cobrem a projeção inteira (a barra que passa da última coluna
     fica aberta à direita) e saem cortadas nas colunas da tela. */
  const n = P.length;
  const corta = (celulas) => emendar(celulas).slice(0, colunas);
  const temMarca = (celulas) => celulas.slice(0, colunas).some((c) => c.marcas.length);
  const geral = (k) => P[k].sessao.rodada;
  const linhas = [];

  /* 1. Condições e registros com rodadas (o motor desce um por virada e tira o que zera). */
  for (const a of ativos) {
    if (!["condicao", "buff", "registro"].includes(a.tipo) || a.rodadas == null) continue;
    const id = a.tipo === "condicao" ? a.cond.id : (a.buff ?? a.reg).id;
    const lista = (s) => (a.tipo === "condicao" ? s.condicoes : s.buffs) ?? [];
    const celulas = vazias(n);
    P.forEach((p, k) => {
      const x = lista(p.sessao).find((y) => y.id === id);
      if (x) celulas[k].seg = { texto: k === 0 ? rotuloRodadas(x.rodadas) : "", tipo: "contado" };
    });
    linhas.push({ chave: a.chave, nome: a.nome, sub: null, alvo: { tipo: "ativo", chave: a.chave }, celulas: corta(celulas) });
  }

  /* 2. Invencível sob o Sol: ativo agora, ou encerrado com a Exaustão ainda devida. */
  const inv = P.map((p) => invencivel(p.sessao));
  const ativoInv = ativos.find((a) => a.tipo === "grupo" && a.grupo.estados.some((e) => e.id === ESTADO_INV));
  if (inv[0].ativo || inv[0].pendente) {
    const celulas = vazias(n);
    /* O contador PRÓPRIO do Invencível vai na barra. Agora ele é contado. Dali
       em diante só existe se o jogador mantiver (e a virada puder cobrar). */
    P.forEach((p, k) => {
      if (!inv[k].ativo) return;
      celulas[k].seg = k === 0
        ? { texto: `${inv[k].contador} de 4`, tipo: "contado" }
        : { pre: k === 1 ? "Se Mantido · " : null, texto: `${inv[k].contador} de 4`, tipo: "condicional" };
    });
    /* Da coluna 1 em diante, o que acontece com o Invencível depende de mantê-lo. */
    const se = (k) => (k >= 1 ? "Se Mantido" : null);
    for (let k = 1; k < n; k++) {
      const antes = P[k - 1].sessao, depois = P[k].sessao;
      /* A Exaustão entra NA VIRADA, pela marca pendente da rodada que acabou. */
      if (inv[k - 1].pendente && inteiro(depois.exaustao) > inteiro(antes.exaustao)) {
        celulas[k - 1].marcas.push(marca({ evento: "exaustao", icone: "exaustao", lado: "fim", acontecimento: `Exaustão +${inteiro(depois.exaustao) - inteiro(antes.exaustao)}`, quando: fimDa(geral(k - 1)),
          motivo: inv[k - 1].ativo ? "Uma por Rodada Mantida" : "Rodada Mantida Antes de Encerrar", condicao: se(k - 1) }));
      }
      /* Continuou: o motor cobrou os 4 PE no começo da rodada seguinte. */
      if (inv[k - 1].ativo && inv[k].ativo) {
        celulas[k].marcas.push(marca({ evento: "cobra", icone: "cobra", lado: "inicio", acontecimento: "A Ficha Desconta 4 PE", quando: comeco(geral(k)), motivo: "Manter por Mais uma Rodada", condicao: se(k) }));
      }
      /* Parou: no fim da rodada, pelo contador ou pela falta de PE na virada. */
      if (inv[k - 1].ativo && !inv[k].ativo) {
        /* Os motivos na ordem do teste do motor (avancaInvencivelSobOSol). */
        const motivo = !(antes.combate ?? {}).ativo ? "Fora de Combate" : inv[k - 1].contador >= 4 ? "Chegou a 4 de 4" : "Sem 4 PE na Virada";
        celulas[k - 1].marcas.push(marca({ evento: "encerra", icone: "encerra", lado: "fim", acontecimento: "Encerra Sozinho", quando: fimDa(geral(k - 1)), motivo, condicao: se(k - 1) }));
      }
    }
    const encerrado = !inv[0].ativo;
    const daLista = encerrados.find((x) => x.restaurar?.tipo === "grupo" && Object.keys(x.restaurar.valores ?? {}).includes(ESTADO_INV));
    linhas.push({
      chave: ativoInv?.chave ?? daLista?.chave ?? "invencivel", nome: ativoInv?.nome ?? daLista?.nome ?? "Invencível sob o Sol", sub: encerrado ? "Encerrado" : null,
      alvo: ativoInv ? { tipo: "ativo", chave: ativoInv.chave } : daLista ? { tipo: "encerrado", chave: daLista.chave } : null,
      celulas: corta(celulas),
    });
  }

  /* 2b. Estados de Addon que o MOTOR desliga sozinho na virada (`expiraNaRodada`, o único estado que ele encerra por conta
     própria). A projeção é a virada REAL sobre uma cópia (`Sessao.proximaRodada`), e só se alega o encerramento se ela o
     confirma: se a virada não desligou o estado, não há barra. Sem amostra de Addon com isso, nada aparece. A amostra do
     estudo é a variação `player30Neds`. */
  for (const a of ativos) {
    if (a.tipo !== "grupo" || a.grupo.estados.some((e) => e.id === ESTADO_INV) || n < 2) continue;
    const ligados = a.grupo.estados.filter((e) => e.expiraNaRodada && estaLigado(e, P[0].sessao.combate?.[e.id]));
    if (!ligados.length || !ligados.every((e) => !estaLigado(e, P[1].sessao.combate?.[e.id]))) continue;
    const celulas = vazias(n);
    celulas[0].seg = { texto: "Esta Rodada", tipo: "contado" };
    celulas[0].marcas.push(marca({ evento: "encerra", icone: "encerra", lado: "fim", acontecimento: "Encerra Sozinho", quando: fimDa(geral(0)), motivo: "Expira na Rodada" }));
    linhas.push({ chave: a.chave, nome: a.nome, sub: null, alvo: { tipo: "ativo", chave: a.chave }, celulas: corta(celulas) });
  }

  /* 3. Aura Excessiva: pagar no começo de cada rodada é ESCOLHA do jogador. */
  const aura = ativos.find((a) => a.tipo === "grupo" && a.grupo.estados.some((e) => e.id === ESTADO_AURA));
  const custoAura = aura?.exemplo?.custoCurto;
  if (aura && typeof custoAura === "string" && /começo de toda rodada/i.test(aura.exemplo?.quando ?? "")) {
    const base = custoAura.replace(/\s*por Rodada/, "");
    const celulas = vazias(n);
    for (let k = 1; k < n; k++) {
      if (P[k].sessao.combate?.[ESTADO_AURA]) celulas[k].marcas.push(marca({ evento: "opcional", tom: "opcional", icone: "opcional", lado: "inicio", acontecimento: `Opcional · Desconte ${base} da Energia`, quando: comeco(geral(k)), condicao: "Se Quiser Manter", nota: "A Ficha Não Desconta" }));
    }
    if (temMarca(celulas)) linhas.push({ chave: aura.chave, nome: aura.nome, sub: null, alvo: { tipo: "ativo", chave: aura.chave }, celulas: corta(celulas) });
  }

  /* 4. Exaustão que entra na virada por outra fonte (não pelo Invencível). */
  const celulasEx = vazias(n);
  for (let k = 1; k < n; k++) {
    const d = inteiro(P[k].sessao.exaustao) - inteiro(P[k - 1].sessao.exaustao);
    if (d > 0 && !inv[k - 1].pendente) celulasEx[k - 1].marcas.push(marca({ evento: "exaustao", icone: "exaustao", lado: "fim", acontecimento: `Exaustão +${d}`, quando: fimDa(geral(k - 1)) }));
  }
  if (temMarca(celulasEx)) {
    const ex = ativos.find((a) => a.tipo === "exaustao");
    linhas.push({ chave: "exaustao", nome: "Exaustão", sub: null, alvo: ex ? { tipo: "ativo", chave: ex.chave } : null, celulas: corta(celulasEx) });
  }
  /* Na célula, o que acontece no começo da rodada vem antes do que acontece no fim. */
  for (const l of linhas) for (const c of l.celulas) c.marcas.sort((a, b) => (a.lado === "fim") - (b.lado === "fim"));
  return linhas;
}
