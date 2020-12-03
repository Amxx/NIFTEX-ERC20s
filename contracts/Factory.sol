// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/proxy/UpgradeableProxy.sol";

contract Factory
{
    event NewInstance(address instance, address master);

    function clone(address master)
    internal returns (address instance)
    {
        bytes20 packed = bytes20(master);
        assembly {
          let code := mload(0x40)
          mstore(code, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
          mstore(add(code, 0x14), packed)
          mstore(add(code, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
          instance := create(0, code, 0x37)
        }
        emit NewInstance(instance, master);
    }

    function newInstance(address master)
    public returns (address instance)
    {
        instance = clone(master);
    }

    function newInstanceAndCall(address master, bytes calldata initdata)
    public returns (address instance)
    {
        instance = clone(master);
        (bool success,) = instance.call(initdata);
        // silent warning about unused variable
        success;
    }
}
