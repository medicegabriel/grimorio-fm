import { criarDominioInato, diaDeConcentracao, usarMovimentoDoServo } from "./ficha-servos";
import { peTempTotal } from "./ficha-sessao";
import { estadoDominioInato } from "../afty-dominio-inato";
import { NumeroComFontes } from "../ui/fontes";

export default function PainelServos({ derived, sessao, onSessao }) {
  const servo = derived.servosGuerra;
  if (!servo) return null;
  const d = derived.dominioInato;
  const estado = estadoDominioInato(sessao.dominioInato);
  const movimentos = Math.max(0, servo.acoesMovimento - (sessao.servosMovimentosUsados ?? 0));
  const classe = "px-2 py-1 rounded border border-slate-700 text-xs";
  return <div className="space-y-2 border border-slate-700 rounded p-3">
    <div>Servo: {servo.classe || "Escolher Classe"}</div>
    {servo.acoesMovimento > 0 && <button type="button" className={classe} disabled={!movimentos || !sessao.combate?.ativo}
      onClick={() => onSessao((s) => usarMovimentoDoServo(s, derived))}>Ação de Movimento Adicional ({movimentos}/{servo.acoesMovimento})</button>}
    {d && <>
      <div>{d.nome}{d.local ? ` · ${d.local}` : ""}</div>
      <div>Raio: {estado.criado ? d.raio : 0} m / <NumeroComFontes valor={`${d.maximo} m`} partes={d.partesMaximo} total={d.maximo} /> </div>
      {!estado.criado ? <button type="button" className={classe} disabled={!d.valido || (sessao.peAtual ?? 0) + peTempTotal(sessao) < d.custoPE}
        onClick={() => onSessao((s) => criarDominioInato(s, derived))}>Criar Domínio Inato, {d.custoPE} PE</button>
        : <div className="flex flex-wrap gap-2">
          <button type="button" className={classe} aria-pressed={estado.dentro}
            onClick={() => onSessao((s) => ({ ...s, dominioInato: { ...estadoDominioInato(s.dominioInato), dentro: !estadoDominioInato(s.dominioInato).dentro } }))}>{estado.dentro ? "Dentro" : "Fora"}</button>
          <button type="button" className={classe} onClick={() => onSessao((s) => diaDeConcentracao(s, derived))}>Concluir Dia de Concentração</button>
          <span>Dias: {estado.dias}</span>
        </div>}
    </>}
  </div>;
}
