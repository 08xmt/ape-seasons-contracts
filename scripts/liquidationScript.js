  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  const linkAddress = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
  const aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b";
  const curveAddress = "0x172370d5cd63279efa6d502dab29171933a610af";

 

//TODO:1. Call liquidation function
async function liquidateTournament(tournamentAddress){

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Entering liquidation function");

  const TournamentFactory = await ethers.getContractFactory("Tournament")
  const tournament = await TournamentFactory.attach(tournamentAddress);
  const tokenArray = [aaveAddress, curveAddress]; //TODO: Write code for retrieving actual tokens that were bought and sold
  const minOutArray = [0,0]; //TODO: Calculate a reasonable minOut
  console.log("Liquidating the following tokens:", tokenArray);

  liquidationTx = await tournament.connect(deployer).liquidate(tokenArray, minOutArray);

  console.log(await liquidationTx.wait())
}

async function score(tournamentAddress){

    const [deployer] = await ethers.getSigners();

    console.log("Entering scoring function")
    const sortedPlayers = ["0x10E7530a7374a19c6476CC99E4D9Eb4d8a61E44A","0x19F45EA63B9d9b864aE2eeE603e7B106Df875754"] //TODO: Write function for sorting players
    const playerTokens = [[DAIAddress, aaveAddress],[DAIAddress, curveAddress]]; //TODO: Write function for getting tokens of players at point of liquidation

    const TournamentFactory = await ethers.getContractFactory("Tournament")
    const tournament = await TournamentFactory.attach(tournamentAddress);
    
    console.log("Scoring the following players:", sortedPlayers);
  
    scoreTx = await tournament.connect(deployer).scorePlayers(sortedPlayers, playerTokens);
    console.log(await scoreTx.wait())
}

async function main() {
    //await liquidateTournament("tournament address");
    await score("0x50d2cfC1e0655267e174A1464D0e7Eb83e965E43");



}

//TODO:2. Calculate scores

//TODO:3. Call scoring function

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


