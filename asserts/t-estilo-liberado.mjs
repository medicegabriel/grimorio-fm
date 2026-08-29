/* LIBERAÇÃO por Addon: o campo `libera` do pacote, e o primeiro caso dele, que
   é soltar o Novo Estilo da Sombra fora do Sem Técnica.

   Pedido do autor em 2026-08-21: "liberar Estilo das Sombras mesmo que as
   pessoas tenham Feitiços e não sejam Sem Técnica". As três decisões dele no
   mesmo dia: a liberação vem de TER o addon (não de um Talento), o piso de
   Nível 4 continua valendo, e o Domínio Simples é comprado normalmente. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const ES = await import(R + "afty-estilo-sombras.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("./exemplo-estilo-liberado.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O CAMPO `libera`                                           */
/* ============================================================ */

t("existem 4 liberacoes hoje", AD.LIBERACOES.length, 4);
t("os ids", AD.LIBERACOES.map((l) => l.id),
  ["estiloSombras", "gemeosSemTecnica", "qualificaSemTecnica", "gemeosMaldicao"]);
t("SEM_LIBERACOES e vazio", AD.SEM_LIBERACOES, []);

/* ⚠ id com 2+ caracteres: o ID_PACOTE_OK recusa um caractere so, e um id curto
   demais somava um segundo problema e mascarava o que este bloco mede. */
const base = { id: "pp", nome: "P", acrescenta: {} };
t("pacote sem libera vira lista vazia", AD.normalizarPacote(base).libera, []);
t("libera lixo vira vazio", AD.normalizarPacote({ ...base, libera: "estiloSombras" }).libera, []);
t("libera nao repete",
  AD.normalizarPacote({ ...base, libera: ["estiloSombras", "estiloSombras"] }).libera, ["estiloSombras"]);

/* Erro de digitacao e REPROVADO, e nao vira liberacao que simplesmente nao liga. */
const probs = AD.validarPacote({ ...base, libera: ["estiloSombra"] });
t("liberacao desconhecida e reprovada", probs.length, 1);
t("e a mensagem diz o que existe", probs[0].includes("estiloSombras"), true);

/* ⚠ PACOTE QUE SO LIBERA E LEGITIMO. Antes de 2026-08-21 o validador exigia
   `acrescenta` com alguma familia, e este pacote nao acrescenta uma linha. */
t("o pacote do autor passa", AD.validarPacote(PACOTE), []);
/* ⚠ O PACOTE DEIXOU DE SER SO-LIBERACAO em 2026-08-22: o autor mandou conteudo
   junto (a Linha de Treinamento, dois Talentos e tres remendos). O que este
   bloco media continua medido logo abaixo, com um pacote de mentira. */
t("agora ele acrescenta duas familias", Object.keys(PACOTE.acrescenta).sort(),
  ["talentos", "treinamentos"]);
t("e substitui duas", Object.keys(PACOTE.substitui).sort(), ["aptidoes", "talentos"]);
t("pacote SO com libera continua legitimo",
  AD.validarPacote({ id: "so-libera", nome: "S", libera: ["estiloSombras"] }), []);
t("pacote que nao faz NADA continua reprovado",
  AD.validarPacote({ id: "vazio", nome: "V", acrescenta: {} }).length, 1);

/* ============================================================ */
/* 2. `liberacoesDaCriatura`                                     */
/* ============================================================ */

t("criatura sem addon nao libera nada", AD.liberacoesDaCriatura(createBlankAfty()), []);
t("criatura nula nao quebra", AD.liberacoesDaCriatura(null), []);
t("addon sem libera nao libera", AD.liberacoesDaCriatura({ addons: [{ id: "a" }] }), []);
t("addon com libera libera",
  AD.liberacoesDaCriatura({ addons: [{ libera: ["estiloSombras"] }] }), ["estiloSombras"]);
t("id inventado e ignorado", AD.liberacoesDaCriatura({ addons: [{ libera: ["voar"] }] }), []);
t("dois addons com o mesmo nao duplicam",
  AD.liberacoesDaCriatura({ addons: [{ libera: ["estiloSombras"] }, { libera: ["estiloSombras"] }] }),
  ["estiloSombras"]);

/* ⚠ `libera` E `permite` SAO CAMPOS DIFERENTES e nao se contaminam. */
t("permite nao vira libera",
  AD.liberacoesDaCriatura({ addons: [{ permite: ["concessao"] }] }), []);
t("libera nao vira permite",
  AD.primitivasDaCriatura({ addons: [{ libera: ["estiloSombras"] }] }), []);

/* ============================================================ */
/* 3. O PORTAO EM SI                                             */
/* ============================================================ */

t("Sem Tecnica no 4 tem", ES.estiloDisponivel("sem_tecnica", 4), true);
t("Sem Tecnica no 3 nao tem", ES.estiloDisponivel("sem_tecnica", 3), false);
t("outra origem no 4 nao tem", ES.estiloDisponivel("herdado", 4), false);
t("outra origem no 4 COM a liberacao tem", ES.estiloDisponivel("herdado", 4, true), true);

/* ⚠ O PISO DE NIVEL NAO CAI COM A LIBERACAO (decisao do autor). Sao duas
   travas independentes: a origem diz QUEM, o nivel diz A PARTIR DE QUANDO. */
t("liberado no 3 continua sem", ES.estiloDisponivel("herdado", 3, true), false);
t("liberado no 1 continua sem", ES.estiloDisponivel("inato", 1, true), false);
t("liberado no 4 tem", ES.estiloDisponivel("inato", 4, true), true);

/* ============================================================ */
/* 4. PONTA A PONTA, PELO deriveAfty                             */
/* ============================================================ */

const criatura = (addons, { nd = 12, origem = "herdado" } = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.tipo = "combatente";
  c.core.origem = { id: origem };
  c.especializacoes = [{ id: "lutador", nivel: nd }];
  c.addons = addons;
  return c;
};

AD.limparAddons();
AD.aplicarAddons([PACOTE]);

const semAddon = deriveAfty(criatura([]));
const comAddon = deriveAfty(criatura([PACOTE]));

t("sem o addon, o Estilo esta fechado", semAddon.estilo.disponivel, false);
t("com o addon, o Estilo ABRE", comAddon.estilo.disponivel, true);
t("o derivado reporta as liberacoes", comAddon.liberacoes,
  ["estiloSombras", "gemeosSemTecnica", "qualificaSemTecnica"]);
t("criatura raw nao reporta nada", semAddon.liberacoes, []);

/* O Sem Tecnica continua funcionando exatamente como antes. */
t("Sem Tecnica sem addon continua tendo",
  deriveAfty(criatura([], { origem: "sem_tecnica" })).estilo.disponivel, true);

/* ⚠ O PISO DE NIVEL, medido pelo deriveAfty de verdade. */
t("com o addon no ND 3 continua fechado",
  deriveAfty(criatura([PACOTE], { nd: 3 })).estilo.disponivel, false);
t("com o addon no ND 4 abre",
  deriveAfty(criatura([PACOTE], { nd: 4 })).estilo.disponivel, true);

/* ⚠ A LIBERACAO NAO MEXE EM NUMERO NENHUM POR SI SO. Ela abre uma porta: quem
   nao entrou por ela continua com a mesma ficha. */
for (const k of ["hp", "pe", "defesa", "cd", "rdGeral", "movimento", "iniciativa", "atencao"]) {
  t(`liberar nao mexe em ${k}`, comAddon[k], semAddon[k]);
}
t("nem no orcamento", comAddon.orcamentoHabilidades.total, semAddon.orcamentoHabilidades.total);

/* ⚠ O DOMINIO SIMPLES NAO VEM JUNTO (decisao do autor). Sem ele, o Estilo abre
   com ZERO vaga de imbuicao, e e isso que a criatura tem de ver. */
t("o addon NAO concede o Dominio Simples",
  (comAddon.aptidoesEscolhidas ?? []).includes("dominio_simples"), false);
t("e por isso as vagas de imbuicao sao zero", comAddon.estilo.vagas, 0);

/* Com o Dominio comprado a mao, as vagas aparecem. E o caminho que o autor
   escolheu: quem tem Feiticos paga a aptidao como todo mundo. */
const comDominio = criatura([PACOTE]);
comDominio.aptidoesAmaldicoadas = ["dominio_simples"];
comDominio.aptidoes = { ...comDominio.aptidoes, dom: 3 };
const dDom = deriveAfty(comDominio);
t("com Dominio comprado, o Estilo continua aberto", dDom.estilo.disponivel, true);
t("e ganha vaga de imbuicao", dDom.estilo.vagas > 0, true);

/* ============================================================ */
/* 5. CONHECER UMA TECNICA DE ESTILO                             */
/* ============================================================ */
/* A prova final: uma criatura de origem comum, com o addon, conhece uma Tecnica
   de Estilo e ela CONTA no orcamento, igual a um Feitico. */

const tabela = ES.TECNICAS_TABELA?.[0];
if (tabela) {
  const comTecnica = criatura([PACOTE]);
  comTecnica.estilosSombra = [{ id: tabela.id, tipo: "tabela" }];
  const dT = deriveAfty(comTecnica);
  t("a Tecnica de Estilo entra na ficha", dT.estilo.conhecidas.length, 1);
  t("e gasta o contador, igual a um Feitico",
    dT.orcamentoHabilidades.estilos, 1);
  /* ⚠ SEM O ADDON A TECNICA CONTINUA GRAVADA, e some so da CONTA. E a convencao
     do projeto ("a Tecnica gravada numa ficha que perdeu o acesso nao e
     apagada: ela some da conta e volta sozinha se o acesso voltar"), a mesma do
     aparo de niveis de Aptidao. Desinstalar o addon nao destroi a ficha. */
  const semAcesso = deriveAfty({ ...comTecnica, addons: [] });
  t("sem o addon a Tecnica CONTINUA gravada", semAcesso.estilo.conhecidas.length, 1);
  t("mas sai da conta", semAcesso.orcamentoHabilidades.estilos, 0);
  t("e o Estilo fecha", semAcesso.estilo.disponivel, false);
  /* ⚠ E a ficha sem acesso AVISA em vez de ficar muda, com a mensagem que cita
     o Addon (ela dizia so "e do Sem Tecnica" ate 2026-08-21). */
  const avisos = semAcesso.estilo.avisos;
  t("a ficha sem acesso avisa", avisos.length > 0, true);
  t("e o aviso cita o Addon", avisos.some((a) => a.includes("Addon")), true);
}

/* ============================================================ */
/* 6. A QUARTA TRAVA: O CARD APARECER NA ABA                     */
/* ============================================================ */
/* ⚠ ESTE BLOCO EXISTE PORQUE O BUG ACONTECEU. Com o motor ja liberando, o card
   continuou sem ser montado: a aba Habilidades do criador ramifica por ORIGEM,
   e so o ramo do Sem Tecnica montava o Estilo. O autor viu no deploy e mandou
   print (2026-08-21). A decisao saiu de dentro do JSX e virou funcao aqui, para
   deixar de ser intestavel. */

const est = (disponivel, quantasConhecidas = 0) => ({
  disponivel,
  conhecidas: Array.from({ length: quantasConhecidas }, (_, i) => ({ id: `t${i}` })),
});

/* Sem Tecnica: SEMPRE, inclusive trancado. A mensagem de "destrava no Nivel 4"
   e o que diz a ele que o Estilo existe. */
t("Sem Tecnica com acesso ve", ES.mostraCardEstilo("sem_tecnica", est(true)), true);
t("Sem Tecnica TRANCADO ainda ve", ES.mostraCardEstilo("sem_tecnica", est(false)), true);

/* As outras origens: so com a liberacao. Card trancado na tela de quem nunca
   vai ter e o mesmo erro do card de Concessao. */
t("outra origem sem nada NAO ve", ES.mostraCardEstilo("herdado", est(false)), false);
t("outra origem liberada ve", ES.mostraCardEstilo("herdado", est(true)), true);
t("Restringido sem nada NAO ve", ES.mostraCardEstilo("restringido", est(false)), false);
t("Restringido liberado ve", ES.mostraCardEstilo("restringido", est(true)), true);

/* ⚠ Com Tecnica GRAVADA o card volta mesmo sem acesso, senao desinstalar o
   addon prenderia a linha morta na ficha sem tela para remove-la. */
t("addon removido, mas com Tecnica gravada, AINDA ve",
  ES.mostraCardEstilo("herdado", est(false, 1)), true);
t("sem acesso e sem Tecnica nenhuma nao ve",
  ES.mostraCardEstilo("herdado", est(false, 0)), false);

/* Entrada faltando nao quebra a tela. */
t("estilo indefinido nao quebra", ES.mostraCardEstilo("herdado", undefined), false);
t("origem nula com acesso ve", ES.mostraCardEstilo(null, est(true)), true);

/* ⚠ A TRAVA DA TELA TEM DE CONCORDAR COM A DO MOTOR. E o assert que fecha o
   buraco: as duas medidas na MESMA criatura derivada de verdade. */
AD.aplicarAddons([PACOTE]);
const dCom = deriveAfty(criatura([PACOTE]));
const dSem = deriveAfty(criatura([]));
t("motor libera e a tela mostra",
  [dCom.estilo.disponivel, ES.mostraCardEstilo("herdado", dCom.estilo)], [true, true]);
t("motor fecha e a tela esconde",
  [dSem.estilo.disponivel, ES.mostraCardEstilo("herdado", dSem.estilo)], [false, false]);

/* ============================================================ */
/* 7. GEMEOS EM VERDADEIRAS ORIGENS                              */
/* ============================================================ */
/* Segunda liberacao do mesmo pacote (autor, 2026-08-21): o Gemeo passa a poder
   copiar Estudos Dedicados OU Empenho Implacavel do Sem Tecnica, que o texto
   proibe. "E para escolher so uma, porem deixar as duas como opcao". */

const OR = await import(R + "afty-origens.js");

t("a liberacao existe", AD.LIBERACOES.some((l) => l.id === "gemeosSemTecnica"), true);
t("o pacote pede as tres", PACOTE.libera,
  ["estiloSombras", "gemeosSemTecnica", "qualificaSemTecnica"]);
t("e passa no validador", AD.validarPacote(PACOTE), []);

const gemeo = (addons) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.core.origem = { id: "gemeos", escolhas: {} };
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.addons = addons;
  return c;
};

const opcoesDe = (criatura) => {
  const vo = OR.caracteristicasEfetivas(criatura)
    .find((c) => c.escolha?.id === "verdadeiras_origens");
  return (vo?.escolha?.opcoes ?? []).map((o) => o.id);
};

const semLib = opcoesDe(gemeo([]));
const comLib = opcoesDe(gemeo([PACOTE]));

t("sem o addon a lista NAO tem Sem Tecnica",
  semLib.some((id) => id.includes("sem_tecnica")), false);
t("com o addon TEM", comLib.some((id) => id.includes("sem_tecnica")), true);

/* ⚠ EXATAMENTE AS DUAS QUE O AUTOR NOMEOU, e nao por sorte: o Sem Tecnica tem
   tres caracteristicas, e a terceira e o Bonus em Atributo, que o filtro
   generico ja tira de TODA origem. */
const novas = comLib.filter((id) => !semLib.includes(id));
t("o addon acrescenta 2 opcoes", novas.length, 2);
t("e sao Estudos Dedicados e Empenho Implacavel",
  novas.map((id) => id.replace("vo_sem_tecnica_", "")).sort(),
  ["empenho_implacavel", "estudos_dedicados"]);
t("o Bonus em Atributo NAO entra",
  novas.some((id) => id.includes("bonus_atributo")), false);

/* ⚠ AS OUTRAS TRES PROIBIDAS CONTINUAM FORA. A liberacao tira uma da lista, e
   so ela. */
for (const proibida of ["derivado", "maldicao", "gemeos"]) {
  t(`${proibida} continua proibida`, comLib.some((id) => id.startsWith(`${proibida}:`)), false);
}

/* ⚠ O RESTO DA LISTA NAO PODE TER MUDADO. */
t("nenhuma opcao antiga sumiu", semLib.every((id) => comLib.includes(id)), true);

/* ⚠ CONTINUA SENDO UMA SO ESCOLHA. O `vagas: 1` nao foi tocado. */
const vagasDe = (criatura) => OR.caracteristicasEfetivas(criatura)
  .find((c) => c.escolha?.id === "verdadeiras_origens")?.escolha?.vagas;
t("a vaga continua 1 sem o addon", vagasDe(gemeo([])), 1);
t("e continua 1 COM o addon", vagasDe(gemeo([PACOTE])), 1);

/* ⚠ O CATALOGO NAO PODE TER SIDO SUJADO. A criatura com addon e a sem sao
   derivadas na mesma sessao, e a lista de uma nao pode vazar para a outra. */
t("a criatura sem addon continua limpa DEPOIS da com",
  opcoesDe(gemeo([])).some((id) => id.includes("sem_tecnica")), false);

/* ---- ponta a ponta: escolher e RECEBER ---- */
const idEmpenho = comLib.find((id) => id.endsWith("empenho_implacavel"));
t("achei o id do Empenho", !!idEmpenho, true);

const comEmpenho = gemeo([PACOTE]);
comEmpenho.core.origem.escolhas = { verdadeiras_origens: [idEmpenho] };
const dEmp = deriveAfty(comEmpenho);

/* ⚠ A copiada entra com o id PREFIXADO (`vo_`), para nao colidir com a
   caracteristica propria de quem ja a tivesse. */
t("a caracteristica copiada entra na ficha",
  OR.caracteristicasEfetivas(comEmpenho).some((c) => c.id === "vo_empenho_implacavel"), true);
t("e ela diz de onde veio",
  OR.caracteristicasEfetivas(comEmpenho)
    .find((c) => c.id === "vo_empenho_implacavel")?.verdadeiraOrigem, "Sem Técnica");

/* ⚠ E ELA E MECANICA DE VERDADE: o Empenho concede o Dominio Simples no ND 4,
   ignorando o pre-requisito. E o que resolve a falta de vaga de imbuicao que o
   Estilo tinha sozinho. */
t("o Gemeo recebe o Dominio Simples",
  (dEmp.aptidoesEscolhidas ?? []).includes("dominio_simples"), true);
t("com o Estilo aberto pela outra liberacao", dEmp.estilo.disponivel, true);

/* ⚠ A VAGA DE IMBUICAO NAO VEM SO DE TER A APTIDAO. Ela e o NIVEL DE APTIDAO em
   Dominio, que se compra a parte, e o Sem Tecnica RAW esta na mesma situacao: no
   ND 12, sem trilha comprada, ele tambem tem zero. O que este assert prende e a
   IGUALDADE entre os dois, que e a invariante que importa. */
const stRaw = (() => {
  const c = createBlankAfty();
  c.core.nd = 12; c.core.tipo = "combatente";
  c.core.origem = { id: "sem_tecnica" };
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  return deriveAfty(c);
})();
t("o Sem Tecnica raw tambem tem zero vaga", stRaw.estilo.vagas, 0);
t("e o Gemeo com o addon esta igual a ele", dEmp.estilo.vagas, stRaw.estilo.vagas);
t("os dois tem o Dominio Simples",
  [(stRaw.aptidoesEscolhidas ?? []).includes("dominio_simples"),
   (dEmp.aptidoesEscolhidas ?? []).includes("dominio_simples")], [true, true]);

/* Comprando o nivel da trilha, os dois ganham vaga igual. */
const comTrilha = { ...comEmpenho, aptidoes: { ...comEmpenho.aptidoes, dom: 3 } };
t("com a trilha comprada, a vaga aparece", deriveAfty(comTrilha).estilo.vagas > 0, true);

/* ⚠ SEM O ADDON A ESCOLHA SOME DA FICHA, sem marca (decisao do autor). */
const semAddonMesmaFicha = { ...comEmpenho, addons: [] };
t("sem o addon a copiada some",
  OR.caracteristicasEfetivas(semAddonMesmaFicha).some((c) => c.id === "empenho_implacavel"), false);
t("e o Dominio Simples vai junto",
  (deriveAfty(semAddonMesmaFicha).aptidoesEscolhidas ?? []).includes("dominio_simples"), false);
t("a escolha gravada nao resolve mais",
  OR.verdadeiraOrigemEscolhida(semAddonMesmaFicha), null);
t("mas continua GRAVADA na ficha, para voltar se o addon voltar",
  semAddonMesmaFicha.core.origem.escolhas.verdadeiras_origens, [idEmpenho]);

/* Estudos Dedicados tambem tem de resolver. */
const idEstudos = comLib.find((id) => id.endsWith("estudos_dedicados"));
const comEstudos = gemeo([PACOTE]);
comEstudos.core.origem.escolhas = { verdadeiras_origens: [idEstudos] };
t("Estudos Dedicados resolve",
  OR.verdadeiraOrigemEscolhida(comEstudos)?.caracteristica?.id, "estudos_dedicados");
t("e NAO traz o Dominio Simples junto",
  (deriveAfty(comEstudos).aptidoesEscolhidas ?? []).includes("dominio_simples"), false);

/* ============================================================ */
/* 8. O CACHE DA LISTA (bug anterior, consertado junto)          */
/* ============================================================ */
/* A lista era cacheada num modulo e NUNCA invalidada. Uma origem vinda de Addon
   jamais aparecia em Verdadeiras Origens, calado. Achado em 2026-08-21. */

AD.limparAddons();
const semExtra = opcoesDe(gemeo([]));
const COM_ORIGEM = {
  id: "origem-nova",
  nome: "Origem Nova",
  versao: "1.0.0",
  acrescenta: {
    origens: [{
      id: "forjado",
      nome: "Forjado",
      caracteristicas: [
        { id: "nucleo", nome: "Nucleo Ativo", descricao: "Caracteristica de teste." },
      ],
    }],
  },
};
AD.aplicarAddons([COM_ORIGEM]);
const comExtra = opcoesDe(gemeo([COM_ORIGEM]));
t("a origem de Addon ENTRA em Verdadeiras Origens",
  comExtra.some((id) => id.includes("nucleo")), true);
t("e a lista cresceu", comExtra.length > semExtra.length, true);
AD.limparAddons();
t("e some quando o addon sai",
  opcoesDe(gemeo([])).some((id) => id.includes("nucleo")), false);

AD.limparAddons();
t("mundo limpo no fim", AD.addonsAtivos().length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
