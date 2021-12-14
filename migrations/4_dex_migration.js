const Dex = artifacts.require("Dex");

module.exports = async function (deployer, network, accounts) {
  deployer.deploy(Dex);
};
