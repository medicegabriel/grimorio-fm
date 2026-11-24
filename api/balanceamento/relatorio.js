import process from "node:process";
import { obterRelatorio, servicoSupabase } from "../../server/balanceamento.js";

export default {
  fetch(request) {
    return obterRelatorio(request, servicoSupabase(), process.env.BALANCEAMENTO_ADMIN_ID);
  },
};
