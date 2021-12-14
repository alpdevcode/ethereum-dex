const Link = artifacts.require("Link");
const Wallet = artifacts.require("Wallet");

module.exports = async function (deployer, network, accounts) {
  deployer.deploy(Link);
  // code moved to test script
  // let link = await Link.deployed();
  // let wallet = await Wallet.deployed();
  // await link.approve(wallet.address, 1000);
  // await wallet.addToken(web3.utils.fromUtf8("LINK"), link.address);
  // await wallet.deposit(web3.utils.fromUtf8("LINK"), 500);

  // let balance = await wallet.balances(accounts[0], web3.utils.fromUtf8("LINK"));
  // console.log(balance);
};
