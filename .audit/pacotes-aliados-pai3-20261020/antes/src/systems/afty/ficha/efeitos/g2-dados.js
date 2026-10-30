/* ============================================================
   G2 · A LEITURA DOS DADOS PARA A TELA
   ============================================================
   O G2 (Cartão Etiqueta, escolhido pelo autor em 2026-09-28) lê a MESMA
   camada do gerenciador (`efeitos.js`): nada aqui calcula regra. O que este
   arquivo faz é escolher e rotular o que a tela mostra:
     - a categoria de uma opção do catálogo, pelo prefixo da chave;
     - o estado atual de um ativo, rotulado pelo controle que o produz;
     - o prazo curto, e se ele pesa na rodada;
     - os números com os rótulos do G2, sem contar os mesmos dados duas vezes;
     - o custo em linguagem de jogo (quem desconta: a ficha ou o jogador).
   O modelo estático (`esquemas-efeitos.html`) é a referência visual. As
   regras de texto daqui são as dele, agora sobre os dados reais.
   ============================================================ */
import { CHAVE_GOLPE, NOME_DO_FILHO, estaLigado, maxDe, propriedadesDoGolpe, rotuloOpcao } from "./efeitos-dados";
export { NOME_DO_FILHO };

const depois = (l) => (l.includes(" · ") ? l.slice(l.indexOf(" · ") + 3) : l);
const antes = (l) => (l.includes(" · ") ? l.slice(0, l.indexOf(" · ")) : l);
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/** Junta números de mesmo rótulo e mesmo lado ("Dados de Dano +9d12 +2d10"). */
export function juntarPorRotulo(chips) {
  const out = [];
  for (const c of chips) {
    const x = out.find((y) => y.rotulo === c.rotulo && Math.sign(y.valor) === Math.sign(c.valor));
    if (x) x.textos.push(c.texto);
    else out.push({ chave: c.chave, rotulo: c.rotulo, valor: c.valor, textos: [c.texto] });
  }
  return out;
}

export const custoDe = (e, v) => (typeof e?.custoPE === "function" ? e.custoPE(v) : e?.custoPE ?? null);

/* ---------------- o catálogo ---------------- */
export const CATEGORIAS = [
  { id: "favoritos", rotulo: "Favoritos" },
  { id: "ativos", rotulo: "Ativos Agora" },
  null,
  { id: "especializacao", rotulo: "Habilidades de Classe" },
  { id: "aptidao", rotulo: "Aptidões" },
  { id: "talento", rotulo: "Talentos" },
  { id: "feitico", rotulo: "Feitiços" },
  { id: "altoNivel", rotulo: "Nível Lendário" },
  { id: "origem", rotulo: "Da Origem" },
  { id: "estado", rotulo: "Outros" },
  /* Os Pacotes para Aliados importados (`creature.pacotesRecebidos`): a trilha só mostra a categoria quando há algum. */
  { id: "recebido", rotulo: "Recebidos" },
  null,
  { id: "tudo", rotulo: "Todo o Catálogo" },
];
export const rotuloCategoria = (id) => CATEGORIAS.find((x) => x && x.id === id)?.rotulo ?? id;

/** A parte da ficha de onde a opção vem, pelo prefixo da chave (`especializacao:cmb_...`). */
export function categoriaDe(o) {
  const p = String(o.chave ?? "").split(":")[0];
  if (p === "passivo") return "feitico";
  return ["especializacao", "aptidao", "talento", "feitico", "altoNivel", "origem", "recebido"].includes(p) ? p : "estado";
}
/** Uma opção que veio de um Pacote para Aliados. */
export const ehRecebidoDePacote = (o) => o?.como === "recebido" && !!o.pacoteRecebido;

/** Classe e nível de uma Habilidade de Classe, e o grupo de uma do Nível Lendário. Do item, nunca inventado. */
export function classeENivel(o) {
  const it = o.item;
  const cat = categoriaDe(o);
  if (!it) return { classe: null, nivel: null, subgrupo: null };
  const nv = (it.tags ?? []).map((t) => /^Nível (\d+)$/.exec(t.label ?? "")).find(Boolean);
  const classe = cat === "especializacao" ? it.sub?.label ?? null : null;
  return {
    classe,
    nivel: cat === "especializacao" && nv ? Number(nv[1]) : null,
    subgrupo: cat === "especializacao" ? classe : cat === "altoNivel" ? it.sub?.label ?? null : null,
  };
}

/** A mesma regra do Encontrar de hoje: só o que liga com um clique é "Ativar". */
export const simples = (o) => !!o.grupo && (o.como === "ligar" || o.como === "intensidade")
  && o.grupo.controles[0].estados.length === 1 && !o.grupo.sustentacao;

/* A Entrega 1 leva UM ciclo ao funcional: o Ataque Concentrado. Só ele tem a
   Preparação nova (intensidade e custo antes de confirmar). */
export const ehPiloto = (o) => o?.grupo?.controles?.[0]?.estados?.[0]?.id === "ataqueConcentrado"
  && o.grupo.controles.length === 1 && o.grupo.controles[0].estados.length === 1;

/* A Preparação comum (`preparo.js`), pelo id do estado RAIZ. Entrou em duas
   levas, e cada uma é uma LISTA FECHADA: nada de filtro genérico, porque ele
   incluiria o que o motor ainda não representa direito (a lista de fora está no
   LEIA.md, seção da E2).
   Catálogo, primeira entrega (2026-10-15):
     concentrarAura        escolhas com limite, sem custo registrado
     conhecimentoAplicado  o valor é o gasto, descontado à mão
     invencivelSobOSol     sem escolha, e quem cobra é a ficha
   E2 (2026-10-15), as ativações compatíveis das famílias A, C e D:
     faiscasNegras         sem escolha, sem custo registrado (D)
     auraExcessiva         os 2 PE da rodada atual, à mão (C)
     auraEmbacada          2 PE à mão, a manutenção por rodada também (C)
     golpeComAura          a aura escolhida e 1 PE à mão (C)
     duelando              Repertório do Especialista: um estilo, o outro ou os dois (D)
     potenciaConcentrada   uma vez por rodada, sem custo registrado (D)
     sintonizada           o 1d8 da arma sintonizada, sem custo registrado (D)
   E3 (2026-10-16), as quantidades e os modos:
     cobrirSePE            Reação: o PE é o valor, e o PV vem do motor (D/E). Não há ajuste do uso atual:
                           USAR NOVAMENTE abre a Preparação de um uso novo (`reuso`)
     estimuloTeste         o PE do teste e o Empurrão, cada um com o seu custo (E)
     mentePlacida          1 PE vale +3 e 2 PE valem +5, pela escada do motor (E)
     precisaoPE            a quantidade e o destino (acerto ou dano) juntos (E)
     postura               Assumir Postura, com o segundo espaço só se o motor der (H)
     espiritoDeLuta        a escolha entre Espírito de Luta e Espírito Incansável, feita ao UTILIZAR (`escolhaNoUso`), e o PV a registrar (C)
   Consolidação ampliada (2026-10-16), todas por descritor EXPLÍCITO, com custo e condição conferidos:
     arremessosPotentes    1 PE à mão no começo do turno (livro e rótulo do estado), família C
     feiticoLigavel        `FEITICO_LIGAVEL`, pelo estado `feiticoLigado_<id>` do motor: custo de conjuração à mão e a trava do Permutativo
     sustentacao           `SUSTENTACAO`, as vagas do motor: o que fica, sai e entra à vista, e o custo por rodada à mão
     golpeEspecial         o montador (`ehGolpe`, g2/golpe.js): quem paga é a função da ficha, pelo contrato dela
   `exigeUm`: o efeito só existe com pelo menos um dos estados ligados (o
   Repertório não tem raiz fixa: Duelando e Duas Armas valem sozinhos, e o
   Estímulo Muscular vale só com o teste, só com o Empurrão ou com os dois).
   `padroes`: o valor do livro de um estado que ativar não escolhe sozinho, só
   ao ativar. `obrigatorios`: estados que não podem ficar sem escolha.
   `usos`: o id da habilidade cujo contador REAL do motor ATIVAR gasta, uma vez,
   na confirmação (a Postura).
   `reuso`: não existe aumentar o uso atual (autor, 2026-10-16): existe USAR NOVAMENTE, um uso
   novo com o valor que o jogador escolher, de custo inteiro, e o Ajustar do efeito ativo some.
   `escolhaNoUso`: o id do estado filho que é uma ESCOLHA feita ao utilizar a habilidade (o
   Espírito Incansável): vira uma escolha da Preparação pelos nomes das habilidades, e não há
   upgrade com o efeito ativo. */
const PREPARO = {
  concentrarAura: {},
  conhecimentoAplicado: {},
  invencivelSobOSol: {},
  faiscasNegras: {},
  auraExcessiva: {},
  auraEmbacada: {},
  golpeComAura: {},
  duelando: { exigeUm: true },
  potenciaConcentrada: {},
  sintonizada: {},
  cobrirSePE: { reuso: true },
  estimuloTeste: { exigeUm: true },
  mentePlacida: {},
  precisaoPE: { padroes: { precisaoModo: "acerto" }, obrigatorios: ["precisaoModo"] },
  postura: { usos: "cmb_assumir_postura" },
  espiritoDeLuta: { escolhaNoUso: "espiritoIncansavel" },
  /* Consolidação ampliada (2026-10-16), família C: liga com 1 PE à mão (livro e rótulo do estado), no começo do turno. */
  arremessosPotentes: {},
};
/** O que a prévia diz quando o comparador não cobre o benefício (E2/E3): o texto do estudo, ou null. */
export const foraDosNumeros = (exemplo) => exemplo?.foraDosNumeros ?? null;
/* CONSOLIDAÇÃO AMPLIADA (2026-10-16), três famílias que entram na Preparação comum, cada uma por um descritor EXPLÍCITO (nunca por
   um filtro sobre todos os estados):
     FEITICO_LIGAVEL  o interruptor por Feitiço do motor (`feiticoLigado_<id>`, com `feiticoId`): o custo de conjuração à mão e a
                      trava do Feitiço Permutativo (`bloqueio(derived, ligado)`), que a aplicação principal também respeita;
     SUSTENTACAO      as vagas de Sustentação (`sustentacaoFeitico<N>`): as vagas e as opções são as do motor, e o que fica e o que sai
                      aparecem antes de confirmar. Cada vaga é um estado de opção, e o rascunho é o conjunto de vagas (`vagas`). */
const FEITICO_LIGAVEL = { feitico: true };
const SUSTENTACAO = { vagas: true };
const ehFeiticoLigavel = (e) => !!e && e.tipo === "bool" && !!e.feiticoId && /^feiticoLigado_/.test(e.id ?? "");
export const ehSustentacao = (o) => !!o?.grupo?.sustentacao;
/** O montador do Golpe Especial (`g2/golpe.js`): as marcas de Atroz a Desfocado e o pagamento pela sessão. */
export const ehGolpe = (o) => !!o?.grupo && o.chave === "especializacao:cmb_golpe_especial";
/** O descritor da Preparação comum desta opção (ou ativo), ou null. O Golpe Especial tem o montador próprio (`ehGolpe`). */
export const preparoDe = (o) => {
  if (!o?.grupo || ehPiloto(o)) return null;
  if (o.grupo.sustentacao) return SUSTENTACAO;
  const raiz = o.grupo.controles?.[0]?.estados?.[0];
  return PREPARO[raiz?.id] ?? (ehFeiticoLigavel(raiz) ? FEITICO_LIGAVEL : null);
};
export const temPreparo = (o) => !!preparoDe(o);
/** Qualquer opção que se ativa por uma Preparação (a do piloto, a comum, a das vagas ou o montador do Golpe). */
export const ativaPorPreparacao = (o) => ehPiloto(o) || temPreparo(o) || ehGolpe(o);

/* ---------------- o estado atual de um ativo ---------------- */
/** O rótulo de uma faixa: "Intensidade" quando ela é a própria habilidade, senão a parte do rótulo. */
export const rotuloDaFaixa = (e, gr) => (e.label.includes(" · ") ? depois(e.label) : e.label === gr?.nome ? "Intensidade" : e.label);

/**
 * O que está valendo, rotulado: [{ rotulo, valor, passos }]. `passos` é o
 * medidor de uma faixa curta ({ valor, max }). Lê a mesma posse do
 * `valoresDoGrupo`, e acrescenta o que o G2 pede: a faixa como "2 de 3" e o
 * rótulo do controle de quem escolhe uma opção ("Postura", "Segunda").
 */
/* Quem se lê melhor por outro nome no cartão (autor, 2026-10-14):
   - Concentrar Aura: a QUANTIDADE de auras escolhidas ("2 Auras"), contando só
     as escolhas desse controle. Os nomes ficam no detalhe (`curto: false`).
   - Espírito Incansável: a melhoria ligada aparece pelo nome, e não como
     "2 PE". Custo e reserva de PV não mudam: é só o rótulo. */
const CONTA_NO_CARTAO = { concentrarAura: (n) => `${n} ${n === 1 ? "Aura" : "Auras"}` };
/* Repertório do Especialista (autor, 2026-10-15): os dois estilos lado a lado
   ficavam apertados e cortados na etiqueta. No cartão e na lista compacta, UM
   resumo: o nome curto do estilo ligado, ou "2 Estilos" com os dois. Conta só
   os estados LIGADOS, e não os estilos aprendidos. Os nomes e as condições
   inteiros ficam no title e no detalhe (`curto: false`). Estados, contas e
   controles não mudam, e os dois continuam podendo ficar ligados juntos. */
const ESTILO_NO_CARTAO = { duelando: "Duelando", lutandoComDuasArmas: "Duas Armas" };

export function estadosDoCartao(a, m, { curto = true } = {}) {
  if (a.tipo === "exaustao") return [{ rotulo: null, valor: `Nível ${a.nivel}` }];
  if (a.tipo === "sustentado") return [{ rotulo: null, valor: "Sustentado" }];
  if (a.tipo !== "grupo") return [];
  const gr = a.grupo;
  const combate = m.sessao.combate ?? {};
  /* O Golpe Especial: as propriedades vêm das duas casas do montador (as de estado e as próprias). O cartão fechado diz o nome da
     propriedade quando é uma só ("Letal", "Amplo") e quantas são quando há mais ("2 Propriedades", com os nomes no title). A lista
     inteira fica no detalhe. Sem marca nenhuma, sem etiqueta. */
  if (gr.chave === CHAVE_GOLPE) {
    const props = propriedadesDoGolpe(m.sessao);
    if (!props.length) return [];
    const nomes = props.map((x) => x.texto);
    if (!curto) return [{ rotulo: null, valor: nomes.join(", ") }];
    return [{ rotulo: null, valor: props.length === 1 ? nomes[0] : `${props.length} Propriedades`, titulo: nomes.join(", ") }];
  }
  const out = [];
  const estilos = curto ? gr.estados.filter((e) => ESTILO_NO_CARTAO[e.id] && estaLigado(e, combate[e.id])) : [];
  if (estilos.length) {
    out.push({ rotulo: null, valor: estilos.length > 1 ? `${estilos.length} Estilos` : ESTILO_NO_CARTAO[estilos[0].id], titulo: estilos.map((e) => e.label).join("\n") });
  }
  gr.controles.forEach((c) => {
    if (!c.estados.some((e) => estaLigado(e, combate[e.id]))) return;
    /* O resumo dos estilos, logo acima, fala pelos controles deles. */
    if (curto && c.estados.every((e) => ESTILO_NO_CARTAO[e.id])) return;
    if (c.partes) {
      const texto = c.estados.map((e, j) => (estaLigado(e, combate[e.id]) ? c.partes[j] : null)).filter(Boolean).join(", ");
      const rotulo = c.rotulo && c.rotulo !== gr.nome && !texto.includes(c.rotulo) ? antes(c.rotulo) : null;
      out.push({ rotulo: rotulo === texto ? null : rotulo, valor: texto });
      return;
    }
    const e = c.estados[0];
    const v = combate[e.id];
    const ops = e.opcoesVisiveis ?? e.opcoes ?? [];
    /* Ligado não é estado: a habilidade ligada já é o cartão. A parte depois do
       nome é ("Golpe Especial · Letal" é "Letal"). */
    if (e.tipo === "bool") {
      if (e.label === gr.nome) return;
      out.push({ rotulo: null, valor: antes(e.label) === gr.nome ? depois(e.label) : antes(e.label) });
      return;
    }
    if (e.tipo === "faixa") {
      const n = Math.trunc(Number(v) || 0);
      const max = maxDe(e, m.derived);
      out.push({ rotulo: rotuloDaFaixa(e, gr), valor: Number.isFinite(max) ? `${n} de ${max}` : String(n), passos: Number.isFinite(max) && max > 0 && max <= 6 ? { valor: n, max } : null });
      return;
    }
    const escolhidas = e.tipo === "multi" ? ops.filter((o) => (v ?? []).includes(o.id)) : [];
    if (curto && CONTA_NO_CARTAO[e.id] && escolhidas.length) {
      out.push({ rotulo: null, valor: CONTA_NO_CARTAO[e.id](escolhidas.length), titulo: escolhidas.map((o) => rotuloOpcao(o.label)).join(", ") });
      return;
    }
    const texto = e.tipo === "multi" ? escolhidas.map((o) => rotuloOpcao(o.label)).join(", ")
      : rotuloOpcao(ops.find((o) => o.id === v)?.label);
    out.push({ rotulo: e.label === gr.nome ? null : depois(e.label), valor: texto });
  });
  for (const f of gr.filhos) {
    const v = combate[f.id];
    if (!estaLigado(f, v)) continue;
    const ops = f.opcoesVisiveis ?? f.opcoes ?? [];
    /* O grau do aliado vai junto do nome dele ("Protetor Veterano"). */
    const pai = out.find((x) => x.valor?.split(", ").includes(depois(f.label)));
    if (f.tipo === "opcao" && pai) { pai.valor = pai.valor.split(", ").map((t) => (t === depois(f.label) ? `${t} ${rotuloOpcao(ops.find((o) => o.id === v)?.label)}` : t)).join(", "); continue; }
    /* "Espírito de Luta · 2 PE" é o Espírito Incansável, e não um custo solto: pelo nome da habilidade. */
    if (f.tipo === "bool") out.push({ rotulo: null, valor: NOME_DO_FILHO[f.id] ?? depois(f.label) });
    else if (f.tipo === "opcao") out.push({ rotulo: depois(f.label), valor: rotuloOpcao(ops.find((o) => o.id === v)?.label) });
    else if (f.tipo === "faixa") out.push({ rotulo: depois(f.label), valor: String(Math.trunc(Number(v) || 0)) });
    else if (f.tipo === "multi") out.push({ rotulo: depois(f.label), valor: ops.filter((o) => (v ?? []).includes(o.id)).map((o) => rotuloOpcao(o.label)).join(", ") });
  }
  return out.filter((x) => x.valor);
}

/* ---------------- o prazo ---------------- */
/**
 * O prazo curto, em linguagem de jogo. Contado pela ficha (`contado`): o
 * contador do Invencível e as rodadas de condição e registro. Não contado:
 * um resumo do texto do estudo, com o texto inteiro no detalhe. Turno
 * continua turno.
 */
export function prazoCurto(a, d) {
  const contado = d.contador ?? d.duracao;
  if (contado) return { texto: contado, contado: true };
  const ex = a.exemplo;
  const fonte = ex?.duracao ?? (ex?.quando && /um ataque só/i.test(ex.quando) ? ex.quando : null);
  if (!fonte) return null;
  const t = norm(fonte);
  let curto = null;
  if (/fim do turno/.test(t)) curto = "Até o Fim do Turno";
  else if (/fim da cena|resto da cena/.test(t)) curto = "Até o Fim da Cena";
  /* "Por Um Ataque" e "Contra Um Ataque" são o prazo de uso de uma instância de pacote (o Feitiço Imediato de um ataque, PA-I2, e o Contra-Ataque):
     acabam no ataque, como o "um ataque só" dos exemplos. */
  else if (/um ataque so|^(por|contra) um ataque$/.test(t)) curto = "Um Ataque";
  else { const k = /^(\d+)\s+(minuto|rodada)/.exec(t); if (k) curto = `${k[1]} ${cap(k[2])}${k[1] === "1" ? "" : "s"}`; }
  return { texto: curto ?? fonte, contado: false };
}
/** O prazo curto só quando pesa na rodada: o que a ficha conta, e o que acaba no turno, no ataque ou em poucas rodadas. */
export function prazoRelevante(a, d) {
  const p = prazoCurto(a, d);
  if (!p) return null;
  if (p.contado) return p;
  return p.texto === "Até o Fim do Turno" || p.texto === "Um Ataque" || /^\d+ Rodadas?$/.test(p.texto) ? p : null;
}

/**
 * Como o efeito termina, para a coluna Termina do detalhe: o texto e a
 * instrução de jogo, dizendo QUEM faz (a ficha ou o jogador).
 */
export function terminaDe(a, d, usosReais = null) {
  const ex = a.exemplo;
  const out = [];
  const instr = (auto, t) => ({ auto, t });
  if (d.contador) out.push({ texto: d.contador, instrucao: instr(true, "A Ficha Conta as Rodadas e Encerra Sozinha") });
  else if (d.duracao) out.push({ texto: d.duracao, instrucao: instr(true, "A Ficha Conta as Rodadas e Encerra Sozinha") });
  else if (ex?.duracao) out.push({ texto: cap(ex.duracao), instrucao: instr(false, "A Ficha Não Conta Este Prazo: Encerre Quando Acabar") });
  else if (ex?.quando && /um ataque só/i.test(ex.quando)) out.push({ texto: cap(ex.quando), instrucao: instr(false, /errar não consome/i.test(ex.quando) ? "Encerre Depois de Acertar o Ataque" : "Encerre Depois do Ataque") });
  else if (ex?.termina) out.push({ texto: cap(ex.termina), instrucao: instr(false, "Encerre Depois do Ataque") });
  if (ex?.usos && usosReais) {
    /* O contador REAL do motor (a Postura): a ficha gasta um uso ao ATIVAR, e diz quantos restam. */
    out.push({ texto: `Usos: Restam ${usosReais.restam} de ${usosReais.max}`, instrucao: instr(true, "A Ficha Conta os Usos Gastos ao Ativar") });
  } else if (ex?.usos) {
    const auto = d.atencao.some((t) => /Exaustão/.test(t));
    out.push({ texto: cap(ex.usos), instrucao: instr(auto, auto ? "A Ficha Soma a Exaustão na Virada" : "A Ficha Não Conta os Usos: Acompanhe Você") });
  }
  for (const x of d.naMesa.filter((y) => y.rotulo === "Termina" || y.rotulo === "Efeito")) out.push({ texto: x.texto, instrucao: null });
  return out;
}

/* ---------------- os números ---------------- */
const qtdDados = (t) => Number(/(\d+)d\d+/.exec(String(t ?? ""))?.[1] ?? 0);
/**
 * Os números com os rótulos do G2: "Dados" vira "Dados de Dano", e os grupos
 * de dados de outra fonte viram "Dano Extra".
 *
 * ⚠ OS MESMOS DADOS NÃO CONTAM DUAS VEZES. O Ataque Concentrado soma os dados
 * na linha (o chip "Dados", com uma face só) E põe grupos próprios, um por
 * face ("+9d12" e "+2d10"). Quando os grupos somam exatamente os dados do
 * chip, o chip sai e os grupos ficam, com o rótulo "Dados de Dano".
 */
export function numerosG2(chips = []) {
  const grupos = chips.filter((c) => String(c.chave).startsWith("grupo:"));
  const dados = chips.find((c) => c.chave === "dados");
  let lista = chips;
  let gruposSaoDados = false;
  if (dados && grupos.length) {
    const soma = grupos.filter((x) => Math.sign(x.valor) === Math.sign(dados.valor)).reduce((s, x) => s + qtdDados(x.texto), 0);
    if (soma === qtdDados(dados.texto)) { lista = chips.filter((c) => c !== dados); gruposSaoDados = true; }
  }
  return lista.map((c) => {
    if (c.chave === "dados") return { ...c, rotulo: "Dados de Dano" };
    if (String(c.chave).startsWith("grupo:")) return { ...c, rotulo: gruposSaoDados ? "Dados de Dano" : "Dano Extra" };
    return c;
  });
}
/** Ganho e perda pelo valor do chip (a Margem de Crítico menor já vem positiva). */
export const separarGanhos = (chips) => ({ ganha: chips.filter((c) => (c.valor ?? 0) > 0), perde: chips.filter((c) => (c.valor ?? 0) < 0) });

/* ---------------- o custo em linguagem de jogo ---------------- */
/**
 * { texto, auto }: quem desconta. `cobra` é da ficha (o Invencível); o resto o
 * jogador desconta. "por Rodada" vira "a Cada Rodada".
 */
export function custoEmJogo(custo) {
  if (!custo?.texto) return null;
  const porRodada = /por Rodada/.test(custo.texto);
  const base = custo.texto.replace(/\s*por Rodada/, "");
  if (custo.cobra) return { texto: `A Ficha Desconta ${base}${porRodada ? " por Rodada" : ""}`, auto: true };
  return { texto: `Desconte ${base} da Energia${porRodada ? " a Cada Rodada" : ""}`, auto: false };
}
