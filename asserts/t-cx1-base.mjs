import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const P = await import(R + "afty-propriedades-armas.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
function ficha(sistema, anatomias = [], nivel = 10, classe = "lutador") {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.name = "CX1 isolada";
  c.core = { ...c.core, nd: nivel, tipo: "combatente", patamar: "comum",
    origem: { id: "feto_amaldicoado_hibrido", anatomias } };
  c.especializacoes = [{ id: classe, nivel }];
  if (sistema === "afty" && classe === "lutador") c.habilidades = ["lut_corpo_treinado"];
  c.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 10 };
  return c;
}
const linha = (d, id = "basico") => d.dano.entradas.find(x => x.id === id);
const pericia = (d, id) => d.testes.pericias.find(p => p.id === id);
const porItem = (c, refs) => ({ ...c, equipamentos: { itens: refs.map((refId, i) => ({
  uid: `cx1-item-${i}`, tipo: "item", refId, qtd: 1, equipado: true,
})) } });
const naturais = (n) => () => (n - 1) / 20;

for (const sistema of ["player", "afty"]) {
  for (const categoria of ["defesa", "rd", "atributo", "tr", "pericia", "movimento", "iniciativa", "atencao"]) {
    const tabela = F.getPassivoEfeito(categoria).auxTabela ?? categoria;
    for (let nivel = 0; nivel <= 5; nivel++) {
      const bruto = F.AUX_TABELAS[tabela]?.[nivel]?.sustentada;
      t(`${sistema} ${categoria} ${nivel}: metade com piso ou indisponível`,
        F.calcularFeiticoPassivo({ tipo: "passivo", nivel, categoriaPassivo: categoria }, { sistema }).valor,
        typeof bruto === "number" ? Math.floor(bruto / 2) : null);
    }
  }
  const c = ficha(sistema, [], 20, "conjurador");
  const passiva = { ...F.createBlankFeitico(), nome: "Defesa CX1", tipo: "passivo", nivel: 5, categoriaPassivo: "defesa" };
  const calc = F.calcularFeiticoPassivo(passiva, { sistema });
  c.feiticos = [{ ...passiva, efeitosPassivo: calc.efeitosGerados }];
  const com = deriveAfty(c), sem = deriveAfty({ ...c, feiticos: [] });
  t(`${sistema} Passiva chega à Defesa`, com.defesa - sem.defesa, 3);
  t(`${sistema} custo preserva divergência`, com.pe - sem.pe, sistema === "player" ? -10 : 0);

  const base = ficha(sistema);
  const db = deriveAfty(base);
  const dup = deriveAfty(porItem(base, ["it_bracelete_do_vigor", "it_bracelete_do_vigor"]));
  t(`${sistema} dois Braceletes concedem dez PV`, dup.hp - db.hp, 10);
  t(`${sistema} repetido permanece equipado e carregado`,
    dup.equip.entradas.map(e => [e.equipado, !!e.beneficioRepetido]), [[true, false], [true, true]]);
  t(`${sistema} Ombreiras e Bracelete usam conjunto expresso`,
    deriveAfty(porItem(base, ["it_bracelete_do_vigor", "it_ombreiras_do_vigor_superior"])).hp - db.hp, 30);
  for (const [item, campo] of [["it_bracelete_da_forca", "forca"], ["it_aneis_do_conhecimento", "sabedoria"]]) {
    t(`${sistema} acessório de atributo repetido`,
      deriveAfty(porItem(base, [item, item])).attrEquip[campo], 2);
  }
  t(`${sistema} Amuleto não repete perícia`,
    pericia(deriveAfty(porItem(base, ["it_amuleto_do_vislumbre", "it_amuleto_do_vislumbre"])), "percepcao").bonus - pericia(db, "percepcao").bonus, 2);
  const cura = deriveAfty(porItem(base, ["it_apanhador_de_saude", "it_apanhador_de_saude"]));
  t(`${sistema} Motor do acessório emite uma fonte`, cura.efeitos.detalhes.filter(e => e.canal === "curaPorDado").map(e => e.valor), [1]);
  const guardado = porItem(base, ["it_bracelete_do_vigor", "it_bracelete_do_vigor"]);
  guardado.equipamentos.itens[0].equipado = false;
  t(`${sistema} cópia guardada não cobre equipada`, deriveAfty(guardado).hp - db.hp, 10);
  const quantidade = porItem(base, ["it_bracelete_do_vigor"]);
  quantidade.equipamentos.itens[0].qtd = 2;
  t(`${sistema} quantidade não multiplica benefício`, deriveAfty(quantidade).hp - db.hp, 10);

  const natural = ficha(sistema, ["arma_natural"]);
  natural.core.origem.anatomiasConfig = { arma_natural: { tipoDano: "pf" } };
  const dn = deriveAfty(natural);
  t(`${sistema} Natural conserva propriedades`, linha(dn).propriedades.filter(p => ["fineza", "energica"].includes(p.id)).map(p => p.id).sort(), ["energica", "fineza"]);
  t(`${sistema} tipo físico escolhido`, linha(dn).tipoDano, "pf");
  t(`${sistema} melhoria passa pelo Motor uma vez`, dn.efeitos.detalhes.filter(e => e.origem === "arma_natural" && e.canal === "nivelDano").map(e => e.valor), [1]);
  t(`${sistema} melhoria tem fonte no dano`, linha(dn).partes.some(p => p.label.includes("Arma Natural")), true);
  if (sistema === "player") {
    t("Player melhora desarmado superior", linha(dn).formulaNormal, "1d12 + 1d4 + 4");
    t("Player Arma Natural é mínimo 1d8", linha(deriveAfty(ficha(sistema, ["arma_natural"], 1, "conjurador"))).dadosGrupos, [{ qtd: 1, faces: 8 }]);
    t("Player empate em 1d8 não ganha nível", linha(deriveAfty(ficha(sistema, ["arma_natural"], 1))).niveisDano, 0);
  } else {
    t("Afty mantém conversão de nível para ND de dano", linha(dn).total - linha(db).total, 2);
  }
  const antiga = ficha(sistema, ["arma_natural"]);
  t(`${sistema} ficha antiga recebe Impacto`, linha(deriveAfty(antiga)).tipoDano, "im");
  antiga.core.origem.anatomiasConfig = { arma_natural: { tipoDano: "fogo" } };
  t(`${sistema} tipo não físico recusado na leitura`, linha(deriveAfty(antiga)).tipoDano, "im");
  natural.core.origem.id = "inato";
  t(`${sistema} Anatomia sem origem elegível não concede`, linha(deriveAfty(natural)).tipoDano, null);

  const alcance = ficha(sistema, ["articulacoes_extensas"]);
  alcance.equipamentos = { itens: ["arm_bastao", "arm_arco_longo"].map((refId, i) => ({ uid: `cx1-arma-${i}`, tipo: "arma", refId, equipado: true, qtd: 1 })) };
  const da = deriveAfty(alcance);
  const semAlcance = deriveAfty({ ...alcance, core: { ...alcance.core, origem: { ...alcance.core.origem, anatomias: [] } } });
  t(`${sistema} básico e corpo a corpo ganham alcance`, [linha(da).alcance.curto - linha(semAlcance).alcance.curto,
    linha(da, "arm_bastao").alcance.curto - linha(semAlcance, "arm_bastao").alcance.curto], [1.5, 1.5]);
  t(`${sistema} distância preservada`, linha(da, "arm_arco_longo").alcance, linha(semAlcance, "arm_arco_longo").alcance);
  t(`${sistema} tamanho preservado`, da.tamanho, semAlcance.tamanho);

  const corpo = ficha(sistema, ["corpo_especializado"]);
  corpo.core.origem.anatomiasConfig = { corpo_especializado: { pericia: "atletismo" } };
  const dc = deriveAfty(JSON.parse(JSON.stringify(corpo)));
  t(`${sistema} escolha salva conserva dado`, pericia(dc, "atletismo").dadosExtras, [{ faces: 4, qtd: 1 }]);
  t(`${sistema} dado não vira bônus fixo`, pericia(dc, "atletismo").bonus, pericia(db, "atletismo").bonus);
  t(`${sistema} dado tem fonte`, pericia(dc, "atletismo").partes.some(p => p.label === "Corpo Especializado" && p.texto === "1d4"), true);
  const pc = pericia(dc, "atletismo");
  const teste = rolarTeste({ bonus: pc.bonus, dados: pc.dadosExtras }, () => 0);
  t(`${sistema} dado chega à rolagem`, [teste.somaExtras, teste.total], [1, pc.bonus + 2]);
  corpo.core.origem.anatomiasConfig.corpo_especializado.pericia = "inexistente";
  t(`${sistema} escolha inválida não emite efeito`, deriveAfty(corpo).efeitos.detalhes.some(e => e.origem === "corpo_especializado"), false);

  const bracos = ficha(sistema, ["bracos_extras"]);
  const desligado = deriveAfty(bracos);
  const sessao = S.alteraTreinoAtivo(S.sessaoEmBranco(desligado), "anatomia_duas_maos_livres", true);
  const gravada = S.normalizaSessao(JSON.parse(JSON.stringify(sessao)), desligado);
  const ligado = deriveAfty(bracos, opcoesDeriveDaSessao(gravada));
  t(`${sistema} Atletismo desligado por padrão`, pericia(desligado, "atletismo").bonus, pericia(db, "atletismo").bonus);
  t(`${sistema} declaração salva liga Atletismo`, pericia(ligado, "atletismo").bonus - pericia(db, "atletismo").bonus, 2);
  t(`${sistema} Prestidigitação independe de mãos`, [pericia(desligado, "prestidigitacao").bonus - pericia(db, "prestidigitacao").bonus,
    pericia(ligado, "prestidigitacao").bonus - pericia(db, "prestidigitacao").bonus], [2, 2]);
  t(`${sistema} sessão não altera ficha base`, !!bracos.treinosAtivos, false);
  t(`${sistema} desligar retira bônus`, pericia(deriveAfty(bracos, opcoesDeriveDaSessao(S.alteraTreinoAtivo(gravada, "anatomia_duas_maos_livres", false))), "atletismo").bonus, pericia(db, "atletismo").bonus);

  // Bastão tem Ampla, cujo controle real oferece Defesa do Alvo na ficha.
  const armada = ficha(sistema);
  armada.equipamentos = { itens: [{ uid: "cx1-bastao", tipo: "arma", refId: "arm_bastao", equipado: true, qtd: 1 }] };
  for (const [natural, defesa, esperado] of [[20, 1000, true], [1, 1, false], [19, 1000, false], [19, 1, true]]) {
    const d = deriveAfty(armada, { propriedadesArmas: { porArma: { "cx1-bastao": { defesaAlvo: defesa } } } });
    const e = linha(d, "arm_bastao");
    const desc = P.preparaRolagemArma({ tipo: "teste", linhaArma: e, bonus: e.acerto, margem: e.margemCritico });
    const r = rolarTeste(desc, naturais(natural));
    t(`${sistema} ataque real natural ${natural} Defesa ${defesa}`, [r.tipoTeste, r.sucesso, r.critico], ["ataque", esperado, esperado && natural >= 19]);
    const s = P.registraRolagemArma(S.registraRolagem(S.sessaoEmBranco(d), r), desc, r);
    t(`${sistema} erro impede dano natural ${natural} Defesa ${defesa}`, P.estadoDaArma(s.propriedadesArmas, e).pendente.errou, !esperado);
  }
}
for (const [natural, bonus, cd, esperado] of [[20, 0, 100, false], [1, 100, 10, true]]) {
  t(`teste genérico preserva comparação no natural ${natural}`, rolarTeste({ bonus, cd }, naturais(natural)).sucesso, esperado);
}
for (const [modo, pedras, natural, sucesso] of [["vantagem", [1, 20], 20, true], ["desvantagem", [20, 1], 1, false]]) {
  let i = 0;
  const r = rolarTeste({ tipoTeste: "ataque", modo, cd: 100 }, () => (pedras[i++] - 1) / 20);
  t(`${modo} usa o d20 escolhido`, [r.natural, r.sucesso], [natural, sucesso]);
}
t("ataque sem Defesa deixa resultado intermediário indeterminado", rolarTeste({ tipoTeste: "ataque" }, naturais(10)).sucesso, null);
t("perícia não vira ataque pelo rótulo", rolarTeste({ rotulo: "Ataque", cd: 100 }, naturais(20)).sucesso, false);
t("margem reduzida não garante acerto", rolarTeste({ tipoTeste: "ataque", margem: 18, cd: 100 }, naturais(18)).sucesso, false);
t("crítico ainda dobra só dados", rolarDano({ dados: 1, faces: 8, fixo: 2, critico: true }, () => 0).total, 4);
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
