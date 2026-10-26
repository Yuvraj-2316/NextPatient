// Express 4 does not catch errors thrown inside async functions.
// Wrapping a controller with this sends any error to the error handler
// instead of crashing the request, so controllers don't need try/catch everywhere.
function asyncHandler(controllerFunction) {
    return function (req, res, next) {
        Promise.resolve(controllerFunction(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;