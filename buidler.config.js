const fs = require('fs');
const path = require('path');

usePlugin('@nomiclabs/buidler-truffle5');
usePlugin('solidity-coverage');

for (const f of fs.readdirSync(path.join(__dirname, 'buidler'))) {
  require(path.join(__dirname, 'buidler', f));
}

module.exports = {
  solc: {
    version: '0.6.12',
    optimizer: {
      enabled: true,
      runs: 999,
    },
  },
};
