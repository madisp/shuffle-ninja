import React from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

import './App.css';

const clientId = "929d639d36d0410793f9b8d5f084246f";
const callbackUri = process.env.NODE_ENV === 'production'
  ? "https://shuffle.ninja"
  : "http://localhost:3000";
const authLink = "https://accounts.spotify.com/authorize" +
  "?client_id=" + encodeURIComponent(clientId) +
  "&response_type=token" +
  "&redirect_uri=" + encodeURIComponent(callbackUri) +
  "&scope=user-library-read"

class App extends React.Component {

  state = { token: null, album: null }

  parseAccessToken() {
    let hashStr = window.location.hash;
    if (hashStr.startsWith("#")) {
      let tokens = hashStr.substring(1).split("&")
        .map((pair) => pair.split("=", 2))
        .filter((kv) => kv.length === 2 && kv[0] === "access_token")
        .map((kv) => kv[1])

      if (tokens.length > 0) {
        return tokens[0];
      }
    }
    return null;
  }

  async getRandomAlbum(token) {
    console.log('watt');
    let api = new SpotifyWebApi();
    api.setAccessToken(token);
    let probe = await api.getMySavedAlbums({ limit: 1 });
    let totalCount = probe.total;
    let randomIndex = Math.floor(Math.random() * totalCount);
    let response = await api.getMySavedAlbums({ offset: randomIndex, limit: 1 });
    return response.items[0].album;
  }

  isExpiredToken() {
    let expiry = localStorage.getItem('token-expiry');
    return expiry && Number(expiry) < Date.now();
  }

  authenticate() {
    localStorage.removeItem('token-expiry');
    localStorage.removeItem('token');
    window.location.href = authLink
  }

  async componentDidMount() {
    // check whether there's an existing token, but expired. If yes then immediately redirect to auth.
    if (this.isExpiredToken()) {
      this.authenticate();
      return;
    }

    var token = this.parseAccessToken();
    if (token) {
      window.location.replace("#");    
      if (typeof window.history.replaceState == 'function') {
        window.history.replaceState({}, '', window.location.href.slice(0, -1));
      }
      localStorage.setItem('token', token);
      localStorage.setItem('token-expiry', (Date.now() + 3600000).toString());
    } else {
      token = localStorage.getItem('token');
    }

    this.setState({ token: token });

    if (token && !this.state.album) {
      try {
        let album = await this.getRandomAlbum(token);
        this.setState({ album: album });
      } catch (e) {
        console.error("Exception thrown", e.stack);
        console.log("Failure, all failure");
        // clear all
        this.setState({ token: null, album: null });
      }
    } else if (this.state.album) {
      console.log("There is album");
    } else if (!this.state.token) {
      console.log("No token");
    }
  }

  render() {
    if (this.state.token) {
      if (this.state.album) {
        console.log(JSON.stringify(this.state.album));
        let album = this.state.album;

        let artists = album.artists.map((a) => a.name).join('/');
        let name = album.name;
        let displayString = artists + " - " + name;
        let cover = album.images.sort((a, b) => b.width * b.height - a.width * a.height)[0];

        return (
          <div className="App">
            <div className="Cover">
              <img alt={displayString} src={cover.url} />
            </div>
            <div>
              <i>{ name }</i><br />{ artists }
            </div>
          </div>
        );
      } else {
        return (
          <div className="App">
            <div className="Cover">
              ...
            </div>
            <div>
              Hold up,<br />
              let me find an album for you...
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="App">
          <div className="Cover">
            ???
          </div>
          <div>
            <button onClick={this.authenticate}>Sign in with Spotify</button> to<br />
            reveal the mystery album.
          </div>
        </div>
      );
    }
  }
}

export default App;
