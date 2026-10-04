import fs from 'node:fs';
function trocar(arquivo, antigo, novo) {
  const atual = fs.readFileSync(arquivo, 'utf8');
  const eol = atual.includes('\r\n') ? '\r\n' : '\n';
  const antes = antigo.replace(/\r?\n/g, eol);
  const depois = novo.replace(/\r?\n/g, eol);
  if (atual.split(antes).length !== 2) throw new Error(`Trecho não único em ${arquivo}`);
  fs.writeFileSync(arquivo, atual.replace(antes, depois));
}
trocar('asserts/t-balanceada.mjs',
`t("a Balanceada não acumula", E.getEncantamento("enc_arma_balanceada").naoAcumula, true);`,
`t("a Balanceada não acumula", E.getEncantamento("enc_arma_balanceada").naoAcumula, true);
t("a Canalizadora não acumula", E.getEncantamento("enc_arma_canalizadora").naoAcumula, true);
t("a Otimizada não acumula", E.getEncantamento("enc_arma_otimizada").naoAcumula, true);`);
trocar('asserts/t-balanceada.mjs',
`  /* ============================================================ */
  /* 2. MARCIAL                                                    */`,
`  /* Canalizadora e Otimizada seguem a Balanceada nos dois sistemas
     (autor, 2026-10-03): o bônus do portador entra uma vez só. */
  for (const [id, stat, nome] of [
    ["enc_arma_canalizadora", "cd", "Canalizadora"],
    ["enc_arma_otimizada", "iniciativa", "Otimizada"],
  ]) {
    const sem = deriveAfty(f([arma("arm_espada_curta", []), arma("arm_adaga", [])]));
    const duasEncantadas = deriveAfty(f([
      arma("arm_espada_curta", [id]), arma("arm_adaga", [id]),
    ]));
    t(\`\${tag} duas armas com \${nome}: +2, e não +4\`, duasEncantadas[stat] - sem[stat], 2);
    t(\`\${tag} duas armas com \${nome}: uma fonte no hover\`,
      duasEncantadas.partes[stat].filter((p) => p.label.includes(\`(\${nome})\`)).map((p) => p.valor), [2]);
    const compradaEConcedida = deriveAfty(f([
      arma("arm_espada_curta", [id]), arma("arm_adaga", null),
    ], {
      habilidades: ["cmb_manejo_especial"],
      escolhasHabilidade: { cmb_manejo_especial: [\`me_\${id}\`] },
    }));
    t(\`\${tag} \${nome} comprada e concedida pelo Manejo Especial: +2\`,
      compradaEConcedida[stat] - sem[stat], 2);
  }

  /* ============================================================ */
  /* 2. MARCIAL                                                    */`);
console.log('Casos de regressão dos encantamentos adicionados.');
