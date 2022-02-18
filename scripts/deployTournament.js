async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const WhitelistAddress = "0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597"
  const PrizeStructureAddress = "0xaF69D4fE7ba02C3FeDdDF0fd5d5D5a561Ada64b3"
  const FactoryAddress = "0x519F6D689F623d11D72e4105Be73740aA6dAc1Ac"
  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.attach(FactoryAddress);
  const currentBlock = await ethers.provider.getBlockNumber();
  const startBlock = currentBlock + Math.floor(60*60*10/21) //Start tournament in 1 hour
  const endBlock = currentBlock + Math.floor(60*60*2*10/21) //End tournament in 2 hours
  console.log("Calculating start and end block")
	console.log("start block", startBlock)
	console.log("end block", endBlock)
  const TournamentDeployTx = await TournamentFactory.connect(deployer).createTournament(
    startBlock,
    endBlock,
    ethers.BigNumber.from(1_000_000_000).mul(100_000_000), //0.1 DAI entry fee 
    10_000_000, //Ape tax
    ethers.BigNumber.from(100_000_000).mul(100_000_000), //0.01 DAI reward amount 
    DAIAddress,  //Ticket token
    wethAddress, //Trade token
    DAIAddress, //Reward token
    PrizeStructureAddress,
    "v0.1.2 Reward Distributor test"
  );
  const DeployTxReceipt = await ethers.provider.getTransactionReceipt(TournamentDeployTx.hash);

  console.log("TournamentFactory address:", TournamentFactory.address);
  console.log("Tx Receipt:", TournamentDeployTx);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
