import {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS, ORIGEM_EFEITOS,
  CLA_EFEITOS, GERAL_EFEITOS, APTIDAO_EFEITOS, LENDARIA_EFEITOS,
  MELHORIA_EFEITOS, APICE_EFEITOS,
} from "./afty-efeitos-conteudo";
import { textoPuro } from "./afty-texto-rico";

// Índice de consulta, não avaliação de regras. As descrições também entram:
// vantagens, efeitos sobre alvos e efeitos ainda não automatizados precisam
// continuar encontráveis. Uma ocorrência não promete bônus numérico próprio.
export const FILTROS_HABILIDADE = [
  { id: "acerto", label: "Acerto", texto: /\bacertos?\b|\bacertar\b|\b(?:jogadas?|rolage(?:m|ns)|testes?) de ataque\b/, canal: /^(?:bonusAcerto|acertoArma|acerto|ataqueAtributo)$/ },
  { id: "dano", label: "Dano", texto: /\bdanos?\b/, canal: /dano|critico/i },
  { id: "defesa", label: "Defesa", texto: /\bdefesa\b/, canal: /^defesa/i },
  { id: "furtividade", label: "Furtividade", texto: /\bfurtividade\b|\bfurtiv[oa]s?\b|\besconder\b/, pericia: "furtividade" },
  { id: "atencao", label: "Atenção", texto: /\batencao\b/, canal: /^atencao/i },
];

const TABELAS = [HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS, ORIGEM_EFEITOS,
  CLA_EFEITOS, GERAL_EFEITOS, APTIDAO_EFEITOS, LENDARIA_EFEITOS, MELHORIA_EFEITOS, APICE_EFEITOS];
const normaliza = (texto) => String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function entradasDoFiltro(item, vistos = new Set()) {
  if (!item || vistos.has(item)) return [];
  vistos.add(item);
  // Catálogo: todas as opções possíveis. Ficha pronta: só as opções escolhidas
  // que conteudoDaFicha já resolveu, sem atribuir à ficha as não escolhidas.
  const opcoes = item.escolha?.opcoes ?? item.opcoes ?? [];
  return [item, ...opcoes.flatMap((opcao) => entradasDoFiltro(opcao, vistos))];
}

export function correspondeFiltroHabilidade(item, efeito = "todos", termo = "") {
  if (efeito === "todos" && !termo.trim()) return true;
  const entradas = entradasDoFiltro(item);
  const texto = normaliza(textoPuro(entradas.map((e) => `${e.nome ?? ""} ${e.descricao ?? e.texto ?? ""}`).join("\n")));
  if (!normaliza(termo).trim().split(/\s+/).every((parte) => texto.includes(parte))) return false;
  if (efeito === "todos") return true;
  const filtro = FILTROS_HABILIDADE.find((f) => f.id === efeito);
  if (!filtro) return false;
  if (filtro.texto.test(texto)) return true;
  // Sem cache por ID: addons podem substituir o conteúdo mantendo o mesmo ID.
  // Também não se avalia `quando`, pois a consulta independe do combate atual.
  const efeitos = entradas.flatMap((e) => [...(e.efeitos ?? []), ...TABELAS.flatMap((t) => t[e.id] ?? [])]);
  return efeitos.some((e) => filtro.canal?.test(e.canal ?? "")
    || (filtro.pericia && e.alvo === filtro.pericia && /pericia/i.test(e.canal ?? "")));
}

export const filtraHabilidades = (lista, efeito = "todos", termo = "") =>
  (lista ?? []).filter((h) => correspondeFiltroHabilidade(h, efeito, termo));

// Filtra ANTES de escolher a aba de nível, para uma busca feita na Base também
// encontrar uma habilidade de nível alto. Mantém a ordem original do livro.
export const filtraGruposDeHabilidade = (grupos, efeito = "todos", termo = "") =>
  grupos.map((g) => ({ ...g, habilidades: filtraHabilidades(g.habilidades, efeito, termo) }))
    .filter((g) => g.habilidades.length > 0);
