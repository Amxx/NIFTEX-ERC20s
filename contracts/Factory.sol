// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import './ERC1167.sol';

contract Factory
{
    event NewInstance(address instance, address master);

    function newInstance(address master)
    public returns (address instance)
    {
        instance = ERC1167.clone(master);
        emit NewInstance(instance, master);
    }

    function newInstanceAndCall(address master, bytes calldata initdata)
    public returns (address instance)
    {
        instance = ERC1167.clone(master);
        emit NewInstance(instance, master);
        (bool success,) = instance.call(initdata);
        // silent warning about unused variable
        success;
    }
}
