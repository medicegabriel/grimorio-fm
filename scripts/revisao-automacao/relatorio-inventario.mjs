import { coletarInventario } from "./inventario.mjs";
const inventario=await coletarInventario();
if(process.argv.includes("--json"))console.log(JSON.stringify(inventario,null,2));
else {
  console.log(inventario.itens.length+" chaves, "+inventario.catalogos.length+" catálogos/tabelas, "+inventario.addons.length+" addons.");
  console.log("Integrações herdadas: "+inventario.addons.reduce((s,a)=>s+a.herdadas.length,0)+". Erros de coleta: "+inventario.erros.length+".");
  console.log("Somente leitura. --json emite o inventário vivo, sem atualizar registros ou estados.");
}
process.exitCode=inventario.erros.length?1:0;

