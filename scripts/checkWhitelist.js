async function main() {

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const wETHAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const DAIAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
  const maticAddress = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
  const wbtcAddress = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
  const linkAddress = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
  const aaveAddress = "0xd6df932a45c0f255f85145f286ea0b292b21c90b";
  const curveAddress = "0x172370d5cd63279efa6d502dab29171933a610af";

  const tournamentFactoryFactory = await ethers.getContractFactory("TournamentFactory")  
  const tournamentFactory = await tournamentFactoryFactory.attach("0xBA71a2408F35C782908A558e3C8Dd18D20d9fbdA");
  const tournamentContractFactory = await ethers.getContractFactory("Tournament")
  const tournament = await tournamentContractFactory.attach("0xEBacF57f0Edd9263a9efB421770F9f6B510f0468")
    
  console.log("TournamentFactory Whitelist address:", (await tournamentFactory.tokenWhitelist()));
  console.log("Tournament Whitelist address:", (await tournament.tokenWhitelist()));

  const WhiteListFactory = await ethers.getContractFactory("TokenWhitelist")
  const whitelist = await WhiteListFactory.attach("0xED056bE2b65455Fe27a2B228DdcCBce3BCcD4597");
  console.log("Checking tokens")
  console.log("weth is whitelisted:", (await whitelist.isWhitelisted(wETHAddress)));
  console.log("DAI is whitelisted:", (await whitelist.isWhitelisted(DAIAddress)));
  console.log("matic is whitelisted:", (await whitelist.isWhitelisted(maticAddress)));
  console.log("link is whitelisted:", (await whitelist.isWhitelisted(linkAddress)));
  console.log("Aave is whitelisted:", (await whitelist.isWhitelisted(aaveAddress)));
  console.log("curve is whitelisted:", (await whitelist.isWhitelisted(curveAddress)));

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

