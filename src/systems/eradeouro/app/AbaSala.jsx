/* A aba Sala da Guilda no celular (etapa E8, 2026-11-20): o mesmo campo do botão Sala do cabeçalho (código ou link colado), numa
   página da barra de baixo. */
import React from "react";
import { DoorOpen } from "lucide-react";
import { FormularioDeCodigo } from "../../../nuvem/sala-ui/EntrarPorCodigo";

export default function AbaSala() {
  return (
    <main className="fm-pagina">
      <header className="fm-pagina-topo"><h1 className="fm-pagina-titulo"><DoorOpen aria-hidden="true" />Entrar numa Sala</h1></header>
      <section className="fm-bloco">
        <FormularioDeCodigo grande />
      </section>
    </main>
  );
}
