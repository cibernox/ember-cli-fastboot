var path = require('path');
var RSVP = require('rsvp');

module.exports = {
  name: 'fastboot:test',
  description: 'Test your app in FastBoot.',

  availableOptions: [
    { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
    { name: 'output-path', type: String, default: 'fastboot-dist' },
    { name: 'host', type: String, default: '::' },
    { name: 'port', type: Number, default: 3211 },
    { name: 'config-file', type: String, default: 'testem.fastboot.js' }
  ],

  init: function() {
    this.testem = this.testem || new (require('testem'))();
  },

  invokeTestem: function (options) {
    var testem = this.testem;
    var testemOptions = this.testemOptions(options);
    return new RSVP.Promise(function(resolve, reject) {

      process.env['EMBER_CLI_TEST_OUTPUT'] = path.join(process.cwd(), options.outputPath);

      testem.startCI(testemOptions, function(exitCode) {
        if (!testem.app.reporter.total) {
          reject(new SilentError('No tests were run, please check whether any errors occurred in the page (ember test --server) and ensure that you have a test launcher (e.g. PhantomJS) enabled.'));
        }

        resolve(exitCode);
      });
    });
  },

  triggerBuild: function(options, args) {
    process.env.EMBER_CLI_FASTBOOT = true;

    var BuildTask = this.tasks.Build;
    var buildTask = new BuildTask({
      ui: this.ui,
      analytics: this.analytics,
      project: this.project
    });

    return buildTask.run(options);
  },

  runCommand: function() {
    var commandOptions = this.commandOptions;
    var outputPath = commandOptions.outputPath;
    var ui = this.ui;

    var FastBootServer = require('ember-fastboot-server');
    var express = require('express');

    var server = new FastBootServer({
      distPath: outputPath,
      ui: ui
    });

    var app = express();
    app.get('/*', server.middleware());

    var listener = app.listen(3201, '::');

    return this.invokeTestem(this.commandOptions)
  },

  run: function(options, args) {
    process.env.EMBER_CLI_FASTBOOT = true;

    this.commandOptions = options;

    return this.triggerBuild(options)
      .then(this.runCommand.bind(this));
  },


  testemOptions: function(options) {
    var testemOptions = {
      host: options.host,
      port: options.port,
      cwd: options.outputPath,
      reporter: options.reporter,
      // middleware: this.addonMiddlewares(),
      launch: options.launch,
      file: options.configFile,
      /* jshint ignore:start */
      /* eslint-disable camelcase */
      config_dir: process.cwd(),
      /* eslint-enable camelcase */
      /* jshint ignore:end */
    };
    return testemOptions;
  },
};
