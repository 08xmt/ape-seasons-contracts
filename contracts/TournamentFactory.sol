pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Tournament.sol";

contract TournamentFactory {
    
    address public owner;
    address public wethAddress;
    address public sushiRouterAddress;
    address public tokenWhitelist;
    bool public publicCanCreate;

    constructor(address _wethAddress, address _sushiRouterAddress, address _tokenWhitelist){
        owner = msg.sender;
        wethAddress = _wethAddress;
        sushiRouterAddress = _sushiRouterAddress;
        tokenWhitelist = _tokenWhitelist;
        publicCanCreate = false;
    }

    function createTournament(
        uint _startBlock,
        uint _endBlock,
        uint _ticketPrice,
        uint _rewardTokenAmount,
        address _ticketToken,
        address _gameMaster,
        address _rewardToken,
        address _rewardTokenDistributor,
        string calldata name
    ) external returns (address){
        if(!publicCanCreate){
            require(msg.sender == owner);
        }
        Tournament newTournament = new Tournament(
            _startBlock,
            _endBlock,
            _ticketPrice,
            _rewardTokenAmount,
            _ticketToken,
            _gameMaster,
            wethAddress,
            sushiRouterAddress,
            tokenWhitelist,
            _rewardToken,
            _rewardTokenDistributor
        );
        emit CreateTournament(_startBlock, _endBlock, _ticketPrice, _ticketToken, address(newTournament), name);
        return address(newTournament);
    }

    function changeOwner(address newOwner) external{
        require(msg.sender == owner);
        owner = newOwner;
    }

    function changeWethAddress(address newWethAddress) external{
        require(msg.sender == owner);
        wethAddress = newWethAddress;
    }

    function changeSushiRouterAddress(address newSushiRouterAddress) external{
        require(msg.sender == owner);
        sushiRouterAddress = newSushiRouterAddress;
    }

    function changePublicCanCreate(bool newPublicCanCreate) external{
        require(msg.sender == owner);
        publicCanCreate = newPublicCanCreate;
    }
    
    event CreateTournament(uint _startBlock, uint _endBlock, uint _ticketPrice, address _ticketToken, address tournamentAddress, string name);

}
