import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Marca componentes usados em JSX como "usados" — sem isso o
      // no-unused-vars dá falso positivo em qualquer componente
      // referenciado só dentro de JSX (ex.: <Icon/>, <Star/>).
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
    },
  },
  {
    // Só o Grimório do Afty. O da 2.5.2 (src/components/) é somente-leitura e
    // usa o emoji ⚠️ em vários avisos: incluí-lo aqui quebraria o lint num
    // código que não pode ser alterado.
    files: ['src/systems/afty/**/*.{js,jsx}'],
    rules: {
      // Emoji de aviso RENDERIZADO na tela fica torto, e não é problema de
      // CSS: U+26A0 é resolvido para a fonte de emoji do sistema (Segoe UI
      // Emoji no Windows), que tem baseline e métricas próprias. Nenhum ajuste
      // de flex ou line-height centra um glifo que vem de outra fonte, e foi
      // por isso que o conserto nunca pegou nas tentativas anteriores.
      //
      // O certo é o ícone SVG: <AlertTriangle className="w-3 h-3 mt-0.5
      // flex-shrink-0" aria-hidden="true" />, que herda a cor por currentColor
      // e tem tamanho que a gente controla. O arquivo já usava esse padrão em
      // ~15 lugares e três tinham ficado para trás.
      //
      // ⚠ EM COMENTÁRIO CONTINUA LIVRE: a regra pega só JSXText e string
      // literal, que é o que chega na tela. O estilo de comentário do projeto
      // usa ⚠ à vontade e não muda.
      'no-restricted-syntax': ['error',
        {
          selector: 'JSXText[value=/\\u26A0/]',
          message: 'Aviso na tela usa o ícone <AlertTriangle/> do lucide, não o caractere ⚠ (ele vem da fonte de emoji e sai desalinhado).',
        },
        {
          selector: 'Literal[value=/\\u26A0/]',
          message: 'Aviso na tela usa o ícone <AlertTriangle/> do lucide, não o caractere ⚠ (ele vem da fonte de emoji e sai desalinhado).',
        },
        {
          selector: 'TemplateElement[value.raw=/\\u26A0/]',
          message: 'Aviso na tela usa o ícone <AlertTriangle/> do lucide, não o caractere ⚠ (ele vem da fonte de emoji e sai desalinhado).',
        },
      ],
    },
  },
])
