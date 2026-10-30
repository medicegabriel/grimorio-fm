/* ============================================================
   PACOTES PARA ALIADOS: as fontes do suporte, família por família
   ============================================================
   O que um personagem pode CONCEDER a um aliado, e o número de cada coisa, saem
   daqui. Cada fonte é calculada pelo resolvedor que o Afty já tem para ela, com o
   contexto do EMISSOR (`derived` da ficha dele, sem sessão), e devolve os
   benefícios que o ALIADO recebe, nunca o número final da ficha do suporte:

     família            resolvedor                          acúmulo no aliado
     aptidaoAura        texto do livro (p. 174 e 175)       a mesma Aptidão vale uma vez
     feitico            `resolveAuxiliaresAtivos` sobre      Feitiços não somam entre si
                        uma cópia com só ele ligado
     auxilioInvocacao   `auxiliosLigadosDa` sobre uma        soma, e o mesmo auxílio do
                        mesa com a invocação em campo        mesmo emissor vale uma vez
     auraInvocacao      `aurasLigadasDa`, idem               auras iguais não acumulam
     estilo             os grupos da Técnica resolvida       Estilo e Feitiços não somam
                        pelo derive (`estilo.tecnicas`)
     especializacao     o texto de cada Habilidade de        a mesma Habilidade vale uma vez
                        Suporte com número para o aliado

   O catálogo inclui o que o suporte NÃO está usando agora: nenhum resolvedor lê
   estado de combate, e o que exige estado ligado roda sobre uma cópia, com as
   escolhas da preparação. Montar o pacote não liga nada nem gasta nada.

   ⚠ NEM TODO ITEM APRENDIDO BENEFICIA ALIADOS. Só entram as fontes cujo texto dá
   o benefício a um aliado. Feitiço de Alcance Próprio, auxílio da própria
   invocação e o que é só do emissor ficam de fora. O que tem número para a mesa
   mas não cabe num canal (2d3 numa jogada, uma reação) vai como CONSULTA: o
   aliado lê, e a ficha dele não muda.

   ⚠ NÃO É FOLHA: lê os catálogos e os resolvedores. Só a camada dos Efeitos
   (carregada depois do app) e os asserts (depois do derive) o importam.
   ============================================================ */
import { resolveAuxiliaresAtivos, estadoLigadoDoFeitico } from "../afty-combate-conjurador";
import { calcularFeitico } from "../afty-feiticos";
import { auxiliosLigadosDa, aurasLigadasDa, chaveDaAuraDeInvocacao, ehAuxilioSustentavel } from "../afty-invocacoes";
import { caracteristicaDoCatalogo } from "../afty-invocacoes-caracteristicas";
import { getEfeitoEstilo, TIPO_MODIFICACAO, ESCOLHA_ATAQUE } from "../afty-estilo-sombras-catalogo";
import { AFTY_PERICIAS } from "../afty-pericias-catalogo";
import { AFTY_RESISTENCIAS } from "../afty-schema";
import { TIPOS_DANO } from "../afty-equipamentos";
import { LIMITES_PACOTE, canalDoPacote } from "./pacotes-aliados";

const lista = (x) => (Array.isArray(x) ? x : []);
const inteiro = (v) => Math.trunc(Number(v) || 0);
const metade = (v) => Math.floor(inteiro(v) / 2);

/* ---------------- os nomes dos alvos, e o que esta ficha conhece ---------------- */
/** O nome de um alvo de benefício, pelos catálogos (com os addons da ficha no ar). */
export function nomeDoAlvo(tipo, id) {
  if (tipo === "pericia") return AFTY_PERICIAS.find((p) => p.id === id)?.nome ?? null;
  if (tipo === "tr") return AFTY_RESISTENCIAS.find((r) => r.value === id)?.label ?? null;
  if (tipo === "tipoDano") return TIPOS_DANO[id] ?? null;
  if (tipo === "ataque") return ESCOLHA_ATAQUE.find((a) => a.id === id)?.nome ?? null;
  return null;
}
/** Os alvos que a ficha que IMPORTA conhece. Um alvo fora deles seria um benefício que não muda nada, e a leitura o recusa com o motivo. */
export function conhecidosDaFicha() {
  return {
    pericia: new Set(AFTY_PERICIAS.map((p) => p.id)),
    tr: new Set(AFTY_RESISTENCIAS.map((r) => r.value)),
    tipoDano: new Set(Object.keys(TIPOS_DANO)),
  };
}

/* ---------------- o resultado de uma fonte ---------------- */
/* Tudo o que a opção leva, no formato do arquivo (`pacotes-aliados.js`, `lerOpcao`). `bloqueio`: a fonte existe mas não dá nada ao aliado agora, e diz por quê. */
function resultado(r) {
  return {
    nome: r.nome,
    familia: r.familia,
    calculo: r.calculo ?? "automatico",
    fonte: r.fonte,
    escolhas: r.escolhas ?? [],
    acumulo: r.acumulo,
    beneficios: (r.beneficios ?? []).filter((b) => Number.isFinite(b.valor) && b.valor !== 0),
    duracao: r.duracao,
    condicoes: r.condicoes ?? [],
    custoEmissor: r.custoEmissor ?? null,
    consulta: r.consulta ?? [],
    naoRepresentado: r.naoRepresentado ?? [],
    bloqueio: r.bloqueio ?? null,
    /* Para a conferência do suporte (hover): de onde o número saiu. Não vai no arquivo. */
    origemDoNumero: r.origemDoNumero ?? [],
  };
}
/** A opção como vai no arquivo: os campos do formato, e nada da conferência. */
export function paraArquivo(id, r) {
  const { bloqueio: _b, origemDoNumero: _o, ...resto } = r;
  return { id, ...resto };
}

/* ---------------- o contexto do emissor ---------------- */
function contextoDoEmissor(ficha, derived, emissorId) {
  const ctx = derived?.contextoDsl ?? {};
  return {
    ficha, derived, ctx, emissorId: emissorId || "emissor",
    bt: inteiro(ctx.bt ?? derived?.maestria),
    au: inteiro(derived?.aptidao?.efetivo?.au ?? ctx.au),
    mod: (attr) => inteiro(ctx[`mod_${attr}`]),
    efetivas: new Set(lista(derived?.habilidades?.efetivas)),
    escolhasDe: (habId) => lista(ficha?.escolhasHabilidade?.[habId]).length ? lista(ficha.escolhasHabilidade[habId]) : lista(derived?.habilidades?.escolhas?.mapa?.[habId]),
    aptidoes: new Set(lista(derived?.aptidoesEscolhidas)),
  };
}

/* ============================================================ */
/* APTIDÕES DE AURA (Livro, páginas 174 e 175)                   */
/* ============================================================ */
function fontesDeAura(c) {
  const out = [];
  if (c.aptidoes.has("aura_do_bastiao")) {
    out.push({
      chave: "aptidao|aura_do_bastiao", familia: "aptidaoAura", nome: "Aura do Bastião", grupo: "Aptidões de Aura", escolhas: [],
      /* "Todo aliado dentro de 4,5 metros de você recebe um bônus na Defesa igual ao seu Nível de Aptidão em Aura." */
      resolver: () => resultado({
        nome: "Aura do Bastião", familia: "aptidaoAura",
        fonte: { tipo: "aptidao", id: "aura_do_bastiao", nome: "Aura do Bastião" },
        acumulo: { regra: "catalogo", origemId: "aptidao:aura_do_bastiao" },
        beneficios: [{ canal: "defesa", valor: c.au }],
        duracao: { tipo: "alcance" },
        condicoes: ["Dentro de 4,5 m do Emissor"],
        bloqueio: c.au > 0 ? null : "Nível de Aptidão em Aura 0: Sem Bônus",
        origemDoNumero: [{ rotulo: "Nível de Aptidão em Aura", valor: c.au }],
      }),
    });
  }
  if (c.aptidoes.has("aura_do_comandante")) {
    const evoluida = c.aptidoes.has("aura_do_comandante_evoluida");
    out.push({
      chave: "aptidao|aura_do_comandante", familia: "aptidaoAura", nome: "Aura do Comandante", grupo: "Aptidões de Aura",
      escolhas: evoluida ? [{ id: "versao", rotulo: "Versão", opcoes: [{ id: "base", rotulo: "Base" }, { id: "evoluida", rotulo: "Evoluída" }], padrao: "base" }] : [],
      /* "recebem 1 + metade do seu Nível de Aptidão em Aura em rolagens de dano e testes de perícia dentro do combate. Para cada turno que você
         manter a aura ativa, você paga 2 pontos de energia amaldiçoada."
         Evoluída: "você pode optar por somar seu Nível de Aptidão em Aura total ao invés de 1 + metade e, também, conceder um bônus de +2 em
         jogadas de ataques e TRs. Entretanto, o custo para manter aumenta de 2 para 4 PE."
         A Evoluída é a MESMA Aura do Comandante usada de outro jeito: a mesma origem, e nunca duas fontes que somam. */
      resolver: (e = {}) => {
        const ev = evoluida && e.versao === "evoluida";
        const v = ev ? c.au : 1 + metade(c.au);
        return resultado({
          nome: ev ? "Aura do Comandante Evoluída" : "Aura do Comandante", familia: "aptidaoAura",
          fonte: { tipo: "aptidao", id: "aura_do_comandante", nome: "Aura do Comandante" },
          escolhas: evoluida ? [{ rotulo: "Versão", valor: ev ? "Evoluída" : "Base" }] : [],
          acumulo: { regra: "catalogo", origemId: "aptidao:aura_do_comandante" },
          beneficios: [
            { canal: "danoBonus", valor: v, quando: "em_combate" },
            { canal: "bonusPericia", valor: v, quando: "em_combate" },
            ...(ev ? [{ canal: "bonusAcerto", valor: 2 }, { canal: "bonusTR", valor: 2 }] : []),
          ],
          duracao: { tipo: "mantida", texto: "Enquanto o Emissor Mantiver a Aura" },
          condicoes: ["Dentro de 4,5 m do Emissor"],
          custoEmissor: ev ? "4 PE por Turno" : "2 PE por Turno",
          origemDoNumero: [{ rotulo: "Nível de Aptidão em Aura", valor: c.au }, { rotulo: ev ? "Nível Total" : "1 + Metade", valor: v }],
        });
      },
    });
  }
  return out;
}

/* ============================================================ */
/* FEITIÇOS AUXILIARES (Livro, página 216)                       */
/* ============================================================ */
const DURACAO_DO_FEITICO = (f) => (f.multiplosAtivo ? f.duracaoMult : f.duracaoAux) || "imediata";
function resolverFeitico(f, c) {
  const ctxF = { nd: inteiro(c.derived?.nd ?? c.ctx.nd), nivelConjurador: inteiro(c.ctx.nivel_conjurador), habilidades: [...c.efetivas] };
  const nome = f.nome || "Feitiço Sem Nome";
  const base = { nome, familia: "feitico", fonte: { tipo: "feitico", id: f.id, nome }, acumulo: { regra: "feitico" } };
  /* "Você pode reduzir o alcance de um Feitiço Auxiliar para Próprio e, ao fazer isso, o efeito apenas pode ser aplicado em você mesmo." */
  if (f.alcancePropria) return resultado({ ...base, duracao: { tipo: "permanente" }, bloqueio: "Alcance Próprio: Só no Emissor" });
  const calc = calcularFeitico(f, ctxF);
  if (!calc) return resultado({ ...base, duracao: { tipo: "permanente" }, bloqueio: "Feitiço Sem Cálculo" });
  /* O resolvedor do motor sobre uma CÓPIA com só este Feitiço ligado: o mesmo caminho que o suporte usa nele mesmo, com o contexto dele. */
  const estado = estadoLigadoDoFeitico(f.id);
  const r = resolveAuxiliaresAtivos({ feiticos: [f] }, { ativo: true, [estado]: true }, [{ id: estado, feiticoId: f.id }], ctxF);
  const tabela = r.efeitos.filter((e) => e.exclusivo);
  const dur = DURACAO_DO_FEITICO(f);
  const subs = calc.multiplos ? lista(calc.efeitos) : [calc];
  const rodadas = subs.map((s) => inteiro(s.rodadas)).find((n) => n > 0) ?? null;
  const alvos = Math.max(1, inteiro(calc.alvos) || 1);
  const upkeep = inteiro(calc.upkeepPE);
  const duracao = dur === "duradoura" && rodadas ? { tipo: "rodadas", rodadas: Math.min(rodadas, LIMITES_PACOTE.rodadas) }
    : dur === "sustentada" ? { tipo: "mantida", texto: "Enquanto o Emissor Sustentar" }
      : { tipo: "rodadas", rodadas: 1, ...(calc.umGolpe ? { texto: "Um Ataque" } : {}) };
  const consulta = r.dados.map((d) => ({ rotulo: "Dano Adicional", texto: `${d.dados}d${d.faces} ${d.momento === "apos" ? "Após o Ataque" : "Durante o Ataque"}` }));
  const especiais = subs.filter((s) => s?.disponivel && s.especial).map((s) => ({ rotulo: s.efeitoLabel ?? "Efeito", texto: String(s.especial) }));
  /* ⚠ O PERMUTATIVO NÃO VAI. "enfraquecem um aspecto do usuário para melhorar outros efeitos": em quem a perda cai, quando o alvo é outro, o
     livro não diz. Pendência em docs/a-fazer.md, sem regra inventada. */
  const permuta = r.efeitos.some((e) => !e.exclusivo) || r.permutasDeMargem.length > 0;
  return resultado({
    ...base,
    beneficios: permuta ? [] : tabela.map((e) => ({ canal: e.canal, valor: Number(e.expr), ...(e.alvo ? { alvo: e.alvo } : {}) })),
    duracao,
    condicoes: [alvos > 1 ? `Até ${alvos} Alvos` : "Um Alvo", f.concentracaoAux ? "Concentração do Emissor" : null].filter(Boolean),
    custoEmissor: dur === "sustentada" ? `${inteiro(calc.custoPE)} PE e ${upkeep} PE por Rodada` : `${inteiro(calc.custoPE)} PE`,
    consulta: [...consulta, ...especiais],
    naoRepresentado: [
      ...(consulta.length ? ["Os Dados de Dano do Feitiço São Rolados à Parte"] : []),
      ...(especiais.length ? ["Efeito Especial Sem Número na Ficha"] : []),
    ],
    bloqueio: permuta ? "Feitiço Permutativo: a Troca em Aliado Ainda Não Tem Regra" : (!tabela.length && !consulta.length && !especiais.length ? "Sem Efeito Utilizável" : null),
    origemDoNumero: [{ rotulo: "Nível do Feitiço", valor: f.nivel ?? 1 }, { rotulo: "Duração", valor: dur }],
  });
}
function fontesDeFeitico(c) {
  return lista(c.ficha?.feiticos).filter((f) => f?.tipo === "auxiliar" && f.id && !String(f.id).startsWith("rec_")).map((f) => ({
    chave: `feitico|${f.id}`, familia: "feitico", nome: f.nome || "Feitiço Sem Nome", grupo: "Feitiços Auxiliares", escolhas: [],
    resolver: () => resolverFeitico(f, c),
  }));
}

/* ============================================================ */
/* INVOCAÇÕES: auxílios para Aliados e Auras                     */
/* ============================================================ */
/* A Quimera também entrega auxílio: a mesma cópia leve do `efeitosDeInvocacao` (id `quimera:<id>`, Ações próprias ou as da principal). */
function invocacoesDoEmissor(ficha) {
  const invs = lista(ficha?.invocacoes);
  /* A MESMA regra do `efeitosDeInvocacao`: só a Quimera com principal e ao menos uma fundida que exista. */
  const quimeras = lista(ficha?.quimeras).flatMap((q) => {
    const principal = invs.find((x) => x.id === q?.principalId);
    const fundidas = lista(q?.fundidasIds).filter((id) => id !== principal?.id && invs.some((x) => x.id === id));
    if (!principal || !fundidas.length) return [];
    return [{ ...principal, id: `quimera:${q.id}`, nome: q.nome || principal.nome, acoes: Array.isArray(q.acoes) ? q.acoes : principal.acoes }];
  });
  return [...invs, ...quimeras].filter((i) => i?.id);
}
function fontesDeInvocacao(c) {
  const out = [];
  const donoBase = { nd: inteiro(c.ctx.nd ?? c.derived?.nd), bt: c.bt, nivelControlador: inteiro(c.ctx.nivel_controlador) };
  for (const inv of invocacoesDoEmissor(c.ficha)) {
    const nomeInv = inv.nome || "Invocação";
    for (const a of lista(inv.acoes)) {
      if (!ehAuxilioSustentavel(a)) continue;
      /* A mesa de uma CÓPIA: a invocação em campo e só este auxílio ligado. É o resolvedor do dono, com o mesmo contexto leve. */
      const dono = { ...donoBase, sessaoInvocacoes: { [inv.id]: { emCampo: true, auxilios: { [a.id]: true } } } };
      const r = auxiliosLigadosDa(inv, dono).paraAliados.find((x) => x.id === a.id);
      if (!r) continue;
      const nome = `${nomeInv} · ${r.nome}`;
      out.push({
        chave: `invAux|${inv.id}|${a.id}`, familia: "auxilioInvocacao", nome, grupo: nomeInv, escolhas: [],
        resolver: () => resultado({
          nome, familia: "auxilioInvocacao",
          fonte: { tipo: "invocacao", id: `${inv.id}/${a.id}`, nome },
          acumulo: { regra: "auxilioInvocacao", chave: `${c.emissorId}|${inv.id}|${a.id}` },
          beneficios: [{ canal: r.canal, valor: inteiro(r.valor) }],
          duracao: { tipo: "mantida", texto: "Enquanto o Auxílio Estiver Ligado" },
          condicoes: ["Invocação em Campo"],
          origemDoNumero: [{ rotulo: "Grau da Invocação", valor: inv.grau ?? "" }],
        }),
      });
    }
    for (const car of lista(inv.caracteristicas)) {
      const entrada = caracteristicaDoCatalogo(car?.subtipo);
      if (entrada?.categoria !== "aura") continue;
      const dono = { ...donoBase, sessaoInvocacoes: { [inv.id]: { emCampo: true, auras: { [car.id]: true } } } };
      const r = aurasLigadasDa(inv, dono)[0] ?? null;
      const nome = `${nomeInv} · ${car.nome || entrada.nome}`;
      out.push({
        chave: `invAura|${inv.id}|${car.id}`, familia: "auraInvocacao", nome, grupo: nomeInv, escolhas: [],
        resolver: () => {
          /* "Uma invocação só pode conceder auras a partir do 2° Grau." A Aura de Dano é um dado (1d4, 1d6, 1d8). */
          const dado = r?.canal === "dadosNomeados";
          return resultado({
            nome, familia: "auraInvocacao",
            fonte: { tipo: "invocacao", id: `${inv.id}/${car.id}`, nome },
            acumulo: r ? { regra: "auraInvocacao", chave: chaveDaAuraDeInvocacao(r.subtipo, r.alvo), forca: inteiro(r.valor) } : { regra: "auraInvocacao", chave: chaveDaAuraDeInvocacao(entrada.id, null) },
            beneficios: r ? [dado ? { canal: "dadosNomeados", alvo: `d${inteiro(r.valor)}`, valor: 1 } : { canal: r.canal, valor: inteiro(r.valor), ...(r.alvo ? { alvo: r.alvo } : {}) }] : [],
            duracao: { tipo: "alcance", texto: "Enquanto Estiver na Aura" },
            condicoes: ["Dentro de 4,5 m da Invocação", "Invocação em Campo"],
            bloqueio: r ? null : entrada.alvoParam && !car.parametros?.[entrada.alvoParam] ? "Alvo da Aura Não Escolhido" : "Aura Só a Partir do Segundo Grau",
            origemDoNumero: [{ rotulo: "Grau da Invocação", valor: inv.grau ?? "" }],
          });
        },
      });
    }
  }
  return out;
}

/* ============================================================ */
/* NOVO ESTILO DAS SOMBRAS: a segunda compra estende aos aliados */
/* ============================================================ */
function fontesDeEstilo(c) {
  const out = [];
  for (const t of lista(c.derived?.estilo?.tecnicas)) {
    if (t?.tipo !== TIPO_MODIFICACAO || t.mecanicamenteValida === false) continue;
    const calculados = lista(t.aliadosCalculados);
    const beneficios = [];
    const usados = new Set();
    /* O mesmo critério do `resolveTecnicaExpansao`: o efeito que estende aos aliados, com a escolha (o TR, a perícia, o tipo de ataque) como alvo.
       O número é o que o derive do EMISSOR calculou para os aliados (`aliadosCalculados`), achado pelo mesmo rótulo. */
    for (const g of lista(t.grupos)) {
      const def = getEfeitoEstilo(g.efeitoId);
      if (!def?.canal || def.repeticao !== "aliados" || !g.repeticao?.aliados || !def.aliados) continue;
      const rotulo = g.nomeEscolha ? `${def.aliados} (${g.nomeEscolha})` : def.aliados;
      const i = calculados.findIndex((x, j) => !usados.has(j) && x.efeitoId === def.id && x.rotulo === rotulo);
      if (i < 0) continue;
      usados.add(i);
      const valor = Number(calculados[i].valor);
      if (!Number.isFinite(valor) || !valor || !canalDoPacote(def.canal)) continue;
      beneficios.push({ canal: def.canal, valor, ...(g.escolha ? { alvo: g.escolha } : {}), rotulo });
    }
    /* "conceder metade do seu AU para seus aliados" numa modificação de Aptidão não diz em QUAL número: fica para consulta, com o valor. */
    const consulta = calculados.filter((x, j) => !usados.has(j) && !getEfeitoEstilo(x.efeitoId))
      .map((x) => ({ rotulo: String(x.rotulo).slice(0, LIMITES_PACOTE.curto), texto: `${Number(x.valor) >= 0 ? "+" : ""}${x.valor}` }));
    if (!beneficios.length && !consulta.length) continue;
    const nome = t.nome || "Técnica de Estilo";
    out.push({
      chave: `estilo|${t.id}`, familia: "estilo", nome, grupo: "Novo Estilo das Sombras", escolhas: [],
      resolver: () => resultado({
        nome, familia: "estilo",
        fonte: { tipo: "estilo", id: t.id, nome },
        acumulo: { regra: "estilo" },
        beneficios,
        duracao: { tipo: "mantida", texto: "Enquanto o Domínio Simples Estiver Ativo" },
        condicoes: ["Dentro do Domínio Simples do Emissor"],
        consulta,
        naoRepresentado: consulta.length ? ["O Bônus de Aptidão Estendido Não Diz o Número que Aumenta"] : [],
      }),
    });
  }
  return out;
}

/* ============================================================ */
/* HABILIDADES DE SUPORTE (o número que vai para o aliado)       */
/* ============================================================ */
const ATRIBUTO_PRE_SAB = [{ id: "presenca", rotulo: "Presença" }, { id: "sabedoria", rotulo: "Sabedoria" }];
const NOME_ATTR = { presenca: "Presença", sabedoria: "Sabedoria" };
function fontesDeSuporte(c) {
  const out = [];
  const tem = (id) => c.efetivas.has(id);
  const habilidade = (id, nome) => ({ tipo: "habilidade", id, nome });
  const catalogo = (id) => ({ regra: "catalogo", origemId: `habilidade:${id}` });
  const melhorPreSab = c.mod("sabedoria") > c.mod("presenca") ? "sabedoria" : "presenca";
  const escolhaAttr = { id: "atributo", rotulo: "Atributo", opcoes: ATRIBUTO_PRE_SAB, padrao: melhorPreSab };
  const attrDe = (e) => (e?.atributo === "sabedoria" ? "sabedoria" : e?.atributo === "presenca" ? "presenca" : melhorPreSab);
  const grupo = "Habilidades de Suporte";

  if (tem("sup_presenca_inspiradora")) {
    const max = Math.max(0, metade(c.mod("presenca")));
    out.push({
      chave: "habilidade|sup_presenca_inspiradora", familia: "especializacao", nome: "Presença Inspiradora", grupo,
      escolhas: max ? [{ id: "pe", rotulo: "PE Adicional", opcoes: Array.from({ length: max + 1 }, (_, n) => ({ id: String(n), rotulo: n ? `${n} PE` : "Nenhum" })), padrao: String(max) }] : [],
      /* "todo aliado dentro de 9 metros de você fique inspirado. Um aliado inspirado recebe um bônus de +1 em toda rolagem de perícia. Ao utilizar
         esta habilidade, você pode gastar uma quantidade de PE adicional igual a metade do seu modificador de Presença, aumentando o bônus em +1
         para cada PE gasto dessa maneira." O teto do adicional é a metade do modificador do EMISSOR. */
      resolver: (e = {}) => {
        const n = Math.min(max, Math.max(0, inteiro(e.pe ?? max)));
        return resultado({
          nome: "Presença Inspiradora", familia: "especializacao", fonte: habilidade("sup_presenca_inspiradora", "Presença Inspiradora"),
          escolhas: max ? [{ rotulo: "PE Adicional", valor: String(n) }] : [],
          acumulo: catalogo("sup_presenca_inspiradora"),
          beneficios: [{ canal: "bonusPericia", valor: 1 + n }],
          duracao: { tipo: "cena", texto: "Durante a Cena" },
          condicoes: ["Dentro de 9 m Quando o Emissor Usa"],
          custoEmissor: `${2 + n} PE`,
          origemDoNumero: [{ rotulo: "Base", valor: 1 }, { rotulo: "PE Adicional", valor: n }],
        });
      },
    });
  }
  if (tem("sup_pronto_para_agir")) {
    /* "seus aliados recebem um bônus igual a metade do modificador [de Presença]" na Iniciativa. */
    const v = metade(c.mod("presenca"));
    out.push({
      chave: "habilidade|sup_pronto_para_agir", familia: "especializacao", nome: "Pronto para Agir", grupo, escolhas: [],
      resolver: () => resultado({
        nome: "Pronto para Agir", familia: "especializacao", fonte: habilidade("sup_pronto_para_agir", "Pronto para Agir"),
        acumulo: catalogo("sup_pronto_para_agir"),
        beneficios: [{ canal: "iniciativa", valor: v }],
        duracao: { tipo: "permanente" },
        bloqueio: v > 0 ? null : "Metade do Modificador de Presença Não Dá Bônus",
        origemDoNumero: [{ rotulo: "Metade do Modificador de Presença", valor: v }],
      }),
    });
  }
  const apoios = new Set(c.escolhasDe("sup_apoio_avancado"));
  if (tem("sup_apoio_avancado") && apoios.has("sup_apoio_defensivo")) {
    /* "aumentar a Defesa dele em um valor igual metade do seu bônus de treinamento até o começo do próximo turno." */
    const v = metade(c.bt);
    out.push({
      chave: "apoio|sup_apoio_defensivo", familia: "especializacao", nome: "Apoio Defensivo", grupo, escolhas: [],
      resolver: () => resultado({
        nome: "Apoio Defensivo", familia: "especializacao", fonte: habilidade("sup_apoio_defensivo", "Apoio Defensivo"),
        acumulo: catalogo("sup_apoio_defensivo"),
        beneficios: [{ canal: "defesa", valor: v }],
        duracao: { tipo: "rodadas", rodadas: 1, texto: "Até o Começo do Próximo Turno do Emissor" },
        condicoes: ["Quando o Emissor Usa Apoiar em Você"],
        bloqueio: v > 0 ? null : "Metade do BT Não Dá Bônus",
        origemDoNumero: [{ rotulo: "Metade do Bônus de Treinamento", valor: v }],
      }),
    });
  }
  if (tem("sup_apoio_avancado") && apoios.has("sup_apoio_estrategico")) {
    /* "aumentar a CD do próximo teste que force TR do Aliado em um valor igual a metade do seu Bônus de Treinamento." */
    const v = metade(c.bt);
    out.push({
      chave: "apoio|sup_apoio_estrategico", familia: "especializacao", nome: "Apoio Estratégico", grupo, escolhas: [],
      resolver: () => resultado({
        nome: "Apoio Estratégico", familia: "especializacao", fonte: habilidade("sup_apoio_estrategico", "Apoio Estratégico"),
        acumulo: catalogo("sup_apoio_estrategico"),
        beneficios: [{ canal: "cd", valor: v }],
        duracao: { tipo: "proximo", texto: "Até o Próximo Teste que Force TR" },
        condicoes: ["Quando o Emissor Usa Apoiar em Você"],
        bloqueio: v > 0 ? null : "Metade do BT Não Dá Bônus",
        origemDoNumero: [{ rotulo: "Metade do Bônus de Treinamento", valor: v }],
      }),
    });
  }
  if (tem("sup_apoio_avancado") && apoios.has("sup_apoio_focado")) {
    out.push({
      chave: "apoio|sup_apoio_focado", familia: "especializacao", nome: "Apoio Focado", grupo, escolhas: [escolhaAttr],
      /* "conceder um bônus no teste que ele realizar igual a metade do seu modificador de Presença ou Sabedoria": um teste só, de qualquer tipo. */
      resolver: (e = {}) => resultado({
        nome: "Apoio Focado", familia: "especializacao", fonte: habilidade("sup_apoio_focado", "Apoio Focado"),
        escolhas: [{ rotulo: "Atributo", valor: NOME_ATTR[attrDe(e)] }],
        acumulo: catalogo("sup_apoio_focado"),
        duracao: { tipo: "proximo", texto: "No Teste Apoiado" },
        consulta: [{ rotulo: "Bônus no Teste Apoiado", texto: `+${metade(c.mod(attrDe(e)))}, Além da Vantagem` }],
        naoRepresentado: ["Um Teste Só, de Qualquer Tipo"],
      }),
    });
  }
  if (tem("sup_inimigo_comum")) {
    out.push({
      chave: "habilidade|sup_inimigo_comum", familia: "especializacao", nome: "Inimigo Comum", grupo, escolhas: [escolhaAttr],
      /* "Sempre que uma pessoa atacar o inimigo em comum, adiciona-se metade do seu bônus de Presença ou sabedoria na rolagem de acerto e o
         modificador inteiro nas rolagens de dano." */
      resolver: (e = {}) => {
        const m = c.mod(attrDe(e));
        return resultado({
          nome: "Inimigo Comum", familia: "especializacao", fonte: habilidade("sup_inimigo_comum", "Inimigo Comum"),
          escolhas: [{ rotulo: "Atributo", valor: NOME_ATTR[attrDe(e)] }],
          acumulo: catalogo("sup_inimigo_comum"),
          beneficios: [{ canal: "bonusAcerto", valor: metade(m) }, { canal: "danoBonus", valor: m }],
          duracao: { tipo: "cena", texto: "Até o Inimigo Comum Cair" },
          condicoes: ["Só ao Atacar o Inimigo Comum", "Atacar Outra Criatura Encerra"],
          custoEmissor: "2 PE",
          bloqueio: m > 0 ? null : "Modificador Sem Bônus",
          origemDoNumero: [{ rotulo: `Modificador de ${NOME_ATTR[attrDe(e)]}`, valor: m }],
        });
      },
    });
  }
  if (tem("sup_taticas_defensivas")) {
    const tipo = c.escolhasDe("sup_taticas_defensivas").map((id) => /^sup_taticas_(.+)$/.exec(id)?.[1]).find(Boolean) ?? null;
    out.push({
      chave: "habilidade|sup_taticas_defensivas", familia: "especializacao", nome: "Táticas Defensivas", grupo, escolhas: [],
      /* "Você pode escolher um tipo de dano Elemental para que você e dois aliados sejam resistentes." */
      resolver: () => resultado({
        nome: "Táticas Defensivas", familia: "especializacao", fonte: habilidade("sup_taticas_defensivas", "Táticas Defensivas"),
        escolhas: tipo ? [{ rotulo: "Tipo de Dano", valor: TIPOS_DANO[tipo] ?? tipo }] : [],
        acumulo: catalogo("sup_taticas_defensivas"),
        beneficios: tipo ? [{ canal: "resistenciaDano", alvo: tipo, valor: 1 }] : [],
        duracao: { tipo: "permanente", texto: "Até o Emissor Trocar no Descanso Longo" },
        condicoes: ["Um dos Dois Aliados Escolhidos"],
        bloqueio: tipo ? null : "Tipo de Dano Não Escolhido na Ficha do Emissor",
      }),
    });
  }
  if (tem("sup_olhar_agucado")) {
    /* "fazendo com que o primeiro ataque de todo aliado cause dano adicional igual ao seu bônus de treinamento multiplicado por 5." */
    out.push({
      chave: "habilidade|sup_olhar_agucado", familia: "especializacao", nome: "Olhar Aguçado", grupo, escolhas: [],
      resolver: () => resultado({
        nome: "Olhar Aguçado", familia: "especializacao", fonte: habilidade("sup_olhar_agucado", "Olhar Aguçado"),
        acumulo: catalogo("sup_olhar_agucado"),
        beneficios: [{ canal: "danoBonus", valor: 5 * c.bt }],
        duracao: { tipo: "proximo", texto: "Primeiro Ataque Contra o Inimigo Analisado" },
        condicoes: ["Contra o Inimigo Analisado"],
        custoEmissor: "2 PE",
        origemDoNumero: [{ rotulo: "Bônus de Treinamento × 5", valor: 5 * c.bt }],
      }),
    });
  }
  if (tem("sup_contra_ataque")) {
    /* "como uma reação, gastar 1 ponto de energia amaldiçoada para aumentar a Defesa de um aliado em um valor igual ao seu bônus de treinamento" */
    out.push({
      chave: "habilidade|sup_contra_ataque", familia: "especializacao", nome: "Contra-Ataque", grupo, escolhas: [],
      resolver: () => resultado({
        nome: "Contra-Ataque", familia: "especializacao", fonte: habilidade("sup_contra_ataque", "Contra-Ataque"),
        acumulo: catalogo("sup_contra_ataque"),
        beneficios: [{ canal: "defesa", valor: c.bt }],
        duracao: { tipo: "proximo", texto: "Contra Um Ataque" },
        condicoes: ["Reação do Emissor"],
        custoEmissor: "1 PE",
        origemDoNumero: [{ rotulo: "Bônus de Treinamento", valor: c.bt }],
      }),
    });
  }
  /* Só consulta: o número é de UMA rolagem, de uma reação ou de uma concessão de mesa, e não de um valor que fica ligado. */
  const consulta = (id, nome, linhas, extra = {}) => {
    if (!tem(id)) return;
    out.push({
      chave: `habilidade|${id}`, familia: "especializacao", nome, grupo, escolhas: extra.escolhas ?? [],
      resolver: (e = {}) => resultado({
        nome, familia: "especializacao", fonte: habilidade(id, nome),
        escolhas: extra.escolhasTexto ? extra.escolhasTexto(e) : [],
        acumulo: catalogo(id),
        duracao: { tipo: "proximo" },
        consulta: typeof linhas === "function" ? linhas(e) : linhas,
        naoRepresentado: ["Número de Mesa: a Ficha do Aliado Não Muda"],
        custoEmissor: extra.custo ?? null,
      }),
    });
  };
  consulta("sup_comando_motivador", "Comando Motivador", [{ rotulo: "Ação Comandada", texto: `+${c.bt} na Rolagem da Ação` }], { custo: "2 PE" });
  consulta("sup_guarda_sincronizada", "Guarda Sincronizada", [{ rotulo: "Defesa", texto: "+1 por Outro Aliado no Alcance (7,5 m)" }]);
  consulta("sup_inspirar_aliados", "Inspirar Aliados", (e) => [{ rotulo: "Inspiração", texto: `2d3 em Uma Jogada, ${Math.max(0, c.mod(attrDe(e)))} Vezes em 10 Minutos` }],
    { escolhas: [escolhaAttr], escolhasTexto: (e) => [{ rotulo: "Atributo", valor: NOME_ATTR[attrDe(e)] }], custo: "1 PE" });
  consulta("sup_elevar_sucesso", "Elevar Sucesso", [{ rotulo: "Teste de Resistência", texto: "+5 no TR Bem-Sucedido" }], { custo: "2 PE" });
  consulta("sup_motivacao_pelo_triunfo", "Motivação pelo Triunfo", [{ rotulo: "PV Temporário", texto: `${2 * inteiro(c.ctx.nivel_suporte)} (Metade Contra Lacaio)` }]);
  return out;
}

/* ============================================================ */
/* O CATÁLOGO DO EMISSOR                                         */
/* ============================================================ */
/**
 * Todas as fontes que este personagem pode conceder a aliados, com o resolvedor de cada uma. `derived` é o derive da ficha SEM sessão (os números
 * permanentes do emissor): um estado ligado agora não muda o pacote. Chame dentro do `comAddons` da ficha.
 */
export function fontesParaAliados(ficha, derived, { emissorId = null } = {}) {
  const c = contextoDoEmissor(ficha, derived, emissorId);
  const fontes = [...fontesDeAura(c), ...fontesDeFeitico(c), ...fontesDeInvocacao(c), ...fontesDeEstilo(c), ...fontesDeSuporte(c)];
  return { fontes, porChave: new Map(fontes.map((f) => [f.chave, f])) };
}

/* ---------------- a definição manual ---------------- */
/**
 * Uma família que o Afty ainda não calcula pode ser definida à mão UMA vez pelo suporte, e vai marcada como tal (`calculo: "manual"`). Só com o que tem
 * representação fiel: canal do pacote, valor, regra de acúmulo conhecida (a origem do catálogo, Feitiço) ou "outro", que o aliado decide.
 */
export function resolverManual(m = {}) {
  const regra = ["catalogo", "feitico", "outro"].includes(m.regra) ? m.regra : "outro";
  const beneficios = lista(m.beneficios)
    .map((b) => ({ canal: b.canal, valor: Number(b.valor), ...(b.alvo ? { alvo: b.alvo } : {}), ...(b.quando ? { quando: b.quando } : {}) }))
    .filter((b) => canalDoPacote(b.canal) && Number.isFinite(b.valor) && b.valor !== 0);
  const rod = inteiro(m.rodadas);
  const tipo = m.duracao === "rodadas" ? (rod > 0 ? "rodadas" : "permanente") : (["cena", "mantida", "alcance", "proximo", "permanente"].includes(m.duracao) ? m.duracao : "permanente");
  const nome = String(m.nome ?? "").trim().slice(0, LIMITES_PACOTE.nome);
  return resultado({
    nome: nome || "Efeito Sem Nome", familia: "manual", calculo: "manual",
    fonte: { tipo: "manual", id: regra === "catalogo" ? String(m.origemId ?? "") : "", nome: nome || "Efeito Sem Nome" },
    acumulo: regra === "catalogo" && m.origemId ? { regra, origemId: m.origemId } : { regra: regra === "catalogo" ? "outro" : regra },
    beneficios,
    duracao: tipo === "rodadas" ? { tipo, rodadas: Math.min(rod, LIMITES_PACOTE.rodadas) } : { tipo },
    condicoes: String(m.condicao ?? "").trim() ? [String(m.condicao).trim().slice(0, LIMITES_PACOTE.texto)] : [],
    custoEmissor: String(m.custo ?? "").trim().slice(0, LIMITES_PACOTE.curto) || null,
    bloqueio: !nome ? "Dê um Nome ao Efeito" : !beneficios.length ? "Nenhum Valor Definido" : null,
  });
}

/** O resultado de um item do pacote (a receita gravada), ou `{ indisponivel }` quando a fonte saiu da ficha do emissor. */
export function resolverItem(item, porChave) {
  if (item.fonte === "manual") return resolverManual(item.manual ?? {});
  const f = porChave.get(item.fonte);
  if (!f) return { indisponivel: "A Fonte Não Está Mais na Ficha" };
  return f.resolver(item.escolhas ?? {});
}
/** As escolhas iniciais de uma fonte: o padrão de cada uma. */
export const escolhasPadrao = (fonte) => Object.fromEntries(lista(fonte?.escolhas).map((e) => [e.id, e.padrao ?? e.opcoes?.[0]?.id ?? null]));
