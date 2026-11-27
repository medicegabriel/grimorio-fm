import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import EsqueletoDeAbertura from './celular/EsqueletoDaLista.jsx'
import { telaSobDemanda } from './celular/sob-demanda.js'
import { ehHostAntigo, PARAM_RECEBER, temSessaoOuRetorno } from './nuvem/nuvem-config.js'

const pedirCentral = () => import('./home/CentralDeJogo.jsx')
const pedirApp = () => import('./App.jsx')
const ESPERA_DO_ESQUELETO = 700

/* O que chega de fora entra no localStorage ANTES de o React montar, porque os
   hooks leem o armazenamento uma vez e regravam o que têm na memória. Quem não
   tem conta nem veio do endereço antigo passa direto, sem espera.

   ⚠ A TELA DESCE JUNTO COM A NUVEM (2026-11-26, fila "Carregamento"). A escolha da tela é síncrona, e só a tela escolhida
   desce (nunca as duas). Sem sessão, o import dela sai antes do primeiro `await`, junto dos dois módulos da nuvem. Com sessão,
   ele sai depois de o cliente da nuvem (supabase-js) chegar e corre junto das duas leituras: pedido antes, os pedaços do App
   passavam à frente do supabase-js na fila da rede, e na bancada (celular frio, com conta) o "Carregando" ia de 1,98 s para
   3,49 s. Assim ele fica em 1,95 s e a lista chega em 3,33 s, contra 3,84 s (decisão do autor, 2026-11-26). A MONTAGEM
   continua depois da nuvem: o módulo do App
   pode ser avaliado antes da leitura terminar, mas os hooks só leem o armazenamento ao montar. Por isso nenhum módulo do grafo
   estático do App pode ler fichas no topo (conferido em 2026-11-26: o único que lê é `ligarMolduraDoAparelho`, com uma chave
   do aparelho que a nuvem não leva). */
async function iniciar() {
  const parametros = new URLSearchParams(location.search)
  const comunidade = /^\/comunidade\/?$/i.test(location.pathname)
  const central = (comunidade || (location.pathname === '/' && !ehHostAntigo())) && !parametros.has('testar-erro')
  const retorno = parametros.has(PARAM_RECEBER) || parametros.has('code') || /access_token=/.test(location.hash)
  const sessao = temSessaoOuRetorno()
  const comNuvem = !central || retorno || sessao
  /* A nuvem é pedida PRIMEIRO, e a tela logo atrás. Com a tela na frente, os pedaços dela (uns 50 no App) passavam à frente dos
     dois da nuvem na fila da rede, e o "Carregando" saía 1,4 s mais tarde (medido na bancada, celular frio, sem conta). */
  const nuvemChegando = comNuvem
    ? Promise.all([import('./nuvem/nuvem-mudanca.js'), import('./nuvem/nuvem-sync.js')])
    : null
  nuvemChegando?.catch(() => {})
  /* ⚠ UM `import()` POR FUNÇÃO. Escrito como `central ? import(A) : import(B)`, o build junta os dois num `__vitePreload` só, com
     as dependências das DUAS telas: o `/` pré-ligava os pedaços e o CSS global do App, e as rotas do App os da Central. */
  const pedirTela = central ? pedirCentral : pedirApp
  let telaChegando = sessao ? null : pedirTela()
  /* ⚠ O ESQUELETO SÓ ACENDE SE A ABERTURA DEMORAR (2026-11-26). O index.html o traz escondido, e desenhá-lo custa cerca de
     80 ms no celular (quase tudo fonte). Antes deste módulo, o desenho segurava os `import()` acima, e a lista chegava de 40 a
     130 ms mais tarde. Aceso logo aqui, ainda empurrava a lista de 36 a 82 ms quando tudo vinha do cache. Então ele acende aos
     `ESPERA_DO_ESQUELETO` ms da navegação (e com ele o da espera do compêndio, dentro do App), ou já agora se este módulo
     rodou depois disso (rede lenta, primeiro acesso). Com a tela montada antes, ele nunca é desenhado. Os 700 ms são decisão
     do autor (2026-11-26). */
  setTimeout(() => document.documentElement.setAttribute('data-fm-no-ar', ''), Math.max(0, ESPERA_DO_ESQUELETO - performance.now()))
  if (!telaChegando) {
    // Com sessão: espera o cliente da nuvem (no máximo 2,5 s, o mesmo teto da leitura) e só então pede a tela.
    try {
      const [, { cliente }] = await nuvemChegando
      await Promise.race([cliente(), new Promise((r) => setTimeout(r, 2500))])
    } catch { /* a nuvem nunca impede o site de abrir */ }
    telaChegando = pedirTela()
  }
  // A falha aparece na montagem, pela "Nova Versão" do `telaSobDemanda`. Aqui só não vira rejeição solta durante a espera.
  telaChegando.catch(() => {})
  if (nuvemChegando) {
    try {
      const [{ receberFichasSeVieram }, { prepararNuvem }] = await nuvemChegando
      await receberFichasSeVieram()
      await prepararNuvem()
    } catch { /* a nuvem nunca impede o site de abrir */ }
  }
  const Tela = telaSobDemanda(() => telaChegando)
  // O fallback tem a mesma marcação que o index.html já pintou dentro do #root, e a troca de um pelo outro não pisca.
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<EsqueletoDeAbertura />}>
          <Tela comunidade={comunidade} />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>,
  )
}

iniciar()
