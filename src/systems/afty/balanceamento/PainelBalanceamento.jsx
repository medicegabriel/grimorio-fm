import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft, BarChart3, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import ContaNuvem from "../../../nuvem/ContaNuvem.jsx";
import { cliente, lerEstadoNuvem, ouvirNuvem } from "../../../nuvem/nuvem-sync.js";
import { coletaLigada } from "./coleta.js";
import { ATRIBUTOS, CATEGORIAS, MAX_NIVEL, PERIODOS } from "./resumo.js";
import "./painel.css";

const categorias = {
  origens: "Origens", clas: "Clãs", especializacoes: "Especializações", metodos: "Métodos de Atributos",
  pericias: "Perícias", talentos: "Talentos", habilidades: "Habilidades", aptidoes: "Aptidões Amaldiçoadas",
  trilhas: "Trilhas de Aptidão", treinamentos: "Treinamentos", treinosEspeciais: "Treinos Especiais", feiticos: "Feitiços",
};
const distribuicoes = { base: "Atributos Base", nivel: "Pontos de Nível", origem: "Bônus de Origem" };
const extras = {
  especializacoes: "Média de Níveis", trilhas: "Média de Níveis",
  treinamentos: "Média de Etapas", feiticos: "Feitiços",
};
const filtrosIniciais = { dias: "30", nivel: "", origem: "", especializacao: "", addons: "" };
const opcoesPorPagina = 12;
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const percentual = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const br = (n) => numero.format(n);
const mesmosFiltros = (a, b) => Object.keys(filtrosIniciais).every((campo) => a[campo] === b[campo]);

function Campo({ titulo, value, onChange, children }) {
  return (
    <label className="bal-campo">
      <span>{titulo}</span>
      <span className="bal-seletor">
        <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
        <ChevronDown className="bal-seta" aria-hidden="true" size={16} />
      </span>
    </label>
  );
}

function Opcoes({ itens, vazio }) {
  return <>
    {vazio && <option value="">{vazio}</option>}
    {Object.entries(itens).sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([id, rotulo]) =>
      <option key={id} value={id}>{rotulo}</option>)}
  </>;
}

function Filtros({ ativos, campos, setCampos, onAplicar, carregando }) {
  const campo = (id) => ({ value: campos[id], onChange: (valor) => setCampos((antes) => ({ ...antes, [id]: valor })) });
  return (
    <form className="bal-filtros" aria-label="Filtros da Amostra" onSubmit={(e) => { e.preventDefault(); onAplicar(campos); }}>
      <div className="bal-filtros-topo">
        <h2><SlidersHorizontal size={16} aria-hidden="true" /> Filtros</h2>
        {(!mesmosFiltros(campos, filtrosIniciais) || !mesmosFiltros(ativos, filtrosIniciais)) && (
          <button className="bal-link" type="button" onClick={() => onAplicar(filtrosIniciais)}>Limpar Filtros</button>
        )}
      </div>
      <div className="bal-filtros-campos">
        <Campo titulo="Período" {...campo("dias")}>
          {PERIODOS.map((dias) => <option key={dias} value={dias}>{dias} dias</option>)}
        </Campo>
        <label className="bal-campo">
          <span>Nível</span>
          <input type="number" value={campos.nivel} min={1} max={MAX_NIVEL} placeholder="Todos"
            onChange={(e) => campo("nivel").onChange(e.target.value)} />
        </label>
        <Campo titulo="Origem" {...campo("origem")}><Opcoes itens={CATEGORIAS.origens} vazio="Todas" /></Campo>
        <Campo titulo="Especialização" {...campo("especializacao")}>
          <Opcoes itens={CATEGORIAS.especializacoes} vazio="Todas" />
        </Campo>
        <Campo titulo="Addons" {...campo("addons")}>
          <option value="">Todos</option>
          <option value="sem">Sem Addons</option>
          <option value="com">Com Addons</option>
        </Campo>
        <button className="bal-acao" type="submit" disabled={carregando || mesmosFiltros(campos, ativos)}>Aplicar Filtros</button>
      </div>
    </form>
  );
}

function Tabela({ nome, linhas, total, cabecalho = "Opção", extra, paginar = false }) {
  const [pagina, setPagina] = useState(0);
  if (!linhas.length) return <p className="bal-sem-linhas">Nenhuma ocorrência neste recorte.</p>;
  const ultima = paginar ? Math.ceil(linhas.length / opcoesPorPagina) - 1 : 0;
  const atual = Math.min(pagina, ultima);
  const de = atual * opcoesPorPagina;
  const ate = paginar ? Math.min(de + opcoesPorPagina, linhas.length) : linhas.length;
  return (
    <>
      <table aria-label={nome}>
        <colgroup><col /><col className="bal-col-contagem" /><col className="bal-col-taxa" />{extra && <col className="bal-col-extra" />}</colgroup>
        <thead><tr><th scope="col">{cabecalho}</th><th scope="col">Fichas</th><th scope="col">% da Amostra</th>
          {extra && <th scope="col">{extra}</th>}</tr></thead>
        <tbody>
          {linhas.slice(de, ate).map(({ id, nome, fichas, valorExtra }) => (
            <tr key={id}>
              <th scope="row">{nome}</th>
              <td className={fichas ? undefined : "bal-zero"}>{br(fichas)}</td>
              <td><div className="bal-taxa">
                <span className="bal-regua" aria-hidden="true">
                  <span style={{ inlineSize: `${(fichas / total) * 100}%` }} />
                </span>
                <span className={fichas ? undefined : "bal-zero"}>{percentual.format(fichas / total)}</span>
              </div></td>
              {extra && <td>{valorExtra === null ? <span className="bal-zero" aria-label="Sem dados">·</span> : br(valorExtra)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {ultima > 0 && <div className="bal-paginacao">
        <span aria-live="polite">{br(de + 1)} a {br(ate)} de {br(linhas.length)} opções</span>
        <div className="bal-paginacao-botoes">
          <button type="button" aria-label="Página Anterior" disabled={atual === 0} onClick={() => setPagina(atual - 1)}>
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próxima Página" disabled={atual === ultima} onClick={() => setPagina(atual + 1)}>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>}
    </>
  );
}

function Distribuicoes({ relatorio, visual, onVisual }) {
  const { distribuicao, atributo } = visual;
  const atributos = relatorio.atributos.filter((linha) => linha.distribuicao === distribuicao && linha.id === atributo);
  const baseAtributo = atributos.reduce((soma, linha) => soma + linha.fichas, 0);
  const valores = (linhas) => linhas.map(({ valor, fichas }) => ({ id: valor, nome: br(valor), fichas }));
  return (
    <div className="bal-distribuicoes">
      <section className="bal-painel" aria-labelledby="bal-niveis">
        <div className="bal-secao-topo"><h2 id="bal-niveis">Distribuição de Níveis</h2></div>
        <Tabela nome="Distribuição de Níveis" cabecalho="Nível" linhas={valores(relatorio.niveis)} total={relatorio.total} />
      </section>
      <section className="bal-painel" aria-labelledby="bal-atributos">
        <div className="bal-secao-topo"><h2 id="bal-atributos">Distribuição de Atributos</h2></div>
        <div className="bal-controles">
          <Campo titulo="Distribuição" value={distribuicao} onChange={(valor) => onVisual("distribuicao", valor)}>
            <Opcoes itens={distribuicoes} />
          </Campo>
          <Campo titulo="Atributo" value={atributo} onChange={(valor) => onVisual("atributo", valor)}><Opcoes itens={ATRIBUTOS} /></Campo>
        </div>
        <p className="bal-amostra-local">{br(baseAtributo)} {baseAtributo === 1 ? "ficha com este atributo" : "fichas com este atributo"}</p>
        <Tabela nome="Distribuição de Atributos" cabecalho="Pontos" linhas={valores(atributos)} total={baseAtributo} />
      </section>
    </div>
  );
}

function Rankings({ relatorio, visual, onVisual }) {
  const { categoria, ordem } = visual;
  const dados = new Map(relatorio.escolhas.filter((row) => row.categoria === categoria).map((row) => [row.id, row]));
  const linhas = Object.entries(CATEGORIAS[categoria]).map(([id, nome]) => {
    const { fichas = 0, soma = 0 } = dados.get(id) ?? {};
    const valorExtra = categoria === "feiticos" ? soma : fichas ? soma / fichas : null;
    return { id, nome, fichas, valorExtra };
  }).sort((a, b) => (ordem === "mais" ? b.fichas - a.fichas : a.fichas - b.fichas)
    || a.nome.localeCompare(b.nome, "pt-BR"));
  return (
    <section className="bal-painel" aria-labelledby="bal-rankings">
      <div className="bal-secao-topo bal-ranking-topo">
        <h2 id="bal-rankings">{categorias[categoria]}</h2>
        <div className="bal-controles">
          <Campo titulo="Categoria" value={categoria} onChange={(valor) => onVisual("categoria", valor)}><Opcoes itens={categorias} /></Campo>
          <Campo titulo="Ordem" value={ordem} onChange={(valor) => onVisual("ordem", valor)}>
            <option value="mais">Mais Escolhidas</option><option value="menos">Menos Escolhidas</option>
          </Campo>
        </div>
      </div>
      <Tabela key={`${categoria}/${ordem}`} nome={categorias[categoria]} linhas={linhas} total={relatorio.total}
        extra={extras[categoria]} paginar />
    </section>
  );
}

function Combinacoes({ relatorio }) {
  const { origens, especializacoes } = CATEGORIAS;
  const pares = relatorio.origemEspecializacao.map(({ origem, especializacao, fichas }) => ({
    id: `${origem}/${especializacao}`, nome: `${origens[origem] ?? origem} + ${especializacoes[especializacao] ?? especializacao}`, fichas,
  }));
  const multiclasses = relatorio.multiclasse.map(({ especializacoes: ids, fichas }) => ({
    id: ids.join("/"), nome: ids.map((id) => especializacoes[id] ?? id).join(" + "), fichas,
  }));
  return (
    <div className="bal-distribuicoes">
      <section className="bal-painel" aria-labelledby="bal-origens-especializacoes">
        <div className="bal-secao-topo"><h2 id="bal-origens-especializacoes">Origem e Especialização</h2></div>
        <Tabela nome="Origem e Especialização" cabecalho="Combinação" linhas={pares} total={relatorio.total} />
      </section>
      <section className="bal-painel" aria-labelledby="bal-multiclasse">
        <div className="bal-secao-topo"><h2 id="bal-multiclasse">Multiclasse</h2></div>
        <Tabela nome="Multiclasse" cabecalho="Combinação" linhas={multiclasses} total={relatorio.total} />
      </section>
    </div>
  );
}

const secoes = { rankings: ["Rankings", Rankings], distribuicoes: ["Distribuições", Distribuicoes], combinacoes: ["Combinações", Combinacoes] };

async function carregarRelatorio(filtros, signal) {
  const sb = await cliente();
  const { data } = await sb.auth.getSession();
  if (!data?.session?.access_token) return { status: 401 };
  const q = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== ""));
  const resposta = await fetch(`/api/balanceamento/relatorio?${q}`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: "no-store", signal,
  });
  return { status: resposta.status, relatorio: resposta.ok ? await resposta.json() : null };
}

function RelatorioPrivado() {
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [campos, setCampos] = useState(filtrosIniciais);
  const [secao, setSecao] = useState("rankings");
  const [visual, setVisual] = useState({ categoria: "origens", ordem: "mais", distribuicao: "base", atributo: "forca" });
  const [revisao, recarregar] = useState(0);
  const [resultado, setResultado] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    carregarRelatorio(filtros, controller.signal)
      .then((retorno) => {
        if (!controller.signal.aborted) setResultado({ ...retorno, filtros, revisao });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResultado({ status: 503, filtros, revisao });
      });
    return () => controller.abort();
  }, [filtros, revisao]);

  const carregando = resultado?.filtros !== filtros || resultado?.revisao !== revisao;
  const relatorio = carregando ? null : resultado.relatorio;
  const autorizado = resultado?.status === 200 || carregando;
  const [, Conteudo] = secoes[secao];
  const aplicar = (novos) => {
    setCampos(novos);
    if (!mesmosFiltros(filtros, novos)) setFiltros(novos);
  };
  const outrosFiltros = Boolean(filtros.nivel || filtros.origem || filtros.especializacao || filtros.addons);
  return (
    <>
      {autorizado && <Filtros ativos={filtros} campos={campos} setCampos={setCampos} onAplicar={aplicar} carregando={carregando} />}
      {carregando && <div className="bal-painel bal-carregando" role="status">
        <span>Carregando amostra…</span><div aria-hidden="true" /><div aria-hidden="true" /><div aria-hidden="true" />
      </div>}
      {!carregando && !relatorio && (
        <div className="bal-estado" role="status">
          {resultado.status === 403 ? "Esta conta não tem acesso ao painel."
            : resultado.status === 401 ? "Entre com a conta autorizada para consultar o painel."
              : resultado.status === 404 ? "O painel está indisponível."
                : "Não foi possível carregar a amostra."}
          {resultado.status >= 500 && <button type="button" className="bal-acao" onClick={() => recarregar(revisao + 1)}>Tentar Novamente</button>}
        </div>
      )}
      {relatorio && (
        <>
          <div className="bal-faixa">
            {relatorio.total > 0 && <nav aria-label="Visualizações da Amostra">
              {Object.entries(secoes).map(([id, [nome]]) => (
                <button key={id} type="button" aria-pressed={id === secao} onClick={() => setSecao(id)}>{nome}</button>
              ))}
            </nav>}
            <p className="bal-amostra" aria-live="polite">
              <span><strong>{br(relatorio.total)}</strong> {relatorio.total === 1 ? "ficha na amostra" : "fichas na amostra"}</span>
              <span>Últimos {filtros.dias} dias</span>
            </p>
          </div>
          {relatorio.total > 0 ? (
            <Conteudo relatorio={relatorio} visual={visual}
              onVisual={(campo, valor) => setVisual((antes) => ({ ...antes, [campo]: valor }))} />
          ) : (
            <section className="bal-painel bal-vazio" aria-labelledby="bal-vazio-titulo">
              <BarChart3 size={23} aria-hidden="true" />
              <h2 id="bal-vazio-titulo">Nenhuma ficha neste recorte</h2>
              <p>{outrosFiltros ? "Limpe os filtros para ampliar a amostra."
                : "Os resultados aparecem conforme as fichas são salvas em Jogador."}</p>
              {!outrosFiltros && filtros.dias !== "90" && <button className="bal-acao bal-acao-secundaria" type="button"
                  onClick={() => aplicar({ ...filtros, dias: "90" })}>Ver Últimos 90 Dias</button>}
            </section>
          )}
        </>
      )}
    </>
  );
}

export default function PainelBalanceamento() {
  const { usuario, fase } = useSyncExternalStore(ouvirNuvem, lerEstadoNuvem);
  return (
    <div className="bal-pagina">
      <header className="bal-cabecalho">
        <a href="/Jogador"><ArrowLeft size={16} aria-hidden="true" /> Jogador</a>
        {coletaLigada && <ContaNuvem />}
      </header>
      <main className="bal-conteudo">
        <h1>Balanceamento</h1>
        {!coletaLigada ? <p className="bal-estado">O painel está indisponível.</p>
          : usuario ? <RelatorioPrivado key={usuario.id} />
            : <p className="bal-estado" role="status">{fase === "sincronizando" ? "Verificando Sessão…"
              : "Entre com a conta autorizada para consultar o painel."}</p>}
      </main>
    </div>
  );
}
