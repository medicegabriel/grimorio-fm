import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
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
  especializacoes: "Níveis Investidos (Média)", trilhas: "Níveis Investidos (Média)",
  treinamentos: "Etapas (Média)", feiticos: "Feitiços",
};
const filtrosIniciais = { dias: "30", nivel: "", origem: "", especializacao: "", addons: "" };
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const percentual = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const br = (n) => numero.format(n);
const taxa = (n, total) => total ? percentual.format(n / total) : null;

function Campo({ titulo, value, onChange, children }) {
  return (
    <label className="bal-campo">
      <span>{titulo}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
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

function Filtros({ ativos, onAplicar }) {
  const [campos, setCampos] = useState(ativos);
  const campo = (id) => ({ value: campos[id], onChange: (valor) => setCampos((antes) => ({ ...antes, [id]: valor })) });
  return (
    <form className="bal-filtros" aria-label="Filtros da Amostra" onSubmit={(e) => { e.preventDefault(); onAplicar(campos); }}>
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
      <button className="bal-acao" type="submit">Aplicar Filtros</button>
    </form>
  );
}

function Tabela({ nome, linhas, total, cabecalho = "Opção", extra }) {
  if (!linhas.length) return <p className="bal-estado">Nenhuma ocorrência neste recorte.</p>;
  return (
    <div className="bal-tabela">
      <table aria-label={nome}>
        <thead><tr><th scope="col">{cabecalho}</th><th scope="col">Fichas</th><th scope="col">% da Amostra</th>
          {extra && <th scope="col">{extra}</th>}</tr></thead>
        <tbody>
          {linhas.map(({ id, nome, fichas, valorExtra }) => (
            <tr key={id}>
              <th scope="row">{nome}</th>
              <td>{br(fichas)}</td>
              <td><div className="bal-taxa">
                <span>{taxa(fichas, total) ?? "·"}</span>
                {total > 0 && <span className="bal-regua" aria-hidden="true">
                  <span style={{ inlineSize: `${(fichas / total) * 100}%` }} />
                </span>}
              </div></td>
              {extra && <td>{valorExtra === null ? "·" : br(valorExtra)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Distribuicoes({ relatorio }) {
  const [distribuicao, setDistribuicao] = useState("base");
  const [atributo, setAtributo] = useState("forca");
  const atributos = relatorio.atributos.filter((linha) => linha.distribuicao === distribuicao && linha.id === atributo);
  const baseAtributo = atributos.reduce((soma, linha) => soma + linha.fichas, 0);
  const valores = (linhas) => linhas.map(({ valor, fichas }) => ({ id: valor, nome: br(valor), fichas }));
  return (
    <div className="bal-distribuicoes">
      <section aria-labelledby="bal-niveis">
        <h2 id="bal-niveis">Distribuição de Níveis</h2>
        <Tabela nome="Distribuição de Níveis" cabecalho="Nível" linhas={valores(relatorio.niveis)} total={relatorio.total} />
      </section>
      <section aria-labelledby="bal-atributos">
        <h2 id="bal-atributos">Distribuição de Atributos</h2>
        <div className="bal-controles">
          <Campo titulo="Distribuição" value={distribuicao} onChange={setDistribuicao}>
            <Opcoes itens={distribuicoes} />
          </Campo>
          <Campo titulo="Atributo" value={atributo} onChange={setAtributo}><Opcoes itens={ATRIBUTOS} /></Campo>
        </div>
        <p className="bal-amostra-local">Base do Atributo: {br(baseAtributo)} {baseAtributo === 1 ? "ficha" : "fichas"}</p>
        <Tabela nome="Distribuição de Atributos" cabecalho="Pontos" linhas={valores(atributos)} total={baseAtributo} />
      </section>
    </div>
  );
}

function Rankings({ relatorio }) {
  const [categoria, setCategoria] = useState("origens");
  const [ordem, setOrdem] = useState("mais");
  const dados = new Map(relatorio.escolhas.filter((row) => row.categoria === categoria).map((row) => [row.id, row]));
  const linhas = Object.entries(CATEGORIAS[categoria]).map(([id, nome]) => {
    const { fichas = 0, soma = 0 } = dados.get(id) ?? {};
    const valorExtra = categoria === "feiticos" ? soma : fichas ? soma / fichas : null;
    return { id, nome, fichas, valorExtra };
  }).sort((a, b) => (ordem === "mais" ? b.fichas - a.fichas : a.fichas - b.fichas)
    || a.nome.localeCompare(b.nome, "pt-BR"));
  return (
    <section aria-labelledby="bal-rankings">
      <h2 id="bal-rankings">Rankings de Escolhas</h2>
      <div className="bal-controles">
        <Campo titulo="Categoria" value={categoria} onChange={setCategoria}><Opcoes itens={categorias} /></Campo>
        <Campo titulo="Ordem" value={ordem} onChange={setOrdem}>
          <option value="mais">Mais Escolhidas</option><option value="menos">Menos Escolhidas</option>
        </Campo>
      </div>
      <Tabela nome={categorias[categoria]} linhas={linhas} total={relatorio.total} extra={extras[categoria]} />
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
      <section><h2>Origem e Especialização</h2>
        <Tabela nome="Origem e Especialização" cabecalho="Combinação" linhas={pares} total={relatorio.total} />
      </section>
      <section><h2>Multiclasse</h2>
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
  const [secao, setSecao] = useState("rankings");
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
  return (
    <>
      {autorizado && <Filtros ativos={filtros} onAplicar={(campos) => setFiltros({ ...campos })} />}
      {carregando && <p role="status" className="bal-estado">Carregando Amostra…</p>}
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
            <p aria-live="polite"><strong>{br(relatorio.total)}</strong> {relatorio.total === 1 ? "ficha na amostra" : "fichas na amostra"}</p>
            <nav aria-label="Visualizações da Amostra">
              {Object.entries(secoes).map(([id, [nome]]) => (
                <button key={id} type="button" aria-pressed={id === secao} onClick={() => setSecao(id)}>{nome}</button>
              ))}
            </nav>
          </div>
          {relatorio.total === 0 && <p className="bal-estado">Nenhuma ficha contribuiu neste recorte.</p>}
          <Conteudo relatorio={relatorio} />
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
