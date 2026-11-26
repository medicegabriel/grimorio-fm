import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Carregando from './celular/Carregando.jsx'
import { telaSobDemanda } from './celular/sob-demanda.js'
import { ehHostAntigo, PARAM_RECEBER, temSessaoOuRetorno } from './nuvem/nuvem-config.js'

const CentralDeJogo = telaSobDemanda(() => import('./home/CentralDeJogo.jsx'))
const Grimorio = telaSobDemanda(() => import('./App.jsx'))

/* O que chega de fora entra no localStorage ANTES de o React montar, porque os
   hooks leem o armazenamento uma vez e regravam o que têm na memória. Quem não
   tem conta nem veio do endereço antigo passa direto, sem espera. */
async function iniciar() {
  const parametros = new URLSearchParams(location.search)
  const comunidade = /^\/comunidade\/?$/i.test(location.pathname)
  const central = (comunidade || (location.pathname === '/' && !ehHostAntigo())) && !parametros.has('testar-erro')
  const retorno = parametros.has(PARAM_RECEBER) || parametros.has('code') || /access_token=/.test(location.hash)
  if (!central || retorno || temSessaoOuRetorno()) {
    try {
      const { receberFichasSeVieram } = await import('./nuvem/nuvem-mudanca.js')
      await receberFichasSeVieram()
      const { prepararNuvem } = await import('./nuvem/nuvem-sync.js')
      await prepararNuvem()
    } catch { /* a nuvem nunca impede o site de abrir */ }
  }
  const Tela = central ? CentralDeJogo : Grimorio
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<Carregando />}>
          <Tela comunidade={comunidade} />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>,
  )
}

iniciar()
