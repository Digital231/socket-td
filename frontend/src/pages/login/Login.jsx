import "./login.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import useStore from "../../context/mainStore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { setUsername, setIsLoggedIn } = useStore();
  const nav = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    setUsername(event.target[0].value);
    setIsLoggedIn(true);
    nav("/game");
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

        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
};

export default Login;
