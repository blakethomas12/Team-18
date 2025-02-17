// Functions here are used by the html files to perform actions - Gavin Fifer
function goToPage(route) {
  window.location.href = route;
}

function showMap() {
  const map = document.getElementById("overlay-map");
  const canvas = document.getElementById("guess-canvas");
  const button = document.getElementById("show-map-button")
  if (map.style.display === "none") {
    map.style.display = "block";
    button.textContent = "Hide Map";
  } else {
    map.style.display = "none";
    button.textContent = "Show Map";
  }
  if (canvas.style.display === "none") {
    canvas.style.display = "block";
  } else {
    canvas.style.display = "none";
  }

}

let actualLat, actualLng;
let guessX, guessY;
let totalScore = 0;
let currentRound = 1;
const totalRounds = 5;

const mapBounds = {
  topLeft: { lat: 44.56766730220258, lng: -123.28959983789187 },
  bottomRight: { lat: 44.55977402745042, lng: -123.2750217935866 },
};

function getRandomStreetViewEmbedLink() {
  // generate random latitude and longitude within bounds
  actualLat = Math.random() * (mapBounds.topLeft.lat - mapBounds.bottomRight.lat) + mapBounds.bottomRight.lat;
  actualLng = Math.random() * (mapBounds.bottomRight.lng - mapBounds.topLeft.lng) + mapBounds.topLeft.lng;

  return `https://www.google.com/maps/embed?pb=!4v0!6m8!1m7!1sPLACEHOLDER!2m2!1d${actualLat.toFixed(6)}!2d${actualLng.toFixed(6)}!3f0!4f0!5f0.7820865974627469`;
}

function loadRandomStreetView() {
  const iframe = document.getElementById("streetViewFrame");
  iframe.src = getRandomStreetViewEmbedLink();
}

function startGame(){
  console.log("game started");  //debugging
  totalScore = 0;
  currentRound = 1;

  const roundMessage = document.getElementById("current-round");
  if(roundMessage){
    roundMessage.textContent = `Round: ${currentRound}/${totalRounds}`;
  }

  const resultMessage = document.getElementById("game-result-message");
  if (resultMessage) {
    resultMessage.style.display = "none"; //hide previous score
  }

  const restartButton = document.getElementById("restart-game-button");
  if (restartButton) {
    restartButton.style.display = "none"; //hide restart button
  }

  const streetViewFrame = document.getElementById("streetViewFrame");
  if (streetViewFrame) {
    streetViewFrame.style.display = "block"; //show street view
  }
  
  loadRandomStreetView();

  const canvas = document.getElementById("guess-canvas")
  if (canvas && !canvas.hasClickListener) {
    canvas.addEventListener("click", processClick);
    canvas.hasClickListener = true; //prevent duplicate listeners
  }
}

function endGame(){
  const iframe = document.getElementById("streetViewFrame");
  if (iframe) {
    iframe.style.display = "none"; //hide street view
  }

  const resultMessage = document.getElementById("game-result-message");
  if (resultMessage) {
    resultMessage.textContent = `Game Over! Your total score: ${totalScore}`;
    resultMessage.style.display = "block"; //show the final score
  }
  
  const restartGameButton = document.getElementById("restart-game-button");
  if(restartGameButton){
    restartGameButton.style.display = "block"; //show restart game button
  }
}

function processClick(event){
  //debugging: check click coordinates
  const canvas = event.target;
  const rect = canvas.getBoundingClientRect();
  guessX = event.clientX - rect.left;
  guessY = event.clientY - rect.top;
  console.log(`click coordinates: X=${guessX}, Y=${guessY}`);
  //

  if (currentRound <= totalRounds){
    checkGuess();
    console.log(`Guess registerd for round:`, currentRound);  //check current round
    currentRound++;

    //checks to see if more rounds are left
    if (currentRound <= totalRounds){
      const roundMessage = document.getElementById("current-round");
      //update round message
      if (roundMessage) {
        roundMessage.textContent = `Round: ${currentRound}/${totalRounds}`;
      }
      loadRandomStreetView();
    } else {
      console.log("submitting score:", totalScore); //debugging
      submitScore(totalScore).then(() => endGame()); //show the final score & stop new rounds
    }
  } 
}

function latLngToXY(lat, lng, imgWidth, imgHeight) {
  const x = ((lng - mapBounds.topLeft.lng) / (mapBounds.bottomRight.lng - mapBounds.topLeft.lng)) * imgWidth;
  const y = ((mapBounds.topLeft.lat - lat) / (mapBounds.topLeft.lat - mapBounds.bottomRight.lat)) * imgHeight;
  return { x, y };
}

function drawGuess(guessx, guessy, actualx, actualy) {
  //debugging: check if draw guess is succesfully being called
  console.log("succesfully called drawGuess");

  const canvas = document.getElementById("guess-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  //draws line between guess and actual location 
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guessX, guessY);
  ctx.lineTo(actualx, actualy)
  ctx.stroke();

  //guess location
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(guessx, guessy, 5, 0, 2 * Math.PI);
  ctx.fill();

  //actual location
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(actualx, actualy, 5, 0, 2 * Math.PI);
  ctx.fill();
}

//dont need to calculate score, send user guess and actual coords to database
function checkGuess() {
  console.log("succesfully called checking guess");
  const img = document.getElementById("guess-canvas");
  const { x: actualX, y: actualY } = latLngToXY(actualLat, actualLng, img.clientWidth, img.clientHeight);

  drawGuess(guessX, guessY, actualX, actualY);

  const distance = Math.sqrt((actualX - guessX) ** 2 + (actualY - guessY) ** 2);
  document.getElementById("feedback").innerText = `Distance: ${Math.round(distance)} pixels`;
}

//make sure everything is laoded 
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  if (window.location.pathname === "/guesser") {
    startGame();
  }
});

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const staySignedIn = document.getElementById('stay-signed-in').checked

  if(username && password){
    try {
      const response = await fetch("/loginUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username, password: password, staySignedIn: staySignedIn }),
      });
      if (response.redirected) {
        window.location.href = response.url;
      }
      const result = await response.json()
      if(result.message = "fail"){
        alert("Username or Password is incorrect!")
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  }
}

async function logout() {
  const response = await fetch("/logout", {
    method: "POST",
  });
  if (response.redirected) {
    window.location.href = response.url;
  }
}

async function register() {
  const username = document.getElementById('username').value.trim()
  const password1 = document.getElementById('password').value.trim()
  const password2 = document.getElementById('confirm-password').value.trim()

  if(password1 === password2){

    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({username: username, password: password1})
    })

    const result = await response.json()
    if(result.message === "success"){
      window.location.href = '/login'
      alert("Sign Up Successful! You can now log in")
    }else if(result.message === "taken"){
      alert("That username is taken! Please try another")
    }else{
      alert("There was an error signing up. Please try again soon!")
    }
  }else{
    alert("Passwords do not match!")
  }
}

async function submitScore(score) {
  const response = await fetch("/submitScore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ score: score }),
  });

  const result = await response.json();
  if (result.message === "success") {
    alert("Score Submitted!");
  } else {
    alert("There was an error submitting your score. Please try again.");
  }
}

async function deleteProfile() {
  const confirmed = window.confirm('Are you sure you want to delete your account. This action can not be undone.')
  if(confirmed){
    const response = await fetch('/delete', {method: "POST"})
    
      if(response.redirected){
        window.location.href = response.url;
      }
  }
}