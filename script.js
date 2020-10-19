'use strict';

const APP_PATH = `/auth0confirmation`; // https://ユーザー名.github.io/<ココ> or ルートパス利用なら`/`だけでOK
let auth0 = null;
const fetchAuthConfig = () => fetch("auth_config.json"); // auth_config.json読み込み

var gactn = 'globalset';

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId
  });
};

window.onload = async () => {
  await configureClient();

  updateUI();

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    await window.open("https://storages4aicc.blob.core.windows.net/cc-files/select.html?sv=2019-12-12&ss=b&srt=sco&sp=rx&se=2021-10-13T12:58:27Z&st=2020-10-13T04:58:27Z&spr=https&sig=BWkmkGpxLkon9EYXLqDdi1xibK%2FAKs0X264aAfa2ByA%3D");
    return;
  }

  // NEW - check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    // Process the login state
    await auth0.handleRedirectCallback();
    
    updateUI();

    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, APP_PATH);
  }
};

const updateUI = async () => { 
  const isAuthenticated = await auth0.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = await auth0.getTokenSilently();
    
    gactn = await auth0.getTokenSilently();

    document.getElementById("ipt-user-profile").innerHTML = JSON.stringify(
      await auth0.getUser()
    );

    //プロフ画像
    const profile = await auth0.getUser();
    document.getElementById("ipt-user-profile-image").src = profile.picture;

  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};

const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin + APP_PATH
  });
};

const logout = () => {
  auth0.logout({
    returnTo: window.location.origin + APP_PATH
  });
};
