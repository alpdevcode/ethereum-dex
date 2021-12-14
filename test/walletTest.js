const Link = artifacts.require("Link");
const Wallet = artifacts.require("Wallet");
const truffleAssert = require('truffle-assertions');

contract.skip("Wallet", accounts => {
    it("should only be possible for owner to add tokens", async () => {
        let wallet = await Wallet.deployed();
        let link = await Link.deployed();
        await truffleAssert.passes(
            wallet.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[0]})
        );
        // another it message for clarity
        await truffleAssert.reverts(
            wallet.addToken(web3.utils.fromUtf8("AAVE"), link.address, {from: accounts[1]})
        );
    });
    it("should handle deposits properly", async () => {
        let wallet = await Wallet.deployed();
        let link = await Link.deployed();
        await link.approve(wallet.address, 1000);
        await wallet.deposit(web3.utils.fromUtf8("LINK"), 500);
        let balance = await wallet.balances(accounts[0], web3.utils.fromUtf8("LINK"));
        assert.equal(balance.toNumber(), 500);
    });
    it("should handle correct withdrawals properly", async () => {
        let wallet = await Wallet.deployed();
        let link = await Link.deployed();
        // deposited 500 from the previous test
        await truffleAssert.passes(
            wallet.withdraw(web3.utils.fromUtf8("LINK"), 500)
        );
    });
    it("should handle faulty withdrawals properly", async () => {
        let wallet = await Wallet.deployed();
        let link = await Link.deployed();
        // withdraw amount more than we have, withdrew 500 from the previous test
        await truffleAssert.reverts(
            wallet.withdraw(web3.utils.fromUtf8("LINK"), 10000)
        );
    });
})