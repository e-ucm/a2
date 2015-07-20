'use strict';

var TokenStorage = function (backend) {

    /**
     * A custom function that will ensure that the provided token inside the
     * Authentication header of the request (Authorization: Bearer [token])
     * is available inside the storage.
     *
     * If the token isn't available next(Error(...)) will be invoked.
     *
     * If the token is available its associated data
     * {assigned by calling save(token, data, ...)} will be added to the 'req.user' attribute.
     *
     * @param req - Must have an Authentication header following the convention (Authorization: Bearer [token]).
     * @param res
     * @param next
     */
    this.middleware = function (req, res, next) {
        backend.middleware(req, res, next);
    };

    /**
     * Saves the token as a key and the data associated.
     *
     * @param token - A String used as a key.
     * @param data - An object associated to the token. Will be restored and added to the
     *               'request.user' parameter inside the middleware.
     * @param expirationInSec - A Number representing the remaining lifetime of this token in seconds.
     * @param callback - A function with signature function(err, token) to be invoked when the token is saved.
     *                   err (Any) - The error that occurred.
     *                   token (String) - The token saved.
     */
    this.save = function (token, data, expirationInSec, callback) {
        backend.save(token, data, expirationInSec, callback);
    };

    /**
     * Expires a token from the storage and all its associated data.
     *
     * @param req - Must have an Authentication header following the convention (Authorization: Bearer [token]).
     *              The token will by used as a key to find the data that will be removed.
     */
    this.delete = function (req) {
        backend.delete(req);
    };

    /**
     * Removes all the data (tokens) from the current database.
     *
     */
    this.clean = function () {
        backend.clean();
    };
};

exports = module.exports = TokenStorage;