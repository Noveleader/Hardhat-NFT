//Here we are going to write some unit tests for DAOboard.sol
const { expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Random IPFS NFT tests.... 🚀🚀", function () {
      let randomNft, deployer, vrfCoordinatorV2Mock, subscriptionId, mintFee, requestId;
      const chainId = network.config.chainId;
      const tokenUris = [
        "ipfs://QmXoNKwExBqXyidtzmqiwBbGeLZpMYS7K2Pcph4TUbDcUx",
        "ipfs://QmcEkTm8465aJQcdhKZ6eap4L1gjNaqD3XKZ7YYqNBETVu",
        "ipfs://QmQeN4DtNx6nVcRHVYoqeqMVGHP7VMg6dgJ3QtQJsnXKna",
      ];
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        randomNft = await ethers.getContract("RandomIpfsNft", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        mintFee = await randomNft.getMintFee();
      });

      describe("Constructor Tests...", async function () {
        it("initializing the contract with correct values", async function () {
          expect(await randomNft.getVrfCoordinatorV2Address()).to.equal(
            vrfCoordinatorV2Mock.address
          );
          //Check for subscription ID
          expect(await randomNft.getGasLane()).to.equal(
            networkConfig[chainId].gasLane
          );
          expect(await randomNft.getMintFee()).to.equal(
            networkConfig[chainId].mintFee
          );
          expect((await randomNft.getCallbackGasLimit()).toString()).to.equal(
            networkConfig[chainId].callbackGasLimit
          );
        });
      });

      describe("Requesting NFT Tests...", async function () {
        it("should revert with the error not enough eth send", async function () {
          await expect(randomNft.requestNft()).to.be.revertedWith(
            "RandomIpfsNft__NeedToSendMoreETH"
          );
        });
        it("should be able to request NFT and generate a random number", async function () {
          const nftRequest = await randomNft.requestNft({
            value: ethers.utils.parseEther("0.01"),
          });
          const tx = await nftRequest.wait();
          requestId = tx.events[1].args.requestId;
          const userAddress = await randomNft.getRequestIdToSender(requestId);
          expect(userAddress).to.equal(deployer);
        });
        it("should emit a requestedNFT event", async function () {
          await expect(
            randomNft.requestNft({
              value: ethers.utils.parseEther("0.01"),
            })
          )
            .to.emit(randomNft, "NftRequested")
        });
      });

      describe("Fulfill Random Words Tests...", async function () {
        it.skip("should be able to fulfill random words", async function () {
          const nftRequest = await randomNft.requestNft({
            value: ethers.utils.parseEther("0.01"),
          });
          const tx = await nftRequest.wait();
          requestId = tx.events[1].args.requestId;
          const fulfillRandomWords = await randomNft.fulfillRandomWords(requestId, randomNft.address);
          await expect(randomNft.getTokenCounter()).to.be.equal(1);
          await expect(fulfillRandomWords)
            .to.emit(randomNft, "NftMinted")
        });
      });

      describe.skip("Minting NFT Tests...", async function () {

      });
      describe("Withdraw Tests...", async function () {
        it("should be able to withdraw and update the balance", async function(){
          const balanceBefore = await ethers.provider.getBalance(deployer);
          await randomNft.withdraw();
          const balanceAfter = await ethers.provider.getBalance(deployer);
          expect(balanceBefore).to.be.gt(balanceAfter);
        })
      });
      
    });
