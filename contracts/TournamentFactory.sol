pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Tournament.sol";

contract TournamentFactory {
    
    address public owner;
    address public sushiRouterAddress;
    address public tokenWhitelist;
    bool public publicCanCreate;

    constructor(address _tradeTokenAddress, address _sushiRouterAddress, address _tokenWhitelist){
        owner = msg.sender;
        sushiRouterAddress = _sushiRouterAddress;
        tokenWhitelist = _tokenWhitelist;
        publicCanCreate = false;
    }

    function createTournament(
        uint _startBlock,
        uint _endBlock,
        uint _ticketPrice,
	uint _apeFee,
        address _ticketToken,
        address _gameMaster,
	address _tradeTokenAddress,
        address _rewardTokenDistributor,
        address _prizeStructure,
        string calldata name
    ) external returns (address){
        if(!publicCanCreate){
            require(msg.sender == owner);
        }
        Tournament newTournament = new Tournament(
            _startBlock,
            _endBlock,
            _ticketPrice,
	    _apeFee,
            _ticketToken,
            _gameMaster,
            _tradeTokenAddress,
            sushiRouterAddress,
            tokenWhitelist,
            _rewardTokenDistributor,
            _prizeStructure
        );
        emit CreateTournament(_startBlock, _endBlock, _ticketPrice, _ticketToken, _tradeTokenAddress, address(newTournament), name);
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

    function changePublicCanCreate(bool newPublicCanCreate) external{
        require(msg.sender == owner);
        publicCanCreate = newPublicCanCreate;
    }
    
    event CreateTournament(uint _startBlock, uint _endBlock, uint _ticketPrice, address _ticketToken, address _tradeToken, address tournamentAddress, string name);

}
