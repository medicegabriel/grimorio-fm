import fs from 'node:fs';

const pasta = new URL('./', import.meta.url);
const fonte = JSON.parse(fs.readFileSync(new URL('inventario-fonte.json', pasta), 'utf8'));
const dados = {
  versao: 1,
  fonte: { sistema: 'catarse-discord', guildId: fonte.identity.guild_id,
    personagemId: fonte.identity.character_id, dono: fonte.identity.discord_username,
    sha256: fonte.source.sha256, atualizadoEm: fonte.source.last_modified_utc },
  itens: fonte.inventory_grouped.map(i => ({
    itemId: i.item_id, nome: i.name, texto: i.description_verbatim,
    quantidade: i.quantity, compras: i.purchase_ids,
    custoHistoricoConhecido: i.known_historical_paid, custoCompleto: i.costs_complete,
    efeitos: i.item_id === 27 ? [{canal:'atributo', alvo:'constituicao', expr:String(i.quantity)}]
      : i.item_id === 31 ? [{canal:'vagasLendaria', expr:String(i.quantity)}] : [],
  })),
};
fs.writeFileSync(new URL('chrollo-inventario.json', pasta), JSON.stringify(dados, null, 2) + '\n');
console.log(`${dados.itens.length} itens, ${dados.itens.reduce((s,i)=>s+i.quantidade,0)} unidades`);
