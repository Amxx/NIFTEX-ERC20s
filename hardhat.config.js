require("@nomiclabs/hardhat-truffle5");
require("solidity-coverage");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.5",
  settings: {
    optimizer: {
      enabled: true,
      runs: 999,
    },
  },
};
