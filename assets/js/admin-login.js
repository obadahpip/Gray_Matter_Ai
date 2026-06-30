const API_BASE_URL = "https://gray-matter-ai.onrender.com";

const adminLoginForm = document.querySelector("#adminLoginForm");
const adminEmailInput = document.querySelector("#adminEmail");
const adminPasswordInput = document.querySelector("#adminPassword");
const adminLoginMessage = document.querySelector("#adminLoginMessage");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = adminEmailInput.value.trim();
    const password = adminPasswordInput.value.trim();

    try {
      adminLoginMessage.textContent = "Logging in...";
      adminLoginMessage.className = "order-message";

      const response = await fetch(`${API_BASE_URL}/api/auth/login`,  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("gmAdminToken", data.token);
      localStorage.setItem("gmAdminEmail", data.admin.email);

      window.location.href = "admin-orders.html";
    } catch (error) {
      adminLoginMessage.textContent = error.message;
      adminLoginMessage.className = "order-message error";
    }
  });
}