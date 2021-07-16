pragma solidity ^0.8.0;

contract TokenWhitelist {
    address public owner;
    mapping(address => bool) public tokens;

    constructor(){
        owner = msg.sender;
    }

    function addToken(address token) public{
        require(msg.sender == owner);
        tokens[token] = true;
    }

    function removeToken(address token) public{
        require(msg.sender == owner);
        tokens[token] = false;
    }

    function changeOwner(address newOwner) public{
        require(msg.sender == owner);
        owner = newOwner;
    }

    function isWhitelisted(address token) public view returns(bool){
        return tokens[token];
    }
}
 
