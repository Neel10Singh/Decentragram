import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Row, Form, Button, Card, ListGroup } from "react-bootstrap";
import { create as ipfsHttpClient } from "ipfs-http-client";
import Lottie from "lottie-react";
import loader from "./assets/loader.json";
import axios from "axios";

import nodp from "./assets/nodp.png";

const JWT = process.env.REACT_APP_JWT;
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const Home = ({ contract }) => {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [post, setPost] = useState("");
  const [postImage, setPostImage] = useState("");
  const [address, setAddress] = useState("");
  const [posts, setPosts] = useState("");
  const [profile, setProfile] = useState("");
  const [nfts, setNfts] = useState("");
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

  const loadPosts = async () => {
    let address = await contract.signer.getAddress();
    setAddress(address);
    // console.log(address);
    const balance = await contract.balanceOf(address);
    setHasProfile(() => balance > 0);

    let results = await contract.getAllPosts();
    let posts = await Promise.all(
      results.map(async (i) => {
        let response = await fetch(
          `https://olive-obliged-butterfly-626.mypinata.cloud/ipfs/${i.hash}`
        );
        const metadataPost = await response.json();
        const nftid = await contract.profiles(i.author);
        const uri = await contract.tokenURI(nftid);
        response = await fetch(uri);
        const metadataProfile = await response.json();
        const author = {
          address: i.author,
          username: metadataProfile.username,
          avatar: metadataProfile.avatar,
        };

        let post = {
          id: i.id,
          content: metadataPost.post,
          contentImage: metadataPost.postImage,
          tipAmount: i.tipAmount,
          author,
        };
        return post;
      })
    );
    posts = posts.sort((a, b) => b.tipAmount - a.tipAmount);
    setPosts(posts);
    setLoading(false);
  };
  useEffect(() => {
    if (!posts) loadPosts();
    if (!nfts) loadMyNFTs();
  });

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
        setPostImage(
          `https://olive-obliged-butterfly-626.mypinata.cloud/ipfs/${res.data.IpfsHash}`
        );
        console.log(res.data.IpfsHash);

        setCurrImage(event.target.files[0]);
        console.log(event.target.files[0]);
        setLoading(false);
      } catch (error) {
        window.alert("ipfs image upload error: ", error);
        setLoading(false);
      }
    }
  };
  function getFile() {
    document.getElementById("upfile").click();
    console.log("clicking");
  }

  const uploadPost = async () => {
    if (!post) return;
    let hash;
    const src = JSON.stringify({ postImage, post });
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
      hash = res.data.IpfsHash;
    } catch (error) {
      window.alert("ipfs image upload error: ", error);
    }
    await (await contract.uploadPost(hash)).wait();
    loadPosts();
  };

  const tip = async (post) => {
    setLoading(true);
    await (
      await contract.tipPostOwner(post.id, {
        value: ethers.utils.parseEther("0.1"),
      })
    ).wait();
    loadPosts();
    setLoading(false);
  };

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
      <div className=" flex flex-col lg:flex-row gap-3 lg:!gap-5 p-10 lg:px-40 relative z-40 mt-20">
        {profile ? (
          <div className=" w-full lg:w-72 h-fit lg:h-80 py-4 lg:py-2 flex gap-5 p-2 rounded-xl lg:flex-col justify-center items-center bg-slate-950/90 shadow-xl">
            <img
              className=" w-32 h-32 rounded-full border-2 border-white drop-shadow-glow object-cover bg-black"
              src={profile.avatar}
            />
            <h3 className=" text-white text-xl font-bold text-center">
              {profile.username}
            </h3>
          </div>
        ) : (
          <div className="w-full lg:w-72 h-fit lg:h-80 py-4 lg:py-2 flex gap-5 p-2 rounded-xl lg:flex-col justify-center items-center bg-slate-950/90 shadow-xl ">
            <img
              className=" w-32 h-32 rounded-full border-2 border-white drop-shadow-glow"
              src={nodp}
            />
            <h3 className=" text-white text-xl font-bold text-center">
              No NFTs Owned!! Please Create One..
            </h3>
          </div>
        )}
        <div className="flex flex-col gap-3 w-full">
          {hasProfile ? (
            <div className="flex flex-col gap-3 w-full bg-slate-950/90 p-3 rounded-xl">
              <textarea
                rows="5"
                onChange={(e) => setPost(e.target.value)}
                required
                as="textarea"
                className="bg-slate-900 rounded-xl border-2 text-white p-1"
                placeholder="What's on your mind today?"
              />
              <div className="flex justify-between">
                <div className="flex gap-4 items-center">
                  <button
                    className="rounded-full drop-shadow-glow hover:!bg-white border-2 hover:!text-slate-900 text-xl font-bold w-40 h-12 bg-transparent text-white transition-all"
                    onClick={() => getFile()}
                  >
                    Upload
                  </button>
                  {currImage && (
                    <h2 className=" text-xl text-white font-bold ">
                      {currImage.name}
                    </h2>
                  )}
                  <input
                    type="file"
                    id="upfile"
                    required
                    name="file"
                    style={{ height: "0px", width: "0px", overflow: "hidden" }}
                    onChange={uploadToIPFS}
                  />
                </div>
                <button
                  className="rounded-full hover:!bg-white border-2 hover:!text-slate-900 text-xl font-bold w-40 md:w-60 h-12 bg-transparent text-white transition-all drop-shadow-glow"
                  onClick={() => uploadPost()}
                >
                  Post!
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full bg-slate-950/90 p-3 rounded-xl">
              <main style={{ padding: "1rem 0" }}>
                <h2 className="text-white drop-shadow-glow">
                  Must own an NFT to post
                </h2>
              </main>
            </div>
          )}

          {posts.length > 0 ? (
            posts.map((post, key) => {
              return (
                <div
                  key={key}
                  className="flex flex-col w-full bg-slate-950/90 p-3 rounded-xl text-white"
                >
                  <div className="flex justify-between flex-col lg:flex-row lg:items-center pb-2 border-b">
                    <div className="flex gap-1 items-center">
                      <img
                        className="h-8 w-8 rounded-full drop-shadow-glow border"
                        width="30"
                        height="30"
                        src={post.author.avatar}
                      />
                      <h4 className="text-md font-bold !mb-0">
                        {post.author.username}
                      </h4>
                    </div>
                    <h4 className="text-sm mb-0">{post.author.address}</h4>
                  </div>
                  <div className="py-2 border-b font-bold px-2">
                    <h4 className="text-sm ">{post.content}</h4>
                    <img
                      src={post.contentImage}
                      className=" w-full lg:h-80 lg:w-80 object-cover border-2 rounded-lg"
                    />
                  </div>
                  <div className="flex pt-2 justify-between items-center">
                    <div className="text-md">
                      Tip Amount: {ethers.utils.formatEther(post.tipAmount)} ETH
                    </div>
                    {address === post.author.address || !hasProfile ? null : (
                      <button
                        onClick={() => tip(post)}
                        className="rounded-md bg-white border-2 text-slate-900 text-sm font-bold w-28 drop-shadow-glow py-1 hover:!bg-transparent hover:text-white transition-all"
                      >
                        Tip 0.1 ETH
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col gap-3 w-full bg-slate-950/90 p-3 rounded-xl">
              <main style={{ padding: "1rem 0" }}>
                <h2 className="text-white drop-shadow-glow">No posts yet</h2>
              </main>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
