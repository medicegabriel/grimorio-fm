/* Matriz de novidades, parte concreta: em QUE SUPERFÍCIE cada módulo novo (CL1, CL2, CL3, CX) é importado por JSX.
   Superfícies: clássica (AftyFichaClassica + abas/ + Painel*), G2 (AftyFichaG2 + abas-g2/ + efeitos/), Encontro (encontros/), criador
   (AftyCreatureBuilder + AftyTab*). Só leitura. Um módulo importado por JSX de uma superfície aparece nela. Import indireto por outro
   módulo .js não conta como tela: mostrado à parte como "via .js". */
import fs from "node:fs";
import path from "node:path";

const RAIZ = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const AFTY = path.normalize(`${RAIZ}src/systems/afty/`);
const todos = [];
const anda = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (!/node_modules|asserts/.test(e.name)) anda(p); } else if (/\.(js|jsx)$/.test(e.name)) todos.push(p); } };
anda(AFTY);

const rel = (f) => path.relative(AFTY, f).replace(/\\/g, "/");
const resolve = (de, spec) => {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(de), spec);
  for (const c of [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  return null;
};
const imports = new Map();
for (const f of todos) {
  const t = fs.readFileSync(f, "utf8");
  const alvos = new Set();
  for (const m of t.matchAll(/(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) {
    const r = resolve(f, m[1] || m[2] || m[3]); if (r) alvos.add(r);
  }
  imports.set(f, alvos);
}
const superficie = (f) => {
  const r = rel(f);
  if (/^ficha\/(abas-g2|efeitos)\//.test(r) || r === "ficha/AftyFichaG2.jsx") return "G2";
  if (/^encontros\//.test(r)) return "Encontro";
  if (/^ficha\/(abas\/|Painel|GrupoComSubAbas|ItemDeFicha|AftyFichaClassica|BotaoDeDescanso|ControleExpansao|ControleTecnicaMaxima|ControlesDeArma|GavetaDeCondicoes|CanalPicker|BuscaGlobal)/.test(r)) return "Classica";
  if (/^AftyCreatureBuilder|^AftyTab|^AftyDominioEditor|^ui\//.test(r) && /\.jsx$/.test(r)) return /^ui\//.test(r) ? "ui compartilhada" : "Criador";
  return "outro";
};
const importadoresJsx = (alvo) => {
  const por = {};
  for (const [f, set] of imports) if (set.has(alvo) && /\.jsx$/.test(f)) (por[superficie(f)] ??= []).push(rel(f).split("/").pop());
  return por;
};
const importadoresJs = (alvo) => [...imports].filter(([f, set]) => set.has(alvo) && /\.js$/.test(f)).map(([f]) => rel(f));

/* o G2 enxerga, por import de .jsx do G2, qual conjunto? e a árvore inteira de imports alcançada a partir da Ficha G2 e da clássica */
const alcance = (raiz) => { const vis = new Set(); const pilha = [raiz]; while (pilha.length) { const f = pilha.pop(); if (vis.has(f)) continue; vis.add(f); for (const n of imports.get(f) ?? []) pilha.push(n); } return vis; };
const G2 = alcance(path.normalize(`${AFTY}ficha/AftyFichaG2.jsx`)), CL = alcance(path.normalize(`${AFTY}ficha/AftyFichaClassica.jsx`));
const ENC = alcance(path.normalize(`${AFTY}encontros/PainelDeCombatente.jsx`));

const MODULOS = [
  ["CL1", "ficha/ficha-uso.js"], ["CL1", "ficha/ficha-uso-estado.js"], ["CL1", "ficha/ficha-uso-clientes.js"], ["CL1", "ficha/ficha-acoes.js"], ["CL1", "ficha/ficha-ataque.js"],
  ["CL1", "ficha/ficha-combate-eventos.js"], ["CL1", "ficha/ficha-concentracao.js"], ["CL1", "ficha/ficha-dano-recebido.js"], ["CL1", "ficha/ficha-conteudo-uso.js"],
  ["CL1", "ficha/ficha-conteudo-combate.js"], ["CL1", "ficha/ficha-conteudo-testes.js"], ["CL1", "ficha/ficha-conteudo-acesso.js"],
  ["CL2", "ficha/ficha-vital.js"], ["CL2", "ficha/ficha-morte.js"], ["CL2", "ficha/ficha-alma.js"], ["CL2", "ficha/ficha-dados-vida.js"], ["CL2", "afty-cura.js"], ["CL2", "ui/vital.jsx"],
  ["CL3", "ficha/ficha-votos.js"], ["CL3", "ficha/ficha-votos-regras.js"], ["CL3", "ficha/ficha-dominio-confronto.js"], ["CL3", "ficha/ficha-invocacao-uso.js"],
  ["CL3", "ficha/ficha-barreiras.js"], ["CL3", "ficha/ficha-barreiras-estado.js"], ["CL3", "afty-votos.js"],
  ["CX2", "ficha/ficha-origens.js"], ["CX2", "ficha/PainelOrigens.jsx"], ["CX2", "afty-origens-uso.js"], ["CX2", "afty-origens-feiticos.js"],
  ["CX3", "ficha/PainelConteudo.jsx"], ["CX3", "afty-conteudo-regras.js"], ["CX3", "afty-conteudo-feiticos.js"], ["CX3", "ficha/efeitos/operacoes-uso.js"],
  ["base", "ficha/ficha-sessao.js"], ["base", "ficha/ficha-rolagem.js"], ["base", "ficha/ficha-opcoes-derive.js"],
];
const linhas = [];
for (const [lote, m] of MODULOS) {
  const abs = path.normalize(`${AFTY}${m}`);
  if (!fs.existsSync(abs)) { linhas.push({ lote, modulo: m, existe: false }); continue; }
  linhas.push({ lote, modulo: m, existe: true, jsx: importadoresJsx(abs), viaJs: importadoresJs(abs).slice(0, 6), alcancaG2: G2.has(abs), alcancaClassica: CL.has(abs), alcancaEncontro: ENC.has(abs) });
}
fs.writeFileSync(new URL("./matriz-superficies.json", import.meta.url), JSON.stringify({ geradoEm: new Date().toISOString(), linhas }, null, 2));
const fmt = (o) => Object.entries(o ?? {}).map(([k, v]) => `${k}:${v.length}`).join(" ") || "-";
for (const l of linhas) console.log(`${l.lote.padEnd(4)} ${l.modulo.padEnd(38)} ${l.existe ? `JSX[${fmt(l.jsx)}]  alcance G2:${l.alcancaG2 ? "S" : "n"} Cl:${l.alcancaClassica ? "S" : "n"} Enc:${l.alcancaEncontro ? "S" : "n"}` : "NAO EXISTE"}`);
