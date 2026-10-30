/* AS CÉLULAS DE AGORA NA MESA (prévia das três abas do G2, 2026-10-21): o que cada condicional mostra na faixa de resumo, lido do derive e
   da sessão, e a ação principal pelo MESMO verbo do painel. Folha pura: sem React. Ver `MesaG2.jsx`. */
import { Eye, EyeOff } from "lucide-react";
import { alternaOlhos, FADIGA_MAXIMA } from "../../afty-vislumbre-celeste";
import { alteraOlhinhosLu, ESTADO_OLHOS_LU } from "../../afty-olhinhos-lu";
import { usosAgulhaGastos } from "../../afty-olhos-agulha";
import { estadoForma } from "../../afty-armas-transformaveis";
import { normalizaBloodfeast } from "../../afty-bloodfeast";
import { custoDoGolpeDaSessao } from "../ficha-sessao";
import { propriedadesDoGolpe } from "../efeitos/efeitos-dados";

/** As células que existem nesta ficha, na ordem dos painéis de antes. Só leitura do derive e da sessão. */
export function celulasDaMesa({ derived, sessao, nos }) {
  const out = [];
  const emCombate = !!sessao?.combate?.ativo;
  /* Uma célula para todos os Ciclos: o painel existente desenha todos juntos, e o corpo é um só. */
  const ciclos = derived?.primitivas?.includes("adaptacao") ? (derived.adaptacoes ?? []) : [];
  if (ciclos.length) {
    const pend = ciclos.reduce((n, c) => n + (c.estado.pendentes > 0 ? c.estado.pendentes : 0), 0);
    out.push({
      id: "adaptacao", nome: ciclos.length === 1 ? ciclos[0].nome : "Ciclos de Adaptação", corpo: "adaptacao",
      estado: ciclos.map((c) => `Giros ${c.estado.giros}`).join(" · "),
      pendente: pend > 0 ? { n: pend, assinatura: ciclos.map((c) => `${c.chave}:${c.estado.giros}:${c.estado.pendentes}:${c.estado.ganhos?.length ?? 0}`).join("|") } : null,
    });
  }
  if (derived?.bloodfeast?.tem || normalizaBloodfeast(sessao?.bloodfeast).bleed) {
    const b = normalizaBloodfeast(sessao?.bloodfeast);
    const ciclagemAberta = !!b.ultima && derived?.bloodfeast?.ids?.includes("ciclagem") && !b.ultima.ciclagemResolvida;
    out.push({
      id: "bloodfeast", nome: "Bloodfeast", corpo: "bloodfeast",
      estado: derived?.bloodfeast?.tem ? `Bloodfeast ${b.cargas} · Hardblood ${b.hardblood} · Bleed ${b.bleed}` : `Bleed ${b.bleed}`,
      pendente: ciclagemAberta ? { n: 1, assinatura: `${b.ultima.id}:${b.ultima.pago}:${b.ultima.cd}` } : null,
    });
  }
  const v = derived?.vislumbre;
  if (v?.tem) {
    out.push({
      id: "vislumbre", nome: "Vislumbre Celeste", corpo: "vislumbre",
      estado: `${v.bloco.rotulo} · Fadiga ${v.fadiga}/${FADIGA_MAXIMA}`,
      acao: { rotulo: v.descoberto ? "Cobrir" : "Descobrir", pressionado: v.descoberto, icone: v.descoberto ? Eye : EyeOff, verbo: (s) => alternaOlhos(s, !v.descoberto) },
    });
  }
  const lu = derived?.olhinhosLu;
  if (lu?.tem) {
    out.push({
      id: "olhinhosLu", nome: lu.nome, corpo: "olhinhosLu",
      estado: lu.fechados ? "Olhos Fechados" : "Olhos Abertos",
      acao: { rotulo: lu.fechados ? "Abrir Olhos" : "Fechar Olhos", pressionado: lu.fechados, icone: lu.fechados ? EyeOff : Eye, verbo: (s) => alteraOlhinhosLu(s, ESTADO_OLHOS_LU, !lu.fechados) },
    });
  }
  const ag = derived?.olhosAgulha;
  if (ag?.tem) {
    const restantes = Math.max(0, ag.usosMax - usosAgulhaGastos(sessao));
    out.push({ id: "olhosAgulha", nome: "Olhos de Agulha", corpo: "olhosAgulha", estado: `Olhos ${ag.olhos} · Olhar ${restantes}/${ag.usosMax}` });
  }
  const ceu = derived?.manipulacaoCeu;
  if (ceu?.disponivel) {
    out.push({
      id: "manipulacaoCeu", nome: "Refletir Imagem", corpo: "manipulacaoCeu",
      estado: `Aura ${ceu.auraAtiva ? `${ceu.percentual}%` : "Inativa"} · Cópias ${ceu.copias}/${ceu.maxCopias}`,
      /* O mesmo `onEstado` do painel, com a mesma trava: só em combate e com a Aura disponível. */
      acaoEstado: { rotulo: ceu.auraAtiva ? "Desligar Aura" : "Ligar Aura", pressionado: ceu.auraAtiva, desligado: !(emCombate && ceu.temAura), estado: { id: "auraEmbacada" }, valor: !ceu.auraAtiva },
    });
  }
  const armas = derived?.armasTransformaveis ?? [];
  if (armas.length) {
    const s = estadoForma(sessao?.combate, armas[0].id);
    out.push({
      id: "armasTransformaveis", nome: armas.map((a) => a.nome).join(", "), corpo: "armasTransformaveis",
      estado: s.reunida ? `Espada Colossal · ${s.clones} Clones` : "Lâminas Separadas",
    });
  }
  if (derived?.golpeEspecial?.disponivel) {
    const marcas = propriedadesDoGolpe(sessao).map((x) => x.texto);
    const custo = custoDoGolpeDaSessao(sessao, derived);
    out.push({
      id: "golpe", nome: "Golpe Especial", golpe: true,
      estado: marcas.length ? `${marcas.join(", ")} · ${custo.aPagar} PE` : (emCombate ? "Sem Marcas" : "Fora de Combate"),
    });
  }
  if ((derived?.gatilhosTreino ?? []).length) {
    out.push({ id: "treinos", nome: "Treinos", gatilhos: derived.gatilhosTreino });
  }
  return out.filter((c) => !c.corpo || nos[c.corpo] != null);
}
