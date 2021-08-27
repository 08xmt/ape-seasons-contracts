async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const WhitelistAddress = "0x63332E03B82B58712e89a80ff932027dCCfc6e1B"
  const WhitelistFactory = await ethers.getContractFactory("TokenWhitelist");
  const Whitelist = WhitelistFactory.attach(WhitelistAddress)
  let tx = await Whitelist.connect(deployer).addToken("0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270")
  console.log("Tx Receipt:", tx);
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
