/* ============================================================
   DESTINOS DA BUSCA GLOBAL QUE SÓ A PRÉVIA DO G2 ACRESCENTA (2026-10-21)
   ============================================================
   `alvosDeBusca` (ficha-conteudo.js) é compartilhado com a clássica e continua como está. Aqui ficam os destinos que faltavam e que as
   abas da prévia sabem revelar: as Expansões de Domínio (aba Ações) e os seis Atributos (aba Perícias). Mesmo formato, a `chave` é a
   âncora da linha e o `grupo` já é o rótulo mostrado no resultado. E a aba de Outros, que na prévia é Perícias. Folha pura.
   ============================================================ */
import { semAcento } from "../ficha-conteudo";
import { AFTY_ATTRS } from "../../afty-schema";

export function alvosExtrasDaBusca(derived) {
  const fora = [];
  for (const d of derived?.dominios?.lista ?? []) {
    const nome = d.nome || "Domínio Sem Nome";
    fora.push({ chave: `dominio:${d.id}`, id: d.id, nome, aba: "acoes", grupo: "Expansões de Domínio", detalhe: d.area ? `Área ${d.area}` : null, busca: semAcento(`${nome} expansao dominio ${d.area ?? ""}`) });
  }
  for (const a of AFTY_ATTRS) {
    const valor = derived?.attrEff?.[a.key];
    fora.push({ chave: `atributo:${a.key}`, id: a.key, nome: a.label, aba: "pericias", grupo: "Atributos", detalhe: valor != null ? String(valor) : null, busca: semAcento(`${a.label} ${a.abbr} atributo`) });
  }
  /* Resistências por Tipo de Dano (2026-11-14): "Queimante" leva à linha do tipo em Perícias, com a RD no detalhe. */
  const ROTULO_ESTADO = { imune: "Imune", resistente: "Resistente", vulneravel: "Vulnerável" };
  for (const l of derived?.defesasDano?.linhas ?? []) {
    const estados = l.estados.map((e) => ROTULO_ESTADO[e]).filter(Boolean);
    fora.push({ chave: `defesa:${l.tipo}`, id: l.tipo, nome: l.label, aba: "pericias", grupo: "Resistências por Tipo de Dano",
      detalhe: [`RD ${l.rd}`, ...estados].join(", "), busca: semAcento(`${l.label} rd resistencia imunidade vulnerabilidade dano ${estados.join(" ")}`) });
  }
  return fora;
}

/* Na prévia, o bloco Outros (Manobras, Concentração, Fintar, Provocar, Teste de Morte e o que mais o derive entregar) mora em Perícias
   (aceite do autor, 21/10). `alvosDeBusca` continua apontando esses destinos para Ações, porque é o da clássica e do Encontro: aqui só a
   ABA muda, a chave (`manobra:<id>`, a âncora do cartão) e o grupo ficam. */
const ABA_NA_PREVIA = { manobra: "pericias" };

/** Os destinos da busca global no G2 da prévia: os de sempre, com a aba de Outros corrigida, mais os que só a prévia sabe revelar. */
export function alvosDaBuscaG2(alvos, derived) {
  return [...alvos.map((a) => (ABA_NA_PREVIA[a.grupo] ? { ...a, aba: ABA_NA_PREVIA[a.grupo] } : a)), ...alvosExtrasDaBusca(derived)];
}

/** Quais destinos a prévia abre ao chegar: os de detalhe no lugar da aba Ações. */
export const abreAoChegar = (chave) => /^(dano|feitico|dominio):/.test(chave ?? "");
