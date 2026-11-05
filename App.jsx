import { useEffect, useMemo, useState } from "react";
import cabin001 from "./cabin-001.jpg";
import cabin002 from "./cabin-002.jpg";
import cabin003 from "./cabin-003.jpg";
import cabin004 from "./cabin-004.jpg";
import cabin005 from "./cabin-005.jpg";
import cabin006 from "./cabin-006.jpg";
import cabin007 from "./cabin-007.jpg";
import cabin008 from "./cabin-008.jpg";
import defaultUser from "./default-user.jpg";

const initialRooms = [
  { id: "cabin-001", name: "The Fernwood", type: "Forest cabin", capacity: 2, price: 180, image: cabin001, description: "A tucked-away hideout made for slow mornings and long forest walks.", features: ["King bed", "Forest view", "Private deck"] },
  { id: "cabin-002", name: "The Evergreen", type: "Forest cabin", capacity: 4, price: 245, image: cabin002, description: "Warm timber, a crackling fireplace, and space to bring the whole family.", features: ["2 bedrooms", "Fireplace", "Kitchenette"] },
  { id: "cabin-003", name: "The Lookout", type: "Mountain lodge", capacity: 2, price: 220, image: cabin003, description: "Wake up above the trees with a view that makes the early start worthwhile.", features: ["King bed", "Mountain view", "Hot tub"] },
  { id: "cabin-004", name: "The Wildflower", type: "Garden cottage", capacity: 3, price: 195, image: cabin004, description: "A bright little cottage surrounded by a meadow that changes with the seasons.", features: ["Queen bed", "Garden view", "Outdoor shower"] },
  { id: "cabin-005", name: "The Hideaway", type: "Forest cabin", capacity: 4, price: 265, image: cabin005, description: "A secluded retreat with the comforts of home and room to truly unwind.", features: ["2 bedrooms", "Wood stove", "Private deck"] },
  { id: "cabin-006", name: "The Aspen", type: "Garden cottage", capacity: 2, price: 175, image: cabin006, description: "A calm, light-filled space for two, just a short stroll from the trails.", features: ["Queen bed", "Garden view", "Breakfast nook"] },
  { id: "cabin-007", name: "The Ridge", type: "Mountain lodge", capacity: 5, price: 310, image: cabin007, description: "Room for everyone, with big windows looking out across the valley.", features: ["3 bedrooms", "Mountain view", "Fireplace"] },
  { id: "cabin-008", name: "The Fern", type: "Forest cabin", capacity: 3, price: 205, image: cabin008, description: "A cozy base camp for forest adventures and quiet evenings in.", features: ["Queen bed", "Forest view", "Private deck"] },
];

const ADMIN_EMAIL = "admin@wildoasis.com";
const ADMIN_PASSWORD = "admin123";
const roomPhotos = [cabin001, cabin002, cabin003, cabin004, cabin005, cabin006, cabin007, cabin008];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function localDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + amount);
  return localDate(result);
}

function formatDate(date) {
  if (!date) return "";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function nightsBetween(start, end) {
  return Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000);
}

function isRoomAvailable(roomId, checkIn, checkOut, bookings) {
  return !bookings.some((booking) =>
    booking.roomId === roomId &&
    booking.status !== "Cancelled" &&
    booking.checkIn < checkOut &&
    booking.checkOut > checkIn
  );
}

function App() {
  const today = localDate(new Date());
  const [rooms, setRooms] = useState(() => readStorage("wild-oasis-rooms", initialRooms));
  const [users, setUsers] = useState(() => readStorage("wild-oasis-users", []));
  const [bookings, setBookings] = useState(() => readStorage("wild-oasis-bookings", []));
  const [user, setUser] = useState(() => readStorage("wild-oasis-session", null));
  const [activePage, setActivePage] = useState("explore");
  const [authMode, setAuthMode] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({ checkIn: today, checkOut: addDays(today, 2), guests: "1" });
  const [roomType, setRoomType] = useState("All stays");

  useEffect(() => localStorage.setItem("wild-oasis-rooms", JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem("wild-oasis-users", JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem("wild-oasis-bookings", JSON.stringify(bookings)), [bookings]);
  useEffect(() => localStorage.setItem("wild-oasis-session", JSON.stringify(user)), [user]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3800);
    return () => clearTimeout(timer);
  }, [notice]);

  const nights = nightsBetween(filters.checkIn, filters.checkOut);
  const availableRooms = useMemo(() => rooms.filter((room) =>
    room.capacity >= Number(filters.guests) &&
    (roomType === "All stays" || room.type === roomType) &&
    isRoomAvailable(room.id, filters.checkIn, filters.checkOut, bookings)
  ), [rooms, filters, roomType, bookings]);

  function signOut() {
    setUser(null);
    setActivePage("explore");
    setNotice("You’ve signed out. See you next time.");
  }

  function createBooking(room, bookingUser = user) {
    if (!bookingUser) {
      setSelectedRoom(room);
      setAuthMode("login");
      setNotice("Log in or create an account to reserve your stay.");
      return;
    }
    if (bookingUser.role === "admin") {
      setNotice("Switch to a guest account to book a stay.");
      return;
    }
    if (!isRoomAvailable(room.id, filters.checkIn, filters.checkOut, bookings)) {
      setNotice("That room was just booked for those dates. Please choose another stay.");
      return;
    }
    const booking = {
      id: `booking-${Date.now()}`,
      roomId: room.id,
      roomName: room.name,
      guestName: bookingUser.name,
      email: bookingUser.email,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: Number(filters.guests),
      total: room.price * nights,
      status: "Confirmed",
    };
    setBookings((current) => [booking, ...current]);
    setSelectedRoom(null);
    setActivePage("my-stays");
    setNotice(`${room.name} is reserved. We can’t wait to welcome you!`);
  }

  function cancelBooking(id) {
    setBookings((current) => current.map((booking) =>
      booking.id === id ? { ...booking, status: "Cancelled" } : booking
    ));
    setNotice("Your reservation has been cancelled.");
  }

  function updateBookingStatus(id, status) {
    setBookings((current) => current.map((booking) =>
      booking.id === id ? { ...booking, status } : booking
    ));
    setNotice(`Reservation marked ${status.toLowerCase()}.`);
  }

  function addRoom(room) {
    setRooms((current) => [{ ...room, id: `room-${Date.now()}`, image: roomPhotos[(current.length) % roomPhotos.length] }, ...current]);
    setNotice(`${room.name} was added to your stays.`);
  }

  function deleteRoom(id) {
    const room = rooms.find((item) => item.id === id);
    if (bookings.some((booking) => booking.roomId === id && booking.status !== "Cancelled")) {
      setNotice("This stay has active reservations and can’t be removed yet.");
      return;
    }
    setRooms((current) => current.filter((item) => item.id !== id));
    setNotice(`${room?.name ?? "Stay"} was removed.`);
  }

  const myBookings = bookings.filter((booking) => booking.email === user?.email);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setActivePage("explore")} aria-label="The Wild Oasis home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span className="brand-name">the wild <strong>oasis</strong></span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activePage === "explore" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("explore")}>Find a stay</button>
          {user && user.role === "guest" && <button className={activePage === "my-stays" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("my-stays")}>My stays{myBookings.filter((booking) => booking.status !== "Cancelled").length > 0 && <span className="nav-count">{myBookings.filter((booking) => booking.status !== "Cancelled").length}</span>}</button>}
          {user?.role === "admin" && <button className={activePage === "admin" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("admin")}>Admin dashboard</button>}
        </nav>
        <div className="account-actions">
          {user ? (
            <>
              <span className="welcome-user"><img src={user.avatar || defaultUser} alt="" /> <span>Hi, {user.name.split(" ")[0]}</span></span>
              <button className="button button-outline button-small" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <button className="button button-quiet button-small" onClick={() => setAuthMode("login")}>Log in</button>
              <button className="button button-dark button-small" onClick={() => setAuthMode("register")}>Join us</button>
            </>
          )}
        </div>
      </header>

      <main>
        {activePage === "explore" && (
          <>
            <section className="hero">
              <div className="hero-content">
                <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE CLOSER TO NATURE</div>
                <h1>Find your quiet<br /><em>in the wild.</em></h1>
                <p>Thoughtful cabins, forest air, and the kind of stillness that stays with you long after you leave.</p>
                <button className="button button-light hero-button" onClick={() => document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" })}>Explore our stays <span aria-hidden="true">↗</span></button>
              </div>
              <div className="hero-caption"><span className="caption-dot" /> THE WILD OASIS · WOODLAND RETREATS</div>
              <div className="hero-side-note">SLOW DOWN. STAY AWHILE.</div>
            </section>

            <section className="search-wrap" aria-label="Search stays">
              <div className="search-field">
                <label htmlFor="check-in">CHECK IN</label>
                <input id="check-in" type="date" min={today} value={filters.checkIn} onChange={(event) => {
                  const checkIn = event.target.value;
                  setFilters((current) => ({ ...current, checkIn, checkOut: current.checkOut <= checkIn ? addDays(checkIn, 1) : current.checkOut }));
                }} />
              </div>
              <div className="search-divider" />
              <div className="search-field">
                <label htmlFor="check-out">CHECK OUT</label>
                <input id="check-out" type="date" min={addDays(filters.checkIn, 1)} value={filters.checkOut} onChange={(event) => setFilters((current) => ({ ...current, checkOut: event.target.value }))} />
              </div>
              <div className="search-divider" />
              <div className="search-field guests-field">
                <label htmlFor="guests">GUESTS</label>
                <select id="guests" value={filters.guests} onChange={(event) => setFilters((current) => ({ ...current, guests: event.target.value }))}>
                  {[1, 2, 3, 4, 5].map((guestCount) => <option key={guestCount} value={guestCount}>{guestCount} {guestCount === 1 ? "guest" : "guests"}</option>)}
                </select>
              </div>
              <button className="button button-dark search-button" onClick={() => document.getElementById("stays")?.scrollIntoView({ behavior: "smooth" })}><span aria-hidden="true">⌕</span> Find a stay</button>
            </section>

            <section className="stays-section content-width" id="stays">
              <div className="section-heading">
                <div>
                  <div className="eyebrow eyebrow-green"><span className="eyebrow-line" /> YOUR OWN LITTLE ESCAPE</div>
                  <h2>Stay somewhere <em>special.</em></h2>
                  <p className="section-subtitle">A few of our favorite corners of the woods.</p>
                </div>
                <label className="filter-select"><span className="sr-only">Filter by stay type</span>
                  <select value={roomType} onChange={(event) => setRoomType(event.target.value)}>
                    <option>All stays</option><option>Forest cabin</option><option>Mountain lodge</option><option>Garden cottage</option>
                  </select>
                </label>
              </div>
              <div className="results-note">{availableRooms.length} {availableRooms.length === 1 ? "stay" : "stays"} available · {nights} {nights === 1 ? "night" : "nights"} · {formatDate(filters.checkIn)} – {formatDate(filters.checkOut)}</div>
              {availableRooms.length ? (
                <div className="room-grid">
                  {availableRooms.map((room) => <RoomCard key={room.id} room={room} onBook={() => createBooking(room)} />)}
                </div>
              ) : (
                <div className="empty-state"><span className="empty-icon">⌂</span><h3>No stays for these dates</h3><p>Try different dates, fewer guests, or another kind of stay.</p></div>
              )}
            </section>
            <section className="promise-strip">
              <div className="promise-inner content-width">
                <div className="promise-intro"><span className="promise-leaf">✳</span><div><strong>Good for you.</strong><span>Gentler on the wild.</span></div></div>
                <p>Locally made comforts, thoughtful details, and room to reconnect with what matters.</p>
                <span className="promise-signature">Stay wild. Stay well.</span>
              </div>
            </section>
          </>
        )}

        {activePage === "my-stays" && user?.role === "guest" && (
          <MyStays bookings={myBookings} rooms={rooms} onCancel={cancelBooking} onExplore={() => setActivePage("explore")} />
        )}
        {activePage === "admin" && user?.role === "admin" && (
          <AdminDashboard bookings={bookings} rooms={rooms} onStatus={updateBookingStatus} onAddRoom={addRoom} onDeleteRoom={deleteRoom} />
        )}
      </main>

      <footer className="footer"><span className="footer-brand">the wild <strong>oasis</strong></span><span>Made for a slower kind of getaway.</span><span>© {new Date().getFullYear()} The Wild Oasis</span></footer>

      {authMode && <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={() => setAuthMode("")} onLogin={(nextUser) => {
        setUser(nextUser);
        setAuthMode("");
        setActivePage(nextUser.role === "admin" ? "admin" : "explore");
        setNotice(`Welcome${nextUser.name ? ` back, ${nextUser.name.split(" ")[0]}` : ""}!`);
        if (selectedRoom && nextUser.role === "guest") {
          const room = selectedRoom;
          setSelectedRoom(null);
          createBooking(room, nextUser);
        }
      }} onRegister={(newUser) => {
        setUsers((current) => [...current, newUser]);
        setUser(newUser);
        setAuthMode("");
        setActivePage("explore");
        setNotice(`Welcome to The Wild Oasis, ${newUser.name.split(" ")[0]}!`);
      }} users={users} />}
      {notice && <div className="toast" role="status"><span className="toast-check">✓</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}
    </div>
  );
}

function RoomCard({ room, onBook }) {
  return (
    <article className="room-card">
      <div className="room-image-wrap">
        <img className="room-image" src={room.image} alt={`${room.name} exterior`} />
        <span className="room-type">{room.type}</span>
        <button className="favorite-button" aria-label={`Save ${room.name} to favorites`} onClick={(event) => {
          event.currentTarget.classList.toggle("is-favorite");
          event.currentTarget.textContent = event.currentTarget.classList.contains("is-favorite") ? "♥" : "♡";
        }}>♡</button>
      </div>
      <div className="room-card-body">
        <div className="room-title-row"><h3>{room.name}</h3><span className="capacity">♧ {room.capacity} guests</span></div>
        <p className="room-description">{room.description}</p>
        <div className="feature-list">{room.features.slice(0, 3).map((feature) => <span key={feature}>{feature}</span>)}</div>
        <div className="room-card-footer">
          <div className="price"><strong>${Number(room.price).toLocaleString()}</strong><span> / night</span></div>
          <button className="button button-dark room-book-button" onClick={onBook}>Choose stay <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </article>
  );
}

function AuthModal({ mode, onModeChange, onClose, onLogin, onRegister, users }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  function submit(event) {
    event.preventDefault();
    setError("");
    const email = form.email.trim().toLowerCase();
    if (isRegister) {
      if (form.name.trim().length < 2) return setError("Please enter your full name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
      if (form.password.length < 6) return setError("Your password must be at least 6 characters.");
      if (users.some((account) => account.email.toLowerCase() === email) || email === ADMIN_EMAIL) return setError("An account with this email already exists.");
      onRegister({ name: form.name.trim(), email, password: form.password, role: "guest", avatar: defaultUser });
      return;
    }
    if (email === ADMIN_EMAIL && form.password === ADMIN_PASSWORD) {
      onLogin({ name: "Oasis Admin", email: ADMIN_EMAIL, role: "admin" });
      return;
    }
    const account = users.find((item) => item.email.toLowerCase() === email && item.password === form.password);
    if (!account) return setError("We couldn’t find an account with those details.");
    onLogin(account);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        <span className="modal-mark">W</span>
        <div className="eyebrow eyebrow-green centered"><span className="eyebrow-line" /> A WARM WELCOME <span className="eyebrow-line" /></div>
        <h2 id="auth-title">{isRegister ? "Make yourself at home." : "Welcome back."}</h2>
        <p className="modal-description">{isRegister ? "Create an account to find your next favorite place." : "Your next quiet escape is just around the corner."}</p>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <label>Your name<input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Jamie Parker" required /></label>}
          <label>Email address<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isRegister ? "At least 6 characters" : "Your password"} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" type="submit">{isRegister ? "Create my account" : "Log in"} <span aria-hidden="true">→</span></button>
        </form>
        {!isRegister && <div className="demo-access"><strong>Admin demo access</strong><span>admin@wildoasis.com · admin123</span></div>}
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New around here?"} <button type="button" onClick={() => { setError(""); onModeChange(isRegister ? "login" : "register"); }}>{isRegister ? "Log in" : "Create an account"}</button></p>
      </section>
    </div>
  );
}

function MyStays({ bookings, rooms, onCancel, onExplore }) {
  const [confirmId, setConfirmId] = useState("");
  return (
    <section className="dashboard-page content-width">
      <div className="dashboard-heading">
        <div><div className="eyebrow eyebrow-green"><span className="eyebrow-line" /> YOUR OASIS, YOUR WAY</div><h1>Your <em>stays.</em></h1><p>Every good getaway starts with a little something to look forward to.</p></div>
        <button className="button button-dark" onClick={onExplore}>Find another stay <span aria-hidden="true">→</span></button>
      </div>
      {bookings.length ? <div className="my-bookings-list">{bookings.map((booking) => {
        const room = rooms.find((item) => item.id === booking.roomId);
        return <article className="booking-card" key={booking.id}>
          <img src={room?.image || roomPhotos[0]} alt="" />
          <div className="booking-main"><span className={`status-pill status-${booking.status.toLowerCase().replace(" ", "-")}`}>{booking.status}</span><h3>{booking.roomName}</h3><p>{formatDate(booking.checkIn)} – {formatDate(booking.checkOut)} <span>·</span> {nightsBetween(booking.checkIn, booking.checkOut)} nights</p><p className="booking-detail">{booking.guests} {booking.guests === 1 ? "guest" : "guests"} · Confirmation {booking.id.slice(-6).toUpperCase()}</p></div>
          <div className="booking-price"><span>Total</span><strong>${Number(booking.total).toLocaleString()}</strong>{booking.status === "Confirmed" && <button className="text-button cancel-link" onClick={() => setConfirmId(booking.id)}>Cancel stay</button>}</div>
          {confirmId === booking.id && <div className="confirm-overlay"><div className="confirm-box"><h4>Cancel this stay?</h4><p>This reservation will be released for other guests.</p><div><button className="button button-outline button-small" onClick={() => setConfirmId("")}>Keep it</button><button className="button button-dark button-small" onClick={() => { onCancel(booking.id); setConfirmId(""); }}>Yes, cancel</button></div></div></div>}
        </article>;
      })}</div> : <div className="empty-state booking-empty"><span className="empty-icon">⌂</span><h3>No stays booked yet</h3><p>Your next favorite getaway is waiting to be found.</p><button className="button button-dark" onClick={onExplore}>Explore the stays <span aria-hidden="true">→</span></button></div>}
    </section>
  );
}

function AdminDashboard({ bookings, rooms, onStatus, onAddRoom, onDeleteRoom }) {
  const [showForm, setShowForm] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", type: "Forest cabin", capacity: 2, price: "", description: "" });
  const activeBookings = bookings.filter((booking) => booking.status !== "Cancelled");
  const revenue = activeBookings.reduce((total, booking) => total + Number(booking.total || 0), 0);

  function submitRoom(event) {
    event.preventDefault();
    if (Number(newRoom.price) <= 0 || Number(newRoom.capacity) < 1) return;
    onAddRoom({ ...newRoom, capacity: Number(newRoom.capacity), price: Number(newRoom.price), features: ["Thoughtful comforts", "Private retreat"] });
    setNewRoom({ name: "", type: "Forest cabin", capacity: 2, price: "", description: "" });
    setShowForm(false);
  }

  return (
    <section className="dashboard-page content-width admin-page">
      <div className="dashboard-heading">
        <div><div className="eyebrow eyebrow-green"><span className="eyebrow-line" /> THE BACK OFFICE</div><h1>Good morning, <em>admin.</em></h1><p>A little overview of what’s happening at the oasis.</p></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-label">ACTIVE RESERVATIONS</span><strong>{activeBookings.length}</strong><span className="stat-caption">Across all your stays</span></div>
        <div className="stat-card"><span className="stat-label">ROOMS & STAYS</span><strong>{rooms.length}</strong><span className="stat-caption">Places to unwind</span></div>
        <div className="stat-card"><span className="stat-label">BOOKED REVENUE</span><strong>${revenue.toLocaleString()}</strong><span className="stat-caption">From active reservations</span></div>
      </div>
      <div className="admin-section-heading"><div><h2>Reservations</h2><p>Keep an eye on upcoming guest stays.</p></div></div>
      <div className="admin-table-wrap">
        {bookings.length ? <table className="admin-table"><thead><tr><th>GUEST</th><th>STAY</th><th>DATES</th><th>GUESTS</th><th>TOTAL</th><th>STATUS</th><th>UPDATE</th></tr></thead><tbody>
          {bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.guestName}</strong><span className="table-subtext">{booking.email}</span></td><td>{booking.roomName}</td><td>{formatDate(booking.checkIn)}<span className="table-subtext">to {formatDate(booking.checkOut)}</span></td><td>{booking.guests}</td><td>${Number(booking.total).toLocaleString()}</td><td><span className={`status-pill status-${booking.status.toLowerCase().replace(" ", "-")}`}>{booking.status}</span></td><td><select aria-label={`Update status for ${booking.guestName}`} value={booking.status} onChange={(event) => onStatus(booking.id, event.target.value)}><option>Confirmed</option><option>Checked out</option><option>Cancelled</option></select></td></tr>)}
        </tbody></table> : <p className="table-empty">No reservations just yet. They’ll show up here when guests book.</p>}
      </div>
      <div className="admin-section-heading rooms-heading"><div><h2>Your stays</h2><p>Add a new place to make someone’s getaway.</p></div><button className="button button-dark" onClick={() => setShowForm((current) => !current)}>{showForm ? "Close form" : "+ Add a stay"}</button></div>
      {showForm && <form className="add-room-form" onSubmit={submitRoom}>
        <label>Stay name<input required value={newRoom.name} onChange={(event) => setNewRoom({ ...newRoom, name: event.target.value })} placeholder="The Mosswood" /></label>
        <label>Stay type<select value={newRoom.type} onChange={(event) => setNewRoom({ ...newRoom, type: event.target.value })}><option>Forest cabin</option><option>Mountain lodge</option><option>Garden cottage</option></select></label>
        <label>Guests<select value={newRoom.capacity} onChange={(event) => setNewRoom({ ...newRoom, capacity: event.target.value })}>{[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
        <label>Price per night ($)<input type="number" min="1" required value={newRoom.price} onChange={(event) => setNewRoom({ ...newRoom, price: event.target.value })} placeholder="200" /></label>
        <label className="room-description-field">A few words about it<input required value={newRoom.description} onChange={(event) => setNewRoom({ ...newRoom, description: event.target.value })} placeholder="A quiet cabin tucked among the pines." /></label>
        <button className="button button-dark" type="submit">Add to stays <span aria-hidden="true">→</span></button>
      </form>}
      <div className="manage-room-list">{rooms.map((room) => <div className="manage-room" key={room.id}><img src={room.image} alt="" /><div><strong>{room.name}</strong><span>{room.type} · Up to {room.capacity} · ${Number(room.price).toLocaleString()} / night</span></div><button className="text-button remove-room" onClick={() => onDeleteRoom(room.id)}>Remove</button></div>)}</div>
    </section>
  );
}

export default App;
