const API_BASE_URL = "https://gray-matter-ai.onrender.com";

const adminOrdersTableBody = document.querySelector("#adminOrdersTableBody");
const adminOrdersMessage = document.querySelector("#adminOrdersMessage");
const adminLogoutBtn = document.querySelector("#adminLogoutBtn");

const adminOrderModal = document.querySelector("#adminOrderModal");
const orderModalClientName = document.querySelector("#orderModalClientName");
const orderModalContent = document.querySelector("#orderModalContent");
const closeOrderModalButtons = document.querySelectorAll(
  "[data-close-order-modal]",
);

const adminToken = localStorage.getItem("gmAdminToken");

let loadedOrders = [];

function formatJOD(amount) {
  const number = Number(amount || 0);
  return `${number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} JOD`;
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function redirectToLogin() {
  window.location.href = "admin-login.html";
}

function openOrderModal(orderId) {
  const order = loadedOrders.find((item) => item._id === orderId);

  if (!order || !adminOrderModal || !orderModalContent) return;

  const addons =
    order.project?.selectedAddons?.length > 0
      ? order.project.selectedAddons
          .map(
            (addon) => `
              <p>
                <span>${addon.name}</span>
                <strong>${formatJOD(addon.price)}</strong>
              </p>
            `,
          )
          .join("")
      : `
        <p>
          <span>No add-ons selected</span>
          <strong>0 JOD</strong>
        </p>
      `;

  orderModalClientName.textContent =
    order.customer?.fullName || "Order details";

  orderModalContent.innerHTML = `
    <div class="order-modal-grid">
      <div class="order-modal-card">
        <h3>Customer</h3>
        <p><span>Name</span><strong>${order.customer?.fullName || "-"}</strong></p>
        <p><span>Email</span><strong>${order.customer?.email || "-"}</strong></p>
        <p><span>Phone</span><strong>${order.customer?.phone || "-"}</strong></p>
        <p><span>Company</span><strong>${order.customer?.companyName || "-"}</strong></p>
        <p><span>Preferred Contact</span><strong>${order.customer?.preferredContact || "-"}</strong></p>
      </div>

      <div class="order-modal-card">
  <h3>Order Status</h3>

  <label class="admin-status-control">
    Change status
    <select id="orderStatusSelect" data-order-id="${order._id}">
      <option value="new" ${order.status === "new" ? "selected" : ""}>New</option>
      <option value="approved" ${order.status === "approved" ? "selected" : ""}>Approved</option>
      <option value="rejected" ${order.status === "rejected" ? "selected" : ""}>Rejected</option>
          <option value="done" ${order.status === "done" ? "selected" : ""}>Done</option>

      </select>
  </label>

  <p id="statusUpdateMessage" class="order-message"></p>
</div>

      <div class="order-modal-card">
        <h3>Pricing</h3>
        <p><span>Base Tier</span><strong>${order.project?.baseTier?.key || ""} — ${order.project?.baseTier?.name || "-"}</strong></p>
        <p><span>Base Price</span><strong>${formatJOD(order.project?.baseTier?.price)}</strong></p>
        <p><span>Add-ons Total</span><strong>${formatJOD(order.project?.addonsTotal)}</strong></p>
        <p><span>Maintenance</span><strong>${order.project?.maintenance?.months || 0} months — ${formatJOD(order.project?.maintenance?.total)}</strong></p>
        <p><span>Hosting</span><strong>${order.project?.hosting?.selected ? formatJOD(order.project?.hosting?.total) : "Not selected"}</strong></p>
        <p><span>VAT</span><strong>${formatJOD(order.project?.vat?.amount)}</strong></p>
        <p><span>Total</span><strong>${formatJOD(order.project?.estimatedTotal)}</strong></p>
      </div>
    </div>

    <div class="order-modal-card">
      <h3>Selected Add-ons</h3>
      ${addons}
    </div>

    <div class="order-modal-card">
      <h3>Project Notes</h3>
      <div class="order-notes-box">
        ${order.project?.notes || "No notes added."}
      </div>
    </div>
  `;

  adminOrderModal.classList.add("active");
  document.body.style.overflow = "hidden";

  const statusSelect = document.querySelector("#orderStatusSelect");
  const statusUpdateMessage = document.querySelector("#statusUpdateMessage");

  if (statusSelect) {
    statusSelect.addEventListener("change", async () => {
      const newStatus = statusSelect.value;

      try {
        statusUpdateMessage.textContent = "Updating status...";
        statusUpdateMessage.className = "order-message";

        const response = await fetch(
          `${API_BASE_URL}/api/orders/${order._id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to update status");
        }

        statusUpdateMessage.textContent = "Status updated successfully.";
        statusUpdateMessage.className = "order-message success";

        order.status = newStatus;

        const tableStatus = document.querySelector(
          `[data-status-order-id="${order._id}"]`,
        );

        if (tableStatus) {
          tableStatus.textContent = newStatus;
          tableStatus.className = `admin-status-pill ${newStatus}`;
        }
      } catch (error) {
        statusUpdateMessage.textContent = error.message;
        statusUpdateMessage.className = "order-message error";
      }
    });
  }
}

function closeOrderModal() {
  if (!adminOrderModal) return;

  adminOrderModal.classList.remove("active");
  document.body.style.overflow = "";
}

async function deleteOrder(orderId) {
  const confirmed = confirm("Are you sure you want to delete this order?");

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete order");
    }

    loadedOrders = loadedOrders.filter((order) => order._id !== orderId);

    loadOrders();
  } catch (error) {
    adminOrdersMessage.textContent = error.message;
    adminOrdersMessage.className = "order-message error";
  }
}

async function loadOrders() {
  if (!adminToken) {
    redirectToLogin();
    return;
  }

  try {
    adminOrdersMessage.textContent = "Loading orders...";

    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load orders");
    }

    loadedOrders = data.orders || [];

    if (loadedOrders.length === 0) {
      adminOrdersMessage.textContent = "No orders yet.";
      adminOrdersTableBody.innerHTML = "";
      return;
    }

    adminOrdersMessage.textContent = "";

    adminOrdersTableBody.innerHTML = loadedOrders
      .map((order) => {
        return `
          <tr>
            <td>
              <strong>${order.customer?.fullName || "-"}</strong>
              <small>${order.customer?.companyName || ""}</small>
            </td>

            <td>${order.customer?.email || "-"}</td>
            <td>${order.customer?.phone || "-"}</td>

            <td>
              <strong>${formatJOD(order.project?.estimatedTotal)}</strong>
            </td>

            <td>
              <span
  class="admin-status-pill ${order.status}"
  data-status-order-id="${order._id}"
>
  ${order.status}
</span>
            </td>

            <td>${formatDate(order.createdAt)}</td>

            <td>
  <div class="admin-actions">
    <button type="button" class="admin-view-btn" data-order-id="${order._id}">
      View
    </button>

    <button type="button" class="admin-delete-btn" data-order-id="${order._id}">
      Delete
    </button>
  </div>
</td>
          </tr>
        `;
      })
      .join("");

    document.querySelectorAll(".admin-view-btn").forEach((button) => {
      button.addEventListener("click", () => {
        openOrderModal(button.dataset.orderId);
      });
    });
    document.querySelectorAll(".admin-delete-btn").forEach((button) => {
  button.addEventListener("click", () => {
    deleteOrder(button.dataset.orderId);
  });
});
  } catch (error) {
    adminOrdersMessage.textContent = error.message;
    adminOrdersMessage.className = "order-message error";

    if (
      error.message.includes("Not authorized") ||
      error.message.includes("token")
    ) {
      localStorage.removeItem("gmAdminToken");
      localStorage.removeItem("gmAdminEmail");
      redirectToLogin();
    }
  }
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", () => {
    localStorage.removeItem("gmAdminToken");
    localStorage.removeItem("gmAdminEmail");
    redirectToLogin();
  });
}

closeOrderModalButtons.forEach((button) => {
  button.addEventListener("click", closeOrderModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOrderModal();
  }
});

loadOrders();
