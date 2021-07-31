pragma solidity ^0.8.0;
import "./IPrizeStructure.sol";

contract RefundPrizeStructure is IPrizeStructure {
    
    uint public refundDivisor; //Portion of the prizepool that will go to refunds
    uint public individualDivisor; //Portion of players that will qualify for individual prizes
    constructor(uint _refundDivisor, uint _individualDivisor){
        refundDivisor = _refundDivisor;
        individualDivisor = _individualDivisor;
    }

    function calculateEarnings(uint ticketPrice, uint prizePool, uint numPlayers, uint playerPos) external view override returns(uint){
        if(numPlayers == 1){
            return prizePool;
        }
        uint refundPool = prizePool/refundDivisor;
        uint individualPool = prizePool-refundPool;
        uint playersToRefund = refundPool/ticketPrice;
        if(playersToRefund == 0){
            playersToRefund = 1;
        }
        uint individualWinners = numPlayers/individualDivisor;
        if(individualWinners == 0){
            individualWinners = 1;
        }

        uint refundAmount = refundPool/playersToRefund;

        if(playerPos < individualWinners){
            return individualPool/(2**(playerPos+1)) + refundAmount + (individualPool/(2**(individualWinners))/individualWinners);
        }else if(playerPos < playersToRefund){
            return refundAmount;
        } else {
            return 0;
        }
    }
}
