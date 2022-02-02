import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

//Create context API
const GithubContext = React.createContext();

//Create context provider
const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubNumber = async (user) => {
    // toggleError
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    );
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      // repos

      // more logic here
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=10`),
        axios(`${followers_url}?per_page=10`),
      ]).then((result) => {
        const [repos, followers] = result;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "There is no user with that username");
    }
    checkRequests();
    setIsLoading(false);
  };
  // check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        //console.log(data);
        // remaining = 0;
        setRequests(remaining);
        //console.log(requests);
        if (remaining === 0) {
          toggleError(true, "Sorry, you have exeeded your hourly rate limit!");
        }
      })
      .catch((error) => console.log(error));
  };
  //error
  function toggleError(show, msg) {
    setError({ show, msg });
  }

  useEffect(() => {
    checkRequests();
  }, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubNumber,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};
export { GithubContext, GithubProvider };
