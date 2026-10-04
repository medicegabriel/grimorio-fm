import { readFileSync, writeFileSync } from 'node:fs';
const trocar = (arquivo, antes, depois) => {
  const texto = readFileSync(arquivo, 'utf8');
  const nl = texto.includes('\r\n') ? '\r\n' : '\n';
  const a = antes.replace(/\r?\n/g, nl);
  const d = depois.replace(/\r?\n/g, nl);
  if (texto.split(a).length !== 2) throw new Error(`Trecho não único em ${arquivo}: ${antes.slice(0, 60)}`);
  writeFileSync(arquivo, texto.replace(a, d), 'utf8');
};
const conj = 'src/systems/afty/afty-combate-conjurador.js';
trocar(conj,
  '    case "movimento": return { efeitos: efeitoNumerico("movimento", valor, nome), dados: [] };',
  `    case "movimento": return { efeitos: efeitoNumerico("movimento", valor, nome), dados: [] };
    case "alcanceCaC": return {
      efeitos: efeitoNumerico("alcanceArma", valor, nome, "cat:corpo|basico"), dados: [],
    };
    case "alcanceDistancia": return {
      efeitos: efeitoNumerico("alcanceArma", valor, nome, "cat:distancia|cat:arremesso"), dados: [],
    };`);
const cont = 'src/systems/afty/afty-efeitos-conteudo.js';
trocar(cont,
  `  //     aumento de 3 metros no alcance ainda não entra: o canal \`alcanceArma\`
  //     existe desde 2026-09-23, e ligá-lo aqui está em docs/a-fazer.md.`,
  `  //     aumento de 3 metros no alcance usa os mesmos alvos, nos dois sistemas
  //     (autor, 2026-10-03), e só dura enquanto a manobra está ligada.`);
trocar(cont, '  lut_manobras_finalizadoras: [',
  `  lut_manobras_finalizadoras: [
    { canal: "alcanceArma", alvo: "basico|cat:corpo",
      quando: "manobra_finalizadora_circular && empolgacao >= 5",
      expr: "3", duracao: "temporaria" },`);
const per = 'src/systems/afty/afty-pericias.js';
trocar(per, '  /* `extra` é o canal `alcanceArma` da linha (2026-09-23): metros a mais que uma',
  '  /* O canal `alcanceArma` da linha (2026-09-23) traz os metros a mais que uma');
trocar(per, '  const alcanceDe = (alcance, bonusCorpo = 0, extra = 0) => {',
  '  const alcanceDe = (alcance, bonusCorpo = 0, escopos = []) => {');
trocar(per, '    const mais = Math.max(0, Number(extra) || 0);',
  '    const mais = Math.max(0, canal("alcanceArma", escopos));');
trocar(per, `    const br = (n) => String(n).replace(".", ",");
    if (alcance) {`,
  `    const br = (n) => String(n).replace(".", ",");
    const baseCorpo = Math.max(0, Number(ctx.alcanceCorpo) || 0);
    const bonus = Math.max(0, Number(bonusCorpo) || 0);
    const partes = [
      { label: alcance ? "Alcance da Arma" : "Tamanho",
        texto: alcance ? \`\${br(alcance.curto)}m / \${br(alcance.longo)}m\` : \`\${br(baseCorpo)}m\` },
      ...(bonus ? [{ label: "Estendida", valor: bonus, texto: \`+\${br(bonus)}m\` }] : []),
      ...fontesDe("alcanceArma", escopos).map((p) => ({
        ...p, texto: \`\${p.valor >= 0 ? "+" : ""}\${br(p.valor)}m\`,
      })),
      ...(mult > 1 ? [{ label: "Multiplicador de Alcance", texto: \`×\${br(mult)}\` }] : []),
    ];
    if (alcance) {`);
trocar(per, '      return { curto, longo, texto: `${br(curto)}m / ${br(longo)}m` };',
  '      return { curto, longo, texto: `${br(curto)}m / ${br(longo)}m`, partes };');
trocar(per,
  `    const metros = (Math.max(0, Number(ctx.alcanceCorpo) || 0) + Math.max(0, Number(bonusCorpo) || 0) + mais) * mult;
    return metros ? { curto: metros, longo: metros, texto: \`\${br(metros)}m\` } : null;`,
  `    const metros = (baseCorpo + bonus + mais) * mult;
    return metros ? { curto: metros, longo: metros, texto: \`\${br(metros)}m\`, partes } : null;`);
trocar(per, '      alcance: alcanceDe(null, 0, canal("alcanceArma", escoposBasico)),',
  '      alcance: alcanceDe(null, 0, escoposBasico),');
trocar(per, '      alcance: alcanceDe(a.alcance, a.alcanceBonusCorpo, canal("alcanceArma", escopos)), propriedades,',
  '      alcance: alcanceDe(a.alcance, a.alcanceBonusCorpo, escopos), propriedades,');
const acoes = 'src/systems/afty/ficha/abas/AbaAcoes.jsx';
trocar(acoes,
  '        {e.alcance && <span className="afty-rotulo text-[10px] whitespace-nowrap">{e.alcance.texto}</span>}',
  `        {e.alcance && (
          <NumeroComFontes
            valor={e.alcance.texto}
            partes={e.alcance.partes}
            total={e.alcance.texto}
            formatar={false}
            className="afty-rotulo text-[10px] whitespace-nowrap"
            ancora="direita"
          />
        )}`);
const addon = 'addons/maldicao-era-de-ouro.json';
trocar(addon, '  "versao": "2.1.0",', '  "versao": "2.1.1",');
trocar(addon,
  `        "id": "ca_articulacoes_extensas",
        "nome": "Articulações Extensas",
        "descricao": "Suas juntas são mais longas, ou suas garras são estendidas, aumentando a distância com que pode atacar. O alcance dos seus ataques corpo a corpo aumenta em 1,5 metros.",
        "mesa": true`,
  `        "id": "ca_articulacoes_extensas",
        "nome": "Articulações Extensas",
        "descricao": "Suas juntas são mais longas, ou suas garras são estendidas, aumentando a distância com que pode atacar. O alcance dos seus ataques corpo a corpo aumenta em 1,5 metros.",
        "efeitos": [
          { "canal": "alcanceArma", "alvo": "basico|cat:corpo", "expr": "1.5", "nome": "Articulações Extensas" }
        ]`);
trocar(addon, 'As de número fixo (Braços Extras, Olhos Adicionais, Instinto Sanguinário, Olhos Sombrios, Pernas Extras)',
  'As de número fixo (Articulações Extensas, Braços Extras, Olhos Adicionais, Instinto Sanguinário, Olhos Sombrios, Pernas Extras)');
trocar(addon, 'deslocamento de voo e de nado, alcance, usos por dia', 'deslocamento de voo e de nado, usos por dia');
const teste = 'asserts/t-maldicao-era-de-ouro.mjs';
trocar(teste, 't("as nove com numero no Motor",', 't("as dez com numero no Motor",');
trocar(teste, '  ["ca_bracos_extras", "ca_carapaca_mutante", "ca_corpo_especializado", "ca_olhos_adicionais", "ca_instinto_sanguinario",',
  '  ["ca_articulacoes_extensas", "ca_bracos_extras", "ca_carapaca_mutante", "ca_corpo_especializado", "ca_olhos_adicionais", "ca_instinto_sanguinario",');
trocar(teste, 't("as tres que so cobrem um pedaco dizem qual pedaco nao entra (parcial)",',
  `t("as oito de Mesa continuam declaradas", entradas.filter((c) => c.mesa).length, 8);

t("as tres que so cobrem um pedaco dizem qual pedaco nao entra (parcial)",`);
console.log('Alterações do lote aplicadas.');
