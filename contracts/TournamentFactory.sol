pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Tournament.sol";
import "./RewardDistributor.sol";

contract TournamentFactory {
    
    address public owner;
    address public sushiRouterAddress;
    address public tokenWhitelist;
    address public rewardDistributor;
    address public gameMaster;

    constructor(address _sushiRouterAddress, address _tokenWhitelist, address _rewardDistributor){
        owner = msg.sender;
        gameMaster = msg.sender;
        sushiRouterAddress = _sushiRouterAddress;
        tokenWhitelist = _tokenWhitelist;
        rewardDistributor = _rewardDistributor;
    }

    function createTournament(
        uint _startBlock,                   //Block at which the tournament starts
        uint _endBlock,                     //Block at which the tournament can be finalized
        uint _ticketPrice,                  //Entry fee for joining tournament
	    uint _apeFee,                       //Take rate for the protocol
        uint _rewardAmount,                 //Amount of reward token to be rewarded to all participants, can be set to 0
        address _ticketToken,               //Token which is used for paying for entry
	    address _tradeTokenAddress,         //Token used for main trading pair in router
        address _rewardToken,               //Token to be awarded to players for participating
        address _prizeStructure,            //Smart contract for determining prize structure
        string calldata name                //Name of the tournament
    ) external returns (address){
        require(msg.sender == owner);
        Tournament newTournament = new Tournament(
            _startBlock,
            _endBlock,
            _ticketPrice,
	        _apeFee,
            _ticketToken,
            gameMaster,
            _tradeTokenAddress,
            sushiRouterAddress,
            tokenWhitelist,
            rewardDistributor,
            _prizeStructure
        );
        RewardDistributor(rewardDistributor).addTournament(address(newTournament), _rewardToken, _rewardAmount);
        emit CreateTournament(_startBlock, _endBlock, _ticketPrice, _rewardAmount, _ticketToken, _rewardToken, address(newTournament), name);
        return address(newTournament);
    }

    function changeOwner(address newOwner) external{
        require(msg.sender == owner);
        owner = newOwner;
    }

    function changeSushiRouterAddress(address newSushiRouterAddress) external{
        require(msg.sender == owner);
        sushiRouterAddress = newSushiRouterAddress;
    }
   
    event CreateTournament(uint startBlock, uint endBlock, uint ticketPrice, uint rewardAmount, address ticketToken, address rewardToken, address tournamentAddress, string name);
}
