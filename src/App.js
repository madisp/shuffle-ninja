import React from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

import './App.css';

class App extends React.Component {

  state = { album: null }

  accessToken = this.parseAccessToken();

  authLink = "https://accounts.spotify.com/authorize" +
    "?client_id=929d639d36d0410793f9b8d5f084246f" +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent("https://shuffle.ninja") +
    "&scope=" + encodeURIComponent("user-library-read")

  async componentDidMount() {
    if (this.accessToken && !this.state.album) {
      let api = new SpotifyWebApi();
      api.setAccessToken(this.accessToken);
      let probe = await api.getMySavedAlbums({ limit: 1 });

      let totalCount = probe.total;
      let randomIndex = Math.floor(Math.random() * totalCount);

      let album = await api.getMySavedAlbums({ offset: randomIndex, limit: 1 });

      console.log(album.items[0].album);

      this.setState({ album: album.items[0].album })
    }
  }

  render() {
    if (this.accessToken) {
      if (this.state.album) {
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
              { displayString }
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
              Determining the album...
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
            <a href={this.authLink}>Sign in with Spotify to reveal the mystery album.</a>
          </div>
        </div>
      );
    }
  }

  parseAccessToken() {
    let hashStr = window.location.hash;
    if (hashStr.startsWith("#")) {
      let tokens = hashStr.substring(1).split("&")
        .map((pair) => pair.split("="))
        .filter((kv) => kv[0] === "access_token")
        .map((kv) => kv[1])

      if (tokens.length > 0) {
        return tokens[0];
      }
    }
    return null;
  }
}

export default App;
