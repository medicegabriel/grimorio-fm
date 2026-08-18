import React, { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Heart, Shield, Wind } from "lucide-react";

import { AFTY_ATTRS } from "../../afty-schema";
import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { useDestaque } from "../usar-destaque";

/**
 * ============================================================
 * ABA INVOCAÇÕES — as criaturas que a criatura traz
 * ============================================================
 * Elas existiam no criador e nunca chegavam à mesa. Uma Invocação não é uma
 * ação: ela é uma CRIATURA, com PV, Defesa, Deslocamento, testes e ações
 * próprias, e é por isso que ela ganhou aba em vez de virar mais um cartão da
 * aba Ações (que é onde a Expansão de Domínio ficou, porque aquilo É uma ação).
 *
 * ⚠ AS AÇÕES DELA ROLAM, com o acerto e o dano da própria Invocação. É o ponto
 * inteiro: no meio da luta o jogador rola pela Invocação sem sair da Ficha e sem
 * abrir o criador.
 *
 * ⚠ O PV da Invocação NÃO entra na sessão. Ele é o MÁXIMO, e não um recurso
 * gasto: a sessão hoje guarda os recursos do dono, e dar barra própria a cada
 * Invocação sem o descanso saber o que fazer com elas deixaria a ficha com
 * números que ninguém zera. Está anotado como pendência.
 * ============================================================
 */

function Numero({ icone: Icone, rotulo, valor }) {
  return (
    <span className="afty-stat" title={rotulo}>
      <span className="afty-stat-rotulo">
        <Icone className="w-3 h-3 inline-block align-[-2px]" aria-hidden="true" /> {rotulo}
      </span>
      <span className="afty-stat-valor">{valor}</span>
    </span>
  );
}

/* Rótulos curtos das escolhas que a Ação guarda. Ficam aqui porque são de
   EXIBIÇÃO: o motor guarda a chave, a mesa lê o nome. */
const AUXILIO_ROTULO = {
  cura: "Cura", defesa: "Defesa", acerto: "Acerto", danoAdicional: "Dano Adicional", rd: "RD",
};
const CONDICAO_ROTULO = { fraca: "Fraca", media: "Média", forte: "Forte" };
const ALVO_AUXILIO_ROTULO = { invocacao: "Nela mesma", aliados: "Aliados" };

/** A notação de uma lista de grupos de dado: `[{2,12},{1,6}]` vira "2d12 + 1d6". */
const notacaoDe = (grupos) => grupos.map((g) => `${g.dados}d${g.faces}`).join(" + ");

/** O que uma Característica resolvida CONCEDE, em uma linha curta. */
function resumoCaracteristica(c) {
  switch (c.subtipo) {
    case "vida": return `+${c.valor} PV`;
    case "rd": return `${c.valor} RD ${c.rdTipoLabel || ""}`.trim();
    case "teste": return `${c.valor >= 0 ? "+" : ""}${c.valor}`;
    case "tamanho": return c.tamanhoLabel || "";
    default: return "";
  }
}

/**
 * Uma linha de teste rolável (Teste de Resistência ou Perícia). As duas têm a
 * mesma anatomia: nome, o que é condicional, a proficiência e o número que rola.
 *
 * ⚠ AS PERÍCIAS NÃO EXISTIAM NESTA ABA. O `resolveTestesInvocacao` sempre
 * devolveu `testes.pericias` com o bônus fechado, e a Ficha lia só as
 * resistências: uma invocação treinada em Percepção ou Furtividade não tinha o
 * que rolar na mesa, e o bônus de Característica numa perícia era invisível.
 */
function LinhaDeTeste({ nome, bonus, comGatilho = 0, mestre = false, treinado = true, rotulo, rolar }) {
  return (
    <div className="afty-linha px-2.5 py-1 flex items-center gap-2">
      <span className="flex-1 min-w-0 text-[12px] truncate">{nome}</span>
      {/* Bônus de Característica em Ataque ou TR exige gatilho, então não entra
          no número que a linha rola. Em Perícia ele já está somado. */}
      {comGatilho > 0 && (
        <span className="afty-chip" title="Bônus de Característica, só quando o gatilho ocorre">
          +{comGatilho} com gatilho
        </span>
      )}
      {mestre
        ? <span className="afty-chip">Mestre</span>
        : !treinado && <span className="afty-rotulo text-[10px]">Não Treinado</span>}
      <NumeroComFontes
        valor={bonus}
        total={sinalDe(bonus)}
        className="afty-valor text-[13px] w-10 text-right"
        ancora="direita"
        onRolar={() => rolar({ tipo: "teste", rotulo, bonus })}
      />
    </div>
  );
}

/**
 * Os seis atributos da invocação. Ela É uma criatura, e a mesa pede o atributo
 * dela a toda hora (uma manobra de Agarrar, um teste improvisado, resistir a um
 * empurrão). Só o MODIFICADOR rola, como teste puro, igual ao painel de
 * atributos da criatura.
 */
function Atributos({ atributos, nomeDono, rolar }) {
  const valores = atributos?.valores;
  if (!valores) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
      {AFTY_ATTRS.map((a) => {
        const m = atributos.mods?.[a.key] ?? 0;
        return (
          <span key={a.key} className="afty-stat" title={a.label}>
            <span className="afty-stat-rotulo">{a.abbr}</span>
            <span className="afty-stat-valor">{valores[a.key]}</span>
            <NumeroComFontes
              valor={m}
              total={sinalDe(m)}
              className="afty-valor text-[11px]"
              ancora="direita"
              onRolar={() => rolar({ tipo: "teste", rotulo: `${nomeDono} · ${a.label}`, bonus: m })}
            />
          </span>
        );
      })}
    </div>
  );
}

/**
 * Uma AÇÃO da Invocação.
 *
 * ⚠ O dano vem ESTRUTURADO em `dano.grupos`, e a aba não lê a notação. Ele é uma
 * LISTA porque a escada de dano do Afty tem degraus de dois dados diferentes
 * ("2d12 + 1d6"), e o parser ingênuo que eu tinha escrito antes lia aquilo como
 * três dados de face inválida. Ver `dadosDaNotacao`.
 *
 * ⚠ ELA MOSTRAVA SÓ ATAQUE COM JOGADA (2026-08-16). O `resolveAcao` sempre
 * devolveu CD, qual TR, cura, área, condição, o valor dos auxílios e o dano
 * adicional, e nada disso aparecia: uma Invocação médica não tinha o que rolar
 * na Ficha, e um ataque por Teste de Resistência não mostrava a CD, que é o
 * número inteiro da jogada. Era o mesmo buraco das Características, do outro
 * lado do motor.
 */
function Acao({ a, nomeDono, margemCritico = 20, rolar }) {
  /* ⚠ O dado extra da Melhoria Agressividade entra NA MESMA ROLAGEM. Ele é
     "dano adicional" em todo ataque da invocação, sem tipo próprio, então
     mostrá-lo numa linha separada e rolar só o dado da tabela entregaria menos
     dano do que a ficha promete. */
  const grupos = [...(a.dano?.grupos ?? []), ...(a.danoExtraAtaque?.grupos ?? [])];
  const rotulo = `${nomeDono} · ${a.nome || "Ação"}`;
  const chip = "afty-rotulo text-[10px] whitespace-nowrap";

  return (
    <div className="afty-linha px-2.5 py-1.5 space-y-1">
      {/* Linha 1: identidade e custo. A CLASSE importa na mesa, porque é ela que
          diz qual comando o dono gasta (Comum para Complexa, Bônus para Simples). */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate" title={a.descricao || a.nome}>
          {a.nome || "Ação Sem Nome"}
        </span>
        {a.warnings?.length > 0 && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={a.warnings.join("\n")}
          />
        )}
        <span className={chip}>{a.classe === "complexa" ? "Complexa" : "Simples"}</span>
        {a.familia === "auxilio" && a.auxilioSub && (
          <span className={chip}>{AUXILIO_ROTULO[a.auxilioSub] ?? a.auxilioSub}</span>
        )}
        {a.custoPE > 0 && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
        )}
      </div>

      {/* Linha 2: os números da mesa. Tudo que rola é clicável. */}
      <div className="flex items-center gap-2 flex-wrap">
        {a.alcance && <span className={chip}>{a.alcance}</span>}
        {a.area && <span className={chip}>Área {a.area}</span>}
        {a.familia === "auxilio" && a.alvoAuxilio && (
          <span className={chip}>{ALVO_AUXILIO_ROTULO[a.alvoAuxilio] ?? a.alvoAuxilio}</span>
        )}
        {a.tipoDano && <span className={chip}>{a.tipoDano}</span>}
        {(a.condicoes ?? []).map((c, i) => (
          <span key={i} className="afty-chip" data-afty-tom="destaque">
            {CONDICAO_ROTULO[c] ?? c}
          </span>
        ))}
        {a.prejuizoMultiplos && (
          <span className={chip} title={a.prejuizoMultiplos}>Prejuízo por Repetição</span>
        )}

        {/* Ataque por Jogada: o acerto rola. */}
        {a.familia === "ataque" && a.bonusAtaque != null && (
          <span className={chip}>
            Acerto{" "}
            <NumeroComFontes
              valor={a.bonusAtaque}
              total={sinalDe(a.bonusAtaque)}
              className="afty-valor text-[11px]"
              ancora="direita"
              /* Crítico Aprimorado (Controlador 10°) desce a margem das jogadas
                 dela para 19, e a rolagem precisa saber disso para marcar o
                 acerto crítico. */
              onRolar={() => rolar({ tipo: "teste", rotulo, bonus: a.bonusAtaque, margem: margemCritico })}
            />
          </span>
        )}

        {/* Ataque por Teste de Resistência: quem rola é o alvo, então a CD é um
            número de leitura e não um botão. Sem ela a ação é inutilizável. */}
        {a.familia === "ataque" && a.cd != null && (
          <span className="afty-valor text-[11px]" data-afty-tom="destaque" title="O alvo rola contra esta CD">
            CD {a.cd}{a.trTipoLabel ? ` ${a.trTipoLabel}` : ""}
          </span>
        )}

        {grupos.length > 0 && (
          <NumeroComFontes
            valor={`${notacaoDe(grupos)}${a.dano.bonus ? sinalDe(a.dano.bonus) : ""}`}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Dano"
            onRolar={() => rolar({ tipo: "dano", rotulo, grupos, fixo: a.dano.bonus ?? 0 })}
          />
        )}

        {(a.cura?.grupos ?? []).length > 0 && (
          <NumeroComFontes
            valor={`${notacaoDe(a.cura.grupos)}${a.cura.bonus ? sinalDe(a.cura.bonus) : ""}`}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Cura"
            onRolar={() => rolar({
              tipo: "dano", tom: "cura", rotulo,
              grupos: a.cura.grupos, fixo: a.cura.bonus ?? 0,
            })}
          />
        )}

        {(a.danoAdicional?.grupos ?? []).length > 0 && (
          <NumeroComFontes
            valor={notacaoDe(a.danoAdicional.grupos)}
            formatar={false}
            className="afty-valor text-[13px] whitespace-nowrap"
            ancora="direita"
            titulo="Dano Adicional"
            onRolar={() => rolar({ tipo: "dano", rotulo, grupos: a.danoAdicional.grupos })}
          />
        )}

        {/* Auxílio de valor fixo (Defesa, Acerto, RD): número, não rolagem. */}
        {a.familia === "auxilio" && a.valor != null && (
          <span className="afty-valor text-[13px]" data-afty-tom="destaque">
            {a.auxilioSub === "rd" ? `${a.valor} RD` : sinalDe(a.valor)}
          </span>
        )}
      </div>
    </div>
  );
}

function Invocacao({ inv, rolar, destacado }) {
  const [aberto, setAberto] = useState(false);
  const raiz = useDestaque(destacado);
  const testes = inv.testes ?? {};
  const nome = inv.nome || "Invocação";

  return (
    <section
      ref={raiz}
      id={`afty-item-invocacao:${inv.id}`}
      className="afty-card p-3"
      data-afty-alvo={destacado ? "sim" : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center gap-2 text-left"
          onClick={() => setAberto((x) => !x)}
          aria-expanded={aberto}
        >
          {aberto
            ? <ChevronDown className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}
          <span className="afty-card-titulo truncate">{inv.nome || "Invocação Sem Nome"}</span>
        </button>
        {inv.warnings?.length > 0 && (
          <span className="afty-chip" data-afty-tom="aviso" title={inv.warnings.join("\n")}>
            <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {inv.warnings.length}
          </span>
        )}
        {/* O tipo diz o Intermediário que ela precisa e como ela sai de campo
            (dissipada/exorcizada contra desativada/destruída). */}
        {inv.tipoLabel && (
          <span className="afty-chip" title={`Intermediário: ${inv.intermediario}. Retirada: ${inv.retirada}`}>
            {inv.tipoLabel}
          </span>
        )}
        <span className="afty-chip" data-afty-tom="destaque">{inv.grauLabel}</span>
        <span className="afty-valor text-[11px]" data-afty-tom="custo" title="Custo em PE">
          {inv.custo} PE
        </span>
      </div>

      {/* Por que ESTA invocação é diferente das outras: o Feitiço que a criou e
          os marcadores ligados nela. Sem isso o jogador vê um PV maior na mesa e
          nenhuma pista da origem. */}
      {(inv.shikigami || (inv.marcadores ?? []).length > 0) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {inv.shikigami && (
            <span className="afty-chip" title="Feitiço de Criação de Shikigamis que a criou">
              {inv.shikigami.fonte}
            </span>
          )}
          {/* Marcador que PEDE escolha e está sem ela não entrega o efeito: o
              `quando` do canal testa `marc_<id>_<opcao>` e nenhuma bate. Sem
              este aviso a invocação aparecia marcada e o número não vinha. */}
          {(inv.marcadores ?? []).map((m) => (
            <span
              key={m.id}
              className="afty-chip"
              data-afty-tom={m.faltaOpcao ? "aviso" : "destaque"}
              title={m.faltaOpcao ? "Falta escolher a opção deste marcador" : undefined}
            >
              {m.faltaOpcao && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {m.label}{m.opcao ? ` · ${m.opcao}` : ""}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        <Numero icone={Heart} rotulo="PV" valor={inv.pv} />
        <Numero icone={Shield} rotulo="Defesa" valor={inv.defesa} />
        <Numero icone={Wind} rotulo="Desloc." valor={`${inv.deslocamento}m`} />
        <span className="afty-stat" title="CD das habilidades dela">
          <span className="afty-stat-rotulo">CD</span>
          <span className="afty-stat-valor">{testes.cd}</span>
        </span>
      </div>

      {/* Corpo: RD e Tamanho, os dois derivados. A RD Geral vale contra todo
          tipo, e cada linha por tipo já traz o total que vale contra ele. */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {(inv.rd?.geral ?? 0) > 0 && (
          <span className="afty-chip" title="Redução de Dano contra todos os tipos">RD {inv.rd.geral}</span>
        )}
        {(inv.rd?.porTipo ?? []).map((l) => (
          <span key={l.chave} className="afty-chip" title="Redução de Dano contra este tipo">
            RD {l.label} {l.total}
          </span>
        ))}
        {inv.tamanhoLabel && (
          <span className="afty-chip" title="Tamanho">{inv.tamanhoLabel}</span>
        )}
        {/* Habilidades de USO que o dono pode gastar nesta invocação, com o
            número fechado, e a margem de crítico das jogadas dela. */}
        {(inv.opcoesDeUso ?? []).map((o) => (
          <span key={o.id} className="afty-chip" title={o.nome}>{o.nome} {o.valor}</span>
        ))}
        {inv.margemCritico < 20 && (
          <span className="afty-chip" title="Margem de acerto crítico das jogadas dela">
            Crítico {inv.margemCritico}+
          </span>
        )}
        {inv.criticoBrutal && <span className="afty-chip" title="Crítico Brutal">Crítico +1 dado</span>}
        {/* Regras do Shikigami de Técnica que não têm canal: turno próprio,
            retorno com vida cheia na primeira dissipação, desvantagem alheia e
            imunidade ao Prejuízo por Repetição. O texto vai no `title`. */}
        {(inv.tracos ?? []).map((t) => (
          <span key={t.id} className="afty-chip" data-afty-tom="destaque" title={t.regra}>{t.nome}</span>
        ))}
      </div>

      {aberto && (
        <div className="mt-2 space-y-2">
          <Atributos atributos={inv.atributos} nomeDono={nome} rolar={rolar} />

          {/* Jogada de Ataque da criatura, fora de qualquer Ação. É o número de
              um ataque improvisado, e é o único lugar onde o bônus de
              Característica em Ataque (que exige gatilho) aparece. */}
          {testes.acerto && (
            <div>
              <h3 className="afty-card-titulo mb-1">Ataque</h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {[["corpo", "Corpo a Corpo"], ["distancia", "À Distância"]].map(([k, label]) => {
                  const t = testes.acerto[k];
                  return t ? (
                    <LinhaDeTeste
                      key={k}
                      nome={label}
                      bonus={t.bonus}
                      comGatilho={t.comGatilho}
                      treinado={t.treinado}
                      rotulo={`${nome} · ${label}`}
                      rolar={rolar}
                    />
                  ) : null;
                })}
              </div>
            </div>
          )}

          {(testes.resistencias ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Testes de Resistência</h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {testes.resistencias.map((r) => (
                  <LinhaDeTeste
                    key={r.value}
                    nome={r.label}
                    bonus={r.bonus}
                    comGatilho={r.comGatilho}
                    mestre={r.mestre}
                    treinado={r.treinado}
                    rotulo={`${nome} · ${r.label}`}
                    rolar={rolar}
                  />
                ))}
              </div>
            </div>
          )}

          {(testes.pericias ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Perícias</h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {testes.pericias.map((p) => (
                  <LinhaDeTeste
                    key={p.id}
                    nome={p.nome}
                    bonus={p.bonus}
                    mestre={p.mestre}
                    treinado={p.treinado}
                    rotulo={`${nome} · ${p.nome}`}
                    rolar={rolar}
                  />
                ))}
              </div>
            </div>
          )}

          {(inv.acoes ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Ações</h3>
              <div className="space-y-1">
                {inv.acoes.map((a, i) => (
                  <Acao
                    key={`${a.nome}-${i}`}
                    a={a}
                    nomeDono={nome}
                    margemCritico={inv.margemCritico ?? 20}
                    rolar={rolar}
                  />
                ))}
              </div>
            </div>
          )}

          {(inv.caracteristicas ?? []).length > 0 && (
            <div>
              <h3 className="afty-card-titulo mb-1">Características</h3>
              <div className="space-y-1">
                {/* ⚠ Elas eram um chip com o NOME e mais nada. O valor já vinha
                    resolvido do motor e ficava só embutido no stat block, então
                    a mesa via "Couraça" sem saber que aquilo é +15 PV, e a
                    descrição que a pessoa escreveu não aparecia em lugar nenhum. */}
                {inv.caracteristicas.map((c, i) => (
                  <div key={`${c.nome}-${i}`} className="afty-linha px-2.5 py-1 flex items-center gap-2 flex-wrap">
                    <span className="flex-1 min-w-0 text-[12px] truncate" title={c.descricao || undefined}>
                      {c.nome || "Característica"}
                    </span>
                    {c.requerGatilho && (
                      <span className="afty-rotulo text-[10px]" title="Exige um gatilho específico">Gatilho</span>
                    )}
                    {resumoCaracteristica(c) && (
                      <span className="afty-valor text-[12px] whitespace-nowrap">{resumoCaracteristica(c)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Uma HORDA. Em combate ela é uma criatura só, e por isso tem PV, tamanho e as
 * ações do líder JÁ ESCALADAS pelo número de membros.
 *
 * ⚠ A aba mostrava só nome, membros e custo (2026-08-16). O `resolveHorda`
 * sempre devolveu o PV somado, o tamanho subido e as ações do líder com o
 * escalonamento aplicado, e nada disso chegava à mesa: quem jogasse uma horda
 * tinha de abrir o criador para saber o dano dela.
 */
function Horda({ h, rolar }) {
  const rotulo = h.nome || "Horda";
  return (
    <div className="afty-linha px-2.5 py-1.5 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{rotulo}</span>
        {h.warnings?.length > 0 && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={h.warnings.join("\n")}
          />
        )}
        {/* `membros` é a lista de ids, e imprimi-la saía como "M1,M2 Membros".
            O número é o `membrosCount`. */}
        {h.membrosCount != null && (
          <span className="afty-rotulo text-[10px] whitespace-nowrap">{h.membrosCount} Membros</span>
        )}
        {h.custo != null && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{h.custo} PE</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {h.pv != null && <span className="afty-chip" title="Pontos de Vida da horda">PV {h.pv}</span>}
        {h.deslocamento != null && <span className="afty-chip" title="Deslocamento">{h.deslocamento}m</span>}
        {h.tamanhoLabel && <span className="afty-chip" title="Tamanho">{h.tamanhoLabel}</span>}
        {h.escala?.prejuizoExtra > 0 && (
          <span className="afty-chip" title="Usos adicionais antes do prejuízo por repetição">
            +{h.escala.prejuizoExtra} uso antes do prejuízo
          </span>
        )}
      </div>

      {/* As ações do LÍDER, com o escalonamento da horda já aplicado. */}
      {(h.acoes ?? []).map((a, i) => {
        /* O dado extra da Melhoria Agressividade entra aqui também: o
           escalonamento da horda mexe no dado da TABELA, e o extra continua
           somando por fora. Ler só o `danoGrupos` deixaria a horda batendo mais
           fraco que a mesma invocação sozinha. */
        const grupos = [
          ...(a.horda?.danoGrupos ?? a.base?.dano?.grupos ?? []),
          ...(a.base?.danoExtraAtaque?.grupos ?? []),
        ];
        const curaGrupos = a.horda?.curaGrupos ?? a.base?.cura?.grupos ?? [];
        const valor = a.horda?.valor ?? a.base?.valor;
        return (
          <div key={`${a.nome}-${i}`} className="flex items-center gap-2 flex-wrap pl-2">
            <span className="flex-1 min-w-0 text-[11px] truncate" title={a.nome}>{a.nome || "Ação"}</span>
            {grupos.length > 0 && (
              <NumeroComFontes
                valor={`${notacaoDe(grupos)}${a.base?.dano?.bonus ? sinalDe(a.base.dano.bonus) : ""}`}
                formatar={false}
                className="afty-valor text-[12px] whitespace-nowrap"
                ancora="direita"
                titulo="Dano da horda"
                onRolar={() => rolar({
                  tipo: "dano", rotulo: `${rotulo} · ${a.nome || "Dano"}`,
                  grupos, fixo: a.base?.dano?.bonus ?? 0,
                })}
              />
            )}
            {curaGrupos.length > 0 && (
              <NumeroComFontes
                valor={`${notacaoDe(curaGrupos)}${a.base?.cura?.bonus ? sinalDe(a.base.cura.bonus) : ""}`}
                formatar={false}
                className="afty-valor text-[12px] whitespace-nowrap"
                ancora="direita"
                titulo="Cura da horda"
                onRolar={() => rolar({
                  tipo: "dano", tom: "cura", rotulo: `${rotulo} · ${a.nome || "Cura"}`,
                  grupos: curaGrupos, fixo: a.base?.cura?.bonus ?? 0,
                })}
              />
            )}
            {grupos.length === 0 && curaGrupos.length === 0 && valor != null && (
              <span className="afty-valor text-[12px]">
                {a.auxilioSub === "rd" ? `${valor} RD` : sinalDe(valor)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AbaInvocacoes({ derived, rolar, destaque }) {
  const invocacoes = derived.invocacoes?.lista ?? [];
  const hordas = derived.hordas?.lista ?? [];
  const marcadores = derived.invocacoes?.marcadores ?? [];
  const controle = derived.invocacoes?.controle;

  if (!invocacoes.length && !hordas.length) {
    return (
      <section className="afty-card p-3">
        <p className="afty-vazio">Nenhuma Invocação</p>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {/* Marcadores só existem para quem tem a Habilidade que os concede, e o
          excesso é um aviso e não um bloqueio, igual ao resto do sistema. */}
      {/* Roster do Controlador: quantas cabem em campo, quantas a ação Invocar
          traz e quantos comandos ele dá por ação. São números de COMBATE, e sem
          eles a mesa decide de cabeça quantas invocações pode manter. */}
      {controle?.ativo && (
        <section className="afty-card p-3 flex items-center gap-1.5 flex-wrap">
          <span className="afty-chip" title="Invocações que você pode manter em campo">
            Em campo {controle.limiteCampo}
          </span>
          <span className="afty-chip" title="Invocações que a ação Invocar traz">
            Por Invocar {controle.invocarPorAcao}
          </span>
          <span className="afty-chip" title="Comandos por Ação Comum e por Ação Bônus">
            Comandos {controle.comandos}
          </span>
          {controle.criarHorda && (
            <span className="afty-chip" title="Hordas que você pode manter em campo">
              Hordas {controle.limiteHordas}
            </span>
          )}
          {controle.invocarAcaoLivre && (
            <span className="afty-chip" data-afty-tom="destaque">Invocar como Ação Livre</span>
          )}
        </section>
      )}

      {marcadores.length > 0 && (
        <section className="afty-card p-3 flex items-center gap-2 flex-wrap">
          {marcadores.map((m) => (
            <span key={m.id} className="afty-linha px-2.5 py-1 flex items-center gap-2">
              <span className="text-[12px]">{m.label}</span>
              {m.excedeu && (
                <AlertTriangle className="w-3 h-3 flex-shrink-0 afty-tom-aviso" aria-label="Excedeu" />
              )}
              <span className="afty-valor text-[13px] tabular-nums">{m.marcadas} / {m.limite}</span>
            </span>
          ))}
        </section>
      )}

      {invocacoes.map((inv) => (
        <Invocacao
          key={inv.id}
          inv={inv}
          rolar={rolar}
          destacado={destaque === `invocacao:${inv.id}`}
        />
      ))}

      {hordas.length > 0 && (
        <section className="afty-card p-3">
          <h2 className="afty-card-titulo mb-2">Hordas</h2>
          <div className="space-y-2">
            {hordas.map((h) => <Horda key={h.id} h={h} rolar={rolar} />)}
          </div>
        </section>
      )}
    </div>
  );
}
