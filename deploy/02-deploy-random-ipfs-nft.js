const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages } = require("../utils/uploadToPinata");
const imagesLoc = "./images/randomNFT";
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //Get the IPFS hashes for each of our NFTs
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenURIs();
  }
  // 1. With our own IPFS node : https://docs.ipfs.io/
  // 2. pinata : https://pinata.cloud/
  // 3. nft.storage : https://nft.storage/
  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subscriptionId;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log("----------------------------------------------------");
  await storeImages(imagesLoc);
  // const args = [
  //   vrfCoordinatorV2Address,
  //   subscriptionId,
  //   networkConfig[chainId].gasLane,
  //   networkConfig[chainId].callbackGasLimit,
  //   //URI
  //   networkConfig[chainId].mintFee,
  // ];
};

async function handleTokenURIs() {
  tokenUris = [];
  //Store the image in IPFS
  //Store the metadata in IPFS
  return tokenUris;
}

module.exports.tags = ["all", "randomNFT", "main"];
