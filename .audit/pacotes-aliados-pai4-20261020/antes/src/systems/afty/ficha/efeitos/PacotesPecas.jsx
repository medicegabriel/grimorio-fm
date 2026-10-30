/* ============================================================
   PACOTES PARA ALIADOS: as peças que o suporte e o aliado dividem
   ============================================================
   O resumo de uma opção (o que dá, o prazo, as condições, o custo de quem emite,
   o que é só consulta) é o MESMO nos dois lados: o suporte confere o que vai
   exportar, e o aliado confere o que vai ativar. Só o título do bloco muda
   ("Para o Aliado" no suporte, "Para Você" no aliado).

   O custo do emissor é informação e nunca vira um "Descontar": a Energia de quem
   recebe não paga a manutenção nem a conjuração do amigo.
   ============================================================ */
import React from "react";
import { AlertTriangle, Hand } from "lucide-react";
import { temPrazoPorBeneficio, textoDaDuracao } from "../pacotes-aliados";
import { textoDoRecebido } from "./recebidos";

export function ResumoDaOpcao({ o, papel = "aliado" }) {
  if (!o) return null;
  const beneficios = o.beneficios ?? [];
  const consulta = o.consulta ?? [];
  return (
    <div className="pa-resumo" data-resumo-opcao>
      {o.bloqueio && <span className="x-atencao" data-bloqueio><AlertTriangle aria-hidden="true" />{o.bloqueio}</span>}
      {beneficios.length > 0 && (
        <div className="pa-bloco">
          <span className="g-rotulo">{papel === "emissor" ? "Para o Aliado" : "Para Você"}</span>
          <ul className="g-frases" data-beneficios>{beneficios.map((b, i) => <li key={i}>{textoDoRecebido(b)}</li>)}</ul>
        </div>
      )}
      {consulta.length > 0 && (
        <div className="pa-bloco">
          <span className="g-rotulo">Só Consulta</span>
          <ul className="g-frases" data-consulta>{consulta.map((c, i) => <li key={i}><b>{c.rotulo}</b> {c.texto}</li>)}</ul>
        </div>
      )}
      <div className="pa-bloco">
        <span className="g-rotulo">Prazo</span>
        {/* Prazo por benefício (PA-I3): cada linha de cima diz o seu. */}
        <span className="x-texto" data-prazo>{temPrazoPorBeneficio(o) ? "Por Benefício" : textoDaDuracao(o.duracao)}</span>
      </div>
      {(o.condicoes ?? []).length > 0 && (
        <div className="pa-bloco">
          <span className="g-rotulo">Condições</span>
          {o.condicoes.map((t) => <span key={t} className="x-neutro"><Hand aria-hidden="true" />{t}</span>)}
        </div>
      )}
      {o.custoEmissor && <span className="x-neutro" data-custo-emissor>Custo do Emissor: {o.custoEmissor}</span>}
      {(o.naoRepresentado ?? []).map((t) => <span key={t} className="x-mesa">{t}</span>)}
    </div>
  );
}
