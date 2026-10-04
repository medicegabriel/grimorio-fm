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
const comentario = `/**
 * O descanso devolve os recursos do dono e das outras invocações.
 * A Marionete escolhida é reparada completamente, com as quedas zeradas
 * (autor, 2026-10-03). As demais conservam PV, quedas, retorno e estado.
 * Quem estava em campo continua em campo. Morte permanente não volta.
 */`;
const helper = `/** Marionetes danificadas que podem receber o reparo completo do descanso. */
export function marionetesParaReparo(sessao, derived) {
  const mesa = separaMecha(sessao);
  return (derived?.invocacoes?.lista ?? []).filter((inv) => {
    if ((inv.regras?.familia ?? inv.familia) !== "marionete") return false;
    const e = estadoDaInvocacao(mesa, inv.id);
    return !e.terminal && (e.quedas > 0 || e.pvAtual != null && e.pvAtual < inv.pv
      || e.estado === "quebrada" || e.estado === "recolhida");
  });
}

`;
let path = 'src/systems/afty/ficha/ficha-sessao.js';
let texto = readFileSync(path, 'utf8');
const inicio = texto.indexOf('/**\r\n * O descanso enche as invocações junto do dono.');
const fim = texto.indexOf('function descansaInvocacoes(invocacoes)', inicio);
if (inicio < 0 || fim < 0) throw new Error('Bloco de descanso ausente');
texto = texto.slice(0, inicio) + (helper + comentario + '\n').replace(/\n/g, '\r\n') + texto.slice(fim);
writeFileSync(path, texto);
editar(path, [
 ['function descansaInvocacoes(invocacoes) {\n  const out = {};', 'function descansaInvocacoes(invocacoes, derived, marioneteId) {\n  const marionetes = new Set((derived?.invocacoes?.lista ?? [])\n    .filter((inv) => (inv.regras?.familia ?? inv.familia) === "marionete").map((inv) => inv.id));\n  const out = {};'],
 ['    const terminal = ESTADOS_TERMINAIS.has(estado);\n    out[id] = comBooleanos({', '    const terminal = ESTADOS_TERMINAIS.has(estado);\n    const preservar = marionetes.has(id) && (terminal || id !== marioneteId);\n    const linha = linhaDaInvocacao({ invocacoes }, id);\n    out[id] = comBooleanos({'],
 ['      estado: terminal || estado === "ativa" ? estado : "fora",\n      pvAtual: null, almaAtual: null, pvTempFontes: {}, auxilios: {},\n      retorno: null, quedas: 0, exorcismos: 0, bloqueadaAteFimDaCena: false,', '      estado: preservar || terminal || estado === "ativa" ? estado : "fora",\n      pvAtual: preservar ? linha.pvAtual : null, almaAtual: null, pvTempFontes: {}, auxilios: {},\n      retorno: preservar ? linha.retorno : null, quedas: preservar ? linha.quedas : 0,\n      exorcismos: 0, bloqueadaAteFimDaCena: false,'],
 ['export function descansar(sessao, derived) {\n  if (!derived) return sessao;', 'export function descansar(sessao, derived, { marioneteId = null } = {}) {\n  if (!derived) return sessao;\n  // O Mecha devolve o PV atual às componentes antes de reparar só a escolhida.\n  const mesa = separaMecha(sessao);'],
 ['    // As invocações enchem junto. Era a pendência que segurava o PV delas fora\n    // da sessão: sem descanso, ninguém zerava aqueles números.\n    invocacoes: descansaInvocacoes(sessao.invocacoes),', '    // Só a Marionete escolhida recebe o reparo completo. As outras não enchem.\n    invocacoes: descansaInvocacoes(mesa.invocacoes, derived, marioneteId),'],
]);
editar('src/systems/afty/afty-derive.js', [
 ['  const passivasNoPeBrutas = peMaximoDasPassivas(creature?.feiticos, sistema);', '  // A reserva continua com a Técnica perdida ou fora de campo (autor, 2026-10-03).\n  const passivasNoPeBrutas = peMaximoDasPassivas(creature?.feiticos, sistema);'],
]);
editar('src/systems/afty/ficha/AftyFicha.jsx', [
 ['ChevronLeft, Pencil, AlertTriangle, Moon, ChevronRight', 'ChevronLeft, Pencil, AlertTriangle, ChevronRight'],
 ['import PainelDeRolagens from "./PainelDeRolagens";', 'import BotaoDeDescanso from "./BotaoDeDescanso";\nimport PainelDeRolagens from "./PainelDeRolagens";'],
 [`              <button
                type="button"
                className="afty-botao"
                onClick={() => atualiza((s) => descansar(s, derived))}
                title="Descanso: devolve os recursos e zera a rodada"
                aria-label="Descanso"
              >
                <Moon className="w-4 h-4" />
              </button>`, `              <BotaoDeDescanso
                sessao={sessao}
                derived={derived}
                onDescansar={(marioneteId) => atualiza((s) => descansar(s, derived, { marioneteId }))}
              />`],
]);
editar('src/systems/afty/encontros/PainelDeCombatente.jsx', [
 ['Skull, EyeOff, Moon, Swords', 'Skull, EyeOff, Swords'],
 ['import PainelBloodfeast, { ConjuracaoBloodfeast }', 'import BotaoDeDescanso from "../ficha/BotaoDeDescanso";\nimport PainelBloodfeast, { ConjuracaoBloodfeast }'],
 [`          <button
            type="button"
            className="afty-botao"
            onClick={() => onSessao((s) => descansar(s, derived))}
            title="Recursos cheios, usos zerados e durações limpas"
          >
            <Moon className="w-3.5 h-3.5" /> Descansar
          </button>`, `          <BotaoDeDescanso
            sessao={sessao}
            derived={derived}
            rotulo="Descansar"
            onDescansar={(marioneteId) => onSessao((s) => descansar(s, derived, { marioneteId }))}
          />`],
]);
editar('asserts/t-invocacao-estados.mjs', [
 ['const desc = SES.descansar(varias, { hp: 10, pe: 10 });', 'const desc = SES.descansar(varias, { hp: 10, pe: 10, invocacoes: { lista: [{ id: "d", regras: regras("marionete") }] } }, { marioneteId: "d" });'],
 ['as quedas da Marionete zeram (o botao de descanso devolve tudo)', 'as quedas da Marionete escolhida zeram com o reparo completo'],
]);
console.log('Descanso e reserva confirmada integrados.');
