/* PACOTES PARA ALIADOS (2026-10-19).

   O suporte monta um pacote com fontes da própria ficha, exporta JSON com os números JÁ calculados com os atributos e as escolhas dele, e o aliado
   importa uma biblioteca permanente e liga cada opção como uma instância de Fonte Externa na sessão. Aqui:
     1. o arquivo: lista branca, versão, ids, valores finitos, motivo de cada recusa, nada avaliado;
     2. a biblioteca: mesmo arquivo duas vezes, revisão nova, revisão antiga, opção removida, dois emissores, releitura defensiva, export da ficha;
     3. a instância: prazo a partir da ativação, alcance e manutenção sem rodadas, descanso, virada;
     4. os números do emissor por família (Aura do Bastião, Comandante e Evoluída, Feitiço, auxílio e Aura de invocação, Estilo, Suporte), e a
        revisão que muda quando o emissor muda, sem nunca reavaliar com os atributos do aliado;
     5. o acúmulo no aliado, regra por regra: origem repetida, valor maior, empate no topo, benefício próprio já presente, fim do maior;
     6. alvo e condição: o benefício direcionado não se espalha, e o de combate não vale fora dele;
     7. os consumidores: a clássica, o G2 e o Encontro dão o mesmo derive;
     8. o criador não escreve os campos novos. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const loja = new Map();
globalThis.localStorage = { getItem: (k) => (loja.has(k) ? loja.get(k) : null), setItem: (k, v) => loja.set(k, String(v)), removeItem: (k) => loja.delete(k) };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const EST = await import(R + "afty-estilo-sombras.js");
const S = await import(R + "ficha/ficha-sessao.js");
const PA = await import(R + "ficha/pacotes-aliados.js");
const FAM = await import(R + "ficha/pacotes-familias.js");
const { calcularRecebidos } = await import(R + "ficha/ficha-recebidos.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");
const E = await import(R + "encontros/usar-encontro-afty.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* AS FICHAS SINTÉTICAS                                          */
/* ============================================================ */
const carac = (subtipo, extra = {}) => ({ ...INV.createBlankCaracteristica(), subtipo, nome: extra.nome ?? subtipo, ...extra });
function suporteA({ presenca = 18, au = 3 } = {}) {
  const f = createBlankAfty();
  f.id = "sup-a"; f.name = "Yuki"; f.rulesVersion = "player";
  f.core = { ...f.core, nd: 14, patamar: "comum", origem: { id: "inato" } };
  f.attributes = { ...f.attributes, presenca, sabedoria: 14 };
  f.especializacoes = [{ id: "suporte", nivel: 10 }, { id: "controlador", nivel: 4 }];
  f.aptidoes = { ...f.aptidoes, au };
  f.aptidoesAmaldicoadas = ["aura_do_bastiao", "aura_do_comandante", "aura_do_comandante_evoluida"];
  f.habilidades = ["sup_presenca_inspiradora", "sup_pronto_para_agir", "sup_apoio_avancado", "sup_inimigo_comum", "sup_taticas_defensivas", "sup_comando_motivador", "sup_olhar_agucado", "sup_contra_ataque"];
  f.escolhasHabilidade = { sup_apoio_avancado: ["sup_apoio_defensivo", "sup_apoio_estrategico"], sup_taticas_defensivas: ["sup_taticas_acido"] };
  f.feiticos = [
    { id: "f1", nome: "Escudo Dourado", tipo: "auxiliar", nivel: 2, efeitoAux: "defesa", duracaoAux: "duradoura", rodadasDur: 2 },
    { id: "f2", nome: "Bênção Tripla", tipo: "auxiliar", nivel: 3, multiplosAtivo: true, duracaoMult: "imediata", efeitosMult: [{ id: "e1", efeito: "defesa", nivel: 1 }, { id: "e2", efeito: "rd", nivel: 1 }] },
    { id: "f3", nome: "Foco Sustentado", tipo: "auxiliar", nivel: 2, efeitoAux: "rolagem", duracaoAux: "sustentada" },
    { id: "f4", nome: "Só Meu", tipo: "auxiliar", nivel: 1, efeitoAux: "defesa", duracaoAux: "imediata", alcancePropria: true },
    { id: "f5", nome: "Lâmina Viva", tipo: "auxiliar", nivel: 1, efeitoAux: "danoDurante", duracaoAux: "imediata" },
    { id: "f6", nome: "Troca Arriscada", tipo: "auxiliar", nivel: 2, efeitoAux: "defesa", duracaoAux: "imediata", permuta: { perde: "rd", reducao: 2 } },
    { id: "f7", nome: "Vigor de Vontade", tipo: "auxiliar", nivel: 1, efeitoAux: "tr", duracaoAux: "imediata", alvoAuxTR: "vontade" },
  ];
  f.invocacoes = [{
    ...INV.createBlankInvocacao("primeiro"), id: "inv1", nome: "Nue",
    acoes: [
      { id: "a1", nome: "Escudo de Raios", familia: "auxilio", auxilioSub: "defesa", alvoAuxilio: "aliados", classe: "simples", custoPE: 0 },
      { id: "a2", nome: "Guarda Própria", familia: "auxilio", auxilioSub: "defesa", alvoAuxilio: "invocacao", classe: "simples", custoPE: 0 },
      { id: "a3", nome: "Faro", familia: "auxilio", auxilioSub: "acerto", alvoAuxilio: "aliados", classe: "simples", custoPE: 0 },
    ],
    caracteristicas: [carac("auraDefesa", { id: "c1", nome: "Halo" }), carac("auraDano", { id: "c2", nome: "Faíscas" }), carac("auraPericia", { id: "c3", nome: "Clareza", parametros: { pericia: "percepcao" } })],
  }, { ...INV.createBlankInvocacao("terceiro"), id: "inv2", nome: "Sapo" }];
  /* A Quimera fundida (principal Nue, fundida Sapo) com Ações próprias, e uma sem fundida, que o motor ignora. */
  f.quimeras = [
    { id: "q1", nome: "Quimera", principalId: "inv1", fundidasIds: ["inv2"], acoes: [{ id: "qa1", nome: "Couraça", familia: "auxilio", auxilioSub: "rd", alvoAuxilio: "aliados", classe: "simples", custoPE: 0 }] },
    { id: "q2", nome: "Quimera Solta", principalId: "inv1", fundidasIds: [], acoes: [{ id: "qa2", nome: "Nada", familia: "auxilio", auxilioSub: "rd", alvoAuxilio: "aliados", classe: "simples", custoPE: 0 }] },
  ];
  return f;
}
let seq = 0;
const compra = (efeitoId, escolha = null, repeticao = null) => ({ uid: `u${++seq}`, efeitoId, ...(escolha ? { escolha } : {}), ...(repeticao ? { repeticao } : {}) });
function suporteB() {
  const b = createBlankAfty();
  b.id = "sup-b"; b.name = "Rin"; b.rulesVersion = "player";
  b.core = { ...b.core, nd: 12, patamar: "comum", origem: { id: "sem_tecnica" } };
  b.attributes = { ...b.attributes, sabedoria: 16 };
  b.especializacoes = [{ id: "suporte", nivel: 12 }];
  b.aptidoes = { ...b.aptidoes, dom: 4 };
  b.aptidoesAmaldicoadas = ["aura_do_bastiao"];
  b.estilosSombra = [{ ...EST.createBlankTecnicaEstilo(), id: "tec1", nome: "Véu da Sombra Comum",
    efeitos: [compra("defesa"), compra("defesa", null, "aliados"), compra("tr", { tr: "vontade" }), compra("tr", { tr: "vontade" }, "aliados")] }];
  return b;
}
function receptor(extra = {}) {
  const g = createBlankAfty();
  g.id = "rec-kai"; g.name = "Kai"; g.rulesVersion = "player";
  g.core = { ...g.core, nd: 10, patamar: "comum", origem: { id: "inato" } };
  g.attributes = { ...g.attributes, forca: 16, destreza: 14, constituicao: 14 };
  g.especializacoes = [{ id: "combatente", nivel: 10 }];
  return { ...g, ...extra };
}

/* ---------- o caminho real: fontes do emissor, arquivo, leitura, biblioteca ---------- */
function exporta(ficha, emissorId, escolhidas, { revisaoAntes = null } = {}) {
  const d = deriveAfty(ficha);
  const { porChave } = FAM.fontesParaAliados(ficha, d, { emissorId });
  /* Como o Exportar do suporte: a fonte que não dá nada a um aliado agora (bloqueio) fica fora do arquivo. */
  const opcoes = escolhidas.map(([fonte, escolhas = null, id = null], i) => {
    const item = { id: id ?? `op${i}`, fonte, escolhas: escolhas ?? FAM.escolhasPadrao(porChave.get(fonte)) };
    const r = FAM.resolverItem(item, porChave);
    return r.bloqueio || r.indisponivel ? null : FAM.paraArquivo(item.id, r);
  }).filter(Boolean);
  const pacote = { ...PA.novoPacoteDoEmissor("Apoio"), id: `pac-${emissorId}`, ...(revisaoAntes ? { exportado: revisaoAntes } : {}) };
  return PA.montarArquivo({ pacote, emissorId, emissor: { nome: ficha.name, sistema: "player" }, opcoes, agora: "2026-10-19T20:00:00Z" });
}
const conhecidos = FAM.conhecidosDaFicha();
const ler = (arquivo) => PA.lerArquivoDePacote(JSON.stringify(arquivo), { conhecidos });
const biblio = (...arquivos) => arquivos.reduce((b, a) => { const l = ler(a); return PA.gravarNaBiblioteca(b, l.pacote, l.recusadas, "2026-10-19T21:00:00Z").biblioteca; }, []);
const opcao = (bib, nome) => { for (const e of bib) { const o = e.opcoes.find((x) => x.nome === nome); if (o) return { entrada: e, opcao: o }; } return null; };
let nInst = 0;
const inst = (bib, nome, extra = {}) => { const x = opcao(bib, nome); return PA.instanciaDaOpcao(x.entrada, x.opcao, { id: `i${++nInst}`, ...extra }); };

/* ---------- a conta do receptor, como cada consumidor a faz ---------- */
const deriveSessao = (f, s) => deriveAfty({ ...f, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const classica = (f, s) => calcularRecebidos(f, s, deriveSessao).derived;
const kai = receptor();
const d0 = deriveAfty({ ...kai, combate: { ativo: true } });
const base = { ...S.sessaoEmBranco(d0), combate: { ativo: true }, rodada: 1 };
const com = (...buffs) => ({ ...base, buffs });
const def = (d) => d.defesa;
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id).bonus;
const per = (d, id) => d.testes.pericias.find((p) => p.id === id).bonus;
const dB = classica(kai, base);

/* ============================================================ */
/* 1. O ARQUIVO                                                  */
/* ============================================================ */
const fontesA = [["aptidao|aura_do_bastiao"], ["aptidao|aura_do_comandante", { versao: "evoluida" }], ["feitico|f1"], ["feitico|f2"], ["feitico|f5"], ["feitico|f7"],
  ["invAux|inv1|a1"], ["invAux|inv1|a3"], ["invAura|inv1|c1"], ["invAura|inv1|c2"], ["invAura|inv1|c3"], ["habilidade|sup_presenca_inspiradora"], ["habilidade|sup_pronto_para_agir"],
  ["apoio|sup_apoio_defensivo"], ["habilidade|sup_inimigo_comum"], ["habilidade|sup_taticas_defensivas"], ["habilidade|sup_comando_motivador"]];
const { arquivo: arqA, pacote: pacA1 } = exporta(suporteA(), "emi-a", fontesA);
t("o arquivo diz o formato, a versão, a revisão 1 e o emissor", [arqA.formato, arqA.versao, arqA.pacote.revisao, arqA.emissor.id, arqA.emissor.nome], ["grimorio-afty-pacote-aliados", 1, 1, "emi-a", "Yuki"]);
t("nenhum número do arquivo é texto ou fórmula", JSON.stringify(arqA).includes("\"expr\"") || arqA.opcoes.some((o) => o.beneficios.some((b) => typeof b.valor !== "number")), false);
t("o arquivo não leva a ficha do emissor (atributos, habilidades, feitiços)", ["attributes", "habilidades", "feiticos", "invocacoes"].some((k) => JSON.stringify(arqA).includes(`"${k}"`)), false);
const lidoA = ler(arqA);
t("o arquivo do suporte é lido inteiro, sem recusa", [lidoA.ok, lidoA.pacote.opcoes.length, lidoA.recusadas.length], [true, fontesA.length, 0]);
t("a chave da biblioteca é emissor e pacote", lidoA.pacote.chave, "emi-a:pac-emi-a");
const recusa = (x) => PA.lerArquivoDePacote(typeof x === "string" ? x : JSON.stringify(x), { conhecidos });
t("texto que não é JSON é recusado", recusa("{nao json").erro, "Arquivo Não É JSON");
t("formato errado é recusado", recusa({ ...arqA, formato: "outro" }).erro, "Arquivo Não É um Pacote para Aliados");
t("versão mais nova é recusada", recusa({ ...arqA, versao: 2 }).erro, "Versão do Arquivo Mais Nova que Esta Ficha");
t("versão ausente é recusada", recusa({ ...arqA, versao: undefined }).erro, "Versão do Arquivo Ausente");
t("emissor sem id é recusado", recusa({ ...arqA, emissor: { nome: "X" } }).erro, "Emissor Sem Id Válido");
t("revisão inválida é recusada", recusa({ ...arqA, pacote: { ...arqA.pacote, revisao: 0 } }).erro, "Revisão Inválida");
t("ids de opção repetidos são recusados", recusa({ ...arqA, opcoes: [arqA.opcoes[0], arqA.opcoes[0]] }).erro, "Ids de Opção Repetidos");
t("arquivo grande demais é recusado sem ler", recusa(`{"x":"${"a".repeat(PA.LIMITES_PACOTE.bytes)}"}`).erro, "Arquivo Grande Demais");
t("pacote sem opções é recusado", recusa({ ...arqA, opcoes: [] }).erro, "Pacote Sem Opções");
const mexe = (i, fn) => { const a = JSON.parse(JSON.stringify(arqA)); fn(a.opcoes[i]); return a; };
const motivo = (a) => recusa(a).recusadas?.[0]?.motivo ?? recusa(a).erro;
t("valor em texto não é número (nada é avaliado)", motivo(mexe(0, (o) => { o.beneficios[0].valor = "3"; })), "Defesa: Valor Não Numérico");
t("valor infinito é recusado", recusa(JSON.stringify(mexe(0, (o) => { o.beneficios[0].valor = 1e999; })).replace("1e+999", "1e999")).recusadas[0]?.motivo ?? "?", "Defesa: Valor Não Numérico");
t("valor zero não entra como benefício calado", motivo(mexe(0, (o) => { o.beneficios[0].valor = 0; })), "Defesa: Valor Zero");
t("canal fora da lista do pacote é recusado com o nome", motivo(mexe(0, (o) => { o.beneficios[0].canal = "hpMult"; })), "Canal Não Representado: hpMult");
t("perícia que esta ficha não conhece é recusada", motivo(mexe(10, (o) => { o.beneficios[0].alvo = "pericia_de_addon"; })), "Perícias: Perícia Desconhecida Nesta Ficha: pericia_de_addon");
t("condição que o motor não avalia é recusada", motivo(mexe(1, (o) => { o.beneficios[0].quando = "tem_aliado_perto"; })), "Dano: Condição Não Representada");
t("duração em rodadas zero é recusada", motivo(mexe(2, (o) => { o.duracao = { tipo: "rodadas", rodadas: 0 }; })), "Duração em Rodadas Inválida");
t("regra de acúmulo desconhecida é recusada", motivo(mexe(0, (o) => { o.acumulo = { regra: "soma_tudo" }; })), "Regra de Acúmulo Desconhecida");
t("catálogo sem origem é recusado", motivo(mexe(0, (o) => { o.acumulo = { regra: "catalogo" }; })), "Origem do Catálogo Inválida");
t("opção sem benefício e sem consulta é recusada", motivo(mexe(0, (o) => { o.beneficios = []; o.consulta = []; })), "Sem Benefício Representado");
const extra = mexe(0, (o) => { o.codigo = "alert(1)"; o.beneficios[0].expr = "bt * 2"; o.__proto__polui = 1; });
const lidoExtra = recusa(extra);
t("campos desconhecidos não sobrevivem à leitura (lista branca)", [lidoExtra.ok, "codigo" in lidoExtra.pacote.opcoes[0], "expr" in lidoExtra.pacote.opcoes[0].beneficios[0]], [true, false, false]);
const ruim = mexe(0, (o) => { o.beneficios[0].valor = "3"; });
t("uma opção ruim fica de fora com motivo, e as outras entram", [recusa(ruim).ok, recusa(ruim).pacote.opcoes.length, recusa(ruim).recusadas.length], [true, fontesA.length - 1, 1]);
t("um pacote só com opções ruins é recusado inteiro", recusa({ ...ruim, opcoes: [ruim.opcoes[0]] }).erro, "Nenhuma Opção Representável");

/* ============================================================ */
/* 2. A BIBLIOTECA                                               */
/* ============================================================ */
let bib = biblio(arqA);
t("gravar o pacote cria uma entrada", [bib.length, bib[0].opcoes.length], [1, fontesA.length]);
const mesmo = PA.gravarNaBiblioteca(bib, ler(arqA).pacote, [], "x");
t("o mesmo arquivo de novo não grava nem duplica", [mesmo.estado, mesmo.gravou, mesmo.biblioteca.length], ["igual", false, 1]);
const { arquivo: arqA2 } = exporta(suporteA({ presenca: 20 }), "emi-a", fontesA, { revisaoAntes: pacA1.exportado });
t("o emissor mudou a Presença: a exportação sobe para a revisão 2", arqA2.pacote.revisao, 2);
const { arquivo: arqA1b } = exporta(suporteA(), "emi-a", fontesA, { revisaoAntes: pacA1.exportado });
t("exportar de novo sem mudança repete a revisão", arqA1b.pacote.revisao, 1);
const rev = PA.gravarNaBiblioteca(bib, ler(arqA2).pacote, [], "y");
t("a revisão 2 atualiza a mesma entrada", [rev.estado, rev.gravou, rev.biblioteca.length, rev.biblioteca[0].revisao], ["revisao", true, 1, 2]);
/* Presença 18 para 20: o modificador vai de 4 a 5. A metade continua 2 (Pronto para Agir e o teto da Presença Inspiradora), e o Inimigo Comum
   soma o modificador inteiro no dano. */
t("a comparação diz o que mudou (só o Inimigo Comum muda com a Presença 20)",
  PA.compararComBiblioteca(bib, ler(arqA2).pacote).alteradas.map((id) => arqA2.opcoes.find((o) => o.id === id).nome), ["Inimigo Comum"]);
const antiga = PA.gravarNaBiblioteca(rev.biblioteca, ler(arqA).pacote, [], "z");
t("uma revisão mais antiga não sobrescreve a salva", [antiga.estado, antiga.gravou, antiga.biblioteca[0].revisao], ["antiga", false, 2]);
const semUma = { ...arqA2, pacote: { ...arqA2.pacote, revisao: 3 }, opcoes: arqA2.opcoes.filter((o) => o.nome !== "Aura do Bastião") };
const c3 = PA.compararComBiblioteca(rev.biblioteca, ler(semUma).pacote);
t("a revisão que tira uma opção diz qual saiu", [c3.estado, c3.removidas.length], ["revisao", 1]);
const { arquivo: arqB } = exporta(suporteB(), "emi-b", [["estilo|tec1"], ["aptidao|aura_do_bastiao"], ["habilidade|sup_presenca_inspiradora"]]);
bib = biblio(arqA, arqB);
t("dois emissores convivem, cada um com a sua entrada", [bib.length, bib.map((e) => e.emissor.nome)], [2, ["Yuki", "Rin"]]);
const mesmoIdOutroEmissor = { ...arqB, pacote: { ...arqB.pacote, id: arqA.pacote.id } };
t("o mesmo id de pacote vindo de outro emissor não sobrescreve", biblio(arqA, mesmoIdOutroEmissor).length, 2);
const gravada = JSON.parse(JSON.stringify(bib));
gravada[0].opcoes[0].beneficios[0].valor = "999";
t("a biblioteca gravada é relida pela mesma lista branca (opção adulterada sai)", PA.bibliotecaDaFicha({ pacotesRecebidos: gravada })[0].opcoes.length, bib[0].opcoes.length - 1);
t("export e import da ficha inteira levam a biblioteca", PA.bibliotecaDaFicha(JSON.parse(JSON.stringify({ ...kai, pacotesRecebidos: bib }))).length, 2);
t("tirar uma entrada não mexe na outra", PA.tirarDaBiblioteca(bib, bib[0].chave).map((e) => e.emissor.nome), ["Rin"]);

/* ============================================================ */
/* 3. A INSTÂNCIA                                                */
/* ============================================================ */
const iEscudo = inst(bib, "Escudo Dourado");
const iBastiao = inst(bib, "Aura do Bastião");
const iTaticas = inst(bib, "Táticas Defensivas");
t("o prazo da Duradoura é o do Feitiço, a partir da ativação", iEscudo.rodadas, 2);
t("alcance e permanência não ganham rodadas inventadas", [iBastiao.rodadas, iTaticas.rodadas, iBastiao.pacote.duracao.tipo, iTaticas.pacote.duracao.tipo], [null, null, "alcance", "permanente"]);
t("a instância guarda a proveniência", [iBastiao.pacote.revisao, iBastiao.pacote.emissorNome, iBastiao.aplicadoPor, iBastiao.tipoFonte, iBastiao.origemId], [1, "Yuki", "Yuki", "catalogo", "aptidao:aura_do_bastiao"]);
t("o que não é permanente termina com o descanso", [iBastiao.terminaNoDescanso, iTaticas.terminaNoDescanso], [true, false]);
const sDesc = S.descansar(com(iEscudo, iBastiao, iTaticas), d0);
t("descansar tira as de cena e conserva a permanente", sDesc.buffs.map((b) => b.origemNome), ["Táticas Defensivas"]);
const v1 = S.proximaRodada(com(iEscudo, iBastiao), d0).sessao;
const v2 = S.proximaRodada(v1, d0).sessao;
t("cada fonte conta o próprio prazo, e a de alcance não expira na virada", [v1.buffs.map((b) => [b.origemNome, b.rodadas]), v2.buffs.map((b) => b.origemNome)], [[["Escudo Dourado", 1], ["Aura do Bastião", null]], ["Aura do Bastião"]]);
t("instanciaAtivaDe acha a opção pelo pacote e pelo id", PA.instanciaAtivaDe(com(iBastiao), iBastiao.pacote.chave, iBastiao.pacote.opcaoId)?.id, iBastiao.id);
t("só a regra desconhecida aceita somar mesmo assim", PA.instanciaDaOpcao(opcao(bib, "Aura do Bastião").entrada, opcao(bib, "Aura do Bastião").opcao, { id: "x", somaPresumida: true }).somaPresumida, false);

/* ============================================================ */
/* 4. OS NÚMEROS DO EMISSOR, POR FAMÍLIA                         */
/* ============================================================ */
const op = (nome) => arqA.opcoes.find((o) => o.nome === nome);
t("Bastião: o Nível de Aptidão em Aura do emissor, com a condição de alcance", [op("Aura do Bastião").beneficios, op("Aura do Bastião").condicoes], [[{ canal: "defesa", valor: 3 }], ["Dentro de 4,5 m do Emissor"]]);
const { arquivo: arqBase } = exporta(suporteA(), "emi-a", [["aptidao|aura_do_comandante", { versao: "base" }]]);
t("Comandante base: 1 + metade da Aura em dano e perícias em combate", arqBase.opcoes[0].beneficios, [{ canal: "danoBonus", valor: 2, quando: "em_combate" }, { canal: "bonusPericia", valor: 2, quando: "em_combate" }]);
t("Comandante Evoluída: Aura total, mais +2 em ataque e TR", op("Aura do Comandante Evoluída").beneficios, [{ canal: "danoBonus", valor: 3, quando: "em_combate" }, { canal: "bonusPericia", valor: 3, quando: "em_combate" }, { canal: "bonusAcerto", valor: 2 }, { canal: "bonusTR", valor: 2 }]);
t("as duas versões são a MESMA origem (não somam como fontes independentes)", [arqBase.opcoes[0].acumulo, op("Aura do Comandante Evoluída").acumulo], [{ regra: "catalogo", origemId: "aptidao:aura_do_comandante" }, { regra: "catalogo", origemId: "aptidao:aura_do_comandante" }]);
t("Comandante: o custo é do emissor (2 e 4 PE por turno)", [arqBase.opcoes[0].custoEmissor, op("Aura do Comandante Evoluída").custoEmissor], ["2 PE por Turno", "4 PE por Turno"]);
t("Feitiço com dois benefícios leva os dois, na regra dos Feitiços", [op("Bênção Tripla").beneficios.map((b) => b.canal), op("Bênção Tripla").acumulo.regra], [["defesa", "rdGeral"], "feitico"]);
t("Feitiço com TR escolhido leva o alvo", op("Vigor de Vontade").beneficios, [{ canal: "bonusTR", valor: 2, alvo: "vontade" }]);
t("Feitiço Sustentado: manutenção do emissor, sem rodadas", [op("Foco Sustentado")?.duracao ?? null], [null]);
const todasA = FAM.fontesParaAliados(suporteA(), deriveAfty(suporteA()), { emissorId: "emi-a" });
const res = (chave) => FAM.resolverItem({ fonte: chave, escolhas: FAM.escolhasPadrao(todasA.porChave.get(chave)) }, todasA.porChave);
t("Feitiço Sustentado: mantida, com o custo da manutenção", [res("feitico|f3").duracao.tipo, res("feitico|f3").custoEmissor], ["mantida", "5 PE e 1 PE por Rodada"]);
t("Feitiço de Alcance Próprio não vai para aliado", res("feitico|f4").bloqueio, "Alcance Próprio: Só no Emissor");
t("Feitiço Permutativo espera regra (nada inventado)", res("feitico|f6").bloqueio, "Feitiço Permutativo: a Troca em Aliado Ainda Não Tem Regra");
t("dados de dano de Feitiço vão como consulta, e dizem que não entram", [op("Lâmina Viva").beneficios.length, op("Lâmina Viva").consulta.length, op("Lâmina Viva").naoRepresentado.length > 0], [0, 1, true]);
t("auxílio de Aliados de uma invocação: o valor da tabela do grau", op("Nue · Escudo de Raios").beneficios, [{ canal: "defesa", valor: 4 }]);
t("auxílio da própria invocação não é fonte para aliados", todasA.porChave.has("invAux|inv1|a2"), false);
t("auxílio: a identidade é do emissor, da invocação e da ação", op("Nue · Escudo de Raios").acumulo, { regra: "auxilioInvocacao", chave: "emi-a|inv1|a1" });
t("Aura de Defesa: valor do grau e a chave do tipo", [op("Nue · Halo").beneficios, op("Nue · Halo").acumulo], [[{ canal: "defesa", valor: 2 }], { regra: "auraInvocacao", chave: "aura:auraDefesa|", forca: 2 }]);
t("Aura de Dano: um dado nomeado, e não bônus genérico", op("Nue · Faíscas").beneficios, [{ canal: "dadosNomeados", alvo: "d6", valor: 1 }]);
t("Aura de Perícia: só na perícia escolhida", op("Nue · Clareza").beneficios, [{ canal: "bonusPericia", valor: 4, alvo: "percepcao" }]);
t("Presença Inspiradora: 1 + o PE adicional, com o teto do emissor", [op("Presença Inspiradora").beneficios, op("Presença Inspiradora").custoEmissor], [[{ canal: "bonusPericia", valor: 3 }], "4 PE"]);
t("Pronto para Agir: metade do modificador de Presença do emissor", op("Pronto para Agir").beneficios, [{ canal: "iniciativa", valor: 2 }]);
t("Apoio Defensivo: metade do BT até o próximo turno do emissor", [op("Apoio Defensivo").beneficios, op("Apoio Defensivo").duracao.rodadas], [[{ canal: "defesa", valor: 2 }], 1]);
t("Táticas Defensivas: a resistência ao tipo que o emissor escolheu", op("Táticas Defensivas").beneficios, [{ canal: "resistenciaDano", alvo: "acido", valor: 1 }]);
t("Apoio Estratégico: metade do BT na CD do próximo teste", [res("apoio|sup_apoio_estrategico").beneficios, res("apoio|sup_apoio_estrategico").duracao.tipo], [[{ canal: "cd", valor: 2 }], "proximo"]);
t("Olhar Aguçado: 5 vezes o BT no dano do primeiro ataque", [res("habilidade|sup_olhar_agucado").beneficios, res("habilidade|sup_olhar_agucado").condicoes], [[{ canal: "danoBonus", valor: 25 }], ["Contra o Inimigo Analisado"]]);
t("Contra-Ataque: o BT na Defesa contra um ataque", [res("habilidade|sup_contra_ataque").beneficios, res("habilidade|sup_contra_ataque").custoEmissor], [[{ canal: "defesa", valor: 5 }], "1 PE"]);
t("o auxílio da Quimera fundida é fonte, e o da Quimera sem fundida não (a regra do motor)", [todasA.porChave.has("invAux|quimera:q1|qa1"), todasA.porChave.has("invAux|quimera:q2|qa2")], [true, false]);
t("o auxílio da Quimera leva o valor do grau da principal", res("invAux|quimera:q1|qa1").beneficios[0].canal, "rdGeral");
t("Comando Motivador: só consulta, com o BT do emissor", [op("Comando Motivador").beneficios.length, op("Comando Motivador").consulta[0].texto], [0, "+5 na Rolagem da Ação"]);
const opB = (nome) => arqB.opcoes.find((o) => o.nome === nome);
t("Estilo: a segunda compra estende Defesa e TR de Vontade aos aliados", [opB("Véu da Sombra Comum").beneficios.map((b) => [b.canal, b.valor, b.alvo ?? null]), opB("Véu da Sombra Comum").acumulo.regra], [[["defesa", 2, null], ["bonusTR", 2, "vontade"]], "estilo"]);
t("a Presença 20 do emissor muda o Inimigo Comum na revisão nova", arqA2.opcoes.find((o) => o.nome === "Inimigo Comum").beneficios, [{ canal: "bonusAcerto", valor: 2 }, { canal: "danoBonus", valor: 5 }]);
const semBastiao = suporteA(); semBastiao.aptidoesAmaldicoadas = ["aura_do_comandante"];
const fSem = FAM.fontesParaAliados(semBastiao, deriveAfty(semBastiao), { emissorId: "emi-a" });
t("a fonte que saiu da ficha do emissor fica indisponível no pacote", FAM.resolverItem({ fonte: "aptidao|aura_do_bastiao", escolhas: {} }, fSem.porChave).indisponivel, "A Fonte Não Está Mais na Ficha");
const aura0 = FAM.fontesParaAliados(suporteA({ au: 0 }), deriveAfty(suporteA({ au: 0 })), { emissorId: "emi-a" });
t("Bastião com Aura 0 não exporta zero calado", FAM.resolverItem({ fonte: "aptidao|aura_do_bastiao", escolhas: {} }, aura0.porChave).bloqueio, "Nível de Aptidão em Aura 0: Sem Bônus");
const manual = FAM.resolverManual({ nome: "Bênção do Templo", regra: "catalogo", origemId: "habilidade:sup_guarda_sincronizada", beneficios: [{ canal: "defesa", valor: "2" }], duracao: "cena" });
t("a definição à mão vem marcada e com a regra do catálogo", [manual.calculo, manual.familia, manual.acumulo, manual.beneficios], ["manual", "manual", { regra: "catalogo", origemId: "habilidade:sup_guarda_sincronizada" }, [{ canal: "defesa", valor: 2 }]]);
t("a definição à mão sem valor não exporta", FAM.resolverManual({ nome: "Vazio", regra: "outro", beneficios: [{ canal: "defesa", valor: "" }] }).bloqueio, "Nenhum Valor Definido");

/* ============================================================ */
/* 5. O ACÚMULO NO ALIADO                                        */
/* ============================================================ */
const delta = (s, ler = def, f = kai) => ler(classica(f, s)) - ler(classica(f, base));
const iB_A = inst(bib, "Aura do Bastião"); // +3, de Yuki
t("o Bastião de quem não tem Aura não vai no arquivo (Rin, Aura 0)", arqB.opcoes.some((o) => o.nome === "Aura do Bastião"), false);
t("Bastião sozinho: +3", delta(com(iB_A)), 3);
/* Catálogo, origem repetida: dois aliados com Aura do Bastião (Yuki +3 e um +2 montado pelo mesmo caminho). */
const bastiao2 = { ...iB_A, id: "b2", aplicadoPor: "Outro", beneficios: [{ canal: "defesa", valor: 2 }], pacote: { ...iB_A.pacote, chave: "emi-x:pac-x", emissorNome: "Outro" } };
t("a mesma Aptidão de dois aliados (+3 e +2) vale a maior", delta(com(iB_A, bastiao2)), 3);
t("empate no topo (+3 e +3) conta uma vez", delta(com(iB_A, { ...bastiao2, beneficios: [{ canal: "defesa", valor: 3 }] })), 3);
t("fim do maior: sem o +3, o +2 volta a valer", delta(com(bastiao2)), 2);
/* Benefício próprio já presente: Pronto para Agir do próprio aliado (+mod de Presença) contra o recebido (+2). */
const iPronto = inst(bib, "Pronto para Agir");
const ini = (d) => d.iniciativa;
const kaiPronto = (presenca) => receptor({ attributes: { ...kai.attributes, presenca }, habilidades: ["sup_pronto_para_agir"], especializacoes: [{ id: "combatente", nivel: 8 }, { id: "suporte", nivel: 2 }] });
const deltaPronto = (presenca) => ini(classica(kaiPronto(presenca), com(iPronto))) - ini(classica(kaiPronto(presenca), base));
t("benefício próprio maior (+3) cobre o recebido (+2)", deltaPronto(16), 0);
t("benefício próprio menor (+1): só o que passa dele soma (+1, e não +2 nem −1)", deltaPronto(12), 1);
t("sem o próprio, o recebido vale inteiro (+2)", deltaPronto(10), 2);
t("a análise diz que o próprio cobre", calcularRecebidos(kaiPronto(16), com(iPronto), deriveSessao).analise[iPronto.id].iniciativa.status, "coberto");
/* Feitiços: não somam entre si, nem com o Estilo (o mesmo grupo no jogador). */
const iEsc = inst(bib, "Escudo Dourado");   // defesa +2
const iBen = inst(bib, "Bênção Tripla");    // defesa +2, rd +5
const iEstilo = inst(bib, "Véu da Sombra Comum"); // defesa +2, TR vontade +2
t("dois Feitiços recebidos de Defesa (+2 e +2) empatam: +2", delta(com(iEsc, iBen)), 2);
t("Estilo e Feitiço disputam (o mesmo grupo): +2", delta(com(iEsc, iEstilo)), 2);
t("o Estilo de Vontade só mexe na Vontade", [delta(com(iEstilo), (d) => tr(d, "vontade")), delta(com(iEstilo), (d) => tr(d, "reflexos"))], [2, 0]);
/* Famílias diferentes somam: Bastião (catálogo) + Feitiço + auxílio + Aura. */
const iAux = inst(bib, "Nue · Escudo de Raios");
const iHalo = inst(bib, "Nue · Halo");
t("famílias diferentes somam: 3 + 2 + 4 + 2", delta(com(iB_A, iEsc, iAux, iHalo)), 11);
/* Auxílio: a mesma origem repetida vale uma vez, e auxílios diferentes somam. */
t("o mesmo auxílio repetido vale uma vez", delta(com(iAux, { ...iAux, id: "auxDup" })), 4);
const iFaro = inst(bib, "Nue · Faro");
t("auxílios diferentes (Defesa e Acerto) não se tocam", [delta(com(iAux, iFaro)), delta(com(iAux, iFaro), (d) => d.dano.entradas[0].acerto)], [4, op("Nue · Faro").beneficios[0].valor]);
/* Aura: duas iguais não acumulam, vale a maior, entre emissores. */
const haloMaior = { ...iHalo, id: "haloMaior", aplicadoPor: "Outro", beneficios: [{ canal: "defesa", valor: 3 }], acumulo: { chave: "aura:auraDefesa|", forca: 3 } };
t("duas Auras de Defesa (+2 e +3) de emissores diferentes: vale a maior", delta(com(iHalo, haloMaior)), 3);
/* A aura que o próprio aliado recebe de uma invocação dele, Na Aura. */
const kaiComAura = receptor({ invocacoes: [{ ...INV.createBlankInvocacao("segundo"), id: "minha", nome: "Minha", caracteristicas: [carac("auraDefesa", { id: "mc1", nome: "Halo Próprio" }), carac("auraDano", { id: "mc2", nome: "Faísca Própria" })] }] });
const naAura = (s) => ({ ...s, invocacoes: { minha: { emCampo: true, auras: { mc1: true, mc2: true } } } });
const dA = (s, ler) => ler(classica(kaiComAura, naAura(s))) - ler(classica(kaiComAura, naAura(base)));
t("a Aura de Defesa própria (+1) e a recebida (+2): só o que passa soma (+1)", dA(com(iHalo), def), 1);
t("a Aura de Defesa própria igual ou maior cobre a recebida", dA(com({ ...iHalo, beneficios: [{ canal: "defesa", valor: 1 }], acumulo: { chave: "aura:auraDefesa|", forca: 1 } }), def), 0);
const iFaiscas = inst(bib, "Nue · Faíscas"); // 1d6
const formula = (s) => classica(kaiComAura, naAura(s)).dano.entradas[0].formulaNormal;
t("a Aura de Dano própria (1d4) é substituída pela recebida maior (1d6): um dado só", [formula(base).includes("1d4"), formula(com(iFaiscas)).includes("1d6"), formula(com(iFaiscas)).includes("1d4")], [true, true, false]);
t("duas Auras de Dano recebidas (1d6 e 1d8): vale a de 1d8", classica(kai, com(iFaiscas, { ...iFaiscas, id: "f8", beneficios: [{ canal: "dadosNomeados", alvo: "d8", valor: 1 }], acumulo: { chave: "aura:auraDano|", forca: 8 } })).dano.entradas[0].formulaNormal.includes("1d6"), false);

/* ============================================================ */
/* 6. ALVO E CONDIÇÃO                                            */
/* ============================================================ */
const iCom = inst(bib, "Aura do Comandante Evoluída");
const fora = { ...com(iCom), combate: { ativo: false } };
const baseFora = { ...base, combate: { ativo: false } };
const deltaFora = (ler) => ler(classica(kai, fora)) - ler(classica(kai, baseFora));
t("Comandante em combate: perícias +3, dano +3, ataque +2, TR +2", [delta(com(iCom), (d) => per(d, "atletismo")), delta(com(iCom), (d) => d.dano.entradas[0].total), delta(com(iCom), (d) => d.dano.entradas[0].acerto), delta(com(iCom), (d) => tr(d, "fortitude"))], [3, 3, 2, 2]);
t("fora de combate as perícias e o dano do Comandante não valem", [deltaFora((d) => per(d, "atletismo")), deltaFora((d) => d.dano.entradas[0].total)], [0, 0]);
t("e a análise diz que está fora da conta agora", calcularRecebidos(kai, fora, deriveSessao).analise[iCom.id].bonusPericia.status, "condicao");
const iClareza = inst(bib, "Nue · Clareza");
t("a Aura de Perícia só mexe na perícia escolhida", [delta(com(iClareza), (d) => per(d, "percepcao")), delta(com(iClareza), (d) => per(d, "atletismo"))], [4, 0]);
const iTat = inst(bib, "Táticas Defensivas");
const estados = (d) => Object.fromEntries((d.defesasDano?.linhas ?? []).filter((l) => l.estados.length).map((l) => [l.tipo, l.estados]));
t("a resistência vale no Ácido e em nenhum outro tipo", [estados(classica(kai, base)), Object.keys(estados(classica(kai, com(iTat))))], [{}, ["acido"]]);

/* ============================================================ */
/* 7. OS CONSUMIDORES                                            */
/* ============================================================ */
const tudo = com(iB_A, iCom, iEsc, iBen, iAux, iHalo, iFaiscas, iClareza, iTat, iEstilo);
const g2 = (f, s) => prepararCalculo(f, s).derived;
const enc = (f, s) => E.derivarCombatente({ ficha: f, sessao: s });
t("a clássica e o G2 dão o MESMO derive com dez instâncias de pacote", JSON.stringify(classica(kai, tudo)), JSON.stringify(g2(kai, tudo)));
t("o Encontro dá a mesma Defesa e o mesmo dano", [enc(kai, tudo).defesa, enc(kai, tudo).dano.entradas[0].formulaNormal], [classica(kai, tudo).defesa, classica(kai, tudo).dano.entradas[0].formulaNormal]);
t("os atributos do aliado não recalculam o valor do emissor", delta(com(iB_A), def, receptor({ aptidoes: { au: 5 } })), 3);
t("a tradução não muda a ficha nem a sessão do aliado", [kai.feiticos?.some((f) => String(f.id).startsWith("rec_")) ?? false, tudo.buffs.length], [false, 10]);

/* ============================================================ */
/* 7b. OUTRO SISTEMA NO RECEPTOR (criatura do Afty)              */
/* ============================================================ */
/* O pacote foi feito por um personagem (Player) e entra numa CRIATURA: quem decide a disputa é a regra do RECEPTOR. Na criatura o pool é um só. */
const criatura = { ...receptor(), id: "cri", rulesVersion: "afty", core: { ...receptor().core, tipo: "combatente", patamar: "comum" } };
const dC0 = deriveAfty({ ...criatura, combate: { ativo: true } });
const baseC = { ...S.sessaoEmBranco(dC0), combate: { ativo: true }, rodada: 1 };
const deltaC = (...buffs) => def(classica(criatura, { ...baseC, buffs })) - def(classica(criatura, baseC));
t("na criatura, Estilo e Feitiço recebidos também disputam (pool único)", deltaC(iEsc, iEstilo), 2);
t("na criatura, famílias diferentes somam como no personagem", deltaC(iB_A, iEsc, iAux, iHalo), 11);
t("a biblioteca da criatura é dela (a do personagem não muda)", [PA.bibliotecaDaFicha({ ...criatura, pacotesRecebidos: biblio(arqB) }).length, PA.bibliotecaDaFicha(kai).length], [1, 0]);

/* ============================================================ */
/* 8. O CRIADOR NÃO ESCREVE OS CAMPOS NOVOS                      */
/* ============================================================ */
const criador = readFileSync(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url), "utf8");
const salvar = criador.slice(criador.indexOf("delete creature.imitacaoAtivarAoSalvar;"), criador.indexOf("onSave(creature);", criador.indexOf("delete creature.imitacaoAtivarAoSalvar;")));
t("o salvar do criador apaga as duas chaves antes de gravar (o merge conserva as da Ficha)", [salvar.includes("delete creature.pacotesAliados;"), salvar.includes("delete creature.pacotesRecebidos;")], [true, true]);
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
t("a Ficha grava cada campo pela porta de sempre (update com merge)", [app.includes("storage.update(activeCreature.id, { pacotesAliados })"), app.includes("storage.update(activeCreature.id, { pacotesRecebidos })")], [true, true]);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
