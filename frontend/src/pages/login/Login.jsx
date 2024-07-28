import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import useStore from "../../context/mainStore";
import axios from "axios";

const Login = () => {
  const { setUsername, setIsLoggedIn } = useStore();
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    const username = event.target[0].value;
    try {
      await axios.post("http://localhost:5000/login", { username });
      setUsername(username);
      setIsLoggedIn(true);
      nav("/lobby");
    } catch (err) {
      setError("Username already exists or server error");
    }
  }

  return (
    <div className="login">
      <Form
        onSubmit={handleSubmit}
        className="d-flex flex-column justify-content-center align-items-center mt-5"
      >
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" placeholder="Enter username" />
          <Form.Text className="text-muted">
            Enter username you want to play Tower defense
          </Form.Text>
        </Form.Group>
        {error && <p className="text-danger">{error}</p>}
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
};

export default Login;
