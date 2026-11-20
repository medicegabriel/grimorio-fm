/* ============================================================
   A LISTA DE FICHAS DA GUILDA NO CELULAR (app Era de Ouro, etapa E8, 2026-11-20)
   ============================================================
   No telefone o Dashboard tinha seis botões só de ícone no cabeçalho, o título cortado em "E...", a sonda de memória e um menu
   que abria para fora da tela. Aqui é uma lista feita para o dedo:
   - busca e pastas com a contagem (a mesma vista que o App guarda para o Dashboard);
   - o cartão com retrato, nome e Nível ou ND. Tocar abre a Ficha. O "⋯" abre as ações numa folha: Abrir, Editar, Duplicar,
     Mover para Pasta, Exportar e Excluir (com confirmação);
   - segurar um cartão entra em seleção, com a barra de ações em grupo (Mover, Exportar, Excluir);
   - Nova Ficha usa a escolha de Criatura ou Personagem que o App já tem.
   Fica de fora de propósito: arrastar para reordenar, Criaturas Base, Modelos e a sonda de memória (estão no computador).

   O armazém é o do App (`storage`), então o Excluir, o Duplicar e o Mover são os mesmos do Dashboard.
   ============================================================ */
import React, { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, Download, Folder, FolderInput, MoreVertical, Pencil, Plus, Search, Trash2, User, X } from "lucide-react";
import FolhaInferior from "../../../celular/FolhaInferior";
import { useCamadaDeVoltar } from "../../../celular/camadas";
import { exportCreaturesToFile } from "../../../components/io-utils";
import { fichasDaVista, mesmaVista, pastasComContagem, resumoDaFicha } from "./lista-fichas";

const SEGURAR_MS = 500;
const nomeDoArquivo = (base) => `${String(base || "fichas").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "fichas"}.json`;

function Retrato({ url, nome }) {
  const [falhou, setFalhou] = useState(false);
  if (!url || falhou) {
    return <span className="fm-cartao-retrato" aria-hidden="true">{String(nome).slice(0, 1).toUpperCase() || <User />}</span>;
  }
  return <img className="fm-cartao-retrato" src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFalhou(true)} />;
}

function Acao({ icone: Icone, rotulo, onClick, perigo = false }) {
  return (
    <button type="button" className="fm-acao" data-perigo={perigo ? "sim" : undefined} onClick={onClick}>
      <Icone aria-hidden="true" />{rotulo}
    </button>
  );
}

export default function ListaDeFichas({ fichas, pastas, vista, onVista, storage, onAbrir, onEditar, onNova }) {
  const [busca, setBusca] = useState("");
  const [menu, setMenu] = useState(null); // a ficha do "⋯"
  const [mover, setMover] = useState(null); // ids a mover
  const [apagar, setApagar] = useState(null); // ids a excluir
  const [selecao, setSelecao] = useState(() => new Set());
  const selecionando = selecao.size > 0;
  const toque = useRef({ relogio: null, x: 0, y: 0, segurou: false });

  /* O Voltar sai da seleção antes de sair da lista (D-86). As folhas já são camadas. */
  useCamadaDeVoltar(selecionando, () => setSelecao(new Set()));

  const visiveis = useMemo(() => fichasDaVista(fichas, vista, busca), [fichas, vista, busca]);
  const escolhas = useMemo(() => pastasComContagem(fichas, pastas), [fichas, pastas]);
  const porId = (id) => fichas.find((f) => f.id === id);

  const alternar = (id) => setSelecao((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const aoDescer = (e, id) => {
    if (e.pointerType === "mouse") return;
    clearTimeout(toque.current.relogio);
    toque.current = {
      x: e.clientX, y: e.clientY, segurou: false,
      relogio: setTimeout(() => { toque.current.segurou = true; alternar(id); }, SEGURAR_MS),
    };
  };
  const aoMover = (e) => {
    if (Math.abs(e.clientX - toque.current.x) > 10 || Math.abs(e.clientY - toque.current.y) > 10) clearTimeout(toque.current.relogio);
  };
  const aoSoltar = () => clearTimeout(toque.current.relogio);
  const aoTocar = (id) => {
    if (toque.current.segurou) { toque.current.segurou = false; return; }
    if (selecionando) alternar(id); else onAbrir(id);
  };

  const exportar = (ids) => {
    const lista = ids.map(porId).filter(Boolean);
    if (!lista.length) return;
    exportCreaturesToFile(lista, nomeDoArquivo(lista.length === 1 ? lista[0].name : "fichas-era-de-ouro"));
  };
  const confirmarApagar = () => {
    if (!apagar) return;
    if (apagar.length === 1) storage.remove(apagar[0]); else storage.removeMany(apagar);
    setApagar(null);
    setSelecao(new Set());
  };
  const moverPara = (pastaId) => {
    if (!mover) return;
    if (mover.length === 1) storage.moveCreatureToFolder(mover[0], pastaId); else storage.moveCreaturesToFolder(mover, pastaId);
    setMover(null);
    setSelecao(new Set());
  };
  const ids = [...selecao];

  return (
    <main className="fm-pagina fm-lista">
      <header className="fm-pagina-topo">
        {selecionando ? (
          <>
            <button type="button" className="fm-icone" onClick={() => setSelecao(new Set())} aria-label="Sair da Seleção"><X aria-hidden="true" /></button>
            <h1 className="fm-pagina-titulo">{selecao.size} {selecao.size === 1 ? "Selecionada" : "Selecionadas"}</h1>
          </>
        ) : (
          <>
            <h1 className="fm-pagina-titulo">Era de Ouro</h1>
            <button type="button" className="fm-botao fm-botao-forte" onClick={onNova}><Plus aria-hidden="true" />Nova Ficha</button>
          </>
        )}
      </header>

      <div className="fm-busca">
        <Search aria-hidden="true" />
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" aria-label="Buscar Fichas" enterKeyHint="search" />
      </div>

      {escolhas.length > 1 && (
        <div className="fm-pastas" role="group" aria-label="Pastas">
          {escolhas.map((p) => (
            <button key={`${p.vista.type}:${p.vista.folderId ?? ""}`} type="button" className="fm-pasta" aria-pressed={mesmaVista(vista, p.vista)} onClick={() => onVista(p.vista)}>
              {p.vista.type === "folder" && <Folder aria-hidden="true" />}<span>{p.rotulo}</span><small>{p.n}</small>
            </button>
          ))}
        </div>
      )}

      {visiveis.length === 0 ? (
        <div className="fm-vazio">
          <p>{busca ? "Nenhuma Ficha Encontrada" : "Nenhuma Ficha"}</p>
          {!busca && <button type="button" className="fm-botao fm-botao-forte" onClick={onNova}><Plus aria-hidden="true" />Nova Ficha</button>}
        </div>
      ) : (
        <ul className="fm-cartoes">
          {visiveis.map((f) => {
            const r = resumoDaFicha(f);
            const marcada = selecao.has(f.id);
            return (
              <li key={f.id} className="fm-cartao" data-marcada={marcada ? "sim" : undefined}>
                <button
                  type="button"
                  className="fm-cartao-corpo"
                  onClick={() => aoTocar(f.id)}
                  onPointerDown={(e) => aoDescer(e, f.id)}
                  onPointerMove={aoMover}
                  onPointerUp={aoSoltar}
                  onPointerCancel={aoSoltar}
                  onContextMenu={(e) => e.preventDefault()}
                  aria-pressed={selecionando ? marcada : undefined}
                  aria-label={selecionando ? `${marcada ? "Desmarcar" : "Marcar"} ${r.nome}` : `Abrir ${r.nome}`}
                >
                  {selecionando ? <span className="fm-cartao-marca" aria-hidden="true">{marcada && <Check />}</span> : <Retrato url={r.retrato} nome={r.nome} />}
                  <span className="fm-cartao-texto">
                    <span className="fm-cartao-nome">{r.nome}</span>
                    <span className="fm-cartao-linha">{r.linha}{r.linha !== r.tipo && <> · {r.tipo}</>}</span>
                  </span>
                </button>
                {!selecionando && (
                  <button type="button" className="fm-icone" onClick={() => setMenu(f.id)} aria-label={`Ações de ${r.nome}`} aria-haspopup="dialog">
                    <MoreVertical aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {selecionando && (
        <div className="fm-barra-selecao" role="toolbar" aria-label="Ações das Selecionadas">
          {pastas.length > 0 && <button type="button" className="fm-botao" onClick={() => setMover(ids)}><FolderInput aria-hidden="true" />Mover</button>}
          <button type="button" className="fm-botao" onClick={() => exportar(ids)}><Download aria-hidden="true" />Exportar</button>
          <button type="button" className="fm-botao" data-perigo="sim" onClick={() => setApagar(ids)}><Trash2 aria-hidden="true" />Excluir</button>
        </div>
      )}

      <FolhaInferior aberta={!!menu} onFechar={() => setMenu(null)} titulo={menu ? resumoDaFicha(porId(menu)).nome : undefined}>
        {menu && (
          <div className="fm-acoes" role="menu">
            <Acao icone={User} rotulo="Abrir" onClick={() => { const id = menu; setMenu(null); onAbrir(id); }} />
            <Acao icone={Pencil} rotulo="Editar" onClick={() => { const id = menu; setMenu(null); onEditar(id); }} />
            <Acao icone={Copy} rotulo="Duplicar" onClick={() => { storage.duplicate(menu); setMenu(null); }} />
            {pastas.length > 0 && <Acao icone={FolderInput} rotulo="Mover para Pasta" onClick={() => { setMover([menu]); setMenu(null); }} />}
            <Acao icone={Download} rotulo="Exportar" onClick={() => { exportar([menu]); setMenu(null); }} />
            <Acao icone={Trash2} rotulo="Excluir" perigo onClick={() => { setApagar([menu]); setMenu(null); }} />
          </div>
        )}
      </FolhaInferior>

      <FolhaInferior aberta={!!mover} onFechar={() => setMover(null)} titulo="Mover para Pasta">
        <div className="fm-acoes" role="menu">
          <Acao icone={Folder} rotulo="Sem Pasta" onClick={() => moverPara(null)} />
          {pastas.map((p) => <Acao key={p.id} icone={Folder} rotulo={p.name} onClick={() => moverPara(p.id)} />)}
        </div>
      </FolhaInferior>

      <FolhaInferior aberta={!!apagar} onFechar={() => setApagar(null)} titulo={apagar?.length === 1 ? `Excluir ${resumoDaFicha(porId(apagar[0])).nome}` : `Excluir ${apagar?.length ?? 0} Fichas`}>
        <p className="fm-aviso"><AlertTriangle aria-hidden="true" />Não Dá para Desfazer</p>
        <div className="fm-confirmar">
          <button type="button" className="fm-botao" onClick={() => setApagar(null)}>Cancelar</button>
          <button type="button" className="fm-botao" data-perigo="sim" onClick={confirmarApagar}><Trash2 aria-hidden="true" />Excluir</button>
        </div>
      </FolhaInferior>
    </main>
  );
}
