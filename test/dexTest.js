const Link = artifacts.require("Link");
const Dex = artifacts.require("Dex");
const truffleAssert = require('truffle-assertions');

// Limit Order Tests
// Parameters: Order.side, Order.ticker, Order.amount, Order.price
contract.skip("Dex", accounts => {

    //The user must have ETH deposited such that deposited eth >= buy order value
    it("user must have enough ETH deposited for a buy order", async () => {
        let dex = await Dex.deployed();

        await truffleAssert.reverts(
            dex.createLimitOrder(0, web3.utils.fromUtf8("ETH"), 5, 2)
        );

        await dex.depositEth(10);
        await truffleAssert.passes(
            dex.createLimitOrder(0, web3.utils.fromUtf8("ETH"), 5, 2)
        );
    });

    //The user must have enough tokens deposited such that token balance >= sell order amount
    it("user must have enough tokens deposited for a sell order", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
        await link.approve(dex.address, 1000);

        await truffleAssert.reverts(
            dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 2)
        );

        await dex.deposit(web3.utils.fromUtf8("LINK"), 10);

        await truffleAssert.passes(
            dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 2)
        );
    });

    //The BUY order book should be ordered on price from highest to lowest starting at index 0
    it("BUY order book should be ordered on price from highest to lowest starting at index 0", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
        await link.approve(dex.address, 1000);

        await dex.depositEth(1000);
        
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 5, 1);
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 5, 3);
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 5, 2);
        await dex.createLimitOrder(0, web3.utils.fromUtf8("LINK"), 5, 5);
        
        let ordersBuy = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 0);
        assert(ordersBuy.length > 0);

        // await console.log(ordersBuy);

        for (let i = 0; i < (ordersBuy.length - 1); i++) {
            assert(ordersBuy[i].price >= ordersBuy[i + 1].price);
        }
    });

    //The SELL order book should be ordered on price from lowest to highest starting at index 0
    it("SELL order book should be ordered on price from lowest to highest starting at index 0", async () => {
        let dex = await Dex.deployed();
        let link = await Link.deployed();

        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address);
        await link.approve(dex.address, 1000);

        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 1);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 3);
        await dex.createLimitOrder(1, web3.utils.fromUtf8("LINK"), 10, 2);
        
        let ordersSell = await dex.getOrderbook(web3.utils.fromUtf8("LINK"), 1);
        assert(ordersSell.length > 0);

        // console.log(ordersSell);

        for (let i = 0; i < (ordersSell.length - 1); i++) {
            assert(ordersSell[i].price <= ordersSell[i + 1].price);
        }
    });
    
});