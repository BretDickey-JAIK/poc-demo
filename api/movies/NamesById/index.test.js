const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("NamesById returns the movie, character name and race for a valid movie id and character name", async() => {
    const movieDocument = getJSON(
        "../api/movies/_test/documents/names-by-id-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        params: {
            movieId: "69efd1c1b2f8c7327f029faf",
            characterName: "aragorn",
        },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);

    const expectedResponse = getJSON(
        "../api/movies/_test/json-responses/names-by-id-response.json"
    );

    expect(body).toEqual(expectedResponse);
});

test("NamesById matches the character name case-insensitively", async() => {
    const movieDocument = getJSON(
        "../api/movies/_test/documents/names-by-id-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        params: {
            movieId: "69efd1c1b2f8c7327f029faf",
            characterName: "ARAGORN",
        },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).toEqual({
        movie: "The Lord of the Rings: The Return of the King",
        name: "Aragorn",
        race: "Man",
    });
});

test("NamesById returns 404 with 'No movie found' when the movie id does not exist", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(null, "findOne");

    let req = {
        params: {
            movieId: "000000000000000000000000",
            characterName: "aragorn",
        },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("NamesById returns 404 with 'No character found' when the character is not in the movie", async() => {
    const movieDocument = getJSON(
        "../api/movies/_test/documents/names-by-id-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        params: {
            movieId: "69efd1c1b2f8c7327f029faf",
            characterName: "Gimli",
        },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No character found" });
});

test("NamesById returns 500 error when the database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.findById = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        params: {
            movieId: "69efd1c1b2f8c7327f029faf",
            characterName: "aragorn",
        },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
