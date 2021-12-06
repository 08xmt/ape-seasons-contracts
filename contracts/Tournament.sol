pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./uniswapv2/interfaces/IUniswapV2Router01.sol";
import "./TokenWhitelist.sol";
import "./IPrizeStructure.sol";
import "./RewardDistributor.sol";

contract Tournament {

    struct playerState {
        bool hasTicket;
        bool hasWithdrawn;
        bool hasClaimed;
    }
    uint public immutable startBlock; //Block at which the game starts
    uint public immutable endBlock; //Block at which the game ends
    uint public immutable apeFee;
    address public immutable tradeTokenAddress; //Address for wrapped ether. Used for sushi/uni routing.
    IERC20 public immutable ticketToken; //Token used for buying tickets. Will be Unit of Account of game
    IUniswapV2Router01 public immutable sushiRouter; //Sushi router used for making trades
    TokenWhitelist public immutable tokenWhitelist; //Tokens which are allowed to be traded - Used to guard against cheating.
    uint public ticketPrice; //Price of entry into the game
    uint public playerCount = 0; 
    uint public liquidationAmount = 0; //The amount that has been successfully liquidated
    uint DECIMALS = 1000_000_000; // 1000_000 = 0.1%
    address public gameMaster; //Address of the game master. Can call liquidation and scoring functions
    address[] public standing; //Sorted standing of player addresses
    IPrizeStructure public prizeStructure; //Reusable contract governing prizepool payouts
    RewardDistributor public rewardDistributor; //Address holding reward tokens

    mapping(address => playerState) public playerStates; //Booleans showing if a player has bought a ticket, withdrawn or claimed

    mapping(address => mapping(address => uint)) public playerBalances; //Player address to token address to balance map
    mapping(address => uint) public liquidationRatio; //The ratio at which a specific token was liquidated with 9 decimal accuracy

    mapping(address => bool) public hasBeenCounted;

    constructor(
        uint _startBlock, 
        uint _endBlock, 
        uint _ticketPrice, 
	uint _apeFee,
        address _ticketTokenAddress,
        address _gameMaster,
        address _tradeTokenAddress,
        address _sushiRouterAddress,
        address _tokenWhitelist,
        address _rewardDistributor,
        address _prizeStructureAddress
    ){
        require(block.number < _startBlock, "Startblock lower than deployment block");
        require(_startBlock < _endBlock, "Tournament ends before it starts");
        startBlock = _startBlock;
        endBlock = _endBlock;
        ticketPrice = _ticketPrice;
	apeFee = _apeFee;
        ticketToken = IERC20(_ticketTokenAddress);
        gameMaster = _gameMaster;
        tradeTokenAddress = _tradeTokenAddress;
        sushiRouter = IUniswapV2Router01(_sushiRouterAddress);
        tokenWhitelist = TokenWhitelist(_tokenWhitelist);
        rewardDistributor = RewardDistributor(_rewardDistributor);
        prizeStructure = IPrizeStructure(_prizeStructureAddress);
        emit Deploy(_startBlock, _endBlock, ticketPrice);
    }

    /**

    * Function caller buys a ticket for entering the tournament.

    */
    function buyTicket() external {
        require(block.number < startBlock, "Tournament has started");
        require(!playerStates[msg.sender].hasTicket, "Already bought ticket");
        require(ticketToken.transferFrom(msg.sender, address(this), ticketPrice), "Transfer failed");
        playerStates[msg.sender].hasTicket = true;
        playerBalances[msg.sender][address(ticketToken)] = ticketPrice;
        playerCount += 1;
        emit BuyTicket(msg.sender);
    }

    /**
     * Trade 'amountIn' of 'tokenIn' for a minimum of 'amountOutMin' of 'tokenOut'
     * Returns the amount of 'tokenOut' successfully bought.
    */
    function trade(address tokenIn, address tokenOut, uint amountIn, uint amountOutMin) external returns(uint) {
        require(playerBalances[msg.sender][tokenIn] >= amountIn, "Insufficient funds");
        require(block.number > startBlock, "Game hasn't started");
        require(block.number < endBlock, "Game has ended");
        require(tokenWhitelist.isWhitelisted(tokenOut));

        uint256 amountOut = tradeExact(tokenIn, tokenOut, amountIn, amountOutMin);

        playerBalances[msg.sender][tokenIn] = playerBalances[msg.sender][tokenIn] - amountIn;
        playerBalances[msg.sender][tokenOut] = playerBalances[msg.sender][tokenOut] + amountOut;
        emit Trade(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    /**
    * Liquidate all the tokens that have been bought in the tournament for the unit of account.

    * The function is fed an array of token addresses, and an array of corresponding size, with the amount expected on liquidation.

    *TODO: Add guard against leaving out owned tokens from liquidation

    */
    function liquidate(address[] calldata tokens, uint[] calldata amountOutMin) external {
        require(msg.sender == gameMaster, "You are not the game master");
        require(block.number > endBlock, "Game is not over yet");
        require(!isLiquidated(), "Tokens have already been liquidated");
        require(tokens.length == amountOutMin.length, "Liquidation arrays must have same amount of elements");
        for(uint i = 0; i < tokens.length; i++){
            uint amountIn = IERC20(tokens[i]).balanceOf(address(this));
            uint amountOut = tradeExact(tokens[i], address(ticketToken), amountIn, amountOutMin[i]);
            liquidationAmount += amountOut;
            liquidationRatio[tokens[i]] = amountOut*DECIMALS/amountIn;
        }
    }

    /**
     * Internal function for doing exact swaps

     * Trade 'amountIn' of 'tokenIn' for a minimum of 'amountOutMin' of 'tokenOut'

     * Returns the amount of 'tokenOut' successfully bought.

     * Currently assumes a simple routing of 'tokenIn' => WETH => 'tokenOut' to always be the most efficient.
     * TODO: Update with more advanced routing.
    */
    function tradeExact(address tokenIn, address tokenOut, uint amountIn, uint amountOutMin) internal returns (uint){
        address[] memory path;
        if(tokenIn == tradeTokenAddress || tokenOut == tradeTokenAddress){ //If trading for tradeToken, can use simple route.
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = tokenOut;
        } else {
            path = new address[](3); // Else step from 'tokenIn' => tradeToken => 'tokenOut'
            path[0] = tokenIn;
            path[1] = tradeTokenAddress;
            path[2] = tokenOut;
        }
        IERC20(tokenIn).approve(address(sushiRouter), amountIn);
        uint amountOut = sushiRouter.swapExactTokensForTokens(amountIn, amountOutMin, path, address(this), type(uint256).max)[path.length-1];
        return amountOut;
    }
    /**

    *Helper function for changing the gameMaster address to '_newGamemaster' adress.

    */
    function changeGamemaster(address _newGamemaster) external {
        require(msg.sender == gameMaster);
        gameMaster = _newGamemaster;
    }
    /**

     *Caculate the score of '_playerAddress' by going through the '_tokens' and tallying up the liquidationRatio

    */
    function calculateScore(address _playerAddress, address[] calldata _tokens) internal view returns(uint){
        uint score = 0;
        for(uint i = 0; i < _tokens.length; i++){
            require(!hasBeenCounted[_tokens[i]]); //Make sure mapping is destroyed and rebuilt on each function call
            hasBeenCounted[_tokens[i]];
            score += liquidationRatio[_tokens[i]]*playerBalances[_playerAddress][_tokens[i]];
        }
        return score/DECIMALS;
    }

    /**

    *Takes a sorted array of player addresses

    */
    function scorePlayers(address[] calldata _sortedPlayers, address[][] calldata _playerTokens) public{
        require(msg.sender == gameMaster, "Caller not gameMaster");
        require(isLiquidated(), "Game not liquidated");
        require(_sortedPlayers.length == playerCount, "Not all players accounted for");
        require(_sortedPlayers.length == _playerTokens.length, "Input arrays not of same length");
        uint previousPlayer = type(uint256).max;
        uint totalScore = 0;

        for(uint i=0; i < _sortedPlayers.length; i++){
            require(playerStates[_sortedPlayers[i]].hasTicket, "Address do not have a ticket");
            uint score = calculateScore(_sortedPlayers[i], _playerTokens[i]);
            require(previousPlayer >= score, "Player was not correctly sorted");

            previousPlayer = score;
            totalScore += score;
        }
        //0.0001% Threshold to account for rounding errors
        require(liquidationAmount < totalScore*10001/10000, "Score not within threshold");
        require(liquidationAmount > totalScore*9999/10000, "Score not within threshold");
        standing = _sortedPlayers;
        emit GameFinalized();
    }

    function calculateEarnings(uint playerPosition) public view returns(uint){
        require(isLiquidated(), "Game not liquidated");
        return prizeStructure.calculateEarnings(ticketPrice, getPrizePool(liquidationAmount), playerCount, playerPosition);
    }

    function withdrawWinnings(uint playerPos) public returns(uint) {
        require(isScored(), "Tournament not scored yet");
        require(!playerStates[msg.sender].hasWithdrawn, "Have already withdrawn");
        require(standing[playerPos] == msg.sender, "Incorrect standing");
        playerStates[msg.sender].hasWithdrawn = true;
        uint earnings = this.calculateEarnings(playerPos);
        require(ticketToken.transfer(msg.sender, earnings), "Token tx failed");
        if(!playerStates[msg.sender].hasClaimed){
            claimRewards();
        }
        emit WithdrawWinnings(msg.sender, earnings);
        return earnings;
    }

    function claimRewards() public {
        require(isLiquidated(), "Cannot claim rewards before liquidation");
        require(!playerStates[msg.sender].hasClaimed, "Have already claimed");
        playerStates[msg.sender].hasClaimed = true;
        require(rewardDistributor.claim(msg.sender));
        emit ClaimRewards(msg.sender, rewardDistributor.getRewardToken(), rewardDistributor.getRewardAmount()); 
    }

    function getBalance(address player, address token) public view returns(uint){
        return playerBalances[player][token];
    }

    function getPrizePool(uint _liquidationAmount) public view returns(uint){
        return (_liquidationAmount - _liquidationAmount)*DECIMALS/apeFee;
    }

    function isScored() public view returns(bool){
        return standing.length > 0;
    }

    function isLiquidated() public view returns(bool){
        return liquidationAmount > 0;
    }

    event Deploy(uint startBlock, uint endBlock, uint ticketPrice);

    event BuyTicket(address player);

    event Trade(address player, address from, address to, uint amountFrom, uint amountTo);

    event GameFinalized();

    event WithdrawWinnings(address player, uint winnings);

    event ClaimRewards(address player, address token, uint rewardAmount);
}
