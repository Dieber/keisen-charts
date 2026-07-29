import { defineComponent, h } from "vue";

import KlineXAxisView from "./view/KlineXAxisView";

export const XAxisPane = defineComponent({
  name: "XAxisPane",
  setup() {
    return () => h(KlineXAxisView);
  },
});
