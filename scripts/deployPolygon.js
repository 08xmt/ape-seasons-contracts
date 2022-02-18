async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const sushiRouterAddress = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const WhitelistAddress = "0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597"

  /*const WhiteListFactory = await ethers.getContractFactory("TokenWhitelist")
  const Whitelist = await WhiteListFactory.deploy();
  console.log("Token Whitelist address:", Whitelist.address)
  */
  const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor")
  const RewardDistributor = await RewardDistributorFactory.deploy();
  console.log("Reward Distributor address:", RewardDistributor.address)
  /*
  const RefundPrizeStructureFactory = await ethers.getContractFactory("RefundPrizeStructure")
  const RefundPrizeStructure = await RefundPrizeStructureFactory.deploy(2,5)
  */
  //console.log("Refund Prize Structure address:", RefundPrizeStructure.address)
  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.deploy(
        sushiRouterAddress,
        WhitelistAddress,
        RewardDistributor.address
  );
  console.log("TournamentFactory address:", TournamentFactory.address);
  ownerTx = await RewardDistributor.connect(deployer).addOwner(TournamentFactory.address);
  console.log(await ownerTx.wait())
  console.log("TournamentFactory is owner:", await RewardDistributor.isOwner(TournamentFactory.address))
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
