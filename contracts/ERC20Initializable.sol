// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./initializable/Ownable.sol";
import "./initializable/ERC20.sol";
import "./initializable/ERC20Burnable.sol";
import "./initializable/ERC20Capped.sol";
import "./initializable/ERC20Pausable.sol";

contract ERC20Initializable is
    Ownable,
    ERC20,
    ERC20Burnable,
    ERC20Capped,
    ERC20Pausable
{
    bool internal _initialized;

    constructor()
    public
    {
        _initialized = true;
    }

    function initialize(
        address       admin_,
        string memory name_,
        string memory symbol_,
        uint256       cap_
    )
    public
    {
        require(!_initialized, "ERC20Initializable: already initialized");
        _initialized = true;
        Ownable._initializeOwnable(admin_);
        ERC20._initializeERC20(name_, symbol_);
        ERC20Capped._initializeERC20Capped(cap_);
    }

    function mint(address to, uint256 amount)
    public virtual onlyOwner()
    {
        _mint(to, amount);
    }

    function pause()
    public virtual onlyOwner()
    {
        _pause();
    }

    function unpause()
    public virtual onlyOwner()
    {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
    internal virtual override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
