const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages, storeMetadata } = require("../utils/uploadToPinata");
const imagesLoc = "./images/randomNFT";
require("dotenv").config();

const tokenUris = [
  "ipfs://QmXoNKwExBqXyidtzmqiwBbGeLZpMYS7K2Pcph4TUbDcUx",
  "ipfs://QmcEkTm8465aJQcdhKZ6eap4L1gjNaqD3XKZ7YYqNBETVu",
  "ipfs://QmQeN4DtNx6nVcRHVYoqeqMVGHP7VMg6dgJ3QtQJsnXKna",
];
const fundAmount = ethers.utils.parseEther("0.01");
const metadataTemplate = {
  //different stats for each NFT
  nftName: "",
  nftDescription: "",
  nftImage: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};
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
  let vrfCoordinatorV2Address, vrfCoordinatorV2Mock
    subscriptionId = null;

  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, fundAmount);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log("----------------------------------------------------");
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ];

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  await vrfCoordinatorV2Mock.addConsumer(
    subscriptionId,
    randomIpfsNft.address
  );
  log("---------------------------------");
  log("Deployed to:", randomIpfsNft.address);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying on Etherscan. This will take a few minutes...");
    await verify(randomIpfsNft.address, args);
  }
  
};

async function handleTokenURIs() {
  tokenUris = [];
  //Store the image in IPFS
  //Store the metadata in IPFS
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLoc
  );
  for (imageUploadResponsesIndex in imageUploadResponses) {
    //create metadata
    // upload the metadata
    let tokenUriMetadata = { ...metadataTemplate }; //3 dot is something called unpacked operator
    //files = pug.png, st-bernard.png, ...etc
    tokenUriMetadata.nftName = files[imageUploadResponsesIndex].replace(
      ".png",
      ""
    ); //Just dropping the extension
    tokenUriMetadata.nftDescription = `A cute ${tokenUriMetadata.nftName} NFT`;
    tokenUriMetadata.nftImage = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`;
    console.log(`Uploading metadata for ${tokenUriMetadata.nftName}...`);
    //Store the JSON to pinata/IPFS
    const metadataUploadResponse = await storeMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("Token URIs Uploaded! They are: ");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomNFT", "main"];
