/**
 * ============================================================
 * OS ADDONS OFICIAIS DA ERA DE OURO
 * ============================================================
 * Os pacotes que toda ficha NOVA da Guilda carrega, e que a Guilda não consegue
 * desligar. A lista de ids mora em `era-de-ouro.js` (ADDONS_OFICIAIS_IDS), que é
 * folha e roda nos asserts. ESTE arquivo importa os JSONs de `addons/`, e por
 * isso só o app (Vite) o importa: o Node dos asserts não lê JSON sem atributo.
 *
 * ⚠ A FONTE É O JSON de `addons/`, e a ficha leva uma CÓPIA congelada dele, como
 * em qualquer addon. Revisar um pacote aqui (o Cofre, a Carteira e a Alma Livre
 * estão em revisão) não muda sozinho as fichas que já nasceram: a aba Addons
 * mostra a versão nova e a ficha atualiza por ela.
 * ============================================================
 */
import { normalizarPacote } from "../afty/afty-addons";
import { ADDONS_OFICIAIS_IDS, PACOTE_ATENCAO_SO_PERCEPCAO, PACOTE_PERICIAS_ERA_DE_OURO } from "./era-de-ouro";
import regrasGrimorio from "../../../addons/regras-grimorio.json";
import cofreDeFeiticos from "../../../addons/cofre-de-feiticos.json";
import carteiraDaGuilda from "../../../addons/carteira-da-guilda.json";
import almaLivre from "../../../addons/alma-livre.json";

const FONTES = {
  "regras-grimorio": regrasGrimorio,
  "cofre-de-feiticos": cofreDeFeiticos,
  "carteira-da-guilda": carteiraDaGuilda,
  "alma-livre": almaLivre,
  "atencao-so-percepcao": PACOTE_ATENCAO_SO_PERCEPCAO,
  "pericias-era-de-ouro": PACOTE_PERICIAS_ERA_DE_OURO,
};

/** As cópias normalizadas, na ordem oficial. Uma cópia nova a cada chamada. */
export const pacotesOficiais = () =>
  ADDONS_OFICIAIS_IDS.map((id) => normalizarPacote(JSON.parse(JSON.stringify(FONTES[id]))));
