//file used to retrieve balances and reserves from assets
import { Contract } from 'ethers';
import{
    EXCHANGE_CONTRACT_ABI,
    EXCHANGE_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../constants";

//retrieves ether balance of user or contract
export const getEtherBalance = async (provider, address, contract=false) => {
    try {
        //if contract is et to false retrieve balance of the contract
        //else retrieve balance of the user
        if(contract){
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            return balance;
        }else{
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (err) {
        console.error(err);
        return 0;        
    }
}

//function that retrieves the Crypto Mania token in an address
export const getCMTokensBalance = async (provider, address) => {
    try{
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        );
        const balanceOfCryptoManiaTokens = await tokenContract.balanceOf(address);
        return balanceOfCryptoManiaTokens;
    }catch(err){
        console.error(err);
    }
}

// function to retrieve the amount of LP token in the account of the provided address
export const getLPTokensBalance = async(provider, address) => {
    try{
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens;
    }catch(err){
        console.error(err);
    }
};

// function to Retrieve the amount of CM tokens in the exchange contract address
export const getReserveOfCMTokens = async (provider)=>{
    try{
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const reserve = await exchangeContract.getReserve();
        return reserve;
    }catch(err){
        console.error(err);
    }
}