/** Bloodfeast: primitiva de addon. Escolhas na criatura, recursos na sessão.
 * Fonte: The Crimsom Queen.pdf e esclarecimentos do autor de 2026-09-30.
 * Este módulo é folha para preservar a ordem de inicialização dos catálogos.
 */
const nat = (v) => Math.max(0, Math.trunc(Number(v) || 0));
export const POLITICA_BLOODFEAST = Object.freeze({ consumirInsuficiente: true });
export const HARDBLOOD_EFEITOS = [
  { id: "dano", nome: "Dano", porPonto: 1 },
  { id: "alcance", nome: "Alcance", porPonto: 3 },
  { id: "area", nome: "Área", porPonto: 1.5 },
  { id: "acerto", nome: "Acerto", porPonto: 1 },
  { id: "cd", nome: "CD", porPonto: 1 },
  { id: "auxiliar", nome: "Auxiliar", porPonto: 1 },
];
export const temBloodfeast = (c) => (c?.addons ?? []).some((p) => p?.permite?.includes("bloodfeast"));
export const pacoteBloodfeast = (c) => (c?.addons ?? []).find((p) => p?.permite?.includes("bloodfeast"));
export function passivasBloodfeast(c) {
  if (!temBloodfeast(c)) return [];
  const selecionadas = new Set(c?.bloodfeast?.passivas ?? []);
  return (pacoteBloodfeast(c)?.bloodfeast?.passivas ?? []).filter((p) => p.nivel === 0 || selecionadas.has(p.id));
}
export const limiteBleed = (bt, nivel) => nivel >= 30 ? 99 : Math.min(80, nat(bt) * 10);
export function normalizaBloodfeast(s) {
  return {
    cargas: nat(s?.cargas), hardblood: nat(s?.hardblood), bleed: nat(s?.bleed),
    sanidade: nat(s?.sanidade), sangue: nat(s?.sangue), reutilizado: nat(s?.reutilizado),
    agua: !!s?.agua, ativos: s?.ativos && typeof s.ativos === "object" ? { ...s.ativos } : {},
    ultima: s?.ultima && typeof s.ultima === "object" ? { ...s.ultima } : null,
  };
}
export function resolveBloodfeast(c, { bt = 0, nd = 1, modCon = 0, sessao = null, aptidoes = [] } = {}) {
  const tem = temBloodfeast(c);
  const passivas = passivasBloodfeast(c).filter((p) => p.id !== "pureza_refinada"
    || (passivasBloodfeast(c).some((p) => p.id === "pureza") && aptidoes.includes("mal_regeneracao_corporal")));
  return { tem, bt, nd, modCon, limiteBleed: limiteBleed(bt, nd),
    passivas, ids: passivas.map((p) => p.id),
    custoMaximo: passivas.reduce((n, p) => n + nat(p.custoPV), 0),
    estado: normalizaBloodfeast(sessao),
    textos: pacoteBloodfeast(c)?.bloodfeast ?? {},
    anatomia: tem ? c?.bloodfeast?.anatomia ?? null : null,
  };
}
export function efeitosBloodfeast(b, tipos = []) {
  if (!b.tem) return [];
  const out = [];
  const add = (nome, canal, expr, alvo) => out.push({ fonteId: `bloodfeast:${nome}`, nome,
    canal, expr: String(expr), ...(alvo ? { alvo } : {}), duracao: "permanente" });
  add("Bloodfeast", "vulnerabilidadeDano", 1, "energia_reversa");
  add("Bloodfeast", "vulnerabilidadeDano", 1, "radiante");
  if (b.ids.includes("pureza") && !b.ids.includes("pureza_refinada")) add("Pureza Sanguínea", "resistenciaDano", 1, "venenoso");
  if (b.ids.includes("pureza_refinada")) add("Pureza Sanguínea Refinada", "imunidadeDano", 1, "venenoso");
  if (b.ids.includes("cristalizacao")) for (const t of tipos.filter((t) => !["psiquico", "alma"].includes(t))) {
    add("Cristalização Corporal", "rdTipo", "bt", t);
  }
  if (b.estado.ativos.mircalla) add("Yearning Mircalla", "nivelDano", 2, "the-crimsom-queen:alabarda_mircalla");
  if (b.estado.ativos.defesa) add("Defensive Sancho Hardblood Arts 1", "rdGeral", b.estado.ativos.defesa.valor);
  if (b.estado.ativos.reacao) add("Defensive Sancho Hardblood Arts 2", "rdFisico", "bt");
  return out;
}
export function efeitosPoderDoSangue(b, atual, maximo) {
  if (!b.tem || !b.ids.includes("poder") || atual == null || maximo <= 0) return [];
  const bonus = atual < maximo / 4 ? b.bt : atual < maximo / 2 ? Math.floor(b.bt / 2) : 0;
  if (!bonus) return [];
  const base = { nome: "Poder do Sangue", fonteId: "bloodfeast:poder", expr: String(bonus), duracao: "temporaria" };
  return [...["forca", "destreza", "constituicao"].map((a) => ({ ...base, canal: "bonusPericia", alvo: `atr:${a}` })),
    ...["fortitude", "reflexos"].map((alvo) => ({ ...base, canal: "bonusTR", alvo })),
    ...["corpo", "distancia"].map((alvo) => ({ ...base, canal: "bonusAcerto", alvo }))];
}
/** Manifestação usa o inventário e os modificadores da arma nativos. */
export function comArmaBloodfeast(c, estado) {
  if (!temBloodfeast(c) || !estado?.ativos?.mircalla) return c;
  const pacote = pacoteBloodfeast(c);
  const refId = `${pacote.id}:alabarda_mircalla`;
  const itens = c?.equipamentos?.itens ?? [];
  if (itens.some((e) => e.refId === refId)) return c;
  return { ...c, equipamentos: { ...c.equipamentos, itens: [...itens,
    { uid: "bloodfeast_mircalla", tipo: "arma", refId, qtd: 1, equipado: true,
      fa: { grau: "especial", encantamentos: ["enc_arma_afiada", "enc_arma_canalizadora", "enc_arma_harmonizada"] } }] } };
}
export function aprimoraLinhaBloodfeast(f, ultima) {
  if (!ultima || ultima.id !== f.id) return f;
  const e = configuraHardblood(ultima.escolhas);
  return { ...f, bloodfeastBase: f.bloodfeastBase ?? { cd: f.cd, rolagens: f.rolagens }, cd: f.cd == null ? f.cd : f.cd + e.cd,
    valor: typeof f.valor === "number" ? f.valor + e.auxiliar : f.valor,
    rolagens: (f.rolagens ?? []).map((r) => ({ ...r, dados: r.tom === "cura" ? r.dados : r.dados + e.dano })),
    propriedades: (f.propriedades ?? []).map((p) => {
      if (p.id === "cd" && e.cd) return { ...p, valor: `${(Number(p.valor) || f.cd || 0) + e.cd}` };
      if (p.id === "acerto" && e.acerto) return { ...p, valor: `+${(Number(p.valor) || 0) + e.acerto}` };
      if (p.id === "alcance" && e.alcance) return { ...p, valor: `${p.valor} (+${e.alcance * 3} m)` };
      if (p.id === "area" && e.area) return { ...p, valor: `${p.valor || ""} (+${e.area * 1.5} m)` };
      if (p.id === "valor" && typeof f.valor === "number") return { ...p, valor: f.valor + e.auxiliar };
      return p;
    }) };
}
export function validarBloodfeast(config) {
  if (config == null) return [];
  if (typeof config !== "object" || Array.isArray(config) || !Array.isArray(config.passivas)) return ["Bloodfeast: catálogo de passivas inválido."];
  const erros = [], vistos = new Set();
  for (const p of config.passivas) {
    if (!p || typeof p.id !== "string" || typeof p.nome !== "string" || typeof p.descricao !== "string"
      || !Number.isInteger(p.nivel) || p.nivel < 0 || p.nivel > 5 || !Number.isInteger(p.custoPV) || p.custoPV < 0) {
      erros.push("Bloodfeast: passiva inválida.");
    } else if (vistos.has(p.id)) erros.push(`Bloodfeast: passiva repetida ${p.id}.`);
    else vistos.add(p.id);
  }
  return erros;
}
/** Recebimento de Bleed usa o teto do causador, inclusive em fichas sem addon. */
export function recebeBleed(s, quantidade, maximo) {
  const b = normalizaBloodfeast(s.bloodfeast);
  return { ...s, bloodfeast: { ...b, bleed: Math.min(nat(maximo), b.bleed + nat(quantidade)) } };
}
/** Piso 1 só para custo próprio. Excedentes completos de 3 PV geram Sanidade.
 * Não acumula frações entre eventos. Se já estiver a 0, não ressuscita.
 */
export function pagaVidaBloodfeast(s, custo) {
  const atual = nat(s.hpAtual);
  const pedido = nat(custo);
  const pago = Math.min(Math.max(0, atual - 1), pedido);
  const b = normalizaBloodfeast(s.bloodfeast);
  return { sessao: { ...s, hpAtual: atual - pago,
    bloodfeast: { ...b, sanidade: b.sanidade + Math.floor((pedido - pago) / 3) } }, pago };
}
/** Perda por Bleed nunca usa o piso de custo próprio ou PV temporário. */
export function sofreBleed(s, acoes = 1, cargas = null, proprio = true) {
  const b = normalizaBloodfeast(s.bloodfeast);
  const perda = Math.min(nat(s.hpAtual), nat(cargas ?? b.bleed) * nat(acoes));
  return { ...s, hpAtual: nat(s.hpAtual) - perda,
    bloodfeast: { ...b, cargas: b.cargas + (proprio && s.energiaEmVida ? perda : 0) } };
}
export function configuraHardblood(escolhas = {}) {
  return Object.fromEntries(HARDBLOOD_EFEITOS.map((e) => [e.id, nat(escolhas[e.id])]));
}
export function conjuraBloodfeast(s, f, d, escolhas = {}, { reutilizar = false } = {}) {
  const b = normalizaBloodfeast(s.bloodfeast);
  const e = configuraHardblood(escolhas);
  const total = Object.values(e).reduce((n, x) => n + x, 0);
  const bt = nat(d?.bloodfeast?.bt ?? d?.bt);
  const regraReacao = f.bloodfeastTecnica?.id === "reacao";
  const reacoes = s.usos?.["rodada:bloodfeast_reacoes"] ?? 0;
  const maxReacoes = d?.bloodfeast?.ids.includes("reacoes") ? 2 : 1;
  if (!d?.bloodfeast?.tem || f?.tipo === "passivo" || total > bt || total > b.hardblood
    || !Number.isFinite(f?.custoPE) || nat(s.hpAtual) === 0 || (regraReacao && reacoes >= maxReacoes)) return { ok: false, sessao: s };
  const nivel = f.nivel === "max" ? 6 : nat(f.nivel);
  const exigido = nivel * bt;
  const insuficiente = b.cargas < exigido;
  const consumido = insuficiente && !POLITICA_BLOODFEAST.consumirInsuficiente ? 0 : Math.min(exigido, b.cargas);
  const custo = nat(f.custoPE) * 3;
  const reciclado = reutilizar && d.bloodfeast.ids.includes("ciclagem") ? Math.min(custo, b.sangue) : 0;
  const pagamento = pagaVidaBloodfeast(s, custo - reciclado);
  const apos = normalizaBloodfeast(pagamento.sessao.bloodfeast);
  const reutilizado = b.reutilizado + reciclado;
  const exaustao = reciclado > 0 && reutilizado >= Math.max(0, d.bloodfeast.modCon) * 10 ? 1 : 0;
  const ultima = { id: f.id, nivel, pago: pagamento.pago, reciclado, escolhas: e,
    consumido, insuficiente, ciclagemResolvida: false, curaResolvida: false,
    cdCiclagem: 10 + nivel * 4, cd: (f.bloodfeastBase?.cd ?? f.cd ?? d.cd ?? 0) + e.cd,
    ataques: f.bloodfeastTecnica?.ataques ?? 1,
    rolagens: (f.bloodfeastBase?.rolagens ?? f.rolagens ?? []).map((r) => ({ ...r, dados: r.tom === "cura" ? r.dados : r.dados + e.dano })),
  };
  const ativos = { ...b.ativos };
  if (f.bloodfeastTecnica?.id === "defesa") ativos.defesa = { id: f.id, valor: 18 + e.auxiliar,
    sustentacaoPE: nat(f.sustentacaoPE ?? f.bloodfeastTecnica.sustentacaoPE) };
  if (f.bloodfeastTecnica?.id === "reacao") ativos.reacao = { valor: bt, rodada: s.rodada };
  if (f.bloodfeastTecnica?.id === "mircalla") ativos.mircalla = { id: f.id,
    sustentacaoPE: nat(f.sustentacaoPE ?? f.bloodfeastTecnica.sustentacaoPE) };
  return { ok: true, sessao: { ...pagamento.sessao, peAtual: 0,
    usos: regraReacao ? { ...s.usos, "rodada:bloodfeast_reacoes": reacoes + 1 } : s.usos,
    exaustao: nat(s.exaustao) + exaustao,
    bloodfeast: { ...apos, ativos, cargas: b.cargas - consumido,
      hardblood: b.hardblood - total + (bt > 0 && consumido >= bt ? 1 : 0),
      bleed: Math.min(d.bloodfeast.limiteBleed, b.bleed + (insuficiente ? nivel : 0)),
      sangue: b.sangue - reciclado, reutilizado, ultima } } };
}
export function resolveCiclagem(s, sucesso) {
  const b = normalizaBloodfeast(s.bloodfeast);
  if (!b.ultima || b.ultima.ciclagemResolvida) return s;
  return { ...s, bloodfeast: { ...b, sangue: b.sangue + (sucesso ? Math.floor(b.ultima.pago / 2) : 0),
    ultima: { ...b.ultima, ciclagemResolvida: true } } };
}
export function fimCenaBloodfeast(s) {
  const b = normalizaBloodfeast(s.bloodfeast);
  return { ...s, bloodfeast: { ...b, cargas: 0, hardblood: 0, ativos: {}, ultima: null } };
}
/** Prepara a rodada usando os mesmos pagamentos de energia da sessão. */
export function rodadaBloodfeast(s, d) {
  if (!d?.bloodfeast?.tem) return s;
  let proxima = s;
  const b = normalizaBloodfeast(s.bloodfeast);
  for (const estado of Object.values(b.ativos)) if (estado.sustentacaoPE) {
    proxima = pagaVidaBloodfeast(proxima, estado.sustentacaoPE * 3).sessao;
  }
  return { ...proxima, bloodfeast: { ...normalizaBloodfeast(proxima.bloodfeast),
    ativos: Object.fromEntries(Object.entries(b.ativos).filter(([id]) => id !== "reacao")) } };
}
