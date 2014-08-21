var _  = require('lodash');
var config  = require('./_config');
var Promise = require('bluebird');
var util = require('util');
var post    = Promise.promisify(require('request').post);
var base    = config.bunsenUrl + 'api/seed';

module.exports = function() {

  this.seed = {
    populate: function(models) {
      var modelsArray = Array.prototype.concat(models);
      return Promise.reduce(modelsArray, function(result, model) {
        return post(base + "/data", {form: model}).
          then(function(response) {
            if (response[0].statusCode != 200) {
              throw new Error(util.format(
                "Seed populate error.\r\nhttpCode: %s\nresponse: %s",
                response[0].statusCode, response[1]));
            }
            else {
              var models = JSON.parse(response[0].body);
              models = _.flatten(models);
              if (models.length == 1) models = models[0];
              result.push(models)
              return result;
            }
          });
      }, []);
    },

    dropRepos: function() {
      return post(base + "/drop-repos");
    },

    dropIndex: function() {
      return post(base + "/drop-index");
    },

    dropAll: function() {
      return post(base + "/drop-all");
    },

    fetch: function(modelName, data) {
      return post(base + "/fetch", {
        form: {
          modelName: modelName,
          data: data
        }
      });
    }
  }

  this.BeforeAll(function() {
    return this.seed.dropRepos()
    .then(function() {
      return this.seed.dropAll();
    }.bind(this))
    .then(function() {
      return this.seed.dropIndex();
    }.bind(this))
    .catch(function(e) {
      console.log(e);
    })
  }.bind(this));

  return this.seed;
};
