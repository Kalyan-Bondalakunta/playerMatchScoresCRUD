const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let dbConnectionObj = null;

const initializeDbAndServer = async () => {
  try {
    dbConnectionObj = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjToResponseObj = (eachObj) => {
  return {
    playerId: eachObj.player_id,
    playerName: eachObj.player_name,
  };
};

const convertMatchDbObjToResponseObj = (eachObj) => {
  return {
    matchId: eachObj.match_id,
    match: eachObj.match,
    year: eachObj.year,
  };
};

//API - 1

app.get("/players/", async (request, response) => {
  let getPlayersQuery = `
        SELECT
            *
        FROM
            player_details;
    `;

  let getPlayers = await dbConnectionObj.all(getPlayersQuery);
  response.send(
    getPlayers.map((eachPlayer) => convertPlayerDbObjToResponseObj(eachPlayer))
  );
});

//API - 2

app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let getPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};
    `;

  let getPlayer = await dbConnectionObj.get(getPlayerQuery);
  response.send(convertPlayerDbObjToResponseObj(getPlayer));
});

//API - 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;

  await dbConnectionObj.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API - 4

app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let getMatchQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;

  let getMatch = await dbConnectionObj.get(getMatchQuery);
  response.send(convertMatchDbObjToResponseObj(getMatch));
});

//API - 5

app.get("/players/:playerId/matches", async (request, response) => {
  let { playerId } = request.params;
  let getPlayerMatchQuery = `
        SELECT
            match_details.match_id,
            match_details.match,
            match_details.year
        FROM
            match_details
            INNER JOIN
            player_match_score
                ON match_details.match_id = player_match_score.match_id
        WHERE
            player_match_score.player_id = ${playerId};
    `;

  let getPlayerMatch = await dbConnectionObj.all(getPlayerMatchQuery);
  response.send(
    getPlayerMatch.map((eachMatch) => convertMatchDbObjToResponseObj(eachMatch))
  );
});

//API - 6

app.get("/matches/:matchId/players", async (request, response) => {
  let { matchId } = request.params;
  let getMatchPlayerQuery = `
        SELECT
            player_details.player_id,
            player_details.player_name
        FROM
            ( match_details
            INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id) AS T
            INNER JOIN player_details ON T.player_id = player_details.player_id
        WHERE
            match_details.match_id = ${matchId};
    `;

  let getMatchPlayer = await dbConnectionObj.all(getMatchPlayerQuery);
  response.send(
    getMatchPlayer.map((eachPlayer) =>
      convertPlayerDbObjToResponseObj(eachPlayer)
    )
  );
});

//API - 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await dbConnectionObj.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
