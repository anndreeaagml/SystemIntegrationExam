const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const account = "sysint";
const sas = "?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2023-01-31T20:54:39Z&st=2022-12-01T12:54:39Z&sip=0.0.0.0-255.255.255.255&spr=https,http&sig=UUFZl8OMYLIpv75pNpcDFJOvf3%2FFRrnm8VHpVC9Ijyw%3D";
const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net${sas}`);
goatcontainer = blobServiceClient.getContainerClient("goat");
module.exports = async function()
{
    const blobName = "giftshop.db";
    const blockBlobClient = goatcontainer.getBlockBlobClient(blobName);
  
    // Display blob name and url
    console.log(
      `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`
    );
  
    const path = "./var/db/giftshop.db";
    const uploadBlobResponse = await blockBlobClient.uploadFile(path);
    console.log(
      `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`
    );
}