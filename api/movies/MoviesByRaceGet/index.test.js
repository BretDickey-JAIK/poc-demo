const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("MoviesByRaceGet returns _id, title, releaseYear and matching characters", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-race-dwarf-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { race: "dwarf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);

    const movieResponse = getJSON(
        "../api/movies/_test/json-responses/movies-by-race-dwarf-response.json"
    );

    // Remove _id from expected to match the received (mocked data without _id)
    movieResponse.forEach(movie => delete movie._id);

    expect(JSON.stringify(body)).toBe(JSON.stringify(movieResponse));
});

test("MoviesByRaceGet only includes characters whose race matches", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-race-dwarf-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { race: "Dwarf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    body.forEach(movie => {
        expect(Object.keys(movie).sort()).toEqual(["_id", "characters", "releaseYear", "title"]);
        expect(movie.characters.length).toBeGreaterThan(0);
        movie.characters.forEach(character => {
            expect(character.race.toLowerCase()).toBe("dwarf");
        });
    });
});

test("MoviesByRaceGet returns movies sorted by releaseYear ascending", async() => {
    const movieDocuments = getJSON(
        "../api/movies/_test/documents/movies-by-race-dwarf-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocuments, "find");

    let req = {
        params: { race: "dwarf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    for (let i = 1; i < body.length; i++) {
        expect(body[i].releaseYear).toBeGreaterThanOrEqual(body[i - 1].releaseYear);
    }
});

test("MoviesByRaceGet returns 400 when no race is provided", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();

    let req = {
        params: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "A race is required" });
});

test("MoviesByRaceGet returns 404 when no movie with the race is found", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn([], "find");

    let req = {
        params: { race: "oompa loompa" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
        error: "No movie(s) with characters of the oompa loompa race were found",
    });
});

test("MoviesByRaceGet returns 500 error when database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.find = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        params: { race: "Dwarf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
