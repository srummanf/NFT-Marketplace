import React, { useEffect, useState, createContext } from "react";
import * as eth from "ethers";
import axios from "axios";
import { NFTStorage, Blob } from "nft.storage";
import { abi } from './utils'
import * as dotenv from 'dotenv'
import { create } from "@mui/material/styles/createTransitions";
// to configure the enivronment variables
dotenv.config()

export const BlockchainConfig = createContext();

export const BlockchainProvider = ({ children }) => {

  // define useState for currentAccount
  const [currentUser, setCurrentUser] = useState("");
  // define environment variables here... 
  const contr_addr = process.env.REACT_APP_CONTRACT;
  const NFT_STORAGE_TOKEN = process.env.REACT_APP_PUBLIC_NFT_STORAGE_TOKEN;

  // define NFTStorage client here
  const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });


  const provider = new eth.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new eth.Contract(contr_addr, abi, signer);

  // function to connect to the ethereum wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      return alert("Install Metamask as it is not installed");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentUser(accounts[0]);
  };

  // auto wallet connection method (fn definition same as the connectWallet function) and this method is to be used only inside the useEffect hooks
  const checkIfWalletIsConnect = async () => {
    if (!window.ethereum) {
      return alert("Install Metamask as it is not installed");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentUser(accounts[0]);
  };

  // define uploadToIPFS method to upload our image file to the NFT Storage and get the file url for it
  const uploadToIPFS = async (file) => {
    try {
      const metadata = await client.store({
        name: "ABC",
        description: "XYZ",
        image: file
      });
      return metadata.data.image.href;
    }
    catch (error) {
      console.log(error);
    }
  };

  // define createNFT method to send the nft metadata to IPFS, get the cid and finally call the create sale function to mint our final token
  const createNFT = async (formInput, fileUrl) => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) {
      return;
    }
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,

    })
    let url = ""
    try {
      const metadata = new Blob([data]);
      const cid = await client.storeBlob(metadata);
      url = "https://ipfs.io/ipfs/" + cid;
      console.log(url);
      await createSale(url, price);
    } catch (error) {
      console.log(error);
    }

  };

  // createsale function defintion here, to create token 
  const createSale = async (url, formInputPrice) => {
    const price = eth.utils.parseUnits(formInputPrice);
    try{
      const listingPrice = await contract.getListingPrice();
      const transaction = await contract.createToken(url, price ,{ value: listingPrice.toString() });
      await transaction.wait();
      console.log(transaction);
    } catch(error) {
      console.log(error);
    }
  };

  // this function is used for our marketplace page
  const fetchNFTs = async (setLoading) => {
    setLoading(true);
    const data = await contract.fetchMarketItems();
    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { image, name, description },
        } = await axios.get(tokenURI);
        const price = eth.utils.formatUnits(
          unformattedPrice.toString(),
          "ether"
        );
        image.replace("https:ipfs.io", "https://infura-ipfs.io");
        console.log(image);
        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      })
    );
    return items;
  };

  useEffect(() => {
    checkIfWalletIsConnect();
  }, []);


  return (
    <BlockchainConfig.Provider value={{ fetchNFTs, uploadToIPFS, createNFT, createSale, currentAccount, checkIfWalletIsConnect, connectWallet }}>{children}</BlockchainConfig.Provider>
  );
};
