import { useState } from "react";
import { Lock, Unlock, Eye, AlertTriangle } from "lucide-react";

import {
  trancar, abrir, destrancarDeVez, comTextoAberto,
  cofreTrancado, resumoDoCofre, avaliaSenha, textoLongoRestante,
  guardarAberto, esquecerAberto,
} from "../afty-cofre";

/**
 * ============================================================
 * PAINEL DO COFRE — trancar e destrancar o texto protegido
 * ============================================================
 * A tela do `afty-cofre.js`. Ela existe porque a criptografia é ASSÍNCRONA e o
 * `deriveAfty` é síncrono: cifrar e decifrar acontecem aqui, na borda, e o
 * motor só recebe uma ficha normal, com o texto ou com o marcador.
 *
 * ⚠ SÃO DOIS MODOS, e a diferença não é enfeite:
 *
 *   • `criador`  destrancar é DE VEZ. O criador serve para editar, e não dá
 *     para editar o que não se vê. O cofre sai da ficha e o texto volta.
 *     ⚠ Espiar sem tirar o cofre seria uma armadilha aqui: o criador tem
 *     autosave (ver `afty-rascunho.js`), e o texto revelado acabaria gravado em
 *     claro no `localStorage`, que é o que o Cofre existe para impedir.
 *
 *   • `ficha`    destrancar é SÓ PARA LER, e dura enquanto a aba viver. O
 *     conteúdo fica na memória de módulo do `afty-cofre.js`, nunca na criatura,
 *     e recarregar a página tranca de novo. É o mesmo estatuto da Concessão do
 *     mestre e dos buffs temporários.
 *
 * ⚠ O AVISO DE LIMITE FICA NA TELA, e não só no doc. Isto protege o TEXTO e não
 * a ficha: quem receber o arquivo pode atacar a senha offline, no ritmo que
 * quiser. Esconder essa frase daria uma sensação de segurança que o mecanismo
 * não sustenta.
 * ============================================================
 */

function Aviso({ children }) {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-amber-300/90">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const TOM_SENHA = {
  vazia: "text-slate-500",
  fraca: "text-rose-300",
  media: "text-amber-300",
  boa: "text-emerald-300",
};

export default function PainelDoCofre({ creature, modo = "ficha", onFicha, onAberto }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [revelado, setRevelado] = useState(false);

  const trancado = cofreTrancado(creature);
  const resumo = resumoDoCofre(creature);
  const forca = avaliaSenha(senha);
  const noCriador = modo === "criador";
  /* Depois de trancar, o vigia diz se sobrou texto longo em claro no catálogo
     de algum addon. Em ficha aberta ele acharia tudo, então só vale trancado. */
  const sobrou = trancado ? textoLongoRestante(creature) : [];

  const comOcupado = async (fn) => {
    setOcupado(true);
    setErro(null);
    try {
      await fn();
      setSenha("");
    } catch (e) {
      setErro(e?.message || "Não deu certo.");
    } finally {
      setOcupado(false);
    }
  };

  const aoTrancar = () => comOcupado(async () => {
    const nova = await trancar(creature, senha);
    onFicha?.(nova);
    setRevelado(false);
  });

  const aoDestrancarDeVez = () => comOcupado(async () => {
    const nova = await destrancarDeVez(creature, senha);
    esquecerAberto(creature?.id);
    onFicha?.(nova);
  });

  const aoRevelar = () => comOcupado(async () => {
    const conteudo = await abrir(creature, senha);
    guardarAberto(creature?.id, conteudo);
    setRevelado(true);
    onAberto?.(comTextoAberto(creature, conteudo));
  });

  const aoEsconder = () => {
    esquecerAberto(creature?.id);
    setRevelado(false);
    setErro(null);
    onAberto?.(null);
  };

  /* ---------- Cofre aberto: o convite para trancar ---------- */
  if (!trancado) {
    if (!noCriador) {
      return (
        <p className="text-[11px] text-slate-400">
          Esta ficha não tem Cofre. Para trancar o texto, abra o criador e vá na aba Addons.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-slate-400">
          Trancar tira o texto dos Feitiços e dos Funcionamentos Básicos da ficha e guarda um
          bloco cifrado no lugar. Os números continuam à vista. A ficha exportada deixa de conter
          o texto.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            className="afty-campo afty-linha px-2 py-1.5 flex-1 min-w-[12rem]"
            placeholder="Senha do Cofre"
            value={senha}
            autoComplete="new-password"
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            type="button"
            className="afty-botao px-2.5 py-1.5 inline-flex items-center gap-1.5"
            onClick={aoTrancar}
            disabled={ocupado || senha.length < 1}
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            {ocupado ? "Trancando" : "Trancar"}
          </button>
        </div>
        <p className={`text-[11px] ${TOM_SENHA[forca.nivel]}`}>{forca.texto}</p>
        <Aviso>
          Guarde a senha em outro lugar. Sem ela o texto não volta, nem por mim nem por ninguém.
        </Aviso>
        <Aviso>
          Isto protege o TEXTO, não a ficha. Quem receber o arquivo pode tentar a senha offline
          quantas vezes quiser, então prefira uma frase longa a uma palavra.
        </Aviso>
        <Aviso>
          Os NOMES continuam à vista de propósito. O que vai para o Cofre é o texto: descrição de
          Feitiço, de Funcionamento, de Talento, de Habilidade, o lore da Origem e o texto das
          entradas que os addons desta ficha trazem.
        </Aviso>
        {erro && <p className="text-[11px] text-rose-300">{erro}</p>}
      </div>
    );
  }

  /* ---------- Cofre trancado ---------- */
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
        <Lock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
        <span className="font-semibold">Trancado</span>
        <span className="text-slate-500">
          {[
            resumo.feiticos && `${resumo.feiticos} ${resumo.feiticos === 1 ? "Feitiço" : "Feitiços"}`,
            resumo.funcionamentos && `${resumo.funcionamentos} ${resumo.funcionamentos === 1 ? "Funcionamento" : "Funcionamentos"}`,
            resumo.catalogo && `${resumo.catalogo} ${resumo.catalogo === 1 ? "entrada de addon" : "entradas de addon"}`,
          ].filter(Boolean).join(" · ") || "nada"}
        </span>
      </div>

      {/* ⚠ O VIGIA. A lista de chaves de texto é fechada, então uma família nova
          de addon pode trazer um campo com outro nome e vazar calada. Aqui ele
          aparece em vez de passar. */}
      {sobrou.length > 0 && (
        <Aviso>
          Sobrou texto longo em claro no catálogo de um addon, em
          {" "}{sobrou.slice(0, 3).map((x) => x.caminho).join(", ")}
          {sobrou.length > 3 ? ` e mais ${sobrou.length - 3}` : ""}.
          {" "}Isso quer dizer um campo de texto que o Cofre ainda não conhece.
        </Aviso>
      )}

      {revelado ? (
        <div className="space-y-2">
          <p className="text-[11px] text-emerald-300">
            Texto aberto nesta aba. Recarregar a página tranca de novo, e nada disso é gravado.
          </p>
          <button
            type="button"
            className="afty-botao px-2.5 py-1.5 inline-flex items-center gap-1.5"
            onClick={aoEsconder}
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Esconder de novo
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              className="afty-campo afty-linha px-2 py-1.5 flex-1 min-w-[12rem]"
              placeholder="Senha do Cofre"
              value={senha}
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || ocupado || senha.length < 1) return;
                e.preventDefault();
                if (noCriador) aoDestrancarDeVez(); else aoRevelar();
              }}
            />
            <button
              type="button"
              className="afty-botao px-2.5 py-1.5 inline-flex items-center gap-1.5"
              onClick={noCriador ? aoDestrancarDeVez : aoRevelar}
              disabled={ocupado || senha.length < 1}
            >
              {noCriador
                ? <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
              {ocupado ? "Abrindo" : (noCriador ? "Destrancar" : "Ver o texto")}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            {noCriador
              ? "Destrancar devolve o texto para a ficha e tira o Cofre, para você voltar a editar. Tranque de novo antes de mandar a ficha para alguém."
              : "Ver abre o texto só nesta aba. A ficha continua trancada e nada é gravado."}
          </p>
        </>
      )}
      {erro && <p className="text-[11px] text-rose-300">{erro}</p>}
    </div>
  );
}
