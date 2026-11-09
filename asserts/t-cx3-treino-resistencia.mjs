// CX3, frente Aptidões e Treinos (Claude). Livro p.346, Treino de Resistência, Bônus de Treinamento Completo:
// "Uma vez por cena, você ignora a primeira falha em testes de morte."
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const M = await import(R + "ficha/ficha-morte.js");
const T = await import(R + "ficha/ficha-conteudo-treino-resistencia.js");
let ok = 0, seq = 0;
const erros = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(n + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
const p = () => ({ opId: "treino-resistencia-" + ++seq });
aplicarAddons([]);

function ficha(sistema, etapas) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 10; c.attrMethod = "fixos";
  c.attributes = { forca: 14, destreza: 12, constituicao: 16, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { constituicao: 2 } }; c.especializacoes = [{ id: "combatente", nivel: 10 }];
  if (etapas) { c.treinamentos = { resistencia: etapas }; c.focosLivres = 10; }
  return c;
}
const nasPortas = (s, d, hp = 10) => S.iniciaTurnoFicha(S.aplicaDano({ ...s, hpAtual: hp }, hp, d), d);

t("falhas do d20", [1, 2, 9, 10, 19, 20].map(T.falhasDoNatural), [2, 1, 1, 0, 0, 0]);

for (const sistema of ["player", "afty"]) {
  const teste = (n, a, b) => t(sistema + " " + n, a, b);
  const com = ficha(sistema, 4), sem = ficha(sistema, 3);
  const d = deriveAfty(com), ds = deriveAfty(sem);
  teste("o Completo só vale com as quatro etapas", [T.temIgnoraFalhaDeMorte(d), T.temIgnoraFalhaDeMorte(ds), T.temIgnoraFalhaDeMorte(deriveAfty(ficha(sistema, 0)))], [true, false, false]);
  const base = S.iniciaCombate(S.sessaoEmBranco(d), d), baseS = S.iniciaCombate(S.sessaoEmBranco(ds), ds);
  const turno = nasPortas(base, d), turnoS = nasPortas(baseS, ds);
  teste("o início do turno abre o teste e não rola", [turno.vital.estado, turno.vital.testePendente, turno.vital.falhas], ["morrendo", true, 0]);

  // Sem o Treino, o cliente é IDÊNTICO ao núcleo para qualquer d20.
  for (const nat of [1, 5, 9, 10, 15, 20]) {
    const a = M.rolaTesteDeMorte(turnoS, ds, { natural: nat }, { opId: "n" + nat }), b = T.rolaTesteDeMorteComTreino(turnoS, ds, { natural: nat }, { opId: "n" + nat });
    teste(`sem o Treino o d20 ${nat} é o do núcleo`, [b.sessao.vital, b.falhas, b.sucessos, b.estado, b.falhaIgnorada ?? null], [a.sessao.vital, a.falhas, a.sucessos, a.estado, null]);
  }

  // Com o Treino: a primeira falha da cena some.
  const r5 = T.rolaTesteDeMorteComTreino(turno, d, { natural: 5 }, p());
  teste("d20 5: a falha é ignorada, nada de sucesso", [r5.aplicado, r5.falhaIgnorada, r5.sessao.vital.falhas, r5.sessao.vital.sucessos, r5.sessao.vital.estado, r5.sessao.vital.testePendente], [true, true, 0, 0, "morrendo", false]);
  teste("o teste fica registrado como ignorado", r5.sessao.vital.ultimoTeste, { natural: 5, falhas: 0, sucessos: 0, rodada: turno.rodada, ignoradas: 1 });
  teste("o uso da cena fica gasto", Object.keys(r5.sessao.usos ?? {}).filter((k) => k.startsWith("cena:")).length, 1);
  const turno2 = S.iniciaTurnoFicha({ ...r5.sessao }, d);
  const r5b = T.rolaTesteDeMorteComTreino(turno2, d, { natural: 5 }, p());
  teste("na mesma cena a segunda falha conta", [r5b.falhaIgnorada ?? null, r5b.sessao.vital.falhas], [null, 1]);
  const r1 = T.rolaTesteDeMorteComTreino(turno, d, { natural: 1 }, p());
  teste("d20 1 causa duas falhas e a primeira é ignorada, a outra fica", [r1.falhaIgnorada, r1.falhas, r1.sessao.vital.falhas, r1.morreu, r1.sessao.vital.estado], [true, 1, 1, false, "morrendo"]);
  const quase = { ...turno, vital: { ...turno.vital, falhas: 2 } };
  const mata1 = T.rolaTesteDeMorteComTreino(quase, d, { natural: 1 }, p());
  teste("d20 1 com duas falhas acumuladas ainda mata, mesmo ignorando a primeira", [mata1.falhaIgnorada, mata1.morreu, mata1.sessao.vital.estado, mata1.sessao.vital.falhas], [true, true, "morto", 3]);
  const salva = T.rolaTesteDeMorteComTreino(quase, d, { natural: 5 }, p());
  teste("d20 5 com duas falhas acumuladas: a ignorada salva a vida", [salva.falhaIgnorada, salva.morreu, salva.sessao.vital.estado, salva.sessao.vital.falhas], [true, false, "morrendo", 2]);

  // O que não é falha não gasta o uso.
  for (const nat of [10, 15, 20]) {
    const r = T.rolaTesteDeMorteComTreino(turno, d, { natural: nat }, p());
    const dos = M.rolaTesteDeMorte(turno, d, { natural: nat }, { opId: "m" + nat });
    teste(`d20 ${nat} não é falha: igual ao núcleo e o uso da cena fica livre`, [r.sessao.vital, r.falhaIgnorada ?? null, Object.keys(r.sessao.usos ?? {}).some((k) => k.startsWith("cena:"))], [dos.sessao.vital, null, false]);
  }
  // Depois de um sucesso, a primeira falha da cena ainda é ignorada.
  const aposSucesso = S.iniciaTurnoFicha(T.rolaTesteDeMorteComTreino(turno, d, { natural: 12 }, p()).sessao, d);
  const falhaDepois = T.rolaTesteDeMorteComTreino(aposSucesso, d, { natural: 4 }, p());
  teste("a primeira FALHA da cena é ignorada mesmo depois de um sucesso", [falhaDepois.falhaIgnorada, falhaDepois.sessao.vital.falhas, falhaDepois.sessao.vital.sucessos], [true, 0, 1]);
  // Uma nova cena devolve o uso.
  const novaCena = S.iniciaCombate({ ...S.aplicaPatchCombate(r5.sessao, { ativo: false }) }, d);
  teste("uma cena nova devolve o uso", T.rolaTesteDeMorteComTreino(S.iniciaTurnoFicha(novaCena, d), d, { natural: 6 }, p()).falhaIgnorada, true);

  // Recusas do núcleo continuam sendo as dele.
  const viva = T.rolaTesteDeMorteComTreino(base, d, { natural: 5 }, p());
  teste("fora das Portas", [viva.aplicado, viva.codigo, viva.sessao === base], [false, "nao-morrendo", true]);
  const caido = S.aplicaDano({ ...base, hpAtual: 10 }, 10, d);
  teste("sem teste pendente", [T.rolaTesteDeMorteComTreino(caido, d, { natural: 5 }, p()).codigo], ["sem-teste-pendente"]);
  teste("forçar rola sem pendência e ainda ignora", T.rolaTesteDeMorteComTreino(caido, d, { natural: 5, forcar: true }, p()).falhaIgnorada, true);
  teste("d20 inválido", T.rolaTesteDeMorteComTreino(turno, d, { natural: 21 }, p()).codigo, "natural-invalido");
  teste("sem identidade", T.rolaTesteDeMorteComTreino(turno, d, { natural: 5 }, {}).codigo, "sem-opid");
  const id = p(), uma = T.rolaTesteDeMorteComTreino(turno, d, { natural: 5 }, id);
  teste("repetir a identidade é inerte", T.rolaTesteDeMorteComTreino(uma.sessao, d, { natural: 5 }, id).repetida, true);

  // O d20 sorteado entra no registro, com a fonte do Treino.
  const sorteada = T.rolaTesteDeMorteComTreino(turno, d, { rng: () => 0.2 }, p());
  teste("o d20 sorteado é registrado com a fonte", [sorteada.natural, sorteada.falhaIgnorada, sorteada.sessao.log.at(-1).rotulo, sorteada.sessao.log.at(-1).fontes], [5, true, "Teste de Morte", [{ label: "Treino de Resistência", texto: "Ignora a Primeira Falha" }]]);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(r5.sessao)), d);
  teste("recarregar conserva o uso da cena", T.rolaTesteDeMorteComTreino(S.iniciaTurnoFicha(lida, d), d, { natural: 5 }, p()).falhaIgnorada ?? null, null);
}

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; } else console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
