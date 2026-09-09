module.exports = {
  hooks: {
    readPackage(pkg) {
      // Finsweet ships prebundled distribution files, but this release's
      // manifest lists private workspace packages that are absent from npm.
      // The shipped List module and its relative chunks need no dependencies.
      if (pkg.name === '@finsweet/attributes' && pkg.version === '2.7.1') {
        pkg.dependencies = {};
      }
      return pkg;
    },
  },
};
