/* FONTE EXTERNA EM TODOS OS CONSUMIDORES DA SESSÃO (G2-I1, 2026-10-19).

   A revisão independente registrou um Feitiço recebido (Defesa +7) na prévia do G2: a Defesa foi de 82 para 89, e ao reabrir a MESMA sessão na ficha clássica
   voltou a 82, com o registro intacto em `sessao.buffs`. O G2 traduzia o registro (`prepararCalculo`) e a clássica derivava a sessão direto, sem a tradução.
   A interpretação agora é uma só (`ficha/ficha-recebidos.js`, folha), e a ficha clássica, o G2, o Encontro e os derives de comparação a chamam. Aqui:
     1. o caso do defeito: a clássica e o G2 dão o MESMO derive, e o valor é o da regra (Feitiço, catálogo e Outra Origem);
     2. identidade, acúmulo e disputa: dois aplicadores da mesma origem não acumulam, origens distintas somam, Feitiços não somam entre si, buff antigo segue;
     3. idempotência: reaplicar a tradução sobre o resultado não conta nada em dobro, e a ficha traduzida mantém a identidade (a guarda do derive depende disso);
     4. o delta dos estados e o saldo (aba Buffs da clássica e do G2, painel do Encontro): o registro não é creditado a estado nenhum, e o saldo o enxerga;
     5. o Encontro: o derive do combatente é o da ficha, sem aplicar addons por combatente;
     6. recarga, expiração por rodada e descanso: o registro sobrevive ao que deve e some quando o prazo acaba;
     7. nenhum consumidor novo da sessão deriva `buffsSessao` sem passar pela interpretação. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const loja = new Map();
globalThis.localStorage = {
  getItem: (k) => (loja.has(k) ? loja.get(k) : null),
  setItem: (k, v) => loja.set(k, String(v)),
  removeItem: (k) => loja.delete(k),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const B = await import(R + "ficha/ficha-buffs.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { calcularRecebidos } = await import(R + "ficha/ficha-recebidos.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");
const E = await import(R + "encontros/usar-encontro-afty.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 30, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
ficha.habilidades = ["cmb_assumir_postura", "cmb_espirito_de_luta", "cmb_conhecimento_aplicado", "cmb_ataque_concentrado", "cmb_preparacao_rapida", "cmb_mestre_da_postura", "cmb_golpe_especial"];
ficha.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] };
const d0 = deriveAfty({ ...ficha, combate: { ativo: true } });
const base = { ...S.sessaoEmBranco(d0), combate: { ativo: true, espiritoDeLuta: true, golpeAtroz: true, arteExecucaoSilenciosa: true, ataqueConcentrado: 2 }, rodada: 1 };

/* O derive de cada consumidor, escrito como ele o monta. */
const deriveSessao = (opcoes) => (f, s) => deriveAfty({ ...f, combate: s.combate, buffsSessao: s.buffs }, opcoes(s));
const classica = (f, s) => calcularRecebidos(f, s, deriveSessao(opcoesDeriveDaSessao)).derived; // AftyFichaClassica.jsx
const g2 = (f, s) => prepararCalculo(f, s).derived; // AftyFichaG2.jsx
const encontro = (f, s) => E.derivarCombatente({ ficha: f, sessao: s });

const reg = (id, extra) => ({ id, rec: true, tipoFonte: "feitico", origemId: null, origemNome: `Registro ${id}`, aplicadoPor: null, beneficios: [{ canal: "defesa", valor: 7 }], rodadas: null, ...extra });
const com = (...buffs) => ({ ...base, buffs });
const defesa = (d) => d.defesa;
const defesaBase = defesa(classica(ficha, base));

/* ============================================================ */
/* 1. O CASO DO DEFEITO                                          */
/* ============================================================ */
const feitico = com(reg("f1"));
t("sem registro, a clássica, o G2 e o derive puro são o mesmo número", [defesa(classica(ficha, base)), defesa(g2(ficha, base)), defesa(deriveAfty({ ...ficha, combate: base.combate, buffsSessao: [] }, opcoesDeriveDaSessao(base)))], [defesaBase, defesaBase, defesaBase]);
t("sem registro o derive é idêntico ao puro, campo a campo", JSON.stringify(classica(ficha, base)), JSON.stringify(deriveAfty({ ...ficha, combate: base.combate, buffsSessao: [] }, opcoesDeriveDaSessao(base))));
t("o Feitiço recebido de Defesa +7 soma 7 na clássica", defesa(classica(ficha, feitico)) - defesaBase, 7);
t("e na prévia do G2", defesa(g2(ficha, feitico)) - defesaBase, 7);
t("a MESMA sessão dá o MESMO derive inteiro nas duas apresentações", JSON.stringify(classica(ficha, feitico)), JSON.stringify(g2(ficha, feitico)));
t("o registro continua na sessão, intacto (nada foi apagado ao calcular)", [feitico.buffs.length, feitico.buffs[0].rec, feitico.buffs[0].beneficios[0].valor], [1, true, 7]);
t("o Passivo gerado não vira Feitiço do personagem (o orçamento não mexe)", [classica(ficha, feitico).feiticos?.gastos, classica(ficha, feitico).orcamentoHabilidades?.restante], [classica(ficha, base).feiticos?.gastos, classica(ficha, base).orcamentoHabilidades?.restante]);

/* ============================================================ */
/* 2. IDENTIDADE, ACÚMULO E DISPUTA                              */
/* ============================================================ */
const nas3 = (s) => [defesa(classica(ficha, s)) - defesaBase, defesa(g2(ficha, s)) - defesaBase, defesa(encontro(ficha, s)) - defesa(encontro(ficha, base))];
t("Feitiço recebido: as três apresentações dão +7", nas3(feitico), [7, 7, 7]);
t("dois Feitiços recebidos (+7 e +5) não somam entre si: vale o maior", nas3(com(reg("f1"), reg("f2", { beneficios: [{ canal: "defesa", valor: 5 }] }))), [7, 7, 7]);
t("o mesmo Feitiço de dois aplicadores (+7 e +7) conta uma vez", nas3(com(reg("f1", { aplicadoPor: "Ana" }), reg("f2", { aplicadoPor: "Rui" }))), [7, 7, 7]);

const cat = (id, valor, origemId = "aptidao:aura_do_bastiao", extra = {}) => reg(id, { tipoFonte: "catalogo", origemId, origemNome: "Aura do Bastião", beneficios: [{ canal: "defesa", valor }], ...extra });
t("catálogo: dois aliados com a mesma origem (+2 e +3) valem o maior, e não a soma", nas3(com(cat("c1", 2, undefined, { aplicadoPor: "Ana" }), cat("c2", 3, undefined, { aplicadoPor: "Rui" }))), [3, 3, 3]);
t("catálogo: dois aliados com o MESMO valor contam uma vez", nas3(com(cat("c1", 2), cat("c2", 2))), [2, 2, 2]);
t("catálogo: origens DIFERENTES somam entre si", nas3(com(cat("c1", 3), cat("c2", 1, "aptidao:outra_origem"))), [4, 4, 4]);
const outro = (id, valor, presumir) => reg(id, { tipoFonte: "outro", origemNome: "Mesa", beneficios: [{ canal: "defesa", valor }], somaPresumida: presumir });
t("Outra Origem com a decisão de somar entra", nas3(com(outro("o1", 4, true))), [4, 4, 4]);
t("Outra Origem sem a decisão de somar espera, sem mexer no número", nas3(com(outro("o1", 4, false))), [0, 0, 0]);
t("Feitiço, catálogo e Outra Origem juntos: cada um na sua regra", nas3(com(reg("f1"), cat("c1", 3), outro("o1", 2, true))), [12, 12, 12]);
const antigo = { id: "b1", nome: "Bênção da mesa", canal: "defesa", expr: "2", rodadas: null };
t("buff antigo de mesa (sem registro) continua somando", nas3(com(antigo)), [2, 2, 2]);
t("buff antigo e registro novo juntos: cada um conta uma vez", nas3(com(antigo, reg("f1"))), [9, 9, 9]);
t("registro sem benefício válido não muda nada", nas3(com(reg("f1", { beneficios: [{ canal: "defesa", valor: 0 }, { canal: "", valor: 3 }] }))), [0, 0, 0]);
t("outro canal: Acerto +2 não mexe na Defesa", [nas3(com(reg("f1", { beneficios: [{ canal: "bonusAcerto", valor: 2 }] })))[0], classica(ficha, com(reg("f1", { beneficios: [{ canal: "bonusAcerto", valor: 2 }] }))).ataqueBasico?.acerto ?? null], [0, classica(ficha, com(reg("f1", { beneficios: [{ canal: "bonusAcerto", valor: 2 }] }))).ataqueBasico?.acerto ?? null]);

/* ============================================================ */
/* 3. IDEMPOTÊNCIA E IDENTIDADE                                  */
/* ============================================================ */
const fn = deriveSessao(opcoesDeriveDaSessao);
const r1 = calcularRecebidos(ficha, feitico, fn);
const r2 = calcularRecebidos(ficha, feitico, fn);
t("a ficha traduzida tem a mesma identidade entre chamadas (a guarda do derive acerta)", r1.fichaCalc === r2.fichaCalc, true);
t("a sessão traduzida não tem mais registro (só buffs antigos e gerados)", r1.sessaoCalc.buffs.some((b) => b.rec), false);
t("traduzir de novo o resultado não conta em dobro", defesa(calcularRecebidos(r1.fichaCalc, r1.sessaoCalc, fn).derived), defesa(r1.derived));
t("a ficha já traduzida com a sessão crua (registro ainda lá) não duplica o Passivo", [defesa(calcularRecebidos(r1.fichaCalc, feitico, fn).derived), r1.fichaCalc.feiticos.filter((f) => f.id === "rec_f1").length], [defesa(r1.derived), 1]);
const semReg = calcularRecebidos(ficha, base, fn);
t("sem registro devolve a mesma ficha e a mesma sessão (identidade)", [semReg.fichaCalc === ficha, semReg.sessaoCalc === base], [true, true]);
t("a ficha do usuário não é alterada pela tradução", [ficha.feiticos?.some((f) => String(f.id).startsWith("rec_")) ?? false, Object.isFrozen(ficha)], [false, false]);
const outraFicha = { ...ficha };
t("outra ficha (outra identidade) tem a própria cópia traduzida", calcularRecebidos(outraFicha, feitico, fn).fichaCalc === r1.fichaCalc, false);

/* ============================================================ */
/* 4. DELTA DOS ESTADOS E SALDO                                  */
/* ============================================================ */
const opcoesDe = (s) => ({ ...opcoesDeriveDaSessao(s), buffs: s.buffs });
const semFonte = base;
const comFonte = com(reg("f1"));
const deltaSem = B.deltaDosEstados(ficha, semFonte.combate, opcoesDe(semFonte), classica(ficha, semFonte));
const deltaCom = B.deltaDosEstados(ficha, comFonte.combate, opcoesDe(comFonte), classica(ficha, comFonte));
t("o cenário tem ao menos três estados com efeito (o teste prova alguma coisa)", Object.keys(deltaSem).length >= 3, true);
t("o delta de cada estado ligado é o mesmo com e sem o Feitiço recebido (nenhum estado leva o +7)", JSON.stringify(deltaCom), JSON.stringify(deltaSem));
t("o delta com a tradução do G2 (`prepararCalculo` como `atual`) é o mesmo", JSON.stringify(B.deltaDosEstados(ficha, comFonte.combate, opcoesDe(comFonte), g2(ficha, comFonte))), JSON.stringify(deltaSem));
const catalogoSessao = com(cat("c1", 3, "aptidao:aura_do_bastiao"));
t("com registro de catálogo o delta dos estados também não o credita", JSON.stringify(B.deltaDosEstados(ficha, catalogoSessao.combate, opcoesDe(catalogoSessao), classica(ficha, catalogoSessao))), JSON.stringify(deltaSem));
const saldoSem = B.saldoDoAgora(ficha, semFonte.combate, opcoesDe(semFonte), classica(ficha, semFonte));
const saldoCom = B.saldoDoAgora(ficha, comFonte.combate, opcoesDe(comFonte), classica(ficha, comFonte));
const chaveDefesa = (lista) => lista.find((x) => x.chave === "defesa");
t("o saldo do Agora enxerga o Feitiço recebido (a Defesa sobe 7 a mais que sem ele)", (chaveDefesa(saldoCom)?.valor ?? 0) - (chaveDefesa(saldoSem)?.valor ?? 0), 7);
t("sem o `atual` o saldo e o delta calculam a mesma coisa", [JSON.stringify(B.saldoDoAgora(ficha, comFonte.combate, opcoesDe(comFonte))), JSON.stringify(B.deltaDosEstados(ficha, comFonte.combate, opcoesDe(comFonte)))], [JSON.stringify(saldoCom), JSON.stringify(deltaSem)]);
t("fora de combate o delta segue vazio", B.deltaDosEstados(ficha, { ativo: false }, opcoesDe(comFonte), classica(ficha, comFonte)), {});

/* ============================================================ */
/* 5. O ENCONTRO                                                 */
/* ============================================================ */
const combatente = (s) => ({ ficha, sessao: s });
t("o derive do combatente com registro é o da ficha (Defesa)", defesa(E.derivarCombatente(combatente(comFonte))) - defesa(E.derivarCombatente(combatente(semFonte))), 7);
t("sem registro é o derive de sempre com as opções do combatente", JSON.stringify(E.derivarCombatente(combatente(semFonte))), JSON.stringify(deriveAfty({ ...ficha, combate: semFonte.combate, buffsSessao: [] }, E.opcoesDoCombatente(semFonte))));
t("o cache do combatente acompanha a lista de buffs (registrar muda o número)", defesa(E.derivarComCache({ ficha, sessao: comFonte }, 0)) - defesa(E.derivarComCache({ ficha: { ...ficha }, sessao: semFonte }, 0)), 7);
t("sem ficha ou sem sessão o Encontro continua devolvendo null", [E.derivarCombatente({ ficha: null, sessao: base }), E.derivarCombatente({ ficha, sessao: null })], [null, null]);

/* ============================================================ */
/* 6. RECARGA, EXPIRAÇÃO E DESCANSO                              */
/* ============================================================ */
S.salvarSessao("fonte-compat", comFonte);
const recarregada = S.carregarSessao("fonte-compat", d0);
t("recarregar a sessão preserva o registro", [recarregada.buffs.length, recarregada.buffs[0].rec, recarregada.buffs[0].beneficios], [1, true, [{ canal: "defesa", valor: 7 }]]);
t("e a clássica deriva o +7 da sessão recarregada", defesa(classica(ficha, { ...base, buffs: recarregada.buffs })) - defesaBase, 7);
t("a troca de ficha (outra chave de sessão) não leva o registro", S.carregarSessao("outra-ficha", d0).buffs, []);

const comPrazo = com(reg("p2", { rodadas: 2 }), reg("p1", { rodadas: 1, beneficios: [{ canal: "defesa", valor: 4 }] }));
const virada = (s) => S.proximaRodada(s, classica(ficha, s)).sessao;
const rodada1 = virada(comPrazo);
t("a virada de rodada desce o prazo e encerra o que chegou ao fim", rodada1.buffs.map((b) => [b.id, b.rodadas]), [["p2", 1]]);
t("o registro expirado deixa de contar nas três apresentações", [defesa(classica(ficha, rodada1)) - defesaBase, defesa(g2(ficha, rodada1)) - defesaBase, defesa(encontro(ficha, rodada1)) - defesa(encontro(ficha, base))], [7, 7, 7]);
const rodada2 = virada(rodada1);
t("terminado o último prazo a Defesa volta ao que era", [defesa(classica(ficha, rodada2)), rodada2.buffs.length], [defesaBase, 0]);
const semPrazo = virada(comFonte);
t("registro sem prazo atravessa a virada", [semPrazo.buffs.length, defesa(classica(ficha, semPrazo)) - defesaBase], [1, 7]);
const descansada = S.descansar(com(reg("s1"), reg("p1", { rodadas: 3, beneficios: [{ canal: "defesa", valor: 2 }] })), d0);
t("o descanso mantém o registro sem prazo e encerra o que tinha prazo", descansada.buffs.map((b) => b.id), ["s1"]);

/* ============================================================ */
/* 7. NENHUM CONSUMIDOR NOVO DERIVA A SESSÃO SEM A TRADUÇÃO       */
/* ============================================================ */
/* Quem lê `buffsSessao` direto no derive tem de passar por `calcularRecebidos` (ou `prepararCalculo`, que a chama), ou estar nesta lista com o motivo. */
const PERMITIDOS = {
  "ficha/efeitos/ponte.js": "o derive guardado: é o que `prepararCalculo` recebe como `derivarFn`, e o saldo e o delta da camada dos Efeitos já recebem ficha e buffs traduzidos",
  "afty-efeitos.js": "o motor: lê a lista que a ficha injeta",
  "afty-invocacoes.js": "o motor: lê a lista que a ficha injeta",
};
const raiz = fileURLToPath(new URL("../src/systems/afty/", import.meta.url));
const percorre = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? percorre(p) : /\.(js|jsx)$/.test(n) ? [p] : [];
});
/* Comentário não conta: um arquivo que só CITA a função não a chama. */
const semComentarios = (texto) => texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const infratores = [];
for (const arq of percorre(raiz)) {
  const rel = arq.slice(raiz.length).replaceAll("\\", "/");
  if (rel === "afty-derive.js" || PERMITIDOS[rel]) continue;
  const texto = semComentarios(readFileSync(arq, "utf8"));
  if (/buffsSessao\s*:/.test(texto) && !/\b(calcularRecebidos|prepararCalculo)\s*\(/.test(texto)) infratores.push(rel);
}
t("todo arquivo que monta `buffsSessao` para derivar passa pela interpretação compartilhada", infratores, []);
for (const rel of ["ficha/AftyFichaClassica.jsx", "encontros/usar-encontro-afty.js", "ficha/ficha-buffs.js"]) {
  t(`${rel} chama a interpretação compartilhada (e não só a cita)`, /\bcalcularRecebidos\s*\(/.test(semComentarios(readFileSync(join(raiz, rel), "utf8"))), true);
}
t("a ficha clássica não importa nada visual do G2 para isso", /from\s+"\.\/efeitos\//.test(readFileSync(join(raiz, "ficha/AftyFichaClassica.jsx"), "utf8")), false);
t("o módulo compartilhado é folha (não importa derive, ponte, React nem CSS)", /from\s+"[^"]*(afty-derive|ponte|react|\.css)/.test(readFileSync(join(raiz, "ficha/ficha-recebidos.js"), "utf8")), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
