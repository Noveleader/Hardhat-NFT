const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
const { error } = require("console")
require("dotenv").config()

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

async function storeImages(imageFilePath){
    const fullImagesPath = path.resolve(imageFilePath) //Get the full path of the image
    const files = fs.readdirSync(fullImagesPath) //Get all the files in the folder
    let responses = []
    console.log("Uploading to Pinata...")
    for(firstIndex in files){
        console.log(`Uploading ${files[firstIndex]} to Pinata...`)
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[firstIndex]}`)
        const options = {
            pinataMetadata: {
                name: files[firstIndex]
            }
        }
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            responses.push(response)
        }
        catch(error){
            console.log(error)
        }
    }
    //Reponses are going to be hash 
    return {responses, files }
}

async function storeMetadata(metadataFilePath){
    try {
        const response = await pinata.pinJSONToIPFS(metadataFilePath)
        return response
    } catch(error){
        console.log(error)
    }
    return null
}
module.exports = {storeImages, storeMetadata}