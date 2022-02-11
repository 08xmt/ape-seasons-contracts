pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RewardDistributor {

    mapping(address => address) rewardToken;
    mapping(address => uint) rewardAmount;

    address owner;

    constructor(){
        owner = msg.sender;
    }

    function addTournament(address _tournament, address _rewardToken, uint _rewardAmount) external{
        require(owner == msg.sender);
        rewardToken[_tournament] = _rewardToken;
        rewardAmount[_tournament] = _rewardAmount;
    }

    function claim(address claimer) external returns(bool){
        return IERC20(rewardToken[msg.sender]).transfer(claimer, rewardAmount[msg.sender]);
    }

    function getRewardToken(address _tournament) external view returns(address){
        return rewardToken[_tournament];
    }

    function getRewardAmount(address _tournament) external view returns (uint){
        return rewardAmount[_tournament];
    }
}
