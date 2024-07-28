const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const cors = require("cors");

const io = socketIo(server, {
  cors: {
    origin: "https://socket-td-backend.onrender.com/",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

const PORT = process.env.PORT || 5000;

const users = new Set();
const games = new Map();
const gameIntervals = new Map();

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
    price: 35,
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
  castle: {
    name: "Castle",
    emoji: "🏰",
    price: 100,
    health: 500,
    maxHp: 500,
    spawnRate: 10000,
    unitType: "paladin",
  },
};

const unitTypes = {
  mage: { type: "mage", health: 10, maxHp: 10, damage: 2 },
  warrior: { type: "warrior", health: 15, maxHp: 15, damage: 3 },
  paladin: { type: "paladin", health: 35, maxHp: 35, damage: 6 },
};

app.post("/login", (req, res) => {
  const { username } = req.body;
  if (users.has(username)) {
    res.status(400).json({ error: "Username already exists" });
  } else {
    users.add(username);
    res.status(200).json({ message: "Login successful" });
  }
});

io.on("connection", (socket) => {
  // console.log("New client connected");

  socket.on("create_game", (username) => {
    const gameId = Math.random().toString(36).substring(7);
    games.set(gameId, {
      id: gameId,
      players: [{ username, gold: 0, goldPerSecond: 1 }],
      state: "waiting",
      grid: Array(256).fill(null),
      units: [],
      bases: {
        0: { hp: 300, maxHp: 300 },
        1: { hp: 300, maxHp: 300 },
      },
      gameOver: false,
    });
    socket.join(gameId);
    socket.emit("game_created", gameId);
    // console.log(`Game ${gameId} created by ${username}`);
  });

  socket.on("join_game", ({ username, gameId }) => {
    const game = games.get(gameId);
    if (game) {
      if (
        game.state !== "in_progress" &&
        !game.players.find((p) => p.username === username)
      ) {
        game.players.push({ username, gold: 0, goldPerSecond: 1 });
        socket.join(gameId);
        io.to(gameId).emit("game_update", game);
        // console.log(`${username} successfully joined game ${gameId}`);
        if (game.players.length === 2) {
          game.state = "starting";
          io.to(gameId).emit(
            "game_starting",
            game.players.map((p) => p.username)
          );
          setTimeout(() => {
            game.state = "in_progress";
            io.to(gameId).emit("game_started", gameId);
            startGameIntervals(gameId);
          }, 5000);
        }
      } else if (game.players.find((p) => p.username === username)) {
        socket.join(gameId);
        socket.emit("game_update", game);
        // console.log(`${username} rejoined game ${gameId}`);
      } else {
        socket.emit("game_join_error", "Game is in progress or full");
        // console.log(`${username} failed to join game ${gameId}`);
      }
    } else {
      socket.emit("game_join_error", "Game not found");
      // console.log(`Failed to join game ${gameId}: Game not found`);
    }
  });

  socket.on("place_building", ({ gameId, index, buildingType, username }) => {
    const game = games.get(gameId);
    if (game && !game.gameOver) {
      const playerIndex = game.players.findIndex(
        (p) => p.username === username
      );
      if (playerIndex === -1) return;

      const column = index % 16;
      const isValidPlacement =
        (playerIndex === 0 && column < 8) || (playerIndex === 1 && column >= 8);

      const building = buildings[buildingType];

      if (
        isValidPlacement &&
        !game.grid[index] &&
        game.players[playerIndex].gold >= building.price
      ) {
        game.players[playerIndex].gold -= building.price;
        game.grid[index] = { ...building, hp: building.health, playerIndex };

        if (building.spawnRate) {
          const intervalId = setInterval(() => {
            if (game.grid[index]) {
              spawnUnit(game, index, building, playerIndex);
            } else {
              clearInterval(intervalId);
            }
          }, building.spawnRate);
          gameIntervals.set(`${gameId}-${index}`, intervalId);
        }

        if (building.repairRate) {
          const intervalId = setInterval(() => {
            const baseIndex = playerIndex;
            const base = game.bases[baseIndex];
            if (base.hp < base.maxHp) {
              base.hp = Math.min(base.maxHp, base.hp + building.repairRate);
              io.to(game.id).emit("game_update", game);
            }
            if (!game.grid[index]) {
              clearInterval(intervalId);
            }
          }, 1000);
          gameIntervals.set(`${gameId}-${index}`, intervalId);
        }

        if (building.goldPerSecond) {
          game.players[playerIndex].goldPerSecond += building.goldPerSecond;
        }
        io.to(gameId).emit("game_update", game);
      }
    }
  });

  socket.on("disconnect", () => {
    // console.log("Client disconnected");
  });
});

function updateGoldPerSecondOnDestroy(game, buildingIndex) {
  const building = game.grid[buildingIndex];
  if (building && building.goldPerSecond) {
    game.players[building.playerIndex].goldPerSecond -= building.goldPerSecond;
  }
}

function spawnUnit(game, buildingIndex, building, playerIndex) {
  const unitType = unitTypes[building.unitType];
  const unit = {
    ...unitType,
    position: buildingIndex,
    playerIndex,
    attackCooldown: 0,
  };
  game.units.push(unit);
  io.to(game.id).emit("game_update", game);
}

function moveUnits(game) {
  if (game && game.units && !game.gameOver) {
    const unitsToRemove = [];

    game.units.forEach((unit) => {
      const currentColumn = unit.position % 16;
      const direction = unit.playerIndex === 0 ? 1 : -1;
      const newPosition = unit.position + direction;
      const newColumn = newPosition % 16;

      if (newPosition >= 0 && newPosition < 256) {
        const targetBuilding = game.grid[newPosition];
        const targetUnits = game.units.filter(
          (u) =>
            u.position === newPosition && u.playerIndex !== unit.playerIndex
        );

        let canMove = true;

        if (typeof unit.health !== "number") {
          unit.health = unit.maxHp || 10;
          // console.log(`Initialized unit health: ${unit.health}`);
        }

        if (targetBuilding && targetBuilding.playerIndex !== unit.playerIndex) {
          targetBuilding.hp = targetBuilding.hp ?? targetBuilding.maxHp;
          targetBuilding.hp -= unit.damage;
          // console.log(
          //   `Unit at ${unit.position} attacked building at ${newPosition}. New HP: ${targetBuilding.hp}`
          // );
          if (targetBuilding.hp <= 0) {
            updateGoldPerSecondOnDestroy(game, newPosition);
            game.grid[newPosition] = null;
            // console.log(`Building at ${newPosition} destroyed`);
          }
          canMove = false;
        } else if (targetUnits.length > 0) {
          targetUnits.forEach((targetUnit) => {
            targetUnit.health = targetUnit.health ?? targetUnit.maxHp;
            targetUnit.health -= unit.damage;
            // console.log(
            //   `Unit at ${unit.position} attacked enemy unit at ${newPosition}. New HP: ${targetUnit.health}`
            // );
            if (targetUnit.health <= 0) {
              unitsToRemove.push(targetUnit);
              // console.log(`Unit at ${newPosition} destroyed`);
            }
          });
          canMove = false;
        } else if (
          (unit.playerIndex === 0 && newColumn === 0) ||
          (unit.playerIndex === 1 && newColumn === 15)
        ) {
          const baseIndex = unit.playerIndex === 0 ? 1 : 0;
          game.bases[baseIndex].hp =
            game.bases[baseIndex].hp ?? game.bases[baseIndex].maxHp;
          game.bases[baseIndex].hp -= unit.damage;
          // console.log(
          //   `Unit at ${unit.position} attacked enemy base. New HP: ${game.bases[baseIndex].hp}`
          // );
          if (game.bases[baseIndex].hp <= 0) {
            game.gameOver = true;
            io.to(game.id).emit("game_over", unit.playerIndex);
            clearGameIntervals(game.id);
          }
          canMove = false;
        }

        if (
          canMove &&
          ((unit.playerIndex === 0 && currentColumn < 15) ||
            (unit.playerIndex === 1 && currentColumn > 0))
        ) {
          unit.position = newPosition;
          // console.log(`Unit moved from ${unit.position} to ${newPosition}`);
        }
      }
    });

    game.units = game.units.filter((unit) => !unitsToRemove.includes(unit));

    games.set(game.id, game);

    io.to(game.id).emit("game_update", game);
  }
}

function startGameIntervals(gameId) {
  const game = games.get(gameId);
  if (!game) return;

  const intervalId = setInterval(() => {
    if (game.state === "in_progress") {
      moveUnits(game);
      updateGold(game);
    }
  }, 1000);

  gameIntervals.set(gameId, intervalId);
}

function clearGameIntervals(gameId) {
  const intervalId = gameIntervals.get(gameId);
  if (intervalId) {
    clearInterval(intervalId);
    gameIntervals.delete(gameId);
  }

  for (let [key, intervalId] of gameIntervals.entries()) {
    if (key.startsWith(`${gameId}-`)) {
      clearInterval(intervalId);
      gameIntervals.delete(key);
    }
  }
}

function updateGold(game) {
  game.players.forEach((player) => {
    player.gold += player.goldPerSecond;
  });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
