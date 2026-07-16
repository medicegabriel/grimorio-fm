/**
 * ============================================================
 * CARACTERÍSTICAS DE ANATOMIA — Feto Amaldiçoado Híbrido
 * ============================================================
 * Catálogo escolhido pela característica "Físico Amaldiçoado"
 * (1 no início + 1 a cada 5 níveis).
 *
 * ⚠️ Os EFEITOS abaixo são texto por ora — a mecânica (RD, ataques,
 * perícias, tamanho, condições…) liga quando esses sistemas existirem.
 * A escolha em si já funciona e fica guardada na ficha.
 * ============================================================
 */

export const ANATOMIAS = [
  { id: "alma_maldita", nome: "Alma Maldita", descricao: "Dano à sua alma é reduzido à metade antes do teste de Integridade; a partir do nível 15, é anulado. Funciona 2×/dia (3 no nv6, 4 no nv12, 5 no nv18)." },
  { id: "anatomia_incompreensivel", nome: "Anatomia Incompreensível", descricao: "25% (1 em 1d4) de ignorar o dano adicional de crítico ou furtivo; 50% (1–2 em 1d4) no nível 15." },
  { id: "arma_natural", nome: "Arma Natural", descricao: "Ataque natural 1d8 (Cortante/Perfurante/Impacto) com Fineza e Enérgica; conta como desarmado. Se o desarmado for maior, aumente-o em 1 nível." },
  { id: "articulacoes_extensas", nome: "Articulações Extensas", descricao: "Alcance dos ataques corpo a corpo +1,5 m." },
  { id: "bracos_extras", nome: "Braços Extras", descricao: "+2 em prestidigitação (e atletismo com 2 mãos livres); par de mãos extra (2 armas de 1 mão ou +1 de 2 mãos; agarrar 2 criaturas)." },
  { id: "capacidade_voo", nome: "Capacidade de Voo", descricao: "Ação livre, 1 PE: converte Deslocamento de Caminhada em Voo por 1 rodada." },
  { id: "carapaca_mutante", nome: "Carapaça Mutante", descricao: "RD contra dano físico igual ao bônus de treinamento; no nível 10, resistência a um tipo de dano físico à escolha (permanente)." },
  { id: "corpo_especializado", nome: "Corpo Especializado", descricao: "Escolha uma perícia: +1d4 nela." },
  { id: "desenvolvimento_exagerado", nome: "Desenvolvimento Exagerado", descricao: "+1 categoria de tamanho; +1 PV por nível." },
  { id: "devorador_energia", nome: "Devorador de Energia", descricao: "Ao passar num TR contra um Feitiço, ganha 1 PE temporário cumulativo." },
  { id: "instinto_sanguinario", nome: "Instinto Sanguinário", descricao: "Soma o bônus de treinamento na Iniciativa; em combate, também na Atenção." },
  { id: "olhos_sombrios", nome: "Olhos Sombrios", descricao: "Visão no Escuro; treinado em Percepção com +2; no nível 12 ignora escuridão Leve e Total." },
  { id: "pernas_extras", nome: "Pernas Extras", descricao: "Deslocamento +4,5 m; ignora terreno difícil no solo." },
  { id: "presenca_nefasta", nome: "Presença Nefasta", descricao: "Criatura hostil que o vê pela 1ª vez faz TR de Vontade vs sua CD; falha = amedrontada 1 rodada, sucesso = abalada 1 rodada." },
  { id: "sangue_toxico", nome: "Sangue Tóxico", descricao: "Ao sofrer dano de ataque corpo a corpo, o atacante perde vida igual ao seu mod. de Constituição." },
];

const BY_ID = Object.fromEntries(ANATOMIAS.map((a) => [a.id, a]));
export const getAnatomia = (id) => BY_ID[id] ?? null;

// Quantas anatomias a criatura tem: 1 no início + 1 a cada 5 níveis.
export const anatomiaTotal = (nd) => 1 + Math.floor((nd ?? 1) / 5);
