import { receberContribuicao, servicoSupabase } from "../../server/balanceamento.js";

export default {
  fetch(request) {
    return receberContribuicao(request, servicoSupabase());
  },
};
