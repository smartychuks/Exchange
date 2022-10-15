import { Contract } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI } from "../constants";

export const getAmountOfTokensReceivedFromSwap = async(_swapAmountWei, provider, ethSelected, ethBalance, reservedCM) => {
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        provider
    );
    let amountOfTokens;
    if(ethSelected){
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, ethBalance, reservedCM);
    }else{
        amountOfTokens = await exchangeContract.getAmountOfTokens(_swapAmountWei, reservedCM, ethBalance);
    }

    return amountOfTokens;
};

export const swapTokens = async (signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected)=>{
    const exchangeContract = new Contract(
        EXCHANGE_CONTRACT_ADDRESS,
        EXCHANGE_CONTRACT_ABI,
        signer
    );
    const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
    );
    let tx;

    if(ethSelected){
        tx = await exchangeContract.ethToCryptoManiaToken(
            tokenToBeReceivedAfterSwap,{ value: swapAmountWei, }
        )
    }else{
        tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, swapAmountWei.toString());
        
        await tx.wait();
        tx = await exchangeContract.cryptoManiaTokenToEth(
            swapAmountWei, tokenToBeReceivedAfterSwap
        );
    }
    await tx.wait();
};