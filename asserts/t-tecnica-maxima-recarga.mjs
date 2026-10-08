/* TÉCNICA MÁXIMA: recarga e a ação Usar na sessão (autor, 2026-10-08).

   DA-05: recarga = 6 − piso(BT / 2), mínimo 0. Manual de Técnica: −1 com acesso
   ao Nível 5. DA-08: Usar confere disponibilidade, requisito e PE, gasta o custo
   final e abre a recarga. Shikigami aguarda a dissipação. A recarga desce pelas
   rodadas, não some no fim do combate, aceita ajuste e zera no descanso. A sessão
   é a mesma na Ficha e no Encontro. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* A FÓRMULA (DA-05)                                             */
/* ============================================================ */
t("6 − piso(BT / 2), BT 2 a 10",
  [2, 3, 4, 5, 6, 7, 8, 9, 10].map((bt) => F.recargaDaTecnicaMaxima(bt)), [5, 5, 4, 4, 3, 3, 2, 2, 1]);
t("o canal soma e o piso é 0", [F.recargaDaTecnicaMaxima(4, -1), F.recargaDaTecnicaMaxima(10, -5)], [3, 0]);

for (const sistema of ["afty", "player"]) {
  const ficha = ({ nd = 13, feiticos, talentos = [], invocacoes = [] }) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = nd;
    c.core.origem = { id: "herdado" };
    c.pericias = { feiticaria: "mestre", historia: "treinado" };
    c.aptidoesAmaldicoadas = ["tecnica_maxima"];
    c.talentos = talentos;
    c.feiticos = feiticos;
    c.invocacoes = invocacoes;
    return c;
  };
  const tm = (extra = {}) => ({ ...F.createBlankFeitico(), id: "tm", nome: "TM", nivel: "max", regraTecnicaMaxima: "oficial", ...extra });
  const linhaDe = (d) => d.feiticos.lista.find((l) => l.id === "tm");

  /* ============================================================ */
  /* O TOTAL NA LINHA DA FICHA                                     */
  /* ============================================================ */
  const d13 = deriveAfty(ficha({ feiticos: [tm()] }));
  const bt13 = d13.maestria;
  t(`${sistema}: a recarga sai do BT da ficha`, linhaDe(d13).tecnicaMaxima.recarga, 6 - Math.floor(bt13 / 2));
  t(`${sistema}: com as fontes no hover`, linhaDe(d13).tecnicaMaxima.partesRecarga[0].valor, 6 - Math.floor(bt13 / 2));
  const manual = (nd) => deriveAfty(ficha({ nd, feiticos: [tm()], talentos: ["tal_manual_de_tecnica"] }));
  t(`${sistema}: Manual de Técnica não tira nada com acesso 4`,
    linhaDe(manual(13)).tecnicaMaxima.recarga, linhaDe(d13).tecnicaMaxima.recarga);
  const d17 = deriveAfty(ficha({ nd: 17, feiticos: [tm()] }));
  t(`${sistema}: Manual de Técnica tira 1 com acesso 5`,
    linhaDe(manual(17)).tecnicaMaxima.recarga, linhaDe(d17).tecnicaMaxima.recarga - 1);

  /* ============================================================ */
  /* USAR (DA-08)                                                  */
  /* ============================================================ */
  const l = linhaDe(d13);
  const total = l.tecnicaMaxima.recarga;
  let s = { ...S.sessaoEmBranco(d13), peAtual: 40 };
  t(`${sistema}: começa disponível`, S.situacaoDaTecnicaMaxima(s, l).disponivel, true);
  s = S.usaTecnicaMaxima(s, l);
  t(`${sistema}: Usar gasta o custo final`, s.peAtual, 40 - l.custoPE);
  t(`${sistema}: Usar abre a recarga`, S.recargaDe(s, "tm").restantes, total);
  t(`${sistema}: em recarga não usa de novo`, [S.situacaoDaTecnicaMaxima(s, l).disponivel, S.usaTecnicaMaxima(s, l) === s], [false, true]);
  t(`${sistema}: o motivo na tela`, S.situacaoDaTecnicaMaxima(s, l).motivo, `Recarga ${total}`);
  let rodando = s;
  for (let i = 1; i < total; i++) rodando = S.proximaRodada(rodando, d13).sessao;
  t(`${sistema}: uma rodada antes de acabar`, S.recargaDe(rodando, "tm").restantes, 1);
  rodando = S.proximaRodada(rodando, d13).sessao;
  t(`${sistema}: some ao zerar e volta a ficar disponível`,
    [S.recargaDe(rodando, "tm"), S.situacaoDaTecnicaMaxima({ ...rodando, peAtual: 40 }, l).disponivel], [null, true]);
  t(`${sistema}: sem PE para a segunda, o motivo é o PE`, S.situacaoDaTecnicaMaxima(rodando, l).motivo, "PE Insuficiente");

  t(`${sistema}: o fim do combate não zera a recarga`,
    S.recargaDe(S.aplicaPatchCombate(s, { ativo: false }), "tm").restantes, total);
  t(`${sistema}: o descanso zera`, S.recargaDe(S.descansar(s, d13), "tm"), null);
  t(`${sistema}: ajuste manual para baixo e para cima`,
    [S.recargaDe(S.ajustaRecarga(s, "tm", -1), "tm").restantes, S.recargaDe(S.ajustaRecarga(s, "tm", 2), "tm").restantes],
    [total - 1, total + 2]);
  t(`${sistema}: a normalização da sessão guarda a recarga`, S.recargaDe(S.normalizaSessao(s, d13), "tm").restantes, total);

  const pobre = { ...S.sessaoEmBranco(d13), peAtual: 3 };
  t(`${sistema}: sem PE não usa`, [S.situacaoDaTecnicaMaxima(pobre, l).motivo, S.usaTecnicaMaxima(pobre, l) === pobre], ["PE Insuficiente", true]);

  const invalida = linhaDe(deriveAfty({ ...ficha({ feiticos: [tm()] }), aptidoesAmaldicoadas: [] }));
  t(`${sistema}: inválida não usa`, S.situacaoDaTecnicaMaxima(s, invalida).motivo, "Indisponível");

  const legacy = deriveAfty({ ...ficha({ feiticos: [{ ...tm(), regraTecnicaMaxima: undefined }] }), aptidoesAmaldicoadas: [] });
  const ll = linhaDe(legacy);
  t(`${sistema}: a LEGACY também recarrega`, S.recargaDe(S.usaTecnicaMaxima({ ...S.sessaoEmBranco(legacy), peAtual: 40 }, ll), "tm").restantes, ll.tecnicaMaxima.recarga);

  /* ============================================================ */
  /* SHIKIGAMI: A RECARGA ESPERA A DISSIPAÇÃO                      */
  /* ============================================================ */
  const inv = { id: "inv_shiki", nome: "Shiki", grau: "especial" };
  const dS = deriveAfty(ficha({ feiticos: [tm({ tipo: "especial", especialSubtipo: "shikigami", shikigamiInvocacaoId: "inv_shiki" })], invocacoes: [inv] }));
  const lS = linhaDe(dS);
  t(`${sistema}: Shikigami aguarda a dissipação`, [lS.tecnicaMaxima.inicioRecarga, lS.tecnicaMaxima.invocacaoId], ["aoDissipar", "inv_shiki"]);
  let sh = S.usaTecnicaMaxima({ ...S.sessaoEmBranco(dS), peAtual: 40 }, lS);
  t(`${sistema}: fica aguardando, sem contar`, [S.recargaDe(sh, "tm").aguardando, S.recargaDe(sh, "tm").restantes], ["dissipar", 0]);
  t(`${sistema}: e não usa de novo enquanto aguarda`, S.situacaoDaTecnicaMaxima(sh, lS).motivo, "Aguarda Dissipar");
  sh = S.proximaRodada(sh, dS).sessao;
  t(`${sistema}: a virada sem o shikigami em campo não solta`, S.recargaDe(sh, "tm").aguardando, "dissipar");
  sh = S.poeInvocacaoEmCampo(sh, "inv_shiki", true, 100);
  sh = S.proximaRodada(sh, dS).sessao;
  t(`${sistema}: com ele em campo continua aguardando`, S.recargaDe(sh, "tm").aguardando, "dissipar");
  sh = S.saiDeCampo(sh, "inv_shiki");
  t(`${sistema}: dissipado, a recarga começa`, [S.recargaDe(sh, "tm").aguardando, S.recargaDe(sh, "tm").restantes], [null, lS.tecnicaMaxima.recarga]);
  const manualmente = S.iniciaRecargaPendente(S.usaTecnicaMaxima({ ...S.sessaoEmBranco(dS), peAtual: 40 }, lS), "tm");
  t(`${sistema}: o botão manual também solta`, S.recargaDe(manualmente, "tm").restantes, lS.tecnicaMaxima.recarga);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
