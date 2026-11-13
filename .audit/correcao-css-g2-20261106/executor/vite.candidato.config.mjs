import fs from 'node:fs';
import postcss from 'postcss';
import base from './vite.config.mjs';
const pares = JSON.parse(fs.readFileSync(new URL('../../revisao-claude-g2-css-20261105/pares-g2-contrato.json', import.meta.url)));
pares['e-consulta'] = ['afty-consulta'];
pares['h-hist-painel'] = ['afty-historico'];
const pintura = /^(color|background.*|border.*|box-shadow|font.*|letter-spacing|text-decoration.*|outline.*)$/;
export function transforma(code) {
  const raiz = postcss.parse(code);
  raiz.walkRules(rule => {
    if (rule._feito || (rule.parent.type === 'atrule' && rule.parent.name === 'scope')) return;
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    const seletores = rule.selectors;
    const novos = [];
    const restantes = [];
    for (const s of seletores) {
      // Último composto, preservando os combinadores dentro de :is e :has.
      let p = 0, corte = 0;
      for (let i = 0; i < s.length; i++) {
        if ('(['.includes(s[i])) p++;
        else if (')]'.includes(s[i])) p--;
        else if (!p && ' >+~'.includes(s[i])) corte = i + 1;
      }
      const alvo = s.slice(corte);
      const classes = [...alvo.matchAll(/\.([a-z][a-z0-9-]*)/gi)]
        .map(m => m[1]).filter(c => c !== 'e-g2' && pares[c]);
      if (!classes.length || !s.includes('.e-g2')) { restantes.push(s); continue; }
      novos.push(`:where(${s}):is(${classes.map(c=>'.'+c).join(', ')})`);
    }
    const decls = rule.nodes.filter(n => n.type === 'decl' && pintura.test(n.prop));
    if (!decls.length || !novos.length) return;
    if (restantes.length) {
      const intacta = rule.clone({selector: restantes.join(', ')});
      intacta._feito = true;
      rule.before(intacta);
      rule.selector = seletores.filter(s=>!restantes.includes(s)).join(', ');
    }
    const scoped = postcss.atRule({ name: 'scope', params: '(#afty-ficha)' });
    const fraca = postcss.rule({ selector: novos.join(', ') });
    decls.forEach(d => fraca.append(d.clone()));
    scoped.append(fraca);
    rule.after(scoped);
    decls.forEach(d => d.remove());
  });
  return raiz.toString();
}
export default { ...base, plugins: [{ name: 'candidato-superficies', enforce: 'pre', transform(code, id) {
  if (!/\/(efeitos-g2|abas-g2)\.css$/.test(id.replaceAll('\\', '/'))) return null;
  return { code: transforma(code), map: null };
}}, ...base.plugins] };
