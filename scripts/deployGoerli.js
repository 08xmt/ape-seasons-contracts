async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const wETHAddress = "0x0bb7509324ce409f7bbc4b701f932eaca9736ab7";
  const sushiRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
  const DAIAddress = "0xdc31ee1784292379fbb2964b3b9c4124d8f89c60";

  const TournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory");
  const TournamentFactory = await TournamentFactoryFactory.deploy(
        wETHAddress,
        sushiRouterAddress
  );

  const currentBlock = await ethers.provider.getBlockNumber();
  const TournamentDeployTx = await TournamentFactory.connect(deployer).createTournament(
    currentBlock+480,
    currentBlock+3600/15*24*7,
    100_000_000,
    DAIAddress,
    deployer.address
  );
  const DeployTxReceipt = await ethers.provider.getTransactionReceipt(TournamentDeployTx.hash);

  console.log("TournamentFactory address:", TournamentFactory.address);
  console.log("Tx Receipt:", TournamentDeployTx);
  console.log(ethers.getContract("TournamentFactory"));
  const iface = new ethers.utils.Interface(TournamentFactory.abi);
  console.log("Tournament address:", iface.decodeEventLog("CreateTournament", DeployTxReceipt.logs[0].data));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
