import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDash from "./pages/AdminDash";
import Profile from "./pages/Profile";
import UserDash from "./pages/UserDash";

function App() {

const [currentPage, setCurrentPage] = useState("login");

const [adminUser, setAdminUser] = useState(null);

  return (
  <>

    {currentPage === "login" && (
      <Login
        onNavigate={setCurrentPage}
        onLogin={setAdminUser}
      />
    )}

    {currentPage === "register" && (
      <Register onNavigate={setCurrentPage} />
    )}

    {currentPage === "admin" && (
      <AdminDash
      adminUser={adminUser}
      onNavigate={(page) => {
        if (page === "login") {
          setAdminUser(null);
        }
        setCurrentPage(page);
      }}
      />
    )}

    {currentPage === "profile" && (
      <Profile
        user={adminUser}
        onNavigate={setCurrentPage}
      />
    )}

    {currentPage === "user" && (
        <UserDash
            user={adminUser}
            onLogout={() => {
                setAdminUser(null);
                setCurrentPage("login");
            }}
        />
    )}

  </>
  );

}

export default App;