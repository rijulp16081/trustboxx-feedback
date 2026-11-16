// ---------------------------------------------------------------
// TEST MODE
// true  -> form data is printed in the browser console (no POST to website.php)
// false -> original behaviour: POST to website.php with reCAPTCHA
// Set to false when integrating with the website.
// ---------------------------------------------------------------
var TEST_MODE = true;

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("loader-icons").style.display = "none";

  document
    .getElementById("contact-general")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      var validContact = validationcontact();
      var submitBtn = document.getElementById("submit-cnt");

      // reCAPTCHA is skipped in test mode (it will not load locally)
      if (!TEST_MODE) {
        var recaptcha = grecaptcha.getResponse();
        if (recaptcha.length === 0) {
          alert("Please complete the reCAPTCHA");
          return; // STOP FORM SUBMISSION
        }
      }

      if (validContact) {
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        document.getElementById("loader-icons").style.display = "block";

        var formData = new FormData(this);
        // g-recaptcha-response and trustboxx_nonce are picked up automatically
        // as long as they exist as fields inside the <form> markup.

        // ---------------- TEST MODE: print to console ----------------
        if (TEST_MODE) {
          var payload = {};
          formData.forEach(function (value, key) {
            payload[key] = value;
          });

          console.log("========== FEEDBACK (test mode, not sent) ==========");
          console.log(payload);
          console.table(payload);
          console.log("====================================================");

          document.getElementById("loader-icons").style.display = "none";
          submitBtn.disabled = false;
          document.getElementById("contact-general").reset();
          toastalert("Test mode: feedback printed in the console.");
          return; // no reload, so the console output stays visible
        }

        // ---------------- ORIGINAL: POST to website.php ----------------
        var xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          "website.php",
          true
        );

        xhr.onload = function () {
          document.getElementById("loader-icons").style.display = "none";
          submitBtn.disabled = false;

          var result = null;
          try {
            result = JSON.parse(xhr.responseText);
          } catch (err) {
            result = null;
          }

          if (xhr.status === 200 && result && result.success) {
            document.getElementById("contact-general").reset();
            if (typeof grecaptcha !== "undefined") {
              grecaptcha.reset();
            }
            toastalert(result.message || "Thank you! We will be in touch shortly.");
            setTimeout(function () {
              location.reload();
            }, 2000);
          } else {
            var errorMessage =
              (result && result.message) || "Something went wrong. Please try again.";
            toastalert(errorMessage);
            console.log("Error in submission:", errorMessage);
          }
        };

        xhr.onerror = function () {
          document.getElementById("loader-icons").style.display = "none";
          submitBtn.disabled = false;
          toastalert("Network error. Please try again.");
          console.log("Error in submission");
        };

        xhr.send(formData);
      } else {
        // Scroll to the first error message (the one with text in it)
        var firstError = Array.prototype.find.call(
          document.querySelectorAll(".info"),
          function (el) { return el.innerHTML.trim() !== ""; }
        );
        if (firstError) {
          // Scroll smoothly to the first error message
          window.scrollTo({
            top: firstError.offsetTop - 100,
            behavior: "smooth",
          });
        }
      }
    });
});

function validationcontact() {
  let validContact = true;

  document.querySelectorAll(".info").forEach(info => {
    info.innerHTML = "";
  });

  // Helper function to sanitize malicious characters
  function sanitizeInput(str) {
    return str.replace(/[<>{}]/g, "");
  }

  // NAME VALIDATION
  const enqName = document.getElementById("enqcntname");
  const enqNameInfo = document.getElementById("cntnameinfo");
  let nameValue = enqName.value.trim();
  enqName.value = nameValue;

  if (!nameValue) {
    enqNameInfo.innerHTML = "Please enter a name";
    enqName.style.borderColor = "red";
    validContact = false;
  } else if (!/^[A-Za-z.\s]{2,50}$/.test(nameValue)) {
    enqNameInfo.innerHTML = "Name must contain only alphabets, spaces, or dots (max 50 characters)";
    enqName.style.borderColor = "red";
    validContact = false;
  } else {
    enqName.style.borderColor = "";
  }


  // EMAIL VALIDATION
  const enqEmail = document.getElementById("enqcntemail");
  const enqEmailInfo = document.getElementById("cntemailinfo");
  let emailValue = enqEmail.value.trim();
  enqEmail.value = emailValue;

  if (!emailValue) {
    enqEmailInfo.innerHTML = "Please enter an email address";
    enqEmail.style.borderColor = "red";
    validContact = false;
  } else if (!/^[\w.-]+@[\w.-]+\.\w{2,10}$/.test(emailValue)) {
    enqEmailInfo.innerHTML = "Please enter a valid email";
    enqEmail.style.borderColor = "red";
    validContact = false;
  } else {
    enqEmail.style.borderColor = "";
  }


  // PHONE VALIDATION (optional)
  const enqPhone = document.getElementById("enqcntphone");
  const enqPhoneInfo = document.getElementById("cntphoneinfo");
  let phoneValue = enqPhone.value.trim();
  enqPhone.value = phoneValue;

  if (phoneValue && !/^\d{10}$/.test(phoneValue)) {
    enqPhoneInfo.innerHTML = "Phone must be exactly 10 digits";
    enqPhone.style.borderColor = "red";
    validContact = false;
  } else {
    enqPhone.style.borderColor = "";
  }


  // ROLE VALIDATION (optional)
  const enqRole = document.getElementById("enqrole");
  const enqRoleInfo = document.getElementById("roleinfo");
  let roleValue = enqRole.value.trim();
  enqRole.value = roleValue;

  if (roleValue.length > 25) {
    enqRoleInfo.innerHTML = "Role cannot exceed 25 characters";
    enqRole.style.borderColor = "red";
    validContact = false;
  } else {
    enqRole.style.borderColor = "";
  }


  // COMPANY - Only trim (no rule provided)
  const enqCompany = document.getElementById("enqcompany");
  enqCompany.value = enqCompany.value.trim();


  // CNTREQ - optional + sanitize + max 250 chars handled by HTML
  const cntreq = document.getElementById("cntreq");
  cntreq.value = sanitizeInput(cntreq.value);


  return validContact;
}
