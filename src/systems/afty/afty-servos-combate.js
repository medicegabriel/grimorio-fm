import { dadosDoServo } from "./afty-servos";
import { comFormulasDeDano, gruposDaLinha } from "./afty-dano";

export function danoDoServo(linha, servo, { nivel, combate = {}, adicionais = true, ataque = true } = {}) {
  if (!servo) return linha;
  const grupos = gruposDaLinha(linha).filter((g) => !g.servoAdicional);
  const faces = Number(String(linha.dado ?? linha.faces ?? grupos[0]?.faces ?? 0).replace(/^d/i, ""));
  const extras = dadosDoServo({ bt: servo.bt, nivel: nivel === "max" ? 5 : nivel, faces,
    manaburst: ataque && adicionais && combate?.ativo ? combate["servos-da-guerra:manaburst"] : 0,
    escalonamento: adicionais && combate?.ativo ? combate["servos-da-guerra:escalonamento"] : 0 });
  return comFormulasDeDano({ ...linha, custoServo: extras.custo,
    gruposDano: [...grupos, ...extras.grupos.map((g) => ({ ...g, servoAdicional: true }))].map((g) => ({ ...g,
      multiplicadorFinal: servo.multiplicadorDano,
      multiplicadorCritico: servo.multiplicadorCritico,
    })),
  });
}
