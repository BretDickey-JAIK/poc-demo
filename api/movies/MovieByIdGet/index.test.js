const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const {getJSON} = require("../../../helpers/readFile");

test("MovieByIdGet returns a single Movie object matching the _id", async() => {
    const movieDocument = getJSON(
        "../api/movies/_test/documents/movie-by-id-document.json"
    );

    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(movieDocument, "findOne");

    let req = {
        header: {},
        params: { id: "69efd1c1b2f8c7327f029faf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);

    // Response should be an object, not an array.
    expect(Array.isArray(body)).toBe(false);

    const movieResponse = getJSON(
        "../api/movies/_test/json-responses/movie-by-id-response.json"
    );

    // Remove _id from expected to match the received (mocked data without _id)
    delete movieResponse._id;

    expect(JSON.stringify(body)).toBe(JSON.stringify(movieResponse));
});

test("MovieByIdGet returns 404 when no movie is found", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    mockingoose(MovieModel).toReturn(null, "findOne");

    let req = {
        header: {},
        params: { id: "69efd1c1b2f8c7327f029999" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("MovieByIdGet returns 404 when the _id is not a valid ObjectId", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();

    let req = {
        header: {},
        params: { id: "not-a-valid-object-id" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("MovieByIdGet returns 400 when no _id is received", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();

    let req = {
        header: {},
        params: {},
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "An _id is required" });
});

test("MovieByIdGet returns 500 error when database is down", async() => {
    const MovieModel = require("../models/movie");
    mockingoose.resetAll();
    MovieModel.findById = jest.fn().mockRejectedValue(new Error("Database connection failed"));

    let req = {
        header: {},
        params: { id: "69efd1c1b2f8c7327f029faf" },
    };

    let res = makeMockRes();

    await func.inject({MovieModel})(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
