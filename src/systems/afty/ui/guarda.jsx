import React from "react";
import { Shield, ShieldOff, Zap } from "lucide-react";
import { NumeroComFontes } from "./fontes";

/**
 * ============================================================
 * GUARDA INABALÁVEL — a tira de controle do Calamidade e do Beyond
 * ============================================================
 * "Inimigos poderosos precisam ser enfraquecidos para realmente sofrerem danos
 * significativos." A criatura recebe, no início de cada rodada, um bônus de CA e
 * de TR (+5 no Calamidade, +10 no Beyond) e uma casca de PV Temporário
 * (5 × ND e 10 × ND). O bônus cai 2 a cada ataque ou habilidade sofrida, e a
 * Guarda inteira se encerra de quatro jeitos: o bônus chegando a zero pelos
 * golpes (3 no Calamidade, 5 no Beyond), um Raio Negro, uma das oito condições,
 * ou a casca acabando no dano. Os quatro levam a casca junto.
 *
 * ⚠ NASCE COMPARTILHADO, e não numa cópia por tela. A Ficha e o painel de
 * Encontros mexem na MESMA sessão, então uma errata aplicada só de um lado faria
 * o mestre e o jogador contarem golpes diferentes na mesma criatura. Foi
 * exatamente o que aconteceu com o `Vital` antes de ele ser extraído para
 * `ui/vital.jsx`, em 2026-08-26.
 *
 * ⚠ A CASCA NÃO É DESENHADA AQUI. A Vida da Guarda vive no mesmo pote do PV
 * Temporário (autor, 2026-08-26), então quem a mostra é a barra de PV do
 * `Vital`, como qualquer outra casca. Aqui fica só o que é da Guarda: o bônus
 * corrente, quanto da casca ainda é dela, e os dois botões.
 * ============================================================
 */

/**
 * `guarda` é o `derived.guarda` já resolvido: { ativa, noAr, bonus, bonusMax,
 * vida, vidaMax, golpes, motivo }. Quem não tem Guarda não renderiza nada.
 *
 * `partes` é o `derived.partes.guardaAtual`, para o hover de fontes explicar de
 * onde o número saiu (teto da rodada menos o desgaste). Opcional: no painel de
 * Encontros a coluna é estreita, igual ao `partes` do `Vital`.
 */
export function Guarda({ guarda, partes = null, onGolpe, onDesfazGolpe, onRaioNegro }) {
  if (!guarda?.ativa) return null;

  return (
    <div className="afty-guarda" data-afty-guarda={guarda.noAr ? "no-ar" : "quebrada"}>
      {guarda.noAr
        ? <Shield className="afty-guarda-icone" aria-hidden="true" />
        : <ShieldOff className="afty-guarda-icone" aria-hidden="true" />}
      <span className="afty-guarda-rotulo">Guarda</span>

      {/* O bônus corrente de CA e TR. Ele JÁ ESTÁ somado na Defesa e nos cinco
          TRs do cabeçalho: isto aqui é o painel de controle dele, e não uma
          segunda conta que o jogador tenha de somar de cabeça. */}
      <NumeroComFontes
        valor={guarda.bonus}
        partes={partes}
        total={guarda.bonus}
        formatar
        className="afty-guarda-valor"
        titulo="Bônus de CA e Testes de Resistência"
      />

      {/* Quanto da casca ainda é da Guarda. O `title` diz o teto, porque o
          número sozinho não conta quanto falta para quebrar. */}
      <span
        className="afty-guarda-vida"
        title={`Vida Temporária da Guarda, de ${guarda.vidaMax}`}
      >
        {guarda.vida} / {guarda.vidaMax}
      </span>

      {/* ⚠ MARCA DE ESTADO, e não chip de aviso. Era um `afty-chip` de tom
          "aviso" e o autor apontou em 2026-08-26 que ficava berrante: âmbar,
          pílula e borda, tudo isso ao lado dos vitais. Quebrada não é erro do
          jogador, é o que a luta produziu, e o roxo do sistema já diz isso sem
          gritar. A tira inteira já esmaece pelo `data-afty-guarda`, então aqui
          basta a palavra. O motivo vai no `title`. */}
      {!guarda.noAr && (
        <span className="afty-guarda-quebrada" title={guarda.motivo}>
          Quebrada
        </span>
      )}

      {/* ⚠ CONTROLES DISCRETOS, e não os `afty-botao` cheios: o autor apontou em
          2026-08-26 que eles ficavam grandes e destacados demais. A tira mora no
          cabeçalho, ao lado dos vitais, e um botão de peso ali disputa a atenção
          com o PV, que é o que se olha primeiro. Aqui eles são do tamanho do
          `afty-passo`, sem preenchimento e sem peso de fonte. */}
      <span className="afty-guarda-controles">
        <button
          type="button"
          className="afty-guarda-botao"
          onClick={onDesfazGolpe}
          /* ⚠ Some com a Guarda quebrada, e não por arrumação: a casca já foi
             perdida e desfazer não a devolve, então o botão não teria o que
             fazer. Ver `desfazGolpeNaGuarda`. */
          disabled={!guarda.golpes || !guarda.noAr}
          title="Desfaz um golpe contado a mais"
          aria-label="Desfazer um golpe sofrido"
        >
          −
        </button>
        <button
          type="button"
          className="afty-guarda-botao"
          onClick={onGolpe}
          disabled={!guarda.noAr}
          title="Ataque ou habilidade sofrida: o bônus cai 2, tenha atingido ou não"
          aria-label="Contar um golpe sofrido"
        >
          Golpe{guarda.golpes > 0 && <span className="afty-guarda-contador">{guarda.golpes}</span>}
        </button>
        <button
          type="button"
          className="afty-guarda-botao"
          onClick={onRaioNegro}
          disabled={!guarda.noAr}
          title="Raio Negro: encerra a Guarda e a casca dela até a próxima rodada"
          aria-label="Raio Negro"
        >
          <Zap className="afty-guarda-botao-icone" aria-hidden="true" />
          Raio Negro
        </button>
      </span>
    </div>
  );
}
