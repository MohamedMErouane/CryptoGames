let heads = 0;
let tails = 0;
let playerScore = 100;

const coin = document.querySelector(".coin");
const flipBtn = document.querySelector("#flip-button");
const resetBtn = document.querySelector("#reset-button");
const betAmountInput = document.querySelector("#bet-amount");
const message = document.querySelector("#result-msg");
const scoreDisplay = document.querySelector("#player-score");

flipBtn.addEventListener("click", () => {
  const bet = parseInt(betAmountInput.value);
  const selectedChoice = document.querySelector('input[name="choice"]:checked').value;

  if (bet > playerScore || bet <= 0) {
    alert("Invalid bet amount!");
    return;
  }

  const i = Math.floor(Math.random() * 2); // 0 or 1
  const result = i ? "heads" : "tails";

  coin.style.animation = "none";

  setTimeout(() => {
    coin.style.animation = i
      ? "spin-heads 3s forwards"
      : "spin-tails 3s forwards";
  }, 100);

  i ? heads++ : tails++;

  setTimeout(() => {
    updateStats();
    const won = selectedChoice === result;
    if (won) {
      playerScore += bet;
      message.textContent = `🎉 You won ${bet} pts!`;
      message.style.color = "green";
    } else {
      playerScore -= bet;
      message.textContent = `😢 You lost ${bet} pts.`;
      message.style.color = "red";
    }
    scoreDisplay.textContent = playerScore;
  }, 3000);

  disableButton();
});

function updateStats() {
  document.querySelector("#heads-count").textContent = `Heads: ${heads}`;
  document.querySelector("#tails-count").textContent = `Tails: ${tails}`;
}

function disableButton() {
  flipBtn.disabled = true;
  setTimeout(() => {
    flipBtn.disabled = false;
  }, 3000);
}

resetBtn.addEventListener("click", () => {
  coin.style.animation = "none";
  heads = 0;
  tails = 0;
  playerScore = 100;
  updateStats();
  scoreDisplay.textContent = playerScore;
  message.textContent = "Make your bet!";
  message.style.color = "#333";
});
