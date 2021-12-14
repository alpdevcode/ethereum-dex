const Link = artifacts.require("Link");
const Dex = artifacts.require("Dex");
const truffleAssert = require('truffle-assertions');

// Market Order Tests
// Parameters: Order.side, Order.ticker, Order.amount
contract("Dex", accounts => {

    // When creating a SELL market order, the seller needs to have enough tokens for the trade
    it("should not allow a seller to create a SELL market order not having enough tokens for the trade", async() => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
        await link.approve(dex.address, 1000);

        await truffleAssert.reverts(
            dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 10)
        );

        await dex.deposit(web3.utils.fromUtf8("LINK"), 10);

        await truffleAssert.passes(
            dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 10)
        );
    });

    // When creating a BUY market order, the buyer needs to have enough ETH for the trade
    it("should not allow a buyer to create a BUY market order not having enough ETH for the trade", async() => {
        let dex = await Dex.deployed();
     
        await dex.deposit(web3.utils.fromUtf8("LINK"), 10);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1);

        await truffleAssert.reverts(
            dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10)
        );

        await dex.depositEth(10);

        await truffleAssert.passes(
            dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10)
        );
    });

    // Market orders can be submitted even if the order book is empty
    it("should allow market order to be submitted even if the order book is empty", async() => {
        let dex = await Dex.deployed();

        await dex.deposit(web3.utils.fromUtf8("LINK"), 10);      

        // SELL market order
        await truffleAssert.passes(
            dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 10)
        );

        // BUY market order
        await truffleAssert.passes(
            dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10)
        );
    });

    //  SELL market orders should be filled until the order book is empty or the market order is 100% filled
    it("should fill SELL market order until 100% or order book is empty", async() => {
        let dex = await Dex.deployed();

        await dex.deposit(web3.utils.fromUtf8("LINK"), 30);
        await dex.depositEth(30);
        
        // BUY limit order
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1);
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1);
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 10, 1);

        // SELL market order 100% filled
        await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 20);

        let orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 0);
        assert(orders.length == 1, "Market order should be filled leaving 1 remaining limit order");

        // SELL market order, order book empty
        await dex.createMarketOrder(1, web3.utils.fromUtf8("LINK"), 20);

        orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 0);
        assert(orders.length == 0, "Order book should be empty");
    });

    //  BUY market orders should be filled until the order book is empty or the market order is 100% filled
    it("should fill BUY market order until 100% or order book is empty", async() => {
        let dex = await Dex.deployed();

        await dex.deposit(web3.utils.fromUtf8("LINK"), 30);
        await dex.depositEth(10);

        // SELL limit order
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1);

        // BUY market order 100% filled
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 20);

        let orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 1);
        assert(orders.length == 1, "Market order should be filled leaving 1 remaining limit order");

        // BUY market order, order book empty
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 20);

        orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 1);
        assert(orders.length == 0, "Order book should be empty");
    });

    // The eth balance of the buyer should decrease with the filled amount
    it("should decrease ETH balance of buyer with filled amount", async() => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await link.transfer(accounts[1], 100);

        await link.approve(dex.address, 100, {from: accounts[1]});
        await dex.deposit(web3.utils.fromUtf8("LINK"), 10, {from: accounts[1]});   
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 2, {from: accounts[1]});

        await dex.depositEth(20);

        let balanceBefore = await dex.balances(accounts[0], web3.utils.fromUtf8("ETH"));
        // BUY market order
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10);
        let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("ETH"));
        assert.equal(balanceBefore - 20, balance); 
    });

    // The token balances of the sellers should decrease with the filled amounts.
    it("should decrease token balance of seller with filled amount", async() => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await link.transfer(accounts[1], 10);
        await link.approve(dex.address, 10, {from: accounts[1]});
        await dex.deposit(web3.utils.fromUtf8("LINK"), 10, {from: accounts[1]});  

        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1, {from: accounts[1]});

        await dex.depositEth(10);
        let balanceBefore = await dex.balances(accounts[1], web3.utils.fromUtf8("LINK"));
        // BUY market order
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10);

        let balance = await dex.balances(accounts[1], web3.utils.fromUtf8("LINK"));
        assert.equal(balanceBefore - 10, balance); 
    });

    // Filled limit orders should be removed from the orderbook
    it("should remove filled limit orders from the orderbook", async() => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await link.transfer(accounts[1], 20);
        await link.approve(dex.address, 20, {from: accounts[1]});
        await dex.deposit(web3.utils.fromUtf8("LINK"), 20, {from: accounts[1]});  

        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1, {from: accounts[1]});

        await dex.depositEth(10);
        // one BUY market order should be removed
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 10);

        let orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 1);
        assert.equal(orders.length, 0); 
    });

    // Partly filled limit orders should be modified to represent the filled/remaining amount
    it("Limit orders filled property should be set correctly after a trade", async() => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
        await link.transfer(accounts[1], 10);
        await link.approve(dex.address, 10, {from: accounts[1]});
        await dex.deposit(web3.utils.fromUtf8("LINK"), 10, {from: accounts[1]});

        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1, {from: accounts[1]});

        await dex.depositEth(10);
        await dex.createMarketOrder(0, web3.utils.fromUtf8("LINK"), 5);

        let orders = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 1);
        assert.equal(orders[0].filled, 5); 
        assert.equal(orders[0].amount, 10);
    });    

});