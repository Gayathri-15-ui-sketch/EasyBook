
import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const services = [
  { name: "General Consultation", duration: "30 minutes", price: "₹500" },
  { name: "Dental Checkup", duration: "30 minutes", price: "₹700" },
  { name: "Eye Consultation", duration: "20 minutes", price: "₹400" },
  { name: "Skin Consultation", duration: "30 minutes", price: "₹600" },
];

function App() {
  const [service, setService] = useState(services[0].name);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  async function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !email.trim() || !date || !time) {
      setMessage("Please fill in all the fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name.trim(),
          email: email.trim(),
          service,
          appointmentDate: date,
          appointmentTime: time,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to book appointment.");
      }

      setMessage("Appointment booked successfully!");
      setName("");
      setEmail("");
      setDate("");
      setTime("10:00");
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadAppointments(token) {
    setIsAdminLoading(true);
    setAdminMessage("");

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load appointments.");
      }

      setAppointments(data.appointments || []);
    } catch (error) {
      setAdminMessage(error.message || "Could not load appointments.");
    } finally {
      setIsAdminLoading(false);
    }
  }

  async function handleAdminLogin(event) {
    event.preventDefault();
    setAdminMessage("");
    setIsAdminLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
       throw new Error(
  data.message || `Admin login failed (${response.status}).`
);
      }

      if (!data.token) {
        throw new Error("The server did not return a login token.");
      }

      setAdminToken(data.token);
      setAdminPassword("");
      await loadAppointments(data.token);
    } catch (error) {
      setAdminMessage(error.message || "Could not connect to the server.");
    } finally {
      setIsAdminLoading(false);
    }
  }

  function handleAdminLogout() {
    setAdminToken("");
    setAdminUsername("");
    setAdminPassword("");
    setAppointments([]);
    setAdminMessage("");
    setShowAdminLogin(false);
  }

  return (
    <div className="app">
      <header className="header">
        <a
          className="logo"
          href="/"
          onClick={() => setShowAdminLogin(false)}
        >
          EasyBook
        </a>

        <div className="header-tagline">
          <span className="role-label">
            {adminToken
              ? "ADMIN"
              : showAdminLogin
              ? "ADMIN LOGIN"
              : "USER / PATIENT"}
          </span>
          <span>Appointments made simple</span>
        </div>

        <button
          className="header-button"
          type="button"
          onClick={() => {
            if (adminToken) {
              handleAdminLogout();
            } else {
              setShowAdminLogin(!showAdminLogin);
              setAdminMessage("");
            }
          }}
        >
          {adminToken
            ? "Admin Logout"
            : showAdminLogin
            ? "Back to Booking"
            : "Admin Login"}
        </button>
      </header>

      <main>
        {showAdminLogin ? (
          <section className="booking-section admin-section">
            {!adminToken ? (
              <>
                <div className="booking-heading">
                  <p className="eyebrow">ADMINISTRATOR</p>
                  <h2>Admin Login</h2>
                  <p>Sign in to manage and view appointments.</p>
                </div>

                <form className="booking-form" onSubmit={handleAdminLogin}>
                  <label htmlFor="adminUsername">Admin username</label>
                  <input
                    id="adminUsername"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter admin username"
                    value={adminUsername}
                    onChange={(event) =>
                      setAdminUsername(event.target.value)
                    }
                    required
                  />

                  <label htmlFor="adminPassword">Admin password</label>
                  <input
                    id="adminPassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(event) =>
                      setAdminPassword(event.target.value)
                    }
                    required
                  />

                  <button
                    className="book-button"
                    type="submit"
                    disabled={isAdminLoading}
                  >
                    {isAdminLoading ? "Signing in..." : "Sign In as Admin"}
                  </button>

                  {adminMessage && (
                    <p className="admin-message error" role="status">
                      {adminMessage}
                    </p>
                  )}
                </form>
              </>
            ) : (
              <>
                <div className="booking-heading">
                  <p className="eyebrow">ADMIN DASHBOARD</p>
                  <h2>All Appointments</h2>
                  <p>Manage and review customer bookings.</p>

                  <button
                    className="refresh-button"
                    type="button"
                    onClick={() => loadAppointments(adminToken)}
                    disabled={isAdminLoading}
                  >
                    {isAdminLoading
                      ? "Refreshing..."
                      : "Refresh Appointments"}
                  </button>
                </div>

                {adminMessage && (
                  <p className="admin-message error" role="status">
                    {adminMessage}
                  </p>
                )}

                {isAdminLoading ? (
                  <p className="empty-message">Loading appointments...</p>
                ) : appointments.length === 0 ? (
                  <p className="empty-message">No appointments found.</p>
                ) : (
                  <div className="table-container">
                    <table className="appointments-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Email</th>
                          <th>Service</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>{appointment.customerName}</td>
                            <td>{appointment.email}</td>
                            <td>{appointment.service}</td>
                            <td>{appointment.appointmentDate}</td>
                            <td>{appointment.appointmentTime}</td>
                            <td>
                              <span className="status-badge">
                                {appointment.status || "Booked"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <section className="hero">
              <p className="eyebrow">WELCOME TO EASYBOOK</p>
              <h1>Your time matters.</h1>
              <p>
                Book your appointment online in just a few simple steps.
              </p>
            </section>

            <section className="services-section">
              <h2>Our Services</h2>
              <p className="section-description">
                Choose the service that suits your needs.
              </p>

              <div className="service-grid">
                {services.map((item) => (
                  <button
                    className={`service-card ${
                      service === item.name ? "selected" : ""
                    }`}
                    type="button"
                    key={item.name}
                    onClick={() => setService(item.name)}
                  >
                    <span className="service-icon">✦</span>
                    <h3>{item.name}</h3>
                    <p>{item.duration}</p>
                    <strong>{item.price}</strong>
                    <span className="select-label">
                      {service === item.name
                        ? "Selected ✓"
                        : "Select service"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="booking-section">
              <div className="booking-heading">
                <p className="eyebrow">BOOK ONLINE</p>
                <h2>Make an appointment</h2>
                <p>Enter your details to reserve your preferred time.</p>
              </div>

              <form className="booking-form" onSubmit={handleBooking}>
                <label htmlFor="service">Select service</label>
                <select
                  id="service"
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                >
                  {services.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                <div className="form-row">
                  <div>
                    <label htmlFor="date">Appointment date</label>
                    <input
                      id="date"
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="time">Appointment time</label>
                    <select
                      id="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      required
                    >
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                    </select>
                  </div>
                </div>

                <button
                  className="book-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Booking..." : "Confirm Appointment"}
                </button>

                {message && (
                  <p
                    className={`booking-message ${
                      message.includes("successfully") ? "success" : "error"
                    }`}
                    role="status"
                  >
                    {message}
                  </p>
                )}
              </form>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} EasyBook. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
