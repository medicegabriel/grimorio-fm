import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

import { DicaDeTexto, NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { curaNoGasto, rotuloBloco } from "../../afty-cura";
import { tituloCustoFeitico } from "../../afty-feiticos";
import { RITUAL_MELHORIAS } from "../../afty-rituais";
import { facesDe } from "../ficha-rolagem";
import { useDestaque } from "../usar-destaque";
import ItemDeFicha from "../ItemDeFicha";
import TextoRico from "../../ui/TextoRico";

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
function LinhaDano({ e, rolar, critico, onCritico, destacado, onImbuir }) {
  const faces = facesDe(e.dado);
  const raiz = useDestaque(destacado);
  const feiticoImbuido = e.imbuir?.escolhido ?? null;
  const condicoesImbuidas = feiticoImbuido?.propriedades?.find((p) => p.id === "condicoes")?.valor;
  const cdImbuida = feiticoImbuido?.propriedades?.find((p) => p.id === "cd")?.valor;
  const rolarAdicionais = () => {
    for (const extra of (e.danoAuxiliar ?? [])) {
      rolar({
        tipo: "dano",
        rotulo: `${e.nome} · ${extra.nome}`,
        dados: extra.dados,
        faces: extra.faces,
        fixo: 0,
      });
    }
    for (const [indice, extra] of (feiticoImbuido?.rolagens ?? []).entries()) {
      rolar({
        tipo: "dano",
        rotulo: `${e.nome} · ${feiticoImbuido.nome || "Feitiço Sem Nome"}`,
        detalhe: extra.rotulo,
        dados: extra.dados,
        faces: extra.faces,
        fixo: extra.fixo || 0,
        explosiva: !!extra.explosiva,
        feiticoDanoId: indice === 0 ? feiticoImbuido.id : null,
      });
    }
  };
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
        {e.removeResistencia && <span className="afty-rotulo text-[10px] whitespace-nowrap">Remove Resistência</span>}
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
            rolarAdicionais();
            if (critico) onCritico(false);
          }}
        />
        {(e.danoAuxiliar ?? []).map((extra, indice) => (
          <span key={`${extra.nome}:${indice}`} className="afty-chip" title={extra.nome}>
            +{extra.dados}d{extra.faces}
          </span>
        ))}
        {feiticoImbuido && (
          <span
            className="afty-chip"
            data-afty-tom="destaque"
            title={[feiticoImbuido.conjuracaoTexto, feiticoImbuido.descricao].filter(Boolean).join("\n\n")}
          >
            +{feiticoImbuido.valor || feiticoImbuido.nome || "Efeito"}
          </span>
        )}
        {condicoesImbuidas && cdImbuida && (
          <span className="afty-chip" title={condicoesImbuidas}>TR CD {cdImbuida}</span>
        )}
      </div>
      {e.imbuir && (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="afty-rotulo text-[10px]">Imbuir</span>
          <select
            className="afty-campo bg-transparent outline-none text-[11px]"
            value={feiticoImbuido?.id ?? ""}
            onChange={(evento) => onImbuir?.(e.imbuir.estadoId, evento.target.value || null)}
            aria-label={`Imbuir técnica em ${e.nome}`}
          >
            <option value="">Nenhum</option>
            {e.imbuir.opcoes.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>{opcao.label}</option>
            ))}
          </select>
          <span className="afty-valor text-[11px]" data-afty-tom="custo">
            +{e.imbuir.custoAdicional} PE
          </span>
        </div>
      )}
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
  const [blocos, setBlocos] = useState(1);
  const teto = l.unidade ? Math.max(1, l.blocos) : 1;
  const blocosUsados = Math.min(blocos, teto);
  const estado = curaNoGasto(l, blocosUsados);
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
          <button
            type="button"
            className="afty-passo"
            onClick={() => setBlocos(Math.max(1, blocosUsados - 1))}
            aria-label={`Gastar ${rotuloBloco(l.unidade)} a menos`}
          >−</button>
          <span
            className="afty-chip"
            data-afty-tom="destaque"
            title={`Até ${estado.pontosMaximos} ${l.unidade.rotulo}`}
          >
            {estado.pontos} {l.unidade.rotulo}
          </span>
          <button
            type="button"
            className="afty-passo"
            onClick={() => setBlocos(Math.min(teto, blocosUsados + 1))}
            aria-label={`Gastar ${rotuloBloco(l.unidade)} a mais`}
          >+</button>
        </span>
      )}
      <NumeroComFontes
        valor={estado.texto}
        partes={estado.partes}
        total={estado.texto}
        formatar={false}
        className="afty-valor text-[13px] whitespace-nowrap"
        ancora="direita"
        onRolar={() => rolar({
          tipo: "dano", tom: "cura",
          rotulo: l.nome,
          detalhe: l.unidade ? `${estado.pontos} ${l.unidade.rotulo}` : null,
          dados: l.dados, faces, fixo: estado.fixo, blocos: estado.blocos,
        })}
      />
    </div>
  );
}

/**
 * Um Feitiço.
 *
 * ⚠ O NÚMERO ROLA, desde 2026-08-06. Ele era texto morto porque o
 * `resumoFeiticos` só devolvia o `valor` já formatado ("8d6", "3× 4d8"), e a
 * Ficha não vai parsear string: o `rolagensDoFeitico` passou a entregar
 * `{ dados, faces }` do mesmo lugar de onde sai a notação.
 *
 * ⚠ São VÁRIAS rolagens quando o Feitiço tem várias de verdade: o dano contínuo
 * tem o golpe inicial e o por rodada, e os dois são rolados em momentos
 * diferentes da mesma luta. `vezes` (disparos, golpes) NÃO multiplica os dados,
 * porque cada disparo é uma rolagem com acerto próprio: ele vira um contador ao
 * lado, e cada clique rola um.
 */
const ACAO_RITUAL_LABEL = {
  comum: "Ação Comum",
  completa: "Ação Completa",
  ritual: "Ritual Estendido",
};

function ControlesRitual({
  f, rolar, onRitual, onDesativarRitual, onIniciarRitualEstendido, onIniciarRitualSemTeste,
  onConcluirPreparacaoRitual, onCancelarRitual, onFinalizarRitual, onEncerrarRitual,
}) {
  const ritual = f.ritual;
  if (!ritual || ritual.proibido) return null;
  const patchRitual = (parcial) => onRitual?.(f.id, (atual) => ({ ...atual, ...parcial }));
  const mudaMelhoria = (id, delta) => onRitual?.(f.id, (atual) => {
    const melhorias = atual.melhorias && typeof atual.melhorias === "object" ? atual.melhorias : {};
    const def = RITUAL_MELHORIAS.find((m) => m.id === id);
    const valor = Math.max(0, Math.min(def?.max ?? 1, (melhorias[id] || 0) + delta));
    return { ...atual, melhorias: { ...melhorias, [id]: valor } };
  });
  const consomeNoTeste = ritual.extraRitualista ? f.id : null;
  const configuracaoTravada = ritual.configuracaoTravada || ritual.bloqueado;
  const status = ritual.podeResolver ? "Pronto"
    : ritual.etapa === "falhou" ? "Falha"
      : ritual.etapa === "preparando" ? "Preparando"
        : ritual.etapa === "resolvido" ? "Resolvido"
          : ritual.bloqueado ? "Indisponível"
            : null;
  const podeDesarmarRitualista = ritual.quantidade <= ritual.limiteBase;

  return (
    <details className="w-full mt-1.5">
      <summary className="cursor-pointer text-[10px] font-semibold">
        Ritual
        {ritual.ativo && (
          <span className="afty-rotulo ml-2">
            {ritual.quantidade}/{ritual.limite} · {ACAO_RITUAL_LABEL[ritual.acaoFinal] ?? ritual.acaoFinal}
          </span>
        )}
        {status && <span className="afty-chip ml-2">{status}</span>}
      </summary>
      <div className="mt-2 pl-2 border-l space-y-2" style={{ borderColor: "var(--afty-borda)" }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            className="afty-chip"
            data-afty-tom={ritual.ativo ? "destaque" : undefined}
            aria-pressed={ritual.ativo}
            disabled={ritual.forcado || ritual.bloqueado}
            onClick={() => (
              ritual.ativo
                ? onDesativarRitual?.(f.id)
                : patchRitual({ ativo: true })
            )}
          >
            {ritual.ativo ? "Desativar" : "Ativar"}
          </button>
          {ritual.ativo && ritual.temRitualista && (
            <button
              type="button"
              className="afty-chip"
              data-afty-tom={ritual.extraRitualista ? "destaque" : undefined}
              aria-pressed={ritual.extraRitualista}
              disabled={
                configuracaoTravada
                || (!ritual.extraRitualista && ritual.usosRitualista >= ritual.limiteRitualista)
                || (ritual.extraRitualista && !podeDesarmarRitualista)
              }
              onClick={() => patchRitual({ extraRitualista: !ritual.extraRitualista })}
              title="Ritualista"
            >
              Ritualista {ritual.usosRitualista}/{ritual.limiteRitualista}
            </button>
          )}
          {ritual.ativo && ritual.permiteInteligencia && ritual.exigeTeste && (
            <>
              <button
                type="button"
                className="afty-chip"
                data-afty-tom={ritual.atributoRitual === "destreza" ? "destaque" : undefined}
                aria-pressed={ritual.atributoRitual === "destreza"}
                disabled={configuracaoTravada}
                onClick={() => patchRitual({ atributoRitual: "destreza" })}
              >Destreza</button>
              <button
                type="button"
                className="afty-chip"
                data-afty-tom={ritual.atributoRitual === "inteligencia" ? "destaque" : undefined}
                aria-pressed={ritual.atributoRitual === "inteligencia"}
                disabled={configuracaoTravada}
                onClick={() => patchRitual({ atributoRitual: "inteligencia" })}
              >Inteligência</button>
            </>
          )}
          {ritual.ativo && ritual.teste && (
            <span className="afty-rotulo text-[10px] whitespace-nowrap">
              Prestidigitação{" "}
              <NumeroComFontes
                valor={ritual.teste.bonus}
                partes={ritual.teste.partes}
                total={sinalDe(ritual.teste.bonus)}
                className="afty-valor text-[11px]"
                ancora="direita"
                titulo={`CD ${ritual.teste.cd}`}
                onRolar={!ritual.podeIniciar ? undefined : () => rolar({
                  tipo: "teste",
                  rotulo: `${f.nome || "Feitiço Sem Nome"} · Ritual`,
                  detalhe: `CD ${ritual.teste.cd}`,
                  bonus: ritual.teste.bonus,
                  cd: ritual.teste.cd,
                  testaRitualId: f.id,
                  consomeRitualistaId: consomeNoTeste,
                })}
              />
              <span className="ml-1">CD {ritual.teste.cd}</span>
            </span>
          )}
          {ritual.ativo && ritual.estendido && !ritual.emAndamento && (
            <button
              type="button"
              className="afty-chip"
              disabled={!ritual.podeIniciar}
              onClick={() => onIniciarRitualEstendido?.(f.id, ritual.extraRitualista)}
            >
              Iniciar
            </button>
          )}
          {ritual.ativo && !ritual.exigeTeste && !ritual.estendido && !ritual.emAndamento && (
            <button
              type="button"
              className="afty-chip"
              disabled={!ritual.podeIniciar}
              onClick={() => onIniciarRitualSemTeste?.(f.id, ritual.extraRitualista)}
            >
              Usar
            </button>
          )}
          {ritual.ativo && ritual.etapa === "falhou" && (
            <>
              <button type="button" className="afty-chip" onClick={() => onCancelarRitual?.(f.id)}>
                Cancelar
              </button>
              <button type="button" className="afty-chip" onClick={() => onConcluirPreparacaoRitual?.(f.id)}>
                Finalizar
              </button>
            </>
          )}
          {ritual.ativo && ritual.etapa === "preparando" && (
            <>
              <button type="button" className="afty-chip" onClick={() => onConcluirPreparacaoRitual?.(f.id)}>
                Finalizar
              </button>
              <button type="button" className="afty-chip" onClick={() => onCancelarRitual?.(f.id)}>
                Interromper
              </button>
            </>
          )}
          {ritual.ativo && ritual.etapa === "pronto" && (
            <button type="button" className="afty-chip" onClick={() => onCancelarRitual?.(f.id)}>
              Cancelar
            </button>
          )}
          {ritual.ativo && ritual.podeResolver && f.rolagens?.length === 0 && (
            <button type="button" className="afty-chip" onClick={() => onFinalizarRitual?.(f.id)}>
              Conjurar
            </button>
          )}
          {ritual.ativo && ritual.resolvido && (
            <button type="button" className="afty-chip" onClick={() => onEncerrarRitual?.(f.id)}>
              Encerrar
            </button>
          )}
        </div>
        {ritual.ativo && (
          <div className="grid gap-1">
            {RITUAL_MELHORIAS.filter((melhoria) => (
              ritual.melhoriasDisponiveis?.includes(melhoria.id)
              || (ritual.melhorias?.[melhoria.id] || 0) > 0
            )).map((melhoria) => {
              const valor = ritual.melhorias?.[melhoria.id] || 0;
              return (
                <div key={melhoria.id} className="flex items-center gap-1.5">
                  <span className="flex-1 min-w-0 text-[10px] truncate" title={melhoria.descricao}>
                    {melhoria.nome}
                  </span>
                  <button
                    type="button"
                    className="afty-passo"
                    disabled={valor <= 0 || configuracaoTravada}
                    onClick={() => mudaMelhoria(melhoria.id, -1)}
                    aria-label={`Remover ${melhoria.nome}`}
                  >−</button>
                  <span className="afty-chip">{valor}</span>
                  <button
                    type="button"
                    className="afty-passo"
                    disabled={
                      configuracaoTravada
                      || valor >= melhoria.max
                      || ritual.quantidade >= ritual.limite
                    }
                    onClick={() => mudaMelhoria(melhoria.id, 1)}
                    aria-label={`Adicionar ${melhoria.nome}`}
                  >+</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}

function LinhaFeitico({
  f: base, rolar, destacado, comLiberacao,
  onRitual, onDesativarRitual, onIniciarRitualEstendido, onIniciarRitualSemTeste,
  onConcluirPreparacaoRitual, onCancelarRitual, onFinalizarRitual, onEncerrarRitual,
}) {
  /* LIBERAÇÃO MÁXIMA declarada AGORA. Local e não persistida, pelo mesmo motivo
     do crítico pendente: é a decisão de uma conjuração só, e guardá-la faria a
     ficha reabrir amanhã com a técnica sobrecarregada de ontem.

     ⚠ O Feitiço EXIBIDO passa a ser o liberado assim que há melhoria escolhida.
     Quem recalcula é o motor (`derived.feiticos.comLiberacao`), nunca esta tela,
     e a versão que volta já vem com o teste de Ritual aplicado por cima. */
  const [melhorias, setMelhorias] = useState([]);
  const menu = base.liberacao;
  const liberado = useMemo(
    () => ((melhorias.length > 0 && comLiberacao) ? comLiberacao(base.id, melhorias) : null),
    [base.id, melhorias, comLiberacao],
  );
  const f = liberado ?? base;
  const cheioLiberacao = menu ? melhorias.length >= menu.max : false;
  const alternarMelhoria = (id) => setMelhorias((atual) => (
    atual.includes(id) ? atual.filter((x) => x !== id)
      : atual.length >= (menu?.max ?? 2) ? atual
      : [...atual, id]
  ));

  const raiz = useDestaque(destacado);
  const rolagens = f.rolagens ?? [];
  const propriedades = f.propriedades ?? [];
  const propriedadesFixas = propriedades.filter((propriedade) => propriedade.id !== "valor");
  const propriedadeValor = propriedades.find((propriedade) => propriedade.id === "valor");
  const descricaoTemRotulo = /^\s*efeito\s*:/i.test(f.descricao || "");
  const titulo = [f.conjuracaoTexto, f.descricao].filter(Boolean).join("\n\n")
    || f.nome
    || "Feitiço Sem Nome";
  const rolarFeitico = (r, indice) => rolar({
    tipo: "dano", tom: r.tom,
    rotulo: f.nome || "Feitiço Sem Nome",
    detalhe: rolagens.length > 1 || r.vezes > 1 ? r.rotulo : f.nivelLabel,
    dados: r.dados, faces: r.faces, fixo: r.fixo || 0,
    explosiva: !!r.explosiva,
    consomeEstado: indice === 0 ? f.consomeEstado : null,
    feiticoDanoId: indice === 0 && f.tipo === "dano" ? f.id : null,
    finalizaRitualId: indice === 0 && f.ritual?.ativo && f.ritual?.podeResolver
      ? f.id
      : null,
  });
  return (
    <details
      ref={raiz}
      id={`afty-item-feitico:${f.id}`}
      className="afty-linha afty-feitico"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <summary className="afty-feitico-topo" title={titulo}>
        <ChevronRight className="afty-feitico-seta" aria-hidden="true" />
        <span className="afty-feitico-nome">
          {f.nome || "Feitiço Sem Nome"}
        </span>
        <span className="afty-feitico-meta">- {f.nivelLabel}</span>
        {f.custoPE != null && (
          <span className="afty-feitico-custo afty-feitico-meta" title={tituloCustoFeitico(f)}>({f.custoPE} PE)</span>
        )}
        {f.variacao && (
          <span className="afty-chip afty-feitico-meta" title="Variação de liberação">Var.</span>
        )}
        {f.avisos.length > 0 && (
          <AlertTriangle
            className="afty-feitico-meta w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={f.avisos.join("\n")}
          />
        )}
      </summary>
      <div className="afty-feitico-corpo">
        {(propriedadesFixas.length > 0 || propriedadeValor || rolagens.length > 0) && (
          <dl className="afty-feitico-propriedades">
            {propriedadesFixas.map((propriedade) => (
              <div key={propriedade.id} className="afty-feitico-propriedade" data-afty-propriedade={propriedade.id}>
                <dt>{propriedade.nome}:</dt>
                <dd>{propriedade.valor}</dd>
              </div>
            ))}
            {rolagens.length === 0 && propriedadeValor && (
              <div className="afty-feitico-propriedade" data-afty-propriedade="valor">
                <dt>{propriedadeValor.nome}:</dt>
                <dd className="afty-valor">{propriedadeValor.valor}</dd>
              </div>
            )}
            {rolagens.map((r, indice) => (
              <div key={`${r.rotulo}:${indice}`} className="afty-feitico-propriedade" data-afty-propriedade="rolagem">
                <dt>{rolagens.length > 1 ? r.rotulo : (propriedadeValor?.nome || f.valorLabel)}:</dt>
                <dd className="flex items-center gap-1.5">
                  <NumeroComFontes
                    valor={`${r.dados}d${r.faces}${r.explosiva ? "!" : ""}${r.fixo ? `${r.fixo > 0 ? "+" : ""}${r.fixo}` : ""}`}
                    partes={r.partes}
                    total={`${r.dados}d${r.faces}${r.explosiva ? "!" : ""}${r.fixo ? `${r.fixo > 0 ? "+" : ""}${r.fixo}` : ""}`}
                    formatar={false}
                    className="afty-valor text-[13px] whitespace-nowrap"
                    titulo={r.rotulo}
                    onRolar={f.ritual?.ativo && !f.ritual?.podeRolarFeitico
                      ? undefined
                      : () => rolarFeitico(r, indice)}
                  />
                  {r.vezes > 1 && (
                    <span className="afty-chip" title={`${r.vezes} ${r.rotulo}s`}>×{r.vezes}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {f.descricao && (
          <p className="afty-feitico-efeito">
            {!descricaoTemRotulo && <strong>Efeito: </strong>}
            {f.descricao}
          </p>
        )}
        {/* LIBERAÇÃO MÁXIMA. Só aparece em Feitiço que a alcança (Nível 3 ao 5,
            Dano, Auxiliar ou Curativo, do ND 9 em diante).

            ⚠ Fica ACIMA dos controles de Ritual porque os dois convivem no
            mesmo uso: a Liberação é o que SAI, o Ritual é COMO se conjura, e a
            ordem na tela segue a da mesa.

            ⚠ É um `<details>` com a MESMA gramática do Ritual (mesmo resumo com
            contador, mesma barra à esquerda no corpo). São dois controles
            irmãos, no mesmo cartão, e duas aparências diferentes fariam o
            jogador achar que são coisas de natureza diferente.

            ⚠ ABERTO por padrão só quando há melhoria ligada: fechado ele é uma
            linha discreta em quem não usa a mecânica, e quem já declarou vê o
            que declarou sem precisar abrir. */}
        {menu && (
          <details className="w-full mt-1.5" open={melhorias.length > 0}>
            <summary className="cursor-pointer text-[10px] font-semibold">
              Liberação Máxima
              <span className="afty-rotulo ml-2">
                {melhorias.length}/{menu.max} · {menu.custoPE} PE
              </span>
            </summary>
            <div className="mt-2 pl-2 border-l space-y-1.5" style={{ borderColor: "var(--afty-borda)" }}>
              {menu.categorias.map((c) => (
                <div key={c.value} className="afty-liberacao-grupo">
                  <span className="afty-liberacao-categoria">{c.label}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {c.melhorias.map((m) => {
                      const ligada = melhorias.includes(m.id);
                      return (
                        /* A REGRA VERBATIM no hover, e não no `title` nativo
                           (autor, 2026-08-10): "por ser suplemento, fica difícil
                           acessar". O `title` demora um segundo para nascer,
                           some ao mexer o mouse e não existe no teclado nem no
                           dedo. Ver `DicaDeTexto`. */
                        <DicaDeTexto key={m.id} titulo={m.nome} texto={m.descricao} nota={m.nota}>
                          <button
                            type="button"
                            className="afty-chip"
                            data-afty-tom={ligada ? "destaque" : undefined}
                            disabled={!ligada && cheioLiberacao}
                            aria-pressed={ligada}
                            onClick={() => alternarMelhoria(m.id)}
                          >
                            {m.nome}
                          </button>
                        </DicaDeTexto>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
        <ControlesRitual
          f={f}
          rolar={rolar}
          onRitual={onRitual}
          onDesativarRitual={onDesativarRitual}
          onIniciarRitualEstendido={onIniciarRitualEstendido}
          onIniciarRitualSemTeste={onIniciarRitualSemTeste}
          onConcluirPreparacaoRitual={onConcluirPreparacaoRitual}
          onCancelarRitual={onCancelarRitual}
          onFinalizarRitual={onFinalizarRitual}
          onEncerrarRitual={onEncerrarRitual}
        />
      </div>
    </details>
  );
}


/**
 * UM DOMÍNIO.
 *
 * A Expansão de Domínio é uma AÇÃO de combate, com custo em PE e duração em
 * rodadas, e por isso ela mora aqui e não numa aba própria: o jogador procura
 * por ela no mesmo lugar onde procura o resto do que faz no turno.
 *
 * O TEXTO já vem montado pelo `textoDoDominio`, com a área, a duração, o PV da
 * barreira e os efeitos escolhidos resolvidos. A Ficha não remonta nada: ela
 * abre e mostra, como faz com o texto do livro.
 */
/**
 * TÉCNICAS DE BARREIRA e CONFLITO DE DOMÍNIO, a linha de cima da seção.
 *
 * ⚠ Os dois são da CRIATURA, e não de uma expansão: a parede se ergue sem
 * expansão nenhuma, e quem confronta é o feiticeiro. Por isso ficam fora do
 * laço das expansões, e aparecem mesmo para quem ainda não escreveu uma.
 *
 * O Conflito é a única coisa aqui que ROLA, e a rolagem é 1d10 mais o bônus.
 */
function LinhaBarreiraConflito({ info, rolar }) {
  const b = info?.barreira;
  const c = info?.conflito;
  const mostraParede = !!b?.tem;
  const mostraConflito = (info?.domNivel ?? 0) > 0;
  if (!mostraParede && !mostraConflito) return null;
  return (
    <div className="afty-linha px-2.5 py-2 flex items-center gap-2 flex-wrap">
      {mostraParede && (
        <>
          <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">Parede de Barreira</span>
          <span className="afty-valor text-[11px]" title="Pontos de vida de cada parede">{b.pvParede} PV</span>
          {b.rdParede > 0 && (
            <span className="afty-valor text-[11px]" title="Redução de dano de cada parede">{b.rdParede} RD</span>
          )}
          <span className="afty-rotulo text-[10px] whitespace-nowrap" title="Máximo de paredes erguidas de uma vez">
            até {b.maxParedes}
          </span>
          {/* A Cortina vale 3 paredes, e só aparece para quem tem a aptidão. */}
          {b.temCortina && (
            <span className="afty-rotulo text-[10px] whitespace-nowrap">
              Cortina{" "}
              <NumeroComFontes
                valor={`${b.pvCortina} PV`}
                partes={b.partesPvCortina}
                total={b.pvCortina}
                formatar={false}
                className="afty-valor text-[11px]"
                ancora="direita"
                titulo="Pontos de vida da cortina"
              />
            </span>
          )}
        </>
      )}
      {mostraConflito && (
        <>
          {!mostraParede && <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">Conflito de Domínio</span>}
          <span className="afty-rotulo text-[10px] whitespace-nowrap">
            {mostraParede ? "Conflito " : ""}
            <NumeroComFontes
              valor={`1d${c.faces}+${c.bonus}`}
              partes={c.partes}
              total={c.bonus}
              formatar={false}
              className="afty-valor text-[11px]"
              ancora="direita"
              onRolar={() => rolar({
                tipo: "dano", rotulo: "Conflito de Domínio",
                dados: c.dados, faces: c.faces, fixo: c.bonus,
              })}
            />
          </span>
        </>
      )}
    </div>
  );
}

function LinhaDominio({ d, ativo, destacado }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useDestaque(destacado);
  return (
    <div
      ref={raiz}
      id={`afty-item-dominio:${d.id}`}
      className="afty-linha"
      data-afty-destacada={ativo ? "sim" : "nao"}
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <div className="flex items-center gap-2 px-2.5 py-2 flex-wrap">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
          onClick={() => setAberto((x) => !x)}
          aria-expanded={aberto}
        >
          {aberto
            ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
          <span className="text-[12px] font-semibold truncate">{d.nome || "Domínio Sem Nome"}</span>
        </button>
        {ativo && <span className="afty-chip" data-afty-tom="destaque">Ativo</span>}
        <span className="afty-rotulo text-[10px] whitespace-nowrap">{d.area}</span>
        <span className="afty-rotulo text-[10px] whitespace-nowrap">{d.duracao}</span>
        <span className="afty-valor text-[11px]" title="Pontos de vida da barreira">{d.pvBarreira} PV</span>
        {d.custo != null && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{d.custo} PE</span>
        )}
      </div>
      {aberto && d.texto && (
        <div className="px-2.5 pb-2 pl-8">
          <p className="afty-texto">{d.texto}</p>
        </div>
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

export default function AbaAcoes({
  derived, rolar, destaque, rapido = [], abertos, onAberto, onFavorito, onRitual,
  onDesativarRitual,
  onIniciarRitualEstendido, onIniciarRitualSemTeste, onConcluirPreparacaoRitual,
  onCancelarRitual, onFinalizarRitual, onEncerrarRitual,
  onImbuir,
}) {
  const dano = derived.dano?.entradas ?? [];
  const cura = derived.cura?.linhas ?? [];
  const feiticos = (derived.feiticos?.lista ?? []).filter((f) => f.tipo !== "passivo");
  const dominios = derived.dominios?.lista ?? [];
  const dominioAtivo = derived.dominios?.ativoId ?? null;
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
              onImbuir={onImbuir}
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
            <LinhaFeitico
              key={f.id}
              f={f}
              rolar={rolar}
              destacado={destaque === `feitico:${f.id}`}
              onRitual={onRitual}
              onDesativarRitual={onDesativarRitual}
              onIniciarRitualEstendido={onIniciarRitualEstendido}
              onIniciarRitualSemTeste={onIniciarRitualSemTeste}
              onConcluirPreparacaoRitual={onConcluirPreparacaoRitual}
              onCancelarRitual={onCancelarRitual}
              onFinalizarRitual={onFinalizarRitual}
              onEncerrarRitual={onEncerrarRitual}
              comLiberacao={derived.feiticos?.comLiberacao}
            />
          ))}
        </Secao>
      )}

      {(dominios.length > 0 || derived.dominios?.barreira?.tem || (derived.dominios?.domNivel ?? 0) > 0) && (
        <Secao titulo="Expansão de Domínio">
          <LinhaBarreiraConflito info={derived.dominios} rolar={rolar} />
          {dominios.map((d) => (
            <LinhaDominio
              key={d.id}
              d={d}
              ativo={d.id === dominioAtivo}
              destacado={destaque === `dominio:${d.id}`}
            />
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
