const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");

// Builds a fake Movie model whose instances expose a `save` method.
// This keeps the unit tests independent of a live database connection.
function makeMovieModel(saveImpl) {
    function MovieModel(data) {
        Object.assign(this, data);
        this.save = saveImpl || jest.fn().mockResolvedValue(data);
    }
    return MovieModel;
}

test("MovieAddPost adds a movie with no characters and returns 200", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "The Lord of the Rings: The War of the Rohirrim",
            releaseYear: 2024,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const body = res.json.mock.calls[0][0];

    expect(body.name).toBe("The Lord of the Rings: The War of the Rohirrim");
    expect(body.releaseYear).toBe(2024);
    expect(body.characters).toEqual([]);
    expect(body._id).toBeDefined();
});

test("MovieAddPost trims the movie name before saving", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "  The Two Towers  ",
            releaseYear: 2002,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].name).toBe("The Two Towers");
});

test("MovieAddPost returns 406 when movie name is missing", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            releaseYear: 2024,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie name found" });
});

test("MovieAddPost returns 406 when movie name is an empty string", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "   ",
            releaseYear: 2024,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "No movie name found" });
});

test("MovieAddPost returns 406 when movie name has three characters or less", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "Cat",
            releaseYear: 2024,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid movie name" });
});

test("MovieAddPost returns 406 when release year is below 1990", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "An Old Movie",
            releaseYear: 1989,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid release year" });
});

test("MovieAddPost returns 406 when release year is in the future", async () => {
    const MovieModel = makeMovieModel();

    const futureYear = new Date().getFullYear() + 1;

    let req = {
        body: {
            movieName: "A Future Movie",
            releaseYear: futureYear,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid release year" });
});

test("MovieAddPost returns 406 when release year is not a number", async () => {
    const MovieModel = makeMovieModel();

    let req = {
        body: {
            movieName: "Not A Year Movie",
            releaseYear: "not-a-year",
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(406);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid release year" });
});

test("MovieAddPost returns 500 when the database save fails", async () => {
    const MovieModel = makeMovieModel(
        jest.fn().mockRejectedValue(new Error("Database connection failed"))
    );

    let req = {
        body: {
            movieName: "The Return of the King",
            releaseYear: 2003,
        },
    };

    let res = makeMockRes();

    await func.inject({ MovieModel })(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
});
