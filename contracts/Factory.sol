// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ERC1167.sol";

contract Factory
{
    event NewInstance(address instance, address master);

    function newInstance(address master)
    external returns (address instance)
    {
        instance = ERC1167.clone(master);
        emit NewInstance(instance, master);
    }

    function newInstanceAndCall(address master, bytes calldata initdata)
    external returns (address instance)
    {
        instance = ERC1167.clone(master);
        emit NewInstance(instance, master);
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = instance.call(initdata);
        // silent warning about unused variable
        success;
    }
}
