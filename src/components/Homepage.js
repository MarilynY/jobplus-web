import React, {Component} from 'react';
import Searchbar from './Searchbar'
import Filter from "./Filter"
import TabContainer from "./TabContainer"
import Loading from "./Loading";
import {
  GEOLOCATION_OPTIONS,
  POSITION_KEY,
  INIT_DATA,
  URL_HOST,
  NEARBY,
  SEARCH,
  RECOMMEND
} from "../constant";

/**
 *   1. data from children: (searchBar and filter need callback function from homepage)
 *      a. user input keywords from SearchBar
 *      b. filter keywords from filter
 *      c. everytime get data change from children, need to fetch new data from back end
 *   2. data from parents:
 *      a. isLoggedin ? if user loggedin, need to fetch both recommend data and nearby, otherwise, fetch only nearby data
 *   3. data pass to children:
 *      a. Default: pass nearby data to tabContainer
 *      b. if user logged in, pass recommend data to tabContainer
 *      c. if user searched, pass searched data to tabContainer
 */

class Homepage extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    jobDescription: '',
    jobLocation: '',
    fullTime: 'false',
    loadingGeolocation: false,
    error: null,
    nearbyJobData: INIT_DATA,
    recommendJobData: INIT_DATA,
    searchedJobData: INIT_DATA,
    isLoading: true,
    isSearched: false,
    message: "Fetching Job Data..."
  }

  fetchNearbyResult = (url_method) => {
    this.setState({
      isLoading: true
    })
    const method = url_method;
    let url = '';
    const position = JSON.parse(localStorage.getItem(POSITION_KEY));
    switch (method) {
      case NEARBY:
        url = `${URL_HOST}${method}?lat=${position.latitude}&lon=${position.longitude}`;
        break;
      case SEARCH:
        url = `${URL_HOST}${method}?description=${this.state.jobDescription}&location=${this.state.jobLocation}&full_time=${this.state.fullTime}`;
        break;
      case RECOMMEND:
        url = `${URL_HOST}${method}?recommend`;
      default:
    }
    //console.log(url);
    fetch(url, {
      method: 'GET',
      credentials: 'include',
    }).then((response) => {
      console.log(url);
      return response.text();
      //throw new Error('Failed to load nearby search');
    }).then((text) => {
      let data = JSON.parse(text);
      console.log(data)
      if (url_method === SEARCH) {
        this.setState({
          isLoading: false,
          searchedJobData: data.length !== 0 ? data : INIT_DATA
        });
      } else if (url_method === NEARBY) {
        this.setState({
          isLoading: false,
          nearbyJobData: data.length !== 0 ? data : INIT_DATA
        });
      } else if (url_method === RECOMMEND && data.message === undefined) {
        this.setState({
          isLoading: false,
          recommendJobData: data.length !== 0 ? data : INIT_DATA
        });
      }
    }).catch((e) => {
      console.log(e.message);
      this.setState({
        message: "Fail to fetch data!"
      })
    });
  }

  getGeolocation() {
    this.setState({
      loadingGeolocation: true,
      error: null,
    });
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        this.onGeolocationSuccess,
        this.onGeolocationFailure,
        GEOLOCATION_OPTIONS,
      );
    } else {
      this.setState({
        loadingGeolocation: false,
        error: 'Your browser does not support geolocation.',
      });
    }
  }

  onGeolocationSuccess = (position) => {
    this.setState({
      loadingGeolocation: false,
      error: null,
    })
    console.log(position);
    const {latitude, longitude} = position.coords;
    localStorage.setItem(POSITION_KEY, JSON.stringify({latitude, longitude}));
    //this.fetchNearbyResult(NEARBY);
  }

  onGeolocationFailure = () => {
    this.setState({
      loadingGeolocation: false,
      error: 'Failed to load geolocation.',
    })
  }

  // searchBar callback function
  handleSelectChange = (jobDescription) => {
    this.setState({
      jobDescription: jobDescription
    });
  }

  handleLocationChange = (jobLocation) => {
    this.setState({
      jobLocation: jobLocation
    });
  }

  handleSearchPress = () => {
    this.fetchNearbyResult(SEARCH);
    this.setState({
      isSearched: true,
      message: "Fetching Job Data..."
    })
  }

  //Filter callback function
  handleFilterChange = (fullTimeOrNot) => {
    console.log(fullTimeOrNot);
    this.setState({
      fullTime: fullTimeOrNot
    });
  }

  //fetch nearby data and recommend data when user logged in
  componentDidMount() {
    //console.log("isLoggedIn:", this.props.isLoggedIn);
    this.getGeolocation();
    this.fetchNearbyResult(NEARBY);
    this.fetchNearbyResult(SEARCH);
    this.fetchNearbyResult(RECOMMEND);
    setTimeout(() => {
      this.setState({
        message: "Failed to fetch job data! Please Refresh the Page!"
      });
    }, 8000)
  }

  render() {
    return (
      <div>
        <Searchbar
          handleSelectChange={this.handleSelectChange}
          handleLocationChange={this.handleLocationChange}
          handleSearchPress={this.handleSearchPress}/>
        <Filter handleFilterSelect={this.handleFilterChange}/>
        {this.state.isLoading ?
          <Loading message={this.state.message}
                   isSearched={this.state.isSearched}
                   isLoggedIn={this.props.isLoggedIn}/>
          :
          <TabContainer
            nearbyJobData={this.state.nearbyJobData}
            searchedJobData={this.state.searchedJobData}
            recommendJobData={this.state.recommendJobData}
            isSearched={this.state.isSearched}
            isLoggedIn={this.props.isLoggedIn}
          />}
      </div>
    );
  }
}

export default Homepage;