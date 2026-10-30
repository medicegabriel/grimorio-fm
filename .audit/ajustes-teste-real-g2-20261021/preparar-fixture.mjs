import fs from "node:fs";
const origem = JSON.parse(fs.readFileSync(".audit/revisao-codex-fechamento-g2-20261020/fichas.json", "utf8"));
const ficha = structuredClone(origem.fichas.minamoto);
ficha.id = "teste-cabecalho-g2-20261021";
ficha.name = "Teste de Layout G2";
fs.writeFileSync(".audit/ajustes-teste-real-g2-20261021/ficha-sintetica.json", JSON.stringify([ficha], null, 2));
console.log(JSON.stringify({ nome: ficha.name, id: ficha.id, tema: !!ficha.aparencia, sessao: Object.keys(origem.sessoes) }));
