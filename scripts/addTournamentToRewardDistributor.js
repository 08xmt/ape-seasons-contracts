async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Adding tournament with address:",
    deployer.address
  );
  
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const RewardDistributorAddress = "0xc473337DEDeC604e399EF7e200232C41a6400d80";
  const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
  const RewardDistributor = await RewardDistributorFactory.attach(RewardDistributorAddress);
  const AddTournamentTx = await RewardDistributor.connect(deployer).addTournament(
      "0xE6911Ddb5eb8dAB9ac2210d6829ca1B985a3BD13",
      DAIAddress,
      0
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
