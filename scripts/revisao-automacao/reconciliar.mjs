import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ, CONTROLE, coletarInventario, lerJson, hashDado } from "./inventario.mjs";

const controle = new Set(["estado","situacao","fonteFamilia","justificativaRemocao","renomeadoPara","reconciliacao"]);
const normalizar=v=>JSON.parse(JSON.stringify(v));
const dado = item => Object.fromEntries(Object.entries(item).filter(([k,v])=>!controle.has(k)&&v!==undefined));
export function construirProposta({vivo,inventario,escopo={}}) {
  const vivos=new Map(vivo.itens.map(i=>[i.chave,i])), antigos=new Map(inventario.itens.map(i=>[i.chave,i]));
  if(vivos.size!==vivo.itens.length || antigos.size!==inventario.itens.length)throw Error("Identidade duplicada; corrigir antes de reconciliar.");
  const adicionados=vivo.itens.filter(i=>!antigos.has(i.chave)).map(i=>({chave:i.chave,item:normalizar(i),proprietarioSugerido:i.proprietario??null}));
  const removidos=inventario.itens.filter(i=>!vivos.has(i.chave)&&i.situacao!=="REMOVIDO").map(i=>({chave:i.chave,proprietario:i.proprietario,hashAnterior:i.hashDado}));
  const alterados=vivo.itens.filter(i=>antigos.has(i.chave)&&(hashDado(dado(antigos.get(i.chave)))!==hashDado(dado(i))||antigos.get(i.chave).situacao==="REMOVIDO")).map(i=>({
    chave:i.chave,proprietarioMantido:antigos.get(i.chave).proprietario,hashAnterior:antigos.get(i.chave).hashDado,hashNovo:i.hashDado,
    campos:[...new Set([...Object.keys(dado(antigos.get(i.chave))),...Object.keys(dado(i))])].filter(k=>hashDado(antigos.get(i.chave)[k])!==hashDado(i[k])),
  }));
  const p={versao:1,shaInventario:hashDado(inventario),shaVivo:hashDado(normalizar(vivo.itens)),shaEscopo:hashDado(escopo),adicionados,removidos,alterados};
  return {...p,assinatura:hashDado(p),decisoes:{adicoes:{},remocoes:{},justificativaAtualizacao:""},errosColeta:vivo.erros??[]};
}
export function aplicarProposta({proposta,vivo,inventario,campanha,escopo={},registros=[]}) {
  const atual=construirProposta({vivo,inventario,escopo});
  if(proposta.assinatura!==atual.assinatura)throw Error("Proposta obsoleta: inventário, escopo ou catálogo vivo mudou.");
  const declarada=Object.fromEntries(Object.entries(proposta).filter(([k])=>["versao","shaInventario","shaVivo","shaEscopo","adicionados","removidos","alterados"].includes(k)));
  if(hashDado(declarada)!==atual.assinatura)throw Error("Conteúdo da proposta editado; somente decisoes pode ser preenchido.");
  if(atual.errosColeta.length)throw Error("Há erro de coleta; reconciliar não o oculta.");
  const ds=proposta.decisoes??{},lotes=new Map(campanha.lotes.map(l=>[l.lote,l]));
  if((atual.adicionados.length||atual.removidos.length||atual.alterados.length)&&!ds.justificativaAtualizacao?.trim())throw Error("Justificativa da reconciliação ausente.");
  const antigos=new Map(inventario.itens.map(i=>[i.chave,i])),vivos=new Map(vivo.itens.map(i=>[i.chave,i]));
  for(const i of atual.adicionados)if(!lotes.has(ds.adicoes?.[i.chave]))throw Error("Adição sem proprietário confirmado: "+i.chave);
  for(const i of atual.adicionados){
    const vinculo=i.item.referencia??i.item.pai;
    const esperado=ds.adicoes?.[vinculo]??antigos.get(vinculo)?.proprietario??vivos.get(vinculo)?.proprietario;
    if(esperado&&ds.adicoes[i.chave]!==esperado)throw Error("Adição deve conservar o proprietário da referência ou do pai: "+i.chave);
  }
  for(const i of atual.removidos){
    const decisao=ds.remocoes?.[i.chave];
    if(!decisao?.justificativa?.trim())throw Error("Remoção sem justificativa: "+i.chave);
    if(decisao.renomeadoPara&&!vivos.has(decisao.renomeadoPara))throw Error("Destino da renomeação não está vivo: "+i.chave);
  }
  for(const i of atual.alterados)if(vivos.get(i.chave).proprietario&&vivos.get(i.chave).proprietario!==i.proprietarioMantido)throw Error("Mudança de proprietário exige decisão separada no escopo: "+i.chave);
  const resultados=structuredClone({inventario,campanha,escopo,registros});
  resultados.escopo.proprietarios??={};
  const alteradas=new Set([...atual.adicionados,...atual.removidos,...atual.alterados].map(i=>i.chave));
  const lotesAtingidos=new Set();
  for(const i of alteradas){
    const item=vivos.get(i)??antigos.get(i);
    lotesAtingidos.add(antigos.get(i)?.proprietario??ds.adicoes[i]);
    if(item.integracaoProprietario)lotesAtingidos.add(item.integracaoProprietario);
    if(item.proprietarioOriginal)lotesAtingidos.add(item.proprietarioOriginal);
  }
  const invalidados=new Set([...lotesAtingidos].filter(id=>lotes.get(id)?.estado==="APROVADO"));
  resultados.inventario.itens=vivo.itens.map(i=>{
    const velho=antigos.get(i.chave),proprietario=velho?.proprietario??ds.adicoes[i.chave];
    if(!velho)resultados.escopo.proprietarios[i.chave]=proprietario;
    return {...i,proprietario,estado:velho?.estado==="APROVADO"&&(alteradas.has(i.chave)||invalidados.has(proprietario))?"EM REVISÃO":velho?.estado??"NÃO REVISADO",situacao:"VIVO",fonteFamilia:velho?.fonteFamilia??proprietario};
  });
  for(const velho of inventario.itens.filter(i=>!vivos.has(i.chave))){
    const decisao=ds.remocoes?.[velho.chave];
    resultados.inventario.itens.push({...velho,situacao:"REMOVIDO",estado:velho.estado==="APROVADO"?"EM REVISÃO":velho.estado,...(decisao?{justificativaRemocao:decisao.justificativa,renomeadoPara:decisao.renomeadoPara??null}:{})});
  }
  resultados.inventario.itens.sort((a,b)=>a.chave.localeCompare(b.chave));
  for(const lote of resultados.campanha.lotes)if(invalidados.has(lote.lote)){lote.estado="EM REVISÃO";lote.auditoria="NÃO EXECUTADA";}
  for(const r of resultados.registros)if(invalidados.has(r.lote)){
    (r.auditoriasAnteriores??=[]).push(structuredClone(r.auditoria));
    r.estado="EM REVISÃO";r.auditoria={estado:"NÃO EXECUTADA",hashesExaminados:{},achados:[]};
    for(const p of r.parcelas??[])p.evidencia="NÃO VERIFICADA";
  }
  return {...resultados,resumo:{adicionados:atual.adicionados.length,removidos:atual.removidos.length,alterados:atual.alterados.length,lotesAtingidos:[...lotesAtingidos].sort(),lotesInvalidados:[...invalidados].sort()}};
}
const caminhoInterno=p=>{
  const abs=resolve(RAIZ,p),rel=relative(RAIZ,abs);
  if(rel===".."||rel.startsWith(".."+(process.platform==="win32"?"\\":"/"))||isAbsolute(rel))throw Error("Arquivo da proposta deve estar dentro do repositório.");
  return abs;
};
const json=v=>JSON.stringify(v,null,2).replaceAll(String.fromCharCode(0x2014),"\\u2014")+"\n";
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const vivo=await coletarInventario(),inventario=lerJson(resolve(CONTROLE,"inventario.json")),escopo=lerJson(resolve(CONTROLE,"escopo.json"));
    const args=process.argv.slice(2),pos=args.indexOf("--aplicar"),dest=args.indexOf("--proposta");
    if(pos>=0){
      if(!args[pos+1])throw Error("Informe a proposta preenchida após --aplicar.");
      const arquivo=caminhoInterno(args[pos+1]),proposta=lerJson(arquivo),campanha=lerJson(resolve(CONTROLE,"campanha.json"));
      const registros=campanha.lotes.map(l=>resolve(CONTROLE,l.lote,"registro.json")).filter(existsSync).map(lerJson);
      const resultado=aplicarProposta({proposta,vivo,inventario,escopo,campanha,registros});
      const fontes=lerJson(resolve(CONTROLE,"fontes.json"));
      fontes.itens??={};
      for(const ad of proposta.adicionados)fontes.itens[ad.chave]??={proprietario:proposta.decisoes.adicoes[ad.chave],estado:"NÃO LOCALIZADA",fontes:[],nota:"Reconciliação registra identidade, não localiza nem aprova a regra."};
      const rec=lerJson(resolve(CONTROLE,"reconciliacao.json"));
      (rec.historico??=[]).push({data:new Date().toISOString(),proposta:relative(RAIZ,arquivo).replaceAll("\\","/"),assinatura:proposta.assinatura,justificativa:proposta.decisoes.justificativaAtualizacao,...resultado.resumo});
      // Validar toda a transação antes de gravar. Os dados da proposta nunca são executados.
      const gravacoes=[
        [resolve(CONTROLE,"inventario.json"),resultado.inventario],[resolve(CONTROLE,"escopo.json"),resultado.escopo],
        [resolve(CONTROLE,"campanha.json"),resultado.campanha],[resolve(CONTROLE,"fontes.json"),fontes],
        [resolve(CONTROLE,"reconciliacao.json"),rec],...resultado.registros.map(r=>[resolve(CONTROLE,r.lote,"registro.json"),r])
      ].map(([p,v])=>[p,json(v)]);
      const backups=gravacoes.map(([p])=>[p,readFileSync(p)]);
      try{for(const [p,v]of gravacoes)writeFileSync(p,v);}catch(e){for(const [p,v]of backups)writeFileSync(p,v);throw e;}
      console.log("Reconciliação aplicada: "+JSON.stringify(resultado.resumo));
    }else{
      const proposta=construirProposta({vivo,inventario,escopo});
      if(dest>=0){if(!args[dest+1])throw Error("Informe o caminho após --proposta.");const p=caminhoInterno(args[dest+1]);if(existsSync(p))throw Error("Proposta já existe; use outro nome para preservar o histórico.");writeFileSync(p,json(proposta));}
      console.log("Proposta, sem alterar controle: "+proposta.adicionados.length+" adições, "+proposta.removidos.length+" remoções, "+proposta.alterados.length+" atualizações.");
      console.log("Preencha somente decisoes; cada adição precisa de dono confirmado, cada remoção precisa de justificativa.");
      if(proposta.errosColeta.length){console.error(JSON.stringify(proposta.errosColeta));process.exitCode=1;}
    }
  }catch(e){console.error("Reconciliação recusada: "+e.message);process.exitCode=1;}
}

