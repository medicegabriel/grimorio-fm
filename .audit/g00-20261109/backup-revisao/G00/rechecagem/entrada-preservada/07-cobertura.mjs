import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTROLE, RAIZ, coletarInventario, lerJson, sha256 } from "./inventario.mjs";
import { validarFontesRegistro, verificarLivro } from "./fontes.mjs";

// Valida os vocabulários usados pelo schema comum copiado, sem redefinir estados.
// Não pretende substituir um validador geral de JSON Schema.
export function validarRegistro(dado, schema, local="$") {
  const erros=[];
  function visita(v,s,p) {
    if(!s)return;
    const tipo=Array.isArray(v)?"array":v===null?"null":typeof v;
    if(s.type && tipo!==s.type){erros.push(p+": tipo "+tipo+", esperado "+s.type);return;}
    if(s.enum && !s.enum.includes(v))erros.push(p+": estado/valor fora do schema");
    if(s.minLength!=null && v.length<s.minLength)erros.push(p+": string curta");
    if(s.minItems!=null && v.length<s.minItems)erros.push(p+": array vazio");
    if(s.format==="date" && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v+"T00:00:00Z").toISOString().slice(0,10)!==v))erros.push(p+": data inválida");
    if(s.type==="object"){
      for(const k of s.required??[])if(!Object.hasOwn(v,k))erros.push(p+"."+k+": campo obrigatório ausente");
      for(const [k,x]of Object.entries(v)) {
        if(s.properties?.[k])visita(x,s.properties[k],p+"."+k);
        else if(s.additionalProperties && typeof s.additionalProperties==="object")visita(x,s.additionalProperties,p+"."+k);
        else if(s.additionalProperties===false)erros.push(p+"."+k+": campo não permitido");
      }
    }
    if(s.type==="array")v.forEach((x,i)=>visita(x,s.items,p+"["+i+"]"));
  }
  visita(dado,schema,local);
  return erros;
}
const estadosImplementacao=new Set(["NÃO REVISADO","EM REVISÃO","PARCIAL","AGUARDA AUTOR","IMPLEMENTADO, AGUARDA AUDITORIA","AUDITADO COM PENDÊNCIAS","APROVADO"]);
export function verificarCobertura({vivo,inventario,campanha,registros=[],schema,dominios={},fontes={},hashesAtuais={},politicaFonte=null}) {
  const erros=[...(vivo.erros??[]).map(e=>({tipo:"coleta",...e}))], revisaoAusente=[], alterados=[];
  const porChave=new Map(), vivos=new Map(), lotes=new Map(campanha.lotes.map(l=>[l.lote,l]));
  for(const i of vivo.itens){
    if(vivos.has(i.chave))erros.push({tipo:"identidade viva duplicada",chave:i.chave});
    vivos.set(i.chave,i);
    if(i.dominio && !dominios[i.dominio])erros.push({tipo:"domínio sem protocolo",chave:i.chave,dominio:i.dominio});
  }
  for(const i of inventario.itens){
    if(porChave.has(i.chave))erros.push({tipo:"registro/proprietário duplicado",chave:i.chave,donos:[porChave.get(i.chave).proprietario,i.proprietario]});
    porChave.set(i.chave,i);
    if(!i.proprietario || !lotes.has(i.proprietario))erros.push({tipo:"proprietário inexistente",chave:i.chave,proprietario:i.proprietario});
    if(!estadosImplementacao.has(i.estado))erros.push({tipo:"estado inválido",chave:i.chave,estado:i.estado});
    if(!fontes[i.proprietario])erros.push({tipo:"família sem mapa de fonte",chave:i.chave,proprietario:i.proprietario});
    const atual=vivos.get(i.chave);
    if(!atual && i.situacao!=="REMOVIDO")erros.push({tipo:"registro órfão",chave:i.chave});
    if(!atual && i.situacao==="REMOVIDO" && !i.justificativaRemocao)erros.push({tipo:"remoção sem explicação",chave:i.chave});
    if(atual && i.situacao==="REMOVIDO")erros.push({tipo:"item removido voltou ao catálogo",chave:i.chave});
    if(atual && atual.proprietario && i.proprietario!==atual.proprietario)erros.push({tipo:"proprietário diverge do protocolo",chave:i.chave,registro:i.proprietario,vivo:atual.proprietario});
    if(atual && i.hashDado!==atual.hashDado)alterados.push(i.chave);
    if(atual && i.estado!=="APROVADO")revisaoAusente.push({chave:i.chave,lote:i.proprietario,estado:i.estado});
    if(i.referencia && !vivos.has(i.referencia))erros.push({tipo:"referência órfã",chave:i.chave,referencia:i.referencia});
  }
  for(const i of vivo.itens)if(!porChave.has(i.chave))erros.push({tipo:"item vivo sem registro",chave:i.chave,proprietarioSugerido:i.proprietario});
  const porLote=new Map(), declaracoes=new Map();
  for(const r of registros){
    if(politicaFonte)for(const erro of validarFontesRegistro(r,politicaFonte,hashesAtuais,(fontes[r.lote]?.fontes??[]).some(f=>f.caminho===politicaFonte.livroRegras.caminho)))erros.push({tipo:"fonte de regras divergente",lote:r.lote,erro});
    for(const erro of validarRegistro(r,schema))erros.push({tipo:"schema",lote:r.lote,erro});
    if(porLote.has(r.lote))erros.push({tipo:"registro de lote duplicado",lote:r.lote});
    porLote.set(r.lote,r);
    if(!lotes.has(r.lote))erros.push({tipo:"lote órfão",lote:r.lote});
    else if(lotes.get(r.lote).estado!==r.estado)erros.push({tipo:"estado do lote diverge do registro",lote:r.lote});
    for(const i of r.itens??[]){
      if(declaracoes.has(i.chave))erros.push({tipo:"item declarado em dois registros",chave:i.chave,lotes:[declaracoes.get(i.chave),r.lote]});
      declaracoes.set(i.chave,r.lote);
      if(!porChave.has(i.chave))erros.push({tipo:"item de lote sem inventário",lote:r.lote,chave:i.chave});
      else if(i.proprietario!==r.lote || porChave.get(i.chave).proprietario!==r.lote)erros.push({tipo:"lote declara propriedade de outro",lote:r.lote,chave:i.chave});
    }
    const ids=new Set((r.itens??[]).map(i=>i.chave)), parcelas=new Set();
    for(const p of r.parcelas??[]){
      const key=p.chaveItem+"::"+p.parcela;
      if(parcelas.has(key))erros.push({tipo:"parcela duplicada",lote:r.lote,chave:key});
      parcelas.add(key);
      if(!ids.has(p.chaveItem))erros.push({tipo:"parcela sem item",lote:r.lote,chave:p.chaveItem});
      const administrativa = r.lote==="G00" && vivos.get(p.chaveItem)?.tipo==="protocolo da campanha";
      const motorAutoria = administrativa
        ? !p.naoAplicavel?.motor || !p.naoAplicavel?.autoria
        : p.motor!=="INTEGRADO" || p.autoria==="INACESSÍVEL" || !p.provaAutoria;
      if(p.evidencia==="APROVADA" && (p.regra!=="CONFIRMADA" || !["COMPLETA","MANUAL INTENCIONAL"].includes(p.execucao) || motorAutoria || !p.fontes?.length || !p.provas?.some(t=>t.estado==="PASSOU") || p.provas?.some(t=>t.estado==="FALHOU") || (p.execucao==="MANUAL INTENCIONAL"&&!p.justificativaManual)))erros.push({tipo:"aprovação de parcela sem critérios",lote:r.lote,chave:key});
    }
    for(const [arquivo,hash]of Object.entries(r.base?.hashesFinais??{}))if(hashesAtuais[arquivo]!==hash)erros.push({tipo:"hash final divergente",lote:r.lote,arquivo});
    if(r.estado==="APROVADO"){
      if(r.auditoria?.estado!=="APROVADO" || !r.auditor || r.auditor===r.executor || !Object.keys(r.auditoria?.hashesExaminados??{}).length)erros.push({tipo:"lote aprovado sem auditor independente",lote:r.lote});
      if(!r.parcelas?.length || r.parcelas.some(p=>p.evidencia!=="APROVADA"))erros.push({tipo:"lote aprovado com parcela não verificada",lote:r.lote});
      const faltam=[...vivos.keys()].filter(k=>porChave.get(k)?.proprietario===r.lote && !ids.has(k));
      const semParcela=[...ids].filter(k=>!r.parcelas?.some(p=>p.chaveItem===k));
      if(semParcela.length)erros.push({tipo:"item aprovado sem parcela",lote:r.lote,quantidade:semParcela.length});
      for(const [arquivo,hash]of Object.entries(r.base?.hashesFinais??{}))if(r.auditoria?.hashesExaminados?.[arquivo]!==hash)erros.push({tipo:"auditoria não cobre hash da entrega",lote:r.lote,arquivo});
      if(faltam.length)erros.push({tipo:"lote aprovado sem cobertura explícita",lote:r.lote,quantidade:faltam.length});
      for(const [arquivo,hash]of Object.entries(r.auditoria?.hashesExaminados??{}))if(hashesAtuais[arquivo]!==hash)erros.push({tipo:"auditoria de outra versão",lote:r.lote,arquivo});
    }
  }
  const lotesSemRegistro=campanha.lotes.filter(l=>!porLote.has(l.lote)).map(l=>l.lote);
  for(const l of campanha.lotes){
    if(!estadosImplementacao.has(l.estado))erros.push({tipo:"estado de campanha inválido",lote:l.lote});
    if(l.estado!=="NÃO REVISADO"&&!porLote.has(l.lote))erros.push({tipo:"lote com estado avançado sem registro",lote:l.lote});
    for(const dep of l.dependencias??[])if(!lotes.has(dep) && !dep.startsWith("todos os "))erros.push({tipo:"dependência desconhecida",lote:l.lote,dependencia:dep});
  }
  for(const i of inventario.itens.filter(i=>i.estado==="APROVADO"))if(porLote.get(i.proprietario)?.estado!=="APROVADO" || !declaracoes.has(i.chave))erros.push({tipo:"item aprovado sem auditoria de lote",chave:i.chave});
  return {
    estrutura:erros.length===0&&alterados.length===0?"PASSOU":"FALHOU",
    erros,alterados,lotesSemRegistro,revisaoAusente,
    resumo:{itensVivos:vivo.itens.length,itensRegistrados:inventario.itens.length,catalogos:vivo.catalogos?.length??0,addons:vivo.addons?.length??0,lotes:campanha.lotes.length,erros:erros.length,conteudosAlterados:alterados.length,revisaoAusente:revisaoAusente.length,lotesSemRegistro:lotesSemRegistro.length},
    aviso:"Cobertura de inventário não aprova comportamento, integração, autoria nem regra. Referências e tabelas não são contadas como habilidades novas."
  };
}
export async function conferirCampanha() {
  const inicio=new Date().toISOString();
  const vivo=await coletarInventario();
  const campanha=lerJson(resolve(CONTROLE,"campanha.json"));
  const inventario=lerJson(resolve(CONTROLE,"inventario.json"));
  const schema=lerJson(resolve(CONTROLE,"schema-registro.json"));
  const dominios=lerJson(resolve(CONTROLE,"dominios-dinamicos.json"));
  const fontes=lerJson(resolve(CONTROLE,"fontes.json")).lotes;
  const politicaFonte=lerJson(resolve(CONTROLE,"fonte-livro-regras.json"));
  const fonteAtual=verificarLivro(politicaFonte);
  const registros=[];
  for(const dir of readdirSync(CONTROLE,{withFileTypes:true}).filter(d=>d.isDirectory())){
    const p=resolve(CONTROLE,dir.name,"registro.json");
    if(existsSync(p))registros.push(lerJson(p));
  }
  const caminhos=[...new Set(registros.flatMap(r=>[...Object.keys(r.base?.hashesFinais??{}),...Object.keys(r.auditoria?.hashesExaminados??{})]))];
  const hashesAtuais={[fonteAtual.caminho]:fonteAtual.sha256};
  for(const p of caminhos)if(existsSync(resolve(RAIZ,p)))hashesAtuais[p]=sha256(readFileSync(resolve(RAIZ,p)));
  return {inicio,fim:new Date().toISOString(),...verificarCobertura({vivo,inventario,campanha,registros,schema,dominios,fontes,hashesAtuais,politicaFonte})};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const r=await conferirCampanha();
  if(process.argv.includes("--json"))console.log(JSON.stringify(r,null,2));
  else {
    console.log("Inventário: "+r.estrutura+". "+r.resumo.itensVivos+" chaves, "+r.resumo.catalogos+" catálogos/tabelas e "+r.resumo.addons+" addons.");
    console.log("Revisão ausente: "+r.resumo.revisaoAusente+" chaves; "+r.resumo.lotesSemRegistro+" lotes ainda sem registro.");
    for(const e of r.erros.slice(0,20))console.error(JSON.stringify(e));
    if(r.alterados.length)console.error("Conteúdo mudou sem reconciliação: "+r.alterados.slice(0,10).join(", "));
    console.log(r.aviso);
  }
  process.exitCode=r.estrutura!=="PASSOU"?1:process.argv.includes("--exigir-revisao") && (r.revisaoAusente.length||r.lotesSemRegistro.length)?2:0;
}

