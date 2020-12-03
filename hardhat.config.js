require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.12",
  settings: {
    optimizer: {
      enabled: true,
      runs: 999,
    },
  },
};
