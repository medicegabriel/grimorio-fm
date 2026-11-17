import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { prepararNuvem } from './nuvem/nuvem-sync.js'
import { receberFichasSeVieram } from './nuvem/nuvem-mudanca.js'

/* O que chega de fora entra no localStorage ANTES de o React montar, porque os
   hooks leem o armazenamento uma vez e regravam o que têm na memória. Quem não
   tem conta nem veio do endereço antigo passa direto, sem espera. */
async function iniciar() {
  try {
    await receberFichasSeVieram()
    await prepararNuvem()
  } catch { /* a nuvem nunca impede o site de abrir */ }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

iniciar()
