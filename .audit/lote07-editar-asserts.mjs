import fs from 'node:fs';
const file = 'asserts/t-invocacoes-mesa.mjs';
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';
s = s.replace('const SES = await import(R + "ficha/ficha-sessao.js");', 'const SES = await import(R + "ficha/ficha-sessao.js");' + nl + 'const { aplicarAddons } = await import(R + "afty-addons.js");' + nl + 'aplicarAddons([]);');
const block = `/* ============================================================ */
/* 14. Hoste: o par ocupa uma vaga nos dois limites (2026-10-03) */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const hoste = ficha();
  hoste.rulesVersion = sistema;
  hoste.core.nivel = 10;
  hoste.habilidades = ["ctr_apogeu", "ctr_hoste_amaldicoada"];
  hoste.escolhasHabilidade = { ctr_apogeu: ["ctr_controle_disperso"] };
  hoste.invocacoes = ["L1", "L2", "L3", "L4", "SOLTA"].map((id) => ({
    ...INV.createBlankInvocacao("segundo"), id, nome: id,
  }));
  hoste.hordas = [
    { ...INV.createBlankHorda(), id: "a", liderId: "L1", hoste: true, parId: "b" },
    { ...INV.createBlankHorda(), id: "b", liderId: "L2", hoste: true, parId: "a" },
    { ...INV.createBlankHorda(), id: "c", liderId: "L3", hoste: true, parId: "d" },
    { ...INV.createBlankHorda(), id: "d", liderId: "L4", hoste: true, parId: "c" },
  ];
  const mesa = (invocacoes, c = hoste) => deriveAfty(c, { invocacoes });
  const conta = (d) => [d.invocacoes.emCampo, d.hordas.emCampo];
  const parAtivo = { "horda:a": { estado: "ativa" }, "horda:b": { estado: "ativa" } };
  const cheio = mesa(parAtivo);
  t(sistema + ": o par da Hoste conta uma nos dois limites", conta(cheio), [1, 1]);
  t(sistema + ": uma horda isolada conta uma", conta(mesa({ "horda:a": { estado: "ativa" } })), [1, 1]);
  t(sistema + ": a outra isolada tambem conta uma", conta(mesa({ "horda:b": { estado: "ativa" } })), [1, 1]);
  t(sistema + ": o par fora conta zero", conta(mesa({})), [0, 0]);
  t(sistema + ": sair uma do par conserva uma vaga", conta(mesa({ ...parAtivo, "horda:a": { estado: "fora" } })), [1, 1]);
  t(sistema + ": par mais uma invocacao solta conta duas", conta(mesa({ ...parAtivo, SOLTA: { estado: "ativa" } })), [2, 1]);
  t(sistema + ": dois pares contam duas", conta(mesa({ ...parAtivo, "horda:c": { estado: "ativa" }, "horda:d": { estado: "ativa" } })), [2, 2]);
  const semHoste = { ...hoste, hordas: hoste.hordas.map((h) => ({ ...h, hoste: false })) };
  t(sistema + ": hordas comuns continuam contando duas", conta(mesa(parAtivo, semHoste)), [2, 2]);
  const semVolta = { ...hoste, hordas: hoste.hordas.map((h) => h.id === "a" ? { ...h, parId: "c" } : h) };
  t(sistema + ": par sem vinculo reciproco conta separado", conta(mesa(parAtivo, semVolta)), [2, 2]);
  const semMarca = { ...hoste, hordas: hoste.hordas.map((h) => h.id === "a" ? { ...h, hoste: false } : h) };
  t(sistema + ": as duas precisam ter a marca Hoste", conta(mesa(parAtivo, semMarca)), [2, 2]);
  t(sistema + ": sessao antiga emCampo conta o par uma vez", conta(mesa({ "horda:a": { emCampo: true }, "horda:b": { emCampo: true } })), [1, 1]);
  t(sistema + ": horda orfa nao aumenta a conta", conta(mesa({ ...parAtivo, "horda:orfa": { estado: "ativa" } })), [1, 1]);
  t(sistema + ": reordenar a lista nao muda a conta", conta(mesa(parAtivo, { ...hoste, hordas: [...hoste.hordas].reverse() })), [1, 1]);
  const sint = { ...hoste, escolhasHabilidade: { ctr_apogeu: ["ctr_controle_sintonizado"] } };
  const acerto = (d) => d.testes.ataques.find((x) => x.id === "corpo").bonus;
  t(sistema + ": Controle Sintonizado recebe uma pelo Motor", acerto(mesa(parAtivo, sint)) - acerto(mesa({}, sint)), 1);
  t(sistema + ": a fonte continua nomeando Controle Sintonizado",
    JSON.stringify(mesa(parAtivo, sint).testes.ataques.find((x) => x.id === "corpo")).includes("Controle Sintonizado"), true);
  const conc = { ...hoste, habilidades: [...hoste.habilidades, "ctr_concentrar_poder"],
    escolhasHabilidade: { ctr_apogeu: ["ctr_controle_concentrado"] },
    invocacoes: hoste.invocacoes.map((i) => i.id === "L1" ? { ...i, marcadores: { concentrar_poder: true } } : i) };
  const pvLider = (d) => d.invocacoes.lista.find((i) => i.id === "L1").pv;
  const semMarcaConc = { ...conc, invocacoes: hoste.invocacoes };
  const bonusConc = pvLider(deriveAfty(conc)) - pvLider(deriveAfty(semMarcaConc));
  t(sistema + ": Concentrar Poder liga com apenas o par da Hoste", pvLider(mesa(parAtivo, conc)) - pvLider(mesa(parAtivo, semMarcaConc)), bonusConc);
  t(sistema + ": Concentrar Poder desliga com uma solta adicional", pvLider(mesa({ ...parAtivo, SOLTA: { estado: "ativa" } }, conc)) - pvLider(mesa(parAtivo, semMarcaConc)), 0);
}

`;
const anchor = 'console.log(bad.length ?';
if (!s.includes(anchor)) throw Error('Ancora ausente');
s = s.replace(anchor, block.replaceAll('\n', nl) + anchor);
fs.writeFileSync(file, s);
