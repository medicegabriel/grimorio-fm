import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
await import("../src/systems/afty/afty-derive.js");
const { verificarCobertura, validarRegistro }=await import("../scripts/revisao-automacao/cobertura.mjs");
const { coletarInventario, lerJson, CONTROLE }=await import("../scripts/revisao-automacao/inventario.mjs");
const { resolve }=await import("node:path");
let ok=0;
const bad=[];
const t=(nome,real,esp)=>{
  if(JSON.stringify(real)===JSON.stringify(esp))ok++;
  else bad.push(nome+": "+JSON.stringify(real)+" != "+JSON.stringify(esp));
};
const schema=lerJson(resolve(CONTROLE,"schema-registro.json"));
const item={chave:"catalogo::proprio",id:"proprio",nome:"Regra Própria",proprietario:"X01",hashDado:"h1",estado:"NÃO REVISADO"};
const fixture=()=>({
  vivo:{itens:[{...item}],catalogos:[],addons:[],erros:[]},
  inventario:{itens:[{...item}]},
  campanha:{lotes:[{lote:"X01",estado:"NÃO REVISADO",dependencias:[]}]},
  registros:[],schema,dominios:{},fontes:{X01:{fontes:[]}},hashesAtuais:{}
});
const tipos=f=>verificarCobertura(f).erros.map(e=>e.tipo);
let f=fixture();
t("inventário íntegro passa sem inventar aprovação",verificarCobertura(f).estrutura,"PASSOU");
t("item não revisado continua apontado",verificarCobertura(f).revisaoAusente.length,1);
t("registro de revisão inexistente continua apontado",verificarCobertura(f).lotesSemRegistro,["X01"]);
f=fixture();f.vivo.itens.push({...item,chave:"catalogo::novo"});
t("conteúdo novo sem registro é detectado",tipos(f).includes("item vivo sem registro"),true);
f=fixture();f.vivo.itens=[];
t("id removido gera registro órfão",tipos(f).includes("registro órfão"),true);
f=fixture();f.inventario.itens.push({...item,proprietario:"Y01"});
t("proprietário duplicado é detectado",tipos(f).includes("registro/proprietário duplicado"),true);
f=fixture();f.inventario.itens[0].proprietario="inexistente";
t("lote inexistente não recebe conteúdo",tipos(f).includes("proprietário inexistente"),true);
f=fixture();f.inventario.itens[0].estado="FEITO";
t("não aceita estado inventado",tipos(f).includes("estado inválido"),true);
f=fixture();f.vivo.itens[0].hashDado="outro";
t("regra mudou com mesmo id",verificarCobertura(f).alterados,["catalogo::proprio"]);
f=fixture();f.vivo.itens[0].dominio="tipoAlvo:inventado";
t("domínio novo exige protocolo",tipos(f).includes("domínio sem protocolo"),true);
f=fixture();f.inventario.itens[0].referencia="catalogo::ausente";
t("referência removida não some calada",tipos(f).includes("referência órfã"),true);
f=fixture();f.inventario.itens[0].situacao="REMOVIDO";
t("tombstone não pode esconder item vivo",tipos(f).includes("item removido voltou ao catálogo"),true);
f=fixture();f.vivo.itens=[];f.inventario.itens[0].situacao="REMOVIDO";
t("remoção requer explicação",tipos(f).includes("remoção sem explicação"),true);
f.inventario.itens[0].justificativaRemocao="Removido após comparação com snapshot e hash";
t("remoção documentada conserva rastreabilidade",tipos(f).length,0);
f=fixture();f.inventario.itens[0].estado="APROVADO";
t("status na planilha não basta para aprovar",tipos(f).includes("item aprovado sem auditoria de lote"),true);
const registro=()=>({
  lote:"X01",data:"2026-10-05",executor:"Executor",estado:"IMPLEMENTADO, AGUARDA AUDITORIA",
  base:{commit:"base",alteracoesPreexistentes:[],hashesIniciais:{},hashesFinais:{arquivo:"hash"}},
  itens:[{...item}],parcelas:[{
    chaveItem:item.chave,parcela:"efeito",sistemas:["afty","player"],
    fontes:[{caminho:"Fonte Própria",versao:"1",local:"p. 1 impressa e PDF 1"}],
    esperado:"mesma regra nos dois sistemas",observado:"comportamento ainda não auditado",
    regra:"CONFIRMADA",execucao:"COMPLETA",motor:"INTEGRADO",autoria:"ADDON",evidencia:"NÃO VERIFICADA",
    percurso:[],provas:[{cenario:"configuração própria",esperado:"efeito declarado",observado:"efeito observado",estado:"PASSOU"}],
    dependencias:[],pendencias:[],provaAutoria:"Instalação real de addon próprio com dois valores"
  }],
  validacao:{linhaDeBase:[],resultadoFinal:[],naoVerificado:[]},
  auditoria:{estado:"NÃO EXECUTADA",hashesExaminados:{},achados:[]}
});
let r=registro();
t("estrutura comum aceita estados originais",validarRegistro(r,schema),[]);
r.parcelas[0].sistemas=["rota"];
t("schema exige sistema da ficha",validarRegistro(r,schema).some(s=>s.includes("sistemas")),true);
r=registro();delete r.parcelas[0].motor;
t("schema exige estado de integração separado",validarRegistro(r,schema).some(s=>s.includes("motor")),true);
r=registro();r.data="2026-02-30";
t("data impossível é recusada",validarRegistro(r,schema).some(s=>s.includes("data inválida")),true);
f=fixture();r=registro();f.registros=[r];f.campanha.lotes[0].estado=r.estado;
t("hash de outra versão não vira prova",tipos(f).includes("hash final divergente"),true);
f.hashesAtuais.arquivo="hash";
t("registro implementado com hash correto fica sem aprovação",verificarCobertura(f).revisaoAusente.length,1);
r.estado="APROVADO";f.campanha.lotes[0].estado=r.estado;
t("aprovação exige auditor independente",tipos(f).includes("lote aprovado sem auditor independente"),true);
r.parcelas[0].evidencia="APROVADA";r.parcelas[0].provaAutoria="";
t("passar teste de dados sem autoria real não aprova",tipos(f).includes("aprovação de parcela sem critérios"),true);
r.parcelas[0].provaAutoria="addon próprio instalado";r.auditor="Auditor";r.auditoria={estado:"APROVADO",hashesExaminados:{arquivo:"antigo"},achados:[]};
t("auditoria fica vinculada aos hashes examinados",tipos(f).includes("auditoria de outra versão"),true);
r.auditoria.hashesExaminados.arquivo="hash";f.inventario.itens[0].estado="APROVADO";
t("aprovação completa e independente satisfaz o contrato",tipos(f),[]);
f.vivo.itens.push({...item,chave:"catalogo::segunda"});f.inventario.itens.push({...item,chave:"catalogo::segunda"});
t("lote aprovado não pode omitir segundo componente",tipos(f).includes("lote aprovado sem cobertura explícita"),true);
f=fixture();r=registro();f.registros=[r,structuredClone(r)];f.hashesAtuais.arquivo="hash";f.campanha.lotes[0].estado=r.estado;
t("dois registros não duplicam aprovação do mesmo item",tipos(f).includes("item declarado em dois registros"),true);
f=fixture();r=registro();r.estado="APROVADO";r.auditor="Auditor";r.auditoria={estado:"APROVADO",hashesExaminados:{arquivo:"hash"},achados:[]};f.registros=[r];f.campanha.lotes[0].estado=r.estado;f.hashesAtuais.arquivo="hash";r.parcelas[0].evidencia="APROVADA";r.parcelas[0].provas.push({cenario:"contraprova",esperado:"regra",observado:"erro",estado:"FALHOU"});
t("prova reprovada impede aprovação da parcela",tipos(f).includes("aprovação de parcela sem critérios"),true);
r.parcelas[0].provas.pop();r.itens.push({...item,chave:"catalogo::outra"});f.inventario.itens.push({...item,chave:"catalogo::outra"});f.vivo.itens.push({...item,chave:"catalogo::outra"});
t("declarar item sem parcela não aprova sua regra",tipos(f).includes("item aprovado sem parcela"),true);
r.itens.pop();f.inventario.itens.pop();f.vivo.itens.pop();r.auditoria.hashesExaminados={outroArquivo:"outro"};f.hashesAtuais.outroArquivo="outro";
t("auditoria deve cobrir arquivos da entrega",tipos(f).includes("auditoria não cobre hash da entrega"),true);
const live=await coletarInventario();
t("coleta real de addons não recusa silenciosamente pacote",live.erros,[]);
const roubaveis=live.itens.filter(i=>i.export==="HABILIDADES_ROUBAVEIS"&&i.id!=="@catalogo");
t("Roubo preserva referência original sem nova habilidade",roubaveis.every(i=>i.tipo==="referência"&&i.referencia==="afty-habilidades.js::AFTY_HABILIDADES::"+i.id),true);
const herdadas=live.itens.filter(i=>i.tipo==="integração herdada");
t("integrações herdadas mantêm proprietário original",herdadas.length>0&&herdadas.every(i=>i.regraOriginal&&i.proprietarioOriginal&&i.proprietario),true);
t("identidades repetidas de tabelas não colidem",new Set(live.itens.map(i=>i.chave)).size,live.itens.length);
const novamente=await coletarInventario();
t("coleta é estável após instalar e retirar todos os addons",novamente.itens.map(i=>[i.chave,i.hashDado,i.proprietario]),live.itens.map(i=>[i.chave,i.hashDado,i.proprietario]));
console.log(bad.length?bad.join("\n"):"TODOS OS "+ok+" ASSERTS PASSARAM");
process.exitCode=bad.length?1:0;

