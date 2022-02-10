async function main() {
  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  const linkAddress = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
  const aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b";
  const curveAddress = "0x172370d5cd63279efa6d502dab29171933a610af";


  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const WhitelistAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
  const WhitelistFactory = await ethers.getContractFactory("TokenWhitelist");
  const Whitelist = WhitelistFactory.attach(WhitelistAddress)
  var tx = await Whitelist.connect(deployer).addToken(maticAddress)
  console.log("Tx Receipt:", tx);
  tx = await Whitelist.connect(deployer).addToken(wETHAddress)
  console.log("Tx Receipt:", tx);
  tx = await Whitelist.connect(deployer).addToken(DAIAddress)
  console.log("Tx Receipt:", tx);
  //console.log(ethers.getContract("TournamentFactory"));
  //const iface = new ethers.utils.Interface(TournamentFactory.abi);
 // console.log("Tournament address:", iface.decodeEventLog("CreateTournament", DeployTxReceipt.logs[0].data));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
