/* A tela de espera enquanto uma tela sob demanda chega (etapa E3). Sem animação de entrada (D-91): só o nome do que falta.
   Os tokens levam o valor do tema Padrão como reserva, porque ela aparece antes de qualquer `.afty-ficha` existir. */
export default function Carregando() {
  return (
    <div
      role="status"
      className="min-h-screen grid place-items-center text-sm"
      style={{ background: "var(--afty-fundo, #060910)", color: "var(--afty-texto-suave, #94a3b8)" }}
    >
      Carregando
    </div>
  );
}
