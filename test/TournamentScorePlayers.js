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

describe("Tournament scorePlayers()", function() {

    let TournamentFactory;
    let Tournament;
    let owner;
    let playerWithTicket;
    let playerWithoutTicket;
    let playerWithoutDAI;
    let startBlock = 12680000;
    let ticketPrice = ethers.BigNumber.from("0x152D02C7E14AF6800000");
    let endBlock = startBlock+1;
    let rawdata = fs.readFileSync('test/daiABI.json');
    const daiABI = JSON.parse(rawdata);
    let TokenWhitelist;
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
    });

    beforeEach(async function () {
        startBlock = await ethers.provider.getBlockNumber()+10;
        endBlock = startBlock+20;
        await Dai.connect(playerWithTicket).transfer(playerWithDai.address, ticketPrice);
        Tournament = await TournamentFactory.deploy(
            startBlock,
            endBlock,
            ticketPrice,
            DAIAddress,
            owner.address,
            wETHAddress,
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            TokenWhitelist.address
        );
        await Dai.connect(playerWithTicket).approve(Tournament.address, ticketPrice);
        await Dai.connect(playerWithDai).approve(Tournament.address, ticketPrice);
        await Tournament.connect(playerWithTicket).buyTicket();
    });

  it("Score single player WETH", async function () {
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(Tournament.isScored == false);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address],[[wETHAddress]]);
    expect(Tournament.isScored == true);
  });

  it("Score two players WETH", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(Tournament.isScored == false);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]]);
    expect(Tournament.isScored == true);
  });

  it("Score two players with WETH, SUSHI and DAI", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice.div(2), 1);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, SUSHIAddress, ticketPrice.div(2), 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice.div(2), 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(Tournament.isScored == false);
    await Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress, SUSHIAddress],[wETHAddress, DAIAddress]]);
    expect(Tournament.isScored == true);
  });

  it("Game not liquidated", async function () {
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect(Tournament.isScored == false);
    await expect(Tournament.connect(owner).scorePlayers([playerWithTicket._address],[[wETHAddress]])).to.be.revertedWith("Game not liquidated");
    expect(Tournament.isScored == false);
  });

  it("Input array missing player", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(Tournament.isScored == false);
    await expect(Tournament.connect(owner).scorePlayers([playerWithTicket._address],[[wETHAddress]])).to.be.revertedWith("Not all players accounted for");
    expect(Tournament.isScored == false);
  });

  it("Input arrays not of same length", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[1]);
    expect(Tournament.isScored == false);
    await expect(Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress]])).to.be.revertedWith("Input arrays not of same length");
    expect(Tournament.isScored == false);
  });

  it("Sort two players wrong", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress],[1]);
    expect(Tournament.isScored == false);
    await expect(Tournament.connect(owner).scorePlayers([playerWithDai.address, playerWithTicket._address],[[wETHAddress],[wETHAddress]])).to.be.revertedWith("Player was not correctly sorted");
    expect(Tournament.isScored == false);
  });

  it("Not all token addresses added to scoring array", async function () {
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice.div(2), 1);
    await Tournament.connect(playerWithTicket).trade(DAIAddress, SUSHIAddress, ticketPrice.div(2), 1);
    await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice.div(2), 1);
    await incrementToEnd(Tournament);
    await Tournament.connect(owner).liquidate([wETHAddress, SUSHIAddress],[1,1]);
    expect(Tournament.isScored == false);
    await expect(Tournament.connect(owner).scorePlayers([playerWithTicket._address, playerWithDai.address],[[wETHAddress],[wETHAddress]])).to.be.revertedWith("Score not within threshold");
    expect(Tournament.isScored == false);
  });

});


