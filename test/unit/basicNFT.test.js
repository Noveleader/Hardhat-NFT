const { assert, expect } = require("chai");
require("dotenv").config();
const { deployments, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFTs Unit Test", function () {
      let basicNFT, basicNftInstance, owner;
      beforeEach(async function () {
        await deployments.fixture();
        basicNFT = await ethers.getContractFactory("BasicNFT");
        basicNftInstance = await basicNFT.deploy();
        await basicNftInstance.deployed();
        [owner] = await ethers.getSigners();
      });
      describe("Constructor Test", async function () {
        it("Checks if the name of NFT is right or not", async function () {
          const name = await basicNftInstance.name();
          const symbol = await basicNftInstance.symbol();
          assert.equal(name, "Dogie");
          assert.equal(symbol, "DOG");
        });
        it("Checks if token counter is set to 0 or not", async function () {
          const tokenCounter = await basicNftInstance.getTokenCounter();
          expect(tokenCounter).to.equal(0);
        });
      });

      describe("Minting Test", async function () {
        it("Checks if token counter is incremented or not", async function () {
          await basicNftInstance.mintNft();
          const tokenCounter = await basicNftInstance.getTokenCounter();
          expect(tokenCounter).to.equal(1);
        });
      });

      it("returns the correct token URI", async function () {
        const tokenURI = await basicNftInstance.tokenURI(0);
        expect(tokenURI).to.equal(process.env.TOKEN_URI);
      });

      it("checks if the NFT is minted or not", async function () {
        const ownerAddress = owner.address;
        await basicNftInstance.mintNft();
        const ownerOfNFT = await basicNftInstance.ownerOf(0);
        const balance = await basicNftInstance.balanceOf(ownerAddress);
        expect(ownerOfNFT).to.equal(ownerAddress);
        expect(balance).to.equal(1);
      });
    });
