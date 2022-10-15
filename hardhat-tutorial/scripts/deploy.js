const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { CRYPTO_MANIA_TOKEN_CONTRACT_ADDRESS } = require("../constants");

async function main(){
  const cryptoManiaTokenAddress = CRYPTO_MANIA_TOKEN_CONTRACT_ADDRESS;
  const exchangeContract = await ethers.getContractFactory("Exchange");

  const deployedExchangeContract = await exchangeContract.deploy(cryptoManiaTokenAddress);
  await deployedExchangeContract.deployed();

  console.log("Exchange Contract Address is: ", deployedExchangeContract.address);
}

//to catch errors
main()
  .then(()=> process.exit(0))
  .catch((error) =>{
    console.error(error);
    process.exit(1);
  });