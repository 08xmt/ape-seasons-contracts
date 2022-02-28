  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  const linkAddress = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
  const aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b";
  const curveAddress = "0x172370d5cd63279efa6d502dab29171933a610af";
  const whitelistedTokens = [wETHAddress, DAIAddress, maticAddress, wbtcAddress, linkAddress, aaveAddress, curveAddress] //TODO: Automatically fetch newly whitelisted tokens
 

async function liquidateTournament(tournamentAddress, signer){

    //const [deployer] = await ethers.getSigners();
    const deployer = signer;

    console.log(
        "Deployer:",
        deployer.address
    );

    console.log("Entering liquidation function");

    const TournamentFactory = await ethers.getContractFactory("Tournament")
    const tournament = await TournamentFactory.attach(tournamentAddress);
    const isLiquidated  = await tournament.isLiquidated();
    console.log("Tournament is liquidated:", isLiquidated);
    if(isLiquidated){
        return;
    }

    //1. Get a list of whitelisted tokens owned by tournament contract:
    var ownedTokenList = []
    for(const tokenAddress of whitelistedTokens){
        console.log("Fetching token at:", tokenAddress)
        token = await ethers.getContractAt("IERC20", tokenAddress);
        const amountOwned = await token.balanceOf(tournamentAddress);
        console.log("Token balance:", amountOwned);
        if(amountOwned.gt(0)){
            ownedTokenList.push(tokenAddress);
        }
    }

    //2. Create array of minimum payouts
    //TODO: Calculate a reasonable minOut
    const minOutArray = new Array(ownedTokenList.length).fill(1);
    console.log(minOutArray)
    console.log("Liquidating the following tokens:", ownedTokenList);

    liquidationTx = await tournament.connect(deployer).liquidate(ownedTokenList, minOutArray);

    console.log(await liquidationTx.wait())
}

//Should always be called after the liquidation function
async function score(tournamentAddress, signer){

    
    //const [deployer] = await ethers.getSigners();
    deployer = signer;
    const TournamentFactory = await ethers.getContractFactory("Tournament")
    const tournament = await TournamentFactory.attach(tournamentAddress);
 
    console.log("Entering scoring function")
    //1. Get players
    const tradeFilter = tournament.filters.BuyTicket()
    const events = await tournament.queryFilter(tradeFilter);
    var playerScores = []
    var playerTokens = {}
    for(const e of events){
        const player = e.args[0]
        playerTokens[player] = [await tournament.ticketToken()]
        for(const tokenAddress of whitelistedTokens){
            const balance = await tournament.getBalance(player, tokenAddress)
            if(balance.gt(0)){
                playerTokens[player].push(tokenAddress)
            }
        }
        playerScores.push([player, await tournament.calculateScore(player, playerTokens[player])])
    }
    console.log("Player scores:", playerScores)
    console.log("Player tokens:", playerTokens)
    
    //2. Sort players by liquidated value
    playerScores.sort(function(a,b) {
        if(a[1].gt(b[1])){
            return 1
        } else {
            return -1
        }
    })

    var sortedPlayers = playerScores.map((playerArray) => playerArray[0])
    var sortedPlayerTokens = playerScores.map((playerArray) => playerTokens[playerArray[0]])
   
    console.log("Scoring the following players:", sortedPlayers);
    console.log("With the following tokens:", sortedPlayerTokens);
  
    scoreTx = await tournament.connect(deployer).scorePlayers(sortedPlayers, sortedPlayerTokens);
    console.log(await scoreTx.wait())
}

async function main(tournamentAddress, signer) {
    const liquidateTx = await liquidateTournament(tournamentAddress, signer);
    const scoreTx = await score(tournamentAddress, signer);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


