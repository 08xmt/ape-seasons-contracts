async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.deploy(
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
  );
  
  console.log("TournamentFactory address:", TournamentFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
