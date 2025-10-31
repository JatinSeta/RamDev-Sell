function validateForm() {
  // Clear previous errors
  let errorMessage = document.querySelector('.error');
  if (errorMessage) errorMessage.remove();

  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let message = document.getElementById("message").value;

  if (name === "" || email === "" || message === "") {
    let errorDiv = document.createElement("div");
    errorDiv.classList.add("error");
    errorDiv.textContent = "Please fill in all fields!";
    document.getElementById("contact-form").appendChild(errorDiv);
    return false; // prevent form submission
  }

  // If all fields are filled, submit the form (for demonstration, we return true)
  alert("Message sent!");
  return true;
}
