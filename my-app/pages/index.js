import { BigNumber, providers, utils } from 'ethers';
import Head from "next/head";
import React, {useEffect, useRef, useState } from 'react';
import Web3Modal from 'web3modal';
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCM} from "../utils/addLiquidity";
import { getCMTokensBalance, getEtherBalance, getLPTokensBalance, getReserveOfCMTokens, } from "../utils/getAmounts";
import {getTokensAfterRemove, removeLiquidity, } from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home(){
  //declare some state varibles
  const [loading, setLoading] = useState(0);
  const [liquidityTab, setLiquidityTab] = useState(true);
  const zero = BigNumber.from(0);
  const [ethBalance, setEtherBalance] = useState(zero);
  const [reservedCM, setReservedCM] = useState(zero);
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  const [cmBalance, setCMBalance] = useState(zero);
  const [lpBalance, setLPBalance] = useState(zero);
  const [addEther, setAddEther] = useState(zero);
  const [addCMTokens, setAddCMTokens] = useState(zero);
  const [removeEther, setRemoveEther] = useState(zero);
  const [removeCM,setRemoveCM] = useState(zero);
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
  const [swapAmount, setSwapAmount] = useState("");
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] = useState(zero);
  const [ethSelected, setEthSelected] = useState(true);
  const web3ModalRef = useRef();
  const [walletConnected, setWalletConnected] = useState(false);

  //fucntion that gets balance
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      //retrieve balance of user
      const _ethBalance = await getEtherBalance(provider, address);
      const _cmBalance = await getCMTokensBalance(provider, address);
      const _lpBalance = await getLPTokensBalance(provider, address);
      //get amount of Crypto Mania in the contract
      const _reservedCM = await getReserveOfCMTokens(provider);
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCMBalance(_cmBalance);
      setLPBalance(_lpBalance);
      setReservedCM(_reservedCM);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (error) {
      console.error(error);
    }
  }

  const _swapTokens = async ()=>{
    try{
      const swapAmountWei = utils.parseEther(swapAmount);//conver user input to BigNumber
      //check if user input a valid number
      if (!swapAmountWei.eq(zero)){
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await swapTokens(signer, swapAmountWei, tokenToBeReceivedAfterSwap, ethSelected);
        setLoading(false);
        //to get updated amounts after swap
        await getAmounts();
        setSwapAmount("")
      }
    }catch(err){
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  }

  //function that returns ETH/CM that can be received when the user Swaps
  const _getAmountOfTokensReceivedFromSwap = async(_swapAmount) => {
    try {
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());//convert user input to BigNumber
      //check for null input
      if(!_swapAmountWEI.eq(zero)){
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider, null, true);
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedCM
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
      }else{
        settokenToBeReceivedAfterSwap(zero);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // function to add liquidity
  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther.toString());
      if(!addCMTokens.eq(zero) && !addEtherWei.eq(zero)){
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        await addLiquidity(signer, addCMTokens, addEtherWei);
        setLoading(false);
        setAddCMTokens(zero);//Reinitizlize the CM tokens
        await getAmounts(); //get amount for values after adding liquidity
      }else{
        setAddCMTokens(zero);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setAddCMTokens(zero);
    }
  }

  //function to remove liquidity
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      //convert user input to BigNumber
      const setRemoveLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, setRemoveLPTokensWei); //function from 'utils' folder
      setLoading(false);
      await getAmounts();
      setRemoveCM(zero);
      setRemoveEther(zero);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setRemoveCM(zero);
      setRemoveEther(zero);
    }
  }

  const _getTokensAfterRemove = async (_removeLPTokens)=>{
    try {
      const provider = await getProviderOrSigner();
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);      
      const _ethBalance = await getEtherBalance(provider, null, true);
      const cryptoManiaTokenReserve = await getReserveOfCMTokens(provider);
      const { _removeEther, _removeCM } = await getTokensAfterRemove(provider, removeLPTokenWei, _ethBalance, cryptoManiaTokenReserve);
      setRemoveEther(_removeEther);
      setRemoveCM(_removeCM);
    } catch (error) {
      console.error(error);
    }
  }

  //connect metamask wallet
  const connectWallet = async()=>{
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(error){
      console.error(error);
    }
  }

  const getProviderOrSigner = async (needSigner = false)=>{
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5){
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if(needSigner){
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  const renderButton = () =>{
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect wallet
        </button>
      );
    }

    if(loading){
      return <button className={styles.button}>Loading...</button>
    }

    if(liquidityTab){
      return(
        <div>
          <div className={styles.description}>
            You have: <br />
            {/*Convert BigNumber to string*/}
            {utils.formatEther(cmBalance)} Crypto Mania Tokens <br />
            {utils.formatEther(ethBalance)} Ether <br />
            {utils.formatEther(lpBalance)} Crypto Mania LP tokens
          </div>
            
            {utils.parseEther(reservedCM.toString()).eq(zero) ?(
              <div>
                <input type="number" placeholder='Amount of Ether' 
                onChange={(e)=>setAddEther(e.target.value || "0")} 
                className={styles.input} />
                <input type="number" placeholder='Amount of Crypto Mania tokens'
                onChange={(e) => setAddCMTokens(BigNumber.from(utils.parseEther(e.target.value || "0")))}
                className={styles.input} />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input type="number" placeholder="Amount of Ether" onChange={async (e) =>{
                  setAddEther(e.target.value || "0");

                  const _addCMTokens = await calculateCM(
                    e.target.value || "0", etherBalanceContract, reservedCM
                  );
                  setAddCMTokens(_addCMTokens);
                }}
                className={styles.input} />
                <div className={styles.inputDiv}>
                  {`You will need ${utils.formatEther(addCMTokens)} Crypto Mania Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input type="number" placeholder='Amount of LP Tokens' onChange={async (e) => {
                setRemoveLPTokens(e.target.value || "0");
                await _getTokensAfterRemove(e.target.value || "0");
              }} className={styles.input} />
              <div className={styles.inputDiv}>
                {`You will get ${utils.formatEther(removeCM)} Crypto Mania Tokens and
                ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>          
        </div>      
      );
    }else{
      return(
        <div>
          <input type="number" placeholder="Amount" onChange={async (e)=>{
            setSwapAmount(e.target.value || "");
            await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
          }} className={styles.input} value={swapAmount} />
          <select className={styles.select} name="dropdown" id="dropdown"
          onChange={async()=>{
            setEthSelected(!ethSelected);
            //initialize values to zero
            await _getAmountOfTokensReceivedFromSwap(0);
            setSwapAmount("");
          }}>
            <option value="eth">Ethereum</option>
            <option value="cryptoManiaToken">Crypto Mania Token</option>
          </select><br />
          <div className={styles.inputDiv}>
            {ethSelected ? `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} 
            Crypto Mania Tokens` : `You will get ${utils.formatEther(tokenToBeReceivedAfterSwap)} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };
  return(
    <div>
      <Head>
        <title>Crypto Devs</title>
          <meta name="description" content="Whitelist-Dapp" />
          <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Mania Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Mania Tokens
          </div>
          <div>
            <button className={styles.button} onClick={()=>{setLiquidityTab(true);}}>
              Liquidity
            </button>
            <button className={styles.button} onClick={()=>{setLiquidityTab(false);}}>
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptomania.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by iSmarty
      </footer>
    </div>
  );
}