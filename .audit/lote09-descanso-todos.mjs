import { readFileSync, writeFileSync } from 'node:fs';
const editar = (path, pares) => {
 let texto = readFileSync(path, 'utf8');
 const nl = texto.includes('\r\n') ? '\r\n' : '\n';
 for (const [antes, depois] of pares) {
  const a = antes.replace(/\n/g, nl), d = depois.replace(/\n/g, nl);
  if (!texto.includes(a)) throw new Error('Trecho ausente: ' + path + ': ' + antes);
  texto = texto.replace(a, d);
 }
 writeFileSync(path, texto);
};
editar('src/systems/afty/encontros/AftyEncontro.jsx', [
 ['Copy, Edit3, Moon, AlertTriangle', 'Copy, Edit3, AlertTriangle'],
 ['import PainelDeCombatente from "./PainelDeCombatente";', 'import BotaoDeDescanso from "../ficha/BotaoDeDescanso";\nimport PainelDeCombatente from "./PainelDeCombatente";'],
 [`          <button type="button" className="afty-botao" onClick={acoes.descansarTodos} title="Recursos cheios em todos">
            <Moon className="w-4 h-4" /> Descansar Todos
          </button>`, `          <BotaoDeDescanso
            rotulo="Descansar Todos"
            combatentes={encontro.combatentes.map((c) => ({ ...c, derived: derivado.derivados[c.id] }))}
            onDescansar={acoes.descansarTodos}
          />`],
]);
editar('src/systems/afty/encontros/usar-encontro-afty.js', [
 ['  DESCANSAR_TODOS: (s, { derivados }) => ({', '  DESCANSAR_TODOS: (s, { derivados, marionetes = {} }) => ({'],
 ['sessao: descansar(c.sessao, derivados[c.id])', 'sessao: descansar(c.sessao, derivados[c.id], { marioneteId: marionetes[c.id] })'],
 ['    descansarTodos: () => despachar({ tipo: "DESCANSAR_TODOS", derivados }),', '    descansarTodos: (marionetes = {}) => despachar({ tipo: "DESCANSAR_TODOS", derivados, marionetes }),'],
]);
console.log('Escolha por combatente integrada ao descanso coletivo.');
