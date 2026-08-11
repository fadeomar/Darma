// Browser stub for Node built-ins (`fs`, `path`, `crypto`).
//
// The Piper/ONNX WASM glue used by /tools/text-to-speech is an Emscripten
// bundle that carries a dead `ENVIRONMENT_IS_NODE` branch. That branch never
// executes in a browser, but bundlers still have to resolve its `require()`
// calls. Aliasing them here (browser condition only) keeps the client build
// working without pulling polyfills in.
export default {};
