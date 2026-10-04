import { readFileSync, writeFileSync } from 'node:fs';
const path = 'asserts/t-fundamento-bloqueio.mjs';
let texto = readFileSync(path, 'utf8');
const marca = '  t(`${sistema}: nenhuma derivação altera a ficha`, JSON.stringify(c), salvo);';
if (!texto.includes(marca)) throw new Error('Marca ausente');
const extra = `  const semPassivas = deriveAfty({ ...c, feiticos: [] }, { invocacoes: {} });
  t(sistema + ": reserva de PE continua fora de campo e com a Técnica perdida",
    [emCampo.pe, perdida.pe], [fora.pe, fora.pe]);
  t(sistema + ": custo da Passiva só no jogador", semPassivas.pe - fora.pe, sistema === "player" ? 2 : 0);
  t(sistema + ": fonte da reserva persiste nos dois bloqueios",
    [fora, perdida].map((d) => d.partes.pe.filter((p) => p.label === "Corpo Rígido (Passiva)").map((p) => p.valor)),
    sistema === "player" ? [[-2], [-2]] : [[], []]);
  t(sistema + ": fontes de PE fecham em todos os estados",
    [criar, emCampo, fora, perdida].map((d) => d.partes.pe.reduce((n, p) => n + (p.valor || 0), 0) === d.pe),
    [true, true, true, true]);
`;
texto = texto.replace(marca, extra.replace(/\n/g, texto.includes('\r\n') ? '\r\n' : '\n') + marca);
writeFileSync(path, texto);
