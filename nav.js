import './homepage.css'

const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const infoInputDiv = document.querySelector("#infoInputDiv");
const infoInputBtn = document.querySelector("#infoInputBtn");

checkSubmissionStatus();

//gameStartDiv.style.backgroundImage = "url('https://static.onfast.app/merchant/m_anakmu/applogo.png')";
//gameStartDiv.style.backgroundImage = "url('/assets/twaterfall.jpg')";

gameStartBtn.addEventListener("click", () => {
  infoInputDiv.style.display = "block";
  gameStartBtn.style.animation = "none";
});


const nameInput = document.getElementById('nameInput');
const telNoInput = document.getElementById('telInput');
const errMsgName = document.querySelector('.errMsgName');
const errMsgTel = document.querySelector('.errMsgTel');
const nameRegex = /^[a-zA-Z\s]+$/;

nameInput.addEventListener('input', function () {
  if (!nameRegex.test(this.value)) {
    errMsgName.style.display = 'flex';
    this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
  } else {
    errMsgName.style.display = 'none';
  }
  updateButtonState();
});

telNoInput.addEventListener('input', function () {
  if (!/^\d+$/.test(this.value)) {
    errMsgTel.innerHTML = '<span class="errorMsg"><span class="material-symbols-outlined">error</span>Phone number only allows numbers</span>';
    errMsgTel.style.display = 'block';
    this.value = this.value.replace(/[^\d]/g, '');
  } else if (!/^01\d{8,9}$/.test(this.value)) {
    errMsgTel.innerHTML = '<span class="errorMsg"><span class="material-symbols-outlined">error</span>Invalid phone number</span>'
    errMsgTel.style.display = 'block';
  } else {
    errMsgTel.style.display = 'none';
  }
  updateButtonState();
});

function updateButtonState() {
  if (nameInput.value.trim() !== '' && telNoInput.value.trim() !== '' && nameRegex.test(nameInput.value) && /^01\d{8,9}$/.test(telNoInput.value)) {
    infoInputBtn.disabled = false;
  } else {
    infoInputBtn.disabled = true;
  }
}

document.getElementById('userForm').onsubmit = async function (event) {
  event.preventDefault();
  const name = nameInput.value;
  const phone = telNoInput.value;

  try {
      const response = await fetch('http://localhost:3001/game/user', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, phone })
      });

      if (!response.ok) {
          if (response.status === 400) {
              const errorData = await response.json();
              infoInputDiv.innerHTML = errorData.error;
              //alert(errorData.error); 
          } else {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
      } else {
          const data = await response.json();
          window.location.href = `game.html?userId=${data.userId}`;
      }
  } catch (error) {
      console.error('Error:', error);
  }
}


async function checkSubmissionStatus() {
  try {
    const response = await fetch('http://localhost:3001/game/submission-status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const status = await response.json();
    const currentDate = new Date();
    let startDateTime, endDateTime;

    if (status.start && typeof status.start === 'string') {
      startDateTime = new Date(status.start);
    } else {
      startDateTime = null;
    }

    if (status.end && typeof status.end === 'string') {
      endDateTime = new Date(status.end);
    } else {
      endDateTime = null;
    }

    const gameStartBtn = document.getElementById('gameStartBtn');

    if (startDateTime && currentDate < startDateTime) {
      gameStartBtn.style.display = "inline-block";
      gameStartBtn.disabled = true;
      gameStartBtn.textContent = "The game has not started yet";
      gameStartBtn.style.pointerEvents = "none";
      gameStartBtn.style.backgroundColor = "grey";
      gameStartBtn.style.animation = "none";
      gameStartBtn.style.boxShadow = "none";
    } else if (endDateTime && currentDate > endDateTime) {
      gameStartBtn.style.display = "inline-block";
      gameStartBtn.disabled = true;
      gameStartBtn.textContent = "The game has ended";
      gameStartBtn.style.pointerEvents = "none";
      gameStartBtn.style.backgroundColor = "grey";
      gameStartBtn.style.animation = "none";
      gameStartBtn.style.boxShadow = "none";
    } else if (startDateTime && endDateTime && currentDate >= startDateTime && currentDate <= endDateTime) {
      gameStartBtn.style.display = "inline-block";
    } else {
      gameStartBtn.style.display = "none";
      gameStartBtn.textContent = "";
    }
  } catch (error) {
    console.error('Error:', error);
  }
}



