const { expect } = require("chai");

describe("Tournament deployment", function() {
  

    let TournamentFactory;
    let Tournament;
    let signer;
    let owner;
    let TokenWhitelist;
    
    beforeEach(async function () {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x19F45EA63B9d9b864aE2eeE603e7B106Df875754"]}
        );
        signer = await ethers.provider.getSigner("0x364d6D0333432C3Ac016Ca832fb8594A8cE43Ca6");
        [owner] = await ethers.getSigners();
        TokenWhitelistFactory = await ethers.getContractFactory("TokenWhitelist");
        TokenWhitelist = await TokenWhitelistFactory.deploy();
    });

  it("Deployment execute correctly", async function() {

    const startBlock = 12680000;

    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/bd6vuWwj3Ix-uJYkJvNJT1AMcnTjmxBB",
          blockNumber: startBlock
        }
      }]
    });

    const TournamentFactory = await ethers.getContractFactory("Tournament");
    const Tournament = await TournamentFactory.deploy(
        startBlock+2, //Must be +2, as contract deployment happens in startBlock+1
        startBlock+3,
        100,
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        owner.address,
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
        TokenWhitelist.address
    );

    const ticketPrice = await Tournament.ticketPrice();
    expect(await Tournament.ticketPrice()).to.equal(100);
  });
  it("Deployment fail if currentBlock < deployment block", async function() {

    const currentBlock = await ethers.provider.getBlockNumber();
    const signer = await ethers.provider.getSigner("0x364d6D0333432C3Ac016Ca832fb8594A8cE43Ca6")
    const [owner] = await ethers.getSigners();

    const TournamentFactory = await ethers.getContractFactory("Tournament");
    await expect(
        TournamentFactory.deploy(
        currentBlock,
        currentBlock+2,
        100,
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        owner.address,
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
        TokenWhitelist.address
    )).to.be.revertedWith("Startblock lower than deployment block");
  });
  it("Deployment fail if endBlock < startblock", async function() {

    const currentBlock = await ethers.provider.getBlockNumber();

    const signer = await ethers.provider.getSigner("0x364d6D0333432C3Ac016Ca832fb8594A8cE43Ca6")
    const [owner] = await ethers.getSigners();

    const TournamentFactory = await ethers.getContractFactory("Tournament");
    await expect(
        TournamentFactory.deploy(
        currentBlock+2,
        currentBlock+1,
        100,
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        owner.address,
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
        TokenWhitelist.address
    )).to.be.revertedWith("Tournament ends before it starts");
  });
});

