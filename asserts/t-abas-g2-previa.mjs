/* PRÉVIA DAS TRÊS ABAS DO G2 (2026-10-21): a lógica pura que as abas novas usam.
     1. `prepararRolagem`: disponibilidade POR OPERAÇÃO pelo caminho real do `rolar` (arma de capacidade 1, Errou, Emperrar, Custo de Vida,
        Ainda de Pé), com o motivo lido dos mesmos campos;
     2. Técnica Máxima: Usar e Rolar separados (recarga e PE travam só o Usar);
     3. as travas da linha do Feitiço e a etapa do Ritual;
     4. os pedidos de rolagem, campo por campo, contra o que a aba clássica monta;
     5. o Rápido do G2 (habilidade e equipamento, ordem salva, chave sem destino ignorada);
     6. os destinos novos da busca e as células de Agora na Mesa.
   Esperados escritos aqui, à mão, e não tirados da própria função testada. */
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const loja = new Map();
globalThis.localStorage = { getItem: (k) => (loja.has(k) ? loja.get(k) : null), setItem: (k, v) => loja.set(k, String(v)), removeItem: (k) => loja.delete(k) };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const S = await import(R + "ficha/ficha-sessao.js");
const P = await import(R + "afty-propriedades-armas.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const G = await import(R + "ficha/abas-g2/rolagem-g2.js");
const PED = await import(R + "ficha/abas-g2/rolagens-acoes.js");
const { itensDoRapidoG2 } = await import(R + "ficha/abas-g2/rapido-g2.js");
const { alvosExtrasDaBusca, abreAoChegar } = await import(R + "ficha/abas-g2/busca-g2.js");
const { celulasDaMesa } = await import(R + "ficha/abas-g2/mesa-celulas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => { if (JSON.stringify(real) === JSON.stringify(esp)) ok++; else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`); };

/* ---------- 1. Arma de capacidade 1, Errou, Emperrar ---------- */
const arma = (props) => {
  const c = createBlankAfty(); c.rulesVersion = "player";
  c.core = { ...c.core, nd: 5, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel: 5 }]; c.ataquesProf = { distancia: true, corpo: true };
  c.armasCustom = [{ id: "armc_t", nome: "Arma T", classe: "simples", categoria: "distancia", dano: { dado: "1d10", tipo: "pf" }, critico: 20, custo: 1, grupo: "besta", props }];
  c.equipamentos = { itens: [{ uid: "t1", tipo: "arma", refId: "armc_t", qtd: 1, equipado: true }] };
  return c;
};
const linhaDe = (c, s) => deriveAfty(c, { propriedadesArmas: s.propriedadesArmas }).dano.entradas.find((e) => e.id === "armc_t");
const ctxDe = (c, s) => ({ sessao: s, derived: deriveAfty(c, { propriedadesArmas: s.propriedadesArmas }), modo: "normal" });
const rola = (c, s, pedido, rng) => {
  const prep = G.prepararRolagem(pedido, ctxDe(c, s));
  if (!prep.ok) return { s, r: null };
  const r = prep.pronta.tipo === "dano" ? rolarDano(prep.pronta, rng) : rolarTeste(prep.pronta, rng);
  return { s: P.registraRolagemArma(S.registraRolagem(s, r), prep.pronta, r), r };
};
{
  const c = arma({ recarga: 1, emperrar: true });
  let s = S.sessaoEmBranco(deriveAfty(c));
  const disp = (pedido) => { const prov = G.prepararRolagem(pedido, ctxDe(c, s)); return { ok: prov.ok, motivo: G.motivoDaRecusa(prov, pedido) }; };
  t("capacidade 1: partida com Acerto e Dano livres", [disp(PED.pedidoAcerto(linhaDe(c, s))), disp(PED.pedidoDano(linhaDe(c, s), "normal"))], [{ ok: true, motivo: null }, { ok: true, motivo: null }]);
  s = rola(c, s, PED.pedidoAcerto(linhaDe(c, s)), () => 0.5).s;
  t("o Acerto gastou a última munição", P.estadoDaArma(s.propriedadesArmas, linhaDe(c, s)).gastos, 1);
  t("Dano do disparo pendente: livre", disp(PED.pedidoDano(linhaDe(c, s), "normal")), { ok: true, motivo: null });
  t("novo Acerto: Recarregue a Arma", disp(PED.pedidoAcerto(linhaDe(c, s))), { ok: false, motivo: "Recarregue a Arma" });
  s = rola(c, s, PED.pedidoDano(linhaDe(c, s), "normal"), () => 0.5).s;
  t("depois do Dano, o Dano também recusa", disp(PED.pedidoDano(linhaDe(c, s), "normal")), { ok: false, motivo: "Recarregue a Arma" });
  const fora = P.configuraArmaNaSessao({ ...s, combate: { ativo: false } }, linhaDe(c, s), "recarregar", true);
  t("Recarregar fora de combate devolve o Acerto", G.prepararRolagem(PED.pedidoAcerto(linhaDe(c, fora)), ctxDe(c, fora)).ok, true);
  let p = S.sessaoEmBranco(deriveAfty(c));
  p = rola(c, p, PED.pedidoAcerto(linhaDe(c, p)), () => 0).s;
  const dispP = (pedido) => { const prov = G.prepararRolagem(pedido, ctxDe(c, p)); return G.motivoDaRecusa(prov, pedido); };
  t("pífia com Emperrar: Dano do golpe recusa por Errou", dispP(PED.pedidoDano(linhaDe(c, p), "normal")), "Errou");
  t("pífia com Emperrar: Acerto recusa por Arma Emperrada", dispP(PED.pedidoAcerto(linhaDe(c, p))), "Arma Emperrada");
  const direto = rola(c, S.sessaoEmBranco(deriveAfty(c)), PED.pedidoDano(linhaDe(c, S.sessaoEmBranco(deriveAfty(c))), "normal"), () => 0.5).s;
  t("Dano sem Acerto prévio conta o golpe e gasta a munição", P.estadoDaArma(direto.propriedadesArmas, linhaDe(c, direto)).gastos, 1);
}
{
  const c = arma({ oscilante: true });
  let s = S.sessaoEmBranco(deriveAfty(c));
  s = rola(c, s, PED.pedidoAcerto(linhaDe(c, s)), () => 0.5).s;
  s = P.marcaErroDaArma(s, linhaDe(c, s), true);
  const ped = PED.pedidoDano(linhaDe(c, s), "normal");
  t("Oscilante marcado Errou: só o Dano recusa", [G.motivoDaRecusa(G.prepararRolagem(ped, ctxDe(c, s)), ped), G.prepararRolagem(PED.pedidoAcerto(linhaDe(c, s)), ctxDe(c, s)).ok], ["Errou", true]);
}

/* ---------- Custo de Vida e Ainda de Pé: as outras etapas ---------- */
{
  const custo = { modo: "percentualAtual", percentual: 50, minimo: 1, somaAoDano: true };
  const prova = (hp) => G.prepararRolagem({ tipo: "dano", dados: 2, faces: 6, custoVidaAtivacao: custo }, { sessao: { hpAtual: hp, combate: {}, usos: {} }, derived: { efeitos: [] } });
  t("Custo de Vida com Vida: pronto, paga metade", [prova(40).ok, prova(40).custoVida.pago], [true, 20]);
  t("sem Vida: recusa na etapa da Vida, motivo Vida Insuficiente", [prova(0).etapa, G.motivoDaRecusa(prova(0), {})], ["vida", "Vida Insuficiente"]);
  const ainda = G.prepararRolagem({ tipo: "dano", tom: "cura", fonteCuraId: "cura_ainda_de_pe", dados: 1, faces: 8 }, { sessao: { hpAtual: 10, combate: {}, usos: {} }, derived: { efeitos: [], habilidades: { escolhidas: [] } } });
  t("Ainda de Pé com Vida: recusa na Especialização", [ainda.ok, ainda.etapa, G.motivoDaRecusa(ainda, {})], [false, "especializacao", "Indisponível Agora"]);
}

/* A rerrolagem de cura do usuário entra na etapa da cura (Cura Aperfeiçoada emite `rerrolaCura` 2, sem alvo). */
{
  const c = createBlankAfty(); c.rulesVersion = "player"; c.core.nd = 10;
  c.especializacoes = [{ id: "suporte", nivel: 10 }]; c.habilidades = ["sup_cura_aperfeicoada"];
  const d = deriveAfty(c);
  const prov = G.prepararRolagem({ tipo: "dano", tom: "cura", fonteCuraId: "qualquer", dados: 2, faces: 6 }, { sessao: { hpAtual: 10, combate: {}, usos: {} }, derived: d });
  t("cura do usuário recebe a rerrolagem na etapa da cura", [prov.ok, prov.pronta.rerrola?.ate], [true, 2]);
}

/* ---------- 2. Técnica Máxima: Usar e Rolar separados ---------- */
{
  const c = createBlankAfty(); c.rulesVersion = "player"; c.core.nd = 13; c.core.origem = { id: "herdado" };
  c.pericias = { feiticaria: "mestre" }; c.aptidoesAmaldicoadas = ["tecnica_maxima"];
  c.feiticos = [{ ...F.createBlankFeitico(), id: "tm", nome: "TM", nivel: "max", regraTecnicaMaxima: "oficial" }];
  const d = deriveAfty(c);
  const f = d.feiticos.lista.find((x) => x.id === "tm");
  let s = { ...S.sessaoEmBranco(d), peAtual: 100 };
  const custo = S.situacaoDaTecnicaMaxima(s, f).custo;
  t("TM pronta para Usar", S.situacaoDaTecnicaMaxima(s, f).disponivel, true);
  s = S.usaTecnicaMaxima(s, f);
  const sit = S.situacaoDaTecnicaMaxima(s, f);
  t("Usar pagou e abriu a recarga", [s.peAtual, sit.disponivel, sit.motivo], [100 - custo, false, `Recarga ${f.tecnicaMaxima.recarga}`]);
  const r = f.rolagens[0];
  const pedido = PED.pedidoFeitico(f, r, 0, f.rolagens.length);
  t("a recarga NÃO trava a rolagem do uso pago", [G.travaDoFeitico(f, f, 0), G.prepararRolagem(pedido, { sessao: s, derived: d }).ok], [null, true]);
  const semPe = { ...s, peAtual: 0 };
  t("PE zero: Usar recusa, rolagem segue livre", [S.situacaoDaTecnicaMaxima({ ...semPe, recargas: {} }, f).motivo, G.prepararRolagem(pedido, { sessao: semPe, derived: d }).ok], ["PE Insuficiente", true]);
  t("TM inválida trava a rolagem", G.travaDoFeitico({ ...f, tecnicaMaxima: { ...f.tecnicaMaxima, valida: false } }, f, 0), "Técnica Máxima Inválida");
}

/* ---------- 3. Travas do Feitiço e etapa do Ritual ---------- */
t("Técnica Inata bloqueada vem da base", G.travaDoFeitico({}, { bloqueado: "Fundamento Perdido" }, 0), "Fundamento Perdido");
t("Ritual ativo e não pronto trava", G.travaDoFeitico({ ritual: { ativo: true, podeRolarFeitico: false, etapa: "preparando" } }, {}, 0), "Ritual Preparando");
t("Ritual pronto libera", G.travaDoFeitico({ ritual: { ativo: true, podeRolarFeitico: true, podeResolver: true } }, {}, 0), null);
t("Custo de Vida só trava a primeira rolagem", [G.travaDoFeitico({ custoVidaAtivacao: {}, custoVidaDisponivel: false }, {}, 0), G.travaDoFeitico({ custoVidaAtivacao: {}, custoVidaDisponivel: false }, {}, 1)], ["Vida Insuficiente", null]);
t("etapas do Ritual com as palavras dos controles", ["pronto", "falhou", "preparando", "resolvido"].map((etapa) => G.etapaDoRitual({ ativo: true, etapa, podeResolver: etapa === "pronto" })), ["Pronto", "Falha", "Preparando", "Resolvido"]);
t("Ritual desligado não tem etapa", G.etapaDoRitual({ ativo: false }), null);

/* ---------- 4. Os pedidos, campo por campo, contra a aba clássica ---------- */
{
  const e = { nome: "Katana", acerto: 9, acertoDados: [{ qtd: 1, faces: 6 }], margemCritico: 19, gruposDano: ["g"], rerrola: { ate: 2 } };
  t("pedido do Acerto", PED.pedidoAcerto(e), { tipo: "teste", rotulo: "Katana · Acerto", bonus: 9, dados: [{ qtd: 1, faces: 6 }], margem: 19, linhaArma: e });
  t("pedido do Dano no modo", PED.pedidoDano(e, "critico"), { tipo: "dano", rotulo: "Katana", grupos: ["g"], modoDano: "critico", rerrola: { ate: 2 }, linhaArma: e });
  const f = { id: "f1", nome: "Lança", tipo: "dano", nivelLabel: "Nível 3", custoVidaAtivacao: { x: 1 }, consomeEstado: "e1", ritual: { ativo: true, podeResolver: true } };
  const r0 = { rotulo: "Dano", dados: 3, faces: 8, fixo: 2, tom: "dano", vezes: 1 };
  t("primeira rolagem do Feitiço leva os efeitos da ativação", PED.pedidoFeitico(f, r0, 0, 2), { tipo: "dano", tom: "dano", curaDoUsuario: undefined, rotulo: "Lança", detalhe: "Dano", dados: 3, faces: 8, fixo: 2, explosiva: false, custoVidaAtivacao: { x: 1 }, consomeEstado: "e1", feiticoDanoId: "f1", finalizaRitualId: "f1" });
  t("a segunda não", PED.pedidoFeitico(f, r0, 1, 2), { tipo: "dano", tom: "dano", curaDoUsuario: undefined, rotulo: "Lança", detalhe: "Dano", dados: 3, faces: 8, fixo: 2, explosiva: false, custoVidaAtivacao: null, consomeEstado: null, feiticoDanoId: null, finalizaRitualId: null });
  t("notação do Feitiço", [PED.notacaoDoFeitico({ dados: 3, faces: 6, explosiva: true, fixo: 2 }), PED.notacaoDoFeitico({ dados: 2, faces: 8, fixo: -1 })], ["3d6!+2", "2d8-1"]);
  t("Manobra de dois lados", [PED.pedidoManobra({ nome: "Agarrar", executar: 5, resistir: 3 }), PED.pedidoManobra({ nome: "Agarrar", executar: 5, resistir: 3 }, "resistir")], [{ tipo: "teste", rotulo: "Agarrar · Executar", bonus: 5 }, { tipo: "teste", rotulo: "Agarrar · Resistir", bonus: 3 }]);
  t("Manobra de um lado só", PED.pedidoManobra({ nome: "Teste de Morte", executar: 0, resistir: null }), { tipo: "teste", rotulo: "Teste de Morte", bonus: 0 });
  t("Conflito de Domínio", PED.pedidoConflito({ dados: 1, faces: 10, bonus: 12 }), { tipo: "dano", rotulo: "Conflito de Domínio", dados: 1, faces: 10, fixo: 12 });
  t("teste da aba Perícias", PED.pedidoTeste({ nome: "Atletismo", bonus: 7, dados: undefined, margem: undefined, ataqueId: undefined, minimoNatural: 10 }), { tipo: "teste", rotulo: "Atletismo", bonus: 7, dados: undefined, margem: undefined, ataqueId: undefined, minimoNatural: 10 });
  const cura = { id: "c1", nome: "Energia Reversa", dados: 2, dado: "d8", unidade: { rotulo: "PER", porBloco: 1 }, blocos: 4, fixoBase: 3, pontos: 4 };
  const est = PED.estadoDaCura(cura, 9);
  t("blocos da cura limitados ao teto da linha", est.blocos, 4);
  t("pedido da cura com a unidade da fonte", [PED.pedidoCura(cura, est).detalhe, PED.pedidoCura(cura, est).faces, PED.pedidoCura(cura, est).tom], [`${est.pontos} PER`, 8, "cura"]);
}

/* ---------- 5. O Rápido do G2 ---------- */
{
  const itens = [{ chave: "especializacao:a", nome: "A" }, { chave: "especializacao:b", nome: "B" }];
  const equip = [{ chave: "equipamento:k1", nome: "Katana" }, { chave: "equipamento:k2", nome: "Katana" }];
  const r = itensDoRapidoG2(["equipamento:k2", "chave:sumida", "especializacao:b", "equipamento:k1"], itens, equip);
  t("as duas listas, na ordem salva, sem a chave sem destino", r.map((i) => i.chave), ["equipamento:k2", "especializacao:b", "equipamento:k1"]);
  t("sem favoritos, nada", itensDoRapidoG2(undefined, itens, equip), []);
}

/* ---------- 6. Busca e Agora na Mesa ---------- */
{
  const alvos = alvosExtrasDaBusca({ dominios: { lista: [{ id: "d1", nome: "Jardim", area: "9 metros" }] }, attrEff: { forca: 18 } });
  t("Expansão vira destino em Ações", alvos.find((a) => a.chave === "dominio:d1")?.aba, "acoes");
  t("Força vira destino em Perícias, com o valor", [alvos.find((a) => a.chave === "atributo:forca")?.aba, alvos.find((a) => a.chave === "atributo:forca")?.detalhe], ["pericias", "18"]);
  t("seis Atributos", alvos.filter((a) => a.chave.startsWith("atributo:")).length, 6);
  t("abre ao chegar só Dano, Feitiço e Expansão", ["dano:x", "feitico:x", "dominio:x", "pericia:x", "equipamento:x"].map(abreAoChegar), [true, true, true, false, false]);
  const nos = { adaptacao: 1, bloodfeast: 1, vislumbre: 1, olhinhosLu: 1, olhosAgulha: 1, manipulacaoCeu: 1, armasTransformaveis: 1 };
  const vazia = celulasDaMesa({ derived: {}, sessao: {}, nos });
  t("ficha sem condicional: faixa vazia", vazia, []);
  const golpe = celulasDaMesa({ derived: { golpeEspecial: { disponivel: true } }, sessao: { combate: { ativo: false } }, nos });
  t("Golpe fora de combate", golpe.map((c) => [c.id, c.estado, !!c.corpo]), [["golpe", "Fora de Combate", false]]);
  const vis = celulasDaMesa({ derived: { vislumbre: { tem: true, descoberto: false, fadiga: 1, bloco: { rotulo: "Olhos Cobertos" } } }, sessao: { combate: {} }, nos });
  t("Vislumbre: estado e ação Descobrir", [vis[0].estado, vis[0].acao.rotulo], ["Olhos Cobertos · Fadiga 1/4", "Descobrir"]);
  const blood = celulasDaMesa({ derived: { bloodfeast: { tem: true, ids: ["ciclagem"] } }, sessao: { bloodfeast: { cargas: 2, hardblood: 1, bleed: 0, ultima: { id: "f1", pago: 5, cd: 15, escolhas: {}, rolagens: [] } } }, nos });
  t("Bloodfeast com Ciclagem aberta é pendência", [blood[0].estado, blood[0].pendente?.n], ["Bloodfeast 2 · Hardblood 1 · Bleed 0", 1]);
  t("um corpo sem nó não vira célula", celulasDaMesa({ derived: { vislumbre: { tem: true, bloco: { rotulo: "x" }, fadiga: 0 } }, sessao: {}, nos: {} }), []);
}

/* ---------- 7. Outros em Perícias: a busca do G2 leva `manobra:` a Perícias, e só ela ---------- */
{
  const { alvosDeBusca } = await import(R + "ficha/ficha-conteudo.js");
  const { alvosDaBuscaG2 } = await import(R + "ficha/abas-g2/busca-g2.js");
  const c = createBlankAfty(); c.rulesVersion = "player";
  const d = deriveAfty(c);
  const nomes = (d.testes?.manobras ?? []).map((m) => m.nome);
  const classica = alvosDeBusca(d);
  const g2 = alvosDaBuscaG2(classica, d);
  const manobrasG2 = g2.filter((a) => a.chave.startsWith("manobra:"));
  t("o derive entrega Agarrar, Concentração e Teste de Morte", ["Agarrar", "Concentração", "Teste de Morte"].every((n) => nomes.includes(n)), true);
  t("no G2, cada Manobra do derive é destino em Perícias, com a chave de sempre", manobrasG2.map((a) => [a.nome, a.aba, a.chave.startsWith("manobra:")]), nomes.map((n) => [n, "pericias", true]));
  t("a busca da clássica continua levando Manobras a Ações", [...new Set(classica.filter((a) => a.grupo === "manobra").map((a) => a.aba))], ["acoes"]);
  t("os outros destinos não mudam de aba", g2.slice(0, classica.length).filter((a) => a.grupo !== "manobra").map((a) => a.aba), classica.filter((a) => a.grupo !== "manobra").map((a) => a.aba));
  t("os destinos novos da prévia vêm depois (6 Atributos numa ficha sem Expansão)", g2.length - classica.length, 6);
}

if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
