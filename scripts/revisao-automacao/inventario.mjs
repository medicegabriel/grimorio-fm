import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const RAIZ = fileURLToPath(new URL("../../", import.meta.url));
export const CONTROLE = resolve(RAIZ, "docs/revisao-automacao");
export const lerJson = (p) => JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
export const sha256 = (v) => createHash("sha256").update(v).digest("hex");

// Conserva arrays ordenados e distingue função, Set e Map. Nunca executa código de addon.
export function serializar(v, ancestrais = new Set()) {
  if (typeof v === "function") return { $funcao: String(v) };
  if (v === undefined) return { $indefinido: true };
  if (!v || typeof v !== "object") return v;
  if (ancestrais.has(v)) return { $ciclo: true };
  const next = new Set([...ancestrais, v]);
  if (v instanceof Set) return { $set: [...v].map(x => serializar(x, next)) };
  if (v instanceof Map) return { $map: [...v].map(([k,x]) => [k, serializar(x, next)]) };
  if (Array.isArray(v)) return v.map(x => serializar(x, next));
  return Object.fromEntries(Object.keys(v).sort().map(k => [k, serializar(v[k], next)]));
}
export const hashDado = v => sha256(JSON.stringify(serializar(v)));
const identidade = (v, i) => String(v?.id ?? v?.value ?? v?.key ?? (typeof v === "string" ? v : "@" + i));
const nomeDe = (v, id) => String(v?.nome ?? v?.label ?? v?.titulo ?? id);
const pares = v => v instanceof Set ? [...v].map((x,i) => [identidade(x,i),x])
  : v instanceof Map ? [...v].map(([k,x]) => [String(k),x])
  : Array.isArray(v) ? v.map((x,i) => {
    const id = identidade(x,i);
    const repetido = typeof x !== "object" && v.filter(y => y === x).length > 1;
    return [repetido ? "@" + i + "=" + id : id,x];
  }) : Object.entries(v);

export function resolverProprietario(chave,arquivo,exp,fallback,escopo,donos){return escopo.proprietarios?.[chave] ?? donos.get(chave) ?? (exp==="AFTY_HABILIDADES" && !chave.endsWith("::@catalogo") ? fallback ?? null : escopo.exports[arquivo+"::"+exp] ?? fallback ?? escopo.modulos[arquivo] ?? escopo.modulosAdicionais?.[arquivo]?.proprietario ?? null);}

export async function coletarInventario() {
  const inicio = new Date().toISOString();
  const manifesto = lerJson(resolve(CONTROLE,"manifesto-inicial.json"));
  const mapa = lerJson(resolve(CONTROLE,"mapa-opcoes-inicial.json"));
  const escopo = lerJson(resolve(CONTROLE,"escopo.json"));
  // O derive entra primeiro para respeitar o ciclo documentado do motor.
  await import(pathToFileURL(resolve(RAIZ,"src/systems/afty/afty-derive.js")));
  const modulos = new Map(), erros = [];
  const percorrer = pasta => readdirSync(resolve(RAIZ,"src/systems/afty",pasta),{withFileTypes:true}).flatMap(e => e.isDirectory()?percorrer(pasta+e.name+"/"):e.name.endsWith(".js")?[pasta+e.name]:[]);
  const encontrados = percorrer("").sort();
  for (const arquivo of encontrados) {
    if (arquivo.includes("/") && !escopo.modulosAdicionais?.[arquivo]) {erros.push({arquivo,erro:"Módulo de subpasta sem classificação"});continue;}
    if (arquivo.includes("/") && escopo.modulosAdicionais[arquivo].modo!=="DADOS") continue;
    if(!escopo.modulos[arquivo] && !escopo.modulosAdicionais?.[arquivo]?.proprietario)erros.push({arquivo,erro:"Módulo novo sem proprietário de controle"});
    try { modulos.set(arquivo, await import(pathToFileURL(resolve(RAIZ,"src/systems/afty",arquivo)))); }
    catch (e) { erros.push({arquivo,erro:String(e)}); }
  }
  const donos = new Map();
  for (const c of mapa.catalogs) for (const i of c.items) donos.set(c.module+"::"+c.export+"::"+i.id,i.owner);
  for (const lote of manifesto.lots) for (const i of lote.items) {
    if (donos.has(i.key) && donos.get(i.key)!==lote.code) erros.push({chave:i.key,erro:"Proprietários iniciais divergentes"});
    donos.set(i.key,lote.code);
  }
  const lotesAddon = new Map(manifesto.lots.filter(l => l.addonFile && /^AD-\d+$/.test(l.code)).map(l => [l.addonFile,l.code]));
  const itens = [], catalogos = [], referencias = new WeakMap(), principais = new WeakMap(), porId = new Map();
  const camposDinamicos = new Set(["fonteOpcoes","alvoTipo","param"]);
  const dono=(chave,arquivo,exp,fallback)=>resolverProprietario(chave,arquivo,exp,fallback,escopo,donos);
  function inserir(chave,v,meta) {
    const id = meta.id ?? chave.split("::").at(-1);
    const item = {chave,id,nome:nomeDe(v,id),...meta,...(escopo.proprietarios?.[chave]?{proprietario:escopo.proprietarios[chave]}:{}),...(v && typeof v==="object" && (v.id ?? v.value ?? v.key)!=null ? {idLocal:String(v.id ?? v.value ?? v.key)} : {}),hashDado:hashDado(v),...(typeof v?.fonte==="string"?{fonteDeclarada:v.fonte}:{}),...(v?.especializacaoId?{especializacaoId:v.especializacaoId}:{}),...(v?.nivel!=null?{nivel:v.nivel}:{})};
    itens.push(item);
    return item;
  }
  function descer(v,pai,caminho="",ancestrais=new Set()) {
    if (!v || typeof v!=="object" || ancestrais.has(v)) return;
    const next = new Set([...ancestrais,v]);
    for (const [campo,x] of pares(v)) {
      const dinamico = (camposDinamicos.has(campo) || (campo==="tipo" && caminho.split("/").includes("alvos"))) && typeof x==="string";
      const objeto = x && typeof x==="object";
      const funcao = typeof x==="function";
      if (!objeto && !funcao && !dinamico && !Array.isArray(v) && !(v instanceof Set)) continue;
      const local = caminho+campo, chave = pai.chave+"::"+local;
      const ref = objeto ? principais.get(x) ?? referencias.get(x) : null;
      const node = inserir(chave,x,{
        arquivo:pai.arquivo,export:pai.export,pai:pai.chave,caminho:local,
        proprietario:ref?.proprietario ?? pai.proprietario,
        tipo:dinamico?"domínio dinâmico":ref?"referência":funcao?"gerador":objeto?(Array.isArray(x)?"pool":"parcela declarada"):"valor de domínio",
        ...(ref?{referencia:ref.chave,integracaoProprietario:pai.proprietario}:{}),
        ...(dinamico?{dominio:(campo==="tipo"?"tipoAlvo":campo)+":"+x}:{}),
        ...(pai.addon?{addon:pai.addon}:{}),
      });
      if (objeto && !ref) referencias.set(x,node);
      if (!ref && !dinamico) descer(x,pai,local+"/",next);
    }
  }
  const exports = [];
  for (const [arquivo,m] of modulos) for (const [exp,v] of Object.entries(m)) if (v && typeof v==="object") exports.push({arquivo,exp,v});
  const prioridade = x => x.exp==="HABILIDADES_ROUBAVEIS"?3:mapa.catalogs.some(c => c.module===x.arquivo && c.export===x.exp)?0:x.arquivo==="afty-efeitos-conteudo.js"?1:2;
  exports.sort((a,b) => prioridade(a)-prioridade(b) || (a.arquivo+"::"+a.exp).localeCompare(b.arquivo+"::"+b.exp));
  // Todas as identidades de topo precedem os pools, mesmo quando compartilhados.
  for (const {arquivo,exp,v} of exports) {
    const chave = arquivo+"::"+exp, ref = referencias.get(v);
    const root = inserir(chave+"::@catalogo",v,{
      arquivo:"src/systems/afty/"+arquivo,export:exp,id:"@catalogo",
      proprietario:ref?.proprietario ?? dono(chave+"::@catalogo",arquivo,exp),
      tipo:ref?"alias de exportação":"catálogo ou tabela",...(ref?{referencia:ref.chave}:{})
    });
    if (!ref) referencias.set(v,root);
    catalogos.push({arquivo,export:exp,quantidade:pares(v).length,tipo:root.tipo,chave:root.chave});
    for (const [id,x] of pares(v)) {
      const key=chave+"::"+id, anterior=x&&typeof x==="object"?principais.get(x):null;
      const roubavel=exp==="HABILIDADES_ROUBAVEIS";
      const referencia=roubavel?"afty-habilidades.js::AFTY_HABILIDADES::"+id:anterior?.chave;
      const item=inserir(key,x,{
        arquivo:root.arquivo,export:exp,id,
        proprietario:dono(key,arquivo,exp,anterior?.proprietario),
        tipo:referencia?"referência":Array.isArray(v)?"entrada":"entrada de tabela",
        ...(referencia?{referencia}:{}),...(roubavel?{integracaoProprietario:escopo.rouboProprietario}:{})
      });
      if (x && typeof x==="object" && !anterior && !roubavel) principais.set(x,item);
      if (!porId.has(id)) porId.set(id,[]);
      porId.get(id).push(item);
    }
  }
  for (const item of itens) if (/EFEITOS/.test(item.export??"") && item.tipo==="entrada de tabela") {
    const candidatos=(porId.get(item.id)??[]).filter(i=>i.tipo==="entrada"&&donos.has(i.chave));
    const proprietarios=[...new Set(candidatos.map(i=>i.proprietario))];
    if(proprietarios.length===1){item.proprietario=proprietarios[0];item.regraOriginal=candidatos[0].chave;}
  }
  for (const item of [...itens].filter(i=>["entrada","entrada de tabela"].includes(i.tipo))) {
    const lista=modulos.get(item.arquivo.slice("src/systems/afty/".length))[item.export];
    descer(pares(lista).find(([id])=>id===item.id)?.[1],item);
  }
  // Liga mapas de efeitos das opções não exportadas ao conteúdo proprietário.
  for (const item of itens.filter(i=>/EFEITOS/.test(i.export??"")&&i.tipo==="entrada de tabela")) {
    const candidatos=itens.filter(i=>i.idLocal===item.id&&!i.addon&&i.export!==item.export&&i.tipo!=="referência"&&!/EFEITOS/.test(i.export??""));
    const proprietarios=[...new Set(candidatos.map(i=>i.proprietario))];
    if(proprietarios.length===1){item.proprietario=proprietarios[0];item.regraOriginal=candidatos[0].chave;}
  }
  const index=new Map(itens.map(i=>[i.chave,i]));
  for(const item of itens){
    if(item.referencia && index.has(item.referencia))item.proprietario=index.get(item.referencia).proprietario;
    else if(item.pai && index.has(item.pai))item.proprietario=index.get(item.pai).proprietario;
  }
  const {aplicarAddons,validarPacote,familiasDeAddon}=modulos.get("afty-addons.js");
  const {AFTY_HABILIDADES}=modulos.get("afty-habilidades.js");
  const addons=[];
  for (const arquivo of readdirSync(resolve(RAIZ,"addons")).filter(n=>n.endsWith(".json")).sort()) {
    const caminho="addons/"+arquivo;
    let pacote;
    try{pacote=lerJson(resolve(RAIZ,caminho));}catch(e){erros.push({arquivo:caminho,erro:String(e)});continue;}
    const proprietario=lotesAddon.get(arquivo)??null;
    const root=inserir("addon::"+arquivo+"::@pacote",pacote,{arquivo:caminho,id:pacote.id??"@pacote",proprietario,tipo:"pacote",addon:arquivo});
    const problemas=validarPacote(pacote);
    addons.push({arquivo:caminho,id:pacote.id,versao:pacote.versao,proprietario,chaves:Object.keys(pacote),hashArquivo:sha256(readFileSync(resolve(RAIZ,caminho))),problemas,herdadas:[]});
    for (const [campo,v] of Object.entries(pacote)) {
      const node=inserir(root.chave+"::"+campo,v,{arquivo:caminho,id:campo,proprietario,tipo:"chave de pacote",addon:arquivo,pai:root.chave});
      if(["acrescenta","substitui"].includes(campo)){
        for(const [familia,lista] of Object.entries(v??{}))for(const [id,x]of pares(lista)){
          const key="addon::"+arquivo+"::"+campo+"."+familia+"::"+id;
          const entry=inserir(key,x,{arquivo:caminho,id,proprietario:donos.get(key)??proprietario,tipo:campo==="substitui"?"remendo":"conteúdo de addon",addon:arquivo,familia,operacao:campo});
          descer(x,entry);
        }
      }else descer(v,node);
    }
    const resultado=aplicarAddons([pacote]);
    addons.at(-1).aplicacao=serializar(resultado);
    if(resultado.problemas.length)erros.push({arquivo:caminho,erro:"Addon recusado na coleta efetiva",problemas:resultado.problemas});
    for(const h of AFTY_HABILIDADES.filter(h=>h.herdadaDe)){
      const key="addon-herdada::"+arquivo+"::"+h.id;
      const original="afty-habilidades.js::AFTY_HABILIDADES::"+h.herdadaDe;
      const item=inserir(key,h,{
        arquivo:caminho,id:h.id,proprietario:donos.get(key)??proprietario,tipo:"integração herdada",addon:arquivo,
        regraOriginal:original,proprietarioOriginal:donos.get(original)??null,
        gerador:"src/systems/afty/afty-habilidades.js:clonesDaHeranca",herdadaPor:h.herdadaPor
      });
      addons.at(-1).herdadas.push(key);
      descer(h,item);
    }
    aplicarAddons([]);
  }
  // Remendo e liberação são integrações; não transferem a regra original.
  const nativos=new Map();
  for(const [familia,catalogo]of Object.entries(escopo.familiasAddon??{})){
    for(const item of itens.filter(i=>i.arquivo===catalogo.arquivo&&i.export===catalogo.export&&i.id!=="@catalogo"))nativos.set(familia+"::"+item.id,item);
  }
  const ligar=(item,alvo,tipo)=>{
    if(!alvo){erros.push({chave:item.chave,erro:"Integração sem alvo nativo inequívoco"});return;}
    item.regraOriginal=alvo.chave;item.proprietarioOriginal=alvo.proprietario;
    item.exigeProvaIntegracao=true;
    (alvo[tipo]??=[]).push(item.chave);
  };
  for(const item of itens.filter(i=>i.tipo==="remendo"))ligar(item,nativos.get(item.familia+"::"+item.id),"remendadoPor");
  const liberacoes=itens.filter(i=>i.export==="LIBERACOES"&&i.id.startsWith("soPorAddon:"));
  for(const item of liberacoes){
    const id=item.id.slice("soPorAddon:".length);
    const candidatos=escopo.alvosLiberacao?.[id] ? itens.filter(i=>i.chave===escopo.alvosLiberacao[id]) : [...nativos.values()].filter(i=>i.id===id);
    const unicos=[...new Map(candidatos.map(i=>[i.chave,i])).values()];
    ligar(item,unicos.length===1?unicos[0]:null,"liberadoPor");
  }
  for(const item of itens.filter(i=>i.addon&&i.caminho?.split("/").at(-1)?.startsWith("soPorAddon:"))){
    const id=item.caminho.split("/").at(-1);
    const declaracao=liberacoes.find(i=>i.id===id);
    item.declaracaoLiberacao=declaracao?.chave??null;
    ligar(item,declaracao?itens.find(i=>i.chave===declaracao.regraOriginal):null,"liberadoPor");
  }
  for(const item of itens)for(const campo of ["remendadoPor","liberadoPor"])if(item[campo])item[campo].sort();
  for(const [arquivo,m]of modulos)for(const [exp,v]of Object.entries(m))if(v!==null&&["string","number","boolean"].includes(typeof v))inserir(arquivo+"::"+exp+"::@valor",v,{arquivo:"src/systems/afty/"+arquivo,export:exp,id:"@valor",nome:String(v),proprietario:dono(arquivo+"::"+exp+"::@valor",arquivo,exp),tipo:"constante"});
  for (const controle of escopo.controlesCampanha ?? []) inserir("controle::G00::"+controle.id,controle,{
    id:controle.id,nome:controle.nome,arquivo:controle.arquivo,proprietario:"G00",tipo:"protocolo da campanha"
  });
  for (const dominio of escopo.dominiosContextuais ?? []) inserir("dominio-contextual::"+dominio.id,dominio,{
    id:dominio.id,nome:dominio.nome,arquivo:dominio.arquivo,proprietario:dominio.proprietario,tipo:"domínio contextual",dominio:"contextual:"+dominio.id
  });
  return {versao:1,inicio,fim:new Date().toISOString(),modulos:[...modulos.keys()],catalogos,familiasAddon:familiasDeAddon(),addons,itens:itens.sort((a,b)=>a.chave.localeCompare(b.chave)),erros};
}

