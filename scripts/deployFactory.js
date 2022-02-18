async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor")
  const RewardDistributor = await RewardDistributorFactory.attach("0x2c7C6794DcE158359407D30a94B64839eCA0b185");
  console.log("Reward Distributor address:", RewardDistributor.address)
  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.deploy(
        "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        "0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597",
        "0x2c7C6794DcE158359407D30a94B64839eCA0b185"
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
