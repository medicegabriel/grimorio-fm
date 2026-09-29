import { createElement } from "react";
import {
  TrendingDown, Frown, Skull, Shuffle, Wand2, ZapOff, Wind, Meh, Biohazard, Droplets, HeartCrack,
  Sparkles, Moon, Lock, UserX, Grab, ArrowDownToLine, Spline, Anchor, Turtle, EyeOff, Compass,
  ShieldAlert, Ghost, EarOff, AlertCircle, Crosshair, ShieldOff, Axe, CircleDot,
  Dumbbell, Swords, BookOpen, HeartPulse, Footprints, Hourglass, Layers, Wrench, Sparkle,
} from "lucide-react";

/**
 * ============================================================
 * ÍCONES DA MESA (2026-09-22)
 * ============================================================
 * O autor pediu ícone nas condições e nos grupos de estado depois de ver a aba
 * Buffs cheia de caixas iguais, e recusou a cor de severidade no mesmo dia: a
 * separação entre "o que eu ganhei" e "o que estão fazendo comigo" sai do ÍCONE
 * e do agrupamento, e não da tinta. É também o que todo VTT faz, porque ícone se
 * reconhece a dois metros da mesa e texto não.
 *
 * ⚠ ISTO É TELA, E NÃO REGRA. O ícone não entra no `afty-condicoes.js` de
 * propósito: aquele módulo é lido pelos asserts e pelo derive, e nenhum dos dois
 * deve depender de um pacote de ícones. Aqui é UI pura.
 *
 * ⚠ NOME EXATO DA CONDIÇÃO como chave, com acento e caixa, igual ao
 * `CONDICAO_TEXTOS`. Condição de Addon (ou nome que mude no livro) cai no ícone
 * padrão em vez de sumir, que é a mesma escolha do resto do sistema para
 * conteúdo que o catálogo não conhece.
 * ============================================================
 */
const CONDICAO = {
  // Mentais
  "Abalado": TrendingDown,
  "Amedrontado": Frown,
  "Aterrorizado": Skull,
  "Confuso": Shuffle,
  "Enfeitiçado": Wand2,
  // Físicas
  "Condenado": ZapOff,
  "Engasgando": Wind,
  "Enjoado": Meh,
  "Envenenado": Biohazard,
  "Sangramento": Droplets,
  "Sofrendo": HeartCrack,
  // Incapacitação
  "Atordoado": Sparkles,
  "Inconsciente": Moon,
  "Paralisado": Lock,
  "Indefeso": UserX,
  // Movimento
  "Agarrado": Grab,
  "Caído": ArrowDownToLine,
  "Enredado": Spline,
  "Imóvel": Anchor,
  "Lento": Turtle,
  // Sensoriais
  "Cego": EyeOff,
  "Desorientado": Compass,
  "Desprevenido": ShieldAlert,
  "Invisível": Ghost,
  "Surdo": EarOff,
  "Surpreso": AlertCircle,
  // Vulnerabilidade
  "Exposto": Crosshair,
  "Fragilizado": ShieldOff,
  "Desmembramento": Axe,
};

/**
 * O ícone de uma condição pelo nome, com um padrão para a que não está no mapa.
 *
 * ⚠ É COMPONENTE, e não uma função que DEVOLVE componente: o lint de React
 * (`react-hooks/static-components`) barra escolher um componente durante o
 * render, e `createElement` aqui dentro resolve sem ginástica no chamador.
 */
export function IconeDaCondicao({ nome, className = "w-4 h-4", ...resto }) {
  return createElement(CONDICAO[nome] ?? CircleDot, { className, "aria-hidden": "true", ...resto });
}

/**
 * O ícone do DONO de um estado (a sub-aba: Especialização, Técnica, Aptidões...).
 * Ele mora no cabeçalho do grupo, e não em cada linha: numa lista densa de vinte
 * linhas, um ícone por linha vira um mural e devolve o ruído que a lista veio
 * resolver.
 */
const DONO = {
  lutador: Dumbbell,
  combatente: Swords,
  conjurador: BookOpen,
  suporte: HeartPulse,
  restringido: Footprints,
  tecnica: Sparkle,
  aptidao: Layers,
  interludio: Hourglass,
  outros: Wrench,
};

export function IconeDoDono({ id, className = "w-3.5 h-3.5", ...resto }) {
  return createElement(DONO[id] ?? Wrench, { className, "aria-hidden": "true", ...resto });
}
