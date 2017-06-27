'use strict';

const readPkg = require('read-pkg');
const writePkg = require('write-pkg');
const semver = require('semver');
const npa = require('npm-package-arg');
const packageJson = require('package-json');

const dependencyTypes = [
  'dependencies',
  'devDependencies'
];

module.exports = function (opts) {
  return readPkg()
    .then(pkg => {
      const dependencies = dependencyTypes
        .filter(type => pkg[type])
        .map(type => Object.keys(pkg[type]).map(name => {
          const resolved = npa.resolve(name, pkg[type][name]);
          return {
            type,
            name: resolved.name,
            raw: resolved.raw,
            registry: resolved.registry,
            version: {
              type: resolved.type,
              current: resolved.rawSpec
            }
          };
        }))
        .reduce((flat, dependencies) => flat.concat(dependencies), [])
        .map(dependency => {
          if (dependency.registry === true) {
            return packageJson(dependency.name, {version: dependency.version.current})
              .then(data => {
                dependency.version.fixed = data.version;
                return dependency;
              });
          }
          return dependency;
        });

      return Promise.all(dependencies)
        .then(dependencies => {
          const pkgPromise = Promise.resolve(pkg);
          if (opts.save) {
            pkgPromise.then(pkg => writePkg(dependencies.reduce((updatedPkg, dependency) => {
              if (semver.valid(dependency.version.fixed)) {
                updatedPkg[dependency.type][dependency.name] = dependency.version.fixed;
              }
              return updatedPkg;
            }, pkg)));
          }
          return pkgPromise.then(() => dependencies);
        });
    });
};
