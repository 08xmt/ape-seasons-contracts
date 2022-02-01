async function calculateEarnings(tournamentAddress){

  const [deployer] = await ethers.getSigners();

  const TournamentFactory = await ethers.getContractFactory("Tournament")
  const tournament = await TournamentFactory.attach(tournamentAddress);
  const PrizeStructureFactory = await ethers.getContractFactory("RefundPrizeStructure");
  const prizeStructure = await PrizeStructureFactory.attach("0xaF69D4fE7ba02C3FeDdDF0fd5d5D5a561Ada64b3");
  console.log("Player earned the following according to tournament:", (await tournament.calculateEarnings(1)).toString());
  const entry = ethers.BigNumber.from(1000_000_000).mul(ethers.BigNumber.from(1000_000_00));
  const prizePool = entry.mul(2)
  console.log("Player earned the following according to PrizeStructure:", (await prizeStructure.calculateEarnings(entry, prizePool, 2, 0)).toString());
}

async function main() {
    await calculateEarnings("0x50d2cfC1e0655267e174A1464D0e7Eb83e965E43");
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


