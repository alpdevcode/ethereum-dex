pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/Context.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Context, Ownable {
    
    using SafeMath for uint;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    mapping(bytes32 => Token) public tokenMapping;
    bytes32[] public tokenList;

    mapping(address => mapping (bytes32 => uint)) public balances;

    function addToken(bytes32 ticker, address tokenAddress) external onlyOwner returns(bool) {
        tokenMapping[ticker] = Token(ticker, tokenAddress);
        tokenList.push(ticker);
        return true;
    }

    function deposit(bytes32 ticker, uint amount) external returns(bool) {
        require(tokenMapping[ticker].tokenAddress != address(0));
        
        balances[_msgSender()][ticker] = balances[_msgSender()][ticker].add(amount);

        IERC20(tokenMapping[ticker].tokenAddress).transferFrom(_msgSender(), address(this), amount);
        
        return true;
    }

    function depositEth(uint eth) external {      
        balances[_msgSender()]["ETH"] = balances[_msgSender()]["ETH"].add(eth);
    }

    function withdraw(bytes32 ticker, uint amount) external returns(bool) {
        require(tokenMapping[ticker].tokenAddress != address(0));
        require(balances[_msgSender()][ticker] >= amount);

        balances[_msgSender()][ticker] = balances[_msgSender()][ticker].sub(amount);

        IERC20(tokenMapping[ticker].tokenAddress).transfer(_msgSender(), amount);

        return true;
    }
}