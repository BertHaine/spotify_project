'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    //Add Facebook ID and Facebook Token as columns
    return queryInterface.addColumn("users", "facebookId", Sequelize.STRING)
      .then(function(){
        return queryInterface.addColumn("users", "facebookToken", Sequelize.STRING);
      });
  },

  down: function (queryInterface, Sequelize) {
    //Remove the added Ids in reverse order
    return queryInterface.removeColumn("users", "facebookToken")
      .then(function(){
        return queryInterface.removeColumn("users", "facebookId");
      });
  }
};
