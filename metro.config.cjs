const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add 'web' to platforms so .web.js files are resolved correctly
config.resolver.platforms = ['ios', 'android', 'web'];

// Support .mjs and .cjs files
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "mjs",
  "cjs",
];

// Enable package exports resolution (for @trpc/server subpaths)
config.resolver.unstable_enablePackageExports = true;

// Enable symlinks (pnpm uses symlinks in node_modules)
config.resolver.unstable_enableSymlinks = true;

// Explicit aliases for @trpc/server subpaths (workaround for Metro resolution bug)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@trpc/server/unstable-core-do-not-import": path.resolve(
    __dirname,
    "node_modules/@trpc/server/dist/unstable-core-do-not-import.mjs"
  ),
  "@trpc/server/observable": path.resolve(
    __dirname,
    "node_modules/@trpc/server/dist/observable.mjs"
  ),
  "@trpc/server/rpc": path.resolve(
    __dirname,
    "node_modules/@trpc/server/dist/rpc.mjs"
  ),
};

// Only block prom-client (which uses process.uptime)
config.resolver.blockList = [
  // Exclude prom-client (Node.js only, uses process.uptime)
  /node_modules\/prom-client\//,
];

module.exports = withNativeWind(config, {
  input: "./global.css",
});
