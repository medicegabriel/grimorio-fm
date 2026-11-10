/**
 * ============================================================
 * OS PACOTES NATIVOS DA ERA DE OURO
 * ============================================================
 * As fontes CRUAS dos pacotes que toda ficha da Guilda carrega. A lista e a ordem
 * moram em `era-de-ouro.js` (NATIVOS_DA_GUILDA_IDS). Quem as normaliza e as entrega
 * à hidratação da ficha é o `afty-addons.js`, que tem o `normalizarPacote`.
 *
 * ⚠ FOLHA: só os JSONs de `addons/` e o `era-de-ouro.js`, que também é folha. O
 * `afty-addons.js` importa este módulo, e um import dele de volta fecharia o ciclo.
 *
 * ⚠ OS JSONs ENTRAM COM `with { type: "json" }`. O atributo é o que deixa o Node dos
 * asserts ler o mesmo arquivo que o Vite junta no app. A fonte é uma só: o JSON de
 * `addons/`, o mesmo que a biblioteca instala fora da Guilda.
 *
 * Substitui o `pacotes-oficiais.js` (2026-11-09), que montava as cópias congeladas
 * dos addons oficiais para a ficha nova. Os nativos não precisam nascer na ficha: a
 * hidratação os põe nela, em dia, toda vez que ela entra.
 * ============================================================
 */
import regrasGrimorio from "../../../addons/regras-grimorio.json" with { type: "json" };
import cofreDeFeiticos from "../../../addons/cofre-de-feiticos.json" with { type: "json" };
import almaLivre from "../../../addons/alma-livre.json" with { type: "json" };
import treinoTestesDeResistencia from "../../../addons/treino-testes-de-resistencia.json" with { type: "json" };
import maldicaoEraDeOuro from "../../../addons/maldicao-era-de-ouro.json" with { type: "json" };
import {
  NATIVOS_DA_GUILDA_IDS, PACOTE_ATENCAO_SO_PERCEPCAO, PACOTE_PERICIAS_ERA_DE_OURO, PACOTE_REGRAS_ERA_DE_OURO,
} from "./era-de-ouro";

const FONTES = {
  "regras-grimorio": regrasGrimorio,
  "cofre-de-feiticos": cofreDeFeiticos,
  "alma-livre": almaLivre,
  "atencao-so-percepcao": PACOTE_ATENCAO_SO_PERCEPCAO,
  "pericias-era-de-ouro": PACOTE_PERICIAS_ERA_DE_OURO,
  "treino-testes-de-resistencia": treinoTestesDeResistencia,
  "regras-da-era-de-ouro": PACOTE_REGRAS_ERA_DE_OURO,
  "maldicao-era-de-ouro": maldicaoEraDeOuro,
};

/** As fontes cruas, na ordem de `NATIVOS_DA_GUILDA_IDS`. Uma cópia nova a cada chamada. */
export const fontesNativasDaGuilda = () =>
  NATIVOS_DA_GUILDA_IDS.map((id) => JSON.parse(JSON.stringify(FONTES[id])));
