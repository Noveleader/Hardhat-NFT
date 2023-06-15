//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //This contract have already defined OnlyOwner modifer

error RandomIpfsNft__RangeOutOfBound();
error RandomIpfsNft__NeedToSendMoreETH();
error RandomIpfsNft__TransferFailed();

//Here we are using ERC721URIStorage instead of ERC721 because of _setTokenURI as it provides more customization but it is not the most gas efficient operation.
contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    /**
     * When we mint a new NFT, we will trigger a Chainlink VRF call to get us a random number.
     * Using that number, we will get a random NFT
     * Pug, Shiba Inu, St. Bernard
     * Pug super rare, Shiba Inu rare, St. Bernard common
     * Users have to pay for the NFT
     * Owner should be able to withdraw
     */

    //Type Declaration
    enum breed {
        Pug,
        ShibaInu,
        StBernard
    }
    //Chainlink VRF variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //VRF Helpers
    mapping(uint256 => address) public s_requestIDToSender;

    //NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHOICE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal immutable i_mintFee;

    //Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NFTMinted(breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mint_Fee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("RandomIpfsNft", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mint_Fee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedToSendMoreETH();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIDToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        address dogOwner = s_requestIDToSender[requestId];
        uint256 newItemId = s_tokenCounter;
        //Getting breed of the dog
        uint256 moddedRng = randomWords[0] % MAX_CHOICE; //0-99
        //0-9 Pug
        //10-29 Shiba Inu
        //30-99 St. Bernard
        breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, newItemId);
        _setTokenURI(newItemId, s_dogTokenUris[uint256(dogBreed)]); //We arecasting dogbreed back to unit256 because it is an enum
        emit NFTMinted(dogBreed, dogOwner);
    }

    function getBreedFromModdedRng(
        uint256 moddedRng
    ) public pure returns (breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBound();
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    //Trying to get the rarity part done
    function getChanceArray() public pure returns (uint256[3] memory) {
        /**index1 have 10% chance of happening
         * index2 have 20% chance of happening
         * index3 have 60% chance of happening
         */
        return [10, 30, MAX_CHOICE];
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris() public view returns (string[] memory) {
        return s_dogTokenUris;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
