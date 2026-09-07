/* DANÇARINO DAS LÂMINAS: o Talento de Addon que acumula Ritmo.

   Texto do autor, 2026-09-07:

     *"Para cada ataque acertado você recebe um acúmulo de ritmo que fornece +1
     em Testes de Acerto e Reflexos, até um limite máximo de 6 acúmulos. Com o
     máximo de acúmulos, você pode gastar sua reação para trocar um Teste de
     Resistência qualquer por um TR de Reflexos, ou utilizar sua reação para
     anular completamente a Reação Defensiva de um inimigo. Contudo, errar um
     ataque quebra o seu fluxo de movimento, fazendo com que você perca um
     acúmulo de ritmo por desacelerar."*

   ⚠ O PACOTE NÃO PEDIU VERBO NENHUM. Talento, contador de 0 a 6 e os dois canais
   já existiam, e o addon é DADO puro. A única coisa que o motor ganhou foi o
   `requerTalento` no estado de combate de addon, medido no bloco 4.

   ⚠ AS DUAS REAÇÕES DO MÁXIMO SÃO DE MESA, e o bloco 5 explica por quê. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const { varDoEstado } = await import(R + "afty-combate.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("../addons/dancarino-das-laminas.json", import.meta.url), "utf8"),
);

const ESTADO = "dancarino-das-laminas:ritmo";
const TALENTO = "dancarino-das-laminas:tal_dancarino_das_laminas";

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE ENTRA                                             */
/* ============================================================ */

t("o pacote e valido", AD.validarPacote(PACOTE), []);
t("instala sem problema", AD.aplicarAddons([PACOTE]).problemas, []);
/* ⚠ Ele não pede primitiva nenhuma: tudo que ele usa já existia. */
t("nao pede primitiva", AD.normalizarPacote(PACOTE).permite, []);
t("nao libera nada", AD.normalizarPacote(PACOTE).libera, []);

/* ============================================================ */
/* 2. O NOME DA VARIÁVEL DO DSL                                  */
/* ============================================================ */
/* ⚠ É AQUI QUE UM ADDON MORRE CALADO. As expressões do Talento citam a variável
   pelo nome, e o id do estado ganha o namespace do pacote (`-` e `:`), que o
   tokenizer do DSL não aceita. O `varDoEstado` normaliza, e o JSON tem de
   escrever exatamente o que ele devolve: errar aqui não dá erro, dá zero. */
t("o id do estado vira este identificador",
  varDoEstado(ESTADO), "dancarino_das_laminas_ritmo");
const exprs = PACOTE.acrescenta.talentos[0].efeitos.map((e) => e.expr);
t("e e exatamente o que as duas expressoes escrevem",
  exprs, ["dancarino_das_laminas_ritmo", "dancarino_das_laminas_ritmo"]);

/* ============================================================ */
/* 3. O RITMO NA FICHA                                           */
/* ============================================================ */

const ficha = (ritmo, { ativo = true, comTalento = true } = {}) => {
  const c = createBlankAfty();
  c.core.origem = { id: "herdado" };
  c.core.nd = 10;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 10 }];
  c.addons = [PACOTE];
  if (comTalento) c.talentos = [TALENTO];
  c.combate = { ativo, [ESTADO]: ritmo };
  return c;
};
const acerto = (d) => d.dano.entradas[0]?.acerto;
const reflexos = (d) => {
  const r = d.testes.resistencias.find((x) => (x.id ?? x.value) === "reflexos") ?? {};
  return r.total ?? r.valor ?? r.bonus;
};

/* O contador existe, com a faixa do texto. */
const extraDe = (d) => (d.combate.estadosExtras ?? []).find((e) => e.id === ESTADO);
t("o contador aparece", extraDe(deriveAfty(ficha(0)))?.tipo, "faixa");
t("de 0 a 6, o teto do texto",
  [extraDe(deriveAfty(ficha(0))).min, extraDe(deriveAfty(ficha(0))).max], [0, 6]);

/* +1 por acúmulo nos DOIS testes. A base é Acerto 6 e Reflexos 8. */
t("Acerto por acumulo", [0, 1, 3, 6].map((n) => acerto(deriveAfty(ficha(n)))), [6, 7, 9, 12]);
t("Reflexos por acumulo", [0, 1, 3, 6].map((n) => reflexos(deriveAfty(ficha(n)))), [8, 9, 11, 14]);

/* ⚠ FORA DE COMBATE ZERA, e isso não é escolha deste pacote: o `resolveCombate`
   zera TODO estado quando a bancada está desligada. O Ritmo é acúmulo de luta e
   não podia sobrar na ficha em repouso. */
t("fora de combate o Acerto volta", acerto(deriveAfty(ficha(6, { ativo: false }))), 6);
t("e o Reflexos tambem", reflexos(deriveAfty(ficha(6, { ativo: false }))), 8);

/* O hover diz de onde veio, com o nome que o pacote deu. */
const d6 = deriveAfty(ficha(6));
const parte = (d6.testes.resistencias.find((x) => (x.id ?? x.value) === "reflexos")?.partes ?? [])
  .find((p) => p.label === "Ritmo");
t("o hover do Reflexos nomeia a parcela", parte?.valor, 6);

/* E os dois entram na aba Buffs, porque são `duracao: "temporaria"`. */
const temporarios = (d6.efeitos?.detalhes ?? [])
  .filter((x) => x.duracao === "temporaria" && x.valor)
  .map((x) => `${x.nome}:${x.canal}`);
t("os dois sao temporarios", temporarios, ["Ritmo:bonusAcerto", "Ritmo:bonusTR"]);

/* ============================================================ */
/* 4. O CONTADOR SÓ EXISTE PARA QUEM PEGOU O TALENTO             */
/* ============================================================ */
/* ⚠ O `requerTalento` num estado de ADDON nasceu com este pacote (2026-09-07).
   O catálogo do raw já tinha as três portas de dono, e o extra de addon não as
   carregava: o estado existia pelo simples fato de o PACOTE estar instalado, e o
   Ritmo aparecia no painel de quem não tinha pego o Talento. Um contador que se
   mexe e não muda número nenhum.

   Os outros extras (Habilidade Única de item, imbuição de Estilo) não precisam
   da porta porque a existência do interruptor já depende do item equipado ou da
   Técnica conhecida. O addon não tem esse portão natural. */
const semTalento = deriveAfty(ficha(6, { comTalento: false }));
t("sem o Talento o bonus nao vem", acerto(semTalento), 6);
t("e o Reflexos tambem nao", reflexos(semTalento), 8);
/* O estado declara o dono, e o id sai com o namespace do pacote: é o mesmo id
   que a ficha guarda, senão o portão nunca fecharia. */
t("o estado declara o dono", extraDe(semTalento)?.requerTalento, TALENTO);
t("e ele bate com o id do Talento na ficha", deriveAfty(ficha(6)).talentos.escolhidas, [TALENTO]);

/* Um estado de addon SEM `requerTalento` continua aparecendo para todos, que é
   o padrão certo: quem não declara dono não tem porta. */
const semDono = {
  id: "sem-dono", nome: "Sem Dono", paraRaw: "afty",
  estadosCombate: [{ id: "livre", label: "Livre", tipo: "bool" }],
};
t("estado de addon sem dono e valido", AD.validarPacote(semDono), []);
const soEstado = AD.estadosCombateDeAddon({ addons: [semDono] });
t("e ele nao ganha porta nenhuma", soEstado[0]?.requerTalento, undefined);
t("o id dele ganha o namespace", soEstado[0]?.id, "sem-dono:livre");

/* ============================================================ */
/* 5. O QUE FICOU DE MESA, E POR QUÊ                             */
/* ============================================================ */
/* As duas reações do máximo de acúmulos não têm canal, e não é falta de
   trabalho: é que nenhuma delas é um número da ficha.

   • "trocar um Teste de Resistência qualquer por um TR de Reflexos" é uma
     decisão tomada NO MOMENTO da rolagem, contra um teste que o mestre pediu. A
     ficha mostra os cinco TRs e não sabe qual está sendo rolado.
   • "anular completamente a Reação Defensiva de um inimigo" mexe em OUTRA
     criatura, e a ficha só conhece a si mesma. É a mesma parede que a segunda
     imbuição do Aumento de Defesa do Estilo já tinha encontrado.

   O que dá para trancar é que o texto do livro chegou inteiro, para a mesa poder
   resolver as duas lendo a ficha. */
const talento = PACOTE.acrescenta.talentos[0];
t("o Talento e Geral", talento.grupo, "geral");
t("sem pre-requisito", talento.requisitos, []);
for (const trecho of [
  "acúmulo de ritmo",
  "limite máximo de 6 acúmulos",
  "trocar um Teste de Resistência qualquer por um TR de Reflexos",
  "anular completamente a Reação Defensiva de um inimigo",
  "perca um acúmulo de ritmo",
]) {
  t(`o texto traz "${trecho.slice(0, 28)}"`, talento.descricao.includes(trecho), true);
}

/* ============================================================ */
/* 6. DESINSTALAR NÃO DEIXA RESTO                                */
/* ============================================================ */

AD.limparAddons();
const { getTalento } = await import(R + "afty-talentos.js");
t("o Talento sumiu", getTalento(TALENTO), null);
t("e nenhum estado sobrou", AD.estadosCombateDeAddon({ addons: [] }), []);

/* ============================================================ */

if (bad.length) {
  console.error(`FALHAS (${bad.length}):`);
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
