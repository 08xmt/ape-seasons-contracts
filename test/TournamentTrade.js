const { expect } = require("chai");
require("@nomiclabs/hardhat-ethers");

function incrementBlocknumber(increment){
    for(let i = 0; i < increment; i++){
        ethers.provider.send("evm_mine");
    }
};

describe("Tournament Trade", function() {

    let TournamentFactory;
    let Tournament;
    let owner;
    let playerWithTicket;
    let playerWithoutTicket;
    let playerWithoutDAI;
    let startBlock = 12680000;
    let ticketPrice = 100000;
    let apeFee = 100_000_000; //10%	
    let rewardAmount = ticketPrice;
    let endBlock = startBlock+1;
    let TokenWhitelist;
    let RewardDistributor;
    let RewardToken;
    let PrizeStructure;
    const playerWithTicketAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC"; //Binance address
    const DAIAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const wETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

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
        Dai = await ethers.getContractAt("IERC20", DAIAddress);
        await TokenWhitelist.addToken(DAIAddress);
        await TokenWhitelist.addToken(wETHAddress);
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
        endBlock = startBlock+3;
        Tournament = await TournamentFactory.deploy(
            startBlock,
            endBlock,
            ticketPrice,
	    apeFee,
            DAIAddress,
            owner.address,
            wETHAddress,
            "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
            TokenWhitelist.address,
            RewardDistributor.address,
            PrizeStructure.address

        );
        await Dai.connect(playerWithTicket).approve(Tournament.address, ticketPrice);
        await RewardDistributor.connect(owner).addTournament(Tournament.address, RewardToken.address, rewardAmount)
        await Tournament.connect(playerWithTicket).buyTicket();
    });

  it("Trade Dai for wETH successfully", async function () {
    //Increment blocknumber twice to start game
    incrementBlocknumber(2);
    expect((await Tournament.getBalance(playerWithTicket._address, DAIAddress)).eq(ticketPrice));
    await Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1);
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(0);
    expect((await Tournament.getBalance(playerWithTicket._address, wETHAddress)).gt(0));
  });

  it("Trade before game has started", async function () {
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
    await expect(Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1)).to.be.revertedWith("Game hasn't started");
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
  });

  it("Trade after game has ended", async function () {
    //Increment blocknumber 4 times to reach end block
    incrementBlocknumber(4);
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
    await expect(Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1)).to.be.revertedWith("Game has ended");
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
  });

  it("Trade without ticket", async function () {
    incrementBlocknumber(2);
    Dai.connect(playerWithTicket).transfer(playerWithoutTicket.address, ticketPrice);
    expect(await Tournament.getBalance(playerWithoutTicket.address, DAIAddress)).to.equal(0);
    await expect(Tournament.connect(playerWithoutTicket).trade(DAIAddress, wETHAddress, ticketPrice, 1)).to.be.revertedWith("Insufficient funds");
    expect(await Tournament.getBalance(playerWithoutTicket.address, DAIAddress)).to.equal(0);
  });

  it("Trade more than owned", async function () {
    incrementBlocknumber(2);
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
    await expect(Tournament.connect(playerWithTicket).trade(DAIAddress, wETHAddress, ticketPrice+1, 1)).to.be.revertedWith("Insufficient funds");
    expect(await Tournament.getBalance(playerWithTicket._address, DAIAddress)).to.equal(ticketPrice);
  });

  it("Trade token not owned", async function () {
    incrementBlocknumber(2);
    expect(await Tournament.getBalance(playerWithTicket._address, wETHAddress)).to.equal(0);
    await expect(Tournament.connect(playerWithTicket).trade(wETHAddress, DAIAddress, ticketPrice+1, 1)).to.be.revertedWith("Insufficient funds");
    expect(await Tournament.getBalance(playerWithTicket._address, wETHAddress)).to.equal(0);
  });

  it("Trade token not owned", async function () {
    incrementBlocknumber(2);
    expect(await Tournament.getBalance(playerWithTicket._address, wETHAddress)).to.equal(0);
    await expect(Tournament.connect(playerWithTicket).trade(wETHAddress, DAIAddress, ticketPrice+1, 1)).to.be.revertedWith("Insufficient funds");
    expect(await Tournament.getBalance(playerWithTicket._address, wETHAddress)).to.equal(0);
  });

});

