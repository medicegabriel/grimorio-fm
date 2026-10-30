/* ============================================================
   PACOTES PARA ALIADOS: o formato, a biblioteca e a instância
   ============================================================
   Pedido do autor (2026-10-19): o suporte concede cinco a oito fontes, ou mais,
   com valores e prazos próprios, e registrar cada uma à mão no receptor é
   trabalhoso. O suporte monta um PACOTE, exporta em JSON, e o aliado importa uma
   vez, guarda as opções na própria ficha e liga e desliga cada uma sem redigitar.

   TRÊS COISAS SEPARADAS, cada uma no seu lugar:
     1. o pacote do SUPORTE, criado e editável: `creature.pacotesAliados`
        = { emissorId, pacotes: [{ id, nome, itens, exportado }] }. O item guarda a
        RECEITA (a fonte e as escolhas), e o número é calculado ao exportar.
     2. a BIBLIOTECA do aliado: `creature.pacotesRecebidos` = [entrada], uma por
        pacote de um emissor, com as opções já validadas. Importar NÃO ativa, não
        cobra PE, não cria PV temporário nem inicia prazo.
     3. a INSTÂNCIA ativa: um registro de Fonte Externa na sessão (`sessao.buffs`,
        `rec: true`), criado ao Ativar, com o benefício e o prazo daquela opção.
        Encerrar ou expirar tira a instância e deixa a opção na biblioteca. A conta
        é a de sempre (`ficha-recebidos.js`), para as duas apresentações, o
        Encontro e os derives de comparação.

   O ARQUIVO É DADO, NUNCA CÓDIGO. Nada é avaliado: os valores chegam prontos,
   calculados com os atributos e as escolhas do EMISSOR, e o receptor não reavalia
   fórmula nenhuma. A leitura copia só os campos conhecidos (lista branca), com
   tamanho, tipo e faixa conferidos, e uma opção que não passa é recusada inteira,
   com o motivo, em vez de entrar pela metade.

   IDENTIDADE: o pacote tem id estável, o emissor tem id estável (gravado no
   personagem, e não o id da ficha, que muda ao importar a ficha inteira), e cada
   opção tem id estável. Reimportar o mesmo pacote não duplica, revisão nova
   atualiza a biblioteca, e a instância já ativa conserva o valor e o prazo dela
   até encerrar. Id de pacote e de emissor é identidade, e não origem de acúmulo:
   quem decide a disputa é a regra do receptor (`acumulo`).

   PRAZO POR BENEFÍCIO (PA-I3, 2026-10-20, decisão do autor: "cada benefício
   termina no próprio prazo"). Um benefício pode ter `duracao` própria, e sem ela
   vale a da opção. Hoje só o Feitiço de Múltiplos Efeitos Imediato que mistura um
   efeito de um ataque e outro de uma rodada a usa. Na instância o benefício leva a
   cópia do prazo e, quando é de rodadas, o contador `rodadas` dele, que a virada
   desce (`proximaRodada`, ficha-sessao.js). Cada PARTE (os benefícios de um mesmo
   prazo, `partesDaInstancia`) sai no seu prazo sem levar as outras, e a instância
   sai quando não sobra nenhuma. Arquivo e instância antigos, sem o campo, seguem
   iguais: o prazo é o da opção.

   ⚠ FOLHA, zero imports (`asserts/t-ordem-modulos.mjs`): é lido pela ficha, pelo
   G2 e pelos asserts, e não pode entrar no ciclo dos catálogos. Os nomes de
   perícia, TR e tipo de dano vêm de quem chama (`nomeDoAlvo`, `conhecidos`).
   ============================================================ */

export const FORMATO_PACOTE = "grimorio-afty-pacote-aliados";
export const VERSAO_PACOTE = 1;
export const EXTENSAO_PACOTE = ".json";

export const LIMITES_PACOTE = Object.freeze({
  bytes: 262144, opcoes: 64, beneficios: 12, condicoes: 8, consulta: 8, escolhas: 8,
  nome: 120, texto: 200, curto: 80, rodadas: 99, valor: 1000,
});

/* As famílias de onde uma opção pode vir. `calculo` diz se o número sai de um resolvedor do Afty ou foi definido à mão pelo suporte. */
export const FAMILIAS_PACOTE = Object.freeze([
  { id: "aptidaoAura", rotulo: "Aptidão de Aura" },
  { id: "feitico", rotulo: "Feitiço Auxiliar" },
  { id: "auxilioInvocacao", rotulo: "Auxílio de Invocação" },
  { id: "auraInvocacao", rotulo: "Aura de Invocação" },
  { id: "estilo", rotulo: "Novo Estilo das Sombras" },
  { id: "especializacao", rotulo: "Habilidade de Classe" },
  { id: "manual", rotulo: "Definido pelo Emissor" },
]);
export const rotuloFamilia = (id) => FAMILIAS_PACOTE.find((f) => f.id === id)?.rotulo ?? "Outra";

/* As regras de acúmulo que o receptor conhece (ver `ficha-recebidos.js`). A regra vira o `tipoFonte` da instância. */
export const REGRAS_ACUMULO = Object.freeze({
  feitico: "Feitiços Não Somam Entre Si",
  estilo: "Estilo e Feitiços Não Somam Entre Si",
  catalogo: "A Mesma Habilidade Vale Uma Vez",
  auxilioInvocacao: "Soma, e o Mesmo Auxílio Vale Uma Vez",
  auraInvocacao: "Auras Iguais Não Acumulam",
  outro: "Regra de Acúmulo Desconhecida",
});

/* Os canais que um pacote pode trazer, com o tipo do alvo. `opcional`: sem alvo vale para todos (todas as perícias, todos os TRs, todo dano). */
export const CANAIS_PACOTE = Object.freeze([
  { id: "defesa", rotulo: "Defesa", alvo: null },
  { id: "bonusAcerto", rotulo: "Acerto", alvo: "ataque", opcional: true },
  { id: "danoBonus", rotulo: "Dano", alvo: "fonteDano", opcional: true },
  { id: "nivelDano", rotulo: "Nível de Dano", alvo: "fonteDano", opcional: true },
  { id: "dadosNomeados", rotulo: "Dados de Dano", alvo: "dadoNomeado" },
  { id: "margemCritico", rotulo: "Margem de Crítico", alvo: "fonteDano", opcional: true },
  { id: "ignoraRD", rotulo: "Ignora RD", alvo: "fonteDano", opcional: true },
  { id: "alcanceArma", rotulo: "Alcance", alvo: "fonteDano", metros: true },
  { id: "rdGeral", rotulo: "RD Geral", alvo: null },
  { id: "rdFisico", rotulo: "RD Física", alvo: null },
  { id: "rdTipo", rotulo: "RD", alvo: "tipoDano" },
  { id: "resistenciaDano", rotulo: "Resistência", alvo: "tipoDano", marca: true },
  { id: "bonusPericia", rotulo: "Perícias", alvo: "pericia", opcional: true },
  { id: "bonusTR", rotulo: "Testes de Resistência", alvo: "tr", opcional: true },
  { id: "cd", rotulo: "CD", alvo: null },
  { id: "movimento", rotulo: "Movimento", alvo: null, metros: true },
  { id: "iniciativa", rotulo: "Iniciativa", alvo: null },
  { id: "atencao", rotulo: "Atenção", alvo: null },
  { id: "atributo", rotulo: "Atributo", alvo: "atributo" },
  { id: "limiteAtributo", rotulo: "Limite de Atributo", alvo: "atributo" },
]);
const CANAL_BY_ID = Object.fromEntries(CANAIS_PACOTE.map((c) => [c.id, c]));
export const canalDoPacote = (id) => CANAL_BY_ID[id] ?? null;

/* As condições que o motor sabe avaliar no receptor. Condição de mesa (alcance, alvo, posição) é TEXTO, em `condicoes`, e quem liga é o jogador. */
export const QUANDOS_PACOTE = Object.freeze({ em_combate: "Só em Combate" });

/* Os prazos. Só `rodadas` a ficha conta: alcance, manutenção, cena e uso não ganham rodadas inventadas. */
export const DURACOES_PACOTE = Object.freeze([
  { id: "rodadas", rotulo: "Rodadas" },
  { id: "cena", rotulo: "Até o Fim da Cena" },
  { id: "mantida", rotulo: "Enquanto o Emissor Mantiver" },
  { id: "alcance", rotulo: "Enquanto Estiver no Alcance" },
  { id: "proximo", rotulo: "Até o Próximo Uso" },
  { id: "permanente", rotulo: "Sem Prazo" },
]);
const DURACAO_BY_ID = Object.fromEntries(DURACOES_PACOTE.map((d) => [d.id, d]));

const ATRIBUTOS = new Set(["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"]);
const NOME_ATRIBUTO = { forca: "Força", destreza: "Destreza", constituicao: "Constituição", inteligencia: "Inteligência", sabedoria: "Sabedoria", presenca: "Presença" };
const DADOS = new Set(["d4", "d6", "d8", "d10", "d12"]);

/* ---------------- ids ---------------- */
let contador = 0;
export function novoIdPacote(prefixo) {
  contador = (contador + 1) % 1679616;
  const aleatorio = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : `${Math.random().toString(36).slice(2, 10)}${contador.toString(36)}`;
  return `${prefixo}_${Date.now().toString(36)}${aleatorio}`;
}

/* ---------------- textos ---------------- */
const numeroBr = (v) => String(v).replace(".", ",");
const sinal = (v) => `${v > 0 ? "+" : "−"}${numeroBr(Math.abs(v))}`;
/** O valor de um benefício como se lê na mesa: "+3", "+4,5 m", "+1d8", "Resistente". */
export function textoDoValor(canal, valor, alvo = null) {
  const c = canalDoPacote(canal);
  if (canal === "dadosNomeados") return `${valor > 0 ? "+" : "−"}${Math.abs(valor)}${alvo ?? "d"}`;
  if (c?.marca) return valor > 0 ? "Sim" : "Não";
  if (c?.metros) return `${sinal(valor)} m`;
  if (canal === "margemCritico") return `−${Math.abs(valor)}`;
  return sinal(valor);
}
/** "Perícias (Atletismo)", "Testes de Resistência", "Resistência (Ácido)". `nomeDoAlvo(tipo, id)` vem de quem conhece os catálogos. */
export function rotuloDoBeneficio(b, nomeDoAlvo = null) {
  const c = canalDoPacote(b?.canal);
  const base = c?.rotulo ?? String(b?.canal ?? "");
  const alvo = String(b?.alvo ?? "").trim();
  if (!alvo || b?.canal === "dadosNomeados") return base;
  const nome = (c?.alvo === "atributo" ? NOME_ATRIBUTO[alvo] : null) ?? (nomeDoAlvo ? nomeDoAlvo(c?.alvo, alvo) : null) ?? alvo;
  if (b.canal === "bonusPericia") return nome;
  if (b.canal === "bonusTR") return `TR de ${nome}`;
  return `${base} (${nome})`;
}
export function textoDoBeneficio(b, nomeDoAlvo = null) {
  const q = b?.quando && QUANDOS_PACOTE[b.quando] ? ` · ${QUANDOS_PACOTE[b.quando]}` : "";
  /* O prazo próprio do benefício (PA-I3), com as rodadas que restam quando é a instância. */
  const p = b?.duracao ? ` · ${textoDaDuracao(b.rodadas != null ? { ...b.duracao, rodadas: b.rodadas } : b.duracao)}` : "";
  return `${rotuloDoBeneficio(b, nomeDoAlvo)} ${textoDoValor(b.canal, Number(b.valor), b.alvo)}${q}${p}`;
}
export function textoDaDuracao(d) {
  if (!d) return "Sem Prazo";
  if (d.tipo === "rodadas") return d.rodadas === 1 ? "1 Rodada" : `${d.rodadas} Rodadas`;
  return d.texto || DURACAO_BY_ID[d.tipo]?.rotulo || "Sem Prazo";
}

/* ---------------- leitura defensiva ---------------- */
const objeto = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : null);
const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (x, max) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const idValido = (x) => typeof x === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(x);
const inteiroEm = (x, min, max) => (Number.isInteger(x) && x >= min && x <= max ? x : null);

/* ============================================================ */
/* O LADO DO SUPORTE                                             */
/* ============================================================ */
/** Os pacotes do emissor, saneados. `emissorId` é null até o primeiro pacote ser salvo. */
export function pacotesDoEmissor(ficha) {
  const bruto = objeto(ficha?.pacotesAliados) ?? {};
  return {
    emissorId: idValido(bruto.emissorId) ? bruto.emissorId : null,
    pacotes: lista(bruto.pacotes).map(normalizaPacoteDoEmissor).filter(Boolean),
  };
}
function normalizaPacoteDoEmissor(p) {
  if (!objeto(p) || !idValido(p.id)) return null;
  return {
    id: p.id,
    nome: texto(p.nome, LIMITES_PACOTE.nome) || "Pacote Sem Nome",
    itens: lista(p.itens).filter((i) => objeto(i) && idValido(i.id) && typeof i.fonte === "string").map((i) => ({
      id: i.id, fonte: i.fonte.slice(0, 200),
      escolhas: objeto(i.escolhas) ? { ...i.escolhas } : {},
      ...(objeto(i.manual) ? { manual: i.manual } : {}),
    })),
    exportado: objeto(p.exportado) && Number.isInteger(p.exportado.revisao)
      ? { revisao: p.exportado.revisao, assinatura: String(p.exportado.assinatura ?? ""), em: String(p.exportado.em ?? "") }
      : null,
    atualizadoEm: String(p.atualizadoEm ?? ""),
  };
}
export function novoPacoteDoEmissor(nome = "Apoio do Grupo") {
  return { id: novoIdPacote("pac"), nome, itens: [], exportado: null, atualizadoEm: "" };
}
/** O conjunto do emissor com o pacote gravado (novo ou editado). Garante o `emissorId`. */
export function comPacoteGravado(conjunto, pacote, agora) {
  const emissorId = conjunto.emissorId ?? novoIdPacote("emi");
  const gravado = { ...pacote, atualizadoEm: agora };
  const existe = conjunto.pacotes.some((p) => p.id === pacote.id);
  return { emissorId, pacotes: existe ? conjunto.pacotes.map((p) => (p.id === pacote.id ? gravado : p)) : [...conjunto.pacotes, gravado] };
}
export const semPacote = (conjunto, id) => ({ ...conjunto, pacotes: conjunto.pacotes.filter((p) => p.id !== id) });

/* A assinatura do CONTEÚDO exportado (sem data): exportar de novo sem mudança repete a revisão, e qualquer número diferente pede uma nova. */
export const assinaturaDasOpcoes = (opcoes) => JSON.stringify(lista(opcoes).map((o) => ({ ...o })));

/**
 * O arquivo exportado, e o pacote com a revisão que ele leva. A revisão só sobe quando o conteúdo muda (o suporte evoluiu, mudou um atributo ou outra
 * escolha). O pacote devolvido precisa ser gravado de volta no personagem.
 */
export function montarArquivo({ pacote, emissorId, emissor, opcoes, agora }) {
  const assinatura = assinaturaDasOpcoes(opcoes);
  const mesma = pacote.exportado && pacote.exportado.assinatura === assinatura;
  const revisao = mesma ? pacote.exportado.revisao : (pacote.exportado?.revisao ?? 0) + 1;
  const arquivo = {
    formato: FORMATO_PACOTE,
    versao: VERSAO_PACOTE,
    pacote: { id: pacote.id, nome: pacote.nome, revisao, exportadoEm: agora },
    emissor: { id: emissorId, nome: texto(emissor?.nome, LIMITES_PACOTE.nome) || "Sem Nome", sistema: emissor?.sistema === "player" ? "player" : "afty" },
    opcoes,
  };
  return { arquivo, pacote: mesma ? pacote : { ...pacote, exportado: { revisao, assinatura, em: agora } } };
}
export function nomeDoArquivo(arquivo) {
  const limpa = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 40) || "pacote";
  return `${limpa(arquivo.emissor?.nome)}-${limpa(arquivo.pacote?.nome)}-rev${arquivo.pacote?.revisao ?? 1}${EXTENSAO_PACOTE}`;
}

/* ============================================================ */
/* A LEITURA DO ARQUIVO (lista branca, nada é avaliado)          */
/* ============================================================ */
const PADRAO_ALVO = /^[a-z0-9_@:|.-]{1,64}$/i;
function alvoValido(c, alvo, conhecidos) {
  if (alvo == null || alvo === "") return c.alvo && !c.opcional ? "Benefício Sem Alvo" : null;
  if (!c.alvo) return "Alvo Onde o Canal Não Aceita";
  if (typeof alvo !== "string" || !PADRAO_ALVO.test(alvo)) return "Alvo Inválido";
  if (c.alvo === "dadoNomeado") return DADOS.has(alvo) ? null : "Dado Inválido";
  if (c.alvo === "atributo") return ATRIBUTOS.has(alvo) ? null : "Atributo Inválido";
  const conjunto = conhecidos?.[c.alvo];
  if (conjunto && !conjunto.has(alvo)) {
    const nome = { pericia: "Perícia", tr: "Teste de Resistência", tipoDano: "Tipo de Dano", ataque: "Tipo de Ataque" }[c.alvo] ?? "Alvo";
    return `${nome} Desconhecida Nesta Ficha: ${alvo}`;
  }
  return null;
}
function lerBeneficio(b, conhecidos) {
  if (!objeto(b)) return { motivo: "Benefício Inválido" };
  const c = canalDoPacote(b.canal);
  if (!c) return { motivo: `Canal Não Representado: ${texto(String(b.canal ?? ""), 40) || "vazio"}` };
  const valor = Number(b.valor);
  if (typeof b.valor !== "number" || !Number.isFinite(valor)) return { motivo: `${c.rotulo}: Valor Não Numérico` };
  if (valor === 0) return { motivo: `${c.rotulo}: Valor Zero` };
  if (Math.abs(valor) > LIMITES_PACOTE.valor) return { motivo: `${c.rotulo}: Valor Fora da Faixa` };
  if (c.alvo === "dadoNomeado" && !Number.isInteger(valor)) return { motivo: "Dados de Dano: Quantidade Não Inteira" };
  const alvo = b.alvo == null ? null : b.alvo;
  const erroAlvo = alvoValido(c, alvo, conhecidos);
  if (erroAlvo) return { motivo: `${c.rotulo}: ${erroAlvo}` };
  if (b.quando != null && !(typeof b.quando === "string" && QUANDOS_PACOTE[b.quando])) return { motivo: `${c.rotulo}: Condição Não Representada` };
  /* O prazo próprio (PA-I3) passa pela MESMA leitura do prazo da opção. Prazo ruim recusa a opção inteira: sem ele o benefício viveria no prazo errado. */
  const du = b.duracao == null ? null : lerDuracao(b.duracao);
  if (du?.motivo) return { motivo: `${c.rotulo}: ${du.motivo}` };
  return { beneficio: { canal: c.id, valor, ...(alvo ? { alvo } : {}), ...(b.quando ? { quando: b.quando } : {}), ...(du ? { duracao: du.duracao } : {}), ...(texto(b.rotulo, LIMITES_PACOTE.curto) ? { rotulo: texto(b.rotulo, LIMITES_PACOTE.curto) } : {}) } };
}
const textos = (x, max, n) => lista(x).filter((t) => typeof t === "string" && t.trim()).slice(0, n).map((t) => t.trim().slice(0, max));
function lerAcumulo(a) {
  if (!objeto(a) || !REGRAS_ACUMULO[a.regra]) return { motivo: "Regra de Acúmulo Desconhecida" };
  const out = { regra: a.regra };
  if (a.regra === "catalogo") {
    if (typeof a.origemId !== "string" || !/^[a-z]+:[A-Za-z0-9_.:-]{1,120}$/.test(a.origemId)) return { motivo: "Origem do Catálogo Inválida" };
    out.origemId = a.origemId;
  }
  if (a.regra === "auxilioInvocacao" || a.regra === "auraInvocacao") {
    const chave = texto(a.chave, 160);
    if (!chave) return { motivo: "Identidade do Acúmulo Ausente" };
    out.chave = chave;
    if (a.forca != null) {
      if (!Number.isFinite(Number(a.forca))) return { motivo: "Força da Aura Inválida" };
      out.forca = Number(a.forca);
    }
  }
  return { acumulo: out };
}
function lerDuracao(d) {
  if (!objeto(d) || !DURACAO_BY_ID[d.tipo]) return { motivo: "Duração Desconhecida" };
  if (d.tipo === "rodadas") {
    const r = inteiroEm(d.rodadas, 1, LIMITES_PACOTE.rodadas);
    if (r == null) return { motivo: "Duração em Rodadas Inválida" };
    return { duracao: { tipo: "rodadas", rodadas: r, ...(texto(d.texto, LIMITES_PACOTE.curto) ? { texto: texto(d.texto, LIMITES_PACOTE.curto) } : {}) } };
  }
  return { duracao: { tipo: d.tipo, ...(texto(d.texto, LIMITES_PACOTE.curto) ? { texto: texto(d.texto, LIMITES_PACOTE.curto) } : {}) } };
}

/** Uma opção do arquivo, copiada campo a campo. Devolve `{ opcao }` ou `{ motivo }`. */
export function lerOpcao(o, conhecidos = null) {
  if (!objeto(o)) return { motivo: "Opção Inválida" };
  if (!idValido(o.id)) return { motivo: "Opção Sem Id Válido" };
  const nome = texto(o.nome, LIMITES_PACOTE.nome);
  if (!nome) return { motivo: "Opção Sem Nome" };
  if (!FAMILIAS_PACOTE.some((f) => f.id === o.familia)) return { motivo: "Família Desconhecida" };
  const ac = lerAcumulo(o.acumulo);
  if (ac.motivo) return { motivo: ac.motivo };
  const du = lerDuracao(o.duracao);
  if (du.motivo) return { motivo: du.motivo };
  const brutos = lista(o.beneficios);
  if (brutos.length > LIMITES_PACOTE.beneficios) return { motivo: "Benefícios Demais" };
  const beneficios = [];
  for (const b of brutos) {
    const r = lerBeneficio(b, conhecidos);
    if (r.motivo) return { motivo: r.motivo };
    beneficios.push(r.beneficio);
  }
  const consulta = lista(o.consulta).filter(objeto).slice(0, LIMITES_PACOTE.consulta)
    .map((c) => ({ rotulo: texto(c.rotulo, LIMITES_PACOTE.curto), texto: texto(c.texto, LIMITES_PACOTE.texto) }))
    .filter((c) => c.rotulo && c.texto);
  if (!beneficios.length && !consulta.length) return { motivo: "Sem Benefício Representado" };
  const fonte = objeto(o.fonte) ?? {};
  return {
    opcao: {
      id: o.id, nome, familia: o.familia, calculo: o.calculo === "manual" ? "manual" : "automatico",
      fonte: { tipo: texto(fonte.tipo, 40), id: texto(fonte.id, 120), nome: texto(fonte.nome, LIMITES_PACOTE.nome) },
      escolhas: lista(o.escolhas).filter(objeto).slice(0, LIMITES_PACOTE.escolhas)
        .map((e) => ({ rotulo: texto(e.rotulo, LIMITES_PACOTE.curto), valor: texto(String(e.valor ?? ""), LIMITES_PACOTE.curto) }))
        .filter((e) => e.rotulo && e.valor),
      acumulo: ac.acumulo,
      beneficios,
      duracao: du.duracao,
      condicoes: textos(o.condicoes, LIMITES_PACOTE.texto, LIMITES_PACOTE.condicoes),
      custoEmissor: texto(o.custoEmissor, LIMITES_PACOTE.curto) || null,
      consulta,
      naoRepresentado: textos(o.naoRepresentado, LIMITES_PACOTE.texto, LIMITES_PACOTE.condicoes),
    },
  };
}

/**
 * Lê e confere um arquivo de pacote. Devolve `{ ok: false, erro }` quando o arquivo inteiro não serve (nada é gravado), ou `{ ok: true, pacote, recusadas }`
 * com as opções que entram e as que ficam de fora, cada uma com o motivo. `conhecidos` ({ pericia, tr, tipoDano, ataque }: Set) confere os alvos contra os
 * catálogos DESTA ficha: um alvo que ela não conhece seria um benefício que não muda nada, e isso é recusa com motivo, nunca zero calado.
 */
export function lerArquivoDePacote(entrada, { conhecidos = null } = {}) {
  let obj = entrada;
  if (typeof entrada === "string") {
    if (entrada.length > LIMITES_PACOTE.bytes) return { ok: false, erro: "Arquivo Grande Demais" };
    try { obj = JSON.parse(entrada); } catch { return { ok: false, erro: "Arquivo Não É JSON" }; }
  }
  if (!objeto(obj)) return { ok: false, erro: "Arquivo Sem Pacote" };
  if (obj.formato !== FORMATO_PACOTE) return { ok: false, erro: "Arquivo Não É um Pacote para Aliados" };
  if (!Number.isInteger(obj.versao)) return { ok: false, erro: "Versão do Arquivo Ausente" };
  if (obj.versao > VERSAO_PACOTE) return { ok: false, erro: "Versão do Arquivo Mais Nova que Esta Ficha" };
  if (obj.versao < 1) return { ok: false, erro: "Versão do Arquivo Inválida" };
  const p = objeto(obj.pacote);
  const e = objeto(obj.emissor);
  if (!p || !idValido(p.id)) return { ok: false, erro: "Pacote Sem Id Válido" };
  if (!e || !idValido(e.id)) return { ok: false, erro: "Emissor Sem Id Válido" };
  const nome = texto(p.nome, LIMITES_PACOTE.nome);
  const emissorNome = texto(e.nome, LIMITES_PACOTE.nome);
  if (!nome || !emissorNome) return { ok: false, erro: "Pacote ou Emissor Sem Nome" };
  const revisao = inteiroEm(p.revisao, 1, 1e6);
  if (revisao == null) return { ok: false, erro: "Revisão Inválida" };
  const brutas = lista(obj.opcoes);
  if (!brutas.length) return { ok: false, erro: "Pacote Sem Opções" };
  if (brutas.length > LIMITES_PACOTE.opcoes) return { ok: false, erro: "Opções Demais" };
  const ids = brutas.map((o) => o?.id);
  if (new Set(ids).size !== ids.length) return { ok: false, erro: "Ids de Opção Repetidos" };
  const opcoes = [];
  const recusadas = [];
  for (const o of brutas) {
    const r = lerOpcao(o, conhecidos);
    if (r.motivo) recusadas.push({ id: idValido(o?.id) ? o.id : null, nome: texto(o?.nome, LIMITES_PACOTE.nome) || "Sem Nome", motivo: r.motivo });
    else opcoes.push(r.opcao);
  }
  if (!opcoes.length) return { ok: false, erro: "Nenhuma Opção Representável", recusadas };
  return {
    ok: true,
    pacote: {
      chave: `${e.id}:${p.id}`, id: p.id, nome, revisao, exportadoEm: texto(p.exportadoEm, 40),
      emissor: { id: e.id, nome: emissorNome, sistema: e.sistema === "player" ? "player" : "afty" },
      opcoes,
    },
    recusadas,
  };
}

/* ============================================================ */
/* A BIBLIOTECA DO ALIADO                                        */
/* ============================================================ */
/** A biblioteca gravada no personagem, relida pela mesma lista branca (a ficha também viaja em arquivo). */
export function bibliotecaDaFicha(ficha) {
  const out = [];
  const vistos = new Set();
  for (const x of lista(ficha?.pacotesRecebidos)) {
    if (!objeto(x) || !idValido(x.id) || !idValido(x.emissor?.id)) continue;
    const chave = `${x.emissor.id}:${x.id}`;
    if (vistos.has(chave)) continue;
    const opcoes = lista(x.opcoes).map((o) => lerOpcao(o).opcao).filter(Boolean);
    if (!opcoes.length) continue;
    vistos.add(chave);
    out.push({
      chave, id: x.id, nome: texto(x.nome, LIMITES_PACOTE.nome) || "Pacote", revisao: inteiroEm(x.revisao, 1, 1e6) ?? 1,
      emissor: { id: x.emissor.id, nome: texto(x.emissor.nome, LIMITES_PACOTE.nome) || "Sem Nome", sistema: x.emissor.sistema === "player" ? "player" : "afty" },
      exportadoEm: texto(x.exportadoEm, 40), importadoEm: texto(x.importadoEm, 40), atualizadoEm: texto(x.atualizadoEm, 40),
      opcoes,
      recusadas: lista(x.recusadas).filter(objeto).slice(0, LIMITES_PACOTE.opcoes)
        .map((r) => ({ nome: texto(r.nome, LIMITES_PACOTE.nome) || "Sem Nome", motivo: texto(r.motivo, LIMITES_PACOTE.texto) })),
    });
  }
  return out;
}

const assinaturaDaOpcao = (o) => JSON.stringify(o);
/** Como o pacote lido se compara com o que já está na biblioteca. */
export function compararComBiblioteca(biblioteca, pacote) {
  const anterior = biblioteca.find((x) => x.chave === pacote.chave) ?? null;
  if (!anterior) return { estado: "novo", anterior: null, novas: pacote.opcoes.map((o) => o.id), removidas: [], alteradas: [] };
  const antes = new Map(anterior.opcoes.map((o) => [o.id, o]));
  const depois = new Map(pacote.opcoes.map((o) => [o.id, o]));
  const novas = [...depois.keys()].filter((id) => !antes.has(id));
  const removidas = [...antes.keys()].filter((id) => !depois.has(id));
  const alteradas = [...depois.keys()].filter((id) => antes.has(id) && assinaturaDaOpcao(antes.get(id)) !== assinaturaDaOpcao(depois.get(id)));
  const igual = !novas.length && !removidas.length && !alteradas.length && anterior.nome === pacote.nome;
  if (pacote.revisao < anterior.revisao) return { estado: "antiga", anterior, novas, removidas, alteradas };
  if (pacote.revisao === anterior.revisao) return { estado: igual ? "igual" : "diferente", anterior, novas, removidas, alteradas };
  return { estado: "revisao", anterior, novas, removidas, alteradas };
}
/** A biblioteca com o pacote gravado: substitui o mesmo pacote do mesmo emissor, e nunca duplica. Uma revisão mais antiga não entra. */
export function gravarNaBiblioteca(biblioteca, pacote, recusadas, agora) {
  const c = compararComBiblioteca(biblioteca, pacote);
  if (c.estado === "antiga") return { biblioteca, gravou: false, estado: c.estado };
  if (c.estado === "igual") return { biblioteca, gravou: false, estado: c.estado };
  const entrada = {
    chave: pacote.chave, id: pacote.id, nome: pacote.nome, revisao: pacote.revisao, emissor: pacote.emissor,
    exportadoEm: pacote.exportadoEm, importadoEm: c.anterior?.importadoEm || agora, atualizadoEm: agora,
    opcoes: pacote.opcoes, recusadas: lista(recusadas).map((r) => ({ nome: r.nome, motivo: r.motivo })),
  };
  const nova = c.anterior ? biblioteca.map((x) => (x.chave === pacote.chave ? entrada : x)) : [...biblioteca, entrada];
  return { biblioteca: nova, gravou: true, estado: c.estado };
}
export const tirarDaBiblioteca = (biblioteca, chave) => biblioteca.filter((x) => x.chave !== chave);

/* ============================================================ */
/* A INSTÂNCIA NA SESSÃO                                         */
/* ============================================================ */
export const chaveDaOpcaoRecebida = (entradaChave, opcaoId) => `recebido:${entradaChave}:${opcaoId}`;
export const ehInstanciaDePacote = (b) => !!b?.rec && !!b?.pacote?.chave && !!b?.pacote?.opcaoId;
/** A instância ativa daquela opção na sessão, ou null. */
export const instanciaAtivaDe = (sessao, entradaChave, opcaoId) => lista(sessao?.buffs)
  .find((b) => ehInstanciaDePacote(b) && b.pacote.chave === entradaChave && b.pacote.opcaoId === opcaoId) ?? null;
/** A opção da biblioteca de onde a instância veio (pode ter saído numa revisão nova: aí null). */
export function opcaoDaInstancia(biblioteca, inst) {
  if (!ehInstanciaDePacote(inst)) return null;
  const entrada = biblioteca.find((x) => x.chave === inst.pacote.chave);
  const opcao = entrada?.opcoes.find((o) => o.id === inst.pacote.opcaoId) ?? null;
  return opcao ? { entrada, opcao } : null;
}
/** Uma opção só se ativa com benefício representado. As de consulta ficam na biblioteca para leitura. */
export const opcaoAtivavel = (o) => lista(o?.beneficios).length > 0;

/* ---------------- prazo por benefício (PA-I3) ---------------- */
/** O prazo de um benefício: o dele, ou o da opção (`d`). */
export const prazoDoBeneficio = (b, d) => b?.duracao ?? d ?? { tipo: "permanente" };
/** A opção ou a instância tem algum benefício com prazo próprio? */
export const temPrazoPorBeneficio = (x) => lista(x?.beneficios).some((b) => objeto(b?.duracao));
/* A identidade de uma parte: o tipo e o texto do prazo. As de rodadas são UMA parte (cada benefício segue com o contador dele). */
const chaveDoPrazo = (d) => (d?.tipo === "rodadas" ? "rodadas" : `${d?.tipo ?? "permanente"}|${d?.texto ?? ""}`);
/**
 * As partes de uma instância com prazo por benefício: `[{ chave, duracao, contada, rodadas, beneficios }]`, as de rodadas primeiro. `contada` diz se a
 * ficha conta o prazo (rodadas). Instância sem prazo por benefício não tem partes (`[]`): ela termina inteira, como sempre.
 */
export function partesDaInstancia(inst) {
  if (!temPrazoPorBeneficio(inst)) return [];
  const d0 = inst?.pacote?.duracao ?? { tipo: "permanente" };
  const porChave = new Map();
  for (const b of lista(inst.beneficios)) {
    const d = prazoDoBeneficio(b, d0);
    const k = chaveDoPrazo(d);
    if (!porChave.has(k)) porChave.set(k, { chave: k, duracao: d, contada: d.tipo === "rodadas", beneficios: [] });
    porChave.get(k).beneficios.push(b);
  }
  return [...porChave.values()]
    .map((p) => (p.contada ? { ...p, rodadas: Math.min(...p.beneficios.map((b) => b.rodadas ?? p.duracao.rodadas ?? 1)) } : { ...p, rodadas: null }))
    .sort((a, b) => Number(b.contada) - Number(a.contada));
}
/** O texto do prazo de uma parte, com as rodadas que restam. */
export const textoDaParte = (p) => textoDaDuracao(p.contada ? { tipo: "rodadas", rodadas: p.rodadas } : p.duracao);
/**
 * A instância sem uma parte (o benefício de um ataque, depois do ataque): os outros benefícios seguem com o prazo deles. Devolve `null` quando não sobra
 * benefício, e quem chama trata como o Encerrar de sempre.
 */
export function semParteDaInstancia(inst, chave) {
  const d0 = inst?.pacote?.duracao ?? { tipo: "permanente" };
  const ficam = lista(inst?.beneficios).filter((b) => chaveDoPrazo(prazoDoBeneficio(b, d0)) !== chave);
  return ficam.length ? { ...inst, beneficios: ficam } : null;
}

/**
 * A instância de uma opção: um registro de Fonte Externa com o benefício e o prazo DAQUELA opção, contados a partir de agora (a ativação no receptor). O
 * custo é do emissor: nada é cobrado aqui, e nada finge que ele pagou. `somaPresumida` só vale para a origem sem regra conhecida, e é escolha do receptor.
 */
export function instanciaDaOpcao(entrada, opcao, { id, somaPresumida = false } = {}) {
  const regra = opcao.acumulo?.regra ?? "outro";
  const d = opcao.duracao ?? { tipo: "permanente" };
  /* Prazo por benefício (PA-I3): a instância inteira não conta rodadas, e cada benefício de rodadas leva o próprio contador. */
  const porBeneficio = temPrazoPorBeneficio(opcao);
  return {
    id, rec: true,
    tipoFonte: regra,
    origemId: regra === "catalogo" ? opcao.acumulo.origemId : null,
    origemNome: opcao.nome,
    aplicadoPor: entrada.emissor.nome,
    beneficios: opcao.beneficios.map((b) => ({
      canal: b.canal, valor: b.valor, ...(b.alvo ? { alvo: b.alvo } : {}), ...(b.quando ? { quando: b.quando } : {}),
      ...(b.duracao ? { duracao: { ...b.duracao }, ...(b.duracao.tipo === "rodadas" ? { rodadas: b.duracao.rodadas } : {}) } : {}),
    })),
    rodadas: d.tipo === "rodadas" && !porBeneficio ? d.rodadas : null,
    somaPresumida: regra === "outro" ? !!somaPresumida : false,
    ...(opcao.acumulo?.chave ? { acumulo: { chave: opcao.acumulo.chave, ...(opcao.acumulo.forca != null ? { forca: opcao.acumulo.forca } : {}) } } : {}),
    /* O descanso fecha a cena: o que não é permanente sai junto (`descansar`). Com prazo por benefício, basta um que não seja permanente. */
    terminaNoDescanso: porBeneficio ? opcao.beneficios.some((b) => prazoDoBeneficio(b, d).tipo !== "permanente") : d.tipo !== "permanente",
    pacote: {
      chave: entrada.chave, id: entrada.id, nome: entrada.nome, revisao: entrada.revisao, opcaoId: opcao.id,
      emissorId: entrada.emissor.id, emissorNome: entrada.emissor.nome, familia: opcao.familia, calculo: opcao.calculo,
      duracao: d, condicoes: opcao.condicoes ?? [], custoEmissor: opcao.custoEmissor ?? null,
    },
  };
}
