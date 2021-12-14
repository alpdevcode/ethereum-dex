pragma solidity ^0.8.0;

import "./Wallet.sol";

contract Dex is Wallet {

    using SafeMath for uint;

    enum Side {
        BUY,
        SELL
    }

    struct Order {
        uint id;
        address trader;
        Side side;
        bytes32 ticker;
        uint amount;
        uint price;
        uint filled;
    }

    mapping(bytes32 => mapping(uint => Order[])) orderBook;

    uint public nextOrderId = 0;

    function getOrderbook(bytes32 ticker, Side side) view public returns(Order[] memory) {
        return orderBook[ticker][uint(side)];
    }

    function createLimitOrder(Side side, bytes32 ticker, uint amount, uint price) public {

        if (side == Side.BUY) {
            require(balances[_msgSender()]["ETH"] >= amount.mul(price));
        } else if (side == Side.SELL) {
            require(balances[_msgSender()][ticker] >= amount);
        }

        Order[] storage orders = orderBook[ticker][uint(side)];
        // Order.filled is by default 0
        orders.push(
            Order(nextOrderId, _msgSender(), side, ticker, amount, price, 0)
        );

        //Sort orderbook with newly added order
        sortOrderbook(side, orders);
        nextOrderId++;
    }

    function createMarketOrder(Side side, bytes32 ticker, uint amount) public {
        
        if (side == Side.SELL) {
            require(balances[_msgSender()][ticker] >= amount, "Not enough token balance to sell");
        }

        uint orderBookSide;
        orderBookSide = (side == Side.BUY ? 1 : 0);

        Order[] storage orders = orderBook[ticker][orderBookSide];

        uint totalFilled;
        uint availableAmount;  // How much we can fill from order[i]
        uint amountFilled;     // Amount filled from an order to be paid and transferred
        uint neededAmount;     // Remaining amount to be filled for a market order

        for (uint256 i = 0; i < orders.length && totalFilled < amount; i++) {

            availableAmount = (orders[i].amount).sub(orders[i].filled);
            neededAmount = amount.sub(totalFilled);

            // Update totalFilled
            if (neededAmount >= availableAmount) {
                amountFilled = availableAmount;
            } else {
                amountFilled = neededAmount;
            }
            totalFilled = totalFilled.add(amountFilled);
            orders[i].filled = (orders[i].filled).add(amountFilled);

            // For better readability, calculate total cost (amount * price)
            uint totalCost = amountFilled.mul(orders[i].price);

            if (side == Side.BUY) {
                // Verify that the buyer has enough ETH to cover the purchase (require)
                require(balances[_msgSender()]["ETH"] >= totalCost);

                // Execute the trade, shift balances between buyer and seller
                balances[_msgSender()]["ETH"] = balances[_msgSender()]["ETH"].sub(totalCost);
                balances[orders[i].trader]["ETH"] = balances[orders[i].trader]["ETH"].add(totalCost);

                balances[_msgSender()][ticker] = balances[_msgSender()][ticker].add(amountFilled);
                balances[orders[i].trader][ticker] = balances[orders[i].trader][ticker].sub(amountFilled);
            } else {
                // Execute the trade, shift balances between seller and buyer
                balances[_msgSender()]["ETH"] = balances[_msgSender()]["ETH"].add(totalCost);
                balances[orders[i].trader]["ETH"] = balances[orders[i].trader]["ETH"].sub(totalCost);
                
                balances[_msgSender()][ticker] = balances[_msgSender()][ticker].sub(amountFilled);
                balances[orders[i].trader][ticker] = balances[orders[i].trader][ticker].add(amountFilled);
            }
        }

        // Loop through the orderbook and delete 100% filled orders, sort, then remove filled orders
        for (uint x = 0; x < orders.length; ) {
            if (orders[x].filled == orders[x].amount) {
                for (uint y = x; y < orders.length - 1; y++) {
                    orders[y] = orders[y + 1];
                }
                orders.pop();
            } else {
                break;
            }
        }
    }

    function sortOrderbook(Side side, Order[] storage orders) private {
        Order memory tempOrder;

        if (side == Side.BUY) {
            // [5,2,3] => [5,3,2]
            for (uint i = orders.length - 1; i > 0; i--) {
                if (orders[i].price > orders[i - 1].price) {
                    tempOrder = orders[i -1];
                    orders[i - 1] = orders[i];
                    orders[i] = tempOrder;
                } else {
                    break;
                }
            }
        } else if (side == Side.SELL) {
            // [2,5,3] = [2,3,5]
            for (uint i = orders.length - 1; i > 0; i--) {
                if (orders[i].price < orders[i - 1].price) {
                    tempOrder = orders[i -1];
                    orders[i - 1] = orders[i];
                    orders[i] = tempOrder;
                } else {
                    break;
                }
            }
        }
    }
}