import React, { useId, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { DicaDeTexto, NumeroComFontes } from "./fontes";
import "./espinho.css";

/**
 * ============================================================
 * O CARD DO ESPINHO (Addon, 2026-09-30)
 * ============================================================
 * Um componente só para as duas telas. No criador (`compacto` falso) ele mostra
 * a lista inteira, com os botões de comprar e devolver e o bloco de
 * Equipamentos. Na Ficha Final (`compacto`) ele mostra o cristal, as Almas
 * Totais, o que já foi comprado e o Outros, que continuam editáveis na sessão.
 * Sem `onPatch` ele é só leitura (o combatente do Encontro).
 *
 * ⚠ O QUE SE EDITA SAI DO `estado`, E O QUE SE CALCULA SAI DO `extrato`. É a
 * regra da Loja de Catarse: o `estado` é a ficha crua (o rascunho no criador, a
 * cópia viva na Ficha), e o `extrato` é o `derived.espinho`. As Almas Gastas são
 * a exceção de propósito: na Ficha o Outros muda na hora e grava com atraso, e o
 * derive ainda não o viu. Por isso a conta é `compras do extrato + Outros do
 * estado`, e o aviso de Almas excedidas nasce aqui, e não no resolver.
 *
 * ⚠ O HOVER É O FLUTUANTE (`NumeroComFontes`, `DicaDeTexto`), e não o painel
 * preso ao pai: a casca do card tem `overflow: hidden` para recortar o brilho, e
 * cortaria um painel ancorado dentro dela.
 * ============================================================
 */

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const soDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

const TIPO_ROTULO = { arma: "Arma", escudo: "Escudo", uniforme: "Uniforme" };

/**
 * Número inteiro digitado. `type="text"` com parser, e não `type="number"`: o
 * número devolve string vazia no meio da digitação e o valor some (memória da
 * Carteira). O texto local segura o que se digita até o campo perder o foco.
 */
function CampoInteiro({ valor, onMudar, rotulo, className = "", desabilitado = false }) {
  const [texto, setTexto] = useState(null);
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={rotulo}
      className={`afty-espinho-input ${className}`}
      value={texto ?? String(valor)}
      disabled={desabilitado}
      onChange={(e) => {
        const limpo = soDigitos(e.target.value);
        setTexto(limpo);
        onMudar(inteiro(limpo));
      }}
      onBlur={() => setTexto(null)}
    />
  );
}

/** As rachaduras e o rasgo. Fixos, e por isso não recebem nada. */
function Rasgos() {
  // Ids únicos por card: o Encontro desenha vários, e dois gradientes com o
  // mesmo id fariam o segundo pintar com o do primeiro.
  const id = useId().replace(/:/g, "");
  return (
    <>
      <svg className="afty-espinho-rachadura afty-espinho-rachadura--no" viewBox="0 0 210 88" aria-hidden="true"><g>
        <path className="aura" d="M-6 16 L20 24 L38 19 L55 34 L80 37 L96 54 L122 57 L142 74 L162 78 L184 92" />
        <path className="veio" d="M-6 16 L20 24 L38 19 L55 34 L80 37 L96 54 L122 57 L142 74 L162 78 L184 92" />
        <path className="alma-do-veio" d="M-6 16 L20 24 L38 19 L55 34 L80 37 L96 54" />
        <path className="ramo" d="M55 34 L63 11 L75 -7" /><path className="ramo" d="M96 54 L90 76" />
        <path className="ramo" d="M20 24 L9 44 L-7 50" /><path className="ramo" d="M122 57 L140 44 L166 46" />
      </g></svg>
      <svg className="afty-espinho-rachadura afty-espinho-rachadura--ne" viewBox="0 0 120 64" aria-hidden="true"><g>
        <path className="aura" d="M127 20 L104 24 L94 12 L74 16 L64 4 L50 6 L42 -7" />
        <path className="veio" d="M127 20 L104 24 L94 12 L74 16 L64 4 L50 6 L42 -7" />
        <path className="alma-do-veio" d="M127 20 L104 24 L94 12 L74 16" />
        <path className="ramo" d="M104 24 L98 44 L84 52" />
      </g></svg>
      <svg className="afty-espinho-rachadura afty-espinho-rachadura--so" viewBox="0 0 120 46" aria-hidden="true"><g>
        <path className="aura" d="M22 54 L32 38 L50 34 L60 20 L78 18 L88 6 L104 4" />
        <path className="veio" d="M22 54 L32 38 L50 34 L60 20 L78 18 L88 6 L104 4" />
        <path className="alma-do-veio" d="M22 54 L32 38 L50 34 L60 20" />
        <path className="ramo" d="M50 34 L68 40 L80 50" />
      </g></svg>
      <svg className="afty-espinho-rachadura afty-espinho-rachadura--se" viewBox="0 0 150 58" aria-hidden="true"><g>
        <path className="aura" d="M158 26 L136 30 L126 44 L104 46 L94 60" />
        <path className="aura" d="M136 30 L128 14 L106 12 L96 -2" />
        <path className="veio" d="M158 26 L136 30 L126 44 L104 46 L94 60" />
        <path className="veio" d="M136 30 L128 14 L106 12 L96 -2" />
        <path className="alma-do-veio" d="M158 26 L136 30 L126 44" />
        <path className="ramo" d="M106 12 L84 18 L70 10" />
      </g></svg>
      <svg className="afty-espinho-rasgo" viewBox="0 0 32 150" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-luz`} x1="0" x2="1">
            <stop offset="0" stopColor="#3a0009" /><stop offset=".4" stopColor="#ff3344" />
            <stop offset=".5" stopColor="#fff0f0" /><stop offset=".6" stopColor="#ff3344" />
            <stop offset="1" stopColor="#3a0009" />
          </linearGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="#ff1a2e" stopOpacity=".75" />
            <stop offset="1" stopColor="#ff1a2e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="luz">
          <ellipse cx="18" cy="75" rx="22" ry="80" fill={`url(#${id}-halo)`} />
          <polygon points="18,0 24,14 17,28 27,44 16,60 29,76 15,94 25,110 16,128 19,150 13,128 6,110 13,94 2,76 12,60 4,44 12,28 10,14" fill="#060001" />
          <polygon points="18,6 21,14 15,28 23,44 14,60 25,76 14,94 21,110 15,128 17,144 14,128 9,110 15,94 6,76 14,60 8,44 14,28 13,14" fill={`url(#${id}-luz)`} />
          <polyline points="18,0 24,14 17,28 27,44 16,60 29,76 15,94 25,110 16,128 19,150" fill="none" stroke="#ff8a95" strokeWidth=".9" />
          <polyline points="18,0 10,14 12,28 4,44 12,60 2,76 13,94 6,110 13,128 19,150" fill="none" stroke="#ff8a95" strokeWidth=".9" />
        </g>
      </svg>
    </>
  );
}

/** O cristal com as Almas Restantes, e o hover da conta. */
function Cristal({ restantes, almas, gastas }) {
  return (
    <div className="afty-espinho-pedra">
      <div className="afty-espinho-cristal-caixa">
        <div className="afty-espinho-cristal" aria-hidden="true">
          <i className="f1" /><i className="f2" /><i className="f3" /><i className="f4" /><i className="alma" /><i className="brilho" />
        </div>
        <div className="afty-espinho-cristal-num">
          <NumeroComFontes
            valor={restantes}
            formatar={false}
            ancora="direita"
            className="afty-espinho-num"
            partes={[{ label: "Almas Totais", valor: almas }, { label: "Gastas", valor: -gastas }]}
            total={restantes}
          />
        </div>
      </div>
      <span className="afty-espinho-rotulo">Almas Restantes</span>
    </div>
  );
}

/** Nome do item com a descrição do pacote no hover. */
function NomeComDica({ item }) {
  return (
    <DicaDeTexto titulo={item.nome} texto={item.descricao}>
      <span className="afty-espinho-nome" tabIndex={item.descricao ? 0 : undefined}>{item.nome}</span>
    </DicaDeTexto>
  );
}

function Passo({ rotulo, qtd, podeMenos, podeMais, onMenos, onMais, edita, children }) {
  return (
    <span className="afty-espinho-passo">
      {edita && (
        <button type="button" disabled={!podeMenos} onClick={onMenos} aria-label={`Devolver ${rotulo}`}>−</button>
      )}
      {children ?? <span className="afty-espinho-qtd">{qtd}</span>}
      {edita && (
        <button type="button" disabled={!podeMais} onClick={onMais} aria-label={`Comprar ${rotulo}`}>+</button>
      )}
    </span>
  );
}

export default function EspinhoCard({ extrato, estado, onPatch = null, compacto = false }) {
  if (!extrato?.ativo) return null;
  const edita = typeof onPatch === "function";

  const almas = inteiro(estado?.almas);
  const outros = inteiro(estado?.outros);
  const compras = estado?.compras && typeof estado.compras === "object" ? estado.compras : {};
  const marcados = Array.isArray(estado?.equipamentos) ? estado.equipamentos : [];

  const gastasCompras = (extrato.almas?.gastas ?? 0) - (extrato.almas?.outros ?? 0);
  const gastas = gastasCompras + outros;
  const restantes = almas - gastas;

  const patch = (mudanca) => onPatch?.({ almas, outros, compras, equipamentos: marcados, ...mudanca });
  const mudaCompra = (id, qtd) => {
    const proximo = { ...compras };
    if (qtd > 0) proximo[id] = qtd; else delete proximo[id];
    patch({ compras: proximo });
  };

  const itens = extrato.itens ?? [];
  const compraveis = itens.filter((i) => i.tipo === "efeitos" || i.tipo === "talento");
  const itemEquip = itens.find((i) => i.tipo === "equipamento") ?? null;
  const itemAprimora = itens.find((i) => i.tipo === "aprimoramento") ?? null;
  const qtdDe = (item) => inteiro(compras[item.id]);

  const partesGastas = [
    ...itens.filter((i) => i.qtd > 0).map((i) => ({ label: `${i.nome} ×${i.qtd}`, valor: i.gasto })),
    ...(outros > 0 ? [{ label: "Outros", valor: outros }] : []),
  ];
  const avisos = [
    ...(gastas > almas ? [`Almas gastas: ${gastas} de ${almas} (excedeu).`] : []),
    ...(extrato.avisos ?? []),
  ];

  const faixaDasAlmas = (
    <div className="afty-espinho-almas">
      <label className="afty-espinho-campo">
        <span>Almas Totais</span>
        <CampoInteiro valor={almas} rotulo="Almas Totais" desabilitado={!edita} onMudar={(n) => patch({ almas: n })} />
      </label>
      <div className="afty-espinho-campo">
        <span>Gastas</span>
        <NumeroComFontes
          valor={gastas}
          formatar={false}
          className="afty-espinho-valor"
          partes={partesGastas}
          total={gastas}
        />
      </div>
    </div>
  );

  const listaDeAvisos = avisos.length > 0 && (
    <div className="afty-espinho-avisos">
      {avisos.map((a) => (
        <div key={a} className="afty-espinho-aviso"><AlertTriangle aria-hidden="true" /><span>{a}</span></div>
      ))}
    </div>
  );

  const linhaOutros = (
    <div className="afty-espinho-item" data-tem={outros > 0}>
      <DicaDeTexto titulo="Outros" texto="Só serve para contar gastos externos em RP.">
        <span className="afty-espinho-nome" tabIndex={0}>Outros</span>
      </DicaDeTexto>
      <span className="afty-espinho-custo"><i className="afty-espinho-alma-ico" /></span>
      <Passo
        rotulo="uma Alma em Outros"
        edita={edita}
        podeMenos={outros > 0}
        podeMais
        onMenos={() => patch({ outros: Math.max(0, outros - 1) })}
        onMais={() => patch({ outros: outros + 1 })}
      >
        <CampoInteiro
          valor={outros}
          rotulo="Almas em Outros"
          className="afty-espinho-input--qtd"
          desabilitado={!edita}
          onMudar={(n) => patch({ outros: n })}
        />
      </Passo>
    </div>
  );

  /* ---------------- a versão compacta, da Ficha Final ---------------- */
  if (compacto) {
    const comprados = compraveis.filter((i) => i.qtd > 0);
    return (
      <section className="afty-espinho afty-espinho--compacto" data-afty-painel="espinho" aria-label="Espinho">
        <div className="afty-espinho-halo" aria-hidden="true" />
        <div className="afty-espinho-casca">
          <div className="afty-espinho-grao" aria-hidden="true" />
          <div className="afty-espinho-conteudo">
            <div className="afty-espinho-topo">
              <div className="afty-espinho-titulo-bloco">
                <h2 className="afty-espinho-titulo" data-texto="Espinho">Espinho</h2>
              </div>
              <Cristal restantes={restantes} almas={almas} gastas={gastas} />
            </div>
            {faixaDasAlmas}
            <div className="afty-espinho-fenda" />
            <div className="afty-espinho-comprado">
              {comprados.map((i) => (
                <DicaDeTexto key={i.id} titulo={i.nome} texto={i.descricao}>
                  <span className="afty-espinho-marca" tabIndex={0}>{i.nome} <b>×{i.qtd}</b></span>
                </DicaDeTexto>
              ))}
              {(extrato.equipamentos ?? []).filter((e) => !e.morto).map((e) => (
                <span key={e.uid} className="afty-espinho-marca">
                  {e.nome}{e.aprimorado && <b>Aprimorado</b>}
                </span>
              ))}
              <span className="afty-espinho-marca">
                Outros
                {edita && (
                  <button type="button" className="afty-espinho-mini" disabled={outros <= 0}
                    onClick={() => patch({ outros: Math.max(0, outros - 1) })} aria-label="Devolver uma Alma de Outros">−</button>
                )}
                <b>{outros}</b>
                {edita && (
                  <button type="button" className="afty-espinho-mini"
                    onClick={() => patch({ outros: outros + 1 })} aria-label="Gastar uma Alma em Outros">+</button>
                )}
              </span>
            </div>
            {listaDeAvisos}
          </div>
        </div>
        <Rasgos />
      </section>
    );
  }

  /* ---------------- a versão completa, do criador ---------------- */
  const grupos = [...new Set(compraveis.map((i) => i.grupo))].sort((a, b) => a - b);
  const ultimoGrupo = grupos.at(-1);
  const porUid = new Map((extrato.equipamentos ?? []).map((e) => [e.uid, e]));
  const livres = (extrato.inventario ?? []).filter((x) => !marcados.some((m) => m.uid === x.uid));
  const marcar = (uid) => {
    if (!uid) return;
    patch({ equipamentos: [...marcados, { uid, aprimorado: false }] });
  };
  const alternaAprimorado = (uid) =>
    patch({ equipamentos: marcados.map((m) => (m.uid === uid ? { ...m, aprimorado: !m.aprimorado } : m)) });
  const desmarcar = (uid) => patch({ equipamentos: marcados.filter((m) => m.uid !== uid) });

  return (
    <section className="afty-espinho" data-afty-painel="espinho" aria-label="Espinho">
      <div className="afty-espinho-halo" aria-hidden="true" />
      <div className="afty-espinho-casca">
        <div className="afty-espinho-grao" aria-hidden="true" />
        <div className="afty-espinho-conteudo">
          <div className="afty-espinho-topo">
            <div className="afty-espinho-titulo-bloco">
              <h2 className="afty-espinho-titulo" data-texto="Espinho">Espinho</h2>
            </div>
            <Cristal restantes={restantes} almas={almas} gastas={gastas} />
          </div>
          {faixaDasAlmas}

          {grupos.map((g) => (
            <React.Fragment key={g}>
              <div className="afty-espinho-fenda" />
              <div className="afty-espinho-lista">
                {compraveis.filter((i) => i.grupo === g).map((item) => {
                  const qtd = qtdDe(item);
                  const teto = item.teto;
                  const excedeu = teto != null && qtd > teto;
                  return (
                    <div key={item.id} className="afty-espinho-item" data-tem={qtd > 0}>
                      <NomeComDica item={item} />
                      <span className="afty-espinho-custo"><i className="afty-espinho-alma-ico" />{item.custo}</span>
                      <Passo
                        rotulo={item.nome}
                        edita={edita}
                        podeMenos={qtd > 0}
                        podeMais={teto == null || qtd < teto}
                        onMenos={() => mudaCompra(item.id, qtd - 1)}
                        onMais={() => mudaCompra(item.id, qtd + 1)}
                      >
                        <span className="afty-espinho-qtd" data-excedeu={excedeu}>
                          {qtd} <small>/ {teto == null ? "∞" : teto}</small>
                        </span>
                      </Passo>
                    </div>
                  );
                })}
                {g === ultimoGrupo && linhaOutros}
              </div>
            </React.Fragment>
          ))}
          {grupos.length === 0 && (
            <>
              <div className="afty-espinho-fenda" />
              <div className="afty-espinho-lista">{linhaOutros}</div>
            </>
          )}

          {(extrato.comprasMortas ?? []).length > 0 && (
            <div className="afty-espinho-lista">
              {extrato.comprasMortas.map((c) => (
                <div key={c.id} className="afty-espinho-item" data-morta="true">
                  <span className="afty-espinho-nome">{c.id}</span>
                  <span className="afty-espinho-qtd">×{c.qtd}</span>
                  {edita && (
                    <button type="button" className="afty-espinho-x" onClick={() => mudaCompra(c.id, 0)} aria-label={`Apagar ${c.id}`}>×</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {itemEquip && (
            <>
              <div className="afty-espinho-fenda" />
              <div className="afty-espinho-equip">
                <div className="afty-espinho-grupo-rotulo">Equipamentos</div>
                {marcados.map((m) => {
                  const e = porUid.get(m.uid);
                  const morto = !e || e.morto;
                  return (
                    <div key={m.uid} className="afty-espinho-equip-linha" data-morta={morto}>
                      <span>
                        <span className="afty-espinho-nome">{e?.nome ?? "Item Removido"}</span>
                        {!morto && (
                          <span className="afty-espinho-tipo">{TIPO_ROTULO[e.tipo] ?? e.tipo} · Grau Especial</span>
                        )}
                      </span>
                      {itemAprimora ? (
                        <button
                          type="button"
                          className="afty-espinho-chave"
                          aria-pressed={m.aprimorado === true}
                          disabled={!edita}
                          onClick={() => alternaAprimorado(m.uid)}
                        >
                          <i aria-hidden="true" />Aprimorado
                        </button>
                      ) : <span />}
                      {edita ? (
                        <button type="button" className="afty-espinho-x" onClick={() => desmarcar(m.uid)} aria-label={`Desmarcar ${e?.nome ?? m.uid}`}>×</button>
                      ) : <span />}
                    </div>
                  );
                })}
                <div className="afty-espinho-equip-rodape">
                  {edita ? (
                    <select
                      className="afty-espinho-select"
                      value=""
                      disabled={livres.length === 0}
                      onChange={(ev) => marcar(ev.target.value)}
                      aria-label="Marcar Item"
                    >
                      <option value="">Marcar Item</option>
                      {livres.map((x) => (
                        <option key={x.uid} value={x.uid}>{x.nome} ({TIPO_ROTULO[x.tipo] ?? x.tipo})</option>
                      ))}
                    </select>
                  ) : <span />}
                  <div className="afty-espinho-equip-custos">
                    <DicaDeTexto titulo={itemEquip.nome} texto={itemEquip.descricao}>
                      <span className="afty-espinho-custo" tabIndex={0}>{itemEquip.nome} <i className="afty-espinho-alma-ico" />{itemEquip.custo}</span>
                    </DicaDeTexto>
                    {itemAprimora && (
                      <DicaDeTexto titulo={itemAprimora.nome} texto={itemAprimora.descricao}>
                        <span className="afty-espinho-custo" tabIndex={0}>Aprimoramento <i className="afty-espinho-alma-ico" />{itemAprimora.custo}</span>
                      </DicaDeTexto>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {listaDeAvisos}
        </div>
      </div>
      <Rasgos />
    </section>
  );
}
