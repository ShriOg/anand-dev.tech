document.getElementById("createRestaurantBtn").addEventListener("click", async () => {

  const payload = {
    name: document.getElementById("restaurantName").value,
    slug: document.getElementById("slug").value,
    phone: document.getElementById("phone").value,
    city: document.getElementById("city").value,

    admin: {
      name: document.getElementById("adminName").value,
      phone: document.getElementById("adminPhone").value,
      password: document.getElementById("adminPassword").value
    },

    menu: []
  };

  try {

    const res = await fetch("/api/platform/create-restaurant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    console.log("Restaurant Created:", data);

  } catch (err) {
    console.error("Error:", err);
  }

});
