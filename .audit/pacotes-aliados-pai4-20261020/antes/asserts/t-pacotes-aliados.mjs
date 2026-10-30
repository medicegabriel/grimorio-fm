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

/* ============================================================ */
/* 9. DEVOLUTIVA DO CODEX (2026-10-20): PA-I1 E PA-I2            */
/* ============================================================ */
/* PA-I1. Um benefício que NÃO vale agora (condição falsa no receptor) não pode cobrir o menor que vale. O caso do Codex pelo caminho real: o suporte
   inclui a Aura do Bastião (+3) e uma definição à mão da MESMA origem com Defesa +5 Só em Combate (a UI permite), exporta, o aliado importa e ativa
   as duas. Fora de combate valia 0 (a base), e não +3. */
const { combateDslVars } = await import(R + "afty-combate.js");
function exportaItens(ficha, emissorId, itens) {
  const { porChave } = FAM.fontesParaAliados(ficha, deriveAfty(ficha), { emissorId });
  const opcoes = itens.map((item) => { const r = FAM.resolverItem(item, porChave); return r.bloqueio || r.indisponivel ? null : FAM.paraArquivo(item.id, r); }).filter(Boolean);
  return PA.montarArquivo({ pacote: { ...PA.novoPacoteDoEmissor("Devolutiva"), id: `pac-dev-${emissorId}` }, emissorId, emissor: { nome: ficha.name, sistema: "player" }, opcoes, agora: "2026-10-20T10:00:00Z" });
}
const bastiaoDeCombate = { nome: "Bastião em Combate", regra: "catalogo", origemId: "aptidao:aura_do_bastiao", beneficios: [{ canal: "defesa", valor: "5", quando: "em_combate" }], duracao: "alcance" };
const { arquivo: arqCond } = exportaItens(suporteA(), "emi-a", [{ id: "b3", fonte: "aptidao|aura_do_bastiao", escolhas: {} }, { id: "b5", fonte: "manual", manual: bastiaoDeCombate }]);
const lidoCond = ler(arqCond);
t("PA-I1: o arquivo leva as duas, o +5 com a condição e a mesma origem", [lidoCond.recusadas.length, lidoCond.pacote.opcoes.map((o) => [o.beneficios[0].valor, o.beneficios[0].quando ?? null, o.acumulo.origemId])], [0, [[3, null, "aptidao:aura_do_bastiao"], [5, "em_combate", "aptidao:aura_do_bastiao"]]]);
const bibCond = biblio(arqCond);
const i3 = inst(bibCond, "Aura do Bastião");
const i5 = inst(bibCond, "Bastião em Combate");
const na = (ativo, ...buffs) => ({ ...base, combate: { ativo }, buffs });
const dDef = (ativo, ...buffs) => def(classica(kai, na(ativo, ...buffs))) - def(classica(kai, na(ativo)));
t("PA-I1: fora de combate vale o +3 (o +5 não cobre), em combate o +5, e fora de novo o +3", [dDef(false, i3, i5), dDef(true, i3, i5), dDef(false, i3, i5)], [3, 5, 3]);
t("PA-I1: a ordem das ativações não muda nada", [dDef(false, i5, i3), dDef(true, i5, i3)], [3, 5]);
t("PA-I1: só o +5 fora de combate não dá nada, e em combate dá +5", [dDef(false, i5), dDef(true, i5)], [0, 5]);
t("PA-I1: fim da fonte maior em combate devolve o +3", [dDef(true, i3, i5), dDef(true, i3)], [5, 3]);
const i3b = { ...i3, id: "i3b", aplicadoPor: "Outro", pacote: { ...i3.pacote, chave: "emi-x:pac-x", emissorNome: "Outro" } };
t("PA-I1: maior inelegível com empate no topo (+3 e +3): +3 fora, +5 em combate", [dDef(false, i3, i3b, i5), dDef(true, i3, i3b, i5)], [3, 5]);
const anFora = calcularRecebidos(kai, na(false, i3, i5), deriveSessao).analise;
const anDentro = calcularRecebidos(kai, na(true, i3, i5), deriveSessao).analise;
t("PA-I1: a análise fora de combate diz que o +5 está fora pela condição e o +3 soma", [anFora[i5.id].defesa.status, anFora[i3.id].defesa.status, anFora[i3.id].defesa.delta], ["condicao", "soma", 3]);
t("PA-I1: em combate o +5 substitui o +3", [anDentro[i5.id].defesa.status, anDentro[i5.id].defesa.perdedor?.valor, anDentro[i3.id].defesa.status], ["substitui", 3, "repete"]);
const linhasGeradas = (s) => calcularRecebidos(kai, s, deriveSessao).sessaoCalc.buffs.filter((b) => b.gerado).map((b) => [b.canal, b.expr, b.quando ?? null]);
t("PA-I1: a condição segue na linha do vencedor até o derive final", [linhasGeradas(na(false, i3, i5)), linhasGeradas(na(true, i3, i5))], [[["defesa", "3", null]], [["defesa", "5", "em_combate"]]]);
t("PA-I1: a clássica, o G2 e o Encontro dão o mesmo derive fora e em combate", [false, true].map((a) => [JSON.stringify(classica(kai, na(a, i3, i5))) === JSON.stringify(g2(kai, na(a, i3, i5))), enc(kai, na(a, i3, i5)).defesa === classica(kai, na(a, i3, i5)).defesa]), [[true, true], [true, true]]);
/* Os outros ramos que escolhem o maior aqui fora: Aura numérica, auxílio e Aura de Dano (dado), com e sem o dado próprio. */
const haloCombate = { ...iHalo, id: "haloCombate", aplicadoPor: "Outro", beneficios: [{ canal: "defesa", valor: 3, quando: "em_combate" }], acumulo: { chave: "aura:auraDefesa|", forca: 3 } };
t("PA-I1, Aura numérica: a de combate (+3) não cobre a de +2 fora de combate", [dDef(false, iHalo, haloCombate), dDef(true, iHalo, haloCombate)], [2, 3]);
const auxCombate = { ...iAux, id: "auxCombate", beneficios: [{ canal: "defesa", valor: 6, quando: "em_combate" }] };
t("PA-I1, auxílio: o mesmo auxílio maior só em combate não apaga o de +4 fora", [dDef(false, iAux, auxCombate), dDef(true, iAux, auxCombate)], [4, 6]);
const d8Combate = { ...iFaiscas, id: "d8Combate", beneficios: [{ canal: "dadosNomeados", alvo: "d8", valor: 1, quando: "em_combate" }], acumulo: { chave: "aura:auraDano|", forca: 8 } };
const formulaNa = (f, ativo, ...buffs) => classica(f, na(ativo, ...buffs)).dano.entradas[0].formulaNormal;
/* A arma do Kai já rola 1d8: a aura de 1d8 em combate vira "2d8". */
t("PA-I1, Aura de Dano: o 1d8 de combate não apaga o 1d6 fora, e em combate fica só o 1d8", [formulaNa(kai, false), formulaNa(kai, false, iFaiscas, d8Combate), formulaNa(kai, true, iFaiscas, d8Combate)], ["1d8 + 3", "1d8 + 1d6 + 3", "2d8 + 3"]);
const formulaPropria = (ativo, ...buffs) => classica(kaiComAura, naAura(na(ativo, ...buffs))).dano.entradas[0].formulaNormal;
const d6Combate = { ...iFaiscas, id: "d6Combate", beneficios: [{ canal: "dadosNomeados", alvo: "d6", valor: 1, quando: "em_combate" }] };
t("PA-I1, Aura de Dano própria (1d4): a recebida de combate só a substitui em combate", [formulaPropria(false, d6Combate).includes("1d4"), formulaPropria(false, d6Combate).includes("1d6"), formulaPropria(true, d6Combate).includes("1d6"), formulaPropria(true, d6Combate).includes("1d4")], [true, false, true, false]);
const escCombate = { ...iEsc, id: "escCombate", beneficios: [{ canal: "defesa", valor: 5, quando: "em_combate" }] };
t("PA-I1, Feitiço (a disputa é do motor): o de combate não cobre o de +2 fora", [dDef(false, iEsc, escCombate), dDef(true, iEsc, escCombate)], [2, 5]);
t("PA-I1: toda condição que um pacote aceita é variável da bancada de combate (a disputa a lê do combate do receptor)", Object.keys(PA.QUANDOS_PACOTE).every((q) => q in combateDslVars({})), true);

/* PA-I2. "Imediatas, cujo benefício irá durar por um ataque ou por uma rodada apenas" (p. 216). O de um ataque não vira 1 rodada: prazo de uso, que a
   virada não encerra. */
const { calcularFeitico } = await import(R + "afty-feiticos.js");
const calcFeitico = (f) => calcularFeitico(f, { nd: 14, nivelConjurador: 10, habilidades: [] });
const comFeiticos = (...feiticos) => { const f = suporteA(); f.feiticos = feiticos; return f; };
const precisao = { id: "g1", nome: "Precisão de Um Ataque", tipo: "auxiliar", nivel: 1, efeitoAux: "ataque", duracaoAux: "imediata", umGolpe: true };
const reacaoDef = { id: "g2", nome: "Aparo", tipo: "auxiliar", nivel: 1, efeitoAux: "defesa", duracaoAux: "imediata", acaoAux: "reacao" };
const multReacao = { id: "g3", nome: "Couraça Dupla", tipo: "auxiliar", nivel: 2, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "reacao", efeitosMult: [{ id: "m1", efeito: "defesa" }, { id: "m2", efeito: "rd" }] };
const multMisto = { id: "g4", nome: "Guarda e Firmeza", tipo: "auxiliar", nivel: 1, multiplosAtivo: true, duracaoMult: "imediata", acaoMult: "reacao", efeitosMult: [{ id: "m3", efeito: "defesa" }, { id: "m4", efeito: "tr" }] };
const umaRodada = { id: "g5", nome: "Impulso", tipo: "auxiliar", nivel: 1, efeitoAux: "ataque", duracaoAux: "imediata" };
const supG = comFeiticos(precisao, reacaoDef, multReacao, multMisto, umaRodada);
const fG = FAM.fontesParaAliados(supG, deriveAfty(supG), { emissorId: "emi-a" });
const resG = (id) => FAM.resolverItem({ fonte: `feitico|${id}`, escolhas: {} }, fG.porChave);
t("PA-I2: o Feitiço de um ataque tem prazo de uso, e não 1 rodada", [resG("g1").duracao, resG("g1").beneficios], [{ tipo: "proximo", texto: "Por Um Ataque" }, [{ canal: "bonusAcerto", valor: 3 }]]);
t("PA-I2: a Reação de Defesa (por um golpe, sem a marca) também", resG("g2").duracao, { tipo: "proximo", texto: "Por Um Ataque" });
t("PA-I2: Múltiplos Efeitos de Reação lê o efeito resolvido (o campo do Feitiço inteiro é falso)", [calcFeitico(multReacao).umGolpe, resG("g3").duracao.tipo], [false, "proximo"]);
/* Mudou em 2026-10-20 (PA-I3, decisão do autor): a parte de uma rodada não é mais texto nas condições, é o prazo próprio do benefício. */
t("PA-I2 e PA-I3: Múltiplos Efeitos que mistura os dois: cada benefício leva o prazo do efeito dele, sem condição de texto", [resG("g4").duracao.tipo, resG("g4").beneficios.map((b) => [b.canal, b.duracao]), resG("g4").condicoes.some((c) => c.endsWith(": Uma Rodada"))], ["proximo", [["defesa", { tipo: "proximo", texto: "Por Um Ataque" }], ["bonusTR", { tipo: "rodadas", rodadas: 1 }]], false]);
t("PA-I2: a Imediata sem ataque continua 1 rodada", [resG("g5").duracao, resG("g5").beneficios.length > 0], [{ tipo: "rodadas", rodadas: 1 }, true]);
const { arquivo: arqG } = exportaItens(supG, "emi-a", [{ id: "u1", fonte: "feitico|g1" }, { id: "u5", fonte: "feitico|g5" }]);
const bibG = biblio(arqG);
t("PA-I2: o arquivo e a biblioteca guardam o prazo de uso", [arqG.opcoes[0].duracao, opcao(bibG, "Precisão de Um Ataque").opcao.duracao], [{ tipo: "proximo", texto: "Por Um Ataque" }, { tipo: "proximo", texto: "Por Um Ataque" }]);
const iUm = inst(bibG, "Precisão de Um Ataque");
const iRod = inst(bibG, "Impulso");
t("PA-I2: a instância não tem rodadas, termina no descanso e diz o prazo", [iUm.rodadas, iUm.terminaNoDescanso, PA.textoDaDuracao(iUm.pacote.duracao)], [null, true, "Por Um Ataque"]);
/* O cartão do G2 lê o prazo de `exemplo.duracao`, que `montarAtivos` monta com `textoDaDuracao` da instância. */
const G2D = await import(R + "ficha/efeitos/g2-dados.js");
const cartao = (inst) => ({ exemplo: { duracao: PA.textoDaDuracao(inst.pacote.duracao) } });
t("PA-I2: o cartão do G2 mostra o prazo curto Um Ataque, e o que a ficha não conta continua de fora", [G2D.prazoRelevante(cartao(iUm), {})?.texto ?? null, G2D.prazoRelevante(cartao(iBastiao), {})], ["Um Ataque", null]);
const r1 = S.proximaRodada(com(iUm, iRod), d0).sessao;
const r2 = S.proximaRodada(r1, d0).sessao;
t("PA-I2: duas viradas sem ataque não encerram o de um ataque, e a de 1 rodada sai na primeira", [r1.buffs.map((b) => b.origemNome), r2.buffs.map((b) => b.origemNome)], [["Precisão de Um Ataque"], ["Precisão de Um Ataque"]]);
t("PA-I2: o bônus continua na conta depois das viradas", delta(r2, (d) => d.dano.entradas[0].acerto), 3);
t("PA-I2: o descanso encerra", S.descansar(r2, d0).buffs.length, 0);
t("PA-I2: sem a instância (o Encerrar do jogador) a conta volta", delta({ ...r2, buffs: r2.buffs.filter((b) => b.id !== iUm.id) }, (d) => d.dano.entradas[0].acerto), 0);
const antigo = JSON.parse(JSON.stringify(arqG));
antigo.opcoes[0].duracao = { tipo: "rodadas", rodadas: 1, texto: "Um Ataque" };
const { arquivo: arqG2 } = exportaItens(supG, "emi-a", [{ id: "u1", fonte: "feitico|g1" }, { id: "u5", fonte: "feitico|g5" }]);
t("PA-I2: o arquivo de antes do conserto é outro conteúdo (reexportar sobe a revisão)", PA.assinaturaDasOpcoes(antigo.opcoes) === PA.assinaturaDasOpcoes(arqG2.opcoes), false);

/* ============================================================ */
/* 10. PA-I3: CADA BENEFÍCIO NO PRÓPRIO PRAZO (autor, 2026-10-20) */
/* ============================================================ */
/* O caso do Codex: Múltiplos Efeitos Imediato de Reação com Defesa (por um golpe) e TR (uma rodada). A Defesa +3 espera o ataque, o Reflexos +2 sai
   na virada, e um não leva o outro, nas duas ordens. */
const CC = await import(R + "afty-combate-conjurador.js");
const ctxU = { nd: 14, nivelConjurador: 10, habilidades: [] };
const mesmaLista = (f) => {
  const e = CC.estadoLigadoDoFeitico(f.id);
  const todos = CC.resolveAuxiliaresAtivos({ feiticos: [f] }, { ativo: true, [e]: true }, [{ id: e, feiticoId: f.id }], ctxU).efeitos;
  return JSON.stringify(CC.efeitosDoAuxiliarPorEfeito(f, ctxU).flatMap((x) => x.efeitos)) === JSON.stringify(todos);
};
t("PA-I3: separar por efeito não muda nada: a união é a lista do resolvedor, linha por linha, em todo Feitiço das fichas de teste", [...suporteA().feiticos, precisao, reacaoDef, multReacao, multMisto, umaRodada].every(mesmaLista), true);
const { arquivo: arqM } = exportaItens(supG, "emi-a", [{ id: "u4", fonte: "feitico|g4" }, { id: "u1", fonte: "feitico|g1" }]);
const lidoM = ler(arqM);
const prazos = (o) => o.beneficios.map((b) => b.duracao?.tipo ?? null);
t("PA-I3: o arquivo e a leitura guardam o prazo de cada benefício", [prazos(arqM.opcoes[0]), lidoM.recusadas.length, prazos(lidoM.pacote.opcoes[0])], [["proximo", "rodadas"], 0, ["proximo", "rodadas"]]);
t("PA-I3: o Feitiço só de um ataque, sem mistura, não ganha prazo por benefício", [prazos(arqM.opcoes[1]), arqM.opcoes[1].duracao.tipo], [[null], "proximo"]);
const comPrazoRuim = (d) => { const a = JSON.parse(JSON.stringify(arqM)); a.opcoes[0].beneficios[1].duracao = d; return ler(a).recusadas?.[0]?.motivo ?? null; };
t("PA-I3: prazo de benefício desconhecido ou inválido recusa a opção, com o motivo", [comPrazoRuim({ tipo: "eterno" }), comPrazoRuim({ tipo: "rodadas", rodadas: 0 })].map((x) => !!x && /Duração/.test(x)), [true, true]);
const arqSemPrazo = JSON.parse(JSON.stringify(arqM));
arqSemPrazo.opcoes[0].beneficios.forEach((b) => delete b.duracao);
t("PA-I3: o arquivo de antes (sem prazo por benefício) continua lido, com o prazo da opção", [ler(arqSemPrazo).recusadas.length, prazos(ler(arqSemPrazo).pacote.opcoes[0])], [0, [null, null]]);
const bibM = biblio(arqM);
const iM = inst(bibM, "Guarda e Firmeza");
t("PA-I3: a instância inteira não conta rodadas, o TR leva o contador dele, e o descanso encerra", [iM.rodadas, iM.terminaNoDescanso, iM.beneficios.map((b) => [b.canal, b.rodadas ?? null])], [null, true, [["defesa", null], ["bonusTR", 1]]]);
t("PA-I3: as partes, a de rodadas primeiro", PA.partesDaInstancia(iM).map((p) => [p.chave, p.contada, p.rodadas, p.beneficios.map((b) => b.canal), PA.textoDaParte(p)]), [["rodadas", true, 1, ["bonusTR"], "1 Rodada"], ["proximo|Por Um Ataque", false, null, ["defesa"], "Por Um Ataque"]]);
t("PA-I3: o texto de cada benefício diz o prazo dele", iM.beneficios.map((b) => PA.textoDoBeneficio(b, FAM.nomeDoAlvo)), ["Defesa +3 · Por Um Ataque", "TR de Reflexos +2 · 1 Rodada"]);
const refl = (d) => tr(d, "reflexos");
const sM = com(iM);
t("PA-I3: ligada, Defesa +3 e Reflexos +2", [delta(sM), delta(sM, refl)], [3, 2]);
const v1M = S.proximaRodada(sM, d0);
t("PA-I3, ordem 1: a virada tira só o TR (Reflexos volta), e a Defesa de um ataque fica", [delta(v1M.sessao), delta(v1M.sessao, refl), v1M.sessao.buffs.map((b) => b.beneficios.map((x) => x.canal))], [3, 0, [["defesa"]]]);
t("PA-I3, ordem 1: o aviso da virada diz a parte que acabou", v1M.expirou.map((x) => x.nome), ["Guarda e Firmeza (TR de Reflexos)"]);
const v3M = S.proximaRodada(S.proximaRodada(v1M.sessao, d0).sessao, d0).sessao;
t("PA-I3, ordem 1: mais duas viradas sem ataque, a Defesa continua", [delta(v3M), v3M.buffs.length], [3, 1]);
t("PA-I3, ordem 1: encerrar a parte de um ataque que sobrou encerra a instância (sem parte, é o Encerrar de sempre)", PA.semParteDaInstancia(v3M.buffs[0], "proximo|Por Um Ataque"), null);
const usado = { ...sM, buffs: sM.buffs.map((b) => PA.semParteDaInstancia(b, "proximo|Por Um Ataque")).filter(Boolean) };
t("PA-I3, ordem 2: encerrar a parte de um ataque tira a Defesa e deixa o TR com o prazo dele", [delta(usado), delta(usado, refl), usado.buffs[0].beneficios.map((b) => [b.canal, b.rodadas])], [0, 2, [["bonusTR", 1]]]);
const v1u = S.proximaRodada(usado, d0);
t("PA-I3, ordem 2: a virada tira o TR, a instância sai, e o aviso usa o nome da opção", [delta(v1u.sessao, refl), v1u.sessao.buffs.length, v1u.expirou.map((x) => x.nome)], [0, 0, ["Guarda e Firmeza"]]);
t("PA-I3: a clássica, o G2 e o Encontro dão o mesmo derive, ligada, depois da virada e depois do ataque", [sM, v1M.sessao, usado].map((s) => JSON.stringify(classica(kai, s)) === JSON.stringify(g2(kai, s)) && refl(enc(kai, s)) === refl(classica(kai, s))), [true, true, true]);
const relida = S.normalizaSessao(JSON.parse(JSON.stringify(sM)), d0);
t("PA-I3: a sessão gravada e relida conserva o prazo e o contador de cada benefício", JSON.stringify(relida.buffs[0].beneficios), JSON.stringify(iM.beneficios));
t("PA-I3: o descanso encerra a instância inteira", S.descansar(sM, d0).buffs.length, 0);
t("PA-I3: reativar é uma ativação nova, com os dois prazos de novo", inst(bibM, "Guarda e Firmeza").beneficios.map((b) => b.rodadas ?? null), [null, 1]);
/* A instância antiga, ativada de um arquivo sem prazo por benefício, não é reescrita: segue com o prazo da opção (o de uso) até ser encerrada. */
const xM = opcao(bibM, "Guarda e Firmeza");
const iVelha = PA.instanciaDaOpcao(xM.entrada, { ...xM.opcao, beneficios: xM.opcao.beneficios.map(({ duracao: _d, ...b }) => b) }, { id: "velha" });
t("PA-I3: a instância antiga não é reescrita pela virada", JSON.stringify(S.proximaRodada(com(iVelha), d0).sessao.buffs[0]), JSON.stringify(iVelha));
t("PA-I3: o cartão do G2 mostra o prazo da parte que acaba antes (a de rodadas)", G2D.prazoRelevante({ exemplo: { duracao: PA.textoDaParte(PA.partesDaInstancia(iM)[0]) } }, {})?.texto ?? null, "1 Rodada");

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
