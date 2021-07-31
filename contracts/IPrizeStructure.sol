pragma solidity ^0.8.0;

interface IPrizeStructure {
    function calculateEarnings(uint ticketPrice, uint liquidationAmount, uint numPlayers, uint playerPos) external view returns(uint);
}
