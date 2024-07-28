import "./toolbar.css";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import useStore from "../../context/mainStore";
import { useNavigate } from "react-router-dom";

const Toolbar = () => {
  const { username, setUsername, setIsLoggedIn } = useStore();
  const nav = useNavigate();

  function handleLogout() {
    setUsername(null);
    setIsLoggedIn(false);
    nav("/");
  }

  return (
    <div className="toolbar">
      <Navbar className="bg-success">
        <Container>
          <Navbar.Brand style={{ userSelect: "none" }}>
            Tower <span style={{ color: "red" }}>Defense</span>
          </Navbar.Brand>
          <Navbar.Toggle />

          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text style={{ userSelect: "none" }}>
              Signed in as:{" "}
              <span style={{ fontWeight: "bold" }}>
                {username ? username : "Guest"}
              </span>
            </Navbar.Text>
            {username ? (
              <Nav.Link className="ms-3" onClick={handleLogout}>
                Logout
              </Nav.Link>
            ) : (
              ""
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default Toolbar;
