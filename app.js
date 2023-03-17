const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const dbPath = (__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Starts at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializerDbAndServer();

const convertObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertObjectToMatchObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertObjectToPlayerObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * FROM player_details; `;
  const players = await db.all(getPlayerQuery);
  response.send(
    players.map((eachPlayer) => convertObjectToResponseObject(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(playerQuery);
  response.send(convertObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateQuery = `
    UPDATE player_details 
    SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updateQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(matchDetailsQuery);
  response.send(convertObjectToMatchObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchesQuery = `
  SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const matchDetails = await db.all(matchesQuery);
  response.send(
    matchDetails.map((eachPlayer) => convertObjectToMatchObject(eachPlayer))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id = ${matchId};`;
  const playerDetails = await db.all(playerQuery);
  response.send(
    playerDetails.map((eachPlayer) => convertObjectToPlayerObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const score = await db.get(getPlayerScored);
  response.send(score);
});
module.exports = app;
