const { expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const fs = require("fs");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Dynamic NFT tests.... 🚀🚀", function () {
      let deployer, dynamicNft, vrfAggregator;
      const lowSVG = fs.readFileSync("./images/dynamicNFT/frown.svg", {
        encoding: "utf8",
      });
      const highSVG = fs.readFileSync("./images/dynamicNFT/happy.svg", {
        encoding: "utf8",
      });
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        dynamicNft = await ethers.getContract("DynamicSvgNft", deployer);
        vrfAggregator = await ethers.getContract("MockV3Aggregator", deployer);
      });
      describe("Constructor Tests...", async function () {
        it("initializing the contract with correct values", async function () {
          expect(await dynamicNft.getTokenCounter()).to.equal(0);
        });
      });

      describe("Other function tests...", async function () {
        it("svg to image uri test", async function () {
          expect(await dynamicNft.svgToImageUri(lowSVG)).to.equal(
            await dynamicNft.getLowImageURI()
          );
          expect(await dynamicNft.svgToImageUri(highSVG)).to.equal(
            await dynamicNft.getHighImageURI()
          );
        });

        it("mint the NFT correctly", async function () {
          const minting = await dynamicNft.mintNft(10);
          expect(await dynamicNft.getHighValue(0)).to.equal(10); 
          expect(await dynamicNft.getTokenCounter()).to.equal(1);
          expect(minting).to.emit("CreatedNFT");
        })

        it("get the correct token URI", async function () {});
      });
    });
