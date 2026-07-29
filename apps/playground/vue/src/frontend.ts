import { createApp } from "vue";

import App from "./App.vue";
import "./index.css";

const elem = document.getElementById("root")!;

const mount = () => {
  const app = createApp(App);
  app.mount(elem);
  return app;
};

let app = mount();

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on("bun:invalidate", () => {
    app.unmount();
    app = mount();
  });
}
