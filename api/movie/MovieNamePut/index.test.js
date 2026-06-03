const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");

// A valid Mongo ObjectId used across the happy-path tests.
const VALID_ID = "69efd1c1b2f8c7327f029faf";

// Builds a fake movie document that exposes a `save` method. This keeps the
// unit tests independent of a live database connection.
function makeMovieDoc() {
    return {
        _id: VALID_ID,
        name: "Old Movie Name",
        releaseYear: 2001,
        characters: [],
        save: jest.fn().mockResolvedValue(true),
    };
}

// Builds a fake Movie model whose `findById` resolves to the supplied document
// (or null to simulate a movie that does not exist).
function makeMovieModel(movieDoc) {
    return {
        findById: jest.fn().mockResolvedValue(movieDoc),
    };
}

test("MovieNamePut updates the movie name and returns 204 with no JSON", async () => {
    const movieDoc = makeMovieDoc();
    const MovieModel = makeMovieModel(movieDoc);

    let req = {
        body: {
            movieId: VALID_ID,
            movieName: "The Fellowship of the Ring",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(MovieModel.findById).toHaveBeenCalledWith(VALID_ID);
    expect(movieDoc.name).toBe("The Fellowship of the Ring");
    expect(movieDoc.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
});

test("MovieNamePut trims the movie name before saving", async () => {
    const movieDoc = makeMovieDoc();
    const MovieModel = makeMovieModel(movieDoc);

    let req = {
        body: {
            movieId: VALID_ID,
            movieName: "  The Two Towers  ",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(movieDoc.name).toBe("The Two Towers");
    expect(res.status).toHaveBeenCalledWith(204);
});

test("MovieNamePut returns 404 when no movie matches the movieId", async () => {
    const MovieModel = makeMovieModel(null);

    let req = {
        body: {
            movieId: "69efd1c1b2f8c7327f029999",
            movieName: "The Return of the King",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("MovieNamePut returns 404 when the movieId is not a valid ObjectId", async () => {
    const MovieModel = makeMovieModel(makeMovieDoc());

    let req = {
        body: {
            movieId: "not-a-valid-id",
            movieName: "The Hobbit",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(MovieModel.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("MovieNamePut returns 404 when the movieId is missing", async () => {
    const MovieModel = makeMovieModel(makeMovieDoc());

    let req = {
        body: {
            movieName: "The Hobbit",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie found" });
});

test("MovieNamePut returns 406 when the movieName is missing", async () => {
    const MovieModel = makeMovieModel(makeMovieDoc());

    let req = {
        body: {
            movieId: VALID_ID,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({
        error: "Movie Name is not valid. It must be at least three characters.",
    });
});

test("MovieNamePut returns 406 when the movieName has fewer than three characters", async () => {
    const MovieModel = makeMovieModel(makeMovieDoc());

    let req = {
        body: {
            movieId: VALID_ID,
            movieName: "It",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({
        error: "Movie Name is not valid. It must be at least three characters.",
    });
});

test("MovieNamePut returns 406 when the movieName is only whitespace", async () => {
    const MovieModel = makeMovieModel(makeMovieDoc());

    let req = {
        body: {
            movieId: VALID_ID,
            movieName: "   ",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({
        error: "Movie Name is not valid. It must be at least three characters.",
    });
});

test("MovieNamePut returns 500 when the database errors", async () => {
    const MovieModel = {
        findById: jest.fn().mockRejectedValue(new Error("Database connection failed")),
    };

    let req = {
        body: {
            movieId: VALID_ID,
            movieName: "The Silmarillion",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
