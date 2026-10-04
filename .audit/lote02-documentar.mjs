import { readFileSync, writeFileSync, appendFileSync, copyFileSync } from "node:fs";
const gravar = (p, anterior, novo) => {
  if (readFileSync(p, "utf8") !== anterior) throw new Error(`Arquivo mudou durante a edição: ${p}`);
  writeFileSync(p, novo);
};
const filaPath = "docs/a-fazer.md";
const filaAntes = readFileSync(filaPath, "utf8");
copyFileSync(filaPath, ".audit/lote02-base/a-fazer.md");
let fila = filaAntes;
for (const titulo of ["Os 64px de margem morta do cabeçalho do criador, agora sem bloqueio", "O Atributo da Técnica estoura a largura em 390px", "A aba Habilidades do criador vaza 28px em 390px", "Dois campos de expressão aprovam nome de variável que não existe"]) {
  const cabecalho = `### ${titulo}`;
  if (fila.split(cabecalho).length !== 2) throw new Error(`Entrada ausente ou repetida: ${titulo}`);
  const inicio = fila.indexOf(cabecalho);
  const fimLinha = fila.indexOf("\n", inicio);
  const seguinte = /^#{1,6} /m.exec(fila.slice(fimLinha + 1));
  const fim = seguinte ? fimLinha + 1 + seguinte.index : fila.length;
  fila = fila.slice(0, inicio) + fila.slice(fim);
}
gravar(filaPath, filaAntes, fila);
const incluir = (p, ancora, texto, copia) => {
  const antes = readFileSync(p, "utf8");
  if (antes.split(ancora).length !== 2) throw new Error(`Âncora ausente ou repetida: ${p}`);
  copyFileSync(p, `.audit/lote02-base/${copia}`);
  const eol = antes.includes("\r\n") ? "\r\n" : "\n";
  gravar(p, antes, antes.replace(ancora, ancora + eol + eol + texto.replaceAll("\n", eol)));
};
incluir("docs/automacao-dsl.md", "hora, com o motivo escrito embaixo.",
  "O criador compartilha `useDslConhecidas` entre `TecnicaMotorEditor`, `MotorEfeitosEditor` e\n`ExprField`. Expressão e condição usam os nomes do mesmo vocabulário mostrado no seletor.\nChamadas como `contar(\"eco\")` ficam fora do conjunto de variáveis. Na Habilidade Única, o\ncontexto do item complementa o da criatura. Nos modificadores de Ação e Característica,\n`vocabularioInvocacao` preserva o namespace da invocação, inclusive seus atributos, grau,\ntipo e marcadores, além de `nd` e `bt` do dono e das constantes `sempre` e `nunca`.", "automacao-dsl.md");
incluir("docs/afty-equipamentos.md", "Equipado**.",
  "O `MotorEfeitosEditor` valida também os nomes das variáveis pelo vocabulário do seletor.\nEsse vocabulário junta o contexto final da criatura ao do item, então `grau` continua sendo\no grau da própria Ferramenta. Um nome desconhecido deixa o campo vermelho e mostra o motivo.", "afty-equipamentos.md");
incluir("docs/afty-invocacoes.md", "distinguir os dois sem ambiguidade. Zero edição em `src/components/`.",
  "   Os campos de Modificador de Ação e Característica conferem sintaxe e nomes pelo\n   `vocabularioInvocacao` do contexto daquela invocação. Um nome exclusivo da criatura ou\n   digitado errado fica vermelho, enquanto atributos, grau, tipo, marcadores, `nd` e `bt`\n   do dono e as constantes `sempre` e `nunca` continuam válidos.", "afty-invocacoes.md");
const statusPath = "docs/afty-status.md";
const statusAtual = readFileSync(statusPath, "utf8");
copyFileSync(statusPath, ".audit/lote02-base/afty-status.md");
const eol = statusAtual.includes("\r\n") ? "\r\n" : "\n";
const sessao = "\n\n## SESSÃO DE 2026-10-03: LOTE 02, CRIADOR, FÓRMULA E CABEÇALHO\n\n**Decisões do autor:** opção A para os dois sistemas. No telefone, o Atributo da Técnica desce para baixo do título do Perfil Amaldiçoado, preservando o rótulo inteiro.\n\n**O que mudou:** em `AftyCreatureBuilder.jsx`, `useDslConhecidas` centraliza o conjunto memoizado de nomes dos três editores. `MotorEfeitosEditor` e `ExprField` passam esse conjunto ao validador. `TecnicaMotorEditor` mantém a conferência de expressão e condição. A Habilidade Única usa o contexto da criatura mais o do item, e o Modificador continua no namespace da invocação. `PerfilAmaldicoadoCard` ativa a nova opção `headerEmpilhadoNoTelefone` do `Card`, cujo padrão mantém os outros cartões. O `h1` do criador neutraliza margem, família, tamanho, peso, cor e espaçamento globais com utilidades importantes, incluindo a altura de linha do tamanho escolhido. Quatro entradas resolvidas saíram da fila e os guias de DSL, equipamento e invocação foram atualizados.\n\n**Asserts:** linha de base com 142 arquivos, só `t-invocacoes-motor.mjs` vermelho. `t-criador-namespaces.mjs` novo, 26 asserts nos dois sistemas, cobre nomes inválidos, condições, o grau próprio da Ferramenta e a fronteira do namespace da invocação. A suíte final tem 144 arquivos, incluindo `t-ficha-linhas.mjs` do trabalho paralelo, e mantém somente o mesmo vermelho. `t-ordem-modulos.mjs` passa com 34 asserts. Lint da área Afty limpo e build passando.\n\n**Verificado ao vivo:** servidor próprio em 5174, Chromium sem ocultar barras de rolagem. Nas duas rotas, `forca_errada + 1` deixa vermelho o campo da Habilidade Única, a condição da Técnica e os Modificadores de Ação e Característica. `grau + piso(bt / 2)` volta a mostrar 8 na Ferramenta Especial. A fórmula da invocação com grau, modificador de Força, ND, BT, tipo e constantes mostra +33 nos dois modificadores. Sem erro de página.\n\n**Verificado ao vivo, leiaute:** em /afty e /player, a largura da aba Habilidades cai de 418 para 390 px, e todas as demais abas, inclusive Outros, medem 390 px. Em 1440 px, o card Perfil mantém largura, altura, seletor e alinhamento horizontal. O cabeçalho do criador passa de 229,89 para 128 px em 1440 e de 218 para 150 px em 390, nos dois sistemas. Voltar passa de (18, 66,69) para (18, 15,75) no desktop e permanece em (16, 14) no telefone, inteiro. A redução inclui a correção da tipografia além da margem. Medidas, capturas e roteiros locais em `.audit/lote02-*`.\n\n**Achado e não mexido:** permanece a pergunta de regra do assert `t-invocacoes-motor.mjs`. O build também informa o tamanho do pacote principal. Sem commit ou push.\n";
appendFileSync(statusPath, sessao.replaceAll("\n", eol));
console.log("Quatro entradas retiradas, três guias atualizados e sessão acrescentada ao fim do histórico");
