import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { rotuloBloco } from "../../afty-cura";
import { facesDe } from "../ficha-rolagem";
import { useDestaque } from "../usar-destaque";
import ItemDeFicha from "../ItemDeFicha";

/**
 * ============================================================
 * ABA AÇÕES — o que a criatura faz no turno dela
 * ============================================================
 * Tudo aqui já vem RESOLVIDO do `deriveAfty`, e a aba não recalcula nada (é a
 * convenção do projeto inteiro). Quatro grupos, cada um sumindo por completo
 * quando não se aplica.
 *
 * ⚠ AS HABILIDADES NÃO ENTRAM AQUI, e não é esquecimento: nenhum catálogo do
 * Afty tem metadado de ação. As 413 Habilidades de Especialização, os 51
 * Talentos e as 85 Aptidões têm `id`, `nome`, `descricao` e `requisitos`, e nada
 * dizendo se são ação, ação bônus ou reação, nem custo, nem usos. Montar uma
 * lista de ações a partir delas exigiria inventar essa classificação. Elas vão
 * ganhar aba própria, com o texto verbatim e busca. Ver a pergunta D7 em
 * `docs/afty-ficha-final.md`.
 * ============================================================
 */

function Secao({ titulo, children }) {
  return (
    <section className="afty-card p-3">
      <h2 className="afty-card-titulo mb-2">{titulo}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

/**
 * Uma linha de dano, com DOIS números que rolam: o Acerto e o Dano.
 *
 * ⚠ O crítico do Acerto AMARRA no Dano seguinte. Rolar o Acerto e tirar dentro
 * da margem acende a marca na linha, e o próximo Dano sai com os dados dobrados
 * (autor, 2026-08-05: o crítico dobra os dados rolados, e o fixo entra uma vez).
 * É o fluxo da mesa: acerta, vê que foi crítico, rola o dano. Sem a amarração, o
 * jogador teria que lembrar de marcar o crítico à mão no meio dos dois cliques.
 *
 * A marca é CONSUMIDA pelo Dano. Ela some depois de usada, senão o próximo golpe
 * herdaria um crítico que não é dele.
 */
function LinhaDano({ e, rolar, critico, onCritico, destacado }) {
  const faces = facesDe(e.dado);
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-dano:${e.id}`}
      className="afty-linha px-2.5 py-2"
      data-afty-destacada={e.fonte === "basico" ? "sim" : "nao"}
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={e.nome}>
          {e.nome}
        </span>
        {e.ignoraRD > 0 && <span className="afty-rotulo text-[10px] whitespace-nowrap">Ignora RD {e.ignoraRD}</span>}
        <span className="afty-rotulo text-[10px] whitespace-nowrap" title="Margem de Crítico">
          Crít. {e.margemCritico}
        </span>
        {e.alcance && <span className="afty-rotulo text-[10px] whitespace-nowrap">{e.alcance.texto}</span>}
        {critico && <span className="afty-chip" data-afty-tom="destaque">Crítico</span>}
        {e.acerto != null && (
          <span className="afty-rotulo text-[10px] whitespace-nowrap" title={e.acertoAtaque}>
            Acerto{" "}
            <NumeroComFontes
              valor={e.acerto}
              partes={e.partesAcerto}
              total={sinalDe(e.acerto)}
              className="afty-valor text-[11px]"
              ancora="direita"
              onRolar={() => {
                const r = rolar({ tipo: "teste", rotulo: `${e.nome} · Acerto`, bonus: e.acerto, margem: e.margemCritico });
                onCritico(r.critico);
              }}
            />
          </span>
        )}
        <NumeroComFontes
          valor={e.texto}
          partes={e.partes}
          total={e.total}
          formatar={false}
          className="afty-valor text-[13px] whitespace-nowrap"
          ancora="direita"
          onRolar={() => {
            rolar({
              tipo: "dano", rotulo: e.nome, dados: e.dados, faces, fixo: e.fixo, critico,
            });
            if (critico) onCritico(false);
          }}
        />
      </div>
      {e.propriedades?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {e.propriedades.map((p) => (
            <span key={p.id} className="afty-chip" data-afty-tom={p.concedida ? "destaque" : undefined}>
              {p.rotulo}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Uma linha de cura. Mostra o que UM ponto compra (autor, 2026-08-03).
 *
 * ⚠ A linha que escala por ponto ganha um CONTADOR, porque rolar exige saber
 * quantos pontos foram gastos. A conta segue a regra: os dados multiplicam pelo
 * gasto e o valor fixo entra UMA vez, porque o texto diz "ao TOTAL de cura".
 */
function LinhaCura({ l, rolar, destacado }) {
  const [pontos, setPontos] = useState(1);
  const teto = l.unidade ? Math.max(1, l.blocos) : 1;
  const gasto = Math.min(pontos, teto);
  const faces = facesDe(l.dado);
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-cura:${l.id}`}
      className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={l.nome}>
        {l.nome}
        {l.qtd ? <span className="afty-rotulo"> ×{l.qtd}</span> : null}
      </span>
      <span className="afty-rotulo text-[10px] whitespace-nowrap">{l.alcance}</span>
      {l.espelhaNome && (
        <span className="afty-rotulo text-[10px] whitespace-nowrap" title={`Rola a mesma coisa que ${l.espelhaNome}`}>
          {l.espelhaNome}
        </span>
      )}
      {l.usos != null && (
        <span className="afty-rotulo text-[10px] whitespace-nowrap" title="Usos por descanso">
          Usos <span className="afty-valor text-[11px]">{l.usos}</span>
        </span>
      )}
      {l.unidade && (
        <span className="flex items-center gap-1 flex-shrink-0">
          <button type="button" className="afty-passo" onClick={() => setPontos(Math.max(1, gasto - 1))} aria-label="Gastar um ponto a menos">−</button>
          <span className="afty-chip" data-afty-tom="destaque" title={`${rotuloBloco(l.unidade)}, até ${l.unidade.pontos}`}>
            {gasto} {rotuloBloco(l.unidade)}
          </span>
          <button type="button" className="afty-passo" onClick={() => setPontos(Math.min(teto, gasto + 1))} aria-label="Gastar um ponto a mais">+</button>
        </span>
      )}
      {l.unidade && l.fixo !== 0 && (
        <span className="afty-rotulo text-[10px] whitespace-nowrap" title="Soma uma vez no total">
          Total <span className="afty-valor text-[11px]">{sinalDe(l.fixo)}</span>
        </span>
      )}
      <NumeroComFontes
        valor={l.texto}
        partes={l.partes}
        total={l.textoNoMaximo}
        formatar={false}
        className="afty-valor text-[13px] whitespace-nowrap"
        ancora="direita"
        onRolar={() => rolar({
          tipo: "dano", tom: "cura",
          rotulo: l.nome,
          detalhe: l.unidade ? `${gasto} ${rotuloBloco(l.unidade)}` : null,
          dados: l.dados, faces, fixo: l.fixo, blocos: gasto,
        })}
      />
    </div>
  );
}

function LinhaFeitico({ f, destacado }) {
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-feitico:${f.id}`}
      className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={f.nome || "Feitiço Sem Nome"}>
        {f.nome || "Feitiço Sem Nome"}
      </span>
      {f.variacao && (
        <span className="afty-rotulo text-[9px] uppercase tracking-wider" title="Variação de liberação">
          Var.
        </span>
      )}
      {f.avisos.length > 0 && (
        <AlertTriangle
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "var(--afty-aviso)" }}
          aria-hidden="true"
          title={f.avisos.join("\n")}
        />
      )}
      <span className="afty-chip" data-afty-tom="destaque">{f.nivelLabel}</span>
      {f.valor != null && (
        <span className="afty-valor text-[13px]" title={f.valorLabel}>{f.valor}</span>
      )}
      {f.custoPE != null && (
        <span className="afty-valor text-[11px]" data-afty-tom="custo">{f.custoPE} PE</span>
      )}
    </div>
  );
}

function LinhaManobra({ m, rolar, destacado }) {
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-manobra:${m.id}`}
      className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{m.nome}</span>
      <span className="afty-rotulo text-[10px] whitespace-nowrap">{m.periciaUsada}</span>
      <span className="afty-rotulo text-[10px] whitespace-nowrap">
        Executar{" "}
        <NumeroComFontes
          valor={m.executar}
          partes={m.partesExecutar}
          total={sinalDe(m.executar)}
          className="afty-valor text-[11px]"
          ancora="direita"
          onRolar={() => rolar({ tipo: "teste", rotulo: `${m.nome} · Executar`, bonus: m.executar })}
        />
      </span>
      <span className="afty-rotulo text-[10px] whitespace-nowrap">
        Resistir{" "}
        <NumeroComFontes
          valor={m.resistir}
          partes={m.partesResistir}
          total={sinalDe(m.resistir)}
          className="afty-valor text-[11px]"
          ancora="direita"
          onRolar={() => rolar({ tipo: "teste", rotulo: `${m.nome} · Resistir`, bonus: m.resistir })}
        />
      </span>
    </div>
  );
}

export default function AbaAcoes({ derived, rolar, destaque, rapido = [], abertos, onAberto, onFavorito }) {
  const dano = derived.dano?.entradas ?? [];
  const cura = derived.cura?.linhas ?? [];
  const feiticos = derived.feiticos?.lista ?? [];
  const manobras = derived.testes?.manobras ?? [];
  // Crítico pendente por linha de dano. Local e não persistido: é um estado de
  // meio segundo entre o Acerto e o Dano, e guardá-lo faria a ficha reabrir
  // amanhã com um crítico de hoje engatilhado.
  const [criticos, setCriticos] = useState({});

  return (
    <div className="space-y-3">
      {/* ⚠ O RÁPIDO vem primeiro, antes até do Dano. Uma ficha de ND 40 tem 40
          habilidades e o jogador usa seis, e são essas seis que ele quer ver ao
          abrir a ficha. Some inteiro para quem não fixou nada. */}
      {rapido.length > 0 && (
        <Secao titulo="Rápido">
          {rapido.map((i) => (
            <ItemDeFicha
              key={i.chave}
              item={i}
              aberto={abertos.has(i.chave)}
              onAberto={onAberto}
              favorito
              onFavorito={onFavorito}
              destacado={destaque === i.chave}
            />
          ))}
        </Secao>
      )}

      {dano.length > 0 && (
        <Secao titulo="Dano">
          {dano.map((e) => (
            <LinhaDano
              key={e.id}
              e={e}
              rolar={rolar}
              critico={!!criticos[e.id]}
              onCritico={(v) => setCriticos((c) => ({ ...c, [e.id]: v }))}
              destacado={destaque === `dano:${e.id}`}
            />
          ))}
        </Secao>
      )}

      {cura.length > 0 && (
        <Secao titulo="Cura">
          {cura.map((l) => (
            <LinhaCura key={l.id} l={l} rolar={rolar} destacado={destaque === `cura:${l.id}`} />
          ))}
        </Secao>
      )}

      {feiticos.length > 0 && (
        <Secao titulo="Feitiços">
          {feiticos.map((f) => (
            <LinhaFeitico key={f.id} f={f} destacado={destaque === `feitico:${f.id}`} />
          ))}
        </Secao>
      )}

      {manobras.length > 0 && (
        <Secao titulo="Manobras">
          {manobras.map((m) => (
            <LinhaManobra key={m.id} m={m} rolar={rolar} destacado={destaque === `manobra:${m.id}`} />
          ))}
        </Secao>
      )}
    </div>
  );
}
