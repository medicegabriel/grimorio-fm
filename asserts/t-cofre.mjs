/* Cofre: o texto protegido por senha. A propriedade que este assert existe para
   prender é a do meio: a ficha trancada NÃO CONTÉM o texto. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const C = await import(R + "afty-cofre.js");
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const { valorCanal } = await import(R + "afty-efeitos.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

/* ---------- A ficha de teste ----------
   Texto inventado e RECONHECÍVEL, para o teste de vazamento poder procurá-lo
   byte a byte no JSON. */
const SEGREDO_FEITICO = "ZZTOPSEGREDOFEITICOZZ";
const SEGREDO_NOME = "ZZNOMESECRETOZZ";
const SEGREDO_TECNICA = "ZZTOPSEGREDOTECNICAZZ";
const SEGREDO_ADDON = "ZZTOPSEGREDOADDONZZ";
const SENHA = "uma frase longa de teste 12345";

const pacote = A.normalizarPacote({
  id: "pacote-de-teste",
  nome: "Pacote de Teste",
  versao: "1.0.0",
  paraRaw: "afty",
  funcionamentos: [
    { id: "fb_um", nome: "Mecânica Secreta", descricao: SEGREDO_ADDON },
  ],
});

const fichaBase = () => {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tecnicaDescricao = SEGREDO_TECNICA;
  c.core.funcionamentosAdicionais = [
    { id: "fb_local", nome: "Segundo Funcionamento", descricao: "texto local secreto" },
  ];
  c.especializacoes = [{ id: "conjurador", nivel: 10 }];
  c.feiticos = [
    {
      id: "feit_a", nome: SEGREDO_NOME, tipo: "dano", nivel: 3,
      descricao: SEGREDO_FEITICO, conjuracaoTexto: "Ação Comum",
      resolucao: "tr", alvo: "unico", acao: "comum", subtipo: "nenhum",
      trocas: { dados: 0, acerto: 0, cd: 0, alcance: 0, area: 0, empurraoDados: 0 },
      condicoes: [],
    },
    {
      /* ⚠ VAZIO DE VERDADE, nome incluído. O nome de um Feitiço É conteúdo
         protegido, então um Feitiço só sem descrição continua entrando no
         cofre. Quem não entra é o recém-criado, que nasce sem nome nenhum. */
      id: "feit_b", nome: "", tipo: "dano", nivel: 1,
      descricao: "", conjuracaoTexto: "",
      resolucao: "tr", alvo: "unico", acao: "comum", subtipo: "nenhum",
      trocas: { dados: 0, acerto: 0, cd: 0, alcance: 0, area: 0, empurraoDados: 0 },
      condicoes: [],
    },
  ];
  c.addons = [JSON.parse(JSON.stringify(pacote))];
  return c;
};

/* ---------- Trancar ---------- */
const aberta = fichaBase();
const trancada = await C.trancar(aberta, SENHA);

t("a ficha de entrada não é tocada", aberta.cofre, undefined);
t("a ficha de entrada mantém o texto", aberta.feiticos[0].descricao, SEGREDO_FEITICO);
t("a trancada ganha cofre", C.cofreTrancado(trancada), true);
t("a aberta não tem cofre", C.cofreTrancado(aberta), false);
t("o cofre conta os Feitiços com texto", C.resumoDoCofre(trancada).feiticos, 1);
t("o cofre conta os Funcionamentos", C.resumoDoCofre(trancada).funcionamentos, 3);
t("a senha não é gravada", JSON.stringify(trancada).includes(SENHA), false);
t("o KDF fica declarado", trancada.cofre.kdf.algo, "PBKDF2-SHA256");

/* ---------- ⚠ A PROPRIEDADE CENTRAL ----------
   Não é "a tela esconde", é "o arquivo não contém". Se este assert cair, o
   Cofre virou teatro e o conteúdo pago está viajando em claro. */
const cru = JSON.stringify(trancada);
for (const [nome, segredo] of [
  ["descrição do Feitiço", SEGREDO_FEITICO],
  ["nome do Feitiço", SEGREDO_NOME],
  ["texto da Técnica", SEGREDO_TECNICA],
  ["Funcionamento de addon", SEGREDO_ADDON],
  ["Funcionamento local", "texto local secreto"],
]) {
  t(`o JSON trancado NÃO contém: ${nome}`, cru.includes(segredo), false);
}

t("o marcador toma o lugar do nome", trancada.feiticos[0].nome, "Feitiço protegido 1");
t("Feitiço sem texto nenhum fica de fora", trancada.feiticos[1].nome, "");

/* ---------- Abrir ---------- */
const conteudo = await C.abrir(trancada, SENHA);
t("abre com a senha certa", conteudo["feitico:feit_a"].descricao, SEGREDO_FEITICO);

let erro = null;
try { await C.abrir(trancada, "senha errada"); } catch (e) { erro = e.message; }
t("senha errada é recusada", erro, "Senha incorreta.");
t("senhaConfere diz não para a errada", await C.senhaConfere(trancada, "x"), false);
t("senhaConfere diz sim para a certa", await C.senhaConfere(trancada, SENHA), true);

/* ---------- Devolver ---------- */
const revelada = C.comTextoAberto(trancada, conteudo);
t("o texto volta inteiro", revelada.feiticos[0].descricao, SEGREDO_FEITICO);
t("o nome volta inteiro", revelada.feiticos[0].nome, SEGREDO_NOME);
t("a técnica volta inteira", revelada.core.tecnicaDescricao, SEGREDO_TECNICA);
t("o Funcionamento de addon volta", revelada.addons[0].funcionamentos[0].descricao, SEGREDO_ADDON);
t("revelar para LER mantém o cofre", C.cofreTrancado(revelada), true);

const editavel = await C.destrancarDeVez(trancada, SENHA);
t("destrancar de vez tira o cofre", C.cofreTrancado(editavel), false);
t("destrancar de vez devolve o texto", editavel.feiticos[0].descricao, SEGREDO_FEITICO);

/* ⚠ Ida e volta EXATA. Se trancar e abrir não derem a mesma ficha, o Cofre come
   conteúdo do dono, que é pior que não proteger nada. */
t("ida e volta é idêntica à original", JSON.stringify(editavel), JSON.stringify(aberta));

/* ---------- Os NÚMEROS não mudam ----------
   O Cofre leva só texto de propósito: quem recebe a ficha para avaliar precisa
   dos números. Se um número mudar ao trancar, algum campo de regra entrou na
   lista de campos protegidos por engano. */
A.aplicarAddons([pacote]);
const dA = deriveAfty(aberta);
const dT = deriveAfty(trancada);
for (const [nome, ler] of [
  ["PV", (d) => d.pe],
  ["PE", (d) => d.pe],
  ["Defesa", (d) => d.defesa],
  ["CD", (d) => d.cd],
  ["vagas de Feitiço", (d) => valorCanal(d.efeitos, "vagasFeitico")],
  ["Feitiços contados", (d) => d.feiticos?.length ?? 0],
]) {
  t(`trancar não mexe em: ${nome}`, ler(dT), ler(dA));
}

/* ---------- Os Funcionamentos continuam CHEGANDO na ficha ----------
   O que muda é o texto, e não a existência: a linha continua lá, com marcador. */
const fbsT = funcionamentosDaFicha(trancada);
const fbsA = funcionamentosDaFicha(aberta);
t("mesma quantidade de Funcionamentos", fbsT.length, fbsA.length);
t("o de addon vem com marcador", fbsT.find((f) => f.deAddon)?.descricao,
  "Conteúdo protegido por senha. Peça a senha ao dono da ficha para ler este texto.");
A.aplicarAddons([]);

/* ---------- Memória de sessão ---------- */
C.esquecerTudo();
t("nada aberto no começo", C.lerAberto("x"), null);
C.guardarAberto("x", conteudo);
t("guarda e lê", C.lerAberto("x")["feitico:feit_a"].descricao, SEGREDO_FEITICO);
C.esquecerAberto("x");
t("esquece", C.lerAberto("x"), null);

/* ---------- Recusas ---------- */
let e2 = null;
try { await C.trancar(trancada, SENHA); } catch (e) { e2 = e.message; }
t("não tranca duas vezes", e2, "Esta ficha já tem um Cofre trancado.");

let e3 = null;
try { await C.trancar(aberta, ""); } catch (e) { e3 = e.message; }
t("recusa senha vazia", e3, "Escreva uma senha para trancar o Cofre.");

let e4 = null;
try { await C.trancar(createBlankAfty(), SENHA); } catch (e) { e4 = e.message; }
t("recusa ficha sem texto para guardar", e4,
  "Não há texto de Feitiço nem de Funcionamento Básico para guardar.");

/* ---------- ⚠ O CATÁLOGO DOS ADDONS, que era o buraco ----------
   A origem e os Feitiços do autor vêm POR ADDON e são conteúdo pago. O texto
   deles entra no Cofre, e os NOMES ficam (autor, 2026-09-08). */
const comCatalogo = fichaBase();
comCatalogo.addons = [A.normalizarPacote({
  id: "com-catalogo",
  nome: "Pacote com Catálogo",
  versao: "1.0.0",
  paraRaw: "afty",
  descricao: "ZZDESCRICAODOPACOTEZZ",
  acrescenta: {
    origens: [{
      id: "orig_x",
      nome: "Origem Secreta",
      lore: "ZZLOREDAORIGEMZZ",
      restricoes: ["ZZRESTRICAOUMZZ", "ZZRESTRICAODOISZZ"],
      caracteristicas: [{
        id: "c1", nome: "Característica Secreta", descricao: "ZZTEXTODACARACTERISTICAZZ",
        bonus: { distribuir: 1, maxPorAtributo: 1, entre: ["forca", "destreza"] },
      }],
    }],
    talentos: [{
      id: "tal_x", nome: "Talento Secreto", grupo: "geral",
      descricao: "ZZTEXTODETALENTOZZ",
      escolha: {
        id: "esc_x", label: "Escolha",
        opcoes: [{ id: "tal_estudo_au", nome: "Aura", descricao: "ZZTEXTODAOPCAOZZ" }],
      },
      requisitos: [{ tipo: "nota", texto: "ZZNOTADEREQUISITOZZ" }],
      efeitos: [{ canal: "cd", expr: "piso(bt / 2)" }],
    }],
  },
})];

const catTrancada = await C.trancar(comCatalogo, SENHA);
const cruCat = JSON.stringify(catTrancada);

for (const [nome, segredo] of [
  ["descrição do pacote", "ZZDESCRICAODOPACOTEZZ"],
  ["lore da origem", "ZZLOREDAORIGEMZZ"],
  ["restrição da origem", "ZZRESTRICAOUMZZ"],
  ["texto da característica", "ZZTEXTODACARACTERISTICAZZ"],
  ["texto do talento", "ZZTEXTODETALENTOZZ"],
  ["texto da opção aninhada", "ZZTEXTODAOPCAOZZ"],
  ["nota de requisito", "ZZNOTADEREQUISITOZZ"],
]) {
  t(`o catálogo trancado NÃO contém: ${nome}`, cruCat.includes(segredo), false);
}

/* ⚠ OS NOMES FICAM. É o pedido do autor, e não um esquecimento. */
t("o nome da Origem fica à vista", cruCat.includes("Origem Secreta"), true);
t("o nome do Talento fica à vista", cruCat.includes("Talento Secreto"), true);
t("o nome da Característica fica à vista", cruCat.includes("Característica Secreta"), true);

/* ⚠ E A ESTRUTURA NÃO É TOCADA. `entre` é lista de atributos e `expr` é DSL:
   os dois passam de 40 caracteres e cairiam numa censura por tamanho. */
const talTrancado = catTrancada.addons[0].acrescenta.talentos[0];
const origTrancada = catTrancada.addons[0].acrescenta.origens[0];
t("o `expr` do Motor continua inteiro", talTrancado.efeitos[0].expr, "piso(bt / 2)");
t("o `entre` do bônus continua inteiro",
  origTrancada.caracteristicas[0].bonus.entre, ["forca", "destreza"]);
t("a lista de restrições mantém o tamanho", origTrancada.restricoes.length, 2);
t("e vira marcador", origTrancada.restricoes, ["Protegido", "Protegido"]);

/* Ida e volta do catálogo também tem de ser exata. */
const catVolta = await C.destrancarDeVez(catTrancada, SENHA);
t("ida e volta do catálogo é idêntica",
  JSON.stringify(catVolta), JSON.stringify(comCatalogo));

/* ---------- O vigia ---------- */
t("o vigia não acha nada de sobra", C.textoLongoRestante(catTrancada), []);
const vazando = JSON.parse(JSON.stringify(catTrancada));
vazando.addons[0].acrescenta.talentos[0].campoNovoQualquer =
  "um campo de texto que o Cofre ainda não conhece e que passa dos sessenta caracteres";
t("mas acha um campo de texto novo", C.textoLongoRestante(vazando).length, 1);
t("e diz onde", C.textoLongoRestante(vazando)[0].caminho.endsWith(".campoNovoQualquer"), true);

/* ---------- Aviso de senha ---------- */
t("senha curta é acusada", C.avaliaSenha("1234").nivel, "fraca");
t("senha longa passa", C.avaliaSenha("uma frase bem longa aqui").nivel, "boa");

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
