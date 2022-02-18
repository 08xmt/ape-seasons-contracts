  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  const linkAddress = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
  const aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b";
  const curveAddress = "0x172370d5cd63279efa6d502dab29171933a610af";

 

async function main(){

  const [deployer] = await ethers.getSigners();

  console.log(
    "Buying ticket with account:",
    deployer.address
  );
  

  const tournamentAddress = "0xb2EF2b651EAF3C0c6A5966d9Ae502E7C86cec87e"
  
  const dai = await ethers.getContractAt("ERC20", DAIAddress)
  const TournamentFactory = await ethers.getContractFactory("Tournament")
  const tournament = await TournamentFactory.attach(tournamentAddress);

  console.log("DAI Balance:", await tournament.getBalance(deployer.address, DAIAddress))
  console.log("Whitelist:", await tournament.tokenWhitelist())
  console.log("Trade Token:", await tournament.tradeTokenAddress())
  console.log("Router:", await tournament.sushiRouter())

  const daiAmount = ethers.BigNumber.from(1_000_000_000).mul(100_000_000), //0.1 DAI entry fee
  buyTx = await tournament.connect(deployer).trade(DAIAddress, aaveAddress, daiAmount, 1);
  console.log(await buyTx.wait())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


