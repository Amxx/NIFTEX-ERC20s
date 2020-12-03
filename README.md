[Bounty: Minimize the gas cost of deploying many ERC20s](https://gitcoin.co/issue/metalithio/niftex-gr8-hackathon/1/100024098)
===

Overview
---

This proposal uses minimal proxies to reduce the deployment cost of a family of contract. It uses 2 components:

- A generic **Factory** (`contracts/Factory.sol`), that deploys minimal proxy to any *master* address. The master contains the behavior that will be copied by the proxy.
- An **Initializable version of openzeppelin ERC20** (`contract/ERC20Initializable`), that is a copy of openzeppelin ERC20, but with constructors replaced by internal `_initialize` functions.

This life cycle of the solution is expected as follows:
- The `Factory` is deployed once and for all on the network.
	- cost: 186955 gas (once)
- A Master version of the `ERC20Initializable` contract is deployed once.
	- cost: 1388404 gas (once)
- For each new ERC20: call the `Factory` this the address of the master and the content of the initialization function.
	- cost: ~196364 gas (might slightly change depending on the parameters)

This workflow can be seen at work in the `test/index.js` file.

Remarks
---

In order to keep the deployment cost of each ERC20 down, the proposed `ERC20Initializable` repends on a small initialization. Adding additional features, such as separating the minter and pauser roles, would increasse the initialization (and thus deployment cost).

Thanks to the generic nature of the `Factory`, it is easy to deploy a new version of the master contract, and use the same factory to deploy a new family of contracts (ERC20 or different) using this updated logic. This could be usefull to expand the capability (adding ERC20Snapshot for example).

Testing
---

The proposed implementation of the master contract, and the corresponding ERC20 instances, have been tested against OpenZeppelin's ERC20 behavior tests (ERC20, ERC20Capped, ERC20Burnable). Run `yarn test` to checkout the tests.

Coverage is comming soon.
