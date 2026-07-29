import vuePlugin from "@eckidevs/bun-plugin-vue";

await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: "./dist",
  target: "browser",
  minify: true,
  sourcemap: "external",
  plugins: [vuePlugin()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
