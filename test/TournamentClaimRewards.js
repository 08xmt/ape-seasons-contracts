const { expect } = require("chai");
var fs = require('fs');
require("@nomiclabs/hardhat-ethers");

function incrementBlocknumber(increment){
    for(let i = 0; i < increment; i++){
        ethers.provider.send("evm_mine");
    }
};

async function incrementToStart(Tournament){
    let currentBlock = await ethers.provider.getBlockNumber();
    let startBlock = await Tournament.startBlock();
    incrementBlocknumber(startBlock-currentBlock+1);
};

async function incrementToEnd(Tournament){
    let currentBlock = await ethers.provider.getBlockNumber();
    let endBlock = await Tournament.endBlock();
    incrementBlocknumber(endBlock-currentBlock+1);
};

describe("Tournament claimRewards", function() {

    let TournamentFactory;
    let Tournament;
    let owner;
    let playerWithTicket;
    let playerWithoutTicket;
    let playerWithoutDAI;
    let startBlock = 12680000;
    let ticketPrice = ethers.BigNumber.from("0x152D02C7E14AF6800000");
    let rewardAmount = ticketPrice;
    let endBlock = startBlock+1;
    let rawdata = fs.readFileSync('test/daiABI.json');
    let RewardToken;
    const daiABI = JSON.parse(rawdata);
    let TokenWhitelist;
    let RewardDistributor;
    let PrizeStructure;
    const playerWithTicketAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Binance address
    const DAIAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const wETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const SUSHIAddress = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2";

    before(async function (){
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
            params: [playerWithTicketAddress]}
        );

        TokenWhitelistFactory = await ethers.getContractFactory("TokenWhitelist");
        TokenWhitelist = await TokenWhitelistFactory.deploy();
        playerWithTicket = await ethers.provider.getSigner(playerWithTicketAddress);
        [owner,playerWithDai,playerWithoutTicket] = await ethers.getSigners();
        TournamentFactory = await ethers.getContractFactory("Tournament");
        Dai = await ethers.getContractAt(daiABI, DAIAddress);
        await TokenWhitelist.addToken(DAIAddress);
        await TokenWhitelist.addToken(wETHAddress);
        await TokenWhitelist.addToken(SUSHIAddress);
        let PrizeStructureFactory = await ethers.getContractFactory("RefundPrizeStructure");
        PrizeStructure = await PrizeStructureFactory.deploy(2, 5);
    });

    beforeEach(async function () {
        startBlock = await ethers.provider.getBlockNumber()+15;
        endBlock = startBlock+30;
        await Dai.connect(playerWithTicket).transfer(playerWithDai.address, ticketPrice);
        let RewardTokenFactory = await ethers.getContractFactory("BananaToken");
        let RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
        RewardToken = await RewardTokenFactory.deploy();
        RewardDistributor = await RewardDistributorFactory.deploy();
        await RewardToken.connect(owner).mint(RewardDistributor.address, rewardAmount.mul(1000));
        Tournament = await TournamentFactory.deploy(
            startBlock,
            endBlock,
            ticketPrice,
            DAIAddress,
            owner.address,
            wETHAddress,
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            TokenWhitelist.address,
            RewardDistributor.address,
            PrizeStructure.address
        );
        //await RewardToken.connect(owner).mint(Tournament.address, ticketPrice.mul(1000));
        await Dai.connect(playerWithTicket).approve(Tournament.address, ticketPrice);
        await Dai.connect(playerWithDai).approve(Tournament.address, ticketPrice);
        await Tournament.connect(playerWithTicket).buyTicket();
        await RewardDistributor.addTournament(Tournament.address, RewardToken.address, rewardAmount);
    });

  it("Claim rewards winner", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]]);
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(0);
    await Tournament.connect(playerWithTicket).claimRewards();
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(true);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(rewardAmount);
  });

  it("Claim before withdrawing", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]]);
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(0);
    await Tournament.connect(playerWithTicket).claimRewards();
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(true);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(rewardAmount);
    await expect(Tournament.connect(playerWithTicket).withdrawWinnings(0));
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(true);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(rewardAmount);
  });

  it("Claim rewards loser", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]]);
    expect((await Tournament.playerStates(playerWithDai.address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithDai.address)).to.equal(0);
    await Tournament.connect(playerWithDai).claimRewards();
    expect((await Tournament.playerStates(playerWithDai.address))["hasClaimed"]).to.equal(true);
    expect(await RewardToken.balanceOf(playerWithDai.address)).to.equal(rewardAmount);
  });

  it("Claim before liquidation", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(0);
    await (expect(Tournament.connect(playerWithTicket).claimRewards())).to.revertedWith("Cannot claim rewards before liquidation");
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(0);
  });

  it("Claim rewards winner", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]]);
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(false);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(0);
    await Tournament.connect(playerWithTicket).claimRewards();
    expect((await Tournament.playerStates(playerWithTicket._address))["hasClaimed"]).to.equal(true);
    expect(await RewardToken.balanceOf(playerWithTicket._address)).to.equal(rewardAmount);
    await (expect(Tournament.connect(playerWithTicket).claimRewards())).to.revertedWith("Have already claimed");
  });
});

