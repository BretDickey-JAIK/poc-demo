const func = require("./index");

const makeMockRes = require("../../../helpers/makeMockRes");
const mockingoose = require("mockingoose");
const { getJSON } = require("../../../helpers/readFile");

const MOVIE_DOCUMENT_PATH =
    "../api/movies/_test/documents/character-update-document.json";

const MOVIE_ID = "690b9436fb29d9d76b2a0dc2";
const CHARACTER_ID = "690b9436fb29d9d76b2a0dd5";

describe("CharacterNameByParamsPut", () => {
    beforeEach(() => {
        mockingoose.resetAll();
    });

    test("updates the character name and returns 204 with no body", async () => {
        const movieDocument = getJSON(MOVIE_DOCUMENT_PATH);

        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(movieDocument, "findOne");
        // Echo back the document being saved so the operation succeeds.
        mockingoose(MovieModel).toReturn((doc) => doc, "save");

        const req = {
            params: {
                movieId: MOVIE_ID,
                characterId: CHARACTER_ID,
                characterName: "Smeagol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test("returns 404 when no movie is found for the given id", async () => {
        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(null, "findOne");

        const req = {
            params: {
                movieId: MOVIE_ID,
                characterId: CHARACTER_ID,
                characterName: "Smeagol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: `Movie not found for id ${MOVIE_ID}`,
        });
    });

    test("returns 404 when no character is found for the given id", async () => {
        const movieDocument = getJSON(MOVIE_DOCUMENT_PATH);

        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(movieDocument, "findOne");

        const missingCharacterId = "690b9436fb29d9d76b2a0d99";

        const req = {
            params: {
                movieId: MOVIE_ID,
                characterId: missingCharacterId,
                characterName: "Smeagol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: `Character not found for id ${missingCharacterId}`,
        });
    });

    test("returns 406 when the character name is fewer than three characters", async () => {
        const movieDocument = getJSON(MOVIE_DOCUMENT_PATH);

        const MovieModel = require("../../movies/models/movie");
        mockingoose(MovieModel).toReturn(movieDocument, "findOne");

        const req = {
            params: {
                movieId: MOVIE_ID,
                characterId: CHARACTER_ID,
                characterName: "Ol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(406);
        expect(res.json).toHaveBeenCalledWith({
            error: "Character Name is not valid. It must be at least three characters.",
        });
    });

    test("returns 500 when the database errors", async () => {
        const MovieModel = require("../../movies/models/movie");
        MovieModel.findById = jest
            .fn()
            .mockRejectedValue(new Error("Database connection failed"));

        const req = {
            params: {
                movieId: MOVIE_ID,
                characterId: CHARACTER_ID,
                characterName: "Smeagol",
            },
        };

        const res = makeMockRes();

        await func.inject({ MovieModel })(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
});
