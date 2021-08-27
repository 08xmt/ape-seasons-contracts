async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const WhitelistAddress = "0xb05B41faE4B2aF43a35F07f521D5288985A8f631"
  const RewardDistributorAddress = "0x0dea4Be9B1E4f4E8E4cdf53A1d3736Fff0f337C3"
  const PrizeStructureAddress = "0xA728e789f6c65aA75bD77844D0ea81C9c4D43950"
  const FactoryAddress = "0x4Dec879e9D0f4Ec50771039F3B64CB8678Ac07C2"
  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.attach(FactoryAddress);
  const currentBlock = await ethers.provider.getBlockNumber();
  const TournamentDeployTx = await TournamentFactory.connect(deployer).createTournament(
    currentBlock+480,
    currentBlock+3600/15*24*7,
    100_000_000,
    DAIAddress,
    deployer.address,
    RewardDistributorAddress,
    PrizeStructureAddress,
    "Test1"
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
