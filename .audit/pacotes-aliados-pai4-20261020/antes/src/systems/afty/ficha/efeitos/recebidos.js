/* ============================================================
   FONTES EXTERNAS NO CÁLCULO: o que a aba Efeitos precisa saber delas
   ============================================================
   A interpretação dos registros (Feitiço recebido, conteúdo de catálogo e
   Outra Origem) mora em `../ficha-recebidos.js`, que é compartilhada pela ficha
   clássica, pelo G2, pelo Encontro e pelos derives de comparação (G2-I1,
   2026-10-19). Aqui ficam o catálogo de origens, a leitura da disputa dos
   efeitos próprios e as frases que a prévia e o detalhe mostram, mais o
   `prepararCalculo`, que é aquela interpretação com o derive GUARDADO da camada
   dos Efeitos (`ponte.js`).
   ============================================================ */
import { derivar } from "./ponte";
import { chaveExclusiva, grupoExclusivo } from "../../afty-efeitos";
import { aquecerTraducao, calcularRecebidos, ehRegistro } from "../ficha-recebidos";
import { AFTY_APTIDOES } from "../../afty-aptidoes";
import { AFTY_HABILIDADES } from "../../afty-habilidades";
import { AFTY_TALENTOS } from "../../afty-talentos";
import { MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS, HABILIDADES_APICE } from "../../afty-alto-nivel";
import { semAcento } from "./util";
import { canalDoPacote, chaveDaOpcaoRecebida, rotuloDoBeneficio, rotuloFamilia, textoDoBeneficio, QUANDOS_PACOTE } from "../pacotes-aliados";
import { nomeDoAlvo } from "../pacotes-familias";

export const TIPOS_FONTE = [
  { id: "feitico", rotulo: "Feitiço" },
  { id: "catalogo", rotulo: "Habilidade, Aptidão ou Talento" },
  { id: "outro", rotulo: "Outra Origem" },
  /* As regras que só chegam por um Pacote para Aliados (o formulário não as oferece). */
  { id: "estilo", rotulo: "Novo Estilo das Sombras" },
  { id: "auxilioInvocacao", rotulo: "Auxílio de Invocação" },
  { id: "auraInvocacao", rotulo: "Aura de Invocação" },
];

/* Os valores que um registro pode mexer: canais do motor que valem sem alvo. */
export const CANAIS_EXTERNOS = [
  { id: "defesa", rotulo: "Defesa" },
  { id: "bonusAcerto", rotulo: "Acerto" },
  { id: "danoBonus", rotulo: "Dano" },
  { id: "rdGeral", rotulo: "RD Geral" },
  { id: "movimento", rotulo: "Movimento" },
  { id: "iniciativa", rotulo: "Iniciativa" },
  { id: "atencao", rotulo: "Atenção" },
];
export const rotuloCanal = (id) => CANAIS_EXTERNOS.find((c) => c.id === id)?.rotulo ?? canalDoPacote(id)?.rotulo ?? id;
/** O nome de um benefício com o alvo ("Atletismo", "TR de Vontade", "Resistência (Ácido)"), pelos catálogos desta ficha. */
export const rotuloDoRecebido = (canal, alvo = null) => (alvo ? rotuloDoBeneficio({ canal, alvo }, nomeDoAlvo) : rotuloCanal(canal));

/* ---------------- o catálogo, para identificar a origem ---------------- */
/* Tudo o que existe, e não só o que o receptor possui. */
const FONTES_CATALOGO = [
  ["aptidao", "Aptidão", AFTY_APTIDOES],
  ["habilidade", "Habilidade", AFTY_HABILIDADES],
  ["talento", "Talento", AFTY_TALENTOS],
  ["melhoria", "Melhoria Superior", MELHORIAS_SUPERIORES],
  ["lendaria", "Habilidade Lendária", HABILIDADES_LENDARIAS],
  ["apice", "Habilidade Ápice", HABILIDADES_APICE],
];
let INDICE = null;
function catalogoDeOrigens() {
  if (INDICE) return INDICE;
  const vistos = new Set();
  INDICE = [];
  for (const [tipo, rotulo, lista] of FONTES_CATALOGO) {
    for (const x of lista ?? []) {
      if (!x?.id || !x?.nome) continue;
      const id = `${tipo}:${x.id}`;
      if (vistos.has(id)) continue;
      vistos.add(id);
      INDICE.push({ id, nome: x.nome, tipo, rotuloTipo: rotulo, busca: semAcento(x.nome) });
    }
  }
  return INDICE;
}
export function buscarOrigem(termo, limite = 8) {
  const t = semAcento(termo).trim();
  if (t.length < 2) return [];
  const todos = catalogoDeOrigens();
  const comeca = todos.filter((x) => x.busca.startsWith(t));
  const contem = todos.filter((x) => !x.busca.startsWith(t) && x.busca.includes(t));
  return [...comeca, ...contem].slice(0, limite);
}
export const origemPorId = (id) => catalogoDeOrigens().find((x) => x.id === id) ?? null;

/* ---------------- os Recebidos de pacotes, como opções do catálogo ---------------- */
/** O texto de um benefício recebido, com os nomes desta ficha ("Atletismo +3", "TR de Vontade +2"). */
export const textoDoRecebido = (b) => textoDoBeneficio(b, nomeDoAlvo);
/**
 * As opções da biblioteca de pacotes recebidos (`creature.pacotesRecebidos`) no formato das opções do catálogo, para a busca e a categoria
 * Recebidos. A chave é `recebido:<emissor>:<pacote>:<opção>`, e `recebido` leva a entrada e a opção: quem ativa lê a biblioteca de novo.
 */
export function opcoesRecebidas(biblioteca) {
  const out = [];
  for (const entrada of biblioteca ?? []) {
    for (const opcao of entrada.opcoes) {
      const textos = opcao.beneficios.map(textoDoRecebido);
      out.push({
        chave: chaveDaOpcaoRecebida(entrada.chave, opcao.id), nome: opcao.nome, item: null, grupo: null, como: "recebido",
        pacoteRecebido: { entrada, opcao },
        origem: { tipo: "recebido", rotulo: rotuloFamilia(opcao.familia), curta: `De ${entrada.emissor.nome}`, detalhe: entrada.nome },
        texto: [...textos, ...opcao.consulta.map((c) => `${c.rotulo}: ${c.texto}`)].join(" · "),
        opcoes: [],
        buscaNome: semAcento(opcao.nome),
        busca: semAcento([opcao.nome, entrada.nome, entrada.emissor.nome, rotuloFamilia(opcao.familia), opcao.fonte?.nome, ...textos, ...opcao.condicoes].filter(Boolean).join(" \n ")),
      });
    }
  }
  return out;
}

/* ---------------- registros ---------------- */
export { ehRegistro };

/** A ficha e a sessão que o motor vê, com os registros já traduzidos (a interpretação é a de `../ficha-recebidos.js`), pelo derive guardado. */
export const prepararCalculo = (ficha, sessao) => calcularRecebidos(ficha, sessao, derivar);
/** O derive de base de uma Fonte de Catálogo, adiantado (fica guardado). Devolve se havia o que adiantar: quem roda em fatias devolve o controle antes da conta de verdade. */
export const aquecerCalculo = (ficha, sessao) => aquecerTraducao(ficha, sessao, derivar);

/* ---------------- a disputa, lida do motor, para os efeitos PRÓPRIOS ---------------- */
/**
 * Por nome de fonte: como ela ficou em cada valor disputado.
 *   perde   outra do mesmo grupo vale MAIS
 *   empata  vale o MESMO que outra: o número entra uma vez, e ninguém cobre
 *           ninguém. O motor marca um dos dois como suplantado só para não
 *           somar duas vezes, e isso não é derrota.
 * O empate só existe NO TOPO. Com +6, +6 e +9, os dois +6 perdem para o +9 e
 * nenhum empata: igualdade abaixo do vencedor não conta. Encerrado o +9, o topo
 * passa a ser +6 e aí os dois empatam.
 * A disputa é a do motor, com a MESMA chave (`chaveExclusiva`): grupo da
 * família pela versão de regras da ficha, canal, alvo (o atributo, a perícia,
 * o TR) e sinal. Dois alvos diferentes do mesmo canal não disputam.
 * ⚠ A LIGAÇÃO É PELO NOME do detalhe (`d.nome`), que é o que o motor devolve.
 */
export function disputasPorFonte(derived, emGrupos = true) {
  const detalhes = (derived.efeitos?.detalhes ?? []).filter((d) => d.exclusivo);
  const grupos = new Map();
  for (const d of detalhes) {
    const k = chaveExclusiva(d.canal, d.alvo, d.valor, grupoExclusivo(d.exclusivo, emGrupos));
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(d);
  }
  const out = new Map();
  const poe = (nome, x) => { if (!out.has(nome)) out.set(nome, []); out.get(nome).push(x); };
  for (const itens of grupos.values()) {
    if (itens.length < 2) continue;
    /* Bônus fica com o maior, penalidade com a pior, como no `resolverExclusivos`. */
    const topo = itens[0].valor < 0 ? Math.min(...itens.map((d) => d.valor)) : Math.max(...itens.map((d) => d.valor));
    const noTopo = itens.filter((d) => d.valor === topo);
    const vencedor = noTopo.find((d) => !d.suplantado) ?? noTopo[0];
    for (const d of itens) {
      const base = { canal: d.canal, alvo: d.alvo ?? null, valor: d.valor };
      if (d.valor !== topo) poe(d.nome, { ...base, status: "perde", vencedor: { nome: vencedor.nome, valor: vencedor.valor } });
      else if (noTopo.length > 1) {
        const outro = noTopo.find((x) => x !== d);
        poe(d.nome, { ...base, status: "empata", com: { nome: outro.nome, valor: outro.valor } });
      }
    }
  }
  return out;
}

/* ---------------- a frase de cada benefício ---------------- */
const s = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
/**
 * Uma frase curta, na língua da situação, para a prévia e o detalhe. `chave` é a da análise (o canal, ou "canal@alvo"): o canal e o alvo vêm da
 * própria entrada quando ela os traz (`ficha-recebidos.js`), e o registro antigo segue lido pela chave.
 */
export function fraseDoBeneficio(chave, a) {
  const canal = a?.canal ?? String(chave).split("@")[0];
  const nome = rotuloDoRecebido(canal, a?.alvo ?? null);
  /* O Dado nomeado diz o dado: "1d8", e nunca "+1". */
  const v = (x) => (canal === "dadosNomeados" && a?.alvo ? `${x > 0 ? "+" : "−"}${Math.abs(x)}${a.alvo}` : s(x));
  const entreSi = a?.familia === "estilo" ? "Estilo e Feitiços não somam entre si" : "Feitiços não somam entre si";
  switch (a?.status) {
    case "soma": return { tom: "ok", texto: `Vale ${v(a.valor)} de ${nome}.` };
    case "presumido": return { tom: "atencao", texto: `Soma ${v(a.valor)} de ${nome} por escolha sua. A regra de acúmulo desta origem não é conhecida.` };
    case "excede": return { tom: "ok", texto: `Vale ${v(a.delta)} de ${nome}: a sua própria já dá ${v(a.proprio)}, e só o que passa dela soma.` };
    case "coberto": return { tom: "neutro", texto: canal === "dadosNomeados" ? `Não soma em ${nome}: a sua própria aura do mesmo tipo já vale igual ou mais.` : `Não soma em ${nome}: o mesmo efeito da sua ficha já dá ${v(a.proprio)}.` };
    case "repete": return { tom: "neutro", texto: `Não soma em ${nome}: repete ${a.vencedor.nome}, que dá ${v(a.vencedor.valor)}.` };
    case "naoSoma": return { tom: "neutro", texto: a.vencedor ? `Não soma em ${nome}: ${a.vencedor.nome} dá ${v(a.vencedor.valor)}, e ${entreSi}.` : `Não soma em ${nome}.` };
    case "empata": return { tom: "neutro", texto: `Empata com ${a.vencedor.nome} (${v(a.vencedor.valor)}): ${nome} recebe ${v(a.valor)} uma vez só, e continua com ${v(a.valor)} se um dos dois terminar.` };
    case "substitui": return { tom: "ok", texto: canal === "dadosNomeados" ? `Vale ${v(a.valor)} em ${nome}, no lugar de ${a.perdedor.nome}.` : `Vale ${v(a.valor)} de ${nome} no lugar de ${a.perdedor.nome} (${v(a.perdedor.valor)}), ${s(a.delta)} a mais.` };
    case "pendente": return { tom: "atencao", texto: `${v(a.valor)} de ${nome} ainda não entra: a regra de acúmulo desta origem não é conhecida.` };
    case "condicao": return { tom: "neutro", texto: `${v(a.valor)} de ${nome} fica fora da conta agora: ${QUANDOS_PACOTE[a.quando] ?? "Com Condição"}.` };
    default: return null;
  }
}
