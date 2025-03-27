import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // entry point of your library
  format: ["cjs", "esm"], // output formats: CommonJS and ES Modules
  dts: true, // generate .d.ts declaration files
  clean: true, // clean the output directory before building
  sourcemap: true, // generate source maps for debugging
  minify: false, // enable minification (optional)
  target: "node18", // specify the target JavaScript version
  cjsInterop: true,
  external: [
    "@mikro-orm/core",
    "@mikro-orm/nestjs",
    "@nestjs/common",
    "@nestjs/core",
    "@nestjs/swagger",
    "reflect-metadata",
    "zod",
    "express",
  ],
  watch: true,
});
