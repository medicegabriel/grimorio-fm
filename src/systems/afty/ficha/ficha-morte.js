/**
 * ============================================================
 * AS OPERAÇÕES DE VIDA E MORTE: PORTAS DA MORTE, MEDICINA E FERIMENTOS COMPLEXOS (CL2, 2026-10-30)
 * ============================================================
 * Livro p.313 e 314. O estado e as transições puras moram em `ficha-vital.js` (FOLHA). Este módulo é a camada das
 * OPERAÇÕES sobre a sessão, no mesmo contrato do CL1 (`docs/afty-motor-uso-combate.md`):
 *
 *   (sessao, derived, entrada, pedido) -> { sessao, aplicado, ...detalhes }
 *
 *   • `pedido.opId` é OBRIGATÓRIO e repetir o id devolve `repetida` sem aplicar nada (o anel de ids é o do CL1).
 *   • Uma recusa devolve a MESMA sessão, com `erro` (texto de tela) e `codigo` (para o código decidir).
 *   • Nada rola sozinho. O d20 vem de `entrada.natural` (o dado físico da mesa) ou de `entrada.rng`.
 *
 * O QUE O DANO E A CURA FAZEM por si, sem passar por aqui, está em `aplicaDano` e `aplicaCura` de `ficha-sessao.js`: o saldo
 * negativo, a falha por dano, o dano massivo, o gatilho do Ferimento e a quitação do saldo pela cura. As operações daqui são
 * as que PEDEM uma decisão ou um resultado de fora: o teste de morte do turno, a Medicina de quem socorre, o Ferimento
 * escolhido ou rolado, o tratamento, a permanência e a recuperação.
 *
 * ⚠ OS EFEITOS DO FERIMENTO que o Motor sabe dizer (Cego, metade do movimento, Destreza -4) vão pelos mecanismos que já
 * existem, a condição persistente e o Buff de Mesa sem prazo (`sincronizaEfeitosDeFerimentos`). O resto é DECLARADO em
 * `restricoesDeFerimentos` (desvantagem em perícia, mãos, rastejar): a ficha mostra, e quem rola aplica.
 * ============================================================
 */
import { rolarTeste } from "./ficha-rolagem";
import { registraRolagem, defineCondicoes } from "./ficha-sessao";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import {
  vitalEmBranco, estaMorrendo, estaMorto, resolveTesteDeMorte, estabilizado, cdDeMedicina, cdDaFeridaInterna,
  linhaDoFerimento, efeitosMotorDoFerimento, restricoesDeFerimentos, limiarDeFerimento, FALHAS_PARA_MORRER,
} from "./ficha-vital";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const vitalDe = (s) => s.vital ?? vitalEmBranco();
const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });

/** A guarda comum: sem `opId` é recusa, e id repetido não aplica de novo. Devolve `null` quando pode seguir. */
function guarda(sessao, pedido) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return recusa(sessao, "Sem Identidade da Operação", "sem-opid");
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  return null;
}
const fecha = (sessao, pedido, tipo) => comOperacao(sessao, { id: pedido.opId, tipo });

/** Os modos da queda do Restringido acabam quando o corpo sai das Portas. */
const semModosDeQueda = (s) => (s.especializacaoSessao
  ? { ...s, especializacaoSessao: { ...s.especializacaoSessao, modoMorte: null, quedaPendente: false, cairNoProximoDano: false } }
  : s);

/* ============================================================ */
/* O TESTE DE MORTE DO TURNO                                     */
/* ============================================================ */
/**
 * Rola o d20 do teste de morte (p.313). Só vale com o teste PENDENTE, que o início do turno abre (`iniciaTurnoFicha`), a
 * menos que `entrada.forcar`. 1 dá duas falhas, 2 a 9 uma falha, 10 a 19 um sucesso e 20 dois sucessos. Três sucessos
 * estabilizam com 1 PV, três falhas matam.
 *   entrada  { natural?, rng?, forcar? }
 * Retorno: `{ sessao, aplicado, natural, falhas, sucessos, estabilizou, morreu, estado }`.
 */
export function rolaTesteDeMorte(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  if (!estaMorrendo(v)) return recusa(sessao, "Fora das Portas da Morte", "nao-morrendo");
  if (!v.testePendente && !entrada.forcar) return recusa(sessao, "Sem Teste de Morte Pendente", "sem-teste-pendente");
  const rolagem = entrada.natural == null ? rolarTeste({ rotulo: "Teste de Morte", detalhe: "Portas da Morte" }, entrada.rng ?? Math.random) : null;
  const natural = rolagem ? rolagem.natural : inteiro(entrada.natural, 0);
  if (!(natural >= 1 && natural <= 20)) return recusa(sessao, "Resultado do d20 Inválido", "natural-invalido");
  const r = resolveTesteDeMorte(v, natural, sessao.rodada);
  let s = { ...sessao, vital: r.vital };
  if (r.estabilizou) s = semModosDeQueda({ ...s, hpAtual: 1 });
  if (rolagem) s = registraRolagem(s, rolagem);
  return {
    sessao: fecha(s, pedido, "morte:teste"), aplicado: true, natural, falhas: r.falhas, sucessos: r.sucessos,
    estabilizou: r.estabilizou, morreu: r.morreu, estado: r.vital.estado,
  };
}

/**
 * Remove falhas de morte por uma fonte que as tira (p.313: "habilidades de Suporte"). `entrada` { quantidade? , todas? }.
 */
export function removeFalhasDeMorte(sessao, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  if (estaMorto(v)) return recusa(sessao, "Corpo Morto", "morto");
  const tira = entrada.todas ? v.falhas : Math.max(0, inteiro(entrada.quantidade, 0));
  if (!tira || !v.falhas) return recusa(sessao, "Sem Falhas a Remover", "sem-falhas");
  const falhas = Math.max(0, v.falhas - tira);
  return { sessao: fecha({ ...sessao, vital: { ...v, falhas } }, pedido, "morte:remove-falhas"), aplicado: true, falhas };
}

/* ============================================================ */
/* MEDICINA                                                      */
/* ============================================================ */
/**
 * Estabilizar por Medicina (p.313): ação comum, a 1,5 m, CD 15 + 1 para cada 5 PV negativos. Sucesso estabiliza com 1 PV
 * e tira o corpo das Portas. As falhas ficam. O teste é de QUEM SOCORRE, e o resultado entra aqui.
 *   entrada  { total? , sucesso? , adjacente? }   `adjacente: false` recusa (fora dos 1,5 m)
 * Retorno: `{ sessao, aplicado, cd, estabilizou }`. Falhar gasta a tentativa e não muda o corpo.
 */
export function estabilizaPorMedicina(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  if (!estaMorrendo(v)) return recusa(sessao, "Fora das Portas da Morte", "nao-morrendo");
  if (entrada.adjacente === false) return recusa(sessao, "Fora do Alcance de 1,5 m", "fora-do-alcance");
  const cd = cdDeMedicina(v.saldo);
  const total = Number(entrada.total);
  const sucesso = typeof entrada.sucesso === "boolean" ? entrada.sucesso : (Number.isFinite(total) ? total >= cd : null);
  if (sucesso == null) return recusa(sessao, "Falta o Resultado do Teste de Medicina", "sem-resultado", { cd });
  if (!sucesso) return { sessao: fecha(sessao, pedido, "morte:medicina"), aplicado: true, cd, estabilizou: false };
  const s = semModosDeQueda({ ...sessao, hpAtual: 1, vital: estabilizado(v) });
  return { sessao: fecha(s, pedido, "morte:medicina"), aplicado: true, cd, estabilizou: true };
}

/**
 * O Restringido com Ainda de Pé disponível adia a morte massiva para a escolha dele. Esta operação é a escolha de NÃO usar o
 * Ainda de Pé: o corpo morre pelo dano massivo.
 */
export function confirmaMorteMassiva(sessao, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  if (!v.massivoPendente) return recusa(sessao, "Sem Morte Massiva Pendente", "sem-massivo");
  const s = { ...sessao, vital: { ...v, estado: "morto", causa: "massivo", testePendente: false, massivoPendente: false } };
  return { sessao: fecha(s, pedido, "morte:massivo"), aplicado: true, estado: "morto" };
}

/* ============================================================ */
/* FERIMENTOS COMPLEXOS                                          */
/* ============================================================ */
const PREFIXO_FERIMENTO = "ferimento:";

/**
 * Leva os efeitos de motor dos ferimentos para a condição persistente e o Buff de Mesa sem prazo, e tira os de ferimento que
 * saiu. Idempotente: roda de novo sem mudar nada. Devolve a MESMA sessão quando nada muda.
 */
export function sincronizaEfeitosDeFerimentos(sessao) {
  const ferimentos = vitalDe(sessao).ferimentos;
  const condicoes = (sessao.condicoes ?? []).filter((c) => !String(c?.id ?? "").startsWith(PREFIXO_FERIMENTO));
  const buffs = (sessao.buffs ?? []).filter((b) => !String(b?.id ?? "").startsWith(PREFIXO_FERIMENTO));
  for (const f of ferimentos) {
    const e = efeitosMotorDoFerimento(f);
    if (e.condicao) condicoes.push({ id: `${f.uid}:cond`, nome: e.condicao, forca: null, rodadas: null, sangramento: null });
    if (e.buff) buffs.push({ id: `${f.uid}:buff`, nome: "Ferimento Complexo", escopo: "criatura", rodadas: null, ...e.buff });
  }
  const condicoesIguais = JSON.stringify(condicoes) === JSON.stringify(sessao.condicoes ?? []);
  const buffsIguais = JSON.stringify(buffs) === JSON.stringify(sessao.buffs ?? []);
  if (condicoesIguais && buffsIguais) return sessao;
  /* A condição entra por `defineCondicoes`, o ÚNICO escritor (ele aplica o efeito sobre a Guarda e os filtros do Bloodfeast). */
  const comBuffs = buffsIguais ? sessao : { ...sessao, buffs };
  return condicoesIguais ? comBuffs : defineCondicoes(comBuffs, condicoes);
}

/**
 * Registra o Ferimento Complexo que o dano disparou (p.313: "tanto definir aleatoriamente quanto ser escolhido pelo
 * Narrador"). Só com um gatilho PENDENTE (`vital.ferimentosPendentes`), a menos que `entrada.forcar`.
 *   entrada  { resultado? (1 a 10, a escolha do Narrador), rng? (rola o d10), forcar? }
 * Retorno: `{ sessao, aplicado, ferimento }`.
 */
export function registraFerimento(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  if (!entrada.forcar && v.ferimentosPendentes < 1) return recusa(sessao, "Sem Ferimento Complexo Pendente", "sem-gatilho");
  const resultado = entrada.resultado == null ? 1 + Math.floor((entrada.rng ?? Math.random)() * 10) : inteiro(entrada.resultado, 0);
  const linha = linhaDoFerimento(resultado);
  if (!linha) return recusa(sessao, "Resultado Fora da Tabela de Ferimentos", "resultado-invalido");
  const ferimento = {
    uid: `${PREFIXO_FERIMENTO}${pedido.opId}`, rolagem: resultado, grupo: linha.grupo, membro: linha.membro, ferimento: linha.ferimento,
    rodada: Math.max(0, inteiro(sessao.rodada, 0)), tratado: false, permanente: false,
  };
  const vital = { ...v, ferimentos: [...v.ferimentos, ferimento], ferimentosPendentes: Math.max(0, v.ferimentosPendentes - 1) };
  return { sessao: fecha(sincronizaEfeitosDeFerimentos({ ...sessao, vital }), pedido, "ferimento:registra"), aplicado: true, ferimento };
}

const acha = (v, uid) => v.ferimentos.find((f) => f.uid === uid) ?? null;
const troca = (v, uid, campos) => ({ ...v, ferimentos: v.ferimentos.map((f) => (f.uid === uid ? { ...f, ...campos } : f)) });

/**
 * Trata a ferida interna (p.314): "uma criatura mestre em Medicina com uma ação comum". Reduz a CD de 20 para 10.
 *   entrada  { uid, mestreEmMedicina: true }   a declaração de quem trata
 */
export function trataFeridaInterna(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  const f = acha(v, entrada.uid);
  if (!f || f.grupo !== "interna") return recusa(sessao, "Ferida Interna Não Encontrada", "sem-ferida-interna");
  if (entrada.mestreEmMedicina !== true) return recusa(sessao, "Exige Mestre em Medicina", "sem-medicina");
  if (f.tratado) return recusa(sessao, "Ferida Interna Já Tratada", "ja-tratada");
  return { sessao: fecha({ ...sessao, vital: troca(v, f.uid, { tratado: true }) }, pedido, "ferimento:trata"), aplicado: true, cd: cdDaFeridaInterna(derived?.nd, true) };
}

/**
 * O teste de Fortitude da ferida interna (p.314): sempre que tentar uma ação em combate, CD 20 + nível (10 + nível depois de
 * tratada). Em uma falha PERDE A AÇÃO e não pode usar reações até o próximo turno: a ficha marca `semReacoes` (que
 * `gastaAcao` respeita) e devolve `perdeAcao` para quem chamou descartar a ação tentada.
 *   entrada  { uid?, natural? , rng? }
 */
export function testeDeFeridaInterna(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  const f = v.ferimentos.find((x) => x.grupo === "interna" && (!entrada.uid || x.uid === entrada.uid));
  if (!f) return recusa(sessao, "Sem Ferida Interna", "sem-ferida-interna");
  const tr = derived?.testes?.resistencias?.find((t) => t.value === "fortitude");
  if (!tr) return recusa(sessao, "Sem Teste de Fortitude", "sem-fortitude");
  const cd = cdDaFeridaInterna(derived?.nd, f.tratado);
  let s = sessao;
  let sucesso;
  let natural;
  if (entrada.natural != null) {
    natural = inteiro(entrada.natural, 0);
    if (!(natural >= 1 && natural <= 20)) return recusa(sessao, "Resultado do d20 Inválido", "natural-invalido");
    sucesso = natural + inteiro(tr.bonus, 0) >= cd;
  } else {
    const r = rolarTeste({ rotulo: "Ferida Interna", detalhe: "Fortitude", bonus: tr.bonus, dados: tr.dadosExtras, cd }, entrada.rng ?? Math.random);
    natural = r.natural;
    sucesso = !!r.sucesso;
    s = registraRolagem(s, r);
  }
  if (!sucesso) s = { ...s, vital: { ...vitalDe(s), semReacoes: true } };
  return { sessao: fecha(s, pedido, "ferimento:ferida-interna"), aplicado: true, natural, cd, sucesso, perdeAcao: !sucesso, semReacoes: !sucesso };
}

/**
 * O ferimento vira permanente (p.314: "após 1 dia, ou ao cicatrizar (decisão do Narrador)"). Não há relógio na ficha, então
 * a passagem é DECLARADA. `entrada` { uid }.
 */
export function tornaFerimentoPermanente(sessao, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  const v = vitalDe(sessao);
  const f = acha(v, entrada.uid);
  if (!f) return recusa(sessao, "Ferimento Não Encontrado", "sem-ferimento");
  if (f.permanente) return recusa(sessao, "Ferimento Já Permanente", "ja-permanente");
  return { sessao: fecha({ ...sessao, vital: troca(v, f.uid, { permanente: true }) }, pedido, "ferimento:permanente"), aplicado: true };
}

export const VIAS_DE_RECUPERACAO = ["energiaReversa", "feitico", "meios", "alma"];

/**
 * Recupera um ou mais ferimentos. Um ferimento comum se cura por energia reversa, Feitiço Curativo ou "meios alternativos e
 * raros" (p.314 e 228). Um PERMANENTE só pela alma: "caso você tenha sua alma curada, enquanto sua vida e integridade estejam
 * no máximo" (p.314), e a ficha confere o PV e a Alma no máximo no momento.
 *   entrada  { via, uid? , quantidade? , todos? }
 */
export function recuperaFerimento(sessao, derived, entrada = {}, pedido = {}) {
  const g = guarda(sessao, pedido);
  if (g) return g;
  if (!VIAS_DE_RECUPERACAO.includes(entrada.via)) return recusa(sessao, "Via de Recuperação Desconhecida", "via-desconhecida");
  const v = vitalDe(sessao);
  if (!v.ferimentos.length) return recusa(sessao, "Sem Ferimentos", "sem-ferimento");
  const candidatos = entrada.uid ? v.ferimentos.filter((f) => f.uid === entrada.uid) : v.ferimentos;
  if (!candidatos.length) return recusa(sessao, "Ferimento Não Encontrado", "sem-ferimento");
  const alvos = (entrada.todos || entrada.uid) ? candidatos : candidatos.slice(0, Math.max(1, inteiro(entrada.quantidade, 1)));
  const permanentes = alvos.filter((f) => f.permanente);
  if (permanentes.length) {
    if (entrada.via !== "alma") return recusa(sessao, "Ferimento Permanente Só se Cura Pela Alma", "so-pela-alma");
    const hpCheio = sessao.hpAtual >= inteiro(derived?.hp, Infinity);
    const almaCheia = sessao.almaAtual >= inteiro(derived?.almaMax, Infinity);
    if (!hpCheio || !almaCheia) return recusa(sessao, "Exige Vida e Integridade no Máximo", "vida-ou-alma-baixa");
  }
  const sai = new Set(alvos.map((f) => f.uid));
  const vital = { ...v, ferimentos: v.ferimentos.filter((f) => !sai.has(f.uid)) };
  return { sessao: fecha(sincronizaEfeitosDeFerimentos({ ...sessao, vital }), pedido, "ferimento:recupera"), aplicado: true, recuperados: alvos.map((f) => f.uid) };
}

/* ============================================================ */
/* A LEITURA PARA A TELA                                         */
/* ============================================================ */
/**
 * Tudo que a tela precisa para desenhar a vida e a morte de um corpo, num objeto só. Nenhum número aqui é calculado pela
 * tela: ela só mostra. `pode` diz quais operações estão abertas agora.
 */
export function resumoVital(sessao, derived) {
  const v = vitalDe(sessao);
  const hpMax = Math.max(0, inteiro(derived?.hp, 0));
  return {
    estado: v.estado,
    morto: estaMorto(v),
    morrendo: estaMorrendo(v),
    causaDaMorte: v.causa,
    saldo: v.saldo,
    sucessos: v.sucessos,
    falhas: v.falhas,
    falhasParaMorrer: FALHAS_PARA_MORRER,
    ultimoTeste: v.ultimoTeste,
    cdMedicina: estaMorrendo(v) ? cdDeMedicina(v.saldo) : null,
    limiarDeFerimento: limiarDeFerimento(hpMax),
    ferimentosPendentes: v.ferimentosPendentes,
    ferimentos: v.ferimentos,
    restricoes: restricoesDeFerimentos(v.ferimentos),
    semReacoes: v.semReacoes,
    pode: {
      rolarTesteDeMorte: estaMorrendo(v) && v.testePendente,
      estabilizarPorMedicina: estaMorrendo(v),
      registrarFerimento: v.ferimentosPendentes > 0,
      confirmarMorteMassiva: v.massivoPendente,
    },
  };
}
