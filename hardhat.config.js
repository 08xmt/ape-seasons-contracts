require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
let keys = require('./keys.json');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const ALCHEMY_API_KEY = keys["alchemy_api_key"];
const GOERLI_PRIVATE_KEY = keys["goerli_private_key"];

networks: {
  hardhat: {

    forking: {
      url: "https://eth-mainnet.alchemyapi.io/v2/" + ALCHEMY_API_KEY
    }
  }
}

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0"
      },
      {
        version: "0.6.12",
        settings: { } 
      }
    ]
  },
  networks: {
    goerli: {
      url: "https://eth-goerli.alchemyapi.io/v2/" + ALCHEMY_API_KEY,
      accounts: [GOERLI_PRIVATE_KEY]
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [GOERLI_PRIVATE_KEY]
    },
    matic: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/" + ALCHEMY_API_KEY,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  }
};

