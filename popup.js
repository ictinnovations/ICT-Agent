'use strict';
var contct_url;
var simple;
var activeCall;
var num;
var remoteId;
var extension;
var settings = {
    url: 'http://demo.ictbroadcast.com/rest',
    username : 'user',
    password : 'user',
    contact_load : 'https://www.google.com/search?q={phone_number}',
    phone_pattern : '([0-9-()+]{6,20})',
    token : 'abc',
    agent : false,
    searchphn:false,
}
var in_number;
var in_name;
var C = {
  STATUS_NULL:         0,
  STATUS_NEW:          1,
  STATUS_CONNECTING:   2,
  STATUS_CONNECTED:    3,
  STATUS_COMPLETED:    4
};
var options;
var cityName;
var def;
var infax = [];
var outfax = [];
var documentArray = [];
var file_name = '';
var file_type = '';
var file_content = '';
var sipConfig = {};
// Call timer
let callSeconds = 0;
let callTimer;
// Declare `simpleUser` globally
let simpleUser;
let isHold = false;
let isMuted = false;

// Step navigation
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const postLogin     = document.getElementById("postLogin");
const callSection   = document.getElementById("callSection");
const endCallButton = document.getElementById("endCallButton");
const dialButton    = document.getElementById("dial");
const clearButton   = document.getElementById("clearButton");
const dialNumber    = document.getElementById("dialNumber");
const keypadButtons = document.querySelectorAll("#keypad button");
const callDuration  = document.getElementById("callDuration");
const dialpadIcon   = document.getElementById("dialpadIcon");
const holdButton    = document.getElementById("holdButton");
const callDialPad   = document.getElementById("callDialPad");
const callStatusElement    = document.getElementById("callStatus");
const keypadContainer      = document.getElementById('keypadContainer');
const clearLastDigitButton = document.getElementById("clearLastDigit");


// / Request microphone access early
navigator.mediaDevices.getUserMedia({ audio: true })
.then(() => {
  console.log("Microphone access granted.");
})
.catch((error) => {
  console.error("Microphone access denied:", error);
  alert("Please allow microphone access for this application to work correctly.");
});

// Step 1: Login
document.getElementById("next1").addEventListener("click", () => {
  sipConfig.extension = document.getElementById("extension").value;
  sipConfig.password = document.getElementById("password").value;
  step1.classList.add("hidden");
  step2.classList.remove("hidden");
});

// Step 2: Host Configuration
document.getElementById("next2").addEventListener("click", () => {
  sipConfig.hostname = document.getElementById("hostname").value;
  step2.classList.add("hidden");
  step3.classList.remove("hidden");
});

// Step 3: Port Configuration and SIP Login
document.getElementById("connect").addEventListener("click", () => {
  console.log("connect call");
  sipConfig.port = document.getElementById("port").value;
  loginToSIP(sipConfig);
  console.log("after connection");
  toggleDialAndClearButtons();
  step3.classList.add("hidden");
  postLogin.classList.remove("hidden");
  // loadContacts();
});

// Login to SIP Server
function loginToSIP(config) {
  console.log(config);
  
  // Set the extension to "web_1111" dynamically
  // config.extension = "web_" + config.extension;

  // Options for SimpleUser
  const options = {
    aor: "sip:" + config.extension + "@" + config.hostname,  // Use the updated extension (web_1111)
    media: {
      constraints: { audio: true, video: false },  // Audio-only call
      remote: { audio: getAudioElement("remoteAudio") }  // Play remote audio in the element with id 'remoteAudio'
    },
    userAgentOptions: {
      authorizationUsername: config.extension,  // Authorization username
      authorizationPassword: config.password,  // Authorization password
      logLevel: "debug"  // Debug level logging
    }
  };

  const server = "wss://" + config.hostname + ":" + config.port + "/ws";  // WebSocket server URL

  console.log(options);
  console.log(server);
  console.log(SIP);  // Check if SIP is defined

  // Construct the SimpleUser instance
  simpleUser = new SIP.Web.SimpleUser(server, options);

  // Connect to the server, but do not dial a call immediately
  simpleUser.connect()
  .then(() => {
    console.log('SIP connected');  // Only indicate that SIP is connected
    console.log(SIP.version);
    // No call initiation here, just waiting for further actions
  })
  .catch((error) => {
    console.error('Connection failed:', error);
  });
}


// Dial functionality
dialButton.addEventListener("click", () => {
  const number = dialNumber.value.trim();

  // Validate phone number
  if (!number || !/^\d+$/.test(number)) {
    alert("Please enter a valid phone number.");
    return;
  }

  // Disable dial button to prevent multiple clicks
  dialButton.disabled = true;

  // Request microphone access only when initiating a call
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      console.log("Microphone access granted.");

      // Proceed with the call
      return simpleUser.call(`sip:${number}@${sipConfig.hostname}`, {
        mediaConstraints: { audio: true, video: false }
      });
    })
    .then((call) => {
      console.log("Call initiated successfully.");
      callConnectedControl(number);

      // Update status to "Ringing"
      updateCallStatus("Ringing");
      console.log(simpleUser.isCalling);
      console.log(simpleUser.isConnected);

      // Set up call event handling
      simpleUser.delegate = {
        onCallAnswered: () => {
          console.log("Call answered by Party B.");
          updateCallStatus("Answered");
          startCallTimer();
        },
        onCallHangup: () => {
          console.log("Call ended.");
          updateCallStatus("Call Ended");
          clearInterval(callTimer);
          naviageToPost();
        },
        onCallDecline: () => {
          console.log("Call declined by Party B.");
          updateCallStatus("Declined");
          naviageToPost();
        }
      };
    })
    .catch((error) => {
      console.error("Call failed or microphone access denied:", error);
      alert(error.message || "An error occurred while making the call.");
    })
    .finally(() => {
      // Re-enable the button after the operation
      dialButton.disabled = false;
    });
});

function callConnectedControl(number) {
  document.getElementById("callerNumber").innerText = number; // Update number
  // document.getElementById("callerDomain").innerText = `${number}@${sipConfig.hostname}`; // Update domain

  postLogin.classList.add("hidden");
  callSection.classList.remove("hidden");
  // Start call duration timer
  
  clearNumber(); // Clear number input after successful call initiation
  toggleDialAndClearButtons();
}

// end call
endCallButton.addEventListener("click", () => {
  console.log(simpleUser);
  console.log("hanup call");
  console.log(simpleUser.isCalling);
  console.log(simpleUser.isConnected);
  // Assuming `simpleUser` is your SimpleUser instance
  if (simpleUser.isCalling || simpleUser.isConnected) {
    simpleUser.hangup()
      .then(() => {
        console.log("Call successfully ended.");
        updateCallStatus("Call Ended"); // Update call status in the UI
      })
      .catch((error) => {
        console.error("Error while hanging up the call:", error);
      });
  } else {
    console.log("No active call to hang up.");
  }
  naviageToPost();
});

// Add event listener to the hold button
holdButton.addEventListener("click", () => {
  if (!simpleUser.isConnected) {
    alert("No active call to hold.");
    return;
  }

  if (isHold) {
    // Unhold the call
    simpleUser.unhold()
      .then(() => {
        console.log("Call unheld successfully.");
        updateCallStatus("Unheld");
        holdButton.innerHTML = '<i class="fas fa-pause-circle"></i>'; // Update button icon
        isHold = false;
      })
      .catch((error) => {
        console.error("Error while unholding the call:", error);
        alert("Failed to unhold the call.");
      });
  } else {
    // Hold the call
    simpleUser.hold()
      .then(() => {
        console.log("Call held successfully.");
        updateCallStatus("On Hold");
        holdButton.innerHTML = '<i class="fas fa-play-circle"></i>'; // Update button icon
        isHold = true;
      })
      .catch((error) => {
        console.error("Error while holding the call:", error);
        alert("Failed to hold the call.");
      });
  }
});

function naviageToPost() {
  // Navigate to the Post Login page
  callSection.classList.add("hidden");
  postLogin.classList.remove("hidden");

  // Reset call timer
  clearInterval(callTimer);
  callSeconds = 0;
  callDuration.innerText = "00:00";
}

// Function to append a number to the dialNumber input
function appendNumber(num) {
  dialNumber.value += num;
}

// Function to clear the dialNumber input
function clearNumber() {
  dialNumber.value = "";
}

// Function to set the extension in the dialNumber input
function setExtension(extension) {
  dialNumber.value = extension;
}

function startCallTimer() {
  callTimer = setInterval(() => {
    callSeconds++;
    const minutes = String(Math.floor(callSeconds / 60)).padStart(2, "0");
    const seconds = String(callSeconds % 60).padStart(2, "0");
    callDuration.innerText = `${minutes}:${seconds}`;
  }, 1000);
}

// Helper function to get an HTML audio element
function getAudioElement(id) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  } else {
    console.log("audio element success");
  }
  return el;
}

// Function to toggle visibility of Dial and Clear buttons
function toggleDialAndClearButtons() {
  const hasNumber = dialNumber.value.trim().length > 0;
  dialButton.style.display = hasNumber ? "inline-block" : "none";
  clearButton.style.display = hasNumber ? "inline-block" : "none";
}

// Add event listeners for clickable extensions
document.getElementById("contactList").addEventListener("click", (e) => {
  if (e.target.classList.contains("extension")) {
      e.preventDefault();
      const value = e.target.getAttribute("data-extension");
      setExtension(value);
      toggleDialAndClearButtons();
  }
});

// Event listener for keypad button clicks
keypadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.getAttribute("data-value");
    dialNumber.value += value;
    toggleDialAndClearButtons();
  });
});

// Event listener for Clear button
clearButton.addEventListener("click", () => {
  dialNumber.value = "";
  toggleDialAndClearButtons();
  clearNumber();
});

// Event listener for Clear Last Digit button
clearLastDigitButton.addEventListener("click", () => {
  const currentValue = dialNumber.value;
  dialNumber.value = currentValue.slice(0, -1);
  toggleDialAndClearButtons();
});

dialpadIcon.addEventListener('click', function () {
  if (keypadContainer.classList.contains('hidden')) {
    keypadContainer.classList.remove('hidden');
  } else {
    keypadContainer.classList.add('hidden');
  }
});

// Function to update the call status
function updateCallStatus(status) {
  if (callStatusElement) {
    callStatusElement.innerText = `${status}`;
  } else {
    console.warn("Call status element not found.");
  }
}

// When the "openCreateDialog" button is clicked
document.getElementById("openCreateDialog").addEventListener("click", function() {
  // Open the modal
  var myModal = new bootstrap.Modal(document.getElementById('apiKeyModal'));
  myModal.show();
});

// Handle the save button click to get the form data
// document.getElementById("saveNameNumber").addEventListener("click", function() {
//   var name = document.getElementById("nameInput").value;
//   var number = document.getElementById("numberInput").value;
  
//   // You can perform any action here like sending the data to a server
//   console.log("Name: " + name + ", Number: " + number);

//   // Close the modal
//   var myModal = bootstrap.Modal.getInstance(document.getElementById('apiKeyModal'));
//   // myModal.hide();
// });

document.getElementById('fetchContactGroups').addEventListener('click', function() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  if (!apiKey) {
      alert('Please enter an API Key');
      return;
  }

  const url = `https://${sipConfig.hostname}/rest/Contact_Group_List`;

  fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
      },
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
      const contactGroupSelect = document.getElementById('contactGroupSelect');
      contactGroupSelect.innerHTML = '<option value="">Select a Contact Group</option>';
      document.getElementById('importContacts').disabled = true; // Disable import initially

      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        data[1].forEach(group => {
            let option = document.createElement('option');
            option.value = group.contact_group_id; 
            option.textContent = group.name;
            contactGroupSelect.appendChild(option);
        });
        document.getElementById('importContacts').disabled = false; // Enable import when groups are loaded
        document.getElementById('fetchContactGroups').disabled = true;
      } else {
          alert('No contact groups found or invalid response.');
      }
  })
  .catch(error => {
      console.error('Error fetching contact groups:', error);
      alert('Failed to fetch contact groups.');
  });
});

// Import contacts when the button is clicked
document.getElementById('importContacts').addEventListener('click', function() {
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const contactGroupId = document.getElementById('contactGroupSelect').value;

  if (!apiKey) {
      alert('Please enter an API Key');
      return;
  }
  if (!contactGroupId) {
      alert('Please select a Contact Group');
      return;
  }

  const queryParams = new URLSearchParams({
    search: JSON.stringify({ contact_group_id: contactGroupId })
  });
  const apiUrl = `https://${sipConfig.hostname}/rest/Contact_List?${queryParams.toString()}`;

  fetch(apiUrl, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
      },
  })
  .then(response => response.json())
  .then(data => {
      const contactList = document.getElementById('contactList');
      contactList.innerHTML = ''; // Clear existing contacts
      console.log(data);

      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
          data[1].forEach(contact => {
              let row = document.createElement('tr');
              row.innerHTML = `
                  <td>${contact.first_name ?? ''} ${contact.last_name ?? ''}</td>
                  <td>
                      <a href="#" class="extension" data-extension="${contact.phone}">${contact.phone}</a>
                  </td>
              `;
              contactList.appendChild(row);
          });
          // Close modal after successful data update
          const modal = document.getElementById('apiKeyModal'); // Replace with your actual modal ID
          if (modal) {
              const bootstrapModal = bootstrap.Modal.getInstance(modal);
              bootstrapModal.hide();
          }
      } else {
          alert('No contacts found.');
      }
  })
  .catch(error => {
      console.error('Error fetching contacts:', error);
      alert('Failed to fetch contacts.');
  });
});

document.getElementById('callDialPad').addEventListener('click', () => {
  // Show the dial pad modal
  $('#dialPadModal').modal('show');
});

// Listen for numeric keypresses
const dialpadButtons = document.querySelectorAll('.dialpad-btn');
dialpadButtons.forEach(button => {
  button.addEventListener('click', () => {
    const number = button.getAttribute('data-number');
    console.log('Send DTMF:', number);
    dialNumber.value = "";
    sendDTMF(number);
  });
});

function sendDTMF(digit) {
  console.log(simpleUser.session);
  simpleUser.sendDTMF(digit);
}
