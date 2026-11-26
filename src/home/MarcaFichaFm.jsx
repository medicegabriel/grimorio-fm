import { BookOpen } from "lucide-react";
import "./marca-fichafm.css";

export default function MarcaFichaFm({ href = "/" }) {
  return (
    <a className="fichafm-marca" href={href} aria-label="fichafm.com.br, Início">
      <BookOpen className="fichafm-marca-icone" aria-hidden="true" />
      <span>fichafm<span className="fichafm-marca-dominio">.com.br</span><small>Feiticeiros &amp; Maldições</small></span>
    </a>
  );
}
