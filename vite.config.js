import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import copyPlugin from "./plugins/copyPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    copyPlugin(),
  ],
  build: {
    rollupOptions: {
      external: ["@vant/weapp"],
    },
  },
});
