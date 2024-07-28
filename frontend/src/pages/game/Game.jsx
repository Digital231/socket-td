import "./game.css";
import { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import ResourceBar from "../../components/resourcesBar/ResourceBar";
import ProgressBar from "react-bootstrap/ProgressBar";
import io from "socket.io-client";
import useStore from "../../context/mainStore";

const socket = io("http://localhost:5000");

const Game = () => {
  const { username, gameId, setGold, setGoldPerSecond } = useStore((state) => ({
    username: state.username,
    gameId: state.gameId,
    gold: state.gold,
    setGold: state.setGold,
    goldPerSecond: state.goldPerSecond,
    setGoldPerSecond: state.setGoldPerSecond,
  }));
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [grid, setGrid] = useState(Array(256).fill(null));
  const [units, setUnits] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [bases, setBases] = useState({
    0: { hp: 300, maxHp: 300 },
    1: { hp: 300, maxHp: 300 },
  });
  const [modalContent, setModalContent] = useState("");
  const [gameTime, setGameTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    socket.emit("join_game", { username: username, gameId });

    socket.on("game_update", (data) => {
      if (!gameOver) {
        setGrid(data.grid);
        setUnits(data.units);
        setBases(data.bases);
        const index = data.players.findIndex((p) => p.username === username);
        setPlayerIndex(index);
        setGold(data.players[index].gold);
        setGoldPerSecond(data.players[index].goldPerSecond);
      }
    });

    socket.on("game_started", (gameId) => {
      // console.log("Game started with ID:", gameId);
    });

    socket.on("game_over", (winningPlayerIndex) => {
      const winner = winningPlayerIndex === playerIndex ? "You" : "Opponent";
      const minutes = Math.floor(gameTime / 60);
      const seconds = gameTime % 60;
      setShowModal(true);
      setModalContent(
        `${winner} won in ${minutes}:${seconds.toString().padStart(2, "0")}!`
      );
      setGameOver(true);
    });

    return () => {
      socket.off("game_update");
      socket.off("game_started");
      socket.off("game_over");
    };
  }, [
    gameId,
    username,
    playerIndex,
    gameTime,
    gameOver,
    setGold,
    setGoldPerSecond,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCellClick = (index) => {
    const column = index % 16;
    const isValidPlacement =
      (playerIndex === 0 && column < 8) || (playerIndex === 1 && column >= 8);
    if (isValidPlacement && !grid[index]) {
      setSelectedCell(index);
      setShowModal(true);
    }
  };

  const handleBuildingSelect = (buildingType) => {
    socket.emit("place_building", {
      gameId,
      index: selectedCell,
      buildingType,
      username,
    });
    setShowModal(false);
  };

  const renderHPBar = (currentHP, maxHP, size = "normal", playerIndex) => {
    const percentage = (currentHP / maxHP) * 100;
    const variant = playerIndex === 0 ? "info" : "warning";
    const barWidth =
      size === "large" ? "100px" : size === "small" ? "30px" : "40px";
    const barHeight =
      size === "large" ? "12px" : size === "small" ? "4px" : "8px";

    return (
      <ProgressBar
        now={percentage}
        variant={variant}
        style={{
          width: barWidth,
          height: barHeight,
          position: "absolute",
          bottom: size === "large" ? "-15px" : "-3px",
          borderRadius: "2px",
        }}
      />
    );
  };
  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < 256; i++) {
      const column = i % 16;
      const building = grid[i];
      const base = Object.values(bases).find((b) => b.position === i);

      cells.push(
        <div
          key={i}
          onClick={() => handleCellClick(i)}
          style={{
            width: "40px",
            height: "40px",
            border: `1px solid ${column < 8 ? "#a0c4ff" : "#ffd6a0"}`,
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "16px",
            position: "relative",
            backgroundColor: column < 8 ? "#e6f3ff" : "#fff0e6",
          }}
        >
          {building && (
            <>
              {building.emoji}
              {renderHPBar(
                building.hp,
                building.maxHp,
                "normal",
                building.playerIndex
              )}
            </>
          )}
          {base && (
            <>
              <img
                src={
                  base.playerIndex === 0 ? "/DemonGate.png" : "/Way_Gate.png"
                }
                alt="Base"
                style={{ width: "100%", height: "100%" }}
              />
              {renderHPBar(base.hp, base.maxHp, "normal", base.playerIndex)}
            </>
          )}
          {units
            .filter((unit) => unit.position === i)
            .map((unit, index) => (
              <div
                key={`unit-${index}`}
                style={{
                  position: "absolute",
                  fontSize: "10px",
                }}
              >
                {unit.type === "mage" ? "🧙‍♂️" : "⚔️"}
                {renderHPBar(
                  unit.health,
                  unit.maxHp,
                  "small",
                  unit.playerIndex
                )}
              </div>
            ))}
        </div>
      );
    }
    return cells;
  };
  return (
    <div>
      <ResourceBar />
      <h2 className="text-center">Welcome to Tower Defense Game {gameId}</h2>
      <div className="gameDiv d-flex justify-content-between align-items-center">
        <div className="playerSide position-relative">
          <img
            style={{ width: "110px", height: "110px" }}
            src="/DemonGate.png"
            alt=""
          />
          {playerIndex !== null && (
            <div style={{ position: "absolute", bottom: "-15px", left: "5px" }}>
              {renderHPBar(
                bases[playerIndex].hp,
                bases[playerIndex].maxHp,
                "large",
                playerIndex
              )}
            </div>
          )}
        </div>
        <div className="gameDiv d-flex justify-content-center align-items-center">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(16, 1fr)`,
              gap: "1px",
              border: "2px solid #000",
            }}
          >
            {renderGrid()}
          </div>
        </div>
        <div className="enemySide position-relative">
          <img
            className="me-2"
            style={{ width: "100px", height: "100px" }}
            src="/Way_Gate.png"
            alt=""
          />
          {playerIndex !== null && (
            <div style={{ position: "absolute", bottom: "-15px", left: "0px" }}>
              {renderHPBar(
                bases[1 - playerIndex].hp,
                bases[1 - playerIndex].maxHp,
                "large",
                1 - playerIndex
              )}
            </div>
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{modalContent || "Choose a building"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!modalContent &&
            Object.keys(buildings).map((buildingType, index) => (
              <Button
                key={index}
                variant="outline-primary"
                className="m-2"
                onClick={() => handleBuildingSelect(buildingType)}
              >
                {buildings[buildingType].emoji} {buildings[buildingType].name} -{" "}
                {buildings[buildingType].price} gold
              </Button>
            ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Game;

const buildings = {
  mageTower: {
    name: "Mage Tower",
    emoji: "🧙",
    price: 25,
    health: 10,
    maxHp: 10,
    spawnRate: 5000,
    unitType: "mage",
  },
  barracks: {
    name: "Barracks",
    emoji: "⚔️",
    price: 15,
    health: 10,
    maxHp: 10,
    spawnRate: 7000,
    unitType: "warrior",
  },
  defenseWall: {
    name: "Defense Wall",
    emoji: "🧱",
    price: 10,
    health: 350,
    maxHp: 350,
  },
  farm: {
    name: "Farm",
    emoji: "🌾",
    price: 15,
    health: 100,
    maxHp: 100,
    goldPerSecond: 1,
  },
  repairStation: {
    name: "Repair Station",
    emoji: "🔧",
    price: 25,
    health: 50,
    maxHp: 50,
    repairRate: 1,
  },
};
