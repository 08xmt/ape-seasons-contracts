const { expect } = require("chai");
var fs = require('fs');
require("@nomiclabs/hardhat-ethers");

describe("Tournament buyTicket", function() {

    let TournamentFactory;
    let Tournament;
    let owner;
    let player1;
    let player2;
    let startBlock = 12680000;
    let endBlock = startBlock+1;
    let rawdata = fs.readFileSync('test/daiABI.json');
    let daiABI = JSON.parse(rawdata);
    let ticketPrice = 100;
    let rewardAmount = ticketPrice;
    let TokenWhitelist;
    let RewardDistributor;
    let RewardToken;
    let PrizeStructure;
    const player1Address = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Binance address
    const DAIAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";

    before(async function () {
        startBlock = 12680000;
        await network.provider.request({
          method: "hardhat_reset",
          params: [{
            forking: {
              jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/bd6vuWwj3Ix-uJYkJvNJT1AMcnTjmxBB",
              blockNumber: startBlock
            }
          }]
        });

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [player1Address]}
        );

        player1 = await ethers.provider.getSigner(player1Address);
        [owner,player2] = await ethers.getSigners();
        TokenWhitelistFactory = await ethers.getContractFactory("TokenWhitelist");
        TokenWhitelist = await TokenWhitelistFactory.deploy();
        TournamentFactory = await ethers.getContractFactory("Tournament");
        Dai = await ethers.getContractAt(daiABI, DAIAddress);
        let RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
        let RewardTokenFactory = await ethers.getContractFactory("BananaToken");
        let PrizeStructureFactory = await ethers.getContractFactory("RefundPrizeStructure");
        RewardToken = await RewardTokenFactory.deploy();
        PrizeStructure = await PrizeStructureFactory.deploy(2, 5);
        RewardDistributor = await RewardDistributorFactory.deploy();
        RewardToken.connect(owner).mint(RewardDistributor.address, rewardAmount*1000);
    });

    beforeEach(async function () {
        startBlock = await ethers.provider.getBlockNumber()+5;
        endBlock = startBlock+1;
        Tournament = await TournamentFactory.deploy(
            startBlock,
            endBlock,
            ticketPrice,
            DAIAddress,
            owner.address,
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            TokenWhitelist.address,
            RewardDistributor.address,
            PrizeStructure.address
        );
    });

  it("Correct purchase", async function () {
    Dai.connect(player1).approve(Tournament.address, ticketPrice);
    expect((await Tournament.playerStates(player1._address))["hasTicket"]).to.equal(false);
    await Tournament.connect(player1).buyTicket()
    expect((await Tournament.playerStates(player1._address))["hasTicket"]).to.equal(true);
  });

  it("Already bought ticket", async function () {
    Dai.connect(player1).approve(Tournament.address, 2*ticketPrice);
    expect((await Tournament.playerStates(player1._address))["hasTicket"]).to.equal(false);
    await Tournament.connect(player1).buyTicket();
    expect((await Tournament.playerStates(player1._address))["hasTicket"]).to.equal(true);
    await expect(Tournament.connect(player1).buyTicket()).to.be.revertedWith("Already bought ticket");
    expect((await Tournament.playerStates(player1._address))["hasTicket"]).to.equal(true);
  });

  it("Not enough DAI", async function () {
    Dai.connect(player2).approve(Tournament.address, ticketPrice);
    expect((await Tournament.playerStates(player2.address))["hasTicket"]).to.equal(false);
    await expect( Tournament.connect(player2).buyTicket()).to.be.revertedWith("revert Dai/insufficient-balance");
    expect((await Tournament.playerStates(player2.address))["hasTicket"]).to.equal(false);
  });

  it("Tournament has started", async function () {
    Dai.connect(player1).approve(Tournament.address, ticketPrice);
    //Increment blockchain enough for tournament to start
    ethers.provider.send("evm_mine");
    ethers.provider.send("evm_mine");

    await expect(Tournament.connect(player1).buyTicket()).to.be.revertedWith("Tournament has started");
    expect((await Tournament.playerStates(player2.address))["hasTicket"]).to.equal(false);
  });
});

