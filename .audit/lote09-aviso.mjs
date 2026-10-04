import { readFileSync, writeFileSync } from 'node:fs';
const path = 'src/systems/afty/ficha/abas/AbaInvocacoes.jsx';
let texto = readFileSync(path, 'utf8');
const antes = 'className="afty-aviso flex items-center gap-2" role="status"';
if (!texto.includes(antes)) throw new Error('Aviso ausente');
texto = texto.replace(antes, 'className="afty-card p-3 flex items-center gap-2 text-[12px]" style={{ color: "var(--afty-aviso)" }} role="status"');
writeFileSync(path, texto);
