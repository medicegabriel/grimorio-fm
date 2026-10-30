import dados from './chrollo-inventario.json' with { type: 'json' };

export const CHAVE = 'fm_creatures_player_v1';
export const MARCA = `catarse-discord:${dados.fonte.guildId}:${dados.fonte.personagemId}`;
export const inventario = dados;
const clonar = v => structuredClone(v);
const normalizar = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const gasto = compras => compras.reduce((s,c) => s + Math.max(0, Math.trunc(Number(c?.custo) || 0)), 0);
const doImporte = c => c?.procedenciaCatarseDiscord?.origem === MARCA;
const mesmaEntrada = (c, i) => normalizar(c?.nome) === normalizar(i.nome)
  || (i.itemId === 27 && normalizar(c?.nome) === 'atributo constituicao');
const semEfeito = c => !c.efeitos?.some(e => e?.canal && String(e?.expr ?? '').trim());

const loja = {
  id:'loja-de-catarse', nome:'Loja de Catarse', versao:'1.0.0', autor:'Afty', paraRaw:'afty',
  permite:['catarse'], catarse:{precos:{talentos:3,habilidades:3,melhoriasSuperiores:6,
    lendarias:8,aptidoes:4,pericias:1,feiticos:2,texto:5}},
};

/** Prepara uma cópia da ficha existente, sem gravar nem tocar nas demais fichas. */
export function prepararImportacao(biblioteca) {
  if (!Array.isArray(biblioteca)) throw new Error('A biblioteca de personagens está inválida.');
  const alvos = biblioteca.filter(c => normalizar(c?.name) === 'chrollo' && c?.rulesVersion === 'player');
  if (alvos.length !== 1) throw new Error(alvos.length
    ? 'Há mais de uma ficha Chrollo. Renomeie as cópias antes de importar.'
    : 'A ficha Chrollo não foi encontrada neste navegador. Abra esta página no mesmo navegador de /Player.');
  const anterior = alvos[0];
  if (anterior.catarse?.importacoes?.[MARCA]) {
    return {jaAplicado:true, anterior, ficha:anterior, biblioteca, adicionados:0, conflitos:[]};
  }
  const ficha = clonar(anterior);
  const catarse = ficha.catarse ?? {saldo:0,compras:[]};
  const originais = Array.isArray(catarse.compras) ? catarse.compras : [];
  const conflitos = [];
  const adotadas = new Set();
  const linhas = dados.itens.map(i => {
    const importadas = originais.filter(c => doImporte(c) && c.procedenciaCatarseDiscord.itemId === i.itemId);
    const manuais = originais.filter(c => !doImporte(c) && mesmaEntrada(c,i));
    if (importadas.length > 1 || manuais.length > 1 || (importadas.length && manuais.length)) {
      conflitos.push(`${i.nome}: há registros repetidos na ficha.`);
    }
    const existente = importadas[0] ?? manuais[0];
    if (manuais.length && (!semEfeito(existente)
      || (String(existente.texto ?? '').trim() && existente.texto !== i.texto))) {
      conflitos.push(`${i.nome}: a anotação existente já contém regra ou efeitos próprios.`);
    }
    if (existente) adotadas.add(existente.id);
    return {
      ...existente,
      id:existente?.id ?? `${MARCA}:item:${i.itemId}`,
      familia:'texto',
      nome:i.itemId === 27 ? 'Atributo [Constituição]' : i.nome,
      texto:i.texto,
      quantidade:i.quantidade,
      // Aquisições já pagas na origem não descontam novamente o saldo da ficha.
      custo:existente?.custo ?? 0,
      efeitos:clonar(i.efeitos),
      procedenciaCatarseDiscord:{...dados.fonte,origem:MARCA,itemId:i.itemId,
        compras:[...i.compras],quantidade:i.quantidade,
        custoHistoricoConhecido:i.custoHistoricoConhecido,custoCompleto:i.custoCompleto,
        compensacaoHistorica:i.custoHistoricoConhecido},
    };
  });
  const compras = [...originais.filter(c => !adotadas.has(c.id)), ...linhas];
  ficha.catarse = {...catarse,compras,importacoes:{...catarse.importacoes,[MARCA]:{
    sha256:dados.fonte.sha256,itens:13,unidades:22,aquisicoes:16,
    constituicao:6,custoHistoricoConhecido:120,naoDebitadoNovamente:true,
  }}};
  ficha.addons = Array.isArray(ficha.addons) ? ficha.addons : [];
  if (!ficha.addons.some(a => a?.permite?.includes('catarse'))) ficha.addons.push(clonar(loja));
  return {jaAplicado:false,anterior,ficha,conflitos,adicionados:linhas.length,
    saldoAntes:Number(catarse.saldo ?? 0)-gasto(originais),
    saldoDepois:Number(catarse.saldo ?? 0)-gasto(compras),
    biblioteca:biblioteca.map(c => c === anterior ? ficha : c)};
}

/** Recusa gravação se a biblioteca mudou desde a prévia e exige backup primeiro. */
export function aplicarImportacao(storage, textoEsperado) {
  if (storage.getItem(CHAVE) !== textoEsperado) throw new Error('A ficha mudou em outra aba. Atualize esta página.');
  const plano = prepararImportacao(JSON.parse(textoEsperado || '[]'));
  if (plano.jaAplicado) return {...plano,backup:null};
  if (plano.conflitos.length) throw new Error(plano.conflitos.join('\n'));
  const backup = `backup-chrollo-catarse-${new Date().toISOString()}`;
  storage.setItem(backup,textoEsperado);
  if (storage.getItem(backup) !== textoEsperado) throw new Error('Não foi possível verificar a cópia de segurança.');
  storage.setItem(CHAVE,JSON.stringify(plano.biblioteca));
  if (storage.getItem(CHAVE) !== JSON.stringify(plano.biblioteca)) throw new Error('Não foi possível verificar a gravação.');
  return {...plano,backup};
}
