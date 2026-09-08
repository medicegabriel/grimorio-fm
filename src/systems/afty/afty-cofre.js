/**
 * ============================================================
 * COFRE — o texto protegido por senha
 * ============================================================
 * O caso (autor, 2026-09-08): *"Estou mandando minha Ficha para um servidor
 * público para avaliação. Porém ela possui conteudo PAGO no qual eu preciso
 * esconder... Preciso que as pessoas vejam minha ficha, porém elas não podem
 * ver o conteudo dos feitiços."*
 *
 * ⚠ ESCONDER NÃO É PROTEGER, e essa é a decisão que manda em todo o resto. Um
 * interruptor que apenas deixa de RENDERIZAR o texto é contornável em dez
 * segundos: abrir o inspetor, ler o `localStorage`, ou abrir o JSON exportado no
 * bloco de notas. O texto continuaria viajando em claro dentro do arquivo que
 * vai para o servidor público, e a proteção falharia sem ninguém perceber.
 *
 * Então o Cofre não esconde: ele TIRA o texto da ficha e guarda um blob
 * cifrado no lugar. Sem a senha, o JSON exportado literalmente não contém o
 * texto, e não existe inspetor que ache o que não está lá.
 *
 * ⚠ E A CONSEQUÊNCIA DISSO É QUE NÃO EXISTE PORTÃO DE TELA NENHUM. Nenhuma aba
 * precisou de `if (trancado)`: a Ficha e o criador desenham o que a ficha tem, e
 * o que a ficha tem é o marcador. Foi o que manteve a mudança pequena.
 *
 * ⚠ O QUE ELE NÃO PROTEGE, e isto precisa estar escrito: ele protege o TEXTO,
 * não a ficha. Quem receber o arquivo pode tentar quebrar a senha por força
 * bruta, offline, no ritmo que quiser. O PBKDF2 com 310 mil iterações encarece
 * cada tentativa, e é só isso que ele faz. Senha curta cai. A defesa real é
 * senha longa.
 *
 * ⚠ A CRIPTOGRAFIA É ASSÍNCRONA E O `deriveAfty` É SÍNCRONO. `crypto.subtle`
 * devolve Promise, e o motor não pode esperar. Por isso trancar e destrancar
 * vivem na BORDA (a tela que pede a senha) e o motor nunca vê o cofre: ele vê
 * uma ficha normal, ou com o texto ou com o marcador. Nada aqui é chamado de
 * dentro de uma derivação.
 * ============================================================
 */

/* ============================================================ */
/* PARÂMETROS                                                    */
/* ============================================================ */

/** Versão do formato do cofre, para uma ficha velha continuar abrindo. */
export const COFRE_VERSAO = 1;

/** ⚠ Sobe com o tempo, e o número fica GRAVADO no cofre: uma ficha trancada
    ontem continua abrindo com o valor dela, e não com o de hoje. */
export const ITERACOES = 310000;

const SALT_BYTES = 16;
const IV_BYTES = 12;

/** O que o Cofre leva de cada Feitiço. Só TEXTO: nada que produza número sai da
    ficha, e é por isso que a ficha trancada continua somando PE e vagas certo.
    Um avaliador precisa dos números para avaliar. */
export const CAMPOS_FEITICO = [
  "nome", "descricao", "conjuracaoTexto",
  "alcanceTexto", "alvoTexto", "duracaoTexto", "resolucaoTexto",
];

/** O que ele leva de um Funcionamento Básico. */
export const CAMPOS_FUNCIONAMENTO = ["nome", "descricao"];

/**
 * As chaves do CATÁLOGO de um addon que carregam texto de conteúdo.
 *
 * ⚠ O NOME NÃO ESTÁ AQUI, e é decisão do autor (2026-09-08): *"Os nomes das
 * habilidades e talentos de Origem não precisam ficar censurados, somente o
 * texto de conteudo."* Uma ficha que lista "Talento: Cultivador de Sonhos" com
 * o texto guardado continua avaliável, e é isso que ele quer que o servidor
 * veja.
 *
 * ⚠ E É LISTA FECHADA, e não "toda string longa". Conferi o catálogo antes de
 * escrever: `entre` é uma lista de chaves de atributo e `expr` é DSL do Motor,
 * e as duas passam de 40 caracteres. Censurar por tamanho quebraria o
 * `bonus.entre` da origem e toda expressão do Motor, calado.
 */
export const CHAVES_TEXTO_ADDON = new Set([
  "descricao", "lore", "texto", "nota", "preReq", "restricoes",
  // Os modelos de Feitiço que um pacote pode trazer usam os mesmos campos da ficha.
  "conjuracaoTexto", "alcanceTexto", "alvoTexto", "duracaoTexto", "resolucaoTexto",
]);

const MARCA_FUNCIONAMENTO = "Funcionamento protegido";
const MARCA_TEXTO = "Conteúdo protegido por senha. Peça a senha ao dono da ficha para ler este texto.";
const MARCA_CURTA = "Protegido";
const marcaFeitico = (i) => `Feitiço protegido ${i + 1}`;

/* ============================================================ */
/* BASE64 E BYTES                                                */
/* ============================================================ */
/* ⚠ Sem `Buffer` e sem `btoa` direto no texto: o `btoa` quebra em acento, e o
   `Buffer` não existe no navegador. O caminho que vale nos dois é passar por
   bytes. */

const bytesParaBase64 = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

const base64ParaBytes = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
};

const textoParaBytes = (s) => new TextEncoder().encode(s);
const bytesParaTexto = (b) => new TextDecoder().decode(b);

/** O `crypto.subtle` do navegador e o do node, pela mesma porta. */
const subtle = () => {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Este navegador não tem Web Crypto, e o Cofre depende dela.");
  return c.subtle;
};

const aleatorio = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

/* ============================================================ */
/* CHAVE                                                         */
/* ============================================================ */

async function chaveDe(senha, salt, iteracoes) {
  const base = await subtle().importKey(
    "raw", textoParaBytes(senha), "PBKDF2", false, ["deriveKey"],
  );
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations: iteracoes, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/* ============================================================ */
/* LEITURA (síncrona, e é o que a tela consulta)                 */
/* ============================================================ */

/** O cofre desta ficha, ou `null`. */
export const cofreDaFicha = (creature) => {
  const c = creature?.cofre;
  return c && typeof c === "object" && c.blob ? c : null;
};

/** Esta ficha está com o texto guardado? */
export const cofreTrancado = (creature) => cofreDaFicha(creature) != null;

/** Quantas peças o cofre está guardando, para a tela dizer o tamanho. */
export function resumoDoCofre(creature) {
  const c = cofreDaFicha(creature);
  if (!c) return null;
  return {
    feiticos: Math.max(0, Math.trunc(Number(c.conta?.feiticos) || 0)),
    funcionamentos: Math.max(0, Math.trunc(Number(c.conta?.funcionamentos) || 0)),
    catalogo: Math.max(0, Math.trunc(Number(c.conta?.catalogo) || 0)),
    iteracoes: Math.max(1, Math.trunc(Number(c.kdf?.iteracoes) || ITERACOES)),
    trancadoEm: c.trancadoEm ?? null,
  };
}

/* ============================================================ */
/* O QUE ENTRA NO COFRE                                          */
/* ============================================================ */
/* Uma função só descreve QUAIS pedaços da ficha são texto protegido, e ela é
   usada nos dois sentidos: para recolher (trancar) e para devolver (abrir).
   Duas listas separadas sairiam de sincronia no primeiro campo novo. */

/**
 * Percorre os lugares protegidos da ficha.
 * `visita(chave, alvo, campos)` recebe o objeto vivo e quais campos são dele.
 */
function percorreProtegidos(creature, visita) {
  const feiticos = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  feiticos.forEach((f, i) => {
    if (f && typeof f === "object") visita(`feitico:${f.id ?? i}`, f, CAMPOS_FEITICO, i);
  });

  /* O Funcionamento principal não é um objeto: são dois campos soltos em
     `core`, por decisão antiga do projeto (ver `funcionamentosDaFicha`). Ele
     entra como um alvo sintético para não virar caso especial. */
  const core = creature?.core;
  if (core && typeof core === "object") {
    visita("tecnica", core, ["tecnicaDescricao"], 0);
  }

  const extras = Array.isArray(core?.funcionamentosAdicionais) ? core.funcionamentosAdicionais : [];
  extras.forEach((f, i) => {
    if (f && typeof f === "object") visita(`fb:${f.id ?? i}`, f, CAMPOS_FUNCIONAMENTO, i);
  });

  /* ⚠ OS FUNCIONAMENTOS DE ADDON TAMBÉM ENTRAM, e eles moram na cópia congelada
     do pacote dentro da criatura. É de propósito: numa ficha como a do Abe no
     Seimei os quatro Funcionamentos Básicos vêm todos de addon, e deixá-los de
     fora esvaziaria o cofre justamente do que ele existe para guardar.

     O preço é que a cópia passa a divergir da biblioteca, e a aba Addons vai
     dizer que o pacote está diferente. Está mesmo: ele está censurado. */
  const pacotes = Array.isArray(creature?.addons) ? creature.addons : [];
  pacotes.forEach((p) => {
    const fbs = Array.isArray(p?.funcionamentos) ? p.funcionamentos : [];
    fbs.forEach((f, i) => {
      if (f && typeof f === "object") visita(`addon:${p.id}:${f.id ?? i}`, f, CAMPOS_FUNCIONAMENTO, i);
    });

    /* ⚠ O CATÁLOGO DO PACOTE ENTRA TAMBÉM (autor, 2026-09-08). Era o buraco da
       primeira versão: a origem e os Feitiços do autor vêm POR ADDON, e os dois
       são conteúdo pago, então o texto deles continuava em claro no arquivo
       enquanto o Cofre guardava só o que a ficha tinha de próprio.

       O preço, que já estava anotado, é que a cópia congelada do pacote passa a
       divergir da biblioteca e a aba Addons vai dizer que ele está diferente.
       Está mesmo: ele está censurado. Vale menos que vazar o conteúdo. */
    if (String(p?.descricao ?? "").trim()) visita(`cat:${p.id}:pacote`, p, ["descricao"], 0);
    andaCatalogo(p?.acrescenta, `cat:${p.id}:acrescenta`, visita);
    andaCatalogo(p?.feiticos, `cat:${p.id}:feiticos`, visita);
  });
}

/**
 * Desce por um catálogo de addon procurando as chaves de texto, sem saber a
 * forma de nenhuma família.
 *
 * ⚠ RECURSIVO DE PROPÓSITO. O texto não está só no primeiro nível: a origem tem
 * `caracteristicas[].descricao`, e a característica tem
 * `escolhas[].opcoes[].descricao`. Um percorredor por família precisaria
 * conhecer as quinze formas e envelheceria na primeira família nova.
 *
 * O caminho vira a CHAVE do cofre, e ele é estável porque é posicional: a mesma
 * cópia congelada devolve o mesmo caminho na hora de abrir.
 */
function andaCatalogo(no, caminho, visita) {
  if (Array.isArray(no)) {
    no.forEach((v, i) => andaCatalogo(v, `${caminho}[${i}]`, visita));
    return;
  }
  if (!no || typeof no !== "object") return;

  const campos = Object.keys(no).filter((k) => CHAVES_TEXTO_ADDON.has(k));
  if (campos.length) visita(caminho, no, campos, 0);

  for (const [k, v] of Object.entries(no)) {
    if (CHAVES_TEXTO_ADDON.has(k)) continue;
    andaCatalogo(v, `${caminho}.${k}`, visita);
  }
}

/** O marcador que fica no lugar de cada campo. */
function marcadorDe(chave, campo, i) {
  if (campo === "nome") return chave.startsWith("feitico:") ? marcaFeitico(i) : MARCA_FUNCIONAMENTO;
  if (campo === "descricao" || campo === "tecnicaDescricao" || campo === "lore") return MARCA_TEXTO;
  if (campo === "texto" || campo === "nota" || campo === "preReq") return MARCA_CURTA;
  return "";
}

/* ============================================================ */
/* TRANCAR                                                       */
/* ============================================================ */

/**
 * Devolve uma CÓPIA da ficha com o texto protegido trocado por marcador e o
 * cofre montado. A ficha de entrada não muda um byte.
 *
 * ⚠ A cópia é ida e volta em JSON, como no `aplicarAddons`: a ficha É JSON, e a
 * volta ainda descarta o que não for serializável e tiver entrado por um
 * caminho torto.
 */
export async function trancar(creature, senha) {
  if (typeof senha !== "string" || senha.length < 1) {
    throw new Error("Escreva uma senha para trancar o Cofre.");
  }
  if (cofreTrancado(creature)) {
    throw new Error("Esta ficha já tem um Cofre trancado.");
  }

  const copia = JSON.parse(JSON.stringify(creature ?? {}));
  const guardado = {};
  let feiticos = 0;
  let funcionamentos = 0;
  let catalogo = 0;

  /* ⚠ RECOLHE PRIMEIRO, DECIDE, E SÓ ENTÃO ESCREVE O MARCADOR. A primeira
     versão escrevia o marcador dentro do laço e desistia depois, e um Feitiço
     em branco (o recém-criado, que nasce sem nome) saía marcado sem entrar no
     cofre: destrancar não o encontrava, e o nome falso ficava para sempre.
     Corromper conteúdo do dono é pior que não proteger nada, e foi o assert de
     ida e volta que pegou. */
  percorreProtegidos(copia, (chave, alvo, campos, i) => {
    const pedaco = {};
    let temTexto = false;
    for (const campo of campos) {
      const valor = alvo[campo];
      /* ⚠ LISTA DE STRING TAMBÉM, e ela não é hipótese: `restricoes` da origem
         é um array de frases de regra. A primeira versão só olhava `string` e
         passava por cima delas em silêncio. O comprimento é preservado para a
         entrada não mudar de forma. */
      if (Array.isArray(valor) && valor.every((x) => typeof x === "string")) {
        if (!valor.length) continue;
        pedaco[campo] = valor;
        if (valor.some((x) => x.trim())) temTexto = true;
        continue;
      }
      if (typeof valor !== "string") continue;
      pedaco[campo] = valor;
      if (valor.trim()) temTexto = true;
    }
    if (!temTexto) return;
    for (const campo of Object.keys(pedaco)) {
      alvo[campo] = Array.isArray(pedaco[campo])
        ? pedaco[campo].map(() => MARCA_CURTA)
        : marcadorDe(chave, campo, i);
    }
    guardado[chave] = pedaco;
    if (chave.startsWith("feitico:")) feiticos += 1;
    else if (chave.startsWith("cat:")) catalogo += 1;
    else funcionamentos += 1;
  });

  if (Object.keys(guardado).length === 0) {
    throw new Error("Não há texto de Feitiço nem de Funcionamento Básico para guardar.");
  }

  const salt = aleatorio(SALT_BYTES);
  const iv = aleatorio(IV_BYTES);
  const chave = await chaveDe(senha, salt, ITERACOES);
  const cifrado = await subtle().encrypt(
    { name: "AES-GCM", iv },
    chave,
    textoParaBytes(JSON.stringify(guardado)),
  );

  copia.cofre = {
    versao: COFRE_VERSAO,
    cifra: "AES-GCM-256",
    kdf: { algo: "PBKDF2-SHA256", iteracoes: ITERACOES, salt: bytesParaBase64(salt) },
    iv: bytesParaBase64(iv),
    blob: bytesParaBase64(new Uint8Array(cifrado)),
    conta: { feiticos, funcionamentos, catalogo },
    trancadoEm: new Date().toISOString(),
  };
  return copia;
}

/* ============================================================ */
/* ABRIR                                                         */
/* ============================================================ */

/**
 * Decifra e devolve o conteúdo guardado. NÃO mexe na ficha.
 *
 * ⚠ SENHA ERRADA É FALHA DE DECIFRAGEM, e por isso não existe campo "hash da
 * senha" em lugar nenhum. O AES-GCM autentica o que cifrou: com a chave errada
 * ele recusa em vez de devolver lixo. Guardar um hash ao lado só daria mais uma
 * coisa para atacar offline.
 */
export async function abrir(creature, senha) {
  const c = cofreDaFicha(creature);
  if (!c) throw new Error("Esta ficha não tem Cofre.");
  if (typeof senha !== "string" || senha.length < 1) throw new Error("Escreva a senha.");

  const salt = base64ParaBytes(c.kdf?.salt ?? "");
  const iv = base64ParaBytes(c.iv ?? "");
  const iteracoes = Math.max(1, Math.trunc(Number(c.kdf?.iteracoes) || ITERACOES));
  const chave = await chaveDe(senha, salt, iteracoes);

  let aberto;
  try {
    aberto = await subtle().decrypt({ name: "AES-GCM", iv }, chave, base64ParaBytes(c.blob));
  } catch {
    throw new Error("Senha incorreta.");
  }
  return JSON.parse(bytesParaTexto(new Uint8Array(aberto)));
}

/** A senha está certa? Não devolve conteúdo, só o sim ou não. */
export async function senhaConfere(creature, senha) {
  try {
    await abrir(creature, senha);
    return true;
  } catch {
    return false;
  }
}

/* ============================================================ */
/* DEVOLVER O TEXTO                                              */
/* ============================================================ */

/**
 * Devolve uma CÓPIA da ficha com o texto de volta no lugar.
 *
 * `manterCofre: true` é a leitura da Ficha Final: o texto aparece na tela e o
 * cofre continua lá, então o que for gravado continua trancado.
 * `manterCofre: false` é o destravamento de verdade do criador, para voltar a
 * EDITAR: o cofre sai da ficha.
 */
export function comTextoAberto(creature, conteudo, { manterCofre = true } = {}) {
  const copia = JSON.parse(JSON.stringify(creature ?? {}));
  const dados = conteudo && typeof conteudo === "object" ? conteudo : {};

  percorreProtegidos(copia, (chave, alvo, campos) => {
    const pedaco = dados[chave];
    if (!pedaco || typeof pedaco !== "object") return;
    for (const campo of campos) {
      const valor = pedaco[campo];
      if (typeof valor === "string" || Array.isArray(valor)) alvo[campo] = valor;
    }
  });

  if (!manterCofre) delete copia.cofre;
  return copia;
}

/** Abrir e devolver o texto de uma vez, para o criador voltar a editar. */
export async function destrancarDeVez(creature, senha) {
  const conteudo = await abrir(creature, senha);
  return comTextoAberto(creature, conteudo, { manterCofre: false });
}

/* ============================================================ */
/* O QUE ESTÁ ABERTO NESTA ABA                                   */
/* ============================================================ */
/**
 * ⚠ MEMÓRIA DE SESSÃO, e nunca ficha. O conteúdo destrancado na Ficha Final
 * vive AQUI, num mapa de módulo que morre ao recarregar a página. Não vai para
 * `localStorage`, não entra na criatura e não é gravado em lugar nenhum.
 *
 * ⚠ E é por isso que ele não pode encostar no criador. O criador tem autosave
 * que grava o rascunho sozinho (ver `afty-rascunho.js`): mesclar texto aberto no
 * rascunho gravaria o conteúdo em claro no `localStorage`, que é exatamente o
 * que o Cofre existe para impedir. No criador o caminho é `destrancarDeVez`,
 * explícito e pedido pelo dono.
 */
const ABERTOS = new Map();

export const guardarAberto = (id, conteudo) => { if (id) ABERTOS.set(id, conteudo); };
export const lerAberto = (id) => (id ? ABERTOS.get(id) ?? null : null);
export const esquecerAberto = (id) => { if (id) ABERTOS.delete(id); };
export const esquecerTudo = () => ABERTOS.clear();

/* ============================================================ */
/* O VIGIA                                                       */
/* ============================================================ */
/**
 * Texto LONGO que sobrou em claro dentro dos addons depois de trancar.
 *
 * ⚠ ISTO EXISTE PORQUE A LISTA DE CHAVES É FECHADA. `CHAVES_TEXTO_ADDON` é
 * escrita à mão, e uma família nova de addon pode chegar com um campo de texto
 * batizado de outro jeito. Sem vigia, esse campo vazaria em silêncio, que é
 * exatamente o modo de falhar que o Cofre existe para não repetir.
 *
 * ⚠ NÃO DÁ PARA CENSURAR POR TAMANHO, e foi por isso que a lista é fechada:
 * conferi o catálogo antes de escrever e o `bonus.entre` da origem (chaves de
 * atributo) e o `expr` do Motor passam dos 40 caracteres. Apagar os dois
 * quebraria a ficha calado. O vigia AVISA, e quem decide é quem lê.
 *
 * O marcador é ignorado, senão ele se denunciaria sozinho.
 */
export function textoLongoRestante(creature, { minimo = 60 } = {}) {
  const marcadores = new Set([MARCA_TEXTO, MARCA_CURTA, MARCA_FUNCIONAMENTO]);
  const achados = [];
  const anda = (no, caminho) => {
    if (typeof no === "string") {
      if (no.length >= minimo && !marcadores.has(no)) {
        achados.push({ caminho, tamanho: no.length, inicio: no.slice(0, 60) });
      }
      return;
    }
    if (Array.isArray(no)) { no.forEach((v, i) => anda(v, `${caminho}[${i}]`)); return; }
    if (!no || typeof no !== "object") return;
    for (const [k, v] of Object.entries(no)) {
      /* `expr` é DSL do Motor e nunca é conteúdo. Fica de fora do vigia para
         não gerar aviso que ninguém deve atender. */
      if (k === "expr") continue;
      anda(v, `${caminho}.${k}`);
    }
  };
  for (const p of Array.isArray(creature?.addons) ? creature.addons : []) {
    anda({ ...p, cofre: undefined }, p.id ?? "addon");
  }
  return achados;
}

/* ============================================================ */
/* FORÇA DA SENHA                                                */
/* ============================================================ */
/**
 * Um aviso honesto, e não um medidor com barrinha. O que decide se o cofre
 * aguenta é o TAMANHO da senha, porque o ataque é offline e por força bruta.
 */
export function avaliaSenha(senha) {
  const s = String(senha ?? "");
  if (s.length === 0) return { nivel: "vazia", texto: "Escreva uma senha." };
  if (s.length < 8) {
    return { nivel: "fraca", texto: "Senha curta demais. Quem tiver o arquivo quebra isto offline." };
  }
  if (s.length < 16) {
    return { nivel: "media", texto: "Aceitável. Uma frase de 20 caracteres ou mais protege muito melhor." };
  }
  return { nivel: "boa", texto: "Bom tamanho. Guarde a senha: sem ela o texto não volta." };
}
