import { useState, useEffect } from "react";
import {
  Button,
  Form,
  ListGroup,
  Container,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import useStore from "../../context/mainStore";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

const GameLobby = () => {
  const { username, gameId, setGameId } = useStore((state) => ({
    username: state.username,
    gameId: state.gameId,
    setGameId: state.setGameId,
  }));
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");
  const [inputGameId, setInputGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("game_created", (gameId) => {
      // console.log("Game created with ID:", gameId);
      setGameId(gameId);
      setInputGameId(gameId);
      navigate(`/game/${gameId}`);
    });

    socket.on("waiting_for_opponent", () => {
      // console.log("Waiting for an opponent to join...");
    });

    socket.on("game_starting", (players) => {
      // console.log(`Game starting! Players: ${players.join(", ")}`);
    });

    socket.on("game_started", (gameId) => {
      // console.log("Game started, navigating to game screen");
      setGameId(gameId);
      navigate(`/game/${gameId}`);
    });

    socket.on("game_join_error", (message) => {
      // console.error("Error joining game:", message);
      setError(message);
      setLoading(false);
    });

    return () => {
      socket.off("game_created");
      socket.off("waiting_for_opponent");
      socket.off("game_starting");
      socket.off("game_started");
      socket.off("game_join_error");
    };
  }, [navigate, setGameId]);

  const createGame = () => {
    setLoading(true);
    socket.emit("create_game", username);
  };

  const joinGame = (id) => {
    setLoading(true);
    socket.emit("join_game", { username, gameId: id });
  };

  return (
    <Container className="game-lobby d-flex flex-column justify-content-center align-items-center">
      <h2 className="text-center">Game Lobby</h2>
      <Row className="w-100">
        <Col md={6} className="d-flex flex-column align-items-center">
          <Button onClick={createGame} disabled={loading} className="mb-3">
            {loading && !gameId ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : null}
            Create New Game
          </Button>
          {gameId && <p>Your game ID: {gameId}</p>}
        </Col>
        <Col md={6} className="d-flex flex-column align-items-center">
          <Form.Control
            className="mt-3 mb-3"
            type="text"
            placeholder="Enter game ID to join"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            disabled={loading}
          />
          <Button
            onClick={() => joinGame(inputGameId)}
            disabled={loading || !inputGameId}
          >
            {loading && inputGameId ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : null}
            Join Game
          </Button>
        </Col>
      </Row>
      {error && <p className="text-danger">{error}</p>}
      <ListGroup className="w-100 mt-3">
        {games.map((game) => (
          <ListGroup.Item
            key={game.id}
            className="d-flex justify-content-between align-items-center"
          >
            <span>
              Game {game.id} - Players: {game.players.join(", ")}
            </span>
            <Button onClick={() => joinGame(game.id)} disabled={loading}>
              Join
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Container>
  );
};

export default GameLobby;
