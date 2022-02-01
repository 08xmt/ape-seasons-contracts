async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const WhitelistAddress = "0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597"
  const RewardDistributorAddress = "0xc473337DEDeC604e399EF7e200232C41a6400d80"
  const PrizeStructureAddress = "0xaF69D4fE7ba02C3FeDdDF0fd5d5D5a561Ada64b3"
  const FactoryAddress = "0x026e8caB7C421d755617167791C115521bFdD500"
  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.attach(FactoryAddress);
  const currentBlock = await ethers.provider.getBlockNumber();
  const startBlock = currentBlock + Math.floor(60*60*2*10/21) //Start tournament in two hours
  const endBlock = currentBlock + Math.floor(60*60*24*1*10/21) //End tournament in 1 days
  console.log("Calculating start and end block")
	console.log("start block", startBlock)
	console.log("end block", endBlock)
  const TournamentDeployTx = await TournamentFactory.connect(deployer).createTournament(
    startBlock,
    endBlock,
    ethers.BigNumber.from(1_000_000_000).mul(100_000_000), //0.1 DAI entry fee
    10_000_000,
    DAIAddress,
    deployer.address,
    wethAddress,
    RewardDistributorAddress,
    PrizeStructureAddress,
    "v0.1.1 test4"
  );
  const DeployTxReceipt = await ethers.provider.getTransactionReceipt(TournamentDeployTx.hash);

  console.log("TournamentFactory address:", TournamentFactory.address);
  console.log("Tx Receipt:", TournamentDeployTx);
  const iface = new ethers.utils.Interface(TournamentFactory.abi);
  console.log("Tournament address:", iface.decodeEventLog("CreateTournament", DeployTxReceipt.logs[0].data));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
