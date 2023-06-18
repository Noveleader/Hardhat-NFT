pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "chai";
import "./../contracts/RandomIpfsNft.sol";

contract RandomIpfsNftTest {
    uint256 private constant MAX_CHOICE = 100;
    uint256 private constant NUM_TESTS = 10;
    uint256 private constant MINT_FEE = 1 ether;

    RandomIpfsNft private rin;

    function beforeEach() public {
        rin = new RandomIpfsNft(
            address(this),
            0,
            bytes32(uint256(keccak256("chainlinkVRF"))),
            100000,
            [
                "https://ipfs.io/ipfs/QmZzvKjJfW3Jz2JzKJ5jJ9J1ZzvKjJfW3Jz2JzKJ5jJ9J1",
                "https://ipfs.io/ipfs/QmZzvKjJfW3Jz2JzKJ5jJ9J2ZzvKjJfW3Jz2JzKJ5jJ9J2",
                "https://ipfs.io/ipfs/QmZzvKjJfW3Jz2JzKJ5jJ9J3ZzvKjJfW3Jz2JzKJ5jJ9J3"
            ],
            MINT_FEE
        );
    }

    function test_requestNft() public payable {
        uint256 balanceBefore = address(this).balance;
        uint256 mintFee = rin.getMintFee();
        uint256 expectedTokenCounter = rin.getTokenCounter() + 1;

        rin.requestNft{value: mintFee}();

        uint256 balanceAfter = address(this).balance;
        uint256 expectedBalanceAfter = balanceBefore - mintFee;
        uint256 actualTokenCounter = rin.getTokenCounter();

        assert.equal(actualTokenCounter, expectedTokenCounter, "Token counter should be incremented by 1");
        assert.equal(balanceAfter, expectedBalanceAfter, "Contract balance should be increased by the mint fee");
    }

    function test_fulfillRandomWords() public {
        uint256[] memory randomWords = new uint256[](NUM_WORDS);
        uint256[] memory requestIds = new uint256[](NUM_TESTS);

        for (uint256 i = 0; i < NUM_TESTS; i++) {
            requestIds[i] = rin.requestNft{value: MINT_FEE}();
        }

        rin.fulfillRandomWords(requestIds[0], randomWords);

        uint256 actualTokenCounter = rin.getTokenCounter();
        breed actualBreed = rin.getBreedFromModdedRng(randomWords[0] % MAX_CHOICE);

        assert.equal(actualTokenCounter, 1, "Token counter should be incremented by 1");
        assert.equal(actualBreed, breed.Pug, "Breed should be Pug");
    }

    function test_withdraw() public {
        uint256 balanceBefore = address(this).balance;
        uint256 mintFee = rin.getMintFee();

        rin.requestNft{value: mintFee}();
        rin.withdraw();

        uint256 balanceAfter = address(this).balance;
        uint256 expectedBalanceAfter = balanceBefore - mintFee;

        assert.equal(balanceAfter, expectedBalanceAfter, "Contract balance should be transferred to the owner");
    }
}