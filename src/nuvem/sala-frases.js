/* AS FRASES DO REGISTRO DA SALA (Encontro Unificado, etapa 7c, 2026-11-18).
   FOLHA, zero imports. Nasceu em `sala-fechamento.js` (7b), que importa o motor inteiro, e veio para cá para a tela da
   Sala montar o Registro sem puxar o ciclo de módulos do Afty. `sala-fechamento.js` reexporta `fraseDaPublica`.

   Texto de tela: sem ponto e vírgula e sem travessão. */

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

export const ROTULO = {
  dano: "Dano", danoMetade: "Dano pela Metade", cura: "Cura", gastarPe: "Gastar PE", recuperarPe: "Recuperar PE",
  descansar: "Descansar", alma: "Alma", condicao: "Condições", sessao: "Mudança na Ficha", desfazer: "Desfazer",
};
export const TIPO_LOG = { dano: "dano", danoMetade: "dano", alma: "dano", cura: "cura", condicao: "condicao" };

/** A frase de uma linha pública, com os nomes dos membros (`nomes`: conta -> nome). */
export function fraseDaPublica(p, nomes = {}) {
  const pub = ehObjeto(p?.publica) ? p.publica : {};
  const quem = pub.autor?.combatente?.nome ?? nomes[pub.autor?.conta] ?? (pub.autor?.papel === "mestre" ? "Mestre" : "Alguém");
  switch (p?.especie) {
    case "chat": return `${nomes[pub.autor?.conta] ?? "Alguém"}: ${pub.texto ?? ""}`;
    case "sistema":
      if (pub.evento === "comecar") return "Combate iniciado.";
      if (pub.evento === "encerrar") return "Combate encerrado.";
      if (pub.evento === "reabrir") return "Combate reaberto.";
      if (pub.evento === "rodada") return `Rodada ${pub.rodada ?? ""} iniciada.`;
      if (pub.evento === "turno") return `Turno de ${pub.combatente?.nome ?? "Combatente"}.`;
      if (pub.evento === "entrou") return `${pub.combatente?.nome ?? "Combatente"} entrou.`;
      if (pub.evento === "saiu") return `${pub.combatente?.nome ?? "Combatente"} saiu.`;
      return "Evento do Mestre.";
    case "rolagem": {
      const nome = pub.combatente?.nome ?? quem;
      // A rolagem de tipo "info" (Encerrar Meu Turno) não tem total que se diga.
      const total = pub.tipo === "info" ? "" : pub.total ?? "";
      return `${nome}: ${pub.rotulo || (pub.tipo === "dano" ? "Dano" : "Rolagem")} ${total}.`.replace(/\s+\./, ".");
    }
    default: {
      const alvo = pub.alvo?.nome ?? "Combatente";
      const rotulo = ROTULO[pub.tipo] ?? "Operação";
      const valor = pub.valor != null ? ` ${pub.valor}` : "";
      if (p?.especie === "pedido") {
        const estado = p.estado_pedido === "recusado" ? "Pedido Recusado" : p.estado_pedido === "aceito" ? "Pedido Aceito" : "Pedido";
        return `${estado}: ${rotulo}${valor} em ${alvo}.`;
      }
      return `${rotulo}:${valor} em ${alvo}.`;
    }
  }
}

/**
 * A linha COMPLETA (a que o Mestre e os envolvidos leem) na forma de uma linha pública, para a mesma frase servir às duas.
 * `combatentes`: id -> nome. O que a linha completa tem a mais (delta, antes e depois) fica de fora de propósito: a tela
 * do Registro diz o que foi feito, e o número da Vida de quem está só em Barra não pode escapar por aqui.
 */
export function publicaDaCompleta(o, { combatentes = {} } = {}) {
  const d = ehObjeto(o?.dados) ? o.dados : {};
  const ref = (id) => (typeof id === "string" && id ? { id, nome: combatentes[id] ?? "Combatente" } : null);
  const combatenteDoAutor = ref(d.autor?.combatente);
  const autor = {
    conta: o?.autor ?? d.autor?.conta ?? null,
    papel: o?.papel ?? d.autor?.papel ?? null,
    ...(combatenteDoAutor ? { combatente: combatenteDoAutor } : {}),
  };
  switch (o?.especie) {
    case "chat": return { autor, texto: typeof d.texto === "string" ? d.texto : "" };
    case "sistema": return { autor, evento: d.evento, rodada: d.rodada, ...(ref(d.combatente) ? { combatente: ref(d.combatente) } : {}) };
    case "rolagem": {
      const r = ehObjeto(d.rolagem) ? d.rolagem : {};
      return { autor, ...(ref(d.combatente) ? { combatente: ref(d.combatente) } : {}), tipo: r.tipo, rotulo: r.rotulo, total: r.total };
    }
    default: return { autor, tipo: d.tipo, alvo: ref(d.alvo), ...(d.entrada?.valor != null ? { valor: Math.max(0, Math.trunc(Number(d.entrada.valor) || 0)) } : {}) };
  }
}

/** A frase de uma linha completa. */
export const fraseDaCompleta = (o, ctx = {}, nomes = {}) =>
  fraseDaPublica({ especie: o?.especie, estado_pedido: o?.estado_pedido, publica: publicaDaCompleta(o, ctx) }, nomes);
