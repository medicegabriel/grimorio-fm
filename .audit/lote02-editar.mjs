import { readFileSync, writeFileSync } from "node:fs";
const caminho = "src/systems/afty/AftyCreatureBuilder.jsx";
let s = readFileSync(caminho, "utf8");
const trocar = (antes, depois) => {
  if (s.split(antes).length !== 2) throw new Error(`Trecho ambíguo ou ausente: ${antes.slice(0, 70)}`);
  s = s.replace(antes, depois);
};
const inicio = s.indexOf('            {/* ⚠ ESTE `text-lg sm:text-xl` É LETRA MORTA');
const fim = s.indexOf('            <h1 className="text-lg sm:text-xl font-bold truncate min-w-0">', inicio);
if (inicio < 0 || fim < 0) throw new Error("Comentário antigo do cabeçalho ausente");
s = s.slice(0, inicio) + '            {/* O index.css declara estes estilos fora de @layer. As utilidades\n                importantes preservam a tipografia e a margem do criador. */}\n' + s.slice(fim);
trocar('<h1 className="text-lg sm:text-xl font-bold truncate min-w-0">', '<h1 className="my-0! font-sans! text-lg! sm:text-xl! font-bold! text-white! tracking-normal! truncate min-w-0">');
const memo = `  const conhecidas = useMemo(() => {
    if (!dslGrupos.length) return null;
    const nomes = dslGrupos.flatMap((g) => g.itens.map((i) => i.nome));
    return new Set(nomes.filter((n) => !n.includes("(")));
  }, [dslGrupos]);`;
trocar(memo, '  const conhecidas = useDslConhecidas(dslGrupos);');
trocar('const ALVO_OPCOES_BASE = {', `/* Cada editor valida no mesmo namespace do seu seletor. Chamadas como
   contar("eco") não são nomes de variável. Sem vocabulário, mantém a validação
   de sintaxe dos chamadores que ainda não oferecem o seletor. */
function useDslConhecidas(grupos) {
  return useMemo(() => {
    if (!grupos?.length) return null;
    const nomes = grupos.flatMap((g) => g.itens.map((i) => i.nome));
    return new Set(nomes.filter((n) => !n.includes("(")));
  }, [grupos]);
}

const ALVO_OPCOES_BASE = {`);
trocar('      title="Perfil Amaldiçoado"\n      headerRight={', '      title="Perfil Amaldiçoado"\n      headerEmpilhadoNoTelefone\n      headerRight={');
trocar('    [dslContexto, dslExtras, contextoItem, contar],\n  );\n  const bruto', '    [dslContexto, dslExtras, contextoItem, contar],\n  );\n  const conhecidas = useDslConhecidas(dslGrupos);\n  const bruto');
trocar('validateExpression(ef.expr || "");', 'validateExpression(ef.expr || "", conhecidas);');
trocar('  const check = validateExpression(value || "");', '  const conhecidas = useDslConhecidas(grupos);\n  const check = validateExpression(value || "", conhecidas);');
writeFileSync(caminho, s);
const card = "src/systems/afty/ui/primitivos.jsx";
s = readFileSync(card, "utf8");
trocar('export function Card({ title, children, headerRight, recolhido = false }) {', 'export function Card({ title, children, headerRight, recolhido = false, headerEmpilhadoNoTelefone = false }) {');
trocar('<div className={`flex items-center gap-2 px-4 py-3 ${recolhido ? "" : "border-b border-slate-800"}`}>', '<div className={`flex ${headerEmpilhadoNoTelefone ? "flex-col items-start sm:flex-row sm:items-center" : "items-center"} gap-2 px-4 py-3 ${recolhido ? "" : "border-b border-slate-800"}`}>');
trocar('{headerRight && <div className="ml-auto flex-shrink-0">{headerRight}</div>}', '{headerRight && (\n          <div className={headerEmpilhadoNoTelefone ? "w-full min-w-0 sm:w-auto sm:ml-auto sm:flex-shrink-0" : "ml-auto flex-shrink-0"}>\n            {headerRight}\n          </div>\n        )}');
writeFileSync(card, s);
console.log("Criador e Card atualizados");
