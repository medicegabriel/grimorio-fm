import { readFileSync, writeFileSync, copyFileSync, appendFileSync } from 'node:fs';
const alterar = (arquivo, f) => {
 const antes = readFileSync(arquivo, 'utf8');
 copyFileSync(arquivo, `.audit/lote04-base/${arquivo.split('/').at(-1)}`);
 const depois = f(antes);
 if (depois === antes) throw new Error(`Sem alteração em ${arquivo}`);
 writeFileSync(arquivo, depois, 'utf8');
};
const substituir = (texto, antes, depois) => {
 if (texto.split(antes).length !== 2) throw new Error(`Trecho não único: ${antes.slice(0, 60)}`);
 return texto.replace(antes, depois);
};
alterar('docs/a-fazer.md', texto => {
 const nl = texto.includes('\r\n') ? '\r\n' : '\n';
 const retirar = titulo => {
  const inicio = texto.indexOf(`### ${titulo}${nl}`);
  if (inicio < 0) throw new Error(`Entrada ausente: ${titulo}`);
  const fim = texto.indexOf(`${nl}### `, inicio + 4);
  if (fim < 0) throw new Error(`Fim ausente: ${titulo}`);
  texto = texto.slice(0, inicio) + texto.slice(fim + nl.length);
 };
 retirar('O Alcance do Auxiliar liga e não soma nada');
 retirar('O Ataque Circular do Lutador pode ganhar os 3 metros de alcance');
 const inicio = texto.indexOf('### Maldição - Era de Ouro:');
 const fim = texto.indexOf(`${nl}### `, inicio);
 const antes = texto.slice(inicio, fim);
 let depois = antes.replace(/^1\. \*\*Articulações Extensas\*\*[^\r\n]*\r?\n/m, '');
 depois = substituir(depois, '9 têm número no Motor e 9 se declaram `mesa`', '10 têm número no Motor e 8 se declaram `mesa`');
 depois = depois.replace(/^([2-7])\. /gm, (_, n) => `${Number(n) - 1}. `);
 depois = depois.replace(/^\*\*Nota:\*\*[^\r\n]*$/m,
  '**Nota:** o contador de usos existe desde 2026-09-24 (campo `usos`, com a linha na Ficha e o Descansar zerando, ver `docs/automacao-dsl.md`) e aceita Característica de Origem desde 2026-09-28. Alma Maldita (item 3) continua aguardando a decisão sobre usos por dia e a redução fracionária de dano na alma. Articulações Extensas foi automatizada na versão 2.1.1 do pacote, em 2026-10-03, e saiu desta fila.');
 texto = substituir(texto, antes, depois);
 texto = substituir(texto, ', e o Alcance do Auxiliar já é descartado pelo tradutor pela mesma falta.', '. O Alcance do Auxiliar usa `alcanceArma` nas linhas de armas e do Ataque Básico desde 2026-10-03, sem alterar o alcance dos Feitiços.');
 return texto;
});
alterar('docs/automacao-dsl.md', texto => {
 const nl = texto.includes('\r\n') ? '\r\n' : '\n';
 const antes = 'Quem lê é o `alcanceDe` do `resolveDano` (`afty-pericias.js`).';
 const depois = `${antes}${nl}${nl}Desde 2026-10-03, por decisão do autor nos dois sistemas, Alcance Corpo a Corpo do Auxiliar,${nl}Ataque Circular (Manobras Finalizadoras do Lutador) e Articulações Extensas (Maldição Era de Ouro)${nl}miram \`basico|cat:corpo\`. Não alteram Feitiços nem o Espaço/Alcance derivado do Tamanho.${nl}O Circular soma 3 m somente com a manobra ligada e Empolgação pelo menos 5. Articulações Extensas${nl}soma 1,5 m permanente. Alcance a Distância do Auxiliar mira \`cat:distancia|cat:arremesso\`.${nl}${nl}O tradutor \`efeitosDaTabelaDoAuxiliar\` em \`afty-combate-conjurador.js\` emite as linhas de alcance${nl}e mantém o pool exclusivo dos Auxiliares. O \`alcanceDe\` já lê o canal no Ataque Básico e agora${nl}devolve \`alcance.partes\`, com base, Estendida, nomes das fontes do Motor (incluindo suplantados)${nl}e multiplicador. A Ficha usa essas partes no hover do alcance, por \`NumeroComFontes\`.`;
 return substituir(texto, antes, depois);
});
alterar('asserts/LEIA.md', texto => {
 const nl = texto.includes('\r\n') ? '\r\n' : '\n';
 const linha = texto.split(nl).find(l => l.startsWith('| `t-maldicao-era-de-ouro` |'));
 return substituir(texto, linha, `${linha}${nl}| \`t-alcance-corpo-a-corpo\` | Auxiliares de alcance, Ataque Circular e Articulações Extensas nos dois sistemas: alvos, liga/desliga, fontes, exclusões, pool e soma antes do Céu. Espaço/Alcance por Tamanho e Feitiços de Toque preservados |`);
});
// Releitura imediatamente antes de acrescentar a seção, preservando o histórico paralelo.
const guia = 'docs/afty-ficha-final.md';
copyFileSync(guia, '.audit/lote04-base/afty-ficha-final.md');
const guiaAtual = readFileSync(guia, 'utf8');
if (guiaAtual.includes('## Alcance nas linhas de Dano (2026-10-03)')) throw new Error('Seção já existe');
appendFileSync(guia, '\n\n## Alcance nas linhas de Dano (2026-10-03)\n\nO alcance de cada arma e do Ataque Básico abre seu painel de fontes pelo hover, toque ou teclado. `alcance.partes` vem do `alcanceDe` em `afty-pericias.js`, e `LinhaDano` em `abas/AbaAcoes.jsx` usa `NumeroComFontes`. O painel mostra a base, Estendida quando houver, cada fonte do Motor e o multiplicador. Auxiliares suplantados continuam visíveis, riscados.\n\nNos dois sistemas, Alcance Corpo a Corpo do Auxiliar, Ataque Circular e Articulações Extensas somam em armas corpo a corpo e Ataque Básico. O Auxiliar de Distância soma nos alcances curto e longo de armas de distância e arremesso. O Circular requer a manobra ligada com Empolgação pelo menos 5. Articulações Extensas soma 1,5 m pela versão 2.1.1 do addon Maldição Era de Ouro. Esses bônus não alteram o Espaço/Alcance do Tamanho nem o alcance de Feitiços.\n', 'utf8');
const status = 'docs/afty-status.md';
const atual = readFileSync(status, 'utf8');
copyFileSync(status, '.audit/lote04-base/afty-status.md');
if (atual.includes('## SESSÃO DE 2026-10-03: LOTE 04, O ALCANCE CORPO A CORPO')) throw new Error('Sessão já existe');
appendFileSync(status, '\n\n## SESSÃO DE 2026-10-03: LOTE 04, O ALCANCE CORPO A CORPO\n\n**Decisões do autor:** opção A nas três perguntas. Alcance Corpo a Corpo do Auxiliar, Ataque Circular e Articulações Extensas seguem a mesma regra: armas corpo a corpo e Ataque Básico, nos dois sistemas. Articulações Extensas não altera o campo Espaço/Alcance por Tamanho. Feitiços ficam fora desses bônus.\n\n**O que mudou:** `efeitosDaTabelaDoAuxiliar`, chamado por `efeitosDeAuxiliarResolvido` em `afty-combate-conjurador.js`, traduz `alcanceCaC` e `alcanceDistancia` para `alcanceArma`, com alvos `cat:corpo|basico` e `cat:distancia|cat:arremesso`. `lut_manobras_finalizadoras` em `afty-efeitos-conteudo.js` emite +3 m temporários com Circular e Empolgação pelo menos 5. `ca_articulacoes_extensas` no addon Maldição Era de Ouro troca Mesa por +1,5 m no Motor, com o nome da característica. O pacote passa de 2.1.0 para 2.1.1, com 10 características no Motor e 8 de Mesa.\n\n**O que mudou, fontes:** o Ataque Básico já lia `alcanceArma`. `alcanceDe` em `afty-pericias.js` passa a devolver as partes do alcance, com nomes das fontes e Auxiliares suplantados. Foi necessário tocar também `ficha/abas/AbaAcoes.jsx`, anunciado ao autor antes, para ligar `NumeroComFontes` nesse valor. Duas entradas saíram da fila, e somente Articulações Extensas saiu da entrada composta da Maldição. Referências atualizadas em `automacao-dsl.md`, `afty-ficha-final.md` e `asserts/LEIA.md`.\n\n**Asserts:** linha de base com 144 arquivos e somente o vermelho conhecido `t-invocacoes-motor.mjs`, na expectativa de custo da Livre. `t-alcance-corpo-a-corpo.mjs` novo, 91 asserts, cobre os dois sistemas, as três fontes, as durações Duradoura e Sustentada dos Auxiliares, liga/desliga, exclusões, nome no hover, pool, combinação e soma antes do dobro do Céu. `t-maldicao-era-de-ouro.mjs` passa com 123. Suíte final com 145 arquivos e somente o mesmo vermelho. `t-combatente-automacoes.mjs` (73), `t-auxiliar-ligado.mjs` (26) e `t-ordem-modulos.mjs` (34) passam. ESLint da área Afty limpo e build passando.\n\n**Verificado ao vivo:** servidor próprio em 5184, Chrome em contexto temporário sem ocultar barras de rolagem, em /afty e /player a 1440 e 390 px. Ficha de Maldição com Articulações Extensas: Ataque Básico e Espada Curta em 3 m, com a fonte no hover. Auxiliares ligados pela aba Buffs levam os dois a 7,5 m, Arco Longo a 39/69 m e Azagaia a 21/33 m. Circular ligado pela aba Buffs leva os dois ataques corpo a corpo a 10,5 m, com as três fontes no painel, e desligá-lo retorna a 7,5 m. Desligar os Auxiliares retorna a 3 m e 30/60 m. A característica aparece na aba Habilidades com o texto do livro. Sem rolagem horizontal, erro de página ou erro de console. Capturas, relatório e roteiro em `.audit/lote04-*`.\n\n**Achado e não mexido:** permanece a pergunta do custo da Livre no assert de Invocações. Os seis itens restantes da Maldição e a exclusão dos alcances no Estímulo de Saída continuam na fila. O build informa o tamanho do pacote principal. Sem commit ou push.\n', 'utf8');
console.log('Documentação do lote atualizada por trechos.');
