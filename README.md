[Bounty: Minimize the gas cost of deploying many ERC20s](https://gitcoin.co/issue/metalithio/niftex-gr8-hackathon/1/100024098)
===

Overview
---

This proposal uses minimal proxies to reduce the deployment cost of a family of contract. It uses 2 components:

- A generic **Factory** (`contracts/Factory.sol`), that deploys minimal proxy to any *master* address. The master contains the behavior that will be copied by the proxy.
- An **Initializable version of openzeppelin ERC20** (`contract/ERC20Initializable`), that is a copy of openzeppelin ERC20, but with constructors replaced by internal `_initialize` functions.

This life cycle of the solution is expected as follows:
- The `Factory` is deployed once and for all on the network.
	- cost: 202735 gas (once)
- A Master version of the `ERC20Initializable` contract is deployed once.
	- cost: 1388404 gas (once)
- For each new ERC20: call the `Factory` this the address of the master and the content of the initialization function.
	- cost: ~200000 gas (might slightly change depending on the parameters, see remarks)

This workflow can be seen at work in the `test/index.js` file.

Remarks
---

Tests show that it cost 196430 gas units to deploy a token with the following settings:

- name: `InitializableERC20`
- symbol: `INIT`
- cap: `21000000 * 10**18`

Changing the token settings will have an impact on the exact deployment price. For example, a minimal (and useless) token with empty name, empty symbol, and a cap of `0` would only cost 137507 gas to deploy.


In order to keep the deployment cost of each ERC20 down, the proposed `ERC20Initializable` depends on a small initialization. Adding additional features, such as separating the minter and pauser roles, would increasse the initialization (and thus deployment cost). Similarly, emitting events during the initialization phase sligtly increasses the deployment cost. Yet, events like `OwnershipTransferred` were kept as part of the initialization, because we believe the benefit of having them (for auditability sake) does outweight the cost of emitting them. At some point, reducing the gas cost further is a tradeoff against usability of the contract, and we believe we reached a point where removing features for the sake of gas economy does not make sens.

Thanks to the generic nature of the `Factory`, it is easy to deploy a new version of the master contract, and use the same factory to deploy a new family of contracts (ERC20 or different) using this updated logic. This could be usefull to expand the capability (adding ERC20Snapshot for example).

Testing
---

The proposed implementation of the master contract, and the corresponding ERC20 instances, have been tested against OpenZeppelin's ERC20 behavior tests (ERC20, ERC20Capped, ERC20Burnable). Run `yarn test` to checkout the tests.

For test coverage analysis, run `yarn coverage`.

Integration with other smart contracts
---

Anyone, EOA or smart contract, can interract with the ERC20 smart contracts produced by the workflow described above using either the standard ERC20 interface (for native features) or the `ERC20Initializable` interface (for advances feautres such as minting, burning, ownership control ...).

In addition, a smart contract can easyily trigger the instanciation of a new ERC20 contract, and retrieve its address by doing:

```
	function someFunctionThatCreatesAnERC20(...) public {
		/* ... */
		address admin  = <token administrator>;
		string  name   = "NameOfTheToken";
		string  symbol = "Symbol";
		uint256 cap    = <cap>;

		address instance = Factory(<address of the factory>).newInstanceAndCall(<address of the master>, abi.encodeWithSelector(ERC20Initializable.initialize.selector, admin, name, symbol, cap));
		/* ... */
	}
```

or, directly by including the ERC1167 library

```
	function someFunctionThatCreatesAnERC20(...) public {
		/* ... */
		address admin  = <token administrator>;
		string  name   = "NameOfTheToken";
		string  symbol = "Symbol";
		uint256 cap    = <cap>;

		address instance = ERC1167.clone(<address of the master>);
		ERC20Initializable(instance).initialize(admin, name, symbol, cap);
		/* ... */
	}
```

Versions & Frameworks
---

This code is available in solidity `^0.6.0`, with different framework (oz, buidler, hardhat) on the corresponding branches. In addition, it is also available in solidity `^0.7.0` in the `solc-0.7` branch.
