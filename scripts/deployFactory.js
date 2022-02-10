async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.deploy(
        "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        "0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597"
  );
  
  console.log("TournamentFactory address:", TournamentFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
