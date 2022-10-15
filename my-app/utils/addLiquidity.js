import { Contract, utils } from 'ethers';
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS,
TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from '../constants';

export const addLiquidity = async(signer, addCMAmountWei, addEtherAmountWei)=>{
    try {
        const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
        const exchangeContract = new Contract(EXCHANGE_CONTRACT_ADDRESS, EXCHANGE_CONTRACT_ABI, signer);
        let tx = await tokenContract.approve(EXCHANGE_CONTRACT_ADDRESS, addCMAmountWei.toString());
        await tx.wait();
        tx = await exchangeContract.addLiquidity(addCMAmountWei, {value: addEtherAmountWei},);
        await tx.wait();
    } catch (error) {
        console.error(error);
    }
}

//funtion that calculates the amount of CM tokens to be added to Liquidity
export const calculateCM = async(_addEther = "0", etherBalanceContract, cmTokenReserve)=>{
    const _addEtherAmountWei = utils.parseEther(_addEther);
    const cryptoManiaTokenAmount = _addEtherAmountWei.mul(cmTokenReserve).div(etherBalanceContract);
    return cryptoManiaTokenAmount;
}