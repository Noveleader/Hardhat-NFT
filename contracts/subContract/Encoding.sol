// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Encoding{
    function combineStrings(string memory a, string memory b) public pure returns(string memory){
        return string(abi.encodePacked(a, b)); //Returns a byte object which is typecasted to string
        //0.8.12+
        //string.concat(stringA, stringB)
        
    }
    /*
        abi.encode() takes a lot of space...
        For example : String "Noveleader" is encoded to 0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a4e6f76656c656164657200000000000000000000000000000000000000000000
        Which is a big big chunk of data to store. 
        So to store smaller data we have encodePacked
        For example : String "Noveleader is encoded to 0x4e6f76656c6561646572
    */

    function encodeNumber() public pure returns(bytes memory)//pure as we are not going to read any on chain stuff
    {
        bytes memory number = abi.encode(1);
        return number;
    }

    //We can encode anything, what encoding does is convert anything to machine readable bytes
    function encodeString() public pure returns(bytes memory){
        bytes memory noveleader = abi.encode("Noveleader");
        return noveleader;
    }

    function encodePackedString() public pure returns(bytes memory){
        bytes memory noveleader = abi.encodePacked("Noveleader");
        return noveleader;
    } // Save a lot of gas here !!

    function encodeStringBytes() public pure returns(bytes memory){
        bytes memory noveleader = bytes("Noveleader");
        return noveleader;
    } // This is going to be similar as encodePackedString() function output

    //We can also decode stuff
    function decodeString() public pure returns(string memory){
        string memory noveleader = abi.decode(encodeString(), (string)); //We are decoding the bytes32 into string back
        return noveleader;
    }

    function multiEncode() public pure returns(bytes memory){
        bytes memory someString = abi.encode("some string", "it's bigger!");
        return someString;
    }

    function multiDecode() public pure returns(string memory, string memory){
        (string memory someString, string memory someOtherString) = abi.decode(multiEncode(), (string, string));
        return (someString, someOtherString);
    }
    
    function multiEncodePacked() public pure returns(bytes memory){
        bytes memory someString = abi.encodePacked("some string", "it's bigger!!");
        return someString;
    }

    /*
    Decoding doesn't work for encode packed
    */

    function multiDecodePacked() public pure returns(string memory){
        string memory someString = abi.decode(multiEncodePacked(), (string));
        return someString;
    }

    function multiStringCastPacked() public pure returns(string memory){
        string memory someString = string(multiEncodePacked());
        return someString;
    }

    // 1. ABI
    // 2. Contract 
    // How do we send txn that call functions with just the data field populated?
    // How do we populate the data field. 

    //Solidity has some more "low-level" keywords, namely "staticcall" and "call".
    //call: How we call functions to change the state of the blockchain.
    //staticcall: This is how (at a low level) we do our "view" or "pure" function calls, NOT CHANGE STATE OF BLOCKCHAIN

    function withdraw(address recentWinner) public {
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        require(success, "Transfer Failed");
    }

    //Here ("") these empty parameter mean we are not passing any data to the function call. 
    // - In our {} we are able to pass specific fields of a txn, like value
    // - In our () we are able to pass data in order to call a specific function - but here there was no option to call that's why ("")
    // We only sent ETH, so we didn't need to call a function!
    // IF we want to call a function, or send any data, we would do in these paranthesis.
    
}