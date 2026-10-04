import React, { useState } from "react";
import {
  AlertTriangle, Heart, Image as ImageIcon, Palette, Sparkles,
} from "lucide-react";

import { AFTY_ATTRS } from "../../afty-schema";
// A entrada de mesa da Horda mora na folha de tipos, que a aba pode importar.
import { entradaDeMesaDaHorda } from "../../afty-invocacoes-tipos";
import { NumeroComFontes } from "../../ui/fontes";
import { sinalDe } from "../../ui/formato";
import { Vital } from "../../ui/vital";
import { cssDaInvocacao, escopoDaInvocacao, SEM_CSS } from "../ficha-tema";
import { useDestaque } from "../usar-destaque";

/**
 * ============================================================
 * ABA SHIKIGAMIS — a peça central de um Controlador
 * ============================================================
 * ⚠ REFEITA EM 2026-08-31, e o pedido do autor é o resumo do que estava errado:
 *
 *   *"a aba de Shikigamis ficou horripilante de entender e usar tudo que eu
 *    tenho a dispor. A impressão que dá é que você fez Shikigamis como se fossem
 *    só mais uma habilidade qualquer, quando eles são a Peça CHAVE em um
 *    personagem Controlador. Eles que precisam de toda a atenção possível, já
 *    que são vários e precisam ser fáceis de consultar, e mexer nas suas barras
 *    de HP, Integridade, saber ativar e desativar seus bônus, isso tudo enquanto
 *    possuem uma Ficha entendível e bonita."*
 *
 * O desenho antigo era uma PILHA de cartões recolhidos, todos iguais, todos
 * fechados, cada um mostrando quatro números mortos. Com quatro invocações a
 * tela não cabia, e nada nela era clicável a não ser a setinha.
 *
 * O desenho de agora é MESTRE-DETALHE, e cada metade resolve uma frase do
 * pedido:
 *
 *   • a FILEIRA de cima ("são vários e precisam ser fáceis de consultar"): um
 *     cartão por Shikigami, com retrato, a barra de vida dele e o interruptor de
 *     campo. Dá para ver o estado de todos sem abrir nenhum.
 *   • a FICHA de baixo ("uma Ficha entendível e bonita"): UM Shikigami por vez,
 *     inteiro, com banner, vitais editáveis, bônus, testes e ações.
 *
 * ⚠ E A INVOCAÇÃO VIROU UM SER VIVO NA MESA. O comentário que estava aqui dizia
 * o contrário: *"o PV da Invocação NÃO entra na sessão. Ele é o MÁXIMO, e não um
 * recurso gasto"*. Era verdade porque o descanso não sabia o que fazer com eles.
 * Agora sabe (ver `descansar` em `ficha-sessao.js`), então o Controlador deixou
 * de anotar o PV dos shikigamis num papel ao lado do computador.
 * ============================================================
 */

/* Rótulos das escolhas que a Ação guarda. São de EXIBIÇÃO: o motor guarda a
   chave, a mesa lê o nome. */
const AUXILIO_ROTULO = {
  cura: "Cura", defesa: "Defesa", acerto: "Acerto", danoAdicional: "Dano Adicional", rd: "RD",
};
const CONDICAO_ROTULO = { fraca: "Fraca", media: "Média", forte: "Forte" };
const ALVO_AUXILIO_ROTULO = { invocacao: "Nela Mesma", aliados: "Aliados" };

/** A notação de uma lista de grupos de dado: `[{2,12},{1,6}]` vira "2d12 + 1d6". */
const notacaoDe = (grupos) => grupos.map((g) => `${g.dados}d${g.faces}`).join(" + ");

/** O que uma Característica resolvida CONCEDE, em uma linha curta. */
function resumoCaracteristica(c) {
  switch (c.subtipo) {
    case "vida": return `+${c.valor} PV`;
    case "rd": return `${c.valor} RD ${c.rdTipoLabel || ""}`.trim();
    case "teste": return `${c.valor >= 0 ? "+" : ""}${c.valor}`;
    /* A linha mostra o que a Característica ENTREGA, e não um número:
       "Mestre em Reflexos". */
    case "resistencia":
      return c.profLabel ? `${c.profLabel}${c.trTipoLabel ? ` em ${c.trTipoLabel}` : ""}` : "";
    case "tamanho": return c.tamanhoLabel || "";
    // As modificadoras do catálogo de 2026-09-30.
    case "defesa": return `+${c.valor} Defesa`;
    case "nivelDano": return `+${c.valor} Nível de Dano`;
    case "danoDurante": return `+1d${c.valor}`;
    case "curaBonus": return `+${c.valor} Cura`;
    case "arsenal": return `${c.valor} Itens`;
    case "estiloCombate": return c.atributoLabel ? `Combate por ${c.atributoLabel}` : "";
    case "resilienciaAlternativa": return c.atributoLabel ? `PV por ${c.atributoLabel}` : "";
    case "resistenciaDano": return c.tipoDanoLabel ? `Resistência a ${c.tipoDanoLabel}` : "";
    // As Auras e as Intrínsecas que têm número ou escolha (2026-09-30, Etapa 6).
    case "auraDano": return c.valor ? `Aura 1d${c.valor}` : "";
    case "formaArma": return c.arma?.nome ?? "";
    case "formaArmadura": return c.armadura ?? "";
    case "laceracaoConstante": return `Cura −${c.valor}`;
    case "corridaPerfurante": return `Até ${c.valor}d6`;
    case "sentidoCegas": return c.percepcao ?? "";
    case "encantada": return c.encantamento ?? "";
    // A Livre com Motor (2026-09-10) diz o que concede: "+2 Defesa · +1 Acerto".
    default:
      if (c.aura) return c.valor ? `Aura +${c.valor}${c.alvoLabel ? ` ${c.alvoLabel}` : ""}` : "";
      return c.resumoMotor || "";
  }
}

/* ============================================================ */
/* RETRATO                                                       */
/* ============================================================ */
/**
 * ⚠ O RETRATO É POR SHIKIGAMI (autor, 2026-08-31: *"faça com que cada Shikigami
 * tenha direito a uma imagem própria na criação e na ficha final"*). Mesmo par
 * de campos do retrato da criatura, `portraitUrl` + `portraitFocus`, para o
 * seletor de foco do criador servir aos dois sem uma segunda cópia.
 *
 * ⚠ A URL QUE FALHA vira o ícone, e a marca fica presa ÀQUELA url: trocar a
 * imagem faz o retrato voltar sozinho. É o desenho da 2.5.2, e vale a pena.
 */
function Retrato({ inv, className }) {
  const [quebrada, setQuebrada] = useState(null);
  const url = inv.portraitUrl && quebrada !== inv.portraitUrl ? inv.portraitUrl : null;
  const f = inv.portraitFocus || {};
  if (!url) {
    return (
      <span className={`afty-inv-retrato afty-inv-retrato-vazio ${className || ""}`} aria-hidden="true">
        <ImageIcon className="w-1/3 h-1/3" />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className={`afty-inv-retrato ${className || ""}`}
      style={{ objectPosition: `${f.x ?? 50}% ${f.y ?? 50}%` }}
      onError={() => setQuebrada(inv.portraitUrl)}
      referrerPolicy="no-referrer"
      draggable={false}
    />
  );
}

/* ============================================================ */
/* A FILEIRA DE CIMA                                             */
/* ============================================================ */
/**
 * Um Shikigami na fileira: retrato, nome, grau, a barra de vida dele e o
 * interruptor de campo.
 *
 * ⚠ O CARTÃO INTEIRO SELECIONA, e o interruptor de campo é o único ponto que
 * não. Selecionar é a ação de leitura e acontece o tempo todo, então ela merece
 * o alvo grande. Invocar e dissipar são atos de mesa e ficam num alvo próprio.
 */
/* A fração com que ela volta, em palavras, para o `title` do botão de entrar. */
const FRACAO_DE_RETORNO = { 0.5: "metade", 0.25: "um quarto" };

/**
 * O botão de campo pelo ESTADO (2026-09-30). Era um interruptor de dois lados
 * (invocar ou dissipar), e os tipos do Mecânicas caem de jeitos que pedem outros
 * gestos: a Marionete quebrada é recolhida e reconstruída, o Corpo desativado
 * só volta curado, e a morte permanente não tem gesto nenhum.
 */
function botaoDeCampo({ inv, estado, entrada, acoes }) {
  if (estado.terminal) return { rotulo: estado.rotulo, titulo: estado.rotulo, desligado: true };
  /* Os compostos (2026-10-01, Etapa 9): quem está dentro de um não tem botão
     próprio, e o Mecha formado se desfaz pelo Separar. */
  if (estado.emComposto) return { rotulo: estado.rotuloComposto, titulo: estado.rotuloComposto, desligado: true };
  if (inv.mecha) {
    return { rotulo: "Separar", titulo: "Separar o Mecha (Ação Bônus)", aoClicar: () => acoes.separarMecha?.(), ligado: true };
  }
  switch (estado.estado) {
    case "ativa":
      return {
        rotulo: "Em Campo",
        titulo: inv.regras?.dissipavel === false ? "Retirar de Campo" : `Dissipar (${inv.retirada})`,
        aoClicar: () => acoes.sair(inv.id),
        ligado: true,
      };
    case "quebrada":
      return { rotulo: "Recolher", titulo: "Recolher (Ação Bônus)", aoClicar: () => acoes.recolher(inv.id) };
    case "recolhida":
      return { rotulo: "Reconstruir", titulo: "Reconstruir (Ação Comum e Teste de Ofício)", aoClicar: () => acoes.reconstruir(inv.id) };
    case "desativada":
      return { rotulo: estado.rotulo, titulo: "Núcleo Desativado", desligado: true };
    default: {
      if (!entrada) return { rotulo: `${inv.custo} PE`, titulo: "", desligado: true };
      const fracao = estado.retorno != null && estado.estado !== "guardada"
        ? `, com ${FRACAO_DE_RETORNO[estado.retorno] ?? "parte"} da vida` : "";
      return {
        rotulo: `${entrada.custo.total} PE`,
        titulo: entrada.permitida
          ? `${entrada.verbo} por ${entrada.custo.total} PE${fracao}`
          : `${entrada.verbo}: ${entrada.motivo}`,
        aoClicar: () => acoes.entrar(inv.id),
        desligado: !entrada.permitida,
      };
    }
  }
}

function CartaoDoRoster({ inv, estado, entrada, acoes, selecionado, aoSelecionar, fusao = null }) {
  const pvAtual = estado.pvAtual ?? inv.pv;
  const pct = inv.pv > 0 ? Math.max(0, Math.min(100, (pvAtual / inv.pv) * 100)) : 0;
  const nivel = pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal";
  const botao = botaoDeCampo({ inv, estado, entrada, acoes });
  return (
    <div
      className="afty-inv-cartao"
      data-afty-alvo={selecionado ? "sim" : undefined}
      data-afty-campo={estado.contaNoCampo ? "sim" : "nao"}
      data-afty-fora={estado.terminal ? "sim" : undefined}
    >
      <button
        type="button"
        className="afty-inv-cartao-corpo"
        onClick={aoSelecionar}
        aria-pressed={selecionado}
      >
        <span className="afty-inv-cartao-topo">
          <Retrato inv={inv} className="afty-inv-retrato-cartao" />
          <span className="afty-inv-cartao-texto">
            <span className="afty-inv-cartao-nome" title={inv.nome || "Invocação Sem Nome"}>
              {inv.nome || "Sem Nome"}
            </span>
            {/* A Quimera diz o que é no lugar do grau: o grau dela é o da
                principal, e "Segundo Grau" num cartão de fusão confunde. */}
            <span className="afty-inv-cartao-grau">
              {fusao ? `Quimera · ${fusao.total} Fundidas` : inv.grauLabel}
            </span>
          </span>
        </span>
        <span className="afty-inv-cartao-vida">
          <span className="afty-vital-trilho" data-afty-nivel={nivel}>
            <span className="afty-vital-barra" style={{ width: `${pct}%`, "--afty-vital-cor": "var(--afty-pv)" }} />
          </span>
          <span className="afty-inv-cartao-pv">{pvAtual} / {inv.pv}</span>
        </span>
        {(inv.warnings?.length > 0 || estado.manutencaoPendente) && (
          <AlertTriangle
            className="w-3.5 h-3.5 flex-shrink-0 absolute top-1.5 right-1.5"
            style={{ color: "var(--afty-aviso)" }}
            aria-hidden="true"
            title={[...(estado.manutencaoPendente ? ["Manutenção Pendente"] : []), ...(inv.warnings ?? [])].join("\n")}
          />
        )}
      </button>
      {/* ⚠ MORTE PERMANENTE NÃO VOLTA: *"não pode ser recuperada por métodos
          convencionais, sendo perdida permanentemente"*. O botão morre no lugar
          de sumir, senão o cartão ficaria sem explicação nenhuma. A ficha fica
          (decisão do autor, 2026-09-30): remover é ação manual no criador. */}
      <button
        type="button"
        className="afty-inv-campo"
        data-afty-tom={botao.ligado ? "destaque" : undefined}
        onClick={botao.aoClicar}
        disabled={!!botao.desligado}
        aria-pressed={!!botao.ligado}
        title={botao.titulo}
      >
        {botao.rotulo}
      </button>
    </div>
  );
}

/* ============================================================ */
/* OS BÔNUS                                                      */
/* ============================================================ */
/**
 * ⚠ ESTE BLOCO É A RESPOSTA A *"saber ativar e desativar seus bônus"*, e ele
 * mexe no número de verdade: o autor decidiu em 2026-08-31 que o auxílio ligado
 * *"mexe na ficha do DONO de verdade e na ficha da INVOCAÇÃO de verdade"*. Ver
 * `auxiliosLigadosDa` e `efeitosDeInvocacao`.
 *
 * ⚠ SÓ TRÊS DOS CINCO SUB-TIPOS TÊM INTERRUPTOR, e não é recorte de tela: Cura
 * ROLA e Dano Adicional é *"um próximo ataque"*, um dado, uma vez. Os dois
 * aparecem na lista com o que entregam, sem interruptor, porque esconder a
 * existência deles seria pior que mostrá-los sem botão.
 */
function Bonus({ inv, aoAlternar }) {
  if (!inv.auxilios?.length) return null;
  return (
    <section className="afty-inv-bloco">
      <h3 className="afty-card-titulo mb-1.5">Bônus</h3>
      <div className="space-y-1">
        {inv.auxilios.map((a) => {
          const valor = a.sub === "rd" ? `${a.valor} RD`
            : a.sub === "danoAdicional" ? (a.dado || "")
              : a.valor != null ? sinalDe(a.valor) : "";
          const linha = (
            <>
              <span className="flex-1 min-w-0 text-[12px] truncate">{a.nome}</span>
              <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.subLabel}</span>
              <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.alvoLabel}</span>
              {a.custoPE > 0 && (
                <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
              )}
              {valor && <span className="afty-valor text-[13px] whitespace-nowrap">{valor}</span>}
            </>
          );
          if (!a.sustentavel) {
            return (
              <div key={a.id} className="afty-linha afty-inv-bonus px-2.5 py-1 flex items-center gap-2">
                {linha}
              </div>
            );
          }
          return (
            <button
              key={a.id}
              type="button"
              className="afty-linha afty-inv-bonus afty-inv-bonus-botao px-2.5 py-1 flex items-center gap-2 w-full text-left"
              data-afty-ligado={a.ligado ? "sim" : "nao"}
              onClick={() => aoAlternar(a.id, !a.ligado)}
              aria-pressed={a.ligado}
            >
              <span className="afty-inv-lampada" aria-hidden="true" />
              {linha}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ============================================================ */
/* NA MESA: AURAS, FORMAS E TAREFA (2026-09-30, Etapa 6)         */
/* ============================================================ */
/**
 * O que as Intrínsecas e as Auras pedem da MESA, num bloco só.
 *
 * ⚠ A AURA É DO DONO, e não da invocação: o interruptor diz que o dono está a
 * 4,5 m, e o efeito cai na ficha dele (`aurasLigadasDa`). O app não tem posição,
 * então ninguém liga isso sozinho. Só funciona com a invocação em campo.
 *
 * ⚠ A FORMA NÃO TIRA DE CAMPO: "Enquanto em Forma de Arma, ela ainda conta como
 * uma Invocação em Campo" (Adicionais).
 */
function MesaDaInvocacao({ inv, estado, acoes }) {
  const ef = inv.efeitosIntrinsecos ?? {};
  const auras = inv.auras ?? [];
  const formas = [
    ...(ef.formaArma ? [{ id: "arma", rotulo: "Forma de Arma", detalhe: ef.formaArma.arma?.nome }] : []),
    ...(ef.formaArmadura ? [{ id: "armadura", rotulo: "Forma de Armadura", detalhe: ef.formaArmadura.armadura }] : []),
  ];
  /* A duração do Corpo (2026-09-30, Etapa 8): as rodadas de combate contra o CL,
     e a manutenção da rodada quando a duração venceu. Sem pagar, a próxima
     rodada o tira de campo (`avancaInvocacoesNaRodada`). */
  const duracao = inv.duracao && inv.emCampo ? inv.duracao : null;
  if (!auras.length && !formas.length && !ef.emTarefa && !duracao) return null;
  const botao = (chave, ligado, aoClicar, conteudo, desligado = false, titulo = undefined) => (
    <button
      key={chave}
      type="button"
      className="afty-linha afty-inv-bonus afty-inv-bonus-botao px-2.5 py-1 flex items-center gap-2 w-full text-left"
      data-afty-ligado={ligado ? "sim" : "nao"}
      onClick={aoClicar}
      disabled={desligado}
      aria-pressed={ligado}
      title={titulo}
    >
      <span className="afty-inv-lampada" aria-hidden="true" />
      {conteudo}
    </button>
  );
  return (
    <section className="afty-inv-bloco">
      <h3 className="afty-card-titulo mb-1.5">Na Mesa</h3>
      <div className="space-y-1">
        {auras.map((a) => botao(
          a.caracId, a.ligada, () => acoes.aura(inv.id, a.caracId, !a.ligada),
          <>
            <span className="flex-1 min-w-0 text-[12px] truncate">{a.nome}</span>
            {a.alvoLabel && <span className="afty-rotulo text-[10px] whitespace-nowrap">{a.alvoLabel}</span>}
            <span className="afty-rotulo text-[10px] whitespace-nowrap">Na Aura</span>
            <span className="afty-valor text-[13px] whitespace-nowrap">
              {a.canalDono === "dadosNomeados" ? `1d${a.valor}` : sinalDe(a.valor)}
            </span>
          </>,
          !inv.emCampo, inv.emCampo ? "O dono está a 4,5 m" : "Fora de Campo",
        ))}
        {formas.map((fm) => botao(
          fm.id, inv.forma === fm.id, () => acoes.forma(inv.id, inv.forma === fm.id ? null : fm.id),
          <>
            <span className="flex-1 min-w-0 text-[12px] truncate">{fm.rotulo}</span>
            {fm.detalhe && <span className="afty-rotulo text-[10px] whitespace-nowrap">{fm.detalhe}</span>}
          </>,
          !inv.emCampo, inv.emCampo ? "Ação Simples" : "Fora de Campo",
        ))}
        {ef.emTarefa && botao(
          "tarefa", inv.emTarefa, () => acoes.tarefa(inv.id, !inv.emTarefa),
          <span className="flex-1 min-w-0 text-[12px] truncate">Em Tarefa</span>,
          false, "Cumprindo um comando fora do combate: não conta em campo",
        )}
        {duracao && (
          <div className="afty-linha px-2.5 py-1 flex items-center gap-2">
            <span className="flex-1 min-w-0 text-[12px] truncate">Rodadas em Combate</span>
            <NumeroComFontes
              valor={`${estado?.rodadasAtiva ?? 0} / ${duracao.rodadas}`}
              partes={duracao.partes}
              formatar={false}
              className="afty-valor text-[13px] whitespace-nowrap"
              titulo="Duração pelo CL do Controlador"
            />
          </div>
        )}
        {duracao && estado?.manutencaoPendente && acoes.manter && (
          <button
            type="button"
            className="afty-linha afty-inv-bonus afty-inv-bonus-botao px-2.5 py-1 flex items-center gap-2 w-full text-left"
            data-afty-tom="aviso"
            onClick={() => acoes.manter(inv.id)}
            title="Sem a manutenção, ele sai de campo na próxima rodada"
          >
            <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "var(--afty-aviso)" }} aria-hidden="true" />
            <span className="flex-1 min-w-0 text-[12px] truncate">Manter Ativo</span>
            <span className="afty-valor text-[11px] whitespace-nowrap" data-afty-tom="custo">{duracao.manutencao} PE</span>
          </button>
        )}
      </div>
    </section>
  );
}

/* ============================================================ */
/* O QUE O TIPO DIZ (2026-09-30, Etapa 8)                        */
/* ============================================================ */
/**
 * As regras do TIPO que a mesa consulta e que não são número de stat: as
 * imunidades (Marionete, Corpo boneco), o Dano Psíquico que vai ao invocador, a
 * refeição do Corpo Biológico e o reparo do Desmembramento, com o Custo e a CD da
 * tabela de Criação de Itens (a coluna e o Custo no hover). O título é o próprio tipo.
 */
function RegrasDoTipo({ inv }) {
  const imunes = inv.imunidades ?? [];
  const { reparo, refeicao, duracao } = inv;
  if (!imunes.length && !inv.psiquicoNoInvocador && !reparo && !refeicao && !duracao) return null;
  const linha = "afty-linha px-2.5 py-1 flex items-center gap-2 flex-wrap";
  return (
    <section className="afty-inv-bloco">
      <h3 className="afty-card-titulo mb-1.5">{inv.tipoLabel}</h3>
      <div className="space-y-1">
        {imunes.length > 0 && (
          <div className={linha}>
            <span className="flex-1 min-w-0 text-[12px]">Imune</span>
            <span className="afty-rotulo text-[11px]">{imunes.join(", ")}</span>
          </div>
        )}
        {inv.psiquicoNoInvocador && (
          <div className={linha}>
            <span className="flex-1 min-w-0 text-[12px]">Dano Psíquico</span>
            <span className="afty-rotulo text-[11px]">No Invocador</span>
          </div>
        )}
        {/* O Corpo dura CL rodadas em combate e CL horas fora dele, e depois
            pede a manutenção por rodada. */}
        {duracao && (
          <div className={linha}>
            <span className="flex-1 min-w-0 text-[12px] truncate">Duração</span>
            <NumeroComFontes
              valor={`${duracao.rodadas} Rodadas, ${duracao.horas} Horas`}
              partes={duracao.partes}
              formatar={false}
              className="afty-valor text-[12px] whitespace-nowrap"
              titulo="Em combate e fora dele"
            />
            <span className="afty-rotulo text-[10px] whitespace-nowrap">Manutenção {duracao.manutencao} PE</span>
          </div>
        )}
        {refeicao && (
          <div className={linha}>
            <span className="flex-1 min-w-0 text-[12px] truncate">{refeicao.nome}</span>
            <span className="afty-valor text-[12px] whitespace-nowrap">{refeicao.texto}</span>
          </div>
        )}
        {reparo && (
          <div className={linha}>
            <span className="flex-1 min-w-0 text-[12px] truncate">Reparo</span>
            {reparo.vias.length > 0 && (
              <span className="afty-rotulo text-[10px]">{reparo.vias.join(" ou ")}</span>
            )}
            <span className="afty-rotulo text-[10px] whitespace-nowrap">Custo {reparo.custo}</span>
            {reparo.cd != null && (
              <NumeroComFontes
                valor={`CD ${reparo.cd}`}
                partes={reparo.partesCd}
                total={reparo.cd}
                formatar={false}
                className="afty-valor text-[12px] whitespace-nowrap"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * As Heranças das Sombras desta invocação (2026-10-01, Etapa 10), achatadas: as
 * que vieram de uma herança morta aparecem recuadas, porque contam como desta.
 * Os números já estão no stat block, e a Ação e a Característica herdadas já
 * estão nas listas dela.
 */
function HerancasDaInvocacao({ inv }) {
  const lista = inv.herancas ?? [];
  if (!lista.length) return null;
  return (
    <section className="afty-inv-bloco">
      <h3 className="afty-card-titulo mb-1.5">Heranças</h3>
      <div className="space-y-1">
        {lista.map((h) => (
          <div key={h.id} className="afty-linha px-2.5 py-1 flex items-center gap-2 flex-wrap"
            style={h.profundidade ? { marginLeft: `${h.profundidade * 0.75}rem` } : undefined}>
            <span className="flex-1 min-w-0 text-[12px] truncate">{h.origemNome}</span>
            {h.bonus && <span className="afty-rotulo text-[10px]">{h.bonus}</span>}
            {h.acao && <span className="afty-rotulo text-[10px]">{h.acao}</span>}
            {h.caracteristica && <span className="afty-rotulo text-[10px]">{h.caracteristica}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================ */
/* TESTES E AÇÕES (mantidos do desenho antigo)                   */
/* ============================================================ */
/**
 * Uma linha de teste rolável (Teste de Resistência ou Perícia). As duas têm a
 * mesma anatomia: nome, o que é condicional, a proficiência e o número que rola.
 */
/* ⚠ A LINHA PERDEU O "+N com gatilho" em 2026-09-04. O bônus de Característica
   de Teste em Ataque e em TR passou a entrar no número que a linha rola, por
   decisão do autor, e o painel de fontes o mostra como parcela "Característica".
   A metade que o livro cobra continua valendo, e quem some é só a separação:
   o gatilho virou combinado de mesa. Ver `resolveTestesInvocacao`. */
function LinhaDeTeste({ nome, bonus, partes, mestre = false, treinado = true, rotulo, rolar }) {
  return (
    <div className="afty-linha px-2.5 py-1 flex items-center gap-2">
      <span className="flex-1 min-w-0 text-[12px] truncate">{nome}</span>
      {mestre
        ? <span className="afty-chip">Mestre</span>
        : !treinado && <span className="afty-rotulo text-[10px]">Não Treinado</span>}
      <NumeroComFontes
        valor={bonus}
        partes={partes}
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
 * empurrão). Só o MODIFICADOR rola, como teste puro.
 */
function Atributos({ atributos, nomeDono, rolar }) {
  const valores = atributos?.valores;
  if (!valores) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
      {AFTY_ATTRS.map((a) => {
        const m = atributos.mods?.[a.key] ?? 0;
        /* Com o canal `atributo` o valor mostrado já é o EFETIVO, e o title
           conta de onde ele veio: "Força: Base 14, Pele de Pedra +2". */
        const partes = atributos.partes?.[a.key];
        const titulo = partes
          ? `${a.label}: ${partes.map((p, i) => `${p.label} ${i === 0 ? p.valor : sinalDe(p.valor)}`).join(", ")}`
          : a.label;
        return (
          <span key={a.key} className="afty-stat" title={titulo}>
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
 */
function Acao({ a, nomeDono, margemCritico = 20, criticoBrutal = false, rolar }) {
  /* ⚠ O dado extra da Melhoria Agressividade entra NA MESMA ROLAGEM. Ele é
     "dano adicional" em todo ataque da invocação, sem tipo próprio, então
     mostrá-lo numa linha separada e rolar só o dado da tabela entregaria menos
     dano do que a ficha promete. */
  const grupos = [...(a.dano?.grupos ?? []), ...(a.danoExtraAtaque?.grupos ?? [])];
  /* CRÍTICO BRUTAL (Controlador 4°, 2026-09-30): "Os acertos críticos da sua
     invocação causam 1 dado de dano adicional". Um dado do tamanho do maior dado
     da ação, que só rola no modo Crítico (`apenasCritico`, do rolador). */
  const gruposRolados = criticoBrutal && grupos.length
    ? [...grupos, { dados: 1, faces: Math.max(...grupos.map((g) => g.faces)), apenasCritico: true }]
    : grupos;
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
        {/* As marcas do Adicionais (2026-10-01): Reação, Manobra e a Ação especial. */}
        {a.reacao && <span className={chip} title={a.valorSemReacao != null ? "Valor 1,5 vez como Reação" : undefined}>Reação</span>}
        {a.manobra && <span className={chip}>Manobra</span>}
        {a.especial && <span className={chip}>{a.especial.rotulo}</span>}
        {a.herancaDe && <span className={chip} title="Recebida por Herança">Herança</span>}
        {a.custoPE > 0 && (
          <span className="afty-valor text-[11px]" data-afty-tom="custo">{a.custoPE} PE</span>
        )}
      </div>

      {/* Linha 2: as condições à esquerda, os números à direita.
          ⚠ OS DOIS GRUPOS SÃO SEPARADOS desde 2026-09-03. Eram uma fila só, e
          num cartão largo o dano parava no meio da linha, num ponto diferente
          em cada ação, porque a posição dele dependia de quantas pastilhas
          vinham antes. Com o `ml-auto` no grupo dos números, tudo que rola tem
          a mesma borda direita em todas as ações, que é onde o dedo procura. */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 flex-wrap min-w-0">
        {a.alcance && <span className={chip}>{a.alcance}</span>}
        {a.area && <span className={chip}>Área {a.area}</span>}
        {a.familia === "auxilio" && a.alvoAuxilio && (
          <span className={chip}>{ALVO_AUXILIO_ROTULO[a.alvoAuxilio] ?? a.alvoAuxilio}</span>
        )}
        {a.tipoDano && <span className={chip}>{a.tipoDanoLabel || a.tipoDano}</span>}
        {(a.condicoes ?? []).map((c, i) => (
          <span key={i} className="afty-chip" data-afty-tom="destaque">
            {CONDICAO_ROTULO[c] ?? c}
          </span>
        ))}
        {a.prejuizoMultiplos && (
          <span className={chip} title={a.prejuizoMultiplos}>Prejuízo por Repetição</span>
        )}
        </span>

        <span className="inline-flex items-center gap-2 flex-wrap ml-auto">
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
            onRolar={() => rolar({ tipo: "dano", rotulo, grupos: gruposRolados, fixo: a.dano.bonus ?? 0 })}
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
        </span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* A TIRA DE STATS                                               */
/* ============================================================ */
/**
 * ⚠ UMA CÉLULA POR NÚMERO, e a grade se ajusta sozinha. Eram QUATRO colunas
 * fixas (`repeat(4, 1fr)`) até 2026-09-03, e num monitor de 1440 cada célula
 * ficava com 300px para exibir um "63": o autor apontou como *"bem esquisito e
 * pouco intuitivo"*, e o diagnóstico é geométrico. Com `auto-fit` a célula tem
 * a largura do conteúdo dela, e a tira absorveu a fileira de pastilhas que
 * vinha logo abaixo (RD por tipo, Tamanho, Crítico): eram os mesmos números,
 * num formato diferente, ocupando uma segunda linha.
 *
 * ⚠ E TODO NÚMERO ABRE AS FONTES no hover. Ver `fontes` no `resolveInvocacao`.
 */
/* ⚠ SEM ÍCONE NO RÓTULO desde 2026-09-03. Defesa e Desloc. tinham um, e ele
   custava duas coisas: a tira do cabeçalho da Ficha usa o mesmo `.afty-stat` com
   rótulo de texto puro (duas linguagens para a mesma peça), e um `inline-block`
   de 13,5px numa caixa de 12,7px empurrava só aquelas duas células 0,7px para
   baixo em relação às vizinhas. Rótulo que já diz "Defesa" não precisa de escudo. */
function StatDaInvocacao({ id, rotulo, valor, partes, titulo }) {
  return (
    <span className="afty-stat" data-afty-stat={id} title={titulo}>
      <span className="afty-stat-rotulo">{rotulo}</span>
      <NumeroComFontes
        valor={valor}
        partes={partes}
        formatar={false}
        className="afty-stat-valor"
        ancora="esquerda"
      />
    </span>
  );
}

/* ============================================================ */
/* A FICHA DE UM SHIKIGAMI                                       */
/* ============================================================ */
/**
 * ⚠ ELA TEM `id` PRÓPRIO (`afty-inv-<id>`), e não é decoração: é a âncora do
 * CSS personalizado daquele Shikigami. Ver `escopoDaInvocacao`.
 *
 * ⚠ REDESENHADA EM 2026-09-03, e o pedido do autor tem quatro frases. Três
 * delas são a mesma doença em lugares diferentes:
 *
 *   *"A primeira imagem ficou muito sobrecarregada de efeitos e a Imagem da
 *    Invocação mesmo ficou completamente ofuscada."*
 *
 * O cabeçalho carregava a identidade (grau, tipo, custo) E os marcadores, todos
 * como pastilha roxa do mesmo tamanho. Num Controlador de nível alto são oito
 * marcadores, então a faixa quebrava em duas linhas de pastilha idêntica e o
 * retrato de 3,25rem virava um selo perdido no canto. Salência máxima para o
 * conteúdo menos usado. Agora o cabeçalho tem SÓ a identidade, o retrato subiu
 * para 4,5rem, e os marcadores viraram um bloco próprio com título.
 *
 *   *"[Turno Próprio, Retorno Completo, Desvantagem Alheia, Imune a Prejuízo
 *    por Repetição] não é necessário"*
 *
 * Os quatro traços do Shikigami de Técnica saíram (o criador já os tinha
 * cortado em 2026-09-02). `tracosDeTecnica` continua no resolvedor porque as
 * regras existem e nenhuma delas tem canal, mas quem lê o tipo já sabe delas.
 *
 *   *"no geral ficou bem esquisito e pouco intuitivo o uso"*
 *
 * O corpo era UMA coluna de seções empilhadas, todas com o mesmo peso e todas
 * na largura inteira: num monitor de 1440 o rótulo "Reflexos" ficava a 1200px
 * do "+45" que ele nomeia, e a ficha tinha 2199px de altura. Agora o corpo é
 * duas colunas, e a divisão é semântica: à esquerda o que a invocação ROLA
 * (atributos, ataque, testes, perícias), à direita o que ela FAZ (ações,
 * bônus, características, marcadores).
 *
 * ⚠ A ORDEM DAS DUAS É PEDIDO DO AUTOR (2026-09-03), e não gosto meu: *"acredito
 * que Atributos, Ataque, Testes de Resistência e Perícias deveriam estar a
 * esquerda. E as Ações e Características a direita."* Eu tinha posto o contrário
 * (a esquerda se lê primeiro, e a ação é o que mais se usa), e ele decidiu o
 * outro lado. A leitura de stat block manda: o que a criatura É vem antes do que
 * ela faz.
 *
 * ⚠ E O LADO ESQUERDO SE DOBRA SOZINHO. Autor, na mesma mensagem: *"as vezes
 * fica esse vão enorme quando a Invocação possui poucas Ações e
 * Características"*. Com atribuição fixa de lado, a coluna mais curta termina
 * antes e o resto do cartão fica vazio, e isso não tem conserto por CSS: a
 * altura do cartão é a da coluna mais alta. O que TEM conserto é a diferença.
 * As três listas de teste (Ataque, TR, Perícias) usam `afty-inv-duplo`, que
 * vira duas colunas quando a COLUNA que as segura passa de 560px: são 6 linhas
 * a menos de altura, e o lado dos testes deixa de ser sempre o mais alto dos
 * dois. É o mesmo `sm:grid-cols-2` que estas listas tinham quando ocupavam a
 * largura inteira, agora medido contra a coluna e não contra a janela.
 */
/* ⚠ A QUIMERA USA ESTA MESMA FICHA (2026-09-23). Autor: *"faça com que apareça a
   ficha fora do modo de edição"*. Ela era um resumo de quatro pastilhas no pé da
   aba (PV, Defesa, Deslocamento, atributos), sem Ações, testes nem vida editável,
   então a mesa voltava ao criador para saber o que ela fazia. A resolvida dela já
   tem o formato de invocação, e `fusao` só acrescenta a identidade: a pastilha
   "Quimera" e quem entrou na fusão. */
function FichaDoShikigami({ inv, estado, rolar, acoes, aoTemar, fusao = null, herdeiras = [], herancaJaCriada = false }) {
  const nome = inv.nome || "Invocação";
  const testes = inv.testes ?? {};
  const fontes = inv.fontes ?? {};
  const pvAtual = estado.pvAtual ?? inv.pv;
  const almaAtual = estado.almaAtual ?? inv.almaMax;
  const pvTemp = Object.values(estado.pvTempFontes || {}).reduce((s, v) => s + (v || 0), 0);

  return (
    <section
      className="afty-card afty-inv-ficha"
      id={escopoDaInvocacao(inv.id).slice(1)}
      data-afty-campo={inv.emCampo ? "sim" : "nao"}
    >
      {/* ---------- a cabeça: identidade, e só ----------
          ⚠ ERA UM BANNER de largura inteira até 2026-08-31, e o autor cortou:
          *"as imagens dos Shikigamis ficaram super esticadas ao invés de serem
          um Icon"*. Retrato de shikigami é quase sempre quadrado ou em pé, e a
          faixa recortava uma tira do meio dele. Ícone ao lado do nome mostra a
          imagem inteira e devolve 6rem de altura para a ficha. */}
      <header className="afty-inv-cabeca">
        <Retrato inv={inv} className="afty-inv-retrato-icone" />
        <div className="afty-inv-cabeca-texto">
          <h2 className="afty-inv-titulo">{nome}</h2>
          <div className="afty-inv-cabeca-marcas">
            {fusao && <span className="afty-chip" data-afty-tom="destaque">Quimera</span>}
            <span className="afty-chip" data-afty-tom={fusao ? undefined : "destaque"}>{inv.grauLabel}</span>
            {inv.tipoLabel && (
              <span className="afty-chip" title={`Intermediário: ${inv.intermediario}. Retirada: ${inv.retirada}`}>
                {inv.tipoLabel}
              </span>
            )}
            <NumeroComFontes
              valor={`${inv.custo} PE`}
              partes={fontes.custo}
              formatar={false}
              className="afty-valor text-[11px]"
              ancora="esquerda"
              titulo="Custo em PE para invocar"
            />
            {/* ⚠ SÓ A EXORCIZADA VIRA MARCA. A "Abatida" existia ao lado dela
                e o autor cortou em 2026-08-31: *"o símbolo de Abatido da ficha
                não sai quando o shikigami é reinvocado ou curado, e não é
                necessário"*. Ele está certo nas duas metades. Não sair É a
                regra (*"até que seja feito um descanso curto ou longo"*, e nem
                curar nem reinvocar são descanso), e uma marca de aviso que fica
                acesa a luta inteira deixa de ser aviso e vira ruído.

                A REGRA CONTINUA VALENDO, e quem a carrega agora é o `title` do
                botão de invocar, que já dizia "com metade da vida". Ali ela
                aparece no momento em que importa, que é o do clique, em vez de
                ficar pendurada no alto da ficha o tempo todo. */}
            {/* A marca do ESTADO (2026-09-30): a morte permanente em âmbar, e os
                estados que travam a volta (quebrada, recolhida, desativada) como
                rótulo simples. "Dissipada" e "Guardada" não viram marca, pela
                mesma razão da "Abatida" acima: o botão de entrar já diz. */}
            {/* Os contadores (2026-10-01, Etapa 11): as quedas da Marionete e os
                exorcismos da Técnica desde o descanso. */}
            {estado.quedas > 0 && <span className="afty-chip" title="Quedas desde o reparo">Quedas {estado.quedas}</span>}
            {estado.exorcismos > 0 && <span className="afty-chip" title="Exorcismos desde o descanso">Exorcismos {estado.exorcismos}</span>}
            {estado.terminal && (
              <span className="afty-chip" data-afty-tom="aviso" title="Perdida permanentemente">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                {estado.rotulo}
              </span>
            )}
            {["quebrada", "recolhida", "desativada"].includes(estado.estado) && (
              <span className="afty-chip">{estado.rotulo}</span>
            )}
            {inv.autonomiaAtiva && (
              <span className="afty-chip" data-afty-tom="destaque" title="Turno próprio, sem comandos">Autonomia</span>
            )}
            {/* Os tipos especiais (2026-09-30, Etapa 8): o Fundamento da Técnica
                Inata, a natureza do Corpo e a cura que o tipo recusa. */}
            {inv.fundamento && (
              <span className="afty-chip" data-afty-tom="destaque" title="Manifestação da Técnica Inata">Fundamento</span>
            )}
            {inv.natureza && (
              <span className="afty-chip">{inv.natureza === "boneco" ? "Boneco" : "Biológico"}</span>
            )}
            {inv.regras?.cura && !inv.regras.cura.comum && <span className="afty-chip">Sem Cura</span>}
            {/* Os compostos de mesa (2026-10-01, Etapa 9). */}
            {inv.mecha && <span className="afty-chip" data-afty-tom="destaque">Mecha</span>}
            {inv.mecha && inv.menorQuebrada && <span className="afty-chip">Menor Quebrada</span>}
            {inv.nucleos && (
              <span className="afty-chip" data-afty-tom="destaque" title="Núcleo ativo">
                {inv.nucleos.find((n) => n.id === inv.nucleoAtivo)?.nome || "Núcleo"}
              </span>
            )}
            {inv.nucleos && acoes.trocarNucleo && (
              <button type="button" className="afty-chip" onClick={() => acoes.trocarNucleo(inv.id)} title="Ação Simples">
                Trocar Núcleo
              </button>
            )}
            {inv.regras?.cura?.comum && !inv.regras.cura.er && <span className="afty-chip">Sem Energia Reversa</span>}
            {/* O Feitiço que a criou fica na identidade porque ele É a origem
                dela, e não um bônus que alguém ligou. */}
            {inv.shikigami && (
              <span className="afty-chip" title="Feitiço de Criação de Shikigamis que a criou">
                {inv.shikigami.fonte}
              </span>
            )}
          </div>
          {fusao && (fusao.fundidas ?? []).length > 0 && (
            <span className="afty-rotulo text-[11px]" title="Invocações fundidas, a principal primeiro">
              {fusao.fundidas.map((f) => f.nome).join(" + ")}
            </span>
          )}
        </div>
        {/* ⚠ SEM GANCHO, SEM BOTÃO. No painel de Encontros o combatente guarda
            uma CÓPIA congelada da ficha, e o editor de aparência grava na
            criatura: um botão ali seria um clique que não faz nada. */}
        {aoTemar && (
          <button
            type="button"
            className="afty-passo flex-shrink-0"
            onClick={aoTemar}
            title={`Aparência de ${nome}`}
            aria-label={`Aparência de ${nome}`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div className="afty-inv-corpo">
        {/* ---------- vitais ---------- */}
        {/* ⚠ AS DUAS BARRAS SÃO O PEDIDO, palavra por palavra: "mexer nas suas
            barras de HP, Integridade". A Integridade da invocação tem máximo
            IGUAL AO PV (autor, 2026-08-31), que é a régua do livro do jogador. */}
        {/* ⚠ A MARIONETE NÃO TEM INTEGRIDADE (2026-09-30, Etapa 8): "Marionetes
            são imunes a dano na alma", e a barra some com o `temAlma`. */}
        <div className={inv.temAlma === false ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
          <Vital
            tipo="pv"
            icone={Heart}
            rotulo="Vida"
            atual={pvAtual}
            max={inv.pv}
            temp={pvTemp}
            onSet={(v) => acoes.vital(inv.id, "pv", v)}
            onDelta={(v) => (v < 0
              ? acoes.dano(inv.id, -v, inv.pv)
              : acoes.cura(inv.id, v, inv.pv))}
          />
          {inv.temAlma !== false && (
            <Vital
              tipo="alma"
              icone={Sparkles}
              rotulo="Integridade"
              atual={almaAtual}
              max={inv.almaMax}
              onSet={(v) => acoes.vital(inv.id, "alma", v)}
              onDelta={(v) => acoes.vital(inv.id, "alma", almaAtual + v)}
            />
          )}
        </div>

        {/* ---------- a tira de stats ---------- */}
        <div className="afty-inv-stats">
          <StatDaInvocacao id="defesa" rotulo="Defesa" valor={inv.defesa} partes={fontes.defesa} />
          <StatDaInvocacao id="deslocamento" rotulo="Desloc." valor={`${inv.deslocamento}m`} partes={fontes.deslocamento} />
          {/* Alado e Nadador (2026-09-30): o voo e o nado partem da caminhada. */}
          {inv.deslocamentos?.voo != null && (
            <StatDaInvocacao id="voo" rotulo="Voo" valor={`${inv.deslocamentos.voo}m`} partes={fontes.deslocamento} />
          )}
          {inv.deslocamentos?.nado != null && (
            <StatDaInvocacao id="nado" rotulo="Nado" valor={`${inv.deslocamentos.nado}m`} partes={fontes.deslocamento} />
          )}
          <StatDaInvocacao id="cd" rotulo="CD" valor={testes.cd} partes={testes.cdPartes} titulo="O alvo rola contra esta CD" />
          <StatDaInvocacao id="rd" rotulo="RD" valor={inv.rd?.geral ?? 0} partes={fontes.rdGeral} titulo="Redução de Dano contra todos os tipos" />
          {(inv.rd?.porTipo ?? []).map((l) => (
            <StatDaInvocacao
              key={l.chave}
              id={`rd-${l.chave}`}
              rotulo={`RD ${l.label}`}
              valor={l.total}
              partes={fontes.rdPorTipo?.[l.chave]}
              titulo={`Redução de Dano contra dano ${l.label}`}
            />
          ))}
          {inv.tamanhoLabel && (
            <StatDaInvocacao id="tamanho" rotulo="Tamanho" valor={inv.tamanhoLabel} />
          )}
          {inv.margemCritico < 20 && (
            <StatDaInvocacao
              id="critico"
              rotulo="Crítico"
              valor={`${inv.margemCritico}+`}
              titulo="Margem de acerto crítico das jogadas dela"
            />
          )}
          {inv.criticoBrutal && (
            <StatDaInvocacao id="critico-brutal" rotulo="Crítico Brutal" valor="+1 Dado" />
          )}
          {/* A Maldição usa Aptidões pelo Nível de Aptidão dela, que é a metade do
              mod de Presença do Controlador (Mecânicas, PV-11). */}
          {inv.nivelAptidao && (
            <StatDaInvocacao
              id="nivel-aptidao"
              rotulo="Nível de Aptidão"
              valor={inv.nivelAptidao.valor}
              partes={inv.nivelAptidao.partes}
            />
          )}
        </div>

        {inv.warnings?.length > 0 && (
          <ul className="space-y-0.5">
            {inv.warnings.map((w, i) => (
              <li key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: "var(--afty-aviso)" }}>
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" /> {w}
              </li>
            ))}
          </ul>
        )}

        {/* ---------- as duas colunas ---------- */}
        <div className="afty-inv-colunas">
          {/* O que ela ROLA */}
          <div className="afty-inv-coluna">
            <section className="afty-inv-bloco">
              <h3 className="afty-card-titulo mb-1.5">Atributos</h3>
              <Atributos atributos={inv.atributos} nomeDono={nome} rolar={rolar} />
            </section>

            {/* Jogada de Ataque da criatura, fora de qualquer Ação. É o número de
                um ataque improvisado, e é o único lugar onde o bônus de
                Característica em Ataque (que exige gatilho) aparece. */}
            {testes.acerto && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Ataque</h3>
                <div className="afty-inv-duplo">
                  {[["corpo", "Corpo a Corpo"], ["distancia", "À Distância"]].map(([k, label]) => {
                    const t = testes.acerto[k];
                    return t ? (
                      <LinhaDeTeste
                        key={k}
                        nome={label}
                        bonus={t.bonus}
                        partes={t.partes}
                        treinado={t.treinado}
                        rotulo={`${nome} · ${label}`}
                        rolar={rolar}
                      />
                    ) : null;
                  })}
                </div>
              </section>
            )}

            {/* Turno próprio (o Shikigami de Técnica): "devendo realizar uma Jogada
                de Iniciativa ao ser Invocado" (Mecânicas). */}
            {inv.iniciativa && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Iniciativa</h3>
                <LinhaDeTeste
                  nome="Iniciativa"
                  bonus={inv.iniciativa.bonus}
                  partes={inv.iniciativa.partes}
                  rotulo={`${nome} · Iniciativa`}
                  rolar={rolar}
                />
              </section>
            )}

            {(testes.resistencias ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Testes de Resistência</h3>
                <div className="afty-inv-duplo">
                  {/* A Marionete manda Vontade e Astúcia ao invocador, e a linha
                      mostra o número dele (`doInvocador`). */}
                  {testes.resistencias.map((r) => (
                    <LinhaDeTeste
                      key={r.value}
                      nome={r.doInvocador ? `${r.label} (Invocador)` : r.label}
                      bonus={r.bonus}
                      partes={r.partes}
                      mestre={r.mestre}
                      treinado={r.treinado}
                      rotulo={`${nome} · ${r.label}`}
                      rolar={rolar}
                    />
                  ))}
                </div>
              </section>
            )}

            {(testes.pericias ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Perícias</h3>
                <div className="afty-inv-duplo">
                  {testes.pericias.map((p) => (
                    <LinhaDeTeste
                      key={p.id}
                      nome={p.nome}
                      bonus={p.bonus}
                      partes={p.partes}
                      mestre={p.mestre}
                      treinado={p.treinado}
                      rotulo={`${nome} · ${p.nome}`}
                      rolar={rolar}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* O que ela FAZ */}
          <div className="afty-inv-coluna">
            {(inv.acoes ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Ações</h3>
                <div className="space-y-1">
                  {inv.acoes.map((a, i) => (
                    <Acao
                      key={a.id || `${a.nome}-${i}`}
                      a={a}
                      nomeDono={nome}
                      margemCritico={inv.margemCritico ?? 20}
                      criticoBrutal={!!inv.criticoBrutal}
                      rolar={rolar}
                    />
                  ))}
                </div>
              </section>
            )}

            <Bonus inv={inv} aoAlternar={(acaoId, ligado) => acoes.auxilio(inv.id, acaoId, ligado)} />
            <MesaDaInvocacao inv={inv} estado={estado} acoes={acoes} />
            <RegrasDoTipo inv={inv} />
            <HerancasDaInvocacao inv={inv} />
            {/* A sombra exorcizada vira Herança de um Shikigami vivo. */}
            {/* Exorcizada, ou morta: a Técnica só morre no 2º exorcismo. */}
            {["exorcizada", "morta"].includes(estado.estado) && inv.familia === "shikigami" && acoes.criarHeranca
              && !herancaJaCriada && herdeiras.length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Criar Herança</h3>
                <div className="flex flex-wrap gap-1">
                  {herdeiras.map((h) => (
                    <button key={h.id} type="button" className="afty-chip" onClick={() => acoes.criarHeranca(inv.id, h.id)} title="No descanso">
                      {h.nome || "Shikigami"}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ⚠ A LISTA LONGA SE DOBRA, e a curta não. Característica é linha de
                uma só altura, igual às de teste, então ela cabe na mesma grade
                de duas colunas. O que muda é que a quantidade varia MUITO (uma
                invocação de Quarto Grau tem duas, um Grau Especial tem doze), e
                dobrar uma lista de duas deixaria uma coluna com uma linha e a
                outra vazia. Acima de quatro a dobra vale a altura que devolve.
                É o outro lado do vão que o autor apontou: quando as Ações e as
                Características são MUITAS, quem sobra vazio é o lado dos testes. */}
            {(inv.caracteristicas ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Características</h3>
                <div className={inv.caracteristicas.length > 4 ? "afty-inv-duplo" : "space-y-1"}>
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
              </section>
            )}

            {/* Habilidades de USO: elas não mudam a ficha dela (dependem de uma
                decisão na hora), mas têm preço calculável, e sem isto a mesa
                reabre o livro para saber quanto custa um turno próprio. */}
            {(inv.opcoesDeUso ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Opções de Uso</h3>
                <div className="space-y-1">
                  {/* ⚠ MARCAR É PARA A PRÓXIMA ENTRADA (2026-09-30): quem cobra o PE é
                      o botão de entrar, que soma a opção ao custo.
                      ⚠ E A AUTONOMIA TAMBÉM VALE NO INÍCIO DO COMBATE (Etapa 8):
                      "Uma Invocação que comece o combate já ativada ou invocada é
                      considerada como se tivesse acabado de ser invocada". Quem já
                      está em campo (e a Maldição, que paga só no início do combate)
                      marca aqui, e o início do combate cobra. */}
                  {(inv.opcoesDeUso ?? []).map((o) => {
                    const noInicio = o.quando === "inicioCombate" || (o.id === "autonomia" && inv.emCampo);
                    const marcavel = !!acoes.opcaoEntrada && (o.id === "autonomia"
                      ? !estado.autonomia
                      : o.quando === "entrada" && !inv.emCampo);
                    const marcada = !!estado.opcoesDeEntrada?.[o.id];
                    const conteudo = (
                      <>
                        <span className="flex-1 min-w-0 text-[12px] truncate">{o.nome}</span>
                        {marcavel && (
                          <span className="afty-rotulo text-[10px] whitespace-nowrap">
                            {noInicio ? "No Início do Combate" : "Na Entrada"}
                          </span>
                        )}
                        <span className="afty-valor text-[11px] whitespace-nowrap" data-afty-tom="custo">{o.valor}</span>
                      </>
                    );
                    return marcavel ? (
                      <button
                        key={o.id}
                        type="button"
                        className="afty-linha afty-inv-bonus afty-inv-bonus-botao px-2.5 py-1 flex items-center gap-2 w-full text-left"
                        data-afty-ligado={marcada ? "sim" : "nao"}
                        onClick={() => acoes.opcaoEntrada(inv.id, o.id, !marcada)}
                        aria-pressed={marcada}
                      >
                        <span className="afty-inv-lampada" aria-hidden="true" />
                        {conteudo}
                      </button>
                    ) : (
                      <div key={o.id} className="afty-linha px-2.5 py-1 flex items-center gap-2">{conteudo}</div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Controle Aprimorado (E-04, 2026-09-30): as Aptidões de Controle e
                Leitura do dono que ela pode usar. O efeito é de mesa. */}
            {(inv.aptidoesDoControlador ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Aptidões do Controlador</h3>
                <div className="space-y-1">
                  {inv.aptidoesDoControlador.map((ap) => (
                    <div key={ap.id} className="afty-linha px-2.5 py-1 text-[12px] truncate">{ap.nome}</div>
                  ))}
                </div>
              </section>
            )}

            {/* ⚠ OS MARCADORES SAÍRAM DO CABEÇALHO em 2026-09-03. Eles dizem por
                que ESTA invocação é diferente das outras, e isso é consulta, não
                identidade: num Controlador alto são oito, e oito pastilhas roxas
                ao lado do nome afogavam o retrato e o próprio nome. Aqui eles
                seguem visíveis, com título, e sem disputar a leitura do topo. */}
            {(inv.marcadores ?? []).length > 0 && (
              <section className="afty-inv-bloco">
                <h3 className="afty-card-titulo mb-1.5">Marcadores</h3>
                <div className="flex flex-wrap gap-1">
                  {inv.marcadores.map((m) => (
                    <span
                      key={m.id}
                      className="afty-chip"
                      data-afty-tom={m.faltaOpcao ? "aviso" : undefined}
                      title={m.faltaOpcao ? "Falta escolher a opção deste marcador" : undefined}
                    >
                      {m.faltaOpcao && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                      {m.label}{m.opcao ? ` · ${m.opcao}` : ""}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* HORDAS                                                        */
/* ============================================================ */
/**
 * Uma HORDA. Em combate ela é uma criatura só, e por isso tem PV, tamanho e as
 * ações do líder JÁ ESCALADAS pelo número de membros.
 */
function Horda({ h, rolar, estado = null, entrada = null, acoes = null }) {
  const rotulo = h.nome || "Horda";
  /* A MESA DA HORDA (2026-10-01, Etapa 9): Criar Horda é uma ação de Invocar,
     com o custo da horda saindo do PE. Em campo, ela tem vida própria, perde
     metade dos membros na metade da vida e acaba a 0. Só sai por vontade no fim
     do combate. */
  const emCampo = estado?.estado === "ativa";
  const pvAtual = estado?.pvAtual ?? h.pv;
  const ativos = new Set(estado?.membrosAtivos ?? (h.membrosDetalhe ?? []).map((m) => m.id));
  return (
    <div className="afty-linha px-2.5 py-1.5 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-1 min-w-0 text-[12px] font-semibold truncate">{rotulo}</span>
        {h.hoste && <span className="afty-chip" title="Conta como uma no limite de hordas com o par">Hoste</span>}
        {acoes && h.valido && (emCampo ? (
          <button
            type="button"
            className="afty-inv-campo"
            data-afty-tom="destaque"
            onClick={() => acoes.sair(h.mesaId)}
            disabled={!!entrada?.emCombate}
            title={entrada?.emCombate ? "Só no Fim do Combate" : "Dissipar a Horda"}
            aria-pressed
          >
            Em Campo
          </button>
        ) : (
          <button
            type="button"
            className="afty-inv-campo"
            onClick={() => acoes.entrar(h.mesaId)}
            disabled={!entrada?.permitida}
            title={entrada?.permitida ? `Criar Horda por ${entrada.custo.total} PE` : `Criar Horda: ${entrada?.motivo ?? ""}`}
          >
            {entrada?.custo?.total ?? h.custo} PE
          </button>
        ))}
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

      {emCampo && acoes && (
        <Vital
          tipo="pv"
          icone={Heart}
          rotulo="Vida da Horda"
          atual={pvAtual}
          max={h.pv}
          temp={Object.values(estado?.pvTempFontes || {}).reduce((s, v) => s + (v || 0), 0)}
          partes={h.fontesPv}
          onSet={(v) => acoes.vital(h.mesaId, "pv", v)}
          onDelta={(v) => (v < 0 ? acoes.dano(h.mesaId, -v, h.pv) : acoes.cura(h.mesaId, v, h.pv))}
        />
      )}

      {/* Os membros, com quem já saiu na metade da vida apagado. */}
      {(h.membrosDetalhe ?? []).length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {h.lider && <span className="afty-chip" data-afty-tom="destaque" title="Líder">{h.lider.nome || "Líder"}</span>}
          {h.membrosDetalhe.map((m) => (
            <span key={m.id} className="afty-chip" data-afty-tom={emCampo && !ativos.has(m.id) ? "aviso" : undefined}
              title={emCampo && !ativos.has(m.id) ? "Saiu da Horda" : "Membro"}>
              {m.nome}
            </span>
          ))}
        </div>
      )}
      {h.liderHorda && (
        <span className="afty-rotulo text-[10px]">
          Líder de Horda: {h.liderHorda.caracNome} ({h.liderHorda.membroNome})
        </span>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {h.pv != null && <span className="afty-chip" title="Pontos de Vida da horda">PV {h.pv}</span>}
        {h.defesa != null && <span className="afty-chip" title="Defesa do líder">Defesa {h.defesa}</span>}
        {h.rdContraAlvoUnico != null && (
          <span className="afty-chip" title="RD contra alvo único (o nível do usuário), que não pode ser negada">RD {h.rdContraAlvoUnico} Alvo Único</span>
        )}
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

/* ============================================================ */
/* A ABA                                                         */
/* ============================================================ */

export default function AbaInvocacoes({ derived, rolar, destaque, estadoDe, entradaDe, mechaDe = null, emCombate = false, reserva = null, acoes, aoTemar, temaEmEdicao }) {
  const invocacoes = derived.invocacoes?.lista ?? [];
  const hordas = derived.hordas?.lista ?? [];
  const quimeras = (derived.quimeras?.lista ?? []).filter((q) => q.valido);
  const marcadores = derived.invocacoes?.marcadores ?? [];
  const controle = derived.invocacoes?.controle;

  /* ⚠ O ALVO DA BUSCA GLOBAL SELECIONA. Sem isto, ir a um Shikigami pela busca
     abria a aba certa e mostrava OUTRO shikigami, porque o selecionado é estado
     desta aba e a busca não o conhecia. */
  const alvoDaBusca = destaque?.startsWith("invocacao:") ? destaque.slice("invocacao:".length) : null;

  /* ⚠ O CLIQUE GRAVA QUAL BUSCA ELE JÁ VIU, e é o que faz as duas fontes de
     seleção conviverem sem um efeito que chama `setState` (o eslint reprova, e
     com razão: seria uma renderização em cascata para chegar num valor que dá
     para calcular de primeira). Uma busca NOVA vence o último clique, e um
     clique vence a busca que ele já tinha visto. */
  const [escolha, setEscolha] = useState({ id: null, buscaVista: null });
  const selecionar = (id) => setEscolha({ id, buscaVista: alvoDaBusca });

  /* A fileira tem as invocações e depois as Quimeras. A Quimera entra pela
     resolvida dela (id `quimera:<id>`), que é o mesmo formato de invocação, e a
     `fusao` ao lado diz à ficha que ela é uma fusão. */
  const fusaoDe = new Map(quimeras.filter((q) => q.resolvida).map((q) => [q.resolvida.id, q]));
  /* Os Corpos de Múltiplos Núcleos entram como UM cartão (o do núcleo ativo), e
     os dois núcleos saem da fileira. O Mecha formado entra no fim (2026-10-01). */
  const gruposNucleos = (derived.multiplosNucleos?.lista ?? []).filter((g) => g.valido && g.resolvida);
  const idsNucleos = new Set(gruposNucleos.flatMap((g) => g.nucleoIds));
  const fileira = [
    ...invocacoes.filter((i) => !idsNucleos.has(i.id)),
    ...[...fusaoDe.values()].map((q) => q.resolvida),
    ...gruposNucleos.map((g) => g.resolvida),
    ...(derived.mecha ? [derived.mecha] : []),
  ];

  /* O selecionado, com o cuidado de sobreviver a uma invocação removida no
     criador com a Ficha aberta: id que não existe mais cai no primeiro. */
  const buscaNova = alvoDaBusca && alvoDaBusca !== escolha.buscaVista
    ? fileira.find((i) => i.id === alvoDaBusca)
    : null;
  const selecionado = buscaNova
    ?? fileira.find((i) => i.id === escolha.id)
    ?? fileira[0]
    ?? null;
  const raiz = useDestaque(!!alvoDaBusca && selecionado?.id === alvoDaBusca);

  /* O CSS personalizado de CADA Shikigami, num bloco só. Fica na aba, e não
     dentro de cada ficha, porque só o selecionado é montado: com o `<style>`
     dentro dele, trocar de Shikigami removeria e recriaria a folha a cada
     clique. Ver `cssDaInvocacao`. */
  /* ⚠ O SHIKIGAMI EM EDIÇÃO PINTA PELO RASCUNHO, e não pelo que está gravado.
     A gravação tem debounce de 600ms (ver `rascunhoInv` na AftyFicha), e sem
     esta linha o CSS só apareceria 600ms depois de cada tecla, que é justamente
     a sensação que o debounce existe para evitar. */
  /* ⚠ `SEM_CSS` VALE AQUI TAMBÉM (2026-09-03). O `?semcss=1` desligava só o CSS
     da ficha do dono, e o de cada invocação é montado NESTA aba: quem escrevia
     um CSS que escondia o próprio shikigami ficava sem saída de emergência. */
  const cssDosShikigamis = SEM_CSS ? "" : invocacoes
    .map((inv) => (temaEmEdicao?.id === inv.id
      ? cssDaInvocacao({ ...inv, aparencia: temaEmEdicao.tema })
      : cssDaInvocacao(inv)))
    .filter(Boolean)
    .join("\n");

  /* Quem ocupa vaga em campo é decidido pelo ESTADO (2026-09-30): a Marionete
     quebrada ainda conta até ser recolhida, e o Corpo desativado não conta. */
  const emCampo = [
    ...invocacoes.map((i) => i.id),
    ...[...fusaoDe.keys()],
    ...gruposNucleos.map((g) => g.mesaId),
    ...hordas.map((h) => h.mesaId),
  ].filter((id) => estadoDe(id).contaNoCampo).length;
  /* As Hordas em campo contra o limite delas: o par da Hoste conta como uma. */
  const hordasEmCampo = hordas.filter((h) => estadoDe(h.mesaId).estado === "ativa");
  const nHordasEmCampo = hordasEmCampo.filter((h) => !(h.hoste && h.parId
    && hordasEmCampo.some((o) => o.id === h.parId) && h.id > h.parId)).length;
  /* O Mecha a formar: os pares de Marionetes ativas que a regra aceita. */
  const marionetesAtivas = invocacoes.filter((i) => i.regras?.familia === "marionete"
    && estadoDe(i.id).estado === "ativa" && !estadoDe(i.id).emComposto);
  const paresDeMecha = [];
  if (mechaDe && acoes.formarMecha) {
    for (let i = 0; i < marionetesAtivas.length; i++) {
      for (let j = i + 1; j < marionetesAtivas.length; j++) {
        if (mechaDe(marionetesAtivas[i].id, marionetesAtivas[j].id).permitido) paresDeMecha.push([marionetesAtivas[i], marionetesAtivas[j]]);
      }
    }
  }
  /* POSSUÍDAS, DISPONÍVEIS E ATIVAS (2026-09-30): possuída é a que não se perdeu
     de vez, disponível é a que pode entrar em campo agora, e ativa é o "Em Campo". */
  const possuidas = invocacoes.filter((i) => !estadoDe(i.id).terminal).length;
  const disponiveis = invocacoes.filter((i) => {
    const e = estadoDe(i.id);
    return !e.terminal && !e.bloqueadaAteFimDaCena && !e.emComposto && ["fora", "guardada", "dissipada"].includes(e.estado);
  }).length;

  if (!invocacoes.length && !hordas.length && !quimeras.length) {
    return (
      <section className="afty-card p-3">
        <p className="afty-vazio">Nenhuma Invocação</p>
      </section>
    );
  }

  return (
    <div className="space-y-3" ref={raiz}>
      {cssDosShikigamis && <style>{cssDosShikigamis}</style>}

      {/* ---------- roster do Controlador ---------- */}
      {/* Números de COMBATE: sem eles a mesa decide de cabeça quantas invocações
          pode manter. O "Em Campo" é o único que conta o que está ligado AGORA,
          e por isso ele fica em primeiro e fica vermelho ao estourar. */}
      {(controle?.ativo || marcadores.length > 0) && (
        <section className="afty-card p-3 flex items-center gap-1.5 flex-wrap">
          {controle?.ativo && (
            <>
              <span
                className="afty-chip"
                data-afty-tom={emCampo > controle.limiteCampo ? "aviso" : "destaque"}
                title="Invocações em campo agora, e o limite"
              >
                {emCampo > controle.limiteCampo && (
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                )}
                Em Campo {emCampo} / {controle.limiteCampo}
              </span>
              <span className="afty-chip" title="Invocações que a ação Invocar traz">
                Por Invocar {controle.invocarPorAcao}
              </span>
              {/* Os comandos separados (2026-09-30): a Ação Comum comanda Complexas e
                  a Bônus, Simples. */}
              <span className="afty-chip" title="Ações Complexas por Ação Comum">
                Complexas {controle.comandosComplexas ?? controle.comandos}
              </span>
              <span className="afty-chip" title="Ações Simples por Ação Bônus">
                Simples {controle.comandosSimples ?? controle.comandos}
              </span>
              {controle.criarHorda && (
                <span
                  className="afty-chip"
                  data-afty-tom={nHordasEmCampo > controle.limiteHordas ? "aviso" : undefined}
                  title="Hordas em campo agora, e o limite"
                >
                  {nHordasEmCampo > controle.limiteHordas && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
                  Hordas {nHordasEmCampo} / {controle.limiteHordas}
                </span>
              )}
              {paresDeMecha.map(([a, b]) => (
                <button key={`${a.id}|${b.id}`} type="button" className="afty-chip" onClick={() => acoes.formarMecha(a.id, b.id)} title="Ação Bônus">
                  Formar Mecha: {a.nome || "Marionete"} e {b.nome || "Marionete"}
                </button>
              ))}
              {controle.hordasPorAcao > 1 && (
                <span className="afty-chip" title="Hordas por Criar Horda">Por Criar Horda {controle.hordasPorAcao}</span>
              )}
              <span className="afty-chip" title="Invocações que não estão perdidas">Possuídas {possuidas}</span>
              <span className="afty-chip" title="Invocações que podem entrar em campo agora">Disponíveis {disponiveis}</span>
              {/* A Reserva para Invocação (E-01): uma vez por descanso. */}
              {controle.reserva && acoes.reserva && reserva && (
                reserva.modo ? (
                  <span className="afty-chip" data-afty-tom="destaque" title="As próximas entradas usam a Reserva">
                    Reserva {reserva.modo === "metade" ? "pela Metade" : "Sem Custo"} {reserva.restantes}
                  </span>
                ) : !reserva.usada ? (
                  <>
                    <button type="button" className="afty-chip" onClick={() => acoes.reserva("metade")} title="Reserva para Invocação">
                      Reserva: Duas pela Metade
                    </button>
                    <button type="button" className="afty-chip" onClick={() => acoes.reserva("gratis")} title="Reserva para Invocação">
                      Reserva: Uma Sem Custo
                    </button>
                  </>
                ) : (
                  <span className="afty-chip" title="Volta com o descanso">Reserva Usada</span>
                )
              )}
              {controle.invocarAcaoLivre && (
                <span className="afty-chip" data-afty-tom="destaque">Invocar como Ação Livre</span>
              )}
            </>
          )}
          {marcadores.map((m) => (
            <span
              key={m.id}
              className="afty-chip"
              data-afty-tom={m.excedeu ? "aviso" : undefined}
              title="Invocações marcadas contra o limite"
            >
              {m.excedeu && <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {m.label} {m.marcadas} / {m.limite}
            </span>
          ))}
        </section>
      )}

      {/* ---------- a fileira ---------- */}
      {fileira.length > 0 && (
        <div className="afty-inv-fileira">
          {fileira.map((inv) => (
            <CartaoDoRoster
              key={inv.id}
              inv={inv}
              fusao={fusaoDe.get(inv.id) ?? null}
              estado={estadoDe(inv.id)}
              entrada={entradaDe ? entradaDe(inv) : null}
              acoes={acoes}
              selecionado={selecionado?.id === inv.id}
              aoSelecionar={() => selecionar(inv.id)}
            />
          ))}
        </div>
      )}

      {/* ---------- a ficha do selecionado ---------- */}
      {/* A Quimera fica sem o botão de aparência: o tema mora dentro de
          `creature.invocacoes`, e ela não está lá. */}
      {selecionado && (
        <FichaDoShikigami
          key={selecionado.id}
          inv={selecionado}
          fusao={fusaoDe.get(selecionado.id) ?? null}
          estado={estadoDe(selecionado.id)}
          rolar={rolar}
          acoes={acoes}
          herdeiras={invocacoes.filter((i) => i.familia === "shikigami" && i.id !== selecionado.id && !estadoDe(i.id).terminal)}
          herancaJaCriada={invocacoes.some((i) => (i.herancas ?? []).some((h) => h.origemId === selecionado.id))}
          aoTemar={aoTemar && !fusaoDe.has(selecionado.id) ? () => aoTemar(selecionado.id) : null}
        />
      )}

      {hordas.length > 0 && (
        <section className="afty-card p-3">
          <h2 className="afty-card-titulo mb-2">Hordas</h2>
          <div className="space-y-2">
            {hordas.map((h) => {
              const mesa = entradaDeMesaDaHorda(h);
              const ent = mesa && entradaDe ? entradaDe(mesa) : null;
              return (
                <Horda
                  key={h.id}
                  h={h}
                  rolar={rolar}
                  estado={estadoDe(h.mesaId)}
                  entrada={ent ? { ...ent, emCombate } : null}
                  acoes={acoes}
                />
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
