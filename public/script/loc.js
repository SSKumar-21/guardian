
if ("geolocation" in navigator) {
navigator.geolocation.getCurrentPosition((pos) => {
const lat = pos.coords.latitude;
const lng = pos.coords.longitude;
console.log("your loc:", lat + "," + lng);

// ✅ Firebase link (userId comes from EJS)
const link = `https://her-6d883-default-rtdb.firebaseio.com/users/<%= userId %>.json`;
console.log(link);

// ✅ Perform PATCH request inside callback
fetch(link, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
   latitude: lat,
   longitude: lng,
   updatedAt: new Date().toISOString()
 })
})
 .then(res => res.json())
 .then(data => console.log("Updated in Firebase:", data))
 .catch(err => console.error("Error updating Firebase:", err));

}, (err) => {
alert("Error fetching location: " + err.message);
console.error("Error fetching location:", err.message);
});
} else {
console.error("Geolocation not supported by this browser.");
}

