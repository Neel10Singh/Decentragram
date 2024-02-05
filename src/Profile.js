import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Form, Button, Card, ListGroup, Col } from "react-bootstrap";
import { create as ipfsHttpClient } from "ipfs-http-client";
import Lottie from "lottie-react";
import loader from "./assets/loader.json";
import axios from "axios";
import FormData from "form-data";
import nodp from "./assets/nodp.png";
// import { createReadStream } from "fs";
// const fs = require("fs");

const JWT = process.env.REACT_APP_JWT;
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const Profile = ({ contract }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState("");
  const [nfts, setNfts] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [currImage, setCurrImage] = useState(null);

  const loadMyNFTs = async () => {
    const results = await contract.getMyNfts();
    let nfts = await Promise.all(
      results.map(async (i) => {
        const uri = await contract.tokenURI(i);

        const response = await fetch(uri);
        const metadata = await response.json();
        return {
          id: i,
          username: metadata.username,
          avatar: metadata.avatar,
        };
      })
    );
    console.log(nfts);
    setNfts(nfts);
    getProfile(nfts);
  };

  const getProfile = async (nfts) => {
    const address = await contract.signer.getAddress();
    const _nftid = await contract.profiles(address);
    console.log(_nftid);
    const profile = nfts.find((i) => i.id.toString() === _nftid.toString());
    console.log(profile);
    setProfile(profile);
    setLoading(false);
  };

  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const src = event.target.files[0];
    // const file = createReadStream(src);
    formData.append("file", src);
    console.log(formData);
    console.log(JWT);
    if (typeof src !== "undefined") {
      try {
        setLoading(true);
        console.log("t");
        const res = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: "Infinity",
            headers: {
              "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
              Authorization: `Bearer ${JWT}`,
              pinata_api_key: process.env.REACT_APP_API_KEY,
              pinata_secret_api_key: process.env.REACT_APP_API_SECRET,
            },
          }
        );
        setAvatar(
          `https://olive-obliged-butterfly-626.mypinata.cloud/ipfs/${res.data.IpfsHash}`
        );
        console.log(res.data.IpfsHash);

        setCurrImage(event.target.files[0]);
        console.log(event.target.files[0]);
        setLoading(false);
        // const result = await client.add(file);
        // setAvatar(`https://ipfs.infura.io/ipfs/${result.path}`);
      } catch (error) {
        window.alert("ipfs image upload error: ", error);
        setLoading(false);
      }
    }
  };
  const mintProfile = async (event) => {
    if (!avatar || !username) return;
    const src = JSON.stringify({ avatar, username });
    console.log(src);
    // const formData = new FormData();
    // formData.append("file", src);
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        src,
        {
          // maxBodyLength: "Infinity",
          headers: {
            "Content-Type": `application/json`,
            Authorization: `Bearer ${JWT}`,
            pinata_api_key: process.env.REACT_APP_API_KEY,
            pinata_secret_api_key: process.env.REACT_APP_API_SECRET,
          },
        }
      );
      setLoading(true);
      await (
        await contract.mint(
          `https://olive-obliged-butterfly-626.mypinata.cloud/ipfs/${res.data.IpfsHash}`
        )
      ).wait();
      loadMyNFTs();
    } catch (error) {
      window.alert("ipfs uri upload error: ", error);
      setLoading(false);
    }
  };
  const switchProfile = async (nft) => {
    setLoading(true);
    await (await contract.setProfile(nft.id)).wait();
    getProfile(nfts);
  };

  useEffect(() => {
    if (!nfts) loadMyNFTs();
  });

  function getFile() {
    document.getElementById("upfile").click();
    console.log("clicking");
  }

  return (
    <>
      {loading && (
        <div className="w-screen z-[1000] h-screen fixed bg-black/50 flex justify-center items-center">
          <Lottie
            animationData={loader}
            style={{ height: "20rem", width: "20rem" }}
          />
        </div>
      )}
      <div className=" flex gap-10 flex-col md:flex-row w-full p-10 md:px-20 lg:px-32 xl:px-40 relative z-40 mt-20">
        {profile ? (
          <div className=" w-full md:w-72 h-80 flex gap-5 p-2 rounded-xl flex-col justify-center items-center bg-slate-950/90 shadow-xl">
            <img
              className=" w-32 h-32 rounded-full border-2 border-white drop-shadow-glow object-cover bg-black"
              src={profile.avatar}
            />
            <h3 className=" text-white text-xl font-bold text-center">
              {profile.username}
            </h3>
          </div>
        ) : (
          <div className="w-full md:w-72 h-80 flex gap-5 p-2 rounded-xl flex-col justify-center items-center bg-slate-950/90 shadow-xl ">
            <img
              className=" w-32 h-32 rounded-full border-2 border-white drop-shadow-glow"
              src={nodp}
            />
            <h3 className=" text-white text-xl font-bold text-center">
              No NFTs Owned!! Please Create One..
            </h3>
          </div>
        )}
        <div className=" w-full p-4 bg-slate-950/90 rounded-xl flex gap-5 flex-col justify-center items-start shadow-xl">
          <div className="flex flex-col">
            {nfts.length > 1 && (
              <h2 className="text-2xl text-white font-bold">Existing NFTs</h2>
            )}
            <div className="flex gap-2 flex-wrap justify-center items-center">
              {nfts.length > 1 &&
                nfts.map((nft, idx) => {
                  if (nft.id === profile.id) return;
                  return (
                    <div
                      key={idx}
                      className="h-40 w-32 border-2 border-white drop-shadow-glow rounded-lg flex flex-col p-2 justify-center items-center"
                    >
                      <img
                        src={nft.avatar}
                        className="h-20 w-20 rounded-full border-2 border-white object-cover"
                      />
                      <h4 className=" text-sm font-semibold text-white">
                        {nft.username}
                      </h4>
                      <button
                        onClick={() => switchProfile(nft)}
                        className=" rounded-md bg-white border-2 text-slate-900 text-sm font-bold w-full py-1 hover:!bg-transparent hover:text-white transition-all"
                      >
                        Set as Profile
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="flex flex-col w-full">
            <h2 className="text-2xl text-white font-bold">
              Make new NFT Profile
            </h2>
            <main className=" flex flex-col gap-2 w-full">
              <input
                type="file"
                id="upfile"
                required
                name="file"
                style={{ height: "0px", width: "0px", overflow: "hidden" }}
                onChange={uploadToIPFS}
              />
              <div className="flex gap-4 items-center">
                <button
                  className="rounded-full drop-shadow-glow hover:!bg-white border-2 hover:!text-slate-900 text-xl font-bold w-40 h-12 bg-transparent text-white transition-all"
                  onClick={() => getFile()}
                >
                  Select NFT
                </button>
                {currImage && (
                  <h2 className=" text-xl text-white font-bold ">
                    {currImage.name}
                  </h2>
                )}
              </div>
              <input
                onChange={(e) => setUsername(e.target.value)}
                size="lg"
                required
                type="text"
                placeholder="Username"
                className=" text-white border-2 bg-transparent rounded-full h-12 w-full px-2 text-xl"
              />

              <button
                onClick={mintProfile}
                className="rounded-full hover:!bg-white border-2 hover:!text-slate-900 text-xl font-bold w-40 md:w-60 h-12 bg-transparent text-white transition-all drop-shadow-glow"
              >
                Create Profile
              </button>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
