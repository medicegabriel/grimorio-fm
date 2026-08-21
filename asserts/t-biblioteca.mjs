import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

/* localStorage de mentira, porque node não tem. Precisa existir ANTES de a
   biblioteca ser importada, senão o módulo carrega sem ele. */
const loja = new Map();
globalThis.localStorage = {
  getItem: (k) => (loja.has(k) ? loja.get(k) : null),
  setItem: (k, v) => { loja.set(k, String(v)); },
  removeItem: (k) => { loja.delete(k); },
  clear: () => loja.clear(),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");           // ver a nota de ordem em t-addons.mjs
const B = await import(R + "afty-addons-biblioteca.js");
await import(R + "afty-habilidades.js");      // registra a família "habilidades"

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const UMA = (extra = {}) => ({
  id: "ciclo_de_adaptacao", nome: "Ciclo de Adaptação", especializacaoId: "lutador",
  tipo: "base", nivel: 1, descricao: "Adapta-se.", requisitos: [], ...extra,
});
const PACOTE = (extra = {}) => ({
  id: "minha-mesa", nome: "Regras da Mesa", versao: "1.0.0",
  acrescenta: { habilidades: [UMA()] }, ...extra,
});

/* ---- vazia ---- */
t("biblioteca comeca vazia", B.lerBiblioteca(), []);

/* ---- instalar ---- */
const r1 = B.instalarPacote(PACOTE());
t("instalou", r1.ok, true);
t("um na biblioteca", B.lerBiblioteca().length, 1);
t("persistiu de verdade", B.lerBiblioteca()[0].nome, "Regras da Mesa");

/* ---- id repetido ---- */
const r2 = B.instalarPacote(PACOTE({ nome: "Clone" }));
t("id repetido e recusado", r2.ok, false);
t("e diz por que", r2.problemas.length > 0, true);
t("biblioteca intacta", B.lerBiblioteca().length, 1);
t("o nome antigo continua la", B.lerBiblioteca()[0].nome, "Regras da Mesa");

/* ---- substituir (atualizar) ---- */
const r3 = B.instalarPacote(PACOTE({ versao: "2.0.0", nome: "Regras da Mesa" }), { substituir: true });
t("substituir aceita o proprio id", r3.ok, true);
t("continua um so", B.lerBiblioteca().length, 1);
t("versao trocou", B.lerBiblioteca()[0].versao, "2.0.0");

/* ---- pacote quebrado nao entra ---- */
const r4 = B.instalarPacote({ id: "outro", nome: "", acrescenta: {} });
t("quebrado e recusado", r4.ok, false);
t("nao entrou", B.lerBiblioteca().length, 1);

/* ---- colar texto ---- */
t("texto vazio reclama", B.instalarDeTexto("   ").ok, false);
t("json invalido reclama", B.instalarDeTexto("{isso nao e json").ok, false);
t("json invalido diz o erro",
  B.instalarDeTexto("{isso nao e json").problemas[0].startsWith("JSON inválido:"), true);
const r5 = B.instalarDeTexto(JSON.stringify(PACOTE({ id: "outra-mesa", nome: "Outra" })));
t("json bom entra", r5.ok, true);
t("dois na biblioteca", B.lerBiblioteca().length, 2);

/* ---- remover ---- */
t("remover tira um", B.removerPacote("outra-mesa").length, 1);
t("remover id que nao existe nao quebra", B.removerPacote("fantasma").length, 1);

/* ---- comparar ficha x biblioteca ---- */
const naFicha = [PACOTE({ versao: "1.0.0" })];
const comp = B.compararComBiblioteca(naFicha);
t("ficha atras da biblioteca e desatualizada", comp[0].estado, "desatualizado");
t("e mostra as duas versoes", [comp[0].versao, comp[0].versaoBiblioteca], ["1.0.0", "2.0.0"]);

const igual = B.compararComBiblioteca([PACOTE({ versao: "2.0.0" })]);
t("mesma versao e igual", igual[0].estado, "igual");

const forasteiro = B.compararComBiblioteca([PACOTE({ id: "de-outra-pessoa", nome: "X" })]);
t("addon que a pessoa nao tem e 'so na ficha'", forasteiro[0].estado, "só na ficha");
t("ficha sem addon devolve lista vazia", B.compararComBiblioteca([]), []);

/* ---- o addon que veio numa ficha de fora consegue ser GUARDADO ---- */
loja.clear();
const DE_FORA = PACOTE({ id: "de-outra-mesa", nome: "De Outra Mesa" });
t("comeca fora da biblioteca",
  B.compararComBiblioteca([DE_FORA])[0].estado, "só na ficha");
t("guardar funciona", B.instalarPacote(DE_FORA, { substituir: true }).ok, true);
t("e depois ele esta igual",
  B.compararComBiblioteca([DE_FORA])[0].estado, "igual");
t("e aparece na biblioteca", B.lerBiblioteca().length, 1);

/* Guardar de novo por cima nao duplica. */
B.instalarPacote(DE_FORA, { substituir: true });
t("guardar duas vezes nao duplica", B.lerBiblioteca().length, 1);

/* O que sai por copia entra de volta por texto: o formato e o mesmo. */
const comoTexto = JSON.stringify(B.lerBiblioteca()[0], null, 2);
loja.clear();
t("o JSON copiado da biblioteca reinstala", B.instalarDeTexto(comoTexto).ok, true);
t("e volta igual", B.lerBiblioteca()[0].id, "de-outra-mesa");
loja.clear();
B.instalarPacote(PACOTE({ versao: "2.0.0" }));

/* ---- biblioteca corrompida nao derruba ---- */
loja.set("fm_addons_afty_v1", "{isso nao e json");
t("json corrompido vira biblioteca vazia", B.lerBiblioteca(), []);
loja.set("fm_addons_afty_v1", JSON.stringify({ nao: "e lista" }));
t("forma errada vira biblioteca vazia", B.lerBiblioteca(), []);
loja.set("fm_addons_afty_v1", JSON.stringify([null, 5, { id: "" }, PACOTE()]));
t("lixo na lista e filtrado", B.lerBiblioteca().length, 1);

/* ---- localStorage indisponivel ---- */
const salvo = globalThis.localStorage;
globalThis.localStorage = {
  getItem: () => { throw new Error("modo privado"); },
  setItem: () => { throw new Error("modo privado"); },
  removeItem: () => { throw new Error("modo privado"); },
};
t("ler sem localStorage devolve vazio", B.lerBiblioteca(), []);
t("gravar sem localStorage devolve false", B.gravarBiblioteca([]), false);
t("instalar sem localStorage nao lanca", B.instalarPacote(PACOTE()).ok, false);
globalThis.localStorage = salvo;

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
