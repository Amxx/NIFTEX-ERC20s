const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeERC20         } = require('./behaviors/ERC20.behavior');
const { shouldBehaveLikeERC20Burnable } = require('./behaviors/ERC20Burnable.behavior');
const { shouldBehaveLikeERC20Capped   } = require('./behaviors/ERC20Capped.behavior');

const Factory            = contract.fromArtifact('Factory');
const ERC20Initializable = contract.fromArtifact('ERC20Initializable');

describe('ERC20Factory', function () {
	const [ admin, recipient, other ] = accounts;

	const name   = 'InitializableERC20';
	const symbol = 'INIT';
	const cap    = new BN('5000000');
	const amount = new BN('5000');

	before(async function () {
		this.factory = await Factory.new({ from: admin });
		this.master  = await ERC20Initializable.new({ from: admin });
	});

	it('master is locked', async function () {
		await expectRevert(this.master.initialize(admin, 'Test', 'TT', 0), 'ERC20Initializable: already initialized');
	});

	describe('creating new instances', async function () {
		it('can deploy new erc20 through factory', async function () {
			const initdata = this.master.contract.methods.initialize(admin, name, symbol, cap).encodeABI();
			const tx = await this.factory.newInstanceAndCall(this.master.address, initdata);
			console.log(`Cost of deploying a new ERC20: ${tx.receipt.gasUsed}`);
		});
	});

	describe('testing the new instance', async function () {
		beforeEach(async function () {
			const initdata = this.master.contract.methods.initialize(admin, name, symbol, cap).encodeABI();
			const tx = await this.factory.newInstanceAndCall(this.master.address, initdata);
			this.token = await ERC20Initializable.at(tx.receipt.logs.find(({ event }) => event == 'NewInstance').args.instance);
			this.token.transactionHash = tx.receipt.transactionHash;
		});

		it('gas costs', async function () {
			console.log('factory deployment cost:', (await web3.eth.getTransactionReceipt(this.factory.transactionHash)).gasUsed);
			console.log('master  deployment cost:', (await web3.eth.getTransactionReceipt(this.master.transactionHash)).gasUsed);
			console.log('token   deployment cost:', (await web3.eth.getTransactionReceipt(this.token.transactionHash)).gasUsed);
		});

		it('checks', async function () {
			expect(await this.token.name()).to.be.equal(name);
			expect(await this.token.symbol()).to.be.equal(symbol);
			expect(await this.token.decimals()).to.be.bignumber.equal("18");
			expect(await this.token.cap()).to.be.bignumber.equal(cap);
		});

		it('cannot re-initialize', async function () {
			await expectRevert(this.master.initialize(other, name, symbol, cap), 'ERC20Initializable: already initialized');
		});


		describe('Ownable', function () {
			it('has an owner', async function () {
				expect(await this.token.owner()).to.equal(admin);
			});

			describe('transfer ownership', function () {
				it('changes owner after transfer', async function () {
					const receipt = await this.token.transferOwnership(other, { from: admin });
					expectEvent(receipt, 'OwnershipTransferred');

					expect(await this.token.owner()).to.equal(other);
				});

				it('prevents non-owners from transferring', async function () {
					await expectRevert(
						this.token.transferOwnership(other, { from: other }),
						'Ownable: caller is not the owner',
					);
				});

				it('guards ownership against stuck state', async function () {
					await expectRevert(
						this.token.transferOwnership(constants.ZERO_ADDRESS, { from: admin }),
						'Ownable: new owner is the zero address',
					);
				});
			});

			describe('renounce ownership', function () {
				it('loses owner after renouncement', async function () {
					const receipt = await this.token.renounceOwnership({ from: admin });
					expectEvent(receipt, 'OwnershipTransferred');

					expect(await this.token.owner()).to.equal(constants.ZERO_ADDRESS);
				});

				it('prevents non-owners from renouncement', async function () {
					await expectRevert(
						this.token.renounceOwnership({ from: other }),
						'Ownable: caller is not the owner',
					);
				});
			});
		});

		describe('minting', async function () {
			it('admin can mint tokens', async function () {
				const receipt = await this.token.mint(other, amount, { from: admin });
				expectEvent(receipt, 'Transfer', { from: constants.ZERO_ADDRESS, to: other, value: amount });

				expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
			});

			it('other accounts cannot mint tokens', async function () {
				await expectRevert(
					this.token.mint(other, amount, { from: other }),
					'Ownable: caller is not the owner',
				);
			});
		});

		describe('pausing', async function () {
			it('admin can pause', async function () {
				const receipt = await this.token.pause({ from: admin });
				expectEvent(receipt, 'Paused', { account: admin });

				expect(await this.token.paused()).to.equal(true);
			});

			it('admin can unpause', async function () {
				await this.token.pause({ from: admin });

				const receipt = await this.token.unpause({ from: admin });
				expectEvent(receipt, 'Unpaused', { account: admin });

				expect(await this.token.paused()).to.equal(false);
			});

			it('cannot mint while paused', async function () {
				await this.token.pause({ from: admin });

				await expectRevert(
					this.token.mint(other, amount, { from: admin }),
					'ERC20Pausable: token transfer while paused',
				);
			});

			it('other accounts cannot pause', async function () {
				await expectRevert(this.token.pause({ from: other }), 'Ownable: caller is not the owner');
			});
		});

		describe('burning', async function () {
			it('holders can burn their tokens', async function () {
				await this.token.mint(other, amount, { from: admin });

				const receipt = await this.token.burn(amount.subn(1), { from: other });
				expectEvent(receipt, 'Transfer', { from: other, to: constants.ZERO_ADDRESS, value: amount.subn(1) });

				expect(await this.token.balanceOf(other)).to.be.bignumber.equal('1');
			});
		});

		context('openzeppelin ERC20 behavior tests', async function () {
			beforeEach(async function () {
				await this.token.mint(admin, amount, { from: admin });
			});
			shouldBehaveLikeERC20('ERC20', amount, admin, recipient, other);
		});

		context('openzeppelin ERC20Burnable behavior tests', async function () {
			beforeEach(async function () {
				await this.token.mint(admin, amount, { from: admin });
			});
			shouldBehaveLikeERC20Burnable(admin, amount, [ other ]);
		});

		context('openzeppelin ERC20Capped behavior tests', async function () {
			shouldBehaveLikeERC20Capped(admin, [ other ], cap);
		});
	});
});
