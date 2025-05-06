// Function to append a number to the dialNumber input
function appendNumber(num) {
    const dialNumber = document.getElementById("dialNumber");
    dialNumber.value += num;
  }
  
  // Function to clear the dialNumber input
  function clearNumber() {
    const dialNumber = document.getElementById("dialNumber");
    dialNumber.value = "";
  }
  
  // Function to set the extension in the dialNumber input
  function setExtension(extension) {
    const dialNumber = document.getElementById("dialNumber");
    dialNumber.value = extension;
  }
  
  // Add event listeners for keypad buttons
  document.querySelectorAll("#keypad button").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-value");
      if (value) {
        appendNumber(value);
      }
    });
  });
  
  // Add event listener for the Clear button
  document.getElementById("clearButton").addEventListener("click", clearNumber);
  
  // Add event listeners for clickable extensions
  document.querySelectorAll(".extension").forEach((extension) => {
    extension.addEventListener("click", (e) => {
      e.preventDefault();
      const value = extension.getAttribute("data-extension");
      setExtension(value);
    });
  });
  