#!/usr/bin/env node
'use strict';

const meow = require('meow');
const updateNotifier = require('update-notifier');
const {table, getBorderCharacters} = require('table');

const fpd = require('./');

const cli = meow(`
  Usage
    $ fpd

  Options
    --save Save the locked dependencies.
    --json Show dependencies in JSON format.
`, {
  boolean: ['save', 'json'],
  alias: {
    s: 'save',
    j: 'json'
  }
});

updateNotifier({pkg: cli.pkg}).notify();

fpd(cli.flags)
  .then(dependencies => {
    if (cli.flags.json) {
      return dependencies;
    }

    const headers = ['Package', 'Current', 'Fixed'];
    const rows = dependencies
      .filter(dependency => dependency.version.fixed)
      .map(dependency => [dependency.name, dependency.version.current, dependency.version.fixed]);

    return table([headers].concat(rows), {
      border: getBorderCharacters('norc'),
      columns: headers.map((h, i) => ({alignment: i > 0 ? 'right' : 'left'}))
    });
  })
  .then(console.log);
