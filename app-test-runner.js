global.QUnit = require('qunitjs');

// adds test reporting
var qe = require('qunit-extras');
qe.runInContext(global);

var glob = require('glob');
var root = process.argv[2];

function addFiles(files) {
  glob.sync(root + files).forEach(function(name) {
    require(name.substring(0, name.length - 3));
  });
}

addFiles('/**/*-test.js');

QUnit.load();
