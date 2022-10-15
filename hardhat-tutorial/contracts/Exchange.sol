// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Exchange is ERC20{

    address public cryptoManiaTokenAddress;
     
     constructor(address _CryptoManiatoken) ERC20("Crypto Mania LP Token", "CMLP"){
        require(_CryptoManiatoken != address(0), "Token address passed is a null address");
        cryptoManiaTokenAddress = _CryptoManiatoken;
     }

     //function to check balance of contract
     function getReserve() public view returns (uint){
        return ERC20(cryptoManiaTokenAddress).balanceOf(address(this));
     }

     function addLiquidity(uint _amount) public payable returns (uint){
        uint liquidity;
        uint ethBalance = address(this).balance;
        uint cryptoManiaTokenReserve = getReserve();
        ERC20 cryptoManiaToken = ERC20(cryptoManiaTokenAddress);

        // add initial liquidity if reserve is empty
        if(cryptoManiaTokenReserve == 0){
            //Transfer cryptoMAnia token from user's account to contract
            cryptoManiaToken.transferFrom(msg.sender, address(this), _amount);

            liquidity = ethBalance;
            _mint(msg.sender, liquidity);
        }else{// reserve not empty, so take in any eth input by user
        //and determine by ratio the amount of required Crypto Mania token
            uint ethReserve = ethBalance - msg.value;

            // to maintain the ratio
            uint cryptoManiaTokenAmount = (msg.value * cryptoManiaTokenReserve)/(ethReserve);
            require(_amount >= cryptoManiaTokenAmount, "Amount sent is less than required");

            // transfer the required crypto Mania Token to contract
            cryptoManiaToken.transferFrom(msg.sender, address(this), cryptoManiaTokenAmount);
            liquidity = (totalSupply() * msg.value)/ethReserve;
            _mint(msg.sender, liquidity);
        }
        return liquidity;
     }

     // function to remove liquuidity, returns amount of ETH/CM token to be return to user in the swap
     function removeLiquidity(uint _amount) public returns (uint , uint){
        require(_amount > 0, "amount should be greater than zero");
        uint ethReserve = address(this).balance;
        uint _totalSupply = totalSupply();

        //eth to send back to user
        uint ethAmount = (ethReserve * _amount)/_totalSupply;

        //Crypto mania amount to be sent back to user
        uint cryptoManiaTokenAmount = (getReserve() * _amount)/_totalSupply;

        //burn the lp token from the user's wallet
        _burn(msg.sender, _amount);

        //Transfer eth from contract to user's wallet
        payable(msg.sender).transfer(ethAmount);

        //transfer Crypto Mania token from contract to user
        ERC20(cryptoManiaTokenAddress).transfer(msg.sender, cryptoManiaTokenAmount);
        return (ethAmount, cryptoManiaTokenAmount);
     }

     // function to compute amount of eth/crypto mania token to be returned to user in swap
     function getAmountOfTokens(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
     ) public pure returns (uint256){
        require(inputReserve > 0 && outputReserve >0, "invalid reserves");

        uint256 inputAmountWithFee = inputAmount * 99;//to implement 1% trading fee

        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator/denominator;
     }

     //function to compute crypto Mania token to return to user in exchange for their eth
     function ethToCryptoManiaToken(uint _minTokens) public payable{
        uint256 tokenReserve = getReserve();

        uint256 tokensBought = getAmountOfTokens(msg.value, address(this).balance - msg.value,tokenReserve);
        require(tokensBought >= _minTokens, "Insufficent output Amount");
        // Transfer the crypto Mania Token to user
        ERC20(cryptoManiaTokenAddress).transfer(msg.sender, tokensBought);
     }

     //function to swap eth Token for user's crypto Mania Token
     function cryptoManiaTokenToEth(uint _tokensSold, uint _minEth) public{
        uint256 tokenReserve = getReserve();

        //to get the amount of eth to be retuned to user
        uint256 ethBought = getAmountOfTokens(_tokensSold,tokenReserve, address(this).balance);
        require(ethBought >= _minEth,"insufficient output amount");
        //transfer crypto MAnia token from user's address to contract
        ERC20(cryptoManiaTokenAddress).transferFrom(msg.sender, address(this), _tokensSold);
        //send eth to the user from contract
        payable(msg.sender).transfer(ethBought);
     }
}