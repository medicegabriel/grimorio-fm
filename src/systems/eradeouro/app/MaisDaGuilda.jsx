/* ============================================================
   O MAIS DA GUILDA NO CELULAR (app Era de Ouro, etapa E8, 2026-11-20)
   ============================================================
   O que no computador mora no cabeçalho e nos menus da lista, num lugar só da barra de baixo: a Conta, Importar Fichas, Exportar
   Todas, os Livros (no leitor de PDF do site, sem sair do app), Instalar o App, o espaço que o site usa no aparelho, a
   Privacidade e a Versão.

   O Importar passa pelo `importMany` do App, então a porta do livro e o aviso de recusa continuam valendo. O Exportar usa o
   `exportCreaturesToFile` do Grimório, só importado.
   ============================================================ */
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BookOpen, Download, FileText, HardDrive, Info, Shield, Smartphone, Upload, UserCircle } from "lucide-react";
import { PDF_DOCS } from "../../../components/fm-docs";
import PdfViewerModal from "../../../components/PdfViewerModal";
import { exportCreaturesToFile, importFromFile } from "../../../components/io-utils";
import { nuvemAtiva } from "../../../nuvem/nuvem-config";
import { lerEstadoNuvem, ouvirNuvem } from "../../../nuvem/nuvem-sync";
import PainelDaConta from "../../../nuvem/PainelDaConta";
import { useInstalacao } from "../../../celular/usar-instalacao";
import { tamanhoLegivel } from "./lista-fichas";

function Secao({ icone: Icone, titulo, children }) {
  return (
    <section className="fm-bloco" aria-label={titulo}>
      <h2 className="fm-bloco-titulo"><Icone aria-hidden="true" />{titulo}</h2>
      {children}
    </section>
  );
}

function Conta() {
  const estado = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  return <div role="menu"><PainelDaConta estado={estado} aoFechar={() => {}} grande /></div>;
}

/* O tamanho de cada PDF, pelo cabeçalho da resposta, sem baixar o arquivo. */
function useTamanhos(docs) {
  const [tamanhos, setTamanhos] = useState({});
  useEffect(() => {
    let vivo = true;
    for (const d of docs) {
      fetch(encodeURI(d.file), { method: "HEAD" })
        .then((r) => (r.ok ? Number(r.headers.get("content-length")) : null))
        .then((n) => { if (vivo && n) setTamanhos((t) => ({ ...t, [d.id]: tamanhoLegivel(n) })); })
        .catch(() => {});
    }
    return () => { vivo = false; };
  }, [docs]);
  return tamanhos;
}

function useEspaco() {
  const [espaco, setEspaco] = useState(null);
  useEffect(() => {
    let vivo = true;
    navigator.storage?.estimate?.().then((e) => { if (vivo) setEspaco(e); }).catch(() => {});
    return () => { vivo = false; };
  }, []);
  return espaco;
}

export default function MaisDaGuilda({ fichas, pastas, importar }) {
  const arquivo = useRef(null);
  const [aviso, setAviso] = useState(null);
  const [doc, setDoc] = useState(null);
  const [minimizado, setMinimizado] = useState(false);
  const tamanhos = useTamanhos(PDF_DOCS);
  const espaco = useEspaco();
  const { temPedido, instalado, instalar } = useInstalacao();
  const proprias = fichas.filter((f) => !f.isBuiltIn);
  const versao = import.meta.env?.VITE_FM_VERSAO || "local";

  const aoEscolher = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const resultado = await importFromFile(f);
      importar(resultado, { mergeStrategy: "append" });
      const n = resultado.creatures?.length ?? 0;
      setAviso({ tom: "ok", texto: n === 1 ? "1 Ficha Lida do Arquivo" : `${n} Fichas Lidas do Arquivo` });
    } catch (err) {
      setAviso({ tom: "erro", texto: err?.message || "Arquivo Inválido" });
    }
  };

  return (
    <main className="fm-pagina">
      <header className="fm-pagina-topo"><h1 className="fm-pagina-titulo">Mais</h1></header>

      {nuvemAtiva && <Secao icone={UserCircle} titulo="Conta"><Conta /></Secao>}

      <Secao icone={FileText} titulo="Fichas">
        <div className="fm-acoes">
          <button type="button" className="fm-acao" onClick={() => arquivo.current?.click()}><Upload aria-hidden="true" />Importar Fichas</button>
          <button type="button" className="fm-acao" disabled={!proprias.length} onClick={() => exportCreaturesToFile(proprias, "fichas-era-de-ouro.json", pastas)}>
            <Download aria-hidden="true" />Exportar Todas<small>{proprias.length}</small>
          </button>
        </div>
        <input ref={arquivo} type="file" accept=".json,application/json" hidden onChange={aoEscolher} />
        {aviso && <p className="fm-aviso" data-tom={aviso.tom} role="status">{aviso.texto}</p>}
      </Secao>

      <Secao icone={BookOpen} titulo="Livros">
        <div className="fm-acoes">
          {PDF_DOCS.map((d) => (
            <button key={d.id} type="button" className="fm-acao" onClick={() => { setDoc(d); setMinimizado(false); }}>
              <BookOpen aria-hidden="true" />{d.label}{tamanhos[d.id] && <small>{tamanhos[d.id]}</small>}
            </button>
          ))}
        </div>
      </Secao>

      {(temPedido || instalado) && (
        <Secao icone={Smartphone} titulo="App">
          {instalado ? <p className="fm-linha">Instalado neste Aparelho</p> : (
            <div className="fm-acoes"><button type="button" className="fm-acao" onClick={instalar}><Smartphone aria-hidden="true" />Instalar o App</button></div>
          )}
        </Secao>
      )}

      <Secao icone={HardDrive} titulo="Espaço no Aparelho">
        <p className="fm-linha">
          {espaco?.usage != null ? <>Em Uso <b>{tamanhoLegivel(espaco.usage)}</b>{espaco.quota ? <> de {tamanhoLegivel(espaco.quota)}</> : null}</> : "Indisponível"}
        </p>
      </Secao>

      <Secao icone={Shield} titulo="Privacidade">
        <div className="fm-acoes"><a className="fm-acao" href="/privacidade.html"><Shield aria-hidden="true" />Política de Privacidade</a></div>
      </Secao>

      <Secao icone={Info} titulo="Versão">
        <p className="fm-linha"><b>{versao}</b></p>
      </Secao>

      <PdfViewerModal doc={doc} minimized={minimizado} onToggleMinimize={() => setMinimizado((v) => !v)} onClose={() => setDoc(null)} />
    </main>
  );
}
