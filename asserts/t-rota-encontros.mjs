/* O ENDEREÇO DOS ENCONTROS (`src/systems/afty/encontros/rota-encontros.js`, rework dos Encontros, etapa 1, 2026-11-18).

   A aba de Encontros era só um `useState` do `App.jsx`: o Voltar do navegador saía do app e a recarga caía no Dashboard.
   Agora o caminho diz a rota e a tela, e a pilha de telas do app (etapa E2) grava o caminho. O que este arquivo trava:
     1. a rota sai do PREFIXO e aceita o sufixo `/Encontros` e `/Encontros/<id>`, sem diferença de caixa nem de barra no fim;
     2. caminho que não é do Grimório (a Sala, um endereço qualquer) devolve null, e o `App.jsx` fica como antes;
     3. ida e volta: o caminho montado é lido de volta na mesma tela, com id que tem caractere especial;
     4. a origem guardada da Sala só aceita caminho do Grimório, e só para o mesmo código;
     5. o módulo é FOLHA (zero imports) e o texto dele não tem travessão. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const ARQ = new URL("../src/systems/afty/encontros/rota-encontros.js", import.meta.url);
const R = await import(ARQ.href);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else bad.push(`FALHOU ${nome}\n   real:     ${a}\n   esperado: ${b}`);
};

/* 1. a rota e a tela (a forma é a da pilha de telas do app, etapa E2: `tela` é { name, creatureId, encounterId }) */
const tela = (name, encounterId = null) => ({ name, creatureId: null, encounterId });
t("raiz", R.lerCaminho("/"), { rota: null, tela: tela("dashboard") });
t("vazio vale como raiz", R.lerCaminho(""), { rota: null, tela: tela("dashboard") });
t("/Criatura", R.lerCaminho("/Criatura"), { rota: null, tela: tela("dashboard") });
t("/Jogador", R.lerCaminho("/Jogador"), { rota: "player", tela: tela("dashboard") });
t("/Afty", R.lerCaminho("/Afty"), { rota: "afty", tela: tela("dashboard") });
t("/player/ minúsculo com barra", R.lerCaminho("/player/"), { rota: "player", tela: tela("dashboard") });
t("/EraDeOuro", R.lerCaminho("/EraDeOuro"), { rota: "eradeouro", tela: tela("dashboard") });
t("/Eclesiastes/Encontros", R.lerCaminho("/Eclesiastes/Encontros"), { rota: "eclesiastes", tela: tela("encounters") });
t("/Criatura/Encontros/<id>", R.lerCaminho("/Criatura/Encontros/enc_1"), { rota: null, tela: tela("encounter", "enc_1") });
t("/Encontros no Grimório", R.lerCaminho("/Encontros"), { rota: null, tela: tela("encounters") });
t("/Player/Encontros/", R.lerCaminho("/Player/Encontros/"), { rota: "player", tela: tela("encounters") });
t("/eradeouro/encontros/<id> minúsculo", R.lerCaminho("/eradeouro/encontros/x9"), { rota: "eradeouro", tela: tela("encounter", "x9") });

/* 2. fora do Grimório */
t("a Sala não é rota de Encontro", R.lerCaminho("/Sala/ABCD12"), null);
t("caminho qualquer", R.lerCaminho("/privacidade.html"), null);
t("Encontros com dois níveis", R.lerCaminho("/Encontros/a/b"), null);
t("prefixo desconhecido", R.lerCaminho("/Mestre/Encontros"), null);

/* 3. ida e volta */
t("caminho da raiz", R.caminhoDe(null, tela("dashboard")), "/Criatura");
t("caminho da raiz do /Player", R.caminhoDe("player", tela("dashboard")), "/Jogador");
t("caminho da lista do /", R.caminhoDe(null, tela("encounters")), "/Criatura/Encontros");
t("caminho da lista da Guilda", R.caminhoDe("eradeouro", tela("encounters")), "/EraDeOuro/Encontros");
t("caminho de um Encontro", R.caminhoDe("afty", tela("encounter", "enc_1")), "/Afty/Encontros/enc_1");
t("Encontro sem id vale como início", R.caminhoDe("player", tela("encounter", "")), "/Jogador");
t("tela fora das três (o criador) fica no início da rota", R.caminhoDe("player", { name: "builder", creatureId: "x" }), "/Jogador");
const estranho = "enc 1/ç?#";
t("id com caractere especial volta igual", R.lerCaminho(R.caminhoDe("player", tela("encounter", estranho))), { rota: "player", tela: tela("encounter", estranho) });

/* 4. a origem da Sala (sessionStorage de mentira) */
const guardado = new Map();
globalThis.sessionStorage = { getItem: (k) => (guardado.has(k) ? guardado.get(k) : null), setItem: (k, v) => guardado.set(k, String(v)) };
R.guardarOrigemDaSala("abcd12", "/Player/Encontros/enc_1");
t("origem guardada volta para o mesmo código", R.lerOrigemDaSala("ABCD12"), "/Jogador/Encontros/enc_1");
t("outro código não leva a origem", R.lerOrigemDaSala("ZZZZ99"), null);
R.guardarOrigemDaSala("abcd12", "https://fora.example/x");
t("endereço de fora não é guardado", R.lerOrigemDaSala("ABCD12"), "/Jogador/Encontros/enc_1");
R.guardarOrigemDaSala("abcd12", "/Eclesiastes/Encontros/enc_2");
t("origem da Sala de Eclesiastes", R.lerOrigemDaSala("ABCD12"), "/Eclesiastes/Encontros/enc_2");
R.guardarOrigemDaSala("abcd12", "/");
t("origem da Sala pela Central de Jogo", R.lerOrigemDaSala("ABCD12"), "/");
guardado.set("sala_origem_v1", JSON.stringify({ codigo: "ABCD12", caminho: "//fora.example" }));
t("origem adulterada é recusada", R.lerOrigemDaSala("ABCD12"), null);
guardado.set("sala_origem_v1", "{nao e json");
t("origem ilegível é recusada", R.lerOrigemDaSala("ABCD12"), null);

/* 5. folha e texto */
const fonte = readFileSync(ARQ, "utf8");
t("rota-encontros.js é folha", [...fonte.matchAll(/^import /gm)].length, 0);
t("sem travessão", fonte.includes(String.fromCharCode(0x2014)), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
