export default function AssinaturaDaConta({ consulta }) {
  const nome = consulta.dados?.nome;
  return (
    <div className="comunidade-assinatura-conta">
      <span>Autor</span>
      {nome ? <strong>{nome}</strong> : (
        <div className="comunidade-contagem">
          {consulta.carregando ? <p role="status">Carregando nome da conta…</p> : (
            <>
              <p role="status">{consulta.erro || "O nome da conta ainda não está disponível."}</p>
              <button type="button" className="comunidade-acao-texto" onClick={consulta.recarregar}>Tentar Novamente</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
