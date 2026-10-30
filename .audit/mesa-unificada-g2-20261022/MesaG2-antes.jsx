/* ============================================================
   AGORA NA MESA: a faixa de resumo dos condicionais da aba Ações (prévia, 2026-10-21)
   ============================================================
   Antes, até nove painéis inteiros vinham empilhados antes do Rápido e do Dano. Agora cada condicional é uma CÉLULA de uma linha: nome,
   estado e, quando o painel tem uma ação principal simples, essa ação pelo MESMO verbo do painel. O painel completo (o existente, sem
   reescrita) abre abaixo da faixa, um por vez.

   ⚠ Os corpos fechados ficam MONTADOS e ocultos (`AbaCongelada`): a Narrativa da Adaptação, as escolhas do Bloodfeast e o resto do estado
   interno de cada painel sobrevivem a fechar o corpo e a trocar de aba.

   PENDÊNCIA: uma pendência nova (assinatura diferente) abre o corpo uma vez. Fechar vale até surgir outra. Fechar nunca executa nada.
   O Golpe Especial não tem corpo aqui: a montagem é a Preparação dos Efeitos (decisão 2A), pela mesma entrada das Habilidades.
   ============================================================ */
import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Swords } from "lucide-react";

import AbaCongelada from "./aba-congelada";
import { celulasDaMesa } from "./mesa-celulas";

/**
 * O GOLPE ESPECIAL PELA PREPARAÇÃO DOS EFEITOS (decisão 2A). Os mesmos dois verbos da entrada das Habilidades (`EntradaDoPreparo`):
 * inativo, abre a Preparação no painel sem gravar nada; ativo, abre o detalhe do Golpe no painel, onde mora o Montar Outro Golpe. Quem
 * aplica as marcas, cobra, protege contra clique duplo e registra no Histórico é o `aplicaGolpe`, ao Confirmar. Esta célula não marca
 * nada direto (a marcação imediata segue na clássica e no Encontro).
 */
export function BotaoGolpe({ g, o, onAbrirPainel }) {
  if (!o) return null;
  const ativo = g.ativos.some((a) => a.chave === o.chave);
  const aoClicar = () => {
    if (ativo) g.acoes.abrirNoPainel(o.chave);
    else if (!g.acoes.abrirPreparo(o)) return;
    onAbrirPainel?.();
  };
  return (
    <button type="button" className="m-botao m-celula-acao" data-m-golpe={ativo ? "ativo" : "inativo"} onClick={aoClicar}
      title={ativo ? "Abrir o Golpe nos Efeitos, onde está o Montar Outro Golpe" : "Montar o Golpe na Preparação dos Efeitos"}>
      {ativo ? "Abrir Golpe" : "Montar Golpe"}
    </button>
  );
}

export default function MesaG2({ derived, sessao, onSessao, onEstado, onGatilhoTreino, nos, golpe }) {
  const celulas = useMemo(() => celulasDaMesa({ derived, sessao, nos }), [derived, sessao, nos]);
  const [aberto, setAberto] = useState(null);
  /* A última assinatura de pendência VISTA por célula. Uma nova abre o corpo uma vez (ajuste no render, sem efeito). */
  const [vistas, setVistas] = useState({});
  const nova = celulas.find((c) => c.pendente && vistas[c.id] !== c.pendente.assinatura);
  if (nova) {
    setVistas((v) => ({ ...v, [nova.id]: nova.pendente.assinatura }));
    if (nova.corpo) setAberto(nova.id);
  }
  if (!celulas.length) return null;
  const abertoValido = celulas.some((c) => c.id === aberto && c.corpo) ? aberto : null;
  const pendentes = celulas.filter((c) => c.pendente).length;

  return (
    /* Sem título visível: o índice já diz "Mesa" e quantas pendências há, e cada célula marca a sua. O título fica para o leitor de tela e
       para o salto do índice. */
    <section className="m-mesa" aria-labelledby="m-mesa-titulo" data-m-secao="mesa">
      <h2 id="m-mesa-titulo" className="m-mesa-titulo m-so-leitor" tabIndex={-1}>
        Agora na Mesa{pendentes > 0 ? `, ${pendentes === 1 ? "1 Pendente" : `${pendentes} Pendentes`}` : ""}
      </h2>
      <div className="m-celulas">
        {celulas.map((c) => {
          const temCorpo = !!c.corpo;
          const estaAberta = abertoValido === c.id;
          const Icone = c.acao?.icone ?? null;
          return (
            <div key={c.id} className="m-celula" data-m-celula={c.id} data-aberta={estaAberta ? "sim" : undefined}>
              {temCorpo ? (
                <button type="button" className="m-celula-nome" aria-expanded={estaAberta} aria-controls={`m-corpo-${c.id}`}
                  onClick={() => setAberto(estaAberta ? null : c.id)}>
                  <ChevronDown aria-hidden="true" className="m-celula-seta" />
                  <span>{c.nome}</span>
                </button>
              ) : (
                <span className="m-celula-nome m-celula-nome-fixo">{c.golpe && <Swords aria-hidden="true" />}<span>{c.nome}</span></span>
              )}
              {c.estado && <span className="m-celula-estado">{c.estado}</span>}
              {c.pendente && <span className="m-pendente"><AlertTriangle aria-hidden="true" />Pendente {c.pendente.n}</span>}
              {c.acao && (
                <button type="button" className="m-botao m-celula-acao" aria-pressed={c.acao.pressionado}
                  onClick={() => onSessao((s) => c.acao.verbo(s))}>
                  {Icone && <Icone aria-hidden="true" />}{c.acao.rotulo}
                </button>
              )}
              {c.acaoEstado && (
                <button type="button" className="m-botao m-celula-acao" aria-pressed={c.acaoEstado.pressionado} disabled={c.acaoEstado.desligado}
                  title={c.acaoEstado.desligado ? "Disponível em combate" : undefined}
                  onClick={() => onEstado(c.acaoEstado.estado, c.acaoEstado.valor)}>
                  {c.acaoEstado.rotulo}
                </button>
              )}
              {c.golpe && golpe}
              {c.gatilhos && (
                <span className="m-gatilhos">
                  {c.gatilhos.map((gt) => (
                    <button key={gt.id} type="button" className="m-seg-op m-gatilho" aria-pressed={gt.ativo}
                      title={`Aplicar efeitos condicionais de ${gt.label}`} onClick={() => onGatilhoTreino?.(gt.id, !gt.ativo)}>
                      {gt.label}
                    </button>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Os corpos, montados sempre (rascunho intacto), um visível por vez. */}
      {celulas.filter((c) => c.corpo).map((c) => (
        <AbaCongelada key={c.id} nome={`mesa:${c.id}`} oculta={abertoValido !== c.id} className="m-corpo">
          <div id={`m-corpo-${c.id}`}>{nos[c.corpo]}</div>
        </AbaCongelada>
      ))}
    </section>
  );
}
