function handleMapLoad() {
  const status = document.getElementById("status");
  status.textContent = "Fetching current location...";

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const map = L.map("map").setView([lat, lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.marker([lat, lng]).addTo(map).bindPopup("You are here!").openPopup();

      // Fetch nearby police stations
      const query = `
        [out:json];
        node
          ["amenity"="police"]
          (around:2000,${lat},${lng});
        out;
      `;
      const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

      try {
        const response = await fetch(url);
        const data = await response.json();

        data.elements.forEach((el) => {
          if (el.lat && el.lon) {
            L.marker([el.lat, el.lon])
              .addTo(map)
              .bindPopup(el.tags.name || "Police Station");
          }
        });
      } catch (e) {
        status.textContent = "Error fetching police stations: " + e.message;
      }

      // Hide status when map is ready
      map.whenReady(() => {
        status.style.display = "none";
      });
    }, (err) => {
      status.textContent = "Error fetching location: " + err.message;
    });
  } else {
    status.textContent = "Geolocation not supported by this browser.";
  }
}