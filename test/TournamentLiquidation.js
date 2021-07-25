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

describe("Tournament liquidate()", function() {

    let TournamentFactory;
    let Tournament;
    let owner;
    let playerWithTicket;
    let playerWithoutTicket;
    let playerWithoutDAI;
    let startBlock = 12680000;
    let ticketPrice = 100000;
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
        await Tournament.connect(playerWithTicket).buyTicket();
    });

  it("Liquidate single users WETH", async function () {
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(await Tournament.liquidationAmount() > 0);
    expect(await Tournament.isLiquidated()).to.equal(true);
  });

  it("Liquidate multiple users WETH", async function () {
    await Dai.connect(playerWithDai).approve(Tournament.address, ticketPrice);
    await Tournament.connect(playerWithDai).buyTicket();
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    amountOut += await Tournament.connect(playerWithDai).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(Tournament.liquidationAmount() > 0);
    expect(await Tournament.isLiquidated()).to.equal(true);
  });

  it("Liquidate multiple different tokens WETH, SUSHI", async function (){
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice/2, 1);
    amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, SUSHIAddress, ticketPrice/2, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await Tournament.connect(owner).liquidate([wETHAddress, SUSHIAddress],[0,0]);
    expect(await Tournament.liquidationAmount() > ticketPrice/2);
    expect(await Tournament.isLiquidated()).to.equal(true);
  });   

  it("Liquidate as non-gamemaster", async function () {
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await expect(Tournament.connect(playerWithTicket).liquidate([wETHAddress],[0])).to.be.revertedWith("You are not the game master");
    expect(await Tournament.liquidationAmount()).to.equal(0);
    expect(await Tournament.isLiquidated()).to.equal(false);
  });

  it("Liquidate before game is over", async function () {
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await expect(Tournament.connect(owner).liquidate([wETHAddress],[0])).to.be.revertedWith("Game is not over yet");
    expect(await Tournament.liquidationAmount()).to.equal(0);
    expect(await Tournament.isLiquidated()).to.equal(false);
  });

  it("Liquidate twice", async function () {
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await Tournament.connect(owner).liquidate([wETHAddress],[0]);
    expect(await Tournament.liquidationAmount() > 0);
    expect(await Tournament.isLiquidated()).to.equal(true);
    await expect(Tournament.connect(owner).liquidate([wETHAddress],[0])).to.be.revertedWith("Tokens have already been liquidated");
    expect(await Tournament.isLiquidated()).to.equal(true);
  });

  it("Liquidate liquidation arrays of uneven length", async function (){
    await incrementToStart(Tournament);
    let amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice/2, 1);
    amountOut = await Tournament.connect(playerWithTicket).trade(DAIAddress, SUSHIAddress, ticketPrice/2, 1);
    await incrementToEnd(Tournament);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await expect(Tournament.connect(owner).liquidate([wETHAddress, SUSHIAddress],[0])).to.be.revertedWith("Liquidation arrays must have same amount of elements");
    expect(await Tournament.liquidationAmount()).to.equal(0);
    expect(await Tournament.isLiquidated()).to.equal(false);
    await expect(Tournament.connect(owner).liquidate([wETHAddress, SUSHIAddress],[0,0,0])).to.be.revertedWith("Liquidation arrays must have same amount of elements");
    expect(await Tournament.liquidationAmount()).to.equal(0);
    expect(await Tournament.isLiquidated()).to.equal(false);

  }); 
});

